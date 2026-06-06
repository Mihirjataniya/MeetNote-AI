import webpush from "web-push";
import { config } from "../config/index";
import { PushSubscription } from "../models/PushSubscription";
import type { NotificationPayload } from "../types/index";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const { publicKey, privateKey, subject } = config.webPush;
  if (!publicKey || !privateKey) {
    console.warn("[Push] VAPID keys not set — push notifications disabled");
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  if (!ensureConfigured()) return;
  const subs = await PushSubscription.find({ userId }).lean();
  if (subs.length === 0) return;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    type: payload.type,
    meetingId: payload.meetingId,
    roomId: payload.roomId,
    id: payload.id,
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        // 410 Gone / 404 Not Found → subscription is dead, prune it.
        if (status === 410 || status === 404) {
          await PushSubscription.deleteOne({ _id: sub._id }).catch(() => undefined);
          console.log(`[Push] pruned dead subscription ${sub._id}`);
        } else {
          console.error("[Push] sendNotification failed:", err);
        }
      }
    })
  );
}
