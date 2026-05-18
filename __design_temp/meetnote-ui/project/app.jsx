// MeetNote — App shell wrapper + canvas

const App = ({ initial = 'home' }) => {
  const [screen, setScreen] = React.useState(initial);
  const [startOpen, setStartOpen] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);

  // Toast on confirm
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const here = {
    home: 'Home', schedules: 'Schedules', history: 'Meeting Histories',
    settings: 'Settings', profile: 'Profile',
  }[screen];

  return (
    <div className="mn" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <div className="mn-shell" style={{ height: '100%' }}>
        <Sidebar
          active={screen === 'profile' ? 'settings' : screen}
          onNav={setScreen}
          onSchedule={() => setScheduleOpen(true)}
          onStart={() => setStartOpen(true)}
        />
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <Topbar
            here={here}
            onNotifications={() => setNotifOpen(true)}
            onProfile={() => setScreen('profile')}
          />
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            {screen === 'home' && <HomeScreen onStart={() => setStartOpen(true)} onSchedule={() => setScheduleOpen(true)} />}
            {screen === 'schedules' && <SchedulesScreen onSchedule={() => setScheduleOpen(true)} />}
            {screen === 'history' && <HistoryScreen />}
            {screen === 'settings' && <SettingsScreen />}
            {screen === 'profile' && <ProfileScreen />}
          </div>
        </div>
      </div>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      <StartMeetingModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onConfirm={() => { setStartOpen(false); setToast('Meeting started · recording'); }}
      />
      <ScheduleMeetingModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onConfirm={() => { setScheduleOpen(false); setToast('Meeting scheduled · invites sent'); }}
      />

      {toast && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 16px', background: 'var(--text)', color: '#fff',
          borderRadius: 999, fontSize: 13, fontWeight: 500,
          boxShadow: 'var(--shadow-lg)', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'mn-toast .25s ease',
        }}>
          <Icon name="check" size={13} /> {toast}
        </div>
      )}
      <style>{`@keyframes mn-toast { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translateX(-50%); } }`}</style>
    </div>
  );
};

// Standalone wrappers for the canvas (each renders one specific state)
const AppHome = () => <App initial="home" />;
const AppSchedules = () => <App initial="schedules" />;
const AppHistory = () => <App initial="history" />;
const AppSettings = () => <App initial="settings" />;
const AppProfile = () => <App initial="profile" />;

// Variants that auto-open their modal so the artboards show those states
const AppStartModal = () => {
  const Wrap = () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="mn" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <div className="mn-shell" style={{ height: '100%' }}>
          <Sidebar active="home" />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <Topbar here="Home" />
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <HomeScreen />
            </div>
          </div>
        </div>
        <StartMeetingModal open={open} onClose={() => setOpen(true)} onConfirm={() => setOpen(true)} />
      </div>
    );
  };
  return <Wrap />;
};

const AppScheduleModal = () => {
  const Wrap = () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="mn" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <div className="mn-shell" style={{ height: '100%' }}>
          <Sidebar active="schedules" />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <Topbar here="Schedules" />
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <SchedulesScreen />
            </div>
          </div>
        </div>
        <ScheduleMeetingModal open={open} onClose={() => setOpen(true)} onConfirm={() => setOpen(true)} />
      </div>
    );
  };
  return <Wrap />;
};

const AppNotifications = () => {
  const Wrap = () => {
    const [open, setOpen] = React.useState(true);
    return (
      <div className="mn" style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <div className="mn-shell" style={{ height: '100%' }}>
          <Sidebar active="home" />
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <Topbar here="Home" />
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <HomeScreen />
            </div>
          </div>
        </div>
        <NotificationPanel open={open} onClose={() => setOpen(true)} />
      </div>
    );
  };
  return <Wrap />;
};

Object.assign(window, { App, AppHome, AppSchedules, AppHistory, AppSettings, AppProfile, AppStartModal, AppScheduleModal, AppNotifications });
