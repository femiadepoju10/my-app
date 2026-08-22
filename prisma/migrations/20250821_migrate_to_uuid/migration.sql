-- UUID Migration: Convert all integer IDs to UUIDs
-- This migration is idempotent and handles data preservation

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- STEP 1: Add UUID columns to all tables
-- ============================================

-- Users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;

-- Products (depends on users)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "new_seller_id" UUID;

-- Product Images (depends on products)
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "new_product_id" UUID;

-- Transactions (depends on users, products)
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "new_product_id" UUID;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "new_buyer_id" UUID;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "new_seller_id" UUID;

-- Payments (depends on transactions)
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "new_transaction_id" UUID;

-- Payouts (depends on transactions, users)
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "new_transaction_id" UUID;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "new_seller_id" UUID;

-- Refunds (depends on transactions)
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "refunds" ADD COLUMN IF NOT EXISTS "new_transaction_id" UUID;

-- Disputes (depends on transactions, users)
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "new_transaction_id" UUID;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "new_opened_by_id" UUID;

-- Notifications (depends on users)
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "new_id" UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "new_user_id" UUID;

-- ============================================
-- STEP 2: Populate UUID values and FK references
-- ============================================

-- Ensure all new_id columns have UUIDs (in case of re-run)
UPDATE "users" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "products" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "product_images" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "transactions" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "payments" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "payouts" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "refunds" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "disputes" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;
UPDATE "notifications" SET "new_id" = gen_random_uuid() WHERE "new_id" IS NULL;

-- Update FK references using the UUID mappings
UPDATE "products" p SET "new_seller_id" = u."new_id" FROM "users" u WHERE p."seller_id" = u."id" AND p."new_seller_id" IS NULL;
UPDATE "product_images" pi SET "new_product_id" = p."new_id" FROM "products" p WHERE pi."product_id" = p."id" AND pi."new_product_id" IS NULL;
UPDATE "transactions" t SET 
  "new_product_id" = p."new_id",
  "new_buyer_id" = ub."new_id",
  "new_seller_id" = us."new_id"
FROM "products" p, "users" ub, "users" us
WHERE t."product_id" = p."id" 
  AND t."buyer_id" = ub."id" 
  AND t."seller_id" = us."id"
  AND t."new_product_id" IS NULL;
UPDATE "payments" p SET "new_transaction_id" = t."new_id" FROM "transactions" t WHERE p."transaction_id" = t."id" AND p."new_transaction_id" IS NULL;
UPDATE "payouts" p SET 
  "new_transaction_id" = t."new_id",
  "new_seller_id" = u."new_id"
FROM "transactions" t, "users" u
WHERE p."transaction_id" = t."id" AND p."seller_id" = u."id" AND p."new_transaction_id" IS NULL;
UPDATE "refunds" r SET "new_transaction_id" = t."new_id" FROM "transactions" t WHERE r."transaction_id" = t."id" AND r."new_transaction_id" IS NULL;
UPDATE "disputes" d SET 
  "new_transaction_id" = t."new_id",
  "new_opened_by_id" = u."new_id"
FROM "transactions" t, "users" u
WHERE d."transaction_id" = t."id" AND d."opened_by_id" = u."id" AND d."new_transaction_id" IS NULL;
UPDATE "notifications" n SET "new_user_id" = u."new_id" FROM "users" u WHERE n."user_id" = u."id" AND n."new_user_id" IS NULL;

-- ============================================
-- STEP 3: Drop all foreign key constraints
-- ============================================

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_seller_id_fkey";
ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_product_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_product_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_buyer_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_seller_id_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_transaction_id_fkey";
ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_transaction_id_fkey";
ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_seller_id_fkey";
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_transaction_id_fkey";
ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_transaction_id_fkey";
ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_opened_by_id_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";

-- ============================================
-- STEP 4: Drop indexes on ID columns
-- ============================================

DROP INDEX IF EXISTS "products_seller_id_idx";
DROP INDEX IF EXISTS "products_status_idx";
DROP INDEX IF EXISTS "products_category_idx";
DROP INDEX IF EXISTS "products_created_at_idx";
DROP INDEX IF EXISTS "product_images_product_id_idx";
DROP INDEX IF EXISTS "transactions_buyer_id_idx";
DROP INDEX IF EXISTS "transactions_seller_id_idx";
DROP INDEX IF EXISTS "transactions_product_id_idx";
DROP INDEX IF EXISTS "transactions_status_idx";
DROP INDEX IF EXISTS "payments_paystack_ref_key";
DROP INDEX IF EXISTS "payments_transaction_id_idx";
DROP INDEX IF EXISTS "payouts_transaction_id_idx";
DROP INDEX IF EXISTS "payouts_seller_id_idx";
DROP INDEX IF EXISTS "refunds_transaction_id_idx";
DROP INDEX IF EXISTS "disputes_transaction_id_key";
DROP INDEX IF EXISTS "disputes_transaction_id_idx";
DROP INDEX IF EXISTS "disputes_opened_by_id_idx";
DROP INDEX IF EXISTS "notifications_user_id_idx";

-- ============================================
-- STEP 5: Drop primary keys and old columns, rename new columns
-- ============================================

-- Users
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE "users" DROP COLUMN IF EXISTS "id";
ALTER TABLE "users" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "users" ADD PRIMARY KEY ("id");

-- Products
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_pkey";
ALTER TABLE "products" DROP COLUMN IF EXISTS "id";
ALTER TABLE "products" DROP COLUMN IF EXISTS "seller_id";
ALTER TABLE "products" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "products" RENAME COLUMN "new_seller_id" TO "seller_id";
ALTER TABLE "products" ADD PRIMARY KEY ("id");

-- Product Images
ALTER TABLE "product_images" DROP CONSTRAINT IF EXISTS "product_images_pkey";
ALTER TABLE "product_images" DROP COLUMN IF EXISTS "id";
ALTER TABLE "product_images" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "product_images" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "product_images" RENAME COLUMN "new_product_id" TO "product_id";
ALTER TABLE "product_images" ADD PRIMARY KEY ("id");

-- Transactions
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_pkey";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "id";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "product_id";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "buyer_id";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "seller_id";
ALTER TABLE "transactions" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "transactions" RENAME COLUMN "new_product_id" TO "product_id";
ALTER TABLE "transactions" RENAME COLUMN "new_buyer_id" TO "buyer_id";
ALTER TABLE "transactions" RENAME COLUMN "new_seller_id" TO "seller_id";
ALTER TABLE "transactions" ADD PRIMARY KEY ("id");

-- Payments
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_pkey";
ALTER TABLE "payments" DROP COLUMN IF EXISTS "id";
ALTER TABLE "payments" DROP COLUMN IF EXISTS "transaction_id";
ALTER TABLE "payments" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "payments" RENAME COLUMN "new_transaction_id" TO "transaction_id";
ALTER TABLE "payments" ADD PRIMARY KEY ("id");

-- Payouts
ALTER TABLE "payouts" DROP CONSTRAINT IF EXISTS "payouts_pkey";
ALTER TABLE "payouts" DROP COLUMN IF EXISTS "id";
ALTER TABLE "payouts" DROP COLUMN IF EXISTS "transaction_id";
ALTER TABLE "payouts" DROP COLUMN IF EXISTS "seller_id";
ALTER TABLE "payouts" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "payouts" RENAME COLUMN "new_transaction_id" TO "transaction_id";
ALTER TABLE "payouts" RENAME COLUMN "new_seller_id" TO "seller_id";
ALTER TABLE "payouts" ADD PRIMARY KEY ("id");

-- Refunds
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_pkey";
ALTER TABLE "refunds" DROP COLUMN IF EXISTS "id";
ALTER TABLE "refunds" DROP COLUMN IF EXISTS "transaction_id";
ALTER TABLE "refunds" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "refunds" RENAME COLUMN "new_transaction_id" TO "transaction_id";
ALTER TABLE "refunds" ADD PRIMARY KEY ("id");

-- Disputes
ALTER TABLE "disputes" DROP CONSTRAINT IF EXISTS "disputes_pkey";
ALTER TABLE "disputes" DROP COLUMN IF EXISTS "id";
ALTER TABLE "disputes" DROP COLUMN IF EXISTS "transaction_id";
ALTER TABLE "disputes" DROP COLUMN IF EXISTS "opened_by_id";
ALTER TABLE "disputes" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "disputes" RENAME COLUMN "new_transaction_id" TO "transaction_id";
ALTER TABLE "disputes" RENAME COLUMN "new_opened_by_id" TO "opened_by_id";
ALTER TABLE "disputes" ADD PRIMARY KEY ("id");

-- Notifications
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_pkey";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "id";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "user_id";
ALTER TABLE "notifications" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "notifications" RENAME COLUMN "new_user_id" TO "user_id";
ALTER TABLE "notifications" ADD PRIMARY KEY ("id");

-- ============================================
-- STEP 6: Recreate indexes
-- ============================================

DROP INDEX IF EXISTS "users_email_key" CASCADE;
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE INDEX "products_seller_id_idx" ON "products"("seller_id");
CREATE INDEX "products_status_idx" ON "products"("status");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_created_at_idx" ON "products"("created_at");

CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

CREATE INDEX "transactions_buyer_id_idx" ON "transactions"("buyer_id");
CREATE INDEX "transactions_seller_id_idx" ON "transactions"("seller_id");
CREATE INDEX "transactions_product_id_idx" ON "transactions"("product_id");
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

CREATE UNIQUE INDEX "payments_paystack_ref_key" ON "payments"("paystack_ref");
CREATE INDEX "payments_transaction_id_idx" ON "payments"("transaction_id");

CREATE INDEX "payouts_transaction_id_idx" ON "payouts"("transaction_id");
CREATE INDEX "payouts_seller_id_idx" ON "payouts"("seller_id");

CREATE INDEX "refunds_transaction_id_idx" ON "refunds"("transaction_id");

CREATE UNIQUE INDEX "disputes_transaction_id_key" ON "disputes"("transaction_id");
CREATE INDEX "disputes_transaction_id_idx" ON "disputes"("transaction_id");
CREATE INDEX "disputes_opened_by_id_idx" ON "disputes"("opened_by_id");

CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- ============================================
-- STEP 7: Recreate foreign key constraints
-- ============================================

ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- STEP 8: Recreate unique constraints
-- ============================================

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
