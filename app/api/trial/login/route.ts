import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Compatibility endpoint: all Discord sign-ins begin on the main Delta website.
// Claiming a trial remains a separate, explicit action after authentication.
export function GET(_request: NextRequest) {
  return NextResponse.redirect("https://delta-bot.online/api/dashboard/login?view=trial");
}
