import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { PushSubscription, saveSubscription } from "@/lib/push";

interface SubscriptionBody {
  subscription: PushSubscription;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SubscriptionBody = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    const existing = await db.push_subscriptions.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (existing) {
      await db.push_subscriptions.update({
        where: { userId: session.user.id },
        data: {
          endpoint: subscription.endpoint,
          keys: subscription.keys as unknown as never,
          updatedAt: new Date(),
        },
      });
    } else {
      await db.push_subscriptions.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          keys: subscription.keys as unknown as never,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.push_subscriptions.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
