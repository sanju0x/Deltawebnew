import { getDb } from "@/lib/mongodb";

export async function recordActivity(category: "Dashboard" | "Trial", title: string, userId?: string, guildId?: string) {
  try {
    const db = await getDb();
    await db.collection("site_activity").insertOne({ category, title, userId, guildId, createdAt: new Date() });
  } catch {
    console.error("Could not record website activity", category, title);
  }
}
