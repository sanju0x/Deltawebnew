import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
    if (typeof body?.status !== "string" || !["open", "in_progress", "resolved", "closed"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid report status" }, { status: 400 });
    }
    const db = await getDb();
    const result = await db.collection("bug_reports").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: body.status, updated_at: new Date().toISOString() } }
    );
    if (!result.matchedCount) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    const db = await getDb();
    const result = await db.collection("bug_reports").deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
