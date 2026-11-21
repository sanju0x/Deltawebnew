export function webLink(value: unknown): string | undefined {
  if (typeof value !== "string" || !value || value.length > 2048) return;
  // Allow same-site relative paths and fragments used by existing content.
  try {
    const url = new URL(value, "https://local.invalid");
    if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) return value;
  } catch { /* Invalid stored URL. */ }
}
