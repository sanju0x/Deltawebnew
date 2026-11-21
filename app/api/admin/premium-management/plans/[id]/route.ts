import { readAdminInput, planInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const body = await readAdminInput(request, planInput);
    if (body instanceof Response) return body;
    const db = await getDb();

    await db.collection("premium_plans_config").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: body.name,
          price: body.price,
          duration: body.duration,
          features: body.features || [],
          color: body.color,
          popular: body.popular || false,
          order: body.order || 0,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating premium plan:", error);
    return NextResponse.json({ error: "Failed to update premium plan" }, { status: 500 });
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

    await db.collection("premium_plans_config").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting premium plan:", error);
    return NextResponse.json({ error: "Failed to delete premium plan" }, { status: 500 });
  }
}
