import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const partners = await db
      .collection("partners")
      .find({})
      .project({ name: 1, description: 1, logo: 1, iconUrl: 1, bannerUrl: 1, website: 1,
        inviteLink: 1, members: 1, type: 1, features: 1, order: 1, createdAt: 1 })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ data: partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}
