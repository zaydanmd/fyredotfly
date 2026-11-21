// The reel plays each clip once, start to finish, then crossfades into the next.
// The crossfade starts FADE ms before a clip ends, so the cut lands as the clip finishes.
const FADE = 200; // keep in sync with the opacity transition in styles.css

const hero = document.querySelector(".hero");
const clips = [...document.querySelectorAll(".reel video")];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

let current = 0;
let onScreen = true;
let advancing = false;

const canPlay = () => onScreen && !document.hidden && !reduceMotion.matches;

function advance() {
  if (advancing) return;
  advancing = true;
  const prev = clips[current];
  current = (current + 1) % clips.length;
  const next = clips[current];
  clips[(current + 1) % clips.length].preload = "auto";

  next.currentTime = 0;
  if (canPlay()) next.play().catch(() => {});
  next.classList.add("on");
  prev.classList.remove("on");
  setTimeout(() => {
    if (prev !== clips[current]) prev.pause();
    advancing = false;
  }, FADE);
}

for (const video of clips) {
  video.loop = false;
  video.addEventListener("timeupdate", () => {
    if (video !== clips[current] || !video.duration) return;
    if (video.duration - video.currentTime <= FADE / 1000) advance();
  });
  video.addEventListener("ended", () => { if (video === clips[current]) advance(); });
  video.addEventListener("error", () => { if (video === clips[current]) advance(); });
}

function sync() {
  const video = clips[current];
  if (canPlay()) video.play().catch(() => {});
  else video.pause();
}

new IntersectionObserver(([entry]) => {
  onScreen = entry.isIntersecting;
  sync();
}).observe(hero);

document.addEventListener("visibilitychange", sync);
reduceMotion.addEventListener("change", sync);
sync();
