import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";
import { DashboardError, dashboardError } from "@/lib/dashboard-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!user || !getAllowedDiscordUserIds().has(user)) throw new DashboardError("Unauthorized.", 401);
    const db = await getDb();
    const snapshots = await db.collection("bot_runtime")
      .find({ seenAt: { $gte: new Date(Date.now() - 86400000) } }, { projection: { _id: 0, cluster: 1, seenAt: 1, nodes: 1, shards: 1 } })
      .sort({ cluster: 1 }).toArray();
    return NextResponse.json({ snapshots }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return dashboardError(error); }
}
