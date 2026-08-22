import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { createTransferRecipient } from "@/lib/paystack";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await db.users.findMany({
    where: { deletedAt: null },
     select: {
       id: true,
       name: true,
       email: true,
       phone: true,
       role: true,
       paystackRecipientCode: true,
       sellerVerificationStatus: true,
       verificationNote: true,
       verifiedAt: true,
       createdAt: true,
     },
    orderBy: { createdAt: "desc" },
  });

  const userIds = allUsers.map((u) => u.id);
  const [buyerTxCounts, sellerTxCounts] = userIds.length > 0
    ? await Promise.all([
        db.transactions.groupBy({
          by: ["buyerId"],
          where: { buyerId: { in: userIds } },
          _count: { buyerId: true },
        }),
        db.transactions.groupBy({
          by: ["sellerId"],
          where: { sellerId: { in: userIds } },
          _count: { sellerId: true },
        }),
      ])
    : [[], []];

  const buyerTxMap = new Map(buyerTxCounts.map((t) => [t.buyerId, t._count.buyerId]));
  const sellerTxMap = new Map(sellerTxCounts.map((t) => [t.sellerId, t._count.sellerId]));

  return NextResponse.json({
    users: allUsers.map((u) => ({
      ...u,
      transactionCount: (buyerTxMap.get(u.id) || 0) + (sellerTxMap.get(u.id) || 0),
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

   const body = await req.json();
   const { userId, role, paystackRecipientCode, sellerVerificationStatus, verificationNote } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const data: Record<string, string | null> = {};
  let isPayoutSetup = false;
  let payoutData: { name: string; account_number: string; bank_code: string } | null = null;

  if (paystackRecipientCode !== undefined) {
    data.paystackRecipientCode = paystackRecipientCode;
    isPayoutSetup = true;
  }

  if (body.accountNumber && body.bankCode) {
    payoutData = {
      name: body.sellerName || "",
      account_number: body.accountNumber,
      bank_code: body.bankCode,
    };
  }

  if (payoutData) {
    try {
      const user = await db.users.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const recipient = await createTransferRecipient({
        name: payoutData.name || user.name,
        account_number: payoutData.account_number,
        bank_code: payoutData.bank_code,
      });

      data.paystackRecipientCode = recipient.recipient_code;
      isPayoutSetup = true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create payout recipient";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!role && !isPayoutSetup) {
    return NextResponse.json(
      { error: "Either role or paystackRecipientCode is required" },
      { status: 400 }
    );
  }

  if (role && !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (role) {
    data.role = role;
  }

  if (sellerVerificationStatus !== undefined) {
    if (!["pending", "verified", "rejected", null].includes(sellerVerificationStatus)) {
      return NextResponse.json({ error: "Invalid sellerVerificationStatus" }, { status: 400 });
    }
    data.sellerVerificationStatus = sellerVerificationStatus;
    if (sellerVerificationStatus === "verified") {
      data.verifiedAt = new Date().toISOString();
    } else if (sellerVerificationStatus === "rejected") {
      data.verifiedAt = null;
    }
  }

  if (verificationNote !== undefined) {
    data.verificationNote = verificationNote;
  }

  await db.users.update({
    where: { id: userId },
    data,
  });

  return NextResponse.json({
    success: true,
    paystackRecipientCode: data.paystackRecipientCode ?? null,
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await db.users.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
