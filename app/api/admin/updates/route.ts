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
    const updates = await db.collection("updates").find({}).sort({ createdAt: -1 }).toArray();
    const config = await db.collection("updates_config").findOne({});

    return NextResponse.json({
      updates,
      pageEnabled: config?.pageEnabled ?? true,
    });
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, version } = body;

    if (!title || !content || !version) {
      return NextResponse.json({ error: "Title, content, and version are required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("updates").insertOne({
      title,
      content,
      version,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error creating update:", error);
    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}
