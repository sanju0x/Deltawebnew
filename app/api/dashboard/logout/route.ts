import { NextRequest, NextResponse } from "next/server";
import { recordActivity } from "@/lib/site-activity";
import { getDb } from "@/lib/mongodb";
import { cookieOptions, DASHBOARD_COOKIE, dashboardError, requireSameOrigin, sessionHash } from "@/lib/dashboard-auth";
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(DASHBOARD_COOKIE)?.value;
    if (token) {
      const session = await (await getDb()).collection("dashboard_sessions").findOneAndDelete({ tokenHash: sessionHash(token) }, { projection: { userId: 1 } });
      if (session) await recordActivity("Dashboard", "Signed out", session.userId);
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(DASHBOARD_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch (error) { return dashboardError(error); }
}
