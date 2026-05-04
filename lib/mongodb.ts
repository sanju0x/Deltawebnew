const endpoint = process.env.MONGODB_DATA_API_URL;
const apiKey = process.env.MONGODB_DATA_API_KEY;
const dataSource = process.env.MONGODB_DATA_SOURCE || "Cluster0";
const database = process.env.MONGODB_DB_NAME || "deltaweb";

async function run(action: string, body: Record<string, unknown>) {
  if (!endpoint || !apiKey) {
    throw new Error("Missing MongoDB Data API configuration");
  }
  const response = await fetch(`${endpoint}/action/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({ dataSource, database, ...body }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("MongoDB request failed");
  }
  return response.json();
}

export async function insertBugReport(document: Record<string, unknown>) {
  return run("insertOne", { collection: "bug_reports", document });
}

export async function findBugReports(filter: Record<string, unknown>) {
  return run("find", { collection: "bug_reports", filter, sort: { created_at: -1 } });
}

export async function updateBugReport(id: string, status: string) {
  return run("updateOne", {
    collection: "bug_reports",
    filter: { _id: { $oid: id } },
    update: { $set: { status, updated_at: new Date().toISOString() } },
  });
}

export async function deleteBugReport(id: string) {
  return run("deleteOne", { collection: "bug_reports", filter: { _id: { $oid: id } } });
}

export async function upsertAdminUser(filter: Record<string, unknown>, set: Record<string, unknown>) {
  return run("updateOne", {
    collection: "admin_users",
    filter,
    update: { $set: set },
    upsert: true,
  });
}
