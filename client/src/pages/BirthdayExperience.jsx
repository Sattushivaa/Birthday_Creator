import { useEffect, useMemo, useRef, useState } from 'react';
import { useConfig } from '../configContext.js';
import { AKKI_NAME, AUDIO_SRC, BIRTHDAY, FAVORITE_THINGS, MEMORIES, PERSONAL_LETTER, PHOTOS } from '../birthdayConfig.js';
import '../styles/birthday.css';

function SectionLabel({ number, children }) {
  return <p className="chapter-label"><span>{number}</span>{children}</p>;
}

function Reveal({ children, className = '' }) {
  return <div className={`story-reveal ${className}`}>{children}</div>;
}

function MemoryImage({ src, index }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`memory-placeholder placeholder-${index + 1}`} aria-label="Abstract memory placeholder"><span>your photograph<br />belongs here</span></div>;
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export default function BirthdayExperience() {
  const { config } = useConfig();
  const music = config?.music || {};
  const [entered, setEntered] = useState(false);
  const [activeThing, setActiveThing] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [wished, setWished] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const [secretVisible, setSecretVisible] = useState(false);
  const [ambientOn, setAmbientOn] = useState(Boolean(AUDIO_SRC || music.src));
  const audioRef = useRef(null);
  const name = config?.person?.name?.trim() || AKKI_NAME;
  const birthday = config?.person?.birthday?.trim() || BIRTHDAY;
  const experience = config?.experience || {};
  const liveThings = experience.favoriteThings?.length ? experience.favoriteThings : FAVORITE_THINGS;
  const liveLetter = experience.letter?.trim() || PERSONAL_LETTER;
  const liveBlessing = experience.blessing?.trim() || 'May your imagination remain an inexhaustible wellspring of wonder—turning the ineffable into beauty, the intangible into art, and the unseen into something worth remembering.\n\nMay you find places that make you feel alive, people who make you feel understood, dreams that make you fearless, and ordinary days that quietly become beautiful memories.\n\nMay you keep creating. Keep dancing. Keep discovering. Keep becoming.\n\nAnd may life be gentle with you.';
  const memoryData = useMemo(() => {
    const liveMemories = (config?.memories || []).filter((memory) => memory.enabled !== false);
    if (!liveMemories.length) return MEMORIES;
    return liveMemories.map((memory, index) => ({
      eyebrow: `${String(index + 1).padStart(2, '0')} — ${memory.title || 'A moment'}`,
      title: memory.title || 'A moment',
      text: memory.description || '[Add a memory here when you are ready.]',
      image: memory.image || PHOTOS.memories[index]
    }));
  }, [config]);

  useEffect(() => {
    if (!entered) return undefined;
    const screens = Array.from(document.querySelectorAll('.birthday-app.is-entered .chapter'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('scene-active', entry.isIntersecting));
    }, { threshold: 0.58 });
    screens.forEach((screen) => observer.observe(screen));
    return () => observer.disconnect();
  }, [entered]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setActiveThing(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const enter = () => {
    setEntered(true);
    window.setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 120);
    const source = AUDIO_SRC || music.src;
    if (source) {
      const audio = new Audio(source);
      audio.loop = true;
      audio.volume = 0.22;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
  };

  const replay = () => {
    setWished(false);
    setGiftOpen(false);
    setEntered(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    audioRef.current?.pause();
  };

  const clickSecret = () => {
    const count = secretClicks + 1;
    setSecretClicks(count);
    if (count >= 3) setSecretVisible(true);
  };

  return (
    <main className={`birthday-app ${entered ? 'is-entered' : ''} ${wished ? 'is-wished' : ''}`} style={{ '--gold': config?.appearance?.accent || '#cfb899' }}>
      <div className="ambient-stars" aria-hidden="true" />
      <button className="secret-star" onClick={clickSecret} aria-label="A tiny star">✦</button>
      {secretVisible && <div className="secret-note" role="status"><strong>You found the little secret.</strong><span>Some things are better discovered than explained.</span></div>}

      {!entered && (
        <section className="opening-screen" aria-label="Birthday introduction">
          <div className="opening-orbit" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="opening-copy">
            <p className="opening-line line-one">Some dates are just dates.</p>
            <p className="opening-line line-two">And some become memories<br />before we even realize it.</p>
            <p className="opening-date">16 <span>·</span> 09</p>
            <p className="opening-name">{name}</p>
            <p className="opening-subtitle">A little birthday universe,<br />made especially for you.</p>
            <button className="enter-button" onClick={enter}>Enter <span>↗</span></button>
          </div>
          <p className="opening-credit">16:09 / a small world in your orbit</p>
        </section>
      )}

      {entered && <>
        <header className="site-rail"><span>16:09</span><span>{name}</span><span>scroll slowly ↓</span><button className="ambient-toggle" disabled={!audioRef.current} onClick={() => { if (!audioRef.current) return; if (ambientOn) audioRef.current.pause(); else audioRef.current.play().catch(() => {}); setAmbientOn(!ambientOn); }} aria-label="Toggle ambience">♫ {ambientOn ? 'ambience on' : 'enter ambience'}</button></header>
        <section id="hero" className="chapter hero-chapter">
          <div className="hero-moon" aria-hidden="true" />
          <div className="hero-copy">
            <SectionLabel number="00">the beginning</SectionLabel>
            <p className="hero-kicker">For the person who made an ordinary timeline<br />hold extraordinary moments.</p>
            <h1>Happy<br /><em>Birthday</em></h1>
            <p className="hero-date">{birthday}</p>
            <p className="hero-quote">The world has many ordinary days.<br /><em>This one happens to be yours.</em></p>
          </div>
          <div className="scroll-prompt">scroll slowly <span>↓</span><small>chapter 01 — the date</small></div>
        </section>

        <section id="date" className="chapter date-chapter story-light">
          <SectionLabel number="01">the date</SectionLabel>
          <div className="chapter-intro"><h2>The day<br /><em>you were born.</em></h2><p>There are billions of dates in history.<br />Somehow, this one became important simply because it belongs to you.</p></div>
          <div className="date-mark" tabIndex="0" aria-label="Sixteenth of September"><strong>16</strong><span>/</span><strong>09</strong><i className="date-spark" /></div>
          <p className="margin-note">A date, made meaningful.</p>
        </section>

        <section id="universe" className="chapter universe-chapter">
          <SectionLabel number="02">her little universe</SectionLabel>
          <div className="chapter-intro"><h2>Things that<br /><em>feel like you.</em></h2><p>A constellation of small details — the things that give your orbit its particular light.</p></div>
          <div className="constellation" role="list" aria-label="Things associated with Akki ji">
            <svg viewBox="0 0 720 440" aria-hidden="true"><path d="M100 320 Q230 90 390 220 T650 100 M180 80 Q350 250 590 350 M85 330 Q350 300 650 100" /></svg>
            {liveThings.map((thing, index) => <button key={thing.key || thing.label} className={`constellation-point point-${(index % 10) + 1} ${activeThing === (thing.key || thing.label) ? 'active' : ''}`} onClick={() => setActiveThing(activeThing === (thing.key || thing.label) ? null : (thing.key || thing.label))} role="listitem" aria-label={`Open ${thing.label}`}><span>{thing.label}</span><i /><b>{String(index + 1).padStart(2, '0')}</b></button>)}
          </div>
          <div className="thing-card" aria-live="polite">{activeThing ? <><span>{liveThings.find((item) => (item.key || item.label) === activeThing)?.label}</span><p>{liveThings.find((item) => (item.key || item.label) === activeThing)?.note}</p></> : <p>Touch a star to open a detail.</p>}</div>
        </section>

        <section id="moments" className="chapter moments-chapter story-light">
          <SectionLabel number="03">the moments</SectionLabel>
          <div className="chapter-intro"><h2>Some moments<br /><em>stay.</em></h2><p>Not because they were extraordinary —<br />but because they were ours to remember.</p></div>
          <div className="memory-track">{memoryData.map((memory, index) => <article className="memory-card" key={memory.eyebrow}><div className="memory-visual"><MemoryImage src={memory.image} index={index} /><span className="memory-index">{memory.eyebrow}</span></div><p className="memory-title">{memory.title}</p><p>{memory.text}</p></article>)}</div>
          <p className="swipe-hint">drag / swipe to wander <span>→</span></p>
        </section>

        <section id="details" className="chapter details-chapter">
          <SectionLabel number="04">the unseen details</SectionLabel>
          <div className="chapter-intro"><h2>It is always<br /><em>the little things.</em></h2><p>Noticed quietly. Remembered later.</p></div>
          <div className="detail-grid">{['The way you create.', 'The things you notice.', 'The places you want to see.', 'The things that make you laugh.', 'The dreams you haven’t finished dreaming.'].map((detail, index) => <div className={`detail-card detail-${index + 1}`} key={detail}><span>0{index + 1}</span><h3>{detail}</h3><i /></div>)}</div>
        </section>

        <section id="korea" className="chapter korea-chapter">
          <div className="city-lights" aria-hidden="true" /><div className="skyline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
          <SectionLabel number="05">korea</SectionLabel><div className="korea-copy"><p className="korea-overline">a small atmosphere for a place you love</p><h2>A little<br /><em>Seoul for you.</em></h2><p>Some places become special because we visit them. Some become special because someone we know dreams of seeing them.</p><strong>여행의 시작</strong><small>The beginning of a journey.</small></div>
        </section>

        <section id="time" className="chapter time-chapter story-light"><SectionLabel number="06">time</SectionLabel><div className="clock" aria-label="A minimal clock"><i /><b /><span /></div><div className="time-copy"><h2>I can’t<br /><em>stop time.</em></h2><p>But I hope the time ahead of you<br />is kinder than the time behind you.</p><p>May every year give you<br />something worth remembering.</p></div><p className="watch-note">for all the hours still waiting</p></section>

        <section id="gift" className="chapter gift-chapter"><SectionLabel number="07">the gift box</SectionLabel><div className={`gift-stage ${giftOpen ? 'open' : ''}`}><button className="gift-box" onClick={() => setGiftOpen(!giftOpen)} aria-label={giftOpen ? 'Gift opened' : 'Open the gift'}><span className="gift-lid" /><span className="gift-body" /><span className="gift-ribbon ribbon-v" /><span className="gift-ribbon ribbon-h" /><span className="gift-label">OPEN<br />WHEN READY</span></button><div className="gift-reveal"><p>Inside: more time to make beautiful things.</p><strong>A smartwatch — for the hours that are yours.</strong><small>and a reminder to keep looking up.</small></div></div></section>

        <section id="blessing" className="chapter blessing-chapter"><SectionLabel number="08">the birthday blessing</SectionLabel><div className="blessing-copy"><h2>For the year ahead<span>…</span></h2>{liveBlessing.split('\n\n').map((paragraph, index) => <p className={index === 2 ? 'handwritten' : ''} key={`${paragraph}-${index}`}>{paragraph}</p>)}</div></section>

        <section id="future" className="chapter future-chapter story-light"><SectionLabel number="09">unwritten chapters</SectionLabel><div className="book"><div className="book-page page-left" /><div className="book-page page-right" /><div className="book-spine" /></div><div className="future-copy"><h2>There is still<br /><em>so much ahead.</em></h2><p>There are places you haven’t seen.<br /><br />Things you haven’t created.<br /><br />Songs you haven’t danced to.<br /><br />Photographs you haven’t taken.<br /><br />Memories you haven’t made.<br /><br />And versions of yourself<br />you haven’t met yet.</p><strong>May you meet them all.</strong></div></section>

        <section id="letter" className="chapter letter-chapter"><SectionLabel number="10">the letter</SectionLabel><div className="letter-paper"><p className="letter-to">Dear {name},</p><div className="letter-body">{liveLetter.split('\n\n').map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div><p className="letter-signoff">— from someone who genuinely wishes you well</p></div></section>

        <section id="wish" className="chapter wish-chapter"><div className="wish-stars" aria-hidden="true" />{!wished ? <><p className="wish-overline">before you go…</p><h2>Make a<br /><em>wish.</em></h2><button className="wish-button" onClick={() => setWished(true)}>Make a wish <span>✦</span></button></> : <div className="wish-complete"><p>May life give you more beautiful moments<br />than you know what to wish for.</p><strong>16 <span>·</span> 09</strong><h2>Happy Birthday</h2><button className="replay-button" onClick={replay}>Replay the journey ↺</button></div>}</section>
      </>}
    </main>
  );
}
