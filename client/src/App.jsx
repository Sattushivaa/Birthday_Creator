import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { API } from './api.js';
import BirthdayExperience from './pages/BirthdayExperience.jsx';
import CreatorLogin from './pages/CreatorLogin.jsx';
import CreatorShell from './pages/CreatorShell.jsx';
import Overview from './pages/Overview.jsx';
import CreatorMemories from './pages/CreatorMemories.jsx';
import CreatorMusic from './pages/CreatorMusic.jsx';
import CreatorTimeline from './pages/CreatorTimeline.jsx';
import CreatorSettings from './pages/CreatorSettings.jsx';
import { ConfigContext } from './configContext.js';
import { AuthContext } from './authContext.js';

export default function App() {
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [auth, setAuth] = useState({ checked: false, authenticated: false });

  const refreshConfig = async () => {
    const cfg = await API.getConfig();
    setConfig(cfg);
    return cfg;
  };

  useEffect(() => {
    refreshConfig().catch((err) => {
      console.error(err);
      setConfigError('Could not reach the server. Is it running?');
    });
    API.authStatus()
      .then((s) => setAuth({ checked: true, authenticated: s.authenticated }))
      .catch(() => setAuth({ checked: true, authenticated: false }));
  }, []);

  // Loading splash while initial config arrives.
  if (!config && !configError) {
    return (
      <div className="boot-screen">
        <div className="boot-dot" />
        <p>preparing a little something…</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="boot-screen">
        <h1>Server unreachable</h1>
        <p>{configError}</p>
        <p className="boot-hint">Start it with <code>npm run dev</code> or <code>npm start</code>.</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      <ConfigContext.Provider value={{ config, setConfig, refreshConfig }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<BirthdayExperience />} />
            <Route path="/creator/login" element={<CreatorLogin />} />
            <Route path="/creator" element={<CreatorShell />}>
              <Route index element={<Overview />} />
              <Route path="memories" element={<CreatorMemories />} />
              <Route path="music" element={<CreatorMusic />} />
              <Route path="timeline" element={<CreatorTimeline />} />
              <Route path="settings" element={<CreatorSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ConfigContext.Provider>
    </AuthContext.Provider>
  );
}