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

    return `You are a professional meeting documentation specialist. Your job is to transform raw meeting transcripts into clean, well-structured, publication-ready meeting notes.

## Meeting Context
- Title: ${title}
- Agenda: ${agenda}
- Participants: ${participantNames}
- Date: ${startedAt}
- Duration: ${duration}

## Transcript
${fullText}

## Output Rules

1. Output ONLY the markdown content. No preamble, no explanation, no wrapping code fences.
2. Use proper markdown hierarchy: # for the title, ## for major sections, ### for sub-topics.
3. Be concise and precise. Every sentence should carry information — no filler or padding.
4. Only include sections that have real content from the transcript. If there were no decisions, do NOT include a "Decisions Made" section. If there were no action items, do NOT include an "Action Items" section. Omit empty sections entirely.
5. Do not fabricate, infer, or embellish anything not explicitly stated in the transcript.
6. Use bullet points (- ) for lists, numbered lists (1.) for sequential items or decisions, and checklists (- [ ]) for action items.
7. For key discussion points, group related ideas under ### sub-headings rather than flat bullet lists.
8. Keep the summary tight — 2-3 sentences maximum.

## Required Structure

# ${title}

> **Date:** ${startedAt} &nbsp;|&nbsp; **Duration:** ${duration} &nbsp;|&nbsp; **Participants:** ${participantNames}

---

## Summary
[2-3 sentence executive summary — what was this meeting about and what was the outcome]

## Key Discussion Points
### [Topic Name]
- Key point with context
- Supporting detail

### [Another Topic]
- Key point with context

[Include as many topic sub-sections as needed to cover the discussion]

## Decisions Made
[Only if decisions were explicitly made — numbered list]

## Action Items
[Only if action items were assigned — checklist format]
- [ ] **[Person]:** Task description *(deadline if mentioned)*

## Notes
[Only if there are additional observations worth capturing — e.g., open questions, risks, follow-ups]

---
*Generated by MeetNote*`;
  }
}

export const meetingNotesService = new MeetingNotesService();
