import fs from "node:fs";
import path from "node:path";
import { config } from "../config/index";

interface RoomRecording {
  roomDir: string;
  startedAt: Date;
  uploadedFiles: string[];
  meetingId: string | null;
  stopped: boolean;
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
      stopped: false,
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
    if (!recording || recording.stopped) return null;

    recording.stopped = true;

    const webmPaths = recording.uploadedFiles.filter((f) => fs.existsSync(f));
    console.log(`[Recording] Stopped for room ${roomId}, ${webmPaths.length} file(s)`);
    return { webmPaths, roomDir: recording.roomDir, startedAt: recording.startedAt };
  }

  collectFiles(roomId: string): string[] {
    const recording = this.recordings.get(roomId);
    if (!recording) return [];
    return recording.uploadedFiles.filter((f) => fs.existsSync(f));
  }

  cleanup(roomId: string): void {
    this.recordings.delete(roomId);
  }

  getMeetingId(roomId: string): string | null {
    return this.recordings.get(roomId)?.meetingId ?? null;
  }

  isRecording(roomId: string): boolean {
    const r = this.recordings.get(roomId);
    return !!r && !r.stopped;
  }

  hasRoom(roomId: string): boolean {
    return this.recordings.has(roomId);
  }
}

export const recordingService = new RecordingService();
