import { create } from "zustand";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TranscriptReadyPayload,
  NotesReadyPayload,
  MeetingStateChangedPayload,
  NotificationSocketPayload,
} from "../types/index";
import { useAuthStore } from "./useAuthStore";
import {
  updateMeetingTranscriptStatus,
  updateMeetingNotesStatus,
} from "../queries/useMeetingsQuery";
import { queryClient } from "../queries/queryClient";
import { scheduleKeys } from "../queries/useSchedulesQuery";
import { notificationKeys } from "../queries/useNotificationsQuery";
import { useToastStore, type ToastTone } from "./useToastStore";

const TOAST_TONE: Record<string, ToastTone> = {
  "transcript-ready": "success",
  "transcript-failed": "error",
  "notes-ready": "success",
  "notes-failed": "error",
  "meeting-invited": "info",
  "meeting-updated": "info",
  "meeting-cancelled": "warning",
  "meeting-series-cancelled": "warning",
  "meeting-started": "info",
  "join-request-missed": "warning",
};

const TOAST_ICON: Record<string, string> = {
  "transcript-ready": "check",
  "transcript-failed": "x",
  "notes-ready": "sparkle",
  "notes-failed": "x",
  "meeting-invited": "calendar",
  "meeting-updated": "edit",
  "meeting-cancelled": "x",
  "meeting-series-cancelled": "x",
  "meeting-started": "play",
  "join-request-missed": "users",
};

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SERVER_URL = import.meta.env.VITE_API_URL || "";

interface SocketStore {
  socket: TypedSocket | null;
  connected: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  connected: false,

  connect: (token: string) => {
    const { socket: existing } = get();
    if (existing) {
      existing.disconnect();
    }

    const socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
    }) as TypedSocket;

    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false }));

    socket.on("transcript-ready", (payload: TranscriptReadyPayload) => {
      updateMeetingTranscriptStatus(payload.meetingId, payload.status);
    });

    socket.on("notes-ready", (payload: NotesReadyPayload) => {
      updateMeetingNotesStatus(payload.meetingId, payload.status);
    });

    socket.on("meeting-state-changed", (_payload: MeetingStateChangedPayload) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    });

    socket.on("notification:new", (payload: NotificationSocketPayload) => {
      // Push a toast and invalidate the bell queries so the badge updates.
      useToastStore.getState().push({
        title: payload.title,
        body: payload.body,
        tone: TOAST_TONE[payload.type] ?? "info",
        icon: TOAST_ICON[payload.type] ?? "bell",
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    socket.connect();
    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));

// Auto-connect/disconnect based on auth token changes
const token = useAuthStore.getState().token;
if (token) {
  useSocketStore.getState().connect(token);
}

useAuthStore.subscribe(
  (state) => state.token,
  (token) => {
    if (token) {
      useSocketStore.getState().connect(token);
    } else {
      useSocketStore.getState().disconnect();
    }
  }
);
