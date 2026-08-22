import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { getSellerRatings } from "@/lib/analytics";
import { getActiveSponsoredProductIds } from "@/lib/sponsored-listings";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be at most 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be at most 5000 characters"),
  category: z.string().min(1, "Category is required"),
  condition: z.enum(["new", "like_new", "good", "fair", "used"]),
  price: z.number().int().min(1, "Price must be greater than 0"),
  currency: z.enum(["NGN", "GHS", "KES", "ZAR", "USD"]).optional().default("NGN"),
  location: z.string().min(2, "Location is required").max(200, "Location must be at most 200 characters"),
  images: z.array(z.string()).min(1, "At least one image is required").max(5),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
   const sort = searchParams.get("sort") || "newest";
   const ids = searchParams.get("ids") || "";
  const mine = searchParams.get("mine") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const minPrice = parseInt(searchParams.get("minPrice") || "0", 10) || 0;
  const maxPrice = parseInt(searchParams.get("maxPrice") || "0", 10) || 0;
  const condition = searchParams.get("condition") || "";
  const limit = 12;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};

   if (mine) {
     const session = await getServerSession(authOptions);
     if (!session?.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }
     where.sellerId = session.user.id;
   } else if (ids) {
     const idList = ids.split(",").filter(Boolean);
     if (idList.length > 0) {
       where.id = { in: idList };
     }
   } else {
     where.status = "active";
   }

  if (search) {
    where.title = { contains: search };
  }
  if (category) {
    where.category = category;
  }
  if (minPrice > 0 || maxPrice > 0) {
    const priceFilter: Record<string, number> = {};
    if (minPrice > 0) priceFilter.gte = minPrice;
    if (maxPrice > 0) priceFilter.lte = maxPrice;
    where.price = priceFilter;
  }
  if (condition) {
    const VALID_CONDITIONS = ["new", "like_new", "good", "fair", "used"];
    const conditions_list = condition.split(",").filter((c) => VALID_CONDITIONS.includes(c));
    if (conditions_list.length === 1) {
      where.condition = conditions_list[0];
    } else if (conditions_list.length > 1) {
      where.condition = { in: conditions_list };
    }
  }

  let orderBy: Record<string, string> = {};
  switch (sort) {
    case "price_low":
      orderBy = { price: "asc" };
      break;
    case "price_high":
      orderBy = { price: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const sponsoredIds: Set<string> = mine || ids
    ? new Set<string>()
    : new Set(await getActiveSponsoredProductIds());

  const [countResult, items] = await Promise.all([
    db.products.count({ where }),
    db.products.findMany({
      where,
      orderBy,
      take: limit + (sponsoredIds.size > 0 ? sponsoredIds.size : 0),      skip: offset,
    }),
  ]);

  const sponsoredFirst = items.filter((i) => sponsoredIds.has(i.id));
  const organic = items.filter((i) => !sponsoredIds.has(i.id));
  const sortedItems = [...sponsoredFirst, ...organic].slice(0, limit);

  const productIds = sortedItems.map((item) => item.id);
  const allImages = productIds.length > 0
    ? await db.productImages.findMany({
        where: { productId: { in: productIds } },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  const imagesByProduct = new Map<string, typeof allImages>();
  for (const img of allImages) {
    const existing = imagesByProduct.get(img.productId) || [];
    existing.push(img);
    imagesByProduct.set(img.productId, existing);
  }

  const itemsWithImages = sortedItems.map((item) => ({
    ...item,
    isSponsored: sponsoredIds.has(item.id),
    images: imagesByProduct.get(item.id) || [],
  }));

  const sellerIds = Array.from(new Set(sortedItems.map((i) => i.sellerId)));
  const sellerRatings = sellerIds.length > 0
    ? await getSellerRatings(sellerIds)
    : [];
  const ratingMap = new Map(sellerRatings.map((r) => [r.sellerId, { average: r.average, count: r.count }]));

  return NextResponse.json({
    products: itemsWithImages.map((item) => ({
      ...item,
      sellerRating: ratingMap.get(item.sellerId) ?? { average: 0, count: 0 },
    })),
    total: countResult,
    resultsCount: countResult,
    page,
    totalPages: Math.ceil(countResult / limit),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = productSchema.parse(body);

    const product = await db.$transaction(async (tx) => {
        const existingProductCount = await tx.products.count({
          where: { sellerId: session.user.id },
        });

        if (existingProductCount === 0) {
          const kycDoc = await tx.kyc_documents.findUnique({
            where: { userId: session.user.id },
            select: { status: true },
          });

          if (!kycDoc || kycDoc.status !== "verified") {
            throw new Error("KYC verification required to list products");
          }
        }

        const newProduct = await tx.products.create({
         data: {
           sellerId: session.user.id,
           title: validated.title,
           description: validated.description,
           category: validated.category,
           condition: validated.condition,
            price: validated.price,
            currency: validated.currency,
            location: validated.location,
         },
       });

       if (validated.images.length > 0) {
         await tx.productImages.createMany({
           data: validated.images.map((url, index) => ({
             productId: newProduct.id,
             imageUrl: url,
             sortOrder: index,
           })),
         });
       }

       if (existingProductCount === 0) {
          const currentUser = await tx.users.findUnique({
            where: { id: session.user.id },
            select: { sellerVerificationStatus: true },
          });
          if (currentUser?.sellerVerificationStatus !== "verified") {
            await tx.users.update({
              where: { id: session.user.id },
              data: { sellerVerificationStatus: "pending" },
            });
          }
        }

       return newProduct;
     });

    return NextResponse.json({ product }, { status: 201 });
   } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "KYC verification required to list products") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
