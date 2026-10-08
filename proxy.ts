import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionUserId,
  getAllowedDiscordUserIds,
} from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const userId = await getAdminSessionUserId(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const isAllowed = !!userId && getAllowedDiscordUserIds().has(userId);

  if (isAllowed) return NextResponse.next();

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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
