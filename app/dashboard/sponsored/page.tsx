"use client";

import { useState, useEffect } from "react";
import { Calendar, ShoppingCart, Clock, CheckCircle, XCircle, Sparkles, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { SPONSORED_DURATION_LABELS } from "@/lib/sponsored-types";

interface SponsoredListing {
  id: string;
  amount: number;
  currency: string;
  durationDays: number;
  startsAt: string;
  endsAt: string;
  status: "pending" | "active" | "expired" | "cancelled";
  paystackRef: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    images: { imageUrl: string }[];
  };
}

const STATUS_CONFIG = {
  pending: { icon: Clock, badge: "warning" as const, label: "Pending Payment" },
  active: { icon: CheckCircle, badge: "success" as const, label: "Active" },
  expired: { icon: XCircle, badge: "default" as const, label: "Expired" },
  cancelled: { icon: XCircle, badge: "danger" as const, label: "Cancelled" },
};

export default function SponsoredListingsPage() {
  const [listings, setListings] = useState<SponsoredListing[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    try {
      const res = await fetch("/api/sponsored-listings");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch {
      addToast("Failed to load sponsored listings", "error");
    } finally {
      setLoading(false);
    }
  }

  const activeListings = listings.filter((l) => l.status === "active");
  const pendingListings = listings.filter((l) => l.status === "pending");
  const otherListings = listings.filter((l) => l.status !== "active" && l.status !== "pending");

  if (loading) {
    return (
      <div className="animate-fade-in">
        <Card padding="lg">
          <EmptyState icon="inbox" title="Loading..." description="Fetching your sponsored listings." />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Sponsored Listings</h1>
        <Link href="/(marketplace)/products/sell">
          <Button variant="primary" size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Boost a Product
          </Button>
        </Link>
      </div>

      {listings.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="rocket"
            title="No Sponsored Listings Yet"
            description="Boost your products to get them featured at the top of search results. Gets 5x more views."
            action={
              <Link href="/(marketplace)/products/sell">
                <Button variant="primary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Boost Your First Product
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {activeListings.length > 0 && (
            <Card padding="lg">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Active Sponsorships
              </h2>
              <div className="space-y-4">
                {activeListings.map((listing) => renderListingCard(listing, addToast, fetchListings))}
              </div>
            </Card>
          )}

          {pendingListings.length > 0 && (
            <Card padding="lg">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Pending Payment
              </h2>
              <div className="space-y-4">
                {pendingListings.map((listing) => renderListingCard(listing, addToast, fetchListings))}
              </div>
            </Card>
          )}

          {otherListings.length > 0 && (
            <Card padding="lg">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Past Sponsorships
              </h2>
              <div className="space-y-4">
                {otherListings.map((listing) => renderListingCard(listing, addToast, fetchListings))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function renderListingCard(listing: SponsoredListing, addToast: (msg: string, type?: "info" | "error" | "success") => void, refetch: () => void) {
  const cfg = STATUS_CONFIG[listing.status];
  const Icon = cfg.icon;
  const isPending = listing.status === "pending";
  const isExpired = listing.status === "expired" || listing.status === "cancelled";

  return (
    <div
      key={listing.id}
      className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
    >
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {listing.product.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.product.images[0].imageUrl}
            alt={listing.product.title}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <ShoppingCart className="h-8 w-8 text-zinc-400" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{listing.product.title}</h3>
          <Badge variant={cfg.badge} size="sm">
            <Icon className="h-3 w-3 mr-1" />
            {cfg.label}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            <Calendar className="h-3 w-3 inline mr-1" />
            {SPONSORED_DURATION_LABELS[listing.durationDays as keyof typeof SPONSORED_DURATION_LABELS] || `${listing.durationDays} days`}
          </span>
          <span>
            {formatPrice(listing.amount, listing.currency)}
          </span>
          {isPending && (
            <Link
              href={`/dashboard/sponsored/verify?reference=${listing.paystackRef}`}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Complete payment
            </Link>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        {isPending ? (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/sponsored-listings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    productId: listing.product.id,
                    durationDays: listing.durationDays,
                  }),
                });
                const data = await res.json();
                if (res.ok && data.authorization_url) {
                  window.location.href = data.authorization_url;
                } else {
                  addToast(data.error || "Failed to create payment", "error");
                }
              } catch {
                addToast("Failed to process payment", "error");
              }
            }}
          >
            Pay Now
          </Button>
        ) : isExpired ? (
          <Link href="/(marketplace)/products/sell">
            <Button variant="outline" size="sm">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Renew
            </Button>
          </Link>
        ) : (
          <button
            onClick={refetch}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}
