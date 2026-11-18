import { NextRequest, NextResponse } from "next/server";
import { createSignedValue, getDiscordClientId, getDiscordClientSecret } from "@/lib/admin-auth";
import { TRIAL_STATE_COOKIE, trialCookieOptions, trialOrigin, trialRedirectUri, trialSecret } from "@/lib/trial-auth";

export async function GET(request: NextRequest) {
  try {
    const clientId = getDiscordClientId();
    if (!clientId || !getDiscordClientSecret()) throw new Error("Discord login is not configured");
    const state = crypto.randomUUID();
    const requestedUser = request.nextUrl.searchParams.get("user") || "";
    const user = /^\d{17,20}$/.test(requestedUser) ? requestedUser : "";
    const value = await createSignedValue({ purpose: "trial-oauth", state, user, expiresAt: Date.now() + 600_000 }, trialSecret());
    const url = new URL("https://discord.com/oauth2/authorize");
    url.search = new URLSearchParams({ client_id: clientId, redirect_uri: trialRedirectUri(request), response_type: "code", scope: "identify", state, prompt: "consent" }).toString();
    const response = NextResponse.redirect(url);
    response.cookies.set(TRIAL_STATE_COOKIE, value, { ...trialCookieOptions, path: "/api/trial", maxAge: 600 });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/trial?error=configuration", trialOrigin(request)));
  }
}
