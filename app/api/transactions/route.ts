import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createNotification } from "@/lib/notifications";
import { pointsToDiscount, discountToPoints } from "@/lib/loyalty";

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
     const productId = body.productId as string;
     const loyaltyPointsToRedeem = parseInt(body.loyaltyPointsToRedeem) || 0;

     if (!productId) {
       return NextResponse.json(
         { error: "Valid Product ID is required" },
         { status: 400 }
       );
     }

     const buyerId = session.user.id;

     const transaction = await db.$transaction(async (tx) => {
       const product = await tx.products.findUnique({
         where: { id: productId },
       });

       if (!product) {
         throw new Error("Product not found");
       }

       if (product.status !== "active") {
         throw new Error("Product is not available");
       }

       if (product.sellerId === buyerId) {
         throw new Error("You cannot buy your own product");
       }

       const existingTransaction = await tx.transactions.findFirst({
         where: {
           productId,
           status: "payment_pending",
         },
       });

       if (existingTransaction) {
         throw new Error("Someone is already checking out this product");
       }

       let loyaltyDiscountCents = 0;

       if (loyaltyPointsToRedeem > 0) {
         const user = await tx.users.findUnique({
           where: { id: buyerId },
           select: { loyaltyPointBalance: true },
         });

         if (!user) {
           throw new Error("User not found");
         }

         if (loyaltyPointsToRedeem < 10) {
           throw new Error("Minimum redemption is 10 points");
         }

         if ((user.loyaltyPointBalance || 0) < loyaltyPointsToRedeem) {
           throw new Error("Insufficient loyalty points");
         }

         loyaltyDiscountCents = pointsToDiscount(loyaltyPointsToRedeem);
       }

       const serviceFee = Math.round(product.price * 0.1);
       const totalAmount = Math.max(0, product.price + serviceFee - loyaltyDiscountCents);

        const newTransaction = await tx.transactions.create({
          data: {
            productId,
            buyerId,
            sellerId: product.sellerId,
            itemPrice: product.price,
            currency: product.currency,
            serviceFee,
            totalAmount,
            status: "payment_pending",
          },
       });

       if (loyaltyPointsToRedeem > 0) {
         await tx.loyalty_events.create({
           data: {
             userId: buyerId,
             points: -loyaltyPointsToRedeem,
             source: "redemption",
             transactionId: newTransaction.id,
           },
         });

         await tx.users.update({
           where: { id: buyerId },
           data: {
             loyaltyPointBalance: { decrement: loyaltyPointsToRedeem },
           },
         });
       }

       const updateResult = await tx.products.updateMany({
         where: { id: productId, status: "active" },
         data: { status: "reserved", updatedAt: new Date().toISOString() },
       });

       if (updateResult.count === 0) {
         throw new Error("Product was just taken by another buyer");
       }

       return { transaction: newTransaction, sellerId: product.sellerId, productTitle: product.title, loyaltyDiscountCents };
     });

     createNotification(transaction.sellerId, "transaction", `Your item "${transaction.productTitle}" has been purchased! Payment is pending.`).catch(() => {});

     return NextResponse.json({
       transactionId: transaction.transaction.id,
       loyaltyDiscountApplied: transaction.loyaltyDiscountCents,
     });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    const status = message.includes("not found") || message.includes("not available") || message.includes("cannot buy") || message.includes("checking out") || message.includes("just taken")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "buyer";
  const userId = session.user.id;
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
        currency: true,
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
