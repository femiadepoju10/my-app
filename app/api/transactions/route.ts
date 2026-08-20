import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { transactions, products } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const existingTransaction = await db
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
      return NextResponse.json(
        { error: "Someone is already checking out this product" },
        { status: 400 }
      );
    }

    const serviceFee = Math.round(product.price * 0.1);
    const totalAmount = product.price + serviceFee;

    const [transaction] = await db
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

    return NextResponse.json({
      transactionId: transaction.id,
    });
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

  const condition =
    role === "seller"
      ? eq(transactions.sellerId, userId)
      : eq(transactions.buyerId, userId);

  const items = await db
    .select()
    .from(transactions)
    .where(condition)
    .orderBy(transactions.createdAt);

  return NextResponse.json({ transactions: items });
}
