# Phase 18-19 — Security Testing and MVP Acceptance Test

## Current State

All 7 development phases are complete. The application has:
- Prisma + PostgreSQL database with 9 models
- NextAuth authentication with role-based access
- Product listings with Cloudinary image upload
- Marketplace with search/filter/pagination
- Transaction engine with state machine
- Paystack payment integration with webhook verification
- Post-purchase workflow (delivery, inspection, acceptance, payout, rejection, dispute, refund)
- Admin dashboard with user/transaction/dispute/refund management
- In-app notifications and email notifications
- Transaction history for buyers and sellers

## Buildplan Requirements (docs/buildplan.md)

### Phase 18 — Security and Business-Logic Testing

| Category | Test | Status |
|----------|------|--------|
| **Authentication** | | |
| | Unauthenticated user cannot access protected pages | Needs manual test |
| | User cannot access another user's dashboard | Needs manual test |
| | User cannot modify another user's product | Needs manual test |
| | Passwords are never stored in plaintext | Verified (bcrypt) |
| **Marketplace** | | |
| | Seller cannot purchase own item | Implemented (API check) |
| | Inactive product cannot be purchased | Implemented (API check) |
| | Sold product cannot be purchased again | Implemented (status check) |
| | Two buyers cannot successfully purchase the same item | Implemented (payment_pending check) |
| **Payments** | | |
| | Failed payment does not create successful transaction | Needs manual test |
| | Fake frontend payment response cannot trigger payout | Needs manual test |
| | Duplicate webhook does not duplicate transaction | Needs manual test |
| | Duplicate payout cannot occur | Needs manual test |
| | Payment amount is validated server-side | Needs manual test |
| **Transaction protection** | | |
| | Seller cannot receive payment before acceptance | Implemented (state machine) |
| | Buyer cannot falsely trigger seller payout | Implemented (state machine) |
| | Rejected transaction cannot automatically pay seller | Implemented (state machine) |
| | Refund cannot occur twice | Needs manual test |
| **Administration** | | |
| | Normal user cannot access admin functions | Implemented (role check) |
| | Admin actions are authenticated | Implemented (auth check) |
| | Transaction records cannot be arbitrarily altered from frontend | Needs manual test |

### Phase 19 — MVP Acceptance Test

Two complete transaction lifecycle tests required:
1. **Happy path**: Register → List → Buy → Pay → Deliver → Inspect → Accept → Payout → Complete
2. **Refund path**: Register → List → Buy → Pay → Deliver → Reject → Dispute → Refund → Complete

## Plan

### Task 1: Automated security test suite
Create a test script that programmatically verifies:
- Authentication guards on all protected API routes
- Authorization checks (buyer/seller/admin)
- Password hashing verification
- Duplicate purchase prevention
- Status transition validation
- Webhook idempotency

### Task 2: Manual test execution guide
Create a step-by-step guide for running the acceptance tests:
- Test account setup
- Happy path walkthrough
- Refund path walkthrough
- Expected results at each step
- Verification checklist

### Task 3: Fix any gaps found
Address any failing tests or missing guards before marking MVP complete.

### Task 4: Final verification
- Run `npx tsc --noEmit`
- Run `npx prisma generate`
- Verify migration status
- Verify all environment variables are set
- Verify database connection

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `tests/security/auth.test.ts` | Create | Test authentication guards |
| `tests/security/marketplace.test.ts` | Create | Test marketplace business logic |
| `tests/security/payments.test.ts` | Create | Test payment validation |
| `tests/security/admin.test.ts` | Create | Test admin authorization |
| `tests/e2e/acceptance.test.ts` | Create | End-to-end transaction test |
| `docs/testing-guide.md` | Create | Manual test execution guide |

## Out of Scope
- Load testing (V2.0)
- Penetration testing (V2.0)
- Automated CI/CD pipeline testing (deferred)
- Browser compatibility testing (deferred)

## Validation Criteria
- [ ] All automated security tests pass
- [ ] Happy path acceptance test passes
- [ ] Refund path acceptance test passes
- [ ] No TypeScript errors
- [ ] All environment variables documented
- [ ] Database connection verified
- [ ] MVP ready for deployment
