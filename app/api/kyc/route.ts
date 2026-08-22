import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const submitSchema = z.object({
  documentType: z.enum(["passport", "driver_license", "national_id"]),
  documentNumber: z.string().min(1, "Document number is required").max(100, "Document number too long"),
  documentImageUrl: z.string().url("Valid document image URL is required"),
  selfieImageUrl: z.string().url("Valid selfie image URL is required").optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kyc = await db.kyc_documents.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ kyc });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = submitSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { documentType, documentNumber, documentImageUrl, selfieImageUrl } = validated.data;

    const existing = await db.kyc_documents.findUnique({
      where: { userId: session.user.id },
    });

    if (existing && (existing.status === "pending" || existing.status === "verified")) {
      return NextResponse.json(
        { error: "You already have a pending or verified KYC submission" },
        { status: 409 }
      );
    }

    const kyc = await db.$transaction(async (tx) => {
      const result = existing
        ? await tx.kyc_documents.update({
            where: { userId: session.user.id },
            data: {
              documentType,
              documentNumber,
              documentImageUrl,
              selfieImageUrl: selfieImageUrl || null,
              status: "pending",
              adminNote: null,
              reviewedAt: null,
              reviewerId: null,
              submittedAt: new Date(),
            },
          })
        : await tx.kyc_documents.create({
            data: {
              userId: session.user.id,
              documentType,
              documentNumber,
              documentImageUrl,
              selfieImageUrl: selfieImageUrl || null,
              status: "pending",
            },
          });

      await tx.users.update({
        where: { id: session.user.id },
        data: { sellerVerificationStatus: "pending" },
      });

      return result;
    });

    return NextResponse.json({ kyc }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
