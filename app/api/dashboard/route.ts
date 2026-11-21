import { recordActivity } from "@/lib/site-activity";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { dashboardError, dashboardSession, managedGuilds } from "@/lib/dashboard-auth";
import { getDiscordClientId } from "@/lib/admin-auth";
import { managementRole } from "@/lib/server-config-schema";

export async function GET(request: NextRequest) {
  try {
    const session = await dashboardSession(request);
    const guilds = await managedGuilds(session.accessToken);
    const present = await (await getDb()).collection("bot_guilds").find({ guildId: { $in: guilds.map((guild) => guild.id) }, seenAt: { $gt: new Date(Date.now() - 120000) } }).project({ guildId: 1 }).toArray();
    const ids = new Set(present.map((guild) => guild.guildId));
    const priority = ["Owner", "Administrator", "Manage Server"];
    const servers = guilds.map((guild) => ({
      id: guild.id, name: guild.name, icon: guild.icon, role: managementRole(guild), available: ids.has(guild.id),
    })).sort((a, b) => Number(b.available) - Number(a.available)
      || priority.indexOf(a.role!) - priority.indexOf(b.role!) || a.name.localeCompare(b.name));
    await recordActivity("Dashboard", "Opened server list", session.userId);
    return NextResponse.json({ clientId: getDiscordClientId(), user: { id: session.userId, name: session.username }, guilds: servers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return dashboardError(error); }
}
