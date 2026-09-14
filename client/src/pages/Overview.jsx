import { useNavigate } from 'react-router-dom';
import { useConfig } from '../configContext.js';
import { API } from '../api.js';
import { toast } from '../toast.js';

export default function Overview() {
  const { config, refreshConfig } = useConfig();
  const navigate = useNavigate();

  const memoriesOn = (config.memories || []).filter((m) => m.enabled).length;
  const timelineCount = (config.timeline || []).length;
  const hasMusic = !!config.music?.src;
  const hasName = !!config.person?.name;

  const reset = async () => {
    if (!confirm('Reset ALL content to the starting placeholders? This cannot be undone.')) return;
    const cfg = await API.resetConfig();
    refreshConfig();
    toast('Content reset to seed data');
  };

  const cards = [
    { label: 'Memories', value: `${memoriesOn} enabled`, count: `${(config.memories || []).length} total`, to: '/creator/memories', icon: '◧' },
    { label: 'Music', value: hasMusic ? config.music.title || 'track set' : 'no song yet', count: hasMusic ? (config.music.artist || '') : 'add one', to: '/creator/music', icon: '♫' },
    { label: 'Timeline', value: `${timelineCount} events`, count: 'sync to the song', to: '/creator/timeline', icon: '≣' },
    { label: 'Person', value: hasName ? config.person.name : 'unnamed', count: hasName ? (config.person.nickname ? `aka ${config.person.nickname}` : 'no nickname') : 'set a name', to: '/creator/settings', icon: '⚙' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Everything the birthday person will see lives here.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-danger" onClick={reset}>Reset to placeholders</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((c) => (
          <button
            className="card"
            key={c.label}
            onClick={() => navigate(c.to)}
            style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '.2rem' }}
          >
            <span style={{ fontSize: '1.3rem' }}>{c.icon}</span>
            <span style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)' }}>{c.label}</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>{c.value}</span>
            <span style={{ fontSize: '.78rem', color: 'var(--text-dim)' }}>{c.count}</span>
          </button>
        ))}
      </div>

      <div className="form-section">
        <h3>How to use the studio</h3>
        <ol style={{ paddingLeft: 18, fontSize: '.88rem', color: 'var(--text-dim)', lineHeight: 2 }}>
          <li>Set the birthday person's name in <strong>Settings</strong>.</li>
          <li>Add memories and photos in <strong>Memories</strong>.</li>
          <li>Upload the song in <strong>Music</strong>.</li>
          <li>In <strong>Timeline</strong>, place memories along the song so the experience advances on its own.</li>
          <li>Write the final message in <strong>Settings</strong>.</li>
          <li>Hit <strong>▶ Preview Experience</strong> (bottom of the sidebar) to watch the real thing.</li>
        </ol>
      </div>

      <div className="form-section">
        <h3>Default login</h3>
        <p style={{ fontSize: '.85rem', color: 'var(--text-dim)' }}>
          Password: <code>birthday</code> — change it in Settings → Security.
        </p>
      </div>
    </div>
  );
}