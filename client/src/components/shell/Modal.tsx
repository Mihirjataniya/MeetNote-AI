import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 460 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(20, 20, 19, 0.32)",
        backdropFilter: "blur(6px)",
        animation: "fade-in 0.18s ease",
      }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-[18px] shadow-lg border border-border overflow-hidden"
        style={{ width, animation: "pop-in 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3.5 flex items-start gap-3.5">
          <div className="flex-1">
            <h3 className="text-[17px] font-semibold tracking-tight font-display text-foreground leading-[1.3]">
              {title}
            </h3>
            {subtitle && <p className="text-[13px] text-secondary mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-tertiary hover:bg-hover hover:text-foreground transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="px-6 pb-5">{children}</div>
        {footer && (
          <div className="px-6 py-3.5 border-t border-border bg-surface-hover flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
