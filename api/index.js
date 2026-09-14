import 'dotenv/config';
import { getDb } from '../server/db.js';
import { seedIfNeeded } from '../server/seed.js';
import { ensurePasswordHash } from '../server/auth.js';
import createApp from '../server/app.js';

/**
 * Vercel serverless entry point. The Express app is built once and reused
 * while the function stays warm; on the first invocation we also ensure the
 * MongoDB connection and seed the demo content.
 */
let app = null;
let readyPromise = null;

export default async function handler(req, res) {
  if (!readyPromise) {
    readyPromise = (async () => {
      await getDb();
      await seedIfNeeded();
      await ensurePasswordHash();
      app = createApp();
    })();
  }
  await readyPromise;
  return app(req, res);
}