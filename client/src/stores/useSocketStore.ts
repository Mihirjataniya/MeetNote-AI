import { create } from "zustand";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TranscriptReadyPayload,
} from "../types/index";
import { useAuthStore } from "./useAuthStore";
import { updateMeetingTranscriptStatus } from "../queries/useMeetingsQuery";

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
