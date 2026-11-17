// THE SKYSCRAPER. The tall 160x600 web ad of 1999 is exactly the shape of the extension's banner,
// so the banner is drawn as one: a 1px border, the message stacked in Arial Black, the spinning
// globe, a CLICK HERE! button, and the little label above it. Only the label has changed: it is a
// dimension line now, because the ad knows how wide it has become (30% of this page).
// The square advert stands the same skyscraper in the right-hand 30% of the square.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Rects are [x, y, w, h] in px. lines: [text, class, width to fit, max size].
const MSG = [['30% off', 'y'], ['Everything', ''], ['on the internet.', '']];
const FORMATS = {
  'banner-v': {
    w: 1080, h: 2025, line: 4, layout: 'tower',
    dim: { r: [0, 26, 1080, 68], size: 40, track: 0.06, arrow: 28, text: 'Advertisement · 30% of this page' },
    frame: { r: [40, 112, 1000, 1810], pad: [64, 50, 64, 50] },
    msg: { w: 892, gap: 14 }, msg2: { lines: ['Black Friday only!'], w: 892, gapAbove: 22 },
    cta: { w: 700, h: 160, size: 80, gapAbove: 20 },
    globe: { k: 0.9 }, cell: 6, pix: 4,
    mark: [470, 1946, 140],
  },
  'banner-h': {
    w: 1170, h: 834, line: 3, layout: 'row',
    ad: { x: 24, y: 18, size: 36, text: 'Advertisement' },
    dim: { r: [1050, 0, 112, 834], size: 48, arrow: 28, text: '30%', vert: true },
    frame: { r: [24, 70, 1012, 750], pad: [36, 40, 36, 10] },
    left: 320,
    msg: { w: 640, gap: 10 }, msg2: { lines: ['Black Friday only!'], w: 640, gapAbove: 14 },
    cta: { w: 400, h: 100, size: 50, gapAbove: 34 },
    globe: { k: 0.94 }, cell: 5, pix: 3,
    mark: [924, 8, 104],
  },
  '1x1': {
    w: 1080, h: 1080, line: 3, layout: 'square',
    side: [60, 104, 652, 872],
    dim: { r: [756, 36, 324, 50], size: 30, arrow: 20, text: '30%' },
    frame: { r: [768, 104, 300, 872], pad: [26, 16, 30, 16] },
    msg: { w: 652, gap: 16, lines: [['30% off', 'y'], ['Everything', ''], ['on the', ''], ['internet.', '']], sizeAs: { 2: 1, 3: 1 } }, msg2: { lines: ['Black Friday only!'], w: 652, gapAbove: 34 },
    cta: { w: 236, h: 84, size: 30, gapAbove: 56 }, holeH: 330,
    globe: { k: 0.98, kw: 0.98 }, cell: 5, pix: 2,
    mark: [60, 1000, 104],
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
const place = (el, [x, y, w, h]) => Object.assign(el.style, { left: px(x), top: px(y), width: px(w), height: px(h) });

await Promise.all(['400 100px "Archivo Black"', '700 100px "Arimo"'].map((f) => document.fonts.load(f)));
await new Promise((res) => { const i = new Image(); i.onload = i.onerror = res; i.src = '/assets/gme/gme-primary.png'; });

stage.style.setProperty('--line', F.line + 'px');

// ---------- the label: a dimension line ----------
{
  const D = F.dim, el = $('dim');
  place(el, D.r);
  el.style.setProperty('--dimH', D.r[3] + 'px');
  el.style.setProperty('--dimSize', D.size + 'px');
  el.style.setProperty('--arrow', D.arrow + 'px');
  if (D.track != null) el.style.setProperty('--dimTrack', D.track + 'em');
  el.style.setProperty('--dimGap', Math.round(D.size * 0.45) + 'px');
  $('dim-txt').textContent = D.text;
  if (D.vert) { el.classList.add('vert'); el.style.width = px(D.r[2]); el.style.setProperty('--dimH', D.r[2] + 'px'); }
}
if (F.ad) {
  const a = document.createElement('div');
  a.className = 'adlabel'; a.textContent = F.ad.text;
  Object.assign(a.style, { left: px(F.ad.x), top: px(F.ad.y) });
  a.style.setProperty('--adSize', F.ad.size + 'px');
  stage.append(a);
}

// ---------- the frame and what sits in it ----------
const frame = $('frame'), msg = $('msg'), msg2 = $('msg2'), hole = $('hole'), cta = $('cta');
place(frame, F.frame.r);
frame.style.padding = F.frame.pad.map((v) => v + 'px').join(' ');

const lineEl = (text, cls) => { const s = document.createElement('span'); s.className = 'ln ' + cls; s.textContent = text; return s; };
function fitLine(el, w, max = Infinity) {
  el.style.fontSize = '100px';
  const size = Math.min(max, (100 * w) / el.getBoundingClientRect().width);
  el.style.fontSize = size.toFixed(2) + 'px';
  return size;
}
for (const [t, c] of (F.msg.lines || MSG)) msg.append(lineEl(t, c));
for (const t of F.msg2.lines) msg2.append(lineEl(t, 'b'));

if (F.layout === 'row') {
  // globe on the left, words on the right
  frame.style.flexDirection = 'row';
  const col = document.createElement('div');
  col.className = 'col';
  Object.assign(col.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: '1 1 auto', position: 'relative' });
  hole.style.flex = `0 0 ${F.left}px`;
  frame.append(col);
  col.append(msg, msg2, cta);
} else if (F.layout === 'tower') {
  // the whole message reads first, as one block; then the globe; then the button
  frame.insertBefore(msg2, hole);
} else if (F.layout === 'square') {
  // the words stand on the page; the skyscraper holds the globe and the button
  const side = document.createElement('div');
  side.className = 'side';
  place(side, F.side);
  stage.insertBefore(side, $('gl'));
  side.append(msg, msg2);
  // the globe and the button sit together in the middle of the tall ad, level with the words
  frame.style.justifyContent = 'center';
  hole.style.flex = `0 0 ${F.holeH}px`;
}

const sizes = [...msg.children].map((el) => fitLine(el, F.msg.w));
// some lines are set at another line's size rather than fitted
for (const [i, j] of Object.entries(F.msg.sizeAs || {})) msg.children[i].style.fontSize = sizes[j].toFixed(2) + 'px';
{
  const ks = [...msg2.children].map((el) => fitLine(el, F.msg2.w));
  if (F.msg2.same) for (const el of msg2.children) el.style.fontSize = Math.min(...ks).toFixed(2) + 'px';
}
for (const el of msg.children) el.style.marginBottom = F.msg.gap + 'px';
msg.lastChild.style.marginBottom = '0px';
msg2.style.marginTop = (F.msg2.gapAbove ?? F.msg.gap) + 'px';
void sizes;

Object.assign(cta.style, { width: px(F.cta.w), height: px(F.cta.h), marginTop: px(F.cta.gapAbove) });
cta.style.setProperty('--ctaSize', F.cta.size + 'px');
cta.style.setProperty('--bev', Math.max(3, Math.round(F.cta.h * 0.07)) + 'px');

// ---------- GME ----------
{
  const [x, y, w] = F.mark;
  place($('mark'), [x, y, w, w / 1.872]);
}

// ---------- the globe goes where the hole is ----------
const st = stage.getBoundingClientRect();
const hr = hole.getBoundingClientRect();
const H = { x: hr.left - st.left + hr.width / 2, y: hr.top - st.top + hr.height / 2, d: Math.min(hr.width * (F.globe.kw ?? F.globe.k), hr.height * F.globe.k) };

// The glow behind the globe is a GIF gradient: three web blues, ordered-dithered on a coarse grid.
{
  const cell = Number(q.get('cell') ?? F.cell ?? 0);
  const glow = $('glow');
  if (cell > 0) {
    const cv = document.createElement('canvas');
    const cw = Math.ceil(F.w / cell), ch = Math.ceil(F.h / cell);
    cv.width = cw; cv.height = ch;
    Object.assign(cv.style, { width: px(cw * cell), height: px(ch * cell), imageRendering: 'pixelated', display: 'block' });
    const g = cv.getContext('2d'), img = g.createImageData(cw, ch);
    const LV = [[10, 60, 255], [40, 92, 255], [86, 130, 255]];
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const R = H.d * 0.82;
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const dx = (i + 0.5) * cell - H.x, dy = (j + 0.5) * cell - H.y;
      const r = Math.hypot(dx, dy) / R;
      const v = Math.max(0, 1 - r) ** 1.3 * (LV.length - 1);
      const base = Math.floor(v), th = (BAYER[(j % 4) * 4 + (i % 4)] + 0.5) / 16;
      const c = LV[Math.min(LV.length - 1, base + ((v - base) > th ? 1 : 0))];
      const o = (j * cw + i) * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    glow.append(cv);
    // the glow belongs to the ad: it stops at the ad's border
    const [fx, fy, fw, fh] = F.frame.r, l = F.line;
    glow.style.clipPath = `inset(${fy + l}px ${F.w - fx - fw + l}px ${F.h - fy - fh + l}px ${fx + l}px)`;
  } else {
    glow.style.background = `radial-gradient(${px(H.d * 1.05)} ${px(H.d * 1.05)} at ${px(H.x)} ${px(H.y)}, rgba(120,170,255,0.55) 0%, rgba(70,120,255,0.22) 45%, rgba(10,60,255,0) 100%)`;
  }
}

const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 22;
// ?pix=N draws the globe with N-px pixels, like the GIF it would have been
const PIX = Number(q.get('pix') ?? F.pix ?? 0);
if (PIX > 1) canvas.classList.add('pix');
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: PIX > 1 ? 1 / PIX : Number(q.get('pr') || 1), fov: FOV });
key.intensity = 2.6;
const pxPerUnit = H.d / 2.06;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (14 * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - H.x, F.h / 2 - H.y, F.w, F.h);
const pivot = new THREE.Group();
scene.add(pivot);
const globe = castShadows(await buildObject('globe-core'));
globe.userData.slice.visible = false;
globe.traverse((o) => { if (o.isMesh && o.material && o.material.map) { o.material.envMapIntensity = 0.6; o.material.roughness = 0.35; o.material.needsUpdate = true; } });
pivot.add(globe);

// The classic spinning globe: two turns a loop, easing as the cut comes round to face you.
const TURN = 6, YAW0 = 22;
const yawAt = (t) => { const u = t / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.75 * Math.sin(TAU * u); };

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  pivot.rotation.y = yawAt(t);
  pivot.updateMatrixWorld(true);
  renderer.render(scene, camera);

  // the button is clicked once a second, the way the GIF did it
  const beat = (t * 1) % 1;
  cta.classList.toggle('down', beat > 0.72 && beat < 0.86);
  // <blink>, politely: BLACK FRIDAY ONLY! swaps white and yellow every half second
  msg2.classList.toggle('lit', Math.floor(t * 2) % 2 === 1);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
