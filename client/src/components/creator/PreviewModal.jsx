import { useEffect } from 'react';

/**
 * Fullscreen iframe preview of the public experience.
 * Rendered from inside /creator so the creator never leaves the dashboard.
 */
export default function PreviewModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="preview-frame" role="dialog" aria-label="Preview of the birthday experience">
      <button className="preview-close" onClick={onClose} aria-label="Close preview">
        ✕
      </button>
      <iframe src="/?preview=1" title="Birthday experience preview" />
    </div>
  );
}