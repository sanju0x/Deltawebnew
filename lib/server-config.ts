import { readJsonObject } from "@/lib/request-json.js";
import { recordActivity } from "@/lib/site-activity";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { authorizeGuild, DashboardError, dashboardError, requireSameOrigin } from "@/lib/dashboard-auth";
import { validateServerConfig } from "@/lib/server-config-schema";

export async function handleServerConfig(request: NextRequest, guildId: string, admin = false) {
  let actor: string | undefined;
  try {
    if (request.method === "PATCH") requireSameOrigin(request);
    const { userId, presence } = await authorizeGuild(request, guildId, admin);
    actor = userId;
    const collection = (await getDb()).collection("server_configs");
    await collection.createIndex({ guildId: 1 }, { unique: true });
    const commands = (presence.configurableCommands || []) as string[];
    if (request.method === "PATCH") {
      const body = await readJsonObject(request, 20000);
      if (body instanceof Response) return body;
      let input;
      try { input = validateServerConfig(body, commands); }
      catch (error) { throw new DashboardError(error instanceof Error ? error.message : "Invalid configuration."); }
      const revision = randomUUID();
      const expected = request.headers.get("x-config-revision");
      const filter = expected === "initial" ? { guildId, revision: { $exists: false } } : expected ? { guildId, revision: expected } : { guildId };
      try {
        const result = await collection.updateOne(filter, {
          $set: { ...input, revision, updatedBy: userId, updatedAt: new Date(), status: "pending", error: null },
          $setOnInsert: { guildId }
        }, { upsert: !expected || expected === "initial" });
        if (expected && !result.matchedCount && !result.upsertedCount) throw new DashboardError("Settings changed in another dashboard. Reload before saving.", 409);
      } catch (error) {
        if ((error as { code?: number }).code === 11000) throw new DashboardError("Settings changed in another dashboard. Reload before saving.", 409);
        throw error;
      }
      await recordActivity("Dashboard", "Saved settings for bot sync", userId, guildId);
    }
    const config = await collection.findOne({ guildId }, { projection: { _id: 0, source: 1, disabledCommands: 1, customBot: 1, nickname: 1, bio: 1, avatar: 1, banner: 1, status: 1, error: 1, revision: 1 } });
    const settings = config || {
      source: presence.source || "ytsearch", disabledCommands: presence.disabledCommands || [],
      customBot: false, nickname: "", bio: "", avatar: "", banner: "", status: "applied"
    };
    const disabledCommands = (settings.disabledCommands || []).filter((name: string) => commands.includes(name));
    if (request.method === "GET" && request.headers.get("x-editor-open") === "1") await recordActivity("Dashboard", "Opened server configuration", userId, guildId);
    return NextResponse.json({ config: { ...settings, disabledCommands }, commands, serverName: presence.name },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (actor && request.method === "PATCH") await recordActivity("Dashboard", "Settings request failed", actor, guildId);
    return dashboardError(error);
  }
}
