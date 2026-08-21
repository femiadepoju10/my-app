"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/Separator";
import { Users, ShoppingCart, Package, DollarSign, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
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

type AnalyticsData = {
  revenue: { date: string; revenue: number; count: number }[];
  transactions: { date: string; count: number }[];
  users: { date: string; count: number }[];
  categories: { category: string; value: number }[];
};

export default function AdminPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
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
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
  }

  const totalRevenue = data?.revenue.reduce((sum, r) => sum + r.revenue, 0) || 0;
  const totalTransactions = data?.transactions.reduce((sum, t) => sum + t.count, 0) || 0;
  const totalNewUsers = data?.users.reduce((sum, u) => sum + u.count, 0) || 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Analytics Overview</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Platform metrics update every 30 seconds
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">New Users</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : totalNewUsers.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Transactions</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : totalTransactions.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Listings</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : "-"}
            </p>
          </div>
        </Card>

        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Platform Revenue</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {loading ? "..." : formatPrice(totalRevenue)}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Revenue Trend</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Platform service fees over time</p>
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
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Transaction Volume</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Number of transactions per day</p>
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
                    formatter={(value: any) => [value, "Transactions"]}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* User Growth & Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">User Growth</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">New signups over time</p>
          <Separator className="my-4" />
          <div className="h-[300px] w-full">
            {loading || !data ? (
              <div className="flex h-full items-center justify-center text-zinc-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.users}>
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
                    formatter={(value: any) => [`${value} users`, "Signups"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Top Categories</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">By sales value</p>
          <Separator className="my-4" />
          <div className="h-[300px] w-full">
            {loading || !data ? (
              <div className="flex h-full items-center justify-center text-zinc-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                  <XAxis type="number" tick={{ fontSize: 12 }} className="text-zinc-500" />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={100} className="text-zinc-500" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e4e4e7",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [formatPrice(value as number), "Sales"]}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Actions</h3>
        <Separator className="my-3" />
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">Manage Users</Button>
          </Link>
          <Link href="/admin/transactions">
            <Button variant="outline" size="sm">View Transactions</Button>
          </Link>
          <Link href="/admin/disputes">
            <Button variant="outline" size="sm">Review Disputes</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
