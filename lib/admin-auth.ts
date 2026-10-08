const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "admin_session";
export const DISCORD_OAUTH_STATE_COOKIE = "discord_oauth_state";
const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function envValue(...values: Array<string | undefined>) {
  for (const candidate of values) {
    const value = candidate?.trim();
    if (value) return value;
  }
  return "";
}

export function getDiscordClientId() {
  return envValue(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_OAUTH_CLIENT_ID);
}

export function getDiscordClientSecret() {
  return envValue(process.env.DISCORD_CLIENT_SECRET, process.env.DISCORD_OAUTH_CLIENT_SECRET);
}

export function getAdminSessionSecret() {
  return envValue(process.env.ADMIN_SESSION_SECRET, process.env.AUTH_SECRET) || getDiscordClientSecret();
}

export function getAllowedDiscordUserIds() {
  return new Set(envValue(process.env.ADMIN_ALLOWED_DISCORD_USER_IDS, process.env.ADMIN_DISCORD_USER_IDS, process.env.ALLOWED_DISCORD_USER_IDS).split(",").map((id) => id.trim()).filter(Boolean));
}

export function getDiscordRedirectUri(origin: string) {
  return envValue(process.env.DISCORD_REDIRECT_URI, process.env.DISCORD_OAUTH_REDIRECT_URI, process.env.DISCORD_REDIRECT_URL) || `${origin}/api/auth/discord/callback`;
}

export function getDiscordAuthConfiguration() {
  const missing: string[] = [];
  if (!getDiscordClientId()) missing.push("DISCORD_CLIENT_ID");
  if (!getDiscordClientSecret()) missing.push("DISCORD_CLIENT_SECRET");
  if (!getAllowedDiscordUserIds().size) missing.push("ADMIN_ALLOWED_DISCORD_USER_IDS");
  return { configured: missing.length === 0, missing };
}

export async function createSignedValue(payload: Record<string, unknown>, secret = getAdminSessionSecret()) {
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured.");
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${await sign(encodedPayload, secret)}`;
}

export async function readSignedValue<T>(value: string | undefined, secret = getAdminSessionSecret()): Promise<T | null> {
  if (!value || !secret) return null;
  const [encodedPayload, signature, ...extra] = value.split(".");
  if (!encodedPayload || !signature || extra.length || !signaturesMatch(signature, await sign(encodedPayload, secret))) return null;
  try { return JSON.parse(new TextDecoder().decode(fromBase64Url(encodedPayload))) as T; } catch { return null; }
}

export async function createAdminSession(userId: string) {
  return createSignedValue({ userId, expiresAt: Date.now() + SESSION_LIFETIME_SECONDS * 1000 });
}

export async function getAdminSessionUserId(value: string | undefined) {
  const session = await readSignedValue<{ userId?: string; expiresAt?: number }>(value);
  if (!session?.userId || !session.expiresAt || session.expiresAt < Date.now()) return null;
  return session.userId;
}

export function sessionCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_LIFETIME_SECONDS };
}
