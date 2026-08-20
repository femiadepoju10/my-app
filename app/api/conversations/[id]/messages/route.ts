import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { messages, conversations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { pusher } from "@/lib/pusher";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conversationId = parseInt(id, 10);
  const userId = parseInt(session.user.id);

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .get();

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const msgs = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      content: messages.content,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ messages: msgs.reverse() });
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
  const conversationId = parseInt(id, 10);
  const userId = parseInt(session.user.id);

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .get();

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`messages:${userId}`, 30, 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Message limit reached. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const validated = sendMessageSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { content } = validated.data;

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      senderId: userId,
      content: content.trim(),
    })
    .returning();

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date().toISOString() })
    .where(eq(conversations.id, conversationId));

  await pusher.trigger(`private-conversation-${conversationId}`, "new-message", {
    id: message.id,
    senderId: userId,
    content: message.content,
    createdAt: message.createdAt,
  });

  return NextResponse.json({ message }, { status: 201 });
}
