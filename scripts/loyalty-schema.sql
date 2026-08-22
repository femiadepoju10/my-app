-- Standalone SQL: Add loyalty tables and columns (run manually if migrations fail)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoyaltySource') THEN
        CREATE TYPE "LoyaltySource" AS ENUM ('signup', 'purchase', 'sale', 'review', 'review_received', 'referral', 'wishlist', 'redemption');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "loyalty_events" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "points" INTEGER NOT NULL,
    "source" "LoyaltySource" NOT NULL,
    "transaction_id" UUID,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT now(),
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "loyalty_events_user_id_index" ON "loyalty_events" ("user_id");
CREATE INDEX IF NOT EXISTS "loyalty_events_transaction_id_index" ON "loyalty_events" ("transaction_id");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_point_balance" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_tier" VARCHAR(50) DEFAULT 'bronze';

-- Update existing users to bronze tier and 0 points
UPDATE "users" SET "loyalty_tier" = 'bronze' WHERE "loyalty_tier" IS NULL;
UPDATE "users" SET "loyalty_point_balance" = 0 WHERE "loyalty_point_balance" IS NULL;
