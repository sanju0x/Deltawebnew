import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    
    // Get premium config
    const config = await db.collection("premium_config").findOne({ type: "settings" });
    
    // Get features
    const features = await db
      .collection("premium_features")
      .find({})
      .sort({ order: 1 })
      .toArray();
    
    // Get plans
    const plans = await db
      .collection("premium_plans")
      .find({})
      .sort({ order: 1 })
      .toArray();
    
    // Get comparisons
    const comparisons = await db
      .collection("premium_comparisons")
      .find({})
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({
      config: config || { enabled: true },
      features,
      plans,
      comparisons,
    });
  } catch (error) {
    console.error("Error fetching premium:", error);
    return NextResponse.json(
      { error: "Failed to fetch premium data" },
      { status: 500 }
    );
  }
}
