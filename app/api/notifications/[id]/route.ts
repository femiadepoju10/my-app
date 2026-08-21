import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = parseInt(id, 10);

  if (isNaN(notificationId)) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const notification = await db.notifications.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  if (notification.userId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.notifications.update({
    where: { id: notificationId },
    data: { readAt: new Date().toISOString() },
  });

  return NextResponse.json({ notification: updated });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const notificationId = parseInt(id, 10);

  if (isNaN(notificationId)) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
  }

  const notification = await db.notifications.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  if (notification.userId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ notification });
}
