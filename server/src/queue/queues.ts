import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { sqs } from "./sqsClient";
import { config } from "../config/index";

// Logical queue names. Each gets a paired dead-letter queue (<name>-dlq).
export const QUEUE_NAMES = {
  transcribeBatch: "transcribe-batch",
  finalizePipeline: "finalize-pipeline",
  generateNotes: "generate-notes",
} as const;

export type QueueKey = keyof typeof QUEUE_NAMES;

// ---- Message payload shapes (JSON bodies) -------------------------------

export interface TranscribeBatchMessage {
  roomId: string;
  meetingId: string;
  batchIndex: number;
  isFinal: boolean;
  batchStartMs: number;
  webmPaths: string[];
  roomDir: string;
}

export interface FinalizePipelineMessage {
  roomId: string;
  meetingId: string;
  roomDir: string;
  webmPaths: string[];
  startedAtMs: number;
  // Re-enqueue counter for the "wait until batches drain" poll loop.
  attempt: number;
}

export interface GenerateNotesMessage {
  meetingId: string;
}

interface MessageByKey {
  transcribeBatch: TranscribeBatchMessage;
  finalizePipeline: FinalizePipelineMessage;
  generateNotes: GenerateNotesMessage;
}

// Resolved queue URLs, populated by ensureQueues() on boot.
const queueUrls = new Map<QueueKey, string>();

function physicalName(key: QueueKey): string {
  return `${config.sqs.queuePrefix}-${QUEUE_NAMES[key]}`;
}

export function getQueueUrl(key: QueueKey): string {
  const url = queueUrls.get(key);
  if (!url) {
    throw new Error(`Queue URL for "${key}" not initialized. Call ensureQueues() first.`);
  }
  return url;
}

async function createQueueReturningUrl(
  name: string,
  attributes?: Record<string, string>
): Promise<string> {
  // CreateQueue is idempotent: with identical attributes it returns the
  // existing queue's URL instead of erroring.
  const res = await sqs.send(
    new CreateQueueCommand({ QueueName: name, Attributes: attributes })
  );
  if (!res.QueueUrl) throw new Error(`CreateQueue returned no URL for ${name}`);
  return res.QueueUrl;
}

async function getQueueArn(queueUrl: string): Promise<string> {
  const res = await sqs.send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["QueueArn"],
    })
  );
  const arn = res.Attributes?.QueueArn;
  if (!arn) throw new Error(`No QueueArn for ${queueUrl}`);
  return arn;
}

// Creates every main queue plus its dead-letter queue, wiring a redrive
// policy so a message that fails maxReceiveCount deliveries lands in the DLQ.
// Safe to call on every boot.
export async function ensureQueues(): Promise<void> {
  for (const key of Object.keys(QUEUE_NAMES) as QueueKey[]) {
    const mainName = physicalName(key);
    const dlqName = `${mainName}-dlq`;

    const dlqUrl = await createQueueReturningUrl(dlqName);
    const dlqArn = await getQueueArn(dlqUrl);

    const mainUrl = await createQueueReturningUrl(mainName, {
      RedrivePolicy: JSON.stringify({
        deadLetterTargetArn: dlqArn,
        maxReceiveCount: config.sqs.maxReceiveCount,
      }),
    });

    queueUrls.set(key, mainUrl);
    console.log(`[Queue] Ready: ${mainName} (DLQ: ${dlqName})`);
  }
}

// Enqueue a message. delaySeconds (0-900) defers delivery — used by the
// finalize poll loop to back off between drain checks.
export async function enqueue<K extends QueueKey>(
  key: K,
  body: MessageByKey[K],
  delaySeconds = 0
): Promise<void> {
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: getQueueUrl(key),
      MessageBody: JSON.stringify(body),
      ...(delaySeconds > 0 ? { DelaySeconds: Math.min(delaySeconds, 900) } : {}),
    })
  );
}
