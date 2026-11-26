import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const guildId = "111111111111111111", roleId = "1575157161175285832";
async function load(name, globals = {}, deps = {}) {
  const context = createContext({ process: { env: { BETA_TESTER_GUILD_ID: guildId, BETA_TESTER_ROLE_ID: roleId } }, AbortSignal, URL, ...globals });
  const source = stripTypeScriptTypes(await readFile(new URL(`../${name}.ts`, import.meta.url), "utf8"), { mode: "transform" });
  const module = new SourceTextModule(source, { context });
  await module.link(specifier => {
    const values = deps[specifier];
    assert.ok(values, specifier);
    return new SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

test("web role verification uses the OAuth membership endpoint and denies missing/revoked roles and Discord failures", async () => {
  let roles = [roleId], ok = true;
  const helper = await load("lib/beta-tester", { fetch: async (url, options) => {
    assert.equal(url, `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`);
    assert.equal(options.headers.Authorization, "Bearer secret");
    assert.equal(options.cache, "no-store");
    return { ok, json: async () => ({ roles }) };
  } });
  assert.equal(await helper.discordBetaTester("secret"), true);
  roles = [];
  assert.equal(await helper.discordBetaTester("secret"), false);
  roles = [roleId]; ok = false;
  assert.equal(await helper.discordBetaTester("secret"), false);
  const unavailable = await load("lib/beta-tester", { fetch: async () => { throw Error("offline"); } });
  assert.equal(await unavailable.discordBetaTester("secret"), false);
  const unconfigured = await load("lib/beta-tester", { process: { env: {} }, fetch: () => assert.fail("must not contact Discord") });
  assert.equal(await unconfigured.discordBetaTester("secret"), false);
});

test("maintenance bypass requires a verified session and fresh role, and covers page and API scopes", async () => {
  let signedIn = true, beta = true, admin = null;
  const helper = await load("lib/web-maintenance", {}, {
    "next/server": { NextRequest: class {} },
    "@/lib/trials": { trialCollections: async () => ({}) },
    "@/lib/dashboard-auth": { dashboardSession: async () => { if (!signedIn) throw Error("expired"); return { accessToken: "secret", betaTester: true }; } },
    "@/lib/beta-tester": { discordBetaTester: async token => { assert.equal(token, "secret"); return beta; } },
    "@/lib/admin-auth": { ADMIN_SESSION_COOKIE: "admin", getAdminSessionUserId: async () => admin, getAllowedDiscordUserIds: () => new Set(["owner"]) },
  });
  const request = { cookies: { get: () => undefined } };
  assert.equal(await helper.canBypassMaintenance(request), true);
  beta = false;
  assert.equal(await helper.canBypassMaintenance(request), false);
  beta = true; signedIn = false;
  assert.equal(await helper.canBypassMaintenance(request), false);
  admin = "owner";
  assert.equal(await helper.canBypassMaintenance(request), true);
  for (const path of ["/server-dashboard", "/dashboard/servers/123/welcome", "/api/dashboard", "/api/dashboard/servers/123"]) {
    assert.equal(helper.maintenanceBlocksPath({ dashboard: true }, path), true);
    assert.equal(helper.maintenanceBlocksPath({ user: true }, path), false);
  }
  assert.equal(helper.maintenanceBlocksPath({ user: true }, "/user-dashboard"), true);
  assert.equal(helper.maintenanceBlocksPath({ user: true }, "/api/user-dashboard"), true);
  assert.equal(helper.maintenanceBlocksPath({ enabled: true }, "/trial"), true);
});

test("proxy blocks pages and APIs, keeps login available, and never gives beta testers admin access", async () => {
  let enabled = true, beta = false;
  const response = (kind, status = 200) => ({ kind, status, headers: new Headers() });
  const { proxy } = await load("proxy", {}, {
    "next/server": { NextRequest: class {}, NextResponse: {
      next: () => response("next"), rewrite: (url, init) => response("rewrite", init.status),
      json: (body, init) => response("json", init.status), redirect: () => response("redirect", 307),
    } },
    "@/lib/web-maintenance": { maintenanceStatus: async () => ({ enabled }), maintenanceBlocksPath: state => state.enabled, canBypassMaintenance: async () => beta },
    "@/lib/admin-auth": { ADMIN_SESSION_COOKIE: "admin", getAdminSessionUserId: async () => null, getAllowedDiscordUserIds: () => new Set() },
  });
  const request = path => ({ nextUrl: new URL(`https://delta.example${path}`), url: `https://delta.example${path}`, cookies: { get: () => undefined } });
  assert.equal((await proxy(request("/trial"))).status, 503);
  assert.equal((await proxy(request("/api/user-dashboard"))).status, 503);
  for (const path of ["/api/dashboard/login", "/api/dashboard/callback", "/api/maintenance"]) assert.equal((await proxy(request(path))).kind, "next");
  beta = true;
  assert.equal((await proxy(request("/trial"))).kind, "next");
  assert.equal((await proxy(request("/api/user-dashboard"))).kind, "next");
  assert.equal((await proxy(request("/api/admin/maintenance"))).status, 401);
  enabled = false; beta = false;
  assert.equal((await proxy(request("/"))).kind, "next");
});
