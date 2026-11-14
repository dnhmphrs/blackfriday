// The screaming local dealer spot: HUGE! BLACK FRIDAY INTERNET BLOWOUT!
// Everything on screen is a pure function of time, so frames can be rendered in any order:
//   window.comp.setTime(seconds)
// The whole spot runs on a 120 bpm beat (15 frames). Every period used below divides the
// 8 second loop, so setTime(0) and setTime(8) draw the same picture.
import * as THREE from 'three';
import { createStage, materials } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';
import { makeText } from '../lib/objects.js';
import { loadFont } from '../lib/fonts.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  // hero: centre of the 3D "30% OFF" block and the box (px) it must fit in
  // burst: diameter of the starburst behind it.
  // beams: searchlights [x, y of the lamp, resting angle (0 = straight up), swing, sweeps per loop, phase]
  // flags: pennant strings [x0, y0, x1, y1, sag, count, flag width, flag length]
  // minis: little bursts that pop in and out [x, y, diameter, text, colour class, start, life]
  '9x16': {
    w: 1080, h: 1920, hero: { x: 540, y: 950, w: 690, h: 440 }, burst: 1000,
    beams: [[30, 700, 24, 20, 2, 0], [30, 700, 50, 15, 3, 1.3], [1050, 700, -24, 20, 2, 2.1], [1050, 700, -50, 15, 3, 3.9], [60, 1260, 30, 16, 2, 4.6], [1020, 1260, -30, 16, 2, 0.8]],
    flags: [[-40, 0, 1120, -16, 96, 12, 80, 100], [-40, 150, 1120, 172, 84, 12, 80, 100]],
    minis: [[930, 800, 210, 'WOW!', 'lime', 0.5, 1.5], [150, 1085, 215, 'HURRY!', 'pink', 2.5, 1.5], [930, 800, 210, 'SAVE!', 'pink', 4.5, 1.5], [150, 1085, 215, 'NO\nCOUPON!', 'lime', 6.5, 1.5]],
    glints: [[150, 400, 930, 620], [200, 740, 880, 1170]], ticker: 300,
  },
  '1x1': {
    w: 1080, h: 1080, hero: { x: 470, y: 528, w: 540, h: 348 }, burst: 690,
    beams: [[40, 730, 20, 25, 2, 0], [40, 730, 44, 20, 3, 1.3], [1040, 730, -20, 25, 2, 2.1], [1040, 730, -44, 20, 3, 3.9]],
    flags: [[-40, -22, 1120, -22, 70, 12, 78, 92]],
    minis: [[112, 470, 190, 'WOW!', 'lime', 0.5, 1.5], [112, 610, 190, 'HURRY!', 'pink', 2.5, 1.5], [112, 470, 190, 'SAVE!', 'pink', 4.5, 1.5], [112, 610, 190, 'NO\nCOUPON!', 'lime', 6.5, 1.5]],
    glints: [[40, 90, 700, 260], [220, 370, 730, 700]], ticker: 260,
  },
  '16x9': {
    w: 1920, h: 1080, hero: { x: 1440, y: 390, w: 680, h: 462 }, burst: 900,
    beams: [[1000, 710, 20, 22, 2, 0], [1890, 710, -20, 22, 2, 2.1], [1890, 710, -46, 16, 3, 3.9], [30, 710, 28, 20, 2, 1.1], [30, 710, 58, 14, 3, 2.9], [930, 710, -34, 22, 2, 4.4]],
    flags: [[-40, -24, 1960, -24, 84, 20, 80, 96]],
    minis: [[1806, 150, 200, 'WOW!', 'lime', 0.5, 1.5], [1812, 580, 200, 'HURRY!', 'pink', 2.5, 1.5], [1806, 150, 200, 'SAVE!', 'pink', 4.5, 1.5], [1812, 580, 200, 'NO\nCOUPON!', 'lime', 6.5, 1.5]],
    glints: [[80, 110, 900, 330], [1080, 180, 1720, 620]], ticker: 320,
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 8, FPS = 30, BEAT = 0.5, LEAD = 8 / FPS; // the first beat lands on frame 8
const TAU = Math.PI * 2;
const $ = (s) => document.querySelector(s);
const SVG = 'http://www.w3.org/2000/svg';

const stage = $('#stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const shake = $('#shake');

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(1130);

// ---------- 3D: a red "30% OFF" sign ----------
const canvas = $('#gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 24;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });

const thirty = await buildObject('thirty-red');
const off = makeText('OFF', await loadFont('black'), { size: 1.0, depth: 0.42, bevel: 0.05, front: materials.gloss(0xff1414), side: materials.chrome() });
// The stock tone mapping rolls a brightly lit red off towards white, and the faces mirror the
// blue studio: together, salmon. A sale sign wants the opposite. Let the red clip, fully
// saturated, and give the faces their own (much dimmer) copy of the room. A material only
// obeys its own envMapIntensity when it carries the map itself.
renderer.toneMapping = THREE.NoToneMapping;
for (const o of [thirty, off]) o.traverse((m) => {
  if (!m.isMesh) return;
  const front = m.material[0];
  front.color.set(0xff0808); front.roughness = 0.6;
  front.envMap = scene.environment; front.envMapIntensity = 0.2;
  m.material[1] = materials.chrome(); // chrome sides on both words: edge-on, the sign is a bright slab, not a dark one
});
const tw = thirty.userData.size.x, th = thirty.userData.size.y;
const ok = tw / off.userData.size.x, oh = off.userData.size.y * ok, gap = 0.16;
off.scale.set(ok, ok, 1);
const blockH = th + gap + oh;
thirty.position.y = blockH / 2 - th / 2;
off.position.y = -blockH / 2 + oh / 2;
const hero = new THREE.Group();
hero.add(thirty, off);
const pivot = new THREE.Group();
pivot.add(hero);
scene.add(pivot);

const pxPerUnit = Math.min(F.hero.w / tw, F.hero.h / blockH);
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (-7 * Math.PI) / 180; // from a little below: it towers
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);

// Two spotlights whose pools of light sweep across the sign. The key is turned down so the
// red sits a little under full strength and the pools have somewhere to go.
key.intensity = 1.6;
const back = new THREE.DirectionalLight(0xffffff, 2.2); // so the back of the sign is red too, mid-turn
back.position.set(2, 3, -7);
scene.add(back);
const spots = [0xfff0b0, 0xffffff].map((colour, i) => {
  const s = new THREE.SpotLight(colour, 120, 0, 0.115, 0.85, 2);
  s.position.set(i ? 3.2 : -3.2, 3.4, 7);
  scene.add(s, s.target);
  return s;
});

// ---------- backdrop ----------
const far = Math.max(...[[0, 0], [F.w, 0], [0, F.h], [F.w, F.h]].map(([x, y]) => Math.hypot(x - F.hero.x, y - F.hero.y))) * 1.06;
const rays = $('.rays');
rays.style.cssText = `left:${F.hero.x - far}px;top:${F.hero.y - far}px;width:${far * 2}px;height:${far * 2}px`;
$('.glow').style.background = `radial-gradient(circle ${F.burst * 0.66}px at ${F.hero.x}px ${F.hero.y}px, rgba(255,236,90,0.7), rgba(255,170,0,0.18) 55%, rgba(255,120,0,0) 88%), radial-gradient(ellipse 75% 75% at 50% 50%, rgba(40,0,6,0) 62%, rgba(40,0,6,0.55) 100%)`;

const beams = F.beams.map(([x, y, base, amp, n, ph]) => {
  const el = document.createElement('i');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  $('#beams').append(el);
  return { el, base, amp, n, ph };
});

const starPoints = (n, R, r, rot = 0) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i / (n * 2)) * TAU, d = i % 2 ? r : R; return `${(Math.cos(a) * d).toFixed(2)},${(Math.sin(a) * d).toFixed(2)}`; }).join(' ');
function burstSvg(n, r, fill, stroke, sw, extra = '') {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '-100 -100 200 200');
  svg.innerHTML = `${extra}<polygon points="${starPoints(n, 100, r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="miter"/>`;
  return svg;
}
function heroBurst(el, d, n, r, fill, extra) {
  el.style.cssText = `left:${F.hero.x - d / 2}px;top:${F.hero.y - d / 2}px;width:${d}px;height:${d}px`;
  const svg = burstSvg(n, r, fill, '#000', 2.2, extra);
  svg.style.cssText = `width:${d}px;height:${d}px`;
  el.append(svg);
  return svg;
}
const HB_N = 20;
const hb2 = heroBurst($('#hb2'), F.burst * 1.1, HB_N, 85, '#ff6a00', '');
const hb1 = heroBurst($('#hb1'), F.burst, HB_N, 80, 'url(#hbg)', '<defs><radialGradient id="hbg"><stop offset="0" stop-color="#fffde0"/><stop offset="0.45" stop-color="#fff200"/><stop offset="1" stop-color="#ff9d00"/></radialGradient></defs>');

// ---------- pennant strings ----------
const flagSvg = $('#flags');
flagSvg.setAttribute('width', F.w);
flagSvg.setAttribute('height', F.h);
const FLAG_COLOURS = ['#fff200', '#ffffff', '#1438ff', '#18c93e', '#ff7a00'];
const flags = [];
F.flags.forEach(([x0, y0, x1, y1, sag, n, fw, fh], si) => {
  const at = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + sag * 4 * u * (1 - u)];
  const line = document.createElementNS(SVG, 'path');
  line.setAttribute('d', 'M' + Array.from({ length: 41 }, (_, i) => at(i / 40).map((v) => v.toFixed(1)).join(',')).join('L'));
  line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#000'); line.setAttribute('stroke-width', 5);
  flagSvg.append(line);
  const len = Math.hypot(x1 - x0, y1 - y0), du = fw / len / 2;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, a = at(u - du), b = at(u + du);
    const poly = document.createElementNS(SVG, 'polygon');
    poly.setAttribute('fill', FLAG_COLOURS[(i + si * 2) % FLAG_COLOURS.length]);
    poly.setAttribute('stroke', '#000'); poly.setAttribute('stroke-width', 4); poly.setAttribute('stroke-linejoin', 'round');
    flagSvg.append(poly);
    flags.push({ poly, a, b, fh, fw, ph: rnd() * TAU, n: 8 + Math.floor(rnd() * 3) * 4 });
  }
});

// ---------- 2D ----------
await document.fonts.ready;
await Promise.all(['400 100px "Luckiest Guy"', '400 100px "Anton"', '400 100px "Bangers"', '400 100px "Alfa Slab One"', '400 100px "Bungee"',
  '400 100px "Archivo Black"', 'italic 700 40px "Arimo"', '700 40px "Arimo"'].map((f) => document.fonts.load(f)));

// Type is squeezed or stretched sideways to fill its box, the way a sign shop does it.
function fitX(el, width, min = 0.45, max = 1.6) { return Math.min(max, Math.max(min, width / el.offsetWidth)); }

const ribbon = $('.ribbon span');
ribbon.style.transform = `scaleX(${fitX(ribbon, parseFloat(getComputedStyle($('.ribbon')).width) - 150, 0.6, 1.5).toFixed(4)})`;

// the two big starbursts
const stars = [['.s1', 16, 74, '#ffffff', '#000', 3.2, 1], ['.s2', 14, 72, '#1438ff', '#fff', 4.2, 3]].map(([sel, n, r, fill, stroke, sw, beat]) => {
  const el = $(sel);
  const svg = burstSvg(n, r, fill, stroke, sw);
  if (stroke !== '#000') svg.innerHTML = `<polygon points="${starPoints(n, 108, r + 6)}" fill="#000"/>` + svg.innerHTML;
  el.prepend(svg);
  return { el, svg, n, beat };
});

// little ones that pop in and out
const minis = F.minis.map(([x, y, d, text, cls, t0, life], i) => {
  const el = document.createElement('div');
  el.className = 'mini ' + cls;
  el.style.cssText = `left:${x}px;top:${y}px;--d:${d}px`;
  el.append(burstSvg(12, 70, cls === 'lime' ? '#9dff00' : '#ff1f9c', '#000', 4));
  const txt = document.createElement('div');
  txt.className = 'txt'; txt.textContent = text;
  if (text.length > 6) txt.style.fontSize = '0.74em';
  el.append(txt);
  $('#minis').append(el);
  return { el, t0, life, tilt: (i % 2 ? 1 : -1) * (8 + rnd() * 8) };
});

// flash cards: one a second
const ITEMS = ['NEWS', 'VIDEOS', 'E-MAIL', 'RECIPES', 'SPORTS SCORES', 'COMMENT SECTIONS', 'POP-UP ADS', 'CAT PICTURES'];
const cards = ITEMS.map((name, i) => {
  const el = document.createElement('div');
  el.className = 'card c' + (i % 4);
  el.innerHTML = `<div class="item"><span>${name}</span></div><div class="deal"><span>30%<i>OFF!</i></span></div><div class="tab">${i % 2 ? 'ALSO ON SALE:' : 'NOW ON SALE:'}</div>`;
  $('#cards').append(el);
  const item = el.querySelector('.item'), span = item.querySelector('span');
  span.style.transform = `scaleX(${fitX(span, item.clientWidth - 44, 0.4, 1.7).toFixed(4)})`;
  const deal = el.querySelector('.deal'), ds = deal.querySelector('span');
  ds.style.transform = `skewX(-9deg) scaleX(${fitX(ds, deal.clientWidth - 40, 0.5, 1.4).toFixed(4)})`;
  return { el, tilt: (i % 2 ? 1 : -1) * (1.2 + rnd() * 1.6) };
});

const huge = $('.huge'), hugeIn = $('.huge .in');
const mustgo = $('.mustgo'), mustgoSpan = $('.mustgo .in span');
const mustgoFit = fitX(mustgoSpan, F.w - 70, 0.6, 1.5);
const l1 = $('.lower .l1 span');
const l1Fit = fitX(l1, F.w - 90, 0.6, 1.3);
const free = $('.lower .free');
const flash = $('.flash');

// Ticker: repeat the text, and move a whole number of repeats per loop so the loop is seamless.
const tickers = [...document.querySelectorAll('.ticker')].map((el) => {
  const run = el.querySelector('.run');
  const text = run.dataset.text;
  run.textContent = text;
  const unit = run.getBoundingClientRect().width;
  if (!unit) return null; // this format hides the ticker
  run.textContent = text.repeat(Math.ceil((F.w * 2) / unit) + 1);
  return { run, unit, perLoop: Math.max(1, Math.round((F.ticker * DURATION) / unit)) };
}).filter(Boolean);

// Glints: four-point stars that flare for a third of a second.
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const sparkles = Array.from({ length: 22 }, (_, i) => {
  const [ax, ay, bx, by] = F.glints[i % F.glints.length];
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '-1 -1 2 2');
  svg.innerHTML = `<path d="${STAR}" fill="#fff"/>`;
  $('#sparkles').append(svg);
  const size = 70 + rnd() * 90;
  return { svg, x: ax + rnd() * (bx - ax) - size / 2, y: ay + rnd() * (by - ay) - size / 2, size, t0: rnd() * DURATION, life: 0.3 + rnd() * 0.2, spin: rnd() * 50 - 25 };
});

// a flare off the sign as it comes round, at the moment it is edge-on and there is least to see
const flare = document.createElementNS(SVG, 'svg');
flare.setAttribute('viewBox', '-1 -1 2 2');
flare.innerHTML = '<g fill="#fff"><ellipse rx="1" ry="0.03"/><ellipse rx="0.03" ry="1"/><ellipse rx="0.5" ry="0.018" transform="rotate(45)"/><ellipse rx="0.5" ry="0.018" transform="rotate(-45)"/><circle r="0.1"/></g>';
const flareSize = F.hero.w * 1.3;
$('#sparkles').append(flare);

// which way each beat knocks the picture
const KNOCKS = Array.from({ length: DURATION / BEAT }, () => ({ a: rnd() * TAU, r: rnd() * 2 - 1 }));
const GLITCHES = [2.8, 6.8];
const wrap = (x, m) => ((x % m) + m) % m;
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function setTime(t) {
  t = wrap(t, DURATION);
  const bt = wrap(t - LEAD, DURATION);            // time since the first beat
  const beat = Math.floor(bt / BEAT + 1e-6);      // 0..15
  const ph = Math.max(0, bt - beat * BEAT);       // seconds into this beat
  const big = beat % 2 === 0;                     // the beats a new card lands on
  const hit = Math.exp(-ph * 14);                 // 1 on the beat, gone in a few frames

  // ---- the knock ----
  const K = KNOCKS[beat], amp = (big ? 16 : 7) * Math.exp(-ph * 13) * Math.cos(ph * 55);
  shake.style.transform = `translate(${(Math.cos(K.a) * amp).toFixed(2)}px, ${(Math.sin(K.a) * amp).toFixed(2)}px) rotate(${(K.r * (big ? 0.9 : 0.4) * Math.exp(-ph * 11)).toFixed(3)}deg) scale(${(1 + (big ? 0.035 : 0.015) * Math.exp(-ph * 10)).toFixed(4)})`;
  flash.style.opacity = big ? (0.3 * Math.exp(-ph * 38)).toFixed(3) : '0';

  // ---- backdrop ----
  rays.style.transform = `rotate(${((t / DURATION) * 45).toFixed(3)}deg)`;
  hb1.style.transform = `rotate(${((t / DURATION) * (360 / HB_N) * 2).toFixed(3)}deg) scale(${(1 + 0.04 * hit).toFixed(4)})`;
  hb2.style.transform = `rotate(${(9 + (t / DURATION) * (360 / HB_N) * 2).toFixed(3)}deg) scale(${(1 + 0.07 * hit).toFixed(4)})`;
  for (const b of beams) b.el.style.transform = `rotate(${(b.base + b.amp * Math.sin((t / DURATION) * TAU * b.n + b.ph)).toFixed(3)}deg)`;
  for (const f of flags) {
    const w = Math.sin((t / DURATION) * TAU * f.n + f.ph), mx = (f.a[0] + f.b[0]) / 2, my = (f.a[1] + f.b[1]) / 2;
    f.poly.setAttribute('points', `${f.a[0].toFixed(1)},${f.a[1].toFixed(1)} ${f.b[0].toFixed(1)},${f.b[1].toFixed(1)} ${(mx + w * f.fw * 0.24).toFixed(1)},${(my + f.fh * (1 - 0.05 * w * w)).toFixed(1)}`);
  }

  // ---- hero: one fast turn every four seconds, a showroom sway in between ----
  const st = wrap(bt, 4);
  pivot.rotation.y = TAU * easeOut(st / 0.95) + 0.42 * Math.sin((bt / 2) * TAU);
  const fp = (st - 0.14) / 0.34, fk = fp > 0 && fp < 1 ? Math.sin(fp * Math.PI) : 0;
  flare.style.cssText = `left:${F.hero.x - flareSize / 2}px;top:${F.hero.y - flareSize / 2}px;width:${flareSize}px;height:${flareSize}px;opacity:${fk > 0 ? 1 : 0};transform:scale(${fk.toFixed(3)}) rotate(${(-12 + 30 * fp).toFixed(2)}deg);filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 26px #fff6a0)`;
  pivot.rotation.x = 0.07 * Math.sin((bt / 4) * TAU);
  pivot.rotation.z = 0.035 * Math.sin((bt / 2) * TAU + 1) + (big ? 0.03 : -0.03) * hit;
  pivot.scale.setScalar(1 + 0.07 * hit);
  const la = (t / DURATION) * TAU * 2, lb = (t / DURATION) * TAU * 3 + 1;
  spots[0].target.position.set(1.45 * Math.sin(la), 0.75 * Math.cos(la * 2 + 0.6), 0);
  spots[1].target.position.set(-1.45 * Math.sin(lb), 0.8 * Math.sin((t / DURATION) * TAU * 2 + 2), 0);

  // ---- HUGE! ----
  huge.classList.toggle('alt', ph < 4.5 / FPS);
  hugeIn.style.transform = `rotate(${(-4 + 1.1 * Math.sin(bt * TAU)).toFixed(3)}deg) scale(${(1 + 0.085 * Math.exp(-ph * 9)).toFixed(4)})`;

  // ---- starbursts ----
  for (const s of stars) {
    const p = wrap(bt - s.beat * BEAT, 2), k = Math.exp(-p * 7);
    s.el.style.transform = `scale(${(1 + 0.42 * k).toFixed(4)}) rotate(${(4 * Math.sin((bt / 2) * TAU + s.beat) + 16 * k).toFixed(3)}deg)`;
    s.svg.style.transform = `rotate(${((t / DURATION) * (360 / s.n) * 3).toFixed(3)}deg)`;
  }
  for (const m of minis) {
    const p = wrap(bt - m.t0, DURATION), on = p < m.life;
    m.el.style.visibility = on ? 'visible' : 'hidden';
    if (on) m.el.style.transform = `scale(${(1 + 0.9 * Math.exp(-p * 20) - (p > m.life - 0.07 ? 0.3 : 0)).toFixed(4)}) rotate(${(m.tilt + 5 * Math.sin(p * TAU * 2)).toFixed(3)}deg)`;
  }

  // ---- flash cards ----
  const ci = Math.floor(bt + 1e-6) % cards.length, cp = Math.max(0, bt - Math.floor(bt + 1e-6));
  cards.forEach((c, i) => {
    c.el.style.visibility = i === ci ? 'visible' : 'hidden';
    if (i === ci) c.el.style.transform = `scale(${(1 + 1.3 * Math.exp(-cp * 24)).toFixed(4)}) rotate(${(c.tilt * (1 + 3 * Math.exp(-cp * 14))).toFixed(3)}deg)`;
  });

  // ---- bands ----
  mustgo.classList.toggle('inv', big);
  mustgoSpan.style.transform = `scale(${(mustgoFit * (1 + 0.05 * hit)).toFixed(4)}, ${(1 + 0.1 * hit).toFixed(4)})`;
  l1.style.transform = `skewX(-8deg) scaleX(${l1Fit.toFixed(4)})`;
  free.classList.toggle('off', Math.floor(bt * 4 + 1e-6) % 2 === 1);
  for (const k of tickers) k.run.style.transform = `translateX(${(-(((t / DURATION) * k.perLoop * k.unit) % k.unit)).toFixed(2)}px)`;

  for (const s of sparkles) {
    const p = wrap(t - s.t0, DURATION) / s.life; // wraps across the loop point
    const on = p <= 1, k = on ? Math.sin(p * Math.PI) : 0;
    s.svg.style.cssText = `left:${s.x}px;top:${s.y}px;width:${s.size}px;height:${s.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(s.spin * p).toFixed(2)}deg);filter:drop-shadow(0 0 6px #fff)`;
  }

  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: GLITCHES, setTime, three: { THREE, scene, camera, renderer, pivot, hero } };
setTime(Number(q.get('t') || 0));
window.ready = true;
