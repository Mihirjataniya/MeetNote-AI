import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

interface ThemeStore {
  theme: Theme;
  setTheme: (next: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system" as Theme,
      setTheme: (next) => {
        set({ theme: next });
        applyTheme(next);
      },
    }),
    { name: "meetnote-theme" }
  )
);

// Apply theme once store has rehydrated from localStorage
applyTheme(useThemeStore.getState().theme);

export function useResolvedTheme(): "light" | "dark" {
  const theme = useThemeStore((s) => s.theme);
  return theme === "system" ? getSystemTheme() : theme;
}

// Listen for OS-level theme changes when in "system" mode
if (typeof window !== "undefined") {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (useThemeStore.getState().theme === "system") {
      applyTheme("system");
    }
  });
}
