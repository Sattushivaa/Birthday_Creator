import { MongoClient } from 'mongodb';

/**
 * Singleton MongoDB connection (also safe across Vercel warm starts — the
 * connection is reused while the serverless function stays warm).
 *
 * MONGODB_URI is read from the environment (.env locally, Vercel env vars in
 * production). MONGODB_DB picks the database name (defaults to "birthday").
 */
let client = null;
let db = null;

export async function getDb() {
  if (db) return db;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const dbName = process.env.MONGODB_DB || 'birthday';

  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    // Atlas scales connections down for serverless; keep it modest.
    maxPoolSize: 10
  });
  await client.connect();
  db = client.db(dbName);

  // Keep indexes in sync on first connect.
  try {
    await db.collection('media').createIndex({ key: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ tokenHash: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 });
  } catch (err) {
    console.error('Failed to create indexes:', err.message);
  }
  return db;
}

export async function closeDb() {
  try {
    await client?.close();
  } finally {
    client = null;
    db = null;
  }
}