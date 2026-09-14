import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../api.js';
import { useAuth } from '../authContext.js';

export default function CreatorLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await API.login(password);
      setAuth({ checked: true, authenticated: true });
      navigate('/creator');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>Creator access</h1>
        <p>This area is private — the birthday experience is the public face of this site.</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          aria-label="Password"
        />
        <button type="submit" disabled={busy || !password}>
          {busy ? '…' : 'Enter'}
        </button>
        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  );
}