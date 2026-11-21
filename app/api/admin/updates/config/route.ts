import { readAdminInput, updateSettingsInput } from "@/lib/admin-input";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/mongodb";
import { adminWriteError } from "@/lib/admin-access";

export async function PUT(request: NextRequest) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, updateSettingsInput);
    if (body instanceof Response) return body;
    const { pageEnabled } = body;

    const db = await getDb();
    await db.collection("updates_config").updateOne(
      {},
      {
        $set: {
          pageEnabled: !!pageEnabled,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating updates config:", error);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
