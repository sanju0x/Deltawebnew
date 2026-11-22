import { trialCollections } from "@/lib/trials";

export async function maintenanceStatus() {
  const { settings } = await trialCollections();
  const rows = await settings.find({ _id: { $in: ["website-maintenance", "dashboard-maintenance", "user-maintenance"] } }).toArray();
  const enabled = new Set(rows.filter(row => row.enabled).map(row => row._id));
  return { enabled: enabled.has("website-maintenance"), dashboard: enabled.has("dashboard-maintenance"), user: enabled.has("user-maintenance") };
}
