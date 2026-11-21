import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { authorizeGuild, DashboardError, dashboardError, requireSameOrigin } from "@/lib/dashboard-auth";
import { validateServerConfig } from "@/lib/server-config-schema";

export async function handleServerConfig(request: NextRequest, guildId: string, admin = false) {
  try {
    if (request.method === "PATCH") requireSameOrigin(request);
    const { userId, presence } = await authorizeGuild(request, guildId, admin);
    const collection = (await getDb()).collection("server_configs");
    await collection.createIndex({ guildId: 1 }, { unique: true });
    const commands = (presence.commands || []) as string[];
    if (request.method === "PATCH") {
      if (Number(request.headers.get("content-length")) > 20000) throw new DashboardError("Configuration is too large.", 413);
      let input;
      try { input = validateServerConfig(await request.json(), commands); }
      catch (error) { throw new DashboardError(error instanceof Error ? error.message : "Invalid configuration."); }
      const revision = randomUUID();
      await collection.updateOne({ guildId }, { $set: { ...input, revision, updatedBy: userId, updatedAt: new Date(), status: "pending", error: null }, $setOnInsert: { guildId } }, { upsert: true });
    }
    const config = await collection.findOne({ guildId }, { projection: { _id: 0 } });
    return NextResponse.json({ config: config || { source: presence.source || "ytsearch", disabledCommands: presence.disabledCommands || [], customBot: false, nickname: "", bio: "", avatar: "", banner: "", status: "applied" }, commands, serverName: presence.name }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return dashboardError(error); }
}
