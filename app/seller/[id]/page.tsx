import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { BioEditor } from "@/components/seller/BioEditor";
import { formatPrice, formatCondition } from "@/lib/utils";
import { db } from "@/lib/db";
import { getSellerRating } from "@/lib/analytics";

 interface SellerProfile {
   id: string;
   name: string;
   bio: string | null;
   sellerVerificationStatus: string | null;
  createdAt: string;
  sellerRating: { average: number; count: number };
  ratingDistribution: Record<number, number>;
  stats: {
    totalSales: number;
    activeListings: number;
    totalTransactions: number;
  };
  products: Array<{
    id: string;
    title: string;
    price: number;
    condition: string;
    status: string;
    images: { imageUrl: string }[];
  }>;
}

async function fetchSellerProfile(sellerId: string): Promise<SellerProfile | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/sellers/${sellerId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.seller;
  } catch {
    return null;
  }
}

async function fetchSellerProfileDirect(sellerId: string): Promise<SellerProfile | null> {
  const seller = await db.users.findUnique({
    where: { id: sellerId, deletedAt: null },
    select: { id: true, name: true, bio: true, sellerVerificationStatus: true, createdAt: true },
  });

  if (!seller) return null;

  const [rating, ratingDistribution, stats, products] = await Promise.all([
    getSellerRating(sellerId),
    db.reviews.groupBy({
      by: ["rating"],
      where: { revieweeId: sellerId },
      _count: { _all: true },
    }),
    db.$transaction([
      db.transactions.count({ where: { sellerId, status: "completed" } }),
      db.products.count({ where: { sellerId, status: "active" } }),
      db.transactions.count({ where: { sellerId } }),
    ]),
    db.products.findMany({
      where: { sellerId, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, title: true, price: true, condition: true, status: true,
        images: { where: { sortOrder: 0 }, take: 1 },
      },
    }),
  ]);

  const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratingDistribution) {
    distMap[r.rating] = r._count._all;
  }

  const [totalSales, activeListings, totalTransactions] = stats;

   return {
     id: seller.id,
     name: seller.name,
     bio: seller.bio,
     sellerVerificationStatus: seller.sellerVerificationStatus,
     createdAt: seller.createdAt.toISOString(),
    sellerRating: rating,
    ratingDistribution: distMap,
    stats: { totalSales, activeListings, totalTransactions },
    products,
  };
}

function RatingDistribution({ distribution, total }: { distribution: Record<number, number>; total: number }) {
  const maxCount = total || 1;
  const stars = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-2">
      {stars.map((star) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-12 text-right font-medium text-zinc-700 dark:text-zinc-300">
            {star}★
          </span>
          <div className="relative flex-1">
            <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-2 rounded-full bg-yellow-400"
                style={{ width: `${Math.round(((distribution[star] || 0) / maxCount) * 100)}%` }}
              />
            </div>
          </div>
          <span className="w-8 text-right text-xs text-zinc-500 dark:text-zinc-400">
            {distribution[star] || 0}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const seller = await fetchSellerProfileDirect(id);

  if (!seller) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === seller.id;

  return (
    <div className="animate-fade-in max-w-4xl">
      <Card padding="lg" className="mb-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={undefined}
            fallback={seller.name?.[0] || "S"}
            size="xl"
          />
           <div className="flex-1 min-w-0">
             <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
               {seller.name}
               {seller.sellerVerificationStatus === "verified" && (
                 <ShieldCheck className="h-5 w-5 text-emerald-500" />
               )}
             </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
              <Calendar className="h-3 w-3" />
              Member since {new Date(seller.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
              })}
            </p>
            {seller.bio && (
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                {seller.bio}
              </p>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <BioEditor sellerId={seller.id} currentBio={seller.bio} />
        )}
      </Card>

      <Card padding="lg" className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Seller Stats
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {seller.stats.totalSales}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Completed Sales
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {seller.stats.activeListings}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Listings
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {seller.stats.totalTransactions}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Transactions
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Ratings
        </h2>
        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {seller.sellerRating.average}
            </div>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(seller.sellerRating.average)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-zinc-300 dark:text-zinc-600"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {seller.sellerRating.count} review{seller.sellerRating.count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex-1">
            <RatingDistribution
              distribution={seller.ratingDistribution}
              total={seller.sellerRating.count}
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Active Listings
        </h2>

        {seller.products.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            This seller has no active listings.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {seller.products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
                  {product.images[0]?.imageUrl ? (
                    <Image
                      src={product.images[0].imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                      No image
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <WishlistButton productId={product.id} size="sm" />
                  </div>
                  <div className="absolute left-2 top-2">
                    <Badge variant="success" size="sm">
                      {formatCondition(product.condition)}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
