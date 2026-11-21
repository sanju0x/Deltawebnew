import { readAdminInput, newsInput } from "@/lib/admin-input";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyAdmin, adminWriteError } from "@/lib/admin-access";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const news = await db.collection("news").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, newsInput);
    if (body instanceof Response) return body;
    const { title, content, active } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const db = await getDb();
    
    // If this news is active, deactivate all others
    if (active) {
      await db.collection("news").updateMany({}, { $set: { active: false } });
    }

    const result = await db.collection("news").insertOne({
      title,
      content,
      active: active ?? true,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error creating news:", error);
    return NextResponse.json({ error: "Failed to create news" }, { status: 500 });
  }
}
