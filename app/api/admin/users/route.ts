import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, transactions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const userIds = allUsers.map((u) => u.id);
  const txCounts = userIds.length > 0
    ? await db
        .select({
          userId: transactions.buyerId,
          count: sql<number>`count(*)`,
        })
        .from(transactions)
        .where(sql`${transactions.buyerId} IN ${sql.join(userIds.map((id) => sql`${id}`), sql`,`)}`)
        .groupBy(transactions.buyerId)
    : [];

  const txMap = new Map(txCounts.map((t) => [t.userId, t.count]));

  return NextResponse.json({
    users: allUsers.map((u) => ({
      ...u,
      transactionCount: txMap.get(u.id) || 0,
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role } = body;

  if (!userId || !role || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (userId === parseInt(session.user.id)) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
