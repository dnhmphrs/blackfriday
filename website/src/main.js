// 30% Off EVERYTHING: the countdown page.
//   ?now=<ISO date, date-time or ms>  pretend it is then (the clock runs on from there)
//   ?freeze                           stop the clock and the motion (for screenshots)
//   ?keep                             keep the tape filter on, however slow the machine
import { status, units, parseNow } from './clock.js';
import { layer } from './gl/gl.js';
import BG from './gl/bg.glsl';
import TILE from './images/tile.png?inline';

const BEAT = 0.25;   // s. On the day the big flips (sash, tag, clock, rays, the red rim) happen only on every other
                     // beat, all in step: 2 flashes a second, under the 3 a second of WCAG 2.3.1

const TICKER = 'But wait… there’s less! ✦ No purchase necessary! ✦ Black Friday only! ✦ Every website, 30% off! ✦ Works like magic! ✦ ';
const CRAWL = 'BLACK FRIDAY ONLY! ✦ ';
const CRAWL_BF = 'TODAY ONLY! ✦ BLACK FRIDAY ONLY! ✦ ';
const TAKEOVER = 'TODAY ONLY! <b>✦</b> ACT NOW! <b>✦</b> ';

const Q = new URLSearchParams(location.search);
const FORCED = parseNow(Q.get('now'));
const FREEZE = Q.has('freeze');
// The VHS tape look (filter and scanlines): off by default; true turns it on, ?tape turns it on for one visit
const TAPE = false || Q.has('tape');
const KEEP = Q.has('keep');
const STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOVING = !STILL;

const root = document.documentElement;
const $ = (s) => document.querySelector(s);
const tv = $('#tv');
const set = (cls, on) => { if (root.classList.contains(cls) !== on) root.classList.toggle(cls, on); };

// ---- time: the real clock, or ?now= and on from there ----
const wall0 = Date.now(), perf0 = performance.now();
const offset = FORCED == null ? 0 : FORCED - wall0;
const now = () => (FREEZE ? wall0 + offset : Date.now() + offset);
const seconds = () => (FREEZE ? 2.2 : (performance.now() - perf0) / 1000);

// ---- WebGL: the background under the page (the tape look over it is the SVG filter in index.html) ----
let bg = null;
try {
  bg = layer($('#bg'), BG);
} catch { bg = null; }
if (!bg) set('nogl', true);
$('#bg').addEventListener('webglcontextlost', (e) => { e.preventDefault(); bg = null; set('nogl', true); });
if (bg) {
  const img = new Image();
  img.onload = () => { if (bg) { bg.texture(img, 0); draw(seconds()); } };
  img.src = TILE;
}

// ---- the badge's bursts, as on the banner (a radius of 100 in a box 224 across): red 16 points, yellow 30 ----
{
  const star = (n, outer, inner, turn = 0) => Array.from({ length: n * 2 }, (_, i) => {
    const a = ((i + turn) * Math.PI) / n - Math.PI / 2, r = i % 2 ? inner : outer;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  const pts = { 'red-pts': star(16, 108, 80, 0.5), 'yellow-pts': star(30, 97, 86) };
  for (const [cls, p] of Object.entries(pts)) for (const el of document.querySelectorAll(`.${cls}`)) el.setAttribute('points', p);
}

// ---- the clock ----
const clock = $('.clock'), row = $('.clock .row'), lbl = $('.clock .lbl');
let mode = '', shape = '', cells = [];
const cell = (c) => `<em><b class="up"><b>${c}</b></b><b class="dn"><b>${c}</b></b><b class="fa"><b>${c}</b></b><b class="fb"><b>${c}</b></b></em>`;
const FLAP_A = [{ transform: 'rotateX(0)' }, { transform: 'rotateX(-90deg)', filter: 'brightness(0.6)' }];
const FLAP_B = [{ transform: 'rotateX(90deg)', filter: 'brightness(1.6)' }, { transform: 'rotateX(0)' }];

function build(st, us) {
  row.innerHTML = us.map(([name, val], i) =>
    `${i ? '<span class="colon">:</span>' : ''}<span class="u ${name.toLowerCase()}"><span class="dd">${[...val].map(cell).join('')}</span><i>${name}</i></span>`).join('');
  cells = us.map((_, i) => [...row.querySelectorAll('.u')[i].querySelectorAll('em')]);
}
function setDigit(em, c, animate) {
  const [up, dn, fa, fb] = em.children, was = up.firstChild.textContent;
  if (was === c) return false;
  up.firstChild.textContent = fb.firstChild.textContent = c;
  fa.firstChild.textContent = dn.firstChild.textContent = was;
  if (animate && fa.animate) {
    fa.animate(FLAP_A, { duration: 160, easing: 'ease-in' });
    fb.animate(FLAP_B, { duration: 140, delay: 160, easing: 'ease-out', fill: 'backwards' });
  }
  return true;
}
function describe(st, us) {
  const say = us.map(([n, v]) => `${Number(v)} ${{ DAYS: 'days', HRS: 'hours', MIN: 'minutes', SEC: 'seconds' }[n]}`).slice(0, -1).join(', ');
  clock.setAttribute('aria-label', st.mode === 'today' ? `Black Friday is today. Ends in ${say}.` : `Black Friday starts in ${say}.`);
}
let lastMinute = '';
function tick(animate) {
  const st = status(now()), us = units(st);
  const key = st.mode + us.map((u) => u[1].length).join('');
  if (key !== shape) {
    shape = key;
    build(st, us);
    if (st.mode !== mode) enter(st.mode);
    layout();
  } else {
    us.forEach(([, v], i) => [...v].forEach((c, j) => { setDigit(cells[i][j], c, animate); }));
  }
  const minute = us.slice(0, -1).map((u) => u[1]).join();
  if (minute !== lastMinute) { lastMinute = minute; describe(st, us); }
  window.__bf.mode = st.mode;
}
// the page's two faces: counting to the day, and the day itself
function enter(m) {
  mode = m;
  set('bf', m === 'today');
  lbl.textContent = m === 'today' ? 'ENDS IN' : 'STARTS IN';
  runs.crawl.unit = m === 'today' ? CRAWL_BF : CRAWL;
}

// ---- layout: sizes from the window, lettering fitted to its room ----
function fit(el, { w = 1, h = 1 } = {}) {
  const box = el.parentElement;
  el.style.fontSize = '100px';
  const k = Math.min((box.clientWidth * w) / el.offsetWidth, (box.clientHeight * h) / el.offsetHeight);
  el.style.fontSize = `${Math.max(1, 100 * k)}px`;
  return 100 * k;
}
const runs = {
  ticker: { el: $('.ticker .run > span'), unit: TICKER, speed: 1.5 },   // px/s per px of the band's height
  crawl: { el: $('.crawl .run > span'), unit: CRAWL, speed: 2.6 },
  takeover: { el: $('.takeover .run > span'), unit: TAKEOVER, speed: 3 },
};
function run(r, bandH) {
  r.el.innerHTML = r.unit;
  const unitW = r.el.offsetWidth, room = r.el.parentElement.clientWidth || innerWidth;
  r.el.innerHTML = r.unit.repeat(Math.ceil(room / Math.max(1, unitW)) + 2);
  r.el.style.setProperty('--rep', unitW);
  r.el.style.setProperty('--dur', `${unitW / (bandH * r.speed)}s`);
}

// Phones: the cards sit halfway between the BLACK FRIDAY ONLY! tag and the yellow tape.
// Wide windows: the clock and the words, as one column, are centred on the badge.
function settle(tall, s) {
  const cards = $('.cards'), fits = [$('.clock-box .fit'), $('.words-box .fit')];
  cards.style.marginTop = '';
  for (const f of fits) Object.assign(f.style, { top: '', bottom: '' });
  const box = (el) => el.getBoundingClientRect();
  if (tall) return;
  // wide: stack them with one even gap, the pair centred on the badge
  {
    const [clockFit, wordsFit] = fits, gap = s * 34;
    const hClock = box(clockFit).height, hWords = box(wordsFit).height, badge = box($('.burst'));
    const top = (badge.top + badge.bottom) / 2 - (hClock + gap + hWords) / 2;
    const place = (f, y) => { const parent = box(f.parentElement); Object.assign(f.style, { top: `${y - parent.top}px`, bottom: 'auto' }); };
    place(clockFit, top);
    place(wordsFit, top + hClock + gap);
  }
}

let geo = { W: 1, H: 1, s: 1, tall: false, cx: 0, cy: 0, r: 100 };
function layout() {
  const W = tv.clientWidth, H = tv.clientHeight, tall = W / H < 0.85;
  set('tall', tall); set('wide', !tall);
  const s = tall ? Math.min(W / 430, H / 900) : Math.min(W / 1280, H / 800);
  root.style.setProperty('--s', `${s}px`);

  // in a tall window the cards have their own row under the clock; in a wide one they follow the words
  (tall ? $('.cards-box .fit') : $('.words')).append($('.cards'));
  fit($('.timer'), tall ? { w: 0.9, h: 0.94 } : { w: 0.94, h: 0.96 });
  fit($('.words'), tall ? { w: 0.94, h: 0.96 } : { w: 0.96, h: 0.96 });
  if (tall) fit($('.cards-box .fit'), { w: 0.86, h: 0.8 });
  fit($('.order .fit'), tall ? { w: 0.9, h: 0.72 } : { w: 0.9, h: 0.46 });
  fit($('.by .fit'), { w: 0.92, h: 0.42 });
  settle(tall, s);

  const tk = Math.min(H * 0.2, W * (tall ? 0.2 : 0.11));
  $('.takeover').style.setProperty('--tk', `${tk}px`);
  run(runs.ticker, $('.ticker').clientHeight);
  run(runs.crawl, $('.crawl').clientHeight);
  run(runs.takeover, tk);

  // the tape filter's distances follow the size of the picture
  const fs = Math.sqrt((W * H) / (1280 * 800)) * (tall ? 0.85 : 1);
  const attr = (sel, k, v) => $(sel).setAttribute(k, v);
  attr('#tape .soft', 'stdDeviation', `${1.2 * fs} ${0.5 * fs}`);
  attr('#tape .halo', 'stdDeviation', `${5 * fs} ${0.6 * fs}`);
  attr('#tape .smear', 'stdDeviation', `${9 * fs} ${1.5 * fs}`);
  attr('#tape .late', 'dx', 6 * fs); attr('#tape .late', 'dy', 1.5 * fs);
  attr('#tape .bloom', 'stdDeviation', 14 * fs);

  // the rays turn around the badge, and its glow sits behind it
  const b = $('.badge').getBoundingClientRect();
  geo = { W, H, s, tall, cx: b.left, cy: b.top, r: parseFloat(getComputedStyle($('.badge')).fontSize) };
  if (bg) {
    const px = Math.min(1, devicePixelRatio || 1);
    bg.size(W, H, px);
    geo.px = px;
  }
  draw(seconds());
}

// ---- drawing: classes on the beat, and the WebGL background ----
let ang = 0, lastT = 0;
function draw(t) {
  const bf = mode === 'today';
  const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
  const beatN = Math.floor(t / BEAT), onBeat = bf && MOVING && beatN % 2 === 1;
  if (MOVING) {
    set('beat', onBeat);
    ang += dt * (bf ? 0.6 : (2 * Math.PI) / 180); // the banner's rays go round in 3 minutes
  }
  if (!bg) return;
  const px = geo.px || 1, H = geo.H;
  const pulse = bf && MOVING ? Math.exp(-(t % BEAT) * 10) : 0;
  bg.draw({
    uRes: [bg.gl.drawingBufferWidth, bg.gl.drawingBufferHeight], uPx: px,
    uC: [geo.cx * px, (H - geo.cy) * px], uR: geo.r * px, uAng: FREEZE ? 0.3 : ang,
    uBF: bf ? 1 : 0, uFlip: onBeat ? 1 : 0, uPulse: pulse, uK: geo.s * (geo.tall ? 0.7 : 1),
    uTile: { tex: 0 },
  });
}

// ---- start ----
window.__bf = { gl: !!bg, mode: '', tape: false, now };
async function start() {
  const faces = ['400 50px "Archivo Black"', '300 50px "Antonio"', '600 50px "Antonio"', 'italic 700 50px "Arimo"', 'italic 700 50px "Tinos"'];
  await Promise.race([Promise.all(faces.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 3000))]);
  set('moving', MOVING); set('freeze', FREEZE);
  if (!MOVING || FREEZE) $('svg.defs').pauseAnimations(); // the tape's noise holds still too
  tick(false);
  layout();
  set('loading', false);
  set('tape-on', TAPE); set('lines-on', TAPE); window.__bf.tape = TAPE;

  let pending = 0;
  addEventListener('resize', () => { cancelAnimationFrame(pending); pending = requestAnimationFrame(layout); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', () => location.reload());

  if (MOVING && !FREEZE) {
    const loop = () => { tick(true); draw(seconds()); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    const globe = new Image();
    globe.onload = () => { $('.globe').src = globe.src; };
    globe.src = 'images/globe.webp';
  } else {
    setInterval(() => tick(false), 250); // the clock still counts; nothing else moves
  }
  window.__bf.ready = true;

  // a slow machine: if the page draws slowly with the tape filter, take it off (and put it back if that made no difference)
  if (TAPE && MOVING && !FREEZE && !KEEP) {
    const rate = () => new Promise((ok) => {
      let frames = 0, spent = 0, last = 0;
      const step = (ts) => { const gap = ts - last; if (last && gap < 1000) { frames++; spent += gap; } last = ts; if (spent < 2000) requestAnimationFrame(step); else ok((frames * 1000) / spent); };
      requestAnimationFrame(step);
    });
    await new Promise((r) => setTimeout(r, 1500));
    const withTape = await rate();
    if (withTape < 24) {
      set('tape-on', false);
      if ((await rate()) < withTape * 1.5) set('tape-on', true);
    }
    window.__bf.tape = root.classList.contains('tape-on');
  }
}
start();
