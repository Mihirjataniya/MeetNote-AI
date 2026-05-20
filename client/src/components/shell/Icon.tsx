import type { CSSProperties } from "react";
import {
  Home,
  Calendar,
  History,
  Settings,
  Bell,
  Plus,
  Play,
  ArrowRight,
  Search,
  FileText,
  User,
  MoreHorizontal,
  X,
  Check,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  Link,
  Mail,
  Users,
  Lock,
  Pencil,
  Grid3X3,
  List,
  Eye,
  Layers,
  Star,
  Shield,
  Zap,
  Upload,
  Pin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  MonitorUp,
  MonitorX,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  calendar: Calendar,
  history: History,
  settings: Settings,
  bell: Bell,
  plus: Plus,
  play: Play,
  arrowRight: ArrowRight,
  search: Search,
  fileText: FileText,
  user: User,
  moreHorizontal: MoreHorizontal,
  x: X,
  check: Check,
  video: Video,
  mic: Mic,
  sparkle: Sparkles,
  download: Download,
  filter: Filter,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  link: Link,
  mail: Mail,
  users: Users,
  lock: Lock,
  edit: Pencil,
  grid: Grid3X3,
  list: List,
  eye: Eye,
  layers: Layers,
  star: Star,
  shield: Shield,
  bolt: Zap,
  upload: Upload,
  pin: Pin,
  menu: Menu,
  panelLeftClose: PanelLeftClose,
  panelLeftOpen: PanelLeftOpen,
  micOff: MicOff,
  videoOff: VideoOff,
  phone: Phone,
  screenShare: MonitorUp,
  screenShareOff: MonitorX,
  chat: MessageSquare,
};

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.6, style, className }: IconProps) {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) return null;

  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0, ...style }}
    />
  );
}
