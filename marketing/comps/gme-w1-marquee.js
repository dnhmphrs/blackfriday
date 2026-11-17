// The animated GIF banner, 1997. A low-resolution canvas on a handful of web-safe colours, blown
// up with hard pixels: chunky 8-bit type, hard two-frame blinks, one pixel starburst, one pixel
// CLICK HERE, and the cut globe as a classic spinning-globe GIF (rendered in 3D, then posterised
// with ordered dithering and stepped at 10 frames a second). On the extension's banner the
// starburst knows where it is: it points at the reader's page, the 70% that is left.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2, GIF_FPS = 10;

// The web-safe colours the banner is allowed.
const C = { blue: '#0033ff', navy: '#000066', black: '#000000', white: '#ffffff', yellow: '#ffff00', red: '#ff0000', sky: '#3366ff' };
const PS = '"Press Start 2P"', SK = '"Silkscreen"';

// Layout in GIF pixels. P is the size of one GIF pixel on the stage.
// text: x is a centre (align c) or a left edge (align l); y is the top of the ink.
const FORMATS = {
  '1x1': {
    w: 1080, h: 1080, P: 4,
    items: [
      { t: 'text', s: '30% OFF', f: `32px ${PS}`, x: 135, y: 16, fill: 'yellow', ext: 3 },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 135, y: 62, fill: 'white', ext: 2 },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 135, y: 82, fill: 'white', ext: 2 },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 135, y: 108, fill: 'yellow', blink: 'white', ext: 2 },
      { t: 'globe', x: 92, y: 188, d: 112 },
      { t: 'burst', x: 208, y: 166, r: 36, lines: ['NEW!'], f: `16px ${PS}` },
      { t: 'button', x: 208, y: 224, s: 'CLICK HERE' },
      { t: 'logo', x: 135, y: 257, w: 36 },
    ],
  },
  'banner-v': {
    w: 1080, h: 2025, P: 6,
    items: [
      { t: 'text', s: '30%', f: `48px ${PS}`, x: 90, y: 10, fill: 'yellow', ext: 3 },
      { t: 'text', s: 'OFF', f: `48px ${PS}`, x: 90, y: 62, fill: 'yellow', ext: 3 },
      { t: 'text', s: 'EVERYTHING', f: `16px ${PS}`, x: 90, y: 120, fill: 'white', ext: 2 },
      { t: 'text', s: 'ON THE', f: `16px ${PS}`, x: 90, y: 139, fill: 'white', ext: 2 },
      { t: 'text', s: 'INTERNET.', f: `16px ${PS}`, x: 90, y: 158, fill: 'white', ext: 2 },
      { t: 'text', s: 'BLACK FRIDAY', f: `700 16px ${SK}`, x: 90, y: 182, fill: 'yellow', blink: 'white', ext: 2 },
      { t: 'text', s: 'ONLY!', f: `700 16px ${SK}`, x: 90, y: 199, fill: 'yellow', blink: 'white', ext: 2 },
      { t: 'globe', x: 124, y: 266, d: 88 },
      { t: 'burst', x: 40, y: 258, r: 39, lines: ['INCLUDING', 'THIS PAGE!'], f: `8px ${SK}`, arrow: 'left' },
      { t: 'button', x: 72, y: 322, s: 'CLICK HERE' },
      { t: 'logo', x: 156, y: 324, w: 30 },
    ],
  },
  'banner-h': {
    w: 1170, h: 834, P: 5,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 10, y: 10, align: 'l', fill: 'yellow', ext: 3 },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 10, y: 56, align: 'l', fill: 'yellow', ext: 3 },
      { t: 'text', s: 'EVERYTHING ON', f: `8px ${PS}`, x: 10, y: 106, align: 'l', fill: 'white', ext: 1 },
      { t: 'text', s: 'THE INTERNET.', f: `8px ${PS}`, x: 10, y: 118, align: 'l', fill: 'white', ext: 1 },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `8px ${PS}`, x: 10, y: 134, align: 'l', fill: 'yellow', blink: 'white', ext: 1 },
      { t: 'globe', x: 186, y: 50, d: 84 },
      { t: 'burst', x: 190, y: 129, r: 35, lines: ['INCLUDING', 'THIS PAGE!'], f: `8px ${SK}`, arrow: 'down' },
      // no CLICK HERE on the phone: the strip is short, and the burst is its one device
      { t: 'logo', x: 26, y: 156, w: 30 },
    ],
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '1x1';
const F = FORMATS[format];
const P = F.P, W = Math.ceil(F.w / P), H = Math.ceil(F.h / P);

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);

// ---------- fonts ----------
await Promise.all([`8px ${PS}`, `16px ${PS}`, `8px ${SK}`, `700 8px ${SK}`, `16px ${SK}`, `700 16px ${SK}`, '400 100px "Archivo Black"'].map((f) => document.fonts.load(f)));

// ---------- the GIF canvas ----------
const gif = $('gif');
gif.width = W; gif.height = H;
gif.style.width = W * P + 'px'; gif.style.height = H * P + 'px';
const g = gif.getContext('2d');
g.imageSmoothingEnabled = false;

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
// Hard edges only: anything at least half covered is in, the rest is out.
function harden(c) {
  const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const on = a[i + 3] >= 128; a[i] = a[i + 1] = a[i + 2] = 255; a[i + 3] = on ? 255 : 0; }
  x.putImageData(d, 0, 0);
  return c;
}
function crop(c) {
  const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (a[(y * c.width + x) * 4 + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const o = canvas(x1 - x0 + 1, y1 - y0 + 1);
  o.getContext('2d').drawImage(c, -x0, -y0);
  return o;
}
function tint(mask, colour) {
  const o = canvas(mask.width, mask.height), x = o.getContext('2d');
  x.drawImage(mask, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = C[colour] || colour; x.fillRect(0, 0, o.width, o.height);
  return o;
}
function textMask(s, font) {
  const size = Number(font.match(/(\d+)px/)[1]);
  const m = canvas(8, 8).getContext('2d'); m.font = font;
  const c = canvas(Math.ceil(m.measureText(s).width) + 8, size * 2 + 8), x = c.getContext('2d');
  x.font = font; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(s, 4, 4);
  return crop(harden(c));
}
// A sprite: the mask in its colour over a solid pixel extrusion down and to the right.
function sprite(mask, fill, ext = 0, extColour = 'navy') {
  const o = canvas(mask.width + ext, mask.height + ext), x = o.getContext('2d');
  const back = tint(mask, extColour);
  for (let i = ext; i >= 1; i--) x.drawImage(back, i, i);
  x.drawImage(tint(mask, fill), 0, 0);
  return o;
}

// ---------- build every element as one or two pre-drawn frames ----------
const layers = []; // { frames: [canvas, canvas?], x, y, rate (frame swaps per second) }
let globeItem = null;
for (const it of F.items) {
  if (it.t === 'text') {
    const m = textMask(it.s, it.f);
    const x = it.align === 'l' ? it.x : Math.round(it.x - m.width / 2);
    const frames = [sprite(m, it.fill, it.ext)];
    if (it.blink) frames.push(sprite(m, it.blink, it.ext));
    layers.push({ frames, x, y: it.y, rate: 2 });
  } else if (it.t === 'burst') {
    layers.push(burst(it));
  } else if (it.t === 'button') {
    layers.push(button(it));
  } else if (it.t === 'globe') {
    globeItem = it;
    layers.push({ globe: true });
  } else if (it.t === 'logo') {
    const L = $('logo'), w = it.w * P, h = w / 1.872;
    Object.assign(L.style, { left: it.x * P - w / 2 + 'px', top: it.y * P - h / 2 + 'px', width: w + 'px', height: h + 'px' });
  }
}

// A pixel starburst: two frames, the points jumping half a step, the words swapping colour.
function burst(it) {
  const N = 14, size = it.r * 2 + 6;
  const frames = [0, 1].map((k) => {
    const shape = canvas(size, size), x = shape.getContext('2d');
    x.translate(size / 2, size / 2);
    x.beginPath();
    for (let i = 0; i < N * 2; i++) {
      const a = (i / (N * 2)) * TAU + (k * Math.PI) / N, r = i % 2 ? it.r * 0.74 : it.r;
      x.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
    }
    x.closePath(); x.fillStyle = '#fff'; x.fill();
    harden(shape);
    // black one-pixel keyline, red body
    const o = canvas(size + 2, size + 2), y = o.getContext('2d');
    const ink = tint(shape, 'black');
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) y.drawImage(ink, dx, dy);
    y.drawImage(tint(shape, 'red'), 1, 1);
    // words, and on the extension's banner an arrow at the reader's page
    const masks = it.lines.map((l) => textMask(l, it.f));
    const rows = masks.map((m) => sprite(m, k ? 'white' : 'yellow', 1, 'black'));
    if (it.arrow === 'left') rows.unshift(arrow('left'));
    if (it.arrow === 'down') rows.push(arrow('down'));
    const gap = 3, total = rows.reduce((s, r) => s + r.height, 0) + gap * (rows.length - 1);
    let ty = Math.round((o.height - total) / 2);
    for (const r of rows) {
      let dx = 0, dy = 0;
      if (r.isArrow && k) { if (it.arrow === 'left') dx = -2; else dy = 2; }
      y.drawImage(r, Math.round((o.width - r.width) / 2) + dx, ty + dy);
      ty += r.height + gap;
    }
    return o;
  });
  return { frames, x: it.x - frames[0].width / 2, y: it.y - frames[0].height / 2, rate: 2 }; // on the same 2 Hz beat as the button and the message blink
}
function arrow(dir) {
  // a fat pixel arrow, drawn pointing left: 13 px head, 7 px shaft, 18 px long
  const AW = 18, AH = 13, HH = 6;
  const c = canvas(AW, AH), x = c.getContext('2d');
  x.fillStyle = '#fff';
  for (let i = 0; i <= HH; i++) x.fillRect(i, HH - i, 1, i * 2 + 1);
  x.fillRect(HH + 1, 3, AW - HH - 1, AH - 6);
  let m = c;
  if (dir === 'down') {
    m = canvas(AH, AW);
    const a = c.getContext('2d').getImageData(0, 0, AW, AH).data, y = m.getContext('2d');
    y.fillStyle = '#fff';
    for (let yy = 0; yy < AH; yy++) for (let xx = 0; xx < AW; xx++) if (a[(yy * AW + xx) * 4 + 3]) y.fillRect(yy, AW - 1 - xx, 1, 1);
  }
  const o = canvas(m.width + 2, m.height + 2), y = o.getContext('2d');
  const ink = tint(m, 'black');
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2], [2, 2]]) y.drawImage(ink, dx, dy);
  y.drawImage(tint(m, 'yellow'), 1, 1);
  o.isArrow = true;
  return o;
}
function flipV(c) { const o = canvas(c.width, c.height), x = o.getContext('2d'); x.translate(0, c.height); x.scale(1, -1); x.drawImage(c, 0, 0); return o; }

// A pixel CLICK HERE button: yellow slab, black keyline, navy drop; the arrows either side jump in.
function button(it) {
  const m = textMask(it.s, `8px ${PS}`);
  const padX = 10, padY = 4, w = m.width + padX * 2, h = m.height + padY * 2;
  const frames = [0, 1].map((k) => {
    const o = canvas(w + 3, h + 3), x = o.getContext('2d');
    x.fillStyle = C.navy; x.fillRect(3, 3, w, h);
    x.fillStyle = C.black; x.fillRect(0, 0, w, h);
    x.fillStyle = k ? C.white : C.yellow; x.fillRect(1, 1, w - 2, h - 2);
    x.drawImage(tint(m, 'blue'), padX, padY);
    // arrows: 3 px tall triangles, one pixel further in on the second frame
    x.fillStyle = C.blue;
    const ay = padY + Math.floor(m.height / 2), inset = 3 + k;
    for (let i = 0; i < 3; i++) {
      x.fillRect(inset + i, ay - (2 - i), 1, (2 - i) * 2 + 1);
      x.fillRect(w - 1 - inset - i, ay - (2 - i), 1, (2 - i) * 2 + 1);
    }
    return o;
  });
  return { frames, x: Math.round(it.x - w / 2), y: Math.round(it.y - h / 2), rate: 2 };
}

// ---------- the globe GIF ----------
const SS = 3; // rendered at 3x and averaged down before it is posterised
const D = globeItem.d;
const gl = $('gl');
const { renderer, scene, camera } = createStage({ canvas: gl, width: D * SS, height: D * SS, pixelRatio: 1, fov: 24 });
renderer.shadowMap.enabled = false;
{
  const pxPerUnit = (D * SS) / 2 / 1.06;
  const dist = (D * SS) / (2 * Math.tan((24 * Math.PI) / 360) * pxPerUnit);
  const elev = (Number(q.get("elev") ?? 20) * Math.PI) / 180;
  camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(D * SS, D * SS, 0, 0, D * SS, D * SS);
}
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
pivot.add(globe);

// palette the globe is posterised to: the banner's own colours plus two chrome greys
const PAL = ['#000000', '#000066', '#0000cc', '#0033ff', '#3366ff', '#6699ff', '#99ccff', '#ffffff', '#c0c0c0', '#ffff00', '#ffcc00', '#ff0000', '#990000']
  .map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
const small = canvas(D, D), sx = small.getContext('2d', { willReadFrequently: true });
sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
const globeOut = canvas(D, D), gx = globeOut.getContext('2d');
const nearest = (r, gg, b) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < PAL.length; i++) {
    const p = PAL[i], dr = r - p[0], dg = gg - p[1], db = b - p[2];
    const d = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11 + (dr * dr + dg * dg + db * db) * 0.2;
    if (d < bd) { bd = d; best = i; }
  }
  return PAL[best];
};
const YAW0 = Number(q.get('yaw') ?? -25);
const TURN = 4;
const GLOW = Number(q.get('glow') ?? 0), GLOW_R = Number(q.get('glowr') ?? 1.7); // seconds a turn: three turns a loop
// the turn eases to a near-stop on the hero pose (cut faces three-quarter on) at t = 0.4 s, 4.4 s, 8.4 s
const HOLD_T = 0.4;
const yawAt = (t) => { const u = (t - HOLD_T) / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.7 * Math.sin(TAU * u); };
let globeStep = -1;
function drawGlobe(step) {
  if (step === globeStep) return;
  globeStep = step;
  const t = step / GIF_FPS;
  pivot.rotation.y = yawAt(t);
  pivot.updateMatrixWorld(true);
  renderer.render(scene, camera);
  sx.clearRect(0, 0, D, D);
  sx.drawImage(gl, 0, 0, D, D);
  const src = sx.getImageData(0, 0, D, D), a = src.data;
  const out = gx.createImageData(D, D), o = out.data;
  const SPREAD = 40, SAT = 1.45;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const i = (y * D + x) * 4;
    if (a[i + 3] < 128) continue;
    const k = BAYER[(y & 3) * 4 + (x & 3)] * SPREAD;
    // a touch more saturation first, so the lit cut faces stay sign-red and sign-yellow
    const l = a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
    const p = nearest(l + (a[i] - l) * SAT + k, l + (a[i + 1] - l) * SAT + k, l + (a[i + 2] - l) * SAT + k);
    o[i] = p[0]; o[i + 1] = p[1]; o[i + 2] = p[2]; o[i + 3] = 255;
  }
  // a one-pixel navy keyline round the silhouette, like a hand-cleaned sprite
  const solid = (x, y) => x >= 0 && y >= 0 && x < D && y < D && a[(y * D + x) * 4 + 3] >= 128;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
      const i = (y * D + x) * 4; o[i] = 0; o[i + 1] = 0; o[i + 2] = 0x66; o[i + 3] = 255;
    }
  }
  gx.putImageData(out, 0, 0);
}

// The background: flat web blue with a soft halo behind the globe, done the 1997 way, as an
// ordered dither of a lighter web blue (no gradients in a GIF). Drawn once.
const bgCanvas = canvas(W, H);
{
  const x = bgCanvas.getContext('2d'), d = x.createImageData(W, H), a = d.data;
  const glow = GLOW ? [0x33, 0x66, 0xff] : null, base = [0x00, 0x33, 0xff];
  const R = D * 0.5 * GLOW_R;
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = (y * W + xx) * 4;
    const r = Math.hypot(xx + 0.5 - globeItem.x, y + 0.5 - globeItem.y) / R;
    const k = glow ? GLOW * Math.max(0, 1 - r) ** 1.2 : 0;
    const c = k > BAYER[(y & 3) * 4 + (xx & 3)] + 0.5 ? glow : base;
    a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
}

await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(Math.floor(t * GIF_FPS + 1e-6) % (DURATION * GIF_FPS));
  g.drawImage(bgCanvas, 0, 0);
  for (const L of layers) {
    if (L.globe) { g.drawImage(globeOut, Math.round(globeItem.x - D / 2), Math.round(globeItem.y - D / 2)); continue; }
    const k = L.frames.length > 1 ? Math.floor(t * L.rate + 1e-6) % 2 : 0;
    g.drawImage(L.frames[k], Math.round(L.x), Math.round(L.y));
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
