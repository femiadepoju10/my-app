-- Add sponsored listings table and type

CREATE TYPE "SponsoredStatus" AS ENUM ('pending', 'active', 'expired', 'cancelled');

CREATE TABLE "sponsored_listings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL UNIQUE,
    "seller_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" "Currency" DEFAULT 'NGN' NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(6) DEFAULT now() NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "SponsoredStatus" DEFAULT 'pending' NOT NULL,
    "paystack_ref" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT now() NOT NULL,
    FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT,
    FOREIGN KEY ("seller_id") REFERENCES "users" ("id") ON DELETE RESTRICT
);

CREATE INDEX "sponsored_listings_product_id_index" ON "sponsored_listings" ("product_id");
CREATE INDEX "sponsored_listings_seller_id_index" ON "sponsored_listings" ("seller_id");
CREATE INDEX "sponsored_listings_status_index" ON "sponsored_listings" ("status");
