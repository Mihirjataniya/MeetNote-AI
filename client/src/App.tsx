import "./styles/index.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoomProvider, useRoom } from "./contexts/RoomContext";
import { AuthPage } from "./components/AuthPage";
import { JoinForm } from "./components/JoinForm";
import { Room } from "./components/Room";

function MeetingApp() {
  const { user, logout } = useAuth();
  const { roomId } = useRoom();

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="h-14 px-7 flex items-center gap-4 border-b border-border bg-background">
        <span className="inline-flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-foreground">
          <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
            M
          </span>
          MeetNote
        </span>
        <div className="flex-1" />
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-foreground">{user.displayName}</span>
            <button
              onClick={logout}
              className="h-[30px] px-3 text-[13px] font-medium rounded-lg border border-border-strong bg-surface text-foreground hover:bg-surface-hover transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </header>
      <div className="flex-1 overflow-auto">
        {roomId ? <Room /> : <JoinForm />}
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="inline-flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-foreground">
            <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
              M
            </span>
            MeetNote
          </span>
          <p className="mt-4 text-[14px] text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <RoomProvider>
      <MeetingApp />
    </RoomProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;
