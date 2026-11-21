import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import schema from "../lib/server-config-schema.js";
const { canManageGuild, imageUrl, validateServerConfig } = schema;
const valid = { source: "ytsearch", disabledCommands: ["play"], customBot: true, nickname: "Delta Music", bio: "Music for this server.", avatar: "https://i.imgur.com/example.png", banner: "" };

test("only server owners, administrators, and Manage Server members qualify", () => {
  for (const guild of [{ owner: true }, { permissions: "8" }, { permissions: "32" }, { permissions: String((1n << 50n) | 32n) }]) assert.equal(canManageGuild(guild), true);
  for (const guild of [null, {}, { owner: false, permissions: "0" }, { permissions: "16" }, { permissions: "invalid" }]) assert.equal(canManageGuild(guild), false);
});
test("validates provider and commands, deduplicates, and strips client metadata", () => {
  assert.deepEqual(validateServerConfig({ ...valid, disabledCommands: ["play", "play"], status: "applied", updatedBy: "fake-admin" }, ["play", "skip"]), valid);
  for (const input of [{ ...valid, source: "unknown" }, { ...valid, disabledCommands: ["restart"] }, { ...valid, customBot: "true" }, { ...valid, nickname: "x".repeat(33) }, { ...valid, bio: "x".repeat(191) }, null]) assert.throws(() => validateServerConfig(input, ["play"]));
});
test("rejects internal URLs, redirects through arbitrary hosts, credentials, and ports", () => {
  for (const url of ["http://i.imgur.com/a.png", "https://127.0.0.1/a.png", "https://169.254.169.254/", "https://localhost/", "https://i.imgur.com.attacker.test/a.png", "https://user:pass@i.imgur.com/a.png", "https://i.imgur.com:444/a.png", "file:///etc/passwd", "https://example.com/a.png"]) assert.throws(() => imageUrl(url));
  assert.equal(imageUrl(""), "");
  assert.equal(imageUrl(valid.avatar), valid.avatar);
});
test("disabling customization preserves editable fields but clears toggle", () => {
  const result = validateServerConfig({ ...valid, customBot: false, disabledCommands: [] }, ["play"]);
  assert.equal(result.customBot, false);
  assert.deepEqual(result.disabledCommands, []);
});

test("dashboard accepts every translated music locale and rejects unknown language tags", () => {
  const music = JSON.parse(readFileSync(new URL("../../src/settings/music-locales.json", import.meta.url), "utf8"));
  assert.deepEqual(schema.LANGUAGES.map(language => language.value).sort(), Object.keys(music).sort());
  for (const { value } of schema.LANGUAGES) {
    assert.equal(validateServerConfig({ ...valid, language: value }, ["play"]).language, value);
    assert.deepEqual(Object.keys(music[value]).sort(), Object.keys(music.en).sort());
    assert.ok(music[value]["music.nowPlaying"].includes("{title}"));
  }
  assert.throws(() => validateServerConfig({ ...valid, language: "unsupported" }, ["play"]));
});
