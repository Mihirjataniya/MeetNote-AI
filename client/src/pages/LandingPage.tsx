import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarGroup } from "../components/shell/Avatar";
import { Icon } from "../components/shell/Icon";

/* Marketing renders are served from Cloudinary (f_auto,q_auto) rather than
   client/public, so they stay off the app bundle and out of the PWA cache. */
const CDN = "https://res.cloudinary.com/dgm9tbtvf/image/upload/f_auto,q_auto/meetnote/landing";

const IMG = {
  hero: `${CDN}/Hero-Graphic.png`,
  card1: `${CDN}/CARD1.png`,
  card2: `${CDN}/CARD2.png`,
  card3: `${CDN}/CARD3.png`,
};

/* ------------------------------------------------------------------ *
 * Shared primitives — ports of the design's mn-* utility classes onto
 * the app's Tailwind tokens (see styles/index.css @theme).
 * ------------------------------------------------------------------ */

type BtnVariant = "primary" | "secondary" | "ghost";
type BtnSize = "sm" | "base" | "lg";

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  base: "h-10 px-4 text-[14px] gap-2",
  lg: "h-11 px-5 text-[15px] gap-2",
};

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:
    "shine bg-accent text-accent-foreground border border-accent hover:bg-foreground",
  secondary:
    "shine shine-dark bg-surface text-foreground border border-border-strong hover:bg-surface-hover",
  ghost:
    "bg-transparent text-secondary border border-transparent hover:text-foreground hover:bg-hover",
};

function Btn({
  children,
  variant = "primary",
  size = "base",
  className = "",
  onClick,
}: {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-[10px] font-medium tracking-tight whitespace-nowrap transition-all duration-150 active:scale-[0.98] ${BTN_SIZE[size]} ${BTN_VARIANT[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Eyebrow({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`text-[11px] font-medium uppercase tracking-[0.12em] text-tertiary ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-secondary">
      {children}
    </span>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-none h-px bg-border ${className}`} />;
}

function Logo({ size = "base" }: { size?: "base" | "lg" }) {
  const lg = size === "lg";
  return (
    <span
      className={`inline-flex items-center font-semibold tracking-tight text-foreground ${lg ? "gap-2.5 text-[16px]" : "gap-2 text-[15px]"
        }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-[6px] bg-accent text-accent-foreground font-display font-bold ${lg ? "w-6 h-6 text-[14px]" : "w-[22px] h-[22px] text-[13px]"
          }`}
      >
        M
      </span>
      MeetNote Ai
    </span>
  );
}

/* Horizontal page padding + centered max width, shared by every section. */
const SHELL = "px-6 md:px-14 mx-auto max-w-[1280px]";

/* Animated "data rays" overlay for the hero graphic. Path coordinates are
 * tuned to the 1440×595 Hero-Graphic.png: they trace the connectors from the
 * call (left) into the AI node (centre) and out to the PDF (right). */
const HERO_RAYS: { d: string; dur: number; delay: number }[] = [
  { d: "M 588 150 C 668 152, 700 232, 728 262", dur: 2.6, delay: -0.2 },
  { d: "M 588 185 C 668 187, 700 248, 726 270", dur: 3.1, delay: -1.4 },
  { d: "M 588 222 C 668 224, 700 262, 724 278", dur: 2.3, delay: -0.8 },
  { d: "M 588 258 C 670 259, 702 276, 723 286", dur: 2.9, delay: -2.1 },
  { d: "M 588 292 C 670 292, 700 292, 722 292", dur: 2.4, delay: -1.0 },
  { d: "M 588 328 C 670 327, 702 308, 723 299", dur: 3.3, delay: -0.5 },
  { d: "M 588 363 C 668 362, 700 322, 724 307", dur: 2.5, delay: -1.8 },
  { d: "M 588 399 C 668 397, 700 336, 726 315", dur: 3.0, delay: -0.3 },
  { d: "M 588 434 C 668 432, 700 352, 728 323", dur: 2.7, delay: -1.2 },
  { d: "M 872 262 C 940 232, 990 154, 1058 152", dur: 2.8, delay: -0.9 },
  { d: "M 876 272 C 945 248, 990 198, 1058 196", dur: 2.4, delay: -1.6 },
  { d: "M 878 282 C 945 264, 995 242, 1058 240", dur: 3.2, delay: -0.4 },
  { d: "M 880 292 C 940 292, 1000 292, 1058 292", dur: 2.5, delay: -2.0 },
  { d: "M 878 302 C 945 320, 995 342, 1058 344", dur: 2.9, delay: -0.7 },
  { d: "M 876 312 C 945 336, 990 390, 1058 392", dur: 2.3, delay: -1.3 },
  { d: "M 872 322 C 940 352, 990 436, 1058 438", dur: 3.0, delay: -0.1 },
];

const RAY_DASH = "7 43";

function HeroRays() {
  const anim = (dur: number, delay: number): CSSProperties => ({
    strokeDasharray: RAY_DASH,
    animation: `rayflow ${dur}s linear infinite`,
    animationDelay: `${delay}s`,
  });
  return (
    <svg
      viewBox="0 0 1440 595"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ overflow: "visible" }}
      aria-hidden
    >
      <g fill="none" strokeLinecap="round">
        {/* soft glow */}
        <g stroke="#ffffff" style={{ opacity: 0.5, filter: "blur(4px)" }}>
          {HERO_RAYS.map((r, i) => (
            <path key={i} d={r.d} pathLength={100} strokeWidth={6} style={anim(r.dur, r.delay)} />
          ))}
        </g>
        {/* crisp data bits */}
        <g stroke="#ffffff" strokeWidth={2.2}>
          {HERO_RAYS.map((r, i) => (
            <path key={i} d={r.d} pathLength={100} style={anim(r.dur, r.delay)} />
          ))}
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/* Captures the browser's PWA install prompt so a button can trigger it.
 * `beforeinstallprompt` only fires on Chromium, over https/localhost, once the
 * service worker is registered and the app isn't already installed — so it's
 * absent in dev (SW disabled) and on iOS. Callers fall back accordingly. */
function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    return true;
  };

  return { canInstall: !!deferred && !installed, install };
}

function LandingNav() {
  const nav = useNavigate();
  const { canInstall, install } = useInstallPrompt();

  const handleGet = async () => {
    // Prefer the native install prompt; otherwise send them to sign up.
    if (canInstall && (await install())) return;
    nav("/signin?mode=register");
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center gap-7 px-6 py-3.5 md:px-14">
        <Logo size="lg" />
        <div className="flex-1" />
        <span className="hidden sm:contents">
          <Btn variant="ghost" size="sm" onClick={() => nav("/signin")}>
            Sign in
          </Btn>
        </span>
        <Btn variant="primary" size="sm" onClick={handleGet}>
          {canInstall ? (
            <>
              Get MeetNote <Icon name="download" size={12} />
            </>
          ) : (
            <>
              Get MeetNote Ai <Icon name="arrowRight" size={12} />
            </>
          )}
        </Btn>
      </div>
    </div>
  );
}

function Hero() {
  const nav = useNavigate();
  return (
    <section className={`${SHELL} relative pt-16 pb-14 md:pt-[88px] md:pb-16`}>
      {/* Spotlights thrown in from the two top corners of the viewport toward the
          centre. Full-bleed wrapper (the section itself is container-width), clipped
          so the page never scrolls sideways, and separate from HeroRays so that
          SVG keeps its overflow. */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden"
        aria-hidden
      >
        <div className="hero-spot hero-spot-l" />
        <div className="hero-spot hero-spot-r" />
      </div>

      {/* Decorative aurora blobs drifting behind the headline. */}
      <div className="hero-aura left-[12%] top-[-4%] h-[340px] w-[340px]" aria-hidden />
      <div
        className="hero-aura right-[14%] top-[18%] h-[280px] w-[280px]"
        style={{ animationDelay: "-6s" }}
        aria-hidden
      />

      <div className="relative">
        {/* Copy — centered, stacked above the product visual. */}
        <div className="mx-auto max-w-[860px] text-center">
          <h1
            className="font-display font-semibold text-foreground"
            style={{
              fontSize: "clamp(40px, 7vw, 76px)",
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
            }}
          >
            Turn conversations into{" "}
            <em className="font-serif text-[0.96em] font-normal italic">
              structured
            </em>{" "}
            knowledge.
          </h1>

          <p
            data-reveal
            style={{ transitionDelay: "0.08s" }}
            className="mx-auto mt-6 max-w-[620px] text-[16px] leading-[1.55] text-secondary md:text-[18px]"
          >
            MeetNote Ai captures every meeting, writes the notes you'd write
            yourself, and files them where your team will actually find them.
            Calm by design, legible by default, exportable as polished PDFs.
          </p>

          <div
            data-reveal
            style={{ transitionDelay: "0.16s" }}
            className="mt-8 flex flex-wrap justify-center gap-2.5"
          >
            <Btn
              variant="primary"
              size="lg"
              onClick={() => nav("/signin?mode=register")}
            >
              Get started <Icon name="arrowRight" size={13} />
            </Btn>
            <Btn variant="secondary" size="lg">
              <Icon name="play" size={11} /> Watch a 90-second tour
            </Btn>
          </div>
        </div>

        {/* Product visual — live call → AI processing → PDF summary. */}
        <div
          data-reveal
          style={{ transitionDelay: "0.24s" }}
          className="relative mx-auto mt-14 w-full max-w-[1080px] md:mt-16"
        >
          <img
            src={IMG.hero}
            alt="A MeetNote Ai video call is recorded, processed by AI, and turned into a PDF meeting summary."
            className="block h-auto w-full"
            loading="eager"
            decoding="async"
          />
          <HeroRays />
        </div>
      </div>
    </section>
  );
}

// AI Notes showcase — the centerpiece. Document + speaker sidebar.
function NotesShowcase() {
  const actionItems: [string, string, string][] = [
    ["Sara Kim", "Finalize launch landing-page copy", "Fri 17"],
    ["Diego Ortiz", "Draft rollout playbook v1", "Mon 20"],
    ["Mei Tanaka", "Resolve P0 blocker #482", "Wed 22"],
  ];
  const speakers: [string, string][] = [
    ["Sara Kim", "38%"],
    ["Diego Ortiz", "24%"],
    ["Mei Tanaka", "22%"],
    ["Alex Reyes", "16%"],
  ];

  return (
    <section className={`${SHELL} pb-24 pt-5`}>
      <div
        data-reveal
        className="shine hover-lift overflow-hidden rounded-[14px] border border-border-strong bg-surface shadow-lg"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-2.5 border-b border-border bg-surface px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className="h-[9px] w-[9px] rounded-full bg-surface-muted" />
            <span className="h-[9px] w-[9px] rounded-full bg-surface-muted" />
            <span className="h-[9px] w-[9px] rounded-full bg-surface-muted" />
          </span>
          <div className="hidden flex-1 text-center font-mono text-[12px] text-tertiary sm:block">
            meetnote.app/n/q3-launch-readiness
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-secondary">
            <span className="ai-glow h-1.5 w-1.5 rounded-full bg-gradient-to-br from-foreground to-secondary" />
            Notes generated
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Document */}
          <div className="border-b border-border p-6 md:p-12 lg:border-b-0 lg:border-r lg:px-20">
            <Eyebrow>Meeting Notes</Eyebrow>
            <h2 className="mt-2 font-display text-[28px] tracking-[-0.03em] text-foreground md:text-[36px]">
              Q3 Launch Readiness
            </h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-secondary">
              <span>Tuesday, 14 May · 11:00–11:42</span>
              <span className="h-[3px] w-[3px] rounded-full bg-muted" />
              <AvatarGroup
                names={["Sara Kim", "Diego Ortiz", "Mei Tanaka", "Alex Reyes"]}
                size={20}
              />
              <span>4 attendees</span>
            </div>

            <Divider className="my-7" />

            <h3 className="mb-2.5 text-[16px] font-semibold text-foreground">Summary</h3>
            <p className="text-[14.5px] leading-[1.65] text-foreground">
              The team is on track for the August 14 launch. Engineering closed
              three of the five P0 blockers this week; the remaining two are
              scoped to land before code freeze on July 28. Marketing will share
              the final landing-page copy by Friday.
            </p>

            <h3 className="mb-2.5 mt-6 text-[16px] font-semibold text-foreground">
              Decisions
            </h3>
            <ul className="m-0 list-disc pl-[18px] text-[14.5px] leading-[1.65] text-foreground">
              <li>
                Ship the public beta on <strong>August 14</strong>, gated by
                feature flag.
              </li>
              <li>Defer the Slack integration to the v3.5 release.</li>
              <li>Diego to own the rollout playbook end-to-end.</li>
            </ul>

            <h3 className="mb-2.5 mt-6 text-[16px] font-semibold text-foreground">
              Action items
            </h3>
            <div className="flex flex-col gap-2">
              {actionItems.map(([who, task, due]) => (
                <div
                  key={task}
                  className="flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3 py-2.5"
                >
                  <span className="h-3.5 w-3.5 shrink-0 rounded border-[1.5px] border-border-focused" />
                  <Avatar name={who} size={20} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-foreground">
                    {task}
                  </span>
                  <span className="shrink-0">
                    <Pill>
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
                      {due}
                    </Pill>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail */}
          <div className="bg-background p-6 md:p-8">
            <Eyebrow className="mb-3">Speakers</Eyebrow>
            {speakers.map(([n, p]) => (
              <div key={n} className="flex items-center gap-2.5 py-2">
                <Avatar name={n} size={26} />
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium text-foreground">{n}</div>
                  <div className="relative mt-1.5 h-[3px] overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="bar-fill absolute inset-y-0 left-0 rounded-full bg-foreground"
                      style={{ ["--w" as string]: p } as CSSProperties}
                    />
                  </div>
                </div>
                <span className="font-mono text-[11px] text-tertiary tabular-nums">
                  {p}
                </span>
              </div>
            ))}

            <Divider className="my-6" />

            <Eyebrow className="mb-3">Mentioned</Eyebrow>
            <div className="flex flex-wrap gap-1.5">
              {["#q3-launch", "#beta", "#playbook", "#code-freeze", "@diego", "@sara"].map(
                (t) => (
                  <Pill key={t}>{t}</Pill>
                ),
              )}
            </div>

            <Divider className="my-6" />

            <Btn variant="secondary" size="sm" className="w-full">
              <Icon name="download" size={13} /> Export as PDF
            </Btn>
            <Btn variant="ghost" size="sm" className="mt-1.5 w-full">
              <Icon name="link" size={13} /> Share read-only link
            </Btn>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-[12px] text-tertiary">
        Sample export · the same document layout ships as PDF.
      </div>
    </section>
  );
}



/* ------------------------------------------------------------------ *
 * Architecture diagram — the real path a meeting takes through the
 * system, drawn once in a 1260x380 viewBox so every label, box and ray
 * scales together. Same animated-ray trick as the hero graphic.
 * ------------------------------------------------------------------ */

type ArchShape = "window" | "box" | "queue" | "cylinder";

type ArchNode = {
  id: string;
  shape: ArchShape;
  x: number;
  y: number;
  w: number;
  h: number;
  t: string;
  cap: string[];
  tag?: string;
};

/* Trust boundaries. Everything inside one dashed box runs in the same place and
   fails together, which is the thing a plain flow chart can't show. */
const ARCH_ZONES: { label: string; x: number; y: number; w: number; h: number }[] = [
  { label: "Client", x: 40, y: 60, w: 380, h: 250 },
  { label: "Real-time edge", x: 470, y: 60, w: 460, h: 250 },
  { label: "Async pipeline — runs after the call", x: 150, y: 370, w: 1090, h: 230 },
  { label: "Data", x: 340, y: 660, w: 560, h: 130 },
];

const ARCH_NODES: ArchNode[] = [
  {
    id: "client",
    shape: "window",
    x: 80,
    y: 110,
    w: 300,
    h: 120,
    t: "Browser",
    cap: ["Records its own microphone in short", "chunks — capture never leaves the tab"],
    tag: "× N",
  },
  {
    id: "gateway",
    shape: "box",
    x: 510,
    y: 104,
    w: 380,
    h: 64,
    t: "Signalling gateway",
    cap: [],
  },
  {
    id: "media",
    shape: "box",
    x: 510,
    y: 190,
    w: 380,
    h: 64,
    t: "Media relay",
    cap: ["Forwards streams between peers. Nothing", "joins the call and nothing records it."],
  },
  {
    id: "broker",
    shape: "queue",
    x: 200,
    y: 420,
    w: 200,
    h: 96,
    t: "Message broker",
    cap: ["One job per stage,", "retried on failure"],
  },
  {
    id: "stt",
    shape: "box",
    x: 470,
    y: 420,
    w: 220,
    h: 96,
    t: "Speech-to-text",
    cap: ["Chunks stitched into one", "speaker-labelled transcript"],
  },
  {
    id: "store",
    shape: "cylinder",
    x: 740,
    y: 414,
    w: 160,
    h: 108,
    t: "Object store",
    cap: ["Archived audio"],
  },
  {
    id: "llm",
    shape: "box",
    x: 960,
    y: 420,
    w: 220,
    h: 96,
    t: "LLM",
    cap: ["Drafts summary, decisions", "and action items"],
  },
  {
    id: "db",
    shape: "cylinder",
    x: 390,
    y: 686,
    w: 200,
    h: 88,
    t: "Database",
    cap: [],
  },
  {
    id: "export",
    shape: "box",
    x: 650,
    y: 698,
    w: 210,
    h: 64,
    t: "PDF export",
    cap: [],
  },
];

/* Edges carry their protocol, the way an architecture doc would. Solid means it
   happens while you are in the call; dashed means it happens afterwards. */
type ArchEdge = {
  d: string;
  label: string;
  lx: number;
  ly: number;
  async?: boolean;
  dur: number;
  delay: number;
};

const ARCH_EDGES: ArchEdge[] = [
  { d: "M 380 148 C 440 148, 450 136, 510 136", label: "WebSocket · JWT", lx: 445, ly: 118, dur: 2.2, delay: -0.2 },
  { d: "M 380 200 C 440 200, 450 222, 510 222", label: "WebRTC · SRTP", lx: 445, ly: 244, dur: 2.0, delay: -1.1 },
  {
    d: "M 700 254 C 700 340, 300 330, 300 420",
    label: "enqueued when the last participant leaves",
    lx: 520,
    ly: 338,
    async: true,
    dur: 3.4,
    delay: -0.7,
  },
  { d: "M 400 468 L 470 468", label: "batch", lx: 435, ly: 450, async: true, dur: 2.0, delay: -1.6 },
  { d: "M 690 468 L 740 468", label: "audio", lx: 715, ly: 450, async: true, dur: 2.0, delay: -0.5 },
  { d: "M 900 468 L 960 468", label: "transcript", lx: 930, ly: 450, async: true, dur: 2.0, delay: -1.3 },
  {
    d: "M 1070 516 C 1070 640, 720 616, 490 686",
    label: "persist",
    lx: 830,
    ly: 634,
    async: true,
    dur: 3.2,
    delay: -0.9,
  },
  { d: "M 590 730 L 650 730", label: "render", lx: 620, ly: 712, async: true, dur: 2.0, delay: -2.0 },
  {
    d: "M 390 730 C 230 742, 80 720, 80 430 C 80 300, 140 250, 228 232",
    label: "notes + PDF · HTTPS",
    lx: 98,
    ly: 636,
    async: true,
    dur: 4.2,
    delay: -0.3,
  },
];

/* A chip behind each edge label, so the connector never runs through the text. */
function EdgeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 5.9 + 16;
  return (
    <g>
      <rect x={x - w / 2} y={y - 11} width={w} height={20} rx={6} fill="var(--background)" />
      <text
        x={x}
        y={y + 3}
        textAnchor="middle"
        fill="var(--tertiary)"
        fontFamily="var(--font-mono)"
        fontSize={11}
      >
        {text}
      </text>
    </g>
  );
}

/* Each component is drawn as the symbol it is — a window, a queue with slots, a
   cylinder — instead of one generic card with an icon dropped into it. */
function ArchShapeNode({ node }: { node: ArchNode }) {
  const { shape, x, y, w, h } = node;
  const cx = x + w / 2;
  const ry = 14;

  const outline =
    shape === "cylinder" ? (
      <>
        <path
          d={`M ${x} ${y + ry} V ${y + h - ry} a ${w / 2} ${ry} 0 0 0 ${w} 0 V ${y + ry}`}
          fill="var(--surface)"
          stroke="var(--border-strong)"
        />
        <ellipse cx={cx} cy={y + ry} rx={w / 2} ry={ry} fill="var(--surface-hover)" stroke="var(--border-strong)" />
      </>
    ) : (
      <>
        <rect x={x} y={y} width={w} height={h} rx={12} fill="var(--surface)" stroke="var(--border-strong)" />
        {shape === "window" && (
          <>
            <path d={`M ${x} ${y + 30} H ${x + w}`} stroke="var(--border-strong)" />
            <path
              d={`M ${x + 18} ${y + 15} h 0.01 M ${x + 32} ${y + 15} h 0.01 M ${x + 46} ${y + 15} h 0.01`}
              stroke="var(--muted)"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </>
        )}
        {shape === "queue" && (
          <>
            <path d={`M ${x + 16} ${y + 34} H ${x + w - 16}`} stroke="var(--border-strong)" />
            {[0.34, 0.5, 0.66].map((f) => (
              <path key={f} d={`M ${x + w * f} ${y + 34} V ${y + h - 16}`} stroke="var(--border-strong)" />
            ))}
          </>
        )}
      </>
    );

  /* The title sits under the lid of a cylinder, and centred everywhere else. */
  const titleY =
    shape === "cylinder"
      ? y + h / 2 + 12
      : shape === "window"
        ? y + 30 + (h - 30) / 2 + 6
        : y + h / 2 + 6;

  return (
    <g>
      <g fill="none" strokeWidth={1.25}>
        {outline}
      </g>

      <text
        x={cx}
        y={titleY}
        textAnchor="middle"
        fill="var(--foreground)"
        fontFamily="var(--font-display)"
        fontSize={17}
        fontWeight={600}
        letterSpacing="-0.01em"
      >
        {node.t}
      </text>

      {node.tag && (
        <>
          <rect x={x + w - 60} y={y + 44} width={44} height={22} rx={7} fill="var(--hover)" />
          <text
            x={x + w - 38}
            y={y + 59}
            textAnchor="middle"
            fill="var(--secondary)"
            fontFamily="var(--font-mono)"
            fontSize={11}
          >
            {node.tag}
          </text>
        </>
      )}

      {node.cap.map((line, i) => (
        <text key={i} x={cx} y={y + h + 24 + i * 18} textAnchor="middle" fill="var(--tertiary)" fontSize={12.5}>
          {line}
        </text>
      ))}
    </g>
  );
}

function ArchDiagram() {
  const ray = (dur: number, delay: number): CSSProperties => ({
    strokeDasharray: RAY_DASH,
    animation: `rayflow ${dur}s linear infinite`,
    animationDelay: `${delay}s`,
  });

  return (
    <svg
      viewBox="0 0 1280 830"
      className="block h-auto w-full min-w-[960px]"
      role="img"
      aria-label="Architecture diagram. In the client zone, each browser records its own microphone. Over WebSocket and WebRTC it reaches the real-time edge: a signalling gateway and a media relay. When the last participant leaves, work is enqueued to the async pipeline, where a message broker feeds speech-to-text, an object store, and an LLM. Results are persisted to the database, rendered to PDF, and returned to the browser over HTTPS."
    >
      <defs>
        <marker
          id="arch-arrow"
          viewBox="0 0 8 8"
          refX={6.5}
          refY={4}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 1 1 L 6 4 L 1 7" fill="none" stroke="var(--border-focused)" strokeWidth={1.5} />
        </marker>
      </defs>

      {/* Trust boundaries */}
      {ARCH_ZONES.map((z) => (
        <g key={z.label}>
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx={18}
            fill="var(--hover)"
            fillOpacity={0.35}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="6 6"
          />
          <text
            x={z.x + 20}
            y={z.y + 26}
            fill="var(--muted)"
            fontFamily="var(--font-mono)"
            fontSize={11}
            letterSpacing="0.14em"
          >
            {z.label.toUpperCase()}
          </text>
        </g>
      ))}

      {/* Connector rails — dashed ones only happen once the call has ended. */}
      <g fill="none" stroke="var(--border-strong)" strokeWidth={1.5} markerEnd="url(#arch-arrow)">
        {ARCH_EDGES.map((e, i) => (
          <path key={i} d={e.d} strokeDasharray={e.async ? "5 6" : undefined} />
        ))}
      </g>

      {/* Travelling data — a soft glow pass under a crisp one. */}
      <g fill="none" stroke="var(--foreground)" strokeLinecap="round">
        <g style={{ opacity: 0.4, filter: "blur(3px)" }}>
          {ARCH_EDGES.map((e, i) => (
            <path
              key={i}
              className="arch-ray"
              d={e.d}
              pathLength={100}
              strokeWidth={5}
              style={ray(e.dur, e.delay)}
            />
          ))}
        </g>
        <g strokeWidth={2}>
          {ARCH_EDGES.map((e, i) => (
            <path key={i} className="arch-ray" d={e.d} pathLength={100} style={ray(e.dur, e.delay)} />
          ))}
        </g>
      </g>

      {ARCH_NODES.map((n) => (
        <ArchShapeNode key={n.id} node={n} />
      ))}

      {ARCH_EDGES.map((e, i) => (
        <EdgeLabel key={i} x={e.lx} y={e.ly} text={e.label} />
      ))}

      {/* Legend */}
      <g transform="translate(900, 808)">
        <path d="M 0 -4 H 34" stroke="var(--border-strong)" strokeWidth={1.5} fill="none" />
        <text x={44} y={0} fill="var(--muted)" fontFamily="var(--font-mono)" fontSize={11}>
          during the call
        </text>
        <path
          d="M 172 -4 H 206"
          stroke="var(--border-strong)"
          strokeWidth={1.5}
          strokeDasharray="5 6"
          fill="none"
        />
        <text x={216} y={0} fill="var(--muted)" fontFamily="var(--font-mono)" fontSize={11}>
          after everyone leaves
        </text>
      </g>
    </svg>
  );
}

/* The same graph, walked in order, for screens too narrow to hold the diagram.
   Sideways-scrolling a 1000px canvas on a phone just hides half the system, so
   the zones become headers and the edges become the rail down the left. */
const ARCH_STEPS: {
  zone?: string;
  t: string;
  cap: string;
  edge?: string;
  async?: boolean;
}[] = [
  {
    zone: "Client",
    t: "Browser  × N",
    cap: "Records its own microphone in short chunks — capture never leaves the tab.",
    edge: "WebSocket · JWT   ·   WebRTC · SRTP",
  },
  {
    zone: "Real-time edge",
    t: "Signalling gateway + media relay",
    cap: "Forwards streams between peers. Nothing joins the call and nothing records it.",
    edge: "enqueued when the last participant leaves",
    async: true,
  },
  {
    zone: "Async pipeline — runs after the call",
    t: "Message broker",
    cap: "One job per stage, retried on failure.",
    edge: "batch",
    async: true,
  },
  {
    t: "Speech-to-text",
    cap: "Chunks stitched into one speaker-labelled transcript.",
    edge: "audio",
    async: true,
  },
  { t: "Object store", cap: "Archived audio.", edge: "transcript", async: true },
  {
    t: "LLM",
    cap: "Drafts summary, decisions and action items.",
    edge: "persist",
    async: true,
  },
  {
    zone: "Data",
    t: "Database → PDF export",
    cap: "Notes are stored, then rendered for download.",
    edge: "notes + PDF · HTTPS",
    async: true,
  },
  { t: "Back in your browser", cap: "Ready to read, share, or export." },
];

function ArchSteps() {
  return (
    <ol className="mt-10 lg:hidden">
      {ARCH_STEPS.map((step) => (
        <li key={step.t}>
          {step.zone && (
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {step.zone}
            </div>
          )}

          <div className="rounded-[14px] border border-border-strong bg-surface px-4 py-3.5">
            <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">
              {step.t}
            </div>
            <p className="mt-1.5 text-[13px] leading-[1.5] text-tertiary">{step.cap}</p>
          </div>

          {step.edge && (
            <div className="flex items-stretch gap-3 py-2 pl-5">
              {/* The rail: dashed once the work has left the call. */}
              <span
                className={`w-px shrink-0 ${step.async ? "border-l border-dashed border-border-strong" : "bg-border-strong"}`}
                aria-hidden
              />
              <span className="py-2 font-mono text-[11px] leading-[1.4] text-tertiary">
                {step.edge}
              </span>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function Architecture() {
  return (
    <section className={`${SHELL} pb-16 pt-8`}>
      <div data-reveal className="mx-auto max-w-[720px] text-center">
        <Eyebrow>Under the hood</Eyebrow>
        <h2
          className="mt-4 font-display font-semibold text-foreground"
          style={{ fontSize: "clamp(28px, 3.4vw, 42px)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
        >
          How a meeting becomes a document.
        </h2>
        <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.6] text-secondary md:text-[16px]">
          The call and the write-up are two different systems. Everything solid
          happens live, in the room. Everything dashed happens on a queue after
          the last person has hung up, so a slow model never slows a meeting.
        </p>
      </div>

      {/* Scrolls sideways on phones rather than shrinking the labels away. */}
      {/* Phones get the stacked walk-through; the canvas only appears once
          there is room for its labels to stay legible. */}
      <ArchSteps />

      <div
        data-reveal
        style={{ transitionDelay: "0.1s" }}
        className="mt-12 hidden overflow-x-auto pb-2 [scrollbar-width:thin] lg:block"
      >
        <ArchDiagram />
      </div>

      <div data-reveal style={{ transitionDelay: "0.16s" }} className="mt-8 flex flex-wrap justify-center gap-2">
        <Pill>
          <Icon name="video" size={12} /> WebRTC media server
        </Pill>
        <Pill>
          <Icon name="mic" size={12} /> Speaker-aware speech-to-text
        </Pill>
        <Pill>
          <Icon name="layers" size={12} /> Queue-driven pipeline
        </Pill>
        <Pill>
          <Icon name="sparkle" size={12} /> LLM write-up, with a fallback model
        </Pill>
        <Pill>
          <Icon name="fileText" size={12} /> PDF export
        </Pill>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  img: string;
  /** utility classes controlling how the render sits in the visual well;
   *  CARD1/CARD3 bake text, so they're cropped (object-top) to the visual. */
  imgClass: string;
  icon: string;
  title: string;
  body: string;
  /** optional CSS 3D transform for perspective on the outer cards. */
  tilt?: string;
  delay?: number;
}

function FeatureCard({ img, imgClass, icon, title, body, tilt, delay }: FeatureCardProps) {
  return (
    <div data-reveal style={{
      perspective: "1000px",
      transitionDelay: delay ? `${delay}s` : undefined,
    }}>
      <div
        style={tilt ? { transform: tilt } : undefined}
        className="flex flex-col rounded-[24px] border border-white/10 bg-[#0e0e12] p-4 shadow-[0_34px_64px_-28px_rgba(0,0,0,0.7)]"
      >
        {/* Visual well — the render sits here as a picture, not the card. */}
        <div className="overflow-hidden">
          <img
            src={img}
            alt={title}
            className={`w-full h-full grayscale ${imgClass}`}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Copy */}
        <div className="px-1 pb-1 pt-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] bg-white/[0.12] text-white">
            <Icon name={icon} size={19} />
          </span>
          <h3 className="mt-5 text-[20px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
            {title}
          </h3>
          <p className="mt-3 text-[14px] leading-[1.6] text-white/55">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className={`${SHELL} pb-24 pt-10`}>
      <div
        className="grid grid-cols-1 items-center gap-6 md:grid-cols-3"
        style={{ perspective: "1600px" }}
      >
        <FeatureCard
          img={IMG.card1}
          imgClass="h-[210px] object-cover object-top"
          icon="list"
          title="Notes that read like a colleague wrote them."
          body="Speaker-aware summaries, decisions, and action items in a layout designed for reading, not for parsing transcripts."
          tilt="rotateY(14deg)"
        />
        <FeatureCard
          img={IMG.card2}
          imgClass="h-[210px] object-contain"
          icon="fileText"
          title="A document, not a transcript."
          body="Every meeting becomes a structured page with sections, citations, and a clean type hierarchy. Export to PDF in one click."
          delay={0.09}
        />
        <FeatureCard
          img={IMG.card3}
          imgClass="h-[210px] object-cover object-top"
          icon="users"
          title="Quiet collaboration."
          body="Reactions, comments, and assignments live in the margins. No flashing dots, no noisy notifications, your team stays in flow."
          tilt="rotateY(-14deg)"
          delay={0.18}
        />
      </div>
    </section>
  );
}



function Workflow() {
  const steps = [
    {
      n: "01",
      t: "Capture",
      d: "Drop MeetNote Ai into any video call or upload a recording. We listen in the background, with no bot in the room.",
    },
    {
      n: "02",
      t: "Synthesize",
      d: "Within 60 seconds of hang-up, you get a structured page: summary, decisions, action items, citations.",
    },
    {
      n: "03",
      t: "Distribute",
      d: "Share a read-only link, export a polished PDF, or pipe the action items into your task tool of choice.",
    },
  ];

  return (
    <section className={`${SHELL} pb-24 pt-10`}>
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[380px_1fr] lg:gap-20">
        <div data-reveal>
          <Eyebrow>Workflow</Eyebrow>
          <h2 className="mt-3 font-display text-[36px] leading-none tracking-[-0.03em] text-foreground md:text-[44px]">
            Three quiet steps.
            <br />
            No new habits.
          </h2>
          <p className="mt-[18px] text-[15px] leading-[1.55] text-secondary">
            MeetNote Ai slots into the meetings you already run. You leave the call
            with a finished document, not a homework assignment.
          </p>
        </div>
        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.n}
              data-reveal
              style={{ transitionDelay: `${i * 0.1}s` }}
              className="group grid grid-cols-[60px_1fr] gap-6 border-t border-border py-6 transition-colors duration-300 hover:border-border-focused md:grid-cols-[90px_1fr]"
            >
              <div className="pt-1 font-mono text-[13px] text-tertiary transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground">
                {s.n}
              </div>
              <div>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">
                  {s.t}
                </h3>
                <p className="mt-2 max-w-[520px] text-[14.5px] leading-[1.6] text-secondary">
                  {s.d}
                </p>
              </div>
            </div>
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  );
}



function CTABand() {
  const nav = useNavigate();
  return (
    <section className={`${SHELL} pb-24 pt-10`}>
      <div
        data-reveal
        className="cta-sheen grid grid-cols-1 items-end gap-10 rounded-[24px] bg-foreground px-8 py-12 md:grid-cols-[1fr_auto] md:px-14 md:py-16"
      >
        <div>
          <Eyebrow className="text-background/50">Try MeetNote Ai</Eyebrow>
          <h2
            className="mt-3.5 font-display text-background"
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            Clarity after meetings.
          </h2>
          <p className="mt-[18px] max-w-[480px] text-[16px] text-background/70">
            Two minutes to set up. No bot in your call, no new habits, just a
            finished document waiting when you hang up.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => nav("/signin?mode=register")}
            className="shine shine-dark inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-background bg-background px-5 text-[15px] font-medium tracking-tight text-foreground transition-all duration-150 hover:brightness-95 active:scale-[0.98]"
          >
            Get started <Icon name="arrowRight" size={13} />
          </button>
          <button className="inline-flex h-11 items-center justify-center rounded-[10px] border border-transparent px-5 text-[15px] font-medium tracking-tight text-background transition-colors duration-150 hover:bg-white/10">
            Book a 15-min demo
          </button>
        </div>
      </div>
    </section>
  );
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do I need to install anything, or add a bot to my call?",
    a: "No. There's no bot avatar sitting in the meeting. The host starts MeetNote Ai and participants just join with a room ID in the browser, and it records in the background.",
  },
  {
    q: "How soon do I get my notes after a meeting?",
    a: "Usually within about a minute of hang-up. You get a structured page: a summary, the decisions, action items, and a speaker breakdown, not a raw transcript.",
  },
  {
    q: "What's actually in the notes?",
    a: "A readable document: a short summary, the decisions made, action items with owners, and who spoke about what, written the way a colleague would, not a wall of transcript text.",
  },
  {
    q: "Is MeetNote Ai free?",
    a: "Yes, and it stays that way for as long as I can keep running it on free resources.",
  },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className={`${SHELL} pb-24 pt-10`}>
      <div className="mx-auto max-w-[760px]">
        <Eyebrow className="text-center">FAQ</Eyebrow>
        <h2
          data-reveal
          className="mt-3 text-center font-display text-[34px] leading-[1.05] tracking-[-0.03em] text-foreground md:text-[44px]"
        >
          Questions, answered.
        </h2>

        <div data-reveal className="mt-10 border-t border-border">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-border">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 py-5 text-left"
                >
                  <span className="flex-1 text-[16px] font-medium tracking-tight text-foreground md:text-[17px]">
                    {f.q}
                  </span>
                  <Icon
                    name="chevronDown"
                    size={18}
                    className={`shrink-0 text-tertiary transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.2,0.7,0.3,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="pb-5 pr-8 text-[14.5px] leading-[1.65] text-secondary">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const SOCIALS: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "X (Twitter)",
    href: "https://x.com/devwithdelulu",
    icon: (
      <svg width={15} height={15} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M9.52 6.77L15.48 0h-1.41L8.9 5.88 4.76 0H0l6.25 8.9L0 16h1.41l5.47-6.21L11.24 16H16L9.52 6.77zM7.6 8.98l-.63-.89L1.92 1.04h2.17l4.07 5.7.63.89 5.29 7.41h-2.17L7.6 8.98z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/mihir-jataniya/",
    icon: (
      <svg width={15} height={15} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M13.63 13.63h-2.37V9.9c0-.89-.02-2.03-1.24-2.03-1.24 0-1.43.97-1.43 1.97v3.79H6.22V6h2.28v1.04h.03c.32-.6 1.09-1.24 2.25-1.24 2.41 0 2.85 1.58 2.85 3.64v4.19zM3.55 4.96a1.38 1.38 0 110-2.76 1.38 1.38 0 010 2.76zm1.19 8.67H2.36V6h2.38v7.63zM14.82 0H1.18C.53 0 0 .52 0 1.16v13.68C0 15.48.53 16 1.18 16h13.64c.65 0 1.18-.52 1.18-1.16V1.16C16 .52 15.47 0 14.82 0z" />
      </svg>
    ),
  },
  {
    label: "GitHub repository",
    href: "https://github.com/Mihirjataniya/MeetNote-AI",
    icon: (
      <svg width={15} height={15} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:mihirjataniya1612@gmail.com",
    icon: <Icon name="mail" size={15} />,
  },
];

function Footer() {
  return (
    <footer className={`${SHELL} border-t border-border pb-14 pt-9`}>
      <div
        data-reveal
        className="flex flex-col gap-6 pt-9 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <Logo size="lg" />
          <p className="mt-3.5 max-w-[320px] text-[13px] leading-relaxed text-tertiary">
            Made by{" "}
            <a
              href="https://github.com/Mihirjataniya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline decoration-border-strong underline-offset-2 transition-colors hover:text-foreground"
            >
              Mihir Jataniya
            </a>
            . A personal project, no outside funding. No bot in your call.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              title={s.label}
              aria-label={s.label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-border text-secondary transition-colors hover:border-border-focused hover:text-foreground"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-12 flex flex-wrap items-center gap-3.5 border-t border-border pt-5 text-[12px] text-tertiary">
        <span>© 2026 MeetNote Ai</span>
        <span>·</span>
        <span>Built for learning, shared for fun</span>
      </div>
    </footer>
  );
}

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Reveal-on-scroll: unhide each [data-reveal] the first time it enters view.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { root, threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    // Top scroll-progress bar tracks the container's scroll position.
    const onScroll = () => {
      const bar = barRef.current;
      if (!bar) return;
      const max = root.scrollHeight - root.clientHeight;
      bar.style.setProperty("--p", max > 0 ? String(root.scrollTop / max) : "0");
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      root.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative h-full overflow-y-auto overflow-x-hidden bg-background text-foreground"
    >
      <div className="sticky top-0 z-40 h-[2px] w-full bg-transparent">
        <div ref={barRef} className="scroll-progress h-full w-full bg-foreground" />
      </div>
      <LandingNav />
      <Hero />
      <NotesShowcase />
      <Architecture />
      <Features />
      <Workflow />
      <CTABand />
      <Faq />
      <Footer />
    </div>
  );
}
