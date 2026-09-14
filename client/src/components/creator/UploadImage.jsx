import { useRef, useState } from 'react';
import { API } from '../../api.js';
import { toast } from '../../toast.js';

/**
 * Reusable image upload control: drag-drop / click, progress,
 * preview, remove. Returns selected URL upward via onChange.
 *
 * Raster images (jpg/png/webp/avif) are downscaled and re-encoded on the
 * browser before upload so files comfortably fit Vercel's serverless body
 * limit (~4 MB). SVG and GIF pass through untouched.
 */

const MAX_DIM = 1600;
const TARGET_BYTES = 3.2 * 1024 * 1024;

async function compressImage(file) {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  const dataUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read image'));
      i.src = dataUrl;
    });
  } finally {
    URL.revokeObjectURL(dataUrl);
  }

  const { naturalWidth: w0, naturalHeight: h0 } = img;
  const scale = Math.min(1, MAX_DIM / Math.max(w0, h0));

  // Small photos: keep the original untouched (quality + speed).
  if (file.size <= 350 * 1024 && scale === 1) return file;

  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  let blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
  for (const q of [0.7, 0.55, 0.4]) {
    if (!blob || blob.size <= TARGET_BYTES) break;
    blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));
  }
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
}

export default function UploadImage({ value, onChange, label = 'Image' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('upload');

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast('Please choose an image file (jpg, png, webp…)', 'error');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast('Image is larger than 4 MB', 'error');
      return;
    }
    setBusy(true);
    setProgress(8);
    setPhase('compress');
    try {
      const processed = await compressImage(file);
      if (processed.size > 4 * 1024 * 1024) throw new Error('Still too large after compression — please use a smaller image');
      setPhase('upload');
      setProgress(30);
      const res = await API.upload(processed, 'image');
      setProgress(100);
      onChange(res.url);
      toast('Uploaded ✓');
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
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={`Upload ${label}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {value ? (
          <div className="upload-preview" onClick={(e) => e.stopPropagation()}>
            <img src={value} alt="preview" style={{ maxHeight: 90, borderRadius: 6 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem', alignItems: 'flex-start' }}>
              <button className="btn btn-sm" onClick={() => inputRef.current?.click()}>Replace</button>
              <button className="btn btn-sm btn-danger" onClick={clear}>Remove</button>
            </div>
          </div>
        ) : busy ? (
          <div style={{ width: '100%' }}>
            {phase === 'compress' ? 'Optimising…' : `Uploading… ${progress}%`}
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: '1.4rem' }}>⌁</span>
            <div>Drop an image here or click to browse</div>
            <small style={{ fontSize: '.7rem' }}>optimised automatically before upload</small>
          </div>
        )}
      </div>
    </div>
  );
}