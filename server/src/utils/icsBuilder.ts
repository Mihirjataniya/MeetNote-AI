import type { IMeeting } from "../models/Meeting";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toUtcIcsTime(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (i === 0) {
      chunks.push(line.slice(0, 75));
      i = 75;
    } else {
      chunks.push(" " + line.slice(i, i + 74));
      i += 74;
    }
  }
  return chunks.join("\r\n");
}

interface IcsInput {
  meeting: IMeeting;
  host: { displayName: string; email: string };
  attendees: Array<{ displayName: string; email: string }>;
  joinUrl: string;
}

export function buildIcs({ meeting, host, attendees, joinUrl }: IcsInput): string {
  const start = meeting.scheduledStartTime ?? new Date();
  const durationMin = meeting.scheduledDurationMin ?? 30;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const now = new Date();
  const uid = `${meeting._id.toString()}@meetnote`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeetNote//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcIcsTime(now)}`,
    `DTSTART:${toUtcIcsTime(start)}`,
    `DTEND:${toUtcIcsTime(end)}`,
    `SUMMARY:${escapeIcsText(meeting.title ?? "Meeting")}`,
  ];

  const descriptionParts: string[] = [];
  if (meeting.agenda) descriptionParts.push(meeting.agenda);
  descriptionParts.push(`Join: ${joinUrl}`);
  lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join("\n\n"))}`);
  lines.push(`URL:${joinUrl}`);
  lines.push(
    `ORGANIZER;CN=${escapeIcsText(host.displayName)}:mailto:${host.email}`
  );
  for (const a of attendees) {
    lines.push(
      `ATTENDEE;CN=${escapeIcsText(a.displayName)};RSVP=FALSE:mailto:${a.email}`
    );
  }

  if (meeting.recurrence) {
    const rec = meeting.recurrence;
    const freq = rec.frequency.toUpperCase();
    const until = toUtcIcsTime(rec.until);
    lines.push(`RRULE:FREQ=${freq};INTERVAL=${rec.interval};UNTIL=${until}`);
  }

  if (meeting.status === "cancelled") {
    lines.push("STATUS:CANCELLED");
  } else {
    lines.push("STATUS:CONFIRMED");
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}
