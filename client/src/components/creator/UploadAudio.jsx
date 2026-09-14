import { useRef, useState } from 'react';
import { API } from '../../api.js';
import { toast } from '../../toast.js';

/**
 * Reusable audio upload control with inline preview player.
 * Used by the Music manager.
 */
export default function UploadAudio({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (file) => {
    if (!file) return;
    const isAudio =
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(file.name);
    if (!isAudio) {
      toast('Please choose an audio file (mp3, wav, ogg, flac…)', 'error');
      return;
    }
    // Vercel serverless functions cap request bodies (~4.5 MB Hobby).
    if (file.size > 3.5 * 1024 * 1024) {
      toast('Audio is larger than ~3.5 MB — for bigger songs paste a hosted URL instead (see field below)', 'error');
      return;
    }
    setBusy(true);
    setProgress(12);
    try {
      const res = await API.upload(file, 'audio');
      setProgress(100);
      onChange(res.url);
      toast('Audio uploaded ✓');
    } catch (err) {
      toast(err.message || 'Upload failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (value) await API.deleteUpload(value).catch(() => {});
    onChange('');
  };

  return (
    <div>
      <div
        className={`upload-zone ${value ? 'has-file' : ''} ${dragging ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value ? (
          <div className="upload-preview" style={{ flexDirection: 'column', alignItems: 'stretch' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>♪</span>
              <audio controls src={value} style={{ width: '100%', maxWidth: 280, height: 40 }} />
            </div>
            <div style={{ display: 'flex', gap: '.3rem' }}>
              <button className="btn btn-sm" onClick={() => inputRef.current?.click()}>Replace</button>
              <button className="btn btn-sm btn-danger" onClick={clear}>Remove</button>
            </div>
          </div>
        ) : busy ? (
          <div style={{ width: '100%' }}>
            Uploading… {progress}%
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: '1.4rem' }}>♪</span>
            <div>Drop an audio file here or click to browse</div>
            <small style={{ fontSize: '.7rem' }}>mp3, wav, ogg, flac, m4a — up to ~3.5 MB (or use a hosted URL below)</small>
          </div>
        )}
      </div>
    </div>
  );
}