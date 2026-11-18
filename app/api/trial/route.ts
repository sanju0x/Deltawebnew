import { NextRequest, NextResponse } from "next/server";
import { trialOrigin, trialUserId } from "@/lib/trial-auth";
import { claimTrial, getTrialStatus } from "@/lib/trials";

export const runtime = "nodejs";

async function handle(request: NextRequest, claim: boolean) {
  if (claim && request.headers.get("origin") !== trialOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const userId = await trialUserId(request);
    if (!userId) return NextResponse.json({ error: "Sign in with Discord first" }, { status: 401 });
    const result = claim ? await claimTrial(userId) : await getTrialStatus(userId);
    return NextResponse.json({ ...result, userId }, { status: "ok" in result && !result.ok ? 409 : 200, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Trial service unavailable. Please try again shortly." }, { status: 503 }); }
}

export function GET(request: NextRequest) { return handle(request, false); }
export function POST(request: NextRequest) { return handle(request, true); }
