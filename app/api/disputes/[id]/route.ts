import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateDisputeSchema = z.object({
  status: z.enum(["open", "seller_accepted_return", "seller_disputed", "admin_reviewing", "refunded", "seller_paid"]).optional(),
  resolution: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const disputeId = id;

  if (!disputeId) {
    return NextResponse.json({ error: "Invalid dispute ID" }, { status: 400 });
  }

  const body = await req.json();
  const validated = updateDisputeSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const dispute = await db.disputes.findUnique({
    where: { id: disputeId },
    include: { transaction: true },
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (validated.data.status) updateData.status = validated.data.status;
  if (validated.data.resolution !== undefined) updateData.resolution = validated.data.resolution;

  const updatedDispute = await db.disputes.update({
    where: { id: disputeId },
    data: updateData,
  });

  if (validated.data.status === "refunded" && dispute.transaction) {
    await db.$transaction(async (tx) => {
      const existingRefund = await tx.refunds.findFirst({
        where: { transactionId: dispute.transactionId },
      });

      if (!existingRefund) {
        await tx.refunds.create({
          data: {
            transactionId: dispute.transactionId,
            amount: dispute.transaction.totalAmount,
            reason: "Dispute refund",
            status: "pending",
          },
        });
      }

      await tx.transactions.update({
        where: { id: dispute.transactionId },
        data: { status: "refund_pending", updatedAt: new Date().toISOString() },
      });
    });
  }

  return NextResponse.json({ dispute: updatedDispute });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const disputeId = id;

  if (!disputeId) {
    return NextResponse.json({ error: "Invalid dispute ID" }, { status: 400 });
  }

  const dispute = await db.disputes.findUnique({
    where: { id: disputeId },
    include: {
      transaction: {
        select: {
          id: true,
          productId: true,
          buyerId: true,
          sellerId: true,
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
  });

  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const isAdmin = session.user.role === "admin";
  const isBuyer = dispute.transaction.buyerId === userId;
  const isSeller = dispute.transaction.sellerId === userId;

  if (!isAdmin && !isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ dispute });
}
