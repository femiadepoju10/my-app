import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .get();

  if (!user || !user.verificationTokenExpiry) {
    return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
  }

  if (new Date(user.verificationTokenExpiry) < new Date()) {
    return NextResponse.json({ error: "Verification link has expired" }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      emailVerified: new Date().toISOString(),
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({ message: "Email verified successfully" });
}
