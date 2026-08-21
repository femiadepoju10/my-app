# Plan: Remove User from Database

## Context
Admin dashboard (`app/admin/users/page.tsx`) currently supports viewing users and toggling roles (promote/demote). There is no way to delete/remove a user. The Prisma schema (`prisma/schema.prisma`) defines `users` with relations to `products`, `transactions`, `payouts`, `disputes`, and `notifications`, but without explicit `onDelete` rules on most foreign keys.

## Goal
Allow an admin to remove a user from the database safely, either via:
1. A one-time script for immediate cleanup, and/or
2. A proper admin UI + API feature for user deletion

## Constraints / Risks
- Foreign-key constraints will block hard deletion if the user has related records (products, transactions, payouts, disputes, notifications).
- Deleting a user with transaction history may violate business/audit requirements.
- Need to decide: soft-delete vs hard-delete, and how to handle orphaning vs cascading.

## Proposed Approach

### Immediate one-time cleanup (script)
Create a script `scripts/delete-user.ts` that:
1. Accepts an email or user ID as CLI arg.
2. Looks up the user.
3. Deletes dependent records first (notifications, disputes, payouts, products/images, transactions/payments/refunds) OR soft-deletes by setting a flag.
4. Deletes the user.
5. Prints summary.

### Admin feature (API + UI)
1. **Backend**: Add `DELETE /api/admin/users` endpoint in `app/api/admin/users/route.ts` that:
   - Validates admin session.
   - Prevents self-deletion.
   - Option A (recommended for MVP): Soft-delete by setting `deletedAt` (requires schema migration).
   - Option B: Hard-delete with explicit cascade handling in code.
2. **Frontend**: Add a "Delete" action in `app/admin/users/page.tsx` with confirmation dialog.
3. **Schema** (if soft-delete): Add `deletedAt DateTime?` to `users` model and run migration.

## Open Decision
Which deletion strategy should I plan for?
- **A) Soft-delete** (`deletedAt` timestamp). Safer, preserves audit trail, easier migration.
- **B) Hard-delete with manual cascade**. Cleans everything, but risks orphaned data and is harder to implement correctly with current FK constraints.

My recommendation: **Soft-delete (Option A)**. It avoids FK constraint failures, keeps transaction history intact for audits, and is the standard approach for admin user removal in marketplaces.

## Validation
- Run the script against a test user and confirm the user is hidden/removed.
- If implementing the full feature: admin clicks Delete → confirmation → user disappears from table → login is blocked for that user.

## Files to modify/create
- `scripts/delete-user.ts` (new)
- `app/api/admin/users/route.ts` (add DELETE handler)
- `app/admin/users/page.tsx` (add delete button + confirmation)
- `prisma/schema.prisma` (add `deletedAt` if soft-delete)
- `prisma/migrations/` (run migration if schema changes)
