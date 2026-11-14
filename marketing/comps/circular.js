// THE DOORBUSTER CIRCULAR: a full-page newspaper insert. No 3D, no tape: ink on newsprint.
// Everything on screen is a pure function of time, so frames can be rendered in any order:
//   window.comp.setTime(seconds)
// The sheet is "re-photographed" twice a second (16 stop-motion poses per 8 second loop, each with
// its own slip of the red and yellow plates), cut-out pieces move at 10 pictures a second, and a
// red marker goes round the offer. Every period divides the loop, so setTime(0) == setTime(8).

const q = new URLSearchParams(location.search);
// Section boxes: [x, y, width, height, unit]. `unit` scales the small type inside that section.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, fold: 0.5,
    sec: {
      top: [-30, -30, 1140, 102], folio: [24, 80, 1032, 34], ears: [24, 122, 1032, 112],
      mast: [24, 246, 1032, 226], hero: [24, 480, 1032, 402], grid: [24, 892, 1032, 456],
      ca: [24, 1360, 612, 200], cb: [648, 1360, 408, 200],
      fine: [24, 1570, 1032, 56], also: [24, 1632, 1032, 84], foot: [24, 1726, 1032, 98], bottom: [-30, 1834, 1140, 120],
    },
  },
  '1x1': {
    w: 1080, h: 1080, fold: 0.5,
    sec: {
      folio: [24, 6, 1032, 26, 0.85], mast: [24, 38, 1032, 146], hero: [24, 192, 1032, 316, 0.82], grid: [24, 518, 1032, 344, 0.77],
      ca: [24, 872, 612, 164, 0.84], cb: [648, 872, 408, 164, 0.84], fine: [24, 1043, 1032, 32, 0.72],
    },
  },
  '16x9': {
    w: 1920, h: 1080, fold: 0.5,
    sec: {
      folio: [24, 6, 1872, 26, 0.9], mast: [24, 40, 880, 196], hero: [24, 246, 880, 452, 1.05], also: [24, 708, 880, 66, 0.86],
      ca: [24, 786, 880, 250, 1.25], grid: [920, 40, 976, 690, 1.12], cb: [920, 742, 520, 294, 1.3], foot: [1454, 742, 442, 294],
      fine: [24, 1045, 1872, 30, 0.8],
    },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 8, FPS = 30, FRAMES = DURATION * FPS;
const POSE = 15;   // frames per stop-motion pose of the sheet
const CEL = 3;     // frames per picture for the cut-out pieces (bursts, scissors)
const TAU = Math.PI * 2;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const SVG = 'http://www.w3.org/2000/svg';
const K = '#1b1815', R = '#de2f1f', Y = '#ffd60a', PAPER = '#ece4cf';
const INK = { k: K, r: R, y: Y, w: '#fff5dc' };

const stage = $('#stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const sheet = $('#sheet'), paper = $('#paper'), grain = $('#grain');
$('#fold').style.top = F.fold * 100 + '%';

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(1127);

// ---------- place the sections ----------
for (const el of $$('.sec')) {
  const key = [...el.classList].find((c) => F.sec[c]);
  if (!key) { el.style.display = 'none'; continue; }
  const [x, y, w, h, u = 1] = F.sec[key];
  el.style.cssText += `left:${x}px;top:${y}px;width:${w}px;height:${h}px;--u:${u};`;
}

// ---------- the departments ----------
const DEPTS = [
  ['NEWS', 'Today’s headlines. Minus the ones on the right.',
    '<g transform="rotate(-6 60 50)"><rect x="18" y="8" width="84" height="84"/><rect class="k" x="26" y="16" width="68" height="13"/><rect class="t" x="26" y="37" width="32" height="27"/><path class="n thin" d="M65 39h29M65 47h29M65 55h29M65 63h20M26 73h68M26 81h68"/></g>'],
  ['VIDEOS', 'Right side of every video sold separately.',
    '<path class="n" d="M38 82l-9 12M82 82l9 12"/><rect class="k" x="8" y="10" width="104" height="74" rx="9"/><rect class="t" x="17" y="18" width="86" height="46" style="stroke-width:0"/><rect class="w" x="17" y="18" width="86" height="46" style="opacity:.55"/><path class="k" d="M50 27v28l25-14z"/><path class="n thin" style="stroke:#ece4cf" d="M18 74h84"/><circle class="r" cx="48" cy="74" r="6"/>'],
  ['E-MAIL', '4,812 unread. Now 30% harder to see.',
    '<path class="n thin" d="M2 38h14M0 52h10M4 66h12"/><rect x="20" y="22" width="88" height="62"/><path class="t" d="M20 84l34-32 10 8 10-8 34 32z"/><path class="n" d="M20 22l44 38 44-38"/><circle class="r" cx="103" cy="22" r="15"/><text x="103" y="29" text-anchor="middle" fill="#fff5dc" style="fill:#fff5dc">1</text>'],
  ['MAPS', 'Everything east of you is now a sale sign.',
    '<path d="M8 30l34-12 36 12 34-12v62l-34 12-36-12-34 12z"/><path class="t" d="M42 18l36 12v62l-36-12z"/><path class="n thin" stroke-dasharray="6 6" d="M17 76q16-34 34-18t40-14"/><path class="r" d="M88 2c-12 0-19 9-19 18 0 13 19 31 19 31s19-18 19-31c0-9-7-18-19-18z"/><circle class="w" cx="88" cy="20" r="7"/>'],
  ['SHOPPING', 'Prices not reduced. Just harder to read.',
    '<path class="t" d="M29 30h78l-11 36h-58z"/><path class="n thin" d="M49 30l4 36M68 30v36M88 30l-4 36M33 48h68"/><path class="n" style="stroke-width:5.5" d="M6 14h16l14 54h60l12-38h-78"/><circle class="k" cx="46" cy="84" r="8"/><circle class="k" cx="88" cy="84" r="8"/>'],
  ['CAT PHOTOS', 'Tail not shown. Cat unaware of promotion.',
    '<g transform="rotate(5 60 50)"><rect x="20" y="4" width="80" height="92"/><rect class="t" x="28" y="12" width="64" height="60"/><path class="k" d="M40 44l3-23 16 13zM80 44l-3-23-16 13z"/><ellipse class="k" cx="60" cy="50" rx="24" ry="19"/><ellipse cx="50.5" cy="47" rx="5.5" ry="6.5" style="stroke:none;fill:#ffd60a"/><ellipse cx="69.5" cy="47" rx="5.5" ry="6.5" style="stroke:none;fill:#ffd60a"/><path class="n" style="stroke-width:2.4" d="M50.5 42v10M69.5 42v10"/><path class="r" d="M56.5 55h7l-3.5 4.5z"/><path class="n" style="stroke:#ece4cf;stroke-width:1.6" d="M52 59l-16-3M52 62l-15 4M68 59l16-3M68 62l15 4"/><path class="n thin" d="M34 84h38"/></g>'],
  ['RECIPES', 'The story before the recipe: also 30% off.',
    '<path class="rs" style="stroke-width:5" d="M42 34q-9-8 0-15t0-15M60 34q-9-8 0-15t0-15M78 34q-9-8 0-15t0-15"/><path class="n" style="stroke-width:6" d="M18 58h-10v12h10M102 58h10v12h-10"/><path class="t" d="M20 48h80v30q0 16-16 16h-48q-16 0-16-16z"/><rect class="k" x="13" y="40" width="94" height="11" rx="4"/>'],
  ['COMMENT SECTIONS', 'Now with 30% fewer opinions. Finally.',
    '<path d="M14 6h64q9 0 9 9v24q0 9-9 9h-36l-16 15v-15h-12q-9 0-9-9v-24q0-9 9-9z"/><text x="46" y="35" text-anchor="middle" style="fill:#de2f1f;font-size:21px">#@&amp;%!!</text><path class="k" d="M52 52h50q9 0 9 9v17q0 9-9 9h-6v11l-13-11h-31q-9 0-9-9v-17q0-9 9-9z"/><text x="77" y="77" text-anchor="middle" style="fill:#fff5dc;font-size:19px">NO U</text>'],
];
$('#grid').innerHTML = DEPTS.map(([name, small, art], i) => `
  <div class="tile${[1, 3, 4, 6].includes(i) ? ' alt' : ''}">
    <div class="th"><span class="sq">${name}</span></div>
    <div class="tb"><svg class="ic" viewBox="0 0 120 100" xmlns="${SVG}">${art}</svg>
      <div class="burst" data-n="12" data-in="0.74" data-ph="${i}"><div class="bt"><span>30%</span><small>OFF</small></div></div></div>
    <div class="tf">${small}</div>
  </div>`).join('');

// ---------- bands of repeated shouting ----------
for (const el of $$('.band')) {
  const words = el.dataset.band.split('|');
  el.innerHTML = Array.from({ length: 12 }, (_, i) => `<b>${words[i % words.length]}</b><i class="star"></i>`).join('');
}

// ---------- barcodes ----------
for (const el of $$('.barcode')) {
  const n = Number(el.dataset.bars);
  let html = '';
  for (let i = 0; i < n; i++) html += `<i style="flex:${1 + Math.floor(rnd() * 3)}"></i><b style="flex:${1 + Math.floor(rnd() * 3)}"></b>`;
  el.innerHTML = html + '<i style="flex:1"></i>';
}

// ---------- starbursts ----------
// Black dot shadow, a yellow plate that slips, and a black key line. The points can crawl round:
// turning by one point gives the same shape, so any whole number of points per loop is seamless.
const bursts = $$('.burst').map((el) => {
  const n = Number(el.dataset.n), inner = Number(el.dataset.in) * 100;
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * TAU, r = i % 2 ? inner : 100;
    pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
  }
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '-104 -104 208 208');
  svg.setAttribute('preserveAspectRatio', 'none');
  const p = pts.join(' ');
  const big = el.classList.contains('big');
  svg.innerHTML = `<g transform="translate(${big ? 3 : 6} ${big ? 5 : 8})"><g class="spin"><polygon points="${p}" fill="url(#shadeK)"/></g></g>`
    + `<g class="spin"><polygon class="yplate" points="${p}" fill="${Y}"/><polygon points="${p}" fill="none" stroke="${K}" stroke-width="${big ? 5 : 3.5}" stroke-linejoin="miter" vector-effect="non-scaling-stroke"/></g>`;
  el.prepend(svg);
  return { el, n, spins: $$('.spin', svg), turn: Number(el.dataset.spin || 0), phase: Number(el.dataset.ph || 0) / 8, big };
});

// ---------- fonts, then everything that has to be measured ----------
await document.fonts.ready;
await Promise.all(['400 100px "Anton"', '400 100px "Ultra"', '400 40px "Oswald"', '700 40px "Oswald"', '700 20px "Courier Prime"', '400 60px "Permanent Marker"', '400 80px "Luckiest Guy"'].map((f) => document.fonts.load(f)));

// A word stretched to fill its box exactly, like a paste-up artist with a stat camera:
// the font size makes the ink as tall as the box, then the word is squeezed or pulled to its width.
const ctx = document.createElement('canvas').getContext('2d');
for (const el of $$('.bx')) {
  const text = el.textContent.trim(), fam = el.dataset.f || 'Anton', wt = el.dataset.w || 400;
  const W = el.clientWidth, H = el.clientHeight;
  if (!W || !H) continue;
  ctx.font = `${wt} 200px "${fam}"`;
  const m = ctx.measureText(text);
  const k = H / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
  const sx = W / ((m.actualBoundingBoxLeft + m.actualBoundingBoxRight) * k);
  const o = Number(el.dataset.o || 0), s = Number(el.dataset.s || 0);
  const fill = INK[el.dataset.c || 'k'], shade = INK[el.dataset.sc || 'k'];
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let layers = '';
  if (s) layers += `<text transform="translate(${s / sx} ${s})" fill="${shade}" stroke="${shade}" stroke-width="${o}" stroke-linejoin="round"${el.dataset.sc === 'r' ? ' class="rplate"' : ''}>${esc}</text>`;
  if (o) layers += `<text fill="${K}" stroke="${K}" stroke-width="${o}" stroke-linejoin="round">${esc}</text>`;
  layers += `<text fill="${fill}"${fill === R ? ' class="rplate"' : fill === Y ? ' class="yplate"' : ''}>${esc}</text>`;
  el.innerHTML = `<svg xmlns="${SVG}" width="${W}" height="${H}"><g transform="translate(${(m.actualBoundingBoxLeft * k * sx).toFixed(2)} ${(m.actualBoundingBoxAscent * k).toFixed(2)}) scale(${sx.toFixed(4)} 1)" font-family="${fam}" font-weight="${wt}" font-size="${(200 * k).toFixed(2)}">${layers}</g></svg>`;
}

// Labels that are too long for their bar get squeezed, never wrapped.
for (const el of $$('.sq')) {
  const cs = getComputedStyle(el.parentElement);
  const room = el.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const w = el.offsetWidth;
  if (w > room) el.style.transform = `scaleX(${(room / w).toFixed(4)})`;
}

// ---------- the marker ----------
const origin = stage.getBoundingClientRect();
const box = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height, cx: r.left - origin.left + r.width / 2, cy: r.top - origin.top + r.height / 2 }; };
const marker = $('#marker');
marker.setAttribute('viewBox', `0 0 ${F.w} ${F.h}`);
const U = F.sec.hero[4] || 1;
const strokes = [];
function stroke(d, width, t0, t1) {
  const p = document.createElementNS(SVG, 'path');
  p.setAttribute('d', d);
  p.setAttribute('stroke-width', width);
  marker.append(p);
  const len = p.getTotalLength();
  p.style.strokeDasharray = `${len.toFixed(1)} ${(len + 40).toFixed(1)}`;
  strokes.push({ p, len, t0, t1 });
}
// A hand-drawn ring: a bit more than one lap, drifting outwards so the end overshoots the start.
function ring(cx, cy, rx, ry, a0, laps, wob, drift) {
  const N = 96, pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = a0 + u * TAU * laps;
    const k = 1 + wob * Math.sin(a * 2 + 0.8) + wob * 0.6 * Math.sin(a * 3 + 2) + drift * (u - 0.35);
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)} ${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return 'M' + pts.join('L');
}
const pp = box($('.hero .pp'));
const ringRx = pp.w * 0.585, ringRy = pp.h * 0.63;
stroke(ring(pp.cx + pp.w * 0.01, pp.cy + pp.h * 0.02, ringRx, ringRy, -2.5, 1.14, 0.022, 0.085), 13 * U, 1.0, 1.9);

const note = $('#note');
note.style.setProperty('--u', U);
const noteX = pp.x - pp.w * 0.1, noteY = pp.y + pp.h + ringRy * 0.52;
note.style.left = noteX + 'px';
note.style.top = noteY - note.offsetHeight + 'px';
const NOTE_ROT = -6;
const noteW = note.offsetWidth, noteH = note.offsetHeight;
{ // an arrow from the end of the note up to the ring
  const a = (NOTE_ROT * Math.PI) / 180;
  const sx = noteX + Math.cos(a) * (noteW + 4) + Math.sin(a) * noteH * 0.45, sy = noteY + Math.sin(a) * (noteW + 4) - Math.cos(a) * noteH * 0.45;
  const ex = sx + 70 * U, ey = pp.cy + ringRy * 1.13;
  stroke(`M${sx} ${sy} Q${sx + 46 * U} ${sy + 4 * U} ${ex} ${ey}`, 9 * U, 3.0, 3.3);
  stroke(`M${ex - 26 * U} ${ey + 6 * U} L${ex} ${ey} L${ex + 2 * U} ${ey + 28 * U}`, 9 * U, 3.3, 3.5);
}
const NOTE_T = [2.2, 2.9];
const free = box($('.cb .free'));
const CU = F.sec.cb[4] || 1;
stroke(ring(free.cx, free.cy, free.w * 0.6, free.h * 0.74, -0.6, 1.1, 0.03, 0.09), 9 * CU, 4.1, 4.7);
const CLEAR = 0.5; // a clean copy of the sheet arrives here; before it, last loop's ink is still on the page

// ---------- scissors, snipping round the first coupon ----------
const sc = $('#scissors');
sc.style.setProperty('--u', F.sec.ca[4] || 1);
const half = (flip) => `<g class="half" data-flip="${flip}"><g transform="scale(1 ${flip})"><path d="M-5 -3.2L37 0.6 35.5 3.4 -3 3.6z" fill="${K}" stroke-width="1.5"/><path d="M-3 1L-12 8" fill="none" stroke-width="4.5"/><ellipse cx="-19" cy="11.5" rx="9" ry="6" transform="rotate(-28 -19 11.5)" fill="${PAPER}" stroke-width="4"/></g></g>`;
sc.innerHTML = half(1) + half(-1) + `<circle r="2.2" fill="${PAPER}" stroke-width="1"/>`;
const halves = $$('.half', sc);
const SCW = sc.clientWidth, SCH = sc.clientHeight, PIVOT = [(30 / 70) * SCW, (22 / 44) * SCH];
const cut = box($('.coupon.ca'));
{ const inset = 2 * (F.sec.ca[4] || 1); cut.x += inset; cut.y += inset; cut.w -= inset * 2; cut.h -= inset * 2; }
function along(p) { // a point p (0..1) of the way round the coupon, clockwise from the top left
  const per = 2 * (cut.w + cut.h); let d = (((p % 1) + 1) % 1) * per;
  if (d < cut.w) return [cut.x + d, cut.y, 0];
  d -= cut.w; if (d < cut.h) return [cut.x + cut.w, cut.y + d, 90];
  d -= cut.h; if (d < cut.w) return [cut.x + cut.w - d, cut.y + cut.h, 180];
  d -= cut.w; return [cut.x, cut.y + cut.h - d, 270];
}

// ---------- stop-motion poses ----------
const poses = Array.from({ length: FRAMES / POSE }, () => ({
  dx: (rnd() - 0.5) * 8, dy: (rnd() - 0.5) * 8, rot: (rnd() - 0.5) * 0.7,
  rx: 2.4 + (rnd() - 0.5) * 3.4, ry: -1.6 + (rnd() - 0.5) * 3.4, yx: -2.2 + (rnd() - 0.5) * 3.4, yy: 2.4 + (rnd() - 0.5) * 3.4,
  px: Math.floor(rnd() * 320), py: Math.floor(rnd() * 320), gx: Math.floor(rnd() * 360), gy: Math.floor(rnd() * 360),
}));

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);

function setTime(t) {
  const f = ((Math.round(t * FPS) % FRAMES) + FRAMES) % FRAMES;
  t = f / FPS;

  // the sheet, twice a second
  const s = poses[Math.floor(f / POSE)];
  sheet.style.transform = `translate(${s.dx.toFixed(2)}px, ${s.dy.toFixed(2)}px) rotate(${s.rot.toFixed(3)}deg)`;
  sheet.style.setProperty('--rx', s.rx.toFixed(2) + 'px');
  sheet.style.setProperty('--ry', s.ry.toFixed(2) + 'px');
  sheet.style.setProperty('--yx', s.yx.toFixed(2) + 'px');
  sheet.style.setProperty('--yy', s.yy.toFixed(2) + 'px');
  paper.style.backgroundPosition = `${s.px}px ${s.py}px, ${s.px * 2}px ${s.py * 2}px`;
  grain.style.backgroundPosition = `${s.gx}px ${s.gy}px`;

  // cut-out pieces, ten pictures a second
  const cel = Math.floor(f / CEL), tc = (cel * CEL) / FPS;
  for (const b of bursts) {
    const beat = Math.max(0, Math.sin(TAU * (tc - b.phase)));
    b.el.style.scale = (1 + (b.big ? 0.022 : 0.09) * beat * beat).toFixed(4);
    const deg = b.turn ? (tc / DURATION) * b.turn * (360 / b.n) : (cel % 2) * (180 / b.n) * 0.16;
    for (const g of b.spins) g.setAttribute('transform', `rotate(${deg.toFixed(3)})`);
  }
  const [x, y, deg] = along(tc / DURATION + 0.07);
  sc.style.transform = `translate(${(x - PIVOT[0]).toFixed(1)}px, ${(y - PIVOT[1]).toFixed(1)}px) rotate(${deg}deg)`;
  sc.style.transformOrigin = `${PIVOT[0]}px ${PIVOT[1]}px`;
  const open = cel % 2 ? 15 : 3;
  halves.forEach((h) => h.setAttribute('transform', `rotate(${-open * Number(h.dataset.flip)})`));

  // the marker
  const done = t < CLEAR;
  for (const k of strokes) {
    const p = done ? 1 : ease(clamp01((t - k.t0) / (k.t1 - k.t0)));
    k.p.style.visibility = p > 0 ? 'visible' : 'hidden';
    k.p.style.strokeDashoffset = (k.len * (1 - p)).toFixed(1);
  }
  const np = done ? 1 : clamp01((t - NOTE_T[0]) / (NOTE_T[1] - NOTE_T[0]));
  note.style.transform = `rotate(${NOTE_ROT}deg)`;
  note.style.clipPath = `inset(-20px ${((1 - np) * 100).toFixed(2)}% -20px -20px)`;
  note.style.visibility = np > 0 ? 'visible' : 'hidden';
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
