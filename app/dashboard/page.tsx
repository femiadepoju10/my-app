import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Package, ShoppingCart, DollarSign, ArrowRight, TrendingUp, Activity, Bell } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Separator } from "@/components/ui/Separator";

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfLastWeek(date: Date) {
  const thisWeekStart = getStartOfWeek(date);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return lastWeekStart;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const userId = parseInt(session.user.id);

  const now = new Date();
  const thisWeekStart = getStartOfWeek(now);
  const lastWeekStart = getStartOfLastWeek(now);

  const [
    activeCount,
    activeLastWeek,
    purchaseCount,
    purchasesThisWeek,
    saleCount,
    salesThisWeek,
    totalRevenueResult,
    revenueLastWeekResult,
    recentNotifications,
  ] = await Promise.all([
    db.products.count({ where: { sellerId: userId, status: "active" } }),
    db.products.count({ where: { sellerId: userId, status: "active", createdAt: { lt: thisWeekStart } } }),
    db.transactions.count({ where: { buyerId: userId } }),
    db.transactions.count({ where: { buyerId: userId, createdAt: { gte: thisWeekStart } } }),
    db.transactions.count({
      where: {
        sellerId: userId,
        status: { notIn: ["payment_pending", "rejected", "refund_completed"] },
      },
    }),
    db.transactions.count({
      where: {
        sellerId: userId,
        status: { notIn: ["payment_pending", "rejected", "refund_completed"] },
        createdAt: { gte: thisWeekStart },
      },
    }),
    db.transactions.aggregate({
      _sum: { itemPrice: true },
      where: { sellerId: userId, status: { in: ["accepted", "payout_pending", "payout_completed", "completed"] } },
    }),
    db.transactions.aggregate({
      _sum: { itemPrice: true },
      where: {
        sellerId: userId,
        status: { in: ["accepted", "payout_pending", "payout_completed", "completed"] },
        createdAt: { gte: lastWeekStart, lt: thisWeekStart },
      },
    }),
    db.notifications.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = totalRevenueResult._sum.itemPrice || 0;
  const revenueLastWeek = revenueLastWeekResult._sum.itemPrice || 0;

  const activeTrend = activeLastWeek > 0 ? Math.round(((activeCount - activeLastWeek) / activeLastWeek) * 100) : 0;
  const purchaseTrend = purchasesThisWeek;
  const saleTrend = salesThisWeek;
  const revenueTrend = revenueLastWeek > 0 ? Math.round(((totalRevenue - revenueLastWeek) / revenueLastWeek) * 100) : 0;

  const stats = [
    {
      label: "Active Listings",
      value: activeCount,
      href: "/dashboard/listings",
      icon: Package,
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
      trend: activeTrend >= 0 ? `+${activeTrend}% this week` : `${activeTrend}% this week`,
      trendPositive: activeTrend >= 0,
    },
    {
      label: "Purchases",
      value: purchaseCount,
      href: "/dashboard/purchases",
      icon: ShoppingCart,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      trend: `${purchaseTrend} this week`,
    },
    {
      label: "Sales",
      value: saleCount,
      href: "/dashboard/sales",
      icon: DollarSign,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      trend: `₦${formatPrice(totalRevenue)} earned`,
      trendPositive: revenueTrend >= 0,
      subTrend: revenueTrend !== 0 ? `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% vs last week` : undefined,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Banner */}
      <Card hover padding="lg" className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50">
        <div className="flex items-center gap-4">
          <Avatar
            src={undefined}
            fallback={session.user.name}
            size="xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Welcome back, {session.user.name.split(" ")[0]}!
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Here's what's happening with your account today.
            </p>
          </div>
          <Button href="/products/sell" size="sm">
            <Activity className="h-4 w-4" />
            New Listing
          </Button>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group"
          >
            <Card hover padding="lg">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 dark:text-zinc-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {stat.label}
                </p>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {stat.value}
                </p>
                <p className={`mt-1 text-xs ${stat.trendPositive !== false ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {stat.trend}
                </p>
                {stat.subTrend && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {stat.subTrend}
                  </p>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h3>
        <Separator className="my-3" />
        <div className="flex flex-wrap gap-2">
          <Button href="/products/sell" variant="outline" size="sm">
            List a Product
          </Button>
          <Button href="/products" variant="ghost" size="sm">
            Browse Marketplace
          </Button>
          <Button href="/dashboard/profile" variant="ghost" size="sm">
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Activity</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Your latest notifications and updates
            </p>
          </div>
          <Button href="/dashboard/notifications" variant="ghost" size="sm">
            View all
          </Button>
        </div>
        <Separator className="my-3" />
        {recentNotifications.length === 0 ? (
          <div className="py-8 text-center text-zinc-500">
            <Bell className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
            <p className="text-sm">No recent activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-800 dark:bg-indigo-900/10"
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <div className="flex-1">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
