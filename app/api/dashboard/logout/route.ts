import { NextRequest, NextResponse } from "next/server";
import { recordActivity } from "@/lib/site-activity";
import { getDb } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";
import { TRIAL_SESSION_COOKIE, trialCookieOptions } from "@/lib/trial-auth";
import { dashboardCookieOptions, DASHBOARD_COOKIE, dashboardError, requireSameOrigin, sessionHash } from "@/lib/dashboard-auth";
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(DASHBOARD_COOKIE)?.value;
    if (token) {
      const session = await (await getDb()).collection("dashboard_sessions").findOneAndDelete({ tokenHash: sessionHash(token) }, { projection: { userId: 1 } });
      if (session) await recordActivity("Dashboard", "Signed out", session.userId);
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(DASHBOARD_COOKIE, "", { ...dashboardCookieOptions(request), maxAge: 0 });
    response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    response.cookies.set(TRIAL_SESSION_COOKIE, "", { ...trialCookieOptions, maxAge: 0 });
    return response;
  } catch (error) { return dashboardError(error); }
}
