import { NextResponse } from "next/server";
import { maintenanceStatus } from "@/lib/web-maintenance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await maintenanceStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Maintenance status unavailable" }, { status: 503 });
  }
}
