import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { normalizeTeamRoleCategory } from "@/lib/team-roles";

type ReorderItem = {
  id?: string;
  roleCategory?: string;
  order?: number;
};

async function verifyAdmin() {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("admin_session")?.value);
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { members?: ReorderItem[] };
    if (!Array.isArray(body.members) || body.members.length === 0 || body.members.length > 250) {
      return NextResponse.json({ error: "A valid member order is required" }, { status: 400 });
    }

    const members = body.members.map((member) => {
      if (!member.id || !ObjectId.isValid(member.id) || typeof member.roleCategory !== "string" || typeof member.order !== "number" || !Number.isInteger(member.order) || member.order < 0) {
        throw new Error("Invalid reorder item");
      }

      return {
        id: new ObjectId(member.id),
        roleCategory: normalizeTeamRoleCategory(member.roleCategory),
        order: member.order,
      };
    });

    const db = await getDb();
    await db.collection("team").bulkWrite(
      members.map((member) => ({
        updateOne: {
          filter: { _id: member.id },
          update: {
            $set: {
              roleCategory: member.roleCategory,
              order: member.order,
              updatedAt: new Date(),
            },
          },
        },
      })),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering team:", error);
    return NextResponse.json({ error: "Failed to reorder team members" }, { status: 400 });
  }
}
