import { trialCollections } from "@/lib/trials";
import { NextRequest } from "next/server";
import { dashboardSession } from "@/lib/dashboard-auth";
import { discordBetaTester } from "@/lib/beta-tester";
import { ADMIN_SESSION_COOKIE, getAdminSessionUserId, getAllowedDiscordUserIds } from "@/lib/admin-auth";

export async function canBypassMaintenance(request: NextRequest) {
  const adminId = await getAdminSessionUserId(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (adminId && getAllowedDiscordUserIds().has(adminId)) return true;
  try {
    const session = await dashboardSession(request);
    return await discordBetaTester(session.accessToken);
  } catch { return false; }
}

export function maintenanceBlocksPath(state: { enabled: boolean; dashboard: boolean; user: boolean }, path: string) {
  return state.enabled || (state.dashboard && (path === "/dashboard" || path.startsWith("/dashboard/") || path === "/server-dashboard" || path.startsWith("/server-dashboard/") || path === "/api/dashboard" || path.startsWith("/api/dashboard/servers/"))) ||
    (state.user && (path === "/user-dashboard" || path.startsWith("/user-dashboard/") || path === "/api/user-dashboard"));
}

export async function maintenanceStatus() {
  const { settings } = await trialCollections();
  const rows = await settings.find({ _id: { $in: ["website-maintenance", "dashboard-maintenance", "user-maintenance"] } }).toArray();
  const enabled = new Set(rows.filter(row => row.enabled).map(row => row._id));
  return { enabled: enabled.has("website-maintenance"), dashboard: enabled.has("dashboard-maintenance"), user: enabled.has("user-maintenance") };
}
