import { NextRequest, NextResponse } from "next/server";
import { trialOrigin, trialUserId } from "@/lib/trial-auth";
import { requestBotTrial } from "@/lib/trial-api";

async function handle(request: NextRequest, claim: boolean) {
  if (claim && request.headers.get("origin") !== trialOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const userId = await trialUserId(request);
    if (!userId) return NextResponse.json({ error: "Sign in with Discord first" }, { status: 401 });
    const { status, statusCode } = await requestBotTrial(userId, claim);
    return NextResponse.json({ ...status, userId }, { status: statusCode, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Trial service unavailable. Please try again shortly." }, { status: 503 }); }
}

export function GET(request: NextRequest) { return handle(request, false); }
export function POST(request: NextRequest) { return handle(request, true); }
