// RAW HTML, 1996. The offer set as a default web page on a bright blue body: an <h1> in Times
// bold italic, a shaded <hr>, the spinning globe as an inline image, one yellow underlined link
// and a <marquee>. On the extension's banner the link knows where it is: it points back to the
// rest of the page, the remaining 70%.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format. Blocks run down the page like flow: each starts `gap` below the last
// (or at `y`). Type is fitted so the widest line of a block is `w` wide.
//   h1: lines; hr; globe: d (diameter), x (centre); a: the link; marquee; logo
const FORMATS = {
  '1x1': {
    w: 1080, h: 1080, align: 'left', x: 60, cw: 960,
    blocks: [
      { k: 'h1', lines: ['30%', 'OFF'], w: 450, y: 36, x: 560 },
      { k: 'h1', lines: ['EVERYTHING ON', 'THE INTERNET.'], w: 960, gap: 16 },
      { k: 'hr', gap: 30 },
      { k: 'h1', lines: ['BLACK FRIDAY ONLY!'], w: 760, gap: 28 },
      { k: 'a', html: 'Click here for less internet', size: 44, gap: 34 },
    ],
    globe: { x: 290, y: 230, d: 400 },
    marquee: { y: 948, size: 38 },
    logo: { x: 540, y: 1040, w: 84 },
  },
  'banner-v': {
    w: 1080, h: 2025, align: 'center', x: 60, cw: 960,
    blocks: [
      { k: 'h1', lines: ['30% OFF'], w: 960, y: 84 },
      { k: 'h1', lines: ['EVERYTHING', 'ON THE', 'INTERNET.'], w: 960, gap: 10 },
      { k: 'hr', gap: 54 },
      { k: 'h1', lines: ['BLACK FRIDAY', 'ONLY!'], w: 780, gap: 44 },
      { k: 'globe', d: 540, gap: 44 },
      { k: 'a', html: '« The remaining 70% of this page', size: 64, gap: 56, align: 'left' },
    ],
    marquee: { y: 1842, size: 54 },
    logo: { x: 540, y: 1950, w: 156 },
  },
  'banner-h': {
    w: 1170, h: 834, align: 'left', x: 56, cw: 700,
    blocks: [
      { k: 'h1', lines: ['30% OFF'], w: 720, y: 46 },
      { k: 'h1', lines: ['EVERYTHING ON', 'THE INTERNET.'], w: 720, gap: 12 },
      { k: 'hr', gap: 34 },
      { k: 'h1', lines: ['BLACK FRIDAY ONLY!'], w: 640, gap: 30 },
      { k: 'a', html: '↓ The remaining 70% of this page', size: 54, gap: 44 },
    ],
    globe: { x: 958, y: 372, d: 350 },
    marquee: { y: 728, size: 48 },
    logo: { x: 1070, y: 44, w: 100 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '1x1';
const F = FORMATS[format];

const MARQUEE = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
const SEP = '   *   ';

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);
const px = (n) => n.toFixed(2) + 'px';

// ---------- fonts ----------
await Promise.all(['italic 700 100px "Tinos"', '400 40px "Cousine"'].map((f) => document.fonts.load(f)));

// ---------- the page ----------
const page = $('page');
let cursor = 0, hero = F.globe || null;
for (const b of F.blocks) {
  const top = b.y ?? cursor + (b.gap || 0);
  if (b.k === 'globe') {
    if (b.d) { hero = { x: F.x + F.cw / 2, y: top + b.d / 2, d: b.d }; cursor = top + b.d; }
    continue;
  }
  const el = document.createElement('div');
  el.className = 'blk ' + b.k;
  page.append(el);
  if (b.k === 'hr') {
    el.style.width = px(F.cw);
    el.style.setProperty('--hrW', Math.round(F.w / 360) + 'px');
  } else if (b.k === 'h1') {
    el.innerHTML = b.lines.map((l) => `<span class="ln">${l}</span>`).join('');
    el.style.fontSize = '100px';
    el.style.width = 'max-content';
    const w0 = Math.max(...[...el.children].map((c) => c.getBoundingClientRect().width));
    el.style.fontSize = px((100 * b.w) / w0);
  } else if (b.k === 'a') {
    el.innerHTML = b.html;
    el.style.fontSize = px(b.size);
  }
  const align = b.align || F.align;
  el.style.textAlign = align;
  const r = el.getBoundingClientRect();
  el.style.top = px(top);
  if (align === 'center') { el.style.width = px(F.cw); el.style.left = px(F.x); }
  else el.style.left = px((b.x ?? F.x) - (b.k === 'h1' ? 0.04 * parseFloat(el.style.fontSize) : 0));
  cursor = top + r.height;
}

// ---------- the marquee: whole sequences per loop, so it joins up ----------
const M = F.marquee, mq = $('marquee'), run = $('run');
mq.style.top = px(M.y); mq.style.height = px(M.size * 1.2);
run.style.fontSize = px(M.size);
const seq = MARQUEE.join(SEP) + SEP;
run.textContent = seq;
const SEQ_W = run.getBoundingClientRect().width;
run.textContent = seq.repeat(Math.ceil(F.w / SEQ_W) + 3);
const LAPS = Math.max(1, Math.round((M.size * 2.2 * DURATION) / SEQ_W));

// ---------- logo ----------
{
  const L = $('logo'), w = F.logo.w, h = w * 610 / 1142;
  Object.assign(L.style, { left: px(F.logo.x - w / 2), top: px(F.logo.y - h / 2), width: px(w), height: px(h) });
}

// ---------- background ----------
$('bg').style.background = '#1040ff';

// ---------- 3D: the spinning globe ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 20;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
key.intensity = 2.0;
const pxPerUnit = hero.d / 2 / 1.06;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (Number(q.get('elev') ?? 20) * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - hero.x, F.h / 2 - hero.y, F.w, F.h);
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
globe.traverse((o) => { if (o.isMesh && o.material && o.material.map) { o.material.envMapIntensity = 0.6; o.material.needsUpdate = true; } });
const tilt = new THREE.Group();
tilt.rotation.z = (-12 * Math.PI) / 180;
tilt.add(pivot);
pivot.add(globe);
scene.add(tilt);

await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// two turns per loop, lingering while the cut faces you, like a looping GIF
const TURN = DURATION / 2, YAW0 = Number(q.get('yaw') ?? -28);
const yawAt = (t) => { const u = t / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.75 * Math.sin(TAU * u); };

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  pivot.rotation.y = yawAt(t);
  tilt.updateMatrixWorld(true);
  renderer.render(scene, camera);

  // phased so the hero frame (12) opens on the first line in full
  const off = ((((u - 12 / (DURATION * FPS)) * LAPS * SEQ_W) % SEQ_W) + SEQ_W) % SEQ_W;
  run.style.transform = `translate3d(${(F.x - SEQ_W - off).toFixed(2)}px,0,0)`;
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
