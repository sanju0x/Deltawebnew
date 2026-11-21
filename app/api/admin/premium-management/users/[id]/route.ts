import { readAdminInput, userInput } from "@/lib/admin-input";
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
    const body = await readAdminInput(request, userInput);
    if (body instanceof Response) return body;
    const db = await getDb();

    await db.collection("premium_users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          discordId: body.discordId,
          discordUsername: body.discordUsername || null,
          planId: body.planId,
          expiresAt: new Date(body.expiresAt),
          features: body.features || [],
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating premium user:", error);
    return NextResponse.json({ error: "Failed to update premium user" }, { status: 500 });
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

    await db.collection("premium_users").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting premium user:", error);
    return NextResponse.json({ error: "Failed to delete premium user" }, { status: 500 });
  }
}
