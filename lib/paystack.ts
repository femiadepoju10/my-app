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

export async function createTransferRecipient(params: {
  name: string;
  account_number: string;
  bank_code: string;
}): Promise<{ recipient_code: string; id: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      type: "nuban",
    }),
  });

  const data: PaystackResponse = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to create transfer recipient");
  }

  return {
    recipient_code: data.data.recipient_code as string,
    id: data.data.id as string,
  };
}

export async function initiateTransfer(params: {
  amount: number;
  recipient: string;
  reference?: string;
  reason?: string;
}): Promise<{ reference: string; id: string; status: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: params.amount,
      recipient: params.recipient,
      reference: params.reference || `SB_PAYOUT_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      reason: params.reason || "Marketplace payout",
    }),
  });

  const data: PaystackResponse = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initiate transfer");
  }

  return {
    reference: data.data.reference as string,
    id: data.data.id as string,
    status: data.data.status as string,
  };
}

export async function verifyTransfer(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transfer/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  });

  const data: PaystackResponse = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to verify transfer");
  }

  return data.data;
}

export async function initiateRefund(params: {
  transaction: string;
  amount?: number;
  currency?: string;
}): Promise<{ reference: string; id: string; status: string }> {
  const body: Record<string, unknown> = {
    transaction: params.transaction,
    currency: params.currency || "NGN",
  };

  if (params.amount) {
    body.amount = params.amount;
  }

  const res = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data: PaystackResponse = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initiate refund");
  }

  return {
    reference: data.data.reference as string,
    id: data.data.id as string,
    status: data.data.status as string,
  };
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
