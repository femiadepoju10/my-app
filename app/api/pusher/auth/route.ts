import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pusher } from "@/lib/pusher";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.text();
  const socketId = new URLSearchParams(body).get("socket_id");
  const channel = new URLSearchParams(body).get("channel_name");

  if (!socketId || !channel) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  if (channel.startsWith("private-conversation-")) {
    const conversationId = parseInt(channel.replace("private-conversation-", ""), 10);

    if (isNaN(conversationId)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

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

    const authResponse = pusher.authorizeChannel(socketId, channel, {
      user_id: String(userId),
    });

    return NextResponse.json(authResponse);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
