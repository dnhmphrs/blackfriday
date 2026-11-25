// The Specimen Sale. A4 x B6: the Black Friday email's loud frame (BLACK FRIDAY, 30% OFF, a
// countdown that counts, a button) around A4's museum cutaway of the world, whose specimen
// labels do the selling: the leader lines point at the missing 30%, the crust, the core.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials, castShadows } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format. Blocks: x (left), y (top), w (width). hero: globe centre and diameter.
// Labels: `at` is a point in the globe's own frame [radius, lat, lon] (lon 0 and 108 are the cut
// faces; 0..108 is the missing 30%). The label box is pinned by one edge: edge 'left' puts its
// left side at x, edge 'right' its right side; the leader line meets the facing side.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, gut: 64, docTop: 262, docSize: 26,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 30%, #12327f 50%, #1d4597 64%, #2a5bb0 76%, #5d7cb4 86%, #9fabc0 95%, #b5b7ba 100%)',
    kicker: { x: 64, y: 336, w: 952, size: 19 },
    bf: { x: 64, y: 374, w: 952 },
    hero: { x: 540, y: 790, d: 540 },
    band: { y: 1040, h: 80, scroll: 38 },
    offer: { x: 64, y: 1136, w: 952, size: 296, sub: 50, subGap: 0 },
    row: { x: 64, y: 1464, w: 952, cell: 60, ctaH: 92, cta: 44, gap: 32 },
    foot: { x: 64, y: 1660, w: 952, markW: 220, fine: 27, ink: 'rgba(12, 20, 48, 0.9)' },
    labSize: 17, leadW: 1.4,
    labels: [
      { id: 'lab-cut', at: [1, 30, 36], edge: 'left', x: 64, y: 566 },
      { id: 'lab-crust', at: [0.83, -28, 0], edge: 'left', x: 64, y: 900 },
      { id: 'lab-core', at: [0.14, -14, 108], edge: 'right', x: 1016, y: 940 },
      { id: 'fig', edge: 'right', x: 1016, y: 566 },
    ],
  },
  '1x1': {
    w: 1080, h: 1080, gut: 48, docTop: 30, docSize: 20,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 32%, #13368a 58%, #2350a6 78%, #4a6fb0 90%, #8d9bb6 100%)',
    kicker: null,
    bf: { x: 48, y: 112, w: 984 },
    hero: { x: 540, y: 470, d: 400 },
    band: { y: 650, h: 66, scroll: 31 },
    offer: { x: 48, y: 744, w: 600, size: 200, sub: 40, subGap: 4 },
    row: { x: 676, y: 764, w: 356, cell: 44, ctaH: 74, cta: 34, gap: 18, column: true },
    foot: { x: 48, y: 1032, w: 984, fine: 26, ink: 'rgba(12, 20, 48, 0.88)', noMark: true, left: true },
    labSize: 13, leadW: 1.2,
    labels: [
      { id: 'lab-cut', at: [1, 30, 36], edge: 'left', x: 48, y: 300 },
      { id: 'lab-crust', at: [0.83, -28, 0], edge: 'left', x: 48, y: 520 },
      { id: 'lab-core', at: [0.14, -14, 108], edge: 'right', x: 1032, y: 520 },
      { id: 'fig', edge: 'right', x: 1032, y: 300 },
    ],
  },
  'banner-v': {
    w: 1080, h: 2025, gut: 64, docTop: 56, docSize: 30,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 10%, #0b1a48 28%, #12327f 48%, #1d4597 62%, #2650a6 74%, #4a6db0 86%, #8597b8 95%, #a7b0bf 100%)',
    kicker: null,
    bf: { x: 140, y: 166, w: 800, lines: true },
    hero: { x: 540, y: 950, d: 540 },
    band: { y: 1214, h: 100, scroll: 48 },
    offer: { x: 56, y: 1350, w: 968, size: 330, sub: 72, subGap: 0, align: 'center' },
    row: { x: 56, y: 1748, w: 968, ctaH: 130, cta: 72, gap: 0, noTimer: true },
    foot: { x: 56, y: 1918, w: 968, fine: 40, ink: 'rgba(12, 20, 48, 0.9)', noMark: true },
    labSize: 28, leadW: 2.4,
    labels: [
      { id: 'lab-cut', at: [1, 30, 36], edge: 'left', x: 56, y: 728 },
      { id: 'lab-core', at: [0.14, -14, 108], edge: 'right', x: 1024, y: 1080 },
    ],
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.elev = Number(q.get('elev') || 32);
F.yaw0 = Number(q.get('yaw') || -18);

const COPY = {
  c3: 'The Internet<br>(Abridged)',
  kicker: 'Friday 27 November 2026',
  bf: F.bf.lines ? '<span class="line">Black</span><span class="line">Friday</span>' : 'Black Friday',
  big: '30<span class="pc">%</span> off',
  sub: 'the entire internet.',
  cut: '30% removed<em>at no extra cost</em>',
  crust: 'Crust<em>Every website</em>',
  core: 'Inner core<em>Mustard</em>',
  fig: format === '1x1' ? 'Fig. 1<em>Shown smaller<br>than actual size.</em>' : 'Fig. 1<em>Shown smaller<br>than actual size.</em>',
  cta: 'Shop the internet<svg class="arr" viewBox="0 0 24 24"><path d="M2 12h17M12 4.5l7.5 7.5-7.5 7.5" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="square"/></svg>',
  fine: format === '1x1' ? '<small style="margin:0">No code needed &middot; Friday 27 November 2026 &middot; <u>Unsubscribe from the internet</u></small>'
    : format === 'banner-v' ? 'You are looking at the discounted portion of this website.'
    : 'The remaining 70% is in good order.<small>No code needed &middot; <u>Unsubscribe from the internet</u></small>',
  scroll: ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'],
};

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const css = (k, v) => stage.style.setProperty(k, v);
css('--sky', F.sky); css('--gut', F.gut + 'px'); css('--docTop', F.docTop + 'px'); css('--docSize', F.docSize + 'px');
css('--labSize', F.labSize + 'px'); css('--leadW', F.leadW + 'px');

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);
const place = (el, b) => { if (!b) { el.style.display = 'none'; return; } el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; if (b.w) el.style.width = b.w + 'px'; };

// ---------- fonts and marks ----------
await Promise.all([
  '400 100px "Anton"', '500 100px "EB Garamond"', 'italic 400 60px "EB Garamond"', 'italic 700 60px "EB Garamond"',
  '500 30px "Libre Franklin"', '600 30px "Libre Franklin"',
].map((f) => document.fonts.load(f)));
await Promise.all(['gme-primary', 'wire-globe'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// ---------- copy and layout ----------
$('doc-c3').innerHTML = COPY.c3;
$('kicker').innerHTML = F.kicker ? COPY.kicker : '';
place($('kicker'), F.kicker); if (F.kicker) css('--kick', F.kicker.size + 'px');
$('bf').innerHTML = COPY.bf;
place($('bf'), F.bf);
$('big').innerHTML = COPY.big;
$('sub').innerHTML = COPY.sub;
place($('offer'), F.offer);
css('--sub', F.offer.sub + 'px'); css('--subGap', F.offer.subGap + 'px'); css('--align', F.offer.align || 'left');
$('big').style.fontSize = F.offer.size + 'px';
// optical alignment: Garamond's 3 carries a wide left bearing, so pull it back onto the gutter
if (F.offer.align !== 'center') $('big').style.marginLeft = '-0.045em';
$('lab-cut').innerHTML = COPY.cut;
$('lab-crust').innerHTML = COPY.crust;
$('lab-core').innerHTML = COPY.core;
$('lab-core').classList.add('mustard');
$('fig').innerHTML = COPY.fig;
$('cta-label').innerHTML = COPY.cta;
place($('row'), F.row);
css('--cell', (F.row.cell || 50) + 'px'); css('--ctaH', F.row.ctaH + 'px'); css('--cta', F.row.cta + 'px'); css('--rowGap', F.row.gap + 'px');
if (F.row.noTimer) $('timer').style.display = 'none';
if (F.row.column) { $('row').style.flexDirection = 'column'; $('row').style.alignItems = 'stretch'; $('cta').style.flex = 'none'; }
if (F.foot) {
  place($('foot'), F.foot);
  css('--markW', F.foot.markW + 'px'); css('--fine', F.foot.fine + 'px'); css('--footInk', F.foot.ink);
  $('fine').innerHTML = COPY.fine;
  if (F.foot.noMark) { $('foot').querySelector('.mark').style.display = 'none'; $('fine').style.textAlign = F.foot.left ? 'left' : 'center'; $('fine').style.flex = '1'; }
} else $('foot').style.display = 'none';

// Fit a block of big type to a width: measure at 100px, scale.
function fit(el, w) {
  el.style.fontSize = '100px';
  el.style.width = 'max-content';
  const natural = el.getBoundingClientRect().width;
  el.style.width = w + 'px';
  return (100 * w) / natural;
}
$('bf').style.fontSize = fit($('bf'), F.bf.w) + 'px';

// ---------- the scroll ----------
// Five lines, each followed by the device; the set repeats, and the track moves exactly one
// set's width per loop, so frame 360 is frame 0.
const band = $('band'), track = $('track');
band.style.top = F.band.y + 'px';
css('--bandH', F.band.h + 'px'); css('--scroll', F.band.scroll + 'px');
const pinStep = Math.max(5, Math.round(F.band.h * 0.07)), pinW = Math.max(1.5, F.band.h * 0.022);
css('--pinStep', pinStep + 'px'); css('--pinW', pinW.toFixed(1) + 'px'); css('--pinH', (pinStep * 2 + pinW).toFixed(1) + 'px'); css('--pinPad', Math.round(F.band.h * 0.07) + 'px');
const STAR4 = 'M0,-1 C0.08,-0.25 0.25,-0.08 1,0 C0.25,0.08 0.08,0.25 0,1 C-0.08,0.25 -0.25,0.08 -1,0 C-0.25,-0.08 -0.08,-0.25 0,-1Z';
const sep = (i) => i === COPY.scroll.length - 1
  ? '<svg class="sep globe" viewBox="-1.1 -1.1 1.3 2.2"><g fill="none" stroke="#11131c" stroke-width="0.12"><path d="M0,-1A1,1 0 0 0 0,1Z"/><path d="M0,-1A0.48,1 0 0 0 0,1"/><path d="M-1,0H0M-0.87,-0.5H0M-0.87,0.5H0"/></g></svg>'
  : `<svg class="sep" viewBox="-1 -1 2 2"><path d="${STAR4}" fill="#11131c"/></svg>`;
const setHTML = COPY.scroll.map((s, i) => `<span class="item">${s}</span>${sep(i)}`).join('');
track.innerHTML = `<div class="set" style="display:flex;align-items:center">${setHTML}</div>`;
const setW = track.firstChild.getBoundingClientRect().width;
// one set per loop, or two if the set is short, so it never crawls
const scrollDist = setW * Math.max(1, Math.round((F.w * 1.6) / setW));
// at the top of the loop the first line starts on the gutter, so the read begins at the beginning
const scroll0 = F.gut - setW;
const copies = Math.ceil((F.w + setW + scrollDist) / setW) + 1;
track.innerHTML = Array.from({ length: copies }, () => `<div class="set" style="display:flex;align-items:center;flex:none">${setHTML}</div>`).join('');

// ---------- 3D: A4's specimen ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = nightStudio(renderer);
key.intensity = 2.4;
key.position.set(-5, 7, 5);
const pxPerUnit = F.hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (F.elev * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);

const pivot = new THREE.Group();
scene.add(pivot);
const core = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.02, 0.06, 0.24), metalness: 0.55, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 });
const globe = makeGlobe({ R: 1, tubeRadius: 0.022, step: 36, wedge: 108, core, cut: strataMaterial(), sliceOut: 0, material: materials.chrome() });
pivot.add(castShadows(globe));

// The world in section: lacquer shell, paper crust, blue mantle, navy outer core, mustard centre.
function strataMaterial() {
  const rnd = mulberry(7);
  const map = canvasTexture(2048, (g, n) => {
    const c = n / 2;
    const ring = (r, fill) => { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = fill; g.fill(); };
    g.fillStyle = '#0a1a4a'; g.fillRect(0, 0, n, n);
    const layers = [[1.0, '#0b1b4e'], [0.955, '#e6e2d6'], [0.915, '#5a7fc4'], [0.76, '#2e57a8'], [0.54, '#122a6a'], [0.3, '#d9a632']];
    for (const [r, fill] of layers) ring(r, fill);
    for (const [r] of layers) {
      const gr = g.createRadialGradient(c, c, r * c * 0.55, c, c, r * c);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.16)');
      g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = gr; g.fill();
    }
    g.strokeStyle = 'rgba(6,10,30,0.75)'; g.lineWidth = 3;
    for (const [r] of layers.slice(1)) { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.stroke(); }
    const img = g.getImageData(0, 0, n, n), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const k = (rnd() - 0.5) * 26; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
    g.putImageData(img, 0, 0);
    const crease = g.createLinearGradient(c - 60, 0, c + 60, 0);
    crease.addColorStop(0, 'rgba(0,0,0,0)'); crease.addColorStop(0.5, 'rgba(0,0,0,0.35)'); crease.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = crease; g.fillRect(c - 60, 0, 120, n);
  });
  return new THREE.MeshStandardMaterial({ map, metalness: 0, roughness: 0.78, envMapIntensity: 0.35, side: THREE.DoubleSide });
}

// A4's dark studio, with B6's warm kicker: chrome as black glass with clean white lines.
function nightStudio(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.002, 0.004, 0.016), band = vec3(0.012, 0.04, 0.17), haze = vec3(0.22, 0.27, 0.36), flo = vec3(0.004, 0.006, 0.02);
      vec3 c = mix(band, zen, smoothstep(0.0, 0.8, up));
      c = mix(c, haze, smoothstep(0.12, -0.02, up) * smoothstep(-0.25, -0.02, up));
      c = mix(c, flo, smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(7, 7, [-7, 10, 6], 18);
  card(1.1, 16, [11, 2, 1], 20, [0.92, 0.96, 1]);
  card(12, 0.7, [0, 11, -2], 14);
  card(4, 9, [3, 3, 11], 0.0);
  card(1.1, 12, [-11, 1, -3], 6, [0.7, 0.82, 1]);
  card(14, 2.2, [0, -3, 12], 1.6, [0.75, 0.82, 1]);
  card(1.8, 1.8, [6, 8, -9], 11, [1, 0.8, 0.45]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D atmosphere ----------
{
  const H = F.hero;
  $('halo').style.background =
    `radial-gradient(${H.d * 0.95}px ${H.d * 0.8}px at ${H.x - H.d * 0.12}px ${H.y - H.d * 0.1}px, rgba(120,150,210,0.30), rgba(60,90,170,0.12) 55%, rgba(0,0,0,0) 100%)`;
}
{
  const rnd = mulberry(2026);
  const n = 384, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  const dust = $('dust'); dust.width = F.w; dust.height = F.h;
  const d = dust.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, s = 0.6 + rnd() * rnd() * 2.6;
    d.fillStyle = rnd() < 0.6 ? 'rgba(6,8,20,0.55)' : 'rgba(235,235,225,0.4)';
    d.beginPath(); d.ellipse(x, y, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
  d.strokeStyle = 'rgba(6,8,20,0.28)'; d.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, a = rnd() * TAU, L = 14 + rnd() * 30;
    d.beginPath(); d.moveTo(x, y); d.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 6, y + Math.sin(a) * L * 0.5 - 5, x + Math.cos(a) * L, y + Math.sin(a) * L); d.stroke();
  }
}
const grain = $('grain');

// ---------- specimen labels ----------
const leaders = $('leaders');
leaders.setAttribute('width', F.w); leaders.setAttribute('height', F.h);
const svgNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); leaders.append(e); return e; };
const big = F.labSize > 20;
const LABELS = F.labels.map((L) => {
  const el = $(L.id);
  el.classList.toggle('right', L.edge === 'right');
  const o = { ...L, el };
  if (L.at) { o.line = mk('line', {}); o.dot = mk('circle', { r: big ? 6 : 4 }); o.ring = mk('circle', { class: 'ring', r: big ? 15 : 10 }); o.v = onSphere(...L.at); }
  return o;
});
for (const id of ['lab-cut', 'lab-crust', 'lab-core', 'fig']) if (!F.labels.some((L) => L.id === id)) $(id).style.display = 'none';
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

// The missing 30%, drawn the way a technical drawing shows a removed part: the wires that are
// no longer there, as a dashed ghost. They are the front of the ball, so nothing hides them.
const GHOST = [];
for (const lon of [36, 72]) GHOST.push(Array.from({ length: 61 }, (_, i) => onSphere(1, -90 + 3 * i, lon)));
for (const lat of [-60, -30, 0, 30, 60]) GHOST.push(Array.from({ length: 37 }, (_, i) => onSphere(1, lat, 3 * i)));
const ghost = mk('path', { class: 'ghost' });
leaders.prepend(ghost);
const ghostD = () => GHOST.map((pts) => pts.map((v, i) => { const p = toScreen(v); return `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join('')).join('');

// one four-point star glint on the chrome, once per loop
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintEl = $('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINT = { at: onSphere(1.0, 30, 144), t0: 4.4, life: 0.9, size: F.hero.d * 0.16 };

const pad = (n) => String(n).padStart(2, '0');
const hh = $('hh'), mm = $('mm'), ss = $('ss'), sheen = $('sheen');

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  pivot.rotation.y = ((F.yaw0 + 9 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = Math.sin(TAU * u * 2) * 0.012;
  scene.environmentRotation.y = 0.35 * Math.sin(TAU * u + 0.8);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  ghost.setAttribute('d', ghostD());
  for (const L of LABELS) {
    const box = L.el.getBoundingClientRect();
    const left = L.edge === 'right' ? L.x - box.width : L.x;
    L.el.style.left = left + 'px';
    L.el.style.top = L.y + 'px';
    if (!L.v) continue;
    const p = toScreen(L.v);
    const ex = L.edge === 'right' ? left - 14 : left + box.width + 14;
    const ey = L.y + F.labSize * 0.65;
    L.line.setAttribute('x1', p.x); L.line.setAttribute('y1', p.y); L.line.setAttribute('x2', ex); L.line.setAttribute('y2', ey);
    L.dot.setAttribute('cx', p.x); L.dot.setAttribute('cy', p.y);
    L.ring.setAttribute('cx', p.x); L.ring.setAttribute('cy', p.y);
  }

  // the scroll: exactly scrollDist per loop
  track.style.transform = `translateX(${(scroll0 - u * scrollDist).toFixed(2)}px)`;

  // the countdown really counts: 23:59:59 at the top of the loop
  const left = 86399 - Math.floor(t);
  hh.textContent = pad(Math.floor(left / 3600)); mm.textContent = pad(Math.floor(left / 60) % 60); ss.textContent = pad(left % 60);

  // a sheen crosses the button twice a loop
  const sp = (u * 2) % 1;
  sheen.style.left = (-30 + sp * 260) + '%';
  sheen.style.opacity = sp < 0.55 ? 1 : 0;

  const p = (t - GLINT.t0) / GLINT.life;
  const on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
