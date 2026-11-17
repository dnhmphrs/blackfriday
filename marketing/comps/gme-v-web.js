// Black Friday homepage hero for a big-box retailer, the way they looked in 2006: a red sunburst
// background with light rays, Impact-style BLACK FRIDAY in chrome with a mirror reflection, a
// red-and-yellow starburst, a round dayglo price sticker, a glossy gel SHOP NOW! button, a
// scrolling marquee and sparkles. The store is Gary Mustard Enterprises; the product is the
// internet: the chrome cut globe, shot on a wet floor.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';
import { onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format. x is a centre, y a top, w a width (type is fitted to it).
// hero: the globe's centre on screen and its diameter; the wet floor starts under it.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    logo: { x: 540, y: 250, w: 220 },
    bf: { x: 540, y: 386, w: 980, h: 392, stretch: 1.4, rows: ['Black', 'Friday'], stroke: 12, ext: 11 },
    sub: null,
    hero: { x: 610, y: 1028, d: 420 },
    burst: { x: 240, y: 955, w: 480, rot: -9, txtW: 0.6 },
    sticker: { x: 906, y: 1150, d: 236, rot: 14 },
    info: { x: 540, y: 1262, size: 44 },
    cta: { x: 540, y: 1322, w: 640, h: 104, size: 60 },
    ticker: { y: 1462, h: 88, size: 47 },
    extra: { y: 1604, h: 92, size: 40 },
  },
  '1x1': {
    w: 1080, h: 1080,
    logo: { x: 540, y: 26, w: 170 },
    bf: { x: 540, y: 120, w: 1010, rows: ['Black Friday'], stroke: 14, ext: 11 },
    sub: null,
    hero: { x: 640, y: 560, d: 340 },
    burst: { x: 258, y: 548, w: 450, rot: -9, txtW: 0.6 },
    sticker: { x: 902, y: 660, d: 205, rot: 14 },
    info: { x: 540, y: 768, size: 36 },
    cta: { x: 540, y: 822, w: 520, h: 96, size: 52 },
    ticker: { y: 960, h: 80, size: 42 },
  },
  'banner-v': {
    w: 1080, h: 2025,
    logo: { x: 540, y: 48, w: 330 },
    bf: { x: 540, y: 250, w: 1010, h: 560, stretch: 1.45, rows: ['Black', 'Friday'], stroke: 16, ext: 14 },
    sub: null,
    hero: { x: 628, y: 1150, d: 500 },
    burst: { x: 250, y: 985, w: 490, rot: -9, txtW: 0.6 },
    sticker: { x: 890, y: 1318, d: 270, rot: 14 },
    info: { x: 540, y: 1468, size: 60 },
    cta: { x: 540, y: 1574, w: 860, h: 160, size: 90 },
    ticker: { y: 1808, h: 140, size: 78 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.elev = Number(q.get('elev') ?? 26);
F.yaw0 = Number(q.get('yaw') ?? -34);

const TICKER = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (id) => document.getElementById(id);
const px = (n) => n.toFixed(2) + 'px';

// ---------- fonts ----------
await Promise.all([
  '400 100px "Anton"', '400 100px "Archivo Black"', 'italic 900 60px "Libre Franklin"', '900 60px "Libre Franklin"',
].map((f) => document.fonts.load(f)));

// a bevel: one-pixel steps of dark red, then a black edge, then a soft drop
const extrude = (n, from = [190, 0, 10], to = [40, 0, 0], drop = 'rgba(0,0,0,0.6)') => {
  const s = [];
  for (let i = 1; i <= n; i++) {
    const k = i / n, c = from.map((a, j) => Math.round(a + (to[j] - a) * k));
    s.push(`${(i * 0.35).toFixed(1)}px ${i}px 0 rgb(${c.join(',')})`);
  }
  s.push(`${(n * 0.35 + 1).toFixed(1)}px ${n + 2}px 0 #000`, `0 ${n + 6}px ${n * 1.6}px ${drop}`);
  return s.join(',');
};
const rows = (list) => list.map((r) => `<span class="row"><span class="ext">${r}</span><span class="face">${r}</span></span>`).join('');

// Fit a block to a width: measure at 100px, scale.
function fit(el, w, h = Infinity) {
  el.style.fontSize = '100px';
  const r = el.getBoundingClientRect();
  const size = Math.min((100 * w) / r.width, (100 * h) / r.height);
  el.style.fontSize = size + 'px';
  return size;
}

// ---------- logo ----------
{
  const L = $('logo'), h = F.logo.w / 1.872;
  Object.assign(L.style, { left: px(F.logo.x - F.logo.w / 2), top: px(F.logo.y), width: px(F.logo.w), height: px(h) });
}

// ---------- BLACK FRIDAY ----------
const bf = $('bf');
bf.innerHTML = rows(F.bf.rows);
bf.classList.add('type');
bf.style.width = 'max-content';
const bfSize = fit(bf, F.bf.w, F.bf.h);
bf.style.setProperty('--bfStroke', F.bf.stroke + 'px');
bf.style.setProperty('--bfExt', extrude(F.bf.ext));
{
  const w0 = bf.getBoundingClientRect().width, sx = Math.min(F.bf.stretch || 1, F.bf.w / w0);
  bf.style.transformOrigin = '50% 0'; bf.style.transform = `scaleX(${sx.toFixed(4)})`;
  bf.style.left = px(F.bf.x - w0 / 2);
}
bf.style.top = px(F.bf.y);
const bfRect = bf.getBoundingClientRect();

// ---------- starburst ----------
const B = F.burst;
const burst = $('burst');
Object.assign(burst.style, { left: px(B.x - B.w / 2), top: px(B.y - B.w / 2), width: px(B.w), height: px(B.w) });
{
  const t = $('burst-txt');
  t.innerHTML = `<div class="type" id="b30">${rows(['30%'])}</div><div class="type" id="boff">${rows(['Off!'])}</div><span class="tiny">The entire internet</span>`;
  const a = $('b30'), b = $('boff');
  for (const el of [a, b]) el.style.width = 'max-content';
  const s30 = fit(a, B.w * B.txtW), sOff = fit(b, B.w * B.txtW * 0.86);
  a.style.lineHeight = b.style.lineHeight = '0.92';
  burst.style.setProperty('--bStroke', Math.round(s30 * 0.1) + 'px');
  burst.style.setProperty('--bExt', extrude(Math.round(s30 * 0.06), [120, 0, 0], [20, 0, 0], 'rgba(0,0,0,0.35)'));
  burst.style.setProperty('--tiny', Math.round(B.w * 0.042) + 'px');
  t.style.transform = `translateY(-50%) translateY(${-B.w * 0.01}px)`;
  void sOff;
}
const N_PTS = 22;
const starPts = (k, rot, inner) => Array.from({ length: N_PTS * 2 }, (_, i) => {
  const a = ((i * 180 / N_PTS + rot) * Math.PI) / 180, r = (i % 2 ? inner : 1) * k * (i % 4 === 0 ? 1 : i % 2 ? 1 : 0.93);
  return `${(Math.sin(a) * r).toFixed(4)},${(-Math.cos(a) * r).toFixed(4)}`;
}).join(' ');

// ---------- sticker ----------
const S = F.sticker;
const sticker = $('sticker');
Object.assign(sticker.style, { left: px(S.x - S.d / 2), top: px(S.y - S.d / 2), width: px(S.d), height: px(S.d) });
sticker.style.setProperty('--stkBig', Math.round(S.d * 0.27) + 'px');
sticker.style.setProperty('--stkSmall', Math.round(S.d * 0.074) + 'px');
// sticker = unit circle; the peel folds the part beyond a chord at x = c back over itself
function peel(c) {
  const s = Math.sqrt(1 - c * c);
  $('stk-body').setAttribute('d', `M${c},${-s} A1 1 0 1 0 ${c},${s} Z`);
  $('stk-flap').setAttribute('d', `M${c},${-s} A1 1 0 0 0 ${c},${s} Z`);
}
$('stk-rot').setAttribute('transform', 'rotate(38)');
sticker.querySelector('svg').setAttribute('viewBox', '-1 -1 2 2');

// ---------- info line, button ----------
{
  const I = $('info');
  I.innerHTML = '<span class="y">One day only!</span><span class="dot">★</span>Fri 27 Nov';
  I.style.fontSize = F.info.size + 'px';
  I.style.left = '0px'; I.style.width = F.w + 'px'; I.style.top = px(F.info.y);
  const C = $('cta');
  Object.assign(C.style, { left: px(F.cta.x - F.cta.w / 2), top: px(F.cta.y), width: px(F.cta.w), height: px(F.cta.h) });
  C.style.setProperty('--ctaSize', F.cta.size + 'px');
  $('cta-label').innerHTML = 'Shop now!<span class="arr">»</span>';
}

// ---------- a second, static red band under the marquee (tall formats) ----------
if (F.extra) {
  const X = document.createElement('div');
  X.className = 'extra'; X.id = 'extra';
  X.innerHTML = '<span>Doorbuster!</span><i>★</i><span class="y">Hurry!</span><i>★</i><span>Limited time</span>';
  Object.assign(X.style, { top: px(F.extra.y), height: px(F.extra.h) });
  X.style.setProperty('--exSize', F.extra.size + 'px');
  $('sparks').before(X);
}

// ---------- ticker ----------
const T = F.ticker;
const ticker = $('ticker'), track = $('track');
Object.assign(ticker.style, { top: px(T.y), height: px(T.h) });
ticker.style.setProperty('--tkSize', T.size + 'px');
ticker.style.setProperty('--tkB', Math.max(4, Math.round(T.h * 0.07)) + 'px');
const seqHTML = `<div class="seq">${TICKER.map((l) => `<span>${l}</span><i>★</i>`).join('')}</div>`;
track.innerHTML = seqHTML;
const SEQ_W = track.firstChild.getBoundingClientRect().width;
track.innerHTML = seqHTML.repeat(Math.ceil(F.w / SEQ_W) + 2);
const TK_LAPS = Math.max(1, Math.round((T.h * 2.4 * DURATION) / SEQ_W)); // whole sequences per loop

// ---------- background: red sunburst, rays, wet floor ----------
const H = F.hero;
const floorY = H.y + H.d / 2 + 2;
$('bg').style.background = [
  `radial-gradient(${F.w * 0.95}px ${F.h * 0.62}px at ${H.x}px ${H.y - H.d * 0.15}px, #ff3a1c 0%, #e8000e 26%, #a00009 52%, #4a0004 78%, #1a0002 100%)`,
].join(',');
const rays = $('rays');
const RAY = 12; // degrees per ray pair
rays.style.webkitMaskImage = rays.style.maskImage = `radial-gradient(${F.w * 0.9}px ${F.w * 0.9}px at ${H.x}px ${H.y}px, #000 0%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0) 85%)`;
{
  const fl = $('floor');
  fl.style.top = px(floorY);
  fl.style.background = 'linear-gradient(180deg, rgba(40,0,3,0.55) 0%, rgba(20,0,2,0.82) 30%, rgba(8,0,1,0.94) 100%)';
  fl.style.boxShadow = '0 -1px 0 rgba(255,140,110,0.35)';
  const c = $('contact');
  Object.assign(c.style, { left: px(H.x - H.d * 0.42), top: px(floorY - H.d * 0.05), width: px(H.d * 0.84), height: px(H.d * 0.1) });
  $('halo').style.background = `radial-gradient(${H.d * 0.75}px ${H.d * 0.75}px at ${H.x}px ${H.y}px, rgba(255,230,180,0.45), rgba(255,120,60,0.18) 50%, rgba(0,0,0,0) 100%)`;
}

// ---------- 3D: the product on a wet floor ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = showroom(renderer);
key.intensity = 2.4;
key.position.set(-5, 7, 5);
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
// the lettered cut faces: printed vinyl, not a mirror, so they keep their sign colours
globe.traverse((o) => { if (o.isMesh && o.material && o.material.map) { o.material.envMapIntensity = 0.55; o.material.clearcoat = 1.0; o.material.clearcoatRoughness = 0.04; o.material.roughness = 0.3; o.material.needsUpdate = true; } });
pivot.add(globe);

const refl = $('refl');
refl.width = F.w; refl.height = F.h;
refl.style.width = F.w + 'px'; refl.style.height = F.h + 'px';
const rctx = refl.getContext('2d');

// A bright showroom: red sweep like the page behind it, white softboxes, a yellow kicker,
// so the chrome carries the sale colours.
function showroom(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.03, 0.02, 0.03), band = vec3(0.2, 0.12, 0.13), hor = vec3(1.2, 0.9, 0.8), flo = vec3(0.015, 0.01, 0.012);
      vec3 c = mix(band, zen, smoothstep(0.1, 0.9, up));
      c = mix(c, hor, smoothstep(0.16, 0.0, up) * smoothstep(-0.2, 0.0, up));
      c = mix(c, flo, smoothstep(-0.04, -0.5, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(8, 8, [-7, 9, 7], 14);
  card(1.2, 16, [11, 2, 2], 16);
  card(12, 0.8, [0, 11, -2], 10);
  card(3, 3, [7, 6, -8], 10, [1, 0.8, 0.1]);
  card(1.4, 12, [-11, 1, -4], 8, [1, 0.85, 0.2]);
  card(14, 2.4, [0, -3, 12], 1.6);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- sparkles ----------
const STAR4 = 'M0,-1 C0.08,-0.25 0.25,-0.08 1,0 C0.25,0.08 0.08,0.25 0,1 C-0.08,0.25 -0.25,0.08 -1,0 C-0.25,-0.08 -0.08,-0.25 0,-1Z';
const sparkRnd = mulberry(1127);
const SPARKS = [];
{
  // a fixed scatter of twinkles around the type and the product
  const spots = [
    [bfRect.left + bfRect.width * 0.04, bfRect.top + bfRect.height * 0.06, 1.0],
    [bfRect.right - bfRect.width * 0.03, bfRect.top + bfRect.height * 0.5, 0.8],
    [bfRect.left + bfRect.width * 0.33, bfRect.top + bfRect.height * 0.5, 0.7],
    [H.x + H.d * 0.42, H.y - H.d * 0.42, 1.1],
    [H.x - H.d * 0.08, H.y - H.d * 0.55, 0.6],
    [H.x + H.d * 0.55, H.y + H.d * 0.05, 0.7],
    [B.x - B.w * 0.46, B.y + B.w * 0.3, 0.8],
    [S.x - S.d * 0.5, S.y - S.d * 0.45, 0.7],
    [F.w * 0.08, floorY + H.d * 0.08, 0.6],
    [F.w * 0.94, F.logo.y + 40, 0.7],
  ];
  const unit = F.w * 0.075;
  for (const [x, y, k] of spots) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '-1 -1 2 2');
    el.innerHTML = `<path d="${STAR4}" fill="#fffbe0"/>`;
    $('sparks').append(el);
    SPARKS.push({ el, x, y, size: unit * k, phase: sparkRnd() });
  }
}

// glint on the chrome
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintEl = $('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINTS = [{ at: onSphere(1.03, 38, 200), t0: 2.2 }, { at: onSphere(1.03, -20, 150), t0: 8.1 }];
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;

  // the product turns slowly on the showroom floor and bobs a touch
  pivot.rotation.y = ((F.yaw0 + 12 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = 0.025 * Math.sin(TAU * u * 2);
  scene.environmentRotation.y = 0.25 * Math.sin(TAU * u + 0.8);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();
  renderer.render(scene, camera);

  // wet floor: the shot, flipped about the floor line, fading out
  rctx.clearRect(0, 0, F.w, F.h);
  rctx.save();
  rctx.beginPath(); rctx.rect(0, floorY, F.w, F.h - floorY); rctx.clip();
  rctx.translate(0, 2 * floorY); rctx.scale(1, -1);
  rctx.drawImage(canvas, 0, 0);
  rctx.restore();
  rctx.save();
  rctx.globalCompositeOperation = 'destination-in';
  const fade = rctx.createLinearGradient(0, floorY, 0, floorY + H.d * 0.6);
  fade.addColorStop(0, 'rgba(0,0,0,0.62)'); fade.addColorStop(1, 'rgba(0,0,0,0)');
  rctx.fillStyle = fade; rctx.fillRect(0, 0, F.w, F.h);
  rctx.restore();

  // light rays turn two rays per loop
  const ra = -90 + RAY * 2 * u;
  rays.style.background = `repeating-conic-gradient(from ${ra.toFixed(3)}deg at ${H.x}px ${H.y}px, rgba(255,220,140,0.30) 0deg ${RAY * 0.42}deg, rgba(255,220,140,0) ${RAY * 0.5}deg ${RAY}deg)`;

  // the starburst turns one point-step per loop and throbs
  const step = 360 / N_PTS;
  const br = step * u;
  $('burst-shadow').setAttribute('points', starPts(1.0, br, 0.8));
  $('burst-shadow').setAttribute('transform', 'translate(0.05 0.07)');
  $('burst-outer').setAttribute('points', starPts(1.0, br, 0.8));
  $('burst-inner').setAttribute('points', starPts(0.8, br + step / 2, 0.86));
  burst.style.transform = `rotate(${(B.rot + 3 * Math.sin(TAU * u * 2)).toFixed(3)}deg) scale(${(1 + 0.035 * Math.sin(TAU * u * 4)).toFixed(4)})`;

  // the sticker: a slight peel that lifts and settles
  peel(0.78 - 0.03 * (0.5 + 0.5 * Math.sin(TAU * u * 2 + 1)));
  sticker.style.transform = `rotate(${S.rot}deg)`;

  // a sheen crosses the gel button twice a loop
  const sp = (u * 2) % 1;
  $('sheen').style.left = (-30 + sp * 260).toFixed(2) + '%';
  $('sheen').style.opacity = sp < 0.55 ? 1 : 0;

  // the marquee: whole sequences per loop, so it joins up
  // phased so the hero frame (frame 12) opens on the first line in full
  const off = ((((u - 12 / (DURATION * FPS)) * TK_LAPS * SEQ_W - 24) % SEQ_W) + SEQ_W) % SEQ_W;
  track.style.transform = `translate3d(${(-off).toFixed(2)}px,0,0)`;

  for (const Sp of SPARKS) {
    const k = Math.max(0, Math.sin(TAU * (u * 3 + Sp.phase))) ** 3;
    Sp.el.style.cssText = `left:${px(Sp.x - Sp.size / 2)};top:${px(Sp.y - Sp.size / 2)};width:${px(Sp.size)};height:${px(Sp.size)};opacity:${k.toFixed(3)};transform:scale(${(0.25 + 0.75 * k).toFixed(3)}) rotate(${(u * 90).toFixed(1)}deg);filter:drop-shadow(0 0 8px rgba(255,240,170,0.95))`;
  }

  let shown = false;
  for (const G of GLINTS) {
    const p = (t - G.t0) / 1.0;
    if (p < 0 || p > 1) continue;
    const k = Math.sin(p * Math.PI) ** 1.5, g = toScreen(G.at), size = H.d * 0.22;
    glintSvg.style.cssText = `left:${px(g.x - size / 2)};top:${px(g.y - size / 2)};width:${px(size)};height:${px(size)};opacity:1;transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;
    shown = true;
  }
  if (!shown) glintSvg.style.opacity = 0;
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0));
window.ready = true;
