import { ensureQueues, enqueue } from "./queues";
import { registerConsumer, stopConsumers } from "./worker";
import { handleTranscribeBatch } from "./handlers/transcribeBatch";
import { handleFinalizePipeline } from "./handlers/finalizePipeline";
import { handleGenerateNotes } from "./handlers/generateNotes";
import { config } from "../config/index";
import { Recording } from "../models/Recording";
import { Meeting } from "../models/Meeting";
import type {
  TranscribeBatchMessage,
  FinalizePipelineMessage,
  GenerateNotesMessage,
} from "./queues";

export { ensureQueues } from "./queues";

// Start the SQS consumer loops in this process. No-op when disabled (e.g. a
// web-only process whose workers run elsewhere).
export function startWorkers(): void {
  if (!config.sqs.workerEnabled) {
    console.log("[Queue] Workers disabled (SQS_WORKER_ENABLED=false)");
    return;
  }

  registerConsumer<TranscribeBatchMessage>({
    queueKey: "transcribeBatch",
    visibilityTimeout: 600, // ffmpeg mix + Deepgram
    handler: handleTranscribeBatch,
  });
  registerConsumer<FinalizePipelineMessage>({
    queueKey: "finalizePipeline",
    visibilityTimeout: 600, // Cloudinary upload + possible full transcribe
    handler: handleFinalizePipeline,
  });
  registerConsumer<GenerateNotesMessage>({
    queueKey: "generateNotes",
    visibilityTimeout: 300, // Gemini call (+ internal retry/backoff)
    handler: handleGenerateNotes,
  });
}

export function stopWorkers(): void {
  stopConsumers();
}

// Crash recovery: on boot there are no live rooms, so any recording still in
// "recording"/"processing" was orphaned by a previous crash. Re-enqueue a
// finalize job (its drain logic + disk re-scan handle the rest) so the
// meeting doesn't hang forever in a non-terminal state.
export async function recoverStuckRecordings(): Promise<void> {
  const stuck = await Recording.find({ status: { $in: ["recording", "processing"] } }).select(
    "meetingId startedAt"
  );
  if (stuck.length === 0) return;

  console.log(`[Queue] Recovering ${stuck.length} stuck recording(s)`);
  for (const rec of stuck) {
    const meetingId = rec.meetingId.toString();
    const meeting = await Meeting.findById(meetingId).select("roomId").lean();
    if (!meeting) {
      rec.status = "failed";
      await rec.save();
      continue;
    }
    const roomDir = `${config.recordings.dir}/${meeting.roomId}`;
    await enqueue("finalizePipeline", {
      roomId: meeting.roomId,
      meetingId,
      roomDir,
      webmPaths: [],
      startedAtMs: rec.startedAt ? new Date(rec.startedAt).getTime() : 0,
      attempt: 0,
    });
  }
}
