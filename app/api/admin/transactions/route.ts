import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, users, products } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(sql`${transactions.status} = ${status}`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(where);

  const items = await db
    .select({
      id: transactions.id,
      productId: transactions.productId,
      itemPrice: transactions.itemPrice,
      serviceFee: transactions.serviceFee,
      totalAmount: transactions.totalAmount,
      status: transactions.status,
      createdAt: transactions.createdAt,
      buyerName: users.name,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.buyerId, users.id))
    .where(where)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  const productIds = [...new Set(items.map((i) => i.productId))];
  const productsList = productIds.length > 0
    ? await db
        .select({ id: products.id, title: products.title })
        .from(products)
        .where(sql`${products.id} IN ${sql.join(productIds.map((id) => sql`${id}`), sql`,`)}`)
    : [];

  const productMap = new Map(productsList.map((p) => [p.id, p.title]));

  const itemsWithDetails = items.map((item) => ({
    ...item,
    productName: productMap.get(item.productId) || "Unknown",
  }));

  return NextResponse.json({
    transactions: itemsWithDetails,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
