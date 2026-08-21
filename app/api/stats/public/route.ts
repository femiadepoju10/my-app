import { NextResponse } from "next/server";
import { getPublicStats, getCategoryCounts } from "@/lib/analytics";

export async function GET() {
  try {
    const [stats, categories] = await Promise.all([
      getPublicStats(),
      getCategoryCounts(),
    ]);
    return NextResponse.json({ stats, categories });
  } catch (error) {
    console.error("Failed to fetch public stats", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
