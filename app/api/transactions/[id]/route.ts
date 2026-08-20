import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  transactions,
  products,
  productImages,
  users,
  payments,
  payouts,
  refunds,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { initializeTransaction } from "@/lib/paystack";
import crypto from "crypto";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get();

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const userId = parseInt(session.user.id);
  if (
    transaction.buyerId !== userId &&
    transaction.sellerId !== userId &&
    session.user.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, transaction.productId))
    .get();

  const images = product
    ? await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(productImages.sortOrder)
    : [];

  const buyer = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, transaction.buyerId))
    .get();

  const seller = await db
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, transaction.sellerId))
    .get();

  const payment = await db
    .select()
    .from(payments)
    .where(eq(payments.transactionId, transactionId))
    .get();

  const payout = await db
    .select()
    .from(payouts)
    .where(eq(payouts.transactionId, transactionId))
    .get();

  const refund = await db
    .select()
    .from(refunds)
    .where(eq(refunds.transactionId, transactionId))
    .get();

  return NextResponse.json({
    transaction: {
      ...transaction,
      product: product ? { ...product, images } : null,
      buyer,
      seller,
      payment,
      payout,
      refund,
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get();

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const userId = parseInt(session.user.id);
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

  if (transaction.status === "inspection_pending" && newStatus === "accepted" && !isBuyer) {
    return NextResponse.json(
      { error: "Only the buyer can accept an item" },
      { status: 403 }
    );
  }

  if (transaction.status === "inspection_pending" && newStatus === "rejected" && !isBuyer) {
    return NextResponse.json(
      { error: "Only the buyer can reject an item" },
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

  if (newStatus === "payout_pending" || newStatus === "completed") {
    await db
      .update(products)
      .set({ status: "sold", updatedAt: new Date().toISOString() })
      .where(eq(products.id, transaction.productId));
  }

  if (newStatus === "payout_pending") {
    const existingPayout = await db
      .select()
      .from(payouts)
      .where(eq(payouts.transactionId, transactionId))
      .get();

    if (!existingPayout) {
      await db.insert(payouts).values({
        transactionId,
        sellerId: transaction.sellerId,
        amount: transaction.itemPrice,
        status: "pending",
      });
    }
  }

  if (newStatus === "refund_pending") {
    const existingRefund = await db
      .select()
      .from(refunds)
      .where(eq(refunds.transactionId, transactionId))
      .get();

    if (!existingRefund) {
      await db.insert(refunds).values({
        transactionId,
        amount: transaction.totalAmount,
        reason: body.rejectionReason || null,
        status: "pending",
      });
    }
  }

  if (newStatus === "rejected" || newStatus === "refund_pending" || newStatus === "disputed") {
    await db
      .update(products)
      .set({ status: "active", updatedAt: new Date().toISOString() })
      .where(eq(products.id, transaction.productId));
  }

  await db
    .update(transactions)
    .set(updateData)
    .where(eq(transactions.id, transactionId));

  return NextResponse.json({ success: true, status: newStatus });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = parseInt(id, 10);

  if (isNaN(transactionId)) {
    return NextResponse.json(
      { error: "Invalid transaction ID" },
      { status: 400 }
    );
  }

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get();

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  const userId = parseInt(session.user.id);
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const callbackUrl = `${baseUrl}/checkout/${transaction.id}?reference=${reference}`;

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
