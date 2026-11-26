import { submissionLimit } from "@/lib/public-submission";
import { recordActivity } from "@/lib/site-activity";
import { NextRequest, NextResponse } from "next/server";
import { getDiscordClientId, getDiscordClientSecret, readSignedValue, createAdminSession, getAllowedDiscordUserIds, ADMIN_SESSION_COOKIE, sessionCookieOptions } from "@/lib/admin-auth";
import { cookieOptions, dashboardCookieOptions, createSession, DASHBOARD_COOKIE, redirectUri, siteOrigin, STATE_COOKIE } from "@/lib/dashboard-auth";
import { TRIAL_SESSION_COOKIE, createTrialSession, trialCookieOptions } from "@/lib/trial-auth";

const limit = submissionLimit(30, 600);

export async function GET(request: NextRequest) {
  const limited = limit(request.headers);
  if (limited) return limited;
  const finish = async (error = "", path = "/server-dashboard") => {
    if (error) await recordActivity("Dashboard", "Discord sign-in did not complete");
    const response = NextResponse.redirect(new URL(`${path}${error ? `?error=${error}` : ""}`, siteOrigin(request)));
    response.cookies.set(STATE_COOKIE, "", { ...cookieOptions, path: "/api/dashboard", maxAge: 0 });
    return response;
  };
  try {
    const state = await readSignedValue<{ purpose: string; view?: string; welcome?: string; state: string; expiresAt: number }>(request.cookies.get(STATE_COOKIE)?.value);
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
    const destination = state.view === "user" ? "/user-dashboard" : state.view === "trial" ? "/trial" : state.view === "admin" ? "/admin" : state.view === "home" ? "/" : "/server-dashboard";
    const target = destination === "/server-dashboard" && state.welcome && /^\d{17,20}$/.test(state.welcome) ? `${destination}?welcome=${state.welcome}` : destination;
    const response = await finish("", target);
    const sharedOptions = dashboardCookieOptions(request);
    response.cookies.set(DASHBOARD_COOKIE, await createSession(user.id, user.global_name || user.username, token.access_token, token.expires_in, user.avatar ?? null, user.username), { ...sharedOptions, maxAge: Math.min(token.expires_in, 86400) });
    // Separate authorization cookies are derived from the same verified Discord identity.
    // Admin rights still require the server-side allowlist; a login alone grants nothing.
    if (getAllowedDiscordUserIds().has(user.id)) {
      try { response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(user.id), { ...sessionCookieOptions(), ...sharedOptions }); }
      catch { /* Admin signing configuration must not block ordinary Discord login. */ }
    }
    else response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...sessionCookieOptions(), ...sharedOptions, maxAge: 0 });
    try { response.cookies.set(TRIAL_SESSION_COOKIE, await createTrialSession(user.id), { ...trialCookieOptions, ...sharedOptions }); }
    catch { /* Trial signing is optional and does not block the main login. */ }
    await recordActivity("Dashboard", "Signed in with Discord", user.id);
    return response;
  } catch { return finish("login"); }
}
