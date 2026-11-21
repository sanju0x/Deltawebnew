import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookieOptions, DASHBOARD_COOKIE, dashboardError, requireSameOrigin, sessionHash } from "@/lib/dashboard-auth";
export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const token = request.cookies.get(DASHBOARD_COOKIE)?.value;
    if (token) await (await getDb()).collection("dashboard_sessions").deleteOne({ tokenHash: sessionHash(token) });
    const response = NextResponse.json({ success: true });
    response.cookies.set(DASHBOARD_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch (error) { return dashboardError(error); }
}
