import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const status = await db.collection("bot_status").findOne({});

    if (!status) {
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

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, message } = body;

    if (!status || !["online", "offline", "maintenance"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("bot_status").updateOne(
      {},
      {
        $set: {
          status,
          message: message || "",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating bot status:", error);
    return NextResponse.json({ error: "Failed to update bot status" }, { status: 500 });
  }
}
