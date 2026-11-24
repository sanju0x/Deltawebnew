import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Existing admin login URL now uses the shared Discord OAuth flow.
// The OAuth callback still enforces the administrator allowlist.
export function GET(_request: NextRequest) {
  return NextResponse.redirect("https://delta-bot.online/api/dashboard/login?view=admin");
}
