import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalUsers = await db.users.count();
  const totalTransactions = await db.transactions.count();
  const activeListings = await db.products.count({
    where: { status: "active" },
  });

  const totalRevenueResult = await db.transactions.aggregate({
    _sum: {
      serviceFee: true,
    },
    where: {
      status: {
        in: ["completed", "payout_completed", "payout_pending"],
      },
    },
  });

  const totalRevenue = totalRevenueResult._sum.serviceFee || 0;

  const pendingPayouts = await db.payouts.count({
    where: { status: "pending" },
  });

  const pendingRefunds = await db.refunds.count({
    where: { status: "pending" },
  });

  return NextResponse.json({
    totalUsers,
    totalTransactions,
    activeListings,
    totalRevenue,
    pendingPayouts,
    pendingRefunds,
  });
}
