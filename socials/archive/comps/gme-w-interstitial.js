// THE INTERSTITIAL. The early-web full-page ad you had to sit through before the site:
// "ADVERTISEMENT", the offer set huge in flat yellow and white on web blue, a spinning globe
// stepped like an animated GIF, and a loading bar that never gets past 70%.
// The square is the whole interstitial ("Your website will continue shortly"). The extension's
// banner is the interstitial that only took 30% of the page: its bar is stuck at 70% because
// that is all of the page you get, and the rest of the page is to its left (below, on a phone).
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format. Message blocks flow down the page: each starts `gap` below the last
// (or at `y`), at `x`, and its widest row is fitted to `w`.
//   label: the ADVERTISEMENT line (x, y, w, size)
//   msg:   blocks of rows, c = colour (y yellow, w white), align left/center
//   globe: centre and diameter (or k:'globe' in the flow)
//   status: the caption and the loading bar
//   logo:  centre and width
const FORMATS = {
  '1x1': {
    w: 1080, h: 1080,
    label: { x: 60, y: 40, w: 960, size: 24 },
    msg: [
      { rows: ['30%', 'OFF'], c: 'y', blink: true, x: 58, y: 108, w: 515 },
      { rows: ['EVERYTHING ON', 'THE INTERNET.'], c: 'w', x: 58, gap: 58, w: 964 },
      { rows: ['BLACK FRIDAY ONLY!'], c: 'y', x: 58, gap: 44, w: 964 },
    ],
    globe: { x: 822, y: 282, d: 372 },
    status: { x: 60, y: 866, w: 960, bar: 58, size: 32, bw: 5, cap: 'Your website will continue shortly<span class="dots" id="dots"></span>' },
    logo: { x: 540, y: 1036, w: 96 },
  },
  'banner-v': {
    w: 1080, h: 2025,
    label: { x: 70, y: 56, w: 940, size: 40 },
    msg: [
      { rows: ['30% OFF'], c: 'y', blink: true, x: 60, y: 128, w: 960, align: 'center' },
      { rows: ['EVERYTHING', 'ON THE', 'INTERNET.'], c: 'w', x: 60, gap: 40, w: 960, align: 'center' },
      { k: 'globe', d: 540, gap: 30 },
      { rows: ['BLACK FRIDAY', 'ONLY!'], c: 'y', x: 60, gap: 30, w: 960, align: 'center' },
    ],
    status: { x: 70, gap: 90, w: 940, bar: 100, size: 64, bw: 8, arrow: 'left', cap: 'Your page continues<br>to the left' },
    logo: { x: 540, y: 1955, w: 170 },
  },
  'banner-h': {
    w: 1170, h: 834,
    label: { x: 56, y: 34, w: 900, size: 28 },
    msg: [
      { rows: ['30% OFF'], c: 'y', blink: true, x: 52, y: 92, w: 836 },
      { rows: ['EVERYTHING ON', 'THE INTERNET.'], c: 'w', x: 52, gap: 40, w: 836 },
      { rows: ['BLACK FRIDAY ONLY!'], c: 'y', x: 52, gap: 40, w: 836 },
    ],
    globe: { x: 1034, y: 316, d: 250 },
    status: { x: 56, y: 568, w: 1058, bar: 90, size: 50, bw: 7, arrow: 'down', cap: 'Your page continues below' },
    logo: { x: 1058, y: 47, w: 110 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '1x1';
const F = FORMATS[format];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);
const px = (n) => n.toFixed(2) + 'px';

// ---------- fonts ----------
await Promise.all(['400 100px "Archivo Black"', '700 40px "Arimo"', '400 40px "Silkscreen"'].map((f) => document.fonts.load(f)));

// ---------- ADVERTISEMENT ----------
{
  const L = $('label');
  Object.assign(L.style, { left: px(F.label.x), top: px(F.label.y), width: px(F.label.w), fontSize: px(F.label.size) });
  L.querySelectorAll('i').forEach((i) => { i.style.borderTopWidth = px(Math.max(2, F.label.size / 12)); });
}

// ---------- the offer ----------
const msg = $('msg'), BLINK = [];
let cursor = 0, hero = F.globe || null;
for (const b of F.msg) {
  const top = b.y ?? cursor + (b.gap || 0);
  if (b.k === 'globe') { hero = { x: F.w / 2, y: top + b.d / 2, d: b.d }; cursor = top + b.d; continue; }
  const el = document.createElement('div');
  el.className = 'ln ' + b.c;
  el.innerHTML = b.rows.map((r) => `<span class="r">${r}</span>`).join('');
  msg.append(el);
  if (b.blink) BLINK.push(el);
  el.style.width = 'max-content';
  el.style.fontSize = '100px';
  const w0 = Math.max(...[...el.children].map((c) => c.getBoundingClientRect().width));
  const size = (100 * b.w) / w0;
  el.style.fontSize = px(size);
  // trim the line box to the caps: top of the block sits on the cap line
  el.style.top = px(top - size * 0.14);
  if (b.align === 'center') { el.style.width = px(b.w); el.style.left = px(b.x); el.style.textAlign = 'center'; }
  else el.style.left = px(b.x - size * 0.03);
  const h = el.getBoundingClientRect().height;
  cursor = top - size * 0.14 + h - size * 0.2;
}

// ---------- the loading bar ----------
const S = F.status;
const status = $('status'), fill = $('fill'), bar = $('bar');
{
  const sy = S.y ?? cursor + S.gap;
  Object.assign(status.style, { left: px(S.x), top: px(sy), width: px(S.w) });
  const ARROW = ['....#.......', '...##.......', '..###.......', '.###########', '############', '.###########', '..###.......', '...##.......', '....#.......'];
  const svg = `<svg viewBox="0 0 12 9" shape-rendering="crispEdges">${ARROW.map((r, y) => [...r].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>` : '')).join('')).join('')}</svg>`;
  $('cap').innerHTML = (S.arrow ? `<span class="arr" id="arr">${svg}</span>` : '') + `<span class="txt">${S.cap}</span>`;
  $('cap').style.fontSize = px(S.size);
  $('pct').style.fontSize = px(S.bar * 0.5);
  $('cap').style.marginBottom = px(S.size * 0.42);
  if (S.arrow) {
    const A = $('arr');
    A.style.fill = 'var(--yellow)';
    const lines = (S.cap.match(/<br>/g) || []).length + 1;
    A.style.width = A.style.height = px(S.size * Math.min(1.9, 0.95 * lines));
    if (S.arrow === 'down') A.firstChild.style.transform = 'rotate(-90deg)';
  }
  bar.style.height = px(S.bar);
  bar.style.setProperty('--bw', px(S.bw));
}
const STRIPE = S.bar * 1.2; // one stripe period, px along x
// The stripes live on one wide strip that slides by less than a period each frame, so there
// are no tile seams (a tiled background showed a hard joint at fractional offsets).
const stripes = document.createElement('i');
stripes.className = 'stripes';
Object.assign(stripes.style, { left: px(-2 * STRIPE), width: px(S.w + 4 * STRIPE),
  backgroundImage: `repeating-linear-gradient(-45deg, rgba(255,255,255,0) 0 ${px(STRIPE * 0.3535)}, rgba(255,255,255,0.55) ${px(STRIPE * 0.3535)} ${px(STRIPE * 0.7071)})` });
fill.prepend(stripes);
const dots = $('dots'), arr = $('arr');
const arrSize = arr ? parseFloat(arr.style.width) : 0;
if (dots) dots.innerHTML = '<i>.</i><i>.</i><i>.</i>';

// ---------- logo ----------
{
  const L = $('logo'), w = F.logo.w, h = w * 610 / 1142;
  Object.assign(L.style, { left: px(F.logo.x - w / 2), top: px(F.logo.y - h / 2), width: px(w), height: px(h) });
}

// ---------- background glow behind the globe ----------
$('glow').style.background = `radial-gradient(${px(hero.d * 1.1)} ${px(hero.d * 1.1)} at ${px(hero.x)} ${px(hero.y)}, rgba(120,170,255,0.55) 0%, rgba(80,130,255,0.22) 45%, rgba(22,70,255,0) 100%)`;

// ---------- 3D: the spinning globe ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 20;
// gifpx > 1 renders the globe at a fraction of the resolution and scales it up hard-edged.
const GIFPX = Number(q.get('gifpx') ?? F.gifpx ?? 1);
if (GIFPX > 1) canvas.style.imageRendering = 'pixelated';
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: GIFPX > 1 ? 1 / GIFPX : Number(q.get('pr') || 1), fov: FOV });
key.intensity = 2.0;
const pxPerUnit = hero.d / 2 / 1.06;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (Number(q.get('elev') ?? 16) * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - hero.x, F.h / 2 - hero.y, F.w, F.h);
const pivot = new THREE.Group();
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
globe.traverse((o) => { if (o.isMesh && o.material && o.material.map) { o.material.envMapIntensity = 0.6; o.material.needsUpdate = true; } });
const tilt = new THREE.Group();
tilt.rotation.z = (-14 * Math.PI) / 180;
tilt.add(pivot);
pivot.add(globe);
scene.add(tilt);

await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// Two turns per loop, lingering while the cut faces you, and stepped at 10 frames a second
// like an animated GIF.
const TURN = DURATION / 2, GIF_FPS = 10, YAW0 = Number(q.get('yaw') ?? -55);
const yawAt = (t) => { const u = t / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.8 * Math.sin(TAU * u); };

// The bar: stuck at 70. Every four seconds it tries to creep past and gives up.
const fillAt = (t) => {
  const p = (t % 4) / 4;
  return 70 + (p > 0.55 && p < 0.78 ? 1.4 * (p - 0.55) / 0.23 : 0);
};

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  const tg = Math.floor(t * GIF_FPS) / GIF_FPS;
  pivot.rotation.y = yawAt(tg);
  tilt.updateMatrixWorld(true);
  renderer.render(scene, camera);

  // the offer blinks like a GIF: every four seconds, six quick frames of white
  const bp = t % 4, on = bp >= 2 && bp < 2.75 && Math.floor((bp - 2) * 8) % 2 === 0;
  for (const el of BLINK) el.style.color = on ? '#fff' : '';

  fill.style.width = fillAt(t).toFixed(3) + '%';
  // stripes march a whole number of periods per loop
  stripes.style.transform = `translateX(${px((u * 18 * STRIPE) % STRIPE)})`;

  if (dots) {
    const n = Math.floor(t * 2) % 4; // 0..3 dots, twice a second
    [...dots.children].forEach((d, i) => { d.style.visibility = i < n ? 'visible' : 'hidden'; });
  }
  if (arr) {
    // the arrow steps toward the rest of the page, GIF-style: 3 frames, then rest
    const k = Math.floor(t * 4) % 6, step = k < 3 ? k : 0;
    const d = step * arrSize * 0.1;
    arr.style.transform = format === 'banner-h' ? `translateY(${px(d)})` : `translateX(${px(-d)})`;
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
