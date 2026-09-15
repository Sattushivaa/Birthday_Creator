import { useState } from 'react';
import { useConfig } from '../configContext.js';
import { API } from '../api.js';
import { toast } from '../toast.js';
import UploadImage from '../components/creator/UploadImage.jsx';

export default function CreatorSettings() {
  const { config, refreshConfig } = useConfig();
  const [busy, setBusy] = useState(false);

  // Local draft state for person fields
  const person = config.person || {};
  const intro = config.intro || {};
  const finalMessage = config.finalMessage || {};
  const appearance = config.appearance || {};

  const [pDraft, setPDraft] = useState({
    name: person.name || '',
    nickname: person.nickname || '',
    birthday: person.birthday || '16 September',
    birthdayHeading: person.birthdayHeading || 'Happy Birthday,'
  });
  const [introDraft, setIntroDraft] = useState({
    title: intro.title || '',
    subtitle: intro.subtitle || ''
  });
  const [fmDraft, setFmDraft] = useState({
    title: finalMessage.title || 'Happy Birthday,',
    name: finalMessage.name || '',
    message: finalMessage.message || '',
    signature: finalMessage.signature || ''
  });
  const [appDraft, setAppDraft] = useState({
    accent: appearance.accent || '#e8b4b8',
    particles: appearance.particles !== false,
    theme: appearance.theme || 'cherry-blossom',
    particleDensity: appearance.particleDensity || 'high',
    grain: appearance.grain !== false,
    vignette: appearance.vignette !== false,
    animation: appearance.animation || 'medium',
    font: appearance.font || 'serif'
  });
  const [experienceDraft, setExperienceDraft] = useState({
    blessing: config.experience?.blessing || '',
    letter: config.experience?.letter || ''
  });

  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' });
  const [pwdBusy, setPwdBusy] = useState(false);

  const savePerson = async () => {
    setBusy(true);
    try {
      await API.saveConfig({ person: pDraft });
      await refreshConfig();
      toast('Person saved ✓');
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const saveIntro = async () => {
    setBusy(true);
    try {
      await API.saveConfig({ intro: introDraft });
      await refreshConfig();
      toast('Intro saved ✓');
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const saveFinal = async () => {
    setBusy(true);
    try {
      await API.saveConfig({ finalMessage: fmDraft });
      await refreshConfig();
      toast('Final message saved ✓');
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const saveAppearance = async () => {
    setBusy(true);
    try {
      await API.saveConfig({ appearance: appDraft });
      await refreshConfig();
      toast('Atmosphere & Appearance saved ✓');
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const saveExperience = async () => {
    setBusy(true);
    try {
      await API.saveConfig({ experience: experienceDraft });
      await refreshConfig();
      toast('Cinematic copy saved ✓');
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  const changePassword = async () => {
    if (!pwd.current || !pwd.new) {
      toast('Both fields required', 'error');
      return;
    }
    if (pwd.new.length < 6) {
      toast('New password must be at least 6 characters', 'error');
      return;
    }
    if (pwd.new !== pwd.confirm) {
      toast('New passwords do not match', 'error');
      return;
    }
    setPwdBusy(true);
    try {
      await API.changePassword(pwd.current, pwd.new);
      toast('Password changed ✓');
      setPwd({ current: '', new: '', confirm: '' });
    } catch (err) { toast(err.message || 'Failed', 'error'); }
    finally { setPwdBusy(false); }
  };

  const accentPresets = [
    '#e8b4b8', '#c7a8d0', '#a8c8d0', '#d0c7a8',
    '#b8d0b4', '#d4a89b', '#9baad4', '#d4bfa8',
    '#ffffff'
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Personalise the experience: who is it for, what do they see, and the final message.</p>
        </div>
      </div>

      {/* Person */}
      <div className="card form-section">
        <h3>Who is it for?</h3>
          <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input value={pDraft.name} onChange={(e) => setPDraft({ ...pDraft, name: e.target.value })} placeholder="Alex" />
          </div>
        <div className="form-group">
          <label className="form-label">Birthday date</label>
          <input value={pDraft.birthday} onChange={(e) => setPDraft({ ...pDraft, birthday: e.target.value })} placeholder="16 September" />
        </div>
          <div className="form-group">
            <label className="form-label">Nickname (optional)</label>
            <input value={pDraft.nickname} onChange={(e) => setPDraft({ ...pDraft, nickname: e.target.value })} placeholder="Lex" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Birthday heading</label>
          <input value={pDraft.birthdayHeading} onChange={(e) => setPDraft({ ...pDraft, birthdayHeading: e.target.value })} />
          <div className="form-hint">The large text at the top: "Happy Birthday," — adjust if you prefer something else.</div>
        </div>
        <div className="form-group">
          <label className="form-label">Hero image (full-screen background)</label>
          <UploadImage value={person.heroImage} onChange={(url) => { setPDraft({ ...pDraft, heroImage: url }); API.saveConfig({ person: { ...pDraft, heroImage: url } }).then(refreshConfig); toast('Hero image saved'); }} label="hero background" />
        </div>
        <button className="btn btn-primary" onClick={savePerson} disabled={busy}>Save person</button>
      </div>

      {/* Intro */}
      <div className="card form-section">
        <h3>Intro screen</h3>
        <div className="form-group">
          <label className="form-label">Opening title</label>
          <input value={introDraft.title} onChange={(e) => setIntroDraft({ ...introDraft, title: e.target.value })} placeholder="Something has been waiting for you…" />
        </div>
        <div className="form-group">
          <label className="form-label">Subtitle</label>
          <input value={introDraft.subtitle} onChange={(e) => setIntroDraft({ ...introDraft, subtitle: e.target.value })} placeholder="A small collection of moments, set to music." />
        </div>
        <button className="btn btn-primary" onClick={saveIntro} disabled={busy}>Save intro</button>
      </div>

      {/* Final message */}
      <div className="card form-section">
        <h3>Final message</h3>
        <div className="form-group">
          <label className="form-label">Heading</label>
          <input value={fmDraft.title} onChange={(e) => setFmDraft({ ...fmDraft, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input value={fmDraft.name} onChange={(e) => setFmDraft({ ...fmDraft, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            value={fmDraft.message}
            onChange={(e) => setFmDraft({ ...fmDraft, message: e.target.value })}
            rows={5}
            placeholder="Thank you for every memory we've already made — and for all the ones still waiting for us."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Signature</label>
          <input value={fmDraft.signature} onChange={(e) => setFmDraft({ ...fmDraft, signature: e.target.value })} placeholder="With love, always" />
        </div>
        <div className="form-group">
          <label className="form-label">Final image (optional — shows circular)</label>
          <UploadImage value={finalMessage.image} onChange={(url) => { setFmDraft({ ...fmDraft, image: url }); API.saveConfig({ finalMessage: { ...fmDraft, image: url } }).then(refreshConfig); toast('Final image saved'); }} label="final photo" />
        </div>
        <button className="btn btn-primary" onClick={saveFinal} disabled={busy}>Save final message</button>
      </div>

      {/* Interactive 3D & Animation Theme Presets */}
      <div className="card form-section">
        <h3>Interactive Theme & 3D Atmosphere</h3>
        <p className="form-hint" style={{ marginBottom: '1rem' }}>Customize the interactive canvas effects, Sakura blossom density, and particle depth.</p>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Atmosphere Theme</label>
            <select value={appDraft.theme || 'cherry-blossom'} onChange={(e) => setAppDraft({ ...appDraft, theme: e.target.value })}>
              <option value="cherry-blossom">🌸 Sakura Blossom & Growing Tree (Cinematic)</option>
              <option value="starry-night">✨ Celestial Starlight & Constellations</option>
              <option value="golden-dust">✨ Golden Aurora & Floating Sparks</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Blossom / Particle Density</label>
            <select value={appDraft.particleDensity || 'high'} onChange={(e) => setAppDraft({ ...appDraft, particleDensity: e.target.value })}>
              <option value="low">Subtle (25 particles)</option>
              <option value="medium">Balanced (45 particles)</option>
              <option value="high">Lush / Rich (75 interactive blossoms)</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={saveAppearance} disabled={busy} style={{ marginTop: '1rem' }}>Save atmosphere & 3D theme</button>
      </div>

      {/* Cinematic copy */}
      <div className="card form-section">
        <h3>Cinematic copy</h3>
        <p className="form-hint" style={{ marginBottom: '1rem' }}>These fields replace the blessing and letter in the screen-by-screen experience.</p>
        <div className="form-group">
          <label className="form-label">Birthday blessing</label>
          <textarea rows={8} value={experienceDraft.blessing} onChange={(e) => setExperienceDraft({ ...experienceDraft, blessing: e.target.value })} placeholder="Leave blank to use the crafted default blessing." />
        </div>
        <div className="form-group">
          <label className="form-label">The letter</label>
          <textarea rows={12} value={experienceDraft.letter} onChange={(e) => setExperienceDraft({ ...experienceDraft, letter: e.target.value })} placeholder="Leave blank to use the crafted default letter." />
        </div>
        <button className="btn btn-primary" onClick={saveExperience} disabled={busy}>Save cinematic copy</button>
      </div>

      <div className="card form-section">
        <h3>Appearance</h3>
        <div className="form-group">
          <label className="form-label">Accent colour</label>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
            {accentPresets.map((c) => (
              <button
                key={c}
                onClick={() => setAppDraft({ ...appDraft, accent: c })}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: c, border: appDraft.accent === c ? '3px solid var(--text)' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'border .2s ease'
                }}
                title={c}
              />
            ))}
          </div>
          <input
            value={appDraft.accent}
            onChange={(e) => setAppDraft({ ...appDraft, accent: e.target.value })}
            placeholder="#e8b4b8"
            style={{ width: 120, fontVariantNumeric: 'tabular-nums' }}
          />
        </div>

        <div className="toggle-row">
          <label>Floating particles</label>
          <input type="checkbox" className="toggle" checked={appDraft.particles} onChange={(e) => setAppDraft({ ...appDraft, particles: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <label>Film grain overlay</label>
          <input type="checkbox" className="toggle" checked={appDraft.grain} onChange={(e) => setAppDraft({ ...appDraft, grain: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <label>Vignette</label>
          <input type="checkbox" className="toggle" checked={appDraft.vignette} onChange={(e) => setAppDraft({ ...appDraft, vignette: e.target.checked })} />
        </div>

        <div className="form-row" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Animation intensity</label>
            <select value={appDraft.animation} onChange={(e) => setAppDraft({ ...appDraft, animation: e.target.value })}>
              <option value="low">Low (minimal movement)</option>
              <option value="medium">Medium (balanced)</option>
              <option value="high">High (more dramatic)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Typography feel</label>
            <select value={appDraft.font} onChange={(e) => setAppDraft({ ...appDraft, font: e.target.value })}>
              <option value="serif">Serif (Cormorant Garamond)</option>
              <option value="sans">Sans-serif (Inter)</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveAppearance} disabled={busy}>Save appearance</button>
      </div>

      {/* Password */}
      <div className="card form-section">
        <h3>Security</h3>
        <div className="form-group">
          <label className="form-label">Current password</label>
          <input
            type="password"
            value={pwd.current}
            onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
            placeholder="current password"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              type="password"
              value={pwd.new}
              onChange={(e) => setPwd({ ...pwd, new: e.target.value })}
              placeholder="new password"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm</label>
            <input
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              placeholder="confirm new password"
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={changePassword} disabled={pwdBusy || !pwd.current || !pwd.new || !pwd.confirm}>
          {pwdBusy ? 'Changing…' : 'Change password'}
        </button>
      </div>
    </div>
  );
}
