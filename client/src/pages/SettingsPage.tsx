import { Icon } from "../components/shell/Icon";

const sections = [
  { icon: "user", label: "Profile", desc: "Your name, email, and avatar" },
  { icon: "shield", label: "Security", desc: "Password, sessions, and two-factor authentication" },
  { icon: "bell", label: "Notifications", desc: "Email and in-app notification preferences" },
  { icon: "video", label: "Meeting Preferences", desc: "Default recording, transcription, and layout" },
  { icon: "sparkle", label: "AI Preferences", desc: "Note generation style, summary length, and tone" },
  { icon: "download", label: "Export", desc: "Default export format, naming, and storage" },
];

export function SettingsPage() {
  return (
    <div className="px-8 py-7 max-w-[800px] mx-auto">
      <h1 className="text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
        Settings
      </h1>
      <p className="text-[14px] text-secondary mt-1.5">
        Manage your account, preferences, and integrations.
      </p>

      <div className="mt-8 flex flex-col gap-2">
        {sections.map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded-[14px] shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:bg-surface-hover transition-colors duration-[120ms] group"
          >
            <div className="w-10 h-10 rounded-[10px] bg-surface-hover border border-border flex items-center justify-center text-secondary group-hover:text-foreground transition-colors">
              <Icon name={s.icon} size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-foreground">{s.label}</div>
              <div className="text-[12.5px] text-tertiary mt-0.5">{s.desc}</div>
            </div>
            <Icon name="chevronRight" size={14} className="text-tertiary" />
          </div>
        ))}
      </div>
    </div>
  );
}
