import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, DISCORD_OAUTH_STATE_COOKIE, createAdminSession, getAllowedDiscordUserIds, getDiscordRedirectUri, readSignedValue, sessionCookieOptions } from "@/lib/admin-auth";

type DiscordUser = { id?: string };
function deny(message: string, status = 403) {
  const response = new NextResponse(message, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
  response.cookies.delete(DISCORD_OAUTH_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = await readSignedValue<{ state?: string; expiresAt?: number }>(request.cookies.get(DISCORD_OAUTH_STATE_COOKIE)?.value);
  if (!code || !state || !savedState?.state || !savedState.expiresAt || savedState.expiresAt < Date.now() || state !== savedState.state) return deny("Discord sign-in could not be verified.");

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return deny("Discord admin authentication is not configured.", 503);
  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code, redirect_uri: getDiscordRedirectUri(request.nextUrl.origin) }), cache: "no-store" });
    if (!tokenResponse.ok) return deny("Discord sign-in failed.");
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!token.access_token) return deny("Discord sign-in failed.");
    const userResponse = await fetch("https://discord.com/api/users/@me", { headers: { authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
    if (!userResponse.ok) return deny("Could not retrieve your Discord account.");
    const user = (await userResponse.json()) as DiscordUser;
    if (!user.id || !getAllowedDiscordUserIds().has(user.id)) return deny("Your Discord account is not authorized for admin access.");

    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(user.id), sessionCookieOptions());
    response.cookies.delete(DISCORD_OAUTH_STATE_COOKIE);
    return response;
  } catch { return deny("Discord sign-in is temporarily unavailable.", 503); }
}
