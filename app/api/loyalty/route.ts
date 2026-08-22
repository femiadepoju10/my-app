import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { getUserLoyalty } from "@/lib/loyalty";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getUserLoyalty(session.user.id);
    return NextResponse.json({
      balance: summary.balance,
      tier: summary.tier,
      lifetimeEarned: summary.lifetimeEarned,
      recentEvents: summary.recentEvents,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
