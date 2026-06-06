import { useEffect, useState } from "react";
import { Icon } from "../components/shell/Icon";
import {
  ensureServiceWorker,
  getCurrentSubscription,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../services/push";

const sections = [
  { icon: "user", label: "Profile", desc: "Your name, email, and avatar" },
  { icon: "shield", label: "Security", desc: "Password, sessions, and two-factor authentication" },
  { icon: "video", label: "Meeting Preferences", desc: "Default recording, transcription, and layout" },
  { icon: "sparkle", label: "AI Preferences", desc: "Note generation style, summary length, and tone" },
  { icon: "download", label: "Export", desc: "Default export format, naming, and storage" },
];

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
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-surface-hover border border-border flex items-center justify-center text-secondary shrink-0">
          <Icon name="bell" size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] sm:text-[14px] font-semibold text-foreground">
            Browser push notifications
          </div>
          <div className="text-[12px] sm:text-[12.5px] text-tertiary mt-0.5">
            Get notified about meeting invites, notes, and missed join requests
            even when MeetNote is in the background.
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

export function SettingsPage() {
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
        {sections.map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-[14px] shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-surface-hover transition-colors duration-[120ms] group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-surface-hover border border-border flex items-center justify-center text-secondary group-hover:text-foreground transition-colors shrink-0">
              <Icon name={s.icon} size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] sm:text-[14px] font-semibold text-foreground">{s.label}</div>
              <div className="text-[12px] sm:text-[12.5px] text-tertiary mt-0.5">{s.desc}</div>
            </div>
            <Icon name="chevronRight" size={14} className="text-tertiary shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
