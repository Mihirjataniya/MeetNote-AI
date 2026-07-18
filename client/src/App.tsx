import "./styles/index.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queries/queryClient";
import { useAuthStore } from "./stores/useAuthStore";
import "./stores/useSocketStore";
import { AuthPage } from "./components/AuthPage";
import { AppShell } from "./components/shell/AppShell";
import { Toaster } from "./components/shell/Toaster";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { SchedulesPage } from "./pages/SchedulesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MeetingPage } from "./pages/MeetingPage";

useAuthStore.getState().hydrate();

// A guest hit a protected path (e.g. a /room/:id meeting link). Send them
// straight to sign-in, remembering where they were headed so AuthPage can
// bounce them back after auth — instead of dumping them on the landing page.
function SigninRedirect() {
  const location = useLocation();
  const target = location.pathname + location.search;
  return (
    <Navigate to={`/signin?redirect=${encodeURIComponent(target)}`} replace />
  );
}

function AppRoutes() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <span className="inline-flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-foreground">
            <span className="w-[22px] h-[22px] rounded-[6px] bg-accent text-accent-foreground inline-flex items-center justify-center font-display text-[13px] font-bold">
              M
            </span>
            MeetNote Ai
          </span>
          <p className="mt-4 text-[14px] text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="*" element={<SigninRedirect />} />
      </Routes>
    );
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
