import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";
import { trialOrigin } from "@/lib/trial-auth";
import { trialCollections } from "@/lib/trials";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const userId = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!userId || !getAllowedDiscordUserIds().has(userId)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (request.headers.get("origin") !== trialOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body?.enabled !== "boolean") return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  try {
    const { settings } = await trialCollections();
    await settings.updateOne({ _id: "website-maintenance" }, {
      $set: { enabled: body.enabled, updatedBy: userId, updatedAt: Date.now() }
    }, { upsert: true });
    return NextResponse.json({ enabled: body.enabled }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update maintenance mode" }, { status: 503 });
  }
}
