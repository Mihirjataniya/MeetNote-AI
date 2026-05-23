import { ChildProcess, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { PlainTransport, Consumer, Router, Producer } from "mediasoup/types";
import { mediasoupService } from "./mediasoupService";
import { config } from "../config/index";

interface PeerRecording {
  plainTransport: PlainTransport;
  consumer: Consumer;
  ffmpeg: ChildProcess;
  filePath: string;
  sdpPath: string;
}

interface RoomRecording {
  peers: Map<string, PeerRecording>;
  roomDir: string;
  startedAt: Date;
}

class RecordingService {
  private recordings = new Map<string, RoomRecording>();

  async startRecording(roomId: string): Promise<void> {
    if (this.recordings.has(roomId)) return;

    const roomDir = path.join(config.recordings.dir, roomId);
    fs.mkdirSync(roomDir, { recursive: true });

    this.recordings.set(roomId, {
      peers: new Map(),
      roomDir,
      startedAt: new Date(),
    });

    console.log(`[Recording] Started for room ${roomId}`);
  }

  async addAudioProducer(
    roomId: string,
    socketId: string,
    producer: Producer,
    router: Router
  ): Promise<void> {
    const recording = this.recordings.get(roomId);
    if (!recording) return;

    const key = `${socketId}_${producer.id}`;
    if (recording.peers.has(key)) return;

    const plainTransport = await mediasoupService.createPlainTransport(router);

    const consumer = await plainTransport.consume({
      producerId: producer.id,
      rtpCapabilities: router.rtpCapabilities,
      paused: false,
    });

    const rtpPort = plainTransport.tuple.localPort;
    const codec = consumer.rtpParameters.codecs[0];
    const payloadType = codec.payloadType;
    const clockRate = codec.clockRate;

    const sdpContent = [
      "v=0",
      "o=- 0 0 IN IP4 127.0.0.1",
      "s=MeetNote Recording",
      "c=IN IP4 127.0.0.1",
      `t=0 0`,
      `m=audio ${rtpPort} RTP/AVP ${payloadType}`,
      `a=rtpmap:${payloadType} opus/${clockRate}/2`,
      `a=fmtp:${payloadType} useinbandfec=1`,
      "a=recvonly",
    ].join("\r\n");

    const sdpPath = path.join(recording.roomDir, `${key}.sdp`);
    const filePath = path.join(recording.roomDir, `${key}.webm`);
    fs.writeFileSync(sdpPath, sdpContent);

    const ffmpeg = spawn("ffmpeg", [
      "-protocol_whitelist", "file,udp,rtp",
      "-i", sdpPath,
      "-c:a", "copy",
      "-y",
      filePath,
    ]);

    ffmpeg.on("error", (err) => {
      console.error(`[Recording] FFmpeg spawn error (${key}):`, err.message);
    });

    ffmpeg.stderr?.on("data", (data: Buffer) => {
      const msg = data.toString();
      if (msg.includes("Error") || msg.includes("error")) {
        console.error(`[Recording] FFmpeg error (${key}):`, msg);
      }
    });

    ffmpeg.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`[Recording] FFmpeg exited with code ${code} for ${key}`);
      }
    });

    recording.peers.set(key, {
      plainTransport,
      consumer,
      ffmpeg,
      filePath,
      sdpPath,
    });

    console.log(`[Recording] Added audio producer ${key} in room ${roomId}`);
  }

  async removeAudioProducer(
    roomId: string,
    socketId: string,
    producerId: string
  ): Promise<void> {
    const recording = this.recordings.get(roomId);
    if (!recording) return;

    const key = `${socketId}_${producerId}`;
    const peer = recording.peers.get(key);
    if (!peer) return;

    this.stopPeerRecording(peer);
    recording.peers.delete(key);
    console.log(`[Recording] Removed audio producer ${key} in room ${roomId}`);
  }

  async removeAllForSocket(roomId: string, socketId: string): Promise<void> {
    const recording = this.recordings.get(roomId);
    if (!recording) return;

    for (const [key, peer] of recording.peers) {
      if (key.startsWith(`${socketId}_`)) {
        this.stopPeerRecording(peer);
        recording.peers.delete(key);
      }
    }
  }

  async stopRecording(roomId: string): Promise<{ webmPaths: string[]; roomDir: string; startedAt: Date } | null> {
    const recording = this.recordings.get(roomId);
    if (!recording) return null;

    const webmPaths: string[] = [];
    for (const [, peer] of recording.peers) {
      this.stopPeerRecording(peer);
      if (fs.existsSync(peer.filePath)) {
        webmPaths.push(peer.filePath);
      }
    }

    await this.waitForFFmpegExit(recording);

    this.recordings.delete(roomId);

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

  isRecording(roomId: string): boolean {
    return this.recordings.has(roomId);
  }

  private stopPeerRecording(peer: PeerRecording): void {
    try { peer.consumer.close(); } catch {}
    try { peer.plainTransport.close(); } catch {}
    if (peer.ffmpeg.exitCode === null) {
      peer.ffmpeg.stdin?.write("q");
      peer.ffmpeg.stdin?.end();
    }
    try { fs.unlinkSync(peer.sdpPath); } catch {}
  }

  private waitForFFmpegExit(recording: RoomRecording): Promise<void> {
    const pending = Array.from(recording.peers.values())
      .filter((p) => p.ffmpeg.exitCode === null)
      .map(
        (p) =>
          new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
              p.ffmpeg.kill("SIGKILL");
              resolve();
            }, 5000);
            p.ffmpeg.on("exit", () => {
              clearTimeout(timeout);
              resolve();
            });
          })
      );
    return Promise.all(pending).then(() => {});
  }
}

export const recordingService = new RecordingService();
