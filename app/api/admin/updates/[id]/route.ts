import { readAdminInput, updateInput } from "@/lib/admin-input";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { adminWriteError } from "@/lib/admin-access";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await readAdminInput(request, updateInput);
    if (body instanceof Response) return body;
    const { title, content, version } = body;

    const db = await getDb();
    await db.collection("updates").updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, content, version, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating update:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const db = await getDb();
    await db.collection("updates").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting update:", error);
    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
