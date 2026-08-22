import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { transactionId, revieweeId, rating, comment } = body;

    if (!transactionId || !revieweeId) {
      return NextResponse.json(
        { error: "transactionId and revieweeId are required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const transaction = await db.transactions.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (transaction.status !== "completed") {
      return NextResponse.json(
        { error: "Can only review a completed transaction" },
        { status: 400 }
      );
    }

    const isBuyer = transaction.buyerId === userId;
    const isSeller = transaction.sellerId === userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { error: "You are not a participant in this transaction" },
        { status: 403 }
      );
    }

    if (isBuyer) {
      if (revieweeId !== transaction.sellerId) {
        return NextResponse.json(
          { error: "Reviewee must be the seller" },
          { status: 400 }
        );
      }
    } else {
      if (revieweeId !== transaction.buyerId) {
        return NextResponse.json(
          { error: "Reviewee must be the buyer" },
          { status: 400 }
        );
      }
    }

    const existingReview = await db.reviews.findUnique({
      where: { transactionId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "A review already exists for this transaction" },
        { status: 400 }
      );
    }

    const review = await db.reviews.create({
      data: {
        transactionId,
        reviewerId: userId,
        revieweeId,
        rating,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, review });
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
  const userId = searchParams.get("userId") || session.user.id;
  const type = searchParams.get("type") || "received";

  if (type === "received") {
    const reviews = await db.reviews.findMany({
      where: { revieweeId: userId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { name: true } },
        transaction: {
          select: {
            product: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  }

  if (type === "written") {
    const reviews = await db.reviews.findMany({
      where: { reviewerId: userId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewee: { select: { name: true } },
        transaction: {
          select: {
            product: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  }

  return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
}
