import { clsx, type ClassValue } from "clsx";
import { getCurrencyConfig } from "./currency";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: number, currency?: string): string {
  const config = getCurrencyConfig(currency);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export function getCurrencySymbol(currency?: string): string {
  return getCurrencyConfig(currency).symbol;
}

export function parsePrice(naira: string): number {
  const cleaned = naira.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Vehicles",
  "Sports",
  "Books",
  "Health & Beauty",
  "Other",
] as const;

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "used", label: "Used" },
] as const;

export function formatCondition(condition: string): string {
  return CONDITIONS.find((c) => c.value === condition)?.label ?? condition;
}
