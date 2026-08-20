import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, payments, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/paystack";
import { sendTransactionEmail } from "@/lib/email";

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
      const existingPayment = await db
        .select()
        .from(payments)
        .where(eq(payments.paystackRef, reference))
        .get();

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

      const txId = Number(transactionIdFromMeta);

      await db.transaction(async (tx) => {
        const transaction = await tx
          .select()
          .from(transactions)
          .where(eq(transactions.id, txId))
          .get();

        if (!transaction) {
          return;
        }

        if (transaction.status !== "payment_pending") {
          return;
        }

        if (existingPayment) {
          await tx
            .update(payments)
            .set({
              status: "successful",
              gatewayResponse: JSON.stringify(verificationData),
              paidAt: paid_at || new Date().toISOString(),
            })
            .where(eq(payments.paystackRef, reference));
        } else {
          await tx.insert(payments).values({
            transactionId: txId,
            paystackRef: reference,
            amount: verifiedAmount || amount,
            status: "successful",
            gatewayResponse: JSON.stringify(verificationData),
            paidAt: paid_at || new Date().toISOString(),
          });
        }

        await tx
          .update(transactions)
          .set({
            status: "payment_confirmed",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(transactions.id, txId));

        await tx
          .update(products)
          .set({ status: "reserved", updatedAt: new Date().toISOString() })
          .where(eq(products.id, transaction.productId));
      });

      sendTransactionEmail(txId, "payment_confirmed").catch(() => {});

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
