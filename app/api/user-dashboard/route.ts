import { NextRequest, NextResponse } from "next/server";
import { dashboardError, DashboardError, dashboardSession, requireSameOrigin } from "@/lib/dashboard-auth";
import { getDb } from "@/lib/mongodb";
import { getTrialStatus } from "@/lib/trials";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { userId, username } = await dashboardSession(request);
    const db = await getDb();
    const usage = db.collection("personal_usage");
    const top = (kind: string) => usage.find({ userId, kind }).sort({ count: -1, name: 1 }).project({ _id: 0, name: 1, count: 1 }).limit(1).next();
    const [trial, access, playlists, song, command] = await Promise.all([
      getTrialStatus(userId), db.collection<{_id: string; users: string[]}>("bot_access").findOne({ _id: "no-prefix", users: userId }, { projection: { _id: 1 } }),
      db.collection("playlists").find({ userId }).sort({ name: 1 }).project({ name: 1, size: { $size: "$tracks" } }).toArray(),
      top("song"), top("command")
    ]);
    return NextResponse.json({ username, permanent: !!access, trial, playlists, song, command }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return dashboardError(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const { userId } = await dashboardSession(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id || !/^[a-f\d]{24}$/i.test(id)) throw new DashboardError("Invalid playlist.");
    const result = await (await getDb()).collection("playlists").deleteOne({ _id: new ObjectId(id), userId });
    if (!result.deletedCount) throw new DashboardError("Playlist no longer exists.", 404);
    return NextResponse.json({ deleted: true });
  } catch (error) { return dashboardError(error); }
}
