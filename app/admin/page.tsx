import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

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
        notIn: ["payment_pending", "rejected", "disputed", "refund_completed"],
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
