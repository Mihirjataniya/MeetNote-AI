import { createContext, useContext } from "react";

interface ModalContextValue {
  openStartMeeting: () => void;
  openScheduleMeeting: () => void;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useModals(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModals must be used within AppShell");
  return ctx;
}
