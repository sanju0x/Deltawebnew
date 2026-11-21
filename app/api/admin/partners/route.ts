import { readAdminInput, partnerInput } from "@/lib/admin-input";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, adminWriteError } from "@/lib/admin-access";
import { getDb } from "@/lib/mongodb";

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
  const denied = await adminWriteError(request);
  if (denied) return denied;

  try {
    const body = await readAdminInput(request, partnerInput);
    if (body instanceof Response) return body;
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
