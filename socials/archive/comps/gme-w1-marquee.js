// The animated GIF banner, 1997, with a marquee. A low-resolution canvas on a handful of web-safe
// colours, blown up with hard pixels: hand-shaded 8-bit type (keyline, two-tone face, bevel
// edges, solid drop), hard two-frame blinks on one 2 Hz beat, one pixel starburst, a few pixel
// sparkles, a pixel CLICK HERE, the cut globe as a classic spinning-globe GIF (rendered in 3D,
// then posterised with ordered dithering and stepped at 10 frames a second), and a scrolling
// marquee strip along the bottom. Played straight, like a sincere 1997 ad.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2, GIF_FPS = 10;

// The web-safe colours the banner is allowed.
const C = { blue: '#0033ff', navy: '#000066', black: '#000000', white: '#ffffff', yellow: '#ffff00', red: '#ff0000', sky: '#3366ff' };
// The marquee's five lines, in order.
const MARQUEE = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
const PS = '"Press Start 2P"', SK = '"Silkscreen"';

// Layout in GIF pixels. P is the size of one GIF pixel on the stage.
// text: x is a centre (align c) or a left edge (align l); y is the top of the ink.
// style: 'gold' (yellow, white top edge, orange bottom edge), 'gold2' (two-tone yellow, for
// the 16 px lines), 'silver' (white over web grey), 'plain' (one colour, for the small lines).
const FORMATS = {
  '1x1': {
    w: 1080, h: 1080, P: 4,
    items: [
      { t: 'text', s: '30% OFF', f: `32px ${PS}`, x: 135, y: 14, style: 'gold', ext: 3 },
      { t: 'text', s: 'EVERYTHING ON', f: `16px ${PS}`, x: 135, y: 60, style: 'silver', ext: 2 },
      { t: 'text', s: 'THE INTERNET.', f: `16px ${PS}`, x: 135, y: 80, style: 'silver', ext: 2 },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `700 16px ${SK}`, x: 135, y: 106, style: 'gold2', blink: 'white', ext: 2 },
      { t: 'globe', x: 90, y: 182, d: 108 },
      { t: 'burst', x: 206, y: 160, r: 40, lines: ['NEW!'], f: `16px ${PS}` },
      { t: 'button', x: 206, y: 219, s: 'CLICK HERE' },
      { t: 'marquee', y: 248, h: 22 },
      { t: 'spark', x: 146, y: 135, big: 1, phase: 0 },
      { t: 'spark', x: 34, y: 225, big: 0, phase: 1 },
      { t: 'spark', x: 259, y: 12, big: 0, phase: 1 },
    ],
  },
  'banner-v': {
    w: 1080, h: 2025, P: 6,
    items: [
      { t: 'text', s: '30%', f: `48px ${PS}`, x: 90, y: 10, style: 'gold', ext: 3 },
      { t: 'text', s: 'OFF', f: `48px ${PS}`, x: 90, y: 62, style: 'gold', ext: 3 },
      { t: 'text', s: 'EVERYTHING', f: `16px ${PS}`, x: 90, y: 121, style: 'silver', ext: 2 },
      { t: 'text', s: 'ON THE', f: `16px ${PS}`, x: 90, y: 140, style: 'silver', ext: 2 },
      { t: 'text', s: 'INTERNET.', f: `16px ${PS}`, x: 90, y: 159, style: 'silver', ext: 2 },
      { t: 'text', s: 'BLACK FRIDAY', f: `700 16px ${SK}`, x: 90, y: 184, style: 'gold2', blink: 'white', ext: 2 },
      { t: 'text', s: 'ONLY!', f: `700 16px ${SK}`, x: 90, y: 201, style: 'gold2', blink: 'white', ext: 2 },
      { t: 'globe', x: 128, y: 264, d: 92 },
      { t: 'burst', x: 42, y: 252, r: 40, lines: ['WOW!'], f: `16px ${PS}` },
      { t: 'marquee', y: 316, h: 22 },
      { t: 'spark', x: 166, y: 222, big: 1, phase: 0 },
      { t: 'spark', x: 20, y: 296, big: 0, phase: 1 },
      { t: 'spark', x: 170, y: 58, big: 0, phase: 1 },
    ],
  },
  'banner-h': {
    w: 1170, h: 834, P: 5,
    items: [
      { t: 'text', s: '30%', f: `40px ${PS}`, x: 10, y: 9, align: 'l', style: 'gold', ext: 3 },
      { t: 'text', s: 'OFF', f: `40px ${PS}`, x: 10, y: 54, align: 'l', style: 'gold', ext: 3 },
      { t: 'text', s: 'EVERYTHING ON', f: `8px ${PS}`, x: 10, y: 103, align: 'l', style: 'plain', fill: 'white', ext: 1 },
      { t: 'text', s: 'THE INTERNET.', f: `8px ${PS}`, x: 10, y: 115, align: 'l', style: 'plain', fill: 'white', ext: 1 },
      { t: 'text', s: 'BLACK FRIDAY ONLY!', f: `8px ${PS}`, x: 10, y: 130, align: 'l', style: 'plain', fill: 'yellow', blink: 'white', ext: 1 },
      { t: 'globe', x: 186, y: 48, d: 80 },
      { t: 'burst', x: 196, y: 119, r: 26, lines: ['WOW!'], f: `8px ${PS}` },
      { t: 'marquee', y: 147, h: 20 },
      { t: 'spark', x: 136, y: 18, big: 1, phase: 0 },
      { t: 'spark', x: 152, y: 98, big: 0, phase: 1 },
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
// The mask grown by one pixel all round (8-neighbour): the keyline.
function grow(mask) {
  const w = mask.width, h = mask.height, a = mask.getContext('2d').getImageData(0, 0, w, h).data;
  const o = canvas(w + 2, h + 2), x = o.getContext('2d'); x.fillStyle = '#fff';
  const on = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3];
  for (let y = -1; y <= h; y++) for (let xx = -1; xx <= w; xx++) {
    let hit = 0;
    for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1; dx++) if (on(xx + dx, y + dy)) { hit = 1; break; }
    if (hit) x.fillRect(xx + 1, y + 1, 1, 1);
  }
  return o;
}
// Hand-shaded type: every pixel of the face picks its colour from where it sits in the glyph.
// top/bot: the two bands of the face; hi: a pixel's top edge; lo: its bottom edge.
const STYLES = {
  gold: { top: '#ffff00', bot: '#ffcc00', hi: '#ffffff', lo: '#ff9900', split: 0.5, key: 'black', ext: 'navy' },
  gold2: { top: '#ffff00', bot: '#ffcc00', split: 0.5, key: 'black', ext: 'navy' },
  silver: { top: '#ffffff', bot: '#ccccff', lo: '#9999cc', split: 0.5, key: 'black', ext: 'navy' },
  white2: { top: '#ffffff', bot: '#ccffff', split: 0.5, key: 'black', ext: 'navy' },
};
function face(mask, st) {
  const w = mask.width, h = mask.height, a = mask.getContext('2d').getImageData(0, 0, w, h).data;
  const o = canvas(w, h), x = o.getContext('2d');
  const on = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && a[(yy * w + xx) * 4 + 3];
  for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
    if (!on(xx, y)) continue;
    let c = y < Math.round(h * st.split) ? st.top : st.bot;
    if (st.hi && !on(xx, y - 1)) c = st.hi;
    else if (st.lo && !on(xx, y + 1)) c = st.lo;
    x.fillStyle = c; x.fillRect(xx, y, 1, 1);
  }
  return o;
}
// A sprite: a shaded face in a black keyline over a solid pixel extrusion down and to the right.
function fancy(mask, st, ext) {
  const sil = grow(mask);
  const o = canvas(sil.width + ext, sil.height + ext), x = o.getContext('2d');
  const back = tint(sil, st.ext);
  for (let i = ext; i >= 1; i--) x.drawImage(back, i, i);
  x.drawImage(tint(sil, st.key), 0, 0);
  x.drawImage(face(mask, st), 1, 1);
  return o;
}
// The plain sprite, for type too small to shade: one colour over a solid extrusion.
function sprite(mask, fill, ext = 0, extColour = 'navy') {
  const o = canvas(mask.width + ext, mask.height + ext), x = o.getContext('2d');
  const back = tint(mask, extColour);
  for (let i = ext; i >= 1; i--) x.drawImage(back, i, i);
  x.drawImage(tint(mask, fill), 0, 0);
  return o;
}

// ---------- build every element as one or two pre-drawn frames ----------
const layers = []; // { frames: [canvas, canvas?], x, y, rate (frame swaps per second), phase }
let globeItem = null;
for (const it of F.items) {
  if (it.t === 'text') {
    const m = textMask(it.s, it.f);
    let frames;
    if (it.style === 'plain') {
      frames = [sprite(m, it.fill, it.ext)];
      if (it.blink) frames.push(sprite(m, it.blink, it.ext));
    } else {
      frames = [fancy(m, STYLES[it.style], it.ext)];
      if (it.blink) frames.push(fancy(m, STYLES.white2, it.ext));
    }
    const x = it.align === 'l' ? it.x : Math.round(it.x - (frames[0].width - it.ext) / 2);
    layers.push({ frames, x, y: it.y, rate: 2 });
  } else if (it.t === 'burst') {
    layers.push(burst(it));
  } else if (it.t === 'button') {
    layers.push(button(it));
  } else if (it.t === 'globe') {
    globeItem = it;
    layers.push({ globe: true });
  } else if (it.t === 'marquee') {
    layers.push(marquee(it));
  } else if (it.t === 'spark') {
    layers.push(spark(it));
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
    // a smaller copy of the star, for the hand-shaded rim
    const inner = canvas(size, size), ix = inner.getContext('2d');
    ix.translate(size / 2, size / 2);
    ix.beginPath();
    for (let i = 0; i < N * 2; i++) {
      const a = (i / (N * 2)) * TAU + (k * Math.PI) / N, r = (i % 2 ? it.r * 0.74 : it.r) - 3;
      ix.lineTo(Math.sin(a) * r, -Math.cos(a) * r);
    }
    ix.closePath(); ix.fillStyle = '#fff'; ix.fill();
    harden(inner);
    // navy drop, black keyline, dark red rim, red body, a lighter catch-light up and to the left
    const o = canvas(size + 4, size + 4), y = o.getContext('2d');
    const ink = tint(shape, 'black');
    y.drawImage(tint(shape, 'navy'), 3, 3);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) y.drawImage(ink, dx, dy);
    y.drawImage(tint(shape, '#990000'), 1, 1);
    y.drawImage(tint(inner, '#ff6666'), 0, 0);
    y.drawImage(tint(inner, 'red'), 1, 1);
    // words
    const masks = it.lines.map((l) => textMask(l, it.f));
    const rows = masks.map((m) => sprite(m, k ? 'white' : 'yellow', 1, 'black'));
    const gap = 3, total = rows.reduce((s, r) => s + r.height, 0) + gap * (rows.length - 1);
    let ty = Math.round((size + 2 - total) / 2);
    for (const r of rows) {
      y.drawImage(r, Math.round((size + 2 - r.width) / 2), ty);
      ty += r.height + gap;
    }
    return o;
  });
  return { frames, x: it.x - (frames[0].width - 2) / 2, y: it.y - (frames[0].height - 2) / 2, rate: 2 }; // on the same 2 Hz beat as the button and the message blink
}

// A pixel sparkle: a four-point twinkle, small on one beat and big on the next.
function spark(it) {
  const S = 11, c0 = 5;
  const frames = [0, 1].map((k) => {
    const big = (k + it.big) % 2;
    const o = canvas(S, S), x = o.getContext('2d');
    const dot = (dx, dy, col) => { x.fillStyle = C[col] || col; x.fillRect(c0 + dx, c0 + dy, 1, 1); };
    const arm = big ? 5 : 2;
    for (let i = 1; i <= arm; i++) {
      const col = i >= arm - (big ? 1 : 0) ? '#99ccff' : '#ffffff';
      dot(i, 0, col); dot(-i, 0, col); dot(0, i, col); dot(0, -i, col);
    }
    if (big) { dot(1, 1, '#ffffff'); dot(-1, 1, '#ffffff'); dot(1, -1, '#ffffff'); dot(-1, -1, '#ffffff'); }
    dot(0, 0, big ? '#ffffff' : '#ffff00');
    return o;
  });
  return { frames, x: it.x - c0, y: it.y - c0, rate: 2, phase: it.phase || 0 };
}

// A pixel CLICK HERE button: yellow slab with a white top-left bevel and an orange bottom-right
// one, black keyline, navy drop; the arrows either side jump in.
function button(it) {
  const m = textMask(it.s, `8px ${PS}`);
  const padX = 10, padY = 5, w = m.width + padX * 2, h = m.height + padY * 2;
  const frames = [0, 1].map((k) => {
    const o = canvas(w + 3, h + 3), x = o.getContext('2d');
    x.fillStyle = C.navy; x.fillRect(3, 3, w, h);
    x.fillStyle = C.black; x.fillRect(0, 0, w, h);
    x.fillStyle = k ? '#ff9900' : '#ffcc00'; x.fillRect(1, 1, w - 2, h - 2);
    x.fillStyle = k ? '#ffffcc' : C.white; x.fillRect(1, 1, w - 3, h - 3);
    x.fillStyle = k ? C.white : C.yellow; x.fillRect(2, 2, w - 4, h - 4);
    x.drawImage(tint(m, k ? 'navy' : 'blue'), padX, padY);
    // arrows: 3 px tall triangles, one pixel further in on the second frame
    x.fillStyle = k ? C.navy : C.blue;
    const ay = padY + Math.floor(m.height / 2), inset = 3 + k;
    for (let i = 0; i < 3; i++) {
      x.fillRect(inset + i, ay - (2 - i), 1, (2 - i) * 2 + 1);
      x.fillRect(w - 1 - inset - i, ay - (2 - i), 1, (2 - i) * 2 + 1);
    }
    return o;
  });
  return { frames, x: Math.round(it.x - w / 2), y: Math.round(it.y - h / 2), rate: 2 };
}

// The marquee: a navy strip, edge to edge, ruled in yellow, the five lines crawling right to
// left with a pixel star between each. The run is padded to a whole number of pixels per video
// frame, so it moves in even steps and comes round exactly once in the loop.
function starMask() {
  // a 9 px five-point star, drawn by hand
  const rows = ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.'];
  const c = canvas(9, 9), x = c.getContext('2d'); x.fillStyle = '#fff';
  rows.forEach((r, y) => [...r].forEach((ch, xx) => { if (ch === '#') x.fillRect(xx, y, 1, 1); }));
  return c;
}
function marquee(it) {
  const font = `8px ${PS}`;
  const words = MARQUEE.map((s) => sprite(textMask(s, font), 'white', 1, 'black'));
  const star = sprite(starMask(), 'yellow', 1, '#ff9900');
  const textW = words.reduce((s, w) => s + w.width, 0);
  const minGap = star.width + 24;
  const STEP = DURATION * FPS;
  let L = Math.ceil((textW + minGap * words.length) / STEP) * STEP; // whole pixels a frame
  const gap = (L - textW) / words.length;
  const run = canvas(L, 12), rx = run.getContext('2d');
  let x = 0;
  words.forEach((w, i) => {
    const x0 = Math.round(x);
    rx.drawImage(w, x0, 1);
    const sx0 = Math.round(x + w.width + gap / 2 - star.width / 2);
    rx.drawImage(star, sx0, 0);
    x += w.width + gap;
  });
  const band = canvas(W, it.h), bx = band.getContext('2d');
  bx.fillStyle = C.black; bx.fillRect(0, 0, W, it.h);
  bx.fillStyle = '#ffcc00'; bx.fillRect(0, 1, W, 1); bx.fillRect(0, it.h - 2, W, 1);
  bx.fillStyle = C.navy; bx.fillRect(0, 2, W, it.h - 4);
  bx.fillStyle = '#000099'; bx.fillRect(0, 2, W, 1);
  return { marquee: true, band, run, L, y: it.y, ty: Math.round(it.y + (it.h - 12) / 2) + 1 };
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
const globeDrop = canvas(D, D), dx = globeDrop.getContext('2d');
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
  dx.clearRect(0, 0, D, D); dx.drawImage(globeOut, 0, 0);
  dx.globalCompositeOperation = 'source-in'; dx.fillStyle = C.navy; dx.fillRect(0, 0, D, D);
  dx.globalCompositeOperation = 'source-over';
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

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  drawGlobe(Math.floor(t * GIF_FPS + 1e-6) % (DURATION * GIF_FPS));
  g.drawImage(bgCanvas, 0, 0);
  for (const L of layers) {
    if (L.globe) {
      // a solid navy drop down and to the right, like the type's, then the sprite
      const gx0 = Math.round(globeItem.x - D / 2), gy0 = Math.round(globeItem.y - D / 2);
      g.drawImage(globeDrop, gx0 + 3, gy0 + 3);
      g.drawImage(globeOut, gx0, gy0);
      continue;
    }
    if (L.marquee) {
      g.drawImage(L.band, 0, L.y);
      // whole GIF pixels per video frame, right to left, once round in the loop
      const off = Math.floor(t * FPS + 1e-6) * (L.L / (DURATION * FPS)) % L.L;
      g.save(); g.beginPath(); g.rect(0, L.y + 2, W, L.band.height - 4); g.clip();
      for (let x = -off; x < W; x += L.L) g.drawImage(L.run, Math.round(x), L.ty);
      g.restore();
      continue;
    }
    const k = L.frames.length > 1 ? (Math.floor(t * L.rate + 1e-6) + (L.phase || 0)) % 2 : 0;
    g.drawImage(L.frames[k], Math.round(L.x), Math.round(L.y));
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
