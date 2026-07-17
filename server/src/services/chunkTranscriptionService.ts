import { Meeting } from "../models/Meeting";
import { Recording } from "../models/Recording";
import { Transcript } from "../models/Transcript";
import { recordingService } from "./recordingService";
import { enqueue } from "../queue/queues";

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

// Live-room batch accumulator. This stays in the main process because
// sealing depends on the current active-participant count and per-room
// timers. Once a batch is sealed it is handed to SQS (transcribe-batch
// queue) where a worker does the heavy ffmpeg + Deepgram work.
class ChunkTranscriptionService {
  private batches = new Map<string, PendingBatch>();

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
      // Flag the recording as incremental so finalize waits for batches
      // instead of running the full-file fallback.
      await Recording.updateOne({ meetingId }, { $set: { incremental: true } });
    }

    batch.chunks.push({ webmPath, userId, chunkStartMs });
    if (isFinal) batch.isFinal = true;

    const meeting = await Meeting.findById(meetingId).select("participants").lean();
    const activeParticipantCount = meeting
      ? meeting.participants.filter((p) => !p.leftAt).length
      : 1;

    const uniqueUsers = new Set(batch.chunks.map((c) => c.userId));

    if (uniqueUsers.size >= activeParticipantCount || isFinal) {
      await this.sealBatch(roomId);
    } else if (!batch.timer) {
      batch.timer = setTimeout(() => {
        this.sealBatch(roomId).catch((err) =>
          console.error(`[ChunkTranscription] Timer seal failed for room ${roomId}:`, err)
        );
      }, COLLECTION_TIMEOUT_MS);
    }
  }

  // Seal whatever has accumulated and enqueue it for transcription.
  private async sealBatch(roomId: string): Promise<void> {
    const batch = this.batches.get(roomId);
    if (!batch || batch.chunks.length === 0) return;

    if (batch.timer) {
      clearTimeout(batch.timer);
      batch.timer = null;
    }

    const chunks = [...batch.chunks];
    const batchIndex = batch.batchIndex;
    const isFinal = batch.isFinal;
    const meetingId = batch.meetingId;

    batch.chunks = [];
    batch.batchIndex++;
    batch.isFinal = false;

    const roomDir = recordingService.getUploadDir(roomId);

    await enqueue("transcribeBatch", {
      roomId,
      meetingId,
      batchIndex,
      isFinal,
      batchStartMs: Math.min(...chunks.map((c) => c.chunkStartMs)),
      webmPaths: chunks.map((c) => c.webmPath),
      roomDir: roomDir ?? "",
    });

    console.log(
      `[ChunkTranscription] Sealed batch ${batchIndex} for room ${roomId} → queued (${chunks.length} chunk(s), final=${isFinal})`
    );
  }

  // Called when a meeting ends. Seals any leftover accumulation as the final
  // batch (so expectedBatchCount gets set even if the client never sent an
  // explicit final chunk), then drops the room's in-memory state.
  async flushRoom(roomId: string): Promise<void> {
    const batch = this.batches.get(roomId);
    if (batch) {
      if (batch.chunks.length > 0) {
        batch.isFinal = true;
        await this.sealBatch(roomId);
      } else if (batch.batchIndex > 0) {
        // Every chunk already sealed, but the client's final flag may never
        // have registered (refresh/tab-close mid-meeting, empty final blob, or
        // the last chunk instant-sealing before leave). Without a final batch,
        // expectedBatchCount stays unset and finalize burns its whole
        // drain-wait window. Backstop: the meeting is over, so the number of
        // sealed batches IS the expected total — record it directly.
        const recording = await Recording.findOne({ meetingId: batch.meetingId }).select("_id");
        if (recording) {
          await Transcript.updateOne(
            { meetingId: batch.meetingId },
            {
              $setOnInsert: { recordingId: recording._id },
              $max: { expectedBatchCount: batch.batchIndex },
            },
            { upsert: true }
          );
        }
      }
    }
    this.batches.delete(roomId);
  }
}

export const chunkTranscriptionService = new ChunkTranscriptionService();
