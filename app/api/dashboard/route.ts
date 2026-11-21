import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { dashboardError, dashboardSession, managedGuilds } from "@/lib/dashboard-auth";
import { getDiscordClientId } from "@/lib/admin-auth";
export async function GET(request: NextRequest) {
  try {
    const session = await dashboardSession(request);
    const guilds = await managedGuilds(session.accessToken);
    const present = await (await getDb()).collection("bot_guilds").find({ guildId: { $in: guilds.map((guild) => guild.id) }, seenAt: { $gt: new Date(Date.now() - 120000) } }).project({ guildId: 1 }).toArray();
    const ids = new Set(present.map((guild) => guild.guildId));
    return NextResponse.json({ clientId: getDiscordClientId(), user: { id: session.userId, name: session.username }, guilds: guilds.map((guild) => ({ id: guild.id, name: guild.name, icon: guild.icon, available: ids.has(guild.id) })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return dashboardError(error); }
}
