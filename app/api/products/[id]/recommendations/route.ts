import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerRating, getProductWishlistCounts } from "@/lib/analytics";

const RECOMMENDATION_LIMIT = 4;
const CACHE_TTL_MS = 60_000;

interface CachedRecommendations {
  recommendations: unknown;
  timestamp: number;
}

const cache = new Map<string, CachedRecommendations>();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = id;

  if (!productId) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const cacheKey = `recommendations:${productId}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.recommendations);
  }

  const product = await db.products.findUnique({
    where: { id: productId },
    select: { category: true, price: true, currency: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const recommendedProducts = await db.products.findMany({
    where: {
      id: { not: productId },
      category: product.category,
      status: "active",
    },
    take: RECOMMENDATION_LIMIT,
    orderBy: { createdAt: "desc" },
    include: {
      images: {
        where: { sortOrder: 0 },
        take: 1,
      },
      seller: {
        select: { id: true, name: true },
      },
    },
  });

  const productIds = recommendedProducts.map((p) => p.id);
  const wishlistCounts = await getProductWishlistCounts(productIds);

  const productsWithRatings = await Promise.all(
    recommendedProducts.map(async (p) => {
      const rating = await getSellerRating(p.sellerId);
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency,
        image: p.images[0]?.imageUrl || null,
        seller: p.seller,
        sellerRating: rating,
        wishlistCount: wishlistCounts.get(p.id) || 0,
      };
    })
  );

  const response = {
    recommendations: productsWithRatings,
    count: productsWithRatings.length,
  };

  cache.set(cacheKey, { recommendations: response, timestamp: now });

  return NextResponse.json(response);
}
