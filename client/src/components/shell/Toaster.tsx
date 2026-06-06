import { useToastStore, type ToastTone } from "../../stores/useToastStore";
import { Icon } from "./Icon";

const TONE_CLS: Record<ToastTone, string> = {
  info: "border-border bg-surface text-foreground",
  success: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
  warning: "border-amber-500/30 bg-amber-500/10 text-foreground",
  error: "border-[#dc2626]/30 bg-[#dc2626]/10 text-foreground",
};

const TONE_ICON_CLS: Record<ToastTone, string> = {
  info: "text-secondary",
  success: "text-emerald-500",
  warning: "text-amber-500",
  error: "text-[#f87171]",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-[360px] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto rounded-[12px] border shadow-lg px-3.5 py-3 flex items-start gap-3 ${TONE_CLS[t.tone]} cursor-pointer hover:shadow-xl transition-shadow`}
          style={{ animation: "pop-in 0.18s ease" }}
          onClick={() => {
            t.onClick?.();
            dismiss(t.id);
          }}
        >
          <div className={`shrink-0 mt-[1px] ${TONE_ICON_CLS[t.tone]}`}>
            <Icon name={t.icon ?? "bell"} size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold leading-tight">{t.title}</div>
            {t.body && (
              <div className="text-[12px] text-secondary mt-1 leading-snug">
                {t.body}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss(t.id);
            }}
            className="shrink-0 w-6 h-6 inline-flex items-center justify-center rounded text-tertiary hover:bg-hover hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <Icon name="x" size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}
