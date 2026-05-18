// MeetNote — Schedules screen

const MN_CAL_EVENTS = {
  // date string YYYY-MM-DD : [{ title, time, dim }]
  '2026-05-12': [{ title: 'Customer · Folio', time: '10:30' }],
  '2026-05-13': [
    { title: 'Q3 Launch Planning', time: '11:00' },
    { title: 'Onboarding critique', time: '16:00' },
  ],
  '2026-05-14': [
    { title: 'Q3 Launch Readiness', time: '11:00' },
    { title: 'Weekly 1:1 · Sara', time: '14:00' },
    { title: 'Eng standup', time: '17:00', dim: true },
  ],
  '2026-05-15': [{ title: 'Customer · Halcyon', time: '09:30' }],
  '2026-05-16': [
    { title: 'Design Review', time: '15:00' },
    { title: 'Founders sync', time: '16:30', dim: true },
  ],
  '2026-05-19': [{ title: 'Marketing weekly', time: '09:30' }],
  '2026-05-20': [
    { title: 'Board prep', time: '13:00' },
    { title: 'Hiring · Eng', time: '15:00', dim: true },
  ],
  '2026-05-22': [{ title: 'Q2 retro', time: '11:00' }],
  '2026-05-26': [{ title: 'Customer · Plate & Co', time: '10:00' }],
  '2026-05-28': [{ title: 'All-hands prep', time: '09:00' }],
  '2026-05-05': [{ title: 'Customer · Plate', time: '10:00' }],
  '2026-05-07': [{ title: 'Q2 retro', time: '13:00' }],
  '2026-05-09': [{ title: 'Hiring sync · Eng', time: '11:00' }],
};

const SchedulesScreen = ({ onSchedule, onJoin }) => {
  // Build May 2026 grid; first day = Friday May 1 2026
  // Calendar shows: previous month tail + May + start of June
  const month = 'May 2026';
  // Days array: dayNumber, isoDate, muted (out of month), isToday
  const days = [];
  // April 27 → April 30 (4 days) before May 1 (which is Friday → index 5)
  // May 2026: May 1 is a Friday.
  // We want Sunday-start grid: Sun Mon Tue Wed Thu Fri Sat
  // So leading days: Sun Apr 26 — Thu Apr 30 (5 days)
  const leading = ['26', '27', '28', '29', '30'];
  leading.forEach(d => days.push({ d, iso: `2026-04-${d}`, muted: true }));
  for (let i = 1; i <= 31; i++) {
    const iso = `2026-05-${String(i).padStart(2, '0')}`;
    days.push({ d: String(i), iso, muted: false, today: i === 14 });
  }
  // Trailing — fill to 6 rows (42 cells)
  let trailing = 42 - days.length;
  for (let i = 1; i <= trailing; i++) days.push({ d: String(i), iso: `2026-06-${String(i).padStart(2, '0')}`, muted: true });

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="row between">
        <div>
          <div className="mn-eyebrow">Calendar</div>
          <h1 style={{ fontSize: 26, marginTop: 4, letterSpacing: '-0.02em' }}>Schedules</h1>
        </div>
        <div className="row gap-8">
          <div className="row gap-2" style={{
            padding: 3, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)',
          }}>
            {['Day', 'Week', 'Month'].map((v, i) => (
              <button key={v} className="mn-btn sm" style={{
                background: i === 2 ? 'var(--surface)' : 'transparent',
                boxShadow: i === 2 ? 'var(--shadow-sm)' : 'none',
                height: 26, padding: '0 12px',
              }}>{v}</button>
            ))}
          </div>
          <button className="mn-btn primary sm" onClick={onSchedule}><Icon name="plus" size={12} /> New meeting</button>
        </div>
      </div>

      <div className="row between">
        <div className="row gap-10">
          <button className="mn-btn icon ghost"><Icon name="chevronLeft" size={14} /></button>
          <h2 style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{month}</h2>
          <button className="mn-btn icon ghost"><Icon name="chevronRight" size={14} /></button>
          <button className="mn-btn ghost sm" style={{ marginLeft: 4 }}>Today</button>
        </div>
        <div className="row gap-8">
          <div className="row gap-12" style={{ fontSize: 11, color: 'var(--text-3)' }}>
            <span className="row gap-6"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--text)' }} />Yours</span>
            <span className="row gap-6"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--text-3)' }} />Team</span>
          </div>
        </div>
      </div>

      <div>
        {/* Day name row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 8px' }}>{d}</div>
          ))}
        </div>
        <div className="cal-grid">
          {days.map((cell, i) => {
            const events = MN_CAL_EVENTS[cell.iso] || [];
            return (
              <div key={i} className={'cal-cell' + (cell.muted ? ' muted' : '') + (cell.today ? ' today' : '')}>
                <div className="row between">
                  <span className="day-num">{cell.d}</span>
                </div>
                {events.slice(0, 3).map((e, j) => (
                  <div key={j} className={'cal-event' + (e.dim ? ' dim' : '')}>
                    <span className="mn-mono" style={{ fontSize: 10, marginRight: 6, opacity: 0.7 }}>{e.time}</span>{e.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)', padding: '2px 6px' }}>+{events.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list under the calendar */}
      <div style={{ marginTop: 8 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 15 }}>This week's meetings</h3>
          <button className="mn-btn ghost sm"><Icon name="filter" size={12} /> Filter</button>
        </div>
        <div className="col gap-8">
          {MN_UPCOMING.map(m => (
            <div key={m.id} className="mn-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{
                width: 4, height: 36, borderRadius: 2,
                background: m.status === 'live' ? 'var(--text)' : 'var(--text-4)',
              }} />
              <div style={{ width: 100 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.date}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }} className="mn-mono">{m.time}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{m.title}</div>
                <div className="row gap-6" style={{ marginTop: 4 }}>
                  <AvatarGroup names={m.participants} size={18} max={4} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{m.participants.length} attendees</span>
                </div>
              </div>
              {m.status === 'live' && <span className="mn-pill live"><span className="dot" /> In 12m</span>}
              <button className="mn-btn ghost sm"><Icon name="moreHorizontal" size={13} /></button>
              <button className="mn-btn secondary sm" onClick={onJoin}>Join</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { SchedulesScreen });
