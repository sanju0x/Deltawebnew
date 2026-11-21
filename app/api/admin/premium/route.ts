import { readAdminInput, premiumActionInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    
    const config = await db.collection("premium_config").findOne({ type: "settings" });
    const features = await db.collection("premium_features").find({}).sort({ order: 1 }).toArray();
    const plans = await db.collection("premium_plans").find({}).sort({ order: 1 }).toArray();
    const comparisons = await db.collection("premium_comparisons").find({}).sort({ order: 1 }).toArray();

    return NextResponse.json({
      config: config || { enabled: true, paymentLink: "" },
      features,
      plans,
      comparisons,
    });
  } catch (error) {
    console.error("Error fetching premium:", error);
    return NextResponse.json({ error: "Failed to fetch premium data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, premiumActionInput);
    if (body instanceof Response) return body;
    const { action, data } = body;

    const db = await getDb();

    switch (action) {
      case "updateConfig":
        await db.collection("premium_config").updateOne(
          { type: "settings" },
          { $set: { ...data, type: "settings", updatedAt: new Date() } },
          { upsert: true }
        );
        break;

      case "addFeature":
        await db.collection("premium_features").insertOne({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        break;

      case "addPlan":
        await db.collection("premium_plans").insertOne({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        break;

      case "addComparison":
        await db.collection("premium_comparisons").insertOne({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating premium:", error);
    return NextResponse.json({ error: "Failed to update premium" }, { status: 500 });
  }
}
