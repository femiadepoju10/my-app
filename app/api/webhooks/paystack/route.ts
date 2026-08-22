import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/paystack";
import { sendTransactionEmail } from "@/lib/email";
import { notifyTransactionParticipants } from "@/lib/notifications";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const { reference, amount, paid_at } = event.data || {};

    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    try {
      const existingPayment = await db.payments.findFirst({
        where: { paystackRef: reference },
      });

      if (existingPayment && existingPayment.status === "successful") {
        return NextResponse.json({ received: true });
      }

      const verificationData = await verifyTransaction(reference);
      const verifiedStatus = verificationData.status as string;

      if (verifiedStatus !== "success") {
        return NextResponse.json({ received: true });
      }

      const verifiedAmount = (verificationData as Record<string, unknown>)?.amount as number | undefined;
      if (verifiedAmount && verifiedAmount !== amount) {
        return NextResponse.json(
          { error: "Amount mismatch" },
          { status: 400 }
        );
      }

      const transactionIdFromMeta =
        event.data?.metadata?.transaction_id ||
        (verificationData.metadata as Record<string, unknown>)
          ?.transaction_id;

      if (!transactionIdFromMeta) {
        return NextResponse.json(
          { error: "No transaction ID" },
          { status: 400 }
        );
      }

      const txId = String(transactionIdFromMeta);

      await db.$transaction(async (tx) => {
        const transaction = await tx.transactions.findUnique({
          where: { id: txId },
        });

        if (!transaction) {
          return;
        }

        if (transaction.status !== "payment_pending") {
          return;
        }

        if (existingPayment) {
          await tx.payments.update({
            where: { paystackRef: reference },
            data: {
              status: "successful",
              gatewayResponse: JSON.stringify(verificationData),
              paidAt: paid_at || new Date().toISOString(),
            },
          });
        } else {
          await tx.payments.create({
            data: {
              transactionId: txId,
              paystackRef: reference,
              amount: verifiedAmount || amount,
              status: "successful",
              gatewayResponse: JSON.stringify(verificationData),
              paidAt: paid_at || new Date().toISOString(),
            },
          });
        }

        await tx.transactions.update({
          where: { id: txId },
          data: {
            status: "payment_confirmed",
            updatedAt: new Date().toISOString(),
          },
        });

        await tx.products.update({
          where: { id: transaction.productId },
          data: { status: "reserved", updatedAt: new Date().toISOString() },
        });
      });

      sendTransactionEmail(txId, "payment_confirmed").catch(() => {});
      notifyTransactionParticipants(txId, "payment_confirmed").catch(() => {});

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  if (event.event === "transfer.success") {
    const { reference, amount, transferred_at } = event.data || {};
    if (!reference) {
      return NextResponse.json({ error: "Missing transfer reference" }, { status: 400 });
    }

    try {
      const payout = await db.payouts.findFirst({
        where: { paystackRef: reference },
      });

      if (!payout) {
        return NextResponse.json({ received: true });
      }

      if (payout.status === "completed") {
        return NextResponse.json({ received: true });
      }

      await db.$transaction(async (tx) => {
        await tx.payouts.update({
          where: { id: payout.id },
          data: {
            status: "completed",
            paidAt: transferred_at || new Date().toISOString(),
          },
        });

        const txn = await tx.transactions.findUnique({
          where: { id: payout.transactionId },
          select: { productId: true },
        });

        if (txn) {
          await tx.products.update({
            where: { id: txn.productId },
            data: { status: "sold" },
          });
        }

        await tx.transactions.update({
          where: { id: payout.transactionId },
          data: {
            status: "completed",
            updatedAt: new Date().toISOString(),
          },
        });
      });

      sendTransactionEmail(payout.transactionId, "payout_completed").catch(() => {});
      notifyTransactionParticipants(payout.transactionId, "payout_completed").catch(() => {});

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Transfer webhook error:", error);
      return NextResponse.json({ received: true });
    }
  }

  if (event.event === "transfer.failed") {
    const { reference } = event.data || {};
    if (!reference) {
      return NextResponse.json({ received: true });
    }

    try {
      await db.payouts.updateMany({
        where: { paystackRef: reference },
        data: { status: "failed" },
      });
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Transfer failed webhook error:", error);
      return NextResponse.json({ received: true });
    }
  }

  if (event.event === "refund.processed" || event.event === "refund.failed") {
    const { reference } = event.data || {};
    if (!reference) {
      return NextResponse.json({ received: true });
    }

    const isFailed = event.event === "refund.failed";

    try {
      const refund = await db.refunds.findFirst({
        where: { paystackRef: reference },
      });

      if (!refund) {
        return NextResponse.json({ received: true });
      }

      if (isFailed) {
        if (refund.status === "failed") {
          return NextResponse.json({ received: true });
        }
        await db.refunds.update({
          where: { id: refund.id },
          data: { status: "failed" },
        });
        notifyTransactionParticipants(refund.transactionId, "refund_failed").catch(() => {});
        return NextResponse.json({ received: true });
      }

      if (refund.status === "completed") {
        return NextResponse.json({ received: true });
      }

      await db.$transaction(async (tx) => {
        await tx.refunds.update({
          where: { id: refund.id },
          data: {
            status: "completed",
            createdAt: new Date().toISOString(),
          },
        });

        await tx.transactions.update({
          where: { id: refund.transactionId },
          data: {
            status: "refund_completed",
            updatedAt: new Date().toISOString(),
          },
        });

        const txn = await tx.transactions.findUnique({
          where: { id: refund.transactionId },
          select: { productId: true },
        });
        if (txn) {
          await tx.products.update({
            where: { id: txn.productId },
            data: { status: "active" },
          });
        }
      });

      sendTransactionEmail(refund.transactionId, "refund_completed").catch(() => {});
      notifyTransactionParticipants(refund.transactionId, "refund_completed").catch(() => {});

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Refund webhook error:", error);
      return NextResponse.json({ received: true });
    }
  }

  return NextResponse.json({ received: true });
}
