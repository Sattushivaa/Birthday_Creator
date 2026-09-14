import Reveal from './Reveal.jsx';

/**
 * The emotional payoff: large birthday heading, personalized message,
 * optional photograph, signature line.
 */
export default function FinalMessage({ config, onReplay }) {
  const fm = config.finalMessage || {};
  const person = config.person || {};
  const heading = fm.title?.trim() || config.person?.birthdayHeading || 'Happy Birthday,';
  const name = fm.name?.trim() || person.name || '';

  return (
    <section className="final-section" aria-label="Birthday message">
      <Reveal>
        <h1 className="final-heading">
          {heading}
          {name && <span className="final-name">{name}</span>}
        </h1>
      </Reveal>

      {fm.image && (
        <Reveal delay={250}>
          <img className="final-image" src={fm.image} alt="" />
        </Reveal>
      )}

      {fm.message && (
        <Reveal delay={450}>
          <p className="final-message">{fm.message}</p>
        </Reveal>
      )}

      {fm.signature && (
        <Reveal delay={700}>
          <p className="final-signature">{fm.signature}</p>
        </Reveal>
      )}

      <Reveal delay={900}>
        <div className="final-heart" aria-hidden="true">♥</div>
      </Reveal>

      <Reveal delay={1000}>
        <button
          className="intro-enter"
          style={{ marginTop: '2.5rem', background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          onClick={onReplay}
        >
          Replay ↺
        </button>
      </Reveal>
    </section>
  );
}