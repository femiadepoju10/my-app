import { db } from "@/lib/db";

export type TimeRange = "7d" | "30d" | "90d";

function getStartDate(range: TimeRange): Date {
  const now = new Date();
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
}

export async function getRevenueTrend(range: TimeRange = "7d") {
  const start = getStartDate(range);
  const txns = await db.transactions.findMany({
    where: {
      createdAt: { gte: start },
      status: { notIn: ["payment_pending", "rejected", "refund_completed"] },
    },
    select: { createdAt: true, serviceFee: true, itemPrice: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { revenue: number; count: number }>();
  for (const t of txns) {
    const key = t.createdAt.toISOString().slice(0, 10);
    const prev = map.get(key) || { revenue: 0, count: 0 };
    map.set(key, { revenue: prev.revenue + t.serviceFee, count: prev.count + 1 });
  }

  return Array.from(map.entries())
    .map(([date, values]) => ({ date, revenue: values.revenue, count: values.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTransactionTrend(range: TimeRange = "7d") {
  const start = getStartDate(range);
  const txns = await db.transactions.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, number>();
  for (const t of txns) {
    const key = t.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getUserGrowth(range: TimeRange = "7d") {
  const start = getStartDate(range);
  const users = await db.users.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, number>();
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCategoryBreakdown() {
  const txns = await db.transactions.findMany({
    where: {
      status: { notIn: ["payment_pending", "rejected", "refund_completed"] },
    },
    include: { product: { select: { category: true } } },
  });

  const map = new Map<string, number>();
  for (const t of txns) {
    const cat = t.product?.category || "Other";
    map.set(cat, (map.get(cat) || 0) + t.itemPrice);
  }

  return Array.from(map.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export async function getPublicStats() {
  const [totalUsers, totalTransactions, activeListings, totalGMV] = await Promise.all([
    db.users.count({ where: { deletedAt: null } }),
    db.transactions.count({
      where: { status: { notIn: ["payment_pending", "rejected", "refund_completed"] } },
    }),
    db.products.count({ where: { status: "active" } }),
    db.transactions.aggregate({
      _sum: { itemPrice: true },
      where: { status: { notIn: ["payment_pending", "rejected", "refund_completed"] } },
    }),
  ]);

  return {
    totalUsers,
    totalTransactions,
    activeListings,
    totalGMV: totalGMV._sum.itemPrice || 0,
  };
}

export async function getCategoryCounts() {
  const products = await db.products.findMany({
    where: { status: "active" },
    select: { category: true },
  });

  const map = new Map<string, number>();
  for (const p of products) {
    map.set(p.category, (map.get(p.category) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getSellerRating(sellerId: string) {
  const result = await db.reviews.aggregate({
    where: { revieweeId: sellerId },
    _count: { _all: true },
    _avg: { rating: true },
  });

  return {
    average: Math.round((result._avg.rating || 0) * 10) / 10,
    count: result._count._all,
  };
}

export async function getProductWishlistCounts(productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const results = await db.wishlists.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _count: { productId: true },
  });

  const map = new Map<string, number>();
  for (const r of results) {
    map.set(r.productId, r._count.productId);
  }
  return map;
}

export async function getSellerRatings(sellerIds: string[]) {
  if (sellerIds.length === 0) return [];

  const results = await Promise.all(
    sellerIds.map((id) => getSellerRating(id))
  );

  return sellerIds.map((id, i) => ({
    sellerId: id,
    average: results[i].average,
    count: results[i].count,
  }));
}

export async function getSellerRevenueTrend(sellerId: string, range: TimeRange = "7d") {
  const start = getStartDate(range);
  const txns = await db.transactions.findMany({
    where: {
      sellerId,
      createdAt: { gte: start },
      status: { in: ["accepted", "completed", "payout_pending", "payout_completed"] },
    },
    select: { createdAt: true, itemPrice: true, serviceFee: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { revenue: number; count: number }>();
  for (const t of txns) {
    const key = t.createdAt.toISOString().slice(0, 10);
    const prev = map.get(key) || { revenue: 0, count: 0 };
    map.set(key, { revenue: prev.revenue + t.itemPrice, count: prev.count + 1 });
  }

  return Array.from(map.entries())
    .map(([date, values]) => ({ date, revenue: values.revenue, count: values.count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getSellerTransactionTrend(sellerId: string, range: TimeRange = "7d") {
  const start = getStartDate(range);
  const txns = await db.transactions.findMany({
    where: {
      sellerId,
      createdAt: { gte: start },
    },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, number>();
  for (const t of txns) {
    const key = t.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getSellerRatingDistribution(sellerId: string) {
  const reviews = await db.reviews.findMany({
    where: { revieweeId: sellerId },
    select: { rating: true },
  });

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) {
    distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
  }

  return distribution;
}

export async function getSellerStats(sellerId: string) {
  const [completedTxns, completedPayouts, reviews] = await Promise.all([
    db.transactions.findMany({
      where: {
        sellerId,
        status: { in: ["accepted", "completed", "payout_pending", "payout_completed"] },
      },
      select: { itemPrice: true, serviceFee: true, totalAmount: true, status: true },
    }),
    db.payouts.findMany({
      where: { transaction: { sellerId } },
      select: { status: true, amount: true },
    }),
    db.reviews.findMany({
      where: { revieweeId: sellerId },
      select: { rating: true },
    }),
  ]);

  const totalEarnings = completedTxns.reduce((sum, t) => sum + t.itemPrice, 0);
  const totalSales = completedTxns.length;
  const pendingPayouts = completedPayouts.filter((p) => p.status === "pending" || p.status === "processing").length;
  const pendingPayoutAmount = completedPayouts.filter((p) => p.status === "pending" || p.status === "processing").reduce((sum, p) => sum + (p.amount || 0), 0);
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return {
    totalEarnings,
    totalSales,
    pendingPayouts,
    pendingPayoutAmount,
    avgRating,
    reviewCount: reviews.length,
  };
}

export async function getSellerTopProducts(sellerId: string, limit: number = 5) {
  const txns = await db.transactions.findMany({
    where: {
      sellerId,
      status: { in: ["accepted", "completed", "payout_pending", "payout_completed"] },
    },
    select: {
      productId: true,
      itemPrice: true,
      product: {
        select: { title: true, images: { where: { sortOrder: 0 }, take: 1 } },
      },
    },
  });

  const productMap = new Map<string, { id: string; title: string; image: string | null; sales: number; revenue: number }>();
  for (const t of txns) {
    const existing = productMap.get(t.productId) || {
      id: t.productId,
      title: t.product?.title || "Unknown",
      image: t.product?.images[0]?.imageUrl || null,
      sales: 0,
      revenue: 0,
    };
    existing.sales++;
    existing.revenue += t.itemPrice;
    productMap.set(t.productId, existing);
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getDeliveryTracking(transactionId: string) {
  return await db.deliveryTracking.findUnique({
    where: { transactionId },
  });
}

export async function createDeliveryTrackingEntry(transactionId: string) {
  return await db.deliveryTracking.create({
    data: { transactionId, status: "shipping" },
  });
}
