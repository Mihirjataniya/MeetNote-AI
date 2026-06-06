import crypto from "node:crypto";
import { Types, isValidObjectId } from "mongoose";
import { Meeting } from "../models/Meeting";
import type { IMeeting, IMeetingRecurrence } from "../models/Meeting";
import { User } from "../models/User";
import type {
  EffectiveMeetingStatus,
  RecurrenceDTO,
  RecurrenceFrequency,
  ScheduledMeetingSummary,
  ScheduleMeetingDTO,
  UpdateScheduleDTO,
} from "../types/index";

export const READY_WINDOW_MS = 15 * 60 * 1000;
export const MISSED_GRACE_MS = 15 * 60 * 1000;
export const MAX_RECURRENCE_OCCURRENCES = 52;
export const MIN_LEAD_TIME_MS = 60 * 1000;

export class ScheduleError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ListOptions {
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

class ScheduleService {
  effectiveStatus(meeting: Pick<IMeeting, "status" | "scheduledStartTime">, now = new Date()): EffectiveMeetingStatus {
    if (meeting.status !== "scheduled") return meeting.status;
    if (!meeting.scheduledStartTime) return "scheduled";
    const start = meeting.scheduledStartTime.getTime();
    const t = now.getTime();
    if (t < start - READY_WINDOW_MS) return "scheduled";
    if (t < start + MISSED_GRACE_MS) return "ready";
    return "missed";
  }

  expandRecurrence(start: Date, recurrence: IMeetingRecurrence): Date[] {
    const occurrences: Date[] = [];
    const until = recurrence.until.getTime();
    const interval = Math.max(1, recurrence.interval);
    let cursor = new Date(start);

    for (let i = 0; i < MAX_RECURRENCE_OCCURRENCES; i++) {
      if (cursor.getTime() > until) break;
      occurrences.push(new Date(cursor));
      cursor = stepOccurrence(cursor, recurrence.frequency, interval);
    }
    return occurrences;
  }

  async createScheduled(
    hostId: string,
    dto: ScheduleMeetingDTO
  ): Promise<{ created: ScheduledMeetingSummary[]; clipped: boolean }> {
    const host = await User.findById(hostId).select("displayName email").lean();
    if (!host) throw new ScheduleError(401, "no_user", "User not found");

    const title = (dto.title || "").trim();
    if (!title) throw new ScheduleError(400, "title_required", "Title is required");

    const start = new Date(dto.scheduledStartTime);
    if (isNaN(start.getTime())) {
      throw new ScheduleError(400, "invalid_start", "Invalid start time");
    }
    if (start.getTime() < Date.now() + MIN_LEAD_TIME_MS) {
      throw new ScheduleError(400, "past_start", "Start time must be in the future");
    }

    const durationMin = Math.round(dto.scheduledDurationMin);
    if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 720) {
      throw new ScheduleError(400, "invalid_duration", "Duration must be between 5 and 720 minutes");
    }

    const invitedSet = new Set(
      (dto.invitedUserIds ?? []).filter((id) => isValidObjectId(id) && id !== hostId)
    );

    let recurrence: IMeetingRecurrence | undefined;
    let occurrences: Date[] = [start];
    let clipped = false;

    if (dto.recurrence) {
      const until = new Date(dto.recurrence.until);
      if (isNaN(until.getTime())) {
        throw new ScheduleError(400, "invalid_until", "Invalid recurrence end date");
      }
      if (until.getTime() < start.getTime()) {
        throw new ScheduleError(400, "until_before_start", "Recurrence end must be after start");
      }
      const interval = Math.max(1, Math.round(dto.recurrence.interval ?? 1));
      recurrence = {
        frequency: dto.recurrence.frequency,
        interval,
        until,
      };
      const expanded = this.expandRecurrence(start, recurrence);
      const naturalCount = countNaturalOccurrences(start, recurrence);
      clipped = naturalCount > MAX_RECURRENCE_OCCURRENCES;
      occurrences = expanded;
    }

    if (occurrences.length === 0) {
      throw new ScheduleError(400, "no_occurrences", "Recurrence produces no occurrences");
    }

    const parentId = new Types.ObjectId();
    const docs = occurrences.map((occ, idx) => ({
      _id: idx === 0 ? parentId : new Types.ObjectId(),
      roomId: shortRoomId(),
      title,
      agenda: dto.agenda?.trim() || undefined,
      status: "scheduled" as const,
      createdBy: new Types.ObjectId(hostId),
      participants: [],
      invitedUserIds: Array.from(invitedSet).map((id) => new Types.ObjectId(id)),
      scheduledStartTime: occ,
      scheduledDurationMin: durationMin,
      recurrence: idx === 0 && recurrence ? recurrence : undefined,
      recurrenceParentId: idx === 0 || !recurrence ? undefined : parentId,
    }));

    const inserted = await Meeting.insertMany(docs);
    const invitedUsers = await this.loadUserDirectory(Array.from(invitedSet));
    const summaries = inserted.map((m) =>
      buildSummary(m as unknown as IMeeting, hostId, host.displayName, invitedUsers, new Date())
    );
    return { created: summaries, clipped };
  }

  async listUserSchedules(
    userId: string,
    opts: ListOptions = {}
  ): Promise<{ items: ScheduledMeetingSummary[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts.limit ?? 100));

    const filter: Record<string, unknown> = {
      $or: [
        { createdBy: new Types.ObjectId(userId) },
        { invitedUserIds: new Types.ObjectId(userId) },
      ],
      status: { $in: ["scheduled", "active", "missed", "cancelled", "ended"] },
      scheduledStartTime: { $exists: true, $ne: null },
    };

    if (opts.from || opts.to) {
      const startTimeFilter: Record<string, unknown> = { $exists: true, $ne: null };
      if (opts.from) startTimeFilter.$gte = opts.from;
      if (opts.to) startTimeFilter.$lte = opts.to;
      filter.scheduledStartTime = startTimeFilter;
    }

    const [docs, total] = await Promise.all([
      Meeting.find(filter)
        .sort({ scheduledStartTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<IMeeting[]>(),
      Meeting.countDocuments(filter),
    ]);

    const now = new Date();
    const hostIds = new Set<string>();
    const invitedIds = new Set<string>();
    docs.forEach((m) => {
      hostIds.add(m.createdBy.toString());
      (m.invitedUserIds ?? []).forEach((id: Types.ObjectId) => invitedIds.add(id.toString()));
    });
    const directory = await this.loadUserDirectory([...hostIds, ...invitedIds]);

    const lazyMissedIds: Types.ObjectId[] = [];
    const summaries = docs.map((m) => {
      const eff = this.effectiveStatus(m, now);
      if (eff === "missed" && m.status === "scheduled") {
        lazyMissedIds.push(m._id);
      }
      const hostName = directory.get(m.createdBy.toString())?.displayName ?? "Unknown";
      return buildSummary(m, userId, hostName, directory, now);
    });

    if (lazyMissedIds.length > 0) {
      await Meeting.updateMany(
        { _id: { $in: lazyMissedIds }, status: "scheduled" },
        { $set: { status: "missed" } }
      ).catch((err) => console.error("[Schedule] lazy missed write failed:", err));
    }

    return { items: summaries, total, page, limit };
  }

  async getScheduled(meetingId: string, userId: string): Promise<ScheduledMeetingSummary> {
    if (!isValidObjectId(meetingId)) throw new ScheduleError(404, "not_found", "Meeting not found");
    const m = await Meeting.findById(meetingId).lean<IMeeting>();
    if (!m) throw new ScheduleError(404, "not_found", "Meeting not found");
    this.assertVisible(m, userId);

    const directoryIds = [m.createdBy.toString(), ...(m.invitedUserIds ?? []).map((id) => id.toString())];
    const directory = await this.loadUserDirectory(directoryIds);
    const hostName = directory.get(m.createdBy.toString())?.displayName ?? "Unknown";

    const now = new Date();
    const eff = this.effectiveStatus(m, now);
    if (eff === "missed" && m.status === "scheduled") {
      await Meeting.updateOne({ _id: m._id, status: "scheduled" }, { $set: { status: "missed" } }).catch(() => undefined);
      m.status = "missed";
    }

    return buildSummary(m, userId, hostName, directory, now);
  }

  async updateScheduled(
    meetingId: string,
    hostId: string,
    dto: UpdateScheduleDTO
  ): Promise<ScheduledMeetingSummary> {
    if (!isValidObjectId(meetingId)) throw new ScheduleError(404, "not_found", "Meeting not found");
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new ScheduleError(404, "not_found", "Meeting not found");
    if (meeting.createdBy.toString() !== hostId) {
      throw new ScheduleError(403, "not_host", "Only the host can edit");
    }
    if (meeting.status !== "scheduled") {
      throw new ScheduleError(409, "not_editable", `Cannot edit a ${meeting.status} meeting`);
    }

    if (dto.title !== undefined) {
      const t = dto.title.trim();
      if (!t) throw new ScheduleError(400, "title_required", "Title is required");
      meeting.title = t;
    }
    if (dto.agenda !== undefined) {
      meeting.agenda = dto.agenda.trim() || undefined;
    }
    if (dto.scheduledStartTime !== undefined) {
      const start = new Date(dto.scheduledStartTime);
      if (isNaN(start.getTime())) throw new ScheduleError(400, "invalid_start", "Invalid start time");
      if (start.getTime() < Date.now() + MIN_LEAD_TIME_MS) {
        throw new ScheduleError(400, "past_start", "Start time must be in the future");
      }
      meeting.scheduledStartTime = start;
    }
    if (dto.scheduledDurationMin !== undefined) {
      const d = Math.round(dto.scheduledDurationMin);
      if (!Number.isFinite(d) || d < 5 || d > 720) {
        throw new ScheduleError(400, "invalid_duration", "Duration must be between 5 and 720 minutes");
      }
      meeting.scheduledDurationMin = d;
    }
    if (dto.invitedUserIds !== undefined) {
      const ids = new Set(dto.invitedUserIds.filter((id) => isValidObjectId(id) && id !== hostId));
      meeting.invitedUserIds = Array.from(ids).map((id) => new Types.ObjectId(id));
    }

    await meeting.save();

    const directory = await this.loadUserDirectory([
      meeting.createdBy.toString(),
      ...(meeting.invitedUserIds ?? []).map((id) => id.toString()),
    ]);
    const hostName = directory.get(meeting.createdBy.toString())?.displayName ?? "Unknown";
    return buildSummary(meeting as unknown as IMeeting, hostId, hostName, directory, new Date());
  }

  async cancelScheduled(meetingId: string, hostId: string): Promise<void> {
    if (!isValidObjectId(meetingId)) throw new ScheduleError(404, "not_found", "Meeting not found");
    const meeting = await Meeting.findById(meetingId).select("status createdBy");
    if (!meeting) throw new ScheduleError(404, "not_found", "Meeting not found");
    if (meeting.createdBy.toString() !== hostId) {
      throw new ScheduleError(403, "not_host", "Only the host can cancel");
    }
    if (meeting.status !== "scheduled") {
      throw new ScheduleError(409, "not_cancellable", `Cannot cancel a ${meeting.status} meeting`);
    }
    await Meeting.updateOne({ _id: meeting._id, status: "scheduled" }, { $set: { status: "cancelled" } });
  }

  async cancelSeries(meetingId: string, hostId: string): Promise<number> {
    if (!isValidObjectId(meetingId)) throw new ScheduleError(404, "not_found", "Meeting not found");
    const meeting = await Meeting.findById(meetingId).select("createdBy recurrence recurrenceParentId");
    if (!meeting) throw new ScheduleError(404, "not_found", "Meeting not found");
    if (meeting.createdBy.toString() !== hostId) {
      throw new ScheduleError(403, "not_host", "Only the host can cancel");
    }

    const parentId = meeting.recurrenceParentId ?? meeting._id;
    const result = await Meeting.updateMany(
      {
        $or: [{ _id: parentId }, { recurrenceParentId: parentId }],
        status: "scheduled",
      },
      { $set: { status: "cancelled" } }
    );
    return result.modifiedCount ?? 0;
  }

  async convertScheduledToActive(
    meetingId: string,
    joiningUserId: string
  ): Promise<{ meeting: IMeeting; wasScheduled: boolean }> {
    if (!isValidObjectId(meetingId)) throw new ScheduleError(404, "not_found", "Meeting not found");

    const before = await Meeting.findById(meetingId).lean<IMeeting>();
    if (!before) throw new ScheduleError(404, "not_found", "Meeting not found");
    this.assertJoinAllowed(before, joiningUserId);

    if (before.status === "active") {
      return { meeting: before, wasScheduled: false };
    }

    const updated = await Meeting.findOneAndUpdate(
      { _id: meetingId, status: "scheduled" },
      { $set: { status: "active", startedAt: new Date() } },
      { new: true }
    ).lean<IMeeting>();

    if (updated) return { meeting: updated, wasScheduled: true };

    const fresh = await Meeting.findById(meetingId).lean<IMeeting>();
    if (!fresh) throw new ScheduleError(404, "not_found", "Meeting not found");
    if (fresh.status !== "active") {
      throw new ScheduleError(409, "not_joinable", `Meeting is ${fresh.status}`);
    }
    return { meeting: fresh, wasScheduled: false };
  }

  assertJoinAllowed(meeting: IMeeting, userId: string): void {
    const isHost = meeting.createdBy.toString() === userId;
    const isInvited = (meeting.invitedUserIds ?? []).some((id) => id.toString() === userId);
    if (!isHost && !isInvited) {
      throw new ScheduleError(403, "not_invited", "You are not invited to this meeting");
    }
    if (meeting.status === "cancelled") {
      throw new ScheduleError(409, "cancelled", "Meeting has been cancelled");
    }
    if (meeting.status === "ended") {
      throw new ScheduleError(409, "ended", "Meeting has ended");
    }
    if (meeting.status === "missed") {
      throw new ScheduleError(409, "missed", "Meeting was missed");
    }
    if (meeting.status === "scheduled" && meeting.scheduledStartTime) {
      const start = meeting.scheduledStartTime.getTime();
      if (Date.now() < start - READY_WINDOW_MS) {
        throw new ScheduleError(409, "too_early", "Meeting hasn't started yet");
      }
    }
  }

  assertVisible(meeting: IMeeting, userId: string): void {
    const isHost = meeting.createdBy.toString() === userId;
    const isInvited = (meeting.invitedUserIds ?? []).some((id) => id.toString() === userId);
    if (!isHost && !isInvited) {
      throw new ScheduleError(404, "not_found", "Meeting not found");
    }
  }

  async getAttendeeEmails(meeting: IMeeting): Promise<Array<{ id: string; displayName: string; email: string }>> {
    const invited = meeting.invitedUserIds ?? [];
    if (invited.length === 0) return [];
    const users = await User.find({ _id: { $in: invited } })
      .select("displayName email")
      .lean();
    return users.map((u) => ({
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
    }));
  }

  private async loadUserDirectory(
    ids: string[]
  ): Promise<Map<string, { displayName: string; email: string }>> {
    const unique = Array.from(new Set(ids.filter((id) => isValidObjectId(id))));
    if (unique.length === 0) return new Map();
    const users = await User.find({ _id: { $in: unique } })
      .select("displayName email")
      .lean();
    return new Map(users.map((u) => [u._id.toString(), { displayName: u.displayName, email: u.email }]));
  }
}

function shortRoomId(): string {
  return crypto.randomBytes(8).toString("hex");
}

function stepOccurrence(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
  const next = new Date(date);
  if (frequency === "daily") next.setDate(next.getDate() + interval);
  else if (frequency === "weekly") next.setDate(next.getDate() + 7 * interval);
  else next.setMonth(next.getMonth() + interval);
  return next;
}

function countNaturalOccurrences(start: Date, recurrence: IMeetingRecurrence): number {
  const until = recurrence.until.getTime();
  let n = 0;
  let cursor = new Date(start);
  while (cursor.getTime() <= until) {
    n++;
    if (n > MAX_RECURRENCE_OCCURRENCES * 4) break;
    cursor = stepOccurrence(cursor, recurrence.frequency, recurrence.interval);
  }
  return n;
}

function buildSummary(
  m: IMeeting,
  viewerId: string,
  hostName: string,
  directory: Map<string, { displayName: string; email: string }>,
  now: Date
): ScheduledMeetingSummary {
  const eff = scheduleService.effectiveStatus(m, now);
  const recurrence: RecurrenceDTO | undefined = m.recurrence
    ? {
        frequency: m.recurrence.frequency,
        interval: m.recurrence.interval,
        until: m.recurrence.until.toISOString(),
      }
    : undefined;
  return {
    id: m._id.toString(),
    roomId: m.roomId,
    title: m.title ?? "Untitled meeting",
    agenda: m.agenda,
    scheduledStartTime: m.scheduledStartTime?.toISOString() ?? new Date(0).toISOString(),
    scheduledDurationMin: m.scheduledDurationMin ?? 30,
    status: m.status,
    effectiveStatus: eff,
    isHost: m.createdBy.toString() === viewerId,
    hostId: m.createdBy.toString(),
    hostName,
    invitedUsers: (m.invitedUserIds ?? []).map((id) => {
      const u = directory.get(id.toString());
      return {
        id: id.toString(),
        displayName: u?.displayName ?? "Removed user",
        email: u?.email ?? "",
      };
    }),
    recurrence,
    recurrenceParentId: m.recurrenceParentId?.toString(),
    pinned: (m.pinnedBy ?? []).some((u) => u.toString() === viewerId),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

export const scheduleService = new ScheduleService();
