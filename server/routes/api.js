import express from 'express';
import { getConfig, saveConfig, resetConfig, replaceConfig } from '../store.js';
import { ensureSeedAssets, applySeed } from '../seed.js';

const router = express.Router();

export function requireAuth(req, res, next) {
  if (req.authenticated) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

function cleanTimeline(config) {
  // Auto-sync timeline entries to memories: every enabled memory with a
  // timestamp gets exactly one "memory" timeline event. Manual events
  // (text/transition/final) are preserved untouched.
  const manual = config.timeline.filter((e) => !String(e.id || '').startsWith('auto-'));
  const merged = [...manual];

  for (const m of config.memories || []) {
    if (!m.enabled || !Number.isFinite(m.timestamp)) continue;
    const existing = merged.find((e) => e.memoryId === m.id);
    const auto = {
      id: `auto-${m.id}`,
      type: 'memory',
      label: 'memory',
      timestamp: m.timestamp,
      memoryId: m.id,
      text: ''
    };
    if (existing) {
      merged[merged.indexOf(existing)] = { ...existing, timestamp: m.timestamp, type: 'memory', memoryId: m.id };
    } else {
      merged.push(auto);
    }
  }

  merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  // Always schedule the final chapter shortly after the last event, so the
  // experience always reaches the closing message.
  if (!merged.some((e) => e.type === 'final')) {
    const lastTs = merged.length ? Math.max(...merged.map((e) => e.timestamp || 0)) : 0;
    merged.push({
      id: 'auto-final',
      type: 'final',
      label: 'final',
      timestamp: lastTs + 30,
      text: ''
    });
  }
  return merged;
}

// Public read — no auth. The birthday experience itself is public.
router.get('/config', async (req, res, next) => {
  try {
    const cfg = (await getConfig()) || {};
    res.json({ ...cfg, timeline: cleanTimeline(cfg) });
  } catch (err) {
    next(err);
  }
});

// Auth-guarded section — all mutations.
router.use(requireAuth);

router.post('/config', async (req, res, next) => {
  try {
    const patch = req.body || {};
    const cfg = await saveConfig(patch);
    res.json({ ...cfg, timeline: cleanTimeline(cfg) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Reset to bare defaults, then restore the full seeded demo content so the
// site is immediately presentable again ("Reset to placeholders").
router.post('/reset', async (req, res, next) => {
  try {
    await ensureSeedAssets();
    const base = await resetConfig();
    const cfg = await replaceConfig(applySeed(base));
    res.json({ ...cfg, timeline: cleanTimeline(cfg) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset' });
  }
});

export default router;