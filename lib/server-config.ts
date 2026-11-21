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
    const commands = (presence.configurableCommands || []) as string[];
    if (request.method === "PATCH") {
      if (Number(request.headers.get("content-length")) > 20000) throw new DashboardError("Configuration is too large.", 413);
      let input;
      try { input = validateServerConfig(await request.json(), commands); }
      catch (error) { throw new DashboardError(error instanceof Error ? error.message : "Invalid configuration."); }
      const revision = randomUUID();
      const expected = request.headers.get("x-config-revision");
      const filter = expected === "initial" ? { guildId, revision: { $exists: false } } : expected ? { guildId, revision: expected } : { guildId };
      try {
        const result = await collection.updateOne(filter, {
          $set: { ...input, ...(input.language ? { languageRevision: revision } : {}), revision, updatedBy: userId, updatedAt: new Date(), status: "pending", error: null },
          $setOnInsert: { guildId }
        }, { upsert: !expected || expected === "initial" });
        if (expected && !result.matchedCount && !result.upsertedCount) throw new DashboardError("Settings changed in another dashboard. Reload before saving.", 409);
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new DashboardError("Settings changed in another dashboard. Reload before saving.", 409);
        throw error;
      }
    }
    const config = await collection.findOne({ guildId }, { projection: { _id: 0 } });
    const language = config?.languageRevision && config.languageRevision !== presence.languageRevision
      ? config.language : presence.language || "en";
    const settings = config || {
      source: presence.source || "ytsearch", disabledCommands: presence.disabledCommands || [],
      customBot: false, nickname: "", bio: "", avatar: "", banner: "", status: "applied"
    };
    const disabledCommands = (settings.disabledCommands || []).filter((name: string) => commands.includes(name));
    return NextResponse.json({ config: { ...settings, language, disabledCommands }, commands, serverName: presence.name },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return dashboardError(error); }
}
