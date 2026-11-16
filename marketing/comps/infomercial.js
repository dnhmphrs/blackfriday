// The 3 a.m. infomercial for "30% Off EVERYTHING".
// Everything on screen is a pure function of time, so frames can be rendered in any order:
//   window.comp.setTime(seconds)
const q = new URLSearchParams(location.search);
const FORMATS = {
  '9x16': { w: 1080, h: 1920 },
  '1x1': { w: 1080, h: 1080 },
  '16x9': { w: 1920, h: 1080 },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 8, FPS = 30, TAU = Math.PI * 2;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (s) => stage.querySelector(s);

// ---------- build the repeated parts ----------
// The generic web page, once for BEFORE and once for AFTER.
const PAGE = `
  <div class="nav"><span class="logo"></span><span class="name">example.com</span><u></u><u></u><u class="buy"></u></div>
  <h2>10 Things On This Web Page</h2>
  <div class="hero"><span class="sun"></span><span class="hill"></span><span class="hill h2"></span></div>
  <div class="lines"><s></s><s></s><s></s></div>
  <div class="cards"><a></a><a></a><a></a><a></a></div>`;
for (const p of stage.querySelectorAll('.page')) p.innerHTML = PAGE;

// Gold starbursts.
function spikes(svg, id, n, inner) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? inner : 98, a = (i / (n * 2)) * TAU; pts.push((Math.cos(a) * r).toFixed(2) + ',' + (Math.sin(a) * r).toFixed(2)); }
  svg.innerHTML = `<defs><radialGradient id="${id}" cx="0.4" cy="0.34" r="0.75"><stop offset="0" stop-color="#fffbd0"/><stop offset="0.45" stop-color="#ffd81a"/><stop offset="1" stop-color="#f29a00"/></radialGradient></defs>
    <polygon points="${pts.join(' ')}" fill="#000" stroke="#000" stroke-width="7" stroke-linejoin="round"/>
    <polygon points="${pts.join(' ')}" fill="url(#${id})" stroke="#b80000" stroke-width="2.5" stroke-linejoin="round"/>`;
}
const SPIKES = 24;
spikes($('.stores .spikes'), 'gs', SPIKES, 82);
spikes($('.bonus .spikes'), 'gb', SPIKES, 86);

// ---------- fonts ----------
await document.fonts.ready;
await Promise.all(['400 100px Anton', '700 40px Oswald', '400 40px Oswald', '400 60px Lobster', '700 30px Arimo', '400 60px "Archivo Black"', '400 100px "Alfa Slab One"', '400 60px "Luckiest Guy"', '400 100px Bangers'].map((f) => document.fonts.load(f)));

// ---------- tickers: a whole number of repeats per loop, so the loop is seamless ----------
const tickers = [...stage.querySelectorAll('.ticker')].map((el) => {
  const run = el.querySelector('.run');
  const text = run.dataset.text;
  run.textContent = text;
  const unit = run.getBoundingClientRect().width;
  if (!unit) return null; // this format hides the ticker
  run.textContent = text.repeat(Math.ceil((F.w * 2) / unit) + 1);
  const speed = el.classList.contains('bottom') ? 290 : 210; // px per second, roughly
  return { run, unit, perLoop: Math.max(1, Math.round((speed * DURATION) / unit)) };
}).filter(Boolean);

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(1800);
const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// Glints on the gold: four-point stars, scattered over the headline and the phone number.
const sparkleLayer = document.getElementById('sparkles');
const S0 = stage.getBoundingClientRect();
const STAR = 'M0,-1 C0.05,-0.2 0.2,-0.05 1,0 C0.2,0.05 0.05,0.2 0,1 C-0.05,0.2 -0.2,0.05 -1,0 C-0.2,-0.05 -0.05,-0.2 0,-1Z';
const sparkles = [];
for (const [sel, count, size] of [['.head .big .fill', 14, 90], ['.call .num .fill', 8, 60], ['.stores', 4, 60]]) {
  const el = $(sel);
  if (!el) continue;
  const r = el.getBoundingClientRect();
  if (!r.width) continue;
  for (let i = 0; i < count; i++) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-1 -1 2 2');
    svg.innerHTML = `<path d="${STAR}" fill="#fff"/>`;
    sparkleLayer.append(svg);
    const s = size * (0.6 + rnd() * 0.8);
    sparkles.push({ svg, x: r.left - S0.left + rnd() * r.width - s / 2, y: r.top - S0.top + (0.12 + rnd() * 0.76) * r.height - s / 2, size: s, t0: rnd() * DURATION, life: 0.3 + rnd() * 0.25, spin: rnd() * 50 - 25 });
  }
}

// ---------- the timeline ----------
const GLITCHES = [2.8, 4.0, 5.7];
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const span = (t, a, b) => clamp01((t - a) / (b - a));
const easeOut = (p) => 1 - (1 - p) ** 3;
const back = (p) => { const c = 2.6; return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2; }; // overshoots, then settles on 1
const lerp = (a, b, p) => a + (b - a) * p;
const punch = (t, t0, rate = 12) => (t >= t0 ? Math.exp(-(t - t0) * rate) : 0); // a hit that rings off
const flashAt = (t, t0, len = 0.14) => (t >= t0 && t < t0 + len ? 1 - (t - t0) / len : 0);

const el = {
  rays: $('.rays'), tag: $('.head .tag'), oneday: $('.head .oneday'), big: $('.head .big'), sub: $('.head .sub span'),
  beforeWin: $('.shot.before .win'), x: $('.x'), capB: $('.shot.before .cap span'),
  afterShot: $('.shot.after'), sale: $('.sale'), tick: $('.tick'), capA: $('.shot.after .cap span'), arrow: $('.arrow'),
  call: $('.call'), numFill: $('.call .num .fill'), amt: $('.pay .amt'), sh: $('.pay .sh'),
  storesSpikes: $('.stores .spikes'), storesTxt: $('.stores .txt'), count: $('.hurry .count'),
  wait: $('.wait'), slab: $('.wait .slab'), w1: $('.wait .w1'), w2: $('.wait .w2'),
  bonus: $('.bonus'), bonusSpikes: $('.bonus .spikes'), bonusTxt: $('.bonus .txt'), b3: $('.bonus .b3'),
  flash: $('.flash'),
};
const X_HITS = [0.5, 0.9, 1.3];          // the red X stamps down three times
const PANEL_OUT = 2.2, PANEL_IN = 2.8;   // the sale panel leaves, then slams back
const WAIT_IN = 4.0, WAIT_OUT = 5.5;     // BUT WAIT... THERE'S MORE!
const BONUS_IN = 5.7, BONUS_OUT = 7.3;   // the free bonus

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const frame = Math.floor(t * FPS + 1e-6);
  const u = t / DURATION;

  el.rays.style.transform = `rotate(${(u * 30).toFixed(3)}deg)`;
  for (const k of tickers) k.run.style.transform = `translateX(${(-((u * k.perLoop * k.unit) % k.unit)).toFixed(2)}px)`;

  // headline: breathes, the tag and the script nod along
  el.big.style.transform = `skewX(-7deg) scale(${(1 + 0.018 * Math.sin(t * TAU)).toFixed(4)})`;
  el.tag.style.transform = `rotate(${(-3.5 + 1.2 * Math.sin(t * TAU * 0.5)).toFixed(3)}deg)`;
  el.oneday.style.transform = `rotate(${(-3.5 - 1.5 * Math.sin(t * TAU * 0.5 + 1)).toFixed(3)}deg) scale(${(1 + 0.04 * Math.max(0, Math.sin(t * TAU * 2))).toFixed(4)})`;

  // BEFORE: the X stamps down and the sad grey page rattles
  let xs = 1, xOn = 1;
  for (const h of X_HITS) { xs += 0.8 * punch(t, h, 13); if (t >= h - 0.1 && t < h) xOn = 0; }
  el.x.style.opacity = xOn;
  el.x.style.transform = `rotate(${(-5 + 2 * Math.sin(t * TAU)).toFixed(3)}deg) scale(${xs.toFixed(4)})`;
  const rattle = Math.sin(Math.PI * span(t, 0.5, 1.9));
  el.beforeWin.style.transform = `translate(${((hash(frame) - 0.5) * 12 * rattle).toFixed(2)}px, ${((hash(frame + 500) - 0.5) * 8 * rattle).toFixed(2)}px)`;
  const nag = t >= 0.5 && t < 2.1 && Math.floor((t - 0.5) * 8) % 2 === 0;
  el.capB.style.color = nag ? '#ffe93a' : '#fff';
  el.capB.style.transform = `scale(${(1 + 0.05 * rattle * Math.abs(Math.sin(t * TAU * 2))).toFixed(4)})`;

  // AFTER: the sale panel slides away, then slams back over the right-hand 30%
  let px = 0;
  if (t >= PANEL_OUT && t < PANEL_IN) px = 110 * span(t, PANEL_OUT, PANEL_OUT + 0.2) ** 2;
  else if (t >= PANEL_IN) px = 110 * (1 - back(span(t, PANEL_IN, PANEL_IN + 0.3)));
  el.sale.style.transform = `translateX(${px.toFixed(2)}%)`;
  const slam = punch(t, PANEL_IN + 0.1, 9);
  el.afterShot.style.transform = `translate(${(Math.sin((t - PANEL_IN) * 70) * 7 * slam).toFixed(2)}px, 0) scale(${(1 + 0.03 * slam).toFixed(4)})`;
  let ts = 1;
  if (t >= PANEL_OUT && t < PANEL_IN + 0.25) ts = 1 - span(t, PANEL_OUT, PANEL_OUT + 0.12);
  else if (t >= PANEL_IN + 0.25) ts = back(span(t, PANEL_IN + 0.25, PANEL_IN + 0.55));
  el.tick.style.transform = `rotate(${(-8 + 3 * Math.sin(t * TAU)).toFixed(3)}deg) scale(${Math.max(0, ts).toFixed(4)})`;
  const brag = Math.sin(Math.PI * span(t, PANEL_IN + 0.2, WAIT_IN));
  el.capA.style.transform = `scale(${(1 + 0.02 * Math.sin(t * TAU * 2) + 0.07 * brag * Math.abs(Math.sin(t * TAU * 2))).toFixed(4)})`;
  const capA = t >= PANEL_OUT && t < PANEL_IN + 0.1 ? 'WATCH THIS\u2026' : 'NOW 30% LESS!';
  if (el.capA.textContent !== capA) el.capA.textContent = capA;
  el.arrow.style.transform = `translateX(${(9 * Math.sin(t * TAU * 2)).toFixed(2)}px)`;

  // CALL NOW flashes twice a second; a glint runs along the number every two seconds
  el.call.style.setProperty('--flash', Math.floor(t * 4 + 1e-6) % 2 ? '#ffffff' : '#fff35a');
  el.numFill.style.backgroundPosition = `${(span(t % 2, 0.3, 1.5) * 100).toFixed(2)}% 0, 0 0`;
  el.amt.style.transform = `scale(${(1 + 0.06 * Math.max(0, Math.sin(t * TAU * 1.5))).toFixed(4)})`;
  el.sh.style.transform = `rotate(${(-4 + 2 * Math.sin(t * TAU * 0.5)).toFixed(3)}deg)`;

  // NOT SOLD IN STORES: the burst creeps round by two spikes per loop, the words rock
  el.storesSpikes.style.transform = `rotate(${(u * (360 / SPIKES) * 2).toFixed(3)}deg)`;
  el.storesTxt.style.transform = `rotate(${(-11 + 3 * Math.sin(t * TAU * 0.5)).toFixed(3)}deg) scale(${(1 + 0.03 * Math.sin(t * TAU)).toFixed(4)})`;

  // the countdown you can never beat
  if (el.count) { const left = Math.max(0, Math.round((DURATION - t) * 100)); el.count.textContent = `0:0${Math.floor(left / 100)}.${String(left % 100).padStart(2, '0')}`; }

  // BUT WAIT... THERE'S MORE!
  const waitOn = t >= WAIT_IN && t < WAIT_OUT + 0.2;
  el.wait.style.visibility = waitOn ? 'visible' : 'hidden';
  if (waitOn) {
    const pin = span(t, WAIT_IN, WAIT_IN + 0.22), pout = span(t, WAIT_OUT, WAIT_OUT + 0.2);
    const sc = lerp(2.6, 1, back(pin)) * (1 + 0.025 * Math.sin((t - WAIT_IN) * TAU * 3));
    const shake = punch(t, WAIT_IN + 0.12, 8);
    el.slab.style.transform = `translate(${(pout ** 2 * 1500 + Math.sin(t * 90) * 14 * shake).toFixed(2)}px, ${(Math.cos(t * 77) * 9 * shake - pout ** 2 * 160).toFixed(2)}px) rotate(${(-6 + 1.4 * Math.sin((t - WAIT_IN) * TAU * 1.5) + pout * 14).toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    el.w2.style.transform = `scale(${(1 + 0.06 * Math.abs(Math.sin((t - WAIT_IN - 0.25) * TAU * 2)) * span(t, WAIT_IN + 0.25, WAIT_IN + 0.4)).toFixed(4)})`;
  }

  // ...the free bonus
  const bonusOn = t >= BONUS_IN && t < BONUS_OUT + 0.22;
  el.bonus.style.visibility = bonusOn ? 'visible' : 'hidden';
  if (bonusOn) {
    const pin = span(t, BONUS_IN, BONUS_IN + 0.3), pout = span(t, BONUS_OUT, BONUS_OUT + 0.22);
    const sc = Math.max(0, back(pin) * (1 - pout ** 2));
    const turn = lerp(-70, 0, easeOut(pin)) + pout * 60;
    el.bonusSpikes.style.transform = `rotate(${(turn + (t - BONUS_IN) * (360 / SPIKES) * 1.5).toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    el.bonusTxt.style.transform = `rotate(${(turn - 6 + 2 * Math.sin((t - BONUS_IN) * TAU)).toFixed(3)}deg) scale(${sc.toFixed(4)})`;
    el.b3.style.transform = `scale(${(1 + 0.07 * Math.abs(Math.sin((t - BONUS_IN) * TAU * 1.5))).toFixed(4)})`;
  }

  // a white flash on every hit
  const fl = Math.max(flashAt(t, WAIT_IN) * 0.9, flashAt(t, BONUS_IN) * 0.8, flashAt(t, PANEL_IN + 0.08, 0.1) * 0.35);
  el.flash.style.opacity = fl.toFixed(3);

  for (const s of sparkles) {
    let p = (t - s.t0) / s.life;
    if (p < 0) p = (t + DURATION - s.t0) / s.life; // wraps across the loop point
    const on = p >= 0 && p <= 1;
    const k = on ? Math.sin(p * Math.PI) : 0;
    s.svg.style.cssText = `left:${s.x.toFixed(1)}px;top:${s.y.toFixed(1)}px;width:${s.size.toFixed(1)}px;height:${s.size.toFixed(1)}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(s.spin * p).toFixed(2)}deg);filter:drop-shadow(0 0 6px #fff)`;
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: GLITCHES, setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
