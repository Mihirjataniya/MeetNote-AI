import { Transcript } from "../../models/Transcript";
import { meetingNotesService } from "../../services/meetingNotesService";
import type { GenerateNotesMessage } from "../queues";

// Generate AI meeting notes for a finalized transcript. Idempotent: a
// duplicate delivery after notes already completed is a no-op.
export async function handleGenerateNotes(msg: GenerateNotesMessage): Promise<void> {
  const { meetingId } = msg;

  const transcript = await Transcript.findOne({ meetingId }).select("notesStatus fullText");
  if (!transcript) {
    console.warn(`[GenerateNotes] No transcript for meeting ${meetingId}, skipping`);
    return;
  }
  if (transcript.notesStatus === "completed") {
    console.log(`[GenerateNotes] Notes already completed for meeting ${meetingId}, skipping`);
    return;
  }

  // generate() throws on failure so SQS retries / DLQs; it also flips
  // notesStatus to failed internally for the UI.
  await meetingNotesService.generate(meetingId);
}
