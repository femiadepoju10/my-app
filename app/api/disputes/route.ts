import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createDisputeSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required"),
  reason: z.string().min(1, "Reason is required"),
  evidence: z.array(z.string()).max(5, "Maximum 5 images allowed").optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = createDisputeSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { transactionId, reason, evidence } = validated.data;
  const userId = session.user.id;

  const transaction = await db.transactions.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.buyerId !== userId) {
    return NextResponse.json(
      { error: "Only the buyer can open a dispute" },
      { status: 403 }
    );
  }

  if (!["rejected", "disputed"].includes(transaction.status)) {
    return NextResponse.json(
      { error: "Dispute can only be opened for rejected or disputed transactions" },
      { status: 400 }
    );
  }

  const existingDispute = await db.disputes.findFirst({
    where: { transactionId },
  });

  if (existingDispute) {
    return NextResponse.json(
      { error: "Dispute already exists for this transaction" },
      { status: 400 }
    );
  }

  const dispute = await db.disputes.create({
    data: {
      transactionId,
      openedById: userId,
      reason,
      evidence: evidence ? JSON.stringify(evidence) : null,
      status: "open",
    },
  });

  await db.transactions.update({
    where: { id: transactionId },
    data: { status: "disputed", updatedAt: new Date().toISOString() },
  });

  return NextResponse.json({ dispute }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";

  const where = isAdmin
    ? {}
    : {
        OR: [
          { openedById: userId },
          { transaction: { buyerId: userId } },
          { transaction: { sellerId: userId } },
        ],
      };

  const [count, disputes] = await Promise.all([
    db.disputes.count({ where }),
    db.disputes.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            productId: true,
            itemPrice: true,
            totalAmount: true,
            status: true,
            product: {
              select: { title: true, images: { where: { sortOrder: 0 }, take: 1 } },
            },
          },
        },
        openedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
  ]);

  return NextResponse.json({
    disputes,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  });
}
