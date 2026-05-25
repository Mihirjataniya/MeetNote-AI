import { DeepgramClient } from "@deepgram/sdk";
import fs from "node:fs";
import { config } from "../config/index";
import { Transcript, type ITranscriptSegment } from "../models/Transcript";
import { notifyTranscriptStatus } from "./notificationService";

interface DeepgramUtterance {
  speaker?: number;
  transcript: string;
  start: number;
  end: number;
  confidence: number;
}

class TranscriptionService {
  async transcribe(
    recordingId: string,
    meetingId: string,
    wavPath: string,
    participantNames: string[]
  ): Promise<string> {
    const transcript = await Transcript.create({
      meetingId,
      recordingId,
      status: "processing",
    });

    try {
      const deepgram = new DeepgramClient({ apiKey: config.deepgram.apiKey });
      const audioBuffer = fs.readFileSync(wavPath);

      const response = await deepgram.listen.v1.media.transcribeFile(
        audioBuffer,
        {
          model: "nova-2",
          diarize: true,
          punctuate: true,
          utterances: true,
          smart_format: true,
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response as any;
      const results = result?.results;
      const utterances = ((results?.utterances as DeepgramUtterance[]) ?? []);
      const channels = results?.channels as Array<Record<string, unknown>> | undefined;

      const segments: ITranscriptSegment[] = utterances.map((u) => {
        const speakerIndex = u.speaker ?? 0;
        const speakerName =
          participantNames[speakerIndex] ?? `Speaker ${speakerIndex + 1}`;
        return {
          speakerName,
          text: u.transcript,
          startMs: Math.round(u.start * 1000),
          endMs: Math.round(u.end * 1000),
          confidence: u.confidence,
        };
      });

      const fullText = segments.map((s) => `${s.speakerName}: ${s.text}`).join("\n");

      transcript.segments = segments;
      transcript.fullText = fullText;
      transcript.language = (channels?.[0]?.detected_language as string) ?? "en";
      transcript.status = "completed";
      await transcript.save();

      console.log(
        `[Transcription] Completed for meeting ${meetingId} — ${segments.length} segments`
      );

      await notifyTranscriptStatus(meetingId, "completed");

      return transcript._id.toString();
    } catch (err) {
      transcript.status = "failed";
      await transcript.save();
      console.error(`[Transcription] Failed for meeting ${meetingId}:`, err);
      await notifyTranscriptStatus(meetingId, "failed");
      throw err;
    }
  }
}

export const transcriptionService = new TranscriptionService();
