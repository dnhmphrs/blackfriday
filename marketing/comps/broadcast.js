// The 30% OFF Channel: scene, layout hooks and a deterministic timeline.
// Everything on screen is a pure function of time, so frames can be rendered in any order:
//   window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, makePlinth, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  // hero: where the object's centre lands on screen (px) and its diameter (px)
  '9x16': { w: 1080, h: 1920, hero: { x: 822, y: 1010, d: 430 }, plinth: { r: 0.98, gap: 0.42 }, elev: 15, yaw0: 24 },
  '4x5': { w: 1080, h: 1350, hero: { x: 826, y: 770, d: 400 }, plinth: { r: 0.98, gap: 0.42 }, elev: 15, yaw0: 24 },
  '1x1': { w: 1080, h: 1080, hero: { x: 810, y: 560, d: 400 }, plinth: { r: 0.98, gap: 0.42 }, elev: 15, yaw0: 24 },
  '16x9': { w: 1920, h: 1080, hero: { x: 1322, y: 500, d: 490 }, plinth: { r: 0.98, gap: 0.42 }, elev: 15, yaw0: 24 },
  // Chrome Web Store promo images (the small tile is drawn at 2x and scaled down afterwards)
  marquee: { w: 1400, h: 560, hero: { x: 1080, y: 236, d: 330 }, plinth: { r: 0.98, gap: 0.42 }, elev: 15, yaw0: 24 },
  tile: { w: 880, h: 560, hero: { x: 668, y: 232, d: 300 }, plinth: { r: 0.98, gap: 0.42 }, elev: 15, yaw0: 24 },
};
const format = q.get('format') || '9x16';
const F = FORMATS[format];
const DURATION = 12, FPS = 30, TURN = 6;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
if (q.get('theme')) stage.classList.add('t-' + q.get('theme')); // colourways: see the end of broadcast.css
const OPT = new Set((q.get('opt') || '').split(',').filter(Boolean)); // small optional changes: see the end of broadcast.css
for (const o of OPT) stage.classList.add('o-' + o);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

// ---------- 3D ----------
const canvas = document.getElementById('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 24;
const { renderer, scene, camera } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });

const pxPerUnit = F.hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (F.elev * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
// Shift the lens rather than the subject: the object stays undistorted wherever it sits in frame.
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);

const pivot = new THREE.Group();
scene.add(pivot);
const heroName = q.get('hero') || 'globe-core';
const hero = await buildObject(heroName, { sliceOut: 0 });
pivot.add(castShadows(hero));
if (!heroName.startsWith('globe')) { // other objects are scaled to fill the same space as the globe
  const size = new THREE.Box3().setFromObject(hero).getSize(new THREE.Vector3());
  hero.scale.setScalar(Math.min(2.35 / size.x, 2.1 / size.y));
}
if (hero.userData.slice) hero.userData.slice.visible = q.get('slice') === '1';

const plinth = makePlinth({ radius: F.plinth.r, height: 9, shadowRadius: 0.85 });
plinth.position.y = heroName.startsWith('globe') ? -(1 + F.plinth.gap) : new THREE.Box3().setFromObject(hero).min.y - 0.36;
scene.add(plinth);

// opt=plinth: the Gary Mustard Enterprises lockup printed in navy round the front of the plinth.
if (OPT.has('plinth') && heroName.startsWith('globe')) {
  const map = await new THREE.TextureLoader().loadAsync('/assets/gme/gme-primary.png');
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  const across = 1.2, tall = across * (map.image.height / map.image.width), arc = across / F.plinth.r;
  const sign = new THREE.Mesh(
    new THREE.CylinderGeometry(F.plinth.r * 1.003, F.plinth.r * 1.003, tall, 48, 1, true, -arc / 2, arc),
    new THREE.MeshBasicMaterial({ map, color: 0x0b1a5c, transparent: true, toneMapped: false, depthWrite: false })
  );
  sign.position.y = -(0.2 + tall / 2);
  plinth.add(sign);
}

// ---------- 2D ----------
await document.fonts.ready;
await Promise.all(['300 58px Antonio', '400 100px "Archivo Black"', 'italic 700 50px Arimo', 'italic 700 44px Tinos', 'italic 800 48px "EB Garamond"', '400 62px VT323', '700 21px Arimo'].map((f) => document.fonts.load(f)));

// Tickers: repeat the text, and move a whole number of repeats per loop so the loop is seamless.
const tickers = [...document.querySelectorAll('.ticker')].map((el) => {
  const run = el.querySelector('.run');
  const text = run.dataset.text;
  run.textContent = text;
  const unit = run.getBoundingClientRect().width;
  if (!unit) return null; // this format hides the ticker
  run.textContent = text.repeat(Math.ceil((F.w * 2) / unit) + 1);
  const perLoop = Math.max(1, Math.round((el.classList.contains('bottom') ? 300 : 230) * DURATION / unit));
  return { run, unit, perLoop, skew: el.classList.contains('bottom') ? ' skewX(-9deg)' : '' };
}).filter(Boolean);

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(30);

// Glints on the chrome: four-point stars that flare for a third of a second.
const sparkleLayer = document.getElementById('sparkles');
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const sparkles = Array.from({ length: 26 }, () => {
  const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * F.hero.d * 0.52;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-1 -1 2 2');
  svg.innerHTML = `<path d="${STAR}" fill="#fff"/>`;
  sparkleLayer.append(svg);
  return { svg, x: F.hero.x + Math.cos(a) * r - 30, y: F.hero.y + Math.sin(a) * r * 0.95 - 40, size: 46 + rnd() * 70, t0: rnd() * DURATION, life: 0.3 + rnd() * 0.2, spin: rnd() * 40 - 20 };
});

// ?title=Everything|Must Go replaces the two title lines.
const TITLE = (q.get('title') || 'World Wide|Sale').split('|');
document.querySelector('.title .l1').textContent = TITLE[0];
document.querySelector('.title .l2').textContent = TITLE[1] || '';
const priceBig = document.querySelector('.price .big');
const pill = document.querySelector('.pill'), oval = document.querySelector('.oval');
const TAU = Math.PI * 2;

// One full turn every TURN seconds, slowing down while the cut faces the camera.
// (yaw0 turns the pose it lingers on: a little off-centre shows the cut as a wedge, not a disc.)
const yawAt = (t) => { const u = t / TURN; return ((F.yaw0 || 0) * Math.PI) / 180 + TAU * u - 0.6 * Math.sin(TAU * u); };

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  pivot.rotation.y = yawAt(t);
  pivot.position.y = Math.sin((t / DURATION) * TAU * 2) * 0.035;

  for (const k of tickers) {
    const x = -(((t / DURATION) * k.perLoop * k.unit) % k.unit);
    k.run.style.transform = `translateX(${x.toFixed(2)}px)${k.skew}`;
  }

  priceBig.style.transform = `skewX(-8deg) scale(${(1 + 0.035 * Math.max(0, Math.sin(t * TAU * 1.5))).toFixed(4)})`;
  pill.style.transform = `scale(var(--k, 1)) skewX(-9deg) rotate(${(-1.5 + Math.sin(t * TAU / 4) * 0.8).toFixed(3)}deg)`;
  oval.style.transform = `scale(var(--k, 1)) rotate(${(-7 + Math.sin(t * TAU / 3 + 1) * 1.6).toFixed(3)}deg)`;

  for (const s of sparkles) {
    let p = (t - s.t0) / s.life;
    if (p < 0) p = (t + DURATION - s.t0) / s.life; // wraps across the loop point
    const on = p >= 0 && p <= 1;
    const k = on ? Math.sin(p * Math.PI) : 0;
    s.svg.style.cssText = `left:${s.x}px;top:${s.y}px;width:${s.size}px;height:${s.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(s.spin * p).toFixed(2)}deg);filter:drop-shadow(0 0 6px #fff)`;
  }

  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, hero, plinth } };
setTime(Number(q.get('t') || 0));
window.ready = true;
