"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Banknote, PackageCheck, Sparkles, CreditCard, Users, TrendingUp, Star, Loader2 } from "lucide-react";
import BrandName from "@/components/ui/BrandName";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Category {
  name: string;
  count: number;
}

interface PublicStats {
  totalUsers: number;
  totalTransactions: number;
  activeListings: number;
  totalGMV: number;
}

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `₦${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `₦${(num / 1_000).toFixed(1)}K`;
  }
  return `₦${num.toLocaleString()}`;
}

const CATEGORIES_ICONS: Record<string, string> = {
  Electronics: "💻",
  Fashion: "👕",
  "Home & Garden": "🏠",
  Vehicles: "🚗",
  Sports: "⚽",
  Books: "📚",
  "Health & Beauty": "💄",
  Other: "📦",
};

export default function Home() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/public");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch public stats", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const defaultCategories = [
    { name: "Electronics", icon: "💻" },
    { name: "Fashion", icon: "👕" },
    { name: "Home & Garden", icon: "🏠" },
    { name: "Vehicles", icon: "🚗" },
    { name: "Sports", icon: "⚽" },
    { name: "Books", icon: "📚" },
    { name: "Health & Beauty", icon: "💄" },
    { name: "Other", icon: "📦" },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories.map((c) => ({ ...c, count: 0 }));

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-indigo-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent dark:from-indigo-900/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Secure Escrow Marketplace
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl lg:text-7xl animate-slide-up">
              Buy and sell with{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                confidence
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              A peer-to-peer marketplace where sellers list items and buyers pay
              through the platform — your money is held safely until you receive
              and approve what you bought.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button href="/products" size="lg" className="group">
                <Search className="h-4 w-4" />
                Browse Products
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button href="/products/sell" variant="outline" size="lg">
                Sell an Item
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading stats...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Active Users
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">{formatCompactNumber(stats.totalGMV)}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total Transactions
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Star className="h-5 w-5" />
                  <span className="text-2xl font-bold">4.8</span>
                </div>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Seller Rating
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-zinc-500">Loading stats...</div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Browse by Category
            </h2>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Find exactly what you're looking for
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {displayCategories.map((category) => (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-indigo-700"
              >
                <span className="text-2xl">{CATEGORIES_ICONS[category.name] || "📦"}</span>
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {category.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {category.count > 0 ? `${category.count} item${category.count !== 1 ? "s" : ""}` : "Browse"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              How it works
            </h2>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Three simple steps to a safe transaction
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <Card hover padding="lg" className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                List or Browse
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Sellers list products with photos and prices. Buyers browse and
                find exactly what they need.
              </p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/30 dark:text-emerald-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Pay Securely
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                The buyer pays through the platform. Funds are held safely in
                escrow until the item is received.
              </p>
            </Card>

            <Card hover padding="lg" className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-900/30 dark:text-purple-400">
                <PackageCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Confirm &amp; Complete
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                The buyer inspects the item and confirms acceptance. The seller
                gets paid instantly.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Why choose <BrandName />
            </h2>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Built for trust, designed for simplicity
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card hover padding="lg">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Escrow Protection
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Your money is held safely until you confirm the item is as
                  described.
                </p>
              </div>
            </Card>

            <Card hover padding="lg">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Secure Payments
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Powered by Paystack, a PCI Level 1 certified payment
                  processor.
                </p>
              </div>
            </Card>

            <Card hover padding="lg">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Banknote className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Small Service Fee
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  A small fee on each transaction keeps the platform running. No
                  hidden charges, no surprises.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-600 dark:text-zinc-400">
            Join <BrandName /> and experience safe, transparent buying and selling.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button href="/signup" size="lg">
              Create Free Account
            </Button>
            <Button href="/products" variant="outline" size="lg">
              Browse Marketplace
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
