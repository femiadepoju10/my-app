import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/skillbridge',
});
const db = new PrismaClient({ adapter });

async function main() {
  try {
    const columns = await db.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('seller_verification_status', 'verification_note', 'verified_at')"
    );
    const existing = new Set((columns as Array<{ column_name: string }>).map((c) => c.column_name));

    if (!existing.has('seller_verification_status')) {
      await db.$executeRawUnsafe('ALTER TABLE users ADD COLUMN seller_verification_status VARCHAR(50)');
      console.log('Added seller_verification_status column');
    } else {
      console.log('seller_verification_status already exists');
    }

    if (!existing.has('verification_note')) {
      await db.$executeRawUnsafe('ALTER TABLE users ADD COLUMN verification_note VARCHAR(500)');
      console.log('Added verification_note column');
    } else {
      console.log('verification_note already exists');
    }

    if (!existing.has('verified_at')) {
      await db.$executeRawUnsafe('ALTER TABLE users ADD COLUMN verified_at TIMESTAMPTZ(6)');
      console.log('Added verified_at column');
    } else {
      console.log('verified_at already exists');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
