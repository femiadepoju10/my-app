# Plan: Loyalty Programme (V2.0)

## Objective
Implement a points-based loyalty system rewarding users for marketplace engagement (purchases, sales, reviews, referrals, wishlist adds) to drive retention and repeat engagement.

## Context

### Completed V2.0 Features
- Product Recommendations ✅ (E2E Phase 9h)
- Seller Analytics Dashboard ✅
- Delivery Tracking ✅ (E2E Phase 9j)
- Seller Verification & Admin Review ✅ (E2E Phase 9k)
- Vercel build fix ✅ (validateEnv moved to dev-only)

### Current Test Counts
- E2E: 63/63 PASS
- Security: 91/91 PASS

### Remaining V2.0 Features (buildplan.md)
AI recommendations, AI-generated descriptions, Automated logistics, Identity verification, **Seller subscriptions**, **Sponsored listings**, Advertising, Auctions, Multiple currencies, International transactions, **Advanced fraud detection**, Mobile applications, **Loyalty programme**, Advanced dispute automation

## Why Loyalty Programme Next
1. **Retention** — the #1 marketplace metric; loyalty points create stickiness
2. **No external deps** — pure app logic, no new services
3. **Builds on existing** — transactions, reviews, wishlist, referrals already implemented
4. **Monetization prep** — loyal users more likely to pay for subscriptions/sponsored listings
5. **Fully testable** — E2E + security assertions

## Design Decisions

### Schema
- New `loyalty_events` table: `id` (UUID @id), `userId` (String, FK users, ON DELETE RESTRICT), `points` (Int), `source` (Enum: signup, purchase, sale, review, referral, wishlist, review_received), `transactionId` (String, FK transactions, nullable, ON DELETE RESTRICT), `expiresAt` (DateTime, nullable), `createdAt` (DateTime default now)
- New `loyaltyTier` field on `users`: String? (bronze/silver/gold, default null = bronze)
- `loyaltyPointBalance` computed or stored on `users`: Int? (default 0)
- No cascades on any relations (existing RESTRICT pattern)

### Points System (rates)
| Action | Points | Trigger |
|--------|--------|---------|
| Account signup | 100 | `app/api/auth/signup/route.ts` |
| Buyer transaction complete | 50 per $100 spent | `app/api/transactions/[id]/route.ts` (status → completed) |
| Seller transaction complete | 50 per $100 sold | `app/api/transactions/[id]/route.ts` (status → completed) |
| Leave a review | 25 | `app/api/reviews/route.ts` POST |
| Receive review (rating >= 4) | 10 | `app/api/reviews/route.ts` POST |
| Refer a friend (signup) | 500 | `app/api/auth/signup/route.ts` (referral code) |
| Add to wishlist | 5 | `app/api/wishlist/route.ts` POST |

### Redemption
- 1000 points = $1 discount (rate: 1000:1)
- Minimum redemption: 500 points ($0.50)
- Applied at checkout — discount subtracted from product price
- Points deducted atomically within transaction creation
- Points cannot go negative (balance check before deduction)
- Once a transaction is completed, redeemed points are non-refundable

### Tier System
| Tier | Points Required | Perks |
|------|----------------|-------|
| Bronze | 0 | Base rate |
| Silver | 1,000 lifetime | 1.2x points on purchases/sales |
| Gold | 10,000 lifetime | 1.5x points + free shipping badge |

### Data Flow
1. User performs action (purchase, review, etc.)
2. Action triggers `awardPoints(userId, points, source, transactionId?)` in `lib/loyalty.ts`
3. `awardPoints()` inserts `loyalty_events` record + updates `users.loyaltyPointBalance` + recalculates tier
4. At checkout, user provides `loyaltyPointsToRedeem`
5. `redeemPoints(userId, points)` checks balance, deducts atomically in transaction
6. Discount applied to checkout total

## Tasks (Ordered)

### Task 1: Schema + DB Migration
**File:** `prisma/schema.prisma`
- Add `loyaltyPointBalance Int @default(0) @map("loyalty_point_balance")` to `users`
- Add `loyaltyTier String? @default("bronze") @map("loyalty_tier")` to `users`
- Add `loyaltyEvents loyalty_events[] @relation("userLoyaltyEvents")` to `users`
- Create `loyalty_events` model + `LoyaltySource` enum
- Create `LoyaltySource` enum in DB: `CREATE TYPE "LoyaltySource" AS ENUM ('signup', 'purchase', 'sale', 'review', 'review_received', 'referral', 'wishlist')`
- Create `loyalty_events` table with FK to `users` (ON DELETE RESTRICT) and `transactions` (ON DELETE RESTRICT)
- Run migration: forward-only DDL

### Task 2: Loyalty Library
**File:** `lib/loyalty.ts`
- `awardPoints(userId, points, source, transactionId?)` — inserts event, updates balance, recalculates tier
- `redeemPoints(userId, points)` — checks balance, deducts if sufficient, returns success/error
- `getUserPoints(userId)` — returns balance, tier, total earned, events
- `calculateTier(totalPoints)` — bronze/silver/gold based on lifetime total
- Use existing `db` client from `@/lib/db`

### Task 3: Points on Signup + Referral
**File:** `app/api/auth/signup/route.ts`
- After user creation: `awardPoints(userId, 100, "signup")`
- If `referralCode` in request body: look up referrer, `awardPoints(referrerId, 500, "referral")`
- Add `referralCode` field to signup schema (optional)

### Task 4: Points on Transaction Completion
**File:** `app/api/transactions/[id]/route.ts`
- When status transitions to `completed`:
  - `awardPoints(transaction.buyerId, Math.floor(amount / 2000) * 50, "purchase", transactionId)`
  - `awardPoints(transaction.sellerId, Math.floor(amount / 2000) * 50, "sale", transactionId)`
- (Floor division by 2000 cents = $20, so 50 pts per $20 ≈ 50 pts per $100 spent)

### Task 5: Points on Review
**File:** `app/api/reviews/route.ts`
- On POST:
  - `awardPoints(reviewerId, 25, "review", transactionId)`
  - If rating >= 4: `awardPoints(revieweeId, 10, "review_received")`

### Task 6: Points on Wishlist
**File:** `app/api/wishlist/route.ts`
- On POST (add): `awardPoints(userId, 5, "wishlist")`
- On DELETE (remove): no deduction (one-time reward)

### Task 7: Points Redemption at Checkout
**File:** `app/api/transactions/route.ts` POST
- Accept optional `loyaltyPointsToRedeem` in request body
- Before transaction creation: check `user.loyaltyPointBalance >= loyaltyPointsToRedeem`
- Calculate discount: `loyaltyPointsToRedeem / 1000` (in cents)
- Subtract discount from total (ensure total doesn't go negative)
- Call `redeemPoints(userId, loyaltyPointsToRedeem)` inside the same `db.$transaction`
- Reject if insufficient points

### Task 8: Loyalty API
**New file:** `app/api/loyalty/route.ts`
- GET `/api/loyalty` — returns `{ balance, tier, lifetimeEarned, recentEvents[] }`, auth-required, user isolation

### Task 9: Loyalty Dashboard UI
**File:** `app/dashboard/loyalty/page.tsx`
- Display: current balance, tier badge, recent events table, lifetime stats
- Add "Loyalty" tab to dashboard nav

**File:** `components/layout/Header.tsx`
- Add point balance + tier badge beside user avatar

### Task 10: E2E Tests — Phase 9l
**File:** `scripts/e2e-test.ts`
- Test: seller earns points after transaction completion
- Test: buyer earns points after transaction completion
- Test: reviewer gets points after leaving review
- Test: points redeemable at checkout
(4 assertions)

### Task 11: Security Tests
**File:** `scripts/security-test.ts`
- Test: loyalty API requires auth
- Test: user cannot view another user's points
- Test: redeemed points cannot exceed balance
- Test: loyalty_events schema has ON DELETE RESTRICT
- Test: points cannot go negative
(5 assertions)

## Validation Steps
1. `npx tsc --noEmit` — PASS
2. `npm run build` — PASS
3. `npx tsx scripts/e2e-test.ts` — expect **67/67** (63 + 4 new)
4. `npx tsx scripts/security-test.ts` — expect **96/96** (91 + 5 new)

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| Points race condition (concurrent redemptions) | Use `db.$transaction` with `update` for atomic balance check+deduct |
| Points awarded but transaction fails | Points awarded AFTER transaction completes (idempotent status transition) |
| Tier calculation affects pricing unfairly | Tier multipliers shown in UI; clearly documented |
| Database column name conflicts | New columns prefixed `loyalty_` on users; new table `loyalty_events` |

## Out of Scope
- Point expiry cron job (will add in next phase)
- Point transfer between users
- Point purchase with real money
- Mobile-specific loyalty notifications
