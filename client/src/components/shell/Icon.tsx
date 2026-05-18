import type { CSSProperties, ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  home: <><path d="M3 10.5L10 4l7 6.5" /><path d="M5 9.5V16h10V9.5" /></>,
  calendar: <><rect x="3" y="4.5" width="14" height="12.5" rx="2" /><path d="M3 8.5h14M7 3v3M13 3v3" /></>,
  history: <><path d="M3 10a7 7 0 1 0 2.3-5.2" /><path d="M3 4v3.5h3.5" /><path d="M10 6.5V10l2.5 1.5" /></>,
  settings: <><circle cx="10" cy="10" r="2.5" /><path d="M10 1.5v2M10 16.5v2M3.5 10h-2M18.5 10h-2M5.4 5.4L4 4M16 16l-1.4-1.4M5.4 14.6L4 16M16 4l-1.4 1.4" /></>,
  bell: <><path d="M5 8a5 5 0 1 1 10 0v4l1.5 2.5h-13L5 12z" /><path d="M8 16a2 2 0 0 0 4 0" /></>,
  plus: <><path d="M10 4v12M4 10h12" /></>,
  play: <><path d="M6 4.5l9 5.5-9 5.5z" fill="currentColor" stroke="none" /></>,
  arrowRight: <><path d="M4 10h12M11 5l5 5-5 5" /></>,
  search: <><circle cx="9" cy="9" r="5.5" /><path d="M13 13l3.5 3.5" /></>,
  fileText: <><path d="M5 3h7l3 3v11H5z" /><path d="M12 3v3h3M7.5 9h5M7.5 12h5M7.5 15h3" /></>,
  user: <><circle cx="10" cy="7" r="3" /><path d="M3.5 17c.7-3.4 3.4-5 6.5-5s5.8 1.6 6.5 5" /></>,
  moreHorizontal: <><circle cx="5" cy="10" r="1.2" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none" /></>,
  x: <><path d="M5 5l10 10M15 5L5 15" /></>,
  check: <><path d="M4 10l4 4 8-8" /></>,
  video: <><rect x="3" y="6" width="10" height="8" rx="1.5" /><path d="M13 9l4-2v6l-4-2z" fill="currentColor" /></>,
  mic: <><rect x="8" y="3" width="4" height="9" rx="2" /><path d="M5.5 9.5a4.5 4.5 0 0 0 9 0M10 14v3M7.5 17h5" /></>,
  sparkle: <><path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z" /></>,
  download: <><path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M3.5 16.5h13" /></>,
  filter: <><path d="M3 5h14M5 10h10M8 15h4" /></>,
  chevronDown: <><path d="M5 8l5 5 5-5" /></>,
  chevronRight: <><path d="M7 4l6 6-6 6" /></>,
  link: <><path d="M9 11a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1" /><path d="M11 9a3 3 0 0 0-4 0l-2 2a3 3 0 0 0 4 4l1-1" /></>,
  mail: <><rect x="3" y="5" width="14" height="11" rx="2" /><path d="M3.5 6l6.5 5 6.5-5" /></>,
  users: <><circle cx="7.5" cy="8" r="2.5" /><path d="M3 16c.5-2.4 2.4-3.5 4.5-3.5S11.5 13.6 12 16" /><circle cx="13.5" cy="7" r="2" /><path d="M11.5 12c.4 0 .8 0 1.3.1 2 .3 3.7 1.4 4.2 3.4" /></>,
  lock: <><rect x="4" y="9" width="12" height="8" rx="2" /><path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" /></>,
  edit: <><path d="M14 3l3 3-9 9H5v-3z" /></>,
  grid: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></>,
  list: <><path d="M6 5h11M6 10h11M6 15h11M3 5h.01M3 10h.01M3 15h.01" /></>,
  eye: <><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" /><circle cx="10" cy="10" r="2.5" /></>,
  layers: <><path d="M10 3l7 4-7 4-7-4z" /><path d="M3 11l7 4 7-4M3 14l7 4 7-4" /></>,
  star: <><path d="M10 3l2.2 4.5 5 .7-3.6 3.5.9 5L10 14.4 5.5 16.7l.9-5L2.8 8.2l5-.7z" /></>,
  shield: <><path d="M10 3l6 2v5c0 4-3 6.5-6 7-3-.5-6-3-6-7V5z" /></>,
  bolt: <><path d="M11 3L4 11h4l-1 6 7-8h-4z" /></>,
  upload: <><path d="M10 13V3M5.5 7.5L10 3l4.5 4.5M3.5 16.5h13" /></>,
  pin: <><path d="M7 3h6l-1 4 2 3h-3v6l-1-2-1 2v-6H6l2-3z" /></>,
};

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.6, style, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      {paths[name] ?? null}
    </svg>
  );
}
