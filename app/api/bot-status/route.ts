import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export type BotStatusType = "online" | "offline" | "maintenance";

export interface BotStatus {
  _id?: string;
  status: BotStatusType;
  message: string;
  updatedAt: Date;
}

export async function GET() {
  try {
    const db = await getDb();
    const status = await db.collection("bot_status").findOne({});

    if (!status) {
      // Return default status if none exists
      return NextResponse.json({
        status: "online",
        message: "Bot is running normally",
        updatedAt: new Date(),
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching bot status:", error);
    return NextResponse.json({ error: "Failed to fetch bot status" }, { status: 500 });
  }
}
