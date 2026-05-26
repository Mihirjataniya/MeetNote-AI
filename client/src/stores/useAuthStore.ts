import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  registerUser,
  loginUser,
  fetchMe,
  getStoredToken,
  storeToken,
  clearToken,
} from "../services/auth";
import type { AuthUser } from "../services/auth";

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    token: getStoredToken(),
    loading: getStoredToken() !== null,
    error: null,

    hydrate: async () => {
      const { token } = get();
      if (!token) return;
      try {
        const { user } = await fetchMe(token);
        set({ user, loading: false });
      } catch {
        clearToken();
        set({ token: null, user: null, loading: false });
      }
    },

    login: async (email, password) => {
      set({ error: null });
      const res = await loginUser(email, password);
      storeToken(res.token);
      set({ token: res.token, user: res.user });
    },

    register: async (email, password, displayName) => {
      set({ error: null });
      const res = await registerUser(email, password, displayName);
      storeToken(res.token);
      set({ token: res.token, user: res.user });
    },

    logout: () => {
      clearToken();
      set({ token: null, user: null });
    },
  }))
);
