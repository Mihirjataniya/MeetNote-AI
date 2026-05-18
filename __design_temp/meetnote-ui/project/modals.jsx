// MeetNote — Modals + Notification slide-over panel

// ─── Start Meeting modal ─────────────────────────────────────
const StartMeetingModal = ({ open, onClose, onConfirm }) => {
  const [title, setTitle] = React.useState('Quick sync');
  const [desc, setDesc] = React.useState('');
  const [recording, setRecording] = React.useState(true);

  return (
    <Modal open={open} onClose={onClose}
      title="Start a meeting"
      subtitle="MeetNote will join, record and write the notes."
      width={520}
      footer={<>
        <button className="mn-btn ghost" onClick={onClose}>Cancel</button>
        <button className="mn-btn primary" onClick={onConfirm}>
          <Icon name="play" size={11} /> Start meeting
        </button>
      </>}>
      <div style={{ marginBottom: 14 }}>
        <label className="mn-label">Meeting title</label>
        <input className="mn-input" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="mn-label">Description <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(optional)</span></label>
        <textarea className="mn-textarea" rows={3} value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="A short context for the AI summary — agenda, goal, attendees' background…" />
      </div>

      <div style={{
        padding: '12px 14px', background: 'var(--bg)',
        border: '1px solid var(--border)', borderRadius: 10, marginTop: 6,
      }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="row gap-8">
            <Icon name="sparkle" size={14} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Auto-generate notes</span>
          </div>
          <Toggle on={recording} onChange={setRecording} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
          A structured page with summary, decisions and action items will be written
          within 60 seconds of hang-up. You can edit anything afterward.
        </div>
      </div>

      <div className="row gap-8" style={{ marginTop: 16, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
        <Icon name="link" size={13} style={{ color: 'var(--text-3)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-2)' }} className="mn-mono">meetnote.app/m/qa-7y3kp</span>
        <button className="mn-btn ghost sm" style={{ marginLeft: 'auto', height: 24 }}>Copy</button>
      </div>
    </Modal>
  );
};

// ─── Schedule Meeting modal ─────────────────────────────────
const ScheduleMeetingModal = ({ open, onClose, onConfirm }) => {
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [date, setDate] = React.useState('2026-05-16');
  const [time, setTime] = React.useState('15:00');
  const [duration, setDuration] = React.useState('45');
  const [participants, setParticipants] = React.useState(['Sara Kim', 'Diego Ortiz']);
  const [query, setQuery] = React.useState('');

  const available = MN_PEOPLE.filter(p => p.name !== 'Alex Reyes' && !participants.includes(p.name) && (!query || p.name.toLowerCase().includes(query.toLowerCase())));

  return (
    <Modal open={open} onClose={onClose}
      title="Schedule a meeting"
      subtitle="MeetNote will send invites and join automatically."
      width={580}
      footer={<>
        <button className="mn-btn ghost" onClick={onClose}>Cancel</button>
        <button className="mn-btn primary" onClick={onConfirm}>
          <Icon name="calendar" size={12} /> Schedule
        </button>
      </>}>
      <div style={{ marginBottom: 14 }}>
        <label className="mn-label">Title</label>
        <input className="mn-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Roadmap review with founders" autoFocus />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="mn-label">Description <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(optional)</span></label>
        <textarea className="mn-textarea" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Agenda, prep links, context…" />
      </div>

      <div className="row gap-10" style={{ marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label className="mn-label">Date</label>
          <input className="mn-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div style={{ width: 130 }}>
          <label className="mn-label">Time</label>
          <input className="mn-input" type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
        <div style={{ width: 130 }}>
          <label className="mn-label">Duration</label>
          <select className="mn-input" value={duration} onChange={e => setDuration(e.target.value)}>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <label className="mn-label">Participants</label>
        <div style={{
          minHeight: 40, padding: 6, border: '1px solid var(--border-2)',
          borderRadius: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
          background: 'var(--surface)',
        }}>
          {participants.map(p => (
            <span key={p} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 4px 3px 4px', background: 'var(--surface-2)',
              borderRadius: 999, fontSize: 12, fontWeight: 500,
              border: '1px solid var(--border)',
            }}>
              <Avatar name={p} size={18} />
              {p}
              <button onClick={() => setParticipants(participants.filter(x => x !== p))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 2 }}>
                <Icon name="x" size={12} />
              </button>
            </span>
          ))}
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={participants.length ? 'Add someone…' : 'Search teammates…'}
            style={{ flex: 1, minWidth: 120, border: 'none', outline: 'none', padding: '4px 6px', fontSize: 13, background: 'transparent' }} />
        </div>
        {query && available.length > 0 && (
          <div className="mn-card" style={{ marginTop: 4, padding: 4, boxShadow: 'var(--shadow-pop)' }}>
            {available.slice(0, 4).map(p => (
              <button key={p.name} onClick={() => { setParticipants([...participants, p.name]); setQuery(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                  width: '100%', borderRadius: 6, background: 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Avatar name={p.name} size={22} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.email}</div>
                </div>
                <span className="mn-pill">{p.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)' }}>
        <Icon name="sparkle" size={13} />
        <span>MeetNote will join automatically · auto-record · auto-generate notes</span>
      </div>
    </Modal>
  );
};

// ─── Notification slide-over ────────────────────────────────
const NotificationPanel = ({ open, onClose }) => {
  if (!open) return null;
  const grouped = {
    'Today': MN_NOTIFICATIONS.slice(0, 3),
    'Earlier this week': MN_NOTIFICATIONS.slice(3),
  };
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 39,
        animation: 'mn-fade .15s ease',
      }} />
      <div className="mn-slideover">
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: 15 }}>Notifications</h3>
          <span className="mn-pill">3 new</span>
          <span style={{ flex: 1 }} />
          <button className="mn-btn ghost sm">Mark all read</button>
          <button className="mn-btn icon sm ghost" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div className="row gap-2" style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          {['All', 'Mentions', 'Meetings', 'Notes'].map((t, i) => (
            <button key={t} className="mn-btn sm" style={{
              background: i === 0 ? 'var(--surface-2)' : 'transparent',
              color: i === 0 ? 'var(--text)' : 'var(--text-2)',
              height: 26, padding: '0 10px',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 24px' }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="mn-eyebrow" style={{ padding: '10px 12px 6px' }}>{group}</div>
              {items.map((n, i) => {
                const isNew = i < 1 && group === 'Today';
                const ringColor = n.kind === 'reminder' ? 'var(--text)' : n.kind === 'notes' ? '#16a34a' : 'var(--text-3)';
                return (
                  <div key={n.id} className="mn-row" style={{ padding: '12px', alignItems: 'flex-start', position: 'relative' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 999,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text)', flexShrink: 0,
                    }}>
                      <Icon name={n.icon} size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{n.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{n.meta}</div>
                      {n.kind === 'reminder' && i === 0 && group === 'Today' && (
                        <div className="row gap-6" style={{ marginTop: 8 }}>
                          <button className="mn-btn primary sm" style={{ height: 26 }}><Icon name="video" size={11} /> Join</button>
                          <button className="mn-btn ghost sm" style={{ height: 26 }}>Snooze</button>
                        </div>
                      )}
                      {n.kind === 'notes' && (
                        <div className="row gap-6" style={{ marginTop: 8 }}>
                          <button className="mn-btn secondary sm" style={{ height: 26 }}>Open notes</button>
                          <button className="mn-btn ghost sm" style={{ height: 26 }}><Icon name="download" size={11} /> PDF</button>
                        </div>
                      )}
                      {n.kind === 'invite' && (
                        <div className="row gap-6" style={{ marginTop: 8 }}>
                          <button className="mn-btn primary sm" style={{ height: 26 }}>Accept</button>
                          <button className="mn-btn ghost sm" style={{ height: 26 }}>Decline</button>
                          <button className="mn-btn ghost sm" style={{ height: 26 }}>Maybe</button>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{n.time}</span>
                    {isNew && (
                      <span style={{
                        position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)',
                        width: 4, height: 4, borderRadius: 999, background: ringColor,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button className="mn-btn ghost sm" style={{ width: '100%' }}>
            View all notifications <Icon name="arrowRight" size={11} />
          </button>
        </div>
      </div>
    </>
  );
};

Object.assign(window, { StartMeetingModal, ScheduleMeetingModal, NotificationPanel });
