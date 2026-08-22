"use client";

import { useEffect, useState } from "react";
import { Trophy, Loader2, Sparkles, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { pointsToDiscount } from "@/lib/loyalty-utils";

interface LoyaltyEvent {
  id: string;
  userId: string;
  points: number;
  source: string;
  transactionId: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface LoyaltySummary {
  balance: number;
  tier: string;
  lifetimeEarned: number;
  recentEvents: LoyaltyEvent[];
}

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  silver: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const TIER_ICONS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
};

const SOURCE_LABELS: Record<string, string> = {
  signup: "Account Signup",
  purchase: "Purchase",
  sale: "Sale Completed",
  review: "Review Written",
  review_received: "Review Received",
  referral: "Referral Bonus",
  wishlist: "Added to Wishlist",
  redemption: "Points Redeemed",
};

export default function LoyaltyPage() {
  const [data, setData] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoyalty() {
      try {
        const res = await fetch("/api/loyalty");
        if (res.ok) {
          const summary = await res.json();
          setData(summary);
        }
      } catch (err) {
        console.error("Failed to fetch loyalty data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLoyalty();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card padding="lg">
        <EmptyState
          icon="trophy"
          title="Unable to load loyalty data"
          description="There was an error loading your loyalty points. Please try again later."
        />
      </Card>
    );
  }

  const discountCents = pointsToDiscount(data.balance);
  const tierLabel = TIER_ICONS[data.tier] + " " + data.tier.charAt(0).toUpperCase() + data.tier.slice(1);
  const tierClass = TIER_COLORS[data.tier] || TIER_COLORS.bronze;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Loyalty Points
        </h1>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Trophy className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {data.balance.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Available Points
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={data.tier === "gold" ? "success" : data.tier === "silver" ? "primary" : "warning"} size="lg">
              {tierLabel}
            </Badge>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Lifetime earned: {data.lifetimeEarned.toLocaleString()} pts
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Redeemable value
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              ${((discountCents) / 100).toFixed(2)} (1000 pts = $1)
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Redeem at checkout. Minimum redemption: 500 points
          </p>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          How to Earn Points
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Sign up</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">100 points</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Complete purchase</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">50 pts per $100 spent</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Sell item</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">50 pts per $100 sold</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Leave a review</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">25 points</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Refer a friend</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">500 points</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">Add to wishlist</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">5 points</p>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Recent Activity
        </h2>
        {data.recentEvents.length === 0 ? (
          <EmptyState
            icon="trophy"
            title="No activity yet"
            description="Earn points by buying, selling, reviewing, and more!"
          />
        ) : (
          <div className="space-y-3">
            {data.recentEvents.map((event) => {
              const sourceLabel = SOURCE_LABELS[event.source] || event.source;
              const isCredit = event.points > 0;
              const isExpired = event.expiresAt && new Date(event.expiresAt) < new Date();

              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    isExpired
                      ? "bg-zinc-50 opacity-60 dark:bg-zinc-900"
                      : "bg-zinc-50 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-3 w-3 text-zinc-400" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {sourceLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired && (
                      <Badge variant="warning" size="sm">
                        Expired
                      </Badge>
                    )}
                    <span
                      className={`text-sm font-medium ${
                        isCredit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isCredit ? "+" : ""}
                      {event.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
