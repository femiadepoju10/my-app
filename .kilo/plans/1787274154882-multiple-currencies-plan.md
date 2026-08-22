# Plan: V2.0 Multiple Currencies

## Goal
Enable sellers to list products in their local African currency (NGN, GHS, KES, ZAR) instead of only NGN, with proper Paystack multi-currency support and dynamic currency formatting across the UI.

## Current State
- Prices stored as integers (kobo/cents) in `products.price`, `transactions.itemPrice/serviceFee/totalAmount`, `payments.amount`
- `formatPrice(kobo)` in `lib/utils.ts` hardcodes `Intl.NumberFormat("en-NG", { currency: "NGN" })`
- Paystack `initializeTransaction()` does NOT pass a `currency` parameter (defaults to NGN)
- `₦` symbol hardcoded in `app/page.tsx`, sell page, products listing filter, dashboard
- Paystack supports NGN, GHS, KES, ZAR, USD for African markets

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Currency storage | Per-product `currency` field (V2 currency enum) | Seller chooses local currency; transaction inherits from product |
| Exchange rates | Static lookup table, display only | No real-time conversion at checkout — buyer pays in product's currency |
| Supported currencies | NGN, GHS, KES, ZAR, USD | Paystack-supported African currencies |
| Default currency | NGN (backward compatible) | Existing data stays valid |
| Paystack integration | Pass `currency` to `initializeTransaction` | Paystack handles multi-currency checkout |

## Scope Boundaries

**IN SCOPE:**
- Add `currency` field to `products` and `transactions`
- Update `formatPrice` to accept currency
- Pass currency to Paystack transaction initialization
- Currency selector in sell form
- Dynamic currency symbol in all price displays

**OUT OF SCOPE (V2.1+):**
- Real-time exchange rate conversion at checkout
- Multi-currency wallet/payout (seller receives in product's currency)
- Buyer-side currency preference with conversion
- Currency switching on marketplace browse
- Admin-controlled platform currency override

## Schema Changes

### New Enum: `Currency`
```prisma
enum Currency {
  NGN
  GHS
  KES
  ZAR
  USD
}
```

### Extend `products` model
```prisma
currency    Currency @default(NGN) @map("currency")
```

### Extend `transactions` model
```prisma
currency    Currency @default(NGN) @map("currency")
```

### Extend `payments` model
```prisma
currency    String @default("NGN") @map("currency")
amount      Int    // amount in minor units (kobo/cents/pesewas)
```

## Implementation Tasks

### Phase 1: Schema & Currency Utilities
1. Add `Currency` enum to `prisma/schema.prisma`
2. Add `currency` field to `products` model (default NGN)
3. Add `currency` field to `transactions` model (default NGN)
4. Add `currency` field to `payments` model (default "NGN")
5. Create forward-only migration `20260822020000_add_currency_support`
6. Create `lib/currency.ts` — CURRENCY_CONFIG map (code → symbol, locale, paystackCurrency)
7. Update `lib/utils.ts`:
   - `formatPrice(amount: number, currency?: string)` — uses Intl.NumberFormat with dynamic currency
   - `parsePrice(str: string)` — already handles any symbol via `/[^\d.]/g/`

### Phase 2: Paystack Integration
8. Update `lib/paystack.ts` `initializeTransaction()`:
   - Add optional `currency` parameter (defaults to "NGN")
   - Pass `currency` in request body to Paystack

### Phase 3: API Updates
9. Update `app/api/transactions/route.ts` POST:
   - Fetch product currency, store on transaction record
10. Update `app/api/payments/webhook/route.ts`:
    - Accept `currency` in webhook payload, store on payment record
11. Update `app/api/products/[id]/recommendations/route.ts`:
    - Include `currency` in product response (so buyers see correct prices)

### Phase 4: Frontend — Sell/Edit Pages
12. Update `app/(marketplace)/products/sell/page.tsx`:
    - Add currency dropdown (NGN, GHS, KES, ZAR, USD)
    - Send `currency` in POST body
    - Update price display symbols to use selected currency
13. Update `app/dashboard/listings/[id]/edit/page.tsx`:
    - Add currency dropdown, load/save current value

### Phase 5: Frontend — Display Components (17 files)
**14. Update `formatPrice` signature to accept optional 2nd arg `currency?: string`**
- `formatPrice(amount: number, currency?: string)` — defaults to "NGN" if not provided
- Uses `CURRENCY_CONFIG[currency]?.locale || "en-NG"` and `CURRENCY_CONFIG[currency]?.code || "NGN"`

**15. Update `formatPrice()` calls to pass currency where transaction/product known (9 files):**
- `app/checkout/[transactionId]/page.tsx` — `formatPrice(..., transaction.currency)` (3 call sites)
- `app/(marketplace)/products/[id]/page.tsx` — `formatPrice(..., product.currency)` (5 call sites)
- `app/transaction/[id]/page.tsx` — `formatPrice(..., tx.currency)` (5 call sites)
- `app/dashboard/sales/page.tsx` — 1 call site
- `app/dashboard/purchases/page.tsx` — 1 call site
- `app/dashboard/wishlist/page.tsx` — 1 call site
- `app/dashboard/listings/page.tsx` — 1 call site
- `app/seller/[id]/page.tsx` — 1 call site

**16. Update admin/analytics files to default to NGN (aggregated totals — 5 files):**
- `app/admin/page.tsx` — 3 call sites (chart formatters + totalRevenue)
- `app/admin/transactions/page.tsx` — 1 call site
- `app/admin/refunds/page.tsx` — 2 call sites
- `app/admin/disputes/page.tsx` — 1 call site
- `app/dashboard/analytics/page.tsx` — 3 call sites
- `app/dashboard/page.tsx` — replace hardcoded `₦` with `formatPrice(totalRevenue, "NGN")`

**17. Update hardcoded `₦` symbols (2 files):**
- `app/(marketplace)/products/page.tsx` lines 121-122 — price filter labels
- `app/(marketplace)/products/sell/page.tsx` lines 358, 364, 371 — pricing preview

### Phase 6: Testing
18. Add Phase 9o to `scripts/e2e-test.ts` (3 assertions):
    - Product can be created with GHS currency
    - Transaction inherits product currency
    - formatPrice handles non-NGN currencies
19. Add `testCurrencySecurity` to `scripts/security-test.ts` (3 assertions):
    - Currency enum has no invalid values
    - Products POST validates currency field (if provided)
    - Payment webhook accepts currency field
20. Update Phase 9d E2E test to send GHS currency in sell page test

## Constraints & Principles
- UUID PKs on all tables (existing, no new tables)
- `ON DELETE RESTRICT` on all FKs (no changes)
- Forward-only migration
- All API routes require server-side session where applicable
- Default currency NGN preserves backward compatibility
- All prices still stored as integer minor units (kobo/cents/pesewas etc.)

## Risks

| Risk | Mitigation |
|------|-----------|
| Paystack requires valid currency per transaction — wrong currency errors | Default to NGN everywhere unless explicitly set |
| Admin analytics aggregate across currencies (e.g. total revenue chart) | Default to NGN formatting for aggregated views; note limitation in UI |
| Existing products have no currency field | Migration sets default `NGN` — no breaking change |
| Service fee is 10% proportional — works in any currency | No change needed, proportional calculation is currency-agnostic |

## Validation
- TypeScript: `npx tsc --noEmit`
- E2E: `npx tsx scripts/e2e-test.ts` — Phase 9o assertions pass
- Security: `npx tsx scripts/security-test.ts` — Currency tests pass
- Manual: Create product in GHS, verify price displays as ₵, verify Paystack checkout initialized with GHS
- UUID PKs on all tables (existing, no new tables)
- `ON DELETE RESTRICT` on all FKs (no changes)
- Forward-only migration
- All API routes require server-side session where applicable
- Default currency NGN preserves backward compatibility
- All prices still stored as integer minor units (kobo/cents/etc.)
