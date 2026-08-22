import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerRating } from "@/lib/analytics";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sellerId = id;

  if (!sellerId) {
    return NextResponse.json({ error: "Invalid seller ID" }, { status: 400 });
  }

  const seller = await db.users.findUnique({
    where: { id: sellerId, deletedAt: null },
     select: {
       id: true,
       name: true,
       bio: true,
       sellerVerificationStatus: true,
       verifiedAt: true,
       createdAt: true,
     },
  });

  if (!seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const [rating, ratingDistribution, stats] = await Promise.all([
    getSellerRating(sellerId),
    db.reviews.groupBy({
      by: ["rating"],
      where: { revieweeId: sellerId },
      _count: { _all: true },
    }),
    db.$transaction([
      db.transactions.count({
        where: { sellerId, status: "completed" },
      }),
      db.products.count({
        where: { sellerId, status: "active" },
      }),
      db.transactions.count({
        where: { sellerId },
      }),
    ]),
  ]);

  const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingDistribution) {
    distMap[r.rating] = r._count._all;
  }

  const [totalSales, activeListings, totalTransactions] = stats;

  const products = await db.products.findMany({
    where: { sellerId, status: "active" },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      price: true,
      condition: true,
      status: true,
      images: { where: { sortOrder: 0 }, take: 1 },
    },
  });

  return NextResponse.json({
    seller: {
      id: seller.id,
      name: seller.name,
      bio: seller.bio,
      createdAt: seller.createdAt,
      sellerRating: rating,
      ratingDistribution: distMap,
      stats: {
        totalSales,
        activeListings,
        totalTransactions,
      },
      products,
    },
  });
}
