import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(`verify-email:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const user = await db.users.findFirst({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ message: "Email already verified" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.users.update({
    where: { id: user.id },
    data: { verificationToken: token, verificationTokenExpiry: expiry },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  await sendVerificationEmail(user.email, user.name, token, baseUrl);

  return NextResponse.json({ message: "Verification email sent" });
}
