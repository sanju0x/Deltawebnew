// Run: node --experimental-vm-modules --test tests/admin-trials.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

const source = stripTypeScriptTypes(await readFile(new URL("../app/api/admin/trials/route.ts", import.meta.url), "utf8"));

async function setup({ userId = "123456789012345678", allowed = true, count = 151, failDelete = false } = {}) {
  let records = Array.from({ length: count }, (_, index) => ({ _id: String(index), claimed: true }));
  let deleteCalls = 0;
  let settingsCalls = 0;
  const context = createContext({});
  const dependencies = {
    "next/server": { NextResponse: { json: (body, init) => Response.json(body, init) } },
    "@/lib/admin-auth": {
      ADMIN_SESSION_COOKIE: "admin_session",
      getAdminSessionUserId: async () => userId,
      getAllowedDiscordUserIds: () => new Set(allowed ? [userId] : []),
    },
    "@/lib/trial-auth": { trialOrigin: () => "https://delta.example" },
    "@/lib/trials": {
      trialCollections: async () => ({
        claims: {
          deleteMany: async (filter) => {
            deleteCalls += 1;
            assert.equal(JSON.stringify(filter), "{}");
            if (failDelete) throw new Error("Database unavailable");
            const deletedCount = records.length;
            records = [];
            return { deletedCount };
          },
        },
        settings: {
          updateOne: async () => { settingsCalls += 1; throw new Error("Settings must stay unchanged"); },
        },
      }),
    },
  };
  const route = new SourceTextModule(source, { context });
  await route.link((specifier) => {
    const exports = dependencies[specifier];
    assert.ok(exports, `Unexpected dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await route.evaluate();
  return {
    post: (body = { action: "reset-all" }, origin = "https://delta.example") => route.namespace.POST({
      cookies: { get: () => ({ value: "session" }) },
      headers: new Headers({ origin }),
      json: async () => body,
    }),
    get records() { return records; },
    get deleteCalls() { return deleteCalls; },
    get settingsCalls() { return settingsCalls; },
  };
}

test("reset-all deletes all trial records beyond the displayed 100 and leaves settings unchanged", async () => {
  const app = await setup();
  const response = await app.post();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, deletedCount: 151 });
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(app.records.length, 0);
  assert.equal(app.deleteCalls, 1);
  assert.equal(app.settingsCalls, 0);
});

test("reset-all is safe to repeat on an empty collection", async () => {
  const app = await setup({ count: 0 });
  for (let index = 0; index < 2; index += 1) {
    assert.deepEqual(await (await app.post()).json(), { ok: true, deletedCount: 0 });
  }
});

test("missing sessions and users outside the allow list cannot delete trials", async () => {
  for (const options of [{ userId: null }, { allowed: false }]) {
    const app = await setup(options);
    assert.equal((await app.post()).status, 401);
    assert.equal(app.deleteCalls, 0);
    assert.equal(app.records.length, 151);
  }
});

test("requests from a different origin cannot delete trials", async () => {
  const app = await setup();
  assert.equal((await app.post({ action: "reset-all" }, "https://other.example")).status, 403);
  assert.equal(app.deleteCalls, 0);
});

test("invalid actions and single-user resets without an ID cannot delete trials", async () => {
  const app = await setup();
  for (const body of [null, {}, { action: "delete-all" }, { action: "reset" }]) {
    assert.equal((await app.post(body)).status, 400);
  }
  assert.equal(app.deleteCalls, 0);
});

test("database deletion failures return an error instead of reporting success", async () => {
  const app = await setup({ failDelete: true });
  const response = await app.post();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Trial update failed" });
  assert.equal(app.records.length, 151);
});
