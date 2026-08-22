import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import EmptyState from "@/components/ui/EmptyState";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "default" | "danger" | "primary" }> = {
  pending: { label: "Pending", variant: "warning" },
  active: { label: "Active", variant: "success" },
  expired: { label: "Expired", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export default async function AdminSponsoredPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const listings = await db.sponsored_listings.findMany({
    include: {
      product: {
        select: { title: true, images: { take: 1, select: { imageUrl: true } } },
      },
      seller: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = listings.reduce((sum, l) => sum + l.amount, 0);
  const activeCount = listings.filter((l) => l.status === "active").length;
  const pendingCount = listings.filter((l) => l.status === "pending").length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Sponsored Listings
        </h1>
        <Badge variant="primary" size="sm">
          <TrendingUp className="h-3 w-3 mr-1" />
          {listings.length} listings
        </Badge>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrice(totalRevenue, "NGN")}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Revenue</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {activeCount}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Active</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {pendingCount}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending Payment</p>
            </div>
          </div>
        </Card>
      </div>

      {listings.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon="rocket"
            title="No sponsored listings yet"
            description="Sponsored listings will appear here when sellers boost their products."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const cfg = STATUS_LABELS[listing.status] || { label: listing.status, variant: "default" };

            return (
              <Card key={listing.id} padding="none" className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        {listing.product.images.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={listing.product.images[0].imageUrl}
                            alt={listing.product.title}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">No image</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                            {listing.product.title}
                          </h3>
                          <Badge variant={cfg.variant} size="sm">
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          Seller: {listing.seller.name || listing.seller.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        {formatPrice(listing.amount, listing.currency)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        for {listing.durationDays} day{listing.durationDays > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid gap-3 sm:grid-cols-4 sm:gap-4 text-xs">
                    <div>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Created</span>
                      <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Start Date</span>
                      <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                        {new Date(listing.startsAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">End Date</span>
                      <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">
                        {new Date(listing.endsAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">Reference</span>
                      <p className="mt-0.5 font-mono text-zinc-700 dark:text-zinc-300">
                        {listing.paystackRef.slice(0, 12)}...
                      </p>
                    </div>
                  </div>

                  {listing.status === "pending" && (
                    <Link
                      href={`/dashboard/sponsored/verify?reference=${listing.paystackRef}`}
                      className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Open payment verification
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
