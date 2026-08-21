import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE = "https://api.paystack.co";

interface PaystackResponse {
  status: boolean;
  message: string;
  data: Record<string, unknown>;
}

export async function initializeTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; reference: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
    }),
  });

  const data: PaystackResponse = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initialize transaction");
  }

  return {
    authorization_url: data.data.authorization_url as string,
    reference: data.data.reference as string,
  };
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  });

  const data: PaystackResponse = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to verify transaction");
  }

  return data.data;
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  const hashBuf = Buffer.from(hash, "hex");
  const sigBuf = Buffer.from(signature, "hex");

  if (hashBuf.length !== sigBuf.length) return false;

  return crypto.timingSafeEqual(hashBuf, sigBuf);
}
