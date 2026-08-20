import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviews, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const reviewSchema = z.object({
  transactionId: z.number().int(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const productReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerId: reviews.reviewerId,
    })
    .from(reviews)
    .where(eq(reviews.productId, parseInt(productId)))
    .orderBy(reviews.createdAt);

  return NextResponse.json({ reviews: productReviews });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = reviewSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { transactionId, rating, comment } = validated.data;
  const userId = parseInt(session.user.id);

  const { allowed, retryAfterMs } = checkRateLimit(`reviews:${userId}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Review limit reached. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const transaction = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .get();

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.status !== "completed") {
    return NextResponse.json(
      { error: "Can only review completed transactions" },
      { status: 400 }
    );
  }

  if (transaction.buyerId !== userId) {
    return NextResponse.json(
      { error: "Only the buyer can leave a review" },
      { status: 403 }
    );
  }

  const existing = await db
    .select()
    .from(reviews)
    .where(eq(reviews.transactionId, transactionId))
    .get();

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this transaction" },
      { status: 400 }
    );
  }

  const [review] = await db
    .insert(reviews)
    .values({
      transactionId,
      productId: transaction.productId,
      reviewerId: userId,
      revieweeId: transaction.sellerId,
      rating,
      comment: comment || null,
    })
    .returning();

  return NextResponse.json({ review }, { status: 201 });
}
