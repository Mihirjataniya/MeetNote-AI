import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import { isError } from "../types/index";
import type {
  ParticipantInfo,
  RoomCreatedPayload,
  PeerJoinedPayload,
  PeerLeftPayload,
} from "../types/index";

interface RoomState {
  roomId: string | null;
  meetingId: string | null;
  participants: ParticipantInfo[];
  error: string | null;
}

interface RoomActions {
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  clearMeetingId: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
  setupSocketListeners: () => (() => void) | undefined;
}

type RoomStore = RoomState & RoomActions;

const initialState: RoomState = {
  roomId: null,
  meetingId: null,
  participants: [],
  error: null,
};

export const useRoomStore = create<RoomStore>((set, get) => ({
  ...initialState,

  createRoom: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket?.connected) return;
    set({ error: null });

    socket.emit("create-room", {}, (response) => {
      if (isError(response)) {
        set({ error: response.message });
        return;
      }
      const res = response as RoomCreatedPayload;
      set({
        roomId: res.roomId,
        meetingId: res.meetingId,
        participants: res.participants,
      });
    });
  },

  joinRoom: (id: string) => {
    const socket = useSocketStore.getState().socket;
    if (!socket?.connected) return;
    set({ error: null });

    socket.emit("join-room", { roomId: id }, (response) => {
      if (isError(response)) {
        set({ error: response.message });
        return;
      }
      const res = response as RoomCreatedPayload;
      set({
        roomId: res.roomId,
        meetingId: res.meetingId,
        participants: res.participants,
      });
    });
  },

  leaveRoom: () => {
    const { roomId } = get();
    const socket = useSocketStore.getState().socket;
    if (roomId && socket) {
      socket.emit("leave-room", { roomId });
    }
    set({ roomId: null, participants: [], error: null });
  },

  clearMeetingId: () => set({ meetingId: null }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),

  setupSocketListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return undefined;

    const handlePeerJoined = (payload: PeerJoinedPayload) => {
      set((s) => ({ participants: [...s.participants, payload.peer] }));
    };
    const handlePeerLeft = (payload: PeerLeftPayload) => {
      set((s) => ({
        participants: s.participants.filter(
          (p) => p.socketId !== payload.socketId
        ),
      }));
    };

    socket.on("peer-joined", handlePeerJoined);
    socket.on("peer-left", handlePeerLeft);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("peer-left", handlePeerLeft);
    };
  },
}));
