import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/paystack";
import { calculateSponsoredEndsAt } from "@/lib/sponsored-types";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  try {
    const listing = await db.sponsored_listings.findFirst({
      where: { paystackRef: reference },
      include: { product: { select: { id: true, title: true } } },
    });

    if (!listing) {
      return NextResponse.json({ error: "Sponsored listing not found" }, { status: 404 });
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (listing.status === "active") {
      return NextResponse.json({
        listing,
        message: "Sponsored listing is already active",
      });
    }

    const verification = await verifyTransaction(reference);

    if (verification.status !== "success") {
      return NextResponse.json(
        { listing, message: "Payment not yet completed" },
        { status: 202 }
      );
    }

    const verifiedAmount = (verification as Record<string, unknown>).amount as number | undefined;
    if (
      typeof verifiedAmount === "number" &&
      verifiedAmount !== listing.amount
    ) {
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    const startsAt = new Date();
    const endsAt = calculateSponsoredEndsAt(startsAt, listing.durationDays);

    const updated = await db.sponsored_listings.update({
      where: { id: listing.id },
      data: {
        status: "active",
        startsAt,
        endsAt,
      },
    });

    return NextResponse.json({ listing: updated, message: "Payment successful" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
