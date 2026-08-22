import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlists = await db.wishlists.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          price: true,
          condition: true,
          location: true,
          status: true,
          images: { where: { sortOrder: 0 }, take: 1 },
          seller: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    wishlists: wishlists.filter((w) => w.product).map((w) => ({
      id: w.id,
      createdAt: w.createdAt,
      product: w.product,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const productId = body.productId;

  if (!productId || typeof productId !== "string") {
    return NextResponse.json({ error: "Valid productId is required" }, { status: 400 });
  }

  const product = await db.products.findUnique({
    where: { id: productId },
    select: { id: true, status: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const wishlist = await db.wishlists.create({
      data: { userId: session.user.id, productId },
    });
    return NextResponse.json({ success: true, wishlist });
  } catch {
    return NextResponse.json(
      { error: "Product is already in your wishlist" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const result = await db.wishlists.deleteMany({
    where: { userId: session.user.id, productId },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Product not found in your wishlist" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
