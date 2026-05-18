import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-foreground">
      <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
        M
      </span>
      MeetNote
    </span>
  );
}

function ArrowRightIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function DocLines({ widths }: { widths: number[] }) {
  return (
    <div className="flex flex-col gap-2">
      {widths.map((w, i) => (
        <div key={i} className="h-2 rounded-full bg-surface-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function SidePanel({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`hidden lg:flex flex-col bg-surface-hover px-10 xl:px-14 py-10 xl:py-14 overflow-y-auto min-h-0 ${
        side === "right" ? "border-l border-border" : "border-r border-border"
      }`}
      style={{ order: side === "right" ? 1 : 0 }}
    >
      <div className="max-w-[360px]">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
          From the docs
        </div>
        <p className="mt-4 font-serif text-[22px] xl:text-[26px] leading-[1.35] text-foreground tracking-[-0.01em] italic">
          "MeetNote is the quietest piece of software I've installed in years. It does its job, and gets out of the way."
        </p>
        <div className="mt-5 flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-[#3A3A38] text-white inline-flex items-center justify-center text-[11px] font-semibold shrink-0">
            PS
          </span>
          <div>
            <div className="text-[13px] font-semibold text-foreground">Priya Shah</div>
            <div className="text-[12px] text-tertiary">Head of Operations, Halcyon</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-8" />

      <div className="bg-surface rounded-[14px] p-5 xl:p-6 border border-border shadow-md shrink-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
          Meeting Notes
        </div>
        <h3 className="text-[18px] xl:text-[20px] font-semibold mt-1.5 tracking-tight text-foreground font-display">
          Weekly customer review
        </h3>
        <div className="mt-1.5 text-[12px] text-tertiary">14 May · 42 min · 4 attendees</div>
        <hr className="border-none h-px bg-border my-4" />
        <DocLines widths={[95, 78, 88, 70]} />
        <div className="mt-3.5 flex items-center gap-2 text-[11px] text-secondary">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-hover border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-foreground to-secondary" />
            Generated in 42s
          </span>
          <span className="ml-auto font-mono text-[12px] tracking-tight">notes.pdf</span>
        </div>
      </div>
    </div>
  );
}

export function AuthPage() {
  const { login, register, error } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setLocalError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full h-full bg-background grid grid-cols-1 lg:grid-cols-2">
      {/* Form column */}
      <div
        className="flex flex-col px-8 sm:px-14 py-8 sm:pt-8 sm:pb-10"
        style={{ order: mode === "login" ? 0 : 1 }}
      >
        <Logo />

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            <h1 className="text-[32px] font-semibold tracking-tight font-display text-foreground">
              {mode === "login" ? "Welcome back." : "Create your workspace."}
            </h1>
            <p className="mt-2 text-[14px] text-secondary">
              {mode === "login"
                ? "Sign in to pick up where your meetings left off."
                : "Free for your team. Set up in seconds."}
            </p>

            <form onSubmit={handleSubmit} className="mt-7">
              {mode === "register" && (
                <div className="mb-3.5">
                  <label className="text-[12px] font-medium text-secondary block mb-2">
                    Display name
                  </label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_0_0_4px_rgba(255,255,255,0.04)] placeholder:text-tertiary"
                    placeholder="Alex Reyes"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={50}
                    required
                  />
                </div>
              )}

              <div className="mb-3.5">
                <label className="text-[12px] font-medium text-secondary block mb-2">
                  Work email
                </label>
                <input
                  type="email"
                  className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_0_0_4px_rgba(255,255,255,0.04)] placeholder:text-tertiary"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-medium text-secondary">
                    Password
                  </label>
                  {mode === "login" && (
                    <button type="button" className="text-[12px] text-secondary hover:text-foreground transition-colors">
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  className="w-full h-10 px-3 border border-border-strong bg-surface rounded-[10px] text-[14px] text-foreground outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_0_0_4px_rgba(255,255,255,0.04)] placeholder:text-tertiary"
                  placeholder={mode === "login" ? "••••••••" : "At least 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                {mode === "register" && (
                  <div className="text-[12px] text-tertiary mt-1.5">
                    Use a passphrase you'll remember.
                  </div>
                )}
              </div>

              {mode === "login" && (
                <label className="flex items-center gap-2 text-[13px] text-secondary mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-accent w-3.5 h-3.5"
                  />
                  Keep me signed in on this device
                </label>
              )}

              {mode === "register" && (
                <label className="flex items-start gap-2.5 text-[12.5px] text-secondary mt-1.5 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-accent w-3.5 h-3.5 mt-0.5"
                  />
                  <span>
                    I agree to MeetNote's{" "}
                    <span className="text-foreground cursor-pointer">Terms</span> and{" "}
                    <span className="text-foreground cursor-pointer">Privacy Policy</span>.
                  </span>
                </label>
              )}

              {displayError && (
                <div className="mt-4 text-[13px] text-error bg-error/5 border border-error/15 rounded-[10px] px-3 py-2.5">
                  {displayError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-5 h-11 px-5 rounded-[10px] bg-accent text-accent-foreground font-medium text-[15px] inline-flex items-center justify-center gap-2 border border-accent hover:bg-foreground transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
                {!submitting && <ArrowRightIcon />}
              </button>
            </form>

            <div className="mt-5 text-[13px] text-secondary text-center">
              {mode === "login" ? "New here? " : "Already have one? "}
              <button
                type="button"
                className="text-foreground font-medium hover:underline"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setLocalError(null);
                }}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex text-[12px] text-tertiary gap-4">
          <span>&copy; 2026 MeetNote</span>
          <span className="ml-auto">Privacy · Terms</span>
        </div>
      </div>

      {/* Side panel */}
      <SidePanel side={mode === "login" ? "right" : "left"} />
    </div>
  );
}
