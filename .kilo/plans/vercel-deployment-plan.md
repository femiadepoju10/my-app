# Plan: Vercel Deployment Readiness Assessment

## Goal
Determine whether the PassitOn marketplace app can be deployed to Vercel in its current state, and produce a checklist of required/optional pre-deployment tasks.

## Current State Analysis

### Build & Code Readiness — ✅ No changes needed
- **Next.js 16** — Vercel's native platform. ✓
- **TypeScript** — compiles clean (`npx tsc --noEmit` passes). ✓
- **Build** — `next build` succeeds, 51 pages generated. ✓
- **`next.config.ts`** — valid config, CSP headers, security headers, Cloudinary image domains. ✓
- **No custom server** — uses Next.js API routes, fully serverless-compatible. ✓
- **No binary/native dependencies** — `bcryptjs` (pure JS) used instead of `bcrypt`. ✓

### Blocking Issues (MUST FIX before deploy)

#### 1. Database is localhost — CRITICAL
- **File:** `.env.local` line 2, `prisma.config.ts` line 5
- **Problem:** `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillbridge` resolves to localhost inside Vercel's serverless functions, which will fail.
- **Fix:** Replace with an external PostgreSQL provider (Supabase, Neon, Railway, AWS RDS). Update both `.env.local` and `prisma.config.ts`.

#### 2. Prisma Data Proxy / Connection Pooling — CRITICAL
- **File:** `lib/db/index.ts` lines 1-8
- **Problem:** `PrismaPg` adapter creates a new `pg.Pool` per serverless function invocation. Vercel's serverless architecture leads to connection exhaustion under concurrent load.
- **Fix options:**
  a) Enable **Prisma Data Proxy** (`datasource db { proxy: true }` in `schema.prisma` or `datasourceUrl` env var with ` prisma://` URL) — connection pooling as a service.
  b) Use **pgBouncer** on the PostgreSQL provider (Supabase/N Neon handle this internally).
  c) Recommended: Switch to Prisma Data Proxy (simplest, no infra changes).

#### 3. Environment Variables — `.env.example` is incomplete
- **File:** `.env.example` (20 lines), `.env.local` (31 lines)
- **Problem:** `.env.example` is missing 8 of 31 variables. Any developer onboarding or Vercel setup using the example will fail at runtime.
- **Missing in `.env.example`:**
  - `NEXTAUTH_URL` — required by `validateEnv()`
  - `NEXTAUTH_SECRET` — required
  - `PAYSTACK_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `TWILIO_ACCOUNT_SID` (optional, but referenced)
  - `TWILIO_AUTH_TOKEN` (optional)
  - `TWILIO_PHONE_NUMBER` (optional)
- **Fix:** Update `.env.example` to include all variables from `.env.local`.

#### 4. `PAYSTACK_WEBHOOK_SECRET` is placeholder — HIGH
- **File:** `.env.local` line 11
- **Problem:** `PAYSTACK_WEBHOOK_SECRET=your_webhook_secret_here` — webhook verification at `app/api/webhooks/paystack/route.ts` will reject all real Paystack webhooks.
- **Fix:** Set real webhook secret in Vercel env vars from Paystack dashboard.

### Optional Improvements (Recommended before deploy)

#### 5. Prisma Migrate in Build — HIGH
- **Problem:** Database schema must exist before the app runs. There's no `postbuild` script running `prisma migrate deploy`.
- **Fix:** Add `"postbuild": "prisma generate && prisma migrate deploy"` or use `PrismaClient` with a migration step. Vercel integration auto-runs nothing; need explicit migration handling.
- **Alternative:** Use `prisma db push` for initial deploy (acceptable for small apps).

#### 6. NextAuth Secret & URL — HIGH
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set to localhost values. On Vercel, these must be set in project settings:
  - `NEXTAUTH_URL=https://your-app.vercel.app`
  - `NEXTAUTH_SECRET=<strong-random-string>`

#### 7. Build Cache Optimization
- No `output: "standalone"` or `output: "export"` in `next.config.ts`. Vercel handles this natively; no change needed. ✓

## Pre-Deployment Checklist

| # | Item | Severity | Action |
|---|------|----------|--------|
| 1 | Replace localhost DATABASE_URL with external PostgreSQL | CRITICAL | Choose Supabase/N Neon/Railway; set `DATABASE_URL` in Vercel env |
| 2 | Enable Prisma Data Proxy or pgBouncer | CRITICAL | Add `datasourceUrl = env("DATABASE_URL")` + proxy, or ensure provider handles pooling |
| 3 | Fix `PAYSTACK_WEBHOOK_SECRET` | HIGH | Set real value from Paystack dashboard in Vercel env |
| 4 | Set `NEXTAUTH_URL` to Vercel domain | HIGH | Add to Vercel env vars |
| 5 | Generate `NEXTAUTH_SECRET` | HIGH | `openssl rand -base64 32`, set in Vercel env |
| 6 | Update `.env.example` with all required vars | MEDIUM | Add 8 missing variables |
| 7 | Add migration deploy to build | MEDIUM | Add `postbuild` script: `prisma generate && prisma migrate deploy` |
| 8 | VAPID keys for push notifications | LOW | Set in Vercel env (optional if push not needed immediately) |
| 9 | Twilio credentials (optional) | LOW | Set in Vercel env if SMS notifications are used |
| 10 | Cloudinary credentials | LOW | Set in Vercel env |
| 11 | Resend API key | LOW | Set in Vercel env |

## Data Migration Concerns

- **No data migration needed** — the database is PostgreSQL and can be restored/migrated from the local instance.
- **Forward-only migrations** — existing migration files in `prisma/migrations/` are forward-only; Vercel build will run `prisma migrate deploy` to apply them.
- **Database must be pre-provisioned** — schema must exist before serverless functions can query it.

## Implementation Results

### Completed Actions (Codebase Changes)
1. **`prisma.config.ts`** — Changed hardcoded `DATABASE_URL` to `process.env.DATABASE_URL`
2. **`.env.example`** — Updated to include all 31 variables from `.env.local` (missing 8: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `PAYSTACK_WEBHOOK_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
3. **`package.json`** — Added `"prisma generate && next build"` as build script and `"postbuild": "prisma migrate deploy"` for production migrations

### Remaining Deployment Actions (Manual / Environment)
| # | Action | Severity | Who |
|---|--------|----------|-----|
| 1 | Provision external PostgreSQL (Supabase/NNeon/Railway) | CRITICAL | DevOps |
| 2 | Set `DATABASE_URL` in Vercel env vars | CRITICAL | DevOps |
| 3 | Enable Prisma Data Proxy or use pooled connection string | CRITICAL | DevOps |
| 4 | Set `NEXTAUTH_URL` to Vercel deployment URL | HIGH | DevOps |
| 5 | Generate and set `NEXTAUTH_SECRET` (`openssl rand -base64 32`) | HIGH | DevOps |
| 6 | Set `PAYSTACK_WEBHOOK_SECRET` from Paystack dashboard | HIGH | DevOps |
| 7 | Set VAPID keys for push notifications | LOW | DevOps |
| 8 | Set Twilio credentials if using SMS | LOW | DevOps |
| 9 | Set Cloudinary, Resend credentials | LOW | DevOps |

### Post-Implementation Verification
- TypeScript: PASS
- Build: PASS (51 pages, `prisma generate` runs before build)
- E2E Tests: 63/63 PASS
- Security Tests: 91/91 PASS
