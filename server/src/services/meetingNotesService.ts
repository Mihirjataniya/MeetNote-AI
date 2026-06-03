import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/index";
import { Transcript } from "../models/Transcript";
import { Meeting, type IMeeting } from "../models/Meeting";
import { notifyNotesStatus } from "./notificationService";

class MeetingNotesService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }

  async generate(meetingId: string): Promise<void> {
    if (!config.gemini.apiKey) {
      console.warn("[MeetingNotes] No GEMINI_API_KEY configured, skipping notes generation");
      return;
    }

    const transcript = await Transcript.findOne({ meetingId });
    if (!transcript || !transcript.fullText) {
      console.error(`[MeetingNotes] No completed transcript for meeting ${meetingId}`);
      return;
    }

    transcript.notesStatus = "generating";
    await transcript.save();

    try {
      const meeting = await Meeting.findById(meetingId)
        .select("title agenda participants startedAt endedAt durationMs")
        .lean() as Pick<IMeeting, "title" | "agenda" | "participants" | "startedAt" | "endedAt" | "durationMs"> | null;

      const prompt = this.buildPrompt(transcript.fullText, meeting);

      const markdown = await this.callWithRetry(prompt, 2);

      transcript.meetingNotes = markdown;
      transcript.notesStatus = "completed";
      await transcript.save();

      await notifyNotesStatus(meetingId, "completed");

      console.log(`[MeetingNotes] Generated for meeting ${meetingId} (${markdown.length} chars)`);
    } catch (err) {
      transcript.notesStatus = "failed";
      await transcript.save();
      await notifyNotesStatus(meetingId, "failed");
      console.error(`[MeetingNotes] Failed for meeting ${meetingId}:`, err);
    }
  }

  private async callWithRetry(prompt: string, maxRetries: number): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: config.gemini.model });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 429 && attempt < maxRetries) {
          const delayMs = (attempt + 1) * 40_000;
          console.warn(`[MeetingNotes] Rate limited, retrying in ${delayMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw err;
      }
    }

    throw new Error("Unreachable");
  }

  private buildPrompt(
    fullText: string,
    meeting: Pick<IMeeting, "title" | "agenda" | "participants" | "startedAt" | "endedAt" | "durationMs"> | null
  ): string {
    const participants = meeting?.participants ?? [];
    const participantNames = participants.map((p) => p.displayName).join(", ") || "Unknown";

    const title = meeting?.title || "Untitled Meeting";
    const agenda = meeting?.agenda || "No agenda provided";

    const startedAt = meeting?.startedAt
      ? new Date(meeting.startedAt).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "Unknown";

    const durationMs = meeting?.durationMs;
    let duration = "Unknown";
    if (durationMs) {
      const totalMin = Math.round(durationMs / 60000);
      if (totalMin < 60) {
        duration = `${totalMin} minutes`;
      } else {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        duration = m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
    }

    return `You are a professional meeting notes assistant. Generate structured, comprehensive meeting notes from the following transcript.

## Meeting Context
- **Title:** ${title}
- **Agenda:** ${agenda}
- **Participants:** ${participantNames}
- **Date:** ${startedAt}
- **Duration:** ${duration}

## Transcript
${fullText}

## Instructions
Generate meeting notes in Markdown format with these exact sections:

# ${title}
**Date:** ${startedAt} | **Duration:** ${duration} | **Participants:** ${participantNames}

## Summary
A 2-3 sentence executive summary of the meeting.

## Key Discussion Points
Bullet points of the main topics discussed, with sub-bullets for important details and context.

## Decisions Made
Numbered list of decisions reached during the meeting. If none, write "No formal decisions recorded."

## Action Items
A checklist with format: - [ ] **[Person]:** Description (deadline if mentioned)
If no action items, write "No action items identified."

## Additional Notes
Any additional important context, concerns raised, or follow-up items.

Keep the notes professional and concise. Only include information that was actually discussed in the transcript. Do not fabricate any details.`;
  }
}

export const meetingNotesService = new MeetingNotesService();
