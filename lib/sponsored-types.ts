export const SPONSORED_PRICING = {
  pricePerDay: 500,
  currency: "NGN",
} as const;

export const SPONSORED_DURATION_OPTIONS = [1, 3, 7, 14] as const;

export const SPONSORED_DURATION_LABELS: Record<number, string> = {
  1: "1 Day",
  3: "3 Days",
  7: "7 Days",
  14: "14 Days",
};

export function calculateSponsoredAmount(durationDays: number): number {
  return SPONSORED_PRICING.pricePerDay * durationDays;
}

export function calculateSponsoredEndsAt(startsAt: Date, durationDays: number): Date {
  const end = new Date(startsAt);
  end.setUTCDate(end.getUTCDate() + durationDays);
  return end;
}
