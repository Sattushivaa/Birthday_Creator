import crypto from 'node:crypto';
import { getDb } from './db.js';
import { getPasswordHash, setPasswordHash } from './store.js';

/**
 * Authentication helpers — all state lives in MongoDB so this works on
 * serverless (no local files). Sessions are stored hashed (sha256) with a
 * Mongo TTL index that drops them after the expiry.
 */

const DEFAULT_PASSWORD_HASH = '$2a$10$3/X/6gwEhBI/0GdNU1dvhuE1mJxNYheOQIv0KRtr/GdxAZjKIAWjS';

/** Ensure a password hash exists (first boot), then return it. */
export async function ensurePasswordHash() {
  let hash = await getPasswordHash();
  if (!hash) {
    hash = process.env.ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH;
    await setPasswordHash(hash);
  }
  return hash;
}

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    import('bcryptjs').then((mod) => {
      const bcrypt = mod.default ?? mod;
      bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash)));
    }, reject);
  });
}

export async function verifyPassword(password, hash) {
  const mod = await import('bcryptjs');
  const bcrypt = mod.default ?? mod;
  return bcrypt.compare(password, hash);
}

export function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Create a session; returns the raw token the client cookie must hold. */
export async function createSession(ttlMs) {
  const db = await getDb();
  const token = createToken();
  const expires = new Date(Date.now() + ttlMs);
  await db.collection('sessions').updateOne(
    { tokenHash: hashToken(token) },
    { $set: { tokenHash: hashToken(token), expires } },
    { upsert: true }
  );
  return token;
}

export async function isSessionValid(token) {
  if (!token) return false;
  try {
    const db = await getDb();
    const session = await db.collection('sessions').findOne({ tokenHash: hashToken(token) });
    return !!session && new Date(session.expires).getTime() > Date.now();
  } catch {
    return false;
  }
}

export async function revokeSession(token) {
  if (!token) return;
  const db = await getDb();
  await db.collection('sessions').deleteOne({ tokenHash: hashToken(token) });
}