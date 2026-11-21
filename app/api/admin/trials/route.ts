import { readJsonObject } from "@/lib/request-json.js";
import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";
import { trialOrigin } from "@/lib/trial-auth";
import { trialCollections } from "@/lib/trials";

export const runtime = "nodejs";
async function adminId(request: NextRequest) {
  const id = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return id && getAllowedDiscordUserIds().has(id) ? id : null;
}
export async function GET(request: NextRequest) {
  if (!await adminId(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { claims, settings } = await trialCollections();
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId && !/^\d{17,20}$/.test(userId)) return NextResponse.json({ error: "Invalid Discord user ID" }, { status: 400 });
    const [config, users] = await Promise.all([
      settings.findOne({ _id: "trials" }),
      claims.find(userId ? { _id: userId } : {}).sort({ claimedAt: -1 }).limit(100).toArray()
    ]);
    return NextResponse.json({ enabled: config?.enabled !== false, users }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Trial database unavailable" }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  const id = await adminId(request);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (request.headers.get("origin") !== trialOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await readJsonObject(request, 4096);
  if (body instanceof Response) return body;
  const { action } = body;
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (typeof action !== "string" || !["enable", "disable", "reset", "reset-all", "enable-user", "disable-user"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (!["enable", "disable", "reset-all"].includes(action) && !/^\d{17,20}$/.test(userId)) return NextResponse.json({ error: "Enter a valid Discord user ID" }, { status: 400 });
  try {
    const { claims, settings } = await trialCollections();
    if (action === "reset-all") {
      const result = await claims.deleteMany({});
      return NextResponse.json({ ok: true, deletedCount: result.deletedCount }, { headers: { "Cache-Control": "no-store" } });
    }
    const audit = { updatedBy: id, updatedAt: Date.now() };
    if (action === "enable" || action === "disable") {
      await settings.updateOne({ _id: "trials" }, { $set: { enabled: action === "enable", ...audit } }, { upsert: true });
    } else if (action === "reset") {
      // Keep any user block; enabling that user is a separate, explicit action.
      await claims.updateOne({ _id: userId }, { $set: { claimed: false, endsAt: null, notifiedAt: null, notifyAfter: null, startNotificationPending: false, ...audit }, $unset: { notifyLease: "", notifyError: "", claimedAt: "", startNotifyLease: "", startNotifyError: "", startNotifiedAt: "", startNotifyAfter: "" } }, { upsert: true });
    } else {
      await claims.updateOne({ _id: userId }, {
        $set: { disabled: action === "disable-user", ...(action === "enable-user" ? { notifiedAt: null, notifyAfter: null } : {}), ...audit },
        $setOnInsert: { claimed: false },
        ...(action === "enable-user" ? { $unset: { notifyLease: "", notifyError: "" } } : {})
      }, { upsert: true });
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Trial update failed" }, { status: 503 }); }
}
