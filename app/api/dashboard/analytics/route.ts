import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import {
  getSellerRevenueTrend,
  getSellerTransactionTrend,
  getSellerRatingDistribution,
  getSellerStats,
  getSellerTopProducts,
} from "@/lib/analytics";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") || "7d") as "7d" | "30d" | "90d";
  const sellerId = session.user.id;

  try {
    const [revenue, transactions, ratingDist, stats, topProducts] = await Promise.all([
      getSellerRevenueTrend(sellerId, range),
      getSellerTransactionTrend(sellerId, range),
      getSellerRatingDistribution(sellerId),
      getSellerStats(sellerId),
      getSellerTopProducts(sellerId, 5),
    ]);

    return NextResponse.json({
      revenue,
      transactions,
      ratingDistribution: ratingDist,
      stats,
      topProducts,
    });
  } catch (error) {
    console.error("Failed to fetch seller analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
