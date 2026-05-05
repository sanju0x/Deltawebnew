import { NextResponse } from "next/server";
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

    const users = await db.collection("premium_users").find({}).sort({ createdAt: -1 }).toArray();
    const servers = await db.collection("premium_servers").find({}).sort({ createdAt: -1 }).toArray();
    const plans = await db.collection("premium_plans_config").find({}).sort({ order: 1 }).toArray();

    return NextResponse.json({ users, servers, plans });
  } catch (error) {
    console.error("Error fetching premium data:", error);
    return NextResponse.json({ error: "Failed to fetch premium data" }, { status: 500 });
  }
}
