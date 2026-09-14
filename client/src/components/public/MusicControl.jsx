import { useState } from 'react';
import { useEffect } from 'react';

function formatTime(s) {
  if (!Number.isFinite(s)) return '00:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Elegant, unobtrusive floating music control.
 * - Play / pause
 * - Mute
 * - Current time / duration + thin progress
 * - Track title / artist / cover
 */
export default function MusicControl({ audio, music, visible }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(audio.currentTime || 0);
    const onDur = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audio]);

  const toggle = () => {
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  const toggleMute = () => {
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const hasAudio = !!audio && !!music?.src;
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div className={`music-bar ${visible ? 'visible' : ''}`} aria-label="Music controls">
      {music?.cover ? (
        <img className="music-bar-cover" src={music.cover} alt="" />
      ) : (
        <div className="music-bar-cover" />
      )}
      <div className="music-bar-info">
        <div className="music-bar-title">{music?.title || 'Untitled track'}</div>
        <div className="music-bar-artist">{music?.artist || ' '}</div>
      </div>

      <div className="music-bar-progress" title={`${formatTime(time)} / ${formatTime(duration)}`}>
        <div className="music-bar-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <button
        className="music-bar-btn"
        onClick={toggle}
        disabled={!hasAudio}
        aria-label={playing ? 'Pause music' : 'Play music'}
      >
        {playing ? <IconPause /> : <IconPlay />}
      </button>
      <button
        className="music-bar-btn"
        onClick={toggleMute}
        disabled={!hasAudio}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <IconMuted /> : <IconSound />}
      </button>
      <span className="music-bar-time">
        {formatTime(time)} / {formatTime(duration)}
      </span>
    </div>
  );
}

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M2.5 1.8c0-.8.9-1.3 1.6-.9l8 4.6c.7.4.7 1.4 0 1.8l-8 4.6c-.7.4-1.6-.1-1.6-.9V1.8z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="2.5" y="1.5" width="3.2" height="11" rx="1" />
      <rect x="8.3" y="1.5" width="3.2" height="11" rx="1" />
    </svg>
  );
}
function IconSound() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.5 2.5a1 1 0 0 0-1.7-.7L4 4.6H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2l2.8 2.8a1 1 0 0 0 1.7-.7v-10z" />
      <path d="M11 5.2a.6.6 0 0 1 .9-.8 4 4 0 0 1 0 6.2.6.6 0 0 1-.9-.8 2.8 2.8 0 0 0 0-4.6z" stroke="currentColor" fill="none" strokeWidth="1" />
    </svg>
  );
}
function IconMuted() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.5 2.5a1 1 0 0 0-1.7-.7L4 4.6H2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2l2.8 2.8a1 1 0 0 0 1.7-.7v-10z" fill="currentColor" />
      <path d="M11 8m-1.4 0a1.4 1.4 0 1 0 2.8 0a1.4 1.4 0 1 0-2.8 0" fill="none" />
      <path d="M11 6.2 13.5 4M11 9.8 13.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}