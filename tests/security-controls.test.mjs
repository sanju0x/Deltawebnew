import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";
import * as auth from "../lib/admin-auth.ts";
import { openDiscordToken, sealDiscordToken } from "../lib/dashboard-token.ts";
import { readSubmission, submissionLimit, visitorAddress } from "../lib/public-submission.ts";
import { webLink } from "../lib/web-link.ts";
import * as submissions from "../lib/public-submission.ts";
import { submissionQuota } from "../lib/submission-quota.ts";

const origin = "https://delta.example";
function form(body, headers = {}) {
  return new Request(origin + "/api/bug-reports", {
    method: "POST", headers: { origin, "content-type": "application/json", ...headers }, body,
  });
}

test("submission parser enforces origin, content type, actual bytes and field types", async () => {
  const read = (body, headers) => readSubmission(form(body, headers), submissionLimit(10, 10), 32);
  assert.deepEqual(await read('{"message":"ok"}'), { message: "ok" });
  assert.equal((await read("{}", { origin: "null" })).status, 403);
  assert.equal((await read("{}", { "content-type": "text/plain" })).status, 415);
  assert.equal((await read(JSON.stringify({ message: "🎵".repeat(8) }))).status, 413);
  for (const text of ["[]", "null", "{", '{"message":{}}']) assert.equal((await read(text)).status, 400);
});

test("trusted-client and process limits expire and untrusted forwarding headers are ignored", t => {
  const previous = process.env.TRUSTED_CLIENT_IP_HEADER;
  process.env.TRUSTED_CLIENT_IP_HEADER = "x-edge-client";
  t.after(() => {
    if (previous === undefined) delete process.env.TRUSTED_CLIENT_IP_HEADER;
    else process.env.TRUSTED_CLIENT_IP_HEADER = previous;
  });
  const limit = submissionLimit(1, 2);
  const headers = new Headers({ "x-edge-client": "192.0.2.1" });
  assert.equal(limit(headers, 1000), undefined);
  assert.equal(limit(headers, 1001).status, 429);
  const shared = new Headers({ "x-forwarded-for": "192.0.2.2" });
  assert.equal(visitorAddress(shared), "");
  assert.equal(limit(shared, 1002), undefined);
  assert.equal(limit(shared, 1003).headers.get("Retry-After"), "60");
  assert.equal(limit(headers, 61000), undefined);
});

test("Discord token encryption requires the original session and detects corruption", () => {
  const sealed = sealDiscordToken("discord-secret", "session-a");
  assert.equal(openDiscordToken(sealed, "session-a"), "discord-secret");
  assert.notEqual(sealDiscordToken("discord-secret", "session-a"), sealed);
  assert.throws(() => openDiscordToken(sealed, "session-b"));
  const bytes = Buffer.from(sealed, "base64");
  bytes[28] ^= 1;
  assert.throws(() => openDiscordToken(bytes.toString("base64"), "session-a"));
});

test("stored links accept web navigation and discard non-web schemes", () => {
  for (const value of ["#", "/team", "https://example.com/"]) assert.equal(webLink(value), value);
  for (const value of [null, "file:///local", "data:text/plain,hello"]) assert.equal(webLink(value), undefined);
});

test("bug reports write only validated fields and keep the initial status server-controlled", async () => {
  const records = [];
  const context = createContext({ Response });
  const route = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL("../app/api/bug-reports/route.ts", import.meta.url), "utf8")), { context });
  const deps = {
    "next/server": { NextRequest: Request, NextResponse: Response },
    "@/lib/public-submission": submissions,
    "@/lib/submission-quota": { submissionQuota: async () => undefined },
    "@/lib/mongodb": { getDb: async () => ({ collection: () => ({ insertOne: doc => records.push(doc) }) }) },
  };
  await route.link(name => new SyntheticModule(Object.keys(deps[name]), function () {
    for (const [key, value] of Object.entries(deps[name])) this.setExport(key, value);
  }, { context }));
  await route.evaluate();
  const input = { title: "Playback", description: "Audio stops", severity: "medium", category: "audio" };
  for (const changes of [{ title: " " }, { severity: "unknown" }, { category: {} }, { email: "invalid" }]) {
    assert.equal((await route.namespace.POST(form(JSON.stringify({ ...input, ...changes })))).status, 400);
  }
  assert.equal(records.length, 0);
  assert.equal((await route.namespace.POST(form(JSON.stringify({ ...input, status: "closed" })))).status, 200);
  assert.equal(records.length, 1);
  assert.equal(records[0].status, "open");
});

test("example signing keys and short keys fail closed", () => {
  assert.equal(auth.validSigningKey("short"), false);
  assert.equal(auth.validSigningKey("replace-with-another-long-random-secret"), false);
});

test("database submission quotas use the pre-update count and release at the next window", async () => {
  let previous = null;
  const db = { collection: () => ({ findOneAndUpdate: async (filter, changes, options) => {
    assert.deepEqual(filter, { _id: "suggestions" });
    assert.equal(changes.length, 1);
    assert.deepEqual(options, { upsert: true, returnDocument: "before" });
    return previous;
  } }) };
  assert.equal(await submissionQuota(db, "suggestions", 3, 61000), undefined);
  previous = { window: 1, count: 2 };
  assert.equal(await submissionQuota(db, "suggestions", 3, 61000), undefined);
  previous.count++;
  const limited = await submissionQuota(db, "suggestions", 3, 61000);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Retry-After"), "59");
  assert.equal(await submissionQuota(db, "suggestions", 3, 120000), undefined);
});

test("admin writes require a valid allowlisted identity and the site origin", async () => {
  const secret = "session-signing-key-for-local-tests-only";
  const id = "123456789012345678";
  let cookie;
  const allowed = new Set([id]);
  const context = createContext({ Response, URL, process: { env: { WEBSITE_URL: origin } } });
  const mod = new SourceTextModule(stripTypeScriptTypes(await readFile(new URL("../lib/admin-access.ts", import.meta.url), "utf8")), { context });
  const deps = {
    "next/headers": { cookies: async () => ({ get: () => ({ value: cookie }) }) },
    "@/lib/admin-auth": { ADMIN_SESSION_COOKIE: auth.ADMIN_SESSION_COOKIE,
      getAdminSessionUserId: auth.getAdminSessionUserId, getAllowedDiscordUserIds: () => allowed },
  };
  await mod.link(name => new SyntheticModule(Object.keys(deps[name]), function () {
    for (const [key, value] of Object.entries(deps[name])) this.setExport(key, value);
  }, { context }));
  await mod.evaluate();
  const previous = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = secret;
  try {
    const check = (headers) => mod.namespace.adminWriteError(form("{}", headers));
    assert.equal((await check()).status, 401);
    cookie = await auth.createAdminSession(id);
    assert.equal((await check({ origin: "https://other.example" })).status, 403);
    assert.equal(await check(), undefined);
    allowed.clear();
    assert.equal((await check()).status, 401);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previous;
  }
});
