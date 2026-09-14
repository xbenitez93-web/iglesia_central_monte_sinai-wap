/**
 * Lightweight HTML5 Canvas Confetti Burst
 * Works without any external library, safe for React 19 and offline environments.
 */

export function triggerConfetti(durationMs = 3500): void {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.body.removeChild(canvas);
    return;
  }

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const handleResize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', handleResize);

  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#eab308'];

  interface Particle {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vx: number;
    vy: number;
    rotation: number;
    vRot: number;
    opacity: number;
  }

  const particles: Particle[] = [];
  const particleCount = 120;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: width * 0.5 + (Math.random() - 0.5) * 200,
      y: height * 0.45 + (Math.random() - 0.5) * 100,
      w: Math.random() * 10 + 6,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.75) * 18,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.3,
      opacity: 1,
    });
  }

  const startTime = Date.now();
  let animId: number;

  const render = () => {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / durationMs;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.vRot;

      if (progress > 0.6) {
        p.opacity = Math.max(0, 1 - (progress - 0.6) / 0.4);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (elapsed < durationMs) {
      animId = requestAnimationFrame(render);
    } else {
      window.removeEventListener('resize', handleResize);
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };

  animId = requestAnimationFrame(render);
}
