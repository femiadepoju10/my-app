import { db } from "@/lib/db";
import { Twilio } from "twilio";

const SMS_PROVIDER = process.env.SMS_PROVIDER || "twilio";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const SMS_TYPES = new Set(["payment", "dispute", "refund", "payout"]);
const MAX_SMS_PER_DAY = 5;
const MAX_SMS_LENGTH = 160;

let twilioClient: Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

const smsCountMap: Map<string, { count: number; date: string }> = new Map();

function canSendSms(userId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const record = smsCountMap.get(userId);

  if (!record || record.date !== today) {
    smsCountMap.set(userId, { count: 1, date: today });
    return true;
  }

  if (record.count >= MAX_SMS_PER_DAY) {
    return false;
  }

  record.count++;
  return true;
}

function truncateSms(message: string): string {
  if (message.length <= MAX_SMS_LENGTH) {
    return message;
  }
  return message.substring(0, MAX_SMS_LENGTH - 3) + "...";
}

export async function sendSms(
  userId: string,
  type: string,
  message: string
) {
  if (!SMS_TYPES.has(type)) {
    return;
  }

  if (!canSendSms(userId)) {
    console.log(`[SMS] Rate limit exceeded for user ${userId}, skipping SMS`);
    return;
  }

  const user = await db.users.findUnique({
    where: { id: userId },
    select: { phone: true, smsEnabled: true },
  });

  if (!user || !user.smsEnabled || !user.phone) {
    return;
  }

  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log(`[SMS] Provider not configured, would send to ${user.phone}: ${message}`);
    return;
  }

  try {
    const truncated = truncateSms(message);

    await twilioClient.messages.create({
      body: truncated,
      from: TWILIO_PHONE_NUMBER,
      to: user.phone,
    });
  } catch (error) {
    console.error(`[SMS] Failed to send to user ${userId}:`, error);
  }
}
