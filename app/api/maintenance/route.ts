import { NextResponse } from "next/server";
import { trialCollections } from "@/lib/trials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { settings } = await trialCollections();
    const config = await settings.findOne({ _id: "website-maintenance" });
    return NextResponse.json({ enabled: config?.enabled === true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Maintenance status unavailable" }, { status: 503 });
  }
}
