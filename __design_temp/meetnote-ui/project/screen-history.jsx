// MeetNote — Meeting Histories screen

const HistoryStatusPill = ({ status }) => {
  if (status === 'ready') return <span className="mn-pill done"><span className="dot" /> Notes ready</span>;
  if (status === 'generating') return <span className="mn-ai-dot"><span className="glow" /> Generating</span>;
  return <span className="mn-pill" style={{ color: '#9a3412' }}><span className="dot" style={{ background: '#c2410c' }} /> Failed</span>;
};

const HistoryScreen = () => {
  const [view, setView] = React.useState('list'); // 'list' | 'grid'
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState('all');

  const filters = [
    { id: 'all', label: 'All', count: MN_HISTORY.length },
    { id: 'mine', label: 'Mine', count: 9 },
    { id: 'customer', label: 'Customer calls', count: 3 },
    { id: 'internal', label: 'Internal', count: 8 },
    { id: 'failed', label: 'Failed', count: 1 },
  ];

  return (
    <div style={{ padding: '28px 32px 40px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="row between">
        <div>
          <div className="mn-eyebrow">Archive</div>
          <h1 style={{ fontSize: 26, marginTop: 4, letterSpacing: '-0.02em' }}>Meeting histories</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
            {MN_HISTORY.length} meetings · 11h 28m total · last 30 days
          </p>
        </div>
        <div className="row gap-8">
          <button className="mn-btn ghost sm"><Icon name="download" size={12} /> Export all</button>
          <div className="row gap-2" style={{ padding: 3, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <button className="mn-btn icon sm" onClick={() => setView('list')} style={{ background: view === 'list' ? 'var(--surface)' : 'transparent', boxShadow: view === 'list' ? 'var(--shadow-sm)' : 'none' }} title="List view"><Icon name="list" size={13} /></button>
            <button className="mn-btn icon sm" onClick={() => setView('grid')} style={{ background: view === 'grid' ? 'var(--surface)' : 'transparent', boxShadow: view === 'grid' ? 'var(--shadow-sm)' : 'none' }} title="Grid view"><Icon name="grid" size={13} /></button>
          </div>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="row gap-12">
        <div style={{ flex: 1, position: 'relative' }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input className="mn-input" placeholder="Search by title, participant, keyword…"
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: 36, fontSize: 14 }} />
        </div>
        <button className="mn-btn secondary"><Icon name="filter" size={13} /> Filters</button>
        <button className="mn-btn secondary"><Icon name="calendar" size={13} /> Date range</button>
      </div>

      {/* Filter tabs */}
      <div className="row gap-2" style={{ borderBottom: '1px solid var(--border)', marginBottom: -4 }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              background: 'transparent', border: 'none', padding: '10px 14px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              color: filter === f.id ? 'var(--text)' : 'var(--text-3)',
              borderBottom: filter === f.id ? '2px solid var(--text)' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {f.label}
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {view === 'list' ? (
        <div className="mn-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 200px 100px 160px 110px 40px',
            gap: 16, padding: '11px 20px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text-3)',
            fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <div>Title</div>
            <div>Participants</div>
            <div>Duration</div>
            <div>Notes</div>
            <div style={{ textAlign: 'right' }}>Actions</div>
            <div></div>
          </div>
          {MN_HISTORY.map((m, i) => (
            <div key={m.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 200px 100px 160px 110px 40px',
              gap: 16, padding: '14px 20px',
              borderBottom: i < MN_HISTORY.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center', cursor: 'pointer', transition: 'background .12s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }} className="mn-mono">{m.when}</div>
              </div>
              <div className="row gap-6">
                <AvatarGroup names={m.participants} size={20} max={3} />
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.participants.length}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)' }} className="tnum">{m.duration}</div>
              <div><HistoryStatusPill status={m.notes} /></div>
              <div style={{ textAlign: 'right' }} className="row gap-4" >
                {m.notes === 'ready' && <>
                  <button className="mn-btn icon sm ghost" title="Download PDF"><Icon name="download" size={13} /></button>
                  <button className="mn-btn icon sm ghost" title="Open"><Icon name="arrowUpRight" size={13} /></button>
                </>}
                {m.notes === 'failed' && <button className="mn-btn ghost sm">Retry</button>}
              </div>
              <button className="mn-btn icon sm ghost"><Icon name="moreVertical" size={13} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {MN_HISTORY.map(m => (
            <div key={m.id} className="mn-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 240, cursor: 'pointer', transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
            >
              <div className="row between">
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="fileText" size={14} />
                </div>
                <button className="mn-btn icon sm ghost"><Icon name="moreVertical" size={12} /></button>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{m.when} · {m.duration}</div>
              </div>
              {m.notes === 'ready' && (
                <div style={{ padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="mn-eyebrow" style={{ fontSize: 9 }}>Summary</div>
                  <DocLines widths={[95, 80, 70]} />
                </div>
              )}
              <div className="row between">
                <AvatarGroup names={m.participants} size={20} max={3} />
                <HistoryStatusPill status={m.notes} />
              </div>
              {m.notes === 'ready' && (
                <div className="row gap-6">
                  <button className="mn-btn secondary sm" style={{ flex: 1 }}><Icon name="download" size={12} /> PDF</button>
                  <button className="mn-btn primary sm" style={{ flex: 1 }}>Open</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { HistoryScreen });
