// The approved banner (gif-plinth-e) in the look of our old ad, the 30% OFF Channel (broadcast):
// the same blue studio backdrop, the slanted heavy sale type with hard navy shadows, the chrome
// globe, yellow and red. The content and its places are the approved layout's, nothing more:
// the stacked message, the chrome globe hovering and spinning over a chrome Tuscan column, the
// pink -30% sticker, the WOW! burst, on the desktop banner the yellow EVERY SITE 30% OFF! strip
// with the navy Gary Mustard Enterprises tape under it, a few glints, and the crawl.
// Formats: banner-v (1080x2025), banner-h (1170x834), 1x1 (1080x1080).
// ?h= renders a format at another height: the crawl stays on the bottom edge, the globe stays
// level with the message and the column's shaft grows down to the crawl (the strips go with it),
// as in gif-plinth-e.
// For the live banner's still artwork: ?crawl=0 (no crawl), ?only=0 (no BLACK FRIDAY ONLY!),
// ?glints=0 (no sparkles), ?burst=0 (no starburst), ?sticker=0, ?strips=0. ?white=1: a white column.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, materials } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// broadcast.css
const YELLOW = '#fff035', SHADE = '#0a0f66', RED = '#ff1616', DROP = 'rgba(6,8,70,0.95)', HARD = 'rgba(6,8,70,0.9)';
const SKEW = Math.tan((9 * Math.PI) / 180); // skewX(-9deg)
const BLACK = (s) => `400 ${s}px "Archivo Black"`;
const ARIMO = (s) => `italic 700 ${s}px Arimo`;

// The crawl: exactly these lines, in this order, looping.
const TICKER = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];

// Layout in stage px, measured from gif-plinth-e's FORMATS (GIF px x P).
// type: groups of lines sharing one size; each line is [text, x, top, width, height] of the
// approved lettering (x is the centre, or the left edge with align 'l'). The new type is as big as
// fits every box across (fitW), no taller than maxH x the approved lettering, centred on the box.
const COL = { shaft: 1.5, wide: 1.4, gap: 0.18, steps: 2, bob: 0.05 };
const FORMATS = {
  'banner-v': {
    w: 1080, h: 2025,
    type: [
      { st: 'pct', align: 'c', fitW: 1.0, maxH: 1.1, lines: [['30%', 543, 48, 690, 210], ['OFF', 543, 324, 690, 210]] },
      { st: 'title', align: 'c', fitW: 0.98, maxH: 1.2, lines: [['EVERYTHING', 540, 624, 948, 84], ['ON THE', 540, 744, 564, 84], ['INTERNET.', 540, 864, 804, 84]] },
      { st: 'only', align: 'c', fitW: 1.0, maxH: 1.3, lines: [['BLACK', 306, 1056, 384, 60], ['FRIDAY', 306, 1164, 444, 60], ['ONLY!', 306, 1272, 372, 60]] },
    ],
    globe: { x: 756, y: 1212, d: 384 },
    glow: { rx: 648, ry: 729 },
    sticker: { x: 912, y: 1068, r: 90 },
    burst: { x: 264, y: 1506, r: 132, word: 'WOW!' },
    strips: [
      { sub: true, y: 1620, h: 68, angle: -6, dx: 18, s: 'GARY MUSTARD ENTERPRISES', cap: 30 },
      { y: 1518, h: 126, angle: -6, dx: 12, s: 'EVERY SITE 30% OFF!', cap: 54 },
    ],
    sparkles: [
      { x: 84, y: 84, ph: 0, at: [[960, 600], [120, 552], [900, 852]] },
      { x: 996, y: 372, ph: 1, at: [[600, 996], [144, 948], [1008, 1440]] },
      { x: 492, y: 1056, ph: 0, at: [[84, 1380], [1008, 60], [372, 576]] },
    ],
    spark: 100, ticker: { h: 132, speed: 360 },
  },
  'banner-h': {
    w: 1170, h: 834,
    type: [
      { st: 'pct', align: 'l', fitW: 1.0, maxH: 1.1, lines: [['30%', 45, 35, 575, 175], ['OFF', 45, 260, 575, 175]] },
      { st: 'title', align: 'l', fitW: 1.0, maxH: 1.35, lines: [['EVERYTHING ON', 40, 500, 515, 35], ['THE INTERNET.', 40, 560, 495, 35]] },
      { st: 'only', align: 'l', fitW: 1.0, maxH: 1.35, lines: [['BLACK FRIDAY ONLY!', 40, 635, 705, 35]] },
    ],
    globe: { x: 980, y: 185, d: 320 },
    glow: { rx: 538, ry: 517 },
    sticker: { x: 860, y: 150, r: 70 },
    burst: { x: 690, y: 490, r: 90, word: 'HOT!' },
    strips: [],
    sparkles: [{ x: 730, y: 110, ph: 1, at: [[1140, 50], [590, 490], [850, 710]] }],
    spark: 84, ticker: { h: 85, speed: 300 },
  },
  '1x1': {
    w: 1080, h: 1080,
    type: [
      { st: 'pct', align: 'l', fitW: 1.0, maxH: 1.1, lines: [['30%', 44, 40, 460, 140], ['OFF', 44, 228, 460, 140]] },
      { st: 'title', align: 'l', fitW: 0.98, maxH: 1.2, lines: [['EVERYTHING', 44, 432, 632, 56], ['ON THE', 44, 512, 376, 56], ['INTERNET.', 44, 592, 536, 56]] },
      { st: 'only', align: 'l', fitW: 1.0, maxH: 1.3, lines: [['BLACK FRIDAY', 44, 696, 600, 40], ['ONLY!', 44, 768, 248, 40]] },
    ],
    globe: { x: 888, y: 360, d: 360 },
    glow: { rx: 648, ry: 460 },
    sticker: { x: 1000, y: 224, r: 72 },
    burst: { x: 448, y: 888, r: 96, word: 'NEW!' },
    strips: [],
    sparkles: [
      { x: 560, y: 120, ph: 0, at: [[80, 912], [1048, 56], [600, 400]] },
      { x: 608, y: 600, ph: 1, at: [[720, 944], [496, 32], [1048, 680]] },
    ],
    spark: 80, ticker: { h: 88, speed: 240 },
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
const W = F.w, H = F.h, G = F.globe, U = G.d / 2.12; // U: stage px per world unit (globe radius 1)
const tickerTop = H - F.ticker.h;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = W + 'px';
stage.style.height = H + 'px';
const $ = (s) => document.querySelector(s);
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const layer = (sel) => { const c = $(sel); c.width = W; c.height = H; c.style.width = W + 'px'; c.style.height = H + 'px'; return c.getContext('2d'); };

// ---------- the backdrop: broadcast.css .bg, its light centred just under the globe ----------
$('.bg').style.background = `radial-gradient(ellipse ${F.glow.rx}px ${F.glow.ry}px at ${G.x}px ${Math.round(G.y + U * 0.4)}px, #5fd0ff 0%, #2f95ff 22%, #1450f8 44%, rgba(10,34,214,0) 72%), linear-gradient(#0a1cc4, #0a22d6 45%, #070f9c)`;

await Promise.all([BLACK(100), ARIMO(100)].map((f) => document.fonts.load(f)));

// ---------- lettering ----------
function scanBounds(c, thr = 100) {
  const w = c.width, h = c.height, d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] >= thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}
function setFont(x, font, ls) { x.font = font; x.letterSpacing = (ls || 0) + 'px'; x.textBaseline = 'alphabetic'; x.textAlign = 'left'; }
// the ink box of a line of type relative to its origin (left end of the baseline), slanted by k
function inkOf(text, font, size, k, ls = 0) {
  const c = canvas(size * (text.length * 1.1 + 2), size * 2.2), x = c.getContext('2d', { willReadFrequently: true });
  const ox = size * 0.6, oy = size * 1.5;
  setFont(x, font(size), ls); x.setTransform(1, 0, -k, 1, ox, oy); x.fillStyle = '#fff'; x.fillText(text, 0, 0);
  const b = scanBounds(c);
  return { x0: b.x0 - ox, y0: b.y0 - oy, x1: b.x1 - ox, y1: b.y1 - oy };
}
const caps = new Map();
const capOf = (font, size) => { const key = font(size); if (!caps.has(key)) { const b = inkOf('H', font, size, 0); caps.set(key, b.y1 - b.y0); } return caps.get(key); };
const tint = (src, color) => { const c = canvas(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height); return c; };

// The type treatments of broadcast.css, as a function of the font size:
//   pct    .offer .pct/.off: Archivo Black, letter-spacing -0.05em, skewX(-9deg), a solid navy
//          extrusion (six 2px steps at 236px)
//   title  .title: Arimo bold italic, letter-spacing -0.04em, white fading to pale blue, one hard
//          navy drop shadow (8px at 176px)
//   crawl  .ticker.bottom: Archivo Black, letter-spacing -0.02em, skewX(-9deg), three 3px steps at 112px
const STY = {
  pct: { font: BLACK, k: SKEW, ls: -0.05, fill: YELLOW, steps: 6, step: 2 / 236 },
  only: { font: BLACK, k: SKEW, ls: -0.03, fill: YELLOW, blink: '#ffffff', steps: 4, step: 2 / 150 },
  title: { font: ARIMO, k: 0, ls: -0.04, fill: 'title', drop: 8 / 176 },
  crawl: { font: BLACK, k: SKEW, ls: -0.02, fill: YELLOW, steps: 3, step: 3 / 112 },
};
// One line of type as a sprite, with where its baseline origin and ink sit inside it.
function typeSprite(text, size, { font, k = 0, ls = 0, fill, steps = 0, step = 0, drop = 0, shade = SHADE }) {
  const L = ls * size, b = inkOf(text, font, size, k, L), cap = capOf(font, size);
  const depth = Math.round(steps * step * size), dd = Math.round(drop * size);
  const pad = 4, ext = Math.max(depth, dd);
  const w = b.x1 - b.x0 + pad * 2 + ext, h = b.y1 - b.y0 + pad * 2 + ext;
  const ox = pad - b.x0, oy = pad - b.y0;
  const M = canvas(w, h), m = M.getContext('2d');
  setFont(m, font(size), L); m.setTransform(1, 0, -k, 1, ox, oy); m.fillStyle = '#fff'; m.fillText(text, 0, 0);
  const S = canvas(w, h), s = S.getContext('2d');
  if (depth) { const T = tint(M, shade); for (let i = depth; i >= 1; i--) s.drawImage(T, i, i); }
  if (dd) s.drawImage(tint(M, DROP), dd, dd);
  let face;
  if (fill === 'title') { // background: linear-gradient(#ffffff 35%, #c5d4fb 100%) over a 0.9 line box
    face = M.getContext('2d').createLinearGradient(0, oy - size * 0.75, 0, oy + size * 0.15);
    face.addColorStop(0.35, '#ffffff'); face.addColorStop(1, '#c5d4fb');
  } else face = fill;
  const Fc = canvas(w, h), f = Fc.getContext('2d');
  f.fillStyle = face; f.fillRect(0, 0, w, h); f.globalCompositeOperation = 'destination-in'; f.drawImage(M, 0, 0);
  s.drawImage(Fc, 0, 0);
  return { c: S, ox, oy, cap, pad, inkW: b.x1 - b.x0 };
}
const fitSize = (text, font, k, ls, width) => { const b = inkOf(text, font, 100, k, ls * 100); return (width / (b.x1 - b.x0)) * 100; };

// ---------- the message ----------
const typeCtx = layer('#type'), blinkCtx = layer('#blink');
const blinkers = [];
for (const grp of F.type) {
  if (grp.st === 'only' && q.get('only') === '0') continue; // ?only=0: the live banner shows the price card here instead
  const st = STY[grp.st];
  let size = Infinity;
  for (const [s, , , bw, bh] of grp.lines) size = Math.min(size, fitSize(s, st.font, st.k, st.ls, bw * grp.fitW), (bh * grp.maxH * 100) / capOf(st.font, 100));
  size = Math.floor(size);
  for (const [s, x, top, , bh] of grp.lines) {
    const a = typeSprite(s, size, st);
    const baseline = top + bh / 2 + a.cap / 2;
    const px = Math.round(grp.align === 'l' ? x - a.pad : x - a.pad - a.inkW / 2), py = Math.round(baseline - a.oy);
    if (st.blink) blinkers.push({ a, b: typeSprite(s, size, { ...st, fill: st.blink }), x: px, y: py });
    else typeCtx.drawImage(a.c, px, py);
  }
}

// ---------- the chrome monument: the globe hovering over a Tuscan column ----------
const gl = $('#gl');
const FOV = 10, DIST = 30, PR = Number(q.get('pr') || 2); // a long lens, as gif-plinth-e; rendered at 2x, shown at 1x
const { renderer, scene, camera } = createStage({ canvas: gl, width: 16, height: 16, pixelRatio: PR, fov: FOV });
renderer.shadowMap.enabled = false;
const pivot = new THREE.Group();
scene.add(pivot);
// ?white=1: the column in satin white instead of chrome (its shade lifted a little with a pale
// lavender, so it stays white on its dark side). The globe keeps its chrome.
const WHITE = q.get('white') === '1';
const white = () => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0.62, envMapIntensity: 0.3,
  emissive: new THREE.Color(0xc6cbee), emissiveIntensity: 0.3 });
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
pivot.add(globe);
// the lettered cut faces keep their full sign yellow and red (no tone-mapping squeeze)
globe.traverse((o) => { if (o.isMesh && o.material.map) o.material.toneMapped = false; });

// A Tuscan order in chrome (gif-plinth-e's buildColumn): square abacus, ovolo echinus, a collar,
// a fluted shaft with entasis, a torus, a square plinth and steps. y runs down from the globe's
// south pole; wide scales it across; gap is the air between the globe and the abacus.
function buildColumn({ shaft = 3, flutes = 12, steps = 1, wide = 1, gap = 0 } = {}) {
  const mat = WHITE ? white() : materials.chrome();
  mat.envMap = scene.environment;
  mat.envMapRotation.set((15 * Math.PI) / 180, 0, 0); // the studio turned a little so the fronts catch the softboxes
  const col = new THREE.Group(), pts = [];
  let y = -1.035 - gap;
  const abacusTop = y;
  const add = (m) => { col.add(m); return m; };
  // the square mouldings: rounded edges that catch the softboxes, and the studio tilted the other
  // way so their faces mirror the deep blue of the set rather than a flat white card
  const smat = WHITE ? white() : materials.chrome();
  smat.envMap = scene.environment;
  smat.envMapRotation.set((-10 * Math.PI) / 180, 0, 0);
  const slab = (w, h) => {
    const m = add(new THREE.Mesh(roundedBox(w, h, w, Math.min(0.04, h * 0.3)), smat));
    m.position.y = y - h / 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [y, y - h]) pts.push(new THREE.Vector3(sx * w / 2, yy, sz * w / 2));
    y -= h;
  };
  const lathe = (prof, h) => { add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, v]) => new THREE.Vector2(r, y - h + v * h)), 96), mat)); y -= h; };
  const rTop = 0.33, rBot = 0.39;
  slab(1.06, 0.17); // abacus
  { const prof = []; for (let i = 0; i <= 16; i++) { const s = i / 16; prof.push([rTop + 0.03 + (0.5 - rTop - 0.03) * Math.sin((s * Math.PI) / 2), s]); } lathe(prof, 0.19); } // echinus
  { const tor = add(new THREE.Mesh(new THREE.TorusGeometry(rTop + 0.03, 0.045, 16, 96), mat)); tor.rotation.x = Math.PI / 2; tor.position.y = y - 0.07; } // collar
  lathe([[rTop + 0.01, 0], [rTop + 0.01, 1]], 0.14); // neck
  { // the fluted shaft
    const M = 12, N = flutes * M, NY = 48, h = shaft, depth = 0.055, pos = [], idx = [];
    for (let j = 0; j <= NY; j++) {
      const v = j / NY, R = rBot - (rBot - rTop) * Math.pow(1 - v, 1.6);
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * TAU + Math.PI / flutes, ph = (i % M) / M;
        const r = R - depth * Math.sqrt(Math.max(0, 1 - (2 * ph - 1) ** 2));
        pos.push(r * Math.sin(th), y - v * h, r * Math.cos(th));
      }
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
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
  return { col, pts, abacusTop };
}
function roundedBox(w, h, d, r) {
  // a box with its edges rounded by r (an extruded rounded rectangle, bevelled top and bottom)
  const s = new THREE.Shape(), x0 = -w / 2 + r * 0.4, z0 = -d / 2 + r * 0.4, ww = w - r * 0.8, dd = d - r * 0.8, rr = r * 0.6;
  s.moveTo(x0 + rr, z0); s.lineTo(x0 + ww - rr, z0); s.quadraticCurveTo(x0 + ww, z0, x0 + ww, z0 + rr);
  s.lineTo(x0 + ww, z0 + dd - rr); s.quadraticCurveTo(x0 + ww, z0 + dd, x0 + ww - rr, z0 + dd);
  s.lineTo(x0 + rr, z0 + dd); s.quadraticCurveTo(x0, z0 + dd, x0, z0 + dd - rr); s.lineTo(x0, z0 + rr); s.quadraticCurveTo(x0, z0, x0 + rr, z0);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - r * 2, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.4, bevelSegments: 6, curveSegments: 8 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -(h - r * 2) / 2, 0);
  g.computeVertexNormals();
  return g;
}
// the shaft grows by the extra height, so the column still stands on the crawl
const C3 = buildColumn({ ...COL, shaft: COL.shaft + GROUND / U });
scene.add(C3.col);
const bobAt = (t) => COL.bob * Math.sin((TAU * t) / 4);

// the soft shadow blob of broadcast's plinth (stage.js makePlinth), on the abacus under the globe
const blob = (() => {
  const c = canvas(256, 256), g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(10,16,60,0.6)'); r.addColorStop(0.55, 'rgba(10,16,60,0.21)'); r.addColorStop(1, 'rgba(10,16,60,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = C3.abacusTop + 0.003;
  scene.add(m);
  return m;
})();

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
const DW = Math.ceil(bx1) + 6 - GX0, DH = Math.min(Math.ceil(by1) + 6, tickerTop - G.y) - GY0; // it stands on the crawl
camera.setViewOffset(FULL, FULL, FULL / 2 + GX0, FULL / 2 + GY0, DW, DH);
renderer.setSize(DW, DH, false);
Object.assign(gl.style, { left: G.x + GX0 + 'px', top: G.y + GY0 + 'px', width: DW + 'px', height: DH + 'px' });

const YAW0 = -25, TURN = 4, HOLD_T = 0.4; // three turns a loop, easing to a near-stop on the hero pose (the cut three-quarter on)
const yawAt = (t) => { const u = (t - HOLD_T) / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.7 * Math.sin(TAU * u); };
function drawGlobe(t) {
  pivot.rotation.y = yawAt(t);
  pivot.position.y = bobAt(t);
  const lift = (pivot.position.y + COL.bob) / (2 * COL.bob); // 0 low .. 1 high
  blob.material.opacity = 1 - 0.35 * lift;
  blob.scale.setScalar(0.92 + 0.16 * lift);
  renderer.render(scene, camera);
}

// ---------- the overlay: sticker, burst, strips, glints, crawl ----------
const ox = layer('#over');
const ease = (x) => x * x * (3 - 2 * x);
const frac = (x) => x - Math.floor(x);
// two states on the 2 Hz beat with a short crossfade: 0 for the first half second, 1 for the second
const FADE = 0.06;
const flip = (t) => { const x = frac(t); return x < FADE ? 1 - ease(x / FADE) : x < 0.5 ? 0 : x < 0.5 + FADE ? ease((x - 0.5) / FADE) : 1; };

// The -30% sticker: a pink dot in the manner of broadcast's yellow oval (a radial highlight, an
// inset rim, a hard navy shadow), white slanted lettering, its lower-right edge peeling up to
// show the white back. It hops on the off-beat.
function buildSticker({ r: R }) {
  const S = Math.ceil(R * 2.6), c = canvas(S, S), x = c.getContext('2d'), C = Math.round(S / 2 - R * 0.06);
  const k = R * 0.95; // the fold line: x + y = k, from the centre
  const unpeeled = () => { x.beginPath(); x.moveTo(-3 * R, k + 3 * R); x.lineTo(k + 3 * R, -3 * R); x.lineTo(-3 * R, -3 * R); x.closePath(); x.clip(); };
  const disc = (cx = 0, cy = 0) => { x.beginPath(); x.arc(cx, cy, R, 0, TAU); };
  x.translate(C, C);
  x.save(); x.translate(R * 0.075, R * 0.085); unpeeled(); disc(); x.fillStyle = HARD; x.fill(); x.restore();
  x.save(); unpeeled(); disc(); x.clip();
  const g = x.createRadialGradient(-R * 0.2, -R * 0.4, 0, -R * 0.2, -R * 0.4, R * 1.45);
  g.addColorStop(0, '#ff9fd0'); g.addColorStop(0.72, '#ff2d95'); g.addColorStop(1, '#e8107c');
  x.fillStyle = g; x.fillRect(-2 * R, -2 * R, 4 * R, 4 * R);
  disc(); x.lineWidth = R * 0.09; x.strokeStyle = 'rgba(150,0,70,0.5)'; x.stroke(); // inset 0 0 0 4px
  x.restore();
  // the word, a little crooked
  const st = { ...STY.pct, fill: '#ffffff', steps: 4, step: 2 / 150 };
  const size = Math.floor(fitSize('-30%', BLACK, SKEW, st.ls, R * 1.52));
  const w = typeSprite('-30%', size, st);
  x.save(); x.translate(-R * 0.1, -R * 0.1); x.rotate((-10 * Math.PI) / 180);
  x.drawImage(w.c, Math.round(-w.pad - w.inkW / 2), Math.round(-w.oy + w.cap / 2)); x.restore();
  // the flap: the lifted cap folded back across the fold line, white backing paper
  x.save(); disc(k, k); x.clip(); unpeeled();
  x.shadowColor = 'rgba(6,8,70,0.45)'; x.shadowBlur = R * 0.08; x.shadowOffsetX = -R * 0.03; x.shadowOffsetY = R * 0.04;
  const fg = x.createLinearGradient(k / 2, k / 2, k / 2 - R * 0.35, k / 2 - R * 0.35);
  fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.5, '#eef0f7'); fg.addColorStop(1, '#b9bdd0');
  x.fillStyle = fg; x.fillRect(-2 * R, -2 * R, 5 * R, 5 * R);
  x.restore();
  return { c, C };
}
const sticker = buildSticker(F.sticker);
function drawSticker(t) {
  const x = frac(t + 0.5), air = 0.3; // a little hop on the off-beat
  const u = x < air ? x / air : 0;
  const hop = F.sticker.r * 0.14 * 4 * u * (1 - u);
  ox.drawImage(sticker.c, Math.round(F.sticker.x - sticker.C), Math.round(F.sticker.y - sticker.C - hop));
}

// The starburst: broadcast's red with a radial highlight, a black keyline (the price card's
// border) and a hard navy shadow; the word in the yellow slanted sale type, white on the
// off-beat. It pumps on the beat.
const B = F.burst;
const burstWord = (() => {
  const st = { ...STY.pct, steps: 4, step: 2 / 150 };
  const size = Math.floor(fitSize(B.word, BLACK, SKEW, st.ls, B.r * 1.3));
  return { a: typeSprite(B.word, size, st), b: typeSprite(B.word, size, { ...st, fill: '#ffffff' }) };
})();
function burstPath(R) {
  const N = 16;
  ox.beginPath();
  for (let i = 0; i < N * 2; i++) { const a = (i / (N * 2)) * TAU, r = i % 2 ? R * 0.76 : R; ox.lineTo(Math.sin(a) * r, -Math.cos(a) * r); }
  ox.closePath();
}
function drawBurst(t) {
  const xb = frac(t), atk = 0.07, rest = Math.exp(-(1 - atk) * 4.5);
  const pulse = xb < atk ? rest + (1 - rest) * ease(xb / atk) : Math.exp(-(xb - atk) * 4.5);
  const s = 0.9 + 0.1 * pulse, R = B.r;
  ox.save(); ox.translate(B.x, B.y); ox.scale(s, s);
  ox.save(); ox.translate(R * 0.07, R * 0.08); burstPath(R); ox.fillStyle = HARD; ox.fill(); ox.restore();
  burstPath(R);
  const g = ox.createRadialGradient(-R * 0.2, -R * 0.4, 0, -R * 0.2, -R * 0.4, R * 1.5);
  g.addColorStop(0, '#ff8a6e'); g.addColorStop(0.72, RED); g.addColorStop(1, '#d40000');
  ox.fillStyle = g; ox.fill();
  ox.lineJoin = 'round'; ox.lineWidth = Math.max(3, R * 0.04); ox.strokeStyle = '#000'; ox.stroke();
  const f = flip(t), w = burstWord;
  ox.rotate((-8 * Math.PI) / 180);
  const dx = Math.round(-w.a.pad - w.a.inkW / 2), dy = Math.round(-w.a.oy + w.a.cap / 2);
  ox.drawImage(w.a.c, dx, dy);
  if (f > 0) { ox.globalAlpha = f; ox.drawImage(w.b.c, dx, dy); }
  ox.restore();
}

// The strips, at a slant and running off both edges: broadcast's yellow pill (gradient, inset
// rim, hard navy shadow, black Arimo bold italic) stretched into a chunky tape, its lettering
// flashing red; tucked under it a slim navy tape with white lettering.
function buildStrip(it, ink) {
  const ang = (it.angle * Math.PI) / 180, L = W / Math.cos(ang) + 240, Hs = it.h;
  const span = Math.ceil(Math.abs(L * Math.sin(ang)) + Hs * Math.cos(ang)) + 60;
  const c = canvas(W, span), x = c.getContext('2d'), cy = span / 2;
  const band = (dx, dy) => { x.setTransform(1, 0, 0, 1, W / 2 + dx, cy + dy); x.rotate(ang); };
  const sh = Math.round(Hs * 0.085);
  if (!it.sub) { band(sh, sh); x.fillStyle = HARD; x.fillRect(-L / 2, -Hs / 2, L, Hs); }
  band(0, 0);
  if (it.sub) {
    x.fillStyle = SHADE; x.fillRect(-L / 2, -Hs / 2, L, Hs);
  } else {
    const g = x.createLinearGradient(0, -Hs / 2, 0, Hs / 2); g.addColorStop(0, '#fffb86'); g.addColorStop(1, '#f0e11c');
    x.fillStyle = g; x.fillRect(-L / 2, -Hs / 2, L, Hs);
    const rim = Math.max(3, Math.round(Hs * 0.055)); // inset 0 0 0 4px rgba(170,158,0,0.6)
    x.fillStyle = 'rgba(170,158,0,0.6)'; x.fillRect(-L / 2, -Hs / 2, L, rim); x.fillRect(-L / 2, Hs / 2 - rim, L, rim);
  }
  x.setTransform(1, 0, 0, 1, 0, 0);
  const st = it.sub
    ? { font: ARIMO, k: 0, ls: 0.14, fill: '#ffffff' }
    : { font: ARIMO, k: 0, ls: 0.01, fill: ink };
  const size = Math.round((it.cap * 100) / capOf(st.font, 100));
  const spr = typeSprite(it.s, size, st);
  band(it.dx, 0);
  x.drawImage(spr.c, -spr.pad - spr.inkW / 2, -spr.oy + spr.cap / 2);
  return { c, y: Math.round(it.y - cy) };
}
const strips = F.strips.map((it) => (it.sub ? [buildStrip(it, '#ffffff')] : [buildStrip(it, '#111111'), buildStrip(it, RED)]));
function drawStrips(t) {
  const f = flip(t);
  for (const [a, b] of strips) {
    ox.drawImage(a.c, 0, a.y);
    if (b && f > 0) { ox.globalAlpha = f; ox.drawImage(b.c, 0, b.y); ox.globalAlpha = 1; }
  }
}

// Glints: broadcast's four-point stars with a white glow, each flaring once a second and then
// popping up at its next spot.
const STAR = new Path2D('M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z');
function drawGlints(t) {
  for (const s of F.sparkles) {
    const spots = [[s.x, s.y], ...(s.at || [])];
    const c = t + (s.ph ? 0.5 : 0), p = frac(c) / 0.75; // visible for three quarters of a second
    if (p >= 1) continue;
    const [x, y] = spots[Math.floor(c) % spots.length], k = Math.sin(p * Math.PI), r = (F.spark / 2) * k;
    if (r < 0.5) continue;
    ox.save(); ox.translate(x, y); ox.rotate(((-20 + 40 * p) * Math.PI) / 180); ox.scale(r, r);
    ox.shadowColor = '#ffffff'; ox.shadowBlur = 6; ox.fillStyle = '#ffffff';
    ox.fill(STAR); ox.fill(STAR);
    ox.restore();
  }
}

// The crawl on the bottom edge: broadcast's lower crawl type (yellow, slanted, three navy steps)
// with its four-point stars between the lines, on the fine-print bar's navy, a whole number of
// passes per loop.
const T = F.ticker;
const crawl = (() => {
  const cap = Math.round(T.h * 0.42);
  const size = Math.round((cap * 100) / capOf(BLACK, 100));
  const pieces = TICKER.map((s) => typeSprite(s, size, STY.crawl));
  const starR = cap * 0.55, gap = cap * 0.75, depth = Math.round(3 * STY.crawl.step * size);
  const L = Math.round(pieces.reduce((n, p) => n + p.inkW + gap * 2 + starR * 2, 0));
  const oy = Math.max(...pieces.map((p) => p.oy)), h = Math.max(...pieces.map((p) => p.c.height - p.oy)) + oy;
  const strip = canvas(L + 60, h), x = strip.getContext('2d');
  let at = 0;
  for (const p of pieces) {
    x.drawImage(p.c, Math.round(at - p.pad), oy - p.oy);
    at += p.inkW + gap;
    x.save(); x.translate(at + starR, oy - cap / 2); x.scale(starR, starR);
    x.fillStyle = SHADE; for (let i = depth; i >= 1; i--) { x.save(); x.translate(i / starR, i / starR); x.fill(STAR); x.restore(); }
    x.fillStyle = YELLOW; x.fill(STAR); x.restore();
    at += starR * 2 + gap;
  }
  const passes = Math.max(1, Math.round((T.speed * DURATION) / L));
  return { strip, L, passes, lead: Math.round(gap * 0.6), y: Math.round(tickerTop + T.h / 2 + cap / 2 - oy) };
})();
function drawCrawl(t) {
  const M = crawl;
  ox.fillStyle = 'rgba(2,4,52,0.72)'; ox.fillRect(0, tickerTop, W, T.h); // the fine-print bar
  // phased so that frame 12, the still everyone sees, opens on "But wait…"
  const start = (0.4 / DURATION) * M.L * M.passes + M.lead;
  const off = ((((t / DURATION) * M.L * M.passes - start) % M.L) + M.L) % M.L;
  ox.save(); ox.beginPath(); ox.rect(0, tickerTop, W, T.h); ox.clip();
  for (let x = -off; x < W; x += M.L) ox.drawImage(M.strip, Math.round(x), M.y);
  ox.restore();
}

// ---------- the timeline ----------
function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(t);
  // BLACK FRIDAY ONLY! blinks: yellow on the beat, white on the off-beat
  blinkCtx.clearRect(0, 0, W, H);
  const f = flip(t);
  for (const L of blinkers) {
    blinkCtx.globalAlpha = 1; blinkCtx.drawImage(L.a.c, L.x, L.y);
    if (f > 0) { blinkCtx.globalAlpha = f; blinkCtx.drawImage(L.b.c, L.x, L.y); }
  }
  blinkCtx.globalAlpha = 1;
  ox.clearRect(0, 0, W, H);
  if (q.get('sticker') !== '0') drawSticker(t);
  if (q.get('burst') !== '0') drawBurst(t);
  if (q.get('strips') !== '0') drawStrips(t);
  if (q.get('glints') !== '0') drawGlints(t);
  if (q.get('crawl') !== '0') drawCrawl(t); // ?crawl=0: the live banner runs its own tickers
}

window.comp = { duration: DURATION, fps: FPS, width: W, height: H, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
