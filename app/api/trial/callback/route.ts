import { NextRequest, NextResponse } from "next/server";
import { getDiscordClientId, getDiscordClientSecret, readSignedValue } from "@/lib/admin-auth";
import { TRIAL_SESSION_COOKIE, TRIAL_STATE_COOKIE, createTrialSession, trialCookieOptions, trialOrigin, trialRedirectUri, trialSecret } from "@/lib/trial-auth";
import { claimTrial } from "@/lib/trials";

export const runtime = "nodejs";

function finish(request: NextRequest, query: string) {
  const response = NextResponse.redirect(new URL(`/trial${query}`, trialOrigin(request)));
  response.cookies.set(TRIAL_STATE_COOKIE, "", { ...trialCookieOptions, path: "/api/trial", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const saved = await readSignedValue<{ purpose?: string; state?: string; expiresAt?: number }>(request.cookies.get(TRIAL_STATE_COOKIE)?.value, trialSecret());
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    if (!code || !state || saved?.purpose !== "trial-oauth" || saved.state !== state || typeof saved.expiresAt !== "number" || saved.expiresAt <= Date.now()) return finish(request, "?error=login");
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: getDiscordClientId(), client_secret: getDiscordClientSecret(), grant_type: "authorization_code", code, redirect_uri: trialRedirectUri(request) }),
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return finish(request, "?error=login");
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return finish(request, "?error=login");
    const profile = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!profile.ok) return finish(request, "?error=login");
    const user = await profile.json() as { id?: string };
    if (!user.id || !/^\d{17,20}$/.test(user.id)) return finish(request, "?error=login");
    // Identity always comes from Discord, never a query string or submitted user ID.
    let claimError = false;
    try { await claimTrial(user.id); } catch { claimError = true; }
    const response = finish(request, claimError ? "?error=claim" : "");
    response.cookies.set(TRIAL_SESSION_COOKIE, await createTrialSession(user.id), trialCookieOptions);
    return response;
  } catch { return finish(request, "?error=login"); }
}
