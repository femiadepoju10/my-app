export type SupportedCurrency = "NGN" | "GHS" | "KES" | "ZAR" | "USD";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  name: string;
}

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyConfig> = {
  NGN: { code: "NGN", symbol: "₦", locale: "en-NG", name: "Nigerian Naira" },
  GHS: { code: "GHS", symbol: "₵", locale: "en-GH", name: "Ghanaian Cedi" },
  KES: { code: "KES", symbol: "KSh", locale: "en-KE", name: "Kenyan Shilling" },
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA", name: "South African Rand" },
  USD: { code: "USD", symbol: "$", locale: "en-US", name: "US Dollar" },
};

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  "NGN",
  "GHS",
  "KES",
  "ZAR",
  "USD",
];

export function getCurrencyConfig(currency?: string): CurrencyConfig {
  return CURRENCY_CONFIG[(currency as SupportedCurrency)] ?? CURRENCY_CONFIG.NGN;
}
