import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { createNotification } from "@/lib/notifications";

const VALID_STATUSES = ["shipping", "in_transit", "delivered", "confirmed"];
const VALID_TRANSITIONS: Record<string, string[]> = {
  shipping: ["in_transit"],
  in_transit: ["shipping", "delivered"],
  delivered: ["confirmed"],
  confirmed: ["delivered"],
};

const updateSchema = z.object({
  status: z.enum(["shipping", "in_transit", "delivered", "confirmed"]),
  note: z.string().max(500).optional(),
  proofPhoto: z.string().url().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId } = await params;

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
    select: { buyerId: true, sellerId: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";
  if (!isAdmin && transaction.buyerId !== userId && transaction.sellerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tracking = await db.deliveryTracking.findUnique({
    where: { transactionId },
  });

  let result = tracking;

  if (!result) {
    result = await db.deliveryTracking.create({
      data: { transactionId, status: "shipping" },
    });
  }

  return NextResponse.json({ tracking: result });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId } = await params;
  const body = await req.json();
  const validated = updateSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
    select: { buyerId: true, sellerId: true, status: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";
  const isBuyer = transaction.buyerId === userId;
  const isSeller = transaction.sellerId === userId;

  if (!isAdmin && !isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const current = await db.deliveryTracking.findUnique({
    where: { transactionId },
  });

  if (!current) {
    return NextResponse.json({ error: "Delivery tracking not initialized" }, { status: 404 });
  }

  const { status, note, proofPhoto } = validated.data;
  const currentStatus = current.status;

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(status) && !(isAdmin && VALID_STATUSES.includes(status))) {
    return NextResponse.json(
      { error: `Cannot transition from ${currentStatus} to ${status}` },
      { status: 400 }
    );
  }

  if (status === "delivered" && isSeller && !isAdmin) {
    if (currentStatus !== "in_transit") {
      return NextResponse.json(
        { error: "Item must be in_transit before marking as delivered" },
        { status: 400 }
      );
    }
  }

  if (status === "confirmed" && !isBuyer && !isAdmin) {
    return NextResponse.json(
      { error: "Only the buyer can confirm delivery" },
      { status: 403 }
    );
  }

  if (status === "confirmed" && !["delivered", "confirmed"].includes(currentStatus)) {
    return NextResponse.json(
      { error: "Item must be marked delivered before buyer can confirm" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (status === "in_transit" && (currentStatus === "shipping" || isAdmin)) {
    updateData.shippedAt = current.shippedAt || new Date().toISOString();
  }
  if (status === "delivered") {
    updateData.deliveredAt = new Date().toISOString();
    if (note) updateData.deliveredNote = note;
    if (proofPhoto) updateData.proofPhoto = proofPhoto;
  }
  if (status === "confirmed") {
    if (note) updateData.shippedNote = note;
  }

  const updated = await db.deliveryTracking.update({
    where: { transactionId },
    data: updateData,
  });

  let transactionUpdated = false;
  let newTransactionStatus = null;

  if (status === "confirmed" && currentStatus !== "confirmed") {
    const tx = await db.transactions.update({
      where: { id: transactionId },
      data: { status: "inspection_pending", updatedAt: new Date().toISOString() },
    });
    newTransactionStatus = tx.status;
    transactionUpdated = true;

    const message = "You confirmed delivery. The item is now in inspection.";
    await createNotification(transaction.buyerId, "delivery", message, { transactionId });
    await createNotification(transaction.sellerId, "delivery", "Buyer has confirmed delivery of the item.", { transactionId });
  } else {
    const deliveryMessages: Record<string, string> = {
      in_transit: "The seller has marked your item as in transit.",
      delivered: "The seller has marked your item as delivered. Please confirm receipt.",
      confirmed: "You confirmed delivery.",
    };
    const msg = deliveryMessages[status];
    if (msg) {
      const recipientId = status === "confirmed" ? transaction.buyerId : transaction.buyerId;
      await createNotification(recipientId, "delivery", msg, { transactionId });
      const otherId = recipientId === transaction.buyerId ? transaction.sellerId : transaction.buyerId;
      const otherMsg = status === "delivered"
        ? "You marked the item as delivered. Awaiting buyer confirmation."
        : `Delivery status updated to ${status}.`;
      await createNotification(otherId, "delivery", otherMsg, { transactionId });
    }
  }

  return NextResponse.json({
    tracking: updated,
    transactionUpdated,
    newTransactionStatus,
  });
}
