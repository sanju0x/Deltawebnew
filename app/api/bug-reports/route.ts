import { submissionQuota } from "@/lib/submission-quota";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { readSubmission, submissionLimit } from "@/lib/public-submission";

const limit = submissionLimit(6, 120);

export async function POST(request: NextRequest) {
  try {
    const body = await readSubmission(request, limit, 24000);
    if (body instanceof Response) return body;
    if (!body.title?.trim() || body.title.length > 120 ||
        !body.description?.trim() || body.description.length > 4000 ||
        !["playback", "commands", "audio", "permissions", "ui", "other"].includes(body.category) ||
        !["low", "medium", "high", "critical"].includes(body.severity) ||
        (body.email && (body.email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(body.email))) ||
        (body.discordUsername && body.discordUsername.length > 100)) {
      return NextResponse.json({ error: "Invalid bug report fields" }, { status: 400 });
    }
    const db = await getDb();
    const limited = await submissionQuota(db, "bug-reports", 120);
    if (limited) return limited;
    await db.collection("bug_reports").insertOne({
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
