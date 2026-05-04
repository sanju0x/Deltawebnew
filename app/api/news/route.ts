import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const news = await db
      .collection("news")
      .find({ active: true })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    return NextResponse.json(news[0] || null);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
