import { useEffect, useState } from "react";
import { Icon } from "../components/shell/Icon";
import { useAuthStore } from "../stores/useAuthStore";
import { updateProfile, updatePassword } from "../services/users";
import {
  getUserPreferences,
  setUserPreferences,
  applyTheme,
  type UserPreferences,
  type ThemeMode,
} from "../services/userPreferences";
import {
  ensureServiceWorker,
  getCurrentSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../services/push";

type SectionId =
  | "profile"
  | "security"
  | "appearance"
  | "meeting-prefs";

function SettingsCard({
  icon,
  title,
  desc,
  open,
  onToggle,
  disabled,
  badge,
  children,
}: {
  icon: string;
  title: string;
  desc: string;
  open: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        disabled={disabled}
        className={`w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left transition-colors duration-[120ms] ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-surface-hover"
        }`}
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-surface-hover border border-border flex items-center justify-center text-secondary shrink-0">
          <Icon name={icon} size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] sm:text-[14px] font-semibold text-foreground flex items-center gap-2">
            {title}
            {badge && (
              <span className="text-[10px] uppercase tracking-[0.08em] font-medium text-tertiary border border-border rounded px-1.5 py-0.5">
                {badge}
              </span>
            )}
          </div>
          <div className="text-[12px] sm:text-[12.5px] text-tertiary mt-0.5">
            {desc}
          </div>
        </div>
        {!disabled && (
          <Icon
            name="chevronRight"
            size={14}
            className={`text-tertiary shrink-0 transition-transform duration-[150ms] ${
              open ? "rotate-90" : ""
            }`}
          />
        )}
      </button>
      {open && children && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-border bg-background/40">
          {children}
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-secondary mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-lg bg-surface border border-border text-[13.5px] text-foreground placeholder:text-tertiary focus:outline-none focus:border-border-focused transition-colors";

function ProfileForm({ onSaved }: { onSaved: () => void }) {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const dirty =
    displayName.trim() !== (user?.displayName ?? "") ||
    email.trim().toLowerCase() !== (user?.email ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setError(null);
    setOkMsg(null);
    setBusy(true);
    try {
      const patch: { displayName?: string; email?: string } = {};
      if (displayName.trim() !== (user?.displayName ?? "")) patch.displayName = displayName.trim();
      if (email.trim().toLowerCase() !== (user?.email ?? "")) patch.email = email.trim();
      await updateProfile(patch);
      await refreshUser();
      setOkMsg("Profile updated.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
      <FormField label="Display name">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
          className={inputCls}
        />
      </FormField>
      <FormField label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
        />
      </FormField>
      {error && <div className="text-[12px] text-[#f87171]">{error}</div>}
      {okMsg && <div className="text-[12px] text-emerald-500">{okMsg}</div>}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={!dirty || busy}
          className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-[13px] font-medium inline-flex items-center gap-1.5 hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy && <Icon name="spinner" size={12} className="animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}

function SecurityForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(current, next);
      setOkMsg("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
      <FormField label="Current password">
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          className={inputCls}
        />
      </FormField>
      <FormField label="New password">
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          className={inputCls}
        />
      </FormField>
      <FormField label="Confirm new password">
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className={inputCls}
        />
      </FormField>
      {error && <div className="text-[12px] text-[#f87171]">{error}</div>}
      {okMsg && <div className="text-[12px] text-emerald-500">{okMsg}</div>}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={busy || !current || !next || !confirm}
          className="h-9 px-4 rounded-lg bg-accent text-accent-foreground text-[13px] font-medium inline-flex items-center gap-1.5 hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy && <Icon name="spinner" size={12} className="animate-spin" />}
          Update password
        </button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        <div className="text-[11.5px] text-tertiary mt-0.5">{desc}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-[22px] rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-surface-hover border border-border"
        }`}
      >
        <span
          className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-background shadow transition-all ${
            checked ? "left-[20px]" : "left-[2px]"
          }`}
        />
      </button>
    </div>
  );
}

function AppearanceForm() {
  const [theme, setTheme] = useState<ThemeMode>(() => getUserPreferences().theme);

  function commit(next: ThemeMode) {
    setTheme(next);
    setUserPreferences({ theme: next });
    applyTheme(next);
  }

  function select(next: ThemeMode, e: React.MouseEvent<HTMLButtonElement>) {
    if (next === theme) return;

    // View Transitions API — expanding-circle reveal from the click point.
    type WithVT = Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const docVT = document as WithVT;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (typeof docVT.startViewTransition !== "function" || reduced) {
      commit(next);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    document.documentElement.style.setProperty("--vt-x", `${x}px`);
    document.documentElement.style.setProperty("--vt-y", `${y}px`);

    docVT.startViewTransition(() => {
      commit(next);
    });
  }

  const options: Array<{ value: ThemeMode; label: string; icon: string }> = [
    { value: "light", label: "Light", icon: "sun" },
    { value: "dark", label: "Dark", icon: "moon" },
    { value: "system", label: "System", icon: "monitor" },
  ];

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => select(opt.value, e)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border text-[12px] font-medium transition-all ${
                active
                  ? "border-accent bg-accent/[0.08] text-foreground"
                  : "border-border bg-surface text-secondary hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <Icon name={opt.icon} size={16} />
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-tertiary">
        System follows your operating system's theme preference.
      </div>
    </div>
  );
}

function MeetingPrefsForm() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => getUserPreferences());

  function patch(p: Partial<UserPreferences>) {
    setPrefs(setUserPreferences(p));
  }

  return (
    <div className="mt-3 flex flex-col divide-y divide-border">
      <ToggleRow
        label="Mic on by default"
        desc="Start the lobby with your microphone enabled."
        checked={prefs.defaultMicOn}
        onChange={(v) => patch({ defaultMicOn: v })}
      />
      <ToggleRow
        label="Camera on by default"
        desc="Start the lobby with your camera enabled."
        checked={prefs.defaultCamOn}
        onChange={(v) => patch({ defaultCamOn: v })}
      />
      <div className="pt-2 text-[11px] text-tertiary">
        Saved on this device. Other devices keep their own defaults.
      </div>
    </div>
  );
}

function BrowserPushCard() {
  const supported = pushSupported();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    supported ? Notification.permission : "unsupported"
  );
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    (async () => {
      await ensureServiceWorker();
      const sub = await getCurrentSubscription();
      setSubscribed(!!sub);
    })();
  }, [supported]);

  const enabled = subscribed && permission === "granted";

  async function handleToggle() {
    setError(null);
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
        setPermission(Notification.permission);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const blocked = permission === "denied";

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm p-4 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-surface-hover border border-border flex items-center justify-center text-secondary shrink-0">
          <Icon name="bell" size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] sm:text-[14px] font-semibold text-foreground">
            Browser push notifications
          </div>
          <div className="text-[12px] sm:text-[12.5px] text-tertiary mt-0.5">
            Get notified about meeting invites, notes, and missed join requests
            even when MeetNote Ai is in the background.
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={!supported || busy || blocked}
          className={`shrink-0 h-9 px-3 rounded-lg text-[13px] font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            enabled
              ? "bg-[#dc2626]/10 text-[#f87171] border border-[#dc2626]/20 hover:bg-[#dc2626]/15"
              : "bg-accent text-accent-foreground border border-accent hover:bg-accent/80"
          }`}
        >
          {busy && <Icon name="spinner" size={12} className="animate-spin" />}
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>
      {!supported && (
        <div className="mt-3 text-[12px] text-tertiary">
          This browser doesn't support push notifications.
        </div>
      )}
      {blocked && (
        <div className="mt-3 text-[12px] text-[#f87171]">
          Notifications are blocked at the browser level. Allow them in your
          browser site settings to re-enable.
        </div>
      )}
      {error && (
        <div className="mt-3 text-[12px] text-[#f87171]">{error}</div>
      )}
    </div>
  );
}

const SECTION_IDS: readonly SectionId[] = [
  "profile",
  "security",
  "appearance",
  "meeting-prefs",
];

function hashToSection(hash: string): SectionId | null {
  const raw = hash.replace(/^#/, "");
  return SECTION_IDS.includes(raw as SectionId) ? (raw as SectionId) : null;
}

export function SettingsPage() {
  // Initialize from URL hash so ProfilePage deep-links (e.g. /settings#security)
  // land on the right card pre-opened.
  const [open, setOpen] = useState<SectionId | null>(() =>
    typeof window !== "undefined" ? hashToSection(window.location.hash) : null
  );

  useEffect(() => {
    const onHash = () => setOpen(hashToSection(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const toggle = (id: SectionId) => setOpen((cur) => (cur === id ? null : id));

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[800px] mx-auto">
      <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
        Settings
      </h1>
      <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
        Manage your account, preferences, and integrations.
      </p>

      <div className="mt-6 sm:mt-8 flex flex-col gap-2">
        <BrowserPushCard />

        <SettingsCard
          icon="user"
          title="Profile"
          desc="Your display name and email"
          open={open === "profile"}
          onToggle={() => toggle("profile")}
        >
          <ProfileForm onSaved={() => {}} />
        </SettingsCard>

        <SettingsCard
          icon="shield"
          title="Security"
          desc="Change your password"
          open={open === "security"}
          onToggle={() => toggle("security")}
        >
          <SecurityForm />
        </SettingsCard>

        <SettingsCard
          icon="sun"
          title="Appearance"
          desc="Light, dark, or follow your system"
          open={open === "appearance"}
          onToggle={() => toggle("appearance")}
        >
          <AppearanceForm />
        </SettingsCard>

        <SettingsCard
          icon="video"
          title="Meeting Preferences"
          desc="Default mic and camera state in the lobby"
          open={open === "meeting-prefs"}
          onToggle={() => toggle("meeting-prefs")}
        >
          <MeetingPrefsForm />
        </SettingsCard>

      </div>
    </div>
  );
}
