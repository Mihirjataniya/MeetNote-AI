// MeetNote — Auth pages (Sign In / Sign Up)
// Centered minimal layouts, monochrome cards.

const AuthShell = ({ children, side = 'right' }) => (
  <div className="mn" style={{ width: '100%', height: '100%', background: 'var(--bg)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
    {/* Form column */}
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '32px 56px 40px',
      order: side === 'right' ? 0 : 1,
    }}>
      <Logo size="lg" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>{children}</div>
      </div>
      <div style={{ display: 'flex', fontSize: 12, color: 'var(--text-3)', gap: 16 }}>
        <span>© 2026 MeetNote</span>
        <span style={{ marginLeft: 'auto' }}>Privacy · Terms</span>
      </div>
    </div>

    {/* Side visual: a calm, editorial preview of the doc */}
    <div style={{
      background: 'var(--surface-2)',
      borderLeft: side === 'right' ? '1px solid var(--border)' : 'none',
      borderRight: side === 'left' ? '1px solid var(--border)' : 'none',
      order: side === 'right' ? 1 : 0,
      padding: '60px 56px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ maxWidth: 360 }}>
        <div className="mn-eyebrow">From the docs</div>
        <p style={{ marginTop: 18, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, lineHeight: 1.35, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          "MeetNote is the quietest piece of software I've installed in years. It does its job, and gets out of the way."
        </p>
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="Priya Shah" size={28} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Priya Shah</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Head of Operations, Halcyon</div>
          </div>
        </div>
      </div>

      {/* Doc preview at bottom */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: 24,
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
        marginTop: 40,
      }}>
        <div className="mn-eyebrow">Meeting Notes</div>
        <h3 style={{ fontSize: 20, marginTop: 6, letterSpacing: '-0.02em' }}>Weekly customer review</h3>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>14 May · 42 min · 4 attendees</div>
        <hr className="mn-divider" style={{ margin: '16px 0' }} />
        <DocLines widths={[95, 78, 88, 70]} />
        <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--text-2)' }}>
          <span className="mn-ai-dot"><span className="glow" /> Generated in 42s</span>
          <span style={{ marginLeft: 'auto' }} className="mn-mono">notes.pdf</span>
        </div>
      </div>
    </div>
  </div>
);

const InputRow = ({ label, type = 'text', placeholder, hint, action }) => (
  <div style={{ marginBottom: 14 }}>
    <div className="row between" style={{ marginBottom: 7 }}>
      <label className="mn-label" style={{ margin: 0 }}>{label}</label>
      {action}
    </div>
    <input type={type} className="mn-input" placeholder={placeholder} />
    {hint && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{hint}</div>}
  </div>
);

const SsoRow = () => (
  <>
    <div className="col gap-8">
      {[
        ['Continue with Google', 'G'],
        ['Continue with Microsoft', 'M'],
        ['Continue with Apple', ''],
      ].map(([t, m]) => (
        <button key={t} className="mn-btn secondary" style={{ width: '100%', height: 40, justifyContent: 'flex-start', paddingLeft: 14 }}>
          <span style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{m || ''}</span>
          <span style={{ flex: 1, textAlign: 'left' }}>{t}</span>
        </button>
      ))}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', fontSize: 11, color: 'var(--text-3)' }}>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      OR USE EMAIL
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  </>
);

const SignIn = () => (
  <AuthShell side="right">
    <h1 style={{ fontSize: 32, letterSpacing: '-0.025em' }}>Welcome back.</h1>
    <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-2)' }}>
      Sign in to pick up where your meetings left off.
    </p>
    <div style={{ marginTop: 28 }}>
      <SsoRow />
      <InputRow label="Work email" type="email" placeholder="you@company.com" />
      <InputRow label="Password" type="password" placeholder="••••••••"
        action={<a style={{ fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>Forgot?</a>} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
        <input type="checkbox" defaultChecked style={{ accentColor: '#111' }} />
        Keep me signed in on this device
      </label>
      <button className="mn-btn primary lg" style={{ width: '100%', marginTop: 22 }}>
        Sign in <Icon name="arrowRight" size={13} />
      </button>
      <div style={{ marginTop: 22, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
        New here? <a style={{ color: 'var(--text)', fontWeight: 500, cursor: 'pointer' }}>Create an account</a>
      </div>
    </div>
  </AuthShell>
);

const SignUp = () => (
  <AuthShell side="left">
    <h1 style={{ fontSize: 32, letterSpacing: '-0.025em' }}>Create your workspace.</h1>
    <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-2)' }}>
      Free for 14 days. No credit card. Cancel any time.
    </p>
    <div style={{ marginTop: 28 }}>
      <SsoRow />
      <div className="row gap-10" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label className="mn-label">First name</label>
          <input className="mn-input" placeholder="Alex" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="mn-label">Last name</label>
          <input className="mn-input" placeholder="Reyes" />
        </div>
      </div>
      <InputRow label="Work email" type="email" placeholder="you@company.com" />
      <InputRow label="Password" type="password" placeholder="At least 12 characters"
        hint="Use a passphrase you'll remember. We never email it back to you." />
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.5 }}>
        <input type="checkbox" defaultChecked style={{ accentColor: '#111', marginTop: 3 }} />
        <span>I agree to MeetNote's <a style={{ color: 'var(--text)', cursor: 'pointer' }}>Terms</a> and <a style={{ color: 'var(--text)', cursor: 'pointer' }}>Privacy Policy</a>.</span>
      </label>
      <button className="mn-btn primary lg" style={{ width: '100%', marginTop: 22 }}>
        Create account <Icon name="arrowRight" size={13} />
      </button>
      <div style={{ marginTop: 22, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
        Already have one? <a style={{ color: 'var(--text)', fontWeight: 500, cursor: 'pointer' }}>Sign in</a>
      </div>
    </div>
  </AuthShell>
);

Object.assign(window, { SignIn, SignUp });
