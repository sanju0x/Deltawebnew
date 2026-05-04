import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const partners = await db
      .collection("partners")
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ data: partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      logo,
      iconUrl,
      bannerUrl,
      website,
      inviteLink,
      members,
      type,
      features,
      order,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("partners").insertOne({
      name,
      description: description || "",
      logo: logo || name.substring(0, 2).toUpperCase(),
      iconUrl: iconUrl || null,
      bannerUrl: bannerUrl || null,
      website: website || null,
      inviteLink: inviteLink || null,
      members: members || null,
      type, // 'featured' or 'community'
      features: features || [],
      order: order || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 }
    );
  }
}
