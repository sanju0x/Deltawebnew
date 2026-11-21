import { readAdminInput, premiumItemInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { adminWriteError } from "@/lib/admin-access";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

const collectionMap: Record<string, string> = {
  features: "premium_features",
  plans: "premium_plans",
  comparisons: "premium_comparisons",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { collection, id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const collectionName = collectionMap[collection];

    if (!Object.hasOwn(collectionMap, collection)) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }

    const body = await readAdminInput(request, premiumItemInput);
    if (body instanceof Response) return body;
    const db = await getDb();

    await db.collection(collectionName).updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating premium item:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { collection, id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const collectionName = collectionMap[collection];

    if (!Object.hasOwn(collectionMap, collection)) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting premium item:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
