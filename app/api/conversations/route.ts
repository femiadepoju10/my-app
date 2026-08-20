import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { conversations, messages, users, transactions, products } from "@/lib/db/schema";
import { eq, or, desc, sql } from "drizzle-orm";
import { z } from "zod";

const createConversationSchema = z.object({
  transactionId: z.number().int().positive(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  const userConversations = await db
    .select({
      id: conversations.id,
      transactionId: conversations.transactionId,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      lastMessageAt: conversations.lastMessageAt,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
    .orderBy(desc(conversations.lastMessageAt));

  const enriched = await Promise.all(
    userConversations.map(async (conv) => {
      const otherUserId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
      const otherUser = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, otherUserId))
        .get();

      const product = await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .innerJoin(transactions, eq(transactions.productId, products.id))
        .where(eq(transactions.id, conv.transactionId))
        .get();

      const lastMsg = await db
        .select({ content: messages.content, senderId: messages.senderId, createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)
        .get();

      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(sql`${messages.conversationId} = ${conv.id} AND ${messages.senderId} != ${userId} AND ${messages.readAt} IS NULL`)
        .get();

      return {
        ...conv,
        otherUser,
        product,
        lastMessage: lastMsg || null,
        unreadCount: unreadCount?.count || 0,
      };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = createConversationSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { transactionId } = validated.data;
  const userId = parseInt(session.user.id);

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get();

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ACTIVE_STATUSES = ["payment_pending", "payment_confirmed", "seller_contacted", "item_delivered", "inspection_pending", "accepted", "payout_pending", "payout_completed"];
  if (!ACTIVE_STATUSES.includes(transaction.status)) {
    return NextResponse.json(
      { error: "Cannot create a conversation for a completed or cancelled transaction" },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.transactionId, transactionId))
    .get();

  if (existing) {
    return NextResponse.json({ conversation: existing });
  }

  const [conversation] = await db
    .insert(conversations)
    .values({
      transactionId,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
    })
    .returning();

  return NextResponse.json({ conversation }, { status: 201 });
}
