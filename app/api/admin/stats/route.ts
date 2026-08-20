import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, products, transactions, payouts, refunds } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [{ totalUsers }] = await db
    .select({ totalUsers: sql<number>`count(*)` })
    .from(users);

  const [{ totalTransactions }] = await db
    .select({ totalTransactions: sql<number>`count(*)` })
    .from(transactions);

  const [{ activeListings }] = await db
    .select({ activeListings: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.status, "active"));

  const [{ totalRevenue }] = await db
    .select({ totalRevenue: sql<number>`coalesce(sum(${transactions.serviceFee}), 0)` })
    .from(transactions)
    .where(sql`${transactions.status} IN ('completed', 'payout_completed', 'payout_pending')`);

  const [{ pendingPayouts }] = await db
    .select({ pendingPayouts: sql<number>`count(*)` })
    .from(payouts)
    .where(eq(payouts.status, "pending"));

  const [{ pendingRefunds }] = await db
    .select({ pendingRefunds: sql<number>`count(*)` })
    .from(refunds)
    .where(eq(refunds.status, "pending"));

  return NextResponse.json({
    totalUsers,
    totalTransactions,
    activeListings,
    totalRevenue,
    pendingPayouts,
    pendingRefunds,
  });
}
