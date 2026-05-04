import { NextRequest, NextResponse } from "next/server";
import { deleteBugReport, updateBugReport } from "@/lib/mongodb";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await updateBugReport(id, body.status);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteBugReport(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
