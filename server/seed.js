import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db.js';
import { getConfig, replaceConfig, mediaExists, urlForMedia } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generates soft, abstract "cinematic" placeholder images so the site looks
 * complete immediately, without any network. Each is a dark gradient field
 * with a faint glowing shape — clearly replaceable via the creator studio.
 */
const PLACEHOLDERS = [
  {
    name: 'hero.svg',
    svg: `<svg width="1600" height="1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="42%" r="75%">
          <stop offset="0%" stop-color="#3d3a52"/>
          <stop offset="45%" stop-color="#211f2e"/>
          <stop offset="100%" stop-color="#0a0a0c"/>
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#e8b4b8" stop-opacity=".5"/>
          <stop offset="100%" stop-color="#e8b4b8" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="60"/></filter>
      </defs>
      <rect width="1600" height="1000" fill="url(#g)"/>
      <circle cx="1180" cy="240" r="260" fill="url(#glow)" filter="url(#blur)"/>
      <circle cx="330" cy="780" r="220" fill="#7f6d86" opacity=".25" filter="url(#blur)"/>
      <ellipse cx="800" cy="470" rx="330" ry="470" fill="none" stroke="#e8b4b8" stroke-opacity=".14" stroke-width="2"/>
      <ellipse cx="800" cy="470" rx="520" ry="260" fill="none" stroke="#e8b4b8" stroke-opacity=".08" stroke-width="1.5"/>
    </svg>`
  },
  {
    name: 'mem-1.svg',
    svg: `<svg width="1280" height="960" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2b2438"/>
          <stop offset="100%" stop-color="#0c0b12"/>
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f5d9a8" stop-opacity=".75"/>
          <stop offset="100%" stop-color="#f5d9a8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="960" fill="url(#g)"/>
      <circle cx="860" cy="300" r="200" fill="url(#sun)"/>
      <path d="M0 720 Q 320 640 640 700 T 1280 680 L1280 960 0 960 Z" fill="#14121c"/>
      <path d="M0 800 Q 420 730 780 800 T 1280 780 L1280 960 0 960 Z" fill="#0e0d13"/>
    </svg>`
  },
  {
    name: 'mem-2.svg',
    svg: `<svg width="1280" height="960" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#202836"/>
          <stop offset="100%" stop-color="#0a0c10"/>
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>
      </defs>
      <rect width="1280" height="960" fill="url(#g)"/>
      <circle cx="300" cy="420" r="180" fill="#5f7d9c" opacity=".35" filter="url(#blur)"/>
      <circle cx="960" cy="200" r="150" fill="#4a5f7a" opacity=".3" filter="url(#blur)"/>
      <g stroke="#9db4cc" stroke-opacity=".16" fill="none">
        <path d="M0 660 C 300 580 500 720 800 640 C 1000 580 1150 640 1280 600"/>
        <path d="M0 700 C 320 630 520 760 820 680 C 1020 620 1160 680 1280 640"/>
      </g>
    </svg>`
  },
  {
    name: 'mem-3.svg',
    svg: `<svg width="1280" height="960" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#33251f"/>
          <stop offset="100%" stop-color="#0d0a09"/>
        </linearGradient>
        <filter id="blur"><feGaussianBlur stdDeviation="50"/></filter>
      </defs>
      <rect width="1280" height="960" fill="url(#g)"/>
      <circle cx="420" cy="280" r="200" fill="#c97b5a" opacity=".3" filter="url(#blur)"/>
      <circle cx="1030" cy="700" r="240" fill="#7a4f3a" opacity=".25" filter="url(#blur)"/>
      <rect x="120" y="680" width="1040" height="6" rx="3" fill="#e8b4b8" fill-opacity=".12"/>
    </svg>`
  }
];

// Build a gentle ambient piece aligned to the seeded timeline:
// intro @0s, memory 1 @18s, memory 2 @42s, memory 3 @75s, final @108s.
// Uses slow sine swells with a soft pad underneath (~2.5 min).
function buildToneArray() {
  const sampleRate = 22050;
  const durationSec = 150;
  const totalSamples = durationSec * sampleRate;
  const out = new Float32Array(totalSamples);
  const pad = new Float32Array(totalSamples);

  const addNote = (startSec, freq, vol, len = 9) => {
    const start = Math.floor(startSec * sampleRate);
    const n = Math.floor(len * sampleRate);
    for (let i = 0; i < n && start + i < totalSamples; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t * 0.6);
      const release = Math.exp(-t / (len * 0.38));
      out[start + i] += Math.sin(2 * Math.PI * freq * t) * vol * attack * release;
      out[start + i] += Math.sin(2 * Math.PI * freq * 2.01 * t) * vol * 0.28 * attack * release;
    }
  };

  const addPad = (startSec, dur, freq, vol) => {
    const start = Math.floor(startSec * sampleRate);
    const n = Math.floor(dur * sampleRate);
    for (let i = 0; i < n && start + i < totalSamples; i++) {
      const t = i / sampleRate;
      const env = Math.sin(Math.PI * (i / n)); // slow swell in & out
      pad[start + i] += Math.sin(2 * Math.PI * freq * t) * vol * env;
      pad[start + i] += Math.sin(2 * Math.PI * freq * 0.5 * t) * vol * 0.5 * env;
    }
  };

  const C4 = 261.63, E4 = 329.63, G4 = 392.0, B4 = 493.88, C5 = 523.25, D5 = 587.33, A3 = 220.0, E3 = 164.81;

  // Gentle underlying drone, nearly silent.
  addPad(0, 150, A3, 0.022);
  addPad(0, 150, E3, 0.016);

  // Musical moments aligned with the timeline.
  addNote(0, C4, 0.16, 7);
  addNote(18, E4, 0.15, 7);
  addNote(42, G4, 0.15, 7);
  addNote(75, B4, 0.15, 8);
  // Final chord, slightly richer.
  [C4, E4, G4].forEach((f, i) => addNote(108 + i * 0.5, f, 0.13, 12));

  // Fade the whole track out at the very end.
  const fadeStart = Math.floor((durationSec - 4) * sampleRate);
  for (let i = fadeStart; i < totalSamples; i++) {
    const k = 1 - (i - fadeStart) / (totalSamples - fadeStart);
    out[i] *= k; pad[i] *= k;
  }

  for (let i = 0; i < totalSamples; i++) {
    out[i] = out[i] * 0.72 + pad[i] * 0.55;
  }
  return out;
}

function wavBuffer(samples, sampleRate = 22050) {
  const n = samples.length;
  const buffer = Buffer.alloc(44 + n * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, 44 + i * 2);
  }
  return buffer;
}

/** Ensure placeholder art + ambient track exist in the media collection. */
export async function ensureSeedAssets() {
  const db = await getDb();
  const media = db.collection('media');

  for (const p of PLACEHOLDERS) {
    const key = urlForMedia(p.name, 'images');
    if (await mediaExists(key)) continue;
    await media.updateOne(
      { key },
      { $set: { key, contentType: 'image/svg+xml', data: Buffer.from(p.svg, 'utf8'), size: Buffer.byteLength(p.svg), createdAt: new Date() } },
      { upsert: true }
    );
  }

  const audioKey = urlForMedia('placeholder-v2.wav', 'audio');
  if (!(await mediaExists(audioKey))) {
    const wav = wavBuffer(buildToneArray());
    await media.updateOne(
      { key: audioKey },
      { $set: { key: audioKey, contentType: 'audio/wav', data: wav, size: wav.length, createdAt: new Date() } },
      { upsert: true }
    );
  }
}

/**
 * The full demo content used on a fresh install or after "Reset to placeholders".
 * Each field here is the preferred demo value; applySeed() only fills values
 * that are currently empty, so user content is never clobbered.
 */
const SEED_DEMO = {
  person: {
    name: 'Alex',
    nickname: 'Lex',
    birthdayHeading: 'Happy Birthday,',
    heroImage: '/uploads/images/hero.svg'
  },
  intro: {
    title: 'Something has been waiting for you...',
    subtitle: 'A small collection of moments, set to music.'
  },
  music: {
    src: '/uploads/audio/placeholder-v2.wav',
    title: 'Drifting',
    artist: 'placeholder',
    cover: ''
  },
  memories: [
    {
      id: 'mem-1',
      title: 'The day everything started',
      date: '14 Sep 2019',
      description:
        "We didn't know it yet, but this was the beginning. A random afternoon that turned out to be the most important one.",
      location: 'The old café',
      timestamp: 18,
      image: '/uploads/images/mem-1.svg',
      enabled: true
    },
    {
      id: 'mem-2',
      title: 'That completely chaotic trip',
      date: '3 Jul 2021',
      description:
        'Missed train, wrong directions, terrible weather — and somehow still the best trip of the year. We laughed the whole way.',
      location: 'Somewhere off the map',
      timestamp: 42,
      image: '/uploads/images/mem-2.svg',
      enabled: true
    },
    {
      id: 'mem-3',
      title: 'The photo we almost deleted',
      date: '22 Nov 2023',
      description:
        "One of us wanted to delete this. I'm glad we didn't. Every time I see it I smile.",
      location: 'Home',
      timestamp: 75,
      image: '/uploads/images/mem-3.svg',
      enabled: true
    }
  ],
  finalMessage: {
    title: 'Happy Birthday,',
    name: 'Alex',
    message:
      "Another year around the sun, and this world is still a little brighter with you in it. Thank you for every memory we've already made — and for all the ones still waiting for us.",
    image: '',
    signature: 'With love, always'
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

/** Fill every empty field of cfg with the seeded demo content (recursive). */
function fillEmpty(target, source) {
  if (source === null || typeof source !== 'object') {
    return target === undefined || target === null || target === ''
      ? structuredClone(source)
      : target;
  }
  // Arrays: replace only when the target array is empty (demo memories).
  if (Array.isArray(source)) {
    return Array.isArray(target) && target.length ? target : structuredClone(source);
  }
  const out = { ...(target ?? {}) };
  for (const key of Object.keys(source)) {
    out[key] = fillEmpty(out[key], source[key]);
  }
  return out;
}

/**
 * Pure merge: fills empty fields of a config with the seeded demo content.
 * Existing values are never overwritten, so it is safe to run at any time.
 */
export function applySeed(cfg) {
  return fillEmpty(cfg, SEED_DEMO);
}

/**
 * First-boot initialiser: if the site has no config yet, lay down the full
 * demo content so the site is immediately presentable. Called on server start.
 */
export async function seedIfNeeded() {
  const existing = await getConfig();
  if (existing) return false;
  await ensureSeedAssets();
  const seeded = applySeed(structuredClone(DEFAULT_CONFIG_FOR_SEED));
  await replaceConfig(seeded);
  console.log('✦ First boot — seeded demo content into MongoDB.');
  return true;
}

// Minimal defaults shape for seeding (kept here to avoid a circular import).
// store.js exports DEFAULT_CONFIG? It does not, so mirror the required shape.
const DEFAULT_CONFIG_FOR_SEED = {
  person: { name: '', nickname: '', birthdayHeading: 'Happy Birthday,', heroImage: '' },
  intro: { title: '', subtitle: '' },
  music: { src: '', title: '', artist: '', cover: '' },
  memories: [],
  timeline: [],
  finalMessage: { title: 'Happy Birthday,', name: '', message: '', image: '', signature: '' },
  appearance: { accent: '#e8b4b8', particles: true, grain: true, vignette: true, animation: 'medium', font: 'serif' }
};

/** CLI entry: `npm run seed` populates placeholder assets + demo content. */
export async function runSeed() {
  await ensureSeedAssets();
  const current = (await getConfig()) || structuredClone(DEFAULT_CONFIG_FOR_SEED);
  const seeded = applySeed(current);
  await replaceConfig(seeded);
  console.log('✓ Placeholder artwork + ambient track stored in MongoDB.');
  console.log('✓ Seed config ensured. Replace placeholders from the creator studio (/creator).');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  import('dotenv/config')
    .then(() => getDb())
    .then(runSeed)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err.message);
      process.exit(1);
    });
}