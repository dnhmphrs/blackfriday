// The approved banner (gif-plinth-e: the chrome globe hovering over a chrome Tuscan column, the
// stacked sale message, the pink -30% sticker, the WOW! burst, the slanted EVERY SITE 30% OFF!
// strip with the Gary Mustard Enterprises tape under it, sparkles and the crawl), kept in exactly
// the same places but re-shot as a 1990s home-shopping channel graphic: smooth full resolution,
// a lit blue studio backdrop, the globe and column in real 3D chrome, heavy slanted sale type with
// glossy faces and hard navy extrusions, glossy vector stickers and a broadcast lower-third crawl.
// Formats: banner-v (1080x2025), banner-h (1170x834), 1x1 (1080x1080).
// ?h= renders a format at another height: the crawl stays on the bottom edge, the globe stays
// level with the message and the column's shaft grows down to the crawl (the strips go with it),
// as in gif-plinth-e.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, materials } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;
const SKEW = Math.tan((9 * Math.PI) / 180); // the slant of the sale type, as in the old ad

// The crawl: exactly these lines, in this order, looping.
const TICKER = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];

// Layout in stage px, measured from gif-plinth-e's FORMATS (GIF px x P).
// type: groups of lines that share one size; each line is a box (cx = centre, or left) with the
// top and height of the approved lettering; the new type is fitted to the box and centred on it.
const COL = { shaft: 1.5, wide: 1.4, gap: 0.18, steps: 2, bob: 0.05 };
const FORMATS = {
  'banner-v': {
    w: 1080, h: 2025,
    type: [
      { st: 'head', align: 'c', fitW: 1.0, maxH: 1.06, lines: [['30%', 543, 48, 690, 210], ['OFF', 543, 324, 690, 210]] },
      { st: 'body', align: 'c', fitW: 0.97, maxH: 1.18, lines: [['EVERYTHING', 540, 624, 948, 84], ['ON THE', 540, 744, 564, 84], ['INTERNET.', 540, 864, 804, 84]] },
      { st: 'only', align: 'c', fitW: 1.0, maxH: 1.3, lines: [['BLACK', 306, 1056, 384, 60], ['FRIDAY', 306, 1164, 444, 60], ['ONLY!', 306, 1272, 372, 60]] },
    ],
    globe: { x: 756, y: 1212, d: 384 },
    sticker: { x: 912, y: 1068, r: 90 },
    burst: { x: 264, y: 1506, r: 132, word: 'WOW!' },
    strips: [
      { sub: true, y: 1620, h: 68, angle: -6, dx: 18, s: 'GARY MUSTARD ENTERPRISES', cap: 30 },
      { y: 1518, h: 126, angle: -6, dx: 12, s: 'EVERY SITE 30% OFF!', cap: 50 },
    ],
    sparkles: [
      { x: 84, y: 84, ph: 0, at: [[960, 600], [120, 552], [900, 852]] },
      { x: 996, y: 372, ph: 1, at: [[600, 996], [144, 948], [1008, 1440]] },
      { x: 492, y: 1056, ph: 0, at: [[84, 1380], [1008, 60], [372, 576]] },
    ],
    spark: 46, ticker: { h: 132, speed: 360 },
  },
  'banner-h': {
    w: 1170, h: 834,
    type: [
      { st: 'head', align: 'l', fitW: 1.0, maxH: 1.06, lines: [['30%', 45, 35, 575, 175], ['OFF', 45, 260, 575, 175]] },
      { st: 'bodyS', align: 'l', fitW: 1.0, maxH: 1.3, lines: [['EVERYTHING ON', 40, 500, 515, 35], ['THE INTERNET.', 40, 560, 495, 35]] },
      { st: 'onlyS', align: 'l', fitW: 1.0, maxH: 1.3, lines: [['BLACK FRIDAY ONLY!', 40, 635, 705, 35]] },
    ],
    globe: { x: 980, y: 185, d: 320 },
    sticker: { x: 860, y: 150, r: 70 },
    burst: { x: 690, y: 490, r: 90, word: 'HOT!' },
    strips: [],
    sparkles: [{ x: 730, y: 110, ph: 1, at: [[1140, 50], [590, 490], [850, 710]] }],
    spark: 38, ticker: { h: 85, speed: 300 },
  },
  '1x1': {
    w: 1080, h: 1080,
    type: [
      { st: 'head', align: 'l', fitW: 1.0, maxH: 1.06, lines: [['30%', 44, 40, 460, 140], ['OFF', 44, 228, 460, 140]] },
      { st: 'body', align: 'l', fitW: 0.97, maxH: 1.18, lines: [['EVERYTHING', 44, 432, 632, 56], ['ON THE', 44, 512, 376, 56], ['INTERNET.', 44, 592, 536, 56]] },
      { st: 'only', align: 'l', fitW: 1.0, maxH: 1.3, lines: [['BLACK FRIDAY', 44, 696, 600, 40], ['ONLY!', 44, 768, 248, 40]] },
    ],
    globe: { x: 888, y: 360, d: 360 },
    sticker: { x: 1000, y: 224, r: 72 },
    burst: { x: 448, y: 888, r: 96, word: 'NEW!' },
    strips: [],
    sparkles: [
      { x: 560, y: 120, ph: 0, at: [[80, 912], [1048, 56], [600, 400]] },
      { x: 608, y: 600, ph: 1, at: [[720, 944], [496, 32], [1048, 680]] },
    ],
    spark: 34, ticker: { h: 88, speed: 240 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '1x1';
const BASE = FORMATS[format];
const F = { ...BASE };
if (Number(q.get('h')) > 0) F.h = Math.round(Number(q.get('h')));
// The monument stands on the crawl: when ?h= makes the banner taller, the globe stays level with
// the message, the shaft grows down to the crawl and the strips move down with it.
const GROUND = F.h - BASE.h;
F.strips = BASE.strips.map((s) => ({ ...s, y: s.y + GROUND }));
const W = F.w, H = F.h;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = W + 'px';
stage.style.height = H + 'px';
const $ = (id) => document.getElementById(id);
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const sizeCanvas = (c) => { c.width = W; c.height = H; c.style.width = W + 'px'; c.style.height = H + 'px'; return c.getContext('2d'); };

// ---------- fonts ----------
const DISPLAY = (s) => `400 ${s}px "Archivo Black"`;
const CRAWL = (s) => `italic 800 ${s}px Archivo`;
const TAPE = (s) => `italic 700 ${s}px Arimo`;
await Promise.all([DISPLAY(100), CRAWL(100), TAPE(100)].map((f) => document.fonts.load(f)));

// ---------- colours ----------
const NAVY = '#0a0f66', INK = '#05083f';
// glossy faces: a bright top, a hard horizon a little under half way (the "gloss"), a deeper bottom
const FACES = {
  yellow: { stops: [[0, '#fffbd2'], [0.2, '#fff35c'], [0.5, '#ffe81e'], [0.53, '#ffd000'], [0.9, '#ffb400'], [1, '#f39d00']], hi: 'rgba(255,255,236,0.95)', lo: 'rgba(150,70,0,0.55)' },
  white: { stops: [[0, '#ffffff'], [0.5, '#ffffff'], [0.53, '#e6edff'], [1, '#b4c6f6']], hi: 'rgba(255,255,255,1)', lo: 'rgba(40,60,160,0.5)' },
  black: { stops: [[0, '#2b2b33'], [0.5, '#16161c'], [0.53, '#050507'], [1, '#000000']], hi: 'rgba(255,255,255,0.25)', lo: 'rgba(0,0,0,0)' },
  red: { stops: [[0, '#ff6a50'], [0.5, '#ff2a14'], [0.53, '#e80c00'], [1, '#b80000']], hi: 'rgba(255,220,200,0.6)', lo: 'rgba(80,0,0,0.5)' },
};
// type styles: face(s), extrusion depth and outline as a share of the cap height
const STY = {
  head: { face: 'yellow', ext: 0.075, line: 0.022 },
  body: { face: 'white', ext: 0.11, line: 0.03 },
  bodyS: { face: 'white', ext: 0.12, line: 0.04 },
  only: { face: 'yellow', blink: 'white', ext: 0.11, line: 0.035 },
  onlyS: { face: 'yellow', blink: 'white', ext: 0.12, line: 0.04 },
};

// ---------- lettering ----------
function scanBounds(c, thr = 100) {
  const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}
function setFont(x, font, ls = 0) { x.font = font; x.letterSpacing = ls ? ls + 'px' : '0px'; x.textBaseline = 'alphabetic'; x.textAlign = 'left'; }
// ink box of a line of type, relative to its origin (baseline, left), slanted by k
function inkOf(text, font, size, k = SKEW, ls = 0) {
  const c = canvas(size * (text.length * 1.1 + 2), size * 2.2), x = c.getContext('2d', { willReadFrequently: true });
  const ox = size * 0.6, oy = size * 1.5;
  setFont(x, font(size), ls); x.setTransform(1, 0, -k, 1, ox, oy); x.fillStyle = '#fff'; x.fillText(text, 0, 0);
  const b = scanBounds(c);
  return { x0: b.x0 - ox, y0: b.y0 - oy, x1: b.x1 - ox, y1: b.y1 - oy };
}
const capCache = new Map();
const capOf = (font, size) => { const key = font(size); if (!capCache.has(key)) { const b = inkOf('H', font, size, 0); capCache.set(key, b.y1 - b.y0); } return capCache.get(key); };
const tint = (src, color) => { const c = canvas(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c; };

// A line of sale type: a glossy face with a bevelled rim, a thin dark outline and a hard navy
// extrusion down and to the right. Returns the sprite and where its baseline origin sits in it.
function typeSprite(text, { font = DISPLAY, size, k = SKEW, ls = 0, face = 'yellow', ext = 0, line = 0, extColor = NAVY, lineColor = INK, bevel = 0.03, soft = 0 }) {
  const b = inkOf(text, font, size, k, ls), cap = capOf(font, size);
  const E = Math.round(ext), L = line, pad = Math.ceil(L + 4 + soft * 2);
  const w = b.x1 - b.x0 + pad * 2 + E, h = b.y1 - b.y0 + pad * 2 + E;
  const ox = pad - b.x0, oy = pad - b.y0;
  const S = canvas(w, h), s = S.getContext('2d');
  const shape = (ctx, dx = 0, dy = 0, mode = 'fill', lw = 0) => {
    setFont(ctx, font(size), ls); ctx.setTransform(1, 0, -k, 1, ox + dx, oy + dy);
    if (mode === 'fill') ctx.fillText(text, 0, 0); else { ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  // the outline mask (face grown by the line width) carries the extrusion
  const M = canvas(w, h), m = M.getContext('2d');
  m.fillStyle = '#fff'; m.strokeStyle = '#fff'; shape(m); if (L) shape(m, 0, 0, 'stroke', L * 2);
  if (soft) { s.save(); s.filter = `blur(${soft}px)`; s.globalAlpha = 0.45; s.drawImage(tint(M, '#000033'), E + soft * 0.6, E + soft * 0.6); s.restore(); }
  if (E) { const T = tint(M, extColor); for (let i = E; i >= 1; i--) s.drawImage(T, i, i); }
  if (L) s.drawImage(tint(M, lineColor), 0, 0);
  // the face: gradient from the cap top to the baseline, clipped to the letters
  const fc = FACES[face];
  const Fc = canvas(w, h), f = Fc.getContext('2d');
  const g = f.createLinearGradient(0, oy - cap, 0, oy + cap * 0.08);
  for (const [o, c] of fc.stops) g.addColorStop(o, c);
  f.fillStyle = g; f.fillRect(0, 0, w, h);
  const FM = canvas(w, h), fm = FM.getContext('2d'); fm.fillStyle = '#fff'; shape(fm);
  f.globalCompositeOperation = 'destination-in'; f.drawImage(FM, 0, 0);
  // bevel: a bright rim on the top-left edges, a darker one on the bottom-right edges
  const bv = Math.max(1, Math.round(cap * bevel));
  for (const [dx, col] of [[bv, fc.hi], [-bv, fc.lo]]) {
    const R = canvas(w, h), r = R.getContext('2d');
    r.drawImage(FM, 0, 0); r.globalCompositeOperation = 'destination-out'; r.drawImage(FM, dx, dx);
    r.globalCompositeOperation = 'source-in'; r.fillStyle = col; r.fillRect(0, 0, w, h);
    f.globalCompositeOperation = 'source-over'; f.drawImage(R, 0, 0);
  }
  s.drawImage(Fc, 0, 0);
  return { c: S, ox, oy, cap, inkW: b.x1 - b.x0, pad, b };
}

// ---------- the backdrop: a blue studio cyclorama, lit behind the monument ----------
const bgx = sizeCanvas($('bg'));
const G = F.globe, U = G.d / 2.12; // stage px per world unit (globe radius 1)
const tickerTop = H - F.ticker.h;
function backdrop(x) {
  let g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1ab8'); g.addColorStop(0.45, '#0b22d4'); g.addColorStop(1, '#06109a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const pool = (cx, cy, rx, ry, stops) => {
    x.save(); x.translate(cx, cy); x.scale(rx / ry, 1);
    const r = x.createRadialGradient(0, 0, 0, 0, 0, ry);
    for (const [o, c] of stops) r.addColorStop(o, c);
    x.fillStyle = r; x.fillRect(-ry * 3, -ry * 3, ry * 6, ry * 6); x.restore();
  };
  // a soft key light washing the top of the wall where the headline sits
  pool(W * 0.48, H * 0.02, W * 0.75, Math.min(H, 1400) * 0.42, [[0, 'rgba(70,140,255,0.42)'], [0.6, 'rgba(40,100,255,0.12)'], [1, 'rgba(30,80,255,0)']]);
  // the bright cyan bloom on the cyclorama behind the globe, falling off into the blue
  const R = U * 2.6;
  pool(G.x, G.y + U * 0.35, R * 0.95, R * 1.15, [[0, 'rgba(110,220,255,0.95)'], [0.18, 'rgba(70,175,255,0.8)'], [0.42, 'rgba(30,100,250,0.5)'], [0.72, 'rgba(15,50,230,0.15)'], [1, 'rgba(10,34,214,0)']]);
  // a pool of light on the floor of the set where the column stands
  pool(G.x, tickerTop, U * 2.2, U * 0.9, [[0, 'rgba(120,200,255,0.55)'], [0.5, 'rgba(60,140,255,0.2)'], [1, 'rgba(40,100,255,0)']]);
  // fall-off to the corners
  x.save(); x.translate(W / 2, H / 2); x.scale(1, H / W);
  const v = x.createRadialGradient(0, 0, W * 0.35, 0, 0, W * 0.95);
  v.addColorStop(0, 'rgba(2,4,60,0)'); v.addColorStop(1, 'rgba(2,4,60,0.55)');
  x.fillStyle = v; x.fillRect(-W, -W, W * 2, W * 2); x.restore();
  // faint horizontal light banding, like a lit studio wall
  for (let y = 0; y < H; y += 6) { x.fillStyle = `rgba(150,190,255,${(0.018 + 0.012 * Math.sin(y * 0.021)).toFixed(4)})`; x.fillRect(0, y, W, 2); }
}
backdrop(bgx);

// ---------- the message ----------
// Each group shares one size: as big as fits every line's box across (fitW), no taller than maxH x
// the approved lettering. Lines are centred on their boxes' middles, so the rhythm stays.
const typeLayers = []; // { a: sprite, b?: blink sprite, x, y }
for (const grp of F.type) {
  const st = STY[grp.st];
  let size = Infinity;
  for (const [s, , , bw, bh] of grp.lines) {
    const b = inkOf(s, DISPLAY, 100);
    size = Math.min(size, (bw * grp.fitW) / ((b.x1 - b.x0) / 100), (bh * grp.maxH) / (capOf(DISPLAY, 100) / 100));
  }
  size = Math.floor(size);
  const cap = capOf(DISPLAY, size);
  for (const [s, x, top, , bh] of grp.lines) {
    const opt = { size, ext: cap * st.ext, line: Math.max(1.5, cap * st.line), soft: Math.round(cap * 0.05) };
    const a = typeSprite(s, { ...opt, face: st.face });
    const b = st.blink ? typeSprite(s, { ...opt, face: st.blink }) : null;
    const baseline = top + bh / 2 + cap / 2;
    const dx = grp.align === 'l' ? x - a.pad : x - a.pad - a.inkW / 2;
    typeLayers.push({ a, b, x: Math.round(dx), y: Math.round(baseline - a.oy) });
  }
}
// static type goes on the backdrop; the blinking lines are drawn every frame
for (const L of typeLayers) if (!L.b) bgx.drawImage(L.a.c, L.x, L.y);
const ux = sizeCanvas($('under'));

// ---------- the chrome monument: the globe hovering over a Tuscan column ----------
const gl = $('gl');
const FOV = 10, DIST = 30, PR = Number(q.get('pr') || 2); // rendered at 2x and shown at 1x
const { renderer, scene, camera } = createStage({ canvas: gl, width: 16, height: 16, pixelRatio: PR, fov: FOV });
renderer.shadowMap.enabled = false;
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
pivot.add(globe);

// A Tuscan order in chrome (ported from gif-plinth-e): square abacus, ovolo echinus, a collar,
// a fluted shaft with entasis, a torus, a square plinth and steps. y runs down from the globe's
// south pole; wide scales it across; gap is the air between the globe and the abacus.
function buildColumn({ shaft = 3, flutes = 12, steps = 1, wide = 1, gap = 0 } = {}) {
  const mat = materials.chrome();
  mat.roughness = 0.05;
  mat.envMap = scene.environment;
  mat.envMapRotation.set((15 * Math.PI) / 180, 0, 0); // the studio turned a little so the fronts catch the softboxes
  const col = new THREE.Group();
  const pts = [];
  let y = -1.035 - gap;
  const add = (m) => { col.add(m); return m; };
  const slab = (w, h) => {
    // a box with softly rounded edges reads as polished metal rather than a flat card
    const m = add(new THREE.Mesh(roundedBox(w, h, w, Math.min(0.025, h * 0.2)), mat));
    m.position.y = y - h / 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [y, y - h]) pts.push(new THREE.Vector3(sx * w / 2, yy, sz * w / 2));
    y -= h;
  };
  const lathe = (prof, h) => {
    const g = new THREE.LatheGeometry(prof.map(([r, v]) => new THREE.Vector2(r, y - h + v * h)), 96);
    add(new THREE.Mesh(g, mat)); y -= h;
  };
  const rTop = 0.33, rBot = 0.39;
  slab(1.06, 0.17); // abacus
  const abacusTop = -1.035 - gap;
  { const prof = []; for (let i = 0; i <= 16; i++) { const s = i / 16; prof.push([rTop + 0.03 + (0.5 - rTop - 0.03) * Math.sin((s * Math.PI) / 2), s]); } lathe(prof, 0.19); } // echinus
  { const tor = add(new THREE.Mesh(new THREE.TorusGeometry(rTop + 0.03, 0.045, 16, 96), mat)); tor.rotation.x = Math.PI / 2; tor.position.y = y - 0.07; } // collar
  lathe([[rTop + 0.01, 0], [rTop + 0.01, 1]], 0.14); // neck
  {
    const M = 12, N = flutes * M, NY = 48, h = shaft, depth = 0.055;
    const pos = [], idx = [];
    for (let j = 0; j <= NY; j++) {
      const v = j / NY;
      const R = rBot - (rBot - rTop) * Math.pow(1 - v, 1.6);
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * TAU + Math.PI / flutes, ph = (i % M) / M;
        const r = R - depth * Math.sqrt(Math.max(0, 1 - (2 * ph - 1) ** 2));
        pos.push(r * Math.sin(th), y - v * h, r * Math.cos(th));
      }
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    add(new THREE.Mesh(g, mat));
    y -= h;
  }
  lathe([[rBot + 0.03, 0], [rBot + 0.03, 1]], 0.04); // fillet
  { const tor = add(new THREE.Mesh(new THREE.TorusGeometry(rBot + 0.05, 0.08, 24, 96), mat)); tor.rotation.x = Math.PI / 2; tor.position.y = y - 0.08; y -= 0.16; } // torus
  slab(1.04, 0.16); // plinth
  for (let k = 0; k < steps; k++) slab(1.3 + k * 0.26, 0.13);
  col.scale.set(wide, 1, wide);
  for (const v of pts) { v.x *= wide; v.z *= wide; }
  return { col, pts, bottom: y, abacusTop };
}
function roundedBox(w, h, d, r) {
  // a box whose edges are rounded by r: built from a rounded-rectangle extrusion
  const s = new THREE.Shape(), x0 = -w / 2, z0 = -d / 2;
  s.moveTo(x0 + r, z0); s.lineTo(x0 + w - r, z0); s.quadraticCurveTo(x0 + w, z0, x0 + w, z0 + r);
  s.lineTo(x0 + w, z0 + d - r); s.quadraticCurveTo(x0 + w, z0 + d, x0 + w - r, z0 + d);
  s.lineTo(x0 + r, z0 + d); s.quadraticCurveTo(x0, z0 + d, x0, z0 + d - r); s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 4, curveSegments: 6 });
  g.rotateX(Math.PI / 2);
  g.translate(0, h / 2 - r, 0);
  g.computeVertexNormals();
  return g;
}
// the shaft grows by the extra height, so the column still stands on the crawl
const C3 = buildColumn({ ...COL, shaft: COL.shaft + GROUND / U });
scene.add(C3.col);
const bobAt = (t) => COL.bob * Math.sin((TAU * t) / 4);

// a soft shadow on the abacus under the hovering globe, darker as it comes down
const blobTex = (() => {
  const c = canvas(256, 256), g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(4,8,50,0.85)'); r.addColorStop(0.5, 'rgba(4,8,50,0.35)'); r.addColorStop(1, 'rgba(4,8,50,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false }));
blob.rotation.x = -Math.PI / 2;
blob.position.y = C3.abacusTop + 0.003;
scene.add(blob);

// Frame the monument: a far camera looking at the globe's centre; the canvas is cropped to the
// monument by projecting the column's corners and every pose of the spinning, bobbing globe.
const elev = (14 * Math.PI) / 180;
camera.aspect = 1;
camera.position.set(0, Math.sin(elev) * DIST, Math.cos(elev) * DIST);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);
const FULL = 2 * Math.tan((FOV * Math.PI) / 360) * DIST * U; // the full virtual frame, stage px
let bx0 = 0, bx1 = 0, by0 = 0, by1 = 0;
const fit = (v) => { const p = v.clone().project(camera); const x = (p.x * FULL) / 2, y = (-p.y * FULL) / 2; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); };
for (const v of C3.pts) fit(v);
for (let k = 0; k < 64; k++) { const a = (k / 64) * TAU; for (const e of [-0.6, 0, 0.6]) for (const b of [-COL.bob, COL.bob]) { fit(new THREE.Vector3(Math.cos(a) * Math.cos(e) * 1.08, Math.sin(e) * 1.08 + b, Math.sin(a) * Math.cos(e) * 1.08)); fit(new THREE.Vector3(0, 1.08 + b, 0)); } }
const GX0 = Math.floor(bx0) - 6, GY0 = Math.floor(by0) - 6;
const DW = Math.ceil(bx1) + 6 - GX0, DH = Math.min(Math.ceil(by1) + 6, H - G.y) - GY0; // nothing below the stage
camera.setViewOffset(FULL, FULL, FULL / 2 + GX0, FULL / 2 + GY0, DW, DH);
renderer.setSize(DW, DH, false);
Object.assign(gl.style, { left: G.x + GX0 + 'px', top: G.y + GY0 + 'px', width: DW + 'px', height: DH + 'px' });

const YAW0 = -25, TURN = 4, HOLD_T = 0.4; // three turns a loop, easing to a near-stop on the hero pose (cut three-quarter on)
const yawAt = (t) => { const u = (t - HOLD_T) / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.7 * Math.sin(TAU * u); };
function drawGlobe(t) {
  pivot.rotation.y = yawAt(t);
  pivot.position.y = bobAt(t);
  const lift = (pivot.position.y + COL.bob) / (2 * COL.bob); // 0 low .. 1 high
  blob.material.opacity = 0.85 - 0.3 * lift;
  blob.scale.setScalar(0.9 + 0.2 * lift);
  renderer.render(scene, camera);
}

// ---------- the overlay: sticker, burst, strips, sparkles, crawl ----------
const ox = sizeCanvas($('over'));
const ease = (x) => x * x * (3 - 2 * x);
const frac = (x) => x - Math.floor(x);
// a two-state flip on the 2 Hz beat with a short crossfade: 0 on the first half second, 1 on the second
const FADE = 0.07;
const flip = (t) => { const x = frac(t); return x < FADE ? 1 - ease(x / FADE) : x < 0.5 ? 0 : x < 0.5 + FADE ? ease((x - 0.5) / FADE) : 1; };

// The -30% sticker: a glossy hot-pink dot slapped on the globe, its lower-right edge peeling up to
// show the white back. Drawn once; it hops on the off-beat.
function buildSticker({ r: R }) {
  const S = Math.ceil(R * 2.8), c = canvas(S, S), x = c.getContext('2d'), C = S / 2 - R * 0.04;
  const k = R * 0.95; // the fold line: x + y = k (from the centre)
  x.translate(C, C);
  const body = () => { x.beginPath(); x.arc(0, 0, R, 0, TAU); x.clip(); x.beginPath(); x.moveTo(-3 * R, k + 3 * R); x.lineTo(k + 3 * R, -3 * R); x.lineTo(-3 * R, -3 * R); x.closePath(); };
  // hard navy drop shadow under the stuck-down part
  x.save(); x.translate(R * 0.09, R * 0.11); body(); x.clip(); x.fillStyle = 'rgba(8,12,90,0.92)'; x.fillRect(-2 * R, -2 * R, 4 * R, 4 * R); x.restore();
  // the dot
  x.save(); body(); x.clip();
  let g = x.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.05, -R * 0.1, -R * 0.1, R * 1.25);
  g.addColorStop(0, '#ffc2e2'); g.addColorStop(0.25, '#ff6ab8'); g.addColorStop(0.65, '#ff2d95'); g.addColorStop(1, '#c80a66');
  x.fillStyle = g; x.fillRect(-2 * R, -2 * R, 4 * R, 4 * R);
  // a gloss crescent across the top
  x.beginPath(); x.ellipse(-R * 0.12, -R * 0.42, R * 0.78, R * 0.42, -0.35, 0, TAU);
  g = x.createLinearGradient(0, -R, 0, -R * 0.05); g.addColorStop(0, 'rgba(255,255,255,0.65)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fill();
  // printed rim
  x.beginPath(); x.arc(0, 0, R - R * 0.025, 0, TAU); x.lineWidth = R * 0.05; x.strokeStyle = '#a3004f'; x.stroke();
  x.beginPath(); x.arc(0, 0, R * 0.86, 0, TAU); x.lineWidth = R * 0.025; x.strokeStyle = 'rgba(255,255,255,0.75)'; x.setLineDash([R * 0.09, R * 0.07]); x.stroke(); x.setLineDash([]);
  x.restore();
  // the word, a little crooked
  const word = typeSprite('-30%', { size: 10, face: 'white' });
  const sz = Math.floor((10 * R * 1.42) / word.inkW);
  const cap = capOf(DISPLAY, sz);
  const w = typeSprite('-30%', { size: sz, face: 'white', ext: cap * 0.12, line: Math.max(2, cap * 0.07), extColor: '#5a0030', lineColor: '#5a0030' });
  x.save(); x.translate(-R * 0.08, -R * 0.12); x.rotate((-10 * Math.PI) / 180);
  x.drawImage(w.c, -w.pad - w.inkW / 2, -w.oy + cap / 2); x.restore();
  // the flap: the lifted cap folded back across the fold line, white backing paper, curling
  x.save();
  x.beginPath(); x.arc(k, k, R, 0, TAU); x.clip();
  x.beginPath(); x.moveTo(-3 * R, k + 3 * R); x.lineTo(k + 3 * R, -3 * R); x.lineTo(-3 * R, -3 * R); x.closePath(); x.clip();
  x.shadowColor = 'rgba(70,0,40,0.55)'; x.shadowBlur = R * 0.12; x.shadowOffsetX = -R * 0.04; x.shadowOffsetY = R * 0.05;
  const n = Math.SQRT1_2;
  g = x.createLinearGradient((k / 2) * 1, (k / 2) * 1, (k / 2) - R * 0.5 * n, (k / 2) - R * 0.5 * n);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#f1f2f8'); g.addColorStop(1, '#a9adc4');
  x.fillStyle = g; x.fillRect(-2 * R, -2 * R, 5 * R, 5 * R);
  x.restore();
  // a crisp edge on the flap's curve
  x.save(); x.beginPath(); x.moveTo(-3 * R, k + 3 * R); x.lineTo(k + 3 * R, -3 * R); x.lineTo(-3 * R, -3 * R); x.closePath(); x.clip();
  x.beginPath(); x.arc(k, k, R, 0, TAU); x.lineWidth = R * 0.025; x.strokeStyle = '#8c90a8'; x.stroke(); x.restore();
  return { c, C, R };
}
const sticker = buildSticker(F.sticker);
function drawSticker(t) {
  const x = frac(t + 0.5), air = 0.3; // hops on the off-beat
  const u = x < air ? x / air : 0;
  const hop = F.sticker.r * 0.14 * 4 * u * (1 - u);
  ox.drawImage(sticker.c, Math.round(F.sticker.x - sticker.C), Math.round(F.sticker.y - sticker.C - hop));
}

// The starburst: sixteen glossy red points with a yellow rim and a hard navy shadow, turning
// slowly (six of its own steps a loop) and pumping on the beat; the word swaps yellow and white.
const B = F.burst;
const burstWords = (() => {
  const probe = typeSprite(B.word, { size: 10 });
  const sz = Math.floor((10 * B.r * 1.28) / probe.inkW), cap = capOf(DISPLAY, sz);
  const o = { size: sz, ext: cap * 0.13, line: Math.max(2, cap * 0.08), extColor: '#3a0000', lineColor: '#3a0000' };
  return { a: typeSprite(B.word, { ...o, face: 'yellow' }), b: typeSprite(B.word, { ...o, face: 'white' }), cap };
})();
function burstPath(x, R, rot) {
  const N = 16;
  x.beginPath();
  for (let i = 0; i < N * 2; i++) { const a = (i / (N * 2)) * TAU + rot, r = i % 2 ? R * 0.76 : R; x.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
  x.closePath();
}
function drawBurst(t) {
  const xb = frac(t), atk = 0.07;
  const pulse = xb < atk ? Math.exp(-(1 - atk) * 4.5) + (1 - Math.exp(-(1 - atk) * 4.5)) * ease(xb / atk) : Math.exp(-(xb - atk) * 4.5);
  const s = 0.9 + 0.11 * pulse, R = B.r * s, rot = ((11.25 * t) * Math.PI) / 180;
  ox.save(); ox.translate(B.x, B.y);
  const sh = B.r * 0.085;
  ox.save(); ox.translate(sh, sh); burstPath(ox, R, rot); ox.fillStyle = NAVY; ox.fill(); ox.restore();
  burstPath(ox, R, rot);
  ox.lineJoin = 'round'; ox.lineWidth = B.r * 0.1; ox.strokeStyle = INK; ox.stroke();
  const g = ox.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.05, 0, 0, R);
  g.addColorStop(0, '#ff9a80'); g.addColorStop(0.3, '#ff3b22'); g.addColorStop(0.7, '#e80800'); g.addColorStop(1, '#a00000');
  ox.fillStyle = g; ox.fill();
  ox.lineWidth = B.r * 0.045; ox.strokeStyle = '#ffe11a'; ox.stroke();
  ox.save(); burstPath(ox, R * 0.97, rot); ox.clip();
  ox.beginPath(); ox.ellipse(-R * 0.08, -R * 0.42, R * 0.78, R * 0.4, -0.2, 0, TAU);
  const gl2 = ox.createLinearGradient(0, -R * 0.85, 0, -R * 0.05); gl2.addColorStop(0, 'rgba(255,255,255,0.55)'); gl2.addColorStop(1, 'rgba(255,255,255,0)');
  ox.fillStyle = gl2; ox.fill(); ox.restore();
  // the word, pumping with the burst
  const f = flip(t), w = burstWords;
  ox.scale(s, s); ox.rotate((-8 * Math.PI) / 180);
  const dx = -w.a.pad - w.a.inkW / 2, dy = -w.a.oy + w.cap / 2;
  ox.drawImage(w.a.c, dx, dy);
  if (f > 0) { ox.globalAlpha = f; ox.drawImage(w.b.c, dx, dy); }
  ox.restore();
}

// The strips: a chunky yellow sale tape at a slant, running off both edges, black lettering that
// flashes red; tucked under it at the same angle a slim navy tape with white lettering.
function buildStrip(it, ink) {
  const ang = (it.angle * Math.PI) / 180, L = W / Math.cos(ang) + 240, Hs = it.h;
  const span = Math.ceil(Math.abs(L * Math.sin(ang)) + Hs * Math.cos(ang)) + 60;
  const c = canvas(W, span), x = c.getContext('2d'), cy = span / 2;
  const sh = it.sub ? Hs * 0.16 : Hs * 0.11;
  const band = (dx, dy) => { x.setTransform(1, 0, 0, 1, W / 2 + dx, cy + dy); x.rotate(ang); };
  band(sh, sh); x.fillStyle = it.sub ? 'rgba(2,4,40,0.9)' : NAVY; x.fillRect(-L / 2, -Hs / 2, L, Hs);
  band(0, 0);
  let g = x.createLinearGradient(0, -Hs / 2, 0, Hs / 2);
  if (it.sub) { g.addColorStop(0, '#2c46d8'); g.addColorStop(0.1, '#16259e'); g.addColorStop(0.5, '#0d1780'); g.addColorStop(0.53, '#0a1268'); g.addColorStop(1, '#050a48'); }
  else { g.addColorStop(0, '#fffbd0'); g.addColorStop(0.08, '#fff36a'); g.addColorStop(0.46, '#ffe714'); g.addColorStop(0.5, '#ffd400'); g.addColorStop(0.9, '#f7b400'); g.addColorStop(1, '#d08c00'); }
  x.fillStyle = g; x.fillRect(-L / 2, -Hs / 2, L, Hs);
  // crisp edges: a dark keyline outside, pinstripes inside
  x.fillStyle = it.sub ? '#000022' : INK;
  const kl = Math.max(2, Hs * 0.03);
  x.fillRect(-L / 2, -Hs / 2 - kl, L, kl); x.fillRect(-L / 2, Hs / 2, L, kl);
  if (!it.sub) {
    x.fillStyle = 'rgba(200,120,0,0.75)';
    const p = Hs * 0.1, t = Math.max(2, Hs * 0.022);
    x.fillRect(-L / 2, -Hs / 2 + p, L, t); x.fillRect(-L / 2, Hs / 2 - p - t, L, t);
    x.fillStyle = 'rgba(255,255,255,0.6)';
    x.fillRect(-L / 2, -Hs / 2 + p + t, L, t * 0.6);
  } else {
    x.fillStyle = 'rgba(120,150,255,0.8)'; x.fillRect(-L / 2, -Hs / 2, L, Math.max(1.5, Hs * 0.035));
  }
  // the lettering
  x.setTransform(1, 0, 0, 1, 0, 0);
  const font = it.sub ? TAPE : DISPLAY;
  const ls = it.sub ? it.cap * 0.32 : it.cap * 0.04;
  const probe = inkOf(it.s, font, 100, SKEW, ls * 100 / it.cap);
  const size = Math.round((it.cap / capOf(font, 100)) * 100);
  const spr = typeSprite(it.s, it.sub
    ? { font, size, ls, face: 'white', ext: it.cap * 0.1, line: 0, extColor: '#000020' }
    : { font, size, ls, face: ink, ext: it.cap * 0.07, line: 0, extColor: 'rgba(150,80,0,0.55)', bevel: 0.025 });
  band(it.dx, 0);
  x.drawImage(spr.c, -spr.pad - spr.inkW / 2, -spr.oy + spr.cap / 2);
  void probe;
  return { c, y: Math.round(it.y - cy) };
}
const strips = F.strips.map((it) => ({ it, states: it.sub ? [buildStrip(it, 'white')] : [buildStrip(it, 'black'), buildStrip(it, 'red')] }));
function drawStrips(t) {
  const f = flip(t);
  for (const { states } of strips) {
    ox.drawImage(states[0].c, 0, states[0].y);
    if (states[1] && f > 0) { ox.globalAlpha = f; ox.drawImage(states[1].c, 0, states[1].y); ox.globalAlpha = 1; }
  }
}

// Sparkles: glowing four-point lens glints that twinkle once a second and then pop up at the
// next spot, wandering round the banner.
const STAR = new Path2D('M0,-1 C0.05,-0.2 0.2,-0.05 1,0 C0.2,0.05 0.05,0.2 0,1 C-0.05,0.2 -0.2,0.05 -1,0 C-0.2,-0.05 -0.05,-0.2 0,-1Z');
function glint(x, y, R, e, rot) {
  if (e <= 0.001) return;
  ox.save(); ox.translate(x, y);
  ox.globalCompositeOperation = 'lighter';
  let g = ox.createRadialGradient(0, 0, 0, 0, 0, R * 1.1 * e);
  g.addColorStop(0, 'rgba(200,235,255,0.75)'); g.addColorStop(0.25, 'rgba(120,190,255,0.3)'); g.addColorStop(1, 'rgba(60,120,255,0)');
  ox.fillStyle = g; ox.beginPath(); ox.arc(0, 0, R * 1.1 * e, 0, TAU); ox.fill();
  // long thin flares, like a cross filter on the studio camera
  for (const [w, h] of [[R * 2.6, R * 0.05], [R * 0.05, R * 1.9]]) {
    const lg = w > h ? ox.createLinearGradient(-w * e, 0, w * e, 0) : ox.createLinearGradient(0, -h * e, 0, h * e);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.85)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    ox.fillStyle = lg; ox.fillRect(-w * e, -h * e, w * 2 * e, h * 2 * e);
  }
  ox.globalCompositeOperation = 'source-over';
  ox.rotate(rot); ox.scale(R * e, R * e);
  ox.shadowColor = 'rgba(255,255,255,0.9)'; ox.shadowBlur = R * 0.35;
  ox.fillStyle = '#ffffff'; ox.fill(STAR);
  ox.restore();
}
function drawSparkles(t) {
  for (const s of F.sparkles) {
    const spots = [[s.x, s.y], ...(s.at || [])];
    const c = t + (s.ph ? 0.5 : 0); // one twinkle a second; the second one is half a cycle behind
    const k = frac(c), spot = spots[Math.floor(c) % spots.length];
    const e = k < 0.75 ? Math.pow(Math.sin((Math.PI * k) / 0.75), 0.8) : 0;
    glint(spot[0], spot[1], F.spark, e, (k * Math.PI) / 4);
  }
}

// The crawl: a broadcast lower third on the bottom edge. A gold rule, a glossy navy bar and the
// five lines in slanted yellow, separated by stars, crawling right to left, a whole number of
// passes per loop.
const T = F.ticker;
const crawl = (() => {
  const th = T.h, rule = Math.max(4, Math.round(th * 0.07));
  const cap = Math.round((th - rule) * 0.4);
  const size = Math.round((cap / capOf(CRAWL, 100)) * 100);
  const pieces = TICKER.map((s) => typeSprite(s, { font: CRAWL, size, face: 'yellow', ext: Math.max(2, cap * 0.09), line: 0, extColor: '#01031f', bevel: 0.02 }));
  const starR = cap * 0.62, gap = cap * 0.9;
  const L = Math.round(pieces.reduce((n, p) => n + p.inkW + gap * 2 + starR * 2, 0));
  const h = Math.max(...pieces.map((p) => p.c.height));
  const oy = Math.max(...pieces.map((p) => p.oy));
  const strip = canvas(L + 40, h), x = strip.getContext('2d');
  let at = 0;
  for (const p of pieces) {
    x.drawImage(p.c, at - p.pad, oy - p.oy);
    at += p.inkW + gap;
    // a glossy gold star
    x.save(); x.translate(at + starR, oy - cap / 2);
    x.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, r = i % 2 ? starR * 0.42 : starR; x.lineTo(Math.sin(a) * r, -Math.cos(a) * r); } x.closePath();
    x.save(); x.translate(2, 2); x.fillStyle = '#01031f'; x.fill(); x.restore();
    const g = x.createLinearGradient(0, -starR, 0, starR); g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#fff35c'); g.addColorStop(0.55, '#ffcf00'); g.addColorStop(1, '#f09a00');
    x.fillStyle = g; x.fill(); x.restore();
    at += starR * 2 + gap;
  }
  // the bar, drawn once
  const bar = canvas(W, th), b = bar.getContext('2d');
  let g = b.createLinearGradient(0, rule, 0, th);
  g.addColorStop(0, '#2638c4'); g.addColorStop(0.08, '#1426a8'); g.addColorStop(0.5, '#0b178a'); g.addColorStop(0.52, '#08126e'); g.addColorStop(1, '#040a4a');
  b.fillStyle = g; b.fillRect(0, rule, W, th - rule);
  g = b.createLinearGradient(0, 0, 0, rule);
  g.addColorStop(0, '#fff9b8'); g.addColorStop(0.4, '#ffe21a'); g.addColorStop(1, '#d99a00');
  b.fillStyle = g; b.fillRect(0, 0, W, rule);
  b.fillStyle = '#01031f'; b.fillRect(0, rule, W, Math.max(2, rule * 0.35));
  const passes = Math.max(1, Math.round((T.speed * DURATION) / L));
  const textY = rule + (th - rule) / 2 + cap / 2 - oy; // the strip's top, so caps sit centred in the bar
  return { strip, bar, L, passes, textY, rule };
})();
function drawCrawl(t) {
  const M = crawl, y0 = tickerTop;
  ox.drawImage(M.bar, 0, y0);
  // phased so that frame 12, the still everyone sees, opens on "But wait…"
  const lead = Math.round(W * 0.025);
  const start = (0.4 / DURATION) * M.L * M.passes + lead;
  const off = ((((t / DURATION) * M.L * M.passes - start) % M.L) + M.L) % M.L;
  ox.save(); ox.beginPath(); ox.rect(0, y0 + M.rule, W, T.h - M.rule); ox.clip();
  for (let x = -off; x < W; x += M.L) ox.drawImage(M.strip, Math.round(x), Math.round(y0 + M.textY));
  ox.restore();
}

// ---------- the timeline ----------
function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(t);
  // the blinking lines: yellow on the beat, white on the off-beat
  ux.clearRect(0, 0, W, H);
  const f = flip(t);
  for (const L of typeLayers) if (L.b) {
    ux.globalAlpha = 1; ux.drawImage(L.a.c, L.x, L.y);
    if (f > 0) { ux.globalAlpha = f; ux.drawImage(L.b.c, L.x, L.y); }
  }
  ux.globalAlpha = 1;
  ox.clearRect(0, 0, W, H);
  drawSticker(t);
  drawBurst(t);
  drawStrips(t);
  drawSparkles(t);
  drawCrawl(t);
}

window.comp = { duration: DURATION, fps: FPS, width: W, height: H, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
