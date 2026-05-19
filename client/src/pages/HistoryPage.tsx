import { Icon } from "../components/shell/Icon";

export function HistoryPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
            Meeting Histories
          </h1>
          <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
            Browse, search and export notes from past meetings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-[11px] rounded-lg border border-border-strong bg-surface text-foreground font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-surface-hover transition-colors duration-150">
            <Icon name="filter" size={13} /> Filter
          </button>
          <button className="h-8 px-[11px] rounded-lg border border-border-strong bg-surface text-foreground font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-surface-hover transition-colors duration-150">
            <Icon name="download" size={13} /> Export
          </button>
        </div>
      </div>

      <div className="relative mt-5 sm:mt-6">
        <Icon
          name="search"
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
        />
        <input
          className="w-full h-10 pl-10 pr-4 text-[14px] rounded-[10px] bg-surface border border-border-strong outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
          placeholder="Search meetings, notes, participants..."
        />
      </div>

      <div className="mt-5 sm:mt-6 bg-surface border border-border rounded-[14px] shadow-sm p-6 sm:p-10 flex flex-col items-center justify-center text-center min-h-[280px] sm:min-h-[360px]">
        <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-tertiary mb-4">
          <Icon name="history" size={22} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground font-display">No meetings yet</h3>
        <p className="text-[13px] text-tertiary mt-2 max-w-[320px]">
          Meeting history with notes status, participants, durations, and PDF export will appear here.
        </p>
      </div>
    </div>
  );
}
