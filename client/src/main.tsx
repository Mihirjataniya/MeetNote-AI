import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import { initTheme } from "./services/userPreferences";

// Apply saved theme before first paint to avoid a light-mode flash.
initTheme();

// Empty when unset — AuthPage hides the Google button in that case, so the
// provider is harmless with no client ID.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
