import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";
import { trialOrigin } from "@/lib/trial-auth";
import { betaTesterCollection } from "@/lib/beta-tester";
import { readJsonObject } from "@/lib/request-json.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

async function adminId(request: NextRequest) {
  const id = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return id && getAllowedDiscordUserIds().has(id) ? id : null;
}

export async function GET(request: NextRequest) {
  if (!await adminId(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  try {
    const testers = await (await betaTesterCollection()).find({}).sort({ grantedAt: -1, _id: 1 }).toArray();
    return NextResponse.json({ testers: testers.map(row => ({ userId: row._id, grantedAt: row.grantedAt })) }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not load beta testers" }, { status: 503, headers });
  }
}

export async function POST(request: NextRequest) {
  const id = await adminId(request);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  if (request.headers.get("origin") !== trialOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403, headers });
  const body = await readJsonObject(request, 4096);
  if (body instanceof Response) return body;
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!/^\d{17,20}$/.test(userId)) return NextResponse.json({ error: "Enter a valid Discord user ID (17–20 digits)." }, { status: 400, headers });
  if (body.action !== "grant" && body.action !== "revoke") return NextResponse.json({ error: "Unknown action" }, { status: 400, headers });
  try {
    const testers = await betaTesterCollection();
    if (body.action === "grant") {
      await testers.updateOne({ _id: userId }, { $setOnInsert: { grantedBy: id, grantedAt: Date.now() } }, { upsert: true });
    } else {
      await testers.deleteOne({ _id: userId });
    }
    return NextResponse.json({ userId, enabled: body.action === "grant" }, { headers });
  } catch {
    return NextResponse.json({ error: "Could not update beta tester access" }, { status: 503, headers });
  }
}
