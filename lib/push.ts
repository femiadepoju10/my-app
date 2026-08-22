import webpush from "web-push";
import { db } from "@/lib/db";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_MAILTO = "mailto:admin@passiton.com";

let initialized = false;

function ensureInitialized() {
  if (initialized) return;

  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    initialized = true;
  }
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscription(userId: string, subscription: PushSubscription) {
  await db.push_subscriptions.upsert({
    where: { userId },
    create: {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys as unknown as never,
      updatedAt: new Date(),
    },
    update: {
      endpoint: subscription.endpoint,
      keys: subscription.keys as unknown as never,
      updatedAt: new Date(),
    },
  });
}

export async function deleteSubscriptionByUser(userId: string) {
  await db.push_subscriptions.deleteMany({
    where: { userId },
  });
}

export async function getSubscriptionByUserId(userId: string): Promise<PushSubscription | null> {
  const sub = await db.push_subscriptions.findUnique({
    where: { userId },
    select: { endpoint: true, keys: true },
  });

  if (!sub) return null;

  return {
    endpoint: sub.endpoint,
    keys: sub.keys as unknown as PushSubscription["keys"],
  };
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  ensureInitialized();

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return;
  }

  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription) {
    return;
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      pushPayload,
       { TTL: 24 * 60 * 60 }
    );
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;

    if (statusCode === 404 || statusCode === 410) {
      await deleteSubscriptionByUser(userId);
    }
  }
}
