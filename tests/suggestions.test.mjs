import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

test("suggestions validate origin and text, then write one private activity entry", async () => {
  const entries = [];
  const context = createContext({});
  const source = await readFile(new URL("../app/api/suggestions/route.ts", import.meta.url), "utf8");
  const route = new SourceTextModule(stripTypeScriptTypes(source), { context });
  const dependencies = {
    "next/server": { NextRequest: Request, NextResponse: Response },
    "@/lib/dashboard-auth": {
      DashboardError: Error,
      dashboardError: () => Response.json({}, { status: 400 }),
      requireSameOrigin(request) { assert.equal(request.headers.get("origin"), "https://delta.example"); }
    },
    "@/lib/mongodb": { getDb: async () => ({ collection(name) {
      assert.equal(name, "site_activity");
      return { insertOne: async entry => entries.push(entry) };
    } }) }
  };
  await route.link(key => {
    const exports = dependencies[key];
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await route.evaluate();
  const send = (message, origin = "https://delta.example") => route.namespace.POST(new Request("https://delta.example/api/suggestions", {
    method: "POST", headers: { origin }, body: JSON.stringify({ message, userId: "spoofed" })
  }));
  for (const message of ["   ", 123, "x".repeat(2001)]) assert.equal((await send(message)).status, 400);
  assert.equal((await send("More playlists", "https://other.example")).status, 400);
  assert.equal((await send("  More playlists  ")).status, 201);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].message, "More playlists");
  assert.equal(entries[0].category, "Suggestion");
  assert.equal(entries[0].userId, undefined);
});
