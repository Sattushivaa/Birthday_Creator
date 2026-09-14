export const API = {
  async getConfig() {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Failed to load config');
    return res.json();
  },
  async saveConfig(patch) {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
    return res.json();
  },
  async resetConfig() {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset');
    return res.json();
  },
  // Auth
  async login(password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },
  async logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
  },
  async authStatus() {
    const res = await fetch('/api/auth/status');
    return res.json();
  },
  async changePassword(currentPassword, newPassword) {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed');
    return res.json();
  },
  // Uploads
  async upload(file, kind) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/upload/${kind}`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
    return res.json();
  },
  async deleteUpload(url) {
    await fetch('/api/upload/file', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
  }
};