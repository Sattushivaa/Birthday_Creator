import { useState } from 'react';
import { useConfig } from '../configContext.js';
import { API } from '../api.js';
import { toast } from '../toast.js';
import UploadImage from '../components/creator/UploadImage.jsx';

const EMPTY = {
  id: '',
  title: '',
  description: '',
  image: '',
  date: '',
  location: '',
  timestamp: '',
  enabled: true
};

export default function CreatorMemories() {
  const { config, refreshConfig } = useConfig();
  const [editing, setEditing] = useState(null); // memory object copy in progress
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const memories = config.memories || [];

  const startNew = () => {
    setEditing({ ...EMPTY });
    setIsNew(true);
  };

  const startEdit = (m) => {
    setEditing({ ...m, timestamp: m.timestamp ?? '' });
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing.title.trim()) {
      toast('Give the memory a title first', 'error');
      return;
    }
    setSaving(true);
    try {
      const list = isNew
        ? [...memories, { ...editing, id: `mem-${Date.now().toString(36)}` }]
        : memories.map((m) => (m.id === editing.id ? editing : m));
      await API.saveConfig({ memories: list });
      await refreshConfig();
      toast(isNew ? 'Memory added ✓' : 'Memory saved ✓');
      cancelEdit();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (m) => {
    if (!confirm(`Delete "${m.title}"? The photo stays on the server unless removed separately.`)) return;
    const list = memories.filter((x) => x.id !== m.id);
    await API.saveConfig({ memories: list });
    await refreshConfig();
    toast('Memory deleted');
  };

  const toggleEnabled = async (m) => {
    const list = memories.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x));
    await API.saveConfig({ memories: list });
    await refreshConfig();
  };

  // Drag-and-drop reorder
  const onDrop = async (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) return setDragIdx(null);
    const list = [...memories];
    const [moved] = list.splice(dragIdx, 1);
    list.splice(targetIdx, 0, moved);
    setDragIdx(null);
    await API.saveConfig({ memories: list });
    await refreshConfig();
    toast('Reordered ✓');
  };

  const fmtTime = (s) => {
    if (s === '' || s === null || s === undefined) return '';
    const sec = Number(s);
    const m = Math.floor(sec / 60);
    const r = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Memories</h1>
          <p>Drag cards to reorder. Toggle the eye to hide a memory from the experience.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={startNew}>+ Add memory</button>
        </div>
      </div>

      {memories.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ marginBottom: '.8rem' }}>No memories yet — the album is empty.</p>
          <button className="btn btn-primary" onClick={startNew}>+ Add the first memory</button>
        </div>
      )}

      {/* Editor */}
      {editing && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            {isNew ? 'New memory' : `Edit — ${editing.title}`}
          </h3>
          <div className="form-section" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label className="form-label">Photo</label>
              <UploadImage value={editing.image} onChange={(url) => setEditing({ ...editing, image: url })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  placeholder="College chaos"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  value={editing.date || ''}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  placeholder="12 Aug 2024"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Story</label>
              <textarea
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="That day we…"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  value={editing.location || ''}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  placeholder="The old café"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Song timestamp (seconds)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={editing.timestamp === '' ? '' : editing.timestamp}
                  onChange={(e) => setEditing({ ...editing, timestamp: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="e.g. 42"
                />
                <div className="form-hint">
                  {editing.timestamp === '' || editing.timestamp === null ? (
                    'optional — the album advances automatically at this moment in the song'
                  ) : (
                    <>will appear at {fmtTime(editing.timestamp)} of the song</>
                  )}
                </div>
              </div>
            </div>
            <div className="toggle-row">
              <label>Visible in the album</label>
              <input
                type="checkbox"
                className="toggle"
                checked={editing.enabled !== false}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
              />
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Add memory' : 'Save changes'}
              </button>
              <button className="btn" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Memory list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {memories.map((m, i) => (
          <div
            className={`mem-card ${m.enabled ? '' : 'mem-disabled'}`}
            key={m.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            onDragEnd={() => setDragIdx(null)}
            style={dragIdx === i ? { outline: '2px solid var(--accent)' } : undefined}
          >
            {m.image ? (
              <img className="mem-card-thumb" src={m.image} alt="" />
            ) : (
              <div className="mem-card-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '.7rem' }}>
                no photo
              </div>
            )}
            <div className="mem-card-body">
              <h3>{m.title} {m.timestamp !== '' && m.timestamp !== null ? <span style={{ color: 'var(--accent)', fontSize: '.72rem' }}>♪ {fmtTime(m.timestamp)}</span> : null}</h3>
              <div className="mem-card-meta">
                {m.date ? m.date : <span style={{ fontStyle: 'italic', opacity: .6 }}>no date</span>}
                {m.location ? ` · ${m.location}` : ''}
              </div>
              <div className="mem-card-desc">{m.description || <span style={{ fontStyle: 'italic', opacity: .6 }}>no story yet</span>}</div>
            </div>
            <div className="mem-card-actions">
              <button
                className="btn btn-sm"
                title={m.enabled ? 'Hide from experience' : 'Show in experience'}
                onClick={() => toggleEnabled(m)}
              >
                {m.enabled ? '👁' : '◌'}
              </button>
              <button className="btn btn-sm" onClick={() => startEdit(m)}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => remove(m)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}