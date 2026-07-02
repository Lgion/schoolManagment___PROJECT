// Micro-animations de célébration (spec §4) — sans dépendance externe.
// Confettis dessinés sur un canvas plein écran éphémère + petit carillon WebAudio.

// Couleurs alignées sur les tokens « École chaleureux » (valeurs en dur ici car
// le canvas ne lit pas les variables CSS ; ce sont les mêmes teintes que _variables.scss).
const COLORS = ['#1E3A8A', '#2563EB', '#F97316', '#FB923C', '#16A34A', '#DB2777', '#F59E0B'];

export function burstConfetti({ count = 130, duration = 2600 } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2000;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const parts = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.35,
    y: H * 0.28 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 13,
    vy: Math.random() * -13 - 4,
    size: Math.random() * 7 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.3,
  }));
  const gravity = 0.35;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += gravity; p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vx *= 0.99;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}

// Petit arpège « réussite » (do-mi-sol). Best-effort : peut être bloqué par le
// navigateur sans geste utilisateur — on échoue silencieusement dans ce cas.
export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ac = new AudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ac.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ac.close().catch(() => {}), 1300);
  } catch (_) {
    /* audio indisponible — best effort */
  }
}
