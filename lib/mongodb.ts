import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI");
}

const client = new MongoClient(uri);
let clientPromise: Promise<MongoClient> | null = null;

export async function getDb() {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  const connectedClient = await clientPromise;
  return connectedClient.db(process.env.MONGODB_DB_NAME || "deltaweb");
}
