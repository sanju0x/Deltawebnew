import { readAdminInput, teamInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";
import { normalizeTeamRoleCategory } from "@/lib/team-roles";

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
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, teamInput);
    if (body instanceof Response) return body;
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
      roleCategory: normalizeTeamRoleCategory(roleCategory),
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
