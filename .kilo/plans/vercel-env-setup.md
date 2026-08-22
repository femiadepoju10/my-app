# Plan: Fix Vercel Build Failure + Env Var Configuration

## Problem
Vercel build fails at "Collecting page data" stage with:
```
Error: Missing required environment variables: DATABASE_URL, NEXTAUTH_URL, ...
  at lib/env.ts:18
  at auth.ts:7
```

## Root Cause
`lib/env.ts` exports `validateEnv()` which throws if required env vars are missing. `auth.ts` calls `validateEnv()` at module-level (line 7), so it executes during `next build`'s static page generation phase. This forces ALL env vars to be present at build time — fails on Vercel if not configured.

## Status: ✅ IMPLEMENTED & VERIFIED

### Changes Made
1. **`auth.ts`** — Removed `validateEnv()` call and import from module level
2. **`lib/env.ts`** — Refactored `validateEnv(throwOnError = true)` + added `warnEnv()` non-throwing helper
3. **`app/layout.tsx`** — Added dev-only `warnEnv()` call (guarded by `NODE_ENV === "development"`)
4. **`prisma.config.ts`** — Changed hardcoded DB URL to `process.env.DATABASE_URL`
5. **`package.json`** — `"build": "prisma generate && next build"`, `"postbuild": "prisma migrate deploy"`
6. **`.env.example`** — Updated with all 31 variables

### Verification Results
- TypeScript: PASS
- Build: PASS (Compiled successfully, Collecting page data complete)
- E2E Tests: 63/63 PASS
- Security Tests: 91/91 PASS

---

## Environment Variable Configuration

### Local `.env.local` (already configured)
All variables are present in `.env.local`. Key notes:
- `DATABASE_URL` → `postgresql://postgres:postgres@localhost:5432/skillbridge` (local)
- `NEXTAUTH_SECRET` → `i+2gVvSQhn7rUCUJRW+UX6rLwFuG4t3Mh9wr4wlzL0s=` (already set)
- `PAYSTACK_WEBHOOK_SECRET` → `your_webhook_secret_here` (placeholder — will NOT work for live webhooks)

### Vercel Production Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

#### Required (10 vars)

| Variable | Value Source | Visibility |
|----------|-------------|------------|
| `DATABASE_URL` | Supabase/Neon connection string with `?pgbouncer=true` | 🔐 Secret |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` (run in terminal) | 🔐 Secret |
| `NEXTAUTH_URL` | Auto-set by Vercel (do not set) | N/A |
| `PAYSTACK_SECRET_KEY` | Paystack Dashboard → API Keys | 🔐 Secret |
| `PAYSTACK_PUBLIC_KEY` | Paystack Dashboard → API Keys | 🌐 Plain |
| `PAYSTACK_WEBHOOK_SECRET` | Paystack Dashboard → Webhooks (after deploy) | 🔐 Secret |
| `CLOUDINARY_CLOUD_NAME` | Copy from `.env.local` | 🌐 Plain |
| `CLOUDINARY_API_KEY` | Copy from `.env.local` | 🌐 Plain |
| `CLOUDINARY_API_SECRET` | Copy from `.env.local` | 🔐 Secret |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | 🔐 Secret |

#### Optional
| Variable | Value Source |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Generate via `npx tsx -e "console.log(require('web-push').generateVAPIDKeys().publicKey)"` |
| `VAPID_PRIVATE_KEY` | Same command, `.privateKey` |
| `TWILIO_ACCOUNT_SID` | Twilio Console → Dashboard |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Dashboard |

### Env var name note
The user asked about `AUTH_SECRET` but this app uses `NEXTAUTH_SECRET` (NextAuth v4). The user asked about `PAYSTACK_PUBLIC-KEY` with a dash but the actual variable is `PAYSTACK_PUBLIC_KEY`.

## Post-Deploy Steps

1. After first Vercel deploy succeeds, go to Paystack Dashboard → Settings → Webhooks
2. Add endpoint: `https://your-app-name.vercel.app/api/webhooks/paystack`
3. Select triggers: `charge.success`, `transfer.success`, `transfer.failed`
4. Copy the webhook secret to `PAYSTACK_WEBHOOK_SECRET` in Vercel env vars
5. Verify Resend domain at resend.com (for email delivery)
