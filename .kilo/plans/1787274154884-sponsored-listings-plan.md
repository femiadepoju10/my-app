# Plan: V2.0 Sponsored Listings

## Goal
Allow sellers to pay for promoted product placement in marketplace search results and product detail pages, creating a monetisation revenue stream for the platform.

## Current State
- Paystack payment infrastructure is in place (`lib/paystack.ts` with `initializeTransaction`, `verifyTransaction`)
- Product search filters exist (`app/api/products/route.ts` GET with search, category, minPrice, maxPrice params)
- Listings have `status` (active, reserved, sold, removed) and basic fields
- Sellers can create products (KYC-gated for first listing)
- No payment history or transaction records for platform services (only marketplace transactions)

## Key Design Decisions

| Decision | Choice | **Rationale** |
|----------|--------|---------------|
| Payment method | Paystack payment links | Reuses existing infrastructure; no new gateway needed |
| Boost pricing | Fixed-rate per day per product | Simple, transparent for sellers |
| Boost duration | 1, 3, 7, 14 days | Standard marketplace options |
| Storage | New `sponsored_listings` table | Clean separation; UUID PK, no cascades |
| Display logic | Search sort by `isSponsored` first | Boosted products appear above organic results |
| Pricing | NGN 500/day flat rate | Based on typical Nigerian seller budgets; stored as minor units |

## Scope Boundaries

**IN SCOPE:**
- Create sponsored listing payment flow (Paystack payment link)
- Store sponsored listing records with start/end dates
- Display sponsored badge on product cards
- Boost sponsored products to top of search results
- Admin dashboard for monitoring sponsored listings
- E2E and security tests

**OUT OF SCOPE (V2.1+):**
- Dynamic auction-based bidding
- Click-based pricing (pay-per-click)
- Category-specific sponsorship tiers
- Featured placement on homepage carousels
- Analytics dashboard for sellers' ad performance

## Schema Changes

### New Table: `sponsored_listings`
```prisma
model sponsored_listings {
  id            String    @id @default(uuid())
  productId     String    @unique @map("product_id")
  sellerId      String    @map("seller_id")
  amount        Int       // in minor units (kobo)
  currency      Currency  @default(NGN)
  durationDays  Int       // 1, 3, 7, or 14
  startsAt      DateTime  @map("starts_at") @default(now())
  endsAt        DateTime  @map("ends_at")
  status        SponsoredStatus @default(pending)
  paystackRef   String    @map("paystack_ref")
  createdAt     DateTime  @default(now()) @db.Timestamptz(6) @map("created_at")

  product   products @relation(fields: [productId], references: [id], onDelete: Restrict)
  seller    users    @relation(fields: [sellerId], references: [id], onDelete: Restrict)

  @@index([productId])
  @@index([sellerId])
  @@index([status])
  @@map("sponsored_listings")
}
```

### New Enum: `SponsoredStatus`
```prisma
enum SponsoredStatus {
  pending
  active
  expired
  cancelled
}
```

### Extend `products` model with computed field
No DB column needed — active sponsorship checked via query at search time.

## Implementation Tasks

### Phase 1: Schema & Pricing Config
1. Add `SponsoredStatus` enum and `sponsored_listings` model to `prisma/schema.prisma`
2. Add forward-only migration `20260822040000_add_sponsored_listings`
3. Create `lib/sponsored-listings.ts` — pricing constants, duration options, `getActiveSponsoredProductIds()` query function

### Phase 2: Payment Flow API
4. Create `app/api/sponsored-listings/route.ts`:
   - GET — list seller's sponsored listings (authenticated)
   - POST — create sponsored listing, initialize Paystack transaction, return payment link
5. Create `app/api/sponsored-listings/verify/route.ts`:
   - GET — verify Paystack payment, activate sponsored listing on success

### Phase 3: Search Integration
6. Update `app/api/products/route.ts` GET:
   - Query active sponsored products (where `endsAt > now() AND status = active`)
   - Sort results with sponsored products first, then organic (by existing sort)

### Phase 4: Frontend — Seller Flow
7. Update `app/(marketplace)/products/sell/page.tsx` — add "Boost with Paystack" option after product creation
8. Create `app/dashboard/sponsored/page.tsx` — seller's sponsored listings dashboard with status, remaining days, renewal CTA

### Phase 5: Frontend — Marketplace Display
9. Update `components/products/ProductCard.tsx` — show "Sponsored" badge
10. Update `app/(marketplace)/products/page.tsx` — sponsored products at top of results

### Phase 6: Admin UI
11. Update `app/admin/transactions/page.tsx` — add "Sponsored Payments" tab
12. Create `app/admin/sponsored/page.tsx` — all sponsored listings with revenue, status filters

### Phase 7: Testing
13. Add Phase 9q to `scripts/e2e-test.ts` (4 assertions):
    - Sponsored listing created with pending status
    - Paystack payment link returned
    - Sponsored listing activated after verification
    - Sponsored product sorted first in search
14. Add `testSponsoredListingsSecurity` to `scripts/security-test.ts` (3 assertions):
    - Sponsored listing creation requires authentication
    - Cannot sponsor another seller's product
    - Payment amount is server-defined (not client input)
15. Update docs

## Constraints & Principles
- UUID PK on `sponsored_listings` (existing pattern)
- `ON DELETE RESTRICT` on FKs (no cascades)
- Forward-only migration
- All amounts in minor units (kobo)
- Server-side price calculation (no client-provided amount)
- Paystack payment verification via signature/webhook

## Validation
- TypeScript: `npx tsc --noEmit`
- E2E: `npx tsx scripts/e2e-test.ts` — Phase 9q assertions pass
- Security: `npx tsx scripts/security-test.ts` — Sponsored listings security tests pass
- Manual: Create sponsored listing for a product, verify payment link, verify product appears at top of search
