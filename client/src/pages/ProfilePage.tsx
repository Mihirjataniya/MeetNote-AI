import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { Avatar } from "../components/shell/Avatar";
import { Icon } from "../components/shell/Icon";

function fmtJoinedDate(iso?: string): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function QuickLink({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: string;
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors duration-[120ms] group"
    >
      <div className="w-9 h-9 rounded-[10px] bg-surface-hover border border-border flex items-center justify-center text-secondary group-hover:text-foreground transition-colors shrink-0">
        <Icon name={icon} size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-foreground">{label}</div>
        <div className="text-[12px] text-tertiary mt-0.5">{desc}</div>
      </div>
      <Icon name="chevronRight" size={13} className="text-tertiary shrink-0" />
    </button>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const goSettings = (section: string) => navigate(`/settings#${section}`);

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[860px] mx-auto">
      <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
        Profile
      </h1>
      <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
        Your account, activity, and quick links to settings.
      </p>

      {/* Header card */}
      <div className="mt-6 sm:mt-8 bg-surface border border-border rounded-[14px] shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          <Avatar name={user?.displayName ?? ""} size={64} />
          <div className="flex-1 min-w-0">
            <div className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-foreground font-display">
              {user?.displayName}
            </div>
            <div className="text-[13px] sm:text-[14px] text-secondary mt-1">
              {user?.email}
            </div>
            <div className="text-[11.5px] text-tertiary mt-1.5">
              Member since {fmtJoinedDate(user?.createdAt)}
            </div>
          </div>
          <button
            onClick={() => goSettings("profile")}
            className="h-8 px-[11px] rounded-lg border border-border-strong bg-surface text-foreground font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-surface-hover transition-colors duration-150 self-start sm:self-auto"
          >
            <Icon name="edit" size={13} /> Edit profile
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-tertiary mb-2 px-1">
          Quick links
        </div>
        <div className="bg-surface border border-border rounded-[14px] shadow-sm divide-y divide-border overflow-hidden">
          <QuickLink
            icon="lock"
            label="Change password"
            desc="Update your account password"
            onClick={() => goSettings("security")}
          />
          <QuickLink
            icon="sun"
            label="Appearance"
            desc="Switch between light, dark, and system"
            onClick={() => goSettings("appearance")}
          />
          <QuickLink
            icon="bell"
            label="Notifications"
            desc="Browser push and in-app alerts"
            onClick={() => goSettings("")}
          />
        </div>
      </div>

      {/* Sign out */}
      <div className="mt-8 pt-6 border-t border-border">
        <button
          onClick={logout}
          className="h-9 px-4 rounded-[10px] border border-error/30 bg-error/5 text-error font-medium text-[13px] inline-flex items-center gap-2 hover:bg-error/10 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
