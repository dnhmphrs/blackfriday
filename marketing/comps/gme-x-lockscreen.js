// The lock screen. 6:00 a.m., Friday 27 November 2026. The wallpaper is A4's sky with its
// cutaway globe floating in it (in front of the clock, the way a phone lifts a subject over
// the time); B6's email has just landed as notifications; the sale is printed on the wallpaper;
// and the scroll runs as a live activity on GME paper.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials, castShadows } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

const SKY_A4 = 'linear-gradient(180deg, #04060f 0%, #070d24 14%, #0b1a48 34%, #13368a 56%, #2a5bb0 70%, #6d87b6 84%, #a9b1bf 96%, #b7b8b9 100%)';
const OFF_GRAD = 'linear-gradient(180deg, #fff8e2 0%, #ffe39a 30%, #f3b247 66%, #e46a2c 100%)';

const N = {
  sale: { time: 'now', title: '<b>BLACK FRIDAY STARTS NOW:</b> 30% off the entire internet', text: 'Every website. Black Friday only.' },
  sale1: { time: 'now', title: '<b>BLACK FRIDAY STARTS NOW:</b> 30% off the entire internet', text: 'No code needed. Every website. Black Friday only.' },
  code: { time: '1m ago', title: 'No code needed.', text: 'Discount applied at every website.', compact: true },
  page: { time: 'now', title: '<b>BLACK FRIDAY STARTS NOW:</b><br>30% off the entire internet', text: 'You are looking at the discounted<br>portion of this website.' },
  rest: { time: '1m ago', title: 'The remaining 70% is in good order.', text: 'Unsubscribe from the internet' },
};

// Layout per format. x, y = top-left; w = width. Big type is fitted to its width.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, align: 'center', sky: SKY_A4, gut: 56,
    status: { x: 64, y: 48, w: 952, sb: 32 },
    lock: { x: 527, y: 140, w: 26 },
    date: { x: 40, y: 196, w: 1000, size: 38 },
    clock: { x: 40, y: 250, w: 1000, size: 290 },
    hero: { x: 540, y: 642, d: 450 },
    core: { ay: 0.74, flushRight: true },
    fig: { x: 64, y: 692 },
    sale: { x: 50, y: 886, w: 980, bf: 700, off: 960, gap: 12, nudge: -0.0072 },
    live: { x: 40, y: 0, w: 1000, h: 90, scroll: 40, pin: 7, ends: true, after: 44 },
    notifs: { x: 40, y: 0, w: 1000, nf: 28, items: ['sale', 'code'], stack: true, after: 14 },
    foot: { y: 1716, btn: 104, btnX: 72, swipe: 31, homeW: 300, homeY: 168, noBtns: true },
  },
  '1x1': {
    w: 1080, h: 1080, align: 'left', gut: 56,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 32%, #13368a 58%, #2350a6 78%, #4a6fb0 90%, #8d9bb6 100%)',
    status: { x: 48, y: 26, w: 984, sb: 24 },
    date: { x: 56, y: 96, w: 600, size: 30 },
    clock: { x: 48, y: 138, w: 600, size: 250 },
    hero: { x: 790, y: 318, d: 430 },
    core: { ax: 0.55, ay: 1.02, flushRight: true },
    sale: { x: 56, y: 488, w: 968, bf: 520, off: 880, gap: 6 },
    live: { x: 40, y: 0, w: 1000, h: 70, scroll: 31, pin: 5, ends: true, after: 40 },
    notifs: { x: 40, y: 0, w: 1000, nf: 22, items: ['sale1'], stack: true, oneLine: true, after: 14 },
  },
  'banner-v': {
    w: 1080, h: 2025, align: 'center', sky: SKY_A4, gut: 60,
    status: { x: 64, y: 40, w: 952, sb: 44 },
    date: { x: 40, y: 150, w: 1000, size: 52 },
    clock: { x: 40, y: 214, w: 1000, size: 350 },
    hero: { x: 540, y: 790, d: 640 },
    core: { ay: 0.8, flushRight: true },
    sale: { x: 56, y: 1140, w: 968, bf: 940, off: 968, gap: 10, nudge: -0.0072 },
    live: { x: 36, y: 0, w: 1008, h: 124, scroll: 56, pin: 9, ends: false, after: 46 },
    notifs: { x: 36, y: 0, w: 1008, nf: 36, items: ['page'], oneLine: false, after: 22 },
    foot: { y: 1990, btn: 0, btnX: 0, swipe: 0, homeW: 360, homeY: 0, homeOnly: true },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.elev = Number(q.get('elev') || 34);
F.yaw0 = Number(q.get('yaw') || -20);

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const css = (k, v) => stage.style.setProperty(k, v);
css('--sky', F.sky); css('--talign', F.align); css('--offGrad', OFF_GRAD);

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);
const place = (el, b) => { if (!b) { el.style.display = 'none'; return; } el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; if (b.w) el.style.width = b.w + 'px'; };

await Promise.all([
  '500 100px "EB Garamond"', 'italic 400 100px "EB Garamond"', 'italic 700 100px "EB Garamond"', '600 100px "EB Garamond"',
  '400 100px "Anton"', '500 30px "Libre Franklin"', '600 30px "Libre Franklin"',
  '400 30px "Inter"', '600 30px "Inter"', '700 30px "Inter"', '800 30px "Inter"',
].map((f) => document.fonts.load(f)));

// ---------- copy ----------
$('date').innerHTML = 'Friday 27 November';
$('bf').textContent = 'Black Friday';
const OFF = format === 'banner-v' ? '30<span class="pc">%</span> OFF' : '30<span class="pc">%</span> OFF';
$('off').innerHTML = OFF; $('off-glow').innerHTML = OFF;
$('lab-core').innerHTML = 'Inner core<em>Mustard</em>';
$('lab-fig').innerHTML = F.fig ? 'Fig. 1<em>Shown smaller<br>than actual size.</em>' : '';
$('swipe').textContent = 'Swipe up to unsubscribe from the internet';

// ---------- layout ----------
place($('status'), F.status); css('--sb', F.status.sb + 'px');
place($('lock'), F.lock); if (F.lock) css('--lockW', F.lock.w + 'px');
place($('date'), F.date); css('--dateSize', F.date.size + 'px');
place($('clock'), F.clock); css('--clockSize', F.clock.size + 'px');
place($('sale'), F.sale);
place($('live'), F.live); css('--liveH', F.live.h + 'px'); css('--liveR', Math.round(F.live.h * 0.32) + 'px'); css('--scroll', F.live.scroll + 'px'); css('--pin', F.live.pin + 'px');
if (!F.live.ends) $('live').classList.add('no-ends');
place($('notifs'), F.notifs); css('--nf', F.notifs.nf + 'px');
if (F.foot) {
  $('foot').style.top = F.foot.y + 'px';
  if (F.foot.homeOnly) $('foot').classList.add('home-only');
  if (F.foot.noBtns) $('foot').classList.add('no-btns');
  css('--btn', F.foot.btn + 'px'); css('--btnX', F.foot.btnX + 'px'); css('--swipe', F.foot.swipe + 'px'); css('--homeW', F.foot.homeW + 'px'); css('--homeY', F.foot.homeY + 'px');
} else $('foot').style.display = 'none';
const labSize = format === 'banner-v' ? 26 : format === '1x1' ? 14 : 17;
css('--labSize', labSize + 'px'); css('--leadW', (format === 'banner-v' ? 2.4 : 1.4) + 'px');
if (F.fig) { $('lab-fig').style.left = F.fig.x + 'px'; $('lab-fig').style.top = F.fig.y + 'px'; }

// notifications
$('notifs').innerHTML = F.notifs.items.map((k) => {
  const n = N[k], one = F.notifs.oneLine ? ' one' : '';
  if (n.compact) return `<div class="notif compact"><i class="app"><b></b></i><div class="body"><div class="head"><strong>${n.title} <span class="t">${n.text}</span></strong><span>${n.time}</span></div></div></div>`;
  return `<div class="notif"><i class="app"><b></b></i><div class="body"><div class="head"><strong>Gary Mustard Enterprises</strong><span>${n.time}</span></div><div class="title${one}">${n.title}</div><div class="text${one}">${n.text}</div></div></div>`;
}).join('') + (F.notifs.stack ? '<div class="stack"><i></i><i></i></div>' : '');

// fit big type to a width: measure at 100px, scale
function fit(el, w) {
  el.style.fontSize = '100px'; el.style.width = 'max-content';
  const natural = el.getBoundingClientRect().width; el.style.width = '';
  return (100 * w) / natural;
}
{
  const b = fit($('bf'), F.sale.bf); $('bf').style.fontSize = b + 'px';
  const o = fit($('off'), F.sale.off); $('off').style.fontSize = o + 'px'; $('off-glow').style.fontSize = o + 'px';
  css('--glowBlur', Math.round(o * 0.08) + 'px');
  if (F.sale.gap != null) $('off').parentElement.style.marginTop = F.sale.gap + 'px';
  // Garamond's 3 and F carry uneven side bearings: centre the ink, not the advance box
  if (F.sale.nudge) $('off').parentElement.style.transform = `translateX(${(F.sale.nudge * F.sale.off).toFixed(1)}px)`;
}
// flow: the live activity and the notifications follow the sale, measured from the ink
{
  const off = $('off').getBoundingClientRect();
  const ink = off.top + off.height * 0.86; // Garamond caps sit high in their line box
  if (F.live.after != null) { F.live.y = Math.round(ink + F.live.after); $('live').style.top = F.live.y + 'px'; }
  if (F.notifs.after != null) { F.notifs.y = F.live.y + F.live.h + F.notifs.after; $('notifs').style.top = F.notifs.y + 'px'; }
}

// ---------- the scroll ----------
const LINES = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const SEQ = `<div class="seq">${LINES.map((l) => `<span>${l}</span><svg viewBox="-1 -1 2 2"><path d="${STAR}"/></svg>`).join('')}</div>`;
const track = $('track');
track.innerHTML = SEQ;
const SEQ_W = track.firstChild.getBoundingClientRect().width;
const bandW = track.parentElement.getBoundingClientRect().width;
track.innerHTML = SEQ.repeat(Math.ceil(bandW / SEQ_W) + 2);

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

function strataMaterial() {
  const rnd = mulberry(7);
  const map = canvasTexture(2048, (g, n) => {
    const c = n / 2;
    const ring = (r, fill) => { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = fill; g.fill(); };
    g.fillStyle = '#0a1a4a'; g.fillRect(0, 0, n, n);
    const layers = [[1.0, '#0b1b4e'], [0.955, '#e6e2d6'], [0.915, '#5a7fc4'], [0.76, '#2e57a8'], [0.54, '#122a6a'], [0.3, '#cf9f2f']];
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

// A4's dark studio, with one small warm kicker borrowed from B6 so the chrome catches the sale.
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
  card(1.8, 1.8, [6, 8, -9], 12, [1, 0.62, 0.3]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D atmosphere ----------
{
  const H = F.hero, S = $('off').getBoundingClientRect();
  $('halo').style.background = [
    `radial-gradient(${H.d * 0.95}px ${H.d * 0.8}px at ${H.x - H.d * 0.12}px ${H.y - H.d * 0.1}px, rgba(120,150,210,0.30), rgba(60,90,170,0.12) 55%, rgba(0,0,0,0) 100%)`,
    `radial-gradient(${S.width * 0.6}px ${S.height * 0.9}px at ${S.left + S.width / 2}px ${S.top + S.height * 0.5}px, rgba(255,110,40,0.16), rgba(200,40,40,0.05) 60%, rgba(0,0,0,0) 100%)`,
  ].join(',');
}
{
  const rnd = mulberry(2026);
  const n = 384, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  // paper tooth for the live activity
  const p = document.createElement('canvas'); p.width = p.height = 256;
  const pg = p.getContext('2d'), pimg = pg.createImageData(256, 256);
  for (let i = 0; i < pimg.data.length; i += 4) { const v = 236 + (rnd() - 0.5) * 40; pimg.data[i] = v; pimg.data[i + 1] = v - 2; pimg.data[i + 2] = v - 8; pimg.data[i + 3] = 255; }
  pg.putImageData(pimg, 0, 0);
  css('--paperGrain', `url(${p.toDataURL()})`);
  const dust = $('dust'); dust.width = F.w; dust.height = F.h;
  const d = dust.getContext('2d');
  for (let i = 0; i < 70; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, s = 0.6 + rnd() * rnd() * 2.6;
    d.fillStyle = rnd() < 0.6 ? 'rgba(6,8,20,0.55)' : 'rgba(235,235,225,0.4)';
    d.beginPath(); d.ellipse(x, y, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
}
const grain = $('grain');

await Promise.all(['gme-primary', 'wire-globe'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// ---------- specimen label ----------
const leaders = $('leaders');
leaders.setAttribute('width', F.w); leaders.setAttribute('height', F.h);
const svgNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); leaders.append(e); return e; };
const big = format === 'banner-v';
const LAB = { el: $('lab-core'), at: onSphere(0.15, -12, 108), ax: 0.9, ay: 0.95, ...F.core,
  line: mk('line', {}), dot: mk('circle', { r: big ? 6 : 4 }), ring: mk('circle', { class: 'ring', r: big ? 15 : 10 }) };
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

const glintEl = $('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINT = { at: onSphere(1.0, 30, 144), t0: 4.4, life: 0.9, size: F.hero.d * 0.16 };

const pad = (n) => String(n).padStart(2, '0');
const count = $('count'), offGlow = $('off-glow');

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  pivot.rotation.y = ((F.yaw0 + 9 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = Math.sin(TAU * u * 2) * 0.012;
  scene.environmentRotation.y = 0.35 * Math.sin(TAU * u + 0.8);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  // specimen label
  const p = toScreen(LAB.at), sc = F.hero.d / 2;
  const lx = F.hero.x + LAB.ax * sc, ly = F.hero.y + LAB.ay * sc;
  LAB.dot.setAttribute('cx', p.x); LAB.dot.setAttribute('cy', p.y);
  LAB.ring.setAttribute('cx', p.x); LAB.ring.setAttribute('cy', p.y);
  LAB.line.setAttribute('x1', p.x); LAB.line.setAttribute('y1', p.y); LAB.line.setAttribute('y2', ly);
  const box = LAB.el.getBoundingClientRect();
  const left = LAB.flushRight ? F.w - F.gut - box.width : lx;
  LAB.line.setAttribute('x2', left - 12);
  LAB.el.style.left = left + 'px';
  LAB.el.style.top = (ly - box.height * 0.32) + 'px';

  // the scroll: exactly one sequence per loop, so it is seamless
  track.style.transform = `translate(${(-u * SEQ_W).toFixed(2)}px, -50%)`;

  // the countdown really counts
  const leftS = 86399 - Math.floor(t);
  count.textContent = `${pad(Math.floor(leftS / 3600))}:${pad(Math.floor(leftS / 60) % 60)}:${pad(leftS % 60)}`;

  offGlow.style.opacity = (0.4 + 0.1 * Math.sin(TAU * u * 2)).toFixed(3);

  const gp = (t - GLINT.t0) / GLINT.life;
  const on = gp >= 0 && gp <= 1, k = on ? Math.sin(gp * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(gp * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
