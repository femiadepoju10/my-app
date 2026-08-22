import { db } from "@/lib/db";
import {
  calculateSponsoredAmount,
  calculateSponsoredEndsAt,
} from "@/lib/sponsored-types";

export { calculateSponsoredAmount, calculateSponsoredEndsAt };
export {
  SPONSORED_PRICING,
  SPONSORED_DURATION_OPTIONS,
  SPONSORED_DURATION_LABELS,
} from "@/lib/sponsored-types";

export async function getActiveSponsoredProductIds(): Promise<string[]> {
  const now = new Date();
  const result = await db.sponsored_listings.findMany({
    where: {
      status: "active",
      endsAt: { gt: now },
    },
    select: { productId: true },
  });
  return result.map((r) => r.productId);
}

export async function getActiveSponsoredListings() {
  const now = new Date();
  return db.sponsored_listings.findMany({
    where: {
      status: "active",
      endsAt: { gt: now },
    },
    orderBy: { startsAt: "desc" },
  });
}
