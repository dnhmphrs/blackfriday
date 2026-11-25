// GME Black Friday: the shop-window poster.
// A dayglo poster board, hand-lettered in red and black marker, taped up in the window of the
// Gary Mustard Enterprises head office, seen at night through the glass: the office park and
// its monument sign reflected in the pane, condensation, a neon SALE sign, a GME door decal.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)

import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;

// Per format, in stage pixels:
//   poster  centre, width (the board is 4:5), rotation in degrees
//   burst   the red TODAY ONLY cut-out: centre, radius, rotation
//   card    the pink "But wait" card: centre, width, rotation
//   neon    the neon SALE sign: centre and letter size
//   decal   the white vinyl door decal: left, top, width
//   hz      where the reflected horizon sits; mono: x of the reflected monument sign
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    poster: { x: 532, y: 800, w: 912, r: -1.6 },
    burst: { x: 905, y: 282, r: 128, rot: 12 },
    card: { x: 838, y: 1418, w: 372, r: 4.5 },
    neon: { x: 226, y: 140, s: 104 },
    decal: { x: 60, y: 1380, w: 340, logo: 0.72 },
    hz: 1900, mono: 820, labels: 0,
    globe: { x: 530, y: 1462, r: 90 }, // low, in the gap between decal and card: inside the 9x16 safe zone
    drips: [0.385, 0.975, 0.03],
  },
  '1x1': {
    w: 1080, h: 1080,
    poster: { x: 392, y: 548, w: 700, r: -1.8 },
    burst: { x: 680, y: 140, r: 104, rot: 12 },
    card: { x: 880, y: 860, w: 360, r: 5 },
    neon: { x: 912, y: 282, s: 74 },
    decal: { x: 808, y: 372, w: 236 },
    hz: 716, mono: 935, labels: 0, monoScale: 0.68, park: false,
    globe: { x: 932, y: 116, r: 78 },
  },
  'banner-v': {
    w: 1080, h: 2025,
    poster: { x: 540, y: 905, w: 1010, r: -1.5 },
    burst: { x: 952, y: 318, r: 140, rot: 12 },
    card: { x: 772, y: 1712, w: 520, r: 4 },
    neon: { x: 250, y: 168, s: 122 },
    decal: { x: 56, y: 1640, w: 380 },
    hz: 2040, mono: 850, labels: 0, park: false, monoScale: 0.85,
    globe: { x: 690, y: 146, r: 112 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const W = F.w, H = F.h;

const stage = document.getElementById('stage');
stage.style.width = W + 'px';
stage.style.height = H + 'px';
const main = document.getElementById('main');
main.width = W; main.height = H;
const ctx = main.getContext('2d');

// A seeded random, so every render is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return [c, c.getContext('2d')]; }
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };

// ---------- fonts and marks ----------
const MARKER = '"Permanent Marker"';
const FACES = ['400 100px "Permanent Marker"', '400 100px "Tilt Neon"', 'italic 400 40px "EB Garamond"', '500 40px "EB Garamond"',
  '500 40px "Libre Franklin"', '600 40px "Libre Franklin"', '700 40px "Libre Franklin"', '800 40px "Libre Franklin"', '900 40px "Libre Franklin"',
  '500 30px "IBM Plex Mono"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));
const loadImage = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const [primary, halves, wire] = await Promise.all(['gme-primary', 'family-globe-halves', 'wire-globe'].map((n) => loadImage(`/assets/gme/${n}.png`)));
// a GME mark in any colour (a mask, never redrawn)
function tinted(img, color, sx = 0, sy = 0, sw = img.width, sh = img.height) {
  const [c, g] = mk(sw, sh);
  g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, sw, sh);
  return c;
}

// ---------- marker lettering ----------
// Hand lettering: every letter gets its own small tilt, bob and size, the fill is laid in with
// visible diagonal marker strokes, slightly off-register from its outline.
const PW = 1600, PH = 2000;
const [tmp, tg] = mk(PW, PH);
function layout(g, text, size, o) {
  const rnd = mulberry(o.seed || 1);
  g.font = `400 ${size}px ${o.font || MARKER}`;
  let x = 0;
  const out = [];
  for (const ch of text) {
    const s = 1 + (rnd() - 0.5) * 2 * (o.scaleVar ?? 0.035);
    const r = (rnd() - 0.5) * 2 * (o.rot ?? 0.035);
    const dy = (rnd() - 0.5) * 2 * (o.bob ?? 0.025) * size;
    const adv = g.measureText(ch).width * s;
    out.push({ ch, x, s, r, dy });
    x += adv + (o.track ?? -0.01) * size;
  }
  return { glyphs: out, width: x - (o.track ?? -0.01) * size };
}
function fitSize(g, text, width, o = {}) {
  const l = layout(g, text, 100, o);
  return (100 * width) / l.width;
}
function marker(g, text, x, y, size, o = {}) {
  const L = layout(g, text, size, o);
  if (o.align === 'center') x -= L.width / 2;
  if (o.align === 'right') x -= L.width;
  const pass = (c, fn, dx = 0, dy = 0) => {
    c.font = `400 ${size}px ${o.font || MARKER}`;
    c.textBaseline = 'alphabetic';
    for (const p of L.glyphs) {
      c.save();
      c.translate(x + p.x + dx, y + p.dy + dy);
      c.rotate(p.r); c.scale(p.s, p.s);
      fn(c, p.ch);
      c.restore();
    }
  };
  g.save();
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (o.shadow) {
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = o.shadow.color; g.strokeStyle = o.shadow.color;
    g.lineWidth = o.outline ? o.outline.w : size * 0.02;
    pass(g, (c, ch) => { c.fillText(ch, 0, 0); c.strokeText(ch, 0, 0); }, o.shadow.dx * size, o.shadow.dy * size);
  }
  // the fill, with streaks, through a scratch layer
  tg.clearRect(0, 0, PW, PH);
  tg.save();
  tg.fillStyle = o.fill;
  const mis = o.misreg || [0, 0];
  pass(tg, (c, ch) => c.fillText(ch, 0, 0), mis[0] * size, mis[1] * size);
  tg.globalCompositeOperation = 'source-atop';
  const rnd = mulberry((o.seed || 1) * 31 + 7);
  const step = size * (o.streakStep || 0.075);
  const ang = rad(o.streakAng ?? -62);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const x0 = x - size, x1 = x + L.width + size;
  tg.lineCap = 'round';
  for (let sx = x0; sx < x1; sx += step * (0.75 + rnd() * 0.5)) {
    const dark = rnd() < 0.6;
    tg.strokeStyle = dark ? (o.streakDark || 'rgba(60,0,0,0.16)') : (o.streakLight || 'rgba(255,255,255,0.10)');
    tg.lineWidth = step * (0.35 + rnd() * 0.5);
    const len = size * 2.2;
    tg.beginPath();
    tg.moveTo(sx - ca * len * 0.5, y - size * 0.35 - sa * len * 0.5);
    tg.lineTo(sx + ca * len * 0.5, y - size * 0.35 + sa * len * 0.5);
    tg.stroke();
  }
  tg.restore();
  g.globalCompositeOperation = o.fillBlend || (o.outline ? 'source-over' : 'multiply');
  g.drawImage(tmp, 0, 0);
  if (o.outline) {
    g.globalCompositeOperation = 'multiply';
    g.strokeStyle = o.outline.color; g.lineWidth = o.outline.w;
    pass(g, (c, ch) => c.strokeText(ch, 0, 0));
  }
  g.restore();
  return { x, width: L.width };
}
// a wobbly hand-drawn marker line through points
function scrawl(g, pts, width, color, seed = 3, wob = 4) {
  const rnd = mulberry(seed);
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  pts.forEach(([px, py], i) => {
    const jx = px + (rnd() - 0.5) * wob, jy = py + (rnd() - 0.5) * wob;
    if (i === 0) g.moveTo(jx, jy);
    else { const [qx, qy] = pts[i - 1]; g.quadraticCurveTo((qx + px) / 2 + (rnd() - 0.5) * wob * 2, (qy + py) / 2 + (rnd() - 0.5) * wob * 2, jx, jy); }
  });
  g.stroke();
  g.restore();
}
function paperTexture(g, w, h, base, seed, { fibres = 1 } = {}) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  const rnd = mulberry(seed);
  // fluorescent stock: a brighter heart, slightly duller edges
  const glow = g.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
  glow.addColorStop(0, 'rgba(255,255,255,0.10)'); glow.addColorStop(1, 'rgba(0,0,0,0.10)');
  g.fillStyle = glow; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h * 0.004 * fibres; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(80,40,0,0.06)';
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 1 + rnd() * 1.5);
  }
}

// the GME inspection sticker: printed, navy, slightly glossy
function sticker(g, x, y, k, r) {
  const st = { w: 300 * k, h: 170 * k };
  g.save();
  g.translate(x, y); g.rotate(rad(r)); g.scale(k, k);
  g.shadowColor = 'rgba(40,0,20,0.35)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
  g.fillStyle = '#16275f'; g.fillRect(-150, -85, 300, 170);
  g.shadowColor = 'transparent';
  g.strokeStyle = 'rgba(240,238,228,0.9)'; g.lineWidth = 2.5; g.strokeRect(-141, -76, 282, 152);
  g.drawImage(tinted(primary, '#f0eee4', 0, 0, 300, 610), -128, -61, 122 * (300 / 610), 122);
  g.fillStyle = '#f0eee4';
  g.font = '800 30px "Libre Franklin"'; g.fillText('APPROVED', -58, -27);
  g.font = '500 17px "Libre Franklin"';
  g.fillText('GME Signage Dept.', -57, 1);
  g.fillText('Form 30-OFF / Rev. 2026', -57, 23);
  g.font = '500 15px "IBM Plex Mono"';
  g.fillText('No. 0000030', -57, 51);
  const sh = g.createLinearGradient(-150, -85, 150, 85);
  sh.addColorStop(0.35, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.65, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(-150, -85, 300, 170);
  g.restore();
}

// ---------- the poster (1600 x 2000) ----------
const RED = '#e4141f', BLACK = '#0b080c';
const [poster, pg] = mk(PW, PH);
paperTexture(pg, PW, PH, '#f3fa2c', 11);
{
  const M = 74;
  // BLACK  (left, leaving the top-right corner for the cut-out)
  let s = fitSize(pg, 'BLACK', 1190, { seed: 2 });
  marker(pg, 'BLACK', M + 6, 92 + s * 0.74, s, { fill: BLACK, seed: 2, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  const y1 = 92 + s * 0.74;
  s = fitSize(pg, 'FRIDAY!!', PW - 2 * M, { seed: 4 });
  const y2 = y1 + s * 0.86;
  marker(pg, 'FRIDAY!!', M, y2, s, { fill: BLACK, seed: 4, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  // two red underlines, the second shorter
  scrawl(pg, [[M + 10, y2 + 52], [520, y2 + 44], [1000, y2 + 50], [PW - M - 30, y2 + 38]], 26, RED, 5, 6);
  scrawl(pg, [[M + 120, y2 + 98], [700, y2 + 92], [PW - M - 220, y2 + 90]], 20, RED, 6, 6);
  // 30%: the whole point. Red, black outline, black drop.
  s = fitSize(pg, '30%', 1330, { seed: 8, track: 0.02 });
  const y3 = y2 + 130 + s * 0.74;
  marker(pg, '30%', M + 30, y3, s, { fill: RED, seed: 8, track: 0.02, outline: { color: BLACK, w: s * 0.06 }, shadow: { color: BLACK, dx: 0.04, dy: 0.035 }, misreg: [-0.01, -0.008] });
  // OFF EVERYTHING!  boxed in black
  s = fitSize(pg, 'OFF EVERYTHING!', 1370, { seed: 9 });
  const y4 = y3 + 110 + s * 0.78;
  marker(pg, 'OFF EVERYTHING!', M + 46, y4, s, { fill: RED, seed: 9, outline: { color: BLACK, w: s * 0.07 }, misreg: [-0.012, -0.01] });
  const bx0 = M + 6, bx1 = M + 46 + 1370 + 36, by0 = y4 - s * 0.92, by1 = y4 + s * 0.24;
  scrawl(pg, [[bx0 + 10, by0], [bx1, by0 - 8], [bx1 + 6, by1], [bx0, by1 + 6], [bx0 - 4, by0 + 20], [bx0 + 60, by0 - 4]], 16, BLACK, 10, 7);
  // ALL WEBSITES
  s = fitSize(pg, 'ALL WEBSITES', PW - 2 * M - 120, { seed: 12 });
  const y5 = by1 + 50 + s * 0.78;
  marker(pg, 'ALL WEBSITES', M + 10, y5, s, { fill: BLACK, seed: 12, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  // the small print, in a thinner hand
  const note = 'fri 27 nov. black friday only.';
  s = fitSize(pg, note, 820, { seed: 14, rot: 0.05 });
  marker(pg, note, M + 20, Math.min(PH - 50, y5 + 30 + s * 0.9), s, { fill: '#2a1d25', seed: 14, rot: 0.05, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  window.__posterBottom = y5;
}

// ---------- the red cut-out starburst ----------
const BN = 900;
const [burst, bg] = mk(BN, BN);
{
  const rnd = mulberry(21);
  const pts = [];
  const N = 18;
  for (let i = 0; i < N * 2; i++) {
    const a = (i / (N * 2)) * TAU - Math.PI / 2;
    const r = (i % 2 ? 0.74 : 0.98 - rnd() * 0.07) * BN * 0.48;
    pts.push([BN / 2 + Math.cos(a) * r, BN / 2 + Math.sin(a) * r]);
  }
  bg.save();
  bg.beginPath(); pts.forEach(([x, y], i) => (i ? bg.lineTo(x, y) : bg.moveTo(x, y))); bg.closePath();
  bg.clip();
  paperTexture(bg, BN, BN, '#e3101c', 22, { fibres: 0.6 });
  bg.restore();
  // marker outline round the edge
  bg.save();
  bg.beginPath(); pts.forEach(([x, y], i) => (i ? bg.lineTo(x, y) : bg.moveTo(x, y))); bg.closePath();
  bg.lineJoin = 'round'; bg.strokeStyle = BLACK; bg.lineWidth = 14; bg.stroke();
  bg.restore();
  let s = fitSize(bg, 'TODAY', 470, { seed: 23 });
  marker(bg, 'TODAY', BN / 2, BN / 2 - 8, s, { fill: '#ffe92a', seed: 23, align: 'center', outline: { color: BLACK, w: s * 0.09 }, fillBlend: 'source-over', streakDark: 'rgba(160,90,0,0.18)' });
  s = fitSize(bg, 'ONLY!', 430, { seed: 24 });
  marker(bg, 'ONLY!', BN / 2 + 6, BN / 2 + s * 0.84, s, { fill: '#ffe92a', seed: 24, align: 'center', outline: { color: BLACK, w: s * 0.09 }, fillBlend: 'source-over', streakDark: 'rgba(160,90,0,0.18)' });
}

// ---------- the pink card ----------
const CW = 1000, CH = 640;
const [card, cg] = mk(CW, CH);
{
  paperTexture(cg, CW, CH, '#ff5aa8', 31);
  let s = fitSize(cg, 'BUT WAIT...', 600, { seed: 32 });
  marker(cg, 'BUT WAIT...', 70, 70 + s * 0.78, s, { fill: BLACK, seed: 32, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  const y1 = 70 + s * 0.78;
  s = fitSize(cg, "THERE'S LESS!", CW - 130, { seed: 34 });
  const y2 = y1 + 40 + s * 0.85;
  marker(cg, "THERE'S LESS!", 64, y2, s, { fill: BLACK, seed: 34, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  scrawl(cg, [[560, y2 + 34], [760, y2 + 30], [CW - 70, y2 + 24]], 16, BLACK, 35, 5);
  const n = 'no purchase necessary!';
  s = fitSize(cg, n, 820, { seed: 36, rot: 0.05 });
  marker(cg, n, 70, CH - 58, s, { fill: '#3a0618', seed: 36, rot: 0.05, streakDark: 'rgba(0,0,0,0.25)', streakLight: 'rgba(255,255,255,0.035)' });
  sticker(cg, CW - 140, 122, 0.78, 9);
}

// masking tape
function tape(g, x, y, w, h, r, seed) {
  const rnd = mulberry(seed);
  g.save();
  g.translate(x, y); g.rotate(rad(r));
  g.beginPath();
  const zig = (x0, top, bot, dir) => { const n = 7; for (let i = 0; i <= n; i++) { const yy = top + ((bot - top) * i) / n; g.lineTo(x0 + dir * (rnd() * 5), yy); } };
  g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); zig(w / 2, -h / 2, h / 2, 1); g.lineTo(-w / 2, h / 2); zig(-w / 2, h / 2, -h / 2, -1);
  g.closePath();
  g.fillStyle = 'rgba(232,222,190,0.62)'; g.fill();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = 'rgba(200,190,160,0.35)'; g.fill();
  g.restore();
}

// ---------- the shop interior behind the glass: the GME night gradient ----------
const [interior, ig] = mk(W, H);
{
  const gr = ig.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#010207'); gr.addColorStop(0.25, '#040a22'); gr.addColorStop(0.6, '#0a1a4e'); gr.addColorStop(0.85, '#14296a'); gr.addColorStop(1, '#2a3d78');
  ig.fillStyle = gr; ig.fillRect(0, 0, W, H);
  // ceiling tubes, way out of focus
  ig.save();
  ig.filter = 'blur(18px)';
  for (const [x, y, w, a] of [[W * 0.12, H * 0.03, W * 0.5, 0.45], [W * 0.58, H * 0.06, W * 0.36, 0.3]]) {
    ig.fillStyle = `rgba(200,225,255,${a})`; ig.fillRect(x, y, w, 16);
  }
  ig.restore();
}

// ---------- neon SALE ----------
const NEON = '#ff2d5c';
const NEON_WORD = 'SALE';
const [neonOn, nog] = mk(F.neon.s * 4.4, F.neon.s * 2.4);
const [neonOff, nfg] = mk(F.neon.s * 4.4, F.neon.s * 2.4);
{
  const s = F.neon.s, cx = neonOn.width / 2, cy = neonOn.height / 2 + s * 0.34;
  for (const [g, on] of [[nog, true], [nfg, false]]) {
    g.font = `400 ${s}px "Tilt Neon"`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    if (on) {
      for (const [b, a] of [[s * 0.5, 0.75], [s * 0.2, 0.9], [s * 0.06, 1]]) { g.shadowColor = NEON; g.shadowBlur = b; g.fillStyle = `rgba(255,70,110,${a})`; g.fillText(NEON_WORD, cx, cy); }
      g.shadowBlur = 0; g.fillStyle = '#ffe3ea'; g.globalAlpha = 0.9;
      g.font = `400 ${s * 0.985}px "Tilt Neon"`; g.fillText(NEON_WORD, cx, cy - s * 0.005);
    } else {
      g.fillStyle = 'rgba(120,60,80,0.55)'; g.fillText(NEON_WORD, cx, cy);
    }
    // the frame tube
    g.globalAlpha = 1;
    g.lineWidth = s * 0.05; g.lineJoin = 'round';
    const bw = s * 3.6, bh = s * 1.45;
    g.beginPath(); g.roundRect(cx - bw / 2, cy - s * 1.05, bw, bh, s * 0.35);
    if (on) { g.shadowColor = '#3d7bff'; g.shadowBlur = s * 0.3; g.strokeStyle = '#b8d0ff'; g.stroke(); g.shadowBlur = s * 0.05; g.stroke(); }
    else { g.strokeStyle = 'rgba(70,90,140,0.6)'; g.stroke(); }
  }
}
// the N buzzes: brightness of the sign over the loop
function neonLevel(t) {
  let k = 1;
  for (const [a, b] of [[3.05, 3.12], [3.22, 3.26], [3.4, 3.47], [9.62, 9.7]]) if (t >= a && t < b) k = 0.18;
  return k;
}

// ---------- the reflection: the office park behind us, mirrored in the glass ----------
const [refl, rg] = mk(W, H);
const stacksAt = [];
{
  const hz = F.hz;
  const sky = rg.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, 'rgba(0,0,0,0)'); sky.addColorStop(clamp((hz - 500) / H), 'rgba(20,40,100,0.25)');
  sky.addColorStop(clamp(hz / H), 'rgba(120,150,210,0.75)'); sky.addColorStop(clamp((hz + 30) / H), 'rgba(30,40,70,0.6)'); sky.addColorStop(1, 'rgba(10,14,30,0.6)');
  rg.fillStyle = sky; rg.fillRect(0, 0, W, H);
  // the office park, drawn as seen (we mirror the whole layer later), so the monument reads backwards
  const mx = W - F.mono;
  const u = (W / 1080) * (F.monoScale || 1);
  const park = F.park !== false;
  const bx0 = mx + 150 * u, bx1 = W + 40, bTop = hz - 110 * u;
  if (park) {
  rg.fillStyle = '#0d1636'; rg.fillRect(bx0, bTop, bx1 - bx0, hz - bTop);
  rg.fillStyle = '#18234d'; rg.fillRect(bx0, bTop - 8 * u, bx1 - bx0, 10 * u);
  const rw = mulberry(51);
  for (const row of [0.3, 0.62]) {
    for (let x = bx0 + 12 * u; x < bx1; x += 22 * u) {
      const lit = rw() < 0.72;
      rg.fillStyle = lit ? (rw() < 0.8 ? 'rgba(205,225,255,0.85)' : 'rgba(255,214,150,0.85)') : 'rgba(40,55,100,0.8)';
      rg.fillRect(x, bTop + (hz - bTop) * row, 15 * u, 16 * u);
    }
  }
  for (const [dx, hgt] of [[260, 300], [330, 360], [420, 270], [560, 330]]) {
    const x = mx + dx * u;
    if (x > W + 20) continue;
    rg.fillStyle = '#0b1230'; rg.fillRect(x, bTop - hgt * u, 16 * u, hgt * u);
    stacksAt.push([W - (x + 8 * u), bTop - hgt * u - 4 * u]);
  }
  }
  // the monument: concrete base, blue panel with the right-hand 30% gone
  const sw = 380 * u, sh = 180 * u, by = hz - 4 * u;
  rg.fillStyle = '#5d6070'; rg.fillRect(mx - sw * 0.55, by - 52 * u, sw * 1.1, 52 * u);
  const keep = 0.7;
  const pgr = rg.createLinearGradient(0, by - 52 * u - sh, 0, by - 52 * u);
  pgr.addColorStop(0, '#1d4592'); pgr.addColorStop(1, '#3d77d0');
  rg.fillStyle = pgr; rg.fillRect(mx - sw / 2, by - 52 * u - sh, sw * keep, sh);
  rg.fillStyle = '#8a8f9c'; rg.fillRect(mx - sw / 2 + sw * keep, by - 52 * u - sh, 6 * u, sh);
  const mark = tinted(primary, '#eef2ff');
  rg.save();
  rg.beginPath(); rg.rect(mx - sw / 2, by - 52 * u - sh, sw * keep, sh); rg.clip();
  const mh = sh * 0.7, mw = mh * (primary.width / primary.height);
  rg.drawImage(mark, mx - sw / 2 + 16 * u, by - 52 * u - sh + (sh - mh) / 2, mw, mh);
  rg.restore();
  // uplight on the sign, parking lot lamps, wet tarmac streaks
  const up = rg.createRadialGradient(mx - sw * 0.1, by - 30 * u, 0, mx - sw * 0.1, by - 30 * u, sw * 0.9);
  up.addColorStop(0, 'rgba(255,240,210,0.35)'); up.addColorStop(1, 'rgba(255,240,210,0)');
  rg.fillStyle = up; rg.fillRect(0, 0, W, H);
  for (const [x, y, r] of [[mx - 330 * u, hz - 220 * u, 30], [mx + 700 * u, hz - 240 * u, 26], [mx - 700 * u, hz - 200 * u, 22]]) {
    const lg = rg.createRadialGradient(x, y, 0, x, y, r * 5 * u);
    lg.addColorStop(0, 'rgba(255,190,110,0.95)'); lg.addColorStop(0.15, 'rgba(255,160,80,0.5)'); lg.addColorStop(1, 'rgba(255,140,60,0)');
    rg.fillStyle = lg; rg.fillRect(x - r * 5 * u, y - r * 5 * u, r * 10 * u, r * 10 * u);
    rg.fillStyle = 'rgba(255,170,90,0.25)'; rg.fillRect(x - 3 * u, hz + 20 * u, 6 * u, 260 * u);
  }
  // mirror it
  const [m2, m2g] = mk(W, H);
  m2g.filter = 'blur(2.6px)';
  m2g.translate(W, 0); m2g.scale(-1, 1);
  m2g.drawImage(refl, 0, 0);
  rg.clearRect(0, 0, W, H);
  rg.drawImage(m2, 0, 0);
}

// ---------- condensation ----------
const [fog, fg] = mk(W, H);
const [fogFrame, ffg] = mk(W, H);
{
  const rnd = mulberry(61);
  const [n, ng] = mk(W / 8, H / 8);
  const img = ng.createImageData(n.width, n.height);
  for (let i = 0; i < img.data.length; i += 4) { const v = 200 + rnd() * 55; img.data[i] = v - 20; img.data[i + 1] = v - 10; img.data[i + 2] = v; img.data[i + 3] = 40 + rnd() * 140; }
  ng.putImageData(img, 0, 0);
  fg.save(); fg.filter = 'blur(10px)'; fg.drawImage(n, 0, 0, W, H); fg.restore();
  // keep it to the bottom of the pane and the corners
  fg.globalCompositeOperation = 'destination-in';
  const m = fg.createLinearGradient(0, 0, 0, H);
  m.addColorStop(0, 'rgba(0,0,0,0.35)'); m.addColorStop(0.12, 'rgba(0,0,0,0.0)'); m.addColorStop(0.7, 'rgba(0,0,0,0.0)'); m.addColorStop(0.86, 'rgba(0,0,0,0.55)'); m.addColorStop(1, 'rgba(0,0,0,0.95)');
  fg.fillStyle = m; fg.fillRect(0, 0, W, H);
  fg.globalCompositeOperation = 'source-over';
  // corner blooms
  for (const [x, y, r] of [[0, H * 0.55, W * 0.32], [W, H * 0.62, W * 0.26]]) {
    const cgr = fg.createRadialGradient(x, y, 0, x, y, r);
    cgr.addColorStop(0, 'rgba(205,215,240,0.32)'); cgr.addColorStop(1, 'rgba(205,215,240,0)');
    fg.fillStyle = cgr; fg.fillRect(0, 0, W, H);
  }
  // beads of water where it is thickest
  for (let i = 0; i < 900; i++) {
    const y = H * (0.72 + 0.28 * Math.sqrt(rnd())), x = rnd() * W, r = 1 + rnd() * rnd() * 7;
    fg.fillStyle = 'rgba(10,16,40,0.35)'; fg.beginPath(); fg.arc(x + r * 0.25, y + r * 0.3, r, 0, TAU); fg.fill();
    fg.fillStyle = 'rgba(235,240,255,0.55)'; fg.beginPath(); fg.arc(x - r * 0.25, y - r * 0.3, r * 0.45, 0, TAU); fg.fill();
  }
}
// three drips; each runs for part of the loop and its trail has gone by the time it restarts
const DRIPS = [
  // in the gaps between the decal and the card, and down the left edge, so no trail reads as a sign post
  { x: W * (F.drips ? F.drips[0] : 0.455), y0: H * 0.74, len: H * 0.24, t0: 1.0, run: 5.5 },
  { x: W * (F.drips ? F.drips[1] : 0.53), y0: H * 0.8, len: H * 0.18, t0: 5.2, run: 4.8 },
  { x: W * (F.drips ? F.drips[2] : 0.03), y0: H * 0.7, len: H * 0.28, t0: 8.4, run: 6.0 },
];

// ---------- the door decal: white vinyl on the outside of the glass ----------
const [decal, dg] = mk(W, H);
{
  const d = F.decal, k = d.w / 410;
  dg.fillStyle = '#f4f2ec';
  const mh = 168 * k * (d.logo || 1), mw = mh * (primary.width / primary.height);
  dg.drawImage(tinted(primary, '#f4f2ec'), d.x, d.y, mw, mh);
  let y = d.y + mh + 46 * k;
  dg.font = `700 ${25 * k}px "Libre Franklin"`;
  dg.letterSpacing = `${4 * k}px`;
  dg.fillText('OPEN 24 HRS  ·  EST2026', d.x + 4 * k, y);
  dg.letterSpacing = '0px';
  y += 18 * k;
  dg.fillRect(d.x + 4 * k, y, d.w - 8 * k, 2 * k);
  y += 40 * k;
  dg.font = `italic 400 ${29 * k}px "EB Garamond"`;
  dg.fillText('The remaining 70% is in good order.', d.x + 4 * k, y);
}
// the brand sheet's corner labels
function labels(g) {
  if (!F.labels) return;
  g.save();
  g.fillStyle = 'rgba(240,240,236,0.92)';
  g.font = '500 30px "Libre Franklin"';
  const y = F.labels + 4;
  g.fillText('Gary Mustard', 48, y); g.fillText('Enterprises', 48, y + 36);
  g.textAlign = 'center'; g.fillText('EST2026', W / 2, y);
  g.textAlign = 'right'; g.fillText('SAVINGS', W - 48, y); g.fillText('& STUFF', W - 48, y + 36);
  g.restore();
}

// ---------- lighting ----------
// a warm pool from the lamp over the window, falling away to GME blue at the edges
const [light, lg] = mk(W, H);
{
  const P = F.poster;
  lg.fillStyle = '#fff'; lg.fillRect(0, 0, W, H);
  const r = lg.createRadialGradient(P.x, P.y - P.w * 0.55, P.w * 0.1, P.x, P.y, P.w * 1.1);
  r.addColorStop(0, 'rgb(255,252,240)'); r.addColorStop(0.45, 'rgb(238,234,236)'); r.addColorStop(0.8, 'rgb(170,176,212)'); r.addColorStop(1, 'rgb(96,112,176)');
  lg.fillStyle = r; lg.fillRect(0, 0, W, H);
}

// ---------- the chrome cut globe, hanging in the window on fishing line ----------
let globe = null;
if (F.globe) {
  const G = F.globe, S = Math.ceil(G.r * 3.2);
  const gl = document.createElement('canvas');
  const st3 = createStage({ canvas: gl, width: S, height: S, fov: 26 });
  st3.scene.environment = shopNight(st3.renderer);
  st3.key.intensity = 2.2; st3.key.position.set(-4, 6, 6);
  const obj = await buildObject('globe-core');
  obj.userData.slice.visible = false; // the missing 30% is simply gone
  const pivot = new THREE.Group();
  pivot.add(obj);
  st3.scene.add(pivot);
  const half = (S / 2) / G.r; // world units visible above centre
  const dist = half / Math.tan(rad(13));
  st3.camera.position.set(0, dist * Math.sin(rad(16)), dist * Math.cos(rad(16)));
  st3.camera.lookAt(0, 0, 0);
  globe = { gl, S, pivot, obj, ...st3 };
}
// The night shop, as the chrome sees it: dark navy room, the ceiling tubes, the pink neon,
// the street-lamp orange behind us. Chrome is only what it reflects.
function shopNight(r, size = 512) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 c = mix(vec3(0.02, 0.05, 0.2), vec3(0.003, 0.006, 0.03), smoothstep(0.0, 0.8, up));
      c = mix(c, vec3(0.2, 0.25, 0.4), smoothstep(0.1, -0.02, up) * smoothstep(-0.3, -0.02, up));
      c = mix(c, vec3(0.01, 0.012, 0.04), smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, col) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...col), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  card(14, 0.8, [-2, 11, 2], [16, 17, 18]);       // ceiling tube
  card(9, 0.7, [4, 10, -4], [10, 11, 12]);        // second tube
  card(4, 2, [-10, 2, 3], [14, 1.4, 4]);          // the pink neon, left
  card(1.2, 14, [11, 1, 2], [6, 8, 12]);          // cool strip right: the rim
  card(3, 3, [2, 1, -12], [9, 5, 1.5]);           // sodium lamp outside, behind
  card(16, 3, [0, -4, 11], [0.3, 0.4, 0.9]);      // glow off the poster, low front
  const pmrem = new THREE.PMREMGenerator(r);
  const tex = pmrem.fromScene(env, 0, 0.1, 200, { size }).texture;
  pmrem.dispose();
  return tex;
}
function drawGlobe(t) {
  if (!globe) return;
  const G = F.globe;
  const swing = Math.sin((t / DURATION) * TAU * 2);
  // turning slowly on its line: three-quarter view, so it reads as a ball with a slice cut out
  globe.pivot.rotation.y = rad(-34 + 22 * Math.sin((t / DURATION) * TAU));
  globe.pivot.rotation.z = rad(2.5 * swing);
  globe.renderer.render(globe.scene, globe.camera);
  const gx = G.x + swing * 5, gy = G.y;
  // the fishing line
  ctx.save();
  ctx.strokeStyle = 'rgba(200,215,255,0.35)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(G.x, -10); ctx.lineTo(gx, gy - G.r * 1.02); ctx.stroke();
  ctx.drawImage(globe.gl, gx - globe.S / 2, gy - globe.S / 2);
  ctx.restore();
}

// ---------- grain ----------
const grain = document.getElementById('grain');
grain.width = W; grain.height = H;
const gctx = grain.getContext('2d');
const [noise, nzg] = mk(512, 512);
{
  const img = nzg.createImageData(512, 512), rn = mulberry(41);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rn() + rn() + rn() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  nzg.putImageData(img, 0, 0);
}
const noisePattern = gctx.createPattern(noise, 'repeat');
const [bloom, blg] = mk(W / 4, H / 4);

// ---------- time ----------
const [reflFrame, rfg] = mk(W, H);
const shapes = [];
function drawObj(img, x, y, w, h, r, tapes = [], extra = null) {
  shapes.push([x, y, w, h, r]);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rad(r));
  ctx.shadowColor = 'rgba(0,0,8,0.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.shadowColor = 'transparent';
  if (extra) extra(w, h);
  for (const [tx, ty, tw, th, tr, seed] of tapes) tape(ctx, tx * w, ty * h, tw * w, th * w, tr, seed);
  ctx.restore();
}

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const P = F.poster;
  const k = neonLevel(t);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.filter = 'none';
  ctx.drawImage(interior, 0, 0);

  // the neon, behind the glass
  const nx = F.neon.x - neonOn.width / 2, ny = F.neon.y - neonOn.height / 2;
  ctx.drawImage(neonOff, nx, ny);
  ctx.globalAlpha = k; ctx.drawImage(neonOn, nx, ny);
  ctx.globalCompositeOperation = 'screen';
  const sp = ctx.createRadialGradient(F.neon.x, F.neon.y, 0, F.neon.x, F.neon.y, F.neon.s * 4.5);
  sp.addColorStop(0, 'rgba(255,45,92,0.35)'); sp.addColorStop(1, 'rgba(255,45,92,0)');
  ctx.fillStyle = sp; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawGlobe(t);

  // the poster, its cut-out and the card; the board breathes in the heater's draught
  const sway = Math.sin((t / DURATION) * TAU * 2) * 0.12;
  shapes.length = 0;
  const pw = P.w, ph = P.w * (PH / PW);
  drawObj(poster, P.x, P.y, pw, ph, P.r + sway * 0.2, [[-0.47, -0.48, 0.16, 0.05, -38, 71], [0.47, 0.49, 0.16, 0.05, -40, 72], [-0.48, 0.48, 0.15, 0.05, 36, 73]]);
  const B = F.burst;
  drawObj(burst, B.x, B.y, B.r * 2, B.r * 2, B.rot + sway, [[0.0, -0.44, 0.3, 0.09, 4, 74]]);
  const C = F.card;
  drawObj(card, C.x, C.y, C.w, C.w * (CH / CW), C.r - sway * 0.6, [[-0.38, -0.5, 0.24, 0.07, -8, 75], [0.4, -0.49, 0.22, 0.07, 10, 76]]);

  // light and shade
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(light, 0, 0);
  // neon spill: tints the paper (soft light keeps the marker black), with only a breath of added light
  const sp2 = ctx.createRadialGradient(F.neon.x, F.neon.y + F.neon.s, 0, F.neon.x, F.neon.y + F.neon.s, P.w * 0.75);
  sp2.addColorStop(0, `rgba(255,40,110,${0.55 * k})`); sp2.addColorStop(1, 'rgba(255,40,110,0)');
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = sp2; ctx.fillRect(0, 0, W, H);
  const sp3 = ctx.createRadialGradient(F.neon.x, F.neon.y + F.neon.s, 0, F.neon.x, F.neon.y + F.neon.s, P.w * 0.6);
  sp3.addColorStop(0, `rgba(255,40,90,${0.045 * k})`); sp3.addColorStop(1, 'rgba(255,40,90,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = sp3; ctx.fillRect(0, 0, W, H);

  // the glass: reflections, blinking stack lights, a car's headlights passing behind us
  // (the bright boards in the window wash most of it out)
  rfg.globalCompositeOperation = 'source-over';
  rfg.clearRect(0, 0, W, H);
  rfg.drawImage(refl, 0, 0);
  rfg.globalCompositeOperation = 'destination-out';
  rfg.fillStyle = 'rgba(0,0,0,0.72)';
  for (const [x, y, w, h, r] of shapes) { rfg.save(); rfg.translate(x, y); rfg.rotate(rad(r)); rfg.fillRect(-w / 2, -h / 2, w, h); rfg.restore(); }
  ctx.globalAlpha = 0.72;
  ctx.drawImage(reflFrame, 0, 0);
  ctx.globalAlpha = 1;
  const blink = (t % 1) < 0.18 ? 1 : 0;
  if (blink) for (const [x, y] of stacksAt) {
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, 26);
    g2.addColorStop(0, 'rgba(255,60,50,0.6)'); g2.addColorStop(1, 'rgba(255,60,50,0)');
    ctx.fillStyle = g2; ctx.fillRect(x - 26, y - 26, 52, 52);
  }
  const car = smooth(5.6, 6.6, t) * (1 - smooth(7.2, 8.6, t));
  if (car > 0) {
    const cx = W * (1.3 - 1.6 * clamp((t - 5.6) / 3));
    const cg2 = ctx.createLinearGradient(cx - W * 0.4, 0, cx + W * 0.4, H * 0.3);
    cg2.addColorStop(0, 'rgba(255,240,220,0)'); cg2.addColorStop(0.5, `rgba(255,240,220,${0.22 * car})`); cg2.addColorStop(1, 'rgba(255,240,220,0)');
    ctx.fillStyle = cg2; ctx.fillRect(0, 0, W, H);
  }
  // a long soft sheen across the pane
  const sh = ctx.createLinearGradient(0, H * 0.1, W, H * 0.55);
  sh.addColorStop(0.3, 'rgba(180,200,255,0)'); sh.addColorStop(0.4, 'rgba(180,200,255,0.13)'); sh.addColorStop(0.44, 'rgba(180,200,255,0)');
  sh.addColorStop(0.47, 'rgba(180,200,255,0)'); sh.addColorStop(0.485, 'rgba(200,215,255,0.12)'); sh.addColorStop(0.5, 'rgba(180,200,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // condensation with its drips
  ffg.globalCompositeOperation = 'source-over';
  ffg.clearRect(0, 0, W, H);
  ffg.drawImage(fog, 0, 0);
  for (const d of DRIPS) {
    const u = (((t - d.t0) % DURATION) + DURATION) % DURATION;
    const p = clamp(u / d.run);
    const fade = 1 - smooth(d.run, DURATION - 0.5, u);
    if (fade <= 0) continue;
    const yh = d.y0 + d.len * (1 - Math.pow(1 - p, 1.6));
    ffg.globalCompositeOperation = 'destination-out';
    ffg.strokeStyle = `rgba(0,0,0,${0.9 * fade})`; ffg.lineWidth = 9; ffg.lineCap = 'round';
    ffg.beginPath(); ffg.moveTo(d.x, d.y0);
    ffg.quadraticCurveTo(d.x + 6, (d.y0 + yh) / 2, d.x + 2, yh); ffg.stroke();
    ffg.globalCompositeOperation = 'source-over';
    if (p < 1) {
      ffg.fillStyle = 'rgba(15,20,45,0.5)'; ffg.beginPath(); ffg.arc(d.x + 3, yh + 3, 8, 0, TAU); ffg.fill();
      ffg.fillStyle = 'rgba(240,244,255,0.75)'; ffg.beginPath(); ffg.arc(d.x, yh, 4, 0, TAU); ffg.fill();
    }
  }
  ctx.drawImage(fogFrame, 0, 0);

  // vinyl on the outside of the glass
  ctx.globalAlpha = 0.94;
  ctx.drawImage(decal, 0, 0);
  ctx.globalAlpha = 1;
  labels(ctx);

  // halation: everything glows a little, like a night photograph through a dirty pane
  blg.clearRect(0, 0, bloom.width, bloom.height);
  blg.filter = 'blur(6px) brightness(0.5) contrast(3)';
  blg.drawImage(main, 0, 0, bloom.width, bloom.height);
  blg.filter = 'none';
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.15;
  ctx.drawImage(bloom, 0, 0, W, H);
  ctx.globalAlpha = 1;
  // vignette
  ctx.globalCompositeOperation = 'multiply';
  const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgb(255,255,255)'); v.addColorStop(1, 'rgb(90,100,140)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // film grain
  const fr = Math.round(t * FPS);
  const rf = mulberry(1000 + fr);
  gctx.clearRect(0, 0, W, H);
  gctx.save();
  gctx.translate(-Math.floor(rf() * 512), -Math.floor(rf() * 512));
  gctx.fillStyle = noisePattern;
  gctx.fillRect(0, 0, W + 512, H + 512);
  gctx.restore();
}

window.comp = { duration: DURATION, fps: FPS, width: W, height: H, glitches: [], setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
