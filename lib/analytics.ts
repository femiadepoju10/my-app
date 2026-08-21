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
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}
