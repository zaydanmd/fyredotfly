const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

// The space behind the page: nebula clouds, a dust band and faint dust stars are
// painted once into a canvas as tall as the whole page, and brighter stars twinkle on
// a second canvas on top. Both sit in the page and scroll with it, so the browser moves
// them together with the content even when this script falls behind. The star canvas
// is only two screens tall: each frame it moves to the part of the page around the
// screen and redraws the stars there. A fixed seed keeps the layout identical on every
// visit.
const sky = document.querySelector(".sky");
const dustCanvas = sky.querySelector(".dust");
const starCanvas = sky.querySelector(".stars");
const starCtx = starCanvas.getContext("2d");
const WHITE = "255,255,255";
const SPACE = "#03040b";
const NEBULA = ["18,85,76", "38,90,48", "60,70,190", "120,60,180", "30,120,200"]; // teal and green kept dim
let stars = [];
let starFrame = 0;
let animating = false;
let pageH = 0;
let bandH = 0;
let bandTop = -1;

function buildStars() {
  const { width, height: fullH } = sky.getBoundingClientRect();
  bandH = starCanvas.getBoundingClientRect().height;
  if (!width || !fullH || !bandH) return false;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  starCanvas.width = Math.round(width * dpr);
  starCanvas.height = Math.round(bandH * dpr);
  starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  pageH = fullH;
  bandTop = -1;

  let seed = 1310; // Firefly's character ID
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  paintBackdrop(width, fullH, bandH / 2, rand);
  stars = Array.from({ length: Math.round((width * fullH) / 5200) }, () => {
    const bright = rand() < 0.07;
    return {
      x: rand() * width,
      y: rand() * fullH,
      r: bright ? 1.1 + rand() * 1 : 0.5 + rand() * 0.8,
      alpha: bright ? 0.85 + rand() * 0.15 : 0.3 + rand() * 0.6,
      tint: WHITE,
      glow: bright ? 5 : 0,
      // Twinkle: two uneven flickers mixed together. Frequencies are in radians per second.
      f1: 0.8 + rand() * 1.4,
      f2: 2.2 + rand() * 2.3,
      p1: rand() * Math.PI * 2,
      p2: rand() * Math.PI * 2,
    };
  });
  return true;
}

function paintBackdrop(width, height, screenH, rand) {
  dustCanvas.width = Math.round(width); // 1x: it is soft anyway
  dustCanvas.height = Math.round(height);
  const g = dustCanvas.getContext("2d");
  g.fillStyle = SPACE;
  g.fillRect(0, 0, width, height);
  const big = Math.max(width, screenH);

  // Nebula clouds: large, very faint colour washes that add up where they overlap,
  // about six per screen of page.
  g.globalCompositeOperation = "lighter";
  const clouds = Math.round(6 * height / screenH);
  for (let i = 0; i < clouds; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = big * (0.18 + rand() * 0.32);
    const tint = NEBULA[Math.floor(rand() * NEBULA.length)];
    const a = 0.035 + rand() * 0.06;
    const cloud = g.createRadialGradient(x, y, 0, x, y, r);
    cloud.addColorStop(0, `rgba(${tint},${a})`);
    cloud.addColorStop(0.5, `rgba(${tint},${a * 0.4})`);
    cloud.addColorStop(1, `rgba(${tint},0)`);
    g.fillStyle = cloud;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // A soft diagonal dust band, like a distant galaxy seen edge-on, crossing the
  // second screen of the page where the eidolons begin.
  const bandY = Math.min(height / 2, screenH * 1.6);
  g.save();
  g.translate(width / 2, bandY);
  g.rotate(-0.42);
  g.scale(1, 0.16);
  const band = g.createRadialGradient(0, 0, 0, 0, 0, big * 0.75);
  band.addColorStop(0, "rgba(150,170,255,0.09)");
  band.addColorStop(0.45, "rgba(110,190,200,0.04)");
  band.addColorStop(1, "rgba(110,190,200,0)");
  g.fillStyle = band;
  g.fillRect(-big, -big, big * 2, big * 2);
  g.restore();

  // Dust: thousands of tiny dim stars, thicker near the band.
  g.globalCompositeOperation = "source-over";
  const dust = Math.round((width * height) / 450);
  for (let i = 0; i < dust; i++) {
    let x = rand() * width;
    let y = rand() * height;
    if (rand() < 0.3) {
      // pull this one toward the band's centre line
      const along = (rand() - 0.5) * big * 1.4;
      const across = (rand() + rand() + rand() - 1.5) * big * 0.08;
      x = width / 2 + along * Math.cos(-0.42) - across * Math.sin(-0.42);
      y = bandY + along * Math.sin(-0.42) + across * Math.cos(-0.42);
    }
    g.fillStyle = `rgba(220,230,255,${0.05 + rand() * 0.22})`;
    g.fillRect(x, y, 0.5 + rand() * 0.7, 0.5 + rand() * 0.7);
  }
}

function drawStars(time) {
  // Centre the star canvas on the screen, leaving half a screen above and below for
  // the browser to scroll into before this script catches up.
  const top = Math.round(Math.max(0, Math.min(scrollY - bandH / 4, pageH - bandH)));
  if (top !== bandTop) {
    bandTop = top;
    starCanvas.style.transform = `translateY(${top}px)`;
  }
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
  const t = time / 1000;
  for (const s of stars) {
    const y = s.y - top;
    if (y < -20 || y > bandH + 20) continue;
    const flicker = 0.55 + 0.25 * Math.sin(t * s.f1 + s.p1) + 0.2 * Math.sin(t * s.f2 + s.p2);
    const a = s.alpha * flicker;
    if (s.glow) {
      const g = starCtx.createRadialGradient(s.x, y, 0, s.x, y, s.r * s.glow);
      g.addColorStop(0, `rgba(${s.tint},${a * 0.45})`);
      g.addColorStop(1, `rgba(${s.tint},0)`);
      starCtx.fillStyle = g;
      starCtx.fillRect(s.x - s.r * s.glow, y - s.r * s.glow, s.r * s.glow * 2, s.r * s.glow * 2);
    }
    starCtx.fillStyle = `rgba(${s.tint},${a})`;
    starCtx.beginPath();
    starCtx.arc(s.x, y, s.r, 0, Math.PI * 2);
    starCtx.fill();
  }
}

function syncStars() {
  cancelAnimationFrame(starFrame);
  animating = !reduceMotion.matches && !document.hidden;
  if (!animating) {
    drawStars(0);
    return;
  }
  const loop = (time) => {
    drawStars(time);
    starFrame = requestAnimationFrame(loop);
  };
  starFrame = requestAnimationFrame(loop);
}

// Rebuild when the window or the page height changes; when still, redraw on scroll.
const rebuild = () => { if (buildStars()) syncStars(); };
new ResizeObserver(rebuild).observe(sky);
new ResizeObserver(rebuild).observe(starCanvas);
addEventListener("scroll", () => { if (!animating) drawStars(0); }, { passive: true });
document.addEventListener("visibilitychange", syncStars);
reduceMotion.addEventListener("change", syncStars);
