import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionUserId,
  getAllowedDiscordUserIds,
} from "@/lib/admin-auth";

import { maintenanceStatus } from "@/lib/web-maintenance";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hostname = request.nextUrl.hostname.toLowerCase();
  // Keep the old dashboard subdomain as a redirect while serving the dashboard
  // from the main website's /server-dashboard route.
  if (hostname === "dash.delta-bot.online" && (path === "/" || path === "/dashboard" || path === "/server-dashboard")) {
    const url = new URL("/server-dashboard", "https://delta-bot.online");
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url, 308);
  }
  if (path === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = "/server-dashboard";
    return NextResponse.redirect(url, 308);
  }
  if (path.startsWith("/api/") && !path.startsWith("/api/admin")) {
    if (["/api/maintenance", "/api/dashboard/account", "/api/dashboard/logout", "/api/dashboard/login", "/api/dashboard/callback"].includes(path) || path.startsWith("/api/auth/")) return NextResponse.next();
    try {
      const state = await maintenanceStatus();
      if (state.enabled || (state.user && path === "/api/user-dashboard") || (state.dashboard && (path === "/api/dashboard" || path.startsWith("/api/dashboard/servers/")))) {
        return NextResponse.json({ error: "Under maintenance." }, { status: 503 });
      }
    } catch { return NextResponse.json({ error: "Maintenance status unavailable." }, { status: 503 }); }
    return NextResponse.next();
  }
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const userId = await getAdminSessionUserId(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const isAllowed = !!userId && getAllowedDiscordUserIds().has(userId);

  if (isAllowed) {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) &&
        request.headers.get("origin") !== new URL(process.env.WEBSITE_URL || request.nextUrl.origin).origin) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Sign in with an authorized Discord account.",
      },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/", "/dashboard", "/server-dashboard", "/admin/:path*", "/api/:path*"],
};
