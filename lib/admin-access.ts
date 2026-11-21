import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";

export async function verifyAdmin() {
  const cookieStore = await cookies();
  const userId = await getAdminSessionUserId(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  return userId !== null && getAllowedDiscordUserIds().has(userId);
}

export async function adminWriteError(request: Request) {
  if (!(await verifyAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request.headers.get("origin") !== new URL(process.env.WEBSITE_URL || request.url).origin) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }
}
