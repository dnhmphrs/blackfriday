// The Black Friday post the in-house team made in a template tool this morning: black background,
// BLACK FRIDAY huge and white, 30% OFF in yellow with a red outline, a gradient sticker, a SALE!
// burst, a ticker band crossing at a tilt, stock sparkles, and the product (the internet, a chrome
// globe with 30% cut out) dropped in as a cut-out with a glow behind it.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format. Positions in px. cx = centre x. Big type is fitted to w.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    logo: { cx: 540, y: 258, w: 220 },
    bf: { cy: 388, w: 1010, lead: 0.9 },
    hero: { x: 540, y: 1000, d: 470 },
    burst: { x: 872, y: 930, w: 350, rot: 10, size: 62 },
    sticker: { x: 182, y: 945, w: 310, rot: -14 },
    ticker: { y: 1146, h: 100, size: 52, rot: -4.5 },
    off: { cy: 1272, w: 940 },
    scope: { y: 1494, size: 48 },
    foot: { y: 1640, fs: 40, ps: 34, gap: 22, when: 'One day only <em>&bull;</em> Fri 27 Nov', pill: 'Link in bio', fine: '' },
    sparks: 24,
  },
  '1x1': {
    w: 1080, h: 1080,
    logo: { cx: 540, y: 22, w: 150 },
    bf: { cy: 104, w: 760, lead: 0.9 },
    hero: { x: 540, y: 572, d: 320 },
    burst: { x: 884, y: 548, w: 290, rot: 10, size: 48 },
    sticker: { x: 190, y: 520, w: 260, rot: -14 },
    ticker: { y: 694, h: 66, size: 34, rot: -3 },
    off: { cy: 790, w: 740 },
    scope: { y: 995, size: 34 },
    foot: null,
    sparks: 18,
  },
  'banner-v': {
    w: 1080, h: 2025,
    logo: { cx: 540, y: 48, w: 380 },
    bf: { cy: 285, w: 1020, lead: 0.9 },
    hero: { x: 540, y: 985, d: 560 },
    burst: { x: 862, y: 1140, w: 390, rot: 10, size: 74 },
    sticker: { x: 190, y: 875, w: 350, rot: -14 },
    ticker: { y: 1330, h: 120, size: 64, rot: -4 },
    off: { cy: 1446, w: 960 },
    scope: { y: 1745, size: 68 },
    foot: { y: 1890, fs: 74, ps: 0, gap: 0, when: 'One day only <em>&bull;</em> Fri 27 Nov', pill: '', fine: '' },
    sparks: 22,
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);
const px = (n) => n.toFixed(2) + 'px';
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- fonts ----------
await Promise.all(['400 100px "Archivo Black"', '400 100px "Anton"', 'italic 900 50px "Libre Franklin"', '900 50px "Libre Franklin"', '600 30px "Libre Franklin"', '700 40px "Oswald"']
  .map((f) => document.fonts.load(f)));

// measure an element's natural width at 100px
function natural(el) { el.style.fontSize = '100px'; return el.getBoundingClientRect().width; }

// ---------- background ----------
$('bg').style.background = [
  `radial-gradient(${F.hero.d * 1.3}px ${F.hero.d * 1.15}px at ${F.hero.x}px ${F.hero.y}px, rgba(255,90,0,0.55), rgba(200,0,30,0.25) 45%, rgba(0,0,0,0) 100%)`,
  `radial-gradient(${F.w * 0.8}px ${F.w * 0.5}px at 50% 0%, rgba(40,60,160,0.35), rgba(0,0,0,0) 100%)`,
  '#000',
].join(',');
// rays behind the product, the template's "light burst" element
{
  // the template's sunburst fills the whole frame, brightest behind the product
  const r = Math.hypot(Math.max(F.hero.x, F.w - F.hero.x), Math.max(F.hero.y, F.h - F.hero.y));
  const el = $('rays');
  Object.assign(el.style, { left: px(F.hero.x - r), top: px(F.hero.y - r), width: px(r * 2), height: px(r * 2), borderRadius: '50%',
    background: 'repeating-conic-gradient(from 0deg, rgba(255,210,60,0.55) 0deg 7deg, rgba(255,210,60,0) 7deg 15deg)',
    WebkitMask: `radial-gradient(closest-side, #000 ${(F.hero.d * 0.3 / r * 100).toFixed(1)}%, rgba(0,0,0,0.55) ${(F.hero.d * 0.7 / r * 100).toFixed(1)}%, rgba(0,0,0,0.22) ${(F.hero.d * 1.3 / r * 100).toFixed(1)}%, rgba(0,0,0,0.12) 100%)`,
    mask: `radial-gradient(closest-side, #000 ${(F.hero.d * 0.3 / r * 100).toFixed(1)}%, rgba(0,0,0,0.55) ${(F.hero.d * 0.7 / r * 100).toFixed(1)}%, rgba(0,0,0,0.22) ${(F.hero.d * 1.3 / r * 100).toFixed(1)}%, rgba(0,0,0,0.12) 100%)` });
  const h = $('halo');
  Object.assign(h.style, { left: px(F.hero.x - F.hero.d * 0.75), top: px(F.hero.y - F.hero.d * 0.75), width: px(F.hero.d * 1.5), height: px(F.hero.d * 1.5), borderRadius: '50%',
    background: 'radial-gradient(closest-side, rgba(255,250,200,0.95), rgba(255,200,40,0.7) 35%, rgba(255,80,0,0.3) 65%, rgba(255,0,0,0) 100%)' });
}

// ---------- logo ----------
{
  const L = F.logo, el = $('logo'), h = L.w * 610 / 1142;
  Object.assign(el.style, { left: px(L.cx - L.w / 2), top: px(L.y), width: px(L.w), height: px(h) });
}

// ---------- BLACK FRIDAY: each line fitted to the same width ----------
{
  const bf = $('bf');
  bf.style.left = '0px'; bf.style.width = F.w + 'px'; bf.style.top = F.bf.cy + 'px';
  for (const id of ['bf1', 'bf2']) {
    const el = $(id); const n = natural(el);
    el.style.fontSize = px(100 * F.bf.w / n);
  }
}

// ---------- 30% OFF ----------
{
  const O = F.off, el = $('off');
  const html = O.lines ? '30%<br>OFF' : '30% OFF';
  for (const id of ['o0', 'o1', 'o2']) $(id).innerHTML = html;
  if (O.lines) for (const id of ['o0', 'o1', 'o2']) { $(id).style.textAlign = 'center'; $(id).style.lineHeight = '0.92'; }
  el.style.fontSize = '100px';
  const n = $('o2').getBoundingClientRect().width;
  const size = 100 * O.w / n;
  el.style.fontSize = px(size);
  const w = $('o2').getBoundingClientRect().width;
  el.style.left = px(F.w / 2 - w / 2); el.style.top = px(O.cy); el.style.width = px(w);
  el.style.setProperty('--sw0', px(size * 0.14));
  el.style.setProperty('--sw1', px(size * 0.075));
  el.style.setProperty('--glow', px(size * 0.12));
  el.style.setProperty('--ex', px(size * 0.035));
}

// ---------- THE ENTIRE INTERNET ----------
if (F.scope) {
  $('scope-txt').textContent = 'The entire internet!';
  Object.assign($('scope').style, { left: '0px', width: F.w + 'px', top: px(F.scope.y) });
  $('scope').style.setProperty('--scope', px(F.scope.size));
} else $('scope').style.display = 'none';

// ---------- foot ----------
if (F.foot) {
  const P = F.foot, el = $('foot');
  el.innerHTML = `<div class="when">${P.when}</div>` + (P.pill ? `<div class="pill">${P.pill} &uarr;</div>` : '') + (P.fine ? `<div class="fine">${P.fine}</div>` : '');
  Object.assign(el.style, { left: '0px', width: F.w + 'px', top: px(P.y) });
  el.style.setProperty('--fs', px(P.fs)); el.style.setProperty('--ps', px(P.ps)); el.style.setProperty('--fgap', px(P.gap));
} else $('foot').style.display = 'none';

// ---------- ticker ----------
const LINES = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
const ticker = (() => {
  const T = F.ticker, el = $('ticker'), run = $('run');
  const extra = 260;
  Object.assign(el.style, { left: px(-extra / 2), width: px(F.w + extra), top: px(T.y), height: px(T.h), transform: `rotate(${T.rot}deg)` });
  el.style.setProperty('--tk', px(T.size));
  const unitHTML = LINES.map((l) => `<span>${l}</span><i>★</i>`).join('');
  run.innerHTML = `<span class="u">${unitHTML}</span>`;
  const unit = run.firstChild.getBoundingClientRect().width;
  run.innerHTML = Array.from({ length: Math.ceil((F.w + extra) * 2 / unit) + 1 }, () => `<span class="u">${unitHTML}</span>`).join('');
  // a whole number of units per loop: seamless
  const speed = format === 'banner-v' ? 150 : 120; // px/s
  const per = Math.max(1, Math.round(speed * DURATION / unit));
  return { run, unit, per };
})();

// ---------- burst ----------
const BURST_N = 22;
const burstR = (() => { const r = mulberry(11); return Array.from({ length: BURST_N }, () => 0.86 + r() * 0.14); })();
const burstPts = (k, inner, rot) => Array.from({ length: BURST_N * 2 }, (_, i) => {
  const a = ((i * 180 / BURST_N + rot) * Math.PI) / 180;
  const rr = i % 2 ? inner : burstR[i >> 1];
  return `${(Math.sin(a) * rr * k).toFixed(4)},${(-Math.cos(a) * rr * k).toFixed(4)}`;
}).join(' ');
{
  const B = F.burst, el = $('burst');
  Object.assign(el.style, { left: px(B.x - B.w / 2), top: px(B.y - B.w / 2), width: px(B.w), height: px(B.w) });
  el.style.setProperty('--bt', px(B.size));
  $('burst-txt').innerHTML = '<span>SALE!</span>';
  const tw = $('burst-txt').firstChild.getBoundingClientRect().width;
  el.style.setProperty('--bt', px(B.size * (B.w * 0.6) / tw));
  $('b0').setAttribute('points', burstPts(1.06, 0.82, 0));
  $('b1').setAttribute('points', burstPts(1.0, 0.78, 0));
  $('b2').setAttribute('points', burstPts(0.88, 0.69, 0));
}

// ---------- sticker (peeling at the lower right) ----------
const sticker = (() => {
  const S = F.sticker, el = $('sticker');
  Object.assign(el.style, { left: px(S.x - S.w / 2), top: px(S.y - S.w / 2), width: px(S.w), height: px(S.w) });
  el.style.setProperty('--sz', px(S.w));
  return el;
})();
function peel(d) {
  // the sticker has lifted beyond the line p.n = d; the lifted part folds back over itself
  const th = (38 * Math.PI) / 180, n = [Math.cos(th), Math.sin(th)];
  const a = Math.acos(d), steps = 28;
  const seg = Array.from({ length: steps + 1 }, (_, i) => { const t = th - a + (2 * a * i) / steps; return [Math.cos(t), Math.sin(t)]; });
  const refl = seg.map(([x, y]) => { const k = x * n[0] + y * n[1] - d; return [x - 2 * k * n[0], y - 2 * k * n[1]]; });
  // the stuck-down part: the rest of the circle
  const rest = Array.from({ length: 72 + 1 }, (_, i) => { const t = th + a + ((TAU - 2 * a) * i) / 72; return [Math.cos(t), Math.sin(t)]; });
  const P = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join('L') + 'Z';
  $('sclip-path').setAttribute('d', P(rest));
  $('flap').setAttribute('d', P(refl));
  const g = $('lift');
  g.setAttribute('x1', (n[0] * (d - 0.45)).toFixed(3)); g.setAttribute('y1', (n[1] * (d - 0.45)).toFixed(3));
  g.setAttribute('x2', (n[0] * d).toFixed(3)); g.setAttribute('y2', (n[1] * d).toFixed(3));
}

// ---------- sparkles (stock, four-point, gold and white) ----------
const STAR = 'M0,-1 C0.07,-0.24 0.24,-0.07 1,0 C0.24,0.07 0.07,0.24 0,1 C-0.07,0.24 -0.24,0.07 -1,0 C-0.24,-0.07 -0.07,-0.24 0,-1Z';
const sparks = (() => {
  const r = mulberry(7), out = [];
  const periods = [2, 3, 4, 6];
  // keep them in the dark around the type and product
  const zones = [
    [0.04, 0.96, F.bf.cy / F.h - 0.02, F.bf.cy / F.h + 0.12],
    [0.02, 0.98, (F.hero.y - F.hero.d * 0.7) / F.h, (F.hero.y + F.hero.d * 0.5) / F.h],
  ];
  for (let i = 0; i < F.sparks; i++) {
    const z = zones[i % zones.length];
    let x = (z[0] + r() * (z[1] - z[0])) * F.w;
    const y = (z[2] + r() * (z[3] - z[2])) * F.h;
    if (i % zones.length === 1 && Math.abs(x - F.hero.x) < F.hero.d * 0.42) x = F.hero.x + Math.sign(x - F.hero.x || 1) * (F.hero.d * 0.42 + r() * F.hero.d * 0.25);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-1 -1 2 2');
    const gold = r() < 0.55;
    svg.innerHTML = `<path d="${STAR}" fill="${gold ? '#ffe27a' : '#ffffff'}"/>`;
    (i % 3 === 0 ? $('sparks-front') : $('sparks-back')).append(svg);
    out.push({ svg, x, y, size: (F.w / 1080) * (40 + r() * r() * 100), period: periods[Math.floor(r() * periods.length)], phase: r(), glow: gold ? 'rgba(255,200,60,0.95)' : 'rgba(255,255,255,0.95)' });
  }
  return out;
})();

// ---------- 3D: the product ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
canvas.style.filter = `drop-shadow(0 0 ${px(F.hero.d * 0.03)} rgba(255,255,255,0.55)) drop-shadow(0 0 ${px(F.hero.d * 0.08)} rgba(255,170,40,0.55))`;
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = saleStudio(renderer);
key.intensity = 2.4; key.position.set(-5, 7, 6);
const pxPerUnit = F.hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (Number(q.get('elev') || 30) * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);
const pivot = new THREE.Group();
scene.add(pivot);
const globe = await buildObject('globe-core');
globe.userData.slice.visible = false;
pivot.add(globe);
const YAW0 = Number(q.get('yaw') ?? 18);

// a bright product studio with sale-coloured kickers, so the chrome reads on black
function saleStudio(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.0, 0.0, 0.0), band = vec3(0.05, 0.02, 0.02), warm = vec3(0.9, 0.35, 0.05), flo = vec3(0.01, 0.005, 0.0);
      vec3 c = mix(band, zen, smoothstep(0.0, 0.8, up));
      c = mix(c, warm, smoothstep(0.2, 1.0, -d.z) * (1.0 - smoothstep(0.0, 0.5, abs(up - 0.05))));
      c = mix(c, flo, smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(8, 8, [-7, 9, 7], 16);
  card(1.2, 16, [11, 2, 2], 18);
  card(12, 0.8, [0, 11, -2], 12);
  card(1.6, 12, [-11, 1, -3], 10, [1, 0.1, 0.06]);
  card(3, 3, [7, 6, -8], 10, [1, 0.75, 0.12]);
  card(14, 2.4, [0, -3, 12], 2.2, [1, 0.95, 0.85]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// the logo must be decoded before ready
{ const i = new Image(); i.src = '/assets/gme/gme-primary.png'; await i.decode(); }

const offEl = $('off');
function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;

  pivot.rotation.y = ((YAW0 + 10 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = 0.03 * Math.sin(TAU * u * 3);
  scene.environmentRotation.y = 0.25 * Math.sin(TAU * u + 0.8);

  ticker.run.style.transform = `translateX(${(-((u * ticker.per * ticker.unit) % ticker.unit)).toFixed(2)}px)`;

  // rays turn one ray-step per 4 s
  $('rays').style.transform = `rotate(${(15 * (t / 4)).toFixed(3)}deg)`;
  $('halo').style.opacity = (0.8 + 0.12 * Math.sin(TAU * u * 4)).toFixed(3);

  // the burst throbs and wobbles; the inner star turns against the outer
  const B = F.burst;
  $('burst').style.transform = `rotate(${(B.rot + 3 * Math.sin(TAU * u * 3)).toFixed(3)}deg) scale(${(1 + 0.05 * Math.max(0, Math.sin(TAU * u * 6))).toFixed(4)})`;

  // the sticker breathes at its peel
  peel(0.79 + 0.03 * Math.sin(TAU * u * 2));
  sticker.style.transform = `rotate(${(F.sticker.rot + 1.2 * Math.sin(TAU * u * 2 + 1)).toFixed(3)}deg)`;

  // 30% OFF pulses like a template's "pulse" animation
  offEl.style.transform = `scale(${(1 + 0.025 * Math.max(0, Math.sin(TAU * u * 4))).toFixed(4)})`;

  for (const s of sparks) {
    const k = Math.max(0, Math.sin(TAU * (t / s.period + s.phase))) ** 2;
    s.svg.style.cssText = `left:${px(s.x - s.size / 2)};top:${px(s.y - s.size / 2)};width:${px(s.size)};height:${px(s.size)};opacity:${k.toFixed(3)};transform:scale(${(0.2 + 0.8 * k).toFixed(3)}) rotate(${(90 * t / s.period).toFixed(2)}deg);filter:drop-shadow(0 0 ${px(s.size * 0.25)} ${s.glow})`;
  }

  pivot.updateMatrixWorld(true);
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
