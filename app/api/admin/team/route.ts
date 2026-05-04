import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const team = await db
      .collection("team")
      .find({})
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({ data: team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, avatar, avatarUrl, role, roleCategory, socialLink, order } = body;

    if (!name || !role || !roleCategory) {
      return NextResponse.json(
        { error: "Name, role, and roleCategory are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("team").insertOne({
      name,
      avatar: avatar || name.substring(0, 2).toUpperCase(),
      avatarUrl: avatarUrl || null,
      role,
      roleCategory,
      socialLink: socialLink || null,
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
