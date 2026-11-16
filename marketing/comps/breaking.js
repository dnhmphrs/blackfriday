// 30% OFF NEWS: a made-up cable-news channel breaks the story that the internet is now 30% off.
// An anchor, an over-the-shoulder box with the cut globe, BREAKING NEWS, a market chart that falls
// 30%, a ticker, a SALE ALERT. Every pixel is a pure function of time:
//   window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  '9x16': { w: 1080, h: 1920 },
  '1x1': { w: 1080, h: 1080 },
  '16x9': { w: 1920, h: 1080 },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 8, FPS = 30, TAU = Math.PI * 2;
const GLITCHES = [1.75, 5.75];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (s, root = stage) => root.querySelector(s);
const $$ = (s, root = stage) => [...root.querySelectorAll(s)];
const svgEl = (name, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', name); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const frac = (x) => x - Math.floor(x);
const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(1930);

// ---------- fonts first: everything below measures text ----------
await document.fonts.ready;
await Promise.all(['400 100px Anton', '400 40px Oswald', '700 40px Oswald', '400 40px "Archivo Black"', 'italic 700 30px Arimo', '400 60px "Luckiest Guy"'].map((f) => document.fonts.load(f)));

// ---------- the market ticker's items ----------
// [name, direction]: -1 falls 30%, 1 rises 30%, 0 is a plain line of copy
const ITEMS = [['WEB PAGES', -1], ['SCROLLBARS', -1], ['COMMENT SECTIONS', -1], ['COOKIE BANNERS', -1], ['SAVINGS', 1], ['FREE ON THE CHROME WEB STORE', 0]];
$('.ticker .run').dataset.html = ITEMS.map(([name, dir]) => (dir ? `<span class="it">${name}<em class="${dir < 0 ? 'down' : 'up'}"><i></i>30%</em></span>` : `<span class="it store">${name}</span>`)).join('');

// Crawls: repeat the unit, and move a whole number of units per loop so the loop is seamless.
const crawls = $$('.crawl').map((el) => {
  const run = $('.run', el);
  const fill = (n) => { if (run.dataset.html) run.innerHTML = run.dataset.html.repeat(n); else run.textContent = run.dataset.text.repeat(n); };
  fill(1);
  const unit = run.getBoundingClientRect().width;
  if (!unit || !el.offsetParent) return null; // this format hides it
  fill(Math.ceil((F.w * 1.3) / unit) + 2);
  const speed = Number(el.dataset.speed || 200);
  const perLoop = Math.max(1, Math.round((Math.abs(speed) * DURATION) / unit));
  return { run, unit, perLoop, dir: Math.sign(speed) || 1 };
}).filter(Boolean);

// ---------- the studio wall: a step-and-repeat of the offer, sliding sideways ----------
const wallcopy = $('.wallcopy');
const SW = wallcopy.clientWidth, SH = wallcopy.clientHeight;
wallcopy.setAttribute('viewBox', `0 0 ${SW} ${SH}`);
const WALL = { fs: format === '16x9' ? 62 : 48, words: ['30% OFF', 'BLACK FRIDAY'] };
WALL.tile = WALL.fs * 9.4; // one "30% OFF  BLACK FRIDAY" repeat
WALL.rowH = WALL.fs * 1.5;
const wallRows = svgEl('g', { 'font-family': 'Anton', 'font-size': WALL.fs, fill: '#fff', 'fill-opacity': 0.22 });
for (let j = -3; j * WALL.rowH < SH + WALL.rowH * 4; j++) {
  for (let i = -2; (i - 2) * WALL.tile < SW; i++) {
    const x = (i + (j % 2 ? 0.5 : 0)) * WALL.tile;
    const a = svgEl('text', { x: x.toFixed(1), y: (j * WALL.rowH).toFixed(1) }), b = svgEl('text', { x: (x + WALL.fs * 3.9).toFixed(1), y: (j * WALL.rowH).toFixed(1), 'fill-opacity': 0.13 });
    a.textContent = WALL.words[0];
    b.textContent = WALL.words[1];
    wallRows.append(a, b);
  }
}
wallcopy.append(wallRows);

// ---------- the chart: a line that falls off a cliff, from 100% to 70% ----------
const chart = $('.chart');
const CW = chart.clientWidth, CH = chart.clientHeight;
chart.setAttribute('viewBox', `0 0 ${CW} ${CH}`);
const yHi = CH * 0.2, yLo = CH * 0.76, x0 = 6, x1 = CW - 16, cliff = x0 + (x1 - x0) * 0.56;
const pts = [];
for (let i = 0, n = 26; i <= n; i++) pts.push([x0 + ((cliff - x0) * i) / n, yHi + (rnd() - 0.5) * CH * 0.1 + Math.sin(i * 0.9) * CH * 0.025]);
pts.push([cliff + CW * 0.012, yHi + (yLo - yHi) * 0.55], [cliff + CW * 0.026, yLo + CH * 0.07]);
for (let i = 1, n = 16; i <= n; i++) pts.push([cliff + CW * 0.026 + ((x1 - cliff - CW * 0.026) * i) / n, yLo + (rnd() - 0.5) * CH * 0.07]);
const line = pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
const last = pts[pts.length - 1];
const fs = Math.min(34, Math.max(15, CH * 0.17));
const arrowX = cliff + CW * 0.1;
const dropFs = Math.min((CW - 12 - arrowX - 16) / 2.25, (yLo - yHi) * 0.6);
const wLine = Math.min(11, Math.max(7, CH * 0.075));
chart.innerHTML = `
  <defs>
    <linearGradient id="c-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2a2a" stop-opacity="0.75"/><stop offset="1" stop-color="#ff2a2a" stop-opacity="0.08"/></linearGradient>
    <linearGradient id="c-scan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.26"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="${CW}" height="${CH}" fill="#06091c" stroke="#3a4a8a" stroke-width="2"/>
  ${[0.25, 0.5, 0.75].map((k) => `<line x1="${CW * k}" y1="0" x2="${CW * k}" y2="${CH}" stroke="#26306a" stroke-width="1.5"/>`).join('')}
  <line x1="0" y1="${yHi}" x2="${CW}" y2="${yHi}" stroke="#8fa2ff" stroke-width="2" stroke-dasharray="7 6"/>
  <line x1="0" y1="${yLo}" x2="${CW}" y2="${yLo}" stroke="#8fa2ff" stroke-width="2" stroke-dasharray="7 6"/>
  <polygon points="${x0},${CH} ${line} ${last[0]},${CH}" fill="url(#c-fill)"/>
  <rect class="scan" x="0" y="0" width="${CW * 0.16}" height="${CH}" fill="url(#c-scan)"/>
  <polyline points="${line}" fill="none" stroke="#fff" stroke-width="${wLine}" stroke-linejoin="round" stroke-linecap="round"/>
  <polyline points="${line}" fill="none" stroke="#ff2222" stroke-width="${wLine * 0.56}" stroke-linejoin="round" stroke-linecap="round"/>
  <text x="${CW - 8}" y="${yHi - fs * 0.3}" text-anchor="end" font-family="Oswald" font-weight="700" font-size="${fs}" fill="#cfd8ff">100%</text>
  <text x="10" y="${yLo + fs * 1.05}" font-family="Oswald" font-weight="700" font-size="${fs}" fill="#cfd8ff">70%</text>
  <g class="drop">
    <line x1="${arrowX}" y1="${yHi + 5}" x2="${arrowX}" y2="${yLo - 12}" stroke="#ffe600" stroke-width="5"/>
    <polygon points="${arrowX - 11},${yLo - 16} ${arrowX + 11},${yLo - 16} ${arrowX},${yLo - 1}" fill="#ffe600"/>
    <text x="${arrowX + 16}" y="${(yHi + yLo) / 2 + dropFs * 0.36}" font-family="Anton" font-size="${dropFs}" fill="#ffe600">&#8722;30%</text>
  </g>
  <circle class="ring" cx="${last[0]}" cy="${last[1]}" r="8" fill="none" stroke="#fff" stroke-width="3"/>
  <circle class="dot" cx="${last[0]}" cy="${last[1]}" r="7" fill="#fff"/>`;
const scan = $('.scan', chart), ring = $('.ring', chart), drop = $('.drop', chart);

// ---------- the FREE starburst ----------
const starSvg = $('.star svg');
const starPts = (rOut, rIn, n = 16) => Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * TAU, r = i % 2 ? rIn : rOut; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ');
starSvg.append(svgEl('polygon', { points: starPts(104, 84), fill: '#000', transform: 'translate(6 7)', opacity: 0.6 }), svgEl('polygon', { points: starPts(104, 84), fill: '#ffe600', stroke: '#e0101c', 'stroke-width': 5, 'stroke-linejoin': 'round' }));
const star = $('.star'), starPoly = $$('polygon', starSvg);

// ---------- 3D: the internet, 30% off, in the over-the-shoulder box ----------
const win = $('.ots .win'), cap = $('.ots .cap');
const GW = win.clientWidth, GH = win.clientHeight, capH = cap.offsetHeight;
const canvas = document.getElementById('gl');
canvas.style.width = GW + 'px';
canvas.style.height = GH + 'px';
const FOV = 24;
const { renderer, scene, camera } = createStage({ canvas, width: GW, height: GH, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
const hero3 = { x: GW / 2, y: (GH - capH) / 2 + 2, d: Math.min(GW, GH - capH) * 0.84 };
const dist = GH / (2 * Math.tan((FOV * Math.PI) / 360) * (hero3.d / 2));
const elev = (14 * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(GW, GH, GW / 2 - hero3.x, GH / 2 - hero3.y, GW, GH);
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
if (globe.userData.slice) globe.userData.slice.visible = false;
pivot.add(castShadows(globe));
const TURN = 4, YAW0 = (24 * Math.PI) / 180;
// One full turn every TURN seconds, lingering while the cut (and its "30% OFF") faces the camera.
const yawAt = (t) => { const u = t / TURN; return YAW0 + TAU * u - 0.62 * Math.sin(TAU * u); };

// Glints on the chrome.
const sparkleLayer = document.getElementById('sparkles');
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const sparkles = Array.from({ length: 14 }, () => {
  const a = rnd() * TAU, r = Math.sqrt(rnd()) * hero3.d * 0.5;
  const s = svgEl('svg', { viewBox: '-1 -1 2 2' });
  s.innerHTML = `<path d="${STAR}" fill="#fff"/>`;
  sparkleLayer.append(s);
  const size = (30 + rnd() * 50) * (hero3.d / 330);
  return { svg: s, x: hero3.x + Math.cos(a) * r - size / 2, y: hero3.y + Math.sin(a) * r - size / 2, size, t0: rnd() * DURATION, life: 0.3 + rnd() * 0.2, spin: rnd() * 40 - 20 };
});

// ---------- the anchor: talks, blinks, nods ----------
const mouth = document.getElementById('a-mouth'), teeth = document.getElementById('a-teeth');
const head = document.getElementById('a-head'), brows = document.getElementById('a-brows');
const eyes = $$('.a-eye'), pupils = $$('.a-pupil');
const SYL = 7; // syllables a second
const talk = Array.from({ length: DURATION * SYL }, (_, i) => { const sec = i / SYL; return (sec > 3.5 && sec < 4.1) || sec > 7.55 ? 0 : 0.25 + rnd() * 0.75; });
const mouthAt = (t) => { const p = t * SYL, i = Math.floor(p), n = talk.length; const a = talk[i % n] * (i % 2 ? 0.45 : 1), b = talk[(i + 1) % n] * ((i + 1) % 2 ? 0.45 : 1); return a + (b - a) * ease(p - i); };
const BLINKS = [1.2, 3.8, 6.4];

// ---------- lower third ----------
const subs = $$('.sub .item');
const SUB_T = DURATION / subs.length;
const shine = $('.breaking .shine'), chev = $$('.breaking .chev i'), breaking = $('.breaking');
const liveDot = $('.live .dot'), justin = $('.justin'), stamp = $('.stamp'), burst = $('.burst'), beams = $('.beams');
const h2 = $('.headline .h2'), chg = $('.market .chg');
const BW = breaking.clientWidth;
const HS = Math.round(parseFloat(getComputedStyle(h2).fontSize) * 0.03);

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const f = Math.floor(t * FPS + 1e-6);

  // crawls
  for (const k of crawls) {
    const x = ((t / DURATION) * k.perLoop * k.unit) % k.unit;
    k.run.style.transform = `translateX(${(k.dir > 0 ? -x : x - k.unit).toFixed(2)}px)`;
  }

  // globe
  pivot.rotation.y = yawAt(t);
  pivot.position.y = Math.sin((t / DURATION) * TAU * 2) * 0.03;
  burst.style.transform = `rotate(${((t / DURATION) * 48).toFixed(3)}deg)`;
  for (const s of sparkles) {
    let p = (t - s.t0) / s.life;
    if (p < 0) p = (t + DURATION - s.t0) / s.life; // wraps across the loop point
    const on = p >= 0 && p <= 1;
    s.svg.style.cssText = `left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;width:${s.size.toFixed(1)}px;height:${s.size.toFixed(1)}px;opacity:${on ? 1 : 0};transform:scale(${(on ? Math.sin(p * Math.PI) : 0).toFixed(3)}) rotate(${(s.spin * p).toFixed(2)}deg)`;
  }

  // studio
  wallRows.setAttribute('transform', `rotate(-9 ${SW / 2} ${SH / 2}) translate(${(frac(t / DURATION) * WALL.tile).toFixed(2)} 0)`);
  beams.style.transform = `skewX(-16deg) translateX(${(-(t / DURATION) * 2 * 170).toFixed(2)}px)`;

  // anchor
  const o = mouthAt(t);
  mouth.setAttribute('ry', (2.5 + o * 13).toFixed(2));
  mouth.setAttribute('rx', (22 - o * 4).toFixed(2));
  mouth.setAttribute('cy', (224 + o * 5).toFixed(2));
  teeth.setAttribute('ry', (o * 4.2).toFixed(2));
  teeth.setAttribute('cy', (222 + o * 0.5 - o * 4).toFixed(2));
  teeth.setAttribute('rx', (16 - o * 3).toFixed(2));
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1);
  for (const e of eyes) e.setAttribute('ry', blink ? 1.2 : 9);
  for (const p of pupils) p.setAttribute('opacity', blink ? 0 : 1);
  head.setAttribute('transform', `translate(0 ${(Math.sin(t * TAU / 2) * 1.6 + o * 1.2).toFixed(2)}) rotate(${(Math.sin(t * TAU / 4) * 1.6).toFixed(3)} 200 300)`);
  brows.setAttribute('transform', `translate(0 ${(-2.5 - 2.5 * Math.sin(t * TAU / 2 + 0.6)).toFixed(2)})`);

  // top bar
  liveDot.style.opacity = frac(t) < 0.6 ? 1 : 0.15;
  stage.classList.toggle('alt', Math.floor(t * 4 + 1e-6) % 2 === 1);

  // BREAKING NEWS: a flash and a glint every two seconds, chevrons marching
  const u2 = frac((t + 1) / 2) * 2; // on the odd seconds, so the loop point shows the banner at rest
  breaking.classList.toggle('flash', u2 < 0.1 || (u2 >= 0.2 && u2 < 0.3));
  shine.style.transform = `translateX(${(-260 + (BW + 520) * ease(u2 / 1.1)).toFixed(1)}px) skewX(-24deg)`;
  chev.forEach((c, i) => { c.style.opacity = Math.floor(t * 6) % 3 === i ? 1 : 0.35; });

  // headline
  justin.style.opacity = frac(t * 2) < 0.6 ? 1 : 0;
  stamp.style.transform = `rotate(${(-4 + Math.sin(t * TAU / 4) * 1.2).toFixed(3)}deg) scale(${(1 + 0.03 * Math.sin(t * TAU / 2)).toFixed(4)})`;

  // the line under the headline: four facts, two seconds each, changing a quarter second before the beat
  const ts = t + 0.25, cur = Math.floor(ts / SUB_T) % subs.length, us = (ts % SUB_T) / 0.22;
  subs.forEach((el, j) => {
    let y = null;
    if (j === cur) y = us < 1 ? (1 - ease(us)) * 100 : 0;
    else if (j === (cur + subs.length - 1) % subs.length && us < 1) y = -ease(us) * 100;
    el.style.visibility = y === null ? 'hidden' : 'visible';
    el.style.transform = `translateY(${(y || 0).toFixed(2)}%)`;
  });

  // market: the readout blinks, the chart is swept and its last point pings
  chg.style.opacity = frac(t * 2) < 0.75 ? 1 : 0.35;
  const sw = frac(t / 4);
  scan.setAttribute('x', (-CW * 0.16 + CW * 1.16 * sw).toFixed(1));
  const pr = frac(t * 1.5);
  ring.setAttribute('r', (7 + pr * 22).toFixed(1));
  ring.setAttribute('opacity', (1 - pr).toFixed(3));
  drop.setAttribute('transform', `translate(0 ${(Math.max(0, Math.sin(t * TAU * 1.5)) * 5).toFixed(2)})`);

  // FREE starburst: turns two points per loop, throbs
  const rot = (t / DURATION) * (360 / 16) * 2;
  for (const p of starPoly) p.setAttribute('transform', `${p === starPoly[0] ? 'translate(6 7) ' : ''}rotate(${rot.toFixed(3)})`);
  star.style.transform = `rotate(-10deg) scale(${(1 + 0.06 * Math.sin(t * TAU * 2)).toFixed(4)})`;

  // tape damage: the lower third tears sideways for a few frames
  let g = -1;
  for (const g0 of GLITCHES) { const k = f - Math.round(g0 * FPS); if (k >= 0 && k < 4) g = k; }
  stage.classList.toggle('glitch', g === 0 || g === 1);
  stage.classList.toggle('glitch2', g === 2 || g === 3);
  // "30% OFF" throbs by growing its drop shadow in whole pixels (scaling big type makes its edges depend on
  // what the browser drew before, and frames are rendered out of order)
  const pop = Math.round(HS * (1 + 0.7 * Math.max(0, Math.sin(t * TAU * 1.5))));
  h2.style.textShadow = `${pop}px ${pop}px 0 ${g >= 2 ? '#e0101c' : '#000'}`;

  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: GLITCHES, setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
