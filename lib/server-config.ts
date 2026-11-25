import { readJsonObject } from "@/lib/request-json.js";
import { recordActivity } from "@/lib/site-activity";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { authorizeGuild, DashboardError, dashboardError, requireSameOrigin } from "@/lib/dashboard-auth";
import { validateGreeting, defaultGreetings, validateServerConfig } from "@/lib/server-config-schema";

export async function handleServerConfig(request: NextRequest, guildId: string, admin = false) {
  let actor: string | undefined;
  try {
    if (request.method !== "GET") requireSameOrigin(request);
    const { userId, presence, canConfigureTripwire } = await authorizeGuild(request, guildId, admin);
    actor = userId;
    const db = await getDb();
    const collection = db.collection("server_configs");
    const roles = presence.roles || presence.assignableRoles || [];
    const channels = presence.channels || [];
    const rules = db.collection<{_id: string; channelId: string | null; action: string | null}>("tripwires");
    if (request.method === "PUT") {
      if (!canConfigureTripwire) throw new DashboardError("Server administrator permission required.", 403);
      const body = await readJsonObject(request, 2048);
      if (body instanceof Response) return body;
      const { channelId, action } = body;
      if (!(channelId === null && action === null) && !(typeof channelId === "string" && channels.some((channel: {id: string}) => channel.id === channelId) && typeof action === "string" && ["kick","ban","timeout"].includes(action))) throw new DashboardError("Choose a current text channel and action.");
      await rules.updateOne({ _id: guildId }, { $set: { channelId: channelId as string | null, action: action as string | null } }, { upsert: true });
      await recordActivity("Dashboard", "Updated tripwire", userId, guildId);
    }
    await collection.createIndex({ guildId: 1 }, { unique: true });
    const commands = (presence.configurableCommands || []) as string[];
    if (request.method === "PATCH") {
      const body = await readJsonObject(request, 64000);
      if (body instanceof Response) return body;
      let input;
      try {
        input = validateServerConfig(body, commands) as Record<string, unknown>;
        if (body.greetings !== undefined) {
          const greetings = body.greetings as Record<string, unknown>;
          if (!greetings || typeof greetings !== "object" || Array.isArray(greetings)) throw new Error("Invalid greetings.");
          for (const kind of ["welcome", "goodbye"]) {
            if (kind in greetings) input[`greetings.${kind}`] = validateGreeting(kind, greetings[kind], channels);
          }
          for (const field of ["autoRole", "botRole"]) {
            if (!(field in greetings)) continue;
            if (!canConfigureTripwire) throw new Error("Administrator permission is required to change automatic roles.");
            const role = greetings[field];
            if (role !== "" && !roles.some((r: {id: string; assignable?: boolean}) => r.id === role && r.assignable !== false)) throw new Error("Delta needs Manage Roles permission and its highest role must be above the selected role.");
            input[`greetings.${field}`] = role;
          }
        }
      }
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
    const config = await collection.findOne({ guildId }, { projection: { _id: 0, greetings: 1, source: 1, disabledCommands: 1, customBot: 1, nickname: 1, bio: 1, avatar: 1, banner: 1, displayNameFontID: 1, displayNameEffectID: 1, displayNameColors: 1, status: 1, error: 1, revision: 1 } });
    const settings = config || {
      source: presence.source || "ytsearch", disabledCommands: presence.disabledCommands || [],
      customBot: false, nickname: "", bio: "", avatar: "", banner: "", status: "applied"
    };
    const disabledCommands = (settings.disabledCommands || []).filter((name: string) => commands.includes(name));
    if (request.method === "GET" && request.headers.get("x-editor-open") === "1") await recordActivity("Dashboard", "Opened server configuration", userId, guildId);
    return NextResponse.json({ config: { displayNameFontID: 0, displayNameEffectID: 0, displayNameColors: [], ...settings, greetings: defaultGreetings(config?.greetings), disabledCommands }, commands, channels, roles, emojis: presence.emojis || [], memberCount: presence.memberCount || 0, canConfigureTripwire, tripwire: canConfigureTripwire ? await rules.findOne({ _id: guildId }) : null, serverName: presence.name },
      { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (actor && request.method === "PATCH") await recordActivity("Dashboard", "Settings request failed", actor, guildId);
    return dashboardError(error);
  }
}
