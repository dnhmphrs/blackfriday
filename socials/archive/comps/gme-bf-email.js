// The Black Friday email. The graphic every brand sends at 6 a.m.: BLACK FRIDAY STARTS NOW,
// 30% OFF SITEWIDE, NO CODE NEEDED, a countdown, a big button, a hero product shot. Ours is
// sent by Gary Mustard Enterprises, the site is the internet, and the product is the internet
// itself: the chrome cut globe, lit like a luxury product, with its missing 30% floating free.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';
import { onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout, per format. Every block: x (left), y (top), w (width). Big type is fitted to w.
// hero: where the globe's centre lands on screen and its diameter.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    sky: 'linear-gradient(180deg, #000 0%, #03040a 14%, #060b1f 30%, #0a1844 46%, #10296a 58%, #0b1a46 72%, #050813 88%, #000 100%)',
    inbox: { x: 40, y: 66, w: 1000, ib: 29 },
    masthead: { x: 40, y: 254, w: 1000, markH: 56 },
    kicker: { x: 120, y: 318, w: 840, size: 30 },
    bf: { x: 40, y: 384, w: 1000 },
    hero: { x: 520, y: 760, d: 480 },
    burst: { x: 790, y: 586, w: 250, rot: 12 },
    offer: { x: 40, y: 944, w: 1000, scope: 52, scopeGap: 20, align: 'center' },
    tag: { x: 175, y: 640, w: 190, pole: 1 },
    sparks: [[0.02, 0.08, 64, 0.0], [0.6, 0.02, 44, 0.33], [0.97, 0.9, 58, 0.62], [0.3, 0.98, 36, 0.8]],
    timer: { x: 40, y: 1314, w: 1000, cell: 74, align: 'center' },
    cta: { x: 40, y: 1462, w: 1000, h: 94, size: 52 },
    garamond: { x: 40, y: 1628, w: 1000, size: 46 },
    unsub: { x: 90, y: 1730, w: 900, fine: 21, lockW: 0 },
  },
  '1x1': {
    w: 1080, h: 1080,
    sky: 'linear-gradient(180deg, #000 0%, #04060f 20%, #0a1844 46%, #10296a 58%, #0a1844 76%, #03050d 92%, #000 100%)',
    inbox: { x: 32, y: 22, w: 1016, ib: 20, noPre: true },
    kicker: { x: 140, y: 106, w: 800, size: 24 },
    bf: { x: 48, y: 160, w: 984 },
    hero: { x: 520, y: 452, d: 336 },
    burst: { x: 818, y: 318, w: 196, rot: 12 },
    tag: { x: 190, y: 352, w: 138 },
    offer: { x: 48, y: 572, w: 984, scope: 34, scopeGap: 16, align: 'center' },
    timer: { x: 48, y: 904, w: 470, cell: 52 },
    cta: { x: 556, y: 906, w: 476, h: 78, size: 38 },
    garamond: { x: 48, y: 1010, w: 984, size: 27 },
    unsub: null,
    foot: { x: 48, y: 1050, w: 984, fine: 13, oneLine: true },
    sparks: [[0.02, 0.1, 48, 0.0], [0.62, 0.0, 34, 0.33], [0.98, 0.92, 44, 0.62]],
  },
  'banner-v': {
    w: 1080, h: 2025,
    sky: 'linear-gradient(180deg, #000 0%, #03040a 10%, #060b1f 26%, #0a1844 44%, #10296a 56%, #0b1a46 70%, #050813 86%, #000 100%)',
    inbox: { x: 40, y: 44, w: 1000, ib: 34, noPre: true },
    kicker: { x: 110, y: 212, w: 860, size: 46 },
    bf: { x: 80, y: 312, w: 920, lines: true },
    hero: { x: 470, y: 1090, d: 470 },
    burst: { x: 742, y: 940, w: 300, rot: 12 },
    offer: { x: 40, y: 1268, w: 1000, scope: 64, scopeGap: 22, align: 'center' },
    timer: { x: 40, y: 1652, w: 1000, cell: 92, align: 'center' },
    cta: { x: 40, y: 1826, w: 1000, h: 112, size: 68 },
    garamond: null,
    unsub: { x: 40, y: 1962, w: 1000, fine: 28, lockW: 0 },
    sparks: [[0.02, 0.1, 80, 0.0], [0.97, 0.9, 70, 0.62]],
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.elev = Number(q.get('elev') || 30);
const SL = F.slice || {};
F.yaw0 = Number(q.get('yaw') ?? F.yaw ?? -25);
F.out = Number(q.get('out') ?? 0); F.lift = Number(q.get('lift') ?? SL.lift ?? 0.28); F.sx = Number(q.get('sx') ?? SL.sx ?? 1.75); F.sz = Number(q.get('sz') ?? SL.sz ?? -0.1); F.spin = Number(q.get('spin') ?? SL.spin ?? -40);

const COPY = {
  subj: 'BLACK FRIDAY STARTS NOW: 30% off the entire internet',
  pre: 'No code needed. Every website. Today only. Open any website to redeem.',
  nav: '',
  kicker: '<span>Starts now</span>',
  bf: F.bf.lines ? '<span class="line">Black</span><span class="line">Friday</span>' : 'Black Friday',
  big: F.offer.lines ? '<span class="line">30<span class="pc">%</span></span><span class="line">Off</span>' : '30<span class="pc">%</span> Off',
  scope: 'The <span class="em">entire</span> internet',
  cta: 'Shop the internet<svg class="arr" viewBox="0 0 24 24"><path d="M2 12h17M12 4.5l7.5 7.5-7.5 7.5" stroke="#fff" stroke-width="3.6" fill="none" stroke-linecap="square"/></svg>',
  garamond: 'The remaining 70% is in good order.',
  unsub: format === 'banner-v'
    ? 'You are looking at the discounted portion of this website.'
    : format === '1x1' ? '<u>Unsubscribe from the internet</u> &nbsp;&middot;&nbsp; Gary Mustard Enterprises, EST2026 &nbsp;&middot;&nbsp; No purchase necessary.'
    : 'You are receiving this because you have visited a website.<br>To stop, <u>unsubscribe from the internet</u>.<span class="co">Gary Mustard Enterprises &nbsp;&middot;&nbsp; The \u2018Business\u2019 Business &nbsp;&middot;&nbsp; EST2026</span>',
};

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
stage.style.setProperty('--sky', F.sky);

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);
const place = (el, b) => { if (!b) { el.style.display = 'none'; return; } el.style.left = b.x + 'px'; el.style.top = b.y + 'px'; if (b.w) el.style.width = b.w + 'px'; };

// ---------- fonts ----------
await Promise.all([
  '400 100px "Anton"', '600 40px "Oswald"', '400 40px "Inter"', '600 40px "Inter"', '700 40px "Inter"',
  'italic 400 60px "EB Garamond"', '500 60px "EB Garamond"', '400 100px "Archivo Black"', '800 40px "Inter"', '700 40px "Oswald"',
].map((f) => document.fonts.load(f)));

// ---------- copy and layout ----------
$('subj').textContent = COPY.subj;
$('pre').textContent = COPY.pre;
$('kicker').innerHTML = COPY.kicker;
$('bf').innerHTML = COPY.bf;
$('big').innerHTML = COPY.big;
$('big-glow').innerHTML = COPY.big;
$('scope').innerHTML = COPY.scope;
$('cta-label').innerHTML = COPY.cta;
$('garamond').textContent = COPY.garamond;
$('unsub-text').innerHTML = COPY.unsub;
$('nav').innerHTML = COPY.nav;

place($('inbox'), F.inbox); stage.style.setProperty('--ib', F.inbox.ib + 'px');
place($('masthead'), F.masthead);
if (F.masthead) { stage.style.setProperty('--markH', F.masthead.markH + 'px'); stage.style.setProperty('--markW', F.masthead.markH * 1.872 + 'px'); stage.style.setProperty('--nav', '20px'); }
place($('kicker'), F.kicker); stage.style.setProperty('--kick', F.kicker.size + 'px');
place($('bf'), F.bf); if (F.bf.lines) $('bf').classList.add('lines');
place($('offer'), F.offer);
stage.style.setProperty('--scope', F.offer.scope + 'px'); stage.style.setProperty('--scopeGap', F.offer.scopeGap + 'px');
place($('timer'), F.timer); stage.style.setProperty('--talign', F.timer.align || 'flex-start'); stage.style.setProperty('--align', F.offer.align || 'left'); stage.style.setProperty('--cell', F.timer.cell + 'px');
place($('cta'), F.cta); stage.style.setProperty('--ctaH', F.cta.h + 'px'); stage.style.setProperty('--cta', F.cta.size + 'px');
place($('garamond'), F.garamond); if (F.garamond) stage.style.setProperty('--gar', F.garamond.size + 'px');
const U = F.unsub || F.foot;
place($('unsub'), U); stage.style.setProperty('--fine', U.fine + 'px'); stage.style.setProperty('--lockW', (U.lockW || 0) + 'px');
if (F.inbox.noPre) $('pre').style.display = 'none';
if (F.garamond && F.garamond.wrap) $('garamond').style.whiteSpace = 'normal';
if (F.offer.align === 'center' || F.unsub) $('garamond').style.textAlign = F.garamond && F.garamond.wrap ? 'left' : 'center';
if (!U.lockW) document.querySelector('.unsub .lock').style.display = 'none';
$('tags').style.display = 'none';
if (F.tag) stage.style.setProperty('--tagW', F.tag.w + 'px'); else $('tag').style.display = 'none';
if (F.burst) { place($('burst'), F.burst); stage.style.setProperty('--burstW', F.burst.w + 'px'); $('burst').style.height = F.burst.w + 'px'; } else $('burst').style.display = 'none';
$('string').setAttribute('width', F.w); $('string').setAttribute('height', F.h);

// Fit a block of big type to a width: measure at 100px, scale.
function fit(el, w) {
  el.style.fontSize = '100px';
  el.style.width = 'max-content';
  const natural = el.getBoundingClientRect().width;
  const size = (100 * w) / natural;
  el.style.width = '';
  return size;
}
{
  const s = fit($('bf'), F.bf.w); $('bf').style.fontSize = s + 'px';
  const big = $('big'); big.parentElement.style.width = 'max-content';
  const b = fit(big, F.offer.w); big.style.fontSize = b + 'px'; $('big-glow').style.fontSize = b + 'px';
  stage.style.setProperty('--glowBlur', Math.round(b * 0.09) + 'px');
}

// ---------- 3D: the product shot ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = productStudio(renderer);
key.intensity = 2.2;
key.position.set(-5, 7, 5);
const pxPerUnit = F.hero.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = (F.elev * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);

// bloom: a soft, blurred copy of the product shot, screened back over it (the dreamy halation)
const bloomEl = $('bloom'); const BS = 4;
bloomEl.width = Math.ceil(F.w / BS); bloomEl.height = Math.ceil(F.h / BS);
bloomEl.style.width = F.w + 'px'; bloomEl.style.height = F.h + 'px';
const bctx = bloomEl.getContext('2d');
const pivot = new THREE.Group();
scene.add(pivot);
const globe = castShadows(await buildObject('globe-core'));
pivot.add(globe);

// A dark product studio: black sweep, a big soft key overhead left, a long rim strip right,
// and two sale-coloured kickers, red and amber, so the chrome picks up the sign's colours.
function productStudio(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.0, 0.002, 0.01), band = vec3(0.01, 0.035, 0.16), haze = vec3(0.16, 0.22, 0.42), flo = vec3(0.002, 0.003, 0.01);
      vec3 c = mix(band, zen, smoothstep(0.0, 0.8, up));
      c = mix(c, haze, smoothstep(0.14, -0.02, up) * smoothstep(-0.25, -0.02, up));
      c = mix(c, flo, smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(7, 7, [-7, 10, 6], 16);
  card(1.1, 16, [11, 2, 1], 18, [0.92, 0.96, 1]);
  card(12, 0.7, [0, 11, -2], 12);
  card(4, 9, [3, 3, 11], 0.0);
  card(1.4, 12, [-11, 1, -3], 9, [1, 0.12, 0.08]);   // red strip, back left
  card(2.2, 2.2, [7, 7, -8], 9, [1, 0.72, 0.15]);   // amber kicker, back right
  card(14, 2.2, [0, -3, 12], 1.4, [0.75, 0.82, 1]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D atmosphere ----------
// the light behind the product: a cool blue pool, and a warm red bloom where the price sits
{
  const H = F.hero, O = $('offer').getBoundingClientRect();
  $('halo').style.background = [
    `radial-gradient(${H.d * 1.05}px ${H.d * 0.9}px at ${H.x}px ${H.y - H.d * 0.05}px, rgba(90,130,230,0.42), rgba(40,80,190,0.16) 55%, rgba(0,0,0,0) 100%)`,
    `radial-gradient(${O.width * 0.62}px ${O.height * 0.7}px at ${O.left + O.width / 2}px ${O.top + O.height * 0.42}px, rgba(255,60,30,0.20), rgba(200,20,40,0.08) 60%, rgba(0,0,0,0) 100%)`,
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
  for (let i = 0; i < 60; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, s = 0.6 + rnd() * rnd() * 2.4;
    d.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(235,235,225,0.35)';
    d.beginPath(); d.ellipse(x, y, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
}
const grain = $('grain');

// sale sparkles: GME's four-point stars, twinkling round the price
const STAR4 = 'M0,-1 C0.08,-0.25 0.25,-0.08 1,0 C0.25,0.08 0.08,0.25 0,1 C-0.08,0.25 -0.25,0.08 -1,0 C-0.25,-0.08 -0.08,-0.25 0,-1Z';
const SPARKS = (F.sparks || []).map(([fx, fy, size, phase, color]) => {
  const O = $('big').getBoundingClientRect();
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', '-1 -1 2 2');
  el.innerHTML = `<path d="${STAR4}" fill="${color || '#fff6c8'}"/>`;
  $('sparks').append(el);
  return { el, x: O.left + fx * O.width, y: O.top + fy * O.height, size, phase };
});

// marks must be decoded before ready
await Promise.all(['gme-primary', 'wire-globe'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// one four-point star glint on the chrome, once per loop
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintEl = $('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINT = { at: onSphere(1.03, 34, 200), t0: 3.6, life: 1.0, size: F.hero.d * 0.2 };
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

const pad = (n) => String(n).padStart(2, '0');
const hh = $('hh'), mm = $('mm'), ss = $('ss'), sheen = $('sheen'), big = $('big-glow');

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  // the product turns a little on its stand, and the missing 30% breathes in and out
  pivot.rotation.y = ((F.yaw0 + 10 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = Math.sin(TAU * u * 2) * 0.02;
  // the removed wedge floats off to one side, in world terms, whatever the globe's turn
  if (F.out > 0) {
    const w = new THREE.Vector3(F.sx + 0.04 * Math.sin(TAU * u + 1.2), F.lift + 0.05 * Math.sin(TAU * u * 2 + 0.5), F.sz);
    w.applyAxisAngle(new THREE.Vector3(0, 1, 0), -pivot.rotation.y - globe.rotation.y);
    globe.userData.slice.position.copy(w);
    globe.userData.slice.rotation.y = F.spin * Math.PI / 180 + 0.12 * Math.sin(TAU * u);
  } else globe.userData.slice.visible = false;
  scene.environmentRotation.y = 0.3 * Math.sin(TAU * u + 0.8);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  // the countdown really counts: 23:59:59 at the top of the loop, twelve seconds later 23:59:48
  const left = 86399 - Math.floor(t);
  hh.textContent = pad(Math.floor(left / 3600)); mm.textContent = pad(Math.floor(left / 60) % 60); ss.textContent = pad(left % 60);

  // a sheen crosses the button twice a loop
  const sp = (u * 2) % 1, sx = -30 + sp * 260;
  sheen.style.left = sx + '%';
  sheen.style.opacity = sp < 0.55 ? 1 : 0;

  // the price glows like a lit sign, breathing slowly
  big.style.opacity = (0.5 + 0.12 * Math.sin(TAU * u * 2)).toFixed(3);

  let p = (t - GLINT.t0) / GLINT.life;
  const on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  // the swing tag sways on its thread, hung from the globe's top pole
  if (F.tag) {
    const top = toScreen(new THREE.Vector3(0, 1.02, 0));
    const sway = 6 * Math.sin(TAU * u * 2 + 0.4);
    const tx = F.tag.x + sway * 2, ty = F.tag.y;
    const tag = $('tag');
    tag.style.left = (tx - F.tag.w / 2) + 'px'; tag.style.top = ty + 'px';
    tag.style.transform = `rotate(${(4 + sway).toFixed(2)}deg)`;
    const hx = tx, hy = ty + F.tag.w * 0.11;
    $('string-path').setAttribute('d', `M${top.x.toFixed(1)},${top.y.toFixed(1)} Q${((top.x + hx) / 2).toFixed(1)},${(Math.max(top.y, hy) + 40).toFixed(1)} ${hx.toFixed(1)},${hy.toFixed(1)}`);
  }

  // the starburst turns one point-step per loop and throbs like a sticker on a lit window
  if (F.burst) {
    const N = 18, step = 360 / N;
    const pts = (k, rot) => Array.from({ length: N * 2 }, (_, i) => { const a = ((i * step / 2 + rot) * Math.PI) / 180, rr = i % 2 ? 0.8 : 1; return `${(Math.sin(a) * rr * k).toFixed(4)},${(-Math.cos(a) * rr * k).toFixed(4)}`; }).join(' ');
    const rot = step * u;
    $('burst-front').setAttribute('points', pts(0.94, rot));
    $('burst-back').setAttribute('points', pts(1.0, rot + step / 4));
    $('burst').style.transform = `rotate(${F.burst.rot + 2.5 * Math.sin(TAU * u * 2)}deg) scale(${(1 + 0.025 * Math.sin(TAU * u * 4)).toFixed(4)})`;
  }

  for (const S of SPARKS) {
    const k = Math.max(0, Math.sin(TAU * (u * 2 + S.phase))) ** 3;
    S.el.style.cssText = `left:${S.x - S.size / 2}px;top:${S.y - S.size / 2}px;width:${S.size}px;height:${S.size}px;opacity:${k.toFixed(3)};transform:scale(${(0.3 + 0.7 * k).toFixed(3)}) rotate(${(u * 180).toFixed(1)}deg);filter:drop-shadow(0 0 10px rgba(255,220,120,0.9))`;
  }

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  renderer.render(scene, camera);
  bctx.clearRect(0, 0, bloomEl.width, bloomEl.height);
  bctx.filter = 'blur(7px) brightness(1.3)';
  bctx.drawImage(canvas, 0, 0, bloomEl.width, bloomEl.height);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
