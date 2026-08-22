# Plan: Vercel Deployment — Sponsored Listings Feature

## Status: ✅ Implementation Complete — Ready for Vercel Deployment

All Sponsored Listings code is implemented, tested, and the project builds successfully. This plan covers the final cleanup, environment variable configuration, and deployment steps.

## What Was Done (Summary)

### Files Created
| File | Purpose |
|------|---------|
| `prisma/migrations/20260822040000_add_sponsored_listings/migration.sql` | Forward-only DB migration for `sponsored_listings` table + `SponsoredStatus` enum |
| `lib/sponsored-types.ts` | Pricing constants, duration options, amount calc functions (no DB dependency — safe for client import) |
| `lib/sponsored-listings.ts` | `getActiveSponsoredProductIds()`, `getActiveSponsoredListings()` (DB query helpers) |
| `app/api/sponsored-listings/route.ts` | GET (list seller's listings), POST (create + Paystack payment link) |
| `app/api/sponsored-listings/verify/route.ts` | GET (verify Paystack payment, activate listing) |
| `app/dashboard/sponsored/page.tsx` | Seller dashboard: view listings, retry payment, renew |
| `app/dashboard/sponsored/verify/page.tsx` | Paystack callback page |
| `app/admin/sponsored/page.tsx` | Admin dashboard: revenue stats, all listings |

### Files Modified
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `SponsoredStatus` enum, `sponsored_listings` model, relations on `products` and `users` |
| `app/api/products/route.ts` | Boost sponsored products to top of search results, `isSponsored` field in response |
| `app/api/webhooks/paystack/route.ts` | Handle `charge.success` for sponsored listing payments |
| `app/(marketplace)/products/sell/page.tsx` | Boost modal after product creation with Paystack redirect |
| `components/products/ProductCard.tsx` | "Sponsored" badge with Sparkles icon |
| `components/ui/EmptyState.tsx` | Added `rocket` icon option |
| `components/layout/NavTabs.tsx` | Added `rocket` icon to icon map |
| `app/dashboard/layout.tsx` | Added "Sponsored" tab |
| `app/admin/layout.tsx` | Added "Sponsored" tab |
| `scripts/e2e-test.ts` | Added Phase 9q (9 assertions), fixed pre-existing cleanup bug |
| `scripts/security-test.ts` | Added `testSponsoredListingsSecurity` (3 assertions) |
| `docs/progress.md`, `docs/security-test-report.md`, `AGENTS.md`, `docs/buildplan.md` | Updated with results |

### Validation Results
| Check | Result |
|-------|--------|
| TypeScript (`npx tsc --noEmit`) | ✅ PASS |
| Production Build (`npx next build`) | ✅ PASS (67 routes) |
| E2E Tests (`npx tsx scripts/e2e-test.ts`) | ✅ 94/94 PASS |
| Security Tests (`npx tsx scripts/security-test.ts`) | ✅ 116/116 PASS |

## Environment Variables for Vercel

Set ALL of the following in **Vercel Dashboard → Project → Settings → Environment Variables**. Add each for `Production`, `Preview`, and `Development` environments as appropriate.

### Required

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Use Supabase, Neon, or Vercel Postgres. Format: `postgresql://user:password@host:5432/dbname` |
| `NEXTAUTH_URL` | `https://your-app-name.vercel.app` | Auto-set by Vercel in most cases; set explicitly if needed |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | **Generate fresh** — do NOT reuse the local value |
| `PAYSTACK_SECRET_KEY` | From Paystack Dashboard → API Keys | Test key: `sk_test_...`, Live key: `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | From Paystack Dashboard → API Keys | Test key: `pk_test_...`, Live key: `pk_live_...` |
| `PAYSTACK_WEBHOOK_SECRET` | From Paystack Dashboard → Settings → Webhooks | Required after first deploy (see Post-Deploy Steps) |
| `CLOUDINARY_CLOUD_NAME` | `wq2t8ywr` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | `396525169517369` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | `-BBnZNqEipDKw1qPfQaiMQ7Hgu0` | From Cloudinary dashboard |
| `RESEND_API_KEY` | From Resend Dashboard → API Keys | For transactional emails |
| `NEXT_PUBLIC_BASE_URL` | `https://your-app-name.vercel.app` | Client-side base URL for redirects |

### Optional

| Variable | Value | Notes |
|----------|-------|-------|
| `OPENAI_API_KEY` | From OpenAI Platform → API Keys | Required for AI product description generation |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key | Required for push notifications; generate with `node -e "console.log(require('web-push').generateVAPIDKeys().publicKey)"` |
| `VAPID_PRIVATE_KEY` | VAPID private key | Same command as above (`.privateKey`) |
| `TWILIO_ACCOUNT_SID` | From Twilio Console | Required for SMS notifications |
| `TWILIO_AUTH_TOKEN` | From Twilio Console | Required for SMS notifications |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | Required for SMS notifications |

### How to set environment variables on Vercel:
1. Go to [vercel.com](https://vercel.com) → your project → Settings → Environment Variables
2. For each variable: set **Name**, **Value**, and **Environment** (Production, Preview, Development)
3. Click **Save** for each variable
4. Redeploy the project after adding all variables

## Pre-Deploy Checklist

- [ ] All environment variables listed above are set in the Vercel dashboard
- [ ] `DATABASE_URL` points to a PostgreSQL instance (not localhost)
- [ ] Paystack keys are from the correct environment (test vs live)
- [ ] Cloudinary credentials are verified
- [ ] Resend API key is active and domain is verified (for email)
- [ ] `NEXTAUTH_SECRET` is freshly generated (`openssl rand -base64 32`)
- [ ] Git repository is clean and committed (all new files staged)

## Post-Deploy Steps

1. **Configure Paystack Webhook**
   - Go to [Paystack Dashboard](https://dashboard.paystack.co) → Settings → Webhooks
   - Add endpoint: `https://your-app-name.vercel.app/api/webhooks/paystack`
   - Select triggers: `charge.success`, `transfer.success`, `transfer.failed`
   - Copy the webhook secret to `PAYSTACK_WEBHOOK_SECRET` in Vercel env vars
   - Redeploy

2. **Verify Database Migrations**
   - The `postbuild` script runs `prisma migrate deploy` automatically after each Vercel build
   - Verify tables were created by checking your PostgreSQL instance

3. **Verify Email Delivery**
   - Go to [Resend Dashboard](https://resend.com) → Domains
   - Ensure your domain is verified (or add a sender identity)
   - Send a test email from the app (signup/verification)

4. **Verify Cloudinary**
   - Upload a test image via the sell page
   - Confirm it appears in the Cloudinary media library under the `skillbridge/` folder

5. **Test Core Flows**
   - Sign up a new user
   - List a product (KYC must be completed first)
   - Create a sponsored listing (pay via Paystack test card: `4000000000000002` / any 3-digit CVV)
   - Verify the sponsored badge appears on the product card
   - Verify the product appears at the top of search results

## Vercel Build Configuration

The project's `package.json` already has the correct build settings:
```json
"build": "prisma generate && next build",
"postbuild": "prisma migrate deploy"
```

Vercel will automatically:
1. Run `npm install`
2. Run `npm run build` → `prisma generate && next build`
3. Run `npm run postbuild` → `prisma migrate deploy` (applies any new migrations)

No `vercel.json` is needed. The `next.config.ts` already configures:
- Cloudinary image domains
- Security headers (CSP, HSTS, X-Frame-Options)
- Webpack fallbacks (disables `util` polyfill)

## Remaining V2.0 Features (Deferred — Next Update)

| Feature | Priority | Notes |
|---------|----------|-------|
| AI recommendations | Medium | Product recs engine — not yet implemented |
| Automated logistics | Medium | Beyond MVP scope |
| Seller subscriptions | Medium | Recurring billing — separate feature |
| Advertising | Medium | Separate from sponsored listings |
| Auctions | Low | Niche feature |
| International transactions | Medium | Multi-currency done, cross-border payments TBD |
| Advanced fraud detection | Medium | ML-based risk scoring |
| Mobile applications | High | Very complex — React Native app |
