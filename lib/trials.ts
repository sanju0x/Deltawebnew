import { MongoClient } from "mongodb";
import type { TrialStatus } from "./trial-types";

type Claim = {
  _id: string; claimed: boolean; disabled?: boolean; claimedAt?: number;
  endsAt?: number | null; notifiedAt?: number | null; notifyAfter?: number | null;
  notifyLease?: string; notifyError?: string; updatedBy?: string; updatedAt?: number;
  startNotificationPending?: boolean; startNotifiedAt?: number | null;
  startNotifyAfter?: number | null; startNotifyLease?: string; startNotifyError?: string;
};
let connection: Promise<MongoClient> | undefined;
export async function trialDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing");
  if (!connection) {
    connection = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 5 }).connect()
      .catch((error) => { connection = undefined; throw error; });
  }
  return (await connection).db(process.env.TRIAL_MONGODB_DB || "delta_trials");
}
export async function trialCollections() {
  const db = await trialDb();
  return { claims: db.collection<Claim>("claims"), settings: db.collection<{ _id: string; enabled: boolean; updatedBy?: string; updatedAt?: number }>("settings") };
}
export async function getTrialStatus(userId: string): Promise<TrialStatus> {
  const { claims, settings } = await trialCollections();
  const [row, config] = await Promise.all([claims.findOne({ _id: userId }), settings.findOne({ _id: "trials" })]);
  const active = !!row?.claimed && !row.disabled && (row.endsAt || 0) > Date.now();
  const code = row?.disabled ? "disabled" : active ? "active" : row?.claimed ? "used" : config?.enabled === false ? "disabled" : "eligible";
  return { code, eligible: code === "eligible", active, endsAt: row?.endsAt || null };
}
export async function claimTrial(userId: string) {
  const status = await getTrialStatus(userId);
  if (!status.eligible) return { ok: false, ...status };
  const { claims } = await trialCollections();
  const now = Date.now();
  try {
    // Discord ID is the primary key. A competing claim cannot insert or update it again.
    const result = await claims.updateOne({ _id: userId, claimed: { $ne: true }, disabled: { $ne: true } }, {
      $set: { claimed: true, claimedAt: now, endsAt: now + 30 * 86_400_000, notifiedAt: null, notifyAfter: null, startNotificationPending: true, startNotifiedAt: null, startNotifyAfter: null },
      $unset: { notifyLease: "", notifyError: "", startNotifyLease: "", startNotifyError: "" }
    }, { upsert: true });
    return { ok: !!(result.upsertedCount || result.modifiedCount), ...await getTrialStatus(userId) };
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    return { ok: false, ...await getTrialStatus(userId) };
  }
}
