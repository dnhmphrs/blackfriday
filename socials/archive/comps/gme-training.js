// Black Friday: A Business Opportunity. A Gary Mustard Enterprises training video, as a still.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, materials, canvasTexture, castShadows } from '../lib/stage.js';
import { makeGlobe } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
// hero: where the globe's centre lands on screen (px) and its diameter (px)
const FORMATS = {
  '9x16': { w: 1080, h: 1920, hero: { x: 540, y: 1000, d: 410 }, spotY: 1000 },
  '1x1': { w: 1080, h: 1080, hero: { x: 270, y: 440, d: 300 }, spotY: 450 },
  'banner-v': { w: 1080, h: 2025, hero: { x: 540, y: 690, d: 500 }, spotY: 690 },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
stage.style.setProperty('--spot-y', F.spotY + 'px');

// ---------- fonts first: the cut faces are lettered in the wordmark serif ----------
const FACES = ['400 100px "EB Garamond"', 'italic 400 100px "EB Garamond"', '500 100px "EB Garamond"', '500 30px "Libre Franklin"', '400 30px "IBM Plex Mono"', '500 30px "IBM Plex Mono"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));
await document.fonts.ready;

// ---------- 3D ----------
const canvas = document.getElementById('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
renderer.toneMappingExposure = 0.92;

const pxPerUnit = F.hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (Number(q.get('elev') || 30) * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);

// The cut faces: cream card stock with the figures set in Garamond, a navy rim for the shell.
const cut = (() => {
  const map = canvasTexture(1024, (g, n) => {
    g.fillStyle = '#ebe5d6'; g.fillRect(0, 0, n / 2, n);
    g.fillStyle = '#dcd5c3'; g.fillRect(n / 2, 0, n / 2, n);
    g.save();
    g.beginPath(); g.rect(0, 0, n, n); g.arc(n / 2, n / 2, n * 0.45, 0, TAU, true); g.closePath();
    g.fillStyle = '#0c1d5e'; g.fill('evenodd');
    g.restore();
    g.lineWidth = 3; g.strokeStyle = '#0c1d5e';
    g.beginPath(); g.arc(n / 2, n / 2, n * 0.415, 0, TAU); g.stroke();
    const crease = g.createLinearGradient(n * 0.4, 0, n * 0.6, 0);
    crease.addColorStop(0, 'rgba(10,20,60,0)'); crease.addColorStop(0.5, 'rgba(10,20,60,0.28)'); crease.addColorStop(1, 'rgba(10,20,60,0)');
    g.fillStyle = crease; g.fillRect(n * 0.4, 0, n * 0.2, n);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#0c1d5e';
    g.font = '500 250px "EB Garamond"'; g.fillText('30%', n * 0.265, n * 0.58);
    g.font = 'italic 400 270px "EB Garamond"'; g.fillText('off', n * 0.725, n * 0.57);
    g.font = '500 24px "Libre Franklin"';
    g.fillText('B L A C K   F R I D A Y', n * 0.265, n * 0.67);
    g.fillText('E V E R Y   W E B S I T E', n * 0.725, n * 0.67);
  });
  return new THREE.MeshPhysicalMaterial({ map, metalness: 0, roughness: 0.7, envMapIntensity: 0.35, side: THREE.DoubleSide });
})();

const pivot = new THREE.Group();
scene.add(pivot);
const globe = makeGlobe({ core: materials.tinted(0.05, 0.13, 0.75, 0.12), cut, tubeRadius: 0.026, sliceOut: 0 });
pivot.add(castShadows(globe));

// Orbit rings, after the GME family's orbit mark: two hairline chrome rings, each with a bead.
const orbits = new THREE.Group();
scene.add(orbits);
const ringMat = new THREE.MeshStandardMaterial({ color: 0xf2efe6, metalness: 1, roughness: 0.12 });
const rings = [
  { r: 1.48, tilt: Number(q.get('tilt') || 0.62), roll: Number(q.get('roll') || 0.5), speed: 1, phase: 0.15 },
  { r: 1.48, tilt: Number(q.get('tilt') || 0.62), roll: -Number(q.get('roll') || 0.5), speed: -1, phase: 0.62 },
].map((o) => {
  const g = new THREE.Group();
  g.rotation.order = 'ZYX'; // tilt the ring first, then roll it in the picture plane, so the pair crosses like the orbit mark
  g.rotation.set(o.tilt, 0, o.roll);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(o.r, 0.0105, 12, 360), ringMat));
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), ringMat);
  g.add(bead);
  orbits.add(g);
  return { ...o, g, bead };
});

// ---------- 2D ----------
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Four-point star glints on the chrome, after the GME star mark.
const STAR = 'M0,-1 C0.05,-0.2 0.2,-0.05 1,0 C0.2,0.05 0.05,0.2 0,1 C-0.05,0.2 -0.2,0.05 -1,0 C-0.2,-0.05 -0.05,-0.2 0,-1Z';
const R = F.hero.d / 2;
const glints = [
  { x: -0.58, y: -0.74, size: 1.05, t0: 0.05, life: 1.1 },
  { x: -0.95, y: 0.28, size: 0.55, t0: 4.2, life: 0.9 },
  { x: 1.32, y: 0.12, size: 0.5, t0: 8.1, life: 0.9 },
].map((s) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-1 -1 2 2');
  svg.innerHTML = `<path d="${STAR}" fill="#fffdf6"/>`;
  document.getElementById('glints').append(svg);
  return { ...s, svg, px: F.hero.x + s.x * R, py: F.hero.y + s.y * R, sz: s.size * R * 0.62 };
});

const points = [...document.querySelectorAll('.points li')];
for (const li of points) { const b = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); b.setAttribute('viewBox', '-1 -1 2 2'); b.setAttribute('class', 'bullet'); b.innerHTML = `<path d="${STAR}" fill="currentColor"/>`; li.prepend(b); }
const tc = document.querySelector('.bitc .tc');
const lbl = document.querySelector('.bitc .lbl');
const band = document.querySelector('.band');
const cc = document.querySelector('.cc span');
const CAPTIONS = ['[SOFT CORPORATE MUSIC]', '[MUSIC CONTINUES, CONFIDENTLY]'];

// Grain: a few fixed fields of soft video noise, half resolution, chosen and shifted per frame.
const grain = document.getElementById('grain');
grain.width = Math.ceil(F.w / 2); grain.height = Math.ceil(F.h / 2);
const gctx = grain.getContext('2d');
const fields = Array.from({ length: 6 }, (_, k) => {
  const rnd = mulberry(1127 + k);
  const img = gctx.createImageData(grain.width, grain.height);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  // a little dust, like the brand sheet's print
  for (let j = 0; j < 14; j++) {
    const cx = Math.floor(rnd() * grain.width), cy = Math.floor(rnd() * grain.height), dark = rnd() < 0.7, s = 1 + Math.floor(rnd() * 2);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const o = ((cy + y) * grain.width + cx + x) * 4;
      if (o < img.data.length) { img.data[o] = img.data[o + 1] = img.data[o + 2] = dark ? 20 : 240; }
    }
  }
  return img;
});

const YAW0 = Number(q.get('yaw') || 0.15);
const pad = (n) => String(n).padStart(2, '0');
const yawAt = (t) => { const u = t / DURATION; return YAW0 + TAU * (u - (0.86 / TAU) * Math.sin(TAU * u)); };

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const frame = Math.round(t * FPS) % (DURATION * FPS);

  pivot.rotation.y = yawAt(t);
  pivot.position.y = Math.sin((t / DURATION) * TAU) * 0.025;
  for (const o of rings) {
    o.g.rotation.y = Math.sin((t / DURATION) * TAU + o.phase * TAU) * 0.06;
    const a = o.phase * TAU + o.speed * (t / DURATION) * TAU * 2;
    o.bead.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
  }
  renderer.render(scene, camera);

  for (const s of glints) {
    let p = (t - s.t0) / s.life;
    if (p < 0) p += DURATION / s.life;
    const k = p >= 0 && p <= 1 ? Math.sin(p * Math.PI) ** 1.4 : 0;
    s.svg.style.cssText = `left:${(s.px - s.sz / 2).toFixed(1)}px;top:${(s.py - s.sz / 2).toFixed(1)}px;width:${s.sz.toFixed(1)}px;height:${s.sz.toFixed(1)}px;opacity:${k.toFixed(3)};transform:scale(${(0.25 + 0.75 * k).toFixed(3)}) rotate(${(12 * p).toFixed(2)}deg);filter:drop-shadow(0 0 ${(6 + 10 * k).toFixed(1)}px rgba(220,230,255,0.9))`;
  }

  // the presenter's points: one at a time, four seconds each
  const cur = Math.floor(t / 4) % 3;
  points.forEach((li, i) => li.classList.toggle('on', i === cur));

  cc.textContent = CAPTIONS[t < 6 ? 0 : 1];

  // the last stretch of the loop is the tape being rewound, so the counter arrives back at 00 with the loop
  const REW = 11.2, rewinding = t >= REW;
  let shown = frame;
  if (rewinding) { const u = (t - REW) / (DURATION - REW), e = u * u * (3 - 2 * u); shown = Math.round(REW * FPS * (1 - e)); }
  const s = Math.floor(shown / FPS), f = shown % FPS;
  tc.textContent = `01:00:${pad(s)}:${pad(f)}`;
  lbl.textContent = rewinding ? 'GME VT\u20111127 \u00b7 REWINDING' : 'GME VT\u20111127 \u00b7 NOT FOR BROADCAST';

  // one soft band of tracking, rolling down twice per loop
  const by = ((t / DURATION) * 2 % 1) * (F.h + 360) - 180;
  band.style.transform = `translateY(${by.toFixed(1)}px)`;

  const img = fields[frame % fields.length];
  const ox = (frame * 37) % 23, oy = (frame * 53) % 19;
  gctx.putImageData(img, -ox, -oy);
  gctx.putImageData(img, grain.width - ox, -oy);
  gctx.putImageData(img, -ox, grain.height - oy);
  gctx.putImageData(img, grain.width - ox, grain.height - oy);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
