import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const maxAgeHours = body.maxAgeHours || 24;
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const abandonedTransactions = await db.transactions.findMany({
    where: {
      status: "payment_pending",
      createdAt: { lt: cutoff },
    },
    select: { id: true, productId: true },
  });

  const productIds = [...new Set(abandonedTransactions.map((t) => t.productId))];

  await db.$transaction(async (tx) => {
    for (const t of abandonedTransactions) {
      await tx.transactions.update({
        where: { id: t.id },
        data: { status: "rejected", updatedAt: new Date().toISOString() },
      });
    }

    if (productIds.length > 0) {
      await tx.products.updateMany({
        where: { id: { in: productIds } },
        data: { status: "active", updatedAt: new Date().toISOString() },
      });
    }
  });

  return NextResponse.json({
    message: `Cleaned up ${abandonedTransactions.length} abandoned transactions`,
    count: abandonedTransactions.length,
  });
}
