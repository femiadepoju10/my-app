import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  getRevenueTrend,
  getTransactionTrend,
  getUserGrowth,
  getCategoryBreakdown,
} from "@/lib/analytics";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "7d") as "7d" | "30d" | "90d";

  try {
    const [revenue, transactions, users, categories] = await Promise.all([
      getRevenueTrend(range),
      getTransactionTrend(range),
      getUserGrowth(range),
      getCategoryBreakdown(),
    ]);

    return NextResponse.json({ revenue, transactions, users, categories });
  } catch (error) {
    console.error("Failed to fetch admin analytics", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
