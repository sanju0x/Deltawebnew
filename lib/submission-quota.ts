import type { Db } from "mongodb";

// One persistent document per endpoint bounds storage and coordinates all instances.
export async function submissionQuota(db: Db, endpoint: string, maximum: number, now = Date.now()) {
  const window = Math.floor(now / 60000);
  const counters = db.collection<{ _id: string; window: number; count: number }>("website_submission_limits");
  const previous = await counters.findOneAndUpdate({ _id: endpoint }, [{
    $set: {
      window: { $max: [window, "$window"] },
      count: { $cond: [
        { $gte: ["$window", window] },
        { $min: [maximum, { $add: ["$count", 1] }] },
        1,
      ] },
    },
  }], { upsert: true, returnDocument: "before" });
  if (previous && previous.window >= window && previous.count >= maximum) {
    return Response.json({ error: "Too many requests. Please try again shortly." }, {
      status: 429, headers: { "Retry-After": String(Math.ceil(((previous.window + 1) * 60000 - now) / 1000)) },
    });
  }
}
