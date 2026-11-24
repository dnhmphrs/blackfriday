// The midpoint of A4 and B6. A4's body: the grained navy sky, the chrome cutaway globe with
// its mustard core, specimen labels, Garamond, deadpan. B6's voice: the notification it
// arrived in, BLACK FRIDAY and 30% OFF at full volume, a countdown that ticks, one button.
// The owner's scroll runs on a GME paper band with pinstripes, like SYNERGY on the sheet.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials, castShadows } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const SKY = 'linear-gradient(180deg, #04060f 0%, #070d24 14%, #0b1a48 34%, #13368a 56%, #2a5bb0 70%, #6d87b6 84%, #a9b1bf 96%, #b7b8b9 100%)';

// Layout per format. Blocks are x (left), y (top), w (width); big type is fitted to w.
// hero: where the globe's centre lands and its diameter. Labels: ax/ay place the label
// relative to the hero centre in globe radii; flush pins it to the gutter on that side.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, gut: 64, sky: SKY,
    notif: { x: 64, y: 256, w: 952, ib: 24 },
    bf: { x: 64, y: 400, w: 952 },
    hero: { x: 540, y: 786, d: 546 },
    labels: { size: 17, lead: 1.4, core: { ax: 0.88, ay: 0.6, flush: 'right' }, cut: { ax: 0.86, ay: -0.46, flush: 'right' }, fig: { x: 64, y: 900 } },
    price: { x: 60, y: 1042, w: 956, scope: 50, scopeGap: 4, timer: true },
    act: { x: 64, y: 1404, w: 952, cell: 46, ctaH: 66, cta: 25 },
    band: { y: 1494, pinH: 10, pinStep: 5, bandH: 56, size: 36, capW: 112, capPad: 28 },
    foot: { x: 64, y: 1626, w: 952, note: 34, fine: 0, ink: 'rgba(14, 20, 44, 0.86)' },
    lockup: { x: 64, y: 1708, w: 250, ink: 'rgba(12, 20, 48, 0.88)' },
  },
  '1x1': {
    w: 1080, h: 1080, gut: 48,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 32%, #13368a 58%, #2350a6 76%, #5f7db4 88%, #a3acbc 100%)',
    notif: { x: 48, y: 24, w: 984, ib: 18 },
    bf: { x: 48, y: 126, w: 984 },
    hero: { x: 540, y: 454, d: 368 },
    labels: { size: 13, lead: 1.2, core: { ax: 0.92, ay: 0.55, flush: 'right' }, cut: null, fig: { x: 48, y: 470 } },
    price: { x: 44, y: 646, w: 640, scope: 40, scopeGap: 8 },
    act: { x: 732, y: 662, w: 300, cell: 42, ctaH: 66, cta: 18, stack: true, gap: 20 },
    band: { y: 930, pinH: 8, pinStep: 4, bandH: 52, size: 30, capW: 96, capPad: 22 },
  },
  'banner-v': {
    w: 1080, h: 2025, gut: 64, sky: SKY,
    notif: { x: 40, y: 40, w: 1000, ib: 29 },
    bf: { x: 100, y: 196, w: 880, lines: true, same: true },
    hero: { x: 540, y: 1036, d: 500 },
    labels: { size: 25, lead: 2.2, core: { ax: 0.88, ay: 0.72, flush: 'right' }, cut: null, fig: null },
    price: { x: 60, y: 1262, w: 960, scope: 66, scopeGap: 8, center: true },
    act: { x: 64, y: 1624, w: 952, cell: 66, ctaH: 108, cta: 31, gap: 30 },
    band: { y: 1784, pinH: 12, pinStep: 6, bandH: 96, size: 54, capW: 0, capPad: 0 },
    foot: { x: 64, y: 1944, w: 952, note: 40, fine: 0, ink: 'rgba(14, 20, 44, 0.86)', stack: true, noteText: 'You are looking at the discounted portion of this website.' },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.elev = Number(q.get('elev') || 34);
F.yaw0 = Number(q.get('yaw') || -20);
const L = F.labels;

const COPY = {
  subj: 'BLACK FRIDAY STARTS NOW: 30% off the entire internet',
  pre: 'No code needed. Every website. Black Friday only.',
  bf: F.bf.lines ? ['Black', 'Friday'] : ['Black Friday'],
  big: F.price.lines ? ['30<span class="pc">%</span>', 'off'] : ['30<span class="pc">%</span> off'],
  scope: 'the entire internet.',
  cta: 'Shop the internet<svg class="arr" viewBox="0 0 24 24"><path d="M2 12h17M12 4.5l7.5 7.5-7.5 7.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="square"/></svg>',
  core: 'Inner core<em>Mustard</em>',
  cut: '30% removed<em>No code needed.</em>',
  fig: 'Fig. 1<em>Shown smaller<br>than actual size.</em>',
  note: 'The remaining 70% is in good order.',
  fine: '<u>Unsubscribe from the internet</u>',
  scroll: ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'],
};

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
stage.style.setProperty('--sky', F.sky);

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);
const place = (el, b) => { if (!b) { el.style.display = 'none'; return; } el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; if (b.w) el.style.width = b.w + 'px'; };
const css = (k, v) => stage.style.setProperty(k, v);

await Promise.all([
  '400 100px "Anton"', '500 100px "EB Garamond"', 'italic 400 60px "EB Garamond"', 'italic 700 60px "EB Garamond"',
  '500 30px "Libre Franklin"', '600 30px "Libre Franklin"', '700 30px "Libre Franklin"',
  '400 30px "Inter"', '600 30px "Inter"', '700 30px "Inter"',
].map((f) => document.fonts.load(f)));

// ---------- copy and layout ----------
place($('doc'), F.doc);
if (F.doc) { css('--docSize', F.doc.size + 'px'); $('doc-c3').innerHTML = F.doc.c3; }
place($('notif'), F.notif); css('--ib', F.notif.ib + 'px');
$('subj').textContent = COPY.subj;
$('pre').textContent = F.notif.pre ? COPY.pre : '';

const lines = (arr) => arr.map((s) => `<span class="line">${s}</span>`).join('');
$('bf').innerHTML = lines(COPY.bf);
place($('bf'), F.bf);
$('big').innerHTML = lines(COPY.big);
$('scope').textContent = COPY.scope;
place($('price'), F.price); css('--scope', F.price.scope + 'px'); css('--scopeGap', F.price.scopeGap + 'px');
if (F.price.center) css('--palign', 'center');

place($('act'), F.act); css('--cell', F.act.cell + 'px'); css('--ctaH', F.act.ctaH + 'px'); css('--cta', F.act.cta + 'px');
if (F.act.stack) $('act').classList.add('stack');
if (F.act.gap) css('--actGap', F.act.gap + 'px');
if (F.price.timer) { // scope and countdown share a row under the price; the button gets the row below to itself
  const row = document.createElement('div'); row.className = 'srow';
  const scope = $('scope'), timer = $('timer');
  scope.replaceWith(row); row.append(scope, timer);
}
$('cta-label').innerHTML = COPY.cta;

const B = F.band;
$('band').style.top = B.y + 'px';
css('--pinH', B.pinH + 'px'); css('--pinStep', B.pinStep + 'px'); css('--bandH', B.bandH + 'px'); css('--bandSize', B.size + 'px'); css('--capW', B.capW + 'px'); css('--capPad', B.capPad + 'px');
if (!B.capW) $('band').querySelector('.cap').style.display = 'none';
if (!B.pinH) $('band').querySelectorAll('.pin').forEach((p) => (p.style.display = 'none'));

place($('foot'), F.foot);
if (F.foot) { css('--noteSize', F.foot.note + 'px'); css('--fineSize', F.foot.fine + 'px'); css('--footInk', F.foot.ink); $('note').textContent = F.foot.noteText || COPY.note; $('fine').innerHTML = F.foot.fine ? COPY.fine : ''; if (F.foot.stack) $('foot').classList.add('stack'); }
if (F.lockup) { place($('lockup'), F.lockup); $('lockup').style.height = F.lockup.w * 0.534 + 'px'; css('--lockInk', F.lockup.ink); } else $('lockup').style.display = 'none';

// Fit type to a width: measure at 100px, scale. Each line of a stacked block is fitted on its own,
// so the block reads as one justified slab.
function fitLines(el, w) {
  el.style.width = 'max-content';
  for (const line of el.querySelectorAll('.line')) {
    line.style.fontSize = '100px'; line.style.width = 'max-content';
    const natural = line.getBoundingClientRect().width;
    line.style.fontSize = (100 * w) / natural + 'px'; line.style.width = '';
  }
  el.style.width = '';
}
fitLines($('bf'), F.bf.w);
fitLines($('big'), F.price.lines ? F.price.w : F.price.w);
if (F.bf.same) { // every line at the size of the widest, so the slab keeps one weight
  const ls = [...$('bf').querySelectorAll('.line')];
  const m = Math.min(...ls.map((l) => parseFloat(l.style.fontSize)));
  ls.forEach((l) => (l.style.fontSize = m + 'px'));
  $('bf').style.textAlign = 'center';
}
if (F.price.lines) { // two-line price: the % line sets the size, "off" matches it
  const ls = $('big').querySelectorAll('.line');
  ls[1].style.fontSize = ls[0].style.fontSize;
}

// ---------- the scroll ----------
const STAR4 = 'M0,-1 C0.08,-0.25 0.25,-0.08 1,0 C0.25,0.08 0.08,0.25 0,1 C-0.08,0.25 -0.25,0.08 -1,0 C-0.25,-0.08 -0.08,-0.25 0,-1Z';
const run = $('run');
const setHTML = COPY.scroll.map((p) => `<span class="ph">${p}</span><svg class="dev" viewBox="-1 -1 2 2"><path d="${STAR4}"/></svg>`).join('');
run.innerHTML = `<div class="set">${setHTML}</div>`;
const setW = run.firstChild.getBoundingClientRect().width;
const copies = Math.ceil(F.w / setW) + 2;
run.innerHTML = Array.from({ length: copies }, () => `<div class="set">${setHTML}</div>`).join('');

// ---------- 3D: A4's specimen ----------
const canvas = $('gl');
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
const core = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.02, 0.06, 0.24), metalness: 0.55, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 });
const globe = makeGlobe({ R: 1, tubeRadius: 0.022, step: 36, wedge: 108, core, cut: strataMaterial(), sliceOut: 0, material: materials.chrome() });
pivot.add(castShadows(globe));

// The world, in section: shell, paper crust, blue mantle, outer core, and at the centre, mustard.
function strataMaterial() {
  const rnd = mulberry(7);
  const map = canvasTexture(2048, (g, n) => {
    const c = n / 2;
    const ring = (r, fill) => { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = fill; g.fill(); };
    g.fillStyle = '#0a1a4a'; g.fillRect(0, 0, n, n);
    const layers = [[1.0, '#0b1b4e'], [0.955, '#e6e2d6'], [0.915, '#5a7fc4'], [0.76, '#2e57a8'], [0.54, '#122a6a'], [0.3, '#d6a332']];
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

// A4's dark photo studio, with one small warm kicker so the chrome picks up the mustard.
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
  card(1.6, 1.6, [6, 8, -9], 12, [1, 0.8, 0.45]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D atmosphere ----------
{
  const H = F.hero;
  $('halo').style.background = `radial-gradient(${H.d * 0.95}px ${H.d * 0.8}px at ${H.x - H.d * 0.12}px ${H.y - H.d * 0.1}px, rgba(120,150,210,0.30), rgba(60,90,170,0.12) 55%, rgba(0,0,0,0) 100%)`;
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
    const x = rnd() * F.w, y = rnd() * F.h, a = rnd() * TAU, len = 14 + rnd() * 30;
    d.beginPath(); d.moveTo(x, y); d.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + 6, y + Math.sin(a) * len * 0.5 - 5, x + Math.cos(a) * len, y + Math.sin(a) * len); d.stroke();
  }
}
const grain = $('grain');

// ---------- specimen labels ----------
css('--labSize', L.size + 'px'); css('--leadW', L.lead + 'px');
const leaders = $('leaders');
leaders.setAttribute('width', F.w); leaders.setAttribute('height', F.h);
const svgNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); leaders.append(e); return e; };
const dotR = L.lead * 2.8, ringR = L.lead * 7;
const LABELS = [];
const addLabel = (id, html, at, cfg) => {
  const el = $(id);
  if (!cfg) { el.style.display = 'none'; return; }
  el.innerHTML = html;
  LABELS.push({ el, at, ...cfg, line: mk('line', {}), dot: mk('circle', { r: dotR }), ring: mk('circle', { class: 'ring', r: ringR }) });
};
// points in the globe's own frame; longitudes 0..108 are the missing wedge
addLabel('lab-core', COPY.core, onSphere(0.15, -12, 108), L.core);
addLabel('lab-cut', COPY.cut, onSphere(0.92, 46, 108), L.cut);
if (L.fig) { $('lab-fig').innerHTML = COPY.fig; place($('lab-fig'), L.fig); } else $('lab-fig').style.display = 'none';
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

await Promise.all(['gme-primary', 'wire-globe'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// one four-point glint on the chrome, once per loop
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

  const sc = F.hero.d / 2;
  for (const Lb of LABELS) {
    const p = toScreen(Lb.at);
    const box = Lb.el.getBoundingClientRect();
    let lx = F.hero.x + Lb.ax * sc, ly = F.hero.y + Lb.ay * sc;
    let left = lx;
    if (Lb.flush === 'right') left = F.w - F.gut - box.width;
    else if (Lb.flush === 'left') left = F.gut;
    const right = Lb.flush === 'left';
    const x2 = right ? left + box.width + 12 : left - 12;
    Lb.line.setAttribute('x1', p.x); Lb.line.setAttribute('y1', p.y); Lb.line.setAttribute('x2', x2); Lb.line.setAttribute('y2', ly);
    Lb.dot.setAttribute('cx', p.x); Lb.dot.setAttribute('cy', p.y);
    Lb.ring.setAttribute('cx', p.x); Lb.ring.setAttribute('cy', p.y);
    Lb.el.style.left = left + 'px';
    Lb.el.style.top = (ly - box.height * 0.32) + 'px';
    Lb.el.classList.toggle('right', right);
  }

  // the countdown really counts: 23:59:59 at the top of the loop, 23:59:48 at the end
  const left = 86399 - Math.floor(t);
  hh.textContent = pad(Math.floor(left / 3600)); mm.textContent = pad(Math.floor(left / 60) % 60); ss.textContent = pad(left % 60);

  // a sheen crosses the button twice a loop
  const sp = (u * 2) % 1;
  sheen.style.left = (-30 + sp * 260) + '%';
  sheen.style.opacity = sp < 0.55 ? 1 : 0;

  // the scroll: exactly one set per loop, right to left, so the loop is seamless
  run.style.transform = `translate3d(${(-u * setW).toFixed(2)}px,0,0)`;

  const gp = (t - GLINT.t0) / GLINT.life;
  const on = gp >= 0 && gp <= 1, k = on ? Math.sin(gp * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(gp * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  // grain at 12 frames a second, 144 steps per loop
  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
