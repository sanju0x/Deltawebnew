import { readAdminInput, planInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, planInput);
    if (body instanceof Response) return body;
    const db = await getDb();

    const result = await db.collection("premium_plans_config").insertOne({
      name: body.name,
      price: body.price,
      duration: body.duration,
      features: body.features || [],
      color: body.color || "from-primary to-red-700",
      popular: body.popular || false,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Error adding premium plan:", error);
    return NextResponse.json({ error: "Failed to add premium plan" }, { status: 500 });
  }
}
