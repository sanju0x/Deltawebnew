import { NextRequest, NextResponse } from "next/server";
import { findBugReports } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const severity = request.nextUrl.searchParams.get("severity");
    const filter: Record<string, string> = {};
    if (status && status !== "all") filter.status = status;
    if (severity && severity !== "all") filter.severity = severity;
    const result = await findBugReports(filter);
    const data = (result.documents || []).map((report: Record<string, unknown>) => {
      const oid = (report._id as { $oid?: string })?.$oid;
      return { ...report, id: oid || "" };
    });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
