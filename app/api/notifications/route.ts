import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, type, message } = body;

  if (!userId || !type || !message) {
    return NextResponse.json(
      { error: "userId, type, and message are required" },
      { status: 400 }
    );
  }

  const notification = await db.notifications.create({
    data: {
      userId,
      type,
      message,
    },
  });

  return NextResponse.json({ notification }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const unreadOnly = searchParams.get("unread") === "true";

  const userId = session.user.id;
  const where: Record<string, unknown> = { userId };
  if (unreadOnly) {
    where.readAt = null;
  }

  const [count, notifications] = await Promise.all([
    db.notifications.count({ where }),
    db.notifications.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
  ]);

  return NextResponse.json({
    notifications,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
