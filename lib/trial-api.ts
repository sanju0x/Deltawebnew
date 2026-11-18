export type TrialStatus = {
  code: "eligible" | "active" | "permanent" | "disabled" | "no_offer" | "cooldown";
  eligible: boolean;
  active: boolean;
  permanent: boolean;
  endsAt: number | null;
  nextOfferAt: number | null;
};

export async function requestBotTrial(userId: string, claim: boolean) {
  const base = process.env.BOT_API_URL;
  const key = process.env.TRIAL_API_KEY;
  if (!base || !key) throw new Error("Trial API is not configured");
  const response = await fetch(new URL(`/api/trials/${userId}${claim ? "/claim" : ""}`, base), {
    method: claim ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok && response.status !== 409) throw new Error("Trial service unavailable");
  const status = await response.json() as TrialStatus;
  if (!status.code || typeof status.eligible !== "boolean") throw new Error("Invalid trial response");
  return { status, statusCode: response.status };
}
