# Plan: Fix Vercel Build Failure (Env Var Validation During Build)

## Problem
Vercel build fails at "Collecting page data" stage with:
```
Error: Missing required environment variables: DATABASE_URL, NEXTAUTH_URL, ...
  at lib/env.ts:18
  at auth.ts:7
```

## Root Cause
`lib/env.ts` exports `validateEnv()` which throws if required env vars are missing. `auth.ts` calls `validateEnv()` at module-level (line 7), so it executes during `next build`'s static page generation phase. Any module that imports `auth.ts` triggers this validation during build.

On Vercel, this forces ALL environment variables to be present as **build-time** env vars. If the user hasn't configured all 10 required vars in Vercel's Build Settings, the build fails before any runtime code executes.

## Fix

### Step 1: Remove module-level validateEnv() from auth.ts
**File:** `auth.ts` line 7
- Remove `validateEnv();` call
- Remove `import { validateEnv } from "@/lib/env";` import

### Step 2: Add validateEnv() to API route entry points that need it
Instead of validating at module-load time of auth.ts (imported everywhere), validate only in API routes that actually use the env vars at request time:

- `app/api/admin/users/route.ts` (NextAuth session)
- `app/api/transactions/route.ts` (Paystack, DB)
- Other API routes that use `process.env.*`

**Implementation:** Add `validateEnv()` call at the top of each API route handler function, not at module level. This ensures validation happens only when the API is actually called at runtime (not during build).

**Alternative (simpler):** Remove `validateEnv()` entirely and rely on natural runtime failures (Prisma throws if DATABASE_URL is missing, etc.). This is acceptable because:
- Build succeeds without env vars
- Individual services will produce meaningful errors if their env vars are missing
- Developers get clear error messages from each service at runtime

### Step 3: Keep validateEnv() for dev-only warnings
**File:** `lib/env.ts`
- Make `validateEnv()` export a `warnEnv()` function that logs a console.warn instead of throwing
- Call `warnEnv()` from a development-only context (e.g., `_app` or a dev middleware)
- OR: Add a `throwOnError` parameter to `validateEnv(throwOnError = true)` and call `validateEnv(false)` from runtime contexts

### Step 4: Update .env.example
Ensure `.env.example` lists all required vars so Vercel users know what to set.

## Affected Files
- `auth.ts` — remove `validateEnv()` call + import
- `lib/env.ts` — optionally refactor to warn-only mode
- `app/api/*/route.ts` — add `validateEnv()` calls at route handler entry (if taking Step 2 approach)

## Validation
1. `npx tsc --noEmit` — PASS
2. `npm run build` — PASS (build succeeds even without env vars)
3. E2E tests — 63/63 PASS
4. Security tests — 91/91 PASS
5. Deploy to Vercel with env vars set → works
6. Deploy to Vercel without all env vars → build succeeds, runtime errors only when hitting affected endpoints

## Decision: Approach
**Recommended approach (Step 1 + Step 3):**
1. Remove `validateEnv()` from `auth.ts` module level
2. Refactor `lib/env.ts` to make `validateEnv()` accept a `throwOnError` parameter (default `true`), and export a `warnEnv()` helper that calls `validateEnv(false)` — logs warnings instead of throwing
3. Call `warnEnv()` from `app/layout.tsx` or a root layout — only affects development, not Vercel build

This is the minimal change: removes the build-breaking call, adds a non-throwing dev warning, and keeps all existing validation behavior for development.
