export type LoyaltySource =
  | "signup"
  | "purchase"
  | "sale"
  | "review"
  | "review_received"
  | "referral"
  | "wishlist"
  | "redemption";

export interface LoyaltyEvent {
  id: string;
  userId: string;
  points: number;
  source: LoyaltySource;
  transactionId: string | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface LoyaltySummary {
  balance: number;
  tier: string;
  lifetimeEarned: number;
  recentEvents: LoyaltyEvent[];
}

const EXPIRY_DAYS = 365;
const POINT_VALUE_CENTS = 0.01;

export const LOYALTY_RATES = {
  signup: 100,
  review: 25,
  review_received: 10,
  referral: 500,
  wishlist: 5,
};

export const POINTS_PER_DOLLAR_PURCHASE = 50;
export const POINTS_PER_DOLLAR_SALE = 50;
export const EXPIRY_DAYS_EXPORTED = EXPIRY_DAYS;
export const POINT_VALUE_CENTS_EXPORTED = POINT_VALUE_CENTS;

export function calculateTier(lifetimeEarned: number): string {
  if (lifetimeEarned >= 10000) return "gold";
  if (lifetimeEarned >= 1000) return "silver";
  return "bronze";
}

export function pointsToDiscount(points: number): number {
  return Math.floor(points * POINT_VALUE_CENTS);
}

export function discountToPoints(discountCents: number): number {
  return Math.floor(discountCents / POINT_VALUE_CENTS);
}

export function calculateTierMultiplier(tier: string): number {
  if (tier === "gold") return 1.5;
  if (tier === "silver") return 1.2;
  return 1.0;
}
