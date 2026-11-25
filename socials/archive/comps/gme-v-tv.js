// GME Shopping Channel. A still off a 1990s/2000s cable shopping channel on Black Friday:
// the product (the internet, as GME's chrome cut globe) turns on a mirrored, bulb-lit turntable
// in a lit studio, and the channel's graphics operator has thrown everything at it: a bevelled
// BLACK FRIDAY title card, a big spiky 30% OFF flash, a dayglo sticker slapped over the shot,
// an item lower third, the station ticker and the store's logo as the channel bug.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createStage, materials } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format (px). hero: the globe's centre and diameter on screen.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    title: { cx: 540, y: 256, w: 930, lines: ['BLACK', 'FRIDAY'], rot: -2.5, depth: 20 },
    hero: { x: 468, y: 878, d: 392 },
    burst: { cx: 850, cy: 846, r: 200, rot: -10 },
    sticker: { cx: 196, cy: 968, r: 116, rot: -16 },
    l3: { x: 34, y: 1226, w: 760, size: 48 },
    bug: { x: 806, y: 1250, w: 250 },
    ticker: { y: 1446, h: 104, size: 48, label: true, speed: 230 },
    foot: { y: 1574, h: 78, size: 40 },
    flare: { x: 0, y: 0 },
  },
  '1x1': {
    w: 1080, h: 1080,
    title: { cx: 540, y: 26, w: 1010, lines: ['BLACK FRIDAY'], rot: -1.5, depth: 16 },
    hero: { x: 470, y: 480, d: 360 },
    burst: { cx: 880, cy: 372, r: 172, rot: -10 },
    sticker: { cx: 166, cy: 548, r: 104, rot: -16 },
    l3: { x: 26, y: 742, w: 720, size: 42 },
    bug: { x: 786, y: 770, w: 262 },
    ticker: { y: 958, h: 92, size: 42, label: true, speed: 210 },
    flare: { x: 120, y: 330 },
  },
  // the extension's own banner, down the right-hand 30% of a desktop page (seen ~400px wide)
  'banner-v': {
    w: 1080, h: 2025,
    title: { cx: 540, y: 56, w: 1000, lines: ['BLACK', 'FRIDAY'], rot: -2.5, depth: 24 },
    hero: { x: 456, y: 920, d: 500 },
    burst: { cx: 836, cy: 712, r: 228, rot: -10 },
    sticker: { cx: 180, cy: 1070, r: 138, rot: -16 },
    l3: { x: 30, y: 1316, w: 1020, size: 68 },
    bug: { x: 335, y: 1652, w: 410 },
    ticker: { y: 1872, h: 128, size: 60, label: true, speed: 300 },
    flare: { x: 120, y: 620 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a, b, k) => a + (b - a) * k;
const mix = (c1, c2, k) => '#' + [0, 1, 2].map((i) => Math.round(lerp(parseInt(c1.substr(1 + i * 2, 2), 16), parseInt(c2.substr(1 + i * 2, 2), 16), k)).toString(16).padStart(2, '0')).join('');

// ---------- fonts and images ----------
await Promise.all(['400 100px "Archivo Black"', '400 100px "Anton"', '700 50px "Arimo"', 'italic 700 50px "Arimo"', '600 40px "Oswald"']
  .map((f) => document.fonts.load(f)));
await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// ---------- SVG filters: the Photoshop "bevel and emboss" every channel's character generator had ----------
function bevelFilter(id, blur, scale, k = 1.0, exp = 16) {
  return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>
    <feSpecularLighting in="b" surfaceScale="${scale}" specularConstant="${k}" specularExponent="${exp}" lighting-color="#ffffff" result="s"><feDistantLight azimuth="225" elevation="38"/></feSpecularLighting>
    <feComposite in="s" in2="SourceAlpha" operator="in" result="si"/>
    <feDiffuseLighting in="b" surfaceScale="${scale}" diffuseConstant="1" lighting-color="#ffffff" result="d"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>
    <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="1.05" k2="0.12" result="lit"/>
    <feComposite in="lit" in2="SourceAlpha" operator="in" result="lit2"/>
    <feComposite in="lit2" in2="si" operator="arithmetic" k2="1" k3="0.95"/>
  </filter>`;
}
$('defs').innerHTML = [
  bevelFilter('bev-s', 2.2, 3), bevelFilter('bev-m', 3.5, 4), bevelFilter('bev-l', 6, 6, 0.8),
  '<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>',
  '<filter id="soft-s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>',
  // the gold sale face: a hard horizon across the middle, like a chrome letter
  `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.3" stop-color="#fff06a"/><stop offset="0.5" stop-color="#ffd000"/><stop offset="0.52" stop-color="#ffa800"/><stop offset="0.8" stop-color="#ff8a00"/><stop offset="1" stop-color="#ffd23a"/></linearGradient>`,
  `<linearGradient id="white" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#eef3ff"/><stop offset="0.53" stop-color="#b9c6e6"/><stop offset="1" stop-color="#ffffff"/></linearGradient>`,
  `<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3a44"/><stop offset="0.48" stop-color="#121218"/><stop offset="0.5" stop-color="#050507"/><stop offset="1" stop-color="#16161c"/></linearGradient>`,
  `<linearGradient id="plate-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a50"/><stop offset="0.5" stop-color="#e3000f"/><stop offset="1" stop-color="#7a0008"/></linearGradient>`,
  `<radialGradient id="burst-red" cx="0.42" cy="0.38" r="0.7"><stop offset="0" stop-color="#ff7a3a"/><stop offset="0.45" stop-color="#f4101a"/><stop offset="1" stop-color="#a5000c"/></radialGradient>`,
  `<radialGradient id="burst-yel" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#fffbb0"/><stop offset="0.6" stop-color="#ffe000"/><stop offset="1" stop-color="#ffb000"/></radialGradient>`,
  `<radialGradient id="dayglo" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#fbff7a"/><stop offset="0.55" stop-color="#eeff1a"/><stop offset="1" stop-color="#c9ef00"/></radialGradient>`,
  `<linearGradient id="backing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f2ea"/><stop offset="0.55" stop-color="#d8d4c8"/><stop offset="1" stop-color="#a9a598"/></linearGradient>`,
].join('');

// Measure a line of type tight to its ink (canvas text metrics).
const mctx = document.createElement('canvas').getContext('2d');
function ink(s, font) {
  mctx.font = `100px ${font}`;
  const m = mctx.measureText(s);
  return { l: m.actualBoundingBoxLeft, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// One line of 3D sale lettering: drop shadow, a stacked extrusion, a black keyline, a bevelled face.
// (x, base) is the baseline-left of the ink; returns svg.
function lettering(s, { x, base, size, font = '"Archivo Black"', face = 'url(#gold)', ext = ['#ff2a1a', '#4a0006'], depth = 18, dx = 0.5, dy = 1, key = 0.05, bevel = 'bev-m', shadow = 0.55, lsp = 0 }) {
  const m = ink(s, font), k = size / 100;
  const tx = x + m.l * k, st = size * key;
  const t = (ox, oy, attrs) => `<text x="${(tx + ox).toFixed(1)}" y="${(base + oy).toFixed(1)}" font-family='${font}' font-size="${size.toFixed(1)}" letter-spacing="${lsp}" ${attrs}>${esc(s)}</text>`;
  let out = '';
  if (shadow) out += t(depth * dx + size * 0.05, depth * dy + size * 0.07, `fill="#000" stroke="#000" stroke-width="${st * 2}" stroke-linejoin="round" opacity="${shadow}" filter="url(#soft)"`);
  out += t(depth * dx, depth * dy, `fill="#000" stroke="#000" stroke-width="${st * 2 + 4}" stroke-linejoin="round"`);
  for (let i = depth; i >= 1; i--) {
    const c = mix(ext[0], ext[1], (i - 1) / Math.max(1, depth - 1));
    out += t(i * dx, i * dy, `fill="${c}" stroke="${c}" stroke-width="${st * 2}" stroke-linejoin="round"`);
  }
  out += t(0, 0, `fill="#000" stroke="#000" stroke-width="${st * 2}" stroke-linejoin="round"`);
  out += t(0, 0, `fill="${face}" filter="url(#${bevel})"`);
  return out;
}

// ---------- the BLACK FRIDAY title card ----------
{
  const T = F.title, font = '"Archivo Black"';
  const pad = T.w * 0.045, inner = T.w - pad * 2 - T.depth * 0.5;
  let y = pad * 0.95; const rows = [];
  for (const s of T.lines) {
    const m = ink(s, font), size = 100 * inner / m.w;
    rows.push({ s, size, base: y + m.a * size / 100 });
    y += m.a * size / 100 + size * 0.1 + T.depth * 0.6;
  }
  const H = y - rows[rows.length - 1].size * 0.1 + pad * 0.75;
  const W = T.w, rim = Math.max(10, T.w * 0.014);
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  // the plate: black gloss, a red bevelled rim, a yellow keyline
  svg += `<rect x="12" y="20" width="${W}" height="${H}" rx="${rim * 2.4}" fill="#000" opacity="0.6" filter="url(#soft)"/>`;
  svg += `<rect x="0" y="0" width="${W}" height="${H}" rx="${rim * 2.4}" fill="#000"/>`;
  svg += `<rect x="${rim * 0.35}" y="${rim * 0.35}" width="${W - rim * 0.7}" height="${H - rim * 0.7}" rx="${rim * 2.1}" fill="url(#plate-rim)" filter="url(#bev-l)"/>`;
  svg += `<rect x="${rim * 1.35}" y="${rim * 1.35}" width="${W - rim * 2.7}" height="${H - rim * 2.7}" rx="${rim * 1.4}" fill="#ffd400"/>`;
  svg += `<rect x="${rim * 1.75}" y="${rim * 1.75}" width="${W - rim * 3.5}" height="${H - rim * 3.5}" rx="${rim * 1.2}" fill="url(#plate)"/>`;
  // a gloss sweep across the top half of the plate
  svg += `<rect x="${rim * 2.2}" y="${rim * 2.2}" width="${W - rim * 4.4}" height="${(H - rim * 4.4) * 0.46}" rx="${rim}" fill="#fff" opacity="0.07"/>`;
  for (const r of rows) svg += lettering(r.s, { x: pad, base: r.base, size: r.size, depth: T.depth, bevel: 'bev-m', shadow: 0.5 });
  svg += '</svg>';
  const el = $('title');
  el.innerHTML = svg;
  el.style.left = (T.cx - W / 2) + 'px'; el.style.top = T.y + 'px';
  el.style.width = W + 'px'; el.style.height = H + 'px';
  el.style.transform = `rotate(${T.rot}deg)`;
  F.titleBottom = T.y + H;
}

// ---------- the spiky flash: 30% OFF ----------
const burstEl = $('burst');
{
  const B = F.burst, R = B.r, rnd = mulberry(7);
  const N = 22, pts = (k, jit) => Array.from({ length: N * 2 }, (_, i) => {
    const a = (i / (N * 2)) * TAU, rr = i % 2 ? 0.74 : 1 + jit[i >> 1];
    return `${(Math.sin(a) * rr * R * k).toFixed(1)},${(-Math.cos(a) * rr * R * k).toFixed(1)}`;
  }).join(' ');
  const jit = Array.from({ length: N }, () => (rnd() - 0.5) * 0.16);
  const S = R * 1.25;
  let svg = `<svg width="${S * 2}" height="${S * 2}" viewBox="${-S} ${-S} ${S * 2} ${S * 2}">`;
  svg += `<polygon points="${pts(1.0, jit)}" fill="#000" opacity="0.55" transform="translate(${R * 0.06},${R * 0.09})" filter="url(#soft)"/>`;
  svg += `<polygon points="${pts(1.0, jit)}" fill="#000" stroke="#000" stroke-width="${R * 0.06}" stroke-linejoin="round"/>`;
  svg += `<polygon points="${pts(0.985, jit)}" fill="url(#burst-yel)" filter="url(#bev-m)"/>`;
  svg += `<polygon points="${pts(0.86, jit)}" fill="#000"/>`;
  svg += `<polygon points="${pts(0.845, jit)}" fill="url(#burst-red)" filter="url(#bev-l)"/>`;
  // 30% / OFF, stacked, fitted inside the inner ring
  const font = '"Archivo Black"';
  const m1 = ink('30%', font), m2 = ink('OFF', font);
  const w1 = R * 1.18, s1 = 100 * w1 / m1.w, w2 = R * 0.96, s2 = 100 * w2 / m2.w;
  const h1 = m1.a * s1 / 100, h2 = m2.a * s2 / 100, gap = R * 0.08, tot = h1 + gap + h2;
  const top = -tot / 2 - R * 0.04;
  svg += `<g transform="rotate(-4)">`;
  svg += lettering('30%', { x: -w1 / 2 - R * 0.02, base: top + h1, size: s1, depth: Math.round(R * 0.055), ext: ['#ffb000', '#5a1a00'], key: 0.055, bevel: 'bev-m', shadow: 0.4, face: 'url(#gold)' });
  svg += lettering('OFF', { x: -w2 / 2 - R * 0.02, base: top + h1 + gap + h2, size: s2, depth: Math.round(R * 0.05), ext: ['#9aa6c8', '#1a1f36'], key: 0.06, bevel: 'bev-m', shadow: 0.4, face: 'url(#white)' });
  svg += `</g></svg>`;
  burstEl.innerHTML = svg;
  burstEl.style.left = (B.cx - S) + 'px'; burstEl.style.top = (B.cy - S) + 'px';
  burstEl.style.width = S * 2 + 'px'; burstEl.style.height = S * 2 + 'px';
}

// ---------- the dayglo sticker, slapped over the product shot, one edge peeling ----------
const stickerEl = $('sticker');
{
  const P = F.sticker, r = P.r, S = r * 1.35;
  // the peel: everything beyond a chord (distance d from the centre, towards the lower right)
  // is lifted and folded back over, showing the paper backing.
  const ang = (48 * Math.PI) / 180, nx = Math.cos(ang), ny = Math.sin(ang), d = r * 0.74;
  const big = r * 4, cx = nx * d, cy = ny * d, tx = -ny, ty = nx;
  const half = `M${cx + tx * big},${cy + ty * big} L${cx - tx * big},${cy - ty * big} L${cx - tx * big - nx * big},${cy - ty * big - ny * big} L${cx + tx * big - nx * big},${cy + ty * big - ny * big}Z`;
  const fx = nx * d * 2, fy = ny * d * 2; // centre of the mirrored circle (the flap)
  let svg = `<svg width="${S * 2}" height="${S * 2}" viewBox="${-S} ${-S} ${S * 2} ${S * 2}"><defs><clipPath id="stuck"><path d="${half}"/></clipPath></defs>`;
  svg += `<g clip-path="url(#stuck)">`;
  svg += `<circle cx="${r * 0.025}" cy="${r * 0.045}" r="${r}" fill="#000" opacity="0.5" filter="url(#soft-s)"/>`;
  svg += `<circle r="${r}" fill="url(#dayglo)"/>`;
  svg += `<circle r="${r * 0.9}" fill="none" stroke="#e8000f" stroke-width="${r * 0.035}"/>`;
  // flat print, no tricks: SAVE / -30% / TODAY ONLY
  const font = '"Archivo Black"';
  const mA = ink('SAVE', font), mB = ink('−30%', font), mC = ink('TODAY ONLY', '"Anton"');
  const sA = 100 * r * 0.62 / mA.w, sB = 100 * r * 1.36 / mB.w, sC = 100 * r * 0.8 / mC.w;
  const hA = mA.a * sA / 100, hB = mB.a * sB / 100, hC = mC.a * sC / 100, g = r * 0.09;
  const t0 = -(hA + hB + hC + g * 2) / 2 - r * 0.06;
  svg += `<text x="${-r * 0.36 + mA.l * sA / 100}" y="${t0 + hA}" font-family='"Archivo Black"' font-size="${sA}" fill="#111">SAVE</text>`;
  svg += `<text x="${-r * 0.74 + mB.l * sB / 100}" y="${t0 + hA + g + hB}" font-family='"Archivo Black"' font-size="${sB}" fill="#e8000f">−30%</text>`;
  svg += `<text x="${-r * 0.48 + mC.l * sC / 100}" y="${t0 + hA + g * 2 + hB + hC}" font-family="Anton" font-size="${sC}" fill="#111">TODAY ONLY</text>`;
  // a sheen across the sticker's gloss
  svg += `<ellipse cx="${-r * 0.3}" cy="${-r * 0.5}" rx="${r * 0.55}" ry="${r * 0.22}" transform="rotate(-25 ${-r * 0.3} ${-r * 0.5})" fill="#fff" opacity="0.28" filter="url(#soft-s)"/>`;
  svg += `</g>`;
  // the flap: the mirrored segment, its paper backing up, casting a shadow
  svg += `<g clip-path="url(#stuck)"><circle cx="${fx + r * 0.05}" cy="${fy + r * 0.08}" r="${r}" fill="#000" opacity="0.45" filter="url(#soft-s)"/></g>`;
  svg += `<g clip-path="url(#stuck)"><circle cx="${fx}" cy="${fy}" r="${r}" fill="url(#backing)"/></g>`;
  const hc = Math.sqrt(r * r - d * d);
  svg += `<line x1="${cx + tx * hc}" y1="${cy + ty * hc}" x2="${cx - tx * hc}" y2="${cy - ty * hc}" stroke="#fff" stroke-width="${r * 0.025}" stroke-linecap="round" opacity="0.8"/>`;
  svg += `</svg>`;
  stickerEl.innerHTML = svg;
  stickerEl.style.left = (P.cx - S) + 'px'; stickerEl.style.top = (P.cy - S) + 'px';
  stickerEl.style.width = S * 2 + 'px'; stickerEl.style.height = S * 2 + 'px';
  stickerEl.style.transform = `rotate(${P.rot}deg)`;
}

// ---------- lower third, bug, ticker ----------
{
  const L = F.l3, l3 = $('l3');
  l3.style.left = L.x + 'px'; l3.style.top = L.y + 'px';
  stage.style.setProperty('--l3', L.size + 'px'); stage.style.setProperty('--l3w', L.w + 'px');
  // fit the item name to the bar
  const name = l3.querySelector('.l3-name span');
  const avail = L.w - L.size * 1.1;
  const nw = name.getBoundingClientRect().width;
  if (nw > avail) name.style.fontSize = (avail / nw).toFixed(3) + 'em';
  const offer = l3.querySelector('.l3-offer');
  const ow = [...offer.children].reduce((a, c) => a + c.getBoundingClientRect().width, 0) + L.size * (0.35 + 1.1);
  if (ow > L.w) offer.style.fontSize = (L.w / ow).toFixed(3) + 'em';
  const B = F.bug, bug = $('bug');
  bug.style.left = B.x + 'px'; bug.style.top = B.y + 'px'; bug.style.width = B.w + 'px'; bug.style.height = (B.w * 610 / 1142) + 'px';
  bug.style.opacity = 0.86;
  const T = F.ticker, tk = $('ticker');
  tk.style.top = T.y + 'px'; tk.style.width = F.w + 'px'; tk.style.height = T.h + 'px';
  stage.style.setProperty('--tk', T.size + 'px');
  // below the safe zone (9x16 only): the channel's own strip, so the frame is full to the bottom like a real still
  const ft = $('foot');
  if (F.foot) { ft.style.top = F.foot.y + 'px'; ft.style.width = F.w + 'px'; ft.style.height = F.foot.h + 'px'; ft.style.fontSize = F.foot.size + 'px'; }
  else ft.remove();
}
const LINES = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
const STAR5 = '<svg viewBox="-1 -1 2 2"><path d="M0,-1 L0.235,-0.324 0.951,-0.309 0.38,0.124 0.588,0.809 0,0.4 -0.588,0.809 -0.38,0.124 -0.951,-0.309 -0.235,-0.324Z" fill="#ffe600" stroke="#000" stroke-width="0.12" stroke-linejoin="round"/></svg>';
const run = $('run');
const unitHTML = LINES.map((s) => `<span>${s}</span>${STAR5}`).join('');
run.innerHTML = unitHTML;
const unit = run.getBoundingClientRect().width;
run.innerHTML = unitHTML.repeat(Math.ceil((F.w * 2) / unit) + 1);
const perLoop = Math.max(1, Math.round(F.ticker.speed * DURATION / unit));

// ---------- the set: cyclorama, set lights, bokeh ----------
{
  const H = F.hero;
  const horizon = H.y + H.d * 0.62;
  $('cyc').style.background = [
    // the hot spot behind the product
    `radial-gradient(${H.d * 0.95}px ${H.d * 0.8}px at ${H.x}px ${H.y - H.d * 0.05}px, rgba(170,225,255,0.6), rgba(80,170,255,0.3) 40%, rgba(30,90,255,0) 100%)`,
    // magenta wash from the sides, a cable-TV studio favourite
    `radial-gradient(${F.w * 0.55}px ${F.h * 0.3}px at 0px ${horizon}px, rgba(255,40,190,0.45), rgba(255,40,190,0) 100%)`,
    `radial-gradient(${F.w * 0.55}px ${F.h * 0.3}px at ${F.w}px ${horizon - F.h * 0.1}px, rgba(180,40,255,0.4), rgba(180,40,255,0) 100%)`,
    // the floor: a dark glossy deck
    `linear-gradient(180deg, rgba(0,0,0,0) ${horizon - 2}px, rgba(4,10,60,0.85) ${horizon}px, rgba(10,24,120,0.75) ${horizon + 30}px, rgba(2,4,30,1) ${F.h}px)`,
    `linear-gradient(180deg, #01031a 0%, #030b52 ${(H.y - H.d * 1.4) / F.h * 100}%, #0a2be0 ${(H.y - H.d * 0.2) / F.h * 100}%, #2a5cff ${horizon / F.h * 100}%, #0a1a9c 100%)`,
  ].join(',');
  // a few out-of-focus lamps on the set behind
  const rnd = mulberry(11), bk = $('bokeh');
  for (let i = 0; i < 16; i++) {
    const s = 20 + rnd() * 60, x = rnd() * F.w, y = H.y - H.d * (0.4 + rnd() * 1.1);
    const hue = rnd() < 0.5 ? '255,220,140' : rnd() < 0.5 ? '140,200,255' : '255,120,220';
    const e = document.createElement('i');
    e.style.cssText = `left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;background:radial-gradient(closest-side, rgba(${hue},0.55), rgba(${hue},0.25) 70%, rgba(${hue},0));--b:${2 + rnd() * 4}px`;
    bk.append(e);
  }
  // two spot beams falling on the turntable
  const bm = $('beams');
  for (const [x, rot, w, a] of [[H.x - H.d * 0.9, -14, H.d * 0.7, 0.16], [H.x + H.d * 0.7, 15, H.d * 0.7, 0.13]]) {
    const e = document.createElement('i');
    e.style.cssText = `left:${x - w / 2}px;width:${w}px;height:${H.y + H.d * 0.7}px;transform:rotate(${rot}deg);background:linear-gradient(180deg, rgba(200,230,255,${a}), rgba(200,230,255,${a * 0.6}) 70%, rgba(200,230,255,0));clip-path:polygon(40% 0, 60% 0, 100% 100%, 0 100%)`;
    bm.append(e);
  }
}

// ---------- 3D: the product on the turntable ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 24;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = studioEnv(renderer);
key.intensity = 2.0;
key.castShadow = false;
const pxPerUnit = F.hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (14 * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);

// the set's light, as the chrome sees it: blue cyclorama, big softboxes, magenta and red kickers
function studioEnv(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.0, 0.004, 0.05), band = vec3(0.03, 0.16, 1.1), glow = vec3(0.35, 0.75, 1.6), flo = vec3(0.004, 0.01, 0.08);
      vec3 c = mix(band, zen, smoothstep(0.05, 0.85, up));
      c += glow * smoothstep(0.2, 1.0, -d.z) * (1.0 - smoothstep(0.0, 0.5, abs(up - 0.05)));
      c = mix(c, flo, smoothstep(0.0, -0.5, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(9, 9, [-8, 9, 7], 14);                        // key softbox
  card(1.6, 14, [10, 3, 3], 15);                     // strip, camera right
  card(12, 12, [0, 14, 0], 3);                       // overhead
  card(14, 3, [0, -1, 14], 1.4, [0.8, 0.9, 1]);      // low fill
  card(2, 12, [-11, 1, -3], 10, [1, 0.15, 0.7]);     // magenta strip, back left
  card(3, 3, [7, 7, -8], 9, [1, 0.8, 0.3]);          // warm kicker
  card(3, 2, [5, -2, 9], 7, [1, 0.12, 0.08]);        // red: the title card's light
  card(5, 2.2, [-2, 5.5, 11], 0);                    // black flags
  card(2.2, 7, [5.5, 0.5, 9.5], 0);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

const spin = new THREE.Group();          // everything on the turntable turns together
scene.add(spin);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
spin.add(globe);

const TOP = -1.075;
// a chrome cup the ball sits in
{
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.13, 64, 1, true), materials.chrome());
  cup.position.y = TOP + 0.065; spin.add(cup);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 16, 64), materials.chrome());
  lip.rotation.x = Math.PI / 2; lip.position.y = TOP + 0.13; spin.add(lip);
}
// the turntable: a mirror top, a chrome rim, a black gloss drum with a ring of chaser bulbs
const RT = 1.55;
const mirror = new Reflector(new THREE.CircleGeometry(RT - 0.03, 96), { clipBias: 0.003, textureWidth: F.w, textureHeight: F.h, color: 0x9098b0 });
mirror.rotation.x = -Math.PI / 2; mirror.position.y = TOP;
spin.add(mirror);
const sheen = new THREE.Mesh(new THREE.CircleGeometry(RT - 0.03, 96), new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.35, depthWrite: false }));
sheen.rotation.x = -Math.PI / 2; sheen.position.y = TOP + 0.002; spin.add(sheen);
{
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RT, 0.045, 20, 160), materials.chrome());
  rim.rotation.x = Math.PI / 2; rim.position.y = TOP; spin.add(rim);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(RT + 0.01, RT + 0.06, 0.34, 128, 1, true), materials.gloss(0x07070c, { roughness: 0.25 }));
  drum.position.y = TOP - 0.19; spin.add(drum);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(RT + 0.06, 0.04, 20, 160), materials.chrome());
  rim2.rotation.x = Math.PI / 2; rim2.position.y = TOP - 0.36; spin.add(rim2);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(RT + 0.12, RT + 0.16, 0.14, 128), materials.gloss(0x101018, { roughness: 0.3 }));
  base.position.y = TOP - 0.44; spin.add(base);
}
const NB = 40, bulbs = [];
for (let i = 0; i < NB; i++) {
  const a = (i / NB) * TAU;
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.066, 16, 12), m);
  b.position.set(Math.sin(a) * (RT + 0.045), TOP - 0.19, Math.cos(a) * (RT + 0.045));
  spin.add(b); bulbs.push(m);
}

// bloom: a soft, blurred copy of the shot, screened back over it
const bloomEl = $('bloom'), BS = 4;
bloomEl.width = Math.ceil(F.w / BS); bloomEl.height = Math.ceil(F.h / BS);
bloomEl.style.width = F.w + 'px'; bloomEl.style.height = F.h + 'px';
const bctx = bloomEl.getContext('2d');

// ---------- the lens flare from the studio light ----------
const flare = $('flare');
const FL = F.flare, FD = F.hero.d;
const ghosts = [[0.35, 0.16, 'rgba(120,255,200,0.16)'], [0.62, 0.08, 'rgba(255,120,220,0.18)'], [1.1, 0.22, 'rgba(120,170,255,0.12)'], [1.45, 0.05, 'rgba(255,230,140,0.25)'], [1.7, 0.12, 'rgba(160,120,255,0.12)']];
flare.innerHTML = '<i class="streak"></i><i class="core"></i>' + ghosts.map(() => '<i class="ghost"></i>').join('');
const flareEls = [...flare.children];

// ---------- glints on the chrome ----------
const STAR4 = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glints = (() => {
  const rnd = mulberry(30), out = [];
  for (let i = 0; i < 10; i++) {
    const a = rnd() * TAU, r = Math.sqrt(rnd()) * FD * 0.5;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-1 -1 2 2');
    svg.innerHTML = `<path d="${STAR4}" fill="#fff"/>`;
    $('glints').append(svg);
    out.push({ svg, x: F.hero.x + Math.cos(a) * r, y: F.hero.y + Math.sin(a) * r, size: FD * (0.12 + rnd() * 0.16), t0: rnd() * DURATION, life: 0.4 + rnd() * 0.3, spin: rnd() * 60 - 30 });
  }
  return out;
})();

// The turntable: one turn a loop, dwelling while the cut (30% | OFF) faces the camera.
const YAW0 = (Number(q.get('yaw') ?? -20) * Math.PI) / 180;
const yawAt = (u) => YAW0 + TAU * u - 0.85 * Math.sin(TAU * u);

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  spin.rotation.y = yawAt(u);
  // chaser bulbs: a run of light goes round the drum six times a loop, against the turn
  for (let i = 0; i < NB; i++) {
    const p = (((i / NB) + u * 6) % 1 + 1) % 1;
    const k = Math.max(0, Math.cos(p * TAU * 5)) ** 3;
    bulbs[i].color.setRGB(0.32 + 1.3 * k, 0.12 + 1.0 * k, 0.02 + 0.45 * k);
  }
  scene.environmentRotation.y = 0.25 * Math.sin(TAU * u + 0.8);
  spin.updateMatrixWorld(true);
  renderer.render(scene, camera);
  bctx.clearRect(0, 0, bloomEl.width, bloomEl.height);
  bctx.filter = 'blur(6px) brightness(1.25)';
  bctx.drawImage(canvas, 0, 0, bloomEl.width, bloomEl.height);

  // the flash throbs, like every flash on every channel
  const beat = Math.abs(Math.sin(TAU * u * 12));
  burstEl.style.transform = `rotate(${(F.burst.rot + 3 * Math.sin(TAU * u * 2)).toFixed(2)}deg) scale(${(1 + 0.045 * beat).toFixed(4)})`;

  // the ticker: a whole number of repeats per loop, so it loops seamlessly
  // (phased so the stills at frame 12 open on the first line, "But wait… there’s less!")
  const tkPos = (((u - 12 / (DURATION * FPS)) * perLoop * unit - F.ticker.size * 0.3) % unit + unit) % unit;
  run.style.transform = `translateX(${(-tkPos).toFixed(2)}px)`;

  // lens flare: the lamp drifts a little as the camera op leans on the pedestal
  const lx = F.hero.x - F.hero.d * 0.62 + 10 * Math.sin(TAU * u), ly = F.hero.y + F.hero.d * 0.66 + 3 * Math.sin(TAU * u * 2 + 1);
  const ax = F.hero.x + F.hero.d * 0.6 - lx, ay = F.hero.y - F.hero.d * 0.5 - ly;
  const pulse = 0.85 + 0.15 * Math.sin(TAU * u * 3);
  const [streak, core, ...gh] = flareEls;
  const cs = FD * 0.36 * pulse;
  core.style.cssText = `left:${lx - cs / 2}px;top:${ly - cs / 2}px;width:${cs}px;height:${cs}px`;
  streak.style.cssText = `left:${lx - F.w * 0.45}px;top:${ly - FD * 0.018}px;width:${F.w * 0.9}px;height:${FD * 0.036}px;opacity:${(0.8 * pulse).toFixed(3)}`;
  gh.forEach((e, i) => {
    const [k, s, c] = ghosts[i], gs = FD * s * 2;
    e.style.cssText = `left:${lx + ax * k - gs / 2}px;top:${ly + ay * k - gs / 2}px;width:${gs}px;height:${gs}px;background:radial-gradient(closest-side, ${c}, ${c} 70%, rgba(255,255,255,0) 100%)`;
  });

  for (const s of glints) {
    let p = (t - s.t0) / s.life;
    if (p < 0) p = (t + DURATION - s.t0) / s.life;
    const on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) : 0;
    s.svg.style.cssText = `left:${s.x - s.size / 2}px;top:${s.y - s.size / 2}px;width:${s.size}px;height:${s.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(s.spin * p).toFixed(2)}deg);filter:drop-shadow(0 0 6px #fff)`;
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, spin, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
