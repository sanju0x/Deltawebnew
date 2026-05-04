import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const partners = await db
      .collection("partners")
      .find({})
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
