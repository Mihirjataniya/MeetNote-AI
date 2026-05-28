import { DeepgramClient } from "@deepgram/sdk";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/index";
import { Transcript, type ITranscriptSegment } from "../models/Transcript";
import { Recording } from "../models/Recording";
import { Meeting } from "../models/Meeting";
import { notifyTranscriptStatus } from "./notificationService";
import { recordingService } from "./recordingService";

interface ChunkEntry {
  webmPath: string;
  userId: string;
  chunkStartMs: number;
}

interface PendingBatch {
  chunks: ChunkEntry[];
  timer: ReturnType<typeof setTimeout> | null;
  batchIndex: number;
  isFinal: boolean;
  meetingId: string;
}

const COLLECTION_TIMEOUT_MS = 15_000;

class ChunkTranscriptionService {
  private batches = new Map<string, PendingBatch>();
  private processing = new Map<string, Promise<void>>();

  async onChunkReceived(
    roomId: string,
    webmPath: string,
    chunkStartMs: number,
    isFinal: boolean,
    userId: string
  ): Promise<void> {
    // Resolve meetingId synchronously (before any await) so it's captured
    // while the recording still exists in recordingService.
    const meetingId = recordingService.getMeetingId(roomId);
    if (!meetingId) {
      console.error(`[ChunkTranscription] No meetingId for room ${roomId}`);
      return;
    }

    let batch = this.batches.get(roomId);

    if (!batch) {
      batch = { chunks: [], timer: null, batchIndex: 0, isFinal: false, meetingId };
      this.batches.set(roomId, batch);
    }

    batch.chunks.push({ webmPath, userId, chunkStartMs });
    if (isFinal) batch.isFinal = true;

    const meeting = await Meeting.findById(meetingId).select("participants").lean();
    const activeParticipantCount = meeting
      ? meeting.participants.filter((p) => !p.leftAt).length
      : 1;

    const uniqueUsers = new Set(batch.chunks.map((c) => c.userId));

    if (uniqueUsers.size >= activeParticipantCount || isFinal) {
      this.sealBatch(roomId);
    } else if (!batch.timer) {
      batch.timer = setTimeout(() => this.sealBatch(roomId), COLLECTION_TIMEOUT_MS);
    }
  }

  private sealBatch(roomId: string): void {
    const batch = this.batches.get(roomId);
    if (!batch || batch.chunks.length === 0) return;

    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    const sealed = { ...batch, chunks: [...batch.chunks] };
    const batchIndex = batch.batchIndex;

    batch.chunks = [];
    batch.batchIndex++;
    batch.isFinal = false;

    if (sealed.chunks.length === 0) return;

    const key = `${roomId}:${batchIndex}`;
    const promise = this.processBatch(roomId, sealed.meetingId, sealed.chunks, batchIndex, sealed.isFinal)
      .catch((err) => console.error(`[ChunkTranscription] Batch ${batchIndex} failed for room ${roomId}:`, err))
      .finally(() => this.processing.delete(key));

    this.processing.set(key, promise);
  }

  private async processBatch(
    roomId: string,
    meetingId: string,
    chunks: ChunkEntry[],
    batchIndex: number,
    isFinal: boolean
  ): Promise<void> {
    const existing = await Transcript.findOne({ meetingId });
    if (existing && existing.lastProcessedBatch >= batchIndex) {
      console.log(`[ChunkTranscription] Batch ${batchIndex} already processed for room ${roomId}, skipping`);
      return;
    }

    const webmPaths = chunks.map((c) => c.webmPath);
    const batchStartMs = Math.min(...chunks.map((c) => c.chunkStartMs));
    const roomDir = recordingService.getUploadDir(roomId);

    let wavPath: string;
    try {
      wavPath = await this.mergeToWav(webmPaths, roomDir ?? path.dirname(webmPaths[0]), batchIndex);
    } catch (err) {
      console.error(`[ChunkTranscription] FFmpeg failed for batch ${batchIndex}:`, err);
      if (isFinal) await notifyTranscriptStatus(meetingId, "failed");
      return;
    }

    try {
      const { segments, language } = await this.transcribeWav(wavPath, meetingId, batchStartMs);

      const recording = await Recording.findOne({ meetingId });
      if (!recording) {
        console.error(`[ChunkTranscription] No recording found for meeting ${meetingId}`);
        return;
      }

      if (!existing) {
        await Transcript.create({
          meetingId,
          recordingId: recording._id,
          status: isFinal ? "completed" : "processing",
          language,
          segments,
          fullText: this.buildFullText(segments),
          lastProcessedBatch: batchIndex,
        });
      } else {
        existing.segments.push(...segments);
        existing.fullText = this.buildFullText(existing.segments as ITranscriptSegment[]);
        existing.lastProcessedBatch = batchIndex;
        if (isFinal) existing.status = "completed";
        await existing.save();
      }

      if (isFinal) {
        await notifyTranscriptStatus(meetingId, "completed");
      }

      console.log(
        `[ChunkTranscription] Batch ${batchIndex} processed for room ${roomId} — ${segments.length} segments (final=${isFinal})`
      );
    } catch (err) {
      console.error(`[ChunkTranscription] Deepgram failed for batch ${batchIndex}:`, err);
      if (isFinal) {
        const transcript = await Transcript.findOne({ meetingId });
        if (transcript) {
          transcript.status = "failed";
          await transcript.save();
        }
        await notifyTranscriptStatus(meetingId, "failed");
      }
    } finally {
      try { fs.unlinkSync(wavPath); } catch {}
    }
  }

  private mergeToWav(webmPaths: string[], outputDir: string, batchIndex: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(outputDir, `batch-${batchIndex}.wav`);

      if (webmPaths.length === 1) {
        const ffmpeg = spawn("ffmpeg", [
          "-i", webmPaths[0],
          "-ac", "1", "-ar", "16000", "-y",
          outputPath,
        ]);
        ffmpeg.on("exit", (code) =>
          code === 0 ? resolve(outputPath) : reject(new Error(`FFmpeg exited with code ${code}`))
        );
        ffmpeg.on("error", reject);
        return;
      }

      const args: string[] = [];
      for (const p of webmPaths) {
        args.push("-i", p);
      }
      args.push(
        "-filter_complex", `amix=inputs=${webmPaths.length}:duration=longest`,
        "-ac", "1", "-ar", "16000", "-y",
        outputPath
      );

      const ffmpeg = spawn("ffmpeg", args);
      ffmpeg.on("exit", (code) =>
        code === 0 ? resolve(outputPath) : reject(new Error(`FFmpeg exited with code ${code}`))
      );
      ffmpeg.on("error", reject);
    });
  }

  private async transcribeWav(
    wavPath: string,
    meetingId: string,
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

  private buildFullText(segments: ITranscriptSegment[]): string {
    return segments.map((s) => s.text).join(" ");
  }

  async waitForRoom(roomId: string): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [key, promise] of this.processing.entries()) {
      if (key.startsWith(`${roomId}:`)) {
        promises.push(promise);
      }
    }
    if (promises.length > 0) {
      console.log(`[ChunkTranscription] Waiting for ${promises.length} in-flight batch(es) for room ${roomId}`);
      await Promise.all(promises);
    }

    const batch = this.batches.get(roomId);
    if (batch && batch.chunks.length > 0) {
      this.sealBatch(roomId);
      await this.waitForRoom(roomId);
    }

    this.batches.delete(roomId);
  }
}

export const chunkTranscriptionService = new ChunkTranscriptionService();
