import { readJsonObject } from "../lib/request-json.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import schema from "../lib/server-config-schema.js";
import * as dashboardToken from "../lib/dashboard-token.ts";

const guildId = "111111111111111111";
const userId = "222222222222222222";
const token = "a".repeat(64);
const valid = { source: "spsearch", disabledCommands: ["warn"], customBot: false, nickname: "", bio: "", avatar: "", banner: "" };
async function setup({ signedIn = true, permissions = "32", adminId = null, allowAdmin = false, offline = false, discordStatus = 200, guilds, roles, presentIds = [guildId] } = {}) {
  let tripwire = null;
  let saved = null, writes = 0, permissionChecks = 0;
  const session = { userId, username: "Listener", avatar: "avatar-hash", accessToken: "server-only-token", expiresAt: new Date(Date.now() + 60000) };
  const context = createContext({ Response, URL, Date, Headers, AbortSignal, console: { error() {} }, process: { env: { WEBSITE_URL: "https://delta.example" } },
    fetch: async (url, options) => {
      permissionChecks++;
      assert.equal(options.headers.Authorization, "Bearer server-only-token");
      return Response.json(guilds ?? [{ id: guildId, name: "Test server", permissions, owner: false }], { status: discordStatus });
    }
  });
  const deps = {
    "@/lib/beta-tester": { discordBetaTester: async () => false },
    "@/lib/dashboard-token": dashboardToken,
    "@/lib/site-activity": { recordActivity: async () => {} },
    "node:crypto": { createHash, randomBytes, randomUUID },
    "@/lib/request-json.js": { readJsonObject },
    "next/server": { NextRequest: class {}, NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/admin-auth": { getDiscordClientId: () => "client", ADMIN_SESSION_COOKIE: "admin_session", getAdminSessionUserId: async () => adminId, getAllowedDiscordUserIds: () => new Set(allowAdmin && adminId ? [adminId] : []) },
    "@/lib/server-config-schema": schema,
    "@/lib/mongodb": { getDb: async () => ({ collection: (name) => {
      if (name === "tripwires") return { findOne: async () => tripwire, updateOne: async (filter, update) => { assert.equal(filter._id, guildId); tripwire = update.$set; } };
      if (name === "bot_blacklist") return { findOne: async () => null };
      if (name === "dashboard_sessions") return { findOne: async (filter) => signedIn && filter.tokenHash === createHash("sha256").update(token).digest("hex") ? session : null };
      if (name === "bot_guilds") return { find: () => ({ project: () => ({ toArray: async () => presentIds.map(id => ({ guildId: id })) }) }), findOne: async () => offline ? null : { name: "Test server", roles, channels: [{ id: "333333333333333333", name: "tripwire" }], configurableCommands: ["warn"], source: "ytsearch", disabledCommands: [] } };
      if (name === "server_configs") return { createIndex: async () => {}, findOne: async () => saved,
        updateOne: async (filter, update) => { writes++; assert.equal(filter.guildId, guildId); saved = { ...saved, ...update.$setOnInsert };
          for (const [path, value] of Object.entries(update.$set)) {
            if (path.startsWith("greetings.")) (saved.greetings ??= {})[path.slice("greetings.".length)] = value;
            else saved[path] = value;
          } } };
      throw new Error(`Unexpected collection ${name}`);
    } }) }
  };
  const modules = new Map();
  for (const [name, exports] of Object.entries(deps)) modules.set(name, new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context }));
  for (const name of ["dashboard-auth", "server-config"]) {
    const source = stripTypeScriptTypes(await readFile(new URL(`../lib/${name}.ts`, import.meta.url), "utf8"), { mode: "transform" });
    modules.set(`@/lib/${name}`, new SourceTextModule(source, { context }));
  }
  const entry = modules.get("@/lib/server-config");
  await entry.link((specifier) => { assert.ok(modules.has(specifier), specifier); return modules.get(specifier); });
  await entry.evaluate();
  return {
    async getDashboard(path = "") {
      const source = await readFile(new URL(`../app/api/dashboard/${path}route.ts`, import.meta.url), "utf8");
      const route = new SourceTextModule(stripTypeScriptTypes(source, { mode: "transform" }), { context });
      await route.link(specifier => modules.get(specifier));
      await route.evaluate();
      return route.namespace.GET({ cookies: { get: () => ({ value: token }) } });
    },
    request: (body = valid, { admin = false, origin = "https://delta.example", method = "PATCH", cookie = token } = {}) => entry.namespace.handleServerConfig({
      method, nextUrl: new URL("https://delta.example/api/dashboard/servers/" + guildId), cookies: { get: () => cookie ? { value: cookie } : undefined }, headers: new Headers({ origin, "content-type": "application/json" }), body: new Response(JSON.stringify(body)).body,
    }, guildId, admin),
    get writes() { return writes; }, get saved() { return saved; }, get permissionChecks() { return permissionChecks; }
  };
}
test("fresh Discord Manage Server permission allows saving only the chosen guild", async () => {
  const app = await setup();
  const response = await app.request({ ...valid, updatedBy: "spoof", guildId: "spoof", appliedRevision: "spoof" });
  assert.equal(response.status, 200);
  assert.equal(app.permissionChecks, 1);
  assert.equal(app.saved.guildId, guildId);
  assert.equal(app.saved.updatedBy, userId);
  assert.equal(app.saved.status, "pending");
  assert.equal(app.saved.appliedRevision, undefined);
});

test("moderation settings save for the authorized guild, retain defaults and reject foreign channel IDs", async () => {
  const app = await setup();
  const moderation = { logChannelId: "333333333333333333", automod: { enabled: true, action: "timeout", blockedWords: ["Spam"], blockLinks: true, blockEveryone: true, blockDuplicates: true, spamMessageLimit: 4, spamWindowSeconds: 8, duplicateLimit: 3, capsPercent: 70, capsMinLength: 15, wordMatchMode: "whole" } };
  const response = await app.request({ ...valid, moderation });
  assert.equal(response.status, 200);
  assert.equal(app.saved.moderation.automod.enabled, true);
  assert.deepEqual(app.saved.moderation.automod.blockedWords, ["spam"]);
  assert.equal(app.saved.moderation.automod.timeoutSeconds, 600);
  for (const key of ["blockLinks", "blockEveryone", "blockDuplicates", "spamMessageLimit", "spamWindowSeconds", "duplicateLimit", "capsPercent", "capsMinLength", "wordMatchMode"]) assert.equal(app.saved.moderation.automod[key], moderation.automod[key]);
  const settings = await response.json();
  assert.equal(settings.config.moderation.logChannelId, "333333333333333333");
  assert.deepEqual(settings.config.moderation.automod, app.saved.moderation.automod);
  const before = app.writes;
  assert.equal((await app.request({ ...valid, moderation: { ...moderation, logChannelId: "999999999999999999" } })).status, 400);
  assert.equal((await app.request({ ...valid, moderation: { automod: { exemptChannels: ["999999999999999999"] } } })).status, 400);
  assert.equal((await app.request({ ...valid, moderation: { automod: { timeoutSeconds: 2419201 } } })).status, 400);
  assert.equal((await app.request({ ...valid, moderation: { automod: { spamWindowSeconds: 31 } } })).status, 400);
  assert.equal(app.writes, before);
});

test("unauthorized users cannot enable automod", async () => {
  const app = await setup({ permissions: "0" });
  assert.equal((await app.request({ ...valid, moderation: { automod: { enabled: true } } })).status, 403);
  assert.equal(app.writes, 0);
});
test("missing, expired, and revoked sessions cannot read or write settings", async () => {
  for (const options of [{ signedIn: false }, { permissions: "0" }, { discordStatus: 401 }]) {
    const app = await setup(options);
    for (const method of ["GET", "PATCH"]) assert.ok([401, 403].includes((await app.request(valid, { method })).status));
    assert.equal(app.writes, 0);
  }
});
test("cross-origin saves and offline guilds cannot change configuration", async () => {
  const app = await setup();
  assert.equal((await app.request(valid, { origin: "https://attacker.example" })).status, 403);
  assert.equal(app.writes, 0);
  assert.equal(app.permissionChecks, 0);
  const offline = await setup({ offline: true });
  assert.equal((await offline.request()).status, 409);
  assert.equal(offline.writes, 0);
});
test("admin settings require a verified allowlisted admin, independently of dashboard login", async () => {
  for (const options of [{ adminId: null, allowAdmin: true }, { adminId: userId, allowAdmin: false }]) {
    const app = await setup(options);
    assert.equal((await app.request(valid, { admin: true })).status, 401);
    assert.equal(app.writes, 0);
  }
  const admin = await setup({ signedIn: false, adminId: userId, allowAdmin: true, permissions: "0" });
  assert.equal((await admin.request(valid, { admin: true })).status, 200);
  assert.equal(admin.permissionChecks, 0);
});
test("invalid commands or image links fail before MongoDB writes", async () => {
  const app = await setup();
  for (const body of [{ ...valid, disabledCommands: ["restart"] }, { ...valid, avatar: "https://127.0.0.1/" }, { ...valid, source: "unrecognized" }]) assert.equal((await app.request(body)).status, 400);
  assert.equal(app.writes, 0);
});

test("server list filters by effective Discord permissions and prioritizes ready servers", async () => {
  const guilds = [
    { id: "offline", name: "Offline", owner: true },
    { id: "member", name: "Member", permissions: "0" },
    { id: "manager", name: "Manager", permissions: "32" },
    { id: "admin", name: "Admin", permissions: "40" },
    { id: "owner", name: "Owner", owner: true },
  ];
  const app = await setup({ guilds, presentIds: ["member", "manager", "admin", "owner"] });
  const response = await app.getDashboard();
  assert.equal(response.status, 200);
  const { guilds: servers } = await response.json();
  assert.deepEqual(servers.map(({ id, role, available }) => [id, role, available]), [
    ["owner", "Owner", true], ["admin", "Administrator", true],
    ["manager", "Manage Server", true], ["offline", "Owner", false],
  ]);
});
test("account menu returns only display identity and skips the guild lookup", async () => {
  const app = await setup();
  const response = await app.getDashboard("account/");
  assert.deepEqual(await response.json(), { id: userId, name: "Listener", avatar: "avatar-hash" });
  assert.match(response.headers.get("Cache-Control"), /no-store/);
  assert.equal(app.permissionChecks, 0);
  const visitor = await setup({ signedIn: false });
  assert.equal((await visitor.getDashboard("account/")).status, 401);
});

test("tripwire writes require administrator access and a channel belonging to the selected guild", async () => {
  const rule = { channelId: "333333333333333333", action: "ban" };
  const manager = await setup();
  assert.equal((await manager.request(rule, { method: "PUT" })).status, 403);
  const admin = await setup({ permissions: "8" });
  assert.equal((await admin.request({ ...rule, channelId: guildId }, { method: "PUT" })).status, 400);
  assert.equal((await admin.request({ ...rule, action: "other" }, { method: "PUT" })).status, 400);
  assert.equal((await admin.request(rule, { method: "PUT", origin: "https://other.example" })).status, 403);
  const result = await admin.request(rule, { method: "PUT" });
  assert.equal(result.status, 200);
  assert.deepEqual((await result.json()).tripwire, rule);
  assert.equal((await admin.request({ channelId: null, action: null }, { method: "PUT" })).status, 200);
});

test("greetings are opt-in and independent across saves, with administrator-only role writes", async () => {
  const app = await setup();
  const defaults = (await (await app.request(valid, { method: "GET" })).json()).config.greetings;
  assert.equal(defaults.welcome.enabled, false);
  assert.equal(defaults.goodbye.enabled, false);
  const welcome = { ...defaults.welcome, channelId: "333333333333333333", canvas: false, enabled: true };
  const save = greetings => app.request({ ...valid, greetings });
  assert.equal((await save({ welcome })).status, 200);
  assert.deepEqual(app.saved.greetings.welcome, welcome);
  assert.equal((await save({ goodbye: { ...defaults.goodbye, enabled: true } })).status, 400);
  assert.equal((await save({ autoRole: "333333333333333333" })).status, 400);
  assert.equal((await app.request()).status, 200);
  assert.deepEqual(app.saved.greetings.welcome, welcome);
});


test("automatic roles list includes hierarchy warnings and rejects roles Delta cannot assign", async () => {
  const roles = [{ id: "lower", name: "Member", assignable: true }, { id: "higher", name: "Moderator", assignable: false }];
  const app = await setup({ permissions: "8", roles });
  const data = await (await app.request(valid, { method: "GET" })).json();
  assert.deepEqual(data.roles, roles);
  const rejected = await app.request({ ...valid, greetings: { autoRole: "higher" } });
  assert.equal(rejected.status, 400);
  assert.match((await rejected.json()).error, /highest role must be above/);
  assert.equal(app.writes, 0);
  assert.equal((await app.request({ ...valid, greetings: { autoRole: "lower", botRole: "lower" } })).status, 200);
  assert.equal(app.saved.greetings.autoRole, "lower");
  assert.equal(app.saved.greetings.botRole, "lower");
});
