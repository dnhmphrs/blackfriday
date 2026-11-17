// THE FLASH BANNER, 2001. A clean, confident Flash-era banner on a bright web blue: the message in
// glossy white with a sweeping shine, GME's cut globe spinning inside a chrome swoosh with a lens
// glint, a Flash preloader that stops at 70% and a tiny SKIP INTRO. On the extension's banner the
// preloader knows where it is: it is loading YOUR page, which sits beside it (or below it on a
// phone), and it will only ever get to 70%. The other 30% is this banner.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';
import { onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format (px). Text blocks: x is the left edge (or centre with align 'c'), y the top,
// w the width each block is fitted to. hero: the globe's centre and diameter.
// load: the preloader (left, top, width); arrow: which way the reader's page is.
const FORMATS = {
  '1x1': {
    w: 1080, h: 1080,
    logo: { x: 540, y: 34, w: 128 },
    big: { x: 540, y: 140, w: 980, rows: ['30% OFF'], align: 'c' },
    what: { x: 60, y: 410, w: 480, rows: ['Everything', 'on the', 'internet.'] },
    when: { x: 60, y: 694, w: 480 },
    hero: { x: 795, y: 585, d: 390 },
    load: { x: 60, y: 880, w: 960, lbl: 'Loading the internet', size: 30, barH: 40 },
    skip: { x: 1020, y: 1036, size: 20 },
  },
  'banner-v': {
    w: 1080, h: 2025,
    logo: { x: 540, y: 52, w: 210 },
    big: { x: 540, y: 250, w: 920, rows: ['30%', 'OFF'], align: 'c', lh: 0.86 },
    what: { x: 540, y: 1010, w: 900, rows: ['Everything on', 'the internet.'], align: 'c' },
    when: { x: 540, y: 1250, w: 820, align: 'c' },
    hero: { x: 540, y: 1572, d: 400 },
    load: { x: 70, y: 1772, w: 940, lbl: 'Loading your page', size: 44, barH: 100, arrow: 'left', rest: 'This ad' },
    skip: { x: 1010, y: 1972, size: 28 },
  },
  'banner-h': {
    w: 1170, h: 834,
    logo: { x: 60, y: 36, w: 120, align: 'l' },
    big: { x: 56, y: 112, w: 700, rows: ['30% OFF'] },
    what: { x: 60, y: 304, w: 640, rows: ['Everything on', 'the internet.'] },
    when: { x: 60, y: 494, w: 560 },
    hero: { x: 950, y: 330, d: 330 },
    load: { x: 60, y: 596, w: 1050, lbl: 'Loading your page', size: 42, barH: 84, arrow: 'down', rest: 'This ad', restArrow: 'up' },
    skip: { x: 1110, y: 808, size: 26 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '1x1';
const F = FORMATS[format];
F.elev = Number(q.get('elev') ?? 14);
F.yaw0 = Number(q.get('yaw') ?? 18);
const H = F.hero;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

const $ = (id) => document.getElementById(id);
const px = (n) => n.toFixed(2) + 'px';
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

// ---------- fonts ----------
await Promise.all(['400 100px "Archivo Black"', '800 100px "Inter"', '400 30px "Silkscreen"', '700 30px "Silkscreen"', '400 30px "Press Start 2P"']
  .map((f) => document.fonts.load(f)));

// Fit a block to a width: measure at 100px, scale.
function fit(el, w) {
  el.style.fontSize = '100px';
  el.style.width = 'max-content';
  const r = el.getBoundingClientRect();
  const size = (100 * w) / r.width;
  el.style.fontSize = size + 'px';
  return el.getBoundingClientRect();
}
function place(el, B, r) {
  el.style.left = px(B.align === 'c' ? B.x - r.width / 2 : B.x);
  el.style.top = px(B.y);
  if (B.align === 'c') el.style.textAlign = 'center';
}

// ---------- logo ----------
{
  const L = $('logo'), h = F.logo.w / 1.872;
  Object.assign(L.style, { left: px(F.logo.align === 'l' ? F.logo.x : F.logo.x - F.logo.w / 2), top: px(F.logo.y), width: px(F.logo.w), height: px(h) });
}

// ---------- the message ----------
const big = $('big');
big.innerHTML = F.big.rows.map((r) => `<span class="row"><span class="face">${r}</span><i class="shine">${r}</i></span>`).join('');
if (F.big.lh) big.style.lineHeight = F.big.lh;
const bigRect = fit(big, F.big.w);
place(big, F.big, bigRect);
const shines = [...big.querySelectorAll('.shine')];

const what = $('what');
what.innerHTML = F.what.rows.map((r) => `<span>${r}</span>`).join('');
place(what, F.what, fit(what, F.what.w));
const when = $('when');
place(when, F.when, fit(when, F.when.w));

// ---------- preloader ----------
const L = F.load;
const load = $('load');
Object.assign(load.style, { left: px(L.x), top: px(L.y), width: px(L.w) });
load.style.setProperty('--lblSize', L.size + 'px');
load.style.setProperty('--barH', L.barH + 'px');
load.style.setProperty('--bw', Math.max(3, Math.round(L.barH * 0.07)) + 'px');
load.style.setProperty('--pad', Math.max(4, Math.round(L.barH * 0.12)) + 'px');
load.style.setProperty('--gap', Math.round(L.size * 0.45) + 'px');
const arrowSvg = (dir) => {
  const s = L.size * 0.8;
  const pts = dir === 'left' ? '1,0 1,1 0,0.5' : dir === 'up' ? '0,1 1,1 0.5,0' : '0,0 1,0 0.5,1';
  return `<svg viewBox="0 0 1 1" width="${s}" height="${s}" style="display:inline-block;vertical-align:-0.05em;margin-right:0.45em"><polygon points="${pts}" fill="#7ff0ff"/></svg>`;
};
$('load-lbl').innerHTML = (L.arrow ? arrowSvg(L.arrow) : '') + `${L.lbl}<span id="dots"></span>`;
const dots = $('dots');
const fill = $('fill'), sheen = $('sheen');
const pad = Math.max(4, Math.round(L.barH * 0.12)), bw = Math.max(3, Math.round(L.barH * 0.07));
const trackW = L.w - 2 * bw - 2 * pad;
fill.style.width = px(trackW * 0.7);
// on the extension's banner the empty 30% of the bar is this banner
if (L.rest) {
  const r = document.createElement('div');
  r.className = 'rest';
  r.innerHTML = (L.restArrow ? arrowSvg(L.restArrow).replace('#7ff0ff', '#ffffff').replace(/width="[\d.]+" height="[\d.]+"/, 'width="0.62em" height="0.62em"').replace('margin-right:0.45em', 'margin-right:0.35em') : '') + L.rest;
  Object.assign(r.style, { left: px(pad + trackW * 0.7), width: px(trackW * 0.3), top: px(pad), bottom: px(pad), fontSize: px(L.barH * 0.46) });
  fill.after(r);
}

// ---------- skip intro ----------
{
  const S = $('skip');
  S.style.setProperty('--skipSize', F.skip.size + 'px');
  const r = S.getBoundingClientRect();
  S.style.left = px(F.skip.x - r.width); S.style.top = px(F.skip.y - r.height);
}

// ---------- background ----------
$('bg').style.background = [
  `radial-gradient(${H.d * 1.5}px ${H.d * 1.5}px at ${H.x}px ${H.y}px, #4f8bff 0%, #2f63ff 35%, rgba(20,70,255,0) 100%)`,
  '#1446ff',
].join(',');
{
  const g = $('grid'), step = Math.round(Math.min(F.w, F.h) / 18);
  g.style.background = `repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0 1.5px, rgba(255,255,255,0) 1.5px ${step}px), repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0 1.5px, rgba(255,255,255,0) 1.5px ${step}px)`;
  g.style.backgroundPosition = `${H.x}px ${H.y}px`;
  g.style.webkitMaskImage = g.style.maskImage = `radial-gradient(${H.d * 1.4}px ${H.d * 1.2}px at ${H.x}px ${H.y}px, #000 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)`;
  $('halo').style.background = `radial-gradient(${H.d * 0.78}px ${H.d * 0.78}px at ${H.x}px ${H.y}px, rgba(190,240,255,0.55) 0%, rgba(120,200,255,0.22) 45%, rgba(80,160,255,0) 100%)`;
}

// ---------- 3D: the globe ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
key.intensity = 2.2;
const pxPerUnit = H.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (F.elev * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - H.x, F.h / 2 - H.y, F.w, F.h);
const pivot = new THREE.Group();
scene.add(pivot);
const globe = castShadows(await buildObject('globe-core'));
globe.userData.slice.visible = false;
globe.traverse((o) => { if (o.isMesh && o.material && o.material.map) { o.material.envMapIntensity = 0.4; o.material.clearcoat = 0.35; o.material.clearcoatRoughness = 0.2; o.material.roughness = 0.3; o.material.needsUpdate = true; } });
pivot.add(globe);
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

// One full turn per loop, lingering while the cut faces the camera.
const TURN = 12;
const yawAt = (t) => { const u = t / TURN; return (F.yaw0 * Math.PI) / 180 + TAU * u - 0.88 * Math.sin(TAU * u); };

// ---------- the chrome swoosh ----------
// A tapered crescent on a tilted ellipse round the globe; the half behind the globe is drawn
// under the canvas, the half in front over it. It orbits once per loop.
const SW = { cx: H.x, cy: H.y + H.d * 0.06, rx: H.d * 0.74, ry: H.d * 0.2, rot: -13, arc: 230, w: H.d * 0.11 };
const NS = 'http://www.w3.org/2000/svg';
const swBack = $('swoosh-back'), swFront = $('swoosh-front');
for (const s of [swBack, swFront]) { s.setAttribute('width', F.w); s.setAttribute('height', F.h); s.setAttribute('viewBox', `0 0 ${F.w} ${F.h}`); }
const gradDef = (id) => `<defs>
  <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${SW.cx - SW.rx}" y1="${SW.cy - SW.ry}" x2="${SW.cx + SW.rx}" y2="${SW.cy + SW.ry}">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.28" stop-color="#9ff2ff"/><stop offset="0.5" stop-color="#2d7dff"/>
    <stop offset="0.62" stop-color="#e8fbff"/><stop offset="0.8" stop-color="#5fd6ff"/><stop offset="1" stop-color="#ffffff"/>
  </linearGradient></defs>`;
swBack.innerHTML = gradDef('swg-b') + `<g transform="rotate(${SW.rot} ${SW.cx} ${SW.cy})"><path id="sw-b" fill="url(#swg-b)" opacity="0.7"/></g>`;
swFront.innerHTML = gradDef('swg-f') + `<g transform="rotate(${SW.rot} ${SW.cx} ${SW.cy})"><path id="sw-f" fill="url(#swg-f)"/><path id="sw-hl" fill="#ffffff"/></g>`;
const swB = $('sw-b'), swF = $('sw-f'), swHL = $('sw-hl');
swFront.style.filter = 'drop-shadow(0 6px 10px rgba(0,20,120,0.35))';

// the crescent between angles a0 and a1 (deg), tapering to points at the ends of the full arc
function crescent(head, a0, a1, wScale = 1) {
  const tail = head - SW.arc;
  const lo = Math.max(a0, tail), hi = Math.min(a1, head);
  if (hi <= lo) return '';
  const N = 64, out = [], inn = [];
  for (let i = 0; i <= N; i++) {
    const a = lo + ((hi - lo) * i) / N, th = (a * Math.PI) / 180;
    const k = (a - tail) / SW.arc; // 0 at the tail, 1 at the head
    const w = SW.w * wScale * Math.pow(Math.sin(Math.PI * Math.pow(k, 0.7)), 0.9);
    const c = Math.cos(th), s = Math.sin(th);
    out.push(`${(SW.cx + SW.rx * c).toFixed(2)},${(SW.cy + SW.ry * s).toFixed(2)}`);
    inn.push(`${(SW.cx + (SW.rx - w * 0.5) * c).toFixed(2)},${(SW.cy + (SW.ry - w) * s).toFixed(2)}`);
  }
  return `M${out.join('L')}L${inn.reverse().join('L')}Z`;
}
// the angle range [a0,a1] that lies in front (sin > 0, i.e. 0..180 mod 360) or behind
function split(head) {
  const tail = head - SW.arc;
  const front = [], back = [];
  for (let base = Math.floor(tail / 360) * 360 - 360; base < head + 360; base += 360) {
    front.push([base, base + 180]); back.push([base + 180, base + 360]);
  }
  return { front, back };
}

// ---------- lens glint ----------
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintEl = $('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2" style="overflow:visible"><ellipse rx="2.4" ry="0.05" fill="rgba(200,245,255,0.85)"/><path d="${STAR}" fill="#fff"/><circle r="0.16" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINTS = [{ at: onSphere(1.03, 40, 200), t0: 1.6 }, { at: onSphere(1.03, 28, 150), t0: 7.4 }];

// ---------- lens flare: an anamorphic streak and a few ghosts, very 2001 ----------
const flare = $('flare');
flare.setAttribute('width', F.w); flare.setAttribute('height', F.h); flare.setAttribute('viewBox', `0 0 ${F.w} ${F.h}`);
flare.innerHTML = `<defs>
  <radialGradient id="fl-core"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.25" stop-color="#bff4ff" stop-opacity="0.55"/><stop offset="1" stop-color="#5fb8ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="fl-streak" x1="0" x2="1"><stop offset="0" stop-color="#7fe8ff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.9"/><stop offset="1" stop-color="#7fe8ff" stop-opacity="0"/></linearGradient>
  <radialGradient id="fl-ghost"><stop offset="0.6" stop-color="#9fe8ff" stop-opacity="0"/><stop offset="0.92" stop-color="#9fe8ff" stop-opacity="0.35"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="fl-dot"><stop offset="0" stop-color="#c8f6ff" stop-opacity="0.35"/><stop offset="1" stop-color="#c8f6ff" stop-opacity="0"/></radialGradient>
</defs>
<g id="fl-src"><rect id="fl-st" fill="url(#fl-streak)"/><circle id="fl-c" fill="url(#fl-core)"/></g>
<circle class="gh" fill="url(#fl-dot)"/>`;
const flSt = $('fl-st'), flC = $('fl-c'), ghosts = [...flare.querySelectorAll('.gh')];
const GHOSTS = [[0.3, 0.05]]; // position along the axis, radius (x d)

await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;

  pivot.rotation.y = yawAt(t);
  pivot.position.y = 0.03 * Math.sin(TAU * u * 2);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();
  renderer.render(scene, camera);

  // the swoosh orbits once per loop
  const head = 150 + 360 * u;
  const { front, back } = split(head);
  swF.setAttribute('d', front.map(([a, b]) => crescent(head, a, b)).join(''));
  swB.setAttribute('d', back.map(([a, b]) => crescent(head, a, b)).join(''));
  // a thin bright highlight riding on the swoosh's front edge
  swHL.setAttribute('d', front.map(([a, b]) => crescent(head, a, b, 0.22)).join(''));
  swHL.setAttribute('opacity', '0.9');

  // the headline shine: a sweep across the glossy type, twice a loop
  for (const [i, s] of shines.entries()) {
    const p = ((u * 2 + 0.62 - i * 0.03) % 1) / 0.32; // 0..1 during the sweep
    const x = -40 + p * 180;
    s.style.backgroundImage = `linear-gradient(105deg, rgba(120,220,255,0) ${x - 8}%, rgba(70,170,255,0.9) ${x - 3}%, #ffffff ${x}%, rgba(70,170,255,0.9) ${x + 3}%, rgba(120,220,255,0) ${x + 8}%)`;
    s.style.opacity = p <= 1 ? 1 : 0;
  }

  // the preloader: stuck at 70%, gleaming, dots ticking
  const sp = (u * 3) % 1;
  sheen.style.left = (-30 + sp * 160).toFixed(2) + '%';
  sheen.style.opacity = sp < 0.75 ? 1 : 0;
  dots.textContent = '.'.repeat(1 + (Math.floor(t * 2.5) % 3));

  // flare source: high on the globe's chrome, drifting with the spin
  {
    const sx = H.x - H.d * (0.28 - 0.05 * Math.sin(TAU * u)), sy = H.y - H.d * (0.33 + 0.02 * Math.cos(TAU * u));
    const k = 0.75 + 0.25 * Math.sin(TAU * u * 2);
    const sl = H.d * 0.5 * k, sh = H.d * 0.01;
    flSt.setAttribute('x', sx - sl / 2); flSt.setAttribute('y', sy - sh / 2); flSt.setAttribute('width', sl); flSt.setAttribute('height', sh);
    flC.setAttribute('cx', sx); flC.setAttribute('cy', sy); flC.setAttribute('r', H.d * 0.16 * k);
    // ghosts lie on the line from the source through the frame's centre
    const ax = F.w / 2 - sx, ay = F.h / 2 - sy;
    GHOSTS.forEach(([p, r], i) => { const g = ghosts[i]; g.setAttribute('cx', sx + ax * p); g.setAttribute('cy', sy + ay * p); g.setAttribute('r', H.d * r); g.setAttribute('opacity', (0.5 + 0.5 * k).toFixed(3)); });
  }

  let shown = false;
  for (const G of GLINTS) {
    const p = (t - G.t0) / 0.9;
    if (p < 0 || p > 1) continue;
    const k = Math.sin(p * Math.PI) ** 1.4, g = toScreen(G.at), size = H.d * 0.24;
    glintSvg.style.cssText = `overflow:visible;left:${px(g.x - size / 2)};top:${px(g.y - size / 2)};width:${px(size)};height:${px(size)};opacity:1;transform:scale(${k.toFixed(3)}) rotate(${(p * 20).toFixed(2)}deg);filter:drop-shadow(0 0 10px rgba(200,245,255,0.95))`;
    shown = true;
  }
  if (!shown) glintSvg.style.opacity = 0;
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
