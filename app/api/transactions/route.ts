import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
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

    const product = await db.products.findUnique({
      where: { id: productId },
    });

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

    const existingTransaction = await db.transactions.findFirst({
      where: {
        productId,
        status: "payment_pending",
      },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: "Someone is already checking out this product" },
        { status: 400 }
      );
    }

    const serviceFee = Math.round(product.price * 0.1);
    const totalAmount = product.price + serviceFee;

    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transactions.create({
        data: {
          productId,
          buyerId,
          sellerId: product.sellerId,
          itemPrice: product.price,
          serviceFee,
          totalAmount,
          status: "payment_pending",
        },
      });

      await tx.products.update({
        where: { id: productId },
        data: { status: "reserved", updatedAt: new Date().toISOString() },
      });

      return newTransaction;
    });

    createNotification(
      product.sellerId,
      "transaction",
      `Your item "${product.title}" has been purchased! Payment is pending.`
    ).catch(() => {});

    return NextResponse.json({ transactionId: transaction.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "buyer";
  const userId = parseInt(session.user.id);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const where =
    role === "seller"
      ? { sellerId: userId }
      : { buyerId: userId };

  const [count, items] = await Promise.all([
    db.transactions.count({ where }),
    db.transactions.findMany({
      where,
      select: {
        id: true,
        productId: true,
        buyerId: true,
        sellerId: true,
        itemPrice: true,
        serviceFee: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            title: true,
            condition: true,
            location: true,
            images: { where: { sortOrder: 0 }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
  ]);

  return NextResponse.json({
    transactions: items,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
