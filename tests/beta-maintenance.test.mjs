import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";
import { readJsonObject } from "../lib/request-json.js";
import { discordAvatarUrl } from "../lib/discord-avatar.ts";

const userId = "222222222222222222";
async function load(name, globals = {}, deps = {}) {
  const context = createContext({ process: { env: {} }, AbortSignal, URL, Response, Headers, ...globals });
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

async function adminSetup({ admin = "owner", allowed = true, fail = false, profiles = new Map() } = {}) {
  const rows = new Map();
  let writes = 0;
  const collection = {
    find: () => ({ sort: () => ({ toArray: async () => { if (fail) throw Error("offline"); return [...rows.values()]; } }) }),
    updateOne: async (filter, update, options) => {
      writes++;
      assert.equal(options.upsert, true);
      if (!rows.has(filter._id)) rows.set(filter._id, { _id: filter._id, ...update.$setOnInsert });
    },
    deleteOne: async filter => { writes++; rows.delete(filter._id); },
  };
  const route = await load("app/api/admin/beta-testers/route", {}, {
    "next/server": { NextRequest: class {}, NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/admin-auth": { ADMIN_SESSION_COOKIE: "admin", getAdminSessionUserId: async () => admin, getAllowedDiscordUserIds: () => new Set(allowed ? ["owner"] : []) },
    "@/lib/trial-auth": { trialOrigin: () => "https://delta.example" },
    "@/lib/beta-tester": { betaTesterCollection: async () => { if (fail) throw Error("offline"); return collection; } },
    "@/lib/beta-tester-profiles": { betaTesterProfiles: async () => profiles },
    "@/lib/request-json.js": { readJsonObject },
  });
  const request = (body, origin = "https://delta.example") => ({
    cookies: { get: () => undefined },
    headers: new Headers({ origin, "content-type": "application/json" }),
    body: new Response(JSON.stringify(body)).body,
  });
  return { get: () => route.GET(request({})), post: (body, origin) => route.POST(request(body, origin)), rows, get writes() { return writes; } };
}

test("admins can list, grant and revoke tester access with idempotent writes", async () => {
  const app = await adminSetup();
  assert.deepEqual(await (await app.get()).json(), { testers: [] });
  for (let i = 0; i < 2; i++) {
    const response = await app.post({ action: "grant", userId: ` ${userId} ` });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { userId, enabled: true });
  }
  assert.equal(app.rows.size, 1);
  assert.equal(app.rows.get(userId).grantedBy, "owner");
  const response = await app.get();
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("vary"), "Cookie");
  assert.deepEqual(await response.json(), { testers: [{ userId, grantedAt: app.rows.get(userId).grantedAt, displayName: null, username: null, avatarUrl: null }] });
  for (let i = 0; i < 2; i++) assert.equal((await app.post({ action: "revoke", userId })).status, 200);
  assert.equal(app.rows.size, 0);
});

test("tester list includes display name, username and avatar without changing access", async () => {
  const profile = { displayName: "Test Listener", username: "listener", avatarUrl: discordAvatarUrl(userId, "avatar_hash") };
  const app = await adminSetup({ profiles: new Map([[userId, profile]]) });
  await app.post({ action: "grant", userId });
  const payload = await (await app.get()).json();
  assert.deepEqual(payload.testers, [{ userId, grantedAt: app.rows.get(userId).grantedAt, ...profile }]);
  assert.equal(app.writes, 1);
});

test("tester profiles prefer saved Discord identity and support bot data and older sign-ins", async () => {
  const otherId = "333333333333333333", legacyId = "444444444444444444";
  const source = {
    discord_profiles: [{ _id: userId, displayName: "Current name", username: "current_user", avatar: null }],
    bot_usage: [{ _id: `user:${otherId}`, name: "Bot listener", username: "bot_listener", image: "https://cdn.discordapp.com/avatars/test.webp" }],
    dashboard_sessions: [{ userId, username: "Old name", avatar: "old_hash" }, { userId: legacyId, username: "Legacy name", avatar: "legacy_hash" }],
  };
  const helper = await load("lib/beta-tester-profiles", {}, {
    "@/lib/discord-avatar": { discordAvatarUrl },
    "@/lib/mongodb": { getDb: async () => ({ collection: name => ({ find: (filter, options) => {
      assert.ok(options.projection);
      assert.equal(options.projection.accessToken, undefined);
      assert.equal(options.projection.sealedAccessToken, undefined);
      const cursor = { sort: () => cursor, toArray: async () => source[name] };
      return cursor;
    } }) }) },
  });
  assert.equal((await helper.betaTesterProfiles([])).size, 0);
  const profiles = await helper.betaTesterProfiles([userId, otherId, legacyId]);
  assert.deepEqual(JSON.parse(JSON.stringify(profiles.get(userId))), { displayName: "Current name", username: "current_user", avatarUrl: discordAvatarUrl(userId, null) });
  assert.equal(profiles.get(otherId).username, "bot_listener");
  assert.equal(profiles.get(otherId).displayName, "Bot listener");
  assert.equal(profiles.get(legacyId).displayName, "Legacy name");
  assert.equal(profiles.get(legacyId).username, null);
  assert.equal(profiles.get(legacyId).avatarUrl, discordAvatarUrl(legacyId, "legacy_hash"));
});

test("tester management requires an allowlisted admin and same-origin writes", async () => {
  for (const options of [{ admin: null }, { allowed: false }, { admin: userId }]) {
    const app = await adminSetup(options);
    assert.equal((await app.get()).status, 401);
    assert.equal((await app.post({ action: "grant", userId })).status, 401);
    assert.equal(app.writes, 0);
  }
  const app = await adminSetup();
  assert.equal((await app.post({ action: "grant", userId }, "https://other.example")).status, 403);
  assert.equal(app.writes, 0);
});

test("tester management rejects malformed IDs and actions and reports database failures", async () => {
  const app = await adminSetup();
  for (const body of [null, {}, { action: "grant", userId: 222222222222222222 }, { action: "grant", userId: { $ne: null } }, { action: "grant", userId: "123" }, { action: "grant", userId: "1".repeat(21) }, { action: "other", userId }]) {
    assert.equal((await app.post(body)).status, 400);
  }
  assert.equal(app.writes, 0);
  const unavailable = await adminSetup({ fail: true });
  assert.equal((await unavailable.get()).status, 503);
  assert.equal((await unavailable.post({ action: "grant", userId })).status, 503);
  assert.equal((await unavailable.post({ action: "revoke", userId })).status, 503);
});

test("beta tester access reads current grants by Discord ID without contacting Discord", async () => {
  let granted = false, reads = 0;
  const helper = await load("lib/beta-tester", { fetch: () => assert.fail("must not contact Discord") }, {
    "@/lib/mongodb": { getDb: async () => ({ collection: name => {
      assert.equal(name, "website_beta_testers");
      return { findOne: async filter => { reads++; assert.equal(filter._id, userId); return granted ? { _id: userId } : null; } };
    } }) },
  });
  assert.equal(await helper.isBetaTester(userId), false);
  granted = true;
  assert.equal(await helper.isBetaTester(userId), true);
  granted = false;
  assert.equal(await helper.isBetaTester(userId), false);
  for (const id of [undefined, null, 222222222222222222, "bad", "", { $ne: null }]) assert.equal(await helper.isBetaTester(id), false);
  assert.equal(reads, 3);
});

test("maintenance bypass requires a verified session and current admin grant, and covers page and API scopes", async () => {
  let signedIn = true, beta = true, admin = null, unavailable = false;
  const helper = await load("lib/web-maintenance", {}, {
    "next/server": { NextRequest: class {} },
    "@/lib/trials": { trialCollections: async () => ({}) },
    "@/lib/dashboard-auth": { dashboardSession: async () => { if (!signedIn) throw Error("expired"); return { userId, betaTester: true }; } },
    "@/lib/beta-tester": { isBetaTester: async id => { assert.equal(id, userId); if (unavailable) throw Error("offline"); return beta; } },
    "@/lib/admin-auth": { ADMIN_SESSION_COOKIE: "admin", getAdminSessionUserId: async () => admin, getAllowedDiscordUserIds: () => new Set(["owner"]) },
  });
  const request = { cookies: { get: () => undefined } };
  assert.equal(await helper.canBypassMaintenance(request), true);
  beta = false;
  assert.equal(await helper.canBypassMaintenance(request), false);
  beta = true; unavailable = true;
  assert.equal(await helper.canBypassMaintenance(request), false);
  unavailable = false; signedIn = false;
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
  for (const path of ["/trial", "/api/user-dashboard"]) {
    const allowed = await proxy(request(path));
    assert.equal(allowed.kind, "next");
    assert.equal(allowed.headers.get("Cache-Control"), "private, no-store");
    assert.equal(allowed.headers.get("Vary"), "Cookie");
  }
  assert.equal((await proxy(request("/api/admin/maintenance"))).status, 401);
  beta = false;
  for (const path of ["/trial", "/api/user-dashboard"]) {
    const revoked = await proxy(request(path));
    assert.equal(revoked.status, 503);
    assert.equal(revoked.headers.get("Cache-Control"), "private, no-store");
    assert.equal(revoked.headers.get("Vary"), "Cookie");
  }
  enabled = false; beta = false;
  assert.equal((await proxy(request("/"))).kind, "next");
});
