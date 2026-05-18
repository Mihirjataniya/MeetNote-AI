import type { CSSProperties } from "react";

const TONES = ["#1F1F1F", "#3A3A38", "#54514C", "#6E6A64", "#88837C", "#A6A29A", "#C7C2BA"];

function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Avatar({ name, size = 26, style, className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 border-[1.5px] border-surface font-semibold ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(9, size * 0.4),
        background: avatarBg(name),
        color: "#fff",
        ...style,
      }}
    >
      {initials || "·"}
    </span>
  );
}

interface AvatarGroupProps {
  names: string[];
  size?: number;
  max?: number;
}

export function AvatarGroup({ names, size = 22, max = 4 }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;

  return (
    <span className="flex">
      {shown.map((n, i) => (
        <Avatar key={i} name={n} size={size} style={i > 0 ? { marginLeft: -8 } : undefined} />
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full shrink-0 border-[1.5px] border-surface bg-surface-muted text-secondary font-semibold"
          style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4), marginLeft: -8 }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}
