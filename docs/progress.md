# PassitOn Project Progress

### 2026-08-21 (V1.1: Wishlist & Rating Display)
- Added seller self-service bank setup to `app/api/profile/payout/route.ts`
- Added `wishlists` model to `prisma/schema.prisma` (UUID PK, no cascades, unique user/product)
- Created `app/api/wishlist/route.ts` (GET, POST, DELETE — authenticated, no duplicates, isolation)
- Created `components/wishlist/WishlistButton.tsx` — reusable heart toggle
- Created `app/dashboard/wishlist/page.tsx` — dedicated wishlist page
- Added Wishlist button to `ProductCard` and product detail page
- Added "Wishlist" to dashboard nav tabs and NavTabs icon map
- Added `getSellerRating`/`getSellerRatings` to `lib/analytics.ts`
- Added seller rating (stars + count) on product cards and product detail page
- Added `heart` icon option to `EmptyState` component
- Updated tests: E2E 38/38 PASS | Security 47/47 PASS | TypeScript PASS | Build PASS (46 pages)

## Session Log

### 2026-08-21
- Completed Phase A: Design System Foundation
  - Created design tokens in `app/globals.css`
  - Created `lib/utils.ts` with `cn` helper
  - Created reusable UI components: `Button`, `Input`, `Badge`, `Card`, `Avatar`, `Separator`, `EmptyState`

- Completed Phase B: Homepage & Marketplace
  - Updated homepage with design system components
  - Updated marketplace listing page with `Card`, `Badge`, `Button`, `EmptyState`
  - Added search/filter UI improvements

- Completed Phase C: Product Detail Page
  - Wrapped sections in `Card` + `Separator`
  - Replaced inline buttons with `Button` component
  - Added `Badge` for condition and status

- Completed Phase D: Auth Pages
  - Updated login/signup pages with `Card`, `Input`, `Button`, `Badge`
  - Replaced inline form elements with design system components

- Completed Phase E: Checkout & Transaction Flow
  - Updated checkout page with step progress indicator and `Card`
  - Updated transaction detail page with `Card`, `Badge`, `Button`, `Avatar`
  - Added `success` and `warning` variants to `Button`

- Completed Phase F: Dashboard
  - Updated dashboard overview with welcome banner, stats grid, quick actions
  - Updated listings page with `Card`, `Badge`, `EmptyState`, `Button`
  - Updated purchases/sales pages with `Card`, `Badge`, `EmptyState`
  - Updated notifications page with `Card`, `Badge`, `Button`
  - Updated profile page with `Card`, `Input`, `Button`, `Badge`

- Completed Phase G: Admin Dashboard
  - Updated admin layout with gradient header, avatar, badge
  - Updated admin overview with stats cards, dispute alert, quick actions
  - Updated users page with search, table styling, `Avatar`, `Badge`, `Button`
  - Updated transactions page with search, status filter, pagination buttons
  - Updated disputes page with `Card`, `Badge`, `Separator`, `EmptyState`
  - Updated refunds page with `Card`, `Badge`, `Separator`, `EmptyState`

### 2026-08-21 (UUID Migration Recovery + Logout Confirmation)
- Fixed critical issue: `middleware.ts` was deleted from working directory, breaking all auth route protection
  - Migrated to Next.js 16 `proxy.ts` convention (resolved deprecation warning)
  - Used codemod `@next/codemod@canader middleware-to-proxy .` for proper migration
  - Verified all auth redirects work: dashboard/admin protected, login/signup redirect for authenticated users
- Fixed React key warning on homepage category list
  - Root cause: `getCategoryCounts()` returned `{ category, count }` but frontend `Category` interface expected `{ name, count }`
  - Causing `category.name` to be `undefined` for all items → duplicate "undefined" keys
  - Fixed by renaming property from `category` to `name` in `lib/analytics.ts`
- Added logout confirmation modal with cancel option
  - Created `components/layout/LogoutButton.tsx` — reusable client component
  - Desktop Header: overlay modal with "Stay on PassitOn" (cancel) and "Sign Out" (confirm) buttons
  - Mobile Menu: inline confirmation buttons (Cancel / Sign Out)
  - Both paths call `signOut({ callbackUrl: "/" })` only after confirmation
- Verified login works with correct password (`femiadepoju10@gmail.com` uses `12345678`)
- TypeScript check: PASS | Build: PASS | Tests: 20/20 PASS

### 2026-08-21 (Payout & Refund Integration)
- Added `paystackRecipientCode` field to `users` table (schema.prisma + manual DB column add via `ALTER TABLE`)
- Added 4 new Paystack API functions to `lib/paystack.ts`:
  - `createTransferRecipient()` — creates a Paystack transfer recipient for the seller
  - `initiateTransfer()` — initiates a bank transfer to the seller via Paystack
  - `verifyTransfer()` — verifies a transfer by reference
  - `initiateRefund()` — initiates a refund to the buyer via Paystack
- Wired payout processing into `app/api/transactions/[id]/route.ts` PATCH:
  - When status transitions `payout_pending` → `payout_completed`, calls `initiateTransfer()` with seller's recipient code
  - Stores Paystack transfer reference in payout record, sets status to "processing"
  - Returns error if seller has no recipient code or transfer fails
- Wired refund processing into PATCH handler:
  - When status transitions `refund_pending` → `refund_completed`, calls `initiateRefund()` with payment reference
  - Stores Paystack refund reference in refund record, sets status to "processing"
- Updated `app/api/webhooks/paystack/route.ts` to handle:
  - `transfer.success` — updates payout to "completed", transaction to "completed"
  - `transfer.failed` — updates payout to "failed"
  - `refund.processed` — updates refund to "completed", transaction to "refund_completed", product to "active"
  - `refund.failed` — updates refund to "failed"
- Added email templates: `payout_initiated`, `refund_initiated`, `refund_failed`
- Added notification handlers for `payout_initiated`, `refund_initiated`, `refund_failed`
- Updated brand name from "Skillbridge" to "PassitOn" in all email templates
- Updated transaction page buttons: "Mark Payout Complete" → "Initiate Payout", "Process Refund" → "Initiate Refund"
- Updated `docs/progress.md` session log
- Updated `AGENTS.md` with test command documentation
- Created `scripts/e2e-test.ts` — 32 assertions covering full transaction lifecycle
- TypeScript check: PASS | Build: PASS | E2E tests: 32/32 PASS

### 2026-08-21 (Security & Business-Logic Testing)
- Fixed race condition in checkout (`app/api/transactions/route.ts` POST):
  - Moved product check, own-product check, and existing-transaction check inside `db.$transaction`
  - Changed `products.update` to `products.updateMany` with `where: { id, status: "active" }` for atomic conditional update
  - Second concurrent buyer is now rejected with "Product was just taken by another buyer" (or "Product is not available" if status already changed)
- Created `scripts/security-test.ts` — 29 assertions covering:
  - Authentication (bcrypt hashes, UUID IDs)
  - User data isolation
  - Checkout race condition prevention
  - State machine integrity (17 valid/invalid transition checks)
  - Duplicate prevention (payout idempotency, webhook idempotency)
  - Admin authorization (role checks on admin endpoints, transaction PATCH)
  - Payment security (server-side fee calculation, webhook signature verification, amount validation)
- Created `docs/security-test-report.md` documenting all test results
- Updated `AGENTS.md` with security test command
- Security tests: 29/29 PASS | TypeScript: PASS | Build: PASS

### 2026-08-21 (Seller Payout Setup)
- Added `paystackRecipientCode` column to `users` table (manual `ALTER TABLE`)
- Updated `app/api/admin/users/route.ts` PATCH endpoint:
  - Extended to support `paystackRecipientCode` setup via bank account details
  - Calls `createTransferRecipient()` via Paystack API when `accountNumber` + `bankCode` provided
  - Stores returned recipient code on user record
  - Admin-only (role check preserved)
- Added `paystackRecipientCode` to GET response for admin users API
- Updated `app/admin/users/page.tsx`:
  - Added "Payout" column showing "Ready" / "Not Set Up" badge per user
  - Added modal with Nigerian bank dropdown + account number input
  - "Set Up Payout" button appears for users without recipient code
- Updated `scripts/e2e-test.ts` — added payout setup assertions (now 33 tests)
- Updated `scripts/security-test.ts` — added 5 payout security tests (now 34 tests)
- Updated `docs/security-test-report.md` with payout security section
- Updated `AGENTS.md` with updated test counts
- Security tests: 34/34 PASS | TypeScript: PASS | Build: PASS | E2E: 34/34 PASS

### 2026-08-21 (V1.1: Seller Profile, Ratings & Bug Fixes)
- Fixed notification bug: payout/refund notifications now correctly say "initiated" instead of "completed"
  - `app/api/transactions/[id]/route.ts`: Changed `notifyTransactionParticipants` to use "payout_initiated" / "refund_initiated" for admin-triggered transitions; keeps "payout_completed" / "refund_completed" for webhook-confirmed transitions
- Added reviews schema to `prisma/schema.prisma`:
  - `reviews` model with UUID PK, `transactionId` (unique), `reviewerId`, `revieweeId`, rating (1-5), comment
  - Added `reviewsWritten`, `reviewsReceived` relations to `users`
  - Added `reviews` relation to `transactions` (UUID PK, no cascades)
- Created `app/api/reviews/route.ts`:
  - POST: Create review for completed transaction (authenticated, verifies reviewer is buyer/seller, prevents duplicates)
  - GET: Fetch reviews written/received by user
- Updated transaction API GET: Now returns review data in response
- Updated transaction page: "Rate Your Transaction Partner" card for completed transactions + "Write a Review" modal with 5-star rating
- Updated `scripts/e2e-test.ts` — 34 tests (added buyer reviews seller)
- Updated `scripts/security-test.ts` — 39 tests (added 5 review security assertions)
- Final result: TypeScript: PASS | Build: PASS | E2E 34/34 | Security 39/39 PASS

### 2026-08-21 (V1.1: In-App Chat)
- Added `messages` model to `prisma/schema.prisma` (UUID PK, `ON DELETE RESTRICT` defaults)
- Created `app/api/messages/route.ts` (GET, POST — auth, participant check, payment_confirmed+ enforcement, 2000 char limit)
- Created `components/chat/ChatBox.tsx` — message list with 5s polling, validated input
- Integrated ChatBox into `app/transaction/[id]/page.tsx` as "Messages" card
- Updated `scripts/e2e-test.ts` — 41 tests (added 3 chat assertions)
- Updated `scripts/security-test.ts` — 54 tests (added 7 chat security assertions)
- Final result: TypeScript: PASS | Build: PASS (47 pages) | E2E 41/41 | Security 54/54 PASS

### 2026-08-21 (V1.1: Advanced Seller Profiles)
- Added `bio` column to `users` table (VARCHAR(500), nullable) in schema.prisma + ALTER TABLE
- Created `app/api/sellers/[id]/route.ts` — returns seller profile with rating summary, distribution, stats (sales, listings, transactions), and active product grid
- Created `app/seller/[id]/page.tsx` — public seller profile page with:
  - Seller header (name, member since, bio editor for own profile)
  - Rating summary (stars, count, per-star distribution bars)
  - Stats grid (completed sales, active listings, total transactions)
  - Product grid (active listings with WishlistButton overlay)
- Created `components/seller/BioEditor.tsx` — client component for bio editing with 500-char limit
- Updated `app/api/user/profile/route.ts` — accepts `bio` field in PATCH, includes in GET response
- Updated `app/dashboard/profile/page.tsx` — added bio textarea with char counter
- Linked seller name on product detail page to `/seller/[id]`
- Updated `scripts/e2e-test.ts` — 43 tests (added 2 seller profile assertions)
- Updated `scripts/security-test.ts` — 56 tests (added 2 bio validation assertions)
- Final result: TypeScript: PASS | Build: PASS (47 pages) | E2E 43/43 | Security 56/56 PASS

### 2026-08-21 (V1.1: Push Notifications)
- Installed `web-push` npm package + `@types/web-push`
- Generated VAPID key pair and added to `.env.local`
- Added `push_subscriptions` model to `prisma/schema.prisma` (UUID PK, unique userId, no cascades, JSONB keys)
- Created `lib/push.ts` — web-push initialization, subscription CRUD, push sending with 410/404 error handling
- Created `app/api/push/public-key/route.ts` — serves VAPID public key to clients
- Created `app/api/push/subscriptions/route.ts` — POST (create/update) and DELETE (remove) subscriptions (authenticated)
- Created `public/sw.js` — service worker handling push events + notification clicks
- Integrated push sending into `lib/notifications.ts` `createNotification()` — sends push for all notification types with data.url for deep linking
- Created `components/notifications/PushNotificationToggle.tsx` — enable/disable toggle with permission flow
- Created `components/notifications/PushNotificationHandler.tsx` — auto-registers service worker on app load
- Added push notification toggle to `app/dashboard/profile/page.tsx`
- Updated `app/layout.tsx` to include `PushNotificationHandler`
- Updated `scripts/e2e-test.ts` — 45 tests (added 2 push subscription assertions)
- Updated `scripts/security-test.ts` — 63 tests (added 7 push security assertions)
- Final result: TypeScript: PASS | Build: PASS (49 pages) | E2E 45/45 | Security 63/63 PASS

### 2026-08-21 (V1.1: SMS Notifications)
- Installed `twilio` npm package for SMS delivery
- Added `smsEnabled` boolean column (default false) to `users` table in schema.prisma + manual `ALTER TABLE`
- Created `lib/sms.ts`:
  - Initializes Twilio client with env vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)
  - `sendSms()` fetches user, checks `smsEnabled` + `phone` before sending
  - Only sends for critical types: payment, dispute, refund, payout
  - Rate limiting: max 5 SMS per user per day (in-memory counter)
  - Message truncation to 160 chars
  - Graceful degradation: silently skips if provider not configured or on error
- Integrated SMS into `lib/notifications.ts` `createNotification()` — sends SMS alongside push for critical notification types only
- Updated `app/api/user/profile/route.ts` — added `smsEnabled` to GET response, PATCH body schema, and update payload
- Updated `app/dashboard/profile/page.tsx` — added "SMS Notifications" card with toggle, phone number display, and missing-phone-number helper text
- Updated `scripts/e2e-test.ts` — added Phase 9g (4 SMS assertions)
- Updated `scripts/security-test.ts` — added `testSmsSecurity` function (6 security assertions)
- Final result: TypeScript: PASS | Build: PASS (49 pages) | E2E 49/49 | Security 69/69 PASS

### 2026-08-21 (V2.0: Product Recommendations Engine)
- Added composite index `idx_products_category_status` on `products(category, status)` in schema.prisma + DB
- Added `getProductWishlistCounts()` to `lib/analytics.ts` — batch wishlist count lookup for multiple products
- Added `ids` query parameter to `app/api/products/route.ts` GET — fetches specific products by comma-separated IDs for recently viewed
- Created `app/api/products/[id]/recommendations/route.ts` — returns 4 same-category active products (excluding current), sorted by recency, with seller ratings and wishlist counts, 60-second in-memory cache
- Updated `app/(marketplace)/products/[id]/page.tsx`:
  - "You May Also Like" section using `ProductCard` — fetches from recommendations API
  - "Recently Viewed" section — tracks via `localStorage`, fetches via `?ids=` param
  - Replaced placeholder divs with real `ProductCard` components
- Updated `scripts/e2e-test.ts` — Phase 9h (4 recommendation assertions), added second product for same-category testing
- Updated `scripts/security-test.ts` — `testRecommendationsSecurity` function (7 security assertions)
- Updated `docs/security-test-report.md` with recommendations security section
- Updated `AGENTS.md` with new test counts
- Final result: TypeScript: PASS | Build: PASS (50 pages) | E2E 53/53 | Security 76/76 PASS

### 2026-08-21 (V2.0: Seller Analytics Dashboard)
- Added 5 seller-specific analytics functions to `lib/analytics.ts`:
  - `getSellerRevenueTrend(sellerId, range)` — seller's item price earnings over time
  - `getSellerTransactionTrend(sellerId, range)` — seller's transaction count over time
  - `getSellerRatingDistribution(sellerId)` — per-star rating counts (5★→1★)
  - `getSellerStats(sellerId)` — total earnings, total sales, pending payouts, avg rating, review count
  - `getSellerTopProducts(sellerId, limit)` — seller's top products by revenue with sales counts
- Created `app/api/dashboard/analytics/route.ts` — authenticated GET endpoint returning revenue trend, transaction trend, rating distribution, stats, and top products
- Created `app/dashboard/analytics/page.tsx` — full analytics dashboard with:
  - Time range selector (7d/30d/90d) with 60-second auto-refresh
  - Stats card grid (Total Earnings, Total Sales, Avg. Rating, Pending Payouts)
  - Revenue Trend line chart (recharts LineChart)
  - Sales Volume bar chart (recharts BarChart)
  - Rating Distribution bars (5★ to 1★)
  - Top Products list (seller's best-selling products by revenue)
- Added `analytics` icon (`BarChart3`) to `components/layout/NavTabs.tsx`
- Added "Analytics" tab to `app/dashboard/layout.tsx` DASHBOARD_TABS
- Updated `scripts/e2e-test.ts` — Phase 9i (4 seller analytics assertions)
- Updated `scripts/security-test.ts` — `testSellerAnalyticsSecurity` function (4 security assertions)

### 2026-08-21 (V2.0: Delivery Tracking)
- Added `DeliveryTracking` model, `DeliveryStatus` enum, and `delivery_tracking` table to schema.prisma (UUID PK, @unique transactionId, ON DELETE RESTRICT, FK to transactions)
- Added `deliveryTracking` relation to `transactions` model
- Created `app/api/delivery/[transactionId]/route.ts` — GET (fetch tracking, auto-create if missing) + PATCH (role-based status transitions: shipping→in_transit→delivered→confirmed, admin override)
- Added `getDeliveryTracking()` and `createDeliveryTrackingEntry()` to `lib/analytics.ts`
- Added `delivery` notification type to `lib/notifications.ts` (NOTIFICATION_TITLES + SMS_TYPES)
- Delivery API sends notifications on status changes (shipping→in_transit, delivered, confirmed)
- Updated `app/transaction/[id]/page.tsx`:
  - Delivery tracking card showing timeline (shipped, delivered, proof photo, confirmed)
  - Seller: "Mark as In Transit" → "Mark as Delivered" (with proof photo upload)
  - Buyer: "Confirm Receipt" → triggers transaction `inspection_pending`
  - Backward compatible — old `item_delivered`/`inspection_pending` flow still works
- Created `delivery_tracking` table and `DeliveryStatus` enum in database (forward-only DDL, FK to transactions ON DELETE RESTRICT)
- Updated `scripts/e2e-test.ts` — Phase 9j (3 delivery tracking assertions)
- Updated `scripts/security-test.ts` — `testDeliverySecurity` function (5 security assertions)
- Updated `docs/security-test-report.md` with delivery tracking security section + updated counts

### 2026-08-21 (V2.0: Seller Verification & Admin Review)
- Added `sellerVerificationStatus` (nullable String), `verificationNote` (VARCHAR 500), `verifiedAt` (DateTime) columns to `users` table in schema.prisma + DB
- Updated `app/api/admin/users/route.ts` (GET + PATCH) — return/accept verification fields, validate status values, auto-set `verifiedAt` on approval
- Updated `app/api/products/route.ts` POST — auto-set new seller's `sellerVerificationStatus = "pending"` on first product creation
- Updated `app/api/sellers/[id]/route.ts` — added `sellerVerificationStatus` to seller profile select
- Created `app/api/delivery/[transactionId]/route.ts` — GET + PATCH for delivery tracking (shipping→in_transit→delivered→confirmed transition, role-based permissions, auto-transition to `inspection_pending` when buyer confirms)
- Added `getDeliveryTracking()` and `createDeliveryTrackingEntry()` to `lib/analytics.ts`
- Added `delivery` notification type to `lib/notifications.ts`
- Updated `app/transaction/[id]/page.tsx`:
  - Delivery tracking card with timeline (in_transit, delivered, confirmed, proof photo)
  - Seller: "Mark as In Transit" → "Mark as Delivered" buttons
  - Buyer: "Confirm Receipt" button → triggers `inspection_pending`
  - Backward compatible with old `item_delivered` flow
- Updated `app/admin/users/page.tsx`:
  - Verification status badge column (Verified/Pending/Rejected)
  - Approve/Reject/Re-verify buttons with rejection reason prompt
  - "Pending verification only" filter
- Added verified badge (`ShieldCheck` icon) to `app/seller/[id]/page.tsx` and `app/(marketplace)/products/[id]/page.tsx`
- Updated `scripts/e2e-test.ts` — Phase 9k (3 seller verification assertions)
- Updated `scripts/security-test.ts` — `testSellerVerificationSecurity` function (6 security assertions)
- Final result: TypeScript: PASS | Build: PASS (51 pages) | E2E 63/63 | Security 91/91 PASS

### 2026-08-22 (V2.0: Loyalty Programme)
- Added `LoyaltySource` enum (`signup`, `purchase`, `sale`, `review`, `review_received`, `referral`, `wishlist`, `redemption`) to `prisma/schema.prisma`
- Added `loyalty_events` model to schema (UUID PK, FK to `users` and `transactions`, `ON DELETE RESTRICT`, `points` Int, `source` String, `expiresAt` DateTime)
- Added `loyaltyPointBalance` (Int default 0) and `loyaltyTier` (String default "bronze") to `users` model
- Added `loyaltyEvents` relation on `transactions` model + FK index
- Created forward-only migration `20260822000000_add_loyalty_tables`
- Created `lib/loyalty-utils.ts` — pure functions (no DB dependency) extracted for safe client-side use: `calculateTier`, `pointsToDiscount` (1000:1 rate), `discountToPoints`, `calculateTierMultiplier` (gold 1.5x, silver 1.2x, bronze 1.0x), `LOYALTY_RATES`, tier constants
- Created `lib/loyalty.ts` — DB-access functions: `awardPoints()` (atomic tx with expiry, tier recalculation), `redeemPoints()` (balance check, multiples of 10, negative event record), `getUserLoyalty()` (balance, tier, lifetime, recent events)
- Awarded loyalty points from `app/api/auth/signup/route.ts`: 100 pts signup, 500 pts referral
- Awarded loyalty points from `app/api/webhooks/paystack/route.ts`: 50 pts per $100 buyer + seller on transfer.success
- Awarded loyalty points from `app/api/reviews/route.ts`: 25 pts reviewer, 10 pts reviewee if rating ≥ 4
- Awarded loyalty points from `app/api/wishlist/route.ts`: 5 pts on wishlist add
- Added points redemption at checkout: `app/api/transactions/route.ts` reads `loyaltyPoints` from client (capped), converts to discount via `pointsToDiscount()`, calls `redeemPoints()`, applies discount to `totalAmount`, requires minimum 500 points
- Created `app/api/loyalty/route.ts` — authenticated GET endpoint returning user's loyalty summary (balance, tier, lifetime earned, recent 20 events)
- Created `app/dashboard/loyalty/page.tsx` — loyalty dashboard with points balance, tier badge, redeemable value, earning guide, recent activity timeline (uses `lib/loyalty-utils` for no-client-DB-import)
- Added loyalty badge (points + tier icon) to `components/layout/Header.tsx`
- Added `Heart` icon to `components/layout/NavTabs.tsx` icon map for "Loyalty" nav tab
- Added `Loyalty` tab to dashboard navigation
- Updated `prisma.config.ts` — replaced hardcoded localhost DB URL with `process.env.DATABASE_URL` via dotenv (`.env.local`) for Vercel compatibility
- Added `postbuild` script to `package.json`: `prisma migrate deploy` for Vercel
- Updated E2E test Phase 9l — 4 loyalty assertions (signup points, tier calculation, purchase points, review points)
- Updated E2E test cleanup — added `loyalty_events.deleteMany` before `transactions.deleteMany` and `users.deleteMany` (respects ON DELETE RESTRICT)
- Added 6 loyalty security tests to `scripts/security-test.ts`
- Updated `docs/security-test-report.md` with loyalty section
- Final result: TypeScript: PASS | Build: PASS (53 pages) | E2E 67/67 | Security 97/97 PASS

### 2026-08-22 (V2.0: KYC Identity Verification)
- Added `kyc_documents` model to `prisma/schema.prisma` (UUID PK, `@unique userId`, `ON DELETE RESTRICT`, document type/number/image URL, selfie URL, status, admin note, submitted/reviewer timestamps)
- Added `KycDocumentType` enum (passport, driver_license, national_id) and `KycStatus` enum (pending, verified, rejected)
- Added `kycDocument` + `kycReviewed` relations to `users` model
- Added `reviewer` relation to `kyc_documents` (admin who reviewed)
- Created forward-only migration `20260822010000_add_kyc_documents`
- Created `app/api/kyc/route.ts` — authenticated POST (submit KYC documents, prevents duplicate submissions, sets sellerVerificationStatus to pending) + GET (fetch user's KYC status)
- Updated `app/api/admin/users/route.ts` PATCH — added `kycStatus` and `kycAdminNote` fields, atomically updates both `kyc_documents.status` and `users.sellerVerificationStatus`, sets `verifiedAt`/`reviewedAt`/`reviewerId`
- Updated `app/api/admin/users/route.ts` GET — added `kycDocument` select with all KYC fields for admin review
- Updated `app/api/user/profile/route.ts` GET — added `kycDocument` select (status, documentType, adminNote, timestamps) for profile display
- Updated `app/api/upload/route.ts` — added configurable `folder` field (validated against whitelist: `skillbridge/products`, `skillbridge/kyc`)
- Updated `app/api/products/route.ts` POST — KYC gating: unverified/rejected users cannot list products (403). KYC-verified users skip the "pending" first-listing auto-set
- Created `app/dashboard/kyc/page.tsx` — full KYC dashboard with document type selector, ID number input, Cloudinary upload for ID doc + selfie, status display (not submitted / pending / verified / rejected with admin notes)
- Added "KYC" tab to `app/dashboard/layout.tsx` DASHBOARD_TABS + `kyc` icon (Shield) to NavTabs icon map
- Added KYC status card + "Start KYC Verification" button to `app/dashboard/profile/page.tsx`
- Updated `app/admin/users/page.tsx` — added KYC status column, "Review KYC" button (opens modal with document/selfie previews, approve/reject decision, admin note), "Pending KYC Only" filter
- Added Phase 9m to E2E tests (4 assertions: KYC creation, admin approval, status sync, rejection)
- Added 7 KYC security tests (auth, duplicate prevention, server-side userId, admin role check, self-modification prevention, UUID PK + RESTRICT, @unique constraint)
- Added KYC cleanup to E2E teardown (before users deletion)
- Updated `docs/security-test-report.md` with KYC security section
- Updated `AGENTS.md` with new test counts
- Final result: TypeScript: PASS | Build: PASS (55 pages) | E2E 71/71 | Security 104/104 PASS

### 2026-08-22 (V2.0: AI-Generated Product Descriptions)
- Installed `openai` npm package
- Added `OPENAI_API_KEY` env var to `.env.local` and `.env.example`
- Created `lib/openai.ts` — OpenAI client wrapper with graceful degradation (returns null if API key not set)
- Created `app/api/ai/generate-description/route.ts` — authenticated POST endpoint (Zod validates `imageUrls` array, 1-5 URLs, calls OpenAI GPT-4o-mini vision, returns generated description)
- Updated `app/(marketplace)/products/sell/page.tsx` — added "Generate with AI" button on description field, populates textarea with AI-generated description (user can edit before submitting)
- Updated `app/dashboard/listings/[id]/edit/page.tsx` — same AI generation button on edit page
- Added Phase 9n to E2E tests (4 assertions: API endpoint exists, lib exists, requires auth, validates imageUrls array)
- Added 3 AI security tests (auth required, validates z.array, does not persist descriptions to DB)
  - Final result: TypeScript: PASS | Build: PASS (56 pages) | E2E 75/75 | Security 107/107 PASS

### 2026-08-22 (V2.0: Multiple Currencies)
- Added `Currency` enum (NGN, GHS, KES, ZAR, USD) to `prisma/schema.prisma`
- Added `currency` column to `products`, `transactions`, and `payments` tables (default NGN) via forward-only migration `20260822020000_add_currency_support`
- Created `lib/currency.ts` — CURRENCY_CONFIG map (code → symbol, locale, name), SUPPORTED_CURRENCIES array, getCurrencyConfig() helper
- Updated `lib/utils.ts` `formatPrice(amount, currency?)` — now accepts optional currency param, uses Intl.NumberFormat with dynamic locale/currency code
- Added `getCurrencySymbol(currency?)` helper to `lib/utils.ts`
- Updated `lib/paystack.ts` `initializeTransaction()` — accepts optional `currency` param, passes to Paystack API (defaults to NGN)
- Updated `app/api/transactions/route.ts` — transaction creation inherits product currency; GET includes currency in response
- Updated `app/api/payments/webhook/route.ts` — stores currency from Paystack webhook payload on payment record
- Updated `app/api/products/route.ts` — Zod schema validates currency via z.enum; create stores currency
- Updated `app/api/products/[id]/route.ts` — PATCH schema accepts currency field
- Updated `app/api/products/[id]/recommendations/route.ts` — includes currency in recommendation response
- Updated `app/api/wishlist/route.ts` — includes currency in product select
- Updated `app/api/sellers/[id]/route.ts` — includes currency in product select
- Updated `app/api/admin/transactions/route.ts` — includes currency in select
- Updated `app/(marketplace)/products/sell/page.tsx` — currency dropdown (NGN/GHS/KES/ZAR/USD), dynamic price symbol in preview
- Updated `app/dashboard/listings/[id]/edit/page.tsx` — currency dropdown with loaded/save value, dynamic price label
- Updated `app/checkout/[transactionId]/page.tsx` — TransactionData interface includes currency, formatPrice calls pass currency
- Updated `app/transaction/[id]/page.tsx` — TransactionData interface includes currency, all formatPrice calls pass currency
- Updated `app/(marketplace)/products/[id]/page.tsx` — Product/Recommendation interfaces include currency, all formatPrice calls pass currency
- Updated `components/products/ProductCard.tsx` — Product interface includes currency, formatPrice passes currency
- Updated `app/dashboard/sales/page.tsx`, `app/dashboard/purchases/page.tsx` — Transaction interface includes currency, formatPrice passes currency
- Updated `app/dashboard/wishlist/page.tsx` — WishlistItem interface includes currency, formatPrice passes currency
- Updated `app/dashboard/listings/page.tsx` — Product interface includes currency, formatPrice passes currency
- Updated `app/seller/[id]/page.tsx` — SellerProfile interface includes currency, formatPrice passes currency
- Updated `app/dashboard/analytics/page.tsx` — formatPrice calls default to NGN (aggregated stats)
- Updated `app/admin/page.tsx`, `app/admin/transactions/page.tsx`, `app/admin/refunds/page.tsx`, `app/admin/disputes/page.tsx` — formatPrice defaults to NGN (admin views)
- Updated `app/dashboard/page.tsx` — replaced hardcoded ₦ with formatPrice(totalRevenue, "NGN")
- Updated `app/(marketplace)/products/page.tsx` — replaced hardcoded ₦ in price filter labels with getCurrencySymbol("NGN")
- Updated `lib/email.ts` — all formatPrice calls now pass tx.currency
- Added Phase 9o to E2E tests (4 assertions: GHS product creation, transaction currency inheritance, formatPrice signature, currency config exists)
- Added 3 Multi-Currency security tests (Currency enum validation, Zod validation, Paystack integration)
- Updated all existing test products/transactions with explicit currency: 'NGN'
  - Final result: TypeScript: PASS | E2E 79/79 | Security 110/110 PASS

### 2026-08-22 (V2.0: Advanced Dispute Automation)
- Added `autoTriageCategory`, `riskScore`, `suggestedResolution`, `autoResolved`, `autoResolvedAt` columns to `disputes` model in `prisma/schema.prisma`
- Created forward-only migration `20260822030000_add_dispute_automation`
- Created `lib/dispute-automation.ts`:
  - `DISPUTE_KEYWORD_RULES` — keyword mapping for 5 dispute categories (not_received, not_as_described, damaged, shipping_delay, other)
  - `autoTriage(reason)` — classifies dispute reason by keyword matching
  - `computeRiskScore(params)` — server-side async risk scoring (seller dispute history, seller completion count, dispute rate, transaction amount, buyer dispute frequency, buyer win rate)
  - `suggestResolution(score, category)` — threshold-based suggestion (score ≤20 + clear category → auto-refund; score ≤35 + shipping_delay → partial refund; score ≥75 → manual review)
  - `processDisputeAutomation(transactionId, reason)` — orchestrates the full pipeline
- Updated `app/api/disputes/route.ts` POST — after dispute creation, calls `processDisputeAutomation` and stores results on the dispute record
- Created `components/admin/ApplySuggestionButton.tsx` — client component for one-click resolution application via PATCH endpoint
- Updated `app/admin/disputes/page.tsx`:
  - Added filter buttons (High Risk, Needs Review, Auto-Resolved, Clear Filter)
  - Added risk score badge (color-coded: green ≤20, yellow 21-50, red ≥50)
  - Added auto-triage category display
  - Added suggested resolution display
  - Added "Auto-Resolved" status badge
  - Added "Apply Suggestion" button for auto-resolvable disputes
  - Now shows `currency` in transaction total (uses transaction's actual currency)
- Added Phase 9p to E2E tests (6 assertions: lib exists, autoTriage function, suggestResolution function, schema fields)
- Added 3 dispute automation security tests (server-side scoring, keyword matching without external API, threshold rules)
- Final result: TypeScript: PASS | E2E 94/94 | Security 113/113 PASS

## V2.0: Sponsored Listings

### 2026-08-22
- Added `SponsoredStatus` enum and `sponsored_listings` model to `prisma/schema.prisma` (UUID PK, unique productId, `@map` for all snake_case columns, `ON DELETE RESTRICT` FKs, no cascades)
- Created forward-only migration `20260822040000_add_sponsored_listings`
- Created `lib/sponsored-listings.ts`:
  - `SPONSORED_PRICING` — fixed rate ₦500/day in NGN minor units
  - `SPONSORED_DURATION_OPTIONS` — 1, 3, 7, 14 days
  - `SPONSORED_DURATION_LABELS` — human-readable duration labels
  - `calculateSponsoredAmount(durationDays)` — server-side price calculation
  - `calculateSponsoredEndsAt(startsAt, durationDays)` — end date computation
  - `getActiveSponsoredProductIds()` — returns IDs of active sponsored products
  - `getActiveSponsoredListings()` — full listing with relations
- Created `app/api/sponsored-listings/route.ts`:
  - GET — lists seller's sponsored listings (authenticated)
  - POST — creates sponsored listing, initializes Paystack transaction, returns payment link (server-defined amount, validates product ownership)
- Created `app/api/sponsored-listings/verify/route.ts`:
  - GET — verifies Paystack payment by reference, activates sponsored listing on success
- Updated `app/api/products/route.ts` GET — boosts sponsored products to top of search results, includes `isSponsored` field in response
- Updated `app/api/webhooks/paystack/route.ts` — handles `charge.success` for sponsored listing payments (activates listing when payment is verified)
- Updated `components/products/ProductCard.tsx` — shows "Sponsored" badge with Sparkles icon
- Updated `app/(marketplace)/products/sell/page.tsx` — adds boost modal after product creation with duration options and Paystack redirect
- Created `app/dashboard/sponsored/page.tsx` — seller's sponsored listings dashboard with status cards, pending payment retry, and renewal CTA
- Created `app/dashboard/sponsored/verify/page.tsx` — Paystack callback page that verifies payment and redirects to dashboard
- Updated `app/admin/sponsored/page.tsx` — admin overview with revenue stats and all sponsored listings
- Updated `app/admin/layout.tsx` — added "Sponsored" tab to admin nav
- Updated `app/dashboard/layout.tsx` — added "Sponsored" tab to dashboard nav
- Updated `components/layout/NavTabs.tsx` — added "rocket" icon option
- Updated `components/ui/EmptyState.tsx` — added "rocket" icon option
- Added Phase 9q to E2E tests (9 assertions: lib exists, calculateSponsoredAmount, getActiveSponsoredProductIds, schema model, schema enum, listing created pending, Paystack ref, activated after payment, appears in active list)
- Added `testSponsoredListingsSecurity` to security tests (3 assertions: auth required, product ownership verified, server-defined amount)
- Fixed pre-existing cleanup issue in E2E test (ghcTransaction was not being deleted)
- Final result: TypeScript: PASS | E2E 94/94 PASS | Security 116/116 PASS
