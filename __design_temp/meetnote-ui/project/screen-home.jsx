// MeetNote — Home screen + smaller dashboard pieces

// Reusable section header
const SectionHeader = ({ title, action, sub }) => (
  <div className="row between" style={{ marginBottom: 14 }}>
    <div>
      <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>{title}</h2>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 3 }}>{sub}</div>}
    </div>
    {action}
  </div>
);

// ─── Start Meeting hero card ─────────────────────────────────
const StartHero = ({ onStart, onSchedule }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div className="mn-card" style={{
      padding: 0, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(180deg, #111 0%, #1a1a19 100%)',
      color: '#fff', borderColor: 'transparent',
      boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.05)',
    }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    >
      {/* Subtle texture — soft monochrome dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '14px 14px',
        opacity: 1, pointerEvents: 'none',
      }} />
      <div style={{ padding: '36px 36px 32px', position: 'relative', display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '3px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
            fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff', boxShadow: '0 0 0 3px rgba(255,255,255,0.15)' }} />
            Ready when you are
          </div>
          <h1 style={{ fontSize: 32, marginTop: 14, letterSpacing: '-0.03em', color: '#fff', lineHeight: 1.05 }}>
            Start a meeting.
          </h1>
          <p style={{ marginTop: 8, fontSize: 13.5, color: 'rgba(255,255,255,0.62)', maxWidth: 380 }}>
            We'll record, transcribe and write the notes. You stay in the conversation.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="mn-btn lg" style={{
              background: '#fff', color: '#111', borderColor: '#fff',
              boxShadow: hover ? '0 8px 24px rgba(255,255,255,0.15)' : 'none',
              transition: 'box-shadow .2s ease',
            }} onClick={onStart}>
              <Icon name="play" size={11} /> Start meeting
            </button>
            <button className="mn-btn lg" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.18)' }} onClick={onSchedule}>
              <Icon name="plus" size={13} /> Schedule
            </button>
          </div>

          <div style={{ marginTop: 22, display: 'flex', gap: 16, fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
            <span className="row gap-6"><span style={{ width: 5, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.4)' }} /> Auto-record</span>
            <span className="row gap-6"><span style={{ width: 5, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.4)' }} /> Speaker labels</span>
            <span className="row gap-6"><span style={{ width: 5, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.4)' }} /> Notes in &lt;60s</span>
          </div>
        </div>

        {/* Visual: meeting in progress mock */}
        <div style={{
          width: 260, alignSelf: 'stretch',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 18,
          display: 'flex', flexDirection: 'column',
          position: 'relative',
        }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <span style={{
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '3px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
            }}>Preview</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} className="mn-mono">00:14:32</span>
          </div>

          <div className="col gap-8" style={{ flex: 1 }}>
            {[
              { who: 'Sara Kim', txt: 'Let\'s confirm the August 14 ship date — anything blocking?' },
              { who: 'Diego Ortiz', txt: 'Two P0s remain. I\'ll have the playbook by Monday.' },
              { who: 'Mei Tanaka', txt: 'Marketing copy locks Friday, per Sara.', live: true },
            ].map((m, i) => (
              <div key={i} style={{
                background: m.live ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: m.live ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                padding: '8px 10px', borderRadius: 8,
                opacity: 1 - i * 0.0,
              }}>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.02em' }}>{m.who}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 1.45 }}>{m.txt}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#fff', animation: 'mn-pulse 1.6s infinite' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Listening…</span>
            <span style={{ flex: 1 }} />
            <Icon name="mic" size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>
      </div>

      <style>{`@keyframes mn-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,255,255,0.4); } 50% { opacity: 0.5; box-shadow: 0 0 0 5px rgba(255,255,255,0); } }`}</style>
    </div>
  );
};

// ─── Upcoming meeting card ───────────────────────────────────
const UpcomingCard = ({ m, onJoin }) => (
  <div className="mn-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, transition: 'box-shadow .15s ease', minHeight: 200 }}>
    <div className="row gap-12">
      <div style={{
        width: 56, padding: '10px 0', borderRadius: 10,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 500 }}>{m.dow}</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 0, color: 'var(--text)' }} className="tnum">{m.day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{m.date} · {m.time}</div>
      </div>
      {m.status === 'live' && <span className="mn-pill live"><span className="dot" /> Live in 12m</span>}
    </div>

    <div style={{ flex: 1 }} />

    <div className="row between">
      <div className="row gap-8">
        <AvatarGroup names={m.participants} size={22} max={3} />
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{m.participants.length} guests</span>
      </div>
      <button className="mn-btn primary sm" onClick={onJoin}>
        <Icon name="video" size={12} /> Join
      </button>
    </div>
  </div>
);

// ─── Recent meeting row ──────────────────────────────────────
const RecentRow = ({ m }) => (
  <div className="mn-card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'background .12s ease', minHeight: 64 }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
  >
    <div style={{
      width: 36, height: 36, borderRadius: 8,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-2)', flexShrink: 0,
    }}>
      <Icon name="fileText" size={15} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div className="row gap-8">
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
        {m.notes === 'generating' && <span className="mn-ai-dot"><span className="glow" /> Generating</span>}
        {m.notes === 'failed' && <span className="mn-pill" style={{ background: '#fff', color: '#9a3412' }}><span className="dot" style={{ background: '#c2410c' }} /> Failed</span>}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
        {m.when} · {m.duration} · {m.participants.length} attendees
        {m.actions ? ` · ${m.actions} actions` : ''}
      </div>
    </div>
    <AvatarGroup names={m.participants} size={20} max={3} />
    {m.notes === 'ready' && (
      <button className="mn-btn secondary sm">
        Open notes <Icon name="arrowRight" size={11} />
      </button>
    )}
    {m.notes === 'generating' && (
      <button className="mn-btn ghost sm" disabled style={{ opacity: 0.5, cursor: 'default' }}>
        <span style={{ fontSize: 11 }}>~30s</span>
      </button>
    )}
    {m.notes === 'failed' && (
      <button className="mn-btn ghost sm">Retry</button>
    )}
  </div>
);

// ─── Stats strip ─────────────────────────────────────────────
const StatsStrip = () => {
  const stats = [
    { label: 'Meetings this week', value: '12', sub: '+3 vs last' },
    { label: 'Hours captured', value: '8.4', sub: '−1.1 vs last' },
    { label: 'Action items', value: '38', sub: '24 open' },
    { label: 'Notes generated', value: '11', sub: '92% success' },
  ];
  return (
    <div className="mn-card" style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          padding: '18px 22px',
          borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{s.label}</div>
          <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }} className="tnum">{s.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Home Screen ─────────────────────────────────────────────
const HomeScreen = ({ onStart, onSchedule, onJoin }) => (
  <div style={{ padding: '28px 32px 40px', maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
    <div>
      <div className="mn-eyebrow">Tuesday, 14 May</div>
      <h1 style={{ fontSize: 28, marginTop: 4, letterSpacing: '-0.025em' }}>Good morning, Alex.</h1>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>
        You have 3 meetings today. The first starts in 12 minutes.
      </p>
    </div>

    <StartHero onStart={onStart} onSchedule={onSchedule} />

    <StatsStrip />

    <div>
      <SectionHeader
        title="Upcoming"
        sub="Next 7 days"
        action={
          <div className="row gap-6">
            <button className="mn-btn ghost sm">This week</button>
            <button className="mn-btn ghost sm">All <Icon name="arrowRight" size={11} /></button>
          </div>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {MN_UPCOMING.slice(0, 4).map(m => <UpcomingCard key={m.id} m={m} onJoin={onJoin} />)}
      </div>
    </div>

    <div>
      <SectionHeader
        title="Recent meetings"
        sub="Notes ready to read"
        action={<button className="mn-btn ghost sm">View all <Icon name="arrowRight" size={11} /></button>}
      />
      <div className="col gap-8">
        {MN_RECENT.slice(0, 5).map(m => <RecentRow key={m.id} m={m} />)}
      </div>
    </div>
  </div>
);

Object.assign(window, { HomeScreen, StartHero, UpcomingCard, RecentRow, SectionHeader });
