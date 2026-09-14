import { useEffect, useRef, useState } from 'react';

/**
 * The memory album: one photograph at a time, cinematic transitions.
 * - `index` is fully controlled (so timeline sync can drive it).
 * - `direction` ('forward' | 'back') picks the slide direction.
 */
export default function MemoryAlbum({ memories, index, direction, accent }) {
  const memory = memories[index];
  const [shown, setShown] = useState({ idx: index, motion: 'from-right' });
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      setShown({ idx: index, motion: index === 0 ? 'from-right' : 'from-right' });
      return;
    }
    if (index === shown.idx) return;
    const motion = index > shown.idx ? 'from-right' : 'from-left';
    setShown({ idx: index, motion });
  }, [index]);

  const current = memories[shown.idx];
  const dirLabel = direction === 'back' ? 'previous memory' : 'next memory';

  if (!memories.length) {
    return (
      <section className="album-section">
        <div className="album-header">
          <p className="album-label">memories</p>
        </div>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
          A few photographs are on their way.
        </p>
      </section>
    );
  }

  return (
    <section className="album-section" aria-label="Memory album">
      <div className="album-header">
        <p className="album-label">memories</p>
        <p className="album-counter">
          {String(shown.idx + 1).padStart(2, '0')} / {String(memories.length).padStart(2, '0')}
        </p>
      </div>

      <div key={current.id} className={`memory-card ${shown.motion}`}>
        <div className="memory-image-wrapper">
          {current.image ? (
            <img
              className="memory-image cinemove"
              src={current.image}
              alt={current.title}
              loading={shown.idx > 0 ? 'lazy' : 'eager'}
            />
          ) : (
            <div
              className="memory-image"
              style={{
                background: `linear-gradient(135deg, ${accent}33, ${accent}11 60%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', fontSize: '.9rem'
              }}
            >
              · a photograph belongs here ·
            </div>
          )}
        </div>

        <div className="memory-info">
          {current.date && <p className="memory-date">{current.date}</p>}
          <h2 className="memory-title">{current.title}</h2>
          {current.description && <p className="memory-desc">{current.description}</p>}
          {current.location && <p className="memory-location">{current.location}</p>}
        </div>
      </div>

      {memories.length > 1 && (
        <nav className="album-nav" aria-label="Album navigation">
          <button
            className="album-nav-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('album:prev'))}
            disabled={shown.idx === 0}
            aria-label="Previous memory"
          >
            <span className="arrow">←</span> Previous
          </button>
          <span className="sr-only" aria-live="polite">
            {`${current.title}, ${dirLabel}`}
          </span>
          <button
            className="album-nav-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('album:next'))}
            disabled={shown.idx === memories.length - 1}
            aria-label="Next memory"
          >
            Next <span className="arrow">→</span>
          </button>
        </nav>
      )}
    </section>
  );
}