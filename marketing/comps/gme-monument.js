// GME Monument: the head-office sign, 30% off.
// A deadpan corporate photograph of the Gary Mustard Enterprises monument sign on its concrete
// base, with the right-hand 30% of the sign cut clean away. Everything on screen is a pure
// function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';

const q = new URLSearchParams(location.search);

// Per format:
//   paper   y (px) where the photograph ends and the paper begins
//   hz      the horizon row (px): the camera looks level, so this is also where the lens is aimed
//   x       screen column (px) the camera is aimed through (the centre of the full, uncut sign)
//   d       camera distance (scene units), fov in degrees, yaw: how far round to the sign's right
//   camY    camera height (the base top is at 0.95, the sign top at 3.25)
const FORMATS = {
  '9x16': { w: 1080, h: 1920, paper: 1110, hz: 832, x: 540, d: 24.5, fov: 30, yaw: 22, camY: 1.55 },
  '1x1': { w: 1080, h: 1080, paper: 800, hz: 505, x: 560, d: 14.6, fov: 30, yaw: 22, camY: 1.55 },
  'banner-v': { w: 1080, h: 2025, paper: 1520, hz: 1075, x: 500, d: 16, fov: 30, yaw: 22, camY: 1.5 },
};
// the office park (dx px, depth) and the stacks behind it [dx px, depth, height, radius]
for (const f of Object.values(FORMATS)) {
  f.bld = f.bld || [[110, 165], [800, 360]];
  f.stacks = f.stacks || [[240, 820, 70, 1.4], [300, 835, 84, 1.5], [372, 850, 64, 1.3], [470, 870, 92, 1.6]];
}
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
stage.style.setProperty('--paper', F.paper + 'px');
stage.style.setProperty('--hz', F.hz + 'px');

// A seeded random, so every render is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- fonts and the mark ----------
const FACES = ['500 100px "EB Garamond"', 'italic 500 100px "EB Garamond"', '600 100px "Cormorant Garamond"', 'italic 700 100px Tinos',
  '500 40px "Libre Franklin"', '600 40px "Libre Franklin"', '500 40px "IBM Plex Mono"', '400 40px "EB Garamond"', 'italic 400 40px "EB Garamond"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));
const loadImage = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const primary = await loadImage('/assets/gme/gme-primary.png');

// ---------- the photograph: renderer, camera, light ----------
const canvas = document.getElementById('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.paper + 'px';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(F.w, F.paper, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const HAZE = new THREE.Color('#a9bdd6');
scene.fog = new THREE.Fog(HAZE, 80, 1500);
// The camera frames the photograph only (the paper below is not part of the picture).
const camera = new THREE.PerspectiveCamera(F.fov, F.w / F.h, 0.1, 3000);
const PH = F.paper;
// Lens shift: the scene's aim point lands on (x, hz) of the photograph. The vertical FOV is
// defined against the whole ad height so every format shares one scale rule.
const fovPhoto = 2 * Math.atan(Math.tan(rad(F.fov) / 2) * (PH / F.h)) * (180 / Math.PI);
camera.fov = fovPhoto;
camera.aspect = F.w / PH;
camera.setViewOffset(F.w, PH, F.w / 2 - F.x, PH / 2 - F.hz, F.w, PH);
camera.updateProjectionMatrix();

scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x4d6b2c, 1.35));
const sun = new THREE.DirectionalLight(0xfff3df, 3.2);
sun.position.set(-3.5, 13, 11);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.radius = 3;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 });
scene.add(sun, sun.target);

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
// speckle: n dots of random size and tone, for concrete, paint and grass
function speckle(g, w, h, n, rnd, colours, size = [0.5, 2]) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colours[Math.floor(rnd() * colours.length)];
    const s = size[0] + rnd() * (size[1] - size[0]);
    g.fillRect(rnd() * w, rnd() * h, s, s);
  }
}

// ---------- the monument ----------
// Full sign: 4.2 x 2.3, standing on the base top (y 0.95). The right-hand 30% is gone.
const SIGN = { w: 4.2, h: 2.3, d: 0.42, y0: 0.95 };
const KEEP = 0.7;
const CUT_X = -SIGN.w / 2 + SIGN.w * KEEP; // 0.84
const BASE = { x0: -2.32, x1: 2.4, h: 0.95, d: 1.02 };
const mon = new THREE.Group();
mon.rotation.y = rad(-21);
scene.add(mon);

const rndSign = mulberry(7);
const SIGN_BLUE = '#3569b1';
const signFace = canvasTex(2048, Math.round((2048 * SIGN.h) / SIGN.w), (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, '#3a72bb'); grad.addColorStop(1, '#2f60a6');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  speckle(g, w, h, 9000, rndSign, ['rgba(255,255,255,0.03)', 'rgba(0,10,40,0.04)'], [1, 2]);
  // the half globe, cropped from the primary lockup, white
  const gh = h * 0.74, gw = (300 / 610) * gh, gx = w * 0.055, gy = (h - gh) / 2;
  const tint = document.createElement('canvas');
  tint.width = 300; tint.height = 610;
  const tg = tint.getContext('2d');
  tg.drawImage(primary, 0, 0, 300, 610, 0, 0, 300, 610);
  tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#f2f1ec'; tg.fillRect(0, 0, 300, 610);
  g.save(); g.shadowColor = 'rgba(8,24,62,0.55)'; g.shadowOffsetX = 5; g.shadowOffsetY = 6; g.shadowBlur = 3;
  g.drawImage(tint, gx, gy, gw, gh);
  // the lettering: raised, so it throws a small shadow on the panel
  const x0 = gx + gw + w * 0.035, cut = w * KEEP;
  g.fillStyle = '#f2f1ec';
  g.textBaseline = 'alphabetic';
  let s1 = 300; g.font = `500 ${s1}px "EB Garamond"`;
  s1 *= (cut - x0 - w * 0.03) / g.measureText('30% off').width; g.font = `500 ${s1}px "EB Garamond"`;
  g.fillText('30% off', x0, h * 0.52);
  const s2 = s1 * 0.5; g.font = `500 ${s2}px "EB Garamond"`;
  g.fillText('the entire internet.', x0 + s1 * 0.02, h * 0.52 + s2 * 1.25);
  g.restore();
}, {});
signFace.repeat.set(KEEP, 1);
signFace.offset.set(0, 0);
const paint = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.05, ...extra });
const signBlue = paint(SIGN_BLUE);
const rndCut = mulberry(11);
const cutFace = canvasTex(256, 1600, (g, w, h) => {
  g.fillStyle = '#c3c8cc'; g.fillRect(0, 0, w, h);
  // aluminium honeycomb core
  g.strokeStyle = 'rgba(90,96,104,0.8)'; g.lineWidth = 3;
  const r = 24, dx = r * Math.sqrt(3);
  for (let row = 0, y = 0; y < h + r * 2; row++, y += r * 1.5) {
    for (let x = (row % 2) * dx / 2 - dx; x < w + dx; x += dx) {
      g.beginPath();
      for (let k = 0; k < 14; k++) { const a = rad(60 * k + 30); g.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); }
      g.closePath(); g.stroke();
    }
  }
  speckle(g, w, h, 3000, rndCut, ['rgba(255,255,255,0.35)', 'rgba(0,0,0,0.12)'], [1, 2]);
  // the two painted skins
  const skin = w * 0.06;
  g.fillStyle = SIGN_BLUE; g.fillRect(0, 0, skin, h); g.fillRect(w - skin, 0, skin, h);
  g.fillStyle = '#e8ecef'; g.fillRect(skin, 0, 3, h); g.fillRect(w - skin - 3, 0, 3, h);
  // top and bottom channel
  g.fillStyle = '#9aa3ab'; g.fillRect(0, 0, w, 18); g.fillRect(0, h - 18, w, 18);
});
const cutMat = new THREE.MeshStandardMaterial({ map: cutFace, roughness: 0.45, metalness: 0.1, emissive: 0xffffff, emissiveMap: cutFace, emissiveIntensity: 0.28 });
const sign = new THREE.Mesh(new THREE.BoxGeometry(SIGN.w * KEEP, SIGN.h, SIGN.d),
  [cutMat, signBlue, signBlue, signBlue, paint(0xffffff, { map: signFace }), signBlue]);
sign.position.set((-SIGN.w / 2 + CUT_X) / 2, SIGN.y0 + SIGN.h / 2, 0);
sign.castShadow = true; sign.receiveShadow = true;
mon.add(sign);

// Concrete: board-formed, with control joints, bug holes and the company name cut in.
const rndCon = mulberry(23);
function concrete(g, w, h, { joints = [], name = false, footprint = null } = {}) {
  g.fillStyle = '#c9c7b8'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { // blotches
    const x = rndCon() * w, y = rndCon() * h, r = 20 + rndCon() * 120;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = rndCon() < 0.5 ? '120,118,100' : '235,233,222';
    gr.addColorStop(0, `rgba(${tone},${0.05 + rndCon() * 0.08})`); gr.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let y = 0; y < h; y += h / 7) { g.fillStyle = 'rgba(90,88,74,0.07)'; g.fillRect(0, y + rndCon() * 4, w, 2); }
  speckle(g, w, h, (w * h) / 60, rndCon, ['rgba(60,58,48,0.18)', 'rgba(255,255,250,0.22)', 'rgba(110,108,92,0.15)'], [1, 3]);
  speckle(g, w, h, (w * h) / 6000, rndCon, ['rgba(40,38,30,0.45)'], [2, 5]); // bug holes
  for (const j of joints) { g.fillStyle = 'rgba(70,68,58,0.55)'; g.fillRect(j * w - 2, 0, 4, h); g.fillStyle = 'rgba(255,255,250,0.35)'; g.fillRect(j * w + 2, 0, 2, h); }
  if (footprint) { // where the rest of the sign stood: cleaner, paler concrete and four bolt holes
    const [u0, u1, v0, v1] = footprint;
    g.fillStyle = 'rgba(236,235,226,0.55)'; g.fillRect(u0 * w, v0 * h, (u1 - u0) * w, (v1 - v0) * h);
    g.strokeStyle = 'rgba(80,78,66,0.45)'; g.lineWidth = 2; g.strokeRect(u0 * w, v0 * h, (u1 - u0) * w, (v1 - v0) * h);
  }
  if (name) {
    let fs = h * 0.15;
    g.font = `600 ${fs}px "Cormorant Garamond"`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.4}px`;
    const fit = (w * 0.62) / g.measureText('GARY MUSTARD ENTERPRISES').width;
    if (fit < 1) { fs *= fit; g.font = `600 ${fs}px "Cormorant Garamond"`; if ('letterSpacing' in g) g.letterSpacing = `${fs * 0.4}px`; }
    const y = h * 0.5;
    g.fillStyle = 'rgba(255,255,248,0.55)'; g.fillText('GARY MUSTARD ENTERPRISES', w * 0.5 + 2, y + 3);
    g.fillStyle = 'rgba(58,56,46,0.85)'; g.fillText('GARY MUSTARD ENTERPRISES', w * 0.5, y);
  }
}
const bw = BASE.x1 - BASE.x0;
const conFront = canvasTex(2048, Math.round((2048 * BASE.h) / bw), (g, w, h) => concrete(g, w, h, { joints: [0.17, 0.83], name: true }));
const conSide = canvasTex(512, Math.round((512 * BASE.h) / BASE.d), (g, w, h) => concrete(g, w, h));
const conTop = canvasTex(2048, Math.round((2048 * BASE.d) / bw), (g, w, h) => {
  const u0 = (CUT_X - BASE.x0) / bw, u1 = (SIGN.w / 2 - BASE.x0) / bw, v0 = 0.5 - SIGN.d / BASE.d / 2, v1 = 0.5 + SIGN.d / BASE.d / 2;
  concrete(g, w, h, { footprint: [u0, u1, v0, v1] });
});
const conMat = (map) => new THREE.MeshStandardMaterial({ map, roughness: 0.92, metalness: 0 });
const base = new THREE.Mesh(new THREE.BoxGeometry(bw, BASE.h, BASE.d),
  [conMat(conSide), conMat(conSide), conMat(conTop), conMat(conSide), conMat(conFront), conMat(conSide)]);
base.position.set((BASE.x0 + BASE.x1) / 2, BASE.h / 2, 0);
base.castShadow = true; base.receiveShadow = true;
mon.add(base);
// anchor bolts left standing where the missing section was fixed down
const steel = new THREE.MeshStandardMaterial({ color: 0x8b8f93, roughness: 0.4, metalness: 0.8 });
for (const bx of [CUT_X + 0.3, CUT_X + 0.95]) for (const bz of [-0.09, 0.09]) {
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 12), steel);
  bolt.position.set(bx, BASE.h + 0.035, bz); bolt.castShadow = true;
  mon.add(bolt);
}

// contact shadow: the base sits in the turf, it does not hover on it
const aoTex = canvasTex(512, 256, (g, w, h) => {
  g.filter = 'blur(18px)';
  g.fillStyle = 'rgba(14,30,8,0.75)';
  g.fillRect(w * 0.1, h * 0.24, w * 0.8, h * 0.52);
});
const ao = new THREE.Mesh(new THREE.PlaneGeometry(bw * 1.25, BASE.d * 2.6), new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false, fog: false }));
ao.rotation.x = -Math.PI / 2; ao.position.set((BASE.x0 + BASE.x1) / 2, 0.012, 0);
mon.add(ao);
// and the grass grows up a little in front of it
const rndT = mulberry(31);
const tuftTex = canvasTex(2048, 128, (g, w, h) => {
  for (let i = 0; i < 1500; i++) {
    const x = rndT() * w, l = h * (0.15 + Math.pow(rndT(), 2.2) * 0.85);
    const c = [[60, 112, 42], [86, 146, 58], [48, 92, 34], [112, 158, 70]][Math.floor(rndT() * 4)];
    g.strokeStyle = `rgb(${c})`; g.lineWidth = 2 + rndT() * 2;
    g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + (rndT() - 0.5) * 10, h - l * 0.6, x + (rndT() - 0.5) * 18, h - l); g.stroke();
  }
});
for (const [len, pos, ry] of [[bw + 0.1, [(BASE.x0 + BASE.x1) / 2, 0.035, BASE.d / 2 + 0.02], 0], [BASE.d + 0.1, [BASE.x1 + 0.02, 0.035, 0], Math.PI / 2]]) {
  const tuft = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.08), new THREE.MeshStandardMaterial({ map: tuftTex, transparent: true, alphaTest: 0.3, roughness: 1, color: 0xb4c4a4, side: THREE.DoubleSide }));
  tuft.position.set(...pos); tuft.rotation.y = ry;
  mon.add(tuft);
}

// ---------- the grounds ----------
const rndG = mulberry(5);
// Background things are placed by where they should land in the picture: dx pixels right of
// the aim point, `depth` units away down the base line of sight.
const FPX = F.h / (2 * Math.tan(rad(F.fov) / 2));
function placeAt(dx, depth) {
  const y = rad(F.yaw), cx = Math.sin(y) * F.d, cz = Math.cos(y) * F.d;
  const k = (dx / FPX) * depth;
  return new THREE.Vector3(cx - Math.sin(y) * depth + Math.cos(y) * k, 0, cz - Math.cos(y) * depth - Math.sin(y) * k);
}
const grassBlades = (g, w, h, n, alpha = 0.7) => {
  for (let i = 0; i < n; i++) {
    const x = rndG() * w, y = rndG() * h, l = 3 + rndG() * 7;
    const c = [[64, 120, 46], [88, 150, 60], [52, 98, 38], [118, 162, 72], [74, 128, 44], [140, 170, 80]][Math.floor(rndG() * 6)];
    g.strokeStyle = `rgba(${c},${alpha})`; g.lineWidth = 1 + rndG();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rndG() - 0.5) * 3, y - l); g.stroke();
  }
};
const grassTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#55923b'; g.fillRect(0, 0, w, h); grassBlades(g, w, h, 9000); }, { repeat: [700, 700] });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1, color: 0xe6f0d8 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
// the verge round the sign: one big, unrepeated patch with mowing stripes and worn bits
const verge = canvasTex(2048, 2048, (g, w, h) => {
  g.fillStyle = '#55923b'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(170,205,90,0.20)' : 'rgba(20,60,20,0.16)'; g.fillRect(0, (i / 8) * h, w, h / 8); }
  for (let i = 0; i < 60; i++) {
    const x = rndG() * w, y = rndG() * h, r = 40 + rndG() * 160, gr = g.createRadialGradient(x, y, 0, x, y, r);
    const c = rndG() < 0.5 ? '30,70,25' : '150,170,70';
    gr.addColorStop(0, `rgba(${c},0.18)`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  grassBlades(g, w, h, 160000, 0.75);
  // fade the edge into the field
  const cv = g.getImageData(0, 0, w, h), px = cv.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ex = Math.min(x, w - 1 - x) / (w * 0.18), ey = Math.min(y, h - 1 - y) / (h * 0.18);
    px[(y * w + x) * 4 + 3] = 255 * Math.min(1, ex, ey);
  }
  g.putImageData(cv, 0, 0);
});
const vergeMesh = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshStandardMaterial({ map: verge, transparent: true, roughness: 1, color: 0xe6f0d8, depthWrite: false }));
vergeMesh.rotation.x = -Math.PI / 2; vergeMesh.rotation.z = rad(-21); vergeMesh.position.y = 0.004;
vergeMesh.receiveShadow = true;
scene.add(vergeMesh);

// the access road behind the verge, a kerb, and the car park beyond
const yaw0 = rad(F.yaw);
const tarmac = new THREE.MeshStandardMaterial({ color: 0x8f918f, roughness: 0.95 });
const roadAt = placeAt(0, F.d + 13);
const road = new THREE.Mesh(new THREE.PlaneGeometry(900, 14), tarmac);
road.rotation.x = -Math.PI / 2; road.rotation.z = yaw0; road.position.set(roadAt.x, 0.012, roadAt.z);
scene.add(road);
const kerb = new THREE.Mesh(new THREE.BoxGeometry(900, 0.16, 0.35), new THREE.MeshStandardMaterial({ color: 0xdddcd2, roughness: 0.9 }));
const kerbAt = placeAt(0, F.d + 8.5);
kerb.rotation.y = yaw0; kerb.position.set(kerbAt.x, 0.08, kerbAt.z);
scene.add(kerb);
const lot = new THREE.Mesh(new THREE.PlaneGeometry(900, 60), new THREE.MeshStandardMaterial({ color: 0x9a9b97, roughness: 0.95 }));
const lotAt = placeAt(0, F.d + 100);
lot.rotation.x = -Math.PI / 2; lot.rotation.z = yaw0; lot.position.set(lotAt.x, 0.01, lotAt.z);

// the office park: long, low, white, ribbon windows, receding to the right
const officeTex = canvasTex(2048, 512, (g, w, h) => {
  g.fillStyle = '#ecece6'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(120,120,110,0.22)'; g.fillRect(x, 0, 2, h); }
  for (const [y0, y1] of [[0.22, 0.4], [0.58, 0.76]]) {
    const gl = g.createLinearGradient(0, y0 * h, 0, y1 * h);
    gl.addColorStop(0, '#34505f'); gl.addColorStop(1, '#7895a3');
    g.fillStyle = gl; g.fillRect(0, y0 * h, w, (y1 - y0) * h);
    for (let x = 0; x < w; x += 56) { g.fillStyle = '#dcdcd4'; g.fillRect(x, y0 * h, 7, (y1 - y0) * h); }
  }
  g.fillStyle = 'rgba(0,0,0,0.10)'; g.fillRect(0, h * 0.92, w, h * 0.08);
});
officeTex.wrapS = THREE.RepeatWrapping; officeTex.repeat.set(4, 1);
const white = new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: 0.85, emissive: 0x9aa0a8, emissiveIntensity: 0.35 });
const officeFront = new THREE.MeshStandardMaterial({ map: officeTex, roughness: 0.8, emissive: 0xffffff, emissiveMap: officeTex, emissiveIntensity: 0.32 });
// turn: 0 faces the camera; -90 runs straight away from it with the windows facing left
function building(dx, depth, len, hgt, deep, turn) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, hgt, deep), [white, white, white, white, officeFront, officeFront]);
  const p = placeAt(dx, depth);
  m.position.set(p.x, hgt / 2, p.z);
  m.rotation.y = yaw0 + rad(turn);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return m;
}
// the long one runs from behind the sign off to the right, as in the brand sheet's photograph
function buildingAB(a, b, hgt, deep) {
  const A = placeAt(a[0], a[1]), B = placeAt(b[0], b[1]);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, hgt, deep), [white, white, white, white, officeFront, officeFront]);
  m.position.set((A.x + B.x) / 2, hgt / 2, (A.z + B.z) / 2);
  m.rotation.y = -Math.atan2(B.z - A.z, B.x - A.x);
  m.translateZ(-deep / 2); // the facade, not the middle, runs along the line A-B
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
}
buildingAB(...F.bld, 9, 13);

// the plant behind: a buff block and four stacks
const plantAt = placeAt(F.stacks[1][0] + 60, F.stacks[1][1] - 30);
const plant = new THREE.Mesh(new THREE.BoxGeometry(90, 18, 40), new THREE.MeshStandardMaterial({ color: 0xcbb084, roughness: 0.9 }));
plant.position.set(plantAt.x, 9, plantAt.z); plant.rotation.y = yaw0 - rad(30);
scene.add(plant);
const stackMat = new THREE.MeshStandardMaterial({ color: 0xdcd6c8, roughness: 0.8 });
const bandMat = new THREE.MeshStandardMaterial({ color: 0x9a9384, roughness: 0.8 });
const stackTops = [];
for (const [dx, depth, hgt, r] of F.stacks) {
  const p = placeAt(dx, depth);
  const st = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, hgt, 24), stackMat);
  st.position.set(p.x, hgt / 2, p.z);
  scene.add(st);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.86, 2.6, 24), bandMat);
  band.position.set(p.x, hgt - 3, p.z);
  scene.add(band);
  stackTops.push(new THREE.Vector3(p.x, hgt, p.z));
}

// steam: soft sprites rising off each stack, on a loop
const puffTex = canvasTex(256, 256, (g, w) => {
  const rp = mulberry(3);
  for (let i = 0; i < 14; i++) {
    const x = w * (0.3 + rp() * 0.4), y = w * (0.3 + rp() * 0.4), r = w * (0.12 + rp() * 0.16);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  }
});
const puffs = [];
stackTops.forEach((top, si) => {
  for (let k = 0; k < 9; k++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, fog: true }));
    scene.add(m);
    puffs.push({ m, top, phase: k / 9 + si * 0.13 });
  }
});

// ---------- clouds (painted, static in the world; they slide only as the camera sways) ----------
const clouds = document.getElementById('clouds');
clouds.width = F.w + 400; clouds.height = F.hz + 40;
{
  const g = clouds.getContext('2d');
  const rc = mulberry(19);
  // one cumulus: a dome of overlapping puffs, lit from the top, flat grey-blue underneath
  const cumulus = (cx, baseY, wid, hei, alpha = 1, blur = 3) => {
    const pad = hei * 0.6, c = document.createElement('canvas');
    c.width = Math.ceil(wid + pad * 2); c.height = Math.ceil(hei + pad * 2);
    const k = c.getContext('2d'), ox = cx - wid / 2 - pad, oy = baseY - hei - pad;
    k.fillStyle = '#fff';
    for (let i = 0; i < 90; i++) {
      const u = rc() * 2 - 1, x = cx + u * wid * 0.5, dome = hei * Math.sqrt(Math.max(0, 1 - u * u));
      const r = hei * (0.16 + rc() * 0.22) * (0.5 + 0.5 * Math.sqrt(1 - u * u));
      const y = baseY - r * 0.6 - rc() * Math.max(0, dome - r * 1.2);
      k.beginPath(); k.arc(x - ox, y - oy, r, 0, TAU); k.fill();
    }
    k.globalCompositeOperation = 'source-atop';
    const sh = k.createLinearGradient(0, baseY - hei - oy, 0, baseY - oy);
    sh.addColorStop(0, '#ffffff'); sh.addColorStop(0.55, '#eef2f8'); sh.addColorStop(1, '#8e9fbd');
    k.fillStyle = sh; k.fillRect(0, 0, c.width, c.height);
    k.globalCompositeOperation = 'destination-out';
    const cutoff = k.createLinearGradient(0, baseY - oy - hei * 0.08, 0, baseY - oy + hei * 0.08);
    cutoff.addColorStop(0, 'rgba(0,0,0,0)'); cutoff.addColorStop(1, 'rgba(0,0,0,1)');
    k.fillStyle = cutoff; k.fillRect(0, baseY - oy - hei * 0.08, c.width, c.height);
    g.save(); g.globalAlpha = alpha; g.filter = `blur(${blur}px)`; g.drawImage(c, ox, oy); g.restore();
  };
  const streak = (cx, cy, wid, hei, alpha) => {
    g.save(); g.filter = 'blur(10px)'; g.globalAlpha = alpha; g.fillStyle = '#eef3fb';
    g.beginPath(); g.ellipse(cx, cy, wid / 2, hei / 2, 0, 0, TAU); g.fill(); g.restore();
  };
  const cw = clouds.width, hz = F.hz, u = F.w / 1080;
  streak(cw * 0.3, hz * 0.55, 520 * u, 22 * u, 0.25);
  streak(cw * 0.62, hz * 0.47, 380 * u, 16 * u, 0.2);
  cumulus(cw * 0.86, hz * 0.97, 560 * u, 230 * u, 0.95, 3);
  cumulus(cw * 0.66, hz * 0.99, 300 * u, 110 * u, 0.85, 3);
  cumulus(cw * 0.16, hz * 0.995, 360 * u, 80 * u, 0.7, 4);
  cumulus(cw * 0.42, hz * 0.62, 200 * u, 60 * u, 0.55, 5);
  // a far tree line sitting on the horizon, lost in the haze
  g.save(); g.filter = 'blur(1.5px)';
  for (let x = -20; x < cw + 20; x += 6 + rc() * 10) {
    const r = (7 + rc() * 13) * u, y = hz + 2 - r * (0.3 + rc() * 0.4);
    g.fillStyle = `rgba(${70 + rc() * 20},${96 + rc() * 20},${92 + rc() * 16},0.9)`;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  g.fillStyle = 'rgb(84,108,104)'; g.fillRect(0, hz - 2, cw, 8);
  g.restore();
}

// ---------- annotation: where the rest of the sign was ----------
const svg = document.getElementById('marks');
svg.setAttribute('width', F.w); svg.setAttribute('height', F.paper);
svg.setAttribute('viewBox', `0 0 ${F.w} ${F.paper}`);
svg.innerHTML = `
  <g class="ghost"><path class="dash"/></g>
  <g class="dim"><path class="line"/><path class="ticks"/><text class="lbl">30%</text></g>
  <path class="glint" d="M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z"/>`;
const dashPath = svg.querySelector('.dash'), dimLine = svg.querySelector('.dim .line'), dimTicks = svg.querySelector('.dim .ticks'), dimLbl = svg.querySelector('.dim .lbl'), glint = svg.querySelector('.glint');
const v3 = new THREE.Vector3();
function project(x, y, z) {
  v3.set(x, y, z);
  mon.localToWorld(v3);
  v3.project(camera);
  return [((v3.x + 1) / 2) * F.w, ((1 - v3.y) / 2) * PH];
}
const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

// ---------- grain and dust ----------
const grain = document.getElementById('grain');
grain.width = F.w; grain.height = F.h;
const gctx = grain.getContext('2d');
const noise = document.createElement('canvas');
noise.width = noise.height = 512;
{
  const ng = noise.getContext('2d'), img = ng.createImageData(512, 512), rn = mulberry(41);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (rn() + rn() + rn() - 1.5) * 120;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  ng.putImageData(img, 0, 0);
}
const noisePattern = gctx.createPattern(noise, 'repeat');
const rd = mulberry(77);
const dust = Array.from({ length: 70 }, () => ({ x: rd() * F.w, y: rd() * F.h, r: 0.6 + rd() * 2.2, a: rd() * 0.5, light: rd() < 0.35 }));

// the stepped band: each row repeats until it runs off the page, like the SYNERGY band
for (const row of document.querySelectorAll('.steps .row')) row.innerHTML = Array(6).fill('<span>30% OFF</span>').join('');

// ---------- time ----------
const camAt = (t) => {
  const s = Math.sin((t / DURATION) * TAU);
  const yaw = rad(F.yaw + 1.6 * s);
  const d = F.d * (1 - 0.012 * Math.cos((t / DURATION) * TAU));
  return { yaw, d, s };
};

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const { yaw, d, s } = camAt(t);
  camera.position.set(Math.sin(yaw) * d, F.camY, Math.cos(yaw) * d);
  camera.lookAt(0, F.camY, 0);
  camera.updateMatrixWorld();

  for (const p of puffs) {
    const u = (((t / 6) + p.phase) % 1 + 1) % 1;
    p.m.position.set(p.top.x + u * u * 20, p.top.y + 4 + u * 30, p.top.z);
    const sc = 9 + u * 34;
    p.m.scale.set(sc, sc, 1);
    p.m.material.opacity = Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.42;
  }

  // clouds slide a little against the camera's sway (they are far away)
  clouds.style.transform = `translateX(${(-200 + FPX * (yaw - rad(F.yaw))).toFixed(2)}px)`;

  renderer.render(scene, camera);

  // ghost outline of the missing 30%: front face and the far edges, in projected screen space
  const x0 = CUT_X, x1 = SIGN.w / 2, y0 = SIGN.y0, y1 = SIGN.y0 + SIGN.h, zf = SIGN.d / 2, zb = -SIGN.d / 2;
  const a = project(x0, y1, zf), b = project(x1, y1, zf), c = project(x1, y0, zf), e = project(x0, y0, zf);
  const bt = project(x1, y1, zb), at = project(x0, y1, zb), cb = project(x1, y0, zb);
  dashPath.setAttribute('d', `M${P(a)}L${P(b)}L${P(c)}L${P(e)} M${P(at)}L${P(bt)}L${P(cb)} M${P(a)}L${P(at)} M${P(b)}L${P(bt)} M${P(c)}L${P(cb)}`);
  dashPath.style.strokeDashoffset = (-(t / DURATION) * 14 * 12).toFixed(2);
  // dimension line above the missing section
  const lift = 0.38;
  const da = project(x0, y1 + lift, zf), db = project(x1, y1 + lift, zf);
  const ea = project(x0, y1 + 0.08, zf), eb = project(x1, y1 + 0.08, zf);
  const ta = project(x0, y1 + lift + 0.1, zf), tb = project(x1, y1 + lift + 0.1, zf);
  dimLine.setAttribute('d', `M${P(da)}L${P(db)}`);
  dimTicks.setAttribute('d', `M${P(ea)}L${P(ta)} M${P(eb)}L${P(tb)}`);
  const mx = (da[0] + db[0]) / 2, my = (da[1] + db[1]) / 2, ang = (Math.atan2(db[1] - da[1], db[0] - da[0]) * 180) / Math.PI;
  dimLbl.setAttribute('transform', `translate(${mx.toFixed(1)},${(my - 14).toFixed(1)}) rotate(${ang.toFixed(2)})`);

  // a single glint on the fresh cut, twice a loop
  const gp = project(CUT_X, y1, zf);
  let k = 0;
  for (const t0 of [2.2, 8.2]) { const p = (t - t0) / 0.7; if (p > 0 && p < 1) k = Math.sin(p * Math.PI); }
  const gs = 46 * k;
  glint.setAttribute('transform', `translate(${gp[0].toFixed(1)},${gp[1].toFixed(1)}) rotate(${(k * 25).toFixed(1)}) scale(${gs.toFixed(2)})`);
  glint.style.opacity = k > 0.01 ? 1 : 0;

  // film grain: a fresh offset every frame, dust that stays put
  const fr = Math.round(t * FPS);
  const rf = mulberry(1000 + fr);
  gctx.clearRect(0, 0, F.w, F.h);
  gctx.save();
  gctx.translate(-Math.floor(rf() * 512), -Math.floor(rf() * 512));
  gctx.fillStyle = noisePattern;
  gctx.fillRect(0, 0, F.w + 512, F.h + 512);
  gctx.restore();
  for (const p of dust) {
    gctx.fillStyle = p.light ? `rgba(255,255,255,${p.a})` : `rgba(0,0,0,${p.a})`;
    gctx.beginPath(); gctx.arc(p.x, p.y, p.r, 0, TAU); gctx.fill();
  }
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer } };
setTime(Number(q.get('t') || 0));
window.ready = true;
