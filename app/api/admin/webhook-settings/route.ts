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

    const settings = await db.collection("webhook_settings").findOne({ type: "visitor_tracking" });
    const logs = await db.collection("visitor_logs").find({}).sort({ visitedAt: -1 }).limit(100).toArray();

    return NextResponse.json({ settings, logs });
  } catch (error) {
    console.error("Error fetching webhook settings:", error);
    return NextResponse.json({ error: "Failed to fetch webhook settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { settings } = await request.json();
    const db = await getDb();

    await db.collection("webhook_settings").updateOne(
      { type: "visitor_tracking" },
      {
        $set: {
          ...settings,
          type: "visitor_tracking",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving webhook settings:", error);
    return NextResponse.json({ error: "Failed to save webhook settings" }, { status: 500 });
  }
}
