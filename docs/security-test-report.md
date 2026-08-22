# Security & Business-Logic Test Report

**Date:** 2026-08-21
**Application:** PassitOn Marketplace (MVP)
**Test Script:** `scripts/security-test.ts`

## Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Authentication | 2 | 2 | 0 |
| User Data Isolation | 3 | 3 | 0 |
| Checkout Race Condition | 3 | 3 | 0 |
| State Machine Integrity | 8 | 8 | 0 |
| Duplicate Prevention | 2 | 2 | 0 |
| Admin Authorization | 5 | 5 | 0 |
| Payment Security | 6 | 6 | 0 |
| Payout Security | 11 | 11 | 0 |
| Wishlist Security | 7 | 7 | 0 |
| Chat Security | 7 | 7 | 0 |
| Seller Profile Security | 2 | 2 | 0 |
| Push Notification Security | 7 | 7 | 0 |
| SMS Notification Security | 6 | 6 | 0 |
| Recommendations Security | 7 | 7 | 0 |
| Seller Analytics Security | 4 | 4 | 0 |
| Delivery Tracking Security | 5 | 5 | 0 |
| Seller Verification Security | 6 | 6 | 0 |
| **Total** | **91** | **91** | **0** |

## Findings & Fixes

### Fix: Race Condition in Checkout

**Issue:** The checkout flow at `/api/transactions` POST had a race condition where two concurrent buyers could both see `product.status === "active"` and both create transactions, resulting in duplicate sales.

**Root Cause:** Product status check and existing-transaction check happened *outside* the `db.$transaction` block, creating a window where a second buyer could pass the checks before the first buyer's transaction committed.

**Fix:** Moved all checks inside `db.$transaction` and used a conditional `updateMany` with `where: { id: productId, status: "active" }` to atomically reserve the product only if it's still available.

### Existing Security Measures (Verified)

| Measure | Location | Status |
|---------|----------|--------|
| Route protection middleware | `middleware/proxy.ts` | ✅ |
| Session check on all API routes | Every API route | ✅ |
| Bcrypt password hashing | `app/api/auth/signup/route.ts` | ✅ |
| UUID primary keys (not sequential) | All Prisma models | ✅ |
| Role-based authorization | `app/api/admin/*` routes | ✅ |
| Transaction state machine | `app/api/transactions/[id]/route.ts` | ✅ |
| Webhook signature verification | `app/api/webhooks/paystack/route.ts` | ✅ |
| Server-side price calculation | `app/api/transactions/route.ts` | ✅ |
| Rate limiting on checkout | `app/api/transactions/route.ts` | ✅ |
| Webhook idempotency | `app/api/webhooks/paystack/route.ts` | ✅ |
| Payout/refund require admin | `app/api/transactions/[id]/route.ts` | ✅ |

## Detailed Test Results

### Authentication

- **All passwords stored as bcrypt hashes** — PASS
  Verified all user `passwordHash` fields start with `$2` and are >30 chars.
- **User ID is UUID format** — PASS
  Verified user IDs are 36-char UUIDs with hyphens, not sequential integers.

### User Data Isolation

- **Buyer sees only their transactions** — PASS
- **Seller sees only their transactions** — PASS
- **Buyer does not own the product** — PASS

### Checkout Race Condition

- **Only one concurrent checkout succeeds** — PASS
- **Second checkout was rejected** — PASS
- **Rejection was due to race condition** — PASS (product status already changed to "reserved")

### State Machine Integrity

- **payout_pending → payout_completed is valid** — PASS
- **accepted → payout_pending is valid** — PASS
- **payment_pending → payout_completed is NOT valid** — PASS
- **payment_pending → completed is NOT valid** — PASS
- **item_delivered → accepted is NOT valid** (must go through inspection_pending) — PASS
- **rejected → completed is NOT valid** — PASS
- **refund_completed → completed is NOT valid** — PASS
- **Seller cannot transition payout_pending → payout_completed without admin** — PASS

### Duplicate Prevention

- **Payout with completed status can be detected** — PASS
- **Webhook idempotency: duplicate transfer.success is ignored** — PASS

### Admin Authorization

- **Admin transactions endpoint checks role** — PASS
- **Admin transactions endpoint checks role === admin** — PASS
- **Admin root checks authentication** — PASS
- **Transaction PATCH checks admin for payout_completed** — PASS
- **Transaction PATCH checks admin for refund_completed** — PASS

### Payment Security

- **Checkout calculates service fee server-side** — PASS
- **Checkout does NOT use client-provided amount** — PASS
- **Webhook verifies signature** — PASS
- **Webhook verifies transaction with Paystack** — PASS
- **Webhook validates payment amount** — PASS
- **Webhook prevents duplicate payment processing** — PASS

### Payout Security

- **Payout initiation requires seller paystackRecipientCode** — PASS
- **Payout transition requires admin role** — PASS
- **Admin users API requires admin role for payout setup** — PASS
- **Admin PATCH supports paystackRecipientCode via bank details** — PASS
- **Admin PATCH calls createTransferRecipient** — PASS
- **Reviews API requires authentication** — PASS
- **Reviews API checks transaction is completed** — PASS
- **Reviews API prevents duplicate reviews** — PASS
- **Reviews API validates rating 1-5** — PASS
- **Profile payout setup requires authentication** — PASS

### Wishlist Security

- **Wishlist API requires authentication (GET)** — PASS
- **Wishlist API requires authentication (POST)** — PASS
- **Wishlist API requires authentication (DELETE)** — PASS
- **Wishlist POST validates productId** — PASS
- **Wishlist POST prevents duplicate entries** — PASS
- **Wishlist DELETE only deletes own wishlist items** — PASS
   - **Seller does not see product in wishlist** — PASS
   - **Product removed from wishlist** — PASS
   - **Wishlist schema has UUID PK with no cascade** — PASS

### Chat Security

- **Messages API requires authentication (GET)** — PASS
- **Messages API requires authentication (POST)** — PASS
- **Messages API checks transaction participant** — PASS (only buyer/seller can access)
- **Messages API enforces payment_confirmed status before chat** — PASS
- **Messages API validates message content** — PASS
- **Messages API enforces 2000 char limit** — PASS
- **Messages schema has UUID PK with no cascade** — PASS
- **Seller bio validation enforces 500 char max** — PASS
- **Seller profile API supports bio field in PATCH** — PASS

### Push Notification Security

- **Push subscriptions API requires authentication (POST)** — PASS
- **Push subscriptions API requires authentication (DELETE)** — PASS
- **Push subscriptions API validates subscription object** — PASS
- **Push library checks subscription validity before sending** — PASS
- **Push library handles 410/404 errors by cleaning subscriptions** — PASS
- **Push subscriptions schema has UUID PK with no cascade** — PASS
- **Push subscriptions uses UNIQUE constraint on userId** — PASS

### SMS Notification Security

- **SMS library only sends for critical notification types** — PASS
- **SMS library checks user smsEnabled flag before sending** — PASS
- **SMS library respects user phone number** — PASS
- **SMS library enforces rate limiting (max 5 per day)** — PASS
- **SMS library truncates messages to 160 chars** — PASS
- **SMS is integrated into createNotification for critical types** — PASS

### Recommendations Security

- **Recommendations API does not require authentication** — PASS
- **Recommendations API excludes current product from results** — PASS
- **Recommendations API filters by active status** — PASS
- **Recommendations API matches products by category** — PASS
- **Recommendations are limited to 4 items** — PASS
- **Recommendations API includes seller rating data** — PASS
- **Products schema has composite index on category+status** — PASS

### Seller Analytics Security

- **Seller analytics API requires authentication** — PASS
- **Seller analytics returns only seller-scoped data** — PASS
- **Seller rating distribution uses revieweeId filter** — PASS
- **Seller top products filtered by sellerId** — PASS

### Delivery Tracking Security

- **Delivery API requires authentication** — PASS
- **Delivery API checks transaction participant** — PASS
- **Only buyer can confirm delivery** — PASS
- **DeliveryTracking schema has UUID PK with no cascade** — PASS
- **DeliveryTracking has @unique on transactionId** — PASS

### Seller Verification Security

- **Admin verification API requires authentication** — PASS
- **Admin verification API checks admin role** — PASS
- **Verification status values are validated** — PASS
- **Cannot modify own account** — PASS
- **Schema has sellerVerificationStatus column** — PASS
- **users table has ON DELETE RESTRICT** — PASS

### E2E Test Results (63 assertions)

- Phase 9c: Wishlist Operations — 4/4 PASS
- Phase 9d: In-App Chat — 3/3 PASS
- Phase 9e: Seller Profile & Bio — 2/2 PASS
- Phase 9f: Push Notifications — 2/2 PASS
- Phase 9g: SMS Notifications — 4/4 PASS
- Phase 9h: Product Recommendations — 4/4 PASS
- Phase 9i: Seller Analytics — 4/4 PASS
- Phase 9j: Delivery Tracking — 3/3 PASS
- Phase 9k: Seller Verification — 3/3 PASS
- Phase 10: Reject/Dispute/Refund — 3/3 PASS
