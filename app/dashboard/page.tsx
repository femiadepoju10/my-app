import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Package, ShoppingCart, DollarSign, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = parseInt(session.user.id);

  const [activeCount, purchaseCount, saleCount] = await Promise.all([
    db.products.count({
      where: { sellerId: userId, status: "active" },
    }),
    db.transactions.count({
      where: { buyerId: userId },
    }),
    db.transactions.count({
      where: {
        sellerId: userId,
        status: {
          notIn: ["payment_pending", "rejected", "refund_completed"],
        },
      },
    }),
  ]);

  const stats = [
    {
      label: "Active Listings",
      value: activeCount,
      href: "/dashboard/listings",
      icon: Package,
      color: "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30",
    },
    {
      label: "Purchases",
      value: purchaseCount,
      href: "/dashboard/purchases",
      icon: ShoppingCart,
      color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30",
    },
    {
      label: "Sales",
      value: saleCount,
      href: "/dashboard/sales",
      icon: DollarSign,
      color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 animate-fade-in">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 dark:text-zinc-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {stat.label}
          </p>
          <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {stat.value}
          </p>
        </Link>
      ))}
    </div>
  );
}
