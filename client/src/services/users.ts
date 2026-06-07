import { getStoredToken } from "./auth";
import type { AuthUser } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
}

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getStoredToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function searchUsers(query: string, limit = 10): Promise<UserSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const sp = new URLSearchParams({ q, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/users/search?${sp.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("User search failed");
  const body = (await res.json()) as { users: UserSummary[] };
  return body.users;
}

export async function updateProfile(patch: {
  displayName?: string;
  email?: string;
}): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/users/me`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(patch),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Failed to update profile");
  return body.user as AuthUser;
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/users/me/password`, {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to update password");
  }
}
