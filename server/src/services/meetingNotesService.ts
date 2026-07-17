import { Transcript } from "../models/Transcript";
import { Meeting, type IMeeting } from "../models/Meeting";
import { notifyNotesStatus } from "./notificationService";
import { generateWithFallback, activeProviders } from "./llm/index";

class MeetingNotesService {
  async generate(meetingId: string): Promise<void> {
    if (activeProviders().length === 0) {
      console.warn("[MeetingNotes] No LLM provider configured (GEMINI_API_KEY / GROQ_API_KEY), skipping notes generation");
      return;
    }

    const transcript = await Transcript.findOne({ meetingId });
    if (!transcript) {
      console.error(`[MeetingNotes] No transcript for meeting ${meetingId}`);
      return;
    }
    if (!transcript.fullText) {
      // Transcription produced no text (silent/empty audio). Nothing to
      // summarize — mark skipped so the UI shows a neutral state instead of
      // hanging on "pending" forever.
      console.warn(`[MeetingNotes] Empty transcript for meeting ${meetingId}, skipping notes`);
      transcript.notesStatus = "skipped";
      await transcript.save();
      await notifyNotesStatus(meetingId, "skipped");
      return;
    }

    transcript.notesStatus = "generating";
    await transcript.save();
    // Push a live "generating" status so the dashboard shows progress
    // immediately after the user leaves, without a manual refresh.
    await notifyNotesStatus(meetingId, "generating");

    try {
      const meeting = await Meeting.findById(meetingId)
        .select("title agenda participants startedAt endedAt durationMs")
        .lean() as Pick<IMeeting, "title" | "agenda" | "participants" | "startedAt" | "endedAt" | "durationMs"> | null;

      const prompt = this.buildPrompt(transcript.fullText, meeting);

      const markdown = await generateWithFallback(prompt);

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
      // Rethrow so the SQS worker leaves the message for retry / DLQ.
      throw err;
    }
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
