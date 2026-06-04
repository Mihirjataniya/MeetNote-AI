import { getStoredToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface UserSummary {
  id: string;
  displayName: string;
  email: string;
}

export async function searchUsers(query: string, limit = 10): Promise<UserSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const token = getStoredToken();
  const sp = new URLSearchParams({ q, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/users/search?${sp.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("User search failed");
  const body = (await res.json()) as { users: UserSummary[] };
  return body.users;
}
