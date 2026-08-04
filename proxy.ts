import { NextRequest, NextResponse } from "next/server";

function normalizeIp(value: string) {
  return value.trim().replace(/^::ffff:/, "").replace(/^\[|\]$/g, "");
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const candidate = forwarded?.split(",")[0] || realIp || "";
  return normalizeIp(candidate);
}

function getAllowedIps() {
  return (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .map(normalizeIp)
    .filter(Boolean);
}

export function proxy(request: NextRequest) {
  const clientIp = getClientIp(request);
  const allowedIps = getAllowedIps();
  const isAllowed = clientIp !== "" && allowedIps.includes(clientIp);

  if (!isAllowed) {
    if (request.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        {
          error: "Admin access denied",
          message: allowedIps.length
            ? "Umb"
            : "Umb.",
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

  const requestHeaders = new Headers(request.headers);
  const cookies = request.headers
    .get("cookie")
    ?.split(";")
    .filter((cookie) => !cookie.trim().startsWith("admin_session="))
    .join("; ");
  requestHeaders.set(
    "cookie",
    [cookies, "admin_session=ip-verified"].filter(Boolean).join("; "),
  );
  requestHeaders.set("x-delta-admin-ip", clientIp);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
