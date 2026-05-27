import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/index";

interface RoomRecording {
  roomDir: string;
  startedAt: Date;
  uploadedFiles: string[];
  meetingId: string | null;
}

class RecordingService {
  private recordings = new Map<string, RoomRecording>();

  startRecording(roomId: string, meetingId?: string): void {
    if (this.recordings.has(roomId)) return;

    const roomDir = path.join(config.recordings.dir, roomId);
    fs.mkdirSync(roomDir, { recursive: true });

    this.recordings.set(roomId, {
      roomDir,
      startedAt: new Date(),
      uploadedFiles: [],
      meetingId: meetingId ?? null,
    });

    console.log(`[Recording] Started for room ${roomId}`);
  }

  getUploadDir(roomId: string): string | null {
    return this.recordings.get(roomId)?.roomDir ?? null;
  }

  addUploadedFile(roomId: string, filePath: string): void {
    const recording = this.recordings.get(roomId);
    if (recording) {
      recording.uploadedFiles.push(filePath);
      console.log(`[Recording] File uploaded for room ${roomId}: ${path.basename(filePath)}`);
    }
  }

  stopRecording(roomId: string): { webmPaths: string[]; roomDir: string; startedAt: Date } | null {
    const recording = this.recordings.get(roomId);
    if (!recording) return null;

    this.recordings.delete(roomId);

    const webmPaths = recording.uploadedFiles.filter((f) => fs.existsSync(f));
    console.log(`[Recording] Stopped for room ${roomId}, ${webmPaths.length} file(s)`);
    return { webmPaths, roomDir: recording.roomDir, startedAt: recording.startedAt };
  }

  mergeToWav(webmPaths: string[], roomDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(roomDir, "mixed.wav");

      if (webmPaths.length === 0) {
        reject(new Error("No audio files to merge"));
        return;
      }

      if (webmPaths.length === 1) {
        const ffmpeg = spawn("ffmpeg", [
          "-i", webmPaths[0],
          "-ac", "1",
          "-ar", "16000",
          "-y",
          outputPath,
        ]);
        ffmpeg.on("exit", (code) => {
          if (code === 0) resolve(outputPath);
          else reject(new Error(`FFmpeg merge exited with code ${code}`));
        });
        ffmpeg.on("error", reject);
        return;
      }

      const args: string[] = [];
      for (const p of webmPaths) {
        args.push("-i", p);
      }
      args.push(
        "-filter_complex", `amix=inputs=${webmPaths.length}:duration=longest`,
        "-ac", "1",
        "-ar", "16000",
        "-y",
        outputPath
      );

      const ffmpeg = spawn("ffmpeg", args);
      ffmpeg.on("exit", (code) => {
        if (code === 0) resolve(outputPath);
        else reject(new Error(`FFmpeg merge exited with code ${code}`));
      });
      ffmpeg.on("error", reject);
    });
  }

  getMeetingId(roomId: string): string | null {
    return this.recordings.get(roomId)?.meetingId ?? null;
  }

  isRecording(roomId: string): boolean {
    return this.recordings.has(roomId);
  }
}

export const recordingService = new RecordingService();
