// THE BLOWOUT: the mattress-warehouse sale spot. EVERYTHING MUST GO.
// Everything on screen is a pure function of time, so frames can be rendered in any order:
//   window.comp.setTime(seconds)
// Every period used below divides the 8 second loop, so setTime(0) and setTime(8) draw the same picture.
import * as THREE from 'three';
import { createStage, materials } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';
import { extrudeShape } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  // sun: centre of the sunburst and of the blue rosette (diameter `medal`) behind the offer
  // blocks: centre x, y (px), scale, tilt (degrees), and for full-width bands their width
  // tapes: [centre x, centre y, angle, px per second]
  // bursts: the two starburst slots [centre x, centre y, scale, tilt]
  // back / front: the falling 3D symbols, behind every block and in front of the secondary ones
  //   back: count, [smallest, largest] px, falls per loop.  front: lanes (x in px), sizes, falls per loop
  //   (the front lanes run just inside the edges, and in 16x9 down the gap between the two columns,
  //   so each symbol is seen whole; the CSS keeps the main lettering on top of them)
  '9x16': {
    w: 1080, h: 1920, sun: [540, 866], medal: 930,
    canton: { h: 128, rows: 2, pitch: 90, star: 24 }, fans: { y: 142, r: 104, n: 5 }, footer: 152,
    blocks: {
      strap: { x: 540, y: 300, w: 1080 },
      headline: { x: 540, y: 496, s: 1, r: -2.5 },
      offer: { x: 540, y: 866, s: 1, r: -3 },
      entire: { x: 540, y: 1078, s: 1, r: -3 },
      every: { x: 540, y: 1156, s: 1, r: -3 },
      fin: { x: 362, y: 1318, s: 1, r: 1.5 },
      cta: { x: 540, y: 1498, s: 0.98 },
      phone: { x: 540, y: 1708, w: 1080 },
      fine: { x: 540, y: 1846, w: 1010 },
    },
    tapes: [[540, 680, -5, 150], [540, 1630, 2.5, -170]],
    bursts: [[936, 598, 0.95, 9], [880, 1312, 1.04, -8]],
    back: { count: 9, size: [160, 260], n: 1 }, front: { lanes: [68, 1012, 74, 1006], size: [132, 158], n: 2 },
  },
  '1x1': {
    w: 1080, h: 1080, sun: [540, 540], medal: 560,
    canton: { h: 44, rows: 1, pitch: 72, star: 15 }, fans: null, footer: 0,
    blocks: {
      strap: { x: 540, y: 92, s: 0.8, w: 1350 },
      headline: { x: 400, y: 236, s: 0.74, r: -2.5 },
      offer: { x: 540, y: 528, s: 0.87, r: -3 },
      entire: { x: 540, y: 700, s: 0.84, r: -3 },
      every: { x: 540, y: 765, s: 0.84, r: -3 },
      fin: { x: 252, y: 884, s: 0.66, r: 1.5 },
      cta: { x: 540, y: 1017, s: 0.8 },
      phone: null,
      fine: { x: 858, y: 880, s: 0.88, w: 452, boxed: true, text: '*30% of every web page will be unavailable for viewing. Black Friday only. Not a mattress.' },
    },
    tapes: [[540, 380, -4, 130]],
    bursts: [[900, 250, 0.9, 9], [558, 878, 0.62, -8]],
    back: { count: 6, size: [120, 200], n: 2 }, front: { lanes: [56, 1024, 60, 1020], size: [104, 126], n: 2 },
  },
  '16x9': {
    w: 1920, h: 1080, sun: [1452, 396], medal: 640,
    canton: { h: 46, rows: 1, pitch: 72, star: 15 }, fans: null, footer: 142,
    blocks: {
      strap: { x: 960, y: 104, w: 1920 },
      headline: { x: 496, y: 312, s: 0.9, r: -2.5 },
      offer: { x: 1456, y: 392, s: 0.79, r: -3 },
      entire: { x: 1452, y: 572, s: 0.84, r: -3 },
      every: { x: 1452, y: 644, s: 1, r: -3 },
      fin: { x: 360, y: 618, s: 0.9, r: 1.5 },
      cta: { x: 486, y: 800, s: 0.88 },
      phone: { x: 1456, y: 786, s: 0.8, card: true },
      fine: { x: 960, y: 1000, s: 1.16, w: 1560 },
    },
    tapes: [[960, 474, -3, 150], [960, 898, 1.2, -170]],
    bursts: [[846, 408, 0.76, 9], [826, 636, 0.76, -8]],
    back: { count: 10, size: [130, 220], n: 2 }, front: { lanes: [994, 1860, 1000, 60], size: [120, 146], n: 2 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 8, FPS = 30, TAU = Math.PI * 2;
const GLITCHES = [2.6, 6.1];
const $ = (s) => document.querySelector(s);
const SVG = 'http://www.w3.org/2000/svg';
const RED = '#e3122a', DEEP = '#a80a1c', NAVY = '#0a1466', BLUE = '#1b36d8', YELLOW = '#ffe81a';

const stage = $('#stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry(1776);
const frac = (x) => x - Math.floor(x);
const wrap = (x, period) => ((x % period) + period) % period;

const svgEl = (tag, attrs = {}, parent = null) => {
  const e = document.createElementNS(SVG, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.append(e);
  return e;
};
// A star with n points, as an SVG path.
const starPath = (cx, cy, R, r = R * 0.4, n = 5, rot = -Math.PI / 2) => {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n, rr = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`;
  }
  return d + 'Z';
};
const STAR_INLINE = `<svg viewBox="-1 -1 2 2" style="display:inline-block;width:0.86em;height:0.86em;vertical-align:-0.07em;overflow:visible"><path d="${starPath(0, 0.04, 1)}" fill="currentColor"/></svg>`;
const starify = (el) => { el.innerHTML = el.innerHTML.replace(/★/g, STAR_INLINE); };

// ---------- fonts ----------
await document.fonts.ready;
await Promise.all(['400 100px "Alfa Slab One"', '400 100px "Anton"', '400 60px "Bangers"', '400 42px "Bungee"', '700 31px "Oswald"',
  '400 60px "Archivo Black"', '700 25px "Arimo"', 'italic 700 25px "Arimo"'].map((f) => document.fonts.load(f)));

// ---------- outlined lettering, as SVG (round joins, however thick the outline) ----------
const mctx = document.createElement('canvas').getContext('2d');
const measure = (text, family, size) => {
  mctx.font = `400 ${size}px "${family}"`;
  return { w: mctx.measureText(text).width, cap: mctx.measureText('H').actualBoundingBoxAscent };
};
let uid = 0;
// layers: bottom to top, each { fill, stroke, sw }. A fill may be [top colour, bottom colour].
// extrude: { dx, dy, color, sw }: the bottom layer repeated along a diagonal, like a block letter.
function sign(host, { text, family, width, layers, extrude }) {
  const size = (100 * width) / measure(text, family, 100).w;
  const m = measure(text, family, size);
  const W = Math.ceil(m.w), H = Math.ceil(m.cap);
  const svg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, host);
  const defs = svgEl('defs', {}, svg);
  const paint = (fill) => {
    if (!Array.isArray(fill)) return fill;
    const id = 'g' + uid++;
    const g = svgEl('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: H }, defs);
    fill.forEach((c, i) => svgEl('stop', { offset: i / (fill.length - 1), 'stop-color': c }, g));
    return `url(#${id})`;
  };
  const mk = (attrs) => {
    const t = svgEl('text', { x: W / 2, y: H, 'text-anchor': 'middle', 'font-family': family, 'font-size': size.toFixed(2), 'stroke-linejoin': 'round', 'paint-order': 'stroke', ...attrs }, svg);
    t.textContent = text;
    return t;
  };
  if (extrude) {
    const steps = Math.ceil(Math.max(Math.abs(extrude.dx), Math.abs(extrude.dy)) / 2);
    for (let i = steps; i >= 1; i--) mk({ fill: extrude.color, stroke: extrude.color, 'stroke-width': extrude.sw, transform: `translate(${((extrude.dx * i) / steps).toFixed(1)},${((extrude.dy * i) / steps).toFixed(1)})` });
  }
  const texts = layers.map((l) => mk({ fill: paint(l.fill), stroke: l.stroke || 'none', 'stroke-width': l.sw || 0 }));
  // a streak of light that crosses the face of the letters
  const shineId = 'g' + uid++;
  const shine = svgEl('linearGradient', { id: shineId, gradientUnits: 'userSpaceOnUse', x1: -400, y1: 0, x2: -200, y2: 0, gradientTransform: 'skewX(-20)' }, defs);
  [[0, 0], [0.5, 0.95], [1, 0]].forEach(([o, a]) => svgEl('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, shine));
  const gloss = mk({ fill: `url(#${shineId})` });
  return { svg, W, H, top: texts[texts.length - 1], topFill: texts[texts.length - 1].getAttribute('fill'), shine, gloss };
}

const h1 = sign($('.headline .h1'), { text: 'EVERYTHING', family: 'Alfa Slab One', width: 1000,
  layers: [{ fill: NAVY, stroke: NAVY, sw: 26 }, { fill: ['#ffffff', '#ffffff', '#cfd9ff'] }], extrude: { dx: 9, dy: 13, color: RED, sw: 26 } });
const h2 = sign($('.headline .h2'), { text: 'MUST GO!', family: 'Alfa Slab One', width: 740,
  layers: [{ fill: NAVY, stroke: NAVY, sw: 34 }, { fill: '#fff', stroke: '#fff', sw: 14 }, { fill: ['#ff3046', '#d00c22'] }], extrude: { dx: 9, dy: 13, color: '#050a3c', sw: 34 } });
const offer = sign($('.offer'), { text: '30% OFF', family: 'Anton', width: 960,
  layers: [{ fill: '#fff', stroke: '#fff', sw: 44 }, { fill: NAVY, stroke: NAVY, sw: 22 }, { fill: ['#fffb8a', '#ffe81a', '#ffb800'] }], extrude: { dx: 12, dy: 18, color: DEEP, sw: 44 } });

// ---------- backdrop ----------
const [sx, sy] = F.sun;
const far = Math.max(...[[0, 0], [F.w, 0], [0, F.h], [F.w, F.h]].map(([x, y]) => Math.hypot(x - sx, y - sy))) * 1.04;
const rays = $('.rays');
rays.style.cssText = `left:${sx - far}px;top:${sy - far}px;width:${far * 2}px;height:${far * 2}px`;
$('.vig').style.background = `radial-gradient(circle ${far}px at ${sx}px ${sy}px, rgba(10,20,102,0) 42%, rgba(10,20,102,0.34) 100%)`;

// The rosette: a pinked white edge, a blue disc and a ring of stars.
const medal = $('.medal');
medal.style.cssText = `left:${sx - F.medal / 2}px;top:${sy - F.medal / 2}px;width:${F.medal}px;height:${F.medal}px`;
const msvg = svgEl('svg', { viewBox: '-100 -100 200 200' }, medal);
{
  const defs = svgEl('defs', {}, msvg);
  const g = svgEl('radialGradient', { id: 'medalBlue', cx: '50%', cy: '42%', r: '62%' }, defs);
  [[0, '#2f55ff'], [0.55, '#1326b8'], [1, '#070e58']].forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, g));
}
const pinked = svgEl('path', { d: starPath(0, 0, 100, 94, 40), fill: NAVY, 'stroke-linejoin': 'round' }, msvg);
svgEl('circle', { r: 91.5, fill: '#fff' }, msvg);
svgEl('circle', { r: 88.5, fill: RED }, msvg);
svgEl('circle', { r: 84, fill: 'url(#medalBlue)', stroke: '#fff', 'stroke-width': 1.4 }, msvg);
const ring = svgEl('g', {}, msvg);
const RING = 18;
for (let i = 0; i < RING; i++) {
  const a = (i / RING) * TAU;
  svgEl('path', { d: starPath(Math.cos(a) * 72, Math.sin(a) * 72, 6.2), fill: i % 2 ? '#fff' : YELLOW }, ring);
}

// ---------- star field, fans, footer ----------
const canton = $('.canton');
canton.style.height = F.canton.h + 'px';
const csvg = svgEl('svg', { width: F.w, height: F.canton.h }, canton);
const cantonStars = [];
for (let row = 0; row < F.canton.rows; row++) {
  const y = (F.canton.h * (row + 0.5)) / F.canton.rows + (F.canton.rows > 1 ? (row ? -6 : 4) : 0);
  for (let x = (row % 2 ? F.canton.pitch : F.canton.pitch / 2); x < F.w; x += F.canton.pitch) {
    cantonStars.push({ x, y, ph: x / 400 + row * 0.37, el: svgEl('path', { d: starPath(0, 0, F.canton.star), fill: '#fff' }, csvg) });
  }
}
const fans = [];
if (F.fans) {
  const { y, r, n } = F.fans;
  const pitch = F.w / n;
  for (let i = 0; i < n; i++) {
    const s = svgEl('svg', { width: r * 2, height: r, viewBox: `${-r} 0 ${r * 2} ${r}` }, $('.fans'));
    s.style.left = (pitch * (i + 0.5) - r) + 'px';
    s.style.top = y + 'px';
    const half = (R, fill) => svgEl('path', { d: `M${-R},0 A${R},${R} 0 0 0 ${R},0 Z`, fill, stroke: NAVY, 'stroke-width': 3, 'stroke-linejoin': 'round' }, s);
    half(r, RED); half(r * 0.7, '#fff'); half(r * 0.4, BLUE);
    const PLEATS = 14; // every other pleat sits in shadow
    for (let k = 0; k < PLEATS; k++) {
      const a = (k / PLEATS) * Math.PI, b = ((k + 1) / PLEATS) * Math.PI;
      svgEl('path', { d: `M0,0 L${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)} A${r},${r} 0 0 1 ${(Math.cos(b) * r).toFixed(2)},${(Math.sin(b) * r).toFixed(2)} Z`, fill: k % 2 ? 'rgba(6,10,70,0.2)' : 'rgba(255,255,255,0.08)' }, s);
    }
    svgEl('circle', { cx: 0, cy: 3, r: r * 0.17, fill: YELLOW, stroke: NAVY, 'stroke-width': 3 }, s);
    svgEl('path', { d: starPath(0, 3, r * 0.12), fill: RED }, s);
    fans.push({ el: s, ph: i * 1.3 });
  }
}
const footer = $('.footer');
if (F.footer) footer.style.height = F.footer + 'px'; else footer.style.display = 'none';

// ---------- blocks ----------
for (const el of document.querySelectorAll('.strap .star, .every')) starify(el);
const blocks = {};
for (const [name, cfg] of Object.entries(F.blocks)) {
  const el = $('.' + name);
  if (!cfg) { el.style.display = 'none'; continue; }
  if (cfg.w) el.style.width = cfg.w + 'px';
  if (cfg.boxed) el.classList.add('boxed');
  if (cfg.text) el.textContent = cfg.text;
  if (cfg.card) el.classList.add('card');
  blocks[name] = { el, x: cfg.x, y: cfg.y, s: cfg.s || 1, r: cfg.r || 0 };
}
const put = (name, k = 1, rot = 0, dx = 0, dy = 0) => {
  const b = blocks[name];
  if (!b) return;
  b.el.style.transform = `translate(${(b.x + dx).toFixed(2)}px,${(b.y + dy).toFixed(2)}px) rotate(${(b.r + rot).toFixed(3)}deg) scale(${(b.s * k).toFixed(4)}) translate(-50%,-50%)`;
};
const finRows = [...document.querySelectorAll('.fin .row')].map((row) => ({ row, no: row.querySelector('b') }));
const chevs = [...document.querySelectorAll('.cta .chev i')];
const pill = $('.cta .pill'), freeTag = $('.cta .free');
const strapStars = [...document.querySelectorAll('.strap .star')];
const tagR = $('.strap .tag.r');

// ---------- banner tape: a whole number of repeats per loop, so the loop is seamless ----------
const tapeEls = [...document.querySelectorAll('.tape')];
const tapes = tapeEls.map((el, i) => {
  const cfg = F.tapes[i];
  if (!cfg) { el.style.display = 'none'; return null; }
  const [x, y, angle, speed] = cfg;
  const run = el.querySelector('.run');
  const text = run.dataset.text;
  run.textContent = text;
  const unit = run.getBoundingClientRect().width;
  const L = Math.hypot(F.w, F.h) + 200;
  run.innerHTML = text.repeat(Math.ceil(L / unit) + 2).replace(/★/g, `<i>${STAR_INLINE}</i>`);
  el.style.width = L + 'px';
  el.style.transform = `translate(${x}px,${y}px) rotate(${angle}deg) translate(-50%,-50%)`;
  const perLoop = Math.max(1, Math.round((Math.abs(speed) * DURATION) / unit)) * Math.sign(speed);
  return { run, unit, perLoop };
}).filter(Boolean);

// ---------- starbursts: WOW! SAVE! ----------
// Two slots; each shows two words per loop: [word, start, seconds on screen, colourway]
const SCHEDULE = [
  [['WOW!', 0.25, 3.5, 'y'], ['HURRY!', 4.25, 3.5, 'w']],
  [['SAVE!', 2.25, 3.5, 'w'], ['NOW!', 6.25, 3.5, 'y']],
];
const WAYS = {
  y: { back: RED, front: ['#fffb8a', '#ffd400'], text: RED, edge: NAVY },
  w: { back: NAVY, front: ['#ffffff', '#dfe6ff'], text: RED, edge: NAVY },
};
const burstLayer = $('#bursts');
const SPARK = 'M0,-1 C0.08,-0.24 0.24,-0.08 1,0 C0.24,0.08 0.08,0.24 0,1 C-0.08,0.24 -0.24,0.08 -1,0 C-0.24,-0.08 -0.08,-0.24 0,-1Z';
const bursts = F.bursts.map(([x, y, s, tilt], slot) => {
  const el = document.createElement('div');
  el.className = 'burst';
  burstLayer.append(el);
  const svg = svgEl('svg', { viewBox: '-150 -150 300 300' }, el);
  const defs = svgEl('defs', {}, svg);
  for (const [key, way] of Object.entries(WAYS)) {
    const g = svgEl('linearGradient', { id: `bf${slot}${key}`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    way.front.forEach((c, i) => svgEl('stop', { offset: i, 'stop-color': c }, g));
  }
  const back = svgEl('path', { d: starPath(0, 0, 150, 112, 16), 'stroke-width': 5, 'stroke-linejoin': 'round' }, svg);
  const front = svgEl('path', { d: starPath(0, 0, 130, 102, 16), 'stroke-width': 5, 'stroke-linejoin': 'round' }, svg);
  const label = svgEl('text', { x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Bangers', 'stroke-linejoin': 'round', 'paint-order': 'stroke', 'stroke-width': 14, stroke: '#fff', 'letter-spacing': 2 }, svg);
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const sp = document.createElement('div');
    sp.className = 'spark';
    sp.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${SPARK}" fill="${i % 2 ? '#fff' : YELLOW}" stroke="${NAVY}" stroke-width="0.09"/></svg>`;
    burstLayer.append(sp);
    return { el: sp, a: (i / 10) * TAU + rnd() * 0.4, reach: 0.8 + rnd() * 0.5, size: 64 + rnd() * 56 };
  });
  const words = SCHEDULE[slot].map(([word, t0, life, way]) => {
    const size = Math.min(104, (100 * 190) / measure(word, 'Bangers', 100).w);
    return { word, t0, life, way, size };
  });
  return { el, x, y, s, tilt, slot, back, front, label, sparks, words, shown: null };
});
const backOut = (x, s = 2.6) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;

// ---------- 3D: chrome % and gold $ (and a few chrome stars) tumbling down the frame ----------
const glc = document.createElement('canvas');
const FOV = 24, PPU = 100; // at z = 0 one unit is 100 px
const { renderer, scene, camera } = createStage({ canvas: glc, width: F.w, height: F.h, pixelRatio: 1, fov: FOV });
camera.position.set(0, 0, F.h / (2 * Math.tan((FOV * Math.PI) / 360) * PPU));
// Chrome is only ever a picture of the room it is in, and the stock studio is all blue (gold
// goes olive in it). So: a showroom with a white-hot horizon, blue above and red carpet below
// for the chrome, and the same room in cream and amber for the gold.
const pmrem = new THREE.PMREMGenerator(renderer);
const showroom = (skyLow, skyHigh, floorNear, floorFar) => {
  const room = new THREE.Scene();
  const v3 = (c) => new THREE.Vector3(...c);
  room.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { skyLow: { value: v3(skyLow) }, skyHigh: { value: v3(skyHigh) }, floorNear: { value: v3(floorNear) }, floorFar: { value: v3(floorFar) } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vDir; uniform vec3 skyLow, skyHigh, floorNear, floorFar;
      void main() {
        float up = normalize(vDir).y;
        vec3 above = mix(vec3(2.4, 2.4, 2.5), mix(skyLow, skyHigh, smoothstep(0.2, 0.9, up)), smoothstep(0.0, 0.2, up));
        vec3 below = mix(floorNear, floorFar, smoothstep(-0.12, -0.75, up));
        gl_FragColor = vec4(up > 0.0 ? above : below, 1.0);
      }`,
  })));
  const card = (w, h, pos, v) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); room.add(m);
  };
  card(9, 9, [-8, 9, 7], 14); card(2, 14, [10, 3, 3], 14); card(8, 8, [6, 10, -8], 9); card(10, 3, [0, -9, 6], 6);
  return pmrem.fromScene(room, 0, 0.1, 200).texture;
};
scene.environment = showroom([0.62, 0.78, 1.0], [0.16, 0.3, 0.95], [0.02, 0.03, 0.14], [1.0, 0.07, 0.1]);
const goldRoom = showroom([1.0, 0.95, 0.8], [0.85, 0.7, 0.4], [0.22, 0.09, 0.01], [1.0, 0.62, 0.16]);
pmrem.dispose();
const layerCanvas = (id) => { const c = $(id); c.width = F.w; c.height = F.h; c.style.width = F.w + 'px'; c.style.height = F.h + 'px'; return c.getContext('2d'); };
const backCtx = layerCanvas('#back3d'), frontCtx = layerCanvas('#front3d');

const starShape = new THREE.Shape();
for (let i = 0; i < 10; i++) {
  const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.44 : 1;
  starShape[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
}
starShape.closePath();
const protos = {
  percent: await buildObject('percent'),
  dollar: await buildObject('dollar'),
  star: extrudeShape(starShape, { depth: 0.34, bevel: 0.07, front: materials.chrome() }),
};
protos.dollar.traverse((o) => { if (o.isMesh) o.material.envMap = goldRoom; });
for (const o of Object.values(protos)) { // every prototype is made one unit across
  const size = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  o.scale.multiplyScalar(1 / Math.max(size.x, size.y));
}
const KINDS = ['percent', 'dollar', 'percent', 'star', 'dollar', 'percent', 'dollar', 'star'];
const FRONT_KINDS = ['percent', 'dollar', 'dollar', 'percent'];
const backGroup = new THREE.Group(), frontGroup = new THREE.Group();
scene.add(backGroup, frontGroup);
const pm = () => (rnd() < 0.5 ? -1 : 1);
const makeSym = (group, kind, lane, size, n, ph) => {
  const holder = new THREE.Group();
  holder.add(protos[kind].clone());
  holder.scale.setScalar(size / PPU);
  group.add(holder);
  // A symbol turns head over heels in the plane of the screen (whole turns per loop) and only rocks
  // about the other two axes, so it always shows its face and still catches the light on its sides.
  return { holder, lane, size, n, ph, sway: group === frontGroup ? 5 + rnd() * 5 : 18 + rnd() * 30, swayK: 1 + Math.floor(rnd() * 2), swayPh: rnd() * TAU,
    spin: pm() * (1 + Math.floor(rnd() * 2)), spin0: rnd() * TAU,
    rockX: 0.3 + rnd() * 0.25, kx: 1 + Math.floor(rnd() * 3), ax: rnd() * TAU,
    rockY: 0.5 + rnd() * 0.35, ky: 1 + Math.floor(rnd() * 3), ay: rnd() * TAU };
};
const syms = [];
{
  const { count, size, n } = F.back;
  const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => ((a * 5) % count) - ((b * 5) % count)); // spread neighbours in time
  for (let i = 0; i < count; i++) {
    const lane = ((i + 0.5 + (rnd() - 0.5) * 0.5) / count) * F.w;
    syms.push(makeSym(backGroup, KINDS[i % KINDS.length], lane, size[0] + rnd() * (size[1] - size[0]), n, (order[i] + rnd() * 0.4) / count));
  }
  F.front.lanes.forEach((lane, i) => {
    syms.push(makeSym(frontGroup, FRONT_KINDS[i % FRONT_KINDS.length], lane, F.front.size[0] + rnd() * (F.front.size[1] - F.front.size[0]), F.front.n, (i + rnd() * 0.3) / F.front.lanes.length));
  });
}

// ---------- the timeline ----------
function setTime(t) {
  t = wrap(t, DURATION);
  const u = t / DURATION;

  let glitch = -1;
  for (const g0 of GLITCHES) { const f = Math.floor((t - g0) * FPS + 1e-6); if (f >= 0 && f < 4) glitch = f; }
  const gx = glitch < 0 ? 0 : [26, -18, 12, -6][glitch];

  // backdrop
  rays.style.transform = `rotate(${(u * 45).toFixed(3)}deg)`; // two rays per loop
  ring.setAttribute('transform', `rotate(${(-u * (360 / RING) * 2).toFixed(3)})`);
  pinked.setAttribute('transform', `rotate(${(u * 9).toFixed(3)})`); // one tooth per loop
  for (const s of cantonStars) {
    const k = 0.78 + 0.3 * Math.max(0, Math.sin(TAU * (t / 2 - s.ph)));
    s.el.setAttribute('transform', `translate(${s.x},${s.y}) scale(${k.toFixed(3)}) rotate(${(Math.sin(TAU * (t / 2 - s.ph)) * 10).toFixed(2)})`);
  }
  for (const f of fans) f.el.style.transform = `rotate(${(Math.sin(TAU * (t / 4) + f.ph) * 2.2).toFixed(3)}deg)`;

  for (const k of tapes) {
    const x = -k.unit + wrap(-u * k.perLoop * k.unit, k.unit);
    k.run.style.transform = `translateX(${x.toFixed(2)}px)`;
  }

  // strap
  put('strap');
  strapStars.forEach((s, i) => { s.style.transform = `rotate(${((i ? -1 : 1) * u * 720).toFixed(2)}deg)`; });
  tagR.style.transform = `rotate(5deg) scale(${(1 + 0.1 * Math.max(0, Math.sin(TAU * t))).toFixed(4)})`;

  // headline: a thump on every other beat, and MUST GO! will not sit still
  const hp = wrap(t - 0.5, 2);
  put('headline', 1 + (hp < 0.4 ? 0.035 * (1 - hp / 0.4) ** 2 : 0), 0, gx);
  $('.headline .h2').style.transform = `rotate(${(Math.sin(TAU * t) * 1.3).toFixed(3)}deg) scale(${(1 + 0.03 * Math.sin(TAU * t * 2)).toFixed(4)})`;
  const sweep = (s, p0) => { // a streak of light, once every four seconds
    const p = wrap(t - p0, 4) / 1.1;
    const x = p < 1 ? -300 + p * (s.W + 700) : -900;
    s.shine.setAttribute('x1', x.toFixed(1));
    s.shine.setAttribute('x2', (x + 190).toFixed(1));
  };
  sweep(h1, 3.0); sweep(h2, 3.3); sweep(offer, 1.4);

  // the offer: slams on the odd seconds and flashes white for three frames
  const op = wrap(t - 1, 2);
  put('offer', 1 + (op < 0.5 ? 0.05 * (1 - op / 0.5) ** 3 : 0) + 0.012 * Math.sin(TAU * t), 0, -gx);
  offer.top.setAttribute('fill', op < 0.1 - 1e-6 ? '#fff' : offer.topFill);
  put('entire', 1 + 0.02 * Math.sin(TAU * (t / 2) + 1), Math.sin(TAU * (t / 4)) * 0.5, gx * 0.5);
  put('every', 1, Math.sin(TAU * (t / 4)) * 0.5);

  // NO. NO. NO. Each one is stamped in turn, every four seconds
  put('fin');
  finRows.forEach(({ row, no }, i) => {
    const p = wrap(t - (0.5 + i * 0.75), 4);
    const hit = p < 0.45 ? (1 - p / 0.45) ** 2 : 0;
    no.style.transform = `scale(${(1 + 0.42 * hit).toFixed(4)}) rotate(${(-9 * hit).toFixed(2)}deg)`;
    row.classList.toggle('hot', p < 0.75 - 1e-6);
    row.style.transform = i === 2 && p < 0.45 ? `translateX(${(Math.sin(p * 70) * 7 * hit).toFixed(2)}px)` : '';
  });

  // the button
  put('cta');
  pill.style.transform = `scale(${(1 + 0.03 * Math.sin(TAU * t)).toFixed(4)})`;
  const lit = Math.floor(t * 6 + 1e-6) % 3;
  chevs.forEach((c, i) => c.classList.toggle('on', i === lit));
  freeTag.classList.toggle('alt', Math.floor(t * 2 + 1e-6) % 2 === 1);
  put('phone');
  put('fine');

  // starbursts
  for (const b of bursts) {
    let on = null, p = 0;
    for (const w of b.words) { const d = wrap(t - w.t0, DURATION); if (d < w.life) { on = w; p = d; } }
    let k = 0;
    if (on) {
      const out = on.life - p;
      k = p < 0.3 ? backOut(p / 0.3) : 1 + 0.05 * Math.sin(TAU * (p - 0.3) * 2);
      if (out < 0.14) k *= out / 0.14;
      if (b.shown !== on) {
        b.shown = on;
        const way = WAYS[on.way];
        b.back.setAttribute('fill', way.back); b.back.setAttribute('stroke', way.edge);
        b.front.setAttribute('fill', `url(#bf${b.slot}${on.way})`); b.front.setAttribute('stroke', way.edge);
        b.label.setAttribute('fill', way.text); b.label.setAttribute('font-size', on.size.toFixed(1)); b.label.setAttribute('stroke-width', (on.size * 0.13).toFixed(1));
        b.label.setAttribute('stroke', on.way === 'w' ? YELLOW : '#fff');
        b.label.textContent = on.word;
      }
      b.back.setAttribute('transform', `rotate(${(p * 30).toFixed(2)})`);
      b.front.setAttribute('transform', `rotate(${(11.25 - p * 18).toFixed(2)})`);
      b.label.setAttribute('transform', `rotate(${(-10 + Math.sin(TAU * p) * 4).toFixed(2)}) translate(0,6)`);
    }
    b.el.style.opacity = on ? 1 : 0;
    b.el.style.transform = `translate(${b.x}px,${b.y}px) rotate(${b.tilt}deg) scale(${(b.s * Math.max(k, 0.001)).toFixed(4)}) translate(-50%,-50%)`;
    // the pop throws sparks
    const sp = on && p < 0.55 ? p / 0.55 : -1;
    for (const s of b.sparks) {
      if (sp < 0) { s.el.style.opacity = 0; continue; }
      const e = 1 - (1 - sp) ** 3, r = b.s * (95 + 150 * s.reach * e);
      s.el.style.opacity = 1;
      s.el.style.transform = `translate(${(b.x + Math.cos(s.a) * r).toFixed(1)}px,${(b.y + Math.sin(s.a) * r).toFixed(1)}px) rotate(${(sp * 90).toFixed(1)}deg) scale(${((s.size / 60) * b.s * Math.sin(Math.PI * Math.min(1, sp * 1.15))).toFixed(3)}) translate(-50%,-50%)`;
    }
  }

  // falling symbols
  for (const s of syms) {
    const m = s.size * 0.8;
    const py = -m + frac(s.n * u + s.ph) * (F.h + 2 * m);
    const px = s.lane + Math.sin(TAU * s.swayK * u + s.swayPh) * s.sway;
    s.holder.position.set((px - F.w / 2) / PPU, (F.h / 2 - py) / PPU, 0);
    s.holder.rotation.set(s.rockX * Math.sin(TAU * s.kx * u + s.ax), s.rockY * Math.sin(TAU * s.ky * u + s.ay), s.spin0 + TAU * s.spin * u);
  }
  for (const [group, ctx] of [[backGroup, backCtx], [frontGroup, frontCtx]]) {
    backGroup.visible = group === backGroup;
    frontGroup.visible = group === frontGroup;
    renderer.render(scene, camera);
    ctx.clearRect(0, 0, F.w, F.h);
    ctx.drawImage(glc, 0, 0);
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: GLITCHES, setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
