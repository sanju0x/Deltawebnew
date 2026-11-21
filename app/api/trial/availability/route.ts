import { NextResponse } from "next/server";
import { trialClaimsEnabled } from "@/lib/trials";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ enabled: await trialClaimsEnabled() }, { headers: { "Cache-Control": "no-store" } });
}
