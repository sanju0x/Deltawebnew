import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    await db.collection("premium_servers").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          serverId: body.serverId,
          serverName: body.serverName || null,
          planId: body.planId,
          expiresAt: new Date(body.expiresAt),
          features: body.features || [],
          addedBy: body.addedBy,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating premium server:", error);
    return NextResponse.json({ error: "Failed to update premium server" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const db = await getDb();

    await db.collection("premium_servers").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting premium server:", error);
    return NextResponse.json({ error: "Failed to delete premium server" }, { status: 500 });
  }
}
