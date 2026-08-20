import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { products, productImages } from "@/lib/db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  condition: z.enum(["new", "like_new", "good", "fair", "used"]),
  price: z.number().int().min(1, "Price must be greater than 0"),
  location: z.string().min(2, "Location is required"),
  images: z.array(z.string()).min(1, "At least one image is required").max(5),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const mine = searchParams.get("mine") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 12;
  const offset = (page - 1) * limit;

  const conditions = mine ? [] : [eq(products.status, "active")];

  if (mine) {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    conditions.push(eq(products.sellerId, parseInt(session.user.id)));
  }

  if (search) {
    conditions.push(like(products.title, `%${search}%`));
  }
  if (category) {
    conditions.push(eq(products.category, category));
  }

  const where = and(...conditions);

  let orderClause;
  switch (sort) {
    case "price_low":
      orderClause = products.price;
      break;
    case "price_high":
      orderClause = desc(products.price);
      break;
    default:
      orderClause = desc(products.createdAt);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(where);

  const items = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(orderClause)
    .limit(limit)
    .offset(offset);

  const allImages = items.length > 0
    ? await db
        .select()
        .from(productImages)
        .where(
          sql`${productImages.productId} IN ${sql.join(
            items.map((item) => sql`${item.id}`),
            sql`,`
          )}`
        )
        .orderBy(productImages.sortOrder)
    : [];

  const imagesByProduct = new Map<number, typeof allImages>();
  for (const img of allImages) {
    const existing = imagesByProduct.get(img.productId) || [];
    existing.push(img);
    imagesByProduct.set(img.productId, existing);
  }

  const itemsWithImages = items.map((item) => ({
    ...item,
    images: imagesByProduct.get(item.id) || [],
  }));

  return NextResponse.json({
    products: itemsWithImages,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = productSchema.parse(body);

    const [product] = await db
      .insert(products)
      .values({
        sellerId: parseInt(session.user.id),
        title: validated.title,
        description: validated.description,
        category: validated.category,
        condition: validated.condition,
        price: validated.price,
        location: validated.location,
      })
      .returning();

    if (validated.images.length > 0) {
      await db.insert(productImages).values(
        validated.images.map((url, index) => ({
          productId: product.id,
          imageUrl: url,
          sortOrder: index,
        }))
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
