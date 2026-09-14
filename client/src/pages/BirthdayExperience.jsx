import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfig } from '../configContext.js';
import '../styles/birthday.css';
import Particles from '../components/public/Particles.jsx';
import IntroScreen from '../components/public/IntroScreen.jsx';
import MusicControl from '../components/public/MusicControl.jsx';
import MemoryAlbum from '../components/public/MemoryAlbum.jsx';
import FinalMessage from '../components/public/FinalMessage.jsx';
import Reveal from '../components/public/Reveal.jsx';

const CHAPTERS = {
  hero: { label: 'hello' },
  album: { label: 'memories' },
  final: { label: '' }
};

/**
 * Public birthday experience.
 * Flow: ENTER → music → hero → memory album → final message.
 * Timeline events (from /creator) auto-advance the album and scroll
 * to chapters when the song reaches their timestamps.
 */
export default function BirthdayExperience() {
  const { config } = useConfig();
  const person = config.person || {};
  const music = config.music || {};
  const appearance = config.appearance || {};
  const accent = appearance.accent || '#e8b4b8';

  const [entered, setEntered] = useState(false);
  const [chapter, setChapter] = useState('hero');
  const [memIdx, setMemIdx] = useState(0);
  const [direction, setDirection] = useState('forward');

  const audioRef = useRef(null);
  const lastFiredEvent = useRef(-1);
  const albumRef = useRef(null);
  const heroRef = useRef(null);
  const finalRef = useRef(null);
  const chapterRef = useRef('hero');

  // Enabled memories, in order.
  const memories = useMemo(
    () => (config.memories || []).filter((m) => m.enabled),
    [config.memories]
  );

  // Timeline events relevant to the public experience.
  const timeline = useMemo(() => (config.timeline || []).filter((e) => Number.isFinite(e.timestamp)), [config.timeline]);

  // Memory id → index in enabled list
  const memIdToIndex = useMemo(() => {
    const map = {};
    memories.forEach((m, i) => (map[m.id] = i));
    return map;
  }, [memories]);

  /* ── ENTER: create audio within the user gesture, begin playback ─ */
  const handleEnter = useCallback(() => {
    setEntered(true);
    setChapter('hero');
    const el = new Audio();
    if (music.src) {
      el.src = music.src;
      el.play().catch(() => {
        // Autoplay can still be blocked on some browsers; user can press play.
      });
    }
    audioRef.current = el;
    // Debug handle (also handy for the creator preview): window.__birthdayAudio
    if (import.meta.env?.DEV || new URLSearchParams(window.location.search).has('preview')) {
      window.__birthdayAudio = el;
    }
  }, [music.src]);

  /* ── Chapter bookkeeping (for timeline scroll) ─────────────────── */
  const goToChapter = useCallback((name) => {
    chapterRef.current = name;
    setChapter(name);
    const ref =
      name === 'hero' ? heroRef : name === 'album' ? albumRef : finalRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /* ── Album navigation ──────────────────────────────────────────── */
  const nextMemory = useCallback(() => {
    setMemIdx((i) => {
      const next = Math.min(i + 1, memories.length - 1);
      return next;
    });
    setDirection('forward');
  }, [memories.length]);

  const prevMemory = useCallback(() => {
    setMemIdx((i) => Math.max(i - 1, 0));
    setDirection('back');
  }, []);

  useEffect(() => {
    const onPrev = () => prevMemory();
    const onNext = () => nextMemory();
    window.addEventListener('album:prev', onPrev);
    window.addEventListener('album:next', onNext);
    return () => {
      window.removeEventListener('album:prev', onPrev);
      window.removeEventListener('album:next', onNext);
    };
  }, [prevMemory, nextMemory]);

  /* ── Timeline sync while music plays ───────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      const t = audio.currentTime;
      const events = timeline;
      for (let i = lastFiredEvent.current + 1; i < events.length; i++) {
        const ev = events[i];
        if (t >= ev.timestamp) {
          lastFiredEvent.current = i;
          handleEvent(ev);
        } else {
          break;
        }
      }
    };
    const handleEvent = (ev) => {
      if (ev.type === 'memory' && ev.memoryId && memIdToIndex[ev.memoryId] !== undefined) {
        const idx = memIdToIndex[ev.memoryId];
        setMemIdx(idx);
        setDirection('forward');
        if (chapterRef.current !== 'album') goToChapter('album');
      } else if (ev.type === 'final') {
        goToChapter('final');
      } else if (ev.type === 'transition') {
        // gentle no-op: marker of a chapter change
        if (chapterRef.current === 'hero') goToChapter('hero');
      }
    };
    audio.addEventListener('timeupdate', onTime);
    return () => audio.removeEventListener('timeupdate', onTime);
  }, [entered, timeline, memIdToIndex, goToChapter]);

  /* ── Replay: restart song and memory album ─────────────────────── */
  const handleReplay = useCallback(() => {
    lastFiredEvent.current = -1;
    setMemIdx(0);
    setDirection('forward');
    goToChapter('hero');
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }, [goToChapter]);

  /* ── Share current chapter in URL hash (refresh-safe is handled by router) ── */
  useEffect(() => {
    const onScroll = () => {
      // Simple scroll spy to keep the music bar visible
      // (the bar shows once entered regardless).
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="birthday-app"
      data-vignette={appearance.vignette === true}
      data-grain={appearance.grain === true}
      style={{ '--accent': accent }}
    >
      <Particles
        enabled={appearance.particles !== false}
        accent={accent}
        count={appearance.animation === 'low' ? 24 : 55}
      />

      {!entered ? (
        <IntroScreen intro={config.intro} onEnter={handleEnter} />
      ) : (
        <>
          <MusicControl
            audio={audioRef.current}
            music={music}
            visible={entered}
            elapsed={audioRef.current?.currentTime}
          />

          {/* ── Chapter 1: Hero ── */}
          <section ref={heroRef} className="hero-section" data-chapter="hero">
            {person.heroImage && (
              <div className="hero-bg" style={{ backgroundImage: `url(${person.heroImage})` }} />
            )}
            <div className="hero-overlay" />
            <div className="hero-content">
              <Reveal>
                <h1 className="hero-heading">
                  {person.birthdayHeading || 'Happy Birthday,'}
                  <span style={{ display: 'block', textTransform: 'none' }}>
                    {person.nickname || person.name}
                  </span>
                </h1>
              </Reveal>
            </div>
            <div className="hero-scroll-hint" aria-hidden="true">↓</div>
          </section>

          {/* ── Chapter 2: Memory album ── */}
          <div ref={albumRef} data-chapter="album">
            <MemoryAlbum
              memories={memories}
              index={memIdx}
              direction={direction}
              accent={accent}
            />
          </div>

          {/* ── Chapter 3: Final message ── */}
          <div ref={finalRef} data-chapter="final">
            <FinalMessage config={config} onReplay={handleReplay} />
          </div>
        </>
      )}
    </div>
  );
}