import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";
import { canManageGuild } from "@/lib/server-config-schema";

export const DASHBOARD_COOKIE = "delta_dashboard_session";
export const STATE_COOKIE = "delta_dashboard_oauth_state";
export const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
export function siteOrigin(request: NextRequest) { return new URL(process.env.WEBSITE_URL || request.nextUrl.origin).origin; }
export function redirectUri(request: NextRequest) { return process.env.DISCORD_DASHBOARD_REDIRECT_URI || `${siteOrigin(request)}/api/dashboard/callback`; }
export function sessionHash(token: string) { return createHash("sha256").update(token).digest("hex"); }
export class DashboardError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function dashboardError(error: unknown) {
  if (!(error instanceof DashboardError)) console.error("Dashboard request failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: error instanceof DashboardError ? error.message : "Dashboard unavailable. Please try again." }, { status: error instanceof DashboardError ? error.status : 503 });
}
export function requireSameOrigin(request: NextRequest) {
  if (request.headers.get("origin") !== siteOrigin(request)) throw new DashboardError("Invalid request origin.", 403);
}
export async function createSession(userId: string, username: string, accessToken: string, expiresIn: number) {
  const token = randomBytes(32).toString("hex");
  const db = await getDb();
  await db.collection("dashboard_sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("dashboard_sessions").insertOne({ tokenHash: sessionHash(token), userId, username, accessToken,
    expiresAt: new Date(Date.now() + Math.min(expiresIn, 86400) * 1000) });
  return token;
}
export async function dashboardSession(request: NextRequest) {
  const token = request.cookies.get(DASHBOARD_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new DashboardError("Sign in with Discord to continue.", 401);
  const session = await (await getDb()).collection("dashboard_sessions").findOne({ tokenHash: sessionHash(token), expiresAt: { $gt: new Date() } });
  if (!session) throw new DashboardError("Your session expired. Sign in again.", 401);
  return session;
}
export type DiscordGuild = { id: string; name: string; icon: string | null; owner: boolean; permissions: string };
export async function managedGuilds(accessToken: string) {
  const guilds: DiscordGuild[] = [];
  let after = "";
  for (let page = 0; page < 20; page++) {
    const response = await fetch(`https://discord.com/api/v10/users/@me/guilds?limit=200${after ? `&after=${after}` : ""}`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new DashboardError(response.status === 401 ? "Your Discord session expired. Sign in again." : "Discord could not verify your servers. Try again shortly.", response.status === 401 ? 401 : 503);
    const batch = await response.json() as DiscordGuild[];
    guilds.push(...batch.filter(canManageGuild));
    if (batch.length < 200) return guilds;
    after = batch[batch.length - 1].id;
  }
  throw new DashboardError("Too many servers to load. Contact support.", 503);
}
export async function authorizeGuild(request: NextRequest, guildId: string, admin = false) {
  if (!/^\d{17,20}$/.test(guildId)) throw new DashboardError("Invalid server ID.");
  let userId: string;
  if (admin) {
    const id = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!id || !getAllowedDiscordUserIds().has(id)) throw new DashboardError("Unauthorized.", 401);
    userId = id;
  } else {
    const session = await dashboardSession(request);
    if (!(await managedGuilds(session.accessToken)).some((guild) => guild.id === guildId)) throw new DashboardError("You need Manage Server or Administrator permission.", 403);
    userId = session.userId;
  }
  const presence = await (await getDb()).collection("bot_guilds").findOne({ guildId, seenAt: { $gt: new Date(Date.now() - 120000) } });
  if (!presence) throw new DashboardError("Delta is offline or is not in this server. Invite Delta and try again.", 409);
  return { userId, presence };
}
