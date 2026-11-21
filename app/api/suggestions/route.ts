import { NextRequest, NextResponse } from "next/server";
import { DashboardError, dashboardError, requireSameOrigin } from "@/lib/dashboard-auth";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    if (Number(request.headers.get("content-length")) > 16000) throw new DashboardError("Suggestion is too long.", 413);
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 2000) throw new DashboardError("Enter a suggestion of up to 2,000 characters.");
    const db = await getDb();
    await db.collection("site_activity").insertOne({ category: "Suggestion", title: "New user suggestion", message, createdAt: new Date() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return dashboardError(error); }
}
