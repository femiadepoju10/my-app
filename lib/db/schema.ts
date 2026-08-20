import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    condition: text("condition", {
      enum: ["new", "like_new", "good", "fair", "used"],
    }).notNull(),
    price: integer("price").notNull(),
    location: text("location").notNull(),
    status: text("status", {
      enum: ["active", "reserved", "sold", "removed"],
    })
      .notNull()
      .default("active"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [
    index("idx_products_seller").on(t.sellerId),
    index("idx_products_status").on(t.status),
    index("idx_products_category").on(t.category),
    index("idx_products_created").on(t.createdAt),
  ]
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("idx_product_images_product").on(t.productId)]
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    buyerId: integer("buyer_id")
      .notNull()
      .references(() => users.id),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id),
    itemPrice: integer("item_price").notNull(),
    serviceFee: integer("service_fee").notNull(),
    totalAmount: integer("total_amount").notNull(),
    status: text("status", {
      enum: [
        "payment_pending",
        "payment_confirmed",
        "seller_contacted",
        "item_delivered",
        "inspection_pending",
        "accepted",
        "rejected",
        "disputed",
        "payout_pending",
        "payout_completed",
        "completed",
        "refund_pending",
        "refund_completed",
      ],
    })
      .notNull()
      .default("payment_pending"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    rejectionReason: text("rejection_reason"),
    rejectionPhotos: text("rejection_photos"),
    disputeNote: text("dispute_note"),
  },
  (t) => [
    index("idx_transactions_buyer").on(t.buyerId),
    index("idx_transactions_seller").on(t.sellerId),
    index("idx_transactions_product").on(t.productId),
    index("idx_transactions_status").on(t.status),
  ]
);

export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id),
    paystackRef: text("paystack_ref").notNull().unique(),
    amount: integer("amount").notNull(),
    status: text("status", {
      enum: ["pending", "successful", "failed", "refunded"],
    })
      .notNull()
      .default("pending"),
    gatewayResponse: text("gateway_response"),
    paidAt: text("paid_at"),
  },
  (t) => [index("idx_payments_transaction").on(t.transactionId)]
);

export const payouts = sqliteTable(
  "payouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    status: text("status", {
      enum: ["pending", "processing", "completed", "failed"],
    })
      .notNull()
      .default("pending"),
    paystackRef: text("paystack_ref"),
    paidAt: text("paid_at"),
  },
  (t) => [
    index("idx_payouts_transaction").on(t.transactionId),
    index("idx_payouts_seller").on(t.sellerId),
  ]
);

export const refunds = sqliteTable(
  "refunds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transactionId: integer("transaction_id")
      .notNull()
      .references(() => transactions.id),
    amount: integer("amount").notNull(),
    reason: text("reason"),
    status: text("status", {
      enum: ["pending", "approved", "processing", "completed", "failed"],
    })
      .notNull()
      .default("pending"),
    paystackRef: text("paystack_ref"),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [index("idx_refunds_transaction").on(t.transactionId)]
);
