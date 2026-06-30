import { recordingService } from "./recordingService";
import { chunkTranscriptionService } from "./chunkTranscriptionService";
import { Recording } from "../models/Recording";
import { enqueue } from "../queue/queues";

// Triggered when the last participant leaves. The heavy work (Cloudinary
// upload, full-file fallback transcription, notes) now runs in SQS workers;
// this method only does the live-room-bound steps then enqueues finalize.
class PipelineService {
  async run(
    roomId: string,
    meetingId: string,
    recordingResult?: { webmPaths: string[]; roomDir: string; startedAt: Date } | null
  ): Promise<void> {
    console.log(`[Pipeline] Enqueuing finalize for room ${roomId}, meeting ${meetingId}`);

    const result = recordingResult ?? recordingService.stopRecording(roomId);

    // Seal any leftover accumulated chunks as the final batch before we hand
    // off — must happen here (main process) since accumulation is in-memory.
    await chunkTranscriptionService.flushRoom(roomId);

    const recording = await Recording.findOne({ meetingId }).select("startedAt");

    await enqueue("finalizePipeline", {
      roomId,
      meetingId,
      roomDir: result?.roomDir ?? recordingService.getUploadDir(roomId) ?? "",
      webmPaths: result?.webmPaths ?? [],
      startedAtMs: result?.startedAt
        ? new Date(result.startedAt).getTime()
        : recording?.startedAt
          ? new Date(recording.startedAt).getTime()
          : 0,
      attempt: 0,
    });

    // Drop in-memory recording state; files on disk are consumed by the
    // finalize worker which re-scans the room directory.
    recordingService.cleanup(roomId);
  }
}

export const pipelineService = new PipelineService();
