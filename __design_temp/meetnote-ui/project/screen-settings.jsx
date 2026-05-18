// MeetNote — Settings and Profile

const SettingsScreen = () => {
  const [section, setSection] = React.useState('profile');
  const sections = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'meeting', label: 'Meeting Preferences', icon: 'video' },
    { id: 'ai', label: 'AI Preferences', icon: 'sparkle' },
    { id: 'export', label: 'Export Preferences', icon: 'download' },
  ];

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: 1240, margin: '0 auto' }}>
      <div>
        <div className="mn-eyebrow">Account</div>
        <h1 style={{ fontSize: 26, marginTop: 4, letterSpacing: '-0.02em' }}>Settings</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 40, marginTop: 28 }}>
        {/* Side nav */}
        <nav className="col gap-2" style={{ position: 'sticky', top: 24, height: 'fit-content' }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: section === s.id ? 'var(--surface)' : 'transparent',
                boxShadow: section === s.id ? 'var(--shadow-sm)' : 'none',
                color: section === s.id ? 'var(--text)' : 'var(--text-2)',
                border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: 500, textAlign: 'left',
              }}>
              <Icon name={s.icon} size={14} /> {s.label}
            </button>
          ))}
        </nav>

        <div>
          {section === 'profile' && <ProfileSettings />}
          {section === 'security' && <SecuritySettings />}
          {section === 'notifications' && <NotificationSettings />}
          {section === 'meeting' && <MeetingSettings />}
          {section === 'ai' && <AISettings />}
          {section === 'export' && <ExportSettings />}
        </div>
      </div>
    </div>
  );
};

const SettingsCard = ({ title, desc, children, footer }) => (
  <div className="mn-card" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
      <h3 style={{ fontSize: 15, letterSpacing: '-0.01em' }}>{title}</h3>
      {desc && <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4 }}>{desc}</p>}
    </div>
    <div style={{ padding: 24 }}>{children}</div>
    {footer && (
      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {footer}
      </div>
    )}
  </div>
);

const Field = ({ label, hint, children, full }) => (
  <div style={{ marginBottom: 18, maxWidth: full ? 'none' : 420 }}>
    <label className="mn-label">{label}</label>
    {children}
    {hint && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{hint}</div>}
  </div>
);

const Toggle = ({ on, onChange }) => (
  <button onClick={() => onChange && onChange(!on)}
    style={{
      width: 36, height: 20, borderRadius: 999, padding: 0,
      background: on ? 'var(--text)' : 'var(--surface-3)',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background .15s',
    }}>
    <span style={{
      position: 'absolute', top: 2, left: on ? 18 : 2,
      width: 16, height: 16, borderRadius: 999, background: '#fff',
      transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }} />
  </button>
);

const ToggleRow = ({ title, desc, defaultOn = false, kbd }) => {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <div className="row" style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div className="row gap-8">
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{title}</span>
          {kbd && <span className="mn-kbd">{kbd}</span>}
        </div>
        {desc && <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 4, maxWidth: 480 }}>{desc}</div>}
      </div>
      <Toggle on={on} onChange={setOn} />
    </div>
  );
};

// ─── Profile sub-section (also rendered standalone as ProfileScreen) ───
const ProfileSettings = () => (
  <div className="col gap-20">
    <SettingsCard title="Profile" desc="This is how you appear across MeetNote."
      footer={<><button className="mn-btn ghost sm">Cancel</button><button className="mn-btn primary sm">Save changes</button></>}>
      <div className="row gap-20" style={{ marginBottom: 24, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative' }}>
          <Avatar name="Alex Reyes" size={84} style={{ borderWidth: 0 }} />
          <button className="mn-btn icon sm" style={{ position: 'absolute', right: -4, bottom: -4, background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-sm)' }}>
            <Icon name="edit" size={12} />
          </button>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Alex Reyes</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Product · joined March 2024</div>
          <div className="row gap-8" style={{ marginTop: 14 }}>
            <button className="mn-btn secondary sm"><Icon name="upload" size={12} /> Upload new</button>
            <button className="mn-btn ghost sm">Remove</button>
          </div>
        </div>
      </div>
      <div className="row gap-16">
        <div style={{ flex: 1 }}>
          <Field label="First name" full><input className="mn-input" defaultValue="Alex" /></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Last name" full><input className="mn-input" defaultValue="Reyes" /></Field>
        </div>
      </div>
      <Field label="Display name" hint="Used on the call screen and in shared notes.">
        <input className="mn-input" defaultValue="Alex Reyes" />
      </Field>
      <Field label="Role / Title">
        <input className="mn-input" defaultValue="Senior Product Manager" />
      </Field>
      <Field label="Bio" hint="A short blurb shown on your profile page (max 240 chars).">
        <textarea className="mn-textarea" rows={3} defaultValue="Product at Northwind. Previously: design eng at Folio. Quiet by design." />
      </Field>
    </SettingsCard>

    <SettingsCard title="Email" desc="The primary email tied to your workspace.">
      <Field label="Primary email" hint="Verified · used for sign-in.">
        <div className="row gap-8">
          <input className="mn-input" defaultValue="alex@northwind.co" style={{ flex: 1 }} />
          <button className="mn-btn secondary">Change</button>
        </div>
      </Field>
      <Field label="Recovery email">
        <input className="mn-input" placeholder="Add a recovery email" />
      </Field>
    </SettingsCard>

    <SettingsCard title="Preferences">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Use 24-hour time" desc="Display all meeting times in 24-hour format across the app." defaultOn />
        <ToggleRow title="Show me as available when calendar is empty" desc="People who message you outside meetings see an active status." defaultOn />
        <ToggleRow title="Send me a weekly digest" desc="A Sunday-evening summary of the week's meetings and outstanding action items." defaultOn />
      </div>
    </SettingsCard>
  </div>
);

// ─── Security ────────────────────────────────────────────────
const SecuritySettings = () => (
  <div className="col gap-20">
    <SettingsCard title="Password" desc="Change the password used to sign in." footer={<button className="mn-btn primary sm">Update password</button>}>
      <Field label="Current password"><input className="mn-input" type="password" placeholder="••••••••" /></Field>
      <Field label="New password" hint="At least 12 characters. Mix it up."><input className="mn-input" type="password" placeholder="••••••••" /></Field>
      <Field label="Confirm new password"><input className="mn-input" type="password" placeholder="••••••••" /></Field>
    </SettingsCard>

    <SettingsCard title="Two-factor authentication" desc="Add a second step when signing in from a new device.">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Authenticator app" desc="Use Google Authenticator, 1Password, or any TOTP app." defaultOn />
        <ToggleRow title="Hardware security key" desc="YubiKey, Titan, or any WebAuthn-compatible key." />
        <ToggleRow title="SMS backup" desc="Less secure. We don't recommend this unless you have no alternative." />
      </div>
    </SettingsCard>

    <SettingsCard title="Active sessions" desc="Devices currently signed in to your account.">
      {[
        { device: 'MacBook Pro · Chrome 124', loc: 'Toronto, CA', last: 'now', current: true },
        { device: 'iPhone 15 · iOS 17', loc: 'Toronto, CA', last: '2h ago' },
        { device: 'Windows · Firefox 121', loc: 'Lisbon, PT', last: '3d ago' },
      ].map((s, i) => (
        <div key={i} className="row" style={{ padding: '12px 0', borderTop: i ? '1px solid var(--border)' : 'none', gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="eye" size={13} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="row gap-8">
              <span style={{ fontSize: 13, fontWeight: 500 }}>{s.device}</span>
              {s.current && <span className="mn-pill live"><span className="dot" />This device</span>}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{s.loc} · last active {s.last}</div>
          </div>
          {!s.current && <button className="mn-btn ghost sm">Sign out</button>}
        </div>
      ))}
    </SettingsCard>
  </div>
);

// ─── Notifications ───────────────────────────────────────────
const NotificationSettings = () => (
  <div className="col gap-20">
    <SettingsCard title="In-app notifications">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Meeting reminders" desc="Notify me 10 minutes before each scheduled meeting." defaultOn />
        <ToggleRow title="Notes generated" desc="Ping me when a meeting's notes are ready to review." defaultOn />
        <ToggleRow title="Action item assigned to me" desc="When someone assigns me a task from meeting notes." defaultOn />
        <ToggleRow title="Comments and reactions" desc="When teammates respond to your notes." />
        <ToggleRow title="Meeting invitations" desc="When you're invited to a meeting from inside MeetNote." defaultOn />
      </div>
    </SettingsCard>

    <SettingsCard title="Email">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Daily digest" desc="A 7am email summarizing the day's meetings and any open actions." defaultOn />
        <ToggleRow title="Notes shared with me" desc="Email me when someone shares a meeting note." defaultOn />
        <ToggleRow title="Weekly review" desc="A Sunday-evening review of the past week." />
        <ToggleRow title="Product updates" desc="New features, changelog highlights. About once a month." />
      </div>
    </SettingsCard>

    <SettingsCard title="Quiet hours" desc="Mute non-urgent notifications during these times.">
      <div className="row gap-16">
        <Field label="From"><input className="mn-input" defaultValue="19:00" /></Field>
        <Field label="To"><input className="mn-input" defaultValue="08:30" /></Field>
      </div>
    </SettingsCard>
  </div>
);

// ─── Meeting Preferences ─────────────────────────────────────
const MeetingSettings = () => (
  <div className="col gap-20">
    <SettingsCard title="Recording">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Auto-record every meeting" desc="MeetNote joins and records each meeting automatically. You can opt out per call." defaultOn />
        <ToggleRow title="Wait for host before recording" desc="Don't start recording until the meeting host arrives." defaultOn />
        <ToggleRow title="Visual recording indicator" desc="Show a persistent 'recording' dot to all attendees." defaultOn />
      </div>
    </SettingsCard>

    <SettingsCard title="Transcription">
      <Field label="Primary language">
        <select className="mn-input" defaultValue="en-US" style={{ paddingRight: 30 }}>
          <option value="en-US">English (United States)</option>
          <option>English (United Kingdom)</option>
          <option>Spanish (Spain)</option>
          <option>Portuguese (Brazil)</option>
          <option>French (France)</option>
          <option>Japanese</option>
        </select>
      </Field>
      <Field label="Custom vocabulary" hint="Names, product terms and acronyms MeetNote should always spell correctly.">
        <textarea className="mn-textarea" rows={3} defaultValue="Northwind, Folio, Halcyon, Plate & Co, MeetNote, OKRs" />
      </Field>
    </SettingsCard>

    <SettingsCard title="Privacy">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Mark calls as private by default" desc="Private meetings are visible only to attendees. Notes don't appear in workspace search." />
        <ToggleRow title="Allow attendees to download recordings" defaultOn />
      </div>
    </SettingsCard>
  </div>
);

// ─── AI Preferences ──────────────────────────────────────────
const AISettings = () => (
  <div className="col gap-20">
    <SettingsCard title="Note generation">
      <Field label="Default note style">
        <div className="row gap-2" style={{ padding: 3, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
          {['Editorial', 'Bulleted', 'Verbatim'].map((v, i) => (
            <button key={v} className="mn-btn sm" style={{
              background: i === 0 ? 'var(--surface)' : 'transparent',
              boxShadow: i === 0 ? 'var(--shadow-sm)' : 'none',
              height: 28, padding: '0 14px',
            }}>{v}</button>
          ))}
        </div>
      </Field>
      <Field label="Tone" hint="How formal should generated notes read.">
        <select className="mn-input" defaultValue="2" style={{ maxWidth: 240 }}>
          <option value="1">Casual</option>
          <option value="2">Neutral (default)</option>
          <option value="3">Formal</option>
        </select>
      </Field>
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Include speaker labels" desc="Attribute each quote and decision to the person who said it." defaultOn />
        <ToggleRow title="Extract decisions" defaultOn />
        <ToggleRow title="Extract action items" desc="Identify tasks and their owners automatically." defaultOn />
        <ToggleRow title="Link to transcript timestamps" desc="Every sentence in the notes links back to the moment it was said." defaultOn />
        <ToggleRow title="Suggest follow-up meetings" desc="If MeetNote detects a recurring topic that needs more time." />
      </div>
    </SettingsCard>

    <SettingsCard title="Sensitive data">
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Redact phone numbers and emails" defaultOn />
        <ToggleRow title="Redact financial figures" desc="MeetNote masks dollar amounts above a threshold you set." />
        <ToggleRow title="Don't train on my data" desc="Your recordings and transcripts are never used to improve MeetNote's models." defaultOn />
      </div>
    </SettingsCard>
  </div>
);

// ─── Export Preferences ──────────────────────────────────────
const ExportSettings = () => (
  <div className="col gap-20">
    <SettingsCard title="PDF export" desc="Customize the document MeetNote generates when you export.">
      <Field label="Header style">
        <div className="row gap-10">
          {[
            { id: 'editorial', label: 'Editorial' },
            { id: 'minimal', label: 'Minimal' },
            { id: 'branded', label: 'Branded' },
          ].map((v, i) => (
            <button key={v.id} className="mn-card" style={{
              padding: 12, width: 130, cursor: 'pointer',
              background: i === 0 ? 'var(--surface-2)' : 'var(--surface)',
              borderColor: i === 0 ? 'var(--border-3)' : 'var(--border)',
              boxShadow: i === 0 ? 'var(--shadow-sm)' : 'none',
              textAlign: 'left',
            }}>
              <div style={{ height: 60, background: 'var(--bg)', borderRadius: 4, border: '1px solid var(--border)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 4, width: 40, background: 'var(--text)' }} />
                <div style={{ height: 2, width: 30, background: 'var(--surface-3)' }} />
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[80, 65, 70].map((w, j) => <div key={j} style={{ height: 1.5, width: w + '%', background: 'var(--surface-3)' }} />)}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, marginTop: 8 }}>{v.label}</div>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Paper size">
        <select className="mn-input" defaultValue="letter" style={{ maxWidth: 200 }}>
          <option value="letter">US Letter (8.5×11")</option>
          <option value="a4">A4 (210×297mm)</option>
        </select>
      </Field>
      <Field label="Footer text" hint="Shown on every page of the PDF.">
        <input className="mn-input" defaultValue="Confidential — Northwind" />
      </Field>
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <ToggleRow title="Include attendee list" defaultOn />
        <ToggleRow title="Include speaker time breakdown" defaultOn />
        <ToggleRow title="Include full transcript" desc="Adds a transcript appendix at the end of the PDF." />
        <ToggleRow title="Add page numbers" defaultOn />
      </div>
    </SettingsCard>

    <SettingsCard title="Integrations" desc="Pipe action items and notes to the rest of your stack.">
      {[
        { name: 'Linear', desc: 'Send action items to Linear as issues', on: true },
        { name: 'Notion', desc: 'Mirror every note to a Notion database', on: true },
        { name: 'Slack', desc: 'Post a daily digest to a channel', on: false },
        { name: 'Google Drive', desc: 'Auto-save exported PDFs to a folder', on: false },
      ].map((it, i) => (
        <div key={i} className="row" style={{ padding: '14px 0', borderTop: i ? '1px solid var(--border)' : 'none', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{it.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div className="row gap-8">
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{it.name}</span>
              {it.on && <span className="mn-pill live"><span className="dot" />Connected</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>{it.desc}</div>
          </div>
          <button className="mn-btn secondary sm">{it.on ? 'Manage' : 'Connect'}</button>
        </div>
      ))}
    </SettingsCard>
  </div>
);

// Profile standalone page — same content as profile settings, full-width
const ProfileScreen = () => (
  <div style={{ padding: '28px 32px 40px', maxWidth: 880, margin: '0 auto' }}>
    <div>
      <div className="mn-eyebrow">Account</div>
      <h1 style={{ fontSize: 26, marginTop: 4, letterSpacing: '-0.02em' }}>Your profile</h1>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
        Manage how you appear across MeetNote.
      </p>
    </div>
    <div style={{ marginTop: 28 }}>
      <ProfileSettings />
    </div>
  </div>
);

Object.assign(window, { SettingsScreen, ProfileScreen });
