-- Add multi-currency support

CREATE TYPE "Currency" AS ENUM ('NGN', 'GHS', 'KES', 'ZAR', 'USD');

ALTER TABLE "products" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'NGN';

ALTER TABLE "transactions" ADD COLUMN "currency" "Currency" NOT NULL DEFAULT 'NGN';

ALTER TABLE "payments" ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN';

CREATE INDEX "products_currency_index" ON "products" ("currency");
CREATE INDEX "transactions_currency_index" ON "transactions" ("currency");
