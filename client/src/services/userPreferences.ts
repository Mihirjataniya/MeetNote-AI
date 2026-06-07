// Per-device user preferences (localStorage). Not synced across devices.
// If/when we want cross-device sync, migrate this to a server-backed User.preferences subdoc.

const KEY = "meetnote_user_prefs_v1";

export type ThemeMode = "light" | "dark" | "system";

export interface UserPreferences {
  defaultMicOn: boolean;
  defaultCamOn: boolean;
  theme: ThemeMode;
}

const DEFAULTS: UserPreferences = {
  defaultMicOn: true,
  defaultCamOn: true,
  theme: "system",
};

function isThemeMode(v: unknown): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

export function getUserPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      defaultMicOn: typeof parsed.defaultMicOn === "boolean" ? parsed.defaultMicOn : DEFAULTS.defaultMicOn,
      defaultCamOn: typeof parsed.defaultCamOn === "boolean" ? parsed.defaultCamOn : DEFAULTS.defaultCamOn,
      theme: isThemeMode(parsed.theme) ? parsed.theme : DEFAULTS.theme,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setUserPreferences(patch: Partial<UserPreferences>): UserPreferences {
  const current = getUserPreferences();
  const next = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // localStorage may be full/disabled — ignore, return computed value
  }
  return next;
}

// --- Theme application --------------------------------------------------

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

export function applyTheme(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

// Apply current saved theme + (re)wire matchMedia listener for system mode.
export function initTheme(): void {
  const prefs = getUserPreferences();
  applyTheme(prefs.theme);

  if (typeof window === "undefined" || !window.matchMedia) return;
  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  if (systemThemeListener) {
    mql.removeEventListener("change", systemThemeListener);
    systemThemeListener = null;
  }

  systemThemeListener = () => {
    if (getUserPreferences().theme === "system") {
      applyTheme("system");
    }
  };
  mql.addEventListener("change", systemThemeListener);
}
