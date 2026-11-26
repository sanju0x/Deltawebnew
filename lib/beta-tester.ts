// Verified with Discord on login and again when bypassing maintenance.
export async function discordBetaTester(accessToken: string) {
  const roleId = process.env.BETA_TESTER_ROLE_ID?.trim();
  const guildId = process.env.BETA_TESTER_GUILD_ID?.trim();
  if (!roleId || !guildId || !/^\d{17,20}$/.test(roleId) || !/^\d{17,20}$/.test(guildId)) return false;
  try {
    const response = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return false;
    const member = await response.json();
    return Array.isArray(member.roles) && member.roles.includes(roleId);
  } catch { return false; }
}
