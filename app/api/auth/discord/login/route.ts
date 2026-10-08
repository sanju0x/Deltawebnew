import { NextRequest, NextResponse } from "next/server";
import { DISCORD_OAUTH_STATE_COOKIE, createSignedValue, getAdminSessionSecret, getDiscordAuthConfiguration, getDiscordClientId, getDiscordRedirectUri } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const clientId = getDiscordClientId();
  const secret = getAdminSessionSecret();
  const configuration = getDiscordAuthConfiguration();
  if (!configuration.configured || !clientId || !secret) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("error", "configuration");
    loginUrl.searchParams.set("missing", configuration.missing.join(","));
    return NextResponse.redirect(loginUrl);
  }

  const state = crypto.randomUUID();
  const signedState = await createSignedValue({ state, expiresAt: Date.now() + 10 * 60 * 1000 }, secret);
  const authorizeUrl = new URL("https://discord.com/api/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getDiscordRedirectUri(request.nextUrl.origin));
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "identify");
  authorizeUrl.searchParams.set("state", state);
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(DISCORD_OAUTH_STATE_COOKIE, signedState, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/discord", maxAge: 600 });
  return response;
}
