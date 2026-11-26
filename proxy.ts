import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionUserId,
  getAllowedDiscordUserIds,
} from "@/lib/admin-auth";

import { maintenanceStatus, canBypassMaintenance, maintenanceBlocksPath } from "@/lib/web-maintenance";

function privateMaintenanceResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.append("Vary", "Cookie");
  return response;
}

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
      if (maintenanceBlocksPath(state, path)) {
        if (!await canBypassMaintenance(request)) {
          return privateMaintenanceResponse(NextResponse.json({ error: "Under maintenance." }, { status: 503 }));
        }
        return privateMaintenanceResponse(NextResponse.next());
      }
    } catch { return NextResponse.json({ error: "Maintenance status unavailable." }, { status: 503 }); }
    return NextResponse.next();
  }
  if (!path.startsWith("/admin") && !path.startsWith("/api/admin")) {
    if (path === "/maintenance") return NextResponse.next();
    try {
      const state = await maintenanceStatus();
      if (!maintenanceBlocksPath(state, path)) return NextResponse.next();
      if (await canBypassMaintenance(request)) return privateMaintenanceResponse(NextResponse.next());
    } catch { /* Keep public pages closed when maintenance cannot be verified. */ }
    const response = NextResponse.rewrite(new URL("/maintenance", request.url), { status: 503 });
    return privateMaintenanceResponse(response);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|woff|woff2)$).*)"],
};
