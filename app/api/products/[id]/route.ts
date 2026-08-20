import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, productImages, users, transactions } from "@/lib/db/schema";
import { eq, and, notInArray } from "drizzle-orm";
import { z } from "zod";
import cloudinary from "@/lib/cloudinary";

const updateProductSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  category: z.string().min(1).optional(),
  condition: z.enum(["new", "like_new", "good", "fair", "used"]).optional(),
  price: z.number().int().min(1).optional(),
  location: z.string().min(2).max(200).optional(),
  images: z.array(z.string()).min(1).max(5).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(productImages.sortOrder);

  const seller = await db
    .select({ id: users.id, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, product.sellerId))
    .get();

  return NextResponse.json({ product: { ...product, images, seller } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);

  const existing = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (existing.sellerId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status === "sold") {
    return NextResponse.json(
      { error: "Cannot edit a sold product" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const validated = updateProductSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { images, ...fields } = validated.data;
  const updateFields: Record<string, unknown> = {
    ...fields,
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(products)
    .set(updateFields)
    .where(eq(products.id, productId));

  if (images) {
    const oldImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId));

    for (const img of oldImages) {
      const match = img.imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      if (match) {
        cloudinary.uploader.destroy(match[1]).catch(() => {});
      }
    }

    await db
      .delete(productImages)
      .where(eq(productImages.productId, productId));

    if (images.length > 0) {
      await db.insert(productImages).values(
        images.map((url: string, index: number) => ({
          productId,
          imageUrl: url,
          sortOrder: index,
        }))
      );
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);

  const existing = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (existing.sellerId !== parseInt(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status === "sold") {
    return NextResponse.json(
      { error: "Cannot delete a sold product" },
      { status: 400 }
    );
  }

  const activeTransaction = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.productId, productId),
        notInArray(transactions.status, ["completed", "refund_completed", "rejected", "disputed"])
      )
    )
    .get();

  if (activeTransaction) {
    return NextResponse.json(
      { error: "Cannot remove a listing with active transactions" },
      { status: 400 }
    );
  }

  const imagesToDelete = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId));

  for (const img of imagesToDelete) {
    const match = img.imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    if (match) {
      cloudinary.uploader.destroy(match[1]).catch(() => {});
    }
  }

  await db
    .delete(productImages)
    .where(eq(productImages.productId, productId));

  await db
    .update(products)
    .set({ status: "removed", updatedAt: new Date().toISOString() })
    .where(eq(products.id, productId));

  return NextResponse.json({ success: true });
}
