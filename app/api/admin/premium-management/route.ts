import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";

import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const id = await getAdminSessionUserId(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  return !!id && getAllowedDiscordUserIds().has(id);
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

    const guilds = await db.collection("bot_guilds").find({ seenAt: { $gt: new Date(Date.now() - 120000) } })
      .project({ _id: 0, guildId: 1, name: 1, image: 1 }).sort({ name: 1 }).toArray();
    return NextResponse.json({ users, servers, plans, guilds });
  } catch (error) {
    console.error("Error fetching premium data:", error);
    return NextResponse.json({ error: "Failed to fetch premium data" }, { status: 500 });
  }
}
