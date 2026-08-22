import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";
import { sendTransactionEmail } from "@/lib/email";
import { notifyTransactionParticipants } from "@/lib/notifications";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const transaction = await db.transactions.findFirst({
    where: {
      payments: {
        some: {
          paystackRef: reference,
        },
      },
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.status !== "payment_pending") {
    return NextResponse.json({ received: true });
  }

  const amountPaid = event.data?.amount;
  const expectedAmount = transaction.totalAmount;
  const eventCurrency = event.data?.currency as string | undefined;

  if (amountPaid !== expectedAmount) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const payment = await db.payments.findFirst({
    where: { transactionId: transaction.id },
  });

  if (payment) {
    await db.payments.update({
      where: { id: payment.id },
      data: {
        status: "successful",
        paidAt: new Date().toISOString(),
        gatewayResponse: JSON.stringify(event.data),
        currency: eventCurrency || transaction.currency,
      },
    });
  } else {
    await db.payments.create({
      data: {
        transactionId: transaction.id,
        paystackRef: reference,
        amount: expectedAmount,
        currency: eventCurrency || transaction.currency,
        status: "successful",
        paidAt: new Date().toISOString(),
        gatewayResponse: JSON.stringify(event.data),
      },
    });
  }

  await db.transactions.update({
    where: { id: transaction.id },
    data: {
      status: "payment_confirmed",
      updatedAt: new Date().toISOString(),
    },
  });

  sendTransactionEmail(transaction.id, "payment_confirmed").catch(() => {});
  notifyTransactionParticipants(transaction.id, "payment_confirmed").catch(() => {});

  return NextResponse.json({ received: true });
}
