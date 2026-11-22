import { submissionLimit } from "@/lib/public-submission";
import { recordActivity } from "@/lib/site-activity";
import { NextRequest, NextResponse } from "next/server";
import { createSignedValue, getDiscordClientId, getDiscordClientSecret } from "@/lib/admin-auth";
import { cookieOptions, redirectUri, siteOrigin, STATE_COOKIE } from "@/lib/dashboard-auth";

const limit = submissionLimit(30, 600);

export async function GET(request: NextRequest) {
  const limited = limit(request.headers);
  if (limited) return limited;
  try {
    if (!getDiscordClientId() || !getDiscordClientSecret()) throw new Error("Discord is not configured");
    const state = crypto.randomUUID();
    const signed = await createSignedValue({ purpose: "dashboard-oauth", view: request.nextUrl.searchParams.get("view") === "user" ? "user" : "server", state, expiresAt: Date.now() + 600000 });
    const url = new URL("https://discord.com/oauth2/authorize");
    url.search = new URLSearchParams({ client_id: getDiscordClientId(), redirect_uri: redirectUri(request), response_type: "code", scope: "identify guilds", state }).toString();
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, signed, { ...cookieOptions, path: "/api/dashboard", maxAge: 600 });
    await recordActivity("Dashboard", "Started Discord sign-in");
    return response;
  } catch { return NextResponse.redirect(new URL("/dashboard?error=configuration", siteOrigin(request))); }
}
