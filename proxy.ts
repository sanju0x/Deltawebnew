import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionUserId,
  getAllowedDiscordUserIds,
} from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  const userId = await getAdminSessionUserId(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const isAllowed = !!userId && getAllowedDiscordUserIds().has(userId);

  if (!isAllowed) {
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        {
          error: "Admin access denied",
          message: allowedIps.length
            ? "This IP address is not in ADMIN_ALLOWED_IPS."
            : "ADMIN_ALLOWED_IPS is not configured.",
        },
        { status: 403 },
      );
    }

    return new NextResponse(
      `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Access denied | Delta</title>
          <style>
            body{margin:0;min-height:100vh;display:grid;place-items:center;background:#100f0d;color:#fff8ed;font-family:Arial,sans-serif}
            main{max-width:34rem;padding:2rem;text-align:center}
            img{width:5rem;height:5rem;background:#fff;border-radius:1.5rem;padding:.75rem}
            h1{font-size:clamp(2.5rem,8vw,5rem);margin:1.5rem 0 .75rem;line-height:.9}
            p{color:#bdb5aa;line-height:1.6}
            code{color:#ff756a}
          </style>
        </head>
        <body>
          <main>
            <img src="/icon.svg" alt="Delta">
            <h1>Private by design.</h1>
            <p>This admin area is available only to IP addresses listed in <code>ADMIN_ALLOWED_IPS</code>.</p>
          </main>
        </body>
      </html>`,
      {
        status: 403,
        headers: { "content-type": "text/html; charset=utf-8" },
      },
    );
  }

  return NextResponse.redirect(new URL("/api/auth/discord/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
