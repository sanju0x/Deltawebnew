import { MongoClient, type Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Please add your MongoDB URI to .env as MONGODB_URI");
  // Connect on demand so importing a route does not require a live database.
  // Clear failed connections to allow recovery after a temporary outage.
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch(async (error) => {
      global._mongoClientPromise = undefined;
      await client.close().catch(() => undefined);
      throw error;
    });
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB_NAME || "deltaweb");
}
