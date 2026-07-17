import { DeepgramClient } from "@deepgram/sdk";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { config } from "../../config/index";
import { Transcript, type ITranscriptSegment } from "../../models/Transcript";
import { Recording } from "../../models/Recording";
import { notifyTranscriptStatus } from "../../services/notificationService";
import type { TranscribeBatchMessage } from "../queues";

// Transcribe one sealed batch of per-participant webm chunks. Idempotent:
// duplicate SQS deliveries (and out-of-order batches) are guarded by the
// processedBatches set, so re-running a batch is a no-op and a late batch is
// never skipped because a higher-indexed one already landed.
export async function handleTranscribeBatch(msg: TranscribeBatchMessage): Promise<void> {
  const { roomId, meetingId, batchIndex, isFinal, batchStartMs, webmPaths, roomDir } = msg;

  const existing = await Transcript.findOne({ meetingId }).select("processedBatches");
  if (existing?.processedBatches?.includes(batchIndex)) {
    console.log(`[TranscribeBatch] Batch ${batchIndex} already processed for room ${roomId}, skipping`);
    return;
  }

  const existingPaths = webmPaths.filter((p) => fs.existsSync(p));
  if (existingPaths.length === 0) {
    // Normally means the room dir was already cleaned up. BUT: if this fires on
    // every batch, this process is likely a rogue consumer on a machine that
    // doesn't have the recording files (e.g. a dev box polling the prod queues
    // — set SQS_WORKER_ENABLED=false / a dev SQS_QUEUE_PREFIX locally). It
    // marks the batch processed with 0 segments, silently emptying the
    // transcript for everyone sharing the DB.
    console.error(
      `[TranscribeBatch] No source files for batch ${batchIndex} (room ${roomId}) on host ${os.hostname()} — marking processed with 0 segments`
    );
    await markProcessed(meetingId, batchIndex, isFinal, []);
    return;
  }

  let wavPath: string;
  try {
    wavPath = await mergeToWav(existingPaths, roomDir, batchIndex);
  } catch (err) {
    console.error(`[TranscribeBatch] FFmpeg failed for batch ${batchIndex}:`, err);
    if (isFinal) await notifyTranscriptStatus(meetingId, "failed");
    throw err; // let SQS retry / DLQ
  }

  try {
    const { segments, language } = await transcribeWav(wavPath, batchStartMs);
    await markProcessed(meetingId, batchIndex, isFinal, segments, language);
    console.log(
      `[TranscribeBatch] Batch ${batchIndex} processed for room ${roomId} — ${segments.length} segments (final=${isFinal})`
    );
  } catch (err) {
    console.error(`[TranscribeBatch] Deepgram failed for batch ${batchIndex}:`, err);
    if (isFinal) await notifyTranscriptStatus(meetingId, "failed");
    throw err;
  } finally {
    try { fs.unlinkSync(wavPath); } catch {}
  }
}

async function markProcessed(
  meetingId: string,
  batchIndex: number,
  isFinal: boolean,
  segments: ITranscriptSegment[],
  language?: string
): Promise<void> {
  const recording = await Recording.findOne({ meetingId }).select("_id");
  if (!recording) {
    console.error(`[TranscribeBatch] No recording for meeting ${meetingId}`);
    throw new Error(`No recording for meeting ${meetingId}`);
  }

  const updated = await Transcript.findOneAndUpdate(
    { meetingId },
    {
      $setOnInsert: {
        meetingId,
        recordingId: recording._id,
        ...(language ? { language } : {}),
      },
      ...(segments.length ? { $push: { segments: { $each: segments } } } : {}),
      $addToSet: { processedBatches: batchIndex },
      $max: {
        lastProcessedBatch: batchIndex,
        // Final batch index + 1 = total sealed batches. $max keeps it
        // monotonic if a late straggler is sealed after the "final" one.
        ...(isFinal ? { expectedBatchCount: batchIndex + 1 } : {}),
      },
    },
    { upsert: true, new: true }
  );

  if (!updated.status || updated.status === "pending") {
    updated.status = "processing";
  }
  updated.fullText = buildFullText(updated.segments as ITranscriptSegment[]);
  await updated.save();
}

function mergeToWav(webmPaths: string[], outputDir: string, batchIndex: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(outputDir, `batch-${batchIndex}.wav`);

    const args: string[] = [];
    for (const p of webmPaths) args.push("-i", p);
    if (webmPaths.length > 1) {
      // normalize=0 sums inputs instead of averaging them. Without it amix
      // divides every input's volume by the input count, so mixing a speaker
      // with silent/quiet participant tracks attenuates the speech (halved for
      // 2 inputs, worse for more) until Deepgram returns 0 utterances.
      args.push("-filter_complex", `amix=inputs=${webmPaths.length}:duration=longest:normalize=0`);
    }
    args.push("-ac", "1", "-ar", "16000", "-y", outputPath);

    const ffmpeg = spawn("ffmpeg", args);
    ffmpeg.on("exit", (code) =>
      code === 0 ? resolve(outputPath) : reject(new Error(`FFmpeg exited with code ${code}`))
    );
    ffmpeg.on("error", reject);
  });
}

async function transcribeWav(
  wavPath: string,
  batchStartMs: number
): Promise<{ segments: ITranscriptSegment[]; language: string }> {
  const deepgram = new DeepgramClient({
    apiKey: config.deepgram.apiKey,
    timeoutInSeconds: 300,
  });
  const audioBuffer = fs.readFileSync(wavPath);

  const response = await deepgram.listen.v1.media.transcribeFile(audioBuffer, {
    model: "nova-2",
    punctuate: true,
    utterances: true,
    smart_format: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = response as any;
  const utterances = (result?.results?.utterances ?? []) as Array<{
    transcript: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  const channels = result?.results?.channels as Array<Record<string, unknown>> | undefined;
  const language = (channels?.[0]?.detected_language as string) ?? "en";

  const segments = utterances.map((u) => ({
    text: u.transcript,
    startMs: Math.round(u.start * 1000) + batchStartMs,
    endMs: Math.round(u.end * 1000) + batchStartMs,
    confidence: u.confidence,
  }));

  return { segments, language };
}

function buildFullText(segments: ITranscriptSegment[]): string {
  // Segments carry absolute startMs, so order by it regardless of the
  // (possibly out-of-order) arrival of batches.
  return [...segments]
    .sort((a, b) => a.startMs - b.startMs)
    .map((s) => s.text)
    .join(" ");
}
