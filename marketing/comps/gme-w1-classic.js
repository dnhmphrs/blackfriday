// The animated GIF banner, 1997, full classic set. A low-resolution canvas on web-safe colours,
// blown up with hard pixels. Played completely straight: chunky bevelled 8-bit type with black
// keylines and hard navy drop shadows, hard two-frame blinks on one 2 Hz beat, a pixel starburst,
// a dayglo discount sticker slapped on the spinning globe (rendered in 3D, posterised with ordered
// dithering, stepped at 10 frames a second), a couple of pixel sparkles, and a scrolling marquee.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
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
  '1x1': {
    w: 1080, h: 1080, P: 4,
    items: [
      { t: 'text', s: '30% OFF', f: `32px ${PS}`, x: 135, y: 12, st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 135, y: 58, st: 'body' },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 135, y: 79, st: 'body' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 135, y: 104, st: 'only' },
      { t: 'globe', x: 94, y: 186, d: 110 },
      { t: 'sticker', x: 141, y: 149, r: 23, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 212, y: 184, r: 40, lines: ['NEW!'], f: `16px ${PS}` },
      { t: 'sparkle', x: 18, y: 18, ph: 0 },
      { t: 'sparkle', x: 254, y: 46, ph: 1 },
      { t: 'sparkle', x: 24, y: 152, ph: 1 },
      { t: 'marquee', y: 248, h: 22, f: `8px ${PS}` },
    ],
  },
  'banner-v': {
    w: 1080, h: 2025, P: 6,
    items: [
      { t: 'text', s: '30%', f: `48px ${PS}`, x: 90, y: 8, st: 'head' },
      { t: 'text', s: 'OFF', f: `48px ${PS}`, x: 90, y: 62, st: 'head' },
      { t: 'text', s: 'EVERYTHING', f: `16px ${PS}`, x: 90, y: 121, st: 'body' },
      { t: 'text', s: 'ON THE', f: `16px ${PS}`, x: 90, y: 141, st: 'body' },
      { t: 'text', s: 'INTERNET.', f: `16px ${PS}`, x: 90, y: 161, st: 'body' },
      { t: 'text', s: 'BLACK FRIDAY', f: `700 16px ${SK}`, x: 90, y: 186, st: 'only' },
      { t: 'text', s: 'ONLY!', f: `700 16px ${SK}`, x: 90, y: 204, st: 'only' },
      { t: 'globe', x: 116, y: 268, d: 84 },
      { t: 'sticker', x: 146, y: 234, r: 23, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 40, y: 262, r: 33, lines: ['WOW!'], f: `16px ${SK}`, bold: true },
      { t: 'sparkle', x: 14, y: 14, ph: 0 },
      { t: 'sparkle', x: 166, y: 70, ph: 1 },
      { t: 'sparkle', x: 82, y: 236, ph: 1 },
      { t: 'marquee', y: 316, h: 22, f: `8px ${PS}` },
    ],
  },
  'banner-h': {
    w: 1170, h: 834, P: 5,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 8, y: 7, align: 'l', st: 'head' },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 8, y: 52, align: 'l', st: 'head' },
      { t: 'text', s: 'EVERYTHING ON', f: `8px ${PS}`, x: 8, y: 100, align: 'l', st: 'bodyS' },
      { t: 'text', s: 'THE INTERNET.', f: `8px ${PS}`, x: 8, y: 112, align: 'l', st: 'bodyS' },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `8px ${PS}`, x: 8, y: 127, align: 'l', st: 'onlyS' },
      { t: 'globe', x: 189, y: 62, d: 78 },
      { t: 'sticker', x: 157, y: 36, r: 22, s: '-30%', f: `8px ${PS}` },
      { t: 'burst', x: 202, y: 122, r: 24, lines: ['HOT!'], f: `8px ${PS}` },
      { t: 'sparkle', x: 224, y: 14, ph: 1 },
      { t: 'marquee', y: 150, h: 17, f: `8px ${PS}`, thin: true },
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
  return { strip, frame, L, passes, y: it.y, h: it.h };
}
function drawMarquee(t) {
  const M = marquee;
  g.drawImage(M.frame, 0, M.y);
  const off = Math.floor((t / DURATION) * M.L * M.passes) % M.L;
  g.save();
  g.beginPath(); g.rect(0, M.y + 3, W, M.h - 5); g.clip();
  const ty = M.y + 3 + Math.floor((M.h - 5 - M.strip.height) / 2) + 1;
  for (let x = -off; x < W; x += M.L) g.drawImage(M.strip, x, ty);
  g.restore();
}

// ---------- the globe GIF ----------
const SS = 4; // rendered at 4x and averaged down before it is posterised
const D = globeItem.d;
const gl = $('gl');
const { renderer, scene, camera } = createStage({ canvas: gl, width: D * SS, height: D * SS, pixelRatio: 1, fov: 24 });
renderer.shadowMap.enabled = false;
{
  const pxPerUnit = (D * SS) / 2 / 1.06;
  const dist = (D * SS) / (2 * Math.tan((24 * Math.PI) / 360) * pxPerUnit);
  const elev = (Number(q.get('elev') ?? 20) * Math.PI) / 180;
  camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(D * SS, D * SS, 0, 0, D * SS, D * SS);
}
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
pivot.add(globe);

// palette the globe is posterised to: the banner's own colours, a few more web-safe blues for the
// shading, and the chrome greys
const PAL = ['#000000', '#000066', '#000099', '#0000cc', '#0033ff', '#3366ff', '#6699ff', '#99ccff', '#ccccff', '#ffffff',
  '#999999', '#cccccc', '#ffff00', '#ffcc00', '#ff9900', '#ff0000', '#cc0000', '#990000']
  .map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
const small = canvas(D, D), sx = small.getContext('2d', { willReadFrequently: true });
sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
const globeOut = canvas(D + 4, D + 4), gx = globeOut.getContext('2d');
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
  sx.clearRect(0, 0, D, D);
  sx.drawImage(gl, 0, 0, D, D);
  const src = sx.getImageData(0, 0, D, D), a = src.data;
  const OW = D + 4, out = gx.createImageData(OW, OW), o = out.data;
  const SPREAD = 34, SAT = 1.45;
  const solid = (x, y) => x >= 0 && y >= 0 && x < D && y < D && a[(y * D + x) * 4 + 3] >= 128;
  const put = (x, y, p) => { const j = (y * OW + x) * 4; o[j] = p[0]; o[j + 1] = p[1]; o[j + 2] = p[2]; o[j + 3] = 255; };
  // hard navy drop shadow, 3 px down and right, the same as the type
  for (let y = 0; y < OW; y++) for (let x = 0; x < OW; x++) {
    if (solid(x - 1, y - 1) || solid(x - 2, y - 2) || solid(x - 3, y - 3) || solid(x - 3, y - 2) || solid(x - 2, y - 3)) put(x, y, [0, 0, 0x66]);
  }
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const i = (y * D + x) * 4;
    if (a[i + 3] < 128) continue;
    const k = BAYER[(y & 3) * 4 + (x & 3)] * SPREAD;
    // a touch more saturation first, so the lit cut faces stay sign-red and sign-yellow
    const l = a[i] * 0.3 + a[i + 1] * 0.59 + a[i + 2] * 0.11;
    put(x, y, nearest(l + (a[i] - l) * SAT + k, l + (a[i + 1] - l) * SAT + k, l + (a[i + 2] - l) * SAT + k));
  }
  // a one-pixel black keyline round the silhouette, like a hand-cleaned sprite
  for (let y = -1; y <= D; y++) for (let x = -1; x <= D; x++) {
    if (solid(x, y) || x < 0 || y < 0) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) put(x, y, [0, 0, 0]);
  }
  gx.putImageData(out, 0, 0);
}

// The background: flat web blue. Drawn once.
const bgCanvas = paint(W, H, () => 'blue');

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(Math.floor(t * GIF_FPS + 1e-6) % (DURATION * GIF_FPS));
  g.drawImage(bgCanvas, 0, 0);
  for (const L of layers) {
    if (L.globe) { g.drawImage(globeOut, Math.round(globeItem.x - D / 2), Math.round(globeItem.y - D / 2)); continue; }
    if (L.marquee) { drawMarquee(t); continue; }
    const k = L.frames.length > 1 ? Math.floor(t * L.rate + 1e-6) % 2 : 0;
    g.drawImage(L.frames[k], Math.round(L.x), Math.round(L.y));
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
