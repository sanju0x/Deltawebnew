import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  createAdminSession,
  createSignedValue,
  getAdminSessionUserId,
  readSignedValue,
} from "../lib/admin-auth.ts";

const previousSecret = process.env.ADMIN_SESSION_SECRET;
process.env.ADMIN_SESSION_SECRET = "local-admin-auth-regression-test-secret";
after(() => {
  if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = previousSecret;
});

test("accepts a newly issued admin session", async () => {
  const session = await createAdminSession("123456789012345678");
  assert.equal(await getAdminSessionUserId(session), "123456789012345678");
});

test("rejects missing, malformed, tampered, and incorrectly signed sessions", async () => {
  const session = await createAdminSession("123456789012345678");
  const [payload, signature] = session.split(".");
  const changedSignature = `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}`;
  for (const value of [undefined, "", "invalid", `${session}.extra`, `${payload}.${changedSignature}`]) {
    assert.equal(await getAdminSessionUserId(value), null);
  }
  assert.equal(await readSignedValue(session, "a-different-secret"), null);
});

test("rejects expired sessions and sessions at their expiry boundary", async (context) => {
  const now = 1_800_000_000_000;
  context.mock.method(Date, "now", () => now);
  for (const expiresAt of [now - 1, now]) {
    const session = await createSignedValue({ userId: "123456789012345678", expiresAt });
    assert.equal(await getAdminSessionUserId(session), null);
  }
});

test("rejects signed payloads with invalid identity or expiry types", async () => {
  const future = Date.now() + 60_000;
  for (const payload of [
    { userId: "123456789012345678", expiresAt: String(future) },
    { userId: "123456789012345678", expiresAt: "never" },
    { userId: "123456789012345678", expiresAt: null },
    { userId: 123, expiresAt: future },
    { userId: "", expiresAt: future },
    {},
  ]) {
    assert.equal(await getAdminSessionUserId(await createSignedValue(payload)), null);
  }
});
