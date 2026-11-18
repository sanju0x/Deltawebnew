import { NextRequest, NextResponse } from "next/server";
import { TRIAL_SESSION_COOKIE, trialCookieOptions, trialOrigin } from "@/lib/trial-auth";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== trialOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TRIAL_SESSION_COOKIE, "", { ...trialCookieOptions, maxAge: 0 });
  return response;
}
