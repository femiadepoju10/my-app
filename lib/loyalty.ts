import { db } from "@/lib/db";
import {
  LoyaltySource,
  LoyaltyEvent,
  LoyaltySummary,
  calculateTier,
  pointsToDiscount,
  discountToPoints,
  calculateTierMultiplier,
  LOYALTY_RATES,
  POINTS_PER_DOLLAR_PURCHASE,
  POINTS_PER_DOLLAR_SALE,
  EXPIRY_DAYS_EXPORTED,
  POINT_VALUE_CENTS_EXPORTED,
} from "@/lib/loyalty-utils";

export type {
  LoyaltySource,
  LoyaltyEvent,
  LoyaltySummary,
};
export {
  calculateTier,
  pointsToDiscount,
  discountToPoints,
  calculateTierMultiplier,
  LOYALTY_RATES,
  POINTS_PER_DOLLAR_PURCHASE,
  POINTS_PER_DOLLAR_SALE,
};

export async function awardPoints(
  userId: string,
  points: number,
  source: LoyaltySource,
  transactionId?: string
) {
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS_EXPORTED * 24 * 60 * 60 * 1000);

  const result = await db.$transaction(async (tx) => {
    const event = await tx.loyalty_events.create({
      data: {
        userId,
        points,
        source,
        transactionId: transactionId || null,
        expiresAt,
      },
    });

    const user = await tx.users.update({
      where: { id: userId },
      data: {
        loyaltyPointBalance: {
          increment: points,
        },
      },
      select: { loyaltyPointBalance: true, loyaltyTier: true },
    });

    const lifetimeEarned = await tx.loyalty_events.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    const newTier = calculateTier(lifetimeEarned._sum.points || 0);
    if (newTier !== (user.loyaltyTier || "bronze")) {
      await tx.users.update({
        where: { id: userId },
        data: { loyaltyTier: newTier },
      });
    }

    return { event, newBalance: user.loyaltyPointBalance, newTier };
  });

  return result;
}

export async function redeemPoints(userId: string, points: number) {
  if (points <= 0) {
    throw new Error("Cannot redeem zero or negative points");
  }

  if (points % 10 !== 0) {
    throw new Error("Points must be redeemed in multiples of 10");
  }

  const result = await db.$transaction(async (tx) => {
    const user = await tx.users.findUnique({
      where: { id: userId },
      select: { loyaltyPointBalance: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if ((user.loyaltyPointBalance || 0) < points) {
      throw new Error("Insufficient loyalty points");
    }

    await tx.users.update({
      where: { id: userId },
      data: {
        loyaltyPointBalance: {
          decrement: points,
        },
      },
    });

    await tx.loyalty_events.create({
      data: {
        userId,
        points: -points,
        source: "redemption",
      },
    });

    return { success: true, newBalance: (user.loyaltyPointBalance || 0) - points };
  });

  return result;
}

export async function getUserLoyalty(userId: string): Promise<LoyaltySummary> {
  const [balance, events, lifetimeAgg] = await Promise.all([
    db.users.findUnique({
      where: { id: userId },
      select: { loyaltyPointBalance: true, loyaltyTier: true },
    }),
    db.loyalty_events.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.loyalty_events.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
  ]);

  const lifetimeEarned =
    (lifetimeAgg._sum.points || 0) + (balance?.loyaltyPointBalance || 0);

  return {
    balance: balance?.loyaltyPointBalance || 0,
    tier: balance?.loyaltyTier || "bronze",
    lifetimeEarned,
    recentEvents: events as LoyaltyEvent[],
  };
}
