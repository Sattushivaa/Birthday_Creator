import { useEffect, useRef } from 'react';

/**
 * 🌸 Interactive 3D Sakura Blossoms & Fluid Atmosphere
 * Features realistic 3D petal projection, wind turbulence, and mouse push physics.
 * Configured live via /creator appearance and theme presets.
 */
export default function Particles({ enabled = true, count = 55, accent = '#cfb899', theme = 'cherry-blossom' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;
    const ctx = canvas.getContext('2d');

    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const num = reduced ? 20 : count;

    // Interactive mouse state with velocity
    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: 0, lastY: 0 };
    const onMouseMove = (e) => {
      mouse.vx = (e.clientX - mouse.lastX) * 0.18;
      mouse.vy = (e.clientY - mouse.lastY) * 0.18;
      mouse.lastX = e.clientX;
      mouse.lastY = e.clientY;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    const isSakura = theme !== 'starry-night';

    // Particle generator with 3D depth perspective
    const particles = Array.from({ length: num }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.8 + 0.25, // 3D depth scale
      size: Math.random() * (isSakura ? 13 : 4) + (isSakura ? 7 : 2),
      vx: (Math.random() - 0.5) * 0.8 - (isSakura ? 0.7 : 0),
      vy: Math.random() * 0.9 + (isSakura ? 0.8 : 0.25),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.035,
      flip: Math.random() * Math.PI,
      flipSpeed: Math.random() * 0.03 + 0.015,
      alpha: Math.random() * 0.55 + 0.25,
      color: isSakura
        ? Math.random() > 0.4
          ? 'rgba(255, 182, 196, '
          : 'rgba(255, 215, 222, '
        : 'rgba(240, 225, 200, '
    }));

    // Draw single 3D Sakura Petal
    const drawPetal = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.z, p.z * Math.cos(p.flip));

      ctx.beginPath();
      // Curving organic petal shape
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-p.size * 0.6, -p.size * 0.4, -p.size * 0.5, -p.size, 0, -p.size * 1.3);
      ctx.bezierCurveTo(p.size * 0.5, -p.size, p.size * 0.6, -p.size * 0.4, 0, 0);

      const grad = ctx.createLinearGradient(0, 0, 0, -p.size * 1.3);
      grad.addColorStop(0, p.color + (p.alpha * 0.9) + ')');
      grad.addColorStop(0.7, p.color + (p.alpha * 0.5) + ')');
      grad.addColorStop(1, 'rgba(255, 255, 255, ' + (p.alpha * 0.95) + ')');

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255, 175, 190, 0.45)';
      ctx.shadowBlur = 9 * p.z;
      ctx.fill();
      ctx.restore();
    };

    // Draw Star / Golden dust sparkle
    const drawSparkle = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(p.z, p.z);
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.shadowColor = accent || '#cfb899';
      ctx.shadowBlur = 10 * p.z;
      ctx.fill();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.rotation += p.rotSpeed;
        p.flip += p.flipSpeed;
        p.x += p.vx * p.z + Math.sin(p.flip) * 0.4;
        p.y += p.vy * p.z;

        // Interactive mouse repellent force
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          p.x += (dx / dist) * force * 5 + mouse.vx * 0.3;
          p.y += (dy / dist) * force * 5 + mouse.vy * 0.3;
        }

        // Screen boundary wrapping
        if (p.y > h + 25) {
          p.y = -25;
          p.x = Math.random() * w;
        }
        if (p.x < -35) p.x = w + 25;
        if (p.x > w + 35) p.x = -25;

        if (isSakura) {
          drawPetal(p);
        } else {
          drawSparkle(p);
        }
      }

      mouse.vx *= 0.92;
      mouse.vy *= 0.92;

      raf = requestAnimationFrame(tick);
    };

    if (!reduced) {
      raf = requestAnimationFrame(tick);
    } else {
      // Draw static single frame for reduced motion
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) drawPetal(p);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [enabled, count, accent, theme]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="particle-canvas interactive-atmosphere-canvas" aria-hidden="true" />;
}