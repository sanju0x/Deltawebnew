import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, DISCORD_OAUTH_STATE_COOKIE, createAdminSession, getAllowedDiscordUserIds, getDiscordClientId, getDiscordClientSecret, getDiscordRedirectUri, readSignedValue, sessionCookieOptions } from "@/lib/admin-auth";

type DiscordUser = { id?: string };
function deny(request: NextRequest, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set(DISCORD_OAUTH_STATE_COOKIE, "", { path: "/api/auth/discord", maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = await readSignedValue<{ state?: string; expiresAt?: number }>(request.cookies.get(DISCORD_OAUTH_STATE_COOKIE)?.value);
  if (!code || !state || !savedState?.state || !savedState.expiresAt || savedState.expiresAt < Date.now() || state !== savedState.state) return deny(request, "invalid_state");

  const clientId = getDiscordClientId();
  const clientSecret = getDiscordClientSecret();
  if (!clientId || !clientSecret) return deny(request, "configuration");
  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code, redirect_uri: getDiscordRedirectUri(request.nextUrl.origin) }), cache: "no-store" });
    if (!tokenResponse.ok) return deny(request, "oauth_failed");
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) return deny(request, "oauth_failed");
    const userResponse = await fetch("https://discord.com/api/users/@me", { headers: { authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
    if (!userResponse.ok) return deny(request, "profile_failed");
    const user = (await userResponse.json()) as DiscordUser;
    if (!user.id || !getAllowedDiscordUserIds().has(user.id)) return deny(request, "not_allowed");

    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(user.id), sessionCookieOptions());
    response.cookies.set(DISCORD_OAUTH_STATE_COOKIE, "", { path: "/api/auth/discord", maxAge: 0 });
    return response;
  } catch { return deny(request, "unavailable"); }
}
