import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.users.findFirst({
    where: { id: parseInt(session.user.id) },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
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

  const { name, email, phone } = validated.data;

  if (email) {
    const existing = await db.users.findFirst({
      where: { email },
    });

    if (existing && existing.id !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: { email: ["Email is already taken"] } },
        { status: 400 }
      );
    }
  }

  await db.users.update({
    where: { id: parseInt(session.user.id) },
    data: {
      name,
      email,
      phone: phone || null,
    },
  });

  return NextResponse.json({ success: true });
}
