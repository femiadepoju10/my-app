# Plan: V1.1 — Seller Profile, Ratings & Bug Fixes

## Context

The payout/refund integration is implemented and all 61 tests pass (32 E2E + 29 security). However, there is a **critical functional gap**: the payout flow requires a `paystackRecipientCode` on the `users` table, but there is no UI or API to set it.

### Current State of Payout Flow

1. Transaction reaches `payout_pending` (buyer accepts item)
2. Admin clicks "Initiate Payout" → PATCH handler calls `initiateTransfer()`
3. **Fails** if seller has no `paystackRecipientCode`: `"Seller has no Paystack recipient set up. Cannot initiate payout."`

### What Exists
- `users.paystackRecipientCode` field — exists in schema and database, but never populated
- `lib/paystack.ts:createTransferRecipient()` — exists, creates a Paystack recipient code
- No API endpoint to call `createTransferRecipient()`
- No UI to input seller bank details
- Admin users page (`app/admin/users/page.tsx`) — role toggle + delete only

### PRD Guidance
> Optional/possibly later: Bank account details

The PRD defers bank account details to a later version, but the payout mechanism is **essential to MVP** (PRD Section 16: Seller Payout). We need a minimal admin tool to set up Paystack recipients for sellers.

## Goal

Implement a minimal admin interface to set up Paystack transfer recipients for sellers, completing the payout flow end-to-end.

## Approach

An admin-only feature where admins can:
1. View which sellers have/don't have a Paystack recipient set up
2. Input a seller's bank account number and bank code
3. Call `createTransferRecipient()` via Paystack API
4. Store the returned `recipientCode` on the user record

This is intentionally minimal — no self-service seller bank setup (defers to V1.1 per PRD).

## Tasks

### Task 1: Add Admin API Endpoint for Payout Setup

**File**: `app/api/admin/users/[id]/payout/route.ts` (new)

`PATCH /api/admin/users/{id}/payout`:
- Requires admin role
- Accepts `{ accountNumber, bankCode }`
- Calls `createTransferRecipient()` via Paystack
- Stores `paystackRecipientCode` on user
- Returns success or error

### Task 2: Add Payout Status to Admin Users API

**File**: `app/api/admin/users/route.ts`

- Add `paystackRecipientCode` to the GET select fields
- Add PATCH handler support for `paystackRecipientCode` (for display purposes)

### Task 3: Add Payout Setup UI to Admin Users Page

**File**: `app/admin/users/page.tsx`

- Show Paystack payout status (Set Up / Ready) per user
- "Set Up Payout" button opens a modal with:
  - Bank account number input
  - Bank code input (or dropdown of Nigerian banks)
  - Submit button that calls `createTransferRecipient()`
- Show recipient code when set
- Only show for non-admin users (sellers)

### Task 4: Update E2E Test for Payout Setup

**File**: `scripts/e2e-test.ts`

Add assertions verifying:
- `paystackRecipientCode` can be set and read from DB
- Payout setup flow works end-to-end (DB → function call → stored)

### Task 5: Update Security Test

**File**: `scripts/security-test.ts`

Add assertions:
- Non-admin cannot access payout setup endpoint
- Admin can set payout details
- `paystackRecipientCode` field is properly secured

## Acceptance Criteria

- [ ] Admin API endpoint for payout setup exists and works
- [ ] Admin users API returns `paystackRecipientCode` field
- [ ] Admin UI shows payout status per user
- [ ] Admin UI has modal to set up seller bank details → Paystack recipient
- [ ] TypeScript: PASS
- [ ] Build: PASS
- [ ] E2E tests: PASS (with new payout setup assertions)
- [ ] Security tests: PASS (with new admin auth assertions)
