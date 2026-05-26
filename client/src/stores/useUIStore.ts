import { create } from "zustand";

interface UIStore {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebarCollapsed: () => void;
  setMobileSidebarOpen: (open: boolean) => void;

  startMeetingOpen: boolean;
  scheduleMeetingOpen: boolean;
  openStartMeeting: () => void;
  openScheduleMeeting: () => void;
  closeStartMeeting: () => void;
  closeScheduleMeeting: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  startMeetingOpen: false,
  scheduleMeetingOpen: false,

  toggleSidebarCollapsed: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  openStartMeeting: () => set({ startMeetingOpen: true }),
  openScheduleMeeting: () => set({ scheduleMeetingOpen: true }),
  closeStartMeeting: () => set({ startMeetingOpen: false }),
  closeScheduleMeeting: () => set({ scheduleMeetingOpen: false }),
}));
