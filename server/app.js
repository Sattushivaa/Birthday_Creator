import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';
import authRouter, { COOKIE } from './routes/auth.js';
import uploadRouter from './routes/upload.js';
import { isSessionValid } from './auth.js';
import { getMedia } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Builds the Express app. Pure (no listen) so it runs identically locally
 * and as a Vercel serverless function. All state lives in MongoDB.
 */
export default function createApp() {
  const app = express();

  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));

  // Simple auth flag for all /api, /uploads routes (checked in routers).
  app.use(async (req, res, next) => {
    try {
      const token = req.cookies?.[COOKIE];
      req.authenticated = await isSessionValid(token);
    } catch {
      req.authenticated = false;
    }
    next();
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Specific routers BEFORE the general /api router (which 401s unknown paths).
  app.use('/api/auth', authRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api', apiRouter);

  // Media files — served from MongoDB (no filesystem on serverless).
  // Short cache + ETag revalidation + HTTP Range support (needed for audio
  // seeking and streaming from the experience).
  app.get('/uploads/:type/:name', async (req, res, next) => {
    try {
      const key = `/uploads/${req.params.type}/${req.params.name}`;
      const file = await getMedia(key);
      if (!file) return res.status(404).json({ error: 'File not found' });
      const etag = `"${file._id ? String(file._id) : file.size}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=600');
      if (req.headers['if-none-match'] === etag) return res.status(304).end();
      let buf = file.data;
      if (!Buffer.isBuffer(buf)) {
        buf = typeof buf.buffer === 'function' ? buf.buffer() : buf.buffer || buf;
      }
      res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');

      const range = req.headers.range;
      const total = buf.length;
      if (range) {
        const m = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (m) {
          let start = m[1] ? parseInt(m[1], 10) : 0;
          let end = m[2] ? parseInt(m[2], 10) : total - 1;
          if (Number.isNaN(start) || start < 0 || start >= total) {
            res.setHeader('Content-Range', `bytes */${total}`);
            return res.status(416).end();
          }
          if (Number.isNaN(end) || end >= total) end = total - 1;
          if (end < start) end = start;
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', end - start + 1);
          return res.send(buf.subarray(start, end + 1));
        }
      }
      res.send(buf);
    } catch (err) {
      next(err);
    }
  });

  // Serve the built client (public/, produced by `npm run build`).
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(path.join(publicDir, 'index.html'))) {
    app.use(express.static(publicDir, { maxAge: '1h', etag: true }));
    app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  } else {
    // Dev: Vite serves the client; just handle API + uploads + a hint.
    app.get('/', (req, res) => {
      res
        .status(200)
        .send('Birthday server running. Start the Vite dev server (`npm run dev:client`) for the frontend.');
    });
  }

  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: err.message || 'Server error' });
  });

  return app;
}