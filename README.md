# Birthday Experience

A cinematic, music-driven interactive birthday memory album with a private
creator studio. Visitors press Enter and the story unfolds in sync with a song
— hero screen, memory album, final message. All content is managed from
`/creator` without touching code.

## Architecture

- **Frontend**: React 18 + Vite 5 + react-router. Two faces:
  - `/` — the public birthday experience (guest, no login).
  - `/creator` — the admin studio (memories, music, timeline, settings).
- **Backend**: Express (ESM). Stateless and serverless-compatible:
  - `server/db.js` — singleton MongoDB connection (works in Vercel warm starts).
  - `server/store.js` — all data lives in MongoDB (see storage below).
  - `server/auth.js` — password (bcrypt), sessions (hashed tokens, Mongo TTL).
  - `server/app.js` — the Express app factory (no `listen`) → same code locally
    and on Vercel.
  - `server/index.js` — local entry: connects DB, seeds on first boot, listens.
  - `api/index.js` — Vercel serverless entry (lazy connect + seed).

## Storage (MongoDB)

Everything is stored in MongoDB — there is no filesystem dependency, so the
same code runs on serverless functions.

| Data | MongoDB collection | Document |
|---|---|---|
| Site config (person, intro, music, memories, timeline, final message, appearance) | `site` | one doc `_id: 'main'` |
| Uploaded media (photos, audio, video) | `media` | `{ key: '/uploads/images/x.jpg', contentType, data: Buffer, size }` |
| Creator sessions | `sessions` | `{ tokenHash, expires }` + Mongo TTL index |
| Password hash | `meta` | `_id: 'credentials'` |

The config is read via `GET /api/config` (public) and mutated via guarded
endpoints. The `timeline` is auto-synced server-side: every enabled memory
with a song timestamp gets a `memory` event, and a `final` event is scheduled
~30s after the last event, so the closing chapter is guaranteed to fire.

## Routes

- `GET  /api/config` — public config + synced timeline
- `POST /api/config` — save a config patch (auth)
- `POST /api/reset` — restore the demo/placeholder content (auth)
- `POST /api/auth/login` · `/logout` · `/status` · `/change-password`
- `POST /api/upload/image|audio|video` — upload a file (auth, stored in Mongo)
- `DELETE /api/upload/file` — delete by URL (auth)
- `GET  /uploads/:type/:name` — media served from MongoDB (ETag + cache)
- `GET /api/health` — health check

## Local development

```bash
npm install

# 1. Create .env with your MongoDB connection string:
cp .env.example .env
#   MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.mongodb.net/?appName=Cluster0

# 2. (optional) seed placeholder art + ambient track + demo content:
npm run seed

# 3. Build the client once (outputs to /public):
npm run build

# 4. Run everything:
npm start            # server on http://localhost:3001 (serves built client)
```

Or dev mode with hot reload:

```bash
npm run dev          # nodemon (3001) + Vite dev server (5173)
```

The very first boot auto-seeds the demo content if the `site` collection is
empty, so hosting it fresh works with zero setup.

## Creator access

- Open `http://<your-domain>/creator`
- Default password: **`birthday`** — change it immediately in
  **Settings → Security**.
- Login sessions last 30 days; logout revokes the session server-side.

## Deploying to Vercel

The repo is already Vercel-ready:

```
public/        ← built client (Vercel's static output dir)
api/index.js   ← the Express app as a serverless function
vercel.json    ← build + rewires /api and /uploads to the function, everything else to index.html
```

1. Push the repo to GitHub and import it in Vercel (framework: **Other**).
   The `vercel.json` build command and output directory are picked up automatically.
2. Add these environment variables in **Project → Settings → Environment Variables**:
   - `MONGODB_URI` — your Atlas connection string
   - `MONGODB_DB` — optional, defaults to `birthday`
   - `ADMIN_PASSWORD_HASH` — optional, overrides the default creator password
     (generate with `bcrypt.hash('your-pass', 10)`); otherwise the default
     `birthday` is used and should be changed from the studio.
3. Deploy. First request seeds the demo content into your cluster.

Make sure your MongoDB Atlas network access allows connections from anywhere
(`0.0.0.0/0`) for the free tier, and that the database user has read/write
access.

## Notes & limits

- **Upload limits**: Vercel serverless functions cap request bodies (~4.5 MB on
  the Hobby plan), so uploads are capped at ~4 MB. Images are automatically
  downscaled + compressed in the browser before upload. For songs larger than
  ~3.5 MB, use the **"…or host a URL"** field in the Music studio and point to
  a hosted file (direct link) instead of uploading.
- The free Atlas cluster (M0, 512 MB) is plenty for a personal birthday site.
- `client/dist` and the generated `public/` are git-ignored build artifacts.
- Keep `MONGODB_URI` private — it is only read from the environment, never
  hard-coded, and `.env` is git-ignored.