import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { Recording } from "../../models/Recording";
import { Transcript } from "../../models/Transcript";
import { storageService } from "../../services/storageService";
import { transcriptionService } from "../../services/transcriptionService";
import { notifyTranscriptStatus } from "../../services/notificationService";
import { enqueue, type FinalizePipelineMessage } from "../queues";

// Seconds between drain re-checks while waiting for in-flight batches.
const DRAIN_RETRY_DELAY_S = 15;
// Cap the wait (~ attempts * delay) so a stuck batch can't loop forever.
const MAX_DRAIN_ATTEMPTS = 40; // ~10 min

// Finalize a meeting's recording once transcription has settled: confirm all
// incremental batches landed (or run full-file fallback), upload audio to
// Cloudinary, mark the recording ready, then hand off to notes generation.
//
// SQS has no "wait for other jobs" primitive, so the drain wait is modelled
// by re-enqueuing this same message with a delay until the batch count
// matches expectedBatchCount.
export async function handleFinalizePipeline(msg: FinalizePipelineMessage): Promise<void> {
  const { roomId, meetingId, roomDir, attempt } = msg;

  const recording = await Recording.findOne({ meetingId });
  if (!recording) {
    console.warn(`[Finalize] No recording for meeting ${meetingId}, skipping`);
    return;
  }
  // Idempotency: already finalized by a duplicate delivery.
  if (recording.status === "ready" || recording.status === "failed") {
    console.log(`[Finalize] Recording for meeting ${meetingId} already ${recording.status}, skipping`);
    return;
  }

  if (recording.status === "recording") {
    recording.status = "processing";
    recording.stoppedAt = new Date();
    await recording.save();
  }

  const transcript = await Transcript.findOne({ meetingId });
  const incremental = recording.incremental === true;

  // --- Drain wait: incremental path must have every batch transcribed -----
  if (incremental) {
    const expected = transcript?.expectedBatchCount;
    const processed = transcript?.processedBatches?.length ?? 0;
    const drained = expected != null && processed >= expected;

    if (!drained) {
      if (attempt < MAX_DRAIN_ATTEMPTS) {
        await enqueue(
          "finalizePipeline",
          { ...msg, attempt: attempt + 1 },
          DRAIN_RETRY_DELAY_S
        );
        console.log(
          `[Finalize] Waiting on batches for meeting ${meetingId} ` +
            `(${processed}/${expected ?? "?"}, attempt ${attempt + 1}/${MAX_DRAIN_ATTEMPTS})`
        );
        return;
      }
      console.warn(
        `[Finalize] Drain wait exhausted for meeting ${meetingId} ` +
          `(${processed}/${expected ?? "?"}) — proceeding best-effort`
      );
    }
  }

  // Re-scan disk for the authoritative file list (catches late uploads
  // without relying on in-memory recording state).
  const webmPaths = collectWebm(roomDir, msg.webmPaths);

  if (webmPaths.length === 0) {
    console.error(`[Finalize] No audio files for meeting ${meetingId}`);
    recording.status = "failed";
    await recording.save();
    await notifyTranscriptStatus(meetingId, "failed");
    return;
  }

  // --- Upload originals to Cloudinary -------------------------------------
  console.log(`[Finalize] Uploading ${webmPaths.length} file(s) to Cloudinary for meeting ${meetingId}…`);
  const cloudinaryFiles = await storageService.uploadAudioFiles(webmPaths, roomId);

  recording.cloudinaryUrls = cloudinaryFiles;
  recording.durationMs = msg.startedAtMs ? Date.now() - msg.startedAtMs : 0;
  recording.status = "ready";
  await recording.save();

  // --- Transcript: incremental already exists, else full-file fallback ----
  if (!transcript) {
    console.log(`[Finalize] No incremental transcript for meeting ${meetingId}, running full transcription`);
    const wavPath = await mergeToWav(webmPaths, roomDir);
    try {
      await transcriptionService.transcribe(recording._id.toString(), meetingId, wavPath);
    } finally {
      try { fs.unlinkSync(wavPath); } catch {}
    }
  } else if (transcript.status === "processing") {
    transcript.status = "completed";
    await transcript.save();
    await notifyTranscriptStatus(meetingId, "completed");
  }

  // Hand off notes generation to its own queue.
  await enqueue("generateNotes", { meetingId });

  cleanupLocalFiles(webmPaths, roomDir);
  console.log(`[Finalize] Completed for meeting ${meetingId}`);
}

function collectWebm(roomDir: string, fallback: string[]): string[] {
  try {
    const entries = fs
      .readdirSync(roomDir)
      .filter((f) => f.endsWith(".webm"))
      .map((f) => path.join(roomDir, f));
    if (entries.length > 0) return entries;
  } catch {
    // dir gone — fall through to payload list
  }
  return fallback.filter((p) => fs.existsSync(p));
}

function mergeToWav(webmPaths: string[], roomDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(roomDir, "mixed.wav");
    const args: string[] = [];
    for (const p of webmPaths) args.push("-i", p);
    if (webmPaths.length > 1) {
      args.push("-filter_complex", `amix=inputs=${webmPaths.length}:duration=longest`);
    }
    args.push("-ac", "1", "-ar", "16000", "-y", outputPath);

    const ffmpeg = spawn("ffmpeg", args);
    ffmpeg.on("exit", (code) =>
      code === 0 ? resolve(outputPath) : reject(new Error(`FFmpeg merge exited with code ${code}`))
    );
    ffmpeg.on("error", reject);
  });
}

function cleanupLocalFiles(webmPaths: string[], roomDir: string): void {
  for (const p of webmPaths) {
    try { fs.unlinkSync(p); } catch {}
  }
  try { fs.rmdirSync(roomDir); } catch {}
}
