import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

const collectionMap: Record<string, string> = {
  features: "premium_features",
  plans: "premium_plans",
  comparisons: "premium_comparisons",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string; id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collection, id } = await params;
    const collectionName = collectionMap[collection];

    if (!collectionName) {
      return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
    }

    const body = await request.json();
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
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { collection, id } = await params;
    const collectionName = collectionMap[collection];

    if (!collectionName) {
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
