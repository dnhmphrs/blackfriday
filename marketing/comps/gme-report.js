// Gary Mustard Enterprises, Annual Report FY2026: the internet's 30% reduction, reported.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials, castShadows } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  '9x16': { w: 1080, h: 1920, globe: { d: 0.64, dx: -0.02, dy: 0.04 } },
  '1x1': { w: 1080, h: 1080, globe: { d: 0.56, dx: -0.03, dy: 0.12 }, text: { '.deck': 'Every website.<br>Black Friday only.' } },
  // the extension's own banner: down the right-hand 30% of every page, read at about 400px wide
  'banner-v': { w: 1080, h: 2025, globe: { d: 0.6, dx: -0.02, dy: 0.1 },
    text: { '.k-t': 'Notice to Visitors', '.h-rest': 'off the entire internet.<sup>1</sup>' } },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
for (const id of (q.get('hide') || '').split(',').filter(Boolean)) document.getElementById(id).style.display = 'none'; // for checking layers
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

// A seeded random, so every render is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

for (const [sel, html] of Object.entries(F.text || {})) document.querySelector(sel).innerHTML = html;

// ---------- fonts and images first: the layout is measured from the DOM ----------
const FACES = ['400 100px "EB Garamond"', 'italic 400 100px "EB Garamond"', '500 100px "EB Garamond"', '400 30px "Libre Franklin"', '500 30px "Libre Franklin"', '600 30px "Libre Franklin"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));
await document.fonts.ready;
const loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
await Promise.all(['gme-primary', 'gme-letters'].map((n) => loadImage(`/assets/gme/${n}.png`)));

// ---------- paper: warm uncoated stock, mottled, with fibres and the odd speck ----------
function drawPaper(canvas, w, h, seed) {
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d');
  const rnd = mulberry(seed);
  g.fillStyle = '#efe8d5';
  g.fillRect(0, 0, w, h);
  // slow mottling: big soft blots a shade warmer or cooler
  for (let i = 0; i < 26; i++) {
    const x = rnd() * w, y = rnd() * h, r = 180 + rnd() * 520;
    const warm = rnd() < 0.55;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const c = warm ? '196,176,138' : '255,255,250';
    gr.addColorStop(0, `rgba(${c},${warm ? 0.10 : 0.16})`);
    gr.addColorStop(1, `rgba(${c},0)`); // fade to the same colour, or the blot greys the sheet
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // edge darkening, as if the sheet has been handled
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.62);
  v.addColorStop(0, 'rgba(140,110,60,0)'); v.addColorStop(1, 'rgba(140,110,60,0.10)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  // fibres
  for (let i = 0; i < w * h / 900; i++) {
    const x = rnd() * w, y = rnd() * h, a = rnd() * Math.PI, l = 4 + rnd() * 16;
    g.strokeStyle = rnd() < 0.5 ? 'rgba(120,100,70,0.10)' : 'rgba(255,255,255,0.22)';
    g.lineWidth = 0.6 + rnd() * 0.6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rnd() * 3, y + Math.sin(a) * l * 0.5 + rnd() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  // tooth: per-pixel noise
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() + rnd() - 1) * 14;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
  }
  g.putImageData(img, 0, 0);
}

// ---------- the photograph's backdrop: the GME sheet's navy-to-blue-to-grey, heavily grained ----------
function drawSky(canvas, w, h, seed) {
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d');
  const rnd = mulberry(seed);
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#05070f');
  gr.addColorStop(0.28, '#0b1a4a');
  gr.addColorStop(0.62, '#1846a6');
  gr.addColorStop(0.86, '#6a84b8');
  gr.addColorStop(1, '#a7adb8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // a lit patch behind the subject
  const glow = g.createRadialGradient(w * 0.56, h * 0.58, 0, w * 0.56, h * 0.58, w * 0.5);
  glow.addColorStop(0, 'rgba(70,130,235,0.30)'); glow.addColorStop(1, 'rgba(70,130,235,0)');
  g.fillStyle = glow; g.fillRect(0, 0, w, h);
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() + rnd() + rnd() - 1.5) * 34;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  // dust and the odd hair
  for (let i = 0; i < w * h / 2600; i++) {
    const x = rnd() * w, y = rnd() * h, r = 0.5 + rnd() * rnd() * 2.6;
    g.fillStyle = rnd() < 0.8 ? `rgba(220,226,240,${0.25 + rnd() * 0.5})` : 'rgba(0,0,0,0.5)';
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  for (let i = 0; i < 5; i++) {
    const x = rnd() * w, y = rnd() * h;
    g.strokeStyle = 'rgba(225,230,245,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + rnd() * 40 - 20, y + rnd() * 40, x + rnd() * 60 - 30, y + rnd() * 60, x + rnd() * 80 - 40, y + rnd() * 70); g.stroke();
  }
}

// ---------- print grain over everything: ink is never perfectly flat ----------
function drawGrain(canvas, w, h, seed) {
  canvas.width = w; canvas.height = h;
  const g = canvas.getContext('2d');
  const rnd = mulberry(seed);
  const img = g.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 255 - Math.abs(rnd() + rnd() - 1) * 22;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < w * h / 9000; i++) {
    const x = rnd() * w, y = rnd() * h, r = 0.4 + rnd() * rnd() * 2.2;
    g.fillStyle = `rgba(60,50,40,${0.25 + rnd() * 0.45})`;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
}

drawPaper(document.getElementById('paper'), F.w, F.h, 2026);
drawGrain(document.getElementById('grain'), F.w, F.h, 30);

const plateEl = document.querySelector('.plate');
const stageBox = stage.getBoundingClientRect();
const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - stageBox.left, y: r.top - stageBox.top, w: r.width, h: r.height }; };
const P = rectOf(plateEl);
drawSky(plateEl.querySelector('.sky'), Math.round(P.w), Math.round(P.h), 1126);

// The photograph is printed, so its grain sits over the model too, not just behind it.
function drawPlateGrain(canvas, r, seed) {
  const w = Math.round(r.w), h = Math.round(r.h);
  canvas.width = w; canvas.height = h;
  Object.assign(canvas.style, { left: r.x + 'px', top: r.y + 'px', width: w + 'px', height: h + 'px' });
  const g = canvas.getContext('2d');
  const rnd = mulberry(seed);
  const img = g.createImageData(w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 70;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
drawPlateGrain(document.getElementById('pgrain'), P, 77);

// ---------- 3D: the cut globe, photographed for the report ----------
const canvas = document.getElementById('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });

const G = { d: Number(q.get('gd') || F.globe.d), dx: Number(q.get('gdx') ?? F.globe.dx), dy: Number(q.get('gdy') ?? F.globe.dy) };
if (!q.has('gdx')) G.dx = F.globe.dx; if (!q.has('gdy')) G.dy = F.globe.dy;
const D = Math.min(P.w, P.h) * G.d;
const hero = { x: P.x + P.w * (0.5 + G.dx), y: P.y + P.h * (0.5 + G.dy), d: D };
const pxPerUnit = hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (Number(q.get('elev') || 28) * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - hero.x, F.h / 2 - hero.y, F.w, F.h);

// The cut faces, printed like the report: paper stock, navy Garamond.
const cutMap = canvasTexture(1024, (g, n) => {
  const half = (x0, fill) => { g.fillStyle = fill; g.fillRect(x0, 0, n / 2, n); };
  half(0, '#ece6d6'); half(n / 2, '#e2dccb');
  g.save();
  g.beginPath(); g.rect(0, 0, n, n); g.arc(n / 2, n / 2, n * 0.45, 0, TAU, true); g.closePath();
  g.fillStyle = '#0b1f8a'; g.fill('evenodd');
  g.restore();
  g.lineWidth = 6; g.strokeStyle = '#14204e';
  g.beginPath(); g.arc(n / 2, n / 2, n * 0.45 - 10, 0, TAU); g.stroke();
  const crease = g.createLinearGradient(n * 0.4, 0, n * 0.6, 0);
  crease.addColorStop(0, 'rgba(20,32,78,0)'); crease.addColorStop(0.5, 'rgba(20,32,78,0.25)'); crease.addColorStop(1, 'rgba(20,32,78,0)');
  g.fillStyle = crease; g.fillRect(n * 0.4, 0, n * 0.2, n);
  // both faces carry the full figure, so whichever one the camera sees reads on its own
  g.fillStyle = '#14204e'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  for (const x of [0.27, 0.73]) {
    g.font = '400 150px "EB Garamond"';
    g.fillText('30%', n * x, n * 0.47);
    g.font = 'italic 400 150px "EB Garamond"';
    g.fillText('off', n * x, n * 0.6);
    g.font = '500 24px "Libre Franklin"';
    g.fillText('F Y 2 0 2 6', n * x, n * 0.68);
  }
});
const cut = new THREE.MeshPhysicalMaterial({ map: cutMap, metalness: 0, roughness: 0.8, envMapIntensity: 0.35, side: THREE.DoubleSide });
const globe = makeGlobe({ core: materials.tinted(0.03, 0.12, 1.0, 0.14), cut, tubeRadius: 0.03, sliceOut: 0.62, sliceLift: 0.08 });
const pivot = new THREE.Group();
pivot.add(castShadows(globe));
scene.add(pivot);
const { slice } = globe.userData;
slice.visible = q.get('wedge') !== '0'; // the removed 30%, set apart: an exploded pie chart

// ---------- leader lines from the photograph to its figures ----------
const svg = document.getElementById('leaders');
svg.setAttribute('width', F.w); svg.setAttribute('height', F.h);
const tagA = document.querySelector('.tag.a'), tagB = document.querySelector('.tag.b');
const lines = { a: svg.querySelector('.ld.a'), b: svg.querySelector('.ld.b') };
const dots = { a: svg.querySelector('.dot.a'), b: svg.querySelector('.dot.b') };
const screenOf = (v) => { v.project(camera); return { x: (v.x + 1) / 2 * F.w, y: (1 - v.y) / 2 * F.h }; };
const anchor = (el, side) => { const r = rectOf(el); return { x: side === 'left' ? r.x - 14 : r.x + r.w + 14, y: r.y + r.h * 0.42 }; };

// Glints: a four-point star flares on the chrome now and then (one is up for the hero frame).
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintLayer = document.getElementById('glints');
const GLINTS = [[0.05, 0.75, 62, 340], [3.4, 0.6, 30, 250], [6.2, 0.7, -38, 200], [9.3, 0.6, 8, 318]].map(([t0, life, lat, lon]) => {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', STAR); p.setAttribute('class', 'glint');
  glintLayer.append(p);
  return { p, t0, life, lat, lon, size: hero.d * 0.15 };
});

const yaw0 = (Number(q.get('yaw') || 60) * Math.PI) / 180;
const SLICE = Number(q.get('slice') || 1.45), LIFT = Number(q.get('lift') || 0.2);
function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  // a slow, deliberate sway: always showing the reduction to the camera
  pivot.rotation.y = yaw0 + 0.16 * Math.sin(TAU * u);
  pivot.rotation.x = 0.04 * Math.sin(TAU * u * 2 + 0.6);
  pivot.position.y = 0.03 * Math.sin(TAU * u * 2);
  globe.userData.setSlice(SLICE + 0.08 * Math.sin(TAU * u * 2 - 1.2), LIFT);
  scene.updateMatrixWorld(true);

  // "Removed": the middle of the free wedge. "Retained": a point on the body's near flank.
  const pa = screenOf(slice.visible ? slice.localToWorld(onSphere(1.0, 26, 28)) : globe.localToWorld(onSphere(0.96, 26, 92)));
  const pb = screenOf(globe.localToWorld(onSphere(1.0, -28, 300)));
  for (const [k, p, el, side] of [['a', pa, tagA, 'left'], ['b', pb, tagB, 'right']]) {
    const a = anchor(el, side);
    lines[k].setAttribute('x1', a.x.toFixed(1)); lines[k].setAttribute('y1', a.y.toFixed(1));
    lines[k].setAttribute('x2', p.x.toFixed(1)); lines[k].setAttribute('y2', p.y.toFixed(1));
    dots[k].setAttribute('cx', p.x.toFixed(1)); dots[k].setAttribute('cy', p.y.toFixed(1));
  }
  for (const s of GLINTS) {
    let k = (t - s.t0) / s.life;
    if (k < 0) k += DURATION / s.life; // wraps across the loop point
    const on = k >= 0 && k <= 1;
    const a = on ? Math.sin(k * Math.PI) : 0;
    const c = screenOf(globe.localToWorld(onSphere(1.03, s.lat, s.lon)));
    s.p.setAttribute('transform', `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) rotate(${(k * 40).toFixed(1)}) scale(${(a * s.size / 2).toFixed(2)})`);
    s.p.style.opacity = on ? 1 : 0;
  }
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
