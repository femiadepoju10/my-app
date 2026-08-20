import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, products, transactions, payouts, refunds } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) return null;

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
    .where(sql`${transactions.status} NOT IN ('payment_pending', 'rejected', 'disputed', 'refund_completed')`);

  const [{ pendingPayouts }] = await db
    .select({ pendingPayouts: sql<number>`count(*)` })
    .from(payouts)
    .where(eq(payouts.status, "pending"));

  const [{ pendingRefunds }] = await db
    .select({ pendingRefunds: sql<number>`count(*)` })
    .from(refunds)
    .where(eq(refunds.status, "pending"));

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Users</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalUsers}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Transactions</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{totalTransactions}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Active Listings</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{activeListings}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Revenue (Service Fees)</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(totalRevenue)}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending Payouts</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{pendingPayouts}</p>
          <Link href="/admin/transactions" className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            View all
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Pending Refunds</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">{pendingRefunds}</p>
          <Link href="/admin/transactions" className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline dark:text-zinc-50">
            View all
          </Link>
        </div>
      </div>
    </div>
  );
}
