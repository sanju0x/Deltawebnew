import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export interface Update {
  _id?: string;
  title: string;
  content: string;
  version: string;
  createdAt: Date;
}

export interface UpdatesConfig {
  _id?: string;
  pageEnabled: boolean;
  updatedAt: Date;
}

export async function GET() {
  try {
    const db = await getDb();
    
    // Check if updates page is enabled
    const config = await db.collection("updates_config").findOne({});
    
    if (!config || !config.pageEnabled) {
      return NextResponse.json({ enabled: false, updates: [] });
    }

    const updates = await db
      .collection("updates")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ enabled: true, updates });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}
