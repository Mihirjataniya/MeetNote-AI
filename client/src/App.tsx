import "./styles/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import { AuthPage } from "./components/AuthPage";
import { AppShell } from "./components/shell/AppShell";
import { HomePage } from "./pages/HomePage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MeetingPage } from "./pages/MeetingPage";

function AppRoutes() {
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
    <Routes>
      <Route path="/room/:roomId" element={<MeetingPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
