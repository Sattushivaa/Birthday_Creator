import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../authContext.js';
import { API } from '../../api.js';

const LINKS = [
  { to: '/creator', label: 'Overview', icon: '⌂', end: true },
  { to: '/creator/memories', label: 'Memories', icon: '◧' },
  { to: '/creator/music', label: 'Music', icon: '♫' },
  { to: '/creator/timeline', label: 'Timeline', icon: '≣' },
  { to: '/creator/settings', label: 'Settings', icon: '⚙' }
];

export default function CreatorSidebar({ open, onClose, onPreview }) {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleLogout = async () => {
    await API.logout();
    setAuth({ checked: true, authenticated: false });
    navigate('/creator/login');
  };

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2>CREATOR</h2>
          <small>birthday experience</small>
        </div>
        <nav className="sidebar-nav">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-preview-btn" onClick={onPreview}>
            ▶ Preview Experience
          </button>
          <button onClick={handleLogout}>⎋ Sign out</button>
        </div>
      </aside>
    </>
  );
}