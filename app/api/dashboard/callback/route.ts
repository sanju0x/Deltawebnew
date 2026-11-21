import { recordActivity } from "@/lib/site-activity";
import { NextRequest, NextResponse } from "next/server";
import { getDiscordClientId, getDiscordClientSecret, readSignedValue } from "@/lib/admin-auth";
import { cookieOptions, createSession, DASHBOARD_COOKIE, redirectUri, siteOrigin, STATE_COOKIE } from "@/lib/dashboard-auth";

export async function GET(request: NextRequest) {
  const finish = async (error = "") => {
    if (error) await recordActivity("Dashboard", "Discord sign-in did not complete");
    const response = NextResponse.redirect(new URL(`/dashboard${error ? `?error=${error}` : ""}`, siteOrigin(request)));
    response.cookies.set(STATE_COOKIE, "", { ...cookieOptions, path: "/api/dashboard", maxAge: 0 });
    return response;
  };
  try {
    const state = await readSignedValue<{ purpose: string; state: string; expiresAt: number }>(request.cookies.get(STATE_COOKIE)?.value);
    const code = request.nextUrl.searchParams.get("code");
    if (!code || state?.purpose !== "dashboard-oauth" || state.state !== request.nextUrl.searchParams.get("state") || !Number.isFinite(state.expiresAt) || state.expiresAt <= Date.now()) return finish("login");
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: getDiscordClientId(), client_secret: getDiscordClientSecret(), grant_type: "authorization_code", code, redirect_uri: redirectUri(request) }), signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!tokenResponse.ok) return finish("login");
    const token = await tokenResponse.json();
    if (!token.access_token || !Number.isFinite(token.expires_in) || token.expires_in <= 0 || !token.scope?.split(" ").includes("guilds")) return finish("login");
    const profileResponse = await fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: `Bearer ${token.access_token}` }, signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!profileResponse.ok) return finish("login");
    const user = await profileResponse.json();
    if (!/^\d{17,20}$/.test(user.id)) return finish("login");
    const response = await finish();
    response.cookies.set(DASHBOARD_COOKIE, await createSession(user.id, user.global_name || user.username, token.access_token, token.expires_in, user.avatar ?? null), { ...cookieOptions, maxAge: Math.min(token.expires_in, 86400) });
    await recordActivity("Dashboard", "Signed in with Discord", user.id);
    return response;
  } catch { return finish("login"); }
}
