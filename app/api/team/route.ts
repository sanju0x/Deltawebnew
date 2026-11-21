import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const team = await db
      .collection("team")
      .find({})
      .project({ name: 1, avatar: 1, avatarUrl: 1, role: 1, roleCategory: 1, socialLink: 1, order: 1 })
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
