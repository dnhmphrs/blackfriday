// The animated GIF banner, 1997, done with care. A low-resolution canvas on web-safe colours,
// blown up with hard pixels: chunky 8-bit type with hand-placed bevels (a highlight row, a darker
// lower band, a keyline and a solid extrusion), a pixel starburst with its own light and shadow,
// a bevelled CLICK HERE, twinkling pixel sparkles, a dithered glow in the blue, and the cut globe
// as a classic spinning-globe GIF (rendered in 3D, then posterised with ordered dithering and
// stepped at 10 frames a second). Everything blinks on one 2 Hz beat; sparkles twinkle on 4 Hz.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2, GIF_FPS = 10;

// The web-safe colours the banner is allowed.
const C = {
  blue: '#0033ff', navy: '#000066', black: '#000000', white: '#ffffff', yellow: '#ffff00', red: '#ff0000', sky: '#3366ff',
  gold: '#ffcc00', amber: '#ff9900', cream: '#ffffcc', ice: '#ccccff', lilac: '#9999ff', pale: '#99ccff',
  rose: '#ff6666', maroon: '#990000', mid: '#0000cc', ochre: '#cc9900',
};
const PS = '"Press Start 2P"', SK = '"Silkscreen"';

// Type styles. face/band: the upper and lower colour of the letters; hi/lo: bevel rows on the top
// and bottom edges (only on big type with thick strokes); line: keyline; ext: extrusion depth.
const ST = {
  goldBig: { face: 'yellow', band: 'gold', hi: 'cream', lo: 'amber', line: 'navy', ext: 3, bandAt: 0.56 },
  gold: { face: 'yellow', band: 'gold', line: 'navy', ext: 2, bandAt: 0.56 },
  whiteBlink: { face: 'white', band: 'ice', line: 'navy', ext: 2, bandAt: 0.56 },
  white: { face: 'white', band: 'ice', line: 'navy', ext: 2, bandAt: 0.56 },
  goldSmall: { face: 'yellow', line: 'navy', ext: 1 },
  whiteSmall: { face: 'white', line: 'navy', ext: 1 },
};

// Layout in GIF pixels. P is the size of one GIF pixel on the stage.
// text: x is a centre (align c) or a left edge (align l); y is the top of the ink.
const FORMATS = {
  '1x1': {
    w: 1080, h: 1080, P: 4,
    items: [
      { t: 'text', s: '30% OFF', f: `32px ${PS}`, x: 135, y: 14, st: 'goldBig' },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 135, y: 62, st: 'white' },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 135, y: 83, st: 'white' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 135, y: 110, st: 'gold', blink: 'whiteBlink' },
      { t: 'globe', x: 94, y: 192, d: 120 },
      { t: 'burst', x: 212, y: 172, rx: 45, ry: 39, inner: 0.78, lines: ['NEW!'], f: `16px ${PS}` },
      { t: 'button', x: 210, y: 232, s: 'CLICK HERE' },
      { t: 'mark', x: 264, y: 264 },
      // sparkles: x, y, phase (in 4 Hz steps), size
      { t: 'spark', x: 42, y: 138, ph: 0, n: 4 },
      { t: 'spark', x: 152, y: 236, ph: 5, n: 3 },
      { t: 'spark', x: 250, y: 132, ph: 8, n: 3 },
      { t: 'spark', x: 12, y: 30, ph: 3, n: 3 },
      { t: 'spark', x: 256, y: 44, ph: 10, n: 3 },
    ],
  },
  'banner-v': {
    w: 1080, h: 2025, P: 6,
    items: [
      { t: 'text', s: '30%', f: `48px ${PS}`, x: 90, y: 10, st: 'goldBig' },
      { t: 'text', s: 'OFF', f: `48px ${PS}`, x: 90, y: 64, st: 'goldBig' },
      { t: 'text', s: 'EVERYTHING', f: `16px ${PS}`, x: 90, y: 122, st: 'white' },
      { t: 'text', s: 'ON THE', f: `16px ${PS}`, x: 90, y: 142, st: 'white' },
      { t: 'text', s: 'INTERNET.', f: `16px ${PS}`, x: 90, y: 162, st: 'white' },
      { t: 'text', s: 'BLACK FRIDAY', f: `700 16px ${SK}`, x: 90, y: 187, st: 'gold', blink: 'whiteBlink' },
      { t: 'text', s: 'ONLY!', f: `700 16px ${SK}`, x: 90, y: 205, st: 'gold', blink: 'whiteBlink' },
      { t: 'globe', x: 132, y: 268, d: 88 },
      { t: 'burst', x: 46, y: 257, rx: 40, ry: 35, inner: 0.8, lines: ['NEW!'], f: `16px ${PS}` },
      { t: 'button', x: 90, y: 323, s: 'CLICK HERE' },
      { t: 'mark', x: 176, y: 334 },
      { t: 'spark', x: 16, y: 212, ph: 0, n: 4 },
      { t: 'spark', x: 168, y: 302, ph: 6, n: 3 },
      { t: 'spark', x: 12, y: 20, ph: 3, n: 3 },
      { t: 'spark', x: 168, y: 84, ph: 9, n: 3 },
    ],
  },
  'banner-h': {
    w: 1170, h: 834, P: 5,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 10, y: 9, align: 'l', st: 'goldBig' },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 10, y: 55, align: 'l', st: 'goldBig' },
      { t: 'text', s: 'EVERYTHING ON', f: `8px ${PS}`, x: 10, y: 107, align: 'l', st: 'whiteSmall' },
      { t: 'text', s: 'THE INTERNET.', f: `8px ${PS}`, x: 10, y: 120, align: 'l', st: 'whiteSmall' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `8px ${PS}`, x: 10, y: 137, align: 'l', st: 'goldSmall', blink: 'whiteSmall' },
      { t: 'globe', x: 190, y: 46, d: 82 },
      { t: 'burst', x: 193, y: 124, rx: 37, ry: 35, inner: 0.85, n: 16, lines: ['NEW!'], f: `16px ${PS}` },
      { t: 'mark', x: 25, y: 163 },
      { t: 'spark', x: 146, y: 16, ph: 0, n: 4 },
      { t: 'spark', x: 132, y: 84, ph: 6, n: 3 },
      { t: 'spark', x: 224, y: 100, ph: 9, n: 3 },
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
const rgb = (name) => { const h = C[name] || name; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };
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
// The same, with a trailing "!" set at the font's own letter gap instead of in its wide cell.
function kernedMask(s, font) {
  if (!s.endsWith('!') || s.length < 2) return textMask(s, font);
  const a = textMask(s.slice(0, -1), font), b = textMask('!', font), gap = Number(font.match(/(\d+)px/)[1]) / 4;
  const o = canvas(a.width + gap + b.width, Math.max(a.height, b.height)), x = o.getContext('2d');
  x.drawImage(a, 0, o.height - a.height); x.drawImage(b, a.width + gap, o.height - b.height);
  return o;
}
// A mask as a 0/1 grid, padded by `pad` pixels on every side.
function grid(mask, pad) {
  const w = mask.width + pad * 2, h = mask.height + pad * 2, src = mask.getContext('2d').getImageData(0, 0, mask.width, mask.height).data;
  const on = new Uint8Array(w * h);
  for (let y = 0; y < mask.height; y++) for (let x = 0; x < mask.width; x++) if (src[(y * mask.width + x) * 4 + 3] >= 128) on[(y + pad) * w + x + pad] = 1;
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && on[y * w + x] === 1;
  return { w, h, on, at };
}
// A hand-finished sprite, pixel by pixel: the letters (face over a darker lower band, with a
// highlight row along top edges and a shadow row along bottom edges when the strokes are thick
// enough), a one-pixel keyline all round, and a solid extrusion down and to the right.
// `shade` (optional) colours a pixel of the body: (x, y, edges) => colour name or null.
function finish(mask, s, shade) {
  const G = grid(mask, 1), ext = s.ext || 0;
  const o = canvas(G.w + ext, G.h + ext), x = o.getContext('2d'), d = x.createImageData(o.width, o.height), a = d.data;
  const put = (px, py, col) => { const i = (py * o.width + px) * 4, c = rgb(col); a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = 255; };
  const near = (px, py) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (G.at(px + dx, py + dy)) return true; return false; };
  // extrusion first, then keyline, then the body over both
  for (let k = ext; k >= 1; k--) for (let py = 0; py < G.h; py++) for (let px = 0; px < G.w; px++) if (near(px, py)) put(px + k, py + k, s.extC || 'navy');
  for (let py = 0; py < G.h; py++) for (let px = 0; px < G.w; px++) if (!G.at(px, py) && near(px, py)) put(px, py, s.line);
  const top = 1, inkH = mask.height;
  for (let py = 0; py < G.h; py++) for (let px = 0; px < G.w; px++) {
    if (!G.at(px, py)) continue;
    const up = G.at(px, py - 1), dn = G.at(px, py + 1), lf = G.at(px - 1, py), rt = G.at(px + 1, py);
    let col = s.band && py - top >= Math.round(inkH * s.bandAt) ? s.band : s.face;
    if (shade) col = shade(px, py, { up, dn, lf, rt }) || col;
    else if (s.hi) {
      // bevel: highlight on top and left edges, shadow on bottom and right edges
      if (!up) col = s.hi;
      else if (!dn) col = s.lo;
      else if (!lf && G.at(px, py + 1) && G.at(px, py - 1)) col = s.hi2 || col;
      else if (!rt) col = s.lo2 || col;
    }
    put(px, py, col);
  }
  x.putImageData(d, 0, 0);
  return o;
}

// ---------- build every element as one or two pre-drawn frames ----------
const layers = []; // { frames: [canvas, canvas?], x, y, rate (frame swaps per second) } | { spark } | { globe }
let globeItem = null;
for (const it of F.items) {
  if (it.t === 'text') {
    const m = textMask(it.s, it.f);
    const frames = [finish(m, ST[it.st])];
    if (it.blink) frames.push(finish(m, ST[it.blink]));
    const x = it.align === 'l' ? it.x - 1 : Math.round(it.x - (m.width + 2) / 2);
    layers.push({ frames, x, y: it.y - 1, rate: 2 });
  } else if (it.t === 'burst') {
    layers.push(burst(it));
  } else if (it.t === 'button') {
    layers.push(button(it));
  } else if (it.t === 'globe') {
    globeItem = it;
    layers.push({ globe: true });
  } else if (it.t === 'spark') {
    layers.push({ spark: true, x: it.x, y: it.y, ph: it.ph, n: it.n });
  } else if (it.t === 'mark') {
    // the only trace of the advertiser: three letters in the blue's own lighter shade, bottom right
    const m = textMask('GME', `8px ${SK}`);
    layers.push({ frames: [tint(m, 'sky')], x: it.x - m.width, y: it.y - m.height, rate: 0 });
  }
}

// A pixel starburst: red, lit from the top left (a rose highlight row, a maroon shadow row), with
// a black keyline and a navy drop. Two frames: the points jump half a step, the word swaps colour.
function burst(it) {
  // a little wider than tall, so the word sits inside the valleys with room to spare
  const N = it.n || 14, rx = it.rx || it.r, ry = it.ry || it.r, inner = it.inner || 0.8;
  const sw = Math.ceil(rx * 2 + 6), sh = Math.ceil(ry * 2 + 6);
  const frames = [0, 1].map((k) => {
    const shape = canvas(sw, sh), x = shape.getContext('2d');
    x.translate(sw / 2, sh / 2);
    x.beginPath();
    for (let i = 0; i < N * 2; i++) {
      const a = (i / (N * 2)) * TAU + (k * Math.PI) / N, r = i % 2 ? inner : 1;
      x.lineTo(Math.sin(a) * rx * r, -Math.cos(a) * ry * r);
    }
    x.closePath(); x.fillStyle = '#fff'; x.fill();
    harden(shape);
    const o = finish(shape, { face: 'red', line: 'black', ext: 2, extC: 'navy' }, (px, py, e) => {
      if (!e.up || !e.lf) return 'rose';
      if (!e.dn || !e.rt) return 'maroon';
      return null;
    });
    const y = o.getContext('2d');
    // the word: bevel-free gold on the 2 Hz beat, white on the off-beat
    const rows = it.lines.map((l) => finish(kernedMask(l, it.f), k ? { face: 'white', band: 'ice', bandAt: 0.56, line: 'black', ext: 1, extC: 'maroon' } : { face: 'yellow', band: 'gold', bandAt: 0.56, line: 'black', ext: 1, extC: 'maroon' }));
    const gap = 3, total = rows.reduce((s, r) => s + r.height, 0) + gap * (rows.length - 1);
    let ty = Math.round((o.height - 2 - total) / 2);
    for (const r of rows) { y.drawImage(r, Math.round((o.width - 2 - r.width) / 2), ty); ty += r.height + gap; }
    return o;
  });
  return { frames, x: Math.round(it.x - (frames[0].width - 2) / 2), y: Math.round(it.y - (frames[0].height - 2) / 2), rate: 2 };
}

// A pixel CLICK HERE button: a yellow slab with a cream top row and a gold lower half, black keyline,
// navy drop; the arrows either side jump in on the beat and the slab flashes white.
function button(it) {
  const m = textMask(it.s, `8px ${PS}`);
  const padX = 11, padY = 5, w = m.width + padX * 2, h = m.height + padY * 2;
  const frames = [0, 1].map((k) => {
    const o = canvas(w + 3, h + 3), x = o.getContext('2d');
    x.fillStyle = C.navy; x.fillRect(3, 3, w, h);
    x.fillStyle = C.black; x.fillRect(0, 0, w, h);
    x.fillStyle = k ? C.white : C.yellow; x.fillRect(1, 1, w - 2, h - 2);
    x.fillStyle = k ? C.ice : C.gold; x.fillRect(1, 1 + Math.ceil((h - 2) / 2) + 1, w - 2, Math.floor((h - 2) / 2) - 1);
    x.fillStyle = k ? C.white : C.cream; x.fillRect(1, 1, w - 2, 1); x.fillRect(1, 1, 1, h - 2);
    x.fillStyle = k ? C.lilac : C.amber; x.fillRect(1, h - 2, w - 2, 1); x.fillRect(w - 2, 1, 1, h - 2);
    // the words, with a one-pixel navy drop
    x.drawImage(tint(m, 'navy'), padX + 1, padY + 1);
    x.drawImage(tint(m, 'blue'), padX, padY);
    // arrows: 5 px tall triangles, one pixel further in on the second frame
    const ay = padY + Math.floor(m.height / 2), inset = 3 + k;
    for (const [col, dd] of [['navy', 1], ['blue', 0]]) {
      x.fillStyle = C[col];
      for (let i = 0; i < 3; i++) {
        x.fillRect(inset + i + dd, ay - (2 - i) + dd, 1, (2 - i) * 2 + 1);
        x.fillRect(w - 1 - inset - i + dd, ay - (2 - i) + dd, 1, (2 - i) * 2 + 1);
      }
    }
    return o;
  });
  return { frames, x: Math.round(it.x - w / 2), y: Math.round(it.y - h / 2), rate: 2 };
}

// A pixel sparkle: a four-point twinkle, n = arm length (0 is off). White core, pale-blue tips.
const sparkCache = {};
function sparkle(n) {
  if (sparkCache[n]) return sparkCache[n];
  const R = 4, c = canvas(R * 2 + 1, R * 2 + 1), x = c.getContext('2d');
  const px = (dx, dy, col) => { x.fillStyle = C[col]; x.fillRect(R + dx, R + dy, 1, 1); };
  if (n > 0) {
    for (let i = 1; i <= n; i++) {
      const col = i === n && n > 1 ? 'pale' : 'white';
      px(i, 0, col); px(-i, 0, col); px(0, i, col); px(0, -i, col);
    }
    if (n >= 3) { px(1, 1, 'pale'); px(-1, 1, 'pale'); px(1, -1, 'pale'); px(-1, -1, 'pale'); }
    px(0, 0, n >= 2 ? 'white' : 'pale');
  }
  return (sparkCache[n] = c);
}
// twinkle cycle on 4 Hz steps: grow, peak, shrink, rest (12 steps = 3 s, four times a loop)
const TWINKLE = [0, 1, 2, 3, 4, 2, 1, 0, 0, 0, 0, 0];

// ---------- the globe GIF ----------
const SS = 4; // rendered at 4x and averaged down before it is posterised
const D = globeItem.d;
const gl = $('gl');
const { renderer, scene, camera, key } = createStage({ canvas: gl, width: D * SS, height: D * SS, pixelRatio: 1, fov: 24 });
renderer.shadowMap.enabled = false;
renderer.toneMappingExposure = Number(q.get('exp') ?? 0.92);
key.intensity = Number(q.get('key') ?? 3.6);
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

// The cut faces, repainted for the GIF: flat sign-yellow and sign-red halves with no gradients to
// dither, and bigger, heavier "30%" and "OFF" with a thick black keyline, unlit so they stay crisp.
{
  const n = 1024, c = canvas(n, n), x = c.getContext('2d');
  x.fillStyle = '#ffff00'; x.fillRect(0, 0, n / 2, n);
  x.fillStyle = '#ff0000'; x.fillRect(n / 2, 0, n / 2, n);
  x.beginPath(); x.rect(0, 0, n, n); x.arc(n / 2, n / 2, n * 0.45, 0, TAU, true); x.closePath();
  x.fillStyle = '#0000cc'; x.fill('evenodd');
  x.lineWidth = 14; x.strokeStyle = '#000000';
  x.beginPath(); x.arc(n / 2, n / 2, n * 0.45, 0, TAU); x.stroke();
  x.fillStyle = '#000000'; x.fillRect(n / 2 - 5, n * 0.05, 10, n * 0.9);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'miter';
  for (const [text, cx, fill, size] of [['30%', 0.268, '#ff0000', 172], ['OFF', 0.728, '#ffff00', 178]]) {
    x.font = `400 ${size}px "Archivo Black"`;
    x.lineWidth = 34; x.strokeStyle = '#000000';
    x.strokeText(text, n * cx, n * 0.5);
    x.fillStyle = fill; x.fillText(text, n * cx, n * 0.5);
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const cutMat = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false });
  globe.traverse((o) => { if (o.isMesh && o.material && o.material.map) o.material = cutMat; });
}

// palette the globe is posterised to: the banner's own colours plus chrome greys, all web-safe
const PAL = ['#000000', '#000066', '#000099', '#0000cc', '#0033ff', '#3366ff', '#6699ff', '#99ccff', '#ccffff', '#ffffff', '#cccccc', '#999999', '#666699', '#ffff00', '#ffcc00', '#ff0000', '#990000']
  .map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
const small = canvas(D, D), sx = small.getContext('2d', { willReadFrequently: true });
sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
const globeOut = canvas(D, D), gx = globeOut.getContext('2d');
const dist2 = (r, gg, b, p) => { const dr = r - p[0], dg = gg - p[1], db = b - p[2]; return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11 + (dr * dr + dg * dg + db * db) * 0.2; };
const nearest = (r, gg, b) => {
  let best = 0, bd = Infinity;
  for (let i = 0; i < PAL.length; i++) { const d = dist2(r, gg, b, PAL[i]); if (d < bd) { bd = d; best = i; } }
  return PAL[best];
};
const YAW0 = Number(q.get('yaw') ?? -25);
const TURN = 4; // seconds a turn: three turns a loop
const GLOW = Number(q.get('glow') ?? 0.55), GLOW_R = Number(q.get('glowr') ?? 1.5);
// the turn eases to a near-stop on the hero pose (cut faces three-quarter on) at t = 0.4 s, 4.4 s, 8.4 s
const HOLD_T = 0.4;
const yawAt = (t) => { const u = (t - HOLD_T) / TURN; return (YAW0 * Math.PI) / 180 + TAU * u - 0.7 * Math.sin(TAU * u); };
const SNAP = Number(q.get('snap') ?? 900); // colours this close to a palette entry are not dithered
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
  const SPREAD = 44, SAT = 1.35;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const i = (y * D + x) * 4;
    if (a[i + 3] < 128) continue;
    // a touch more saturation first, so the blues stay electric and the chrome stays cold
    const l = a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
    const r = l + (a[i] - l) * SAT, gg = l + (a[i + 1] - l) * SAT, b = l + (a[i + 2] - l) * SAT;
    let p = nearest(r, gg, b);
    if (dist2(r, gg, b, p) > SNAP) {
      const k = BAYER[(y & 3) * 4 + (x & 3)] * SPREAD;
      p = nearest(r + k, gg + k, b + k);
    }
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
  const glow = [0x33, 0x66, 0xff], base = [0x00, 0x33, 0xff];
  const R = D * 0.5 * GLOW_R;
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = (y * W + xx) * 4;
    const r = Math.hypot(xx + 0.5 - globeItem.x, y + 0.5 - globeItem.y) / R;
    const k = GLOW * Math.max(0, 1 - r) ** 1.1;
    const c = k > BAYER[(y & 3) * 4 + (xx & 3)] + 0.5 ? glow : base;
    a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
}

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(Math.floor(t * GIF_FPS + 1e-6) % (DURATION * GIF_FPS));
  g.drawImage(bgCanvas, 0, 0);
  const step4 = Math.floor(t * 4 + 1e-6);
  for (const L of layers) {
    if (L.globe) { g.drawImage(globeOut, Math.round(globeItem.x - D / 2), Math.round(globeItem.y - D / 2)); continue; }
    if (L.spark) {
      const n = Math.min(L.n, TWINKLE[(step4 + L.ph) % TWINKLE.length]);
      if (n) { const s = sparkle(n); g.drawImage(s, L.x - 4, L.y - 4); }
      continue;
    }
    const k = L.frames.length > 1 ? Math.floor(t * L.rate + 1e-6) % 2 : 0;
    g.drawImage(L.frames[k], Math.round(L.x), Math.round(L.y));
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
