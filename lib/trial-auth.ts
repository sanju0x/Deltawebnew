import { NextRequest } from "next/server";
import { createSignedValue, readSignedValue, validSigningKey } from "@/lib/admin-auth";

export const TRIAL_SESSION_COOKIE = "delta_trial_session";
export const TRIAL_STATE_COOKIE = "delta_trial_oauth_state";
export const trialCookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 };

export function trialSecret() {
  const secret = process.env.TRIAL_SESSION_SECRET?.trim();
  if (!secret || !validSigningKey(secret)) throw new Error("TRIAL_SESSION_SECRET needs a strong signing key");
  return secret;
}

export function trialOrigin(request: NextRequest) {
  return new URL(process.env.WEBSITE_URL || request.nextUrl.origin).origin;
}

export function trialRedirectUri(request: NextRequest) {
  return process.env.DISCORD_TRIAL_REDIRECT_URI || `${trialOrigin(request)}/api/trial/callback`;
}

export function createTrialSession(userId: string) {
  return createSignedValue({ purpose: "trial", userId, expiresAt: Date.now() + 86_400_000 }, trialSecret());
}

export async function trialUserId(request: NextRequest) {
  const session = await readSignedValue<{ purpose?: string; userId?: string; expiresAt?: number }>(request.cookies.get(TRIAL_SESSION_COOKIE)?.value, trialSecret());
  if (session?.purpose !== "trial" || !session.userId || !/^\d{17,20}$/.test(session.userId) || typeof session.expiresAt !== "number" || session.expiresAt <= Date.now()) return null;
  return session.userId;
}
