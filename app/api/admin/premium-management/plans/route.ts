import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
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
