import fs from "node:fs";
import { recordingService } from "./recordingService";
import { storageService } from "./storageService";
import { transcriptionService } from "./transcriptionService";
import { chunkTranscriptionService } from "./chunkTranscriptionService";
import { notifyTranscriptStatus } from "./notificationService";
import { Recording } from "../models/Recording";
import { Transcript } from "../models/Transcript";
import { meetingNotesService } from "./meetingNotesService";

class PipelineService {
  private running = new Set<string>();

  async run(
    roomId: string,
    meetingId: string,
    recordingResult?: { webmPaths: string[]; roomDir: string; startedAt: Date } | null
  ): Promise<void> {
    if (this.running.has(roomId)) return;
    this.running.add(roomId);

    console.log(`[Pipeline] Starting for room ${roomId}, meeting ${meetingId}`);

    try {
      const recording = await Recording.findOne({ meetingId, status: "recording" });
      if (!recording) {
        console.warn(`[Pipeline] No recording found for meeting ${meetingId}`);
        return;
      }

      recording.status = "processing";
      recording.stoppedAt = new Date();
      await recording.save();

      const result = recordingResult ?? recordingService.stopRecording(roomId);
      if (!result) {
        console.error(`[Pipeline] No recording result for room ${roomId}`);
        recording.status = "failed";
        await recording.save();
        return;
      }

      // Grace period for late-arriving uploads (final chunk race)
      await new Promise((r) => setTimeout(r, 3000));

      const webmPaths = recordingService.collectFiles(roomId);
      if (webmPaths.length === 0) {
        console.error(`[Pipeline] No audio files for room ${roomId}`);
        recording.status = "failed";
        await recording.save();
        return;
      }

      console.log(`[Pipeline] ${webmPaths.length} file(s) to process for room ${roomId}`);

      await chunkTranscriptionService.waitForRoom(roomId);

      console.log(`[Pipeline] Uploading to Cloudinary…`);
      const cloudinaryFiles = await storageService.uploadAudioFiles(
        webmPaths,
        roomId
      );

      const durationMs = result.startedAt
        ? Date.now() - result.startedAt.getTime()
        : 0;

      recording.cloudinaryUrls = cloudinaryFiles;
      recording.durationMs = durationMs;
      recording.status = "ready";
      await recording.save();

      const existingTranscript = await Transcript.findOne({ meetingId });

      if (!existingTranscript) {
        console.log(`[Pipeline] No incremental transcript found, falling back to full transcription`);
        const wavPath = await recordingService.mergeToWav(
          webmPaths,
          result.roomDir
        );

        await transcriptionService.transcribe(
          recording._id.toString(),
          meetingId,
          wavPath
        );

        meetingNotesService.generate(meetingId).catch((err) =>
          console.error(`[Pipeline] Notes generation failed for meeting ${meetingId}:`, err)
        );

        this.cleanupLocalFiles(webmPaths, result.roomDir, wavPath);
      } else {
        if (existingTranscript.status === "processing") {
          existingTranscript.status = "completed";
          await existingTranscript.save();
          await notifyTranscriptStatus(meetingId, "completed");
        }

        meetingNotesService.generate(meetingId).catch((err) =>
          console.error(`[Pipeline] Notes generation failed for meeting ${meetingId}:`, err)
        );

        console.log(`[Pipeline] Incremental transcript already exists, skipping transcription`);
        this.cleanupLocalFiles(webmPaths, result.roomDir);
      }

      console.log(`[Pipeline] Completed for room ${roomId}`);
    } catch (err) {
      console.error(`[Pipeline] Error for room ${roomId}:`, err);
      await Recording.updateOne(
        { meetingId, status: "processing" },
        { $set: { status: "failed" } }
      );
      await notifyTranscriptStatus(meetingId, "failed");
    } finally {
      this.running.delete(roomId);
      recordingService.cleanup(roomId);
    }
  }

  private cleanupLocalFiles(
    webmPaths: string[],
    roomDir: string,
    wavPath?: string
  ): void {
    for (const p of webmPaths) {
      try { fs.unlinkSync(p); } catch {}
    }
    if (wavPath) {
      try { fs.unlinkSync(wavPath); } catch {}
    }
    try { fs.rmdirSync(roomDir); } catch {}
  }
}

export const pipelineService = new PipelineService();
