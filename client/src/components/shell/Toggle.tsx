interface ToggleProps {
  on: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ on, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-[38px] h-[22px] rounded-full transition-colors duration-200 shrink-0 ${
        on ? "bg-accent" : "bg-surface-muted"
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}
