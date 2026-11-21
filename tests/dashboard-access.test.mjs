import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import schema from "../lib/server-config-schema.js";

const guildId = "111111111111111111";
const userId = "222222222222222222";
const token = "a".repeat(64);
const valid = { source: "spsearch", disabledCommands: ["play"], customBot: false, nickname: "", bio: "", avatar: "", banner: "" };
async function setup({ signedIn = true, permissions = "32", adminId = null, allowAdmin = false, offline = false, discordStatus = 200 } = {}) {
  let saved = null, writes = 0, permissionChecks = 0;
  const session = { userId, accessToken: "server-only-token", expiresAt: new Date(Date.now() + 60000) };
  const context = createContext({ URL, Date, Headers, AbortSignal, console: { error() {} }, process: { env: { WEBSITE_URL: "https://delta.example" } },
    fetch: async (url, options) => {
      permissionChecks++;
      assert.equal(options.headers.Authorization, "Bearer server-only-token");
      return Response.json([{ id: guildId, name: "Test server", permissions, owner: false }], { status: discordStatus });
    }
  });
  const deps = {
    "node:crypto": { createHash, randomBytes, randomUUID },
    "next/server": { NextRequest: class {}, NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/admin-auth": { ADMIN_SESSION_COOKIE: "admin_session", getAdminSessionUserId: async () => adminId, getAllowedDiscordUserIds: () => new Set(allowAdmin && adminId ? [adminId] : []) },
    "@/lib/server-config-schema": schema,
    "@/lib/mongodb": { getDb: async () => ({ collection: (name) => {
      if (name === "dashboard_sessions") return { findOne: async (filter) => signedIn && filter.tokenHash === createHash("sha256").update(token).digest("hex") ? session : null };
      if (name === "bot_guilds") return { findOne: async () => offline ? null : { name: "Test server", commands: ["play"], source: "ytsearch", disabledCommands: [] } };
      if (name === "server_configs") return { createIndex: async () => {}, findOne: async () => saved,
        updateOne: async (filter, update) => { writes++; assert.equal(filter.guildId, guildId); saved = { ...update.$set, ...update.$setOnInsert }; } };
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
    request: (body = valid, { admin = false, origin = "https://delta.example", method = "PATCH", cookie = token } = {}) => entry.namespace.handleServerConfig({
      method, nextUrl: { origin: "https://delta.example" }, cookies: { get: () => cookie ? { value: cookie } : undefined }, headers: new Headers({ origin }), json: async () => body,
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
