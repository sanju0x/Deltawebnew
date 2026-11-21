import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";
import { DashboardError, dashboardError, requireSameOrigin } from "@/lib/dashboard-auth";

async function authorize(request: NextRequest) {
  const id = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!id || !getAllowedDiscordUserIds().has(id)) throw new DashboardError("Unauthorized.", 401);
}
export async function GET(request: NextRequest) {
  try {
    await authorize(request);
    const db = await getDb();
    const section = request.nextUrl.searchParams.get("section");
    if (section === "analytics") {
      const groups = await Promise.all(["user", "command", "song", "server"].map(async kind => [
        kind, await db.collection("bot_usage").find({ kind }).sort({ count: -1, _id: 1 }).limit(10).toArray()
      ]));
      return NextResponse.json({ groups: Object.fromEntries(groups) });
    }
    if (section !== "blacklist" && section !== "activity") throw new DashboardError("Invalid section.");
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    if (!Number.isInteger(page) || page < 1 || page > 1000000) throw new DashboardError("Invalid page.");
    const rows = await db.collection(section === "blacklist" ? "bot_blacklist" : "bot_flags").find({})
      .sort(section === "blacklist" ? { _id: 1 } : { lastSeen: -1, _id: 1 }).skip((page - 1) * 25).limit(26).toArray();
    return NextResponse.json({ rows: rows.slice(0, 25), more: rows.length > 25 });
  } catch (error) { return dashboardError(error); }
}
export async function POST(request: NextRequest) {
  try {
    await authorize(request);
    requireSameOrigin(request);
    const { action, kind, id } = await request.json();
    if (!["add", "remove"].includes(action) || !["user", "server"].includes(kind) || typeof id !== "string" || !/^\d{17,20}$/.test(id)) throw new DashboardError("Choose a user or server and enter a valid Discord ID.");
    const db = await getDb();
    const key = { _id: kind + ":" + id };
    const entries = db.collection<{ _id: string; kind: string; id: string; name: string; username: string; image: string; lookupAfter?: Date }>("bot_blacklist");
    if (action === "remove") await entries.deleteOne(key);
    else {
      const profile = kind === "server" ? await db.collection("bot_guilds").findOne({ guildId: id })
        : await db.collection<{ _id: string; name: string; username: string; image: string }>("bot_usage").findOne(key);
      await entries.updateOne(key, { $setOnInsert: { kind, id, name: profile?.name || id, username: profile?.username || "", image: profile?.image || "", ...(!profile ? { lookupAfter: new Date() } : {}) } }, { upsert: true });
    }
    return NextResponse.json({ ok: true });
  } catch (error) { return dashboardError(error); }
}
