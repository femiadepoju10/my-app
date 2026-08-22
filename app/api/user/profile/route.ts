import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { createTransferRecipient } from "@/lib/paystack";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional().or(z.literal("")),
  smsEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const user = await db.users.findFirst({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        bio: true,
        smsEnabled: true,
        role: true,
        paystackRecipientCode: true,
        createdAt: true,
      },
    });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = profileSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, phone, bio, smsEnabled, accountNumber, bankCode } = body;

  if (email) {
    const existing = await db.users.findFirst({
      where: { email },
    });

    if (existing && existing.id !== session.user.id) {
      return NextResponse.json(
        { error: { email: ["Email is already taken"] } },
        { status: 400 }
      );
    }
  }

  const data: Record<string, unknown> = {
    name,
    email,
    phone: phone || null,
    bio: bio || null,
    smsEnabled,
  };

  if (accountNumber && bankCode) {
    try {
      const user = await db.users.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });

      const recipient = await createTransferRecipient({
        name: user?.name || email,
        account_number: accountNumber,
        bank_code: bankCode,
      });

      data.paystackRecipientCode = recipient.recipient_code;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set up payout recipient";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (body.clearPaystackRecipient) {
    data.paystackRecipientCode = null;
  }

  await db.users.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({
    success: true,
    paystackRecipientCode: data.paystackRecipientCode ?? undefined,
  });
}
