import { create } from "zustand";
import { useSocketStore } from "./useSocketStore";
import { isError } from "../types/index";
import { playJoinRequestSound } from "../utils/notificationSound";
import type {
  ParticipantInfo,
  PendingRequestInfo,
  RoomCreatedPayload,
  PeerJoinedPayload,
  PeerLeftPayload,
  RequestJoinAckPayload,
  JoinRequestedPayload,
  JoinRequestCancelledPayload,
  JoinDeniedPayload,
} from "../types/index";

// Remembers which room this tab is actively in, so a refresh can rejoin
// directly (the server holds the membership for a short grace window) instead
// of bouncing the user back to the lobby.
const ACTIVE_ROOM_KEY = "meetnote:activeRoom";
export const getActiveRoomSession = (): string | null => {
  try {
    return sessionStorage.getItem(ACTIVE_ROOM_KEY);
  } catch {
    return null;
  }
};
const setActiveRoomSession = (roomId: string): void => {
  try {
    sessionStorage.setItem(ACTIVE_ROOM_KEY, roomId);
  } catch {
    /* ignore */
  }
};
const clearActiveRoomSession = (): void => {
  try {
    sessionStorage.removeItem(ACTIVE_ROOM_KEY);
  } catch {
    /* ignore */
  }
};

export type RequestState =
  | "idle"
  | "waiting-for-host"
  | "pending-approval"
  | "approved"
  | "denied"
  | "error";

interface RoomState {
  roomId: string | null;
  meetingId: string | null;
  participants: ParticipantInfo[];
  pendingRequests: PendingRequestInfo[];
  isHost: boolean;
  requestState: RequestState;
  requestError: string | null;
  error: string | null;
  preferredMicOn: boolean;
  preferredCamOn: boolean;
}

interface RoomActions {
  createRoom: (options?: { title?: string; agenda?: string }) => void;
  joinRoom: (roomId: string, options?: { scheduledMeetingId?: string }) => void;
  requestJoin: (roomId: string, options?: { scheduledMeetingId?: string }) => void;
  cancelJoinRequest: (roomId: string) => void;
  approveJoinRequest: (socketId: string) => void;
  denyJoinRequest: (socketId: string) => void;
  leaveRoom: () => void;
  clearMeetingId: () => void;
  setError: (error: string | null) => void;
  setRequestState: (state: RequestState) => void;
  setPreferredDevices: (mic: boolean, cam: boolean) => void;
  reset: () => void;
  setupSocketListeners: () => (() => void) | undefined;
}

type RoomStore = RoomState & RoomActions;

const initialState: RoomState = {
  roomId: null,
  meetingId: null,
  participants: [],
  pendingRequests: [],
  isHost: false,
  requestState: "idle",
  requestError: null,
  error: null,
  preferredMicOn: true,
  preferredCamOn: true,
};

export const useRoomStore = create<RoomStore>((set, get) => ({
  ...initialState,

  createRoom: (options) => {
    const socket = useSocketStore.getState().socket;
    if (!socket?.connected) return;
    set({ error: null });

    socket.emit("create-room", { title: options?.title, agenda: options?.agenda }, (response) => {
      if (isError(response)) {
        set({ error: response.message });
        return;
      }
      const res = response as RoomCreatedPayload;
      setActiveRoomSession(res.roomId);
      set({
        roomId: res.roomId,
        meetingId: res.meetingId,
        participants: res.participants,
        isHost: res.isHost,
        pendingRequests: res.pendingRequests,
        requestState: "approved",
      });
    });
  },

  joinRoom: (id: string, options?: { scheduledMeetingId?: string }) => {
    const socket = useSocketStore.getState().socket;
    if (!socket?.connected) return;
    set({ error: null });

    socket.emit(
      "join-room",
      { roomId: id, scheduledMeetingId: options?.scheduledMeetingId },
      (response) => {
        if (isError(response)) {
          set({ error: response.message });
          return;
        }
        const res = response as RoomCreatedPayload;
        setActiveRoomSession(res.roomId);
        set({
          roomId: res.roomId,
          meetingId: res.meetingId,
          participants: res.participants,
          isHost: res.isHost,
          pendingRequests: res.pendingRequests,
          requestState: "approved",
        });
      }
    );
  },

  requestJoin: (roomId, options) => {
    const socket = useSocketStore.getState().socket;
    if (!socket?.connected) return;
    set({ requestError: null, requestState: "pending-approval" });

    socket.emit(
      "request-join",
      { roomId, scheduledMeetingId: options?.scheduledMeetingId },
      (response) => {
        if (isError(response)) {
          set({ requestError: response.message, requestState: "error" });
          return;
        }
        const res = response as RequestJoinAckPayload;
        set({ requestState: res.state });
      }
    );
  },

  cancelJoinRequest: (roomId) => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;
    socket.emit("cancel-join-request", { roomId }, () => {});
    set({ requestState: "idle", requestError: null });
  },

  approveJoinRequest: (socketId) => {
    const socket = useSocketStore.getState().socket;
    const { roomId } = get();
    if (!socket || !roomId) return;
    socket.emit("approve-join-request", { roomId, socketId }, (res) => {
      if (isError(res)) {
        set({ error: res.message });
      }
    });
  },

  denyJoinRequest: (socketId) => {
    const socket = useSocketStore.getState().socket;
    const { roomId } = get();
    if (!socket || !roomId) return;
    socket.emit("deny-join-request", { roomId, socketId }, (res) => {
      if (isError(res)) {
        set({ error: res.message });
      }
    });
  },

  leaveRoom: () => {
    const { roomId } = get();
    const socket = useSocketStore.getState().socket;
    if (roomId && socket) {
      socket.emit("leave-room", { roomId });
    }
    clearActiveRoomSession();
    set({
      roomId: null,
      participants: [],
      pendingRequests: [],
      isHost: false,
      requestState: "idle",
      error: null,
    });
  },

  clearMeetingId: () => set({ meetingId: null }),
  setError: (error) => set({ error }),
  setRequestState: (state) => set({ requestState: state }),
  setPreferredDevices: (mic, cam) => set({ preferredMicOn: mic, preferredCamOn: cam }),
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
    const handleJoinRequested = (payload: JoinRequestedPayload) => {
      let added = false;
      set((s) => {
        if (s.pendingRequests.some((r) => r.socketId === payload.request.socketId)) {
          return s;
        }
        added = true;
        return { pendingRequests: [...s.pendingRequests, payload.request] };
      });
      if (added) {
        playJoinRequestSound();
      }
    };
    const handleJoinRequestCancelled = (payload: JoinRequestCancelledPayload) => {
      set((s) => ({
        pendingRequests: s.pendingRequests.filter(
          (r) => r.socketId !== payload.socketId
        ),
      }));
    };
    const handleJoinApproved = () => {
      set({ requestState: "approved" });
    };
    const handleJoinDenied = (payload: JoinDeniedPayload) => {
      set({
        requestState: "denied",
        requestError: payload.reason ?? "Your request to join was denied",
      });
    };

    socket.on("peer-joined", handlePeerJoined);
    socket.on("peer-left", handlePeerLeft);
    socket.on("join-requested", handleJoinRequested);
    socket.on("join-request-cancelled", handleJoinRequestCancelled);
    socket.on("join-approved", handleJoinApproved);
    socket.on("join-denied", handleJoinDenied);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("peer-left", handlePeerLeft);
      socket.off("join-requested", handleJoinRequested);
      socket.off("join-request-cancelled", handleJoinRequestCancelled);
      socket.off("join-approved", handleJoinApproved);
      socket.off("join-denied", handleJoinDenied);
    };
  },
}));
