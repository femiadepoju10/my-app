import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { token } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const user = await db.users.findFirst({
    where: { verificationToken: token },
  });

  if (!user || !user.verificationTokenExpiry) {
    return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
  }

  if (new Date(user.verificationTokenExpiry) < new Date()) {
    return NextResponse.json({ error: "Verification link has expired" }, { status: 400 });
  }

  await db.users.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date().toISOString(),
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: "Email verified successfully" });
}
