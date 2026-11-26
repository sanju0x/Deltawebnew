import { NextRequest, NextResponse } from "next/server";
import { maintenanceStatus, canBypassMaintenance } from "@/lib/web-maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = await maintenanceStatus();
    const canBypass = (status.enabled || status.dashboard || status.user) && await canBypassMaintenance(request);
    return NextResponse.json({ ...status, canBypass }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
  } catch {
    return NextResponse.json({ error: "Maintenance status unavailable" }, { status: 503 });
  }
}
