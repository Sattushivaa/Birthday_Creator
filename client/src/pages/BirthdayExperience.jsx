import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs/lib/anime.es.js';
import { useConfig } from '../configContext.js';
import { AKKI_NAME, AUDIO_SRC, BIRTHDAY, FAVORITE_THINGS, MEMORIES, PERSONAL_LETTER, PHOTOS } from '../birthdayConfig.js';
import Particles from '../components/public/Particles.jsx';
import '../styles/birthday.css';

function SectionLabel({ number, children }) {
  return <p className="chapter-label"><span>{number}</span>{children}</p>;
}

function MemoryImage({ src, index }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return (
    <div className={`memory-placeholder placeholder-${(index % 5) + 1}`} aria-label="Abstract memory placeholder">
      <div className="placeholder-aura" />
      <span>your photograph<br />belongs here</span>
    </div>
  );
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export default function BirthdayExperience() {
  const { config } = useConfig();
  const music = config?.music || {};
  const appearance = config?.appearance || {};
  const [entered, setEntered] = useState(false);
  const [activeThing, setActiveThing] = useState(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [wished, setWished] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const [secretVisible, setSecretVisible] = useState(false);
  const [ambientOn, setAmbientOn] = useState(Boolean(AUDIO_SRC || music.src));
  const audioRef = useRef(null);
  const mainRef = useRef(null);

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
      image: memory.image || PHOTOS.memories[index % PHOTOS.memories.length]
    }));
  }, [config]);

  // Particle count based on /creator preference
  const particleCount = appearance.particleDensity === 'low' ? 20 : appearance.particleDensity === 'medium' ? 40 : 65;

  useEffect(() => {
    if (!entered) return undefined;
    const root = mainRef.current;
    const screens = Array.from(root?.querySelectorAll('.chapter') || []);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('scene-active', entry.isIntersecting);
        if (!entry.isIntersecting || reduced) return;
        const chapter = entry.target;
        const label = chapter.querySelector('.chapter-label');
        const intro = chapter.querySelectorAll('.chapter-intro > *');
        const copy = chapter.querySelectorAll('.korea-copy > *, .time-copy > *, .future-copy > *, .blessing-copy > *, .letter-paper > *');
        const polaroids = chapter.querySelectorAll('.polaroid-pin');
        const strips = chapter.querySelectorAll('.torn-strip');

        anime.remove([label, ...intro, ...copy, ...polaroids, ...strips]);
        anime.timeline({ easing: 'easeOutExpo' })
          .add({ targets: label, opacity: [0, 1], translateY: [-15, 0], duration: 650 })
          .add({ targets: intro, opacity: [0, 1], translateY: [22, 0], delay: anime.stagger(80), duration: 800 }, '-=400')
          .add({ targets: copy, opacity: [0, 1], translateY: [20, 0], delay: anime.stagger(60), duration: 750 }, '-=600')
          .add({ targets: polaroids, opacity: [0, 1], scale: [0.7, 1], translateY: [15, 0], delay: anime.stagger(60), duration: 650 }, '-=500')
          .add({ targets: strips, opacity: [0, 1], translateX: [-20, 0], delay: anime.stagger(75), duration: 700 }, '-=500');

        if (chapter.id === 'date') {
          anime({ targets: chapter.querySelectorAll('.stamp-nums, .stamp-word, .stamp-month, .stamp-seal'), scale: [0.65, 1], opacity: [0, 1], delay: anime.stagger(90), duration: 950, easing: 'easeOutBack' });
        }
        if (chapter.id === 'blessing') {
          anime({ targets: '.flower-petal', scale: [0, 1], opacity: [0, 0.95], delay: anime.stagger(120), duration: 1100, easing: 'easeOutBack' });
          anime({ targets: '.flower-petal-inner', scale: [0, 1], opacity: [0, 0.9], delay: anime.stagger(100, { start: 500 }), duration: 900, easing: 'easeOutBack' });
          anime({ targets: '.flower-center', scale: [0, 1], opacity: [0, 1], delay: 1400, duration: 800, easing: 'easeOutBack' });
        }
      });
    }, { threshold: 0.45 });

    screens.forEach((screen) => observer.observe(screen));
    return () => { observer.disconnect(); anime.remove(root?.querySelectorAll('*')); };
  }, [entered]);

  useEffect(() => {
    if (!wished || !mainRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const particles = mainRef.current.querySelectorAll('.wish-particle');
    anime({
      targets: particles,
      opacity: [0, 1, 0],
      translateX: () => anime.random(-window.innerWidth * 0.45, window.innerWidth * 0.45),
      translateY: () => anime.random(-window.innerHeight * 0.45, window.innerHeight * 0.45),
      scale: () => anime.random(0.5, 2.5),
      delay: anime.stagger(10, { start: 100 }),
      duration: () => anime.random(1400, 2600),
      easing: 'easeOutExpo'
    });
    anime({ targets: '.wish-complete', opacity: [0, 1], translateY: [25, 0], delay: 400, duration: 1600, easing: 'easeOutExpo' });
    return () => anime.remove(particles);
  }, [wished]);

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
      audio.volume = 0.25;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    requestAnimationFrame(() => anime({ targets: '.hero-copy > *, .hero-ink-blob', opacity: [0, 1], translateY: [30, 0], delay: anime.stagger(110), duration: 1200, easing: 'easeOutExpo' }));
  };

  const replay = () => {
    setWished(false);
    setGiftOpen(false);
    setEntered(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    audioRef.current?.pause();
  };

  const openWish = () => {
    setWished(true);
  };

  const toggleGift = () => {
    setGiftOpen((isOpen) => {
      const next = !isOpen;
      if (next && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        anime.timeline({ easing: 'easeOutExpo' })
          .add({ targets: '.gift-box', translateY: ['6vh', '1vh'], rotate: ['0deg', '-3deg'], duration: 700 })
          .add({ targets: '.gift-lid', rotateX: [0, 110], translateY: [0, -30], duration: 900 }, '-=480')
          .add({ targets: '.gift-reveal', opacity: [0, 1], translateY: [20, 0], duration: 950 }, '-=380');
      }
      return next;
    });
  };

  const clickSecret = () => {
    const count = secretClicks + 1;
    setSecretClicks(count);
    if (count >= 3) setSecretVisible(true);
  };

  return (
    <main
      ref={mainRef}
      className={`birthday-app ${entered ? 'is-entered' : ''} ${wished ? 'is-wished' : ''}`}
      style={{
        '--accent': appearance.accent || '#e8a0a8',
        '--mauve': appearance.accent || '#c97d8c'
      }}
    >
      {/* 🌸 Interactive Atmosphere / Petals from /creator */}
      <Particles
        enabled={appearance.particles !== false}
        count={particleCount}
        accent={appearance.accent || '#e8a0a8'}
        theme={appearance.theme || 'cherry-blossom'}
      />

      <button className="secret-star" onClick={clickSecret} aria-label="A tiny star">✦</button>
      {secretVisible && (
        <div className="secret-note" role="status">
          <strong>You found the little secret.</strong>
          <span>Some things are better discovered than explained.</span>
        </div>
      )}

      {!entered && (
        <section className="opening-screen" aria-label="Birthday introduction">
          <div className="opening-blooms" aria-hidden="true">
            <div className="opening-bloom" />
            <div className="opening-bloom" />
            <div className="opening-bloom" />
            <div className="opening-bloom" />
            <div className="opening-bloom" />
            <div className="opening-bloom" />
          </div>
          <div className="opening-copy">
            <p className="opening-line line-one">Some dates are just dates.</p>
            <p className="opening-line line-two">And some become memories<br />before we even realize it.</p>
            <p className="opening-date">16 <span>·</span> 09</p>
            <p className="opening-name">{name}</p>
            <p className="opening-subtitle">A little birthday world,<br />made especially for you.</p>
            <button className="enter-button" onClick={enter}>Enter <span>↗</span></button>
          </div>
          <p className="opening-credit">16:09 / a small universe in your orbit</p>
        </section>
      )}

      {entered && <>
        <header className="site-rail">
          <span>16:09</span>
          <span>{name}</span>
          <span>scroll slowly ↓</span>
          <button
            className="ambient-toggle"
            disabled={!audioRef.current}
            onClick={() => {
              if (!audioRef.current) return;
              if (ambientOn) audioRef.current.pause();
              else audioRef.current.play().catch(() => {});
              setAmbientOn(!ambientOn);
            }}
            aria-label="Toggle ambience"
          >
            ♫ {ambientOn ? 'ambience on' : 'enter ambience'}
          </button>
        </header>

        {/* ── 00: HERO CHAPTER ── */}
        <section id="hero" className="chapter hero-chapter">
          <div className="hero-ink-blob" aria-hidden="true" />
          <div className="hero-copy">
            <SectionLabel number="00">the beginning</SectionLabel>
            <p className="hero-kicker">For the person who made an ordinary timeline<br />hold extraordinary moments.</p>
            <h1>Happy<br /><em>Birthday</em></h1>
            <p className="hero-date">{birthday}</p>
            <p className="hero-quote">The world has many ordinary days.<br /><em>This one happens to be yours.</em></p>
          </div>
          <div className="scroll-prompt">scroll slowly <span>↓</span><small>chapter 01 — the date</small></div>
        </section>

        {/* ── 01: THE DATE (Kraft Paper Stamp) ── */}
        <section id="date" className="chapter date-chapter">
          <SectionLabel number="01">the date</SectionLabel>
          <div className="chapter-intro">
            <h2>The day<br /><em>you were born.</em></h2>
            <p>There are billions of dates in history.<br />Somehow, this one became important simply because it belongs to you.</p>
          </div>
          <div className="date-stamp" tabIndex="0" aria-label="Sixteenth of September">
            <div className="stamp-seal">16·09</div>
            <div className="stamp-nums">16<span className="stamp-sep">/</span>09</div>
            <span className="stamp-word">SIXTEENTH</span>
            <span className="stamp-month">SEPTEMBER</span>
          </div>
          <p className="margin-note">A date, made meaningful.</p>
        </section>

        {/* ── 02: HER UNIVERSE (Corkboard & Polaroids) ── */}
        <section id="universe" className="chapter universe-chapter">
          <SectionLabel number="02">her little universe</SectionLabel>
          <div className="chapter-intro">
            <h2>Things that<br /><em>feel like you.</em></h2>
            <p>A collection of small details — the things that give your orbit its particular warmth and light.</p>
          </div>
          <div className="polaroid-board" role="list" aria-label="Favorite things">
            {liveThings.map((thing, index) => {
              const icons = ['✨', '🌸', '☕', '📖', '🎨', '✈️', '🌙', '🎵', '🌿', '💫'];
              return (
                <div
                  key={thing.key || thing.label}
                  className={`polaroid-pin ${activeThing === (thing.key || thing.label) ? 'active' : ''}`}
                  onClick={() => setActiveThing(activeThing === (thing.key || thing.label) ? null : (thing.key || thing.label))}
                  role="listitem"
                >
                  <div className="polaroid-img">
                    {icons[index % icons.length]}
                  </div>
                  <div className="polaroid-label">{thing.label}</div>
                  <span className="polaroid-num">#{String(index + 1).padStart(2, '0')}</span>
                </div>
              );
            })}
          </div>
          {activeThing && (
            <div className="thing-card" aria-live="polite">
              <span>{liveThings.find((item) => (item.key || item.label) === activeThing)?.label}</span>
              <p>{liveThings.find((item) => (item.key || item.label) === activeThing)?.note}</p>
            </div>
          )}
        </section>

        {/* ── 03: THE MOMENTS (Scrapbook Gallery) ── */}
        <section id="moments" className="chapter moments-chapter">
          <SectionLabel number="03">the moments</SectionLabel>
          <div className="chapter-intro">
            <h2>Some moments<br /><em>stay.</em></h2>
            <p>Not because they were extraordinary —<br />but because they were ours to remember.</p>
          </div>
          <div className="memory-track">
            {memoryData.map((memory, index) => (
              <article className="memory-card" key={memory.eyebrow}>
                <div className="memory-tape" />
                <div className="memory-visual">
                  <MemoryImage src={memory.image} index={index} />
                  <span className="memory-index">{memory.eyebrow}</span>
                </div>
                <p className="memory-title">{memory.title}</p>
                <p>{memory.text}</p>
                <span className="memory-handlabel">special memory ✦</span>
              </article>
            ))}
          </div>
          <p className="swipe-hint">swipe to wander <span>→</span></p>
        </section>

        {/* ── 04: UNSEEN DETAILS (Torn Paper Strips) ── */}
        <section id="details" className="chapter details-chapter">
          <SectionLabel number="04">the unseen details</SectionLabel>
          <div className="chapter-intro">
            <h2>It is always<br /><em>the little things.</em></h2>
            <p>Noticed quietly. Remembered forever.</p>
          </div>
          <div className="torn-strips">
            {[
              'The way you create.',
              'The things you notice.',
              'The places you want to see.',
              'The things that make you laugh.',
              'The dreams you haven’t finished dreaming.'
            ].map((detail, index) => (
              <div className="torn-strip" key={detail}>
                <span className="torn-num">0{index + 1}</span>
                <h3>{detail}</h3>
                <i />
              </div>
            ))}
          </div>
        </section>

        {/* ── 05: KOREA (Editorial City Mood) ── */}
        <section id="korea" className="chapter korea-chapter">
          <div className="korea-visual" aria-hidden="true" />
          <SectionLabel number="05">korea</SectionLabel>
          <div className="korea-copy">
            <p className="korea-overline">a small atmosphere for a place you love</p>
            <h2>A little<br /><em>Seoul for you.</em></h2>
            <p>Some places become special because we visit them. Some become special because someone we know dreams of seeing them.</p>
            <strong>여행의 시작</strong>
            <small>The beginning of a journey.</small>
          </div>
          <div className="korea-city-label">SEOUL, KOREA</div>
        </section>

        {/* ── 06: TIME (Watercolor Clock) ── */}
        <section id="time" className="chapter time-chapter">
          <SectionLabel number="06">time</SectionLabel>
          <div className="chapter-intro">
            <h2>I can’t<br /><em>stop time.</em></h2>
          </div>
          <div className="clock-art" aria-label="A minimal watercolor clock">
            <div className="clock-face">
              <div className="clock-hand-h" />
              <div className="clock-hand-m" />
              <div className="clock-center" />
            </div>
          </div>
          <div className="time-copy">
            <p>But I hope the time ahead of you<br />is kinder than the time behind you.</p>
            <p>May every year give you<br />something worth remembering.</p>
          </div>
          <p className="watch-note">for all the hours still waiting ✦</p>
        </section>

        {/* ── 07: GIFT BOX ── */}
        <section id="gift" className="chapter gift-chapter">
          <SectionLabel number="07">the gift box</SectionLabel>
          <div className={`gift-stage ${giftOpen ? 'open' : ''}`}>
            <button className="gift-box" onClick={toggleGift} aria-label={giftOpen ? 'Gift opened' : 'Open the gift'}>
              <div className="gift-bow" />
              <span className="gift-lid" />
              <span className="gift-body" />
              <span className="gift-ribbon ribbon-v" />
              <span className="gift-ribbon ribbon-h" />
              <span className="gift-label">TAP TO<br />OPEN</span>
            </button>
            <div className="gift-reveal">
              <p>Inside: more time to make beautiful things.</p>
              <strong>A smartwatch — for the hours that are yours.</strong>
              <small>and a reminder to keep looking up.</small>
            </div>
          </div>
        </section>

        {/* ── 08: THE BLESSING (BIG ANIMATED BLOOMING FLOWER) ── */}
        <section id="blessing" className="chapter blessing-chapter">
          <div className="flower-bloom-container" aria-hidden="true">
            {/* SVG Giant Blooming Botanical Rose/Flower */}
            <svg className="flower-svg" viewBox="0 0 500 500">
              <defs>
                <radialGradient id="petalGradOuter" cx="50%" cy="100%" r="90%">
                  <stop offset="0%" stopColor="#ff758c" />
                  <stop offset="50%" stopColor="#ff7eb3" />
                  <stop offset="100%" stopColor="#fca5b9" />
                </radialGradient>
                <radialGradient id="petalGradInner" cx="50%" cy="100%" r="90%">
                  <stop offset="0%" stopColor="#d93b68" />
                  <stop offset="60%" stopColor="#ff6584" />
                  <stop offset="100%" stopColor="#ffb3c6" />
                </radialGradient>
                <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff3b0" />
                  <stop offset="60%" stopColor="#ffd166" />
                  <stop offset="100%" stopColor="#f4a261" />
                </radialGradient>
                <filter id="bloomGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <g transform="translate(250, 250)">
                {/* Outer Petals Layer (8 petals) */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <path
                    key={`outer-${i}`}
                    className="flower-petal"
                    d="M 0 0 C -45 -90, -70 -160, 0 -220 C 70 -160, 45 -90, 0 0 Z"
                    fill="url(#petalGradOuter)"
                    transform={`rotate(${angle})`}
                    filter="url(#bloomGlow)"
                  />
                ))}

                {/* Inner Petals Layer (8 offset petals) */}
                {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
                  <path
                    key={`inner-${i}`}
                    className="flower-petal-inner"
                    d="M 0 0 C -35 -60, -50 -120, 0 -160 C 50 -120, 35 -60, 0 0 Z"
                    fill="url(#petalGradInner)"
                    transform={`rotate(${angle})`}
                  />
                ))}

                {/* Golden Luminous Center */}
                <circle className="flower-center" cx="0" cy="0" r="32" fill="url(#centerGrad)" filter="url(#bloomGlow)" />
                <circle className="flower-center" cx="0" cy="0" r="16" fill="#fff" opacity="0.8" />
              </g>
            </svg>

            {/* Floating ambient pollen blooms */}
            <div className="small-blooms">
              <div className="small-bloom" />
              <div className="small-bloom" />
              <div className="small-bloom" />
              <div className="small-bloom" />
              <div className="small-bloom" />
            </div>
          </div>

          <div className="blessing-copy">
            <SectionLabel number="08">the birthday blessing</SectionLabel>
            <h2>For the year ahead<span>…</span></h2>
            {liveBlessing.split('\n\n').map((paragraph, index) => (
              <p className={index === 2 ? 'handwritten' : ''} key={`${paragraph}-${index}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* ── 09: UNWRITTEN CHAPTERS (Book) ── */}
        <section id="future" className="chapter future-chapter">
          <SectionLabel number="09">unwritten chapters</SectionLabel>
          <div className="book">
            <div className="book-page page-left" />
            <div className="book-page page-right" />
            <div className="book-spine" />
          </div>
          <div className="future-copy">
            <h2>There is still<br /><em>so much ahead.</em></h2>
            <p>
              There are places you haven’t seen.<br /><br />
              Things you haven’t created.<br /><br />
              Songs you haven’t danced to.<br /><br />
              Photographs you haven’t taken.<br /><br />
              Memories you haven’t made.<br /><br />
              And versions of yourself<br />you haven’t met yet.
            </p>
            <strong>May you meet them all.</strong>
          </div>
        </section>

        {/* ── 10: THE LETTER (Torn Parchment) ── */}
        <section id="letter" className="chapter letter-chapter">
          <SectionLabel number="10">the letter</SectionLabel>
          <div className="letter-paper">
            <div className="letter-lines" />
            <p className="letter-to">Dear {name},</p>
            <div className="letter-body">
              {liveLetter.split('\n\n').map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
            <p className="letter-signoff">— from someone who genuinely wishes you well</p>
          </div>
        </section>

        {/* ── 11: MAKE A WISH ── */}
        <section id="wish" className="chapter wish-chapter">
          <div className="wish-petals" aria-hidden="true">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="wish-petal" />
            ))}
          </div>
          {wished && (
            <div className="wish-particle-field" aria-hidden="true">
              {Array.from({ length: 100 }, (_, index) => (
                <i className="wish-particle" key={index} />
              ))}
            </div>
          )}
          {!wished ? (
            <>
              <p className="wish-overline">before you go…</p>
              <h2>Make a<br /><em>wish.</em></h2>
              <button className="wish-button" onClick={openWish}>Make a wish <span>✦</span></button>
            </>
          ) : (
            <div className="wish-complete">
              <p>May life give you more beautiful moments<br />than you know what to wish for.</p>
              <strong>16 <span>·</span> 09</strong>
              <h2>Happy Birthday</h2>
              <button className="replay-button" onClick={replay}>Replay the journey ↺</button>
            </div>
          )}
        </section>
      </>}
    </main>
  );
}


