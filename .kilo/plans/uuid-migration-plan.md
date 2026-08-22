# Plan: Migrate Primary Keys from Integer to UUID

## Context
The project database principles in `AGENTS.md` state:
> UUID primary keys on every application-owned table, restrictive foreign keys (no cascades), forward-only migrations, and explicit cleanup through application code.

Current state: All tables use `@id @default(autoincrement())` with integer IDs.

## Goal
Migrate all application-owned tables to use UUID primary keys while preserving existing data and maintaining a working application.

## Scope
Tables to migrate:
- `users`
- `products`
- `productImages`
- `transactions`
- `payments`
- `payouts`
- `refunds`
- `disputes`
- `notifications`

## Constraints
- Must preserve all existing data
- Must not break foreign key relationships during migration
- Must update all TypeScript types, API routes, and frontend code that references IDs
- Must maintain backward compatibility during transition if possible
- No data loss

## Proposed Approach

### Phase 1: Schema Migration
1. Update Prisma schema to use `@id @default(uuid())` for all models
2. Change all foreign key fields from `Int` to `String` (UUIDs are stored as strings in Prisma)
3. Generate a new migration

### Phase 2: Data Migration Script
1. Create a one-time migration script `scripts/migrate-to-uuid.ts`
2. For each table:
   - Add a temporary `uuid` column
   - Generate UUIDs for existing rows
   - Update all foreign key references in related tables
   - Drop old integer `id` columns
   - Rename `uuid` column to `id`
   - Add primary key constraint on new `id` column
3. This must be done in dependency order:
   - `users` first (referenced by most tables)
   - `products` next (referenced by productImages, transactions)
   - `productImages` (references products)
   - `transactions` (references users, products; referenced by payments, payouts, refunds, disputes)
   - `payments` (references transactions)
   - `payouts` (references transactions, users)
   - `refunds` (references transactions)
   - `disputes` (references transactions, users)
   - `notifications` (references users)

### Phase 3: Code Updates
1. Update all TypeScript interfaces where `id` is typed as `number` → `string`
2. Update all `parseInt()` calls to remove integer parsing
3. Update all `db.users.findFirst({ where: { id: ... } })` to use string IDs
4. Update NextAuth session to return string IDs
5. Update all URL params parsing from `parseInt(id, 10)` to just `id` (string)
6. Update all `parseFloat`/`Math.round` price calculations to ensure they still work
7. Update all `formatPrice` calls if needed (should work with numbers regardless of ID type)

### Phase 4: Testing
1. Run `npx prisma migrate deploy` to apply migration
2. Run the data migration script
3. Test all CRUD operations
4. Test authentication flow
5. Test transaction flow end-to-end
6. Verify no broken foreign key references

## Risks
- **High risk**: Foreign key constraint violations during data migration
- **High risk**: Missing ID type updates in some files causing runtime errors
- **Medium risk**: Session/JWT tokens containing old integer IDs
- **Medium risk**: Cloudinary image URLs or external references containing integer IDs

## Mitigation
- Backup database before migration
- Run migration in a transaction where possible
- Search codebase thoroughly for `number` ID types and `parseInt`
- Clear all user sessions after migration (force re-login)
- Test on a copy of production data first

## Open Decisions
1. Should UUIDs be stored as `String` or `Bytes` in Prisma? (Recommendation: `String` for easier debugging)
2. Should we use `cuid()` instead of `uuid()`? (Recommendation: `uuid()` per project rules)
3. Should we do this now or after more features are built? (Recommendation: Now, before more data exists)

## Validation
- All tables have UUID primary keys
- All foreign keys resolve correctly
- App builds without errors
- All pages load and function correctly
- No hardcoded integer ID assumptions remain

## Files to Modify
- `prisma/schema.prisma` — all model ID fields and foreign keys
- All API route files in `app/api/` — ID parsing, types
- All page components with ID params — `parseInt` removal
- `auth.ts` — session ID type
- All TypeScript interfaces with `id: number` → `id: string`
- `scripts/migrate-to-uuid.ts` — new migration script
