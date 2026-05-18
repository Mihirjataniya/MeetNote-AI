// MeetNote — shared components (icons, sidebar, topbar, primitives)
// All components are attached to window for cross-file use.

// ─── Icons ───────────────────────────────────────────────────
const Icon = ({ name, size = 16, stroke = 1.6, style }) => {
  const paths = {
    home: <><path d="M3 10.5L10 4l7 6.5"/><path d="M5 9.5V16h10V9.5"/></>,
    calendar: <><rect x="3" y="4.5" width="14" height="12.5" rx="2"/><path d="M3 8.5h14M7 3v3M13 3v3"/></>,
    history: <><path d="M3 10a7 7 0 1 0 2.3-5.2"/><path d="M3 4v3.5h3.5"/><path d="M10 6.5V10l2.5 1.5"/></>,
    settings: <><circle cx="10" cy="10" r="2.5"/><path d="M10 1.5v2M10 16.5v2M3.5 10h-2M18.5 10h-2M5.4 5.4L4 4M16 16l-1.4-1.4M5.4 14.6L4 16M16 4l-1.4 1.4"/></>,
    bell: <><path d="M5 8a5 5 0 1 1 10 0v4l1.5 2.5h-13L5 12z"/><path d="M8 16a2 2 0 0 0 4 0"/></>,
    plus: <><path d="M10 4v12M4 10h12"/></>,
    play: <><path d="M6 4.5l9 5.5-9 5.5z" fill="currentColor" stroke="none"/></>,
    arrowRight: <><path d="M4 10h12M11 5l5 5-5 5"/></>,
    arrowUpRight: <><path d="M6 14L14 6M7 6h7v7"/></>,
    chevronDown: <><path d="M5 8l5 5 5-5"/></>,
    chevronRight: <><path d="M7 4l6 6-6 6"/></>,
    chevronLeft: <><path d="M13 4l-6 6 6 6"/></>,
    search: <><circle cx="9" cy="9" r="5.5"/><path d="M13 13l3.5 3.5"/></>,
    filter: <><path d="M3 5h14M5 10h10M8 15h4"/></>,
    download: <><path d="M10 3v10M5.5 8.5L10 13l4.5-4.5M3.5 16.5h13"/></>,
    sparkle: <><path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z"/></>,
    fileText: <><path d="M5 3h7l3 3v11H5z"/><path d="M12 3v3h3M7.5 9h5M7.5 12h5M7.5 15h3"/></>,
    users: <><circle cx="7.5" cy="8" r="2.5"/><path d="M3 16c.5-2.4 2.4-3.5 4.5-3.5S11.5 13.6 12 16"/><circle cx="13.5" cy="7" r="2"/><path d="M11.5 12c.4 0 .8 0 1.3.1 2 .3 3.7 1.4 4.2 3.4"/></>,
    user: <><circle cx="10" cy="7" r="3"/><path d="M3.5 17c.7-3.4 3.4-5 6.5-5s5.8 1.6 6.5 5"/></>,
    lock: <><rect x="4" y="9" width="12" height="8" rx="2"/><path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/></>,
    mail: <><rect x="3" y="5" width="14" height="11" rx="2"/><path d="M3.5 6l6.5 5 6.5-5"/></>,
    video: <><rect x="3" y="6" width="10" height="8" rx="1.5"/><path d="M13 9l4-2v6l-4-2z" fill="currentColor"/></>,
    mic: <><rect x="8" y="3" width="4" height="9" rx="2"/><path d="M5.5 9.5a4.5 4.5 0 0 0 9 0M10 14v3M7.5 17h5"/></>,
    check: <><path d="M4 10l4 4 8-8"/></>,
    x: <><path d="M5 5l10 10M15 5L5 15"/></>,
    moreHorizontal: <><circle cx="5" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.2" fill="currentColor" stroke="none"/></>,
    moreVertical: <><circle cx="10" cy="5" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="10" cy="15" r="1.2" fill="currentColor" stroke="none"/></>,
    pin: <><path d="M7 3h6l-1 4 2 3h-3v6l-1-2-1 2v-6H6l2-3z"/></>,
    quote: <><path d="M4 11c0-3 2-5 4-5v2c-1 0-2 1-2 3h2v4H4zM12 11c0-3 2-5 4-5v2c-1 0-2 1-2 3h2v4h-4z"/></>,
    shield: <><path d="M10 3l6 2v5c0 4-3 6.5-6 7-3-.5-6-3-6-7V5z"/></>,
    bolt: <><path d="M11 3L4 11h4l-1 6 7-8h-4z"/></>,
    grid: <><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></>,
    list: <><path d="M6 5h11M6 10h11M6 15h11M3 5h.01M3 10h.01M3 15h.01"/></>,
    pdf: <><path d="M5 3h7l3 3v11H5z"/><path d="M12 3v3h3"/><text x="6" y="14" fontSize="4.5" fontFamily="ui-monospace" fontWeight="700" fill="currentColor" stroke="none">PDF</text></>,
    link: <><path d="M9 11a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1"/><path d="M11 9a3 3 0 0 0-4 0l-2 2a3 3 0 0 0 4 4l1-1"/></>,
    upload: <><path d="M10 13V3M5.5 7.5L10 3l4.5 4.5M3.5 16.5h13"/></>,
    eye: <><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"/><circle cx="10" cy="10" r="2.5"/></>,
    layers: <><path d="M10 3l7 4-7 4-7-4z"/><path d="M3 11l7 4 7-4M3 14l7 4 7-4"/></>,
    edit: <><path d="M14 3l3 3-9 9H5v-3z"/></>,
    star: <><path d="M10 3l2.2 4.5 5 .7-3.6 3.5.9 5L10 14.4 5.5 16.7l.9-5L2.8 8.2l5-.7z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      {paths[name] || null}
    </svg>
  );
};

// ─── Logo ────────────────────────────────────────────────────
const Logo = ({ size = 'md' }) => (
  <span className="mn-logo" style={size === 'lg' ? { fontSize: 17 } : null}>
    <span className="mark" style={size === 'lg' ? { width: 26, height: 26, fontSize: 14 } : null}>M</span>
    MeetNote
  </span>
);

// ─── Avatar ──────────────────────────────────────────────────
// Deterministic monochrome avatar — initials over flat gray-tone bg.
const AVATAR_TONES = ['#1F1F1F', '#3A3A38', '#54514C', '#6E6A64', '#88837C', '#A6A29A', '#C7C2BA'];
function avatarBg(name) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
const Avatar = ({ name = '', size = 26, style }) => {
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·';
  return (
    <span className="mn-avatar" style={{
      width: size, height: size, fontSize: Math.max(9, size * 0.4),
      background: avatarBg(name), color: '#fff', ...style,
    }}>{initials}</span>
  );
};

const AvatarGroup = ({ names = [], size = 22, max = 4 }) => {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="mn-avatar-group">
      {shown.map((n, i) => <Avatar key={i} name={n} size={size} />)}
      {extra > 0 && (
        <span className="mn-avatar" style={{
          width: size, height: size, fontSize: Math.max(9, size * 0.4),
          background: 'var(--surface-2)', color: 'var(--text-2)',
        }}>+{extra}</span>
      )}
    </span>
  );
};

// ─── App Shell pieces ────────────────────────────────────────
const Sidebar = ({ active, onNav, onSchedule, onStart }) => {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'schedules', label: 'Schedules', icon: 'calendar', count: '4' },
    { id: 'history', label: 'Meeting Histories', icon: 'history' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <aside className="mn-sidebar">
      <Logo />
      <button className="mn-btn primary" style={{ marginTop: 18, height: 36 }} onClick={onStart}>
        <Icon name="play" size={12} /> Start meeting
      </button>
      <button className="mn-btn secondary sm" style={{ marginTop: 8, height: 32 }} onClick={onSchedule}>
        <Icon name="plus" size={13} /> Schedule
      </button>

      <div className="nav">
        <div className="mn-eyebrow" style={{ padding: '14px 10px 6px' }}>Workspace</div>
        {items.map(it => (
          <div key={it.id}
            className={'mn-nav-item' + (active === it.id ? ' active' : '')}
            onClick={() => onNav && onNav(it.id)}>
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
            {it.count && <span className="count">{it.count}</span>}
          </div>
        ))}
      </div>

      <div className="nav">
        <div className="mn-eyebrow" style={{ padding: '18px 10px 6px' }}>Pinned</div>
        {['Q3 Roadmap', 'Customer interviews', 'Weekly 1:1 — Sara'].map(t => (
          <div key={t} className="mn-nav-item">
            <Icon name="fileText" size={14} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* Profile card */}
      <div className="mn-card" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Alex Reyes" size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Alex Reyes</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>alex@northwind.co</div>
        </div>
        <Icon name="moreHorizontal" size={14} style={{ color: 'var(--text-3)' }} />
      </div>
    </aside>
  );
};

const Topbar = ({ here = 'Home', onNotifications, notificationCount = 3, onProfile, search = true }) => (
  <header className="mn-topbar">
    <div className="crumb">
      <span>Workspace</span><span className="sep">/</span><span className="here">{here}</span>
    </div>
    <div style={{ flex: 1 }} />
    {search && (
      <div style={{ position: 'relative', width: 260 }}>
        <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input className="mn-input" placeholder="Search meetings, notes…" style={{ height: 34, paddingLeft: 30, fontSize: 13, background: 'var(--surface-2)', border: '1px solid transparent' }} />
        <span className="mn-kbd" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>⌘K</span>
      </div>
    )}
    <button className="mn-btn icon ghost" onClick={onNotifications} style={{ position: 'relative' }} title="Notifications">
      <Icon name="bell" size={16} />
      {notificationCount > 0 && (
        <span style={{
          position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 999,
          background: '#111', boxShadow: '0 0 0 2px var(--bg)',
        }} />
      )}
    </button>
    <button onClick={onProfile} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}>
      <Avatar name="Alex Reyes" size={30} />
    </button>
  </header>
);

// ─── Modal shell ─────────────────────────────────────────────
const Modal = ({ open, onClose, title, subtitle, children, footer, width = 460 }) => {
  if (!open) return null;
  return (
    <div className="mn-modal-overlay" onClick={onClose}>
      <div className="mn-modal" style={{ width }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 17, lineHeight: 1.3 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
          </div>
          <button className="mn-btn icon sm ghost" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: '8px 24px 20px' }}>{children}</div>
        {footer && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Placeholder strip blocks (for note/doc previews) ───────
const DocLines = ({ widths = [90, 80, 70, 90, 60] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {widths.map((w, i) => <div key={i} className="mn-doc-line" style={{ width: w + '%' }} />)}
  </div>
);

Object.assign(window, { Icon, Logo, Avatar, AvatarGroup, Sidebar, Topbar, Modal, DocLines, avatarBg });
