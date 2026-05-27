import fs from "node:fs";
import { recordingService } from "./recordingService";
import { storageService } from "./storageService";
import { transcriptionService } from "./transcriptionService";
import { chunkTranscriptionService } from "./chunkTranscriptionService";
import { notifyTranscriptStatus } from "./notificationService";
import { Recording } from "../models/Recording";
import { Transcript } from "../models/Transcript";
import { Meeting } from "../models/Meeting";
import type { IMeeting } from "../models/Meeting";

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
      if (!result || result.webmPaths.length === 0) {
        console.error(`[Pipeline] No audio files for room ${roomId}`);
        recording.status = "failed";
        await recording.save();
        return;
      }

      console.log(`[Pipeline] ${result.webmPaths.length} file(s) to process for room ${roomId}`);

      await chunkTranscriptionService.waitForRoom(roomId);

      console.log(`[Pipeline] Uploading to Cloudinary…`);
      const cloudinaryFiles = await storageService.uploadAudioFiles(
        result.webmPaths,
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
          result.webmPaths,
          result.roomDir
        );

        const meeting = (await Meeting.findById(meetingId)) as IMeeting | null;
        const participantNames = meeting
          ? meeting.participants.map((p) => p.displayName)
          : [];

        await transcriptionService.transcribe(
          recording._id.toString(),
          meetingId,
          wavPath,
          participantNames
        );

        this.cleanupLocalFiles(result.webmPaths, result.roomDir, wavPath);
      } else {
        if (existingTranscript.status === "processing") {
          existingTranscript.status = "completed";
          await existingTranscript.save();
          await notifyTranscriptStatus(meetingId, "completed");
        }
        console.log(`[Pipeline] Incremental transcript already exists, skipping transcription`);
        this.cleanupLocalFiles(result.webmPaths, result.roomDir);
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
