# Plan: Seller Verification & Admin Review (V2.0)

## Context

### Completed Phases
- **V1.0 MVP** — Full transaction lifecycle, payments, disputes, admin, notifications
- **V1.1** — Wishlist, chat, seller profiles, push+SMS notifications, reviews
- **V2.0: Product Recommendations** — ✅ Done (60 E2E, 85 security)
- **V2.0: Seller Analytics Dashboard** — ✅ Done
- **V2.0: Delivery Tracking** — ✅ Done

### Current State
- Any authenticated user can immediately list products for sale (no verification)
- Admin users page (`app/admin/users/page.tsx`) only supports role promotion/demotion
- No seller verification status in the schema
- PRD §106 says: "Government ID/KYC — For the first MVP, extensive KYC can be deferred"
- buildplan.md line 796: "Seller verification/KYC expansion | V2.0"
- The PRD's core trust question: "Can strangers successfully buy and sell products while trusting the platform?"

### Why Seller Verification Next
1. **Directly addresses trust** — unverified sellers pose risk; verification adds accountability
2. **Buildplan priority** — next feature in the V2.0 list after delivery tracking
3. **Admin infrastructure exists** — `app/admin/users/page.tsx` + `app/api/admin/users/route.ts` already manage users
4. **PRD-aligned** — PRD §106 mentions "Government ID/KYC" as optional/later, and §802 lists "Complex seller verification" as V2.0
5. **Self-contained** — no external KYC provider needed; admin-moderated verification flow
6. **Nigerian market fit** — trust is critical in peer-to-peer marketplaces

## Design Decisions

### Schema
- Add `sellerVerificationStatus` to `users` model: `"pending" | "verified" | "rejected"` (default: `null` = not a seller)
- Add `verificationNote` (admin rejection reason, VARCHAR(500))
- Add `verifiedAt` timestamp
- When a user creates their first product, `sellerVerificationStatus` auto-set to `"pending"`
- Only verified sellers can have new listings; unverified sellers' products are hidden from marketplace

### Database
- Forward-only migration — `ALTER TABLE` to add columns (no new table needed)
- No cascades (existing ON DELETE RESTRICT pattern)

### API
- `app/api/admin/users/route.ts` PATCH — add `sellerVerificationStatus` + `verificationNote` fields
- `app/api/admin/users/route.ts` GET — include `sellerVerificationStatus` + `verificationNote`
- `app/api/products/route.ts` POST — set `sellerVerificationStatus = "pending"` for new sellers

### Admin UI
- `app/admin/users/page.tsx` — add verification status badge + approve/reject buttons
- Add "Seller Verification" filter tab in admin nav
- Modal for rejection reason when rejecting

### Seller Profile Public UI
- `app/seller/[id]/page.tsx` — show verified badge on seller name
- `app/(marketplace)/products/[id]/page.tsx` — show verified badge on seller info

### Notifications
- Add `seller_verification` notification type
- Notify seller when status changes to "verified" or "rejected"

### Tests
- E2E: verify new sellers get "pending" status, verified sellers can list, unverified sellers blocked
- Security: only admin can change verification status

## Tasks

### Task 1: Update Schema & Database
**File**: `prisma/schema.prisma`
- Add `sellerVerificationStatus String? @map("seller_verification_status")` to `users`
- Add `verificationNote String? @db.VarChar(500) @map("verification_note")` to `users`
- Add `verifiedAt DateTime? @map("verified_at")` to `users`
- Create columns in DB via raw SQL ALTER TABLE

### Task 2: Update Admin Users API
**File**: `app/api/admin/users/route.ts`
- GET: include `sellerVerificationStatus`, `verificationNote`, `verifiedAt` in return
- PATCH: accept `sellerVerificationStatus` + `verificationNote` + `verifiedAt`

### Task 3: Add Verification Badge to Seller Profiles
**File**: `app/seller/[id]/page.tsx`
- Show verified badge (ShieldCheck icon) on seller name when `sellerVerificationStatus === "verified"`
**File**: `app/(marketplace)/products/[id]/page.tsx`
- Show verified badge on seller name in product details

### Task 4: Update Product Creation
**File**: `app/api/products/route.ts` POST
- When a user creates their first product, auto-set `sellerVerificationStatus = "pending"` if not already set
- New products from unverified sellers show status "pending_review" internally but remain "active" until admin review

### Task 5: Update Admin Users Page
**File**: `app/admin/users/page.tsx`
- Add verification status badge on each user row
- Add "Approve Seller" / "Reject Seller" buttons with modal for rejection reason
- Filter by verification status

### Task 6: Update Admin Layout Nav
**File**: `app/admin/layout.tsx`
- Add "Seller Verification" tab

### Task 7: Add Verification Notifications
**File**: `lib/notifications.ts`
- Add `seller_verification` to message map
- Notify seller on status change

### Task 8: Update Tests
- `scripts/e2e-test.ts` — Phase 9k (seller verification status assertions)
- `scripts/security-test.ts` — `testSellerVerificationSecurity` function

## Acceptance Criteria
- [ ] Schema has `sellerVerificationStatus`, `verificationNote`, `verifiedAt` on `users` model
- [ ] New sellers get "pending" status when they list their first product
- [ ] Admin can approve/reject sellers via admin users page
- [ ] Verified badge shows on public seller profiles and product details
- [ ] `seller_verification` notifications sent on status change
- [ ] TypeScript: PASS
- [ ] Build: PASS
- [ ] E2E tests: PASS (with verification assertions)
- [ ] Security tests: PASS (with verification security assertions)
