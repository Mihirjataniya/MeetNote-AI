import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  type Message,
} from "@aws-sdk/client-sqs";
import { sqs } from "./sqsClient";
import { getQueueUrl, type QueueKey } from "./queues";

interface ConsumerOptions<T> {
  queueKey: QueueKey;
  // Seconds a received message stays invisible while we process it. Must
  // comfortably exceed the worst-case handler runtime (ffmpeg + Deepgram),
  // otherwise SQS redelivers mid-flight and we double-process.
  visibilityTimeout: number;
  handler: (body: T) => Promise<void>;
}

interface RunningConsumer {
  stop: () => void;
}

const consumers: RunningConsumer[] = [];

// Long-polling consumer loop. Pulls one message at a time (handlers are
// CPU/IO heavy, so we favor low concurrency over throughput), runs the
// handler, and deletes the message only on success. On throw we leave the
// message: SQS makes it visible again after visibilityTimeout and retries,
// then routes to the DLQ once maxReceiveCount is exceeded.
function startConsumer<T>(opts: ConsumerOptions<T>): RunningConsumer {
  let running = true;
  const queueUrl = getQueueUrl(opts.queueKey);

  async function processMessage(msg: Message): Promise<void> {
    if (!msg.Body || !msg.ReceiptHandle) return;
    let body: T;
    try {
      body = JSON.parse(msg.Body) as T;
    } catch (err) {
      console.error(`[Worker:${opts.queueKey}] Bad JSON, deleting message:`, err);
      await sqs.send(
        new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: msg.ReceiptHandle })
      );
      return;
    }

    await opts.handler(body);

    await sqs.send(
      new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: msg.ReceiptHandle })
    );
  }

  async function loop(): Promise<void> {
    console.log(`[Worker:${opts.queueKey}] Started`);
    while (running) {
      try {
        const res = await sqs.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20, // long poll — cheap, near-realtime
            VisibilityTimeout: opts.visibilityTimeout,
          })
        );

        for (const msg of res.Messages ?? []) {
          try {
            await processMessage(msg);
          } catch (err) {
            console.error(`[Worker:${opts.queueKey}] Handler failed, will retry:`, err);
          }
        }
      } catch (err) {
        // Network/SQS error on the poll itself — back off briefly, keep going.
        console.error(`[Worker:${opts.queueKey}] Poll error:`, err);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    console.log(`[Worker:${opts.queueKey}] Stopped`);
  }

  void loop();
  return { stop: () => { running = false; } };
}

export function registerConsumer<T>(opts: ConsumerOptions<T>): void {
  consumers.push(startConsumer(opts));
}

export function stopConsumers(): void {
  for (const c of consumers) c.stop();
}
