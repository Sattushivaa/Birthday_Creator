import crypto from 'node:crypto';
import { getDb } from './db.js';

/**
 * MongoDB-backed data layer for the birthday site.
 *
 * Collections:
 *   site      — single document (_id: 'main') with the full site config.
 *   media     — uploaded/generated files keyed by "/uploads/<name>" URL path.
 *   meta      — a couple of scalars, currently the password hash.
 *
 * All functions are async and safe to run on Vercel serverless functions
 * (no local filesystem is touched).
 */

const DEFAULT_CONFIG = {
  person: {
    name: '',
    nickname: '',
    birthdayHeading: 'Happy Birthday,',
    heroImage: ''
  },
  intro: { title: '', subtitle: '' },
  music: { src: '', title: '', artist: '', cover: '' },
  memories: [],
  timeline: [],
  finalMessage: {
    title: 'Happy Birthday,',
    name: '',
    message: '',
    image: '',
    signature: ''
  },
  appearance: {
    accent: '#e8b4b8',
    particles: true,
    grain: true,
    vignette: true,
    animation: 'medium',
    font: 'serif'
  }
};

/* ── Site config ─────────────────────────────────────────────────────── */

/**
 * Read the current site config straight from MongoDB.
 *
 * NOTE: intentionally NOT cached in memory. The same code runs on Vercel
 * serverless functions, where each warm instance holds its own module state;
 * a cached config would go stale on every instance except the one that
 * handled the creator's save, so a separate viewer served by another instance
 * would keep seeing old content (e.g. a replaced memory photo) indefinitely.
 * The config is a single tiny document read by _id — a Mongo read per
 * request is negligible at this scale.
 */
export async function getConfig() {
  const db = await getDb();
  const doc = await db.collection('site').findOne({ _id: 'main' });
  if (!doc) return null; // not initialised yet — seed runs on first boot
  delete doc._id;
  delete doc.updatedAt;
  return doc;
}

export async function saveConfig(patch) {
  const db = await getDb();
  const current = (await getConfig()) || structuredClone(DEFAULT_CONFIG);
  // Deep-merge the provided patch (arrays are replaced wholesale).
  const next = { ...current, ...patch };
  for (const key of Object.keys(patch)) {
    if (
      patch[key] &&
      typeof patch[key] === 'object' &&
      !Array.isArray(patch[key]) &&
      current[key] &&
      typeof current[key] === 'object' &&
      !Array.isArray(current[key])
    ) {
      next[key] = { ...current[key], ...patch[key] };
    }
  }
  next.updatedAt = new Date().toISOString();
  const { _id, ...rest } = next;
  await db.collection('site').updateOne({ _id: 'main' }, { $set: rest }, { upsert: true });
  return next;
}

export async function replaceConfig(next) {
  const db = await getDb();
  next.updatedAt = new Date().toISOString();
  const { _id, ...rest } = next;
  await db.collection('site').updateOne({ _id: 'main' }, { $set: rest }, { upsert: true });
  return next;
}

/** Wipe the site config back to bare defaults (used by "Reset to placeholders"). */
export async function resetConfig() {
  const fresh = structuredClone(DEFAULT_CONFIG);
  return replaceConfig(fresh);
}

/* ── Media files (stored in MongoDB — no filesystem) ─────────────────── */

export function urlForMedia(name, kind) {
  // name must be a bare filename; kind is images/audio/video
  const safe = String(name || '').replace(/[^a-zA-Z0-9._-]/g, '');
  return `/uploads/${kind}/${safe}`;
}

export function generateKey(kind, originalName) {
  const ext = originalName ? `.${String(originalName).split('.').pop().toLowerCase().slice(0, 10).replace(/[^a-z0-9]/g, '')}` : '';
  return `/uploads/${kind}/${crypto.randomUUID().slice(0, 13)}${ext}`;
}

export async function saveMedia({ key, contentType, data, size }) {
  const db = await getDb();
  await db.collection('media').updateOne(
    { key },
    { $set: { key, contentType, data: Buffer.from(data), size: size ?? Buffer.byteLength(data), createdAt: new Date() } },
    { upsert: true }
  );
  return { key, contentType, size: size ?? Buffer.byteLength(data) };
}

export async function getMedia(key) {
  const db = await getDb();
  return db.collection('media').findOne({ key });
}

export async function deleteMedia(key) {
  const db = await getDb();
  await db.collection('media').deleteOne({ key });
}

export async function mediaExists(key) {
  const db = await getDb();
  const found = await db.collection('media').findOne({ key }, { projection: { _id: 1 } });
  return !!found;
}

/* ── Password hash (meta collection) ─────────────────────────────────── */

export async function getPasswordHash() {
  const db = await getDb();
  const doc = await db.collection('meta').findOne({ _id: 'credentials' });
  return doc?.hash || null;
}

export async function setPasswordHash(hash) {
  const db = await getDb();
  await db.collection('meta').updateOne(
    { _id: 'credentials' },
    { $set: { hash, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );
}