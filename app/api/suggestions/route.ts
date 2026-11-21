import { submissionQuota } from "@/lib/submission-quota";
import { NextRequest, NextResponse } from "next/server";
import { DashboardError, dashboardError } from "@/lib/dashboard-auth";
import { readSubmission, submissionLimit } from "@/lib/public-submission";
import { getDb } from "@/lib/mongodb";

const limit = submissionLimit(6, 120);

export async function POST(request: NextRequest) {
  try {
    const body = await readSubmission(request, limit, 16000);
    if (body instanceof Response) return body;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > 2000) throw new DashboardError("Enter a suggestion of up to 2,000 characters.");
    const db = await getDb();
    const limited = await submissionQuota(db, "suggestions", 120);
    if (limited) return limited;
    await db.collection("site_activity").insertOne({ category: "Suggestion", title: "New user suggestion", message, createdAt: new Date() });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { return dashboardError(error); }
}
