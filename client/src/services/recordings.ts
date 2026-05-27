import { getStoredToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function uploadChunk(
  roomId: string,
  blob: Blob,
  chunkIndex: number,
  chunkStartMs: number,
  isFinal: boolean
): Promise<void> {
  const token = getStoredToken();
  const form = new FormData();
  form.append("roomId", roomId);
  form.append("audio", blob, `chunk-${chunkIndex}.webm`);
  form.append("chunkIndex", String(chunkIndex));
  form.append("chunkStartMs", String(chunkStartMs));
  form.append("isFinal", String(isFinal));

  const res = await fetch(`${API_BASE}/api/recordings/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }
}
