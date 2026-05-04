import { NextRequest, NextResponse } from "next/server";
import { insertBugReport } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await insertBugReport({
      title: body.title,
      description: body.description,
      category: body.category,
      severity: body.severity,
      reporter_email: body.email || null,
      reporter_discord_username: body.discordUsername || null,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit bug report" }, { status: 500 });
  }
}
