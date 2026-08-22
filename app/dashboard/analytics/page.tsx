"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import {
  DollarSign,
  ShoppingCart,
  Star,
  RefreshCw,
  TrendingUp,
  Package,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface StatItem {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
  }

  const statItems: StatItem[] = data
    ? [
        {
          title: "Total Earnings",
          value: formatPrice(data.stats?.totalEarnings || 0),
          icon: <DollarSign className="h-6 w-6" />,
          bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
          textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
          title: "Total Sales",
          value: data.stats?.totalSales || 0,
          icon: <ShoppingCart className="h-6 w-6" />,
          bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
          textColor: "text-indigo-600 dark:text-indigo-400",
        },
        {
          title: "Avg. Rating",
          value: `${data.stats?.avgRating || 0}`,
          icon: <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />,
          bgColor: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-600 dark:text-amber-400",
        },
        {
          title: "Pending Payouts",
          value: data.stats?.pendingPayouts || 0,
          icon: <TrendingUp className="h-6 w-6" />,
          bgColor: "bg-purple-100 dark:bg-purple-900/30",
          textColor: "text-purple-600 dark:text-purple-400",
        },
      ]
    : [];

  const ratingLabels = [5, 4, 3, 2, 1] as const;
  const ratingData = ratingLabels.map((star) => ({
    star: `${star}★`,
    count: data?.ratingDistribution?.[star as 1 | 2 | 3 | 4 | 5] || 0,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Track your sales performance, earnings, and ratings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as "7d" | "30d" | "90d")}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={refreshing}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.title} hover padding="lg">
            <div className="flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor} ${item.textColor}`}>
                {item.icon}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{item.title}</p>
              <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {loading ? "..." : item.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Revenue Trend</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Your earnings over time</p>
          <Separator className="my-4" />
          <div className="h-[300px] w-full">
            {loading || !data ? (
              <div className="flex h-full items-center justify-center text-zinc-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-zinc-500" />
                  <YAxis tick={{ fontSize: 12 }} className="text-zinc-500" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e4e4e7",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [formatPrice(value as number), "Revenue"]}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sales Volume</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Number of sales per day</p>
          <Separator className="my-4" />
          <div className="h-[300px] w-full">
            {loading || !data ? (
              <div className="flex h-full items-center justify-center text-zinc-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.transactions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-zinc-500" />
                  <YAxis tick={{ fontSize: 12 }} className="text-zinc-500" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e4e4e7",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [`${value} sales`, "Sales"]}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Rating Distribution & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Rating Distribution</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {data?.stats?.reviewCount || 0} total reviews
          </p>
          <Separator className="my-4" />
          <div className="space-y-3">
            {ratingData.map((item) => (
              <div key={item.star} className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium text-zinc-700 dark:text-zinc-300">{item.star}</span>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-amber-400"
                      style={{ width: `${item.count > 0 ? Math.min((item.count / Math.max(...ratingData.map((r) => r.count), 1)) * 100, 100) : 0}%` }}
                    />
                  </div>
                </div>
                <span className="w-8 text-sm text-zinc-500 dark:text-zinc-400">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Top Products</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">By revenue</p>
          <Separator className="my-4" />
          <div className="space-y-3">
            {loading || !data
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                ))
              : data.topProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{p.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.sales} sale{p.sales === 1 ? "" : "s"}</p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
