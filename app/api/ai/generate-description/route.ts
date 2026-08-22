import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { z } from "zod";
import { generateProductDescription } from "@/lib/openai";

const requestSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1, "At least one image URL is required").max(5, "Maximum 5 images"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = requestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { imageUrls } = validated.data;

    const description = await generateProductDescription(imageUrls);

    if (!description) {
      return NextResponse.json(
        { error: "AI service is not available. Please write your description manually." },
        { status: 503 }
      );
    }

    return NextResponse.json({ description });
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
