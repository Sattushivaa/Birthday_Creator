import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../authContext.js';
import CreatorSidebar from '../components/creator/CreatorSidebar.jsx';
import PreviewModal from '../components/creator/PreviewModal.jsx';
import Toasts from '../components/creator/Toasts.jsx';
import '../styles/creator.css';

/** Auth-guarded shell shared by all /creator/* pages. */
export default function CreatorShell() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (auth.checked && !auth.authenticated) {
      navigate('/creator/login', { replace: true });
    }
  }, [auth, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => setSidebarOpen(false), [location.pathname]);

  if (!auth.checked || !auth.authenticated) {
    return (
      <div className="boot-screen">
        <div className="boot-dot" />
        <p>unlocking the creator studio…</p>
      </div>
    );
  }

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <CreatorSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onPreview={() => setPreview(true)} />
      <main className="creator-main">
        <Outlet />
      </main>
      {preview && <PreviewModal onClose={() => setPreview(false)} />}
      <Toasts />
    </>
  );
}