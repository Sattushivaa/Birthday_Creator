import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { ensureSeedAssets, applySeed } from '../seed.js';
import { resetConfig, replaceConfig, saveMedia, deleteMedia, generateKey } from '../store.js';

const router = express.Router();

// Vercel serverless functions cap request bodies (~4.5 MB on the Hobby plan),
// so keep a single conservative limit across all upload types. The client
// compresses images before they ever reach this endpoint.
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const ACCEPT = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v']
};

function uploadToMemory(kind, req, res) {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: kind === 'audio' ? MAX_BYTES : MAX_BYTES },
    fileFilter: (req, file, cb) => {
      if (ACCEPT[kind].includes(file.mimetype)) return cb(null, true);
      cb(new Error(`File type not allowed for ${kind}: ${file.mimetype || 'unknown'}`));
    }
  });
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 4 MB)' : err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    try {
      const key = generateKey(kind === 'image' ? 'images' : kind, req.file.originalname);
      await saveMedia({ key, contentType: req.file.mimetype, data: req.file.buffer, size: req.file.size });
      const url = `/uploads/${kind === 'image' ? 'images' : kind}/${path.basename(key)}`;
      res.json({ url, name: req.file.originalname, size: req.file.size, kind, mimetype: req.file.mimetype });
    } catch (err2) {
      console.error(err2);
      res.status(500).json({ error: 'Failed to store file' });
    }
  });
}

// Auth guard for all uploads — these are protected.
function requireAuth(req, res, next) {
  if (req.authenticated) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}
router.use(requireAuth);

router.post('/image', (req, res) => uploadToMemory('image', req, res));
router.post('/audio', (req, res) => uploadToMemory('audio', req, res));
router.post('/video', (req, res) => uploadToMemory('video', req, res));

// Delete an uploaded file (by URL path only, prevent traversal).
router.delete('/file', async (req, res) => {
  const { url } = req.body || {};
  if (!url || !url.startsWith('/uploads/')) return res.status(400).json({ error: 'Invalid url' });
  const rel = url.replace(/^\/uploads\//, '');
  if (!/^[a-zA-Z0-9]+[/][a-zA-Z0-9._-]+$/.test(rel)) return res.status(400).json({ error: 'Invalid path' });
  try {
    await deleteMedia(`/uploads/${rel}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.json({ ok: true }); // already gone is fine
  }
});

export default router;