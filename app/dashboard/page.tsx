import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, transactions } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = parseInt(session.user.id);

  const [{ activeCount }] = await db
    .select({ activeCount: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.sellerId, userId), eq(products.status, "active")));

  const [{ purchaseCount }] = await db
    .select({ purchaseCount: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.buyerId, userId));

  const [{ saleCount }] = await db
    .select({ saleCount: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.sellerId, userId));

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Active Listings
        </p>
        <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {activeCount}
        </p>
        <Link
          href="/dashboard/listings"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          View all
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Purchases</p>
        <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {purchaseCount}
        </p>
        <Link
          href="/dashboard/purchases"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          View all
        </Link>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sales</p>
        <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {saleCount}
        </p>
        <Link
          href="/dashboard/sales"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          View all
        </Link>
      </div>
    </div>
  );
}
