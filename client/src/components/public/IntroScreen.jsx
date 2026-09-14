export default function IntroScreen({ intro, onEnter }) {
  return (
    <div className="intro-screen">
      <h1 className="intro-title">{intro?.title || 'Something has been waiting for you…'}</h1>
      {intro?.subtitle && <p className="intro-subtitle">{intro.subtitle}</p>}
      <button className="intro-enter" onClick={onEnter} aria-label="Enter the experience">
        Enter
      </button>
    </div>
  );
}