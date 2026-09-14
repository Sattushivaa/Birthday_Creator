import express from 'express';
import { ensurePasswordHash, hashPassword, verifyPassword, createSession, isSessionValid, revokeSession } from '../auth.js';
import { setPasswordHash } from '../store.js';

const router = express.Router();
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days
const COOKIE = 'birthday_creator';

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) return res.status(400).json({ error: 'Password required' });
    const hash = await ensurePasswordHash();
    const ok = await verifyPassword(password, hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password' });

    const token = await createSession(SESSION_TTL);
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !!process.env.VERCEL || req.secure,
      maxAge: SESSION_TTL,
      path: '/'
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', async (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (token) await revokeSession(token);
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get('/status', async (req, res) => {
  const token = req.cookies?.[COOKIE];
  res.json({ authenticated: await isSessionValid(token) });
});

router.post('/change-password', async (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (!(await isSessionValid(token))) return res.status(401).json({ error: 'Not authenticated' });

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords required' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  const hash = await ensurePasswordHash();
  const ok = await verifyPassword(currentPassword, hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

  await setPasswordHash(await hashPassword(newPassword));
  res.json({ ok: true });
});

export { COOKIE };
export default router;