import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-foreground">
      <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
        M
      </span>
      MeetNote Ai
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

function PwReq({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] transition-colors"
      style={{ color: ok ? "var(--color-foreground)" : "var(--color-tertiary)" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full transition-colors"
        style={{ background: ok ? "var(--color-foreground)" : "var(--color-border-strong)" }}
      />
      {label}
    </span>
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

const FACTS = [
  "People forget about half of new information within an hour, and roughly 70% within a day. Notes are how the other half survives.",
  "The average knowledge worker spends close to 18 hours a week in meetings. Most of what's decided is never written down.",
  "After an interruption it takes about 23 minutes to fully refocus. Not having to take notes keeps you in the room.",
  "We speak around 150 words a minute but type closer to 40. Talking outruns any human trying to write it down.",
  "Working memory holds only about four things at once. Everything past that needs a place to live.",
  "A structured page with decisions and action items is recalled far better than a raw wall-of-text transcript.",
];

function RotatingFact() {
  const [i, setI] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      // wait out the fade before swapping text, then fade back in
      setTimeout(() => {
        setI((prev) => (prev + 1) % FACTS.length);
        setVisible(true);
      }, 400);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-[360px]">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary">
        Did you know
      </div>
      <p
        className="mt-4 font-serif text-[21px] xl:text-[25px] leading-[1.4] text-foreground tracking-[-0.01em] italic transition-opacity duration-[400ms]"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {FACTS[i]}
      </p>
      <div className="mt-6 flex items-center gap-1.5">
        {FACTS.map((_, idx) => (
          <span
            key={idx}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: idx === i ? 18 : 6,
              background: idx === i ? "var(--color-foreground)" : "var(--color-border-strong)",
            }}
          />
        ))}
      </div>
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
      <RotatingFact />

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
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const pwLongEnough = password.length >= 8;
  const pwHasLetter = /[a-zA-Z]/.test(password);
  const pwHasNumber = /[0-9]/.test(password);
  const passwordValid = pwLongEnough && pwHasLetter && pwHasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!passwordValid) {
          setLocalError(
            "Password must be at least 8 characters and include a letter and a number.",
          );
          setSubmitting(false);
          return;
        }
        await register(email, password, displayName);
      }
      // Auth succeeded. If the guest arrived from a protected link (e.g. a
      // meeting URL), send them back there. Only honor internal paths to avoid
      // an open-redirect. No param → fall through to the default dashboard.
      const redirect = searchParams.get("redirect");
      if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        navigate(redirect, { replace: true });
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
                : "Set up your workspace in seconds."}
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
                  placeholder={mode === "login" ? "••••••••" : "At least 8 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === "register" ? 8 : undefined}
                  required
                />
                {mode === "register" && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    <PwReq ok={pwLongEnough} label="8+ characters" />
                    <PwReq ok={pwHasLetter} label="a letter" />
                    <PwReq ok={pwHasNumber} label="a number" />
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
                    I agree to MeetNote Ai's{" "}
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
          <span>&copy; 2026 MeetNote Ai</span>
          <span className="ml-auto">Privacy · Terms</span>
        </div>
      </div>

      {/* Side panel */}
      <SidePanel side={mode === "login" ? "right" : "left"} />
    </div>
  );
}
