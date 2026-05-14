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
    <div className="app">
      <header className="app-header">
        <h1>MeetNote</h1>
        {user && (
          <div className="user-bar">
            <span className="user-name">{user.displayName}</span>
            <button className="btn-small" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>
      {roomId ? <Room /> : <JoinForm />}
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <h1>MeetNote</h1>
        <p className="loading-text">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <h1>MeetNote</h1>
        <AuthPage />
      </div>
    );
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
