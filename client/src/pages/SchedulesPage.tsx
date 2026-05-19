import { Icon } from "../components/shell/Icon";

export function SchedulesPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[1240px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
            Schedules
          </h1>
          <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
            Manage upcoming meetings and plan your week.
          </p>
        </div>
        <button className="self-start sm:self-auto h-9 px-4 rounded-[10px] bg-accent text-accent-foreground font-medium text-[14px] inline-flex items-center gap-2 border border-accent hover:bg-black transition-all duration-150 active:scale-[0.98]">
          <Icon name="plus" size={13} /> Schedule meeting
        </button>
      </div>
      <div className="mt-6 sm:mt-8 bg-surface border border-border rounded-[14px] shadow-sm p-6 sm:p-10 flex flex-col items-center justify-center text-center min-h-[300px] sm:min-h-[400px]">
        <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-tertiary mb-4">
          <Icon name="calendar" size={22} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground font-display">Calendar view coming soon</h3>
        <p className="text-[13px] text-tertiary mt-2 max-w-[320px]">
          A monthly calendar with meeting cards, soft hover states, and scheduling will be built here.
        </p>
      </div>
    </div>
  );
}
