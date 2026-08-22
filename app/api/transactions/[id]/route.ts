import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { initializeTransaction, initiateTransfer, createTransferRecipient, initiateRefund } from "@/lib/paystack";
import { sendTransactionEmail } from "@/lib/email";
import { notifyTransactionParticipants } from "@/lib/notifications";
import crypto from "crypto";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = id;

  if (!transactionId) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const userId = session.user.id;
  if (
    transaction.buyerId !== userId &&
    transaction.sellerId !== userId &&
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const product = await db.products.findUnique({
    where: { id: transaction.productId },
  });

  const images = product
    ? await db.productImages.findMany({
        where: { productId: product.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  const buyer = await db.users.findUnique({
    where: { id: transaction.buyerId },
    select: { id: true, name: true, email: true, phone: true },
  });

  const seller = await db.users.findUnique({
    where: { id: transaction.sellerId },
    select: { id: true, name: true, email: true, phone: true },
  });

  const payment = await db.payments.findFirst({
    where: { transactionId },
  });

  const payout = await db.payouts.findFirst({
    where: { transactionId },
  });

  const refund = await db.refunds.findFirst({
    where: { transactionId },
  });

  const review = await db.reviews.findUnique({
    where: { transactionId },
  });

  return NextResponse.json({
    transaction: {
      ...transaction,
      product: product ? { ...product, images } : null,
      buyer,
      seller,
      payment,
      payout,
      refund,
      review,
    },
  });
}

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  payment_pending: ["payment_confirmed"],
  payment_confirmed: ["seller_contacted"],
  seller_contacted: ["item_delivered"],
  item_delivered: ["inspection_pending"],
  inspection_pending: ["accepted", "rejected"],
  accepted: ["payout_pending"],
  payout_pending: ["payout_completed"],
  payout_completed: ["completed"],
  completed: [],
  rejected: ["disputed", "refund_pending"],
  disputed: ["refund_pending", "accepted"],
  refund_pending: ["refund_completed"],
  refund_completed: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = id;

  if (!transactionId) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const userId = session.user.id;
  const isBuyer = transaction.buyerId === userId;
  const isSeller = transaction.sellerId === userId;

  if (!isBuyer && !isSeller && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { status: newStatus } = body;

  if (!newStatus) {
    return NextResponse.json(
      { error: "Status is required" },
      { status: 400 }
    );
  }

  const allowed = VALID_STATUS_TRANSITIONS[transaction.status];
  if (!allowed || !allowed.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Cannot transition from "${transaction.status}" to "${newStatus}"`,
      },
      { status: 400 }
    );
  }

  if (transaction.status === "inspection_pending" && newStatus === "accepted" && !isBuyer && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only the buyer or admin can accept an item" },
      { status: 403 }
    );
  }

  if (transaction.status === "inspection_pending" && newStatus === "rejected" && !isBuyer) {
    return NextResponse.json(
      { error: "Only the buyer can reject an item" },
      { status: 403 }
    );
  }

  if (transaction.status === "disputed" && newStatus === "accepted" && !isBuyer && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only the buyer or admin can accept an item during a dispute" },
      { status: 403 }
    );
  }

  if (transaction.status === "seller_contacted" && newStatus === "item_delivered" && !isSeller) {
    return NextResponse.json(
      { error: "Only the seller can mark item as delivered" },
      { status: 403 }
    );
  }

  if (transaction.status === "item_delivered" && newStatus === "inspection_pending" && !isBuyer) {
    return NextResponse.json(
      { error: "Only the buyer can confirm receipt" },
      { status: 403 }
    );
  }

  if ((transaction.status === "rejected" || transaction.status === "disputed") && newStatus === "refund_pending" && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admin can approve refunds" },
      { status: 403 }
    );
  }

  if (transaction.status === "refund_pending" && newStatus === "refund_completed" && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admin can process refunds" },
      { status: 403 }
    );
  }

  if (transaction.status === "payout_pending" && newStatus === "payout_completed" && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Only admin can confirm payouts" },
      { status: 403 }
    );
  }

  const updateData: Record<string, string> = {
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  if (newStatus === "rejected") {
    if (body.rejectionReason) updateData.rejectionReason = body.rejectionReason;
    if (body.rejectionPhotos) updateData.rejectionPhotos = JSON.stringify(body.rejectionPhotos);
  }

  if (body.disputeNote) {
    updateData.disputeNote = body.disputeNote;
  }

  const finalStatus = newStatus === "accepted" ? "payout_pending" : newStatus;

  let transferReference: string | null = null;
  let refundReference: string | null = null;

  if (finalStatus === "payout_completed") {
    const seller = await db.users.findUnique({
      where: { id: transaction.sellerId },
      select: { id: true, name: true, paystackRecipientCode: true },
    });

    if (!seller?.paystackRecipientCode) {
      return NextResponse.json(
        { error: "Seller has no Paystack recipient set up. Cannot initiate payout." },
        { status: 400 }
      );
    }

    try {
      const transferResult = await initiateTransfer({
        amount: transaction.itemPrice,
        recipient: seller.paystackRecipientCode,
        reason: `PassitOn payout for transaction ${transaction.id}`,
      });
      transferReference = transferResult.reference;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initiate payout";
      return NextResponse.json(
        { error: message },
        { status: 502 }
      );
    }
  }

  if (finalStatus === "refund_completed") {
    const payment = await db.payments.findFirst({
      where: { transactionId },
      select: { paystackRef: true, amount: true, status: true },
    });

    if (!payment?.paystackRef) {
      return NextResponse.json(
        { error: "No payment reference found for this transaction" },
        { status: 400 }
      );
    }

    try {
      const refundResult = await initiateRefund({
        transaction: payment.paystackRef,
        amount: payment.amount,
      });
      refundReference = refundResult.reference;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to initiate refund";
      return NextResponse.json(
        { error: message },
        { status: 502 }
      );
    }
  }

  await db.$transaction(async (tx) => {
    if (finalStatus === "payment_confirmed" || finalStatus === "payout_pending" || finalStatus === "completed") {
      await tx.products.update({
        where: { id: transaction.productId },
        data: { status: "sold", updatedAt: new Date().toISOString() },
      });
    }

    if (finalStatus === "payout_pending") {
      const existingPayout = await tx.payouts.findFirst({
        where: { transactionId },
      });

      if (!existingPayout) {
        await tx.payouts.create({
          data: {
            transactionId,
            sellerId: transaction.sellerId,
            amount: transaction.itemPrice,
            status: "pending",
          },
        });
      }
    }

    if (finalStatus === "refund_pending") {
      const existingRefund = await tx.refunds.findFirst({
        where: { transactionId },
      });

      if (!existingRefund) {
        await tx.refunds.create({
          data: {
            transactionId,
            amount: transaction.totalAmount,
            reason: body.rejectionReason || null,
            status: "pending",
          },
        });
      }
    }

    if (finalStatus === "rejected" || finalStatus === "refund_pending" || finalStatus === "disputed") {
      await tx.products.update({
        where: { id: transaction.productId },
        data: { status: "active", updatedAt: new Date().toISOString() },
      });
    }

    if (finalStatus === "payout_completed") {
      await tx.payouts.updateMany({
        where: { transactionId },
        data: {
          status: "processing",
          paystackRef: transferReference,
          paidAt: new Date().toISOString(),
        },
      });
    }

    if (finalStatus === "refund_completed") {
      await tx.refunds.updateMany({
        where: { transactionId },
        data: {
          status: "processing",
          paystackRef: refundReference,
        },
      });
    }

    await tx.transactions.update({
      where: { id: transactionId },
      data: { ...updateData, status: finalStatus },
    });
  });

  if (newStatus === "accepted") {
    sendTransactionEmail(transactionId, "item_accepted").catch(() => {});
  } else if (newStatus !== "payout_pending") {
    sendTransactionEmail(transactionId, finalStatus).catch(() => {});
  }

  if (finalStatus === "payout_completed") {
    sendTransactionEmail(transactionId, "payout_initiated").catch(() => {});
    notifyTransactionParticipants(transactionId, "payout_initiated").catch(() => {});
  } else if (finalStatus === "refund_completed") {
    sendTransactionEmail(transactionId, "refund_initiated").catch(() => {});
    notifyTransactionParticipants(transactionId, "refund_initiated").catch(() => {});
  } else {
    notifyTransactionParticipants(transactionId, finalStatus).catch(() => {});
  }

  return NextResponse.json({ success: true, status: finalStatus });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = id;

  if (!transactionId) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const userId = session.user.id;
  if (transaction.buyerId !== userId) {
    return NextResponse.json(
      { error: "Only the buyer can initiate payment" },
      { status: 403 }
    );
  }

  if (transaction.status !== "payment_pending") {
    return NextResponse.json(
      { error: "This transaction is no longer awaiting payment" },
      { status: 400 }
    );
  }

  const reference = "SB_" + crypto.randomBytes(8).toString("hex").toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/checkout/${transaction.id}?reference=${reference}`;

  await db.payments.create({
    data: {
      transactionId,
      paystackRef: reference,
      amount: transaction.totalAmount,
      status: "pending",
    },
  });

  try {
    const paystackResult = await initializeTransaction({
      email: session.user.email || "",
      amount: transaction.totalAmount,
      reference,
      callback_url: callbackUrl,
      metadata: {
        transaction_id: transaction.id,
        buyer_id: transaction.buyerId,
        seller_id: transaction.sellerId,
        product_id: transaction.productId,
      },
    });

    return NextResponse.json({
      authorization_url: paystackResult.authorization_url,
      reference: paystackResult.reference,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
