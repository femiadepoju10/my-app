import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);

  if (!allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const validated = resetSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, password } = validated.data;

  const user = await db.users.findFirst({
    where: { resetToken: token },
  });

  if (!user || !user.resetTokenExpiry) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  if (new Date(user.resetTokenExpiry) < new Date()) {
    return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.users.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: "Password reset successful" });
}
