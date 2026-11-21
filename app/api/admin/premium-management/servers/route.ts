import { readAdminInput, serverInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, serverInput);
    if (body instanceof Response) return body;
    const db = await getDb();

    const result = await db.collection("premium_servers").insertOne({
      serverId: body.serverId,
      serverName: body.serverName || null,
      planId: body.planId,
      expiresAt: new Date(body.expiresAt),
      features: body.features || [],
      addedBy: body.addedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error adding premium server:", error);
    return NextResponse.json({ error: "Failed to add premium server" }, { status: 500 });
  }
}
