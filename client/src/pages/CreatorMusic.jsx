import { useRef, useState } from 'react';
import { useConfig } from '../configContext.js';
import { API } from '../api.js';
import { toast } from '../toast.js';
import UploadAudio from '../components/creator/UploadAudio.jsx';
import UploadImage from '../components/creator/UploadImage.jsx';

export default function CreatorMusic() {
  const { config, refreshConfig } = useConfig();
  const music = config.music || {};
  const [busy, setBusy] = useState(false);
  const audioRef = useRef(null);
  const [draft, setDraft] = useState({});
  const [externalUrl, setExternalUrl] = useState('');

  const save = async (patch = {}) => {
    setBusy(true);
    try {
      await API.saveConfig({ music: { ...music, ...patch } });
      await refreshConfig();
      toast('Music saved ✓');
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const useExternalUrl = () => {
    const url = externalUrl.trim();
    if (!/^https?:\/\/\S+$/.test(url)) {
      toast('Enter a valid http(s) URL', 'error');
      return;
    }
    setDraft({ src: url });
    save({ src: url });
    setExternalUrl('');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Music</h1>
          <p>The song that carries the whole experience. Attach memories to its timestamps in Timeline.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => save(draft)} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-section">
          <h3>The track</h3>
          <div className="form-group">
            <label className="form-label">Audio file</label>
            <UploadAudio
              value={music.src}
              onChange={(url) => { setDraft({ src: url }); save({ src: url }); }}
            />
            <div className="form-hint">
              {music.src
                ? 'Uploaded — the experience starts this song when the visitor presses Enter.'
                : 'No song yet. The experience will still work silently until you add one.'}
            </div>
            <label className="form-label" style={{ marginTop: '.8rem' }}>…or host a URL</label>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://… (for songs larger than ~3.5 MB)"
                style={{ flex: 1 }}
              />
              <button className="btn" onClick={useExternalUrl} type="button">Use URL</button>
            </div>
            <div className="form-hint">
              File uploads are capped at ~3.5 MB on Vercel. For bigger songs, host the audio file anywhere
              with a direct link (e.g. your own site, a CDN, Dropbox/Drive shared link) and paste it here.
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Song title</label>
              <input
                value={draft.title ?? music.title ?? ''}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Our song"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Artist</label>
              <input
                value={draft.artist ?? music.artist ?? ''}
                onChange={(e) => setDraft({ ...draft, artist: e.target.value })}
                placeholder="The band"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Cover image</label>
            <UploadImage
              value={music.cover}
              label="Cover"
              onChange={(url) => { setDraft({ cover: url }); save({ cover: url }); }}
            />
          </div>
        </div>

        {music.src && (
          <div className="form-section">
            <h3>Preview</h3>
            <audio ref={audioRef} controls src={music.src} style={{ width: '100%' }} />
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '1rem' }}>
          What's synced to the song
        </h3>
        {music.src ? (
          <p style={{ fontSize: '.85rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
            Events placed in the <strong>Timeline</strong> editor fire automatically as the song plays.
          </p>
        ) : (
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
            No song uploaded yet — Timeline events can still be set, they'll sync once audio is added.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          {(config.timeline || []).map((e) => {
            const mem = (config.memories || []).find((m) => m.id === e.memoryId);
            const typeLabel =
              e.type === 'memory' ? (mem ? 'Memory · ' + mem.title : 'Memory') :
              e.type === 'final' ? 'Final message' :
              e.type === 'transition' ? 'Transition' : 'Text';
            return (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.8rem', fontSize: '.82rem', padding: '.4rem .6rem', background: 'var(--surface)', borderRadius: 6 }}>
                <span style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>
                  {String(Math.floor((e.timestamp || 0) / 60)).padStart(2, '0')}:{String(Math.floor((e.timestamp || 0) % 60)).padStart(2, '0')}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>{typeLabel}</span>
              </div>
            );
          })}
          {(config.timeline || []).length === 0 && (
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>No timeline events yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}