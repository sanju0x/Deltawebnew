import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/";
  const origin = request.nextUrl.origin;
  return NextResponse.redirect(`${origin}${next}`);
}
