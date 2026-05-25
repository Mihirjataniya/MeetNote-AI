import { getStoredToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function uploadRecording(roomId: string, blob: Blob): Promise<void> {
  const token = getStoredToken();
  const form = new FormData();
  form.append("roomId", roomId);
  form.append("audio", blob, "recording.webm");

  const res = await fetch(`${API_BASE}/api/recordings/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }
}
