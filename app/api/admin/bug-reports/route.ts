import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const db = await getDb();
    const query: Record<string, string> = {};
    if (status && status !== "all") query.status = status;
    if (severity && severity !== "all") query.severity = severity;
    const reports = await db
      .collection("bug_reports")
      .find(query)
      .sort({ created_at: -1 })
      .toArray();
    const data = reports.map((report) => ({ ...report, id: report._id.toString() }));
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
