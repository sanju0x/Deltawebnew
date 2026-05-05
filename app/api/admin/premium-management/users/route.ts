import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
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
