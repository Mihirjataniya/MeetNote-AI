// MeetNote — Landing page
// 1440 width design. Editorial, monochrome, calm.

const LandingNav = () => (
  <div style={{
    position: 'sticky', top: 0, zIndex: 20,
    padding: '14px 56px',
    display: 'flex', alignItems: 'center', gap: 28,
    background: 'rgba(250, 250, 250, 0.78)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid var(--border)',
  }}>
    <Logo size="lg" />
    <nav style={{ display: 'flex', gap: 22, marginLeft: 32 }}>
      {['Product', 'Solutions', 'Customers', 'Pricing', 'Changelog'].map(l => (
        <a key={l} style={{ fontSize: 13.5, color: 'var(--text-2)', textDecoration: 'none', cursor: 'pointer' }}>{l}</a>
      ))}
    </nav>
    <div style={{ flex: 1 }} />
    <button className="mn-btn ghost sm">Sign in</button>
    <button className="mn-btn primary sm">Get MeetNote <Icon name="arrowRight" size={12} /></button>
  </div>
);

const Hero = () => (
  <section style={{ padding: '88px 56px 64px', maxWidth: 1280, margin: '0 auto' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 4px 4px 12px', border: '1px solid var(--border-2)', borderRadius: 999, background: 'var(--surface)', fontSize: 12, color: 'var(--text-2)' }}>
      <span>New — Speaker-aware summaries</span>
      <span style={{ padding: '3px 9px', background: 'var(--text)', color: '#fff', borderRadius: 999, fontWeight: 500 }}>v3.4 ↗</span>
    </div>

    <h1 style={{
      fontSize: 84, lineHeight: 0.98, marginTop: 28,
      letterSpacing: '-0.04em', fontWeight: 600,
      maxWidth: 980,
    }}>
      Turn conversations<br/>
      into <em style={{ fontStyle: 'italic', fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 400 }}>structured</em> knowledge.
    </h1>

    <p style={{
      maxWidth: 560, marginTop: 28, fontSize: 18, lineHeight: 1.55, color: 'var(--text-2)',
    }}>
      MeetNote captures every meeting, writes the notes you'd write yourself,
      and files them where your team will actually find them. Calm by design,
      legible by default, exportable as polished PDFs.
    </p>

    <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
      <button className="mn-btn primary lg">Start free <Icon name="arrowRight" size={13} /></button>
      <button className="mn-btn secondary lg"><Icon name="play" size={11} /> Watch a 90-second tour</button>
    </div>

    <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
      <span className="row gap-6"><Icon name="check" size={13} /> SOC 2 Type II</span>
      <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--text-4)' }} />
      <span className="row gap-6"><Icon name="check" size={13} /> No credit card</span>
      <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--text-4)' }} />
      <span className="row gap-6"><Icon name="check" size={13} /> 14-day trial</span>
    </div>
  </section>
);

// AI Notes showcase — the centerpiece. Two-column: document + sidebar
const NotesShowcase = () => (
  <section style={{ padding: '20px 56px 100px', maxWidth: 1280, margin: '0 auto' }}>
    <div className="mn-card" style={{
      padding: 0, overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 40px 80px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.04)',
      border: '1px solid var(--border-2)',
    }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)' }}>
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: '#E5E5E5' }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: '#E5E5E5' }} />
          <span style={{ width: 9, height: 9, borderRadius: 999, background: '#E5E5E5' }} />
        </span>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }} className="mn-mono">
          meetnote.app/n/q3-launch-readiness
        </div>
        <span className="mn-ai-dot"><span className="glow" /> Notes generated</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 580 }}>
        {/* Doc */}
        <div style={{ padding: '48px 80px', borderRight: '1px solid var(--border)' }}>
          <div className="mn-eyebrow">Meeting Notes</div>
          <h2 style={{ fontSize: 36, marginTop: 8, letterSpacing: '-0.03em' }}>Q3 Launch Readiness</h2>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-2)' }}>
            <span>Tuesday, 14 May · 11:00–11:42</span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: 'var(--text-4)' }} />
            <AvatarGroup names={['Sara Kim', 'Diego Ortiz', 'Mei Tanaka', 'Alex Reyes']} size={20} />
            <span>4 attendees</span>
          </div>

          <hr className="mn-divider" style={{ margin: '28px 0' }} />

          <h3 style={{ fontSize: 16, marginBottom: 10 }}>Summary</h3>
          <p style={{ color: 'var(--text)', lineHeight: 1.65, fontSize: 14.5 }}>
            The team is on track for the August 14 launch. Engineering closed
            three of the five P0 blockers this week; the remaining two are scoped
            to land before code freeze on July 28. Marketing will share the final
            landing-page copy by Friday.
          </p>

          <h3 style={{ fontSize: 16, margin: '24px 0 10px' }}>Decisions</h3>
          <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--text)', fontSize: 14.5, lineHeight: 1.65 }}>
            <li>Ship the public beta on <strong>August 14</strong>, gated by feature flag.</li>
            <li>Defer the Slack integration to the v3.5 release.</li>
            <li>Diego to own the rollout playbook end-to-end.</li>
          </ul>

          <h3 style={{ fontSize: 16, margin: '24px 0 10px' }}>Action items</h3>
          <div className="col gap-8">
            {[
              ['Sara Kim', 'Finalize launch landing-page copy', 'Fri 17'],
              ['Diego Ortiz', 'Draft rollout playbook v1', 'Mon 20'],
              ['Mei Tanaka', 'Resolve P0 blocker #482', 'Wed 22'],
            ].map(([who, task, due]) => (
              <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)' }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, border: '1.5px solid var(--border-3)' }} />
                <Avatar name={who} size={20} />
                <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{task}</span>
                <span style={{ flex: 1 }} />
                <span className="mn-pill"><span className="dot" />{due}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right rail */}
        <div style={{ padding: '32px 24px', background: 'var(--bg)' }}>
          <div className="mn-eyebrow" style={{ marginBottom: 12 }}>Speakers</div>
          {[['Sara Kim', '38%'], ['Diego Ortiz', '24%'], ['Mei Tanaka', '22%'], ['Alex Reyes', '16%']].map(([n, p]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <Avatar name={n} size={26} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{n}</div>
                <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 999, marginTop: 5, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, width: p, background: 'var(--text)', borderRadius: 999 }} />
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }} className="tnum">{p}</span>
            </div>
          ))}

          <hr className="mn-divider" style={{ margin: '24px 0' }} />

          <div className="mn-eyebrow" style={{ marginBottom: 12 }}>Mentioned</div>
          <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
            {['#q3-launch', '#beta', '#playbook', '#code-freeze', '@diego', '@sara'].map(t => (
              <span key={t} className="mn-pill">{t}</span>
            ))}
          </div>

          <hr className="mn-divider" style={{ margin: '24px 0' }} />

          <button className="mn-btn secondary sm" style={{ width: '100%' }}>
            <Icon name="download" size={13} /> Export as PDF
          </button>
          <button className="mn-btn ghost sm" style={{ width: '100%', marginTop: 6 }}>
            <Icon name="link" size={13} /> Share read-only link
          </button>
        </div>
      </div>
    </div>

    <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
      Sample export · the same document layout ships as PDF.
    </div>
  </section>
);

// Logo wall
const LogoWall = () => (
  <section style={{ padding: '0 56px 80px', maxWidth: 1280, margin: '0 auto' }}>
    <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 26 }}>
      Trusted by calm, deliberate teams
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 24, alignItems: 'center' }}>
      {['Northwind', 'Quiverlane', 'Folio', 'Mesa.', 'Halcyon', 'Plate & Co'].map(name => (
        <div key={name} style={{
          fontFamily: 'Georgia, serif', fontSize: 22, color: 'var(--text-3)',
          textAlign: 'center', fontWeight: 500, letterSpacing: '-0.02em',
        }}>{name}</div>
      ))}
    </div>
  </section>
);

// Three-up feature section
const Features = () => {
  const items = [
    {
      title: 'Notes that read like a colleague wrote them.',
      body: 'Speaker-aware summaries, decisions, and action items in a layout designed for reading — not for parsing transcripts.',
      visual: 'doc',
    },
    {
      title: 'A document, not a transcript.',
      body: 'Every meeting becomes a structured page with sections, citations, and a clean type hierarchy. Export to PDF in one click.',
      visual: 'pdf',
    },
    {
      title: 'Quiet collaboration.',
      body: 'Reactions, comments, and assignments live in the margins. No flashing dots, no noisy notifications — your team stays in flow.',
      visual: 'margins',
    },
  ];
  return (
    <section style={{ padding: '40px 56px 100px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {items.map((it, i) => (
          <div key={i} className="mn-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 360 }}>
            <div style={{
              flex: 1, background: 'var(--bg)', borderRadius: 12,
              border: '1px solid var(--border)', padding: 18,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {it.visual === 'doc' && (
                <>
                  <div className="mn-eyebrow">Decisions</div>
                  <DocLines widths={[95, 72, 84]} />
                  <div className="mn-eyebrow" style={{ marginTop: 10 }}>Action items</div>
                  <div className="col gap-6">
                    {['Sara — landing copy', 'Diego — playbook'].map(t => (
                      <div key={t} className="row gap-8" style={{ fontSize: 12, color: 'var(--text-2)', padding: '6px 8px', background: 'var(--surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                        <span style={{ width: 11, height: 11, borderRadius: 3, border: '1.4px solid var(--border-3)' }} /> {t}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {it.visual === 'pdf' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{
                    width: 130, height: 170, background: '#fff', borderRadius: 4,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                    padding: 14, transform: 'rotate(-3deg)',
                    display: 'flex', flexDirection: 'column', gap: 5,
                  }}>
                    <div style={{ width: 30, height: 4, background: 'var(--text)', borderRadius: 1 }} />
                    <div style={{ width: 70, height: 6, background: 'var(--surface-3)', borderRadius: 2 }} />
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[100, 86, 92, 78, 88, 60, 72].map((w, j) => (
                        <div key={j} style={{ width: w + '%', height: 3, background: 'var(--surface-3)', borderRadius: 1 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute', right: 10, bottom: 10,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', background: 'var(--text)', color: '#fff',
                    borderRadius: 999, fontSize: 10.5, fontWeight: 500,
                  }}>
                    <Icon name="download" size={11} /> notes.pdf
                  </div>
                </div>
              )}
              {it.visual === 'margins' && (
                <div style={{ position: 'relative' }}>
                  <DocLines widths={[95, 90, 70, 88]} />
                  <div style={{
                    position: 'absolute', right: -8, top: 6,
                    background: 'var(--surface)', border: '1px solid var(--border-2)',
                    borderRadius: 10, padding: '8px 10px', width: 140,
                    boxShadow: 'var(--shadow-md)', fontSize: 11, color: 'var(--text-2)',
                  }}>
                    <div className="row gap-6">
                      <Avatar name="Sara Kim" size={18} />
                      <strong style={{ color: 'var(--text)', fontSize: 11.5 }}>Sara</strong>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 10 }}>2m</span>
                    </div>
                    <div style={{ marginTop: 6 }}>Can we lock this date by Friday?</div>
                  </div>
                  <div style={{ marginTop: 70 }}><DocLines widths={[60, 80]} /></div>
                </div>
              )}
            </div>
            <h3 style={{ fontSize: 18, letterSpacing: '-0.02em', lineHeight: 1.25 }}>{it.title}</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.55 }}>{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Workflow / step diagram
const Workflow = () => {
  const steps = [
    { n: '01', t: 'Capture', d: 'Drop MeetNote into any video call or upload a recording. We listen in the background — no bot in the room.' },
    { n: '02', t: 'Synthesize', d: 'Within 60 seconds of hang-up, you get a structured page: summary, decisions, action items, citations.' },
    { n: '03', t: 'Distribute', d: 'Share a read-only link, export a polished PDF, or pipe the action items into your task tool of choice.' },
  ];
  return (
    <section style={{ padding: '40px 56px 100px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div className="mn-eyebrow">Workflow</div>
          <h2 style={{ fontSize: 44, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 12 }}>
            Three quiet steps.<br/>
            No new habits.
          </h2>
          <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.55 }}>
            MeetNote slots into the meetings you already run. You leave the
            call with a finished document, not a homework assignment.
          </p>
        </div>
        <div className="col gap-12">
          {steps.map(s => (
            <div key={s.n} style={{
              display: 'grid', gridTemplateColumns: '90px 1fr', gap: 24,
              padding: '24px 4px',
              borderTop: '1px solid var(--border)',
            }}>
              <div className="mn-mono" style={{ fontSize: 13, color: 'var(--text-3)', paddingTop: 4 }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{s.t}</h3>
                <p style={{ marginTop: 8, fontSize: 14.5, lineHeight: 1.6, maxWidth: 520 }}>{s.d}</p>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)' }} />
        </div>
      </div>
    </section>
  );
};

// Testimonials — editorial pull quotes
const Testimonials = () => {
  const quotes = [
    {
      q: 'Our weekly notes used to be a chore three people did badly. Now they\'re a document the whole company reads.',
      who: 'Priya Shah', role: 'Head of Operations · Halcyon',
    },
    {
      q: 'I stopped being the meeting scribe. The output is more thorough than what I was writing by hand.',
      who: 'Tomás Lindqvist', role: 'Engineering Manager · Folio',
    },
    {
      q: 'The PDF export is the killer feature for me. I send a clean, professional doc to clients after every call.',
      who: 'Aliyah Brooks', role: 'Partner · Plate & Co',
    },
  ];
  return (
    <section style={{ padding: '40px 56px 100px', maxWidth: 1280, margin: '0 auto' }}>
      <div className="mn-eyebrow" style={{ textAlign: 'center' }}>Customers</div>
      <h2 style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.03em', textAlign: 'center', marginTop: 12 }}>
        Quieter meetings. Sharper records.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 48 }}>
        {quotes.map((t, i) => (
          <figure key={i} style={{ margin: 0, padding: 32, borderTop: '1px solid var(--text)' }}>
            <blockquote style={{ margin: 0, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 20, lineHeight: 1.4, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              "{t.q}"
            </blockquote>
            <figcaption style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={t.who} size={30} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.who}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
};

// CTA band
const CTABand = () => (
  <section style={{ padding: '40px 56px 100px', maxWidth: 1280, margin: '0 auto' }}>
    <div style={{
      background: 'var(--text)', color: '#fff',
      borderRadius: 24, padding: '64px 56px',
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 40,
      position: 'relative', overflow: 'hidden',
    }}>
      <div>
        <div className="mn-eyebrow" style={{ color: 'rgba(255,255,255,0.5)' }}>Try MeetNote</div>
        <h2 style={{ color: '#fff', fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 14 }}>
          Clarity after meetings.
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 18, fontSize: 16, maxWidth: 480 }}>
          Free for the first 14 days. Two minutes to set up. Cancel any time
          from the same settings page you set it up on.
        </p>
      </div>
      <div className="col gap-10">
        <button className="mn-btn lg" style={{ background: '#fff', color: 'var(--text)', borderColor: '#fff' }}>
          Start free <Icon name="arrowRight" size={13} />
        </button>
        <button className="mn-btn lg ghost" style={{ color: '#fff' }}>
          Book a 15-min demo
        </button>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer style={{ padding: '40px 56px 56px', maxWidth: 1280, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, paddingTop: 36 }}>
      <div>
        <Logo size="lg" />
        <p style={{ fontSize: 13, marginTop: 14, maxWidth: 280, color: 'var(--text-3)' }}>
          Made by a small team in Lisbon and Toronto. No outside funding. No bot in your call.
        </p>
      </div>
      {[
        ['Product', ['Notes', 'Recordings', 'PDF Export', 'API', 'Changelog']],
        ['Company', ['About', 'Customers', 'Careers', 'Brand']],
        ['Resources', ['Help', 'Privacy', 'Security', 'Status']],
        ['Connect', ['Twitter', 'LinkedIn', 'RSS', 'Contact']],
      ].map(([h, links]) => (
        <div key={h}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{h}</div>
          <div className="col gap-8">
            {links.map(l => <a key={l} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none', cursor: 'pointer' }}>{l}</a>)}
          </div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 56, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
      <span>© 2026 MeetNote, Inc.</span>
      <span>·</span>
      <span>All rights reserved</span>
      <span style={{ flex: 1 }} />
      <span className="row gap-6"><span style={{ width: 6, height: 6, borderRadius: 999, background: '#16a34a' }} /> All systems operational</span>
    </div>
  </footer>
);

const Landing = () => (
  <div className="mn" style={{ width: '100%', height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
    <LandingNav />
    <Hero />
    <NotesShowcase />
    <LogoWall />
    <Features />
    <Workflow />
    <Testimonials />
    <CTABand />
    <Footer />
  </div>
);

Object.assign(window, { Landing });
