import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey(sessionToken: string) {
  return createHash("sha256").update("delta:dashboard:discord-token:v1:").update(sessionToken).digest();
}

export function sealDiscordToken(accessToken: string, sessionToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(sessionToken), iv);
  const ciphertext = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function openDiscordToken(envelope: string, sessionToken: string) {
  const bytes = Buffer.from(envelope, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(sessionToken), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}
