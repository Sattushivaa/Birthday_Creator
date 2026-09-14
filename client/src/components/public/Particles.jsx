import { useEffect, useRef } from 'react';

/**
 * Subtle floating particle field rendered on a fixed canvas.
 * Respects prefers-reduced-motion (renders a single static frame).
 * Exported so the creator appearance toggle can disable it.
 */
export default function Particles({ enabled = true, count = 55, accent = '#e8b4b8' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');

    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const particles = Array.from({ length: reduced ? Math.min(count, 20) : count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.05 + Math.random() * 0.25),
      alpha: 0.08 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.globalAlpha = a;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
      }
      draw();

      if (!reduced) {
        const elapsed = Date.now();
        // Only drift when tab is visible-ish; cheap check via rAF throttling by browser anyway.
        if (elapsed % 2 === 0) {
          // no-op, keep the loop simple
        }
      }
    };

    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', onResize);
    if (!reduced) {
      raf = requestAnimationFrame(loop);
    } else {
      draw(); // static frame
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [enabled, count, accent]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}