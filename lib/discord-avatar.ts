/** Public Discord CDN URL for an authenticated user's avatar. */
export function discordAvatarUrl(id: string, hash: string | null | undefined) {
  if (!/^\d{17,20}$/.test(id)) return null;
  if (hash && /^[a-zA-Z0-9_]+$/.test(hash)) {
    const format = hash.startsWith("a_") ? "gif" : "webp";
    return `https://cdn.discordapp.com/avatars/${id}/${hash}.${format}?size=128`;
  }
  const index = Number((BigInt(id) >> BigInt(22)) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
