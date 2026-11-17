// The Half Globe. GME's mark is half a globe; for Black Friday, the world itself loses 30%.
// One chrome-wire globe, cut open like a geological specimen, lit like a luxury product.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials, castShadows } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
// hero: where the globe's centre lands on screen and its diameter (px)
// labels: which specimen labels to show, and on which side of the frame each sits
const FORMATS = {
  '9x16': { w: 1080, h: 1920, gut: 64, hero: { x: 540, y: 768, d: 772 }, elev: 34, yaw0: -20, lab: { flushRight: true } },
  '1x1': { w: 1080, h: 1080, gut: 56, hero: { x: 700, y: 430, d: 560 }, elev: 34, yaw0: -20, lab: { flushRight: true } },
  'banner-v': { w: 1080, h: 2025, gut: 72, hero: { x: 540, y: 640, d: 860 }, elev: 34, yaw0: -20, lab: { ax: 0.42, ay: 1.0 } },
};
const COPY = {
  '9x16': {
    c3: 'The World<br>(Abridged)',
    h1: 'We took <span class="pc">30%</span> off the&nbsp;world.',
    sub: 'Every website. Black Friday only.',
    date: 'Friday 27 November 2026',
    fine: '<span>As seen on every website.</span><span>No purchase necessary</span>',
    core: 'Inner core<em>Mustard</em>',
    fig: 'Fig. 1<em>Shown smaller than actual size.</em>',
  },
  '1x1': {
    c3: 'The World<br>(Abridged)',
    h1: 'We took <span class="pc">30%</span> off the&nbsp;world.',
    sub: 'Every website. Black Friday only.',
    date: 'Friday 27 November 2026',
    fine: '',
    core: 'Inner core<em>Mustard</em>',
    fig: 'Fig. 1<em>Shown smaller<br>than actual size.</em>',
  },
  'banner-v': {
    c3: 'This Page<br>(Abridged)',
    h1: '<span class="pc">30%</span> off',
    sub: 'this page, and every other.',
    date: 'Black Friday &middot; 27.11.2026',
    fine: '',
    note: 'The remaining 70% is in good order.',
    core: 'Inner core<em>Mustard</em>',
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
if (q.get('elev')) F.elev = Number(q.get('elev'));
if (q.get('yaw')) F.yaw0 = Number(q.get('yaw'));
const C = COPY[format];
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

// A seeded random, so every render is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- 3D ----------
const canvas = document.getElementById('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
renderer.toneMappingExposure = 1.0;
scene.environment = nightStudio(renderer);
scene.environmentIntensity = 1.0;
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
await document.fonts.load('500 60px "EB Garamond"');
const core = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.02, 0.06, 0.24), metalness: 0.55, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 });
const globe = makeGlobe({ R: 1, tubeRadius: 0.022, step: 36, wedge: 108, core, cut: strataMaterial(), sliceOut: 0, material: materials.chrome() });
pivot.add(castShadows(globe));


// The world, in section: a dark shell, a paper crust, a blue mantle, a pale outer core,
// and at the centre, naturally, mustard.
function strataMaterial() {
  const rnd = mulberry(7);
  const map = canvasTexture(2048, (g, n) => {
    const c = n / 2;
    const ring = (r, fill) => { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = fill; g.fill(); };
    g.fillStyle = '#0a1a4a'; g.fillRect(0, 0, n, n);
    const layers = [
      [1.0, '#0b1b4e'],   // shell (the ball's own lacquer)
      [0.955, '#e6e2d6'], // crust
      [0.915, '#5a7fc4'], // upper mantle
      [0.76, '#2e57a8'],  // lower mantle
      [0.54, '#122a6a'],  // outer core
      [0.3, '#cf9f2f'],   // inner core
    ];
    for (const [r, fill] of layers) ring(r, fill);
    // a soft falloff inside each layer, like a lit section
    for (const [r] of layers) {
      const gr = g.createRadialGradient(c, c, r * c * 0.55, c, c, r * c);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.16)');
      g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = gr; g.fill();
    }
    // engraved boundaries
    g.strokeStyle = 'rgba(6,10,30,0.75)'; g.lineWidth = 3;
    for (const [r] of layers.slice(1)) { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.stroke(); }
    // print grain over the whole face
    const img = g.getImageData(0, 0, n, n), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const k = (rnd() - 0.5) * 26; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
    g.putImageData(img, 0, 0);
    // the crease where the two faces meet
    const crease = g.createLinearGradient(c - 60, 0, c + 60, 0);
    crease.addColorStop(0, 'rgba(0,0,0,0)'); crease.addColorStop(0.5, 'rgba(0,0,0,0.35)'); crease.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = crease; g.fillRect(c - 60, 0, 120, n);
  });
  return new THREE.MeshStandardMaterial({ map, metalness: 0, roughness: 0.78, envMapIntensity: 0.35, side: THREE.DoubleSide });
}

// A dark photo studio: navy cyclorama, one big soft key overhead-left, a long strip on the
// right for the rim, a cool back light. Chrome becomes black glass with clean white lines.
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
  card(7, 7, [-7, 10, 6], 18);                     // big soft key, overhead left
  card(1.1, 16, [11, 2, 1], 20, [0.92, 0.96, 1]);  // long strip, right: the rim
  card(12, 0.7, [0, 11, -2], 14);                  // thin strip overhead: a clean line along every tube
  card(4, 9, [3, 3, 11], 0.0);                     // black flag in front: dark chrome where it faces us
  card(1.1, 12, [-11, 1, -3], 6, [0.7, 0.82, 1]);  // cool strip, back left
  card(14, 2.2, [0, -3, 12], 1.6, [0.75, 0.82, 1]); // low fill
  card(1.6, 1.6, [6, 8, -9], 10, [1, 0.88, 0.66]); // a small warm kicker
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D ----------
document.getElementById('doc-c3').innerHTML = C.c3;
document.getElementById('headline').innerHTML = C.h1;
document.getElementById('sub').innerHTML = C.sub;
document.getElementById('date').innerHTML = C.date;
document.getElementById('fine').innerHTML = C.fine;
document.getElementById('note').innerHTML = C.note || '';
const labCore = document.getElementById('lab-core');
labCore.innerHTML = C.core;
document.getElementById('lab-fig').innerHTML = C.fig || '';

await Promise.all(['500 100px "EB Garamond"', 'italic 400 100px "EB Garamond"', '500 30px "Libre Franklin"'].map((f) => document.fonts.load(f)));
const mark = new Image();
mark.src = '/assets/gme/gme-primary.png';
await mark.decode();

// The halo: light falling on the backdrop behind the globe.
document.querySelector('.halo').style.background =
  `radial-gradient(${F.hero.d * 0.95}px ${F.hero.d * 0.8}px at ${F.hero.x - F.hero.d * 0.12}px ${F.hero.y - F.hero.d * 0.1}px, rgba(120,150,210,0.30), rgba(60,90,170,0.12) 55%, rgba(0,0,0,0) 100%)`;

// Grain and dust, drawn once from a seed.
{
  const rnd = mulberry(2026);
  const n = 384, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  document.getElementById('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  const dust = document.getElementById('dust'); dust.width = F.w; dust.height = F.h;
  const d = dust.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, s = 0.6 + rnd() * rnd() * 2.6;
    d.fillStyle = rnd() < 0.6 ? 'rgba(6,8,20,0.55)' : 'rgba(235,235,225,0.4)';
    d.beginPath(); d.ellipse(x, y, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
  d.strokeStyle = 'rgba(6,8,20,0.28)'; d.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) { // a few hairs
    const x = rnd() * F.w, y = rnd() * F.h, a = rnd() * TAU, L = 14 + rnd() * 30;
    d.beginPath(); d.moveTo(x, y); d.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + 6, y + Math.sin(a) * L * 0.5 - 5, x + Math.cos(a) * L, y + Math.sin(a) * L); d.stroke();
  }
}
const grain = document.getElementById('grain');

// Specimen labels: a leader line from a point on the object to a label at the side.
const leaders = document.getElementById('leaders');
leaders.setAttribute('width', F.w); leaders.setAttribute('height', F.h);
const svgNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); leaders.append(e); return e; };
// points in the globe's own frame (before it is turned); longitude 0 and 108 are the cut faces
const along = (r, lat, lon) => onSphere(r, lat, lon);
const LABELS = [
  { el: labCore, at: along(0.15, -12, 108), side: 'right', ax: 0.9, ay: 0.95, ...(F.lab || {}) },
].map((L) => ({ ...L, line: mk('line', {}), dot: mk('circle', { r: format === 'banner-v' ? 6 : 4 }), ring: mk('circle', { class: 'ring', r: format === 'banner-v' ? 15 : 10 }) }));
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

// One four-point star glint on the chrome, once per loop.
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintEl = document.getElementById('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINT = { at: along(1.0, 30, 144), t0: 4.4, life: 0.9, size: F.hero.d * 0.16 };

const yawAt = (t) => ((F.yaw0 + 9 * Math.sin((TAU * t) / DURATION)) * Math.PI) / 180;

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  pivot.rotation.y = yawAt(t);
  pivot.position.y = Math.sin((TAU * t) / DURATION * 2) * 0.012;
  scene.environmentRotation.y = 0.35 * Math.sin((TAU * t) / DURATION + 0.8);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  const sc = F.hero.d / 2;
  for (const L of LABELS) {
    const p = toScreen(L.at);
    const lx = F.hero.x + L.ax * sc, ly = F.hero.y + L.ay * sc;
    const gapX = L.side === 'right' ? -12 : 12;
    L.line.setAttribute('x1', p.x); L.line.setAttribute('y1', p.y); L.line.setAttribute('x2', lx + gapX); L.line.setAttribute('y2', ly);
    L.dot.setAttribute('cx', p.x); L.dot.setAttribute('cy', p.y);
    L.ring.setAttribute('cx', p.x); L.ring.setAttribute('cy', p.y);
    const box = L.el.getBoundingClientRect();
    if (L.flushRight) { // label's right edge sits on the page gutter; the leader stops short of it
      const left = F.w - F.gut - box.width;
      L.line.setAttribute('x2', left - 12);
      L.el.style.left = left + 'px';
    } else L.el.style.left = (L.side === 'right' ? lx : lx - box.width) + 'px';
    L.el.style.top = (ly - box.height * 0.32) + 'px';
    L.el.classList.toggle('right', L.side === 'left');
  }

  let p = (t - GLINT.t0) / GLINT.life;
  const on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  // grain moves at 12 frames a second, film-like; 144 steps per loop, so the loop is seamless
  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;

  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
