import { readAdminInput, updateInput } from "@/lib/admin-input";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyAdmin, adminWriteError } from "@/lib/admin-access";

export async function GET() {
  if (!(await verifyAdmin())) {
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
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, updateInput);
    if (body instanceof Response) return body;
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
