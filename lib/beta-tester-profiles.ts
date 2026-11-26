import { getDb } from "@/lib/mongodb";
import { discordAvatarUrl } from "@/lib/discord-avatar";

export type TesterProfile = { displayName: string | null; username: string | null; avatarUrl: string | null };

export async function betaTesterProfiles(userIds: string[]) {
  const profiles = new Map<string, TesterProfile>();
  if (!userIds.length) return profiles;
  const db = await getDb();
  const [saved, usage, sessions] = await Promise.all([
    db.collection<{ _id: string; displayName: string; username: string; avatar: string | null }>("discord_profiles")
      .find({ _id: { $in: userIds } }, { projection: { displayName: 1, username: 1, avatar: 1 } }).toArray(),
    db.collection<{ _id: string; name?: string; username?: string; image?: string }>("bot_usage")
      .find({ _id: { $in: userIds.map(id => `user:${id}`) } }, { projection: { name: 1, username: 1, image: 1 } }).toArray(),
    // Older sign-ins saved a display name as username. Never expose session tokens.
    db.collection<{ userId: string; username: string; discordUsername?: string; avatar?: string; expiresAt: Date }>("dashboard_sessions")
      .find({ userId: { $in: userIds } }, { projection: { userId: 1, username: 1, discordUsername: 1, avatar: 1, expiresAt: 1 } })
      .sort({ expiresAt: -1 }).toArray(),
  ]);
  for (const row of sessions) {
    if (!profiles.has(row.userId)) profiles.set(row.userId, {
      displayName: row.username || null, username: row.discordUsername || null,
      avatarUrl: discordAvatarUrl(row.userId, row.avatar),
    });
  }
  for (const row of usage) {
    const id = row._id.slice(5);
    const previous = profiles.get(id);
    profiles.set(id, {
      displayName: (row.name && row.name !== id ? row.name : null) || previous?.displayName || null,
      username: row.username || previous?.username || null,
      avatarUrl: row.image || previous?.avatarUrl || discordAvatarUrl(id, null),
    });
  }
  for (const row of saved) profiles.set(row._id, {
    displayName: row.displayName || row.username || null, username: row.username || null,
    avatarUrl: discordAvatarUrl(row._id, row.avatar),
  });
  return profiles;
}
