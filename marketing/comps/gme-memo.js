// FOR IMMEDIATE RELEASE: Gary Mustard Enterprises reduces the internet by 30%.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  '9x16': { w: 1080, h: 1920, globe: 0.6 },
  '1x1': { w: 1080, h: 1080, globe: 0 },
  'banner-v': { w: 1080, h: 2025, globe: 0 },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

// A seeded random, so every render is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- fonts first: the layout depends on them ----------
await document.fonts.ready;
await Promise.all([
  '400 40px "EB Garamond"', 'italic 400 40px "EB Garamond"', '500 40px "EB Garamond"', '600 40px "EB Garamond"',
  '400 20px "Libre Franklin"', '500 20px "Libre Franklin"', '600 20px "Libre Franklin"', '700 20px "Libre Franklin"',
  '400 20px "IBM Plex Mono"', '500 20px "IBM Plex Mono"', '700 40px "Archivo Narrow"', '500 40px "Archivo Narrow"',
].map((f) => document.fonts.load(f)));

// ---------- print texture: grain, dust and paper mottling, drawn once from a seed ----------
function noiseTile(size, seed, { alpha = 1, specks = 0 } = {}) {
  const r = mulberry(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (r() + r() + r() - 1.5) * 150;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.max(0, Math.min(255, v));
    img.data[i * 4 + 3] = 255 * alpha;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < specks; i++) { // dust and the odd hair
    g.fillStyle = `rgba(20,20,30,${0.25 + r() * 0.5})`;
    if (r() < 0.85) { g.beginPath(); g.arc(r() * size, r() * size, 0.6 + r() * 1.4, 0, TAU); g.fill(); }
    else { g.strokeStyle = g.fillStyle; g.lineWidth = 0.8; g.beginPath(); const x = r() * size, y = r() * size; g.moveTo(x, y); g.quadraticCurveTo(x + r() * 30 - 15, y + r() * 30 - 15, x + r() * 40 - 20, y + r() * 40 - 20); g.stroke(); }
  }
  return c.toDataURL();
}
const darkGrain = noiseTile(256, 7, { specks: 0 });
const paperGrain = noiseTile(384, 19, { specks: 22 });
for (const el of document.querySelectorAll('.grain.dark, .plate-grain')) el.style.backgroundImage = `url(${darkGrain})`;
for (const el of document.querySelectorAll('.grain.light')) el.style.backgroundImage = `url(${paperGrain})`;

// Paper: large soft clouds of darker and lighter fibre, like the GME family sheet.
{
  const sheet = document.querySelector('.sheet');
  const w = sheet.offsetWidth, h = sheet.offsetHeight, r = mulberry(5);
  const c = document.createElement('canvas');
  c.width = Math.round(w / 2); c.height = Math.round(h / 2);
  const g = c.getContext('2d');
  g.fillStyle = '#ebe8e0'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 60; i++) {
    const x = r() * c.width, y = r() * c.height, rad = 40 + r() * 220, dark = r() < 0.55;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, dark ? `rgba(120,112,96,${0.04 + r() * 0.05})` : `rgba(255,255,252,${0.06 + r() * 0.08})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad; g.fillRect(0, 0, c.width, c.height);
  }
  // a faint cool cast at the top, warm at the foot
  const lg = g.createLinearGradient(0, 0, 0, c.height);
  lg.addColorStop(0, 'rgba(210,218,232,0.18)'); lg.addColorStop(1, 'rgba(200,184,150,0.12)');
  g.fillStyle = lg; g.fillRect(0, 0, c.width, c.height);
  document.querySelector('.paper').style.backgroundImage = `url(${c.toDataURL()})`;
}

// ---------- Fig. 1: the cut chrome globe, photographed for the release ----------
let render = () => {}, pivot = null;
const plate = document.querySelector('.plate');
if (F.globe && plate && plate.offsetWidth) {
  const pw = plate.offsetWidth, ph = plate.offsetHeight;
  const canvas = document.getElementById('gl');
  canvas.style.width = pw + 'px';
  canvas.style.height = ph + 'px';
  const FOV = 22;
  const three = createStage({ canvas, width: pw, height: ph, pixelRatio: 2, fov: FOV });
  const d = pw * F.globe, pxPerUnit = d / 2;
  const dist = ph / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
  const elev = (16 * Math.PI) / 180;
  three.camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
  three.camera.lookAt(0, 0, 0);
  three.camera.setViewOffset(pw, ph, pw / 2 - pw * 0.44, ph / 2 - ph * 0.5, pw, ph);
  pivot = new THREE.Group();
  three.scene.add(pivot);
  const globe = await buildObject('globe');
  globe.userData.setSlice(0.62);
  pivot.add(castShadows(globe));
  render = () => three.renderer.render(three.scene, three.camera);
}

// ---------- timeline ----------
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const sheet = document.querySelector('.sheet');
const stampEl = document.querySelector('.stamp');
// The signature is two strokes (name, then underline), written one after the other.
const sigSvg = document.querySelector('.sig');
const sigStrokes = [...sigSvg.querySelectorAll('path')].map((el) => { const len = el.getTotalLength() + 2; el.setAttribute('stroke-dasharray', `${len} ${len}`); return { el, len }; });
const SIG_TOTAL = sigStrokes.reduce((a, s) => a + s.len, 0);
const baseTilt = format === 'banner-v' ? 0 : -0.7;
const stampTilt = format === 'banner-v' ? -4 : -8;

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;

  // The globe sways about its side-on angle, so the missing 30% always shows as a clean gap.
  if (pivot) { const u = t / DURATION; pivot.rotation.y = 1.5 + 0.42 * Math.sin(TAU * u); pivot.rotation.x = 0.06 * Math.sin(TAU * 2 * u); render(); }

  // The page settles at the start of the loop, is signed and stamped again before it ends.
  //   9.6-10.0 signature and stamp lift away; 10.1-11.3 signed; 11.45-11.62 stamped (thud)
  const sigOut = ease((t - 9.6) / 0.35);
  const sigIn = clamp01((t - 10.1) / 1.2);
  const sigDraw = t < 9.6 ? 1 : t < 10.1 ? 1 : sigIn;
  let ink = SIG_TOTAL * (t < 10.1 ? 1 : sigDraw);
  for (const s of sigStrokes) { const shown = Math.max(0, Math.min(s.len, ink)); ink -= shown; s.el.setAttribute('stroke-dashoffset', (s.len - shown).toFixed(2)); }
  sigSvg.style.opacity = (t >= 9.6 && t < 10.1 ? 1 - sigOut : 1).toFixed(3);

  let sOpacity = 1, sScale = 1, nudge = 0;
  if (t >= 9.6 && t < 11.45) { sOpacity = 1 - ease((t - 9.6) / 0.3); sScale = 1 + 0.03 * ease((t - 9.6) / 0.3); }
  if (t >= 11.3 && t < 11.45) { sOpacity = ease((t - 11.3) / 0.15) * 0.25; sScale = 1.3 - 0.2 * ease((t - 11.3) / 0.15); }
  if (t >= 11.45 && t < 11.62) { const p = (t - 11.45) / 0.17; sOpacity = 0.25 + 0.75 * p; sScale = 1.1 - 0.1 * p * p; }
  if (t >= 11.62 && t < 12) { const p = (t - 11.62) / 0.38; nudge = Math.sin(p * Math.PI * 3) * (1 - p) * 0.35; }
  stampEl.style.opacity = sOpacity.toFixed(3);
  stampEl.style.transform = `rotate(${stampTilt}deg) scale(${sScale.toFixed(4)})`;

  // the page breathes a little, and jumps when the stamp comes down
  const sway = Math.sin((t / DURATION) * TAU) * 0.12;
  sheet.style.transform = baseTilt ? `rotate(${(baseTilt + sway + nudge).toFixed(3)}deg)` : 'none';
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
