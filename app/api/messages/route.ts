import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

const MESSAGE_STATUS_ALLOW_CHAT = new Set([
  "payment_confirmed", "seller_contacted", "item_delivered",
  "inspection_pending", "accepted", "payout_pending", "payout_completed",
  "completed", "rejected", "disputed", "refund_pending", "refund_completed",
]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
  }

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      status: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const isParticipant =
    transaction.buyerId === session.user.id || transaction.sellerId === session.user.id;

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!MESSAGE_STATUS_ALLOW_CHAT.has(transaction.status)) {
    return NextResponse.json(
      { error: "Chat is not available for this transaction status" },
      { status: 403 }
    );
  }

  const messages = await db.messages.findMany({
    where: { transactionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      message: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true } },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { transactionId, message } = body;

  if (!transactionId || typeof transactionId !== "string") {
    return NextResponse.json({ error: "Valid transactionId is required" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: "Message exceeds 2000 character limit" }, { status: 400 });
  }

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
    select: {
      buyerId: true,
      sellerId: true,
      status: true,
    },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const isParticipant =
    transaction.buyerId === session.user.id || transaction.sellerId === session.user.id;

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!MESSAGE_STATUS_ALLOW_CHAT.has(transaction.status)) {
    return NextResponse.json(
      { error: "Chat is not available for this transaction status" },
      { status: 403 }
    );
  }

  const newMessage = await db.messages.create({
    data: {
      transactionId,
      senderId: session.user.id,
      message: message.trim(),
    },
    select: {
      id: true,
      message: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true } },
    },
  });

  return NextResponse.json({ message: newMessage }, { status: 201 });
}
