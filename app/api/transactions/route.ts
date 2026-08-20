import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, products } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(`transactions:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Purchase limit reached. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const productId = Number(body.productId);

    if (!productId || isNaN(productId)) {
      return NextResponse.json(
        { error: "Valid Product ID is required" },
        { status: 400 }
      );
    }

    const buyerId = parseInt(session.user.id);

    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .get();

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.status !== "active") {
      return NextResponse.json(
        { error: "Product is not available" },
        { status: 400 }
      );
    }

    if (product.sellerId === buyerId) {
      return NextResponse.json(
        { error: "You cannot buy your own product" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const existingTransaction = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.productId, productId),
            eq(transactions.status, "payment_pending")
          )
        )
        .get();

      if (existingTransaction) {
        return { error: "Someone is already checking out this product" };
      }

      const serviceFee = Math.round(product.price * 0.1);
      const totalAmount = product.price + serviceFee;

      const [transaction] = await tx
        .insert(transactions)
        .values({
          productId,
          buyerId,
          sellerId: product.sellerId,
          itemPrice: product.price,
          serviceFee,
          totalAmount,
          status: "payment_pending",
        })
        .returning();

      return { transactionId: transaction.id };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "buyer";
  const userId = parseInt(session.user.id);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const condition =
    role === "seller"
      ? eq(transactions.sellerId, userId)
      : eq(transactions.buyerId, userId);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(condition);

  const items = await db
    .select()
    .from(transactions)
    .where(condition)
    .orderBy(transactions.createdAt)
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    transactions: items,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
