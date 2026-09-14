import { useMemo, useState } from 'react';
import { useConfig } from '../configContext.js';
import { API } from '../api.js';
import { toast } from '../toast.js';

const EMPTY = {
  id: '',
  type: 'memory',
  label: 'memory',
  timestamp: 0,
  memoryId: '',
  text: ''
};

export default function CreatorTimeline() {
  const { config, refreshConfig } = useConfig();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const timeline = config.timeline || [];
  const memories = config.memories || [];
  const music = config.music || {};

  // Sort by timestamp.
  const sorted = useMemo(
    () => [...timeline].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
    [timeline]
  );

  const fmtTime = (s) => {
    const sec = Number(s) || 0;
    const m = Math.floor(sec / 60);
    const r = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  // Simple 0–600s track (10 min max)
  const trackMax = Math.max(120, ...sorted.map((e) => e.timestamp || 0)) + 10;

  const pct = (sec) => {
    if (trackMax <= 0) return 0;
    return Math.max(0, Math.min(100, (sec / trackMax) * 100));
  };

  const typeOptions = [
    { value: 'memory', label: 'Memory' },
    { value: 'transition', label: 'Transition' },
    { value: 'text', label: 'Text' },
    { value: 'final', label: 'Final message' }
  ];

  const startAdd = () => {
    setEditing({ ...EMPTY, id: `evt-${Date.now().toString(36)}` });
    setAdding(true);
  };

  const startEdit = (e) => {
    setEditing({ ...e });
    setAdding(false);
  };

  const cancel = () => { setEditing(null); setAdding(false); };

  const saveEvent = async () => {
    if (!editing || editing.type === '') {
      toast('Choose an event type', 'error');
      return;
    }
    setSaving(true);
    try {
      let next;
      if (adding) {
        next = [...timeline, editing];
      } else {
        next = timeline.map((e) => (e.id === editing.id ? editing : e));
      }
      // Auto-sync: for memory events, ensure a timeline entry exists even if memory has no timestamp.
      await API.saveConfig({ timeline: next });
      await refreshConfig();
      toast(adding ? 'Event added ✓' : 'Event saved ✓');
      cancel();
    } catch (err) {
      toast(err.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeEvent = async (ev) => {
    if (!confirm('Remove this timeline event?')) return;
    await API.saveConfig({ timeline: timeline.filter((e) => e.id !== ev.id) });
    await refreshConfig();
    toast('Event removed');
  };

  const onTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sec = Math.round(((e.clientX - rect.left) / rect.width) * trackMax);
    if (editing) {
      setEditing({ ...editing, timestamp: Math.max(0, sec) });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Timeline</h1>
          <p>Place events along the song. Click the track to set a time.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={startAdd}>+ Add event</button>
        </div>
      </div>

      {!music.src && (
        <div className="card" style={{ marginBottom: '1.2rem', borderStyle: 'dashed' }}>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', margin: 0 }}>
            No song uploaded yet — the track shows a 0–10 minute timeline for now.
          </p>
        </div>
      )}

      {/* Visual track */}
      <div className="timeline-visual" onClick={onTrackClick} style={{ cursor: 'crosshair' }}>
        <div className="timeline-track" />
        {sorted.map((ev) => (
          <div
            key={ev.id}
            className="timeline-marker"
            style={{ left: `calc(20px + ${pct(ev.timestamp)}% - 10px)` }}
            onClick={(e) => { e.stopPropagation(); startEdit(ev); }}
          >
            <div className="timeline-marker-dot" />
            <div className="timeline-marker-label">{ev.type === 'memory' ? (memories.find((m) => m.id === ev.memoryId)?.title || 'Memory') : ev.type}</div>
            <div className="timeline-marker-time">{fmtTime(ev.timestamp)}</div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '.78rem', color: 'var(--text-muted)' }}>
            click "Add event" to begin · click anywhere on the track to set a time
          </div>
        )}
      </div>

      {/* Editor form */}
      {editing && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '1rem' }}>
            {adding ? 'New event' : 'Edit event'}
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Event type</label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value, memoryId: e.target.value !== 'memory' ? '' : editing.memoryId })}
              >
                {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Timestamp (seconds)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={editing.timestamp}
                onChange={(e) => setEditing({ ...editing, timestamp: Math.max(0, Number(e.target.value) || 0) })}
              />
              <div className="form-hint">= {fmtTime(editing.timestamp)} of the song</div>
            </div>
          </div>

          {editing.type === 'memory' && (
            <div className="form-group">
              <label className="form-label">Memory</label>
              <select
                value={editing.memoryId || ''}
                onChange={(e) => setEditing({ ...editing, memoryId: e.target.value })}
              >
                <option value="">— none —</option>
                {memories.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} {m.timestamp !== '' && m.timestamp !== null ? `(${fmtTime(m.timestamp)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {editing.type === 'text' && (
            <div className="form-group">
              <label className="form-label">Text to reveal</label>
              <textarea
                value={editing.text || ''}
                onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                placeholder="Something the person reads at this moment…"
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={saveEvent} disabled={saving}>
              {saving ? 'Saving…' : adding ? 'Add event' : 'Save'}
            </button>
            {!adding && (
              <button className="btn btn-danger" onClick={() => removeEvent(editing)}>Delete event</button>
            )}
            <button className="btn" onClick={cancel}>Cancel</button>
          </div>
        </div>
      )}

      {/* Event table */}
      <div className="timeline-event-list">
        {sorted.map((ev) => {
          const mem = memories.find((m) => m.id === ev.memoryId);
          return (
            <div className="timeline-event-row" key={ev.id}>
              <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--accent)' }}>
                {fmtTime(ev.timestamp)}
              </div>
              <div>
                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{ev.type}</span>
                {mem && <span style={{ marginLeft: '.5rem', color: 'var(--text-dim)' }}>→ {mem.title}</span>}
                {ev.text && <span style={{ marginLeft: '.5rem', color: 'var(--text-dim)' }}>"{ev.text.slice(0, 50)}…"</span>}
              </div>
              <div />
              <div style={{ display: 'flex', gap: '.3rem' }}>
                <button className="btn btn-sm" onClick={() => startEdit(ev)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => removeEvent(ev)}>×</button>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>
            No events yet — add one to sync memories to the music.
          </div>
        )}
      </div>
    </div>
  );
}