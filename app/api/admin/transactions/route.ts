import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const [count, items] = await Promise.all([
    db.transactions.count({ where }),
    db.transactions.findMany({
      where,
      select: {
        id: true,
        productId: true,
        itemPrice: true,
        currency: true,
        serviceFee: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        buyer: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
  ]);

  const productIds = [...new Set(items.map((i) => i.productId))];
  const productsList =
    productIds.length > 0
      ? await db.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, title: true },
        })
      : [];

  const productMap = new Map(productsList.map((p) => [p.id, p.title]));

  const itemsWithDetails = items.map((item) => ({
    ...item,
    buyerName: item.buyer?.name || "Unknown",
    productName: productMap.get(item.productId) || "Unknown",
  }));

  return NextResponse.json({
    transactions: itemsWithDetails.map(({ buyer, ...rest }) => rest),
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
