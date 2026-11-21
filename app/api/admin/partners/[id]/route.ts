import { readAdminInput, partnerInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { adminWriteError } from "@/lib/admin-access";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await readAdminInput(request, partnerInput.partial());
    if (body instanceof Response) return body;

    const db = await getDb();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    const allowedFields = [
      "name",
      "description",
      "logo",
      "iconUrl",
      "bannerUrl",
      "website",
      "inviteLink",
      "members",
      "type",
      "features",
      "order",
    ] as const;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await db.collection("partners").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const db = await getDb();
    await db.collection("partners").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Failed to delete partner" },
      { status: 500 }
    );
  }
}
