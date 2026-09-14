import 'dotenv/config';
import { getDb } from './db.js';
import { seedIfNeeded } from './seed.js';
import { ensurePasswordHash } from './auth.js';
import createApp from './app.js';

const PORT = process.env.PORT || 3001;

async function main() {
  await getDb();
  await seedIfNeeded();
  await ensurePasswordHash();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`\n  ✨ Birthday server listening on http://localhost:${PORT}`);
    console.log(`  Public:  http://localhost:${PORT}\n  Creator: http://localhost:${PORT}/creator\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});