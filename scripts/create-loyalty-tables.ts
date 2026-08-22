import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillbridge',
});
const db = new PrismaClient({ adapter });

async function main() {
  try {
    const tables = await db.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE tablename = 'loyalty_events'"
    );
    if ((tables as Array<{ tablename: string }>).length > 0) {
      console.log('loyalty_events table already exists');
      return;
    }

    const enumType = await db.$queryRawUnsafe(
      "SELECT typname FROM pg_type WHERE typname = 'LoyaltySource'"
    );
    if ((enumType as Array<{ typname: string }>).length === 0) {
      await db.$executeRawUnsafe("CREATE TYPE \"LoyaltySource\" AS ENUM ('signup', 'purchase', 'sale', 'review', 'review_received', 'referral', 'wishlist')");
      console.log('Created LoyaltySource enum');
    }

    await db.$executeRawUnsafe(`
      CREATE TABLE "loyalty_events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" UUID NOT NULL,
        "points" INTEGER NOT NULL,
        "source" "LoyaltySource" NOT NULL,
        "transaction_id" UUID,
        "expires_at" TIMESTAMPTZ(6),
        "created_at" TIMESTAMPTZ(6) DEFAULT now(),
        FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        FOREIGN KEY ("transaction_id") REFERENCES "transactions" ("id") ON DELETE RESTRICT
      )
    `);
    console.log('Created loyalty_events table');

    await db.$executeRawUnsafe('CREATE INDEX "loyalty_events_user_id_index" ON "loyalty_events" ("user_id")');
    await db.$executeRawUnsafe('CREATE INDEX "loyalty_events_transaction_id_index" ON "loyalty_events" ("transaction_id")');
    console.log('Created indexes');

    await db.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_point_balance" INTEGER DEFAULT 0');
    await db.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loyalty_tier" VARCHAR(50) DEFAULT \'bronze\'');
    console.log('Added loyalty columns to users table');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
