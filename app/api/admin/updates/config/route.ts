import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pageEnabled } = body;

    const db = await getDb();
    await db.collection("updates_config").updateOne(
      {},
      {
        $set: {
          pageEnabled: !!pageEnabled,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating updates config:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
