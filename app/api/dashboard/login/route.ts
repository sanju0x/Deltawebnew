import { submissionLimit } from "@/lib/public-submission";
import { recordActivity } from "@/lib/site-activity";
import { NextRequest, NextResponse } from "next/server";
import { createSignedValue, getDiscordClientId, getDiscordClientSecret } from "@/lib/admin-auth";
import { cookieOptions, redirectUri, siteOrigin, STATE_COOKIE, isServerDashboardHost } from "@/lib/dashboard-auth";

const limit = submissionLimit(30, 600);

export async function GET(request: NextRequest) {
  if (isServerDashboardHost(request) || request.nextUrl.hostname === "www.delta-bot.online") {
    const url = new URL("/api/dashboard/login", "https://delta-bot.online");
    url.searchParams.set("view", isServerDashboardHost(request) ? "server" : (request.nextUrl.searchParams.get("view") || "home"));
    return NextResponse.redirect(url);
  }
  const limited = limit(request.headers);
  if (limited) return limited;
  try {
    if (!getDiscordClientId() || !getDiscordClientSecret()) throw new Error("Discord is not configured");
    const state = crypto.randomUUID();
    const requested = request.nextUrl.searchParams.get("view");
    const view = requested === "admin" || requested === "trial" || requested === "user" || requested === "server" ? requested : "home";
    const signed = await createSignedValue({ purpose: "dashboard-oauth", view, state, expiresAt: Date.now() + 600000 });
    const url = new URL("https://discord.com/oauth2/authorize");
    url.search = new URLSearchParams({ client_id: getDiscordClientId(), redirect_uri: redirectUri(request), response_type: "code", scope: "identify guilds", state }).toString();
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, signed, { ...cookieOptions, path: "/api/dashboard", maxAge: 600 });
    await recordActivity("Dashboard", "Started Discord sign-in");
    return response;
  } catch { return NextResponse.redirect(new URL("/server-dashboard?error=configuration", siteOrigin(request))); }
}
