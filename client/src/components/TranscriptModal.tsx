import { useState, useEffect, useRef } from "react";
import { Icon } from "./shell/Icon";
import { getStoredToken } from "../services/auth";

const API_BASE = import.meta.env.VITE_API_URL || "";
const MAX_POLL_MS = 90_000;

interface TranscriptModalProps {
  meetingId: string;
  onClose: () => void;
}

export function TranscriptModal({ meetingId, onClose }: TranscriptModalProps) {
  const [status, setStatus] = useState<"loading" | "completed" | "failed">("loading");
  const [fullText, setFullText] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const poll = async () => {
      if (Date.now() - startedAt > MAX_POLL_MS) {
        if (!cancelled) setStatus("failed");
        stopPolling();
        return;
      }

      try {
        const token = getStoredToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const transcriptRes = await fetch(
          `${API_BASE}/api/meetings/${meetingId}/transcript`,
          { headers }
        );

        if (transcriptRes.ok) {
          const data = await transcriptRes.json();
          if (cancelled) return;

          if (data.status === "completed" && data.fullText) {
            setFullText(data.fullText);
            setStatus("completed");
            stopPolling();
            return;
          }
          if (data.status === "failed") {
            setStatus("failed");
            stopPolling();
            return;
          }
          return;
        }

        const meetingRes = await fetch(
          `${API_BASE}/api/meetings/${meetingId}`,
          { headers }
        );
        if (meetingRes.ok) {
          const meeting = await meetingRes.json();
          if (cancelled) return;
          if (meeting.recordingStatus === "failed") {
            setStatus("failed");
            stopPolling();
            return;
          }
          const waitedMs = Date.now() - startedAt;
          if (waitedMs > 30_000 && meeting.recordingStatus === "recording") {
            setStatus("failed");
            stopPolling();
          }
        }
      } catch {
        // network error — keep trying
      }
    };

    poll();
    intervalRef.current = window.setInterval(poll, 3000);

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [meetingId]);

  const handleDownload = () => {
    if (!fullText) return;
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${meetingId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] max-w-[90vw] rounded-2xl bg-[#1a1a1a] border border-white/[0.08] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-semibold text-white">Meeting Ended</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white/60 animate-spin mb-4" />
            <p className="text-[14px] text-white/60 text-center">
              Generating your transcript...
            </p>
            <p className="text-[12px] text-white/30 mt-1.5 text-center">
              This may take a moment
            </p>
          </div>
        )}

        {status === "completed" && (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center mb-4">
              <Icon name="check" size={24} className="text-[#22c55e]" />
            </div>
            <p className="text-[14px] text-white/80 mb-5 text-center">
              Your transcript is ready
            </p>
            <button
              onClick={handleDownload}
              className="w-full h-11 rounded-xl bg-white text-[#111] font-medium text-[14px] inline-flex items-center justify-center gap-2 hover:bg-white/90 transition-colors active:scale-[0.98]"
            >
              <Icon name="download" size={15} />
              Download Transcript
            </button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#dc2626]/10 flex items-center justify-center mb-4">
              <Icon name="x" size={24} className="text-[#dc2626]" />
            </div>
            <p className="text-[14px] text-white/80 text-center">
              Transcript unavailable
            </p>
            <p className="text-[12px] text-white/30 mt-1.5 text-center">
              The recording or transcription could not be processed
            </p>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl bg-white/[0.08] text-white/70 font-medium text-[13px] inline-flex items-center justify-center hover:bg-white/[0.12] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
