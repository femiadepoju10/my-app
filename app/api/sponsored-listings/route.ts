import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { initializeTransaction } from "@/lib/paystack";
import { calculateSponsoredAmount, calculateSponsoredEndsAt } from "@/lib/sponsored-types";
import { randomUUID } from "crypto";

type ValidDuration = 1 | 3 | 7 | 14;
const VALID_DURATIONS: ValidDuration[] = [1, 3, 7, 14];

const createSchema = z.object({
  productId: z.string().uuid(),
  durationDays: z.number().int().min(1).max(14),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await db.sponsored_listings.findMany({
    where: { sellerId: session.user.id },
    include: {
      product: {
        select: { id: true, title: true, images: { take: 1, select: { imageUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ listings });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = createSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { productId, durationDays } = validated.data;

    if (!VALID_DURATIONS.includes(durationDays as ValidDuration)) {
      return NextResponse.json(
        { error: `Invalid duration. Must be one of: ${VALID_DURATIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const product = await db.products.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true, title: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only sponsor your own products" },
        { status: 403 }
      );
    }

    const existing = await db.sponsored_listings.findFirst({
      where: {
        productId,
        status: { in: ["pending", "active"] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This product already has a pending or active sponsorship" },
        { status: 409 }
      );
    }

    const amount = calculateSponsoredAmount(durationDays);
    const startsAt = new Date();
    const endsAt = calculateSponsoredEndsAt(startsAt, durationDays);
    const reference = `SB_SPONSOR_${randomUUID()}`;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const result = await db.$transaction(async (tx) => {
      const listing = await tx.sponsored_listings.create({
        data: {
          productId,
          sellerId: session.user.id,
          amount,
          currency: "NGN",
          durationDays,
          startsAt,
          endsAt,
          status: "pending",
          paystackRef: reference,
        },
      });

      const paystackResult = await initializeTransaction({
        email: session.user.email || "",
        amount,
        currency: "NGN",
        reference,
        callback_url: `${baseUrl}/dashboard/sponsored/verify?reference=${reference}`,
        metadata: {
          sponsored_listing_id: listing.id,
          product_id: productId,
          seller_id: session.user.id,
        },
      });

      return {
        listing,
        authorization_url: paystackResult.authorization_url,
        reference: paystackResult.reference,
      };
    });

    return NextResponse.json(
      {
        listing: result.listing,
        authorization_url: result.authorization_url,
        reference: result.reference,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create sponsored listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
