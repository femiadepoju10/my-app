import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const userIds = allUsers.map((u) => u.id);
  const [buyerTxCounts, sellerTxCounts] = userIds.length > 0
    ? await Promise.all([
        db.transactions.groupBy({
          by: ["buyerId"],
          where: { buyerId: { in: userIds } },
          _count: { buyerId: true },
        }),
        db.transactions.groupBy({
          by: ["sellerId"],
          where: { sellerId: { in: userIds } },
          _count: { sellerId: true },
        }),
      ])
    : [[], []];

  const buyerTxMap = new Map(buyerTxCounts.map((t) => [t.buyerId, t._count.buyerId]));
  const sellerTxMap = new Map(sellerTxCounts.map((t) => [t.sellerId, t._count.sellerId]));

  return NextResponse.json({
    users: allUsers.map((u) => ({
      ...u,
      transactionCount: (buyerTxMap.get(u.id) || 0) + (sellerTxMap.get(u.id) || 0),
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role } = body;

  if (!userId || !role || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsedUserId = parseInt(userId, 10);
  if (isNaN(parsedUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  if (parsedUserId === parseInt(session.user.id)) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  await db.users.update({
    where: { id: parsedUserId },
    data: { role },
  });

  return NextResponse.json({ success: true });
}
