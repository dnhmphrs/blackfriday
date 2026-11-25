// In-store Black Friday signage, photographed. A phone snap of GME's end-cap in a big-box
// store: the printed red header card, a scrolling red LED sign, a starburst hanging on fishing
// line, a dayglo dot slapped on the shelf, and the product itself, the chrome cut globe, going
// round on a display turntable under the fluorescent tubes.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows, materials, canvasTexture } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Everything is laid out in screen px. The camera looks straight at the end-cap; (x0, y0) is
// the screen point straight ahead of the lens, k is px per world unit on the shelf-front plane.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, k: 190, x0: 540, y0: 905, fov: 48, tilt: -1.3,
    card: { x: 26, y: 262, w: 1028, h: 640, band: 64, logo: 134,
      lines: [['bf', 'Black Friday', 940, 210], ['off', '30<span class="pc">%</span> OFF', 960, 300], ['scope', 'The entire internet!', 760, 78]],
      gap: 4, bandText: 'Every website <span class="s">★</span> One day only <span class="s">★</span> Fri 27 Nov', bandSize: 44 },
    led: { x: 40, y: 910, w: 1000, h: 112, rows: 16 },
    shelves: [{ y: 1484, lip: 78 }, { y: 1935, lip: 70 }],
    depth: 2.8,
    hero: { x: 500, d: 316 },
    globes: [],
    // [x, base y, w, h, z of the front face, turn] in px on that face's plane
    boxes: [[150, 1484, 270, 300, -0.3, 0.1], [60, 1935, 250, 250, -0.6, 0], [325, 1935, 250, 250, -0.8, 0.06], [590, 1935, 250, 250, -0.6, -0.04], [855, 1935, 250, 250, -0.7, 0.05], [1120, 1935, 250, 250, -0.6, 0]],
    burst: { x: 862, y: 1052, w: 400, rot: 9, words: ['Door', 'buster!'], small: 'Hurry!' },
    sticker: { box: 0, dx: 6, dy: 4, d: 236, rot: -13 },
    labels: [{ x: 610, w: 320, size: 44 }],
    dots: [{ x: 355, y: 1522, d: 100, c: '#ffee00', t: 'HURRY!' }, { x: 875, y: 1524, d: 104, c: '#ff2fa8', t: '30%<br>OFF' }, { x: 990, y: 1518, d: 92, c: '#39ff3c', t: 'SALE' }],
  },
  '1x1': {
    w: 1080, h: 1080, k: 160, x0: 540, y0: 560, fov: 46, tilt: -1.2,
    card: { x: 22, y: 20, w: 1036, h: 436, band: 0, logo: 86,
      lines: [['bf', 'Black Friday', 900, 150], ['off', '30<span class="pc">%</span> OFF', 940, 230]],
      gap: 2 },
    led: { x: 40, y: 468, w: 1000, h: 92, rows: 16 },
    shelves: [{ y: 962, lip: 64 }],
    depth: 2.8,
    hero: { x: 480, d: 270 },
    globes: [],
    boxes: [[140, 962, 250, 280, -0.3, 0.1]],
    burst: { x: 860, y: 590, w: 340, rot: 9, words: ['Door', 'buster!'], small: 'Hurry!' },
    sticker: { box: 0, dx: 6, dy: 0, d: 220, rot: -13 },
    labels: [{ x: 600, w: 290, size: 38 }],
    dots: [{ x: 880, y: 994, d: 84, c: '#ff2fa8', t: '30%<br>OFF' }, { x: 990, y: 990, d: 76, c: '#39ff3c', t: 'SALE' }],
  },
  'banner-v': {
    w: 1080, h: 2025, k: 200, x0: 540, y0: 1180, fov: 48, tilt: -1.2,
    card: { x: 26, y: 40, w: 1028, h: 1060, band: 84, logo: 150, fitH: true,
      lines: [['bf', 'Black', 900, 250], ['bf', 'Friday', 940, 250], ['off', '30<span class="pc">%</span> OFF', 980, 330], ['scope', 'The entire internet!', 860, 92]],
      gap: 0, bandText: 'Every website <span class="s">★</span> One day only', bandSize: 60 },
    led: { x: 36, y: 1116, w: 1008, h: 150, rows: 14 },
    shelves: [{ y: 1800, lip: 84 }],
    depth: 2.8,
    hero: { x: 490, d: 380 },
    globes: [],
    boxes: [[150, 1800, 280, 320, -0.3, 0.1], [120, 2250, 270, 270, -0.6, 0], [400, 2250, 270, 270, -0.8, 0.05], [680, 2250, 270, 270, -0.6, -0.04], [960, 2250, 270, 270, -0.7, 0.03]],
    burst: { x: 860, y: 1330, w: 360, rot: 9, words: ['Door', 'buster!'], small: 'Hurry!' },
    sticker: { box: 0, dx: 6, dy: 4, d: 250, rot: -13 },
    labels: [{ x: 640, w: 360, size: 50 }],
    dots: [{ x: 935, y: 1846, d: 120, c: '#ff2fa8', t: '30%<br>OFF' }],
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const photo = document.getElementById('photo');
photo.style.width = F.w + 'px';
photo.style.height = F.h + 'px';
photo.style.transform = `rotate(${F.tilt}deg) scale(1.045)`;

const $ = (id) => document.getElementById(id);
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const box = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w != null) el.style.width = w + 'px'; if (h != null) el.style.height = h + 'px'; };

// ---------- fonts ----------
await Promise.all(['400 100px "Anton"', '400 100px "Archivo Black"', '600 40px "Oswald"', '700 40px "Oswald"', '800 40px "Libre Franklin"', '900 40px "Libre Franklin"', '900 40px "Inter"']
  .map((f) => document.fonts.load(f)));

// ---------- the header card ----------
const card = $('card');
box(card, F.card.x, F.card.y, F.card.w, F.card.h);
// the card's chrome clips in its holder
box($('clip-l'), F.card.x + F.card.w * 0.16 - 17, F.card.y - 26);
box($('clip-r'), F.card.x + F.card.w * 0.84 - 17, F.card.y - 26);
const extrude = (n, dx, dy, col) => Array.from({ length: n }, (_, i) => `${((i + 1) * dx).toFixed(2)}px ${((i + 1) * dy).toFixed(2)}px 0 ${col}`).join(',');
{
  const C = F.card, inner = C.w - 18;
  const bodyH = C.h - 18 - C.logo - (C.band || 0);
  const body = $('card-body');
  body.style.height = bodyH + 'px';
  body.style.gap = C.gap + 'px';
  const els = C.lines.map(([cls, html, w, max]) => {
    const el = document.createElement('div');
    el.className = 'line ' + cls;
    el.innerHTML = html;
    body.append(el);
    el.style.fontSize = '100px';
    const nat = el.getBoundingClientRect().width;
    return { el, cls, size: Math.min(max, (100 * w) / nat) };
  });
  const apply = (f) => { for (const L of els) {
    const size = L.size * f; L.el.style.fontSize = size + 'px';
    if (L.cls === 'bf') L.el.style.textShadow = extrude(Math.round(size * 0.05), 0.55, 0.85, '#000') + `, 0 ${size * 0.08}px ${size * 0.06}px rgba(0,0,0,0.35)`;
    if (L.cls === 'off') L.el.style.textShadow = extrude(Math.round(size * 0.06), 0.6, 0.9, '#000') + `, 0 ${size * 0.09}px ${size * 0.08}px rgba(60,0,0,0.5)`;
  } };
  apply(1);
  // and fit the stack to the card's height (the extrusion hangs below each line)
  const used = els.reduce((a, L) => a + L.el.getBoundingClientRect().height, 0) + C.gap * (els.length - 1);
  if (C.fitH && used > bodyH * 0.97) apply((bodyH * 0.97) / used);
  const band = $('band');
  if (C.band) { band.innerHTML = C.bandText; band.style.top = (bodyH) + 'px'; band.style.height = C.band + 'px'; band.style.fontSize = C.bandSize + 'px'; }
  else band.style.display = 'none';
  const lb = card.querySelector('.logo-band');
  lb.style.height = C.logo + 'px';
  const logo = card.querySelector('.logo');
  const lh = C.logo * 0.88;
  logo.style.height = lh + 'px'; logo.style.width = (lh * 1142 / 610) + 'px';
  // the laminate reflects a fluorescent tube: a soft bright diagonal streak
  card.querySelector('.glare').style.background = `linear-gradient(104deg, rgba(255,255,255,0) 55%, rgba(255,255,255,0.22) 61%, rgba(255,255,255,0.75) 64.5%, rgba(255,255,255,0.22) 68%, rgba(255,255,255,0) 76%)`;
  card.querySelector('.rays').style.background = `repeating-conic-gradient(from 0deg at 50% ${50 + 4}%, rgba(255,70,40,0) 0deg 6deg, rgba(110,0,10,0.3) 6deg 12deg)`;
}

// ---------- 3D: the end-cap, shot head-on ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: F.fov });
renderer.toneMappingExposure = 1.0;
scene.environment = storeLights(renderer);
// fluorescent tubes overhead: the shadow falls almost straight down, a little back
key.position.set(1.2, 9, 3.2);
key.intensity = 2.1;
key.shadow.radius = 14;
const sc = key.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8;
scene.add(new THREE.HemisphereLight(0xf4fbff, 0x3a3a38, 0.35));

const dist = F.h / (2 * Math.tan((F.fov * Math.PI) / 360) * F.k);
camera.position.set(0, 0, dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.x0, F.h / 2 - F.y0, F.w, F.h);
camera.updateMatrixWorld();
// screen px -> world, on the plane z
const WX = (px, z = 0) => ((px - F.x0) * (dist - z)) / (F.k * dist);
const WY = (py, z = 0) => ((F.y0 - py) * (dist - z)) / (F.k * dist);
const toScreen = (v) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

const D = F.depth;
const spanX = (F.w / F.k) * (dist + D) / dist + 4;
// the back panel: white pegboard, the shop-fitting every big-box store has
const peg = canvasTexture(512, (g, n) => {
  g.fillStyle = '#c4c7c3'; g.fillRect(0, 0, n, n);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const cx = (x + 0.5) * n / 8, cy = (y + 0.5) * n / 8;
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(cx + 1.5, cy + 2, 6.5, 0, TAU); g.fill();
    g.fillStyle = '#4a4c4b'; g.beginPath(); g.arc(cx, cy, 6, 0, TAU); g.fill();
  }
});
peg.wrapS = peg.wrapT = THREE.RepeatWrapping;
{
  const topY = WY(F.card.y + F.card.h, -D) + 0.5, botY = WY(F.h + 200, -D);
  const hgt = topY - botY;
  peg.repeat.set(spanX / 0.9, hgt / 0.9);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(spanX, hgt), new THREE.MeshStandardMaterial({ map: peg, roughness: 0.75, metalness: 0, envMapIntensity: 0.6 }));
  back.position.set(0, (topY + botY) / 2, -D);
  back.receiveShadow = true;
  scene.add(back);
}
// shelves: off-white powder-coated steel decks
const deckMat = new THREE.MeshStandardMaterial({ color: 0xdfe2e1, roughness: 0.45, metalness: 0.25, envMapIntensity: 0.8 });
const shelfY = F.shelves.map((s) => WY(s.y));
for (const s of F.shelves) {
  const th = s.lip / F.k, y = WY(s.y);
  const m = new THREE.Mesh(new THREE.BoxGeometry(spanX, th, D), deckMat);
  m.position.set(0, y - th / 2, -D / 2);
  m.receiveShadow = true; m.castShadow = true;
  scene.add(m);
}

// the product, several times: the hero on a turntable, stock beside it on desk stands
const standMat = materials.gloss(0x0b0b0c);
const chromeMat = materials.chrome();
function stand(R, turntable) {
  const g = new THREE.Group();
  let y = 0;
  if (turntable) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.95 * R, 1.0 * R, 0.1 * R, 96), standMat);
    t.position.y = 0.05 * R; g.add(t);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.975 * R, 0.012 * R, 12, 96), chromeMat);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.1 * R; g.add(rim);
    y = 0.1 * R;
  }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * R, 0.5 * R, 0.1 * R, 64), standMat);
  base.position.y = y + 0.05 * R; g.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * R, 0.05 * R, 0.24 * R, 24), chromeMat);
  stem.position.y = y + 0.1 * R + 0.12 * R; g.add(stem);
  g.userData.top = y + 0.34 * R;
  return castShadows(g, true);
}
async function product({ x, d, yaw = 0, turntable = false, shelf = 0, z = -D * 0.48 }) {
  const R = (d * (dist - z)) / (2 * F.k * dist);
  const holder = new THREE.Group();
  const st = stand(R, turntable);
  holder.add(st);
  const globe = castShadows(await buildObject('globe-core'));
  globe.userData.slice.visible = false;
  globe.scale.setScalar(R);
  const spin = new THREE.Group();
  spin.position.y = st.userData.top + R;
  spin.add(globe);
  holder.add(spin);
  holder.position.set(WX(x, z), shelfY[shelf], z);
  spin.rotation.y = (yaw * Math.PI) / 180;
  scene.add(holder);
  return { holder, spin, globe, R };
}
const hero = await product({ ...F.hero, turntable: true });
for (const gspec of F.globes) await product(gspec);

// boxed stock on the shelf below: blue cartons printed with the product
if (F.boxes) {
  const face = canvasTexture(512, (g, n) => {
    const grd = g.createLinearGradient(0, 0, 0, n); grd.addColorStop(0, '#1747ff'); grd.addColorStop(1, '#0a26b8');
    g.fillStyle = grd; g.fillRect(0, 0, n, n);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 7;
    const cx = n / 2, cy = n * 0.5, r = n * 0.2;
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    for (const e of [0.35, 0.72]) { g.beginPath(); g.ellipse(cx, cy, r * e, r, 0, 0, TAU); g.stroke(); }
    for (const yy of [-0.5, 0, 0.5]) { const ww = r * Math.sqrt(1 - yy * yy); g.beginPath(); g.moveTo(cx - ww, cy + yy * r); g.lineTo(cx + ww, cy + yy * r); g.stroke(); }
    g.fillStyle = '#fff'; g.textAlign = 'center';
    g.font = '400 92px "Anton"'; g.fillText('THE INTERNET', n / 2, n * 0.2);
    g.font = '400 44px "Anton"'; g.fillStyle = '#ffe600'; g.fillText('(ALL OF IT)', n / 2, n * 0.29);
    g.font = '800 30px "Libre Franklin"'; g.fillStyle = '#fff'; g.fillText('As seen on every website', n / 2, n * 0.84);
    g.fillStyle = '#e5001c'; g.fillRect(0, n * 0.88, n, n * 0.12);
    g.font = '400 44px "Anton"'; g.fillStyle = '#fff'; g.fillText('NOW 30% OFF', n / 2, n * 0.97);
  });
  const side = new THREE.MeshStandardMaterial({ color: 0x0b2ccc, roughness: 0.6 });
  const front = new THREE.MeshStandardMaterial({ map: face, roughness: 0.55 });
  for (const [x, base, w, h, z, ry] of F.boxes) {
    const s = (dist - z) / (F.k * dist), bw = w * s, bh = h * s, bd = 1.3;
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [side, side, side, side, front, side]);
    // stood on the deck whose front edge is at screen y = base
    m.position.set(WX(x, z), WY(base) + bh / 2, z - bd / 2);
    m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
}

// The store as chrome sees it: rows of fluorescent tubes overhead, white walls, and the
// coloured aisles of everything else for sale all around.
function storeLights(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 ceil = vec3(0.16, 0.17, 0.17), wall = vec3(0.07, 0.075, 0.075), flo = vec3(0.035, 0.035, 0.035);
      vec3 c = mix(wall, ceil, smoothstep(0.05, 0.4, up));
      c = mix(c, flo, smoothstep(-0.02, -0.3, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1], rotX = null) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    if (rotX != null) m.rotation.x = rotX; else m.lookAt(0, 0, 0);
    env.add(m); return m;
  };
  // troffers: long bright rows across the ceiling, running away from the camera
  for (const x of [-12, -4, 4, 12]) for (const z of [-24, -14, -4, 6, 16]) card(1.2, 4.5, [x, 9, z], 14, [0.95, 1, 1], Math.PI / 2);
  // the aisles: bands of colour at shelf height, all the way round
  const cols = [[1, 0.1, 0.08], [1, 0.8, 0.1], [0.1, 0.3, 1], [1, 1, 1], [0.1, 0.7, 0.3], [1, 0.4, 0.1]];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU, rr = 22;
    const c = cols[i % cols.length];
    card(5, 1.6, [Math.sin(a) * rr, 0.4 + (i % 3) * 1.6, Math.cos(a) * rr], 1.6, c);
  }
  card(10, 6, [0, 2, 18], 0.15);   // the shopper (the camera) is a dark shape
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- the store behind: ceiling tiles and troffers in perspective ----------
{
  const c = $('store'); c.width = F.w; c.height = F.h;
  c.style.width = F.w + 'px'; c.style.height = F.h + 'px';
  const g = c.getContext('2d');
  const P = (X, Y, Z) => { const s = (F.k * dist) / (dist - Z); return [F.x0 + X * s, F.y0 - Y * s]; };
  const grd = g.createLinearGradient(0, 0, 0, F.h); grd.addColorStop(0, '#c9cdca'); grd.addColorStop(0.5, '#8d918f'); grd.addColorStop(1, '#5d605f');
  g.fillStyle = grd; g.fillRect(0, 0, F.w, F.h);
  const CY = 6.2;
  g.strokeStyle = 'rgba(80,85,85,0.55)'; g.lineWidth = 2;
  for (let X = -40; X <= 40; X += 2) { const a = P(X, CY, -2), b = P(X, CY, -90); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
  for (let Z = -2; Z > -90; Z -= 2) { const a = P(-40, CY, Z), b = P(40, CY, Z); g.lineWidth = Math.max(0.6, 2.4 * 10 / (10 - Z)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
  // the fluorescent troffers, glowing
  g.save();
  for (const X of [-9, -3, 3, 9]) for (let Z = -3; Z > -90; Z -= 8) {
    const q4 = [P(X - 0.6, CY - 0.02, Z), P(X + 0.6, CY - 0.02, Z), P(X + 0.6, CY - 0.02, Z - 3.6), P(X - 0.6, CY - 0.02, Z - 3.6)];
    g.shadowColor = 'rgba(235,255,250,0.95)'; g.shadowBlur = 40 * 10 / (10 - Z);
    g.fillStyle = '#fbfffe';
    g.beginPath(); q4.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.closePath(); g.fill();
  }
  g.restore();
  // a long soft haze where the light falls
  const hz = g.createRadialGradient(F.x0, 0, 10, F.x0, 0, F.w * 0.9);
  hz.addColorStop(0, 'rgba(255,255,250,0.35)'); hz.addColorStop(1, 'rgba(255,255,250,0)');
  g.fillStyle = hz; g.fillRect(0, 0, F.w, F.h);
}

// ---------- shelf-edge price channels, labels, dots ----------
{
  const S = $('strips');
  for (const s of F.shelves) {
    const el = document.createElement('div'); el.className = 'strip';
    box(el, -40, s.y, F.w + 80, s.lip); S.append(el);
  }
  const rnd = mulberry(91);
  for (const L of F.labels) {
    const s = F.shelves[0], el = document.createElement('div'); el.className = 'label';
    el.style.fontSize = L.size + 'px';
    const bars = Array.from({ length: 34 }, () => `<rect x="0" y="0" width="${(0.6 + rnd() * 2).toFixed(2)}" height="10"/>`);
    let x = 0; const svgBars = bars.map((b) => { const w = Number(b.match(/width="([\d.]+)"/)[1]); const out = b.replace('x="0"', `x="${x.toFixed(2)}"`); x += w + 0.6 + rnd() * 1.2; return out; }).join('');
    el.innerHTML = `<span class="n">The Internet (All Of It)</span><span class="p">30% OFF</span><svg class="bc" viewBox="0 0 ${x.toFixed(1)} 10" preserveAspectRatio="none" fill="#111">${svgBars}</svg>`;
    box(el, L.x - L.w / 2, s.y + 5, L.w, s.lip - 10); S.append(el);
  }
  for (const d of F.dots) {
    const el = document.createElement('div'); el.className = 'dot';
    el.style.background = d.c; el.style.fontSize = d.d * 0.26 + 'px'; el.innerHTML = d.t;
    box(el, d.x - d.d / 2, d.y - d.d / 2, d.d, d.d);
    el.style.transform = `rotate(${(rnd() - 0.5) * 30}deg)`;
    S.append(el);
  }
}

// the header and the LED sign shade the pegboard and the top of the shelf below them
{
  const L = F.led, el = $('hshade');
  box(el, -40, L.y + L.h - 10, F.w + 80, Math.round(F.k * 1.1));
}

// ---------- the LED sign ----------
const LED = (() => {
  const L = F.led, el = $('led');
  box(el, L.x, L.y, L.w, L.h);
  const padX = 30, padY = Math.round(L.h * 0.1);
  const fw = L.w - padX * 2, fh = L.h - padY * 2;
  const face = el.querySelector('.face'); box(face, padX, padY, fw, fh);
  const pitch = fh / L.rows, cols = Math.ceil(fw / pitch) + 1;
  // rasterise the five lines into lamp columns: draw big, average each cell, threshold
  const SS = 8, rows = L.rows;
  const raster = (text) => {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    const font = (px) => `600 ${px}px "Oswald"`;
    g.font = font(100);
    const capA = g.measureText('H').actualBoundingBoxAscent;
    const px = ((rows * 0.7) * SS * 100) / capA;
    g.font = font(px);
    g.letterSpacing = SS * 1.0 + 'px';
    const w = Math.ceil(g.measureText(text).width / SS) + 1;
    c.width = w * SS; c.height = rows * SS;
    g.font = font(px); g.letterSpacing = SS * 1.0 + 'px';
    g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
    g.fillText(text, 0, Math.round(rows * 0.82) * SS);
    const img = g.getImageData(0, 0, c.width, c.height).data;
    const out = [];
    for (let x = 0; x < w; x++) {
      const col = new Uint8Array(rows);
      for (let y = 0; y < rows; y++) {
        let s = 0;
        for (let yy = 0; yy < SS; yy++) for (let xx = 0; xx < SS; xx++) s += img[((y * SS + yy) * c.width + x * SS + xx) * 4 + 3];
        col[y] = s / (SS * SS * 255) > 0.42 ? 1 : 0;
      }
      out.push(col);
    }
    while (out.length && !out[out.length - 1].some(Boolean)) out.pop();
    return out;
  };
  const star = (() => { // a five-point star, drawn the same way
    const c = document.createElement('canvas'), n = rows * SS; c.width = c.height = n;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, rr = i % 2 ? n * 0.2 : n * 0.46; g.lineTo(n / 2 + Math.cos(a) * rr, n * 0.47 + Math.sin(a) * rr); }
    g.fill();
    const img = g.getImageData(0, 0, n, n).data, out = [];
    for (let x = 0; x < rows; x++) { const col = new Uint8Array(rows); for (let y = 0; y < rows; y++) { let s = 0; for (let yy = 0; yy < SS; yy++) for (let xx = 0; xx < SS; xx++) s += img[((y * SS + yy) * n + x * SS + xx) * 4 + 3]; col[y] = s / (SS * SS * 255) > 0.4 ? 1 : 0; } out.push(col); }
    return out;
  })();
  const LINES = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
  const blank = () => new Uint8Array(rows);
  const strip = [];
  for (const line of LINES) {
    strip.push(...raster(line));
    for (let i = 0; i < 5; i++) strip.push(blank());
    strip.push(...star);
    for (let i = 0; i < 5; i++) strip.push(blank());
  }
  const N = strip.length;
  // pre-draw the lit lamps of the whole loop (plus one screen of wrap), with their glow
  const on = document.createElement('canvas');
  on.width = Math.ceil((N + cols) * pitch); on.height = Math.ceil(fh);
  const og = on.getContext('2d');
  const lamp = (g, x, y, r, lit) => {
    const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.25, 0, x, y, r);
    if (lit) { gr.addColorStop(0, '#fff2d8'); gr.addColorStop(0.35, '#ff5a2a'); gr.addColorStop(1, '#e00c00'); }
    else { gr.addColorStop(0, '#3a1410'); gr.addColorStop(1, '#1a0806'); }
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };
  const r = pitch * 0.36;
  for (let i = 0; i < N + cols; i++) {
    const col = strip[i % N];
    for (let y = 0; y < rows; y++) if (col[y]) lamp(og, (i + 0.5) * pitch, (y + 0.5) * pitch, r, true);
  }
  const off = $('led-off'); off.width = fw; off.height = fh;
  const fg = off.getContext('2d');
  for (let i = 0; i < cols; i++) for (let y = 0; y < rows; y++) lamp(fg, (i + 0.5) * pitch, (y + 0.5) * pitch, r, false);
  const disp = $('led-on'); disp.width = fw; disp.height = fh;
  const dg = disp.getContext('2d');
  return { N, pitch, dg, on, fw, fh };
})();

// ---------- the hanging starburst ----------
const BURST = (() => {
  const B = F.burst, el = $('burst');
  box(el, B.x - B.w / 2, B.y, B.w, B.w);
  const pts = (n, k, inner, rot = 0) => Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * TAU + rot, rr = (i % 2 ? inner : 1) * k; return `${(Math.sin(a) * rr).toFixed(4)},${(-Math.cos(a) * rr).toFixed(4)}`; }).join(' ');
  $('burst-edge').setAttribute('points', pts(16, 1.0, 0.76));
  $('burst-face').setAttribute('points', pts(16, 0.9, 0.7));
  const words = $('burst-words');
  words.style.fontSize = B.w * 0.2 + 'px';
  words.innerHTML = `<small>${B.small}</small>` + B.words.map((w) => `<b>${w}</b>`).join('');
  return { el, B };
})();

// ---------- the dayglo dot, slapped on the shelf edge, one edge lifting ----------
const STICKER = (() => {
  const S = F.sticker, c = $('sticker'), m = Math.round(S.d * 0.3);
  if (S.box != null) { const b = F.boxes[S.box]; S.x = b[0] + S.dx; S.y = b[1] - b[3] / 2 - (b[1] - b[1]) + S.dy; }
  const n = S.d + m * 2; c.width = n; c.height = n;
  box(c, S.x - n / 2, S.y - n / 2, n, n);
  c.style.transform = `rotate(${S.rot}deg)`;
  const g = c.getContext('2d');
  const cx = n / 2, cy = n / 2, R = S.d / 2;
  // the peel: a chord across the lower-right, folded back over itself
  const th = (35 * Math.PI) / 180, nx = Math.cos(th), ny = Math.sin(th), ch = R * 0.72;
  const bodyPath = () => { g.beginPath(); g.arc(cx, cy, R, 0, TAU); };
  const half = (sign) => { // half-plane on one side of the chord, as a big polygon
    const px = cx + nx * ch, py = cy + ny * ch, tx = -ny, ty = nx, L = n * 2;
    g.beginPath(); g.moveTo(px + tx * L, py + ty * L); g.lineTo(px - tx * L, py - ty * L);
    g.lineTo(px - tx * L - sign * nx * L, py - ty * L - sign * ny * L); g.lineTo(px + tx * L - sign * nx * L, py + ty * L - sign * ny * L); g.closePath();
  };
  // shadow of the stuck part (tight) and of the lifted flap (softer, further)
  g.save(); half(1); g.clip();
  g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = R * 0.05; g.shadowOffsetY = R * 0.03; g.fillStyle = '#ff6a00'; bodyPath(); g.fill();
  g.restore();
  // print: dayglo orange, black type
  g.save(); half(1); g.clip(); bodyPath(); g.clip();
  const grd = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R);
  grd.addColorStop(0, '#ff9a1a'); grd.addColorStop(1, '#ff5a00');
  g.fillStyle = grd; g.fillRect(0, 0, n, n);
  g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `400 ${R * 0.66}px "Archivo Black"`; g.fillText('30%', cx - R * 0.1, cy - R * 0.02);
  g.font = `400 ${R * 0.48}px "Archivo Black"`; g.fillText('OFF', cx - R * 0.14, cy + R * 0.46);
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = R * 0.035; g.beginPath(); g.arc(cx, cy, R * 0.88, 0, TAU); g.stroke();
  g.restore();
  // the flap: the cut-off cap, mirrored over the chord, showing its white paper back
  g.save();
  g.translate(cx + nx * ch, cy + ny * ch);
  g.transform(1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 0, 0);
  g.translate(-(cx + nx * ch), -(cy + ny * ch));
  half(-1); g.clip();
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = R * 0.12; g.shadowOffsetX = -R * 0.04; g.shadowOffsetY = R * 0.06;
  const fg = g.createLinearGradient(cx + nx * ch, cy + ny * ch, cx + nx * R, cy + ny * R);
  fg.addColorStop(0, '#d9d4c7'); fg.addColorStop(0.5, '#f7f4ec'); fg.addColorStop(1, '#e8e3d6');
  g.fillStyle = fg; bodyPath(); g.fill();
  g.restore();
  return c;
})();

// a little bloom on everything bright: the tubes, the LED, the chrome
const bloom = $('bloom'), BS = 4;
bloom.width = Math.ceil(F.w / BS); bloom.height = Math.ceil(F.h / BS);
bloom.style.width = F.w + 'px'; bloom.style.height = F.h + 'px';
const bctx = bloom.getContext('2d');

// the phone: fluorescent cast and a soft lens falloff
$('fx').style.background = [
  `radial-gradient(${F.w * 0.95}px ${F.h * 0.75}px at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)`,
  'linear-gradient(rgba(170,255,225,0.05), rgba(170,255,225,0.05))',
].join(',');

await Promise.all(['gme-primary'].map((nm) => { const i = new Image(); i.src = `/assets/gme/${nm}.png`; return i.decode(); }));

// a cheap display turntable that sticks a little: it dawdles with the cut facing the aisle
// and hurries round the back
const yawAt = (u) => (-30 * Math.PI) / 180 + TAU * u - 0.85 * Math.sin(TAU * u);

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;

  // the turntable: one slow turn a loop, lingering while the cut faces the aisle
  hero.spin.rotation.y = yawAt(u);
  scene.updateMatrixWorld(true);

  // LED: steps a whole lamp at a time, the whole message once a loop
  const colAt = Math.floor(u * LED.N) % LED.N;
  const { dg, on, pitch, fw, fh } = LED;
  dg.clearRect(0, 0, fw, fh);
  dg.save(); dg.filter = `blur(${(pitch * 0.8).toFixed(1)}px)`; dg.globalAlpha = 1; dg.globalCompositeOperation = 'lighter';
  dg.drawImage(on, colAt * pitch, 0, fw, fh, 0, 0, fw, fh); dg.restore();
  dg.drawImage(on, colAt * pitch, 0, fw, fh, 0, 0, fw, fh);

  // the starburst turns a little on its lines in the air-con, and swings
  const { el, B } = BURST;
  const swing = B.rot + 2.2 * Math.sin(TAU * u * 2 + 0.3);
  const twist = 24 * Math.sin(TAU * u + 0.9);
  el.style.transform = `perspective(1400px) rotate(${swing.toFixed(3)}deg) rotateY(${twist.toFixed(3)}deg)`;
  el.firstChild.style.filter = `brightness(${(1 - 0.25 * Math.max(0, Math.sin((twist * Math.PI) / 180))).toFixed(3)}) drop-shadow(0 22px 18px rgba(0,0,0,0.45))`;
  {
    const ox = B.x, oy = B.y, hx = B.w * 0.16, hy = B.w * 0.1;
    const ct = Math.cos((twist * Math.PI) / 180), a = (swing * Math.PI) / 180;
    const P = (sx) => { const lx = sx * hx * ct, ly = hy; return [ox + lx * Math.cos(a) - ly * Math.sin(a), oy + lx * Math.sin(a) + ly * Math.cos(a)]; };
    const lines = $('lines'); lines.setAttribute('width', F.w); lines.setAttribute('height', F.h);
    const [ax, ay] = P(-1), [bx, by] = P(1);
    $('line-a').setAttribute('d', `M${(ox - 30).toFixed(1)},-80 L${ax.toFixed(1)},${ay.toFixed(1)}`);
    $('line-b').setAttribute('d', `M${(ox + 30).toFixed(1)},-80 L${bx.toFixed(1)},${by.toFixed(1)}`);
  }

  // the laminate glare drifts as the phone moves a hair
  card.querySelector('.glare').style.transform = `translateX(${(6 * Math.sin(TAU * u)).toFixed(2)}px)`;

  renderer.render(scene, camera);
  bctx.clearRect(0, 0, bloom.width, bloom.height);
  bctx.filter = 'blur(6px) brightness(1.15)';
  bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer } };
setTime(Number(q.get('t') || 0));
window.ready = true;
