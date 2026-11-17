// The animated GIF banner, 1997, full classic set: the chosen direction. A low-resolution canvas on web-safe colours,
// blown up with hard pixels. Played completely straight: chunky bevelled 8-bit type with black
// keylines and hard navy drop shadows, hard two-frame blinks on one 2 Hz beat, a pixel starburst,
// a dayglo discount sticker slapped on the spinning globe (rendered in 3D, posterised with ordered
// dithering, stepped at 10 frames a second), a couple of pixel sparkles, and a scrolling marquee.
// Variant D, "Chrome column, 3D": the globe spins atop a still chrome Tuscan column (fluted shaft,
// ovolo capital, torus and plinth) in the same three.js scene, posterised and dithered with it,
// with hand-drawn keylines from a line pass. Test knobs: ?colrx= ?colry= ?colrough= ?fink= ?fhi=0 ?elev=
// Options: ?h= renders a format at another height (the footer stays on the bottom edge, as it
// does in the live banner); ?edge=serrated cuts the page-facing edge like a coupon (?out= sets
// what shows through the teeth, default white); ?ticker=serrated serrates the marquee strip;
// ?credit=1 adds the credit line "Brought to you by Gary Mustard Enterprises" above the marquee.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, materials } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2, GIF_FPS = 10;

// The web-safe colours the banner is allowed.
const C = {
  blue: '#0033ff', navy: '#000066', deep: '#000099', black: '#000000', white: '#ffffff', sky: '#3366ff',
  pale: '#ccccff', yellow: '#ffff00', cream: '#ffffcc', gold: '#ffcc00', orange: '#ff9900',
  red: '#ff0000', maroon: '#990000', pink: '#ff3399', hotpink: '#ff66cc', grey: '#cccccc', silver: '#999999',
};
const PS = '"Press Start 2P"', SK = '"Silkscreen"';

// Type styles: face colour, a lower band in a second colour, a one-pixel bevel highlight on top
// edges, a black keyline, and a solid navy extrusion down and to the right.
const STY = {
  head: { fill: 'yellow', band: 'gold', hi: 'cream', line: 1, ext: 3 },
  body: { fill: 'white', band: 'pale', hi: 'white', line: 1, ext: 2 },
  bodyS: { fill: 'white', band: 'pale', hi: 'white', line: 0, ext: 1 },
  only: { fill: 'yellow', band: 'gold', hi: 'cream', line: 1, ext: 2, blink: { fill: 'white', band: 'pale', hi: 'white' } },
  onlyS: { fill: 'yellow', band: 'gold', hi: 'cream', line: 0, ext: 1, blink: { fill: 'white', band: 'pale', hi: 'white' } },
};

// The marquee: exactly these lines, in this order, looping.
const TICKER = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];

// Layout in GIF pixels. P is the size of one GIF pixel on the stage.
// text: x is a centre (align c) or a left edge (align l); y is the top of the ink.
const FORMATS = {
  // the message down the left, the chrome monument standing on the marquee to the right
  '1x1': {
    w: 1080, h: 1080, P: 4, credit: 30,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 10, y: 10, align: 'l', st: 'head' },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 10, y: 57, align: 'l', st: 'head' },
      { t: 'text', s: 'EVERYTHING', f: `16px ${PS}`, x: 10, y: 108, align: 'l', st: 'body' },
      { t: 'text', s: 'ON THE', f: `16px ${PS}`, x: 10, y: 128, align: 'l', st: 'body' },
      { t: 'text', s: 'INTERNET.', f: `16px ${PS}`, x: 10, y: 148, align: 'l', st: 'body' },
      { t: 'text', s: 'BLACK FRIDAY', f: `700 16px ${SK}`, x: 10, y: 174, align: 'l', st: 'only' },
      { t: 'text', s: 'ONLY!', f: `700 16px ${SK}`, x: 10, y: 192, align: 'l', st: 'only' },
      { t: 'globe', x: 220, y: 52, d: 76, col: { shaft: 3.6 } },
      { t: 'sticker', x: 247, y: 26, r: 17, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 146, y: 214, r: 27, lines: ['NEW!'], f: `8px ${PS}` },
      { t: 'sparkle', x: 160, y: 22, ph: 0 },
      { t: 'sparkle', x: 180, y: 160, ph: 1 },
      { t: 'marquee', h: 22, f: `8px ${PS}` },
    ],
  },
  // the headline across the top, then the monument on the right with BLACK FRIDAY ONLY! and the burst beside it
  'banner-v': {
    w: 1080, h: 2025, P: 6, credit: 36,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 90, y: 8, st: 'head' },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 90, y: 54, st: 'head' },
      { t: 'text', s: 'EVERYTHING', f: `16px ${PS}`, x: 90, y: 104, st: 'body' },
      { t: 'text', s: 'ON THE', f: `16px ${PS}`, x: 90, y: 124, st: 'body' },
      { t: 'text', s: 'INTERNET.', f: `16px ${PS}`, x: 90, y: 144, st: 'body' },
      { t: 'text', s: 'BLACK', f: `700 16px ${SK}`, x: 46, y: 176, st: 'only' },
      { t: 'text', s: 'FRIDAY', f: `700 16px ${SK}`, x: 46, y: 194, st: 'only' },
      { t: 'text', s: 'ONLY!', f: `700 16px ${SK}`, x: 46, y: 212, st: 'only' },
      { t: 'globe', x: 132, y: 198, d: 58, col: { shaft: 2.32 } },
      { t: 'sticker', x: 160, y: 182, r: 15, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 48, y: 272, r: 30, lines: ['WOW!'], f: `16px ${SK}`, bold: true },
      { t: 'sparkle', x: 14, y: 14, ph: 0 },
      { t: 'sparkle', x: 166, y: 62, ph: 1 },
      { t: 'sparkle', x: 96, y: 236, ph: 1, ground: true },
      { t: 'marquee', h: 22, f: `8px ${PS}` },
    ],
  },
  'banner-h': {
    w: 1170, h: 834, P: 5, credit: 32,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 8, y: 7, align: 'l', st: 'head' },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 8, y: 52, align: 'l', st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `8px ${PS}`, x: 8, y: 100, align: 'l', st: 'bodyS' },
      { t: 'text', s: 'THE INTERNET.', f: `8px ${PS}`, x: 8, y: 112, align: 'l', st: 'bodyS' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `8px ${PS}`, x: 8, y: 127, align: 'l', st: 'onlyS' },
      { t: 'globe', x: 200, y: 34, d: 52, col: { shaft: 2.66 } },
      { t: 'sticker', x: 175, y: 15, r: 13, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 156, y: 92, r: 20, lines: ['HOT!'], f: `8px ${PS}` },
      { t: 'sparkle', x: 150, y: 20, ph: 1 },
      { t: 'marquee', h: 17, f: `8px ${PS}`, thin: true },
    ],
  },
  // ---- Chrome Web Store images: the same advert, the same footer on the bottom edge ----
  // the marquee promo tile
  marquee: {
    w: 1400, h: 560, P: 4, credit: 28, creditX: 120,
    items: [
      { t: 'text', s: '30% OFF', f: `32px ${PS}`, x: 120, y: 6, st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 120, y: 47, st: 'body' },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 120, y: 66, st: 'body' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 120, y: 88, st: 'only' },
      { t: 'globe', x: 288, y: 56, d: 86 },
      { t: 'sticker', x: 257, y: 24, r: 19, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 324, y: 88, r: 20, lines: ['NEW!'], f: `8px ${PS}` },
      { t: 'sparkle', x: 10, y: 12, ph: 0 },
      { t: 'sparkle', x: 340, y: 10, ph: 1 },
      { t: 'marquee', h: 20, f: `8px ${PS}` },
    ],
  },
  // the small promo tile (shown at 440x280)
  tile: {
    w: 880, h: 560, P: 4, credit: 26,
    items: [
      { t: 'text', s: '30%', f: `32px ${PS}`, x: 10, y: 8, align: 'l', st: 'head' },
      { t: 'text', s: 'OFF', f: `32px ${PS}`, x: 10, y: 46, align: 'l', st: 'head' },
      { t: 'text', s: 'BLACK FRIDAY', f: `8px ${PS}`, x: 10, y: 86, align: 'l', st: 'onlyS' },
      { t: 'text', s: 'ONLY!', f: `8px ${PS}`, x: 10, y: 96, align: 'l', st: 'onlyS' },
      { t: 'globe', x: 166, y: 56, d: 80 },
      { t: 'sticker', x: 138, y: 25, r: 20, s: '-30%', f: `8px ${PS}` },
      { t: 'marquee', h: 20, f: `8px ${PS}` },
    ],
  },
  // a store screenshot: the advert at 1280x800 with the full footer
  shot: {
    w: 1280, h: 800, P: 5, credit: 30, creditLeft: true,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 8, y: 4, align: 'l', st: 'head' },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 8, y: 47, align: 'l', st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `8px ${PS}`, x: 8, y: 91, align: 'l', st: 'bodyS' },
      { t: 'text', s: 'THE INTERNET.', f: `8px ${PS}`, x: 8, y: 103, align: 'l', st: 'bodyS' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `8px ${PS}`, x: 8, y: 117, align: 'l', st: 'onlyS' },
      { t: 'globe', x: 196, y: 64, d: 88 },
      { t: 'sticker', x: 160, y: 32, r: 21, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 226, y: 112, r: 23, lines: ['HOT!'], f: `8px ${PS}` },
      { t: 'sparkle', x: 244, y: 12, ph: 1 },
      { t: 'marquee', h: 18, f: `8px ${PS}` },
    ],
  },
  // The vertical story advert. Phone apps cover the top ~240 and bottom ~340 stage px, so the
  // artwork sits between them (y 250-1560); the footer stays on the bottom edge, as everywhere.
  '9x16': {
    w: 1080, h: 1920, P: 4, credit: 30,
    items: [
      { t: 'text', s: '30% OFF', f: `32px ${PS}`, x: 135, y: 66, st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 135, y: 113, st: 'body' },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 135, y: 133, st: 'body' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 135, y: 158, st: 'only' },
      { t: 'globe', x: 98, y: 296, d: 136 },
      { t: 'sticker', x: 156, y: 249, r: 29, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 222, y: 308, r: 40, lines: ['WOW!'], f: `16px ${SK}`, bold: true },
      { t: 'sparkle', x: 22, y: 72, ph: 0 },
      { t: 'sparkle', x: 252, y: 100, ph: 1 },
      { t: 'sparkle', x: 22, y: 224, ph: 1 },
      { t: 'marquee', h: 22, f: `8px ${PS}` },
    ],
  },
  // The full-page horizontal advert: the message on the left, the globe and burst on the right.
  '16x9': {
    w: 1920, h: 1080, P: 4, credit: 30,
    items: [
      { t: 'text', s: '30%', f: `64px ${PS}`, x: 20, y: 14, align: 'l', st: 'head' },
      { t: 'text', s: 'OFF', f: `64px ${PS}`, x: 20, y: 86, align: 'l', st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 20, y: 160, align: 'l', st: 'body' },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 20, y: 180, align: 'l', st: 'body' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 20, y: 204, align: 'l', st: 'only' },
      { t: 'globe', x: 334, y: 110, d: 140 },
      { t: 'sticker', x: 394, y: 62, r: 28, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 428, y: 186, r: 38, lines: ['HOT!'], f: `16px ${SK}`, bold: true },
      { t: 'sparkle', x: 252, y: 30, ph: 1 },
      { t: 'sparkle', x: 462, y: 22, ph: 0 },
      { t: 'marquee', h: 22, f: `8px ${PS}` },
    ],
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '1x1';
const F = { ...FORMATS[format] };
if (Number(q.get('h')) > 0) F.h = Math.round(Number(q.get('h')));
// ?part=body draws only the artwork above the footer: what the live banner shows as an image.
const BODY_ONLY = q.get('part') === 'body';
const EDGE = !BODY_ONLY && q.get('edge') === 'serrated', TICK_SERR = q.get('ticker') === 'serrated', CREDIT = q.get('credit') === '1';
const OUTSIDE = '#' + (q.get('out') || 'ffffff').replace(/[^0-9a-f]/gi, '').slice(0, 6);
const P = F.P, W = Math.ceil(F.w / P), H = Math.ceil(F.h / P);
// The monument stands on the marquee: when ?h= makes the banner taller (the footer stays on the
// bottom edge), the globe, its column, its sticker (and items marked ground) move down with it rather than float.
const GROUND = Math.max(0, H - Math.ceil(FORMATS[format].h / P));
F.items = F.items.map((it) => (it.t === 'globe' || it.t === 'sticker' || it.ground ? { ...it, y: it.y + GROUND } : it));

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);

// ---------- fonts ----------
await Promise.all(['600 30px Inter', `8px ${PS}`, `16px ${PS}`, `8px ${SK}`, `700 8px ${SK}`, `16px ${SK}`, `700 16px ${SK}`, '400 100px "Archivo Black"'].map((f) => document.fonts.load(f)));

// ---------- the credit line: clean, full resolution, just above the marquee ----------
const credit = document.createElement('div');
credit.id = 'credit';
credit.textContent = 'Brought to you by Gary Mustard Enterprises';
if (CREDIT && !BODY_ONLY) stage.append(credit);

// ---------- the GIF canvas ----------
const gif = $('gif');
gif.width = W; gif.height = H;
gif.style.width = W * P + 'px'; gif.style.height = H * P + 'px';
const g = gif.getContext('2d');
g.imageSmoothingEnabled = false;

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rgb = (name) => { const h = C[name] || name; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };

// Pixel masks: { w, h, a: Uint8Array } with 1 = ink.
function maskOf(c) {
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, a = new Uint8Array(c.width * c.height);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
  return { w: c.width, h: c.height, a };
}
const at = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.a[y * m.w + x] === 1;
function cropMask(m) {
  let x0 = m.w, y0 = m.h, x1 = -1, y1 = -1;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.a[y * m.w + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const o = { w: x1 - x0 + 1, h: y1 - y0 + 1 };
  o.a = new Uint8Array(o.w * o.h);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.a[y * o.w + x] = m.a[(y + y0) * m.w + x + x0];
  return o;
}
function textMask(s, font) {
  const size = Number(font.match(/(\d+)px/)[1]);
  const m = canvas(8, 8).getContext('2d'); m.font = font;
  const c = canvas(Math.ceil(m.measureText(s).width) + 8, size * 2 + 8), x = c.getContext('2d');
  x.font = font; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(s, 4, 4);
  return cropMask(maskOf(c));
}
// Paint pixels into a canvas: fn(x, y) returns a colour name or null.
function paint(w, h, fn) {
  const c = canvas(w, h), x = c.getContext('2d'), d = x.createImageData(w, h), a = d.data;
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    const col = fn(xx, y);
    if (!col) continue;
    const p = rgb(col), i = (y * w + xx) * 4;
    a[i] = p[0]; a[i + 1] = p[1]; a[i + 2] = p[2]; a[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c;
}

// A crafted type sprite: banded, bevelled face; black keyline; navy extrusion.
function sprite(m, st) {
  const L = st.line || 0, E = st.ext || 0;
  const w = m.w + L * 2 + E, h = m.h + L * 2 + E;
  const face = (x, y) => at(m, x - L, y - L);
  const keyed = (x, y) => { for (let dy = -L; dy <= L; dy++) for (let dx = -L; dx <= L; dx++) if (face(x + dx, y + dy)) return true; return false; };
  const split = Math.round(m.h * 0.56);
  return paint(w, h, (x, y) => {
    if (face(x, y)) {
      const fx = x - L, fy = y - L;
      if (!at(m, fx, fy - 1) || !at(m, fx - 1, fy) && fy < split) return st.hi;
      return fy >= split ? st.band : st.fill;
    }
    if (L && keyed(x, y)) return 'black';
    for (let i = 1; i <= E; i++) if (keyed(x - i, y - i)) return 'navy';
    return null;
  });
}

// ---------- build every element as one or two pre-drawn frames ----------
const layers = []; // { frames: [canvas, canvas?], x, y, rate (frame swaps per second), phase }
let globeItem = null, marquee = null;
for (const it of F.items) {
  if (it.t === 'text') {
    const m = textMask(it.s, it.f), st = STY[it.st];
    const frames = [sprite(m, st)];
    if (st.blink) frames.push(sprite(m, { ...st, ...st.blink }));
    const x = it.align === 'l' ? it.x : Math.round(it.x - frames[0].width / 2 + (st.ext + 0) / 2);
    layers.push({ frames, x, y: it.y - (st.line || 0), rate: 2 });
  } else if (it.t === 'burst') {
    layers.push(burst(it));
  } else if (it.t === 'sticker') {
    layers.push(sticker(it));
  } else if (it.t === 'sparkle') {
    layers.push(sparkle(it));
  } else if (it.t === 'globe') {
    globeItem = it;
    layers.push({ globe: true });
  } else if (it.t === 'marquee') {
    marquee = buildMarquee(it);
    layers.push({ marquee: true });
  }
}

// A pixel starburst: red body with a dithered maroon inner ring, black keyline, navy drop shadow.
// Two frames: the points jump half a step and the word swaps colour.
function burst(it) {
  const N = 16, R = it.r, size = R * 2 + 2;
  const frames = [0, 1].map((k) => {
    const sc = canvas(size, size), x = sc.getContext('2d');
    x.translate(size / 2, size / 2);
    x.beginPath();
    for (let i = 0; i < N * 2; i++) {
      const a = (i / (N * 2)) * TAU + (k * Math.PI) / N, r = i % 2 ? R * 0.76 : R;
      x.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
    }
    x.closePath(); x.fillStyle = '#fff'; x.fill();
    const m = maskOf(sc);
    const word = it.lines.map((l) => textMask(l, it.f))[0];
    const wst = k ? { fill: 'white', band: 'pale', hi: 'white', line: 1, ext: 1 } : { fill: 'yellow', band: 'gold', hi: 'cream', line: 1, ext: 1 };
    const ws = sprite(word, wst);
    const S = 3; // drop shadow
    const o = paint(size + 2 + S, size + 2 + S, (xx, yy) => {
      const bx = xx - 1, by = yy - 1;
      if (at(m, bx, by)) {
        // an inner ring band just inside the points, dithered, like a two-colour GIF burst
        const d = Math.hypot(bx + 0.5 - size / 2, by + 0.5 - size / 2) / R;
        if (!at(m, bx, by - 1) || !at(m, bx - 1, by)) return 'hotpink';
        return 'red';
      }
      if (at(m, bx - 1, by) || at(m, bx + 1, by) || at(m, bx, by - 1) || at(m, bx, by + 1)) return 'black';
      for (let i = 1; i <= S; i++) { const sx2 = bx - i, sy2 = by - i; if (at(m, sx2, sy2) || at(m, sx2 - 1, sy2) || at(m, sx2, sy2 - 1)) return 'navy'; }
      return null;
    });
    const ox = o.getContext('2d');
    ox.drawImage(ws, Math.round((size + 2 - ws.width) / 2 + 1), Math.round((size + 2 - ws.height) / 2 + 1));
    return o;
  });
  return { frames, x: Math.round(it.x - (it.r + 1)), y: Math.round(it.y - (it.r + 1)), rate: 2 };
}

// The discount sticker: a round dayglo dot slapped on the globe, its lower-right edge peeling up
// to show the white back. Black keyline, navy drop shadow under the dot, not under the lifted flap.
function sticker(it) {
  const R = it.r, cx = R + 1, cy = R + 1, N = R * 2 + 6;
  // the peel line: points with (x - cx) + (y - cy) > k are lifted
  const k = R * 0.95;
  const inDisc = (x, y) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= R;
  const lifted = (x, y) => (x - cx) + (y - cy) > k;
  // the flap: the lifted cap folded back across the peel line, mirrored
  const flap = (x, y) => {
    const s = (x - cx) + (y - cy);
    if (s > k + 0.5) return false;
    const r = k * 2 - s; // reflect across the line s = k
    const mx = x + (r - s) / 2, my = y + (r - s) / 2;
    return s > k - R * 0.62 && inDisc(Math.round(mx), Math.round(my)) && lifted(Math.round(mx), Math.round(my));
  };
  const body = (x, y) => inDisc(x, y) && !lifted(x, y);
  const word = sprite(textMask(it.s, it.f), { fill: 'white', band: 'white', hi: 'white', line: 0, ext: 1 });
  const wm = maskOf(word);
  const o = paint(N, N, (x, y) => {
    if (flap(x, y)) {
      const s = (x - cx) + (y - cy);
      if (flap(x, y) && (!flap(x - 1, y) || !flap(x, y - 1)) && s < k - 0.5) return 'black';
      return s > k - 2.5 ? 'grey' : 'white';
    }
    if (body(x, y)) {
      if (!body(x - 1, y) || !body(x, y - 1) || !body(x + 1, y) || !body(x, y + 1)) return 'black';
      const d = Math.hypot(x + 0.5 - cx + R * 0.35, y + 0.5 - cy + R * 0.35) / R;
      if (d < 0.32 && (x + y) % 2 === 0) return 'hotpink';
      return 'pink';
    }
    // a hard navy drop shadow under the stuck-down part
    if (body(x - 2, y - 2) || body(x - 1, y - 2) || body(x - 2, y - 1)) return 'navy';
    return null;
  });
  const ox = o.getContext('2d');
  const wx = Math.round(cx - word.width / 2 - 2), wy = Math.round(cy - word.height / 2 - 2);
  // black keyline under the word for punch on the pink
  const ink = paint(word.width + 2, word.height + 2, (x, y) => (at(wm, x - 1, y - 1) || at(wm, x, y - 1) || at(wm, x - 2, y - 1) || at(wm, x - 1, y) || at(wm, x - 1, y - 2)) ? 'black' : null);
  ox.drawImage(ink, wx - 1, wy - 1);
  ox.drawImage(word, wx, wy);
  // a straight sticker reads as stuck on: keep it still; the peel holds.
  return { frames: [o], x: Math.round(it.x - cx), y: Math.round(it.y - cy), rate: 0 };
}

// A pixel sparkle: two frames on the beat, a small plus and a long four-point glint.
function sparkle(it) {
  const S = 13, c = 6;
  const big = (x, y) => {
    const dx = Math.abs(x - c), dy = Math.abs(y - c);
    if (dx === 0 && dy <= 6) return dy <= 1 ? 'white' : dy <= 3 ? 'white' : 'pale';
    if (dy === 0 && dx <= 6) return dx <= 3 ? 'white' : 'pale';
    if (dx === 1 && dy === 1) return 'pale';
    return null;
  };
  const small = (x, y) => {
    const dx = Math.abs(x - c), dy = Math.abs(y - c);
    if ((dx === 0 && dy <= 2) || (dy === 0 && dx <= 2)) return dx + dy === 0 ? 'white' : 'pale';
    return null;
  };
  const a = paint(S, S, small), b = paint(S, S, big);
  return { frames: it.ph ? [b, a] : [a, b], x: it.x - c, y: it.y - c, rate: 2 };
}

// ---------- the marquee ----------
// A sunken navy strip with a bevelled frame; the five lines scroll right to left, separated by
// little yellow stars, looping exactly once every 12 s.
function buildMarquee(it) {
  const STAR = ['....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'];
  const star = paint(9, STAR.length, (x, y) => (STAR[y][x] === '#' ? 'white' : null));
  const gap = 8;
  const pieces = TICKER.map((s) => sprite(textMask(s, it.f), { fill: 'yellow', band: 'yellow', hi: 'yellow', line: 0, ext: 1 }));
  const L = pieces.reduce((s, p) => s + p.width + gap + star.width + gap, 0);
  const strip = canvas(L, Math.max(...pieces.map((p) => p.height)) + 2), sx = strip.getContext('2d');
  let x = 0;
  for (const p of pieces) {
    sx.drawImage(p, x, strip.height - p.height - 1);
    x += p.width + gap;
    sx.drawImage(star, x, Math.round((strip.height - star.height) / 2));
    x += star.width + gap;
  }
  // frame: one-pixel highlight on top, black edges, navy well
  const frame = paint(W, it.h, (xx, y) => {
    if (y === 0) return 'black';
    if (y === 1) return 'sky';
    if (y === it.h - 1) return 'black';
    if (y === 2 || y === it.h - 2) return 'black';
    return 'navy';
  });
  const speed = 60; // GIF pixels a second, rounded to a whole number of passes a loop
  const passes = Math.max(1, Math.round((speed * DURATION) / L));
  const under = q.get('edge') === 'serrated' && format !== 'banner-v' ? 4 : 0; // room for teeth (TOOTH.depth)
  return { strip, frame, L, passes, y: H - it.h - under, h: it.h, under };
}
function drawMarquee(t) {
  const M = marquee;
  g.drawImage(M.frame, 0, M.y);
  if (M.under) { g.fillStyle = C.navy; g.fillRect(0, M.y + M.h, W, M.under); }
  // phased so that frame 12, the still everyone sees, opens on "But wait…"
  const start = (0.4 / DURATION) * M.L * M.passes + 4;
  const off = ((Math.floor((t / DURATION) * M.L * M.passes - start) % M.L) + M.L) % M.L;
  g.save();
  g.beginPath(); g.rect(0, M.y + 3, W, M.h - 5); g.clip();
  const ty = M.y + 3 + Math.floor((M.h - 5 - M.strip.height) / 2) + 1;
  for (let x = -off; x < W; x += M.L) g.drawImage(M.strip, x, ty);
  g.restore();
}

// ---------- the globe GIF, on its chrome column ----------
// The globe and a chrome Tuscan column stand in one three.js scene: the column holds still, the
// globe spins on its abacus. Both go through the same posterise and Bayer dither, so they read as
// one chrome monument. The render canvas is cropped to the monument; the globe's centre lands on
// the item's x, y.
const SS = 4; // rendered at 4x and averaged down before it is posterised
const D = globeItem.d;
const U = (D * SS) / 2 / 1.06; // render px per world unit (globe radius 1)
const gl = $('gl');
const FOV = 10, DIST = 30; // a long lens: a near-elevation view, as an architect draws an order
const { renderer, scene, camera } = createStage({ canvas: gl, width: 16, height: 16, pixelRatio: 1, fov: FOV });
renderer.shadowMap.enabled = false;
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
pivot.add(globe);

// A Tuscan order in chrome: square abacus, ovolo echinus, a collar, a fluted shaft with entasis,
// a torus and a square plinth on one step. y runs down from the globe's south pole.
function buildColumn({ shaft = 3, flutes = 12, steps = 1 } = {}) {
  // the globe's own chrome, with the studio turned a little so the column's front faces catch
  // the softboxes rather than the dark floor
  const mat = materials.chrome();
  mat.roughness = Number(q.get('colrough') ?? 0.045);
  mat.envMap = scene.environment;
  mat.envMapRotation.set((Number(q.get('colrx') ?? 15) * Math.PI) / 180, (Number(q.get('colry') ?? 0) * Math.PI) / 180, 0);
  const col = new THREE.Group();
  const pts = []; // bound points
  let y = -1.035;
  let id = 2; // each moulding gets its own id for the line pass
  const add = (m) => { m.userData.part = id++; col.add(m); return m; };
  const slab = (w, h) => {
    const m = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat));
    m.position.y = y - h / 2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [y, y - h]) pts.push(new THREE.Vector3(sx * w / 2, yy, sz * w / 2));
    y -= h;
  };
  const lathe = (prof, h) => { // prof: [r, v] with v 0 (bottom) .. 1 (top)
    const g = new THREE.LatheGeometry(prof.map(([r, v]) => new THREE.Vector2(r, y - h + v * h)), 64);
    add(new THREE.Mesh(g, mat)); y -= h;
  };
  const rTop = 0.33, rBot = 0.39;
  // abacus
  slab(1.06, 0.17);
  // echinus: a quarter-round ovolo from the collar out to the abacus
  { const prof = []; for (let i = 0; i <= 12; i++) { const s = i / 12; prof.push([rTop + 0.03 + (0.5 - rTop - 0.03) * Math.sin(s * Math.PI / 2), s]); } lathe(prof, 0.19); }
  // collar (astragal) and the neck
  { const tor = add(new THREE.Mesh(new THREE.TorusGeometry(rTop + 0.03, 0.045, 12, 64), mat)); tor.rotation.x = Math.PI / 2; tor.position.y = y - 0.07; }
  lathe([[rTop + 0.01, 0], [rTop + 0.01, 1]], 0.14);
  // the fluted shaft: flutes run its whole length, sharp arrises, swelling slightly (entasis)
  {
    const M = 12, N = flutes * M, NY = 32, h = shaft, depth = 0.055;
    const pos = [], idx = [];
    for (let j = 0; j <= NY; j++) {
      const v = j / NY; // 0 top .. 1 bottom
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
    add(new THREE.Mesh(g, mat)).userData.shaft = flutes;
    y -= h;
  }
  // base: a fillet, a fat torus, the square plinth, a step
  lathe([[rBot + 0.03, 0], [rBot + 0.03, 1]], 0.04);
  { const tor = add(new THREE.Mesh(new THREE.TorusGeometry(rBot + 0.05, 0.08, 16, 64), mat)); tor.rotation.x = Math.PI / 2; tor.position.y = y - 0.08; y -= 0.16; }
  slab(1.04, 0.16);
  for (let k = 0; k < steps; k++) slab(1.3 + k * 0.26, 0.13);
  return { col, pts, bottom: y };
}
const C3 = buildColumn(globeItem.col || {});
scene.add(C3.col);

// Frame the monument: a far camera looking at the globe's centre; the crop is worked out by
// projecting the column's corners and every pose of the spinning globe.
const elev = (Number(q.get('elev') ?? 14) * Math.PI) / 180;
camera.aspect = 1;
camera.position.set(0, Math.sin(elev) * DIST, Math.cos(elev) * DIST);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);
const FULL = 2 * Math.tan((FOV * Math.PI) / 360) * DIST * U; // the full virtual frame, render px
let bx0 = 0, bx1 = 0, by0 = 0, by1 = 0;
const fit = (v) => { const p = v.clone().project(camera); const x = (p.x * FULL) / 2 / SS, y = (-p.y * FULL) / 2 / SS; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); };
for (const v of C3.pts) fit(v);
for (let k = 0; k < 64; k++) { const a = (k / 64) * TAU; for (const e of [-0.6, 0, 0.6]) fit(new THREE.Vector3(Math.cos(a) * Math.cos(e) * 1.08, Math.sin(e) * 1.08, Math.sin(a) * Math.cos(e) * 1.08)); fit(new THREE.Vector3(0, 1.08, 0)); }
const GX0 = Math.floor(bx0) - 1, GY0 = Math.floor(by0) - 1, DW = Math.ceil(bx1) + 2 - GX0, DH = Math.ceil(by1) + 2 - GY0;
camera.setViewOffset(FULL, FULL, FULL / 2 + GX0 * SS, FULL / 2 + GY0 * SS, DW * SS, DH * SS);
renderer.setSize(DW * SS, DH * SS, false);

// The line pass: the same view drawn with each part's view-space normal (x, y) and its id, read
// back at GIF pixel centres to find where to draw keylines a pixel artist would draw by hand.
// On the shaft, red carries the flute's index instead, so the arrises fall exactly between flutes.
const lineMat = (id, flutes = 0) => new THREE.ShaderMaterial({
  uniforms: { id: { value: id / 32 }, flutes: { value: flutes } }, toneMapped: false,
  vertexShader: 'varying vec3 vN; varying vec3 vP; void main() { vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float id; uniform float flutes; varying vec3 vN; varying vec3 vP;
    void main() {
      vec3 n = normalize(vN); float r = n.x * 0.5 + 0.5;
      if (flutes > 0.0) { float w = 6.2831853 / flutes; r = (mod(floor((atan(vP.x, vP.z) - w * 0.5) / w), flutes) + 0.5) / 32.0; }
      gl_FragColor = vec4(r, n.y * 0.5 + 0.5, id, 1.0);
    }`,
});
const LINE_MATS = new Map();
scene.traverse((o) => { if (o.isMesh) LINE_MATS.set(o, [o.material, lineMat(o.userData.part || 1, o.userData.shaft || 0)]); });
const lineC = canvas(DW * SS, DH * SS), lx = lineC.getContext('2d', { willReadFrequently: true });
function linePass() {
  for (const [m, [, lm]] of LINE_MATS) m.material = lm;
  const cs = renderer.outputColorSpace, env = scene.environment;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.render(scene, camera);
  renderer.outputColorSpace = cs;
  for (const [m, [om]] of LINE_MATS) m.material = om;
  lx.clearRect(0, 0, lineC.width, lineC.height);
  lx.drawImage(gl, 0, 0);
  const d = lx.getImageData(0, 0, lineC.width, lineC.height).data;
  const id = new Uint8Array(DW * DH), nx = new Float32Array(DW * DH), ny = new Float32Array(DW * DH), fl = new Uint8Array(DW * DH);
  for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
    const j = ((y * SS + (SS >> 1)) * lineC.width + x * SS + (SS >> 1)) * 4;
    if (d[j + 3] < 128) continue;
    id[y * DW + x] = Math.round((d[j + 2] / 255) * 32);
    nx[y * DW + x] = d[j] / 127.5 - 1;
    ny[y * DW + x] = d[j + 1] / 127.5 - 1;
    fl[y * DW + x] = Math.floor((d[j] / 255) * 32);
  }
  return { id, nx, ny, fl };
}
const FLUTE_INK = rgb(q.get('fink') || 'navy'), FLUTE_HI = q.get('fhi') !== '0';
const SHAFT_ID = [...LINE_MATS.keys()].find((m) => m.userData.shaft)?.userData.part;

// palette the monument is posterised to: the banner's own colours, a few more web-safe blues for
// the shading, and the chrome greys
const PAL = ['#000000', '#000066', '#000099', '#0000cc', '#0033ff', '#3366ff', '#6699ff', '#99ccff', '#ccccff', '#ffffff',
  '#999999', '#cccccc', '#ffff00', '#ffcc00', '#ff9900', '#ff0000', '#cc0000', '#990000']
  .map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
const small = canvas(DW, DH), sx = small.getContext('2d', { willReadFrequently: true });
sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
const globeOut = canvas(DW + 4, DH + 4), gx = globeOut.getContext('2d');
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
const TURN = 4; // seconds a turn: three turns a loop
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
  sx.clearRect(0, 0, DW, DH);
  sx.drawImage(gl, 0, 0, DW, DH);
  const src = sx.getImageData(0, 0, DW, DH), a = src.data;
  const OW = DW + 4, OH = DH + 4, out = gx.createImageData(OW, OH), o = out.data;
  const SPREAD = 34, SAT = 1.45;
  const solid = (x, y) => x >= 0 && y >= 0 && x < DW && y < DH && a[(y * DW + x) * 4 + 3] >= 128;
  const put = (x, y, p) => { const j = (y * OW + x) * 4; o[j] = p[0]; o[j + 1] = p[1]; o[j + 2] = p[2]; o[j + 3] = 255; };
  // hard navy drop shadow, 3 px down and right, the same as the type
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
    if (solid(x - 1, y - 1) || solid(x - 2, y - 2) || solid(x - 3, y - 3) || solid(x - 3, y - 2) || solid(x - 2, y - 3)) put(x, y, [0, 0, 0x66]);
  }
  for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
    const i = (y * DW + x) * 4;
    if (a[i + 3] < 128) continue;
    const k = BAYER[(y & 3) * 4 + (x & 3)] * SPREAD;
    // a touch more saturation first, so the lit cut faces stay sign-red and sign-yellow
    const l = a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
    put(x, y, nearest(l + (a[i] - l) * SAT + k, l + (a[i + 1] - l) * SAT + k, l + (a[i + 2] - l) * SAT + k));
  }
  // hand-drawn lines inside the column: black under each moulding and under the globe, deep
  // blue down each flute's arris
  const L = linePass(), ID = (x, y) => (x >= 0 && y >= 0 && x < DW && y < DH ? L.id[y * DW + x] : 0);
  for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) {
    const me = ID(x, y);
    if (me < 2 || !solid(x, y)) continue;
    const dn = ID(x, y + 1), up = ID(x, y - 1);
    if (up === 1 || (dn >= 2 && (dn !== me || L.ny[(y + 1) * DW + x] - L.ny[y * DW + x] < -0.6))) { put(x, y, [0, 0, 0]); continue; }
    if (me === SHAFT_ID && ID(x + 1, y) === me && L.fl[y * DW + x + 1] !== L.fl[y * DW + x]) {
      put(x, y, FLUTE_INK);
      if (FLUTE_HI && ID(x + 2, y) === me && L.fl[y * DW + x + 2] === L.fl[y * DW + x + 1]) put(x + 1, y, [0xcc, 0xcc, 0xff]);
    }
  }
  // a one-pixel black keyline round the silhouette, like a hand-cleaned sprite
  for (let y = -1; y <= DH; y++) for (let x = -1; x <= DW; x++) {
    if (solid(x, y) || x < 0 || y < 0) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) put(x, y, [0, 0, 0]);
  }
  gx.putImageData(out, 0, 0);
}

// Serrations: small triangular teeth, in GIF pixels. depth = how far a tooth bites in.
const TOOTH = { period: 8, depth: 4 };
// Is (x, y) inside a tooth gap along an edge? `along` is the coordinate along the edge, `into`
// how far in from it.
const bitten = (along, into) => {
  const p = ((along % TOOTH.period) + TOOTH.period) % TOOTH.period;
  const half = TOOTH.period / 2;
  const depthHere = TOOTH.depth * (1 - Math.abs(p - half) / half); // a V: deepest mid-period
  return into < depthHere;
};
// The page-facing edge(s) for this format: the left edge down the side of a desktop page, the
// bottom edge across the top of a phone, all four edges on the square (a coupon).
const EDGES = format === 'banner-v' ? ['left'] : format === 'banner-h' ? ['bottom'] : ['left', 'right', 'top', 'bottom'];
function cutEdges() {
  for (const e of EDGES) {
    for (let a = 0; a < (e === 'left' || e === 'right' ? H : W); a++) {
      for (let d = 0; d < TOOTH.depth; d++) {
        if (!bitten(a, d)) continue;
        const x = e === 'left' ? d : e === 'right' ? W - 1 - d : a;
        const y = e === 'top' ? d : e === 'bottom' ? H - 1 - d : a;
        g.clearRect(x, y, 1, 1);
      }
    }
  }
}
// The marquee strip with zigzag top and bottom edges, like a ticket.
function cutTicker() {
  const top = marquee.y;
  for (let x = 0; x < W; x++) for (let d = 0; d < TOOTH.depth; d++) {
    if (!bitten(x, d)) continue;
    g.fillStyle = C.blue; g.fillRect(x, top + d, 1, 1);
    g.clearRect(x, marquee.y + marquee.h - 1 - d, 1, 1);
  }
}

// The background: flat web blue. Drawn once.
const bgCanvas = paint(W, H, () => 'blue');

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(Math.floor(t * GIF_FPS + 1e-6) % (DURATION * GIF_FPS));
  g.drawImage(bgCanvas, 0, 0);
  for (const L of layers) {
    if (L.globe) { g.drawImage(globeOut, Math.round(globeItem.x) + GX0, Math.round(globeItem.y) + GY0); continue; }
    if (L.marquee) { if (!BODY_ONLY) drawMarquee(t); continue; }
    const k = L.frames.length > 1 ? Math.floor(t * L.rate + 1e-6) % 2 : 0;
    g.drawImage(L.frames[k], Math.round(L.x), Math.round(L.y));
  }
  if (TICK_SERR && !BODY_ONLY) cutTicker();
  if (EDGE) cutEdges();
}

// The credit sits a few pixels above the marquee, centred (left-aligned on the phone strip).
credit.style.bottom = (H - marquee.y + 3) * P - (H * P - F.h) + 'px';
credit.style.fontSize = F.credit + 'px';
if (format === 'banner-h' || F.creditLeft) credit.classList.add('left');
// store tiles: centre the credit under the text column (creditX, GIF px) rather than the whole tile
if (F.creditX) Object.assign(credit.style, { right: 'auto', left: F.creditX * P + 'px', transform: 'translateX(-50%)', whiteSpace: 'nowrap' });
// What shows through the teeth: the page, in the live banner; a flat colour in a render.
if (EDGE || TICK_SERR) { stage.style.background = OUTSIDE; document.body.style.background = OUTSIDE; }

// For the extension's banner: the GIF canvas at its own resolution, and the marquee's pieces.
function pixels() { return gif.toDataURL('image/png'); }
function marqueeParts() {
  const frame = canvas(1, marquee.h); frame.getContext('2d').drawImage(marquee.frame, 0, 0, 1, marquee.h, 0, 0, 1, marquee.h);
  return { strip: marquee.strip.toDataURL('image/png'), frame: frame.toDataURL('image/png'), h: marquee.h, gifW: W, gifH: H, speed: 60,
           stripTop: 3 + Math.floor((marquee.h - 5 - marquee.strip.height) / 2) + 1 };
}
window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, pixels, marqueeParts, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
