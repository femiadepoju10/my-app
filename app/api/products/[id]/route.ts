import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
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

  const product = await db.products.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const images = await db.productImages.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });

  const seller = await db.users.findUnique({
    where: { id: product.sellerId },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ product: { ...product, images, seller } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);

  const existing = await db.products.findUnique({
    where: { id: productId },
  });

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

  const updatedProduct = await db.$transaction(async (tx) => {
    const product = await tx.products.update({
      where: { id: productId },
      data: updateFields,
    });

    if (images) {
      const oldImages = await tx.productImages.findMany({
        where: { productId },
      });

      await Promise.all(
        oldImages.map((img) => {
          const match = img.imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
          if (match) {
            return cloudinary.uploader.destroy(match[1]).catch(() => {});
          }
          return Promise.resolve();
        })
      );

      await tx.productImages.deleteMany({
        where: { productId },
      });

      if (images.length > 0) {
        await tx.productImages.createMany({
          data: images.map((url: string, index: number) => ({
            productId,
            imageUrl: url,
            sortOrder: index,
          })),
        });
      }
    }

    return product;
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);

  const existing = await db.products.findUnique({
    where: { id: productId },
  });

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

  const activeTransaction = await db.transactions.findFirst({
    where: {
      productId,
      status: {
        notIn: ["completed", "refund_completed", "rejected", "disputed"],
      },
    },
  });

  if (activeTransaction) {
    return NextResponse.json(
      { error: "Cannot remove a listing with active transactions" },
      { status: 400 }
    );
  }

  const imagesToDelete = await db.productImages.findMany({
    where: { productId },
  });

  await db.$transaction(async (tx) => {
    await Promise.all(
      imagesToDelete.map((img) => {
        const match = img.imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        if (match) {
          return cloudinary.uploader.destroy(match[1]).catch(() => {});
        }
        return Promise.resolve();
      })
    );

    await tx.productImages.deleteMany({
      where: { productId },
    });

    await tx.products.update({
      where: { id: productId },
      data: { status: "removed", updatedAt: new Date().toISOString() },
    });
  });

  return NextResponse.json({ success: true });
}
