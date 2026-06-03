/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { marked } from "marked";
import { Icon } from "./shell/Icon";
import { fetchTranscriptText, fetchMeetingNotes, type MeetingSummary } from "../services/meetings";

export function formatDuration(ms?: number): string {
  if (!ms) return "";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatWhen(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("en-US", { day: "numeric", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

export function NotesBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-medium">
        Notes ready
      </span>
    );
  }
  if (status === "generating") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium">
        Generating notes...
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-[#dc2626]/10 text-[#f87171] text-[11px] font-medium">
        Notes failed
      </span>
    );
  }
  return null;
}

export function TranscriptBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[11px] font-medium">
        Transcript ready
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium">
        Processing...
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 px-2.5 py-[3px] rounded-full bg-[#dc2626]/10 text-[#f87171] text-[11px] font-medium">
        Failed
      </span>
    );
  }
  return null;
}

async function downloadTranscript(meetingId: string, title?: string) {
  const text = await fetchTranscriptText(meetingId);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title || "transcript"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadNotes(meetingId: string, title?: string) {
  const markdown = await fetchMeetingNotes(meetingId);
  const html = await marked.parse(markdown);

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  container.style.fontSize = "12px";
  container.style.lineHeight = "1.6";
  container.style.color = "#1a1a1a";
  container.style.padding = "20px";
  document.body.appendChild(container);

  const { default: html2pdf } = await import("html2pdf.js");
  await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `${title || "meeting-notes"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}

export function MeetingRow({ m }: { m: MeetingSummary }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadingNotes, setDownloadingNotes] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadTranscript(m.id, m.title);
    } catch {
      console.error("Transcript download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleNotesDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadingNotes) return;
    setDownloadingNotes(true);
    try {
      await downloadNotes(m.id, m.title);
    } catch {
      console.error("Notes download failed");
    } finally {
      setDownloadingNotes(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-[14px] shadow-sm px-4 sm:px-[18px] py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 transition-colors duration-[120ms] hover:bg-surface-hover cursor-pointer">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border flex items-center justify-center text-secondary shrink-0">
          <Icon name="fileText" size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13.5px] sm:text-[14px] font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {m.title || "Untitled Meeting"}
            </span>
            <TranscriptBadge status={m.transcriptStatus} />
            <NotesBadge status={m.notesStatus} />
          </div>
          <div className="text-[11.5px] sm:text-[12px] text-tertiary mt-[3px]">
            {formatWhen(m.startedAt)}
            {m.durationMs ? ` · ${formatDuration(m.durationMs)}` : ""}
            {` · ${m.participantCount} attendees`}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {m.notesStatus === "completed" && (
          <button
            onClick={handleNotesDownload}
            disabled={downloadingNotes}
            title="Download meeting notes as PDF"
            className="shrink-0 h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Icon name="sparkle" size={14} />
          </button>
        )}
        {m.transcriptStatus === "completed" && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="Download transcript"
            className="shrink-0 h-8 w-8 rounded-lg border border-border flex items-center justify-center text-secondary hover:bg-surface-hover hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Icon name="download" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
