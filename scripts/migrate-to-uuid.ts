import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

interface IdMapping {
  [table: string]: Record<number, string>;
}

const mappings: IdMapping = {};

async function migrateUsers() {
  console.log('Migrating users...');
  const users = await prisma.$queryRaw<Array<{ id: number; name: string; email: string }>>`
    SELECT id, name, email FROM "users" ORDER BY id
  `;

  mappings.users = {};
  for (const user of users) {
    const newId = crypto.randomUUID();
    mappings.users[user.id] = newId;
    await prisma.$executeRaw`
      UPDATE "users" SET id = ${newId}::uuid WHERE id = ${user.id}::integer
    `;
  }
  console.log(`  Migrated ${users.length} users`);
}

async function migrateProducts() {
  console.log('Migrating products...');
  const products = await prisma.$queryRaw<Array<{ id: number; sellerId: number }>>`
    SELECT id, "sellerId" FROM "products" ORDER BY id
  `;

  mappings.products = {};
  for (const product of products) {
    const newId = crypto.randomUUID();
    mappings.products[product.id] = newId;
    const newSellerId = mappings.users[product.sellerId];
    await prisma.$executeRaw`
      UPDATE "products" SET id = ${newId}::uuid, "sellerId" = ${newSellerId}::uuid WHERE id = ${product.id}::integer
    `;
  }
  console.log(`  Migrated ${products.length} products`);
}

async function migrateProductImages() {
  console.log('Migrating productImages...');
  const images = await prisma.$queryRaw<Array<{ id: number; productId: number }>>`
    SELECT id, "productId" FROM "product_images" ORDER BY id
  `;

  mappings.productImages = {};
  for (const image of images) {
    const newId = crypto.randomUUID();
    mappings.productImages[image.id] = newId;
    const newProductId = mappings.products[image.productId];
    await prisma.$executeRaw`
      UPDATE "product_images" SET id = ${newId}::uuid, "productId" = ${newProductId}::uuid WHERE id = ${image.id}::integer
    `;
  }
  console.log(`  Migrated ${images.length} productImages`);
}

async function migrateTransactions() {
  console.log('Migrating transactions...');
  const transactions = await prisma.$queryRaw<Array<{ id: number; productId: number; buyerId: number; sellerId: number }>>`
    SELECT id, "productId", "buyerId", "sellerId" FROM "transactions" ORDER BY id
  `;

  mappings.transactions = {};
  for (const tx of transactions) {
    const newId = crypto.randomUUID();
    mappings.transactions[tx.id] = newId;
    const newProductId = mappings.products[tx.productId];
    const newBuyerId = mappings.users[tx.buyerId];
    const newSellerId = mappings.users[tx.sellerId];
    await prisma.$executeRaw`
      UPDATE "transactions" 
      SET id = ${newId}::uuid, 
          "productId" = ${newProductId}::uuid, 
          "buyerId" = ${newBuyerId}::uuid, 
          "sellerId" = ${newSellerId}::uuid
      WHERE id = ${tx.id}::integer
    `;
  }
  console.log(`  Migrated ${transactions.length} transactions`);
}

async function migratePayments() {
  console.log('Migrating payments...');
  const payments = await prisma.$queryRaw<Array<{ id: number; transactionId: number }>>`
    SELECT id, "transactionId" FROM "payments" ORDER BY id
  `;

  mappings.payments = {};
  for (const payment of payments) {
    const newId = crypto.randomUUID();
    mappings.payments[payment.id] = newId;
    const newTransactionId = mappings.transactions[payment.transactionId];
    await prisma.$executeRaw`
      UPDATE "payments" SET id = ${newId}::uuid, "transactionId" = ${newTransactionId}::uuid WHERE id = ${payment.id}::integer
    `;
  }
  console.log(`  Migrated ${payments.length} payments`);
}

async function migratePayouts() {
  console.log('Migrating payouts...');
  const payouts = await prisma.$queryRaw<Array<{ id: number; transactionId: number; sellerId: number }>>`
    SELECT id, "transactionId", "sellerId" FROM "payouts" ORDER BY id
  `;

  mappings.payouts = {};
  for (const payout of payouts) {
    const newId = crypto.randomUUID();
    mappings.payouts[payout.id] = newId;
    const newTransactionId = mappings.transactions[payout.transactionId];
    const newSellerId = mappings.users[payout.sellerId];
    await prisma.$executeRaw`
      UPDATE "payouts" SET id = ${newId}::uuid, "transactionId" = ${newTransactionId}::uuid, "sellerId" = ${newSellerId}::uuid WHERE id = ${payout.id}::integer
    `;
  }
  console.log(`  Migrated ${payouts.length} payouts`);
}

async function migrateRefunds() {
  console.log('Migrating refunds...');
  const refunds = await prisma.$queryRaw<Array<{ id: number; transactionId: number }>>`
    SELECT id, "transactionId" FROM "refunds" ORDER BY id
  `;

  mappings.refunds = {};
  for (const refund of refunds) {
    const newId = crypto.randomUUID();
    mappings.refunds[refund.id] = newId;
    const newTransactionId = mappings.transactions[refund.transactionId];
    await prisma.$executeRaw`
      UPDATE "refunds" SET id = ${newId}::uuid, "transactionId" = ${newTransactionId}::uuid WHERE id = ${refund.id}::integer
    `;
  }
  console.log(`  Migrated ${refunds.length} refunds`);
}

async function migrateDisputes() {
  console.log('Migrating disputes...');
  const disputes = await prisma.$queryRaw<Array<{ id: number; transactionId: number; openedById: number }>>`
    SELECT id, "transactionId", "openedById" FROM "disputes" ORDER BY id
  `;

  mappings.disputes = {};
  for (const dispute of disputes) {
    const newId = crypto.randomUUID();
    mappings.disputes[dispute.id] = newId;
    const newTransactionId = mappings.transactions[dispute.transactionId];
    const newOpenedById = mappings.users[dispute.openedById];
    await prisma.$executeRaw`
      UPDATE "disputes" SET id = ${newId}::uuid, "transactionId" = ${newTransactionId}::uuid, "openedById" = ${newOpenedById}::uuid WHERE id = ${dispute.id}::integer
    `;
  }
  console.log(`  Migrated ${disputes.length} disputes`);
}

async function migrateNotifications() {
  console.log('Migrating notifications...');
  const notifications = await prisma.$queryRaw<Array<{ id: number; userId: number }>>`
    SELECT id, "userId" FROM "notifications" ORDER BY id
  `;

  mappings.notifications = {};
  for (const notification of notifications) {
    const newId = crypto.randomUUID();
    mappings.notifications[notification.id] = newId;
    const newUserId = mappings.users[notification.userId];
    await prisma.$executeRaw`
      UPDATE "notifications" SET id = ${newId}::uuid, "userId" = ${newUserId}::uuid WHERE id = ${notification.id}::integer
    `;
  }
  console.log(`  Migrated ${notifications.length} notifications`);
}

async function main() {
  console.log('Starting UUID data migration...\n');

  // Check if already migrated (idempotency check)
  const userSample = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "users" LIMIT 1
  `;
  if (userSample.length > 0 && typeof userSample[0].id === 'string') {
    console.log('Migration already applied (IDs are already UUIDs). Exiting.');
    await prisma.$disconnect();
    return;
  }

  await migrateUsers();
  await migrateProducts();
  await migrateProductImages();
  await migrateTransactions();
  await migratePayments();
  await migratePayouts();
  await migrateRefunds();
  await migrateDisputes();
  await migrateNotifications();

  console.log('\nMigration complete!');
  console.log('ID mappings saved in memory. Use the mappings object to look up old IDs.');
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
