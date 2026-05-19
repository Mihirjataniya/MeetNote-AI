import { createContext, useContext } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within AppShell");
  return ctx;
}
