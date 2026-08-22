# Plan: Security & Business-Logic Testing

## Context

The MVP core (auth, listings, checkout, payment, transaction state machine, payout/refund via Paystack) is implemented and the E2E test passes 32/32. Per the build plan (Phase 18), **security testing must occur before MVP is considered complete**.

### Current Security Posture (verified)

| Layer | Status | Details |
|-------|--------|---------|
| Auth protection | ✅ | `middleware/proxy.ts` protects all non-public routes |
| Auth API | ✅ | `getServerSession` check on every API route |
| Role checks | ✅ | `session.user.role !== "admin"` checks in admin APIs |
| Password hashing | ✅ | `bcrypt.hash(password, 10)` in signup |
| Seller can't buy own product | ✅ | `product.sellerId === buyerId` → rejected |
| Inactive/sold product purchase | ✅ | `product.status !== "active"` → rejected |
| Server-side price | ✅ | `serviceFee` and `totalAmount` computed from DB `product.price` |
| Rate limiting | ✅ | 10 transactions/hr per user in checkout |
| Webhook signature verification | ✅ | `verifyWebhookSignature` with SHA-512 HMAC |
| Idempotency on payment webhook | ✅ | Checks `existingPayment.status === "successful"` |
| Transaction state authorization | ✅ | Each transition has buyer/seller/admin checks |
| Paystack payout/refund calls | ✅ | Only admin can trigger, external API call required |

### Security Gap Identified

**Race condition in checkout (`/api/transactions` POST):**
- The product status check (line 46) and existing-transaction check (line 60) happen *outside* the `db.$transaction` block.
- Two concurrent buyers can both see `status: "active"` and both enter the transaction, creating duplicate transactions for the same product.
- **Fix**: Move all checks inside the transaction and use a conditional update (`where: { id: productId, status: "active" }`).

## Goal

Test all security and business-logic requirements from build plan Phase 18, fix the race condition in checkout, and document the results.

## Tasks

### Task 1: Fix Race Condition in Checkout

**File**: `app/api/transactions/route.ts`

Restructure the POST handler so all checks happen inside `db.$transaction`:
```ts
const transaction = await db.$transaction(async (tx) => {
  // Re-fetch product inside transaction with a lock
  const product = await tx.products.findUnique({ where: { id: productId } });
  if (!product || product.status !== "active") throw new Error("Product is not available");

  if (product.sellerId === buyerId) throw new Error("You cannot buy your own product");

  const existing = await tx.transactions.findFirst({
    where: { productId, status: "payment_pending" },
  });
  if (existing) throw new Error("Someone is already checking out this product");

  const newTransaction = await tx.transactions.create({
    data: { productId, buyerId, sellerId: product.sellerId, ... },
  });

  // Conditional update: only succeeds if product is still "active"
  await tx.products.updateMany({
    where: { id: productId, status: "active" },
    data: { status: "reserved", updatedAt: new Date().toISOString() },
  });

  return newTransaction;
});
```

### Task 2: Write Security Test Script

**File**: `scripts/security-test.ts`

Create a test script that verifies each security requirement:

1. **Authentication**
   - Unauthenticated API call returns 401
   - Session user ID is a UUID, not a sequential integer
   - Passwords stored as bcrypt hash ($2 prefix)
   - User A cannot access User B's transactions (GET `/api/transactions` only returns own)

2. **Marketplace**
   - Seller cannot purchase own product (tested in checkout API)
   - Inactive product returns 400
   - Sold product returns 400
   - Concurrent checkout (race condition) is prevented

3. **Payments**
   - Payment verification is server-side (verifyTransaction called in webhook, not frontend)
   - Fake frontend payment response cannot trigger state change (verified by inspecting checkout API — it only creates `payment_pending`, webhook transitions to `payment_confirmed`)
   - Duplicate webhook is idempotent (existingPayment.status === "successful" check)
   - Duplicate payout prevention (payout status === "completed" check in webhook)
   - Server-side amount calculation (serviceFee/totalAmount from DB price, not client)

4. **Transaction Protection**
   - Seller cannot mark item as delivered (auth check in API)
   - Buyer cannot accept an item that's not delivered (state machine transition check)
   - Buyer cannot falsely trigger payout (accepted → payout_pending is automatic, but payout_completed requires admin)
   - Rejected transaction cannot auto-pay seller (state machine doesn't allow)
   - Refund cannot occur twice (refund_completed → no further transitions allowed, webhook idempotency)

5. **Administration**
   - Normal user cannot access `/api/admin/*` endpoints
   - Admin actions require authentication (POST to `/api/transactions/[id]` with admin role)
   - Transaction status cannot be arbitrarily altered from frontend (only allowed transitions per `VALID_STATUS_TRANSITIONS`)

### Task 3: Document Security Test Results

**File**: `docs/security-test-report.md`

Document pass/fail for each test case.

## Acceptance Criteria

- [ ] Race condition fixed in checkout API (all checks inside transaction)
- [ ] `scripts/security-test.ts` created and runs successfully
- [ ] All security tests pass
- [ ] `docs/security-test-report.md` created documenting results
- [ ] TypeScript: PASS
- [ ] Build: PASS
