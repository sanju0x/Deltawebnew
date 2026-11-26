import { getDb } from "@/lib/mongodb";

export type BetaTester = { _id: string; grantedBy: string; grantedAt: number };

export async function betaTesterCollection() {
  return (await getDb()).collection<BetaTester>("website_beta_testers");
}

// Read the current grant on every check so existing sessions lose access on revoke.
export async function isBetaTester(userId: string) {
  if (typeof userId !== "string" || !/^\d{17,20}$/.test(userId)) return false;
  return !!await (await betaTesterCollection()).findOne({ _id: userId });
}
