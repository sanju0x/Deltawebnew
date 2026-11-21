import { readAdminInput, userInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, userInput);
    if (body instanceof Response) return body;
    const db = await getDb();

    const result = await db.collection("premium_users").insertOne({
      discordId: body.discordId,
      discordUsername: body.discordUsername || null,
      planId: body.planId,
      expiresAt: new Date(body.expiresAt),
      features: body.features || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error adding premium user:", error);
    return NextResponse.json({ error: "Failed to add premium user" }, { status: 500 });
  }
}
