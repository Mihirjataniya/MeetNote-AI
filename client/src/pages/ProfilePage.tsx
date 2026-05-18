import { useAuth } from "../contexts/AuthContext";
import { Avatar } from "../components/shell/Avatar";
import { Icon } from "../components/shell/Icon";

export function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="px-8 py-7 max-w-[800px] mx-auto">
      <h1 className="text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
        Profile
      </h1>

      <div className="mt-8 bg-surface border border-border rounded-[14px] shadow-sm p-6">
        <div className="flex items-center gap-5">
          <Avatar name={user?.displayName ?? ""} size={64} />
          <div className="flex-1 min-w-0">
            <div className="text-[20px] font-semibold tracking-tight text-foreground font-display">
              {user?.displayName}
            </div>
            <div className="text-[14px] text-secondary mt-1">{user?.email}</div>
          </div>
          <button className="h-8 px-[11px] rounded-lg border border-border-strong bg-surface text-foreground font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-surface-hover transition-colors duration-150">
            <Icon name="edit" size={13} /> Edit
          </button>
        </div>
      </div>

      <div className="mt-4 bg-surface border border-border rounded-[14px] shadow-sm p-6 flex flex-col gap-5">
        {[
          { label: "Display name", value: user?.displayName ?? "" },
          { label: "Email address", value: user?.email ?? "" },
          { label: "Password", value: "••••••••" },
        ].map((field) => (
          <div key={field.label} className="flex items-center gap-4">
            <div className="w-[140px] text-[12px] font-medium text-tertiary uppercase tracking-[0.06em]">
              {field.label}
            </div>
            <div className="flex-1 text-[14px] text-foreground">{field.value}</div>
          </div>
        ))}
      </div>

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
