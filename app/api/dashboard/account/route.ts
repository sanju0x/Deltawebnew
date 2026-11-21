import { NextRequest, NextResponse } from "next/server";
import { dashboardError, dashboardSession } from "@/lib/dashboard-auth";

export async function GET(request: NextRequest) {
  try {
    const session = await dashboardSession(request);
    return NextResponse.json({
      id: session.userId,
      name: session.username,
      avatar: session.avatar ?? null,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const response = dashboardError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
