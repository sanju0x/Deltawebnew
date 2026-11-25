import assert from "node:assert/strict";
import { test } from "node:test";
import schema from "../lib/server-config-schema.js";
const { canManageGuild, imageUrl, validateServerConfig } = schema;
const valid = { source: "ytsearch", disabledCommands: ["play"], customBot: true, nickname: "Delta Music", bio: "Music for this server.", avatar: "https://i.imgur.com/example.png", banner: "", displayNameFontID: 0, displayNameEffectID: 0, displayNameColors: [] };

test("new greetings default to plain messages with generated canvas and preserve saved choices", () => {
  for (const kind of ["welcome", "goodbye"]) {
    const card = schema.defaultGreetings()[kind];
    assert.equal(card.format, "plain");
    assert.equal(card.canvas, true);
    assert.equal(card.accentColor, "");
    assert.equal(schema.validateGreeting(kind, card, []).accentColor, "");
    const saved = schema.defaultGreetings({ [kind]: { format: "embed", canvas: false, accentColor: "#123456" } })[kind];
    assert.equal(saved.format, "embed");
    assert.equal(saved.canvas, false);
    assert.equal(saved.accentColor, "#123456");
  }
});

test("generated canvas blocks retain their order and optional color survives validation", () => {
  const canvas = { id: "canvas", type: "canvas", text: "", url: "", description: "", divider: true, spacing: 1 };
  const card = { ...schema.defaultGreetings().welcome, format: "components", enabled: true, channelId: "channel", blocks: [canvas, { ...canvas, id: "text", type: "text", text: "Hello" }] };
  const validated = schema.validateGreeting("welcome", card, [{ id: "channel" }]);
  assert.deepEqual(validated.blocks, card.blocks);
  assert.equal(validated.accentColor, "");
  assert.throws(() => schema.validateGreeting("welcome", { ...card, blocks: [canvas, { ...canvas, id: "duplicate-canvas" }] }, [{ id: "channel" }]));
  assert.throws(() => schema.validateGreeting("welcome", { ...card, accentColor: "invalid" }, [{ id: "channel" }]));
});

test("V2 blocks survive validation with ordered media, thumbnails and separator settings", () => {
  const base = { ...schema.defaultGreetings().welcome, format: "components", enabled: true, channelId: "channel", canvas: false, message: "" };
  const block = { id: "first", type: "image", text: "", url: "https://media.tenor.com/example/welcome.gif", description: "Welcome", divider: true, spacing: 1 };
  const card = { ...base, blocks: [block, { ...block, id: "second", type: "section", text: "**Hi {user}**" }, { ...block, id: "third", type: "separator", url: "", divider: false, spacing: 2 }] };
  const validated = schema.validateGreeting("welcome", card, [{ id: "channel" }]);
  assert.deepEqual(validated.blocks, card.blocks);
  assert.equal(validated.canvas, false);
  assert.equal(schema.validateGreeting("welcome", { ...card, canvas: true }, [{ id: "channel" }]).canvas, true);
  assert.equal(schema.validateGreeting("welcome", { ...base, canvas: true, blocks: [] }, [{ id: "channel" }]).canvas, true);
  for (const blocks of [[{ ...block, url: "https://localhost/a.gif" }], [block, block], Array.from({ length: 11 }, (_, i) => ({ ...block, id: String(i) })), [{ ...block, type: "section", text: "" }], [{ ...block, type: "separator" }], [{ ...block, spacing: 3 }]]) {
    assert.throws(() => schema.validateGreeting("welcome", { ...base, blocks }, [{ id: "channel" }]));
  }
  assert.throws(() => schema.validateGreeting("welcome", { ...base, blocks: [{ ...block, type: "text", text: "a".repeat(1800) }, { ...block, id: "second", type: "text", text: "b".repeat(1800) }] }, [{ id: "channel" }]));
});

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

test("ignores legacy language preferences on save", () => {
  assert.deepEqual(validateServerConfig({ ...valid, language: "hi", languageRevision: "old" }, ["play"]), valid);
});
