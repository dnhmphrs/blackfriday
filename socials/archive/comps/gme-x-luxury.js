// The Luxury House Email. The Black Friday email a high-end house sends, sent by GME:
// A4's grained sky, its museum-specimen globe and its Garamond, with B6's sale mechanics
// (STARTS NOW, BLACK FRIDAY, 30% OFF, a countdown that really counts, a button) set with
// a house's restraint. The owner's five lines run round a GME paper band.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials, castShadows } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const SKY_TALL = 'linear-gradient(180deg, #04060f 0%, #070d24 14%, #0b1a48 32%, #13368a 54%, #2a5bb0 70%, #6d87b6 84%, #a9b1bf 95%, #b7b8b9 100%)';

// Layout, per format. Blocks: x (left), y (top), w (width). Big type is fitted to w.
// hero: where the globe's centre lands on screen, and its diameter.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, sky: SKY_TALL,
    head: { x: 64, y: 262, w: 952, size: 25 },
    pre: { x: 64, y: 340, w: 952, size: 30 },
    kicker: { x: 250, y: 402, w: 580, size: 21 },
    bf: { x: 44, y: 440, w: 992 },
    hero: { x: 540, y: 826, d: 500 },
    offer: { x: 76, y: 1074, w: 928, scope: 54, scopeGap: 8 },
    timer: { x: 64, y: 1360, w: 500, cell: 58, align: 'flex-start' },
    cta: { x: 580, y: 1364, w: 436, h: 82, size: 21 },
    band: { y: 1488, h: 72, t: 37 },
    foot: { x: 64, y: 1640, w: 952, fine: 32, lockW: 230 },
    core: { flushRight: true, ax: 0.9, ay: 0.84 },
    fig: { x: 64, y: 930 },
    labSize: 16, leadW: 1.4,
  },
  '1x1': {
    // one centred column, a specimen on a page: not title-top / offer-left / product-right
    w: 1080, h: 1080,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 30%, #13368a 54%, #2350a6 70%, #5a78b0 82%, #a7afbf 95%, #b4b6ba 100%)',
    head: { x: 48, y: 36, w: 984, size: 18 },
    kicker: { x: 300, y: 104, w: 480, size: 16 },
    bf: { x: 48, y: 134, w: 984 },
    hero: { x: 540, y: 436, d: 316 },
    offer: { x: 175, y: 600, w: 730, scope: 36, scopeGap: 6 },
    timer: { x: 96, y: 826, w: 440, cell: 42, align: 'flex-start' },
    cta: { x: 584, y: 830, w: 400, h: 64, size: 16 },
    band: { y: 918, h: 58, t: 28 },
    foot: { x: 48, y: 994, w: 984, fine: 22, lockW: 116 },
    core: { flushRight: true, ax: 0.9, ay: 0.7 },
    fig: { x: 48, y: 450 },
    labSize: 12, leadW: 1.2,
  },
  'banner-v': {
    w: 1080, h: 2025,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 9%, #0b1a48 26%, #13368a 48%, #2350a6 68%, #2f5aa8 84%, #5d79ad 100%)',
    head: { x: 64, y: 56, w: 952, size: 30 },
    kicker: { x: 200, y: 196, w: 680, size: 32 },
    bf: { x: 60, y: 250, w: 960, lines: true },
    hero: { x: 540, y: 960, d: 560 },
    offer: { x: 50, y: 1236, w: 980, scope: 74, scopeGap: 10 },
    timer: { x: 40, y: 1582, w: 1000, cell: 80 },
    cta: { x: 64, y: 1736, w: 952, h: 112, size: 34, b: 3 },
    band: { y: 1904, h: 96, t: 48 },
    foot: null,
    core: { flushRight: true, ax: 0.6, ay: 0.6 },
    labSize: 24, leadW: 2.4,
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.elev = Number(q.get('elev') || 32);
F.yaw0 = Number(q.get('yaw') || -20);

const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const COPY = {
  head: format === 'banner-v'
    ? ['Gary Mustard<br>Enterprises', 'EST2026', 'This Page<br>(Abridged)']
    : ['Gary Mustard<br>Enterprises', 'EST2026', 'Fri 27 Nov<br><u>View in browser</u>'],
  pre: 'No code needed. Every website. Black Friday only.',
  bf: F.bf.lines ? '<span class="line">Black</span><span class="line">Friday</span>' : '<span class="line">Black Friday</span>',
  big: F.offer.lines ? '<span class="line"><span class="n">30</span><span class="pc">%</span></span><span class="line off">OFF</span>'
    : '<span class="line"><span class="n">30</span><span class="pc">%</span> <span class="off">OFF</span></span>',
  scope: format === 'banner-v' ? 'this page, and every other.' : 'the entire internet.',
  cta: 'Shop the internet<svg class="arr" viewBox="0 0 40 20"><path d="M1 10h36M29 3l8 7-8 7" stroke="#f1efe8" stroke-width="1.8" fill="none"/></svg>',
  scroll: ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'],
  fine: 'The remaining 70% is in good order.<small><u>Unsubscribe from the internet</u></small>',
  core: 'Inner core<em>Mustard</em>',
  fig: 'Fig. 1<em>Shown smaller<br>than actual size.</em>',
};

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const css = (k, v) => stage.style.setProperty(k, v);
css('--sky', F.sky);
css('--labSize', F.labSize + 'px'); css('--leadW', F.leadW + 'px');

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);
const place = (el, b) => { if (!b) { el.style.display = 'none'; return; } el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; if (b.w) el.style.width = b.w + 'px'; };

// ---------- fonts ----------
await Promise.all([
  '500 100px "EB Garamond"', 'italic 400 100px "EB Garamond"', 'italic 700 100px "EB Garamond"', '400 100px "EB Garamond"',
  '500 30px "Libre Franklin"', '600 30px "Libre Franklin"',
].map((f) => document.fonts.load(f, 'BLACK FRIDAY 0123456789% …’')));

// ---------- copy and layout ----------
['h1', 'h2', 'h3'].forEach((id, i) => { $(id).innerHTML = COPY.head[i]; });
place($('head'), F.head); css('--hd', F.head.size + 'px');
if (F.pre) { $('pre').textContent = COPY.pre; place($('pre'), F.pre); css('--pre', F.pre.size + 'px'); } else $('pre').style.display = 'none';
place($('kicker'), F.kicker); css('--kick', F.kicker.size + 'px');
$('bf').innerHTML = COPY.bf; place($('bf'), F.bf);
$('big').innerHTML = COPY.big; place($('offer'), F.offer);
$('scope').textContent = COPY.scope; css('--scope', F.offer.scope + 'px'); css('--scopeGap', F.offer.scopeGap + 'px');
css('--offAlign', F.offer.align || 'center');
place($('timer'), F.timer); css('--cell', F.timer.cell + 'px'); css('--talign', F.timer.align || 'center');
place($('cta'), F.cta); css('--ctaH', F.cta.h + 'px'); css('--cta', F.cta.size + 'px'); css('--ctaB', (F.cta.b || 2) + 'px');
$('cta-label').innerHTML = COPY.cta;
if (F.foot) { place($('foot'), F.foot); $('fine').innerHTML = COPY.fine; css('--fine', F.foot.fine + 'px'); css('--lockW', F.foot.lockW + 'px'); if (F.foot.light) $('foot').classList.add('light'); } else $('foot').style.display = 'none';
$('lab-core').innerHTML = COPY.core;
$('lab-fig').innerHTML = F.fig ? COPY.fig : '';
if (F.fig) place($('lab-fig'), F.fig);

// Fit each line of big type to a width: measure at 100px, scale. Lines share one size.
function fitLines(el, w) {
  el.style.fontSize = '100px';
  const lines = [...el.querySelectorAll('.line')];
  const widest = Math.max(...lines.map((l) => { l.style.width = 'max-content'; const r = l.getBoundingClientRect().width; l.style.width = ''; return r; }));
  const size = (100 * w) / widest;
  el.style.fontSize = size + 'px';
  return size;
}
const bfSize = fitLines($('bf'), F.bf.w);
const bigSize = fitLines($('big'), F.offer.w);

// ---------- the band: five lines and five stars, twice over, scrolled one set per loop ----------
const B = F.band;
css('--bandH', B.h + 'px'); css('--bandT', B.t + 'px'); css('--capW', Math.round(B.h * 1.25) + 'px'); css('--pin', Math.round(B.h * 0.1) + 'px');
$('band').style.left = '0px'; $('band').style.width = F.w + 'px'; $('band').style.top = B.y + 'px';
const set = COPY.scroll.map((s) => `<span class="item">${s}</span><svg viewBox="-1 -1 2 2"><path d="${STAR}"/></svg>`).join('');
const run = $('run');
run.innerHTML = set;
const setW = run.getBoundingClientRect().width;
const copies = Math.ceil(F.w / setW) + 3;
// phase: at frame 12 the first line, BUT WAIT…, sits whole just right of the cap
const runOff = Math.round(B.t * 0.6 + setW * (12 / 360));
run.innerHTML = set.repeat(copies);

// ---------- 3D: the specimen ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
renderer.toneMappingExposure = 1.0;
scene.environment = perfumeStudio(renderer);
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

// The world, in section: shell, paper crust, blue mantle, outer core, and a mustard inner core.
function strataMaterial() {
  const rnd = mulberry(7);
  const map = canvasTexture(2048, (g, n) => {
    const c = n / 2;
    const ring = (r, fill) => { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = fill; g.fill(); };
    g.fillStyle = '#0a1a4a'; g.fillRect(0, 0, n, n);
    const layers = [[1.0, '#0b1b4e'], [0.955, '#e6e2d6'], [0.915, '#5a7fc4'], [0.76, '#2e57a8'], [0.54, '#122a6a'], [0.3, '#d6a634']];
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

// A fragrance studio: A4's night studio with the rims pushed and a warm gold kicker behind,
// so the chrome reads as black glass with long clean highlights and a little gold in it.
function perfumeStudio(r, size = 1024) {
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
  card(1.1, 16, [11, 2, 1], 22, [0.92, 0.96, 1]);
  card(12, 0.7, [0, 11, -2], 14);
  card(4, 9, [3, 3, 11], 0.0);
  card(1.1, 12, [-11, 1, -3], 8, [0.7, 0.82, 1]);
  card(14, 2.2, [0, -3, 12], 1.6, [0.75, 0.82, 1]);
  card(2.2, 2.2, [6, 8, -9], 14, [1, 0.8, 0.45]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D atmosphere ----------
{
  const H = F.hero;
  $('halo').style.background = [
    // a backlight, as behind a bottle on a counter: a bright core just above centre, falling off wide
    `radial-gradient(${H.d * 0.62}px ${H.d * 0.58}px at ${H.x - H.d * 0.04}px ${H.y - H.d * 0.06}px, rgba(170,195,245,0.30), rgba(120,150,220,0.10) 60%, rgba(0,0,0,0) 100%)`,
    `radial-gradient(${H.d * 0.95}px ${H.d * 0.82}px at ${H.x - H.d * 0.1}px ${H.y - H.d * 0.08}px, rgba(130,160,220,0.30), rgba(60,90,170,0.12) 55%, rgba(0,0,0,0) 100%)`,
    `radial-gradient(${H.d * 1.6}px ${H.d * 1.3}px at ${H.x}px ${H.y}px, rgba(40,70,150,0.18), rgba(0,0,0,0) 100%)`,
  ].join(',');
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

await Promise.all(['gme-primary', 'wire-globe'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// ---------- specimen label with a leader line (A4) ----------
const leaders = $('leaders');
leaders.setAttribute('width', F.w); leaders.setAttribute('height', F.h);
const svgNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); leaders.append(e); return e; };
const big = format === 'banner-v';
const LAB = { el: $('lab-core'), at: onSphere(0.15, -12, 108), ...F.core, line: mk('line', {}), dot: mk('circle', { r: big ? 6 : 4 }), ring: mk('circle', { class: 'ring', r: big ? 15 : 10 }) };
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

const glintEl = $('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINT = { at: onSphere(1.0, 30, 144), t0: 4.4, life: 0.9, size: F.hero.d * 0.16 };

const pad = (n) => String(n).padStart(2, '0');
const hh = $('hh'), mm = $('mm'), ss = $('ss'), sheen = $('sheen');
const foil = [...$('big').querySelectorAll('.line')];
const ease = (x) => x * x * (3 - 2 * x);

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  pivot.rotation.y = ((F.yaw0 + 9 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = Math.sin(TAU * u * 2) * 0.012;
  scene.environmentRotation.y = 0.35 * Math.sin(TAU * u + 0.8);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  // the label follows the core
  {
    const p = toScreen(LAB.at), sc = F.hero.d / 2;
    const lx = F.hero.x + LAB.ax * sc, ly = F.hero.y + LAB.ay * sc;
    const box = LAB.el.getBoundingClientRect();
    let left = lx, x2 = lx - 12;
    if (LAB.flushRight) { left = F.w - F.head.x - box.width; x2 = left - 12; }
    LAB.line.setAttribute('x1', p.x); LAB.line.setAttribute('y1', p.y); LAB.line.setAttribute('x2', x2); LAB.line.setAttribute('y2', ly);
    LAB.dot.setAttribute('cx', p.x); LAB.dot.setAttribute('cy', p.y);
    LAB.ring.setAttribute('cx', p.x); LAB.ring.setAttribute('cy', p.y);
    LAB.el.style.left = left + 'px';
    LAB.el.style.top = (ly - box.height * 0.32) + 'px';
  }

  // the countdown really counts: 23:59:59 at the top of the loop
  const left = 86399 - Math.floor(t);
  hh.textContent = pad(Math.floor(left / 3600)); mm.textContent = pad(Math.floor(left / 60) % 60); ss.textContent = pad(left % 60);

  // the band runs exactly one set of five lines per loop
  run.style.transform = `translate(${(runOff - (1 + u) * setW).toFixed(2)}px, -50%)`;

  // a slow light crosses the button once a loop
  const sp = (u * 1 + 0.35) % 1;
  sheen.style.left = (-40 + sp * 180).toFixed(2) + '%';
  sheen.style.opacity = sp < 0.75 ? 1 : 0;

  // once a loop, light runs across the gold foil, left to right
  {
    const a = Math.min(1, Math.max(0, (t - 6.2) / 1.5));
    const pos = a <= 0 || a >= 1 ? 100 : 88 - 76 * ease(a);
    for (const l of foil) l.style.backgroundPosition = `${pos.toFixed(2)}% 0, 0 0`;
  }

  const p = (t - GLINT.t0) / GLINT.life;
  const on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe }, sizes: { bfSize, bigSize, setW } };
setTime(Number(q.get('t') || 0));
window.ready = true;
