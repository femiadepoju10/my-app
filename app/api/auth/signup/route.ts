import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { awardPoints } from "@/lib/loyalty";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    ref: z.string().uuid().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(`signup:${ip}`, 5, 15 * 60 * 1000);

    if (!allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = signupSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, password, ref } = validated.data;

    const existingUser = await db.users.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { email: ["Email already in use"] } },
        { status: 409 }
      );
    }

    if (phone) {
      const existingPhone = await db.users.findFirst({
        where: { phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: { phone: ["Phone number already in use"] } },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newUser = await db.users.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        verificationToken,
        verificationTokenExpiry,
      },
    });

    console.log("[Signup] User created:", { userId: newUser.id, email: newUser.email });

    awardPoints(newUser.id, 100, "signup").catch((err) => {
      console.error("[Signup] Failed to award signup points:", err);
    });

    if (ref) {
      const referrer = await db.users.findUnique({
        where: { id: ref },
        select: { id: true },
      });
      if (referrer) {
        awardPoints(referrer.id, 500, "referral").catch((err) => {
          console.error("[Signup] Failed to award referral points:", err);
        });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    sendVerificationEmail(email, name, verificationToken, baseUrl).catch((err) => {
      console.error("[Signup] Failed to send verification email:", err);
    });
    sendWelcomeEmail(email, name).catch((err) => {
      console.error("[Signup] Failed to send welcome email:", err);
    });
    createNotification(newUser.id, "registration", "Welcome to PassitOn! Your account has been created successfully.").catch((err) => {
      console.error("[Signup] Failed to create notification:", err);
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: { general: ["Something went wrong"] } },
      { status: 500 }
    );
  }
}
