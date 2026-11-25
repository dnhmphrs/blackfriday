// The Swing Tag. A standard Black Friday sale sign: BLACK FRIDAY in white, a big red swing tag
// reading 30% OFF. The tag hangs on a twine loop from Gary Mustard Enterprises' cut chrome globe,
// as if the internet itself had been tagged for sale. A second, yellow tag names the item.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, materials, castShadows } from '../lib/stage.js';
import { makeGlobe } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
// All positions are in px on the stage. The 3D world is laid out at 100 px per unit on the z=0 plane.
//   head    BLACK FRIDAY: lines, each fitted to `width`, starting at (x, top)
//   globe   the hanger: centre and diameter
//   tag     the big tag: width, and the string length from the globe's south pole to the eyelet
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, gut: 56, docTop: 262, docSize: 24,
    head: { lines: ['BLACK FRIDAY'], x: 56, top: 338, width: 968, gap: 0 },
    globe: { x: 540, y: 668, d: 286, yaw: -38, tilt: 20 },
    tag: { w: 500, L: 52 },
    small: { s: 0.8, L: 40, lat: 0, yaw: -14, side: 1, zmin: 0.05 },
    burst: { x: 880, y: 690, d: 210, size: 46, rot: 12, text: 'One day<br>only!<small>Fri 27 Nov</small>' },
    garamond: { x: 56, y: 640, w: 300, size: 34, text: 'The remaining 70%<br>is in good order.' },
    cta: { top: 1486, h: 76, size: 46, small: 14 },
    foot: { top: 1640, lockW: 210, fineSize: 15 },
  },
  '1x1': {
    w: 1080, h: 1080, gut: 48, docTop: 40, docSize: 20,
    head: { lines: ['BLACK', 'FRIDAY'], x: 48, top: 118, width: 500, gap: 6 },
    globe: { x: 790, y: 196, d: 210, yaw: -38, tilt: 20 },
    tag: { w: 420, L: 40 },
    small: { s: 0.8, L: 34, lat: 0, yaw: -14, side: 1, zmin: 0.05 },
    burst: { x: 168, y: 660, d: 236, size: 50, rot: -10, text: 'One day<br>only!<small>Fri 27 Nov</small>' },
    garamond: { x: 300, y: 600, w: 270, size: 32, text: 'The remaining 70%<br>is in good order.' },
    cta: { top: 966, h: 72, size: 44, small: 13 },
    foot: { top: 790, right: 560, lockW: 190, fineSize: 13 },
  },
  'banner-v': {
    w: 1080, h: 2025, gut: 64, docTop: 52, docSize: 28,
    head: { lines: ['BLACK', 'FRIDAY'], x: 110, top: 126, width: 860, gap: 6 },
    globe: { x: 540, y: 868, d: 260, yaw: -38, tilt: 20 },
    tag: { w: 600, L: 46 },
    small: { s: 0.8, L: 40, lat: 0, yaw: -14, side: 1, zmin: 0.05 },
    burst: { x: 215, y: 860, d: 230, size: 52, rot: -12, text: 'One day<br>only!' },
    garamond: { x: 330, y: 1908, w: 686, size: 44, align: 'right', text: 'The remaining 70%<br>is in good order.' },
    cta: { top: 1782, h: 100, size: 66, small: 0 },
    foot: { top: 1900, right: 600, lockW: 200, fineSize: 0 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const U = 100; // px per world unit
const wx = (px) => (px - F.w / 2) / U, wy = (py) => (F.h / 2 - py) / U;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
for (const [k, v] of Object.entries({ gut: F.gut, docTop: F.docTop, docSize: F.docSize })) stage.style.setProperty('--' + k, v + 'px');

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (x * 6 - 15) + 10));

// ---------- fonts and marks ----------
const FACES = ['400 100px Anton', '500 40px "Libre Franklin"', '600 40px "Libre Franklin"', '800 40px "Libre Franklin"', '900 40px "Libre Franklin"',
  'italic 400 40px "EB Garamond"', '500 40px "EB Garamond"', '500 40px "IBM Plex Mono"', '400 40px "IBM Plex Mono"', '400 40px "Archivo Black"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));
const loadImage = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
const [MARK, LETTERS, STARMARK] = await Promise.all(['gme-primary', 'gme-letters', 'family-star'].map((n) => loadImage(`/assets/gme/${n}.png`)));

// A white-on-transparent mark, recoloured, drawn into a box without distortion.
function drawMark(g, img, color, cx, cy, maxW, maxH) {
  const s = Math.min(maxW / img.width, maxH / img.height), w = img.width * s, h = img.height * s;
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const k = c.getContext('2d'); k.drawImage(img, 0, 0, w, h); k.globalCompositeOperation = 'source-in'; k.fillStyle = color; k.fillRect(0, 0, w, h);
  g.drawImage(c, cx - w / 2, cy - h / 2);
}
// Text fitted to a width (and optionally capped by a cap height), centred on cx, baseline at y.
function fitText(g, text, font, cx, y, maxW, maxSize, tracking = 0) {
  g.font = `${font} 100px Anton`;
  const w100 = g.measureText(text).width + tracking * 100 * (text.length - 1);
  const size = Math.min(maxSize, (maxW / w100) * 100);
  g.font = `${font} ${size}px Anton`;
  if ('letterSpacing' in g) g.letterSpacing = `${tracking * size}px`;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillText(text, cx + (tracking * size) / 2, y);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  return size;
}
function paperNoise(g, w, h, seed, amt = 18) {
  const r = mulberry(seed), img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const k = (r() - 0.5) * amt; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
  g.putImageData(img, 0, 0);
}

// ---------- the tags ----------
// A swing tag outline in tag units: eyelet at the origin, the top edge `top` above it, chamfered
// shoulders, slightly rounded corners, the punched hole cut through.
function tagShape(w, h, top, holeR) {
  const s = new THREE.Shape(), a = w * 0.27, sh = top - w * 0.24, b = top - h, r = w * 0.04;
  s.moveTo(-a, top);
  s.lineTo(a, top);
  s.lineTo(w / 2, sh);
  s.lineTo(w / 2, b + r); s.quadraticCurveTo(w / 2, b, w / 2 - r, b);
  s.lineTo(-w / 2 + r, b); s.quadraticCurveTo(-w / 2, b, -w / 2, b + r);
  s.lineTo(-w / 2, sh);
  s.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 0, holeR, 0, TAU, true);
  s.holes.push(hole);
  return s;
}
// A printed face for a tag shape: uv runs over the tag's bounding box (canvas top = tag top).
function faceMesh(shape, w, h, top, tex, back) {
  const geo = new THREE.ShapeGeometry(shape, 24);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = (p.getX(i) + w / 2) / w, v = (p.getY(i) - (top - h)) / h;
    uv.setXY(i, u, v);
  }
  // mostly the print's own colour (emissive), with a quarter of real light on top for shading and shadow
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x5a5a5a, roughness: 0.55, metalness: 0, envMapIntensity: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.72,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 }); // the print sits on the card without z-fighting
  const m = new THREE.Mesh(geo, mat);
  if (back) m.rotation.y = Math.PI;
  return m;
}
function makeTag({ w, h, top, holeR, depth, edge, front, back }) {
  const shape = tagShape(w, h, top, holeR);
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.25, bevelSize: depth * 0.25, bevelSegments: 2, curveSegments: 24 }),
    new THREE.MeshStandardMaterial({ color: edge, roughness: 0.7, envMapIntensity: 0.5 }));
  body.position.z = -depth / 2;
  const f = faceMesh(shape, w, h, top, front, false); f.position.z = depth / 2 + depth * 0.25 + 0.008;
  const b = faceMesh(shape, w, h, top, back, true); b.position.z = -depth / 2 - depth * 0.25 - 0.008;
  // the grommet: a brass ring through the hole
  const ring = new THREE.Mesh(new THREE.TorusGeometry(holeR + 0.035, 0.045, 16, 48), new THREE.MeshStandardMaterial({ color: new THREE.Color(1.0, 0.82, 0.5), metalness: 1, roughness: 0.18 }));
  ring.scale.z = 1.6;
  g.add(body, f, b, ring);
  castShadows(g);
  return g;
}
const texFrom = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// The big tag, 5.2 x 7.6 tag units; 200 canvas px per unit.
const BIG = { w: 5.4, h: 7.2, top: 0.66, holeR: 0.2, depth: 0.05 };
const PXU = 200;
function bigFront() {
  const W = BIG.w * PXU, H = BIG.h * PXU, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), hx = W / 2, hy = BIG.top * PXU;
  g.fillStyle = '#e3141c'; g.fillRect(0, 0, W, H);
  // the soft ink falloff of a cheap print run
  const v = g.createRadialGradient(W / 2, H * 0.45, W * 0.2, W / 2, H * 0.45, W * 0.95);
  v.addColorStop(0, 'rgba(255,60,40,0.10)'); v.addColorStop(1, 'rgba(90,0,10,0.22)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  // paper reinforcement ring round the eyelet
  g.fillStyle = '#f4efe4'; g.beginPath(); g.arc(hx, hy, 0.42 * PXU, 0, TAU); g.fill();
  g.fillStyle = '#e3141c'; g.beginPath(); g.arc(hx, hy, 0.24 * PXU, 0, TAU); g.fill();
  // 30% / OFF, as big as the card allows (positions from the bottom up: stub, band, OFF, 30%)
  const stub = H - 1.0 * PXU, band = stub - 0.62 * PXU, bandH = 0.5 * PXU;
  g.fillStyle = '#fff';
  const offSize = fitText(g, 'OFF', '400', hx, band - 0.2 * PXU, W * 0.9, 1.55 * PXU, 0.06);
  fitText(g, '30%', '400', hx, band - 0.2 * PXU - offSize * 0.9, W * 0.92, 3.3 * PXU);
  // EVERYTHING band
  g.fillStyle = '#0b0b0d'; g.fillRect(0, band, W, bandH);
  g.fillStyle = '#ffd31a';
  fitText(g, 'EVERYTHING', '400', hx, band + bandH * 0.8, W * 0.84, bandH * 0.86, 0.12);
  // tear-off stub
  g.strokeStyle = 'rgba(255,240,230,0.85)'; g.lineWidth = 4; g.setLineDash([16, 12]);
  g.beginPath(); g.moveTo(24, stub); g.lineTo(W - 24, stub); g.stroke(); g.setLineDash([]);
  // barcode
  const r = mulberry(2711);
  let x = 60; g.fillStyle = '#fff';
  while (x < 420) { const bw = 3 + Math.floor(r() * 3) * 3; g.fillRect(x, stub + 30, bw, 100); x += bw + 3 + Math.floor(r() * 3) * 3; }
  g.font = '500 32px "IBM Plex Mono"'; g.textAlign = 'left';
  g.fillText('ITEM  THE INTERNET', 470, stub + 62);
  g.fillText('SKU   30-2711-2026', 470, stub + 102);
  g.fillText('QTY   ALL OF IT', 470, stub + 142);
  paperNoise(g, W, H, 31, 16);
  return texFrom(c);
}
function bigBack() {
  const W = BIG.w * PXU, H = BIG.h * PXU, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), hx = W / 2, hy = BIG.top * PXU;
  g.fillStyle = '#e3141c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f4efe4'; g.beginPath(); g.arc(hx, hy, 0.42 * PXU, 0, TAU); g.fill();
  g.fillStyle = '#e3141c'; g.beginPath(); g.arc(hx, hy, 0.24 * PXU, 0, TAU); g.fill();
  drawMark(g, MARK, '#fff', hx, 520, 640, 340);
  g.fillStyle = '#fff'; g.textAlign = 'center';
  g.font = '600 30px "Libre Franklin"'; if ('letterSpacing' in g) g.letterSpacing = '6px';
  g.fillText('THE “BUSINESS” BUSINESS · EST2026', hx, 790);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  g.font = 'italic 400 54px "EB Garamond"';
  g.fillText('The remaining 70%', hx, 930); g.fillText('is in good order.', hx, 994);
  g.font = '500 30px "IBM Plex Mono"';
  ['100% INTERNET', 'DO NOT IRON', 'NO PURCHASE NECESSARY', 'WORKS LIKE MAGIC'].forEach((l, i) => g.fillText(l, hx, 1130 + i * 46));
  g.strokeStyle = '#fff'; g.lineWidth = 4;
  g.setLineDash([16, 12]); g.beginPath(); g.moveTo(24, H - PXU); g.lineTo(W - 24, H - PXU); g.stroke(); g.setLineDash([]);
  g.font = '600 26px "Libre Franklin"'; g.fillText('MADE BY GARY MUSTARD ENTERPRISES', hx, H - 0.5 * PXU);
  paperNoise(g, W, H, 32, 16);
  return texFrom(c);
}
// The small tag, 2.2 x 3.1 units.
const SMALL = { w: 2.2, h: 3.1, top: 0.42, holeR: 0.13, depth: 0.04 };
function smallFace(back) {
  const W = SMALL.w * PXU, H = SMALL.h * PXU, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), hx = W / 2, hy = SMALL.top * PXU;
  g.fillStyle = '#ffd31a'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#f7f1e2'; g.beginPath(); g.arc(hx, hy, 0.27 * PXU, 0, TAU); g.fill();
  g.fillStyle = '#ffd31a'; g.beginPath(); g.arc(hx, hy, 0.16 * PXU, 0, TAU); g.fill();
  g.fillStyle = '#0b0b0d';
  if (!back) {
    fitText(g, 'THE ENTIRE', '400', hx, 260, W * 0.8, 92, 0.04);
    fitText(g, 'INTERNET', '400', hx, 400, W * 0.88, 150);
    g.fillRect(30, 432, W - 60, 6);
    g.font = '500 22px "IBM Plex Mono"'; g.textAlign = 'center';
    g.fillText('SIZE: ONE SIZE FITS ALL', hx, 480);
    g.fillText('COLOUR: AS SEEN', hx, 512);
    g.fillText('ON EVERY WEBSITE', hx, 540);
  } else {
    drawMark(g, LETTERS, '#0b0b0d', hx, 290, 330, 140);
    g.font = '600 20px "Libre Franklin"'; g.textAlign = 'center'; if ('letterSpacing' in g) g.letterSpacing = '4px';
    g.fillText('GARY MUSTARD ENTERPRISES', hx, 410); if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.font = 'italic 400 34px "EB Garamond"'; g.fillText('Works like magic.', hx, 480);
  }
  paperNoise(g, W, H, back ? 42 : 41, 14);
  return texFrom(c);
}

// ---------- 3D ----------
const canvas = document.getElementById('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 24;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: 1, fov: FOV });
renderer.toneMappingExposure = 1.05;
const dist = F.h / U / 2 / Math.tan(rad(FOV / 2));
camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();

// the globe: GME blue mirror ball in a chrome lattice, 30% of it cut away, sale colours on the cut
async function cutFace() {
  const n = 1024, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d');
  g.fillStyle = '#ffd31a'; g.fillRect(0, 0, n / 2, n);
  g.fillStyle = '#e3141c'; g.fillRect(n / 2, 0, n / 2, n);
  g.beginPath(); g.rect(0, 0, n, n); g.arc(n / 2, n / 2, n * 0.45, 0, TAU, true); g.closePath(); g.fillStyle = '#0a1fd8'; g.fill('evenodd');
  const crease = g.createLinearGradient(n * 0.38, 0, n * 0.62, 0);
  crease.addColorStop(0, 'rgba(0,0,0,0)'); crease.addColorStop(0.5, 'rgba(0,0,0,0.4)'); crease.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = crease; g.fillRect(n * 0.38, 0, n * 0.24, n);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // the face that turns to camera carries 30%, as big as the half disc allows; the other is seen edge-on, plain red
  g.font = '400 250px Anton';
  g.fillStyle = '#e3141c'; g.fillText('30%', n * 0.25, n * 0.5);
  paperNoise(g, n, n, 5, 12);
  return new THREE.MeshStandardMaterial({ map: texFrom(c), roughness: 0.55, envMapIntensity: 0.4, emissive: 0xffffff, emissiveMap: texFrom(c), emissiveIntensity: 0.18, side: THREE.DoubleSide });
}
const GR = F.globe.d / 2 / U;
const globeRoot = new THREE.Group();
globeRoot.position.set(wx(F.globe.x), wy(F.globe.y), 0);
scene.add(globeRoot);
const globeTilt = new THREE.Group(); globeTilt.rotation.x = rad(F.globe.tilt); globeRoot.add(globeTilt);
const globeSpin = new THREE.Group(); globeTilt.add(globeSpin);
const globe = makeGlobe({ R: 1, tubeRadius: 0.042, core: materials.tinted(0.03, 0.12, 1.0, 0.14), cut: await cutFace(), sliceOut: 0 });
globe.scale.setScalar(GR);
globeSpin.add(castShadows(globe));
// a small chrome hook at the south pole, where the twine is tied
const hook = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 12, 32), materials.chrome());
hook.position.y = -GR - 0.06;
globeTilt.add(hook);

// the hanging assembly: swings about the hook, twists about the twine
const hang = new THREE.Group(); scene.add(hang);
const twist = new THREE.Group(); hang.add(twist);
const TS = F.tag.w / U / BIG.w; // big tag scale
const L = F.tag.L / U;           // hook to eyelet
const big = makeTag({ ...BIG, edge: 0xb30d14, front: bigFront(), back: bigBack() });
big.scale.setScalar(TS);
big.position.y = -L;
twist.add(big);
// the small tag hangs on its own twine from a node of the globe's lattice, front left, in front of the big tag
const SS = TS * F.small.s;
const small = makeTag({ ...SMALL, edge: 0xd9a800, front: smallFace(false), back: smallFace(true) });
small.scale.setScalar(SS);
const smallHang = new THREE.Group(); scene.add(smallHang);
const smallTwist = new THREE.Group(); smallHang.add(smallTwist);
const LS = F.small.L / U;
small.position.y = -LS;
smallTwist.add(small);
const NODE = new THREE.Vector3();
{ // lattice nodes: latitude rings x meridians; pick the one furthest left that faces us
  const lat = rad(F.small.lat); let best = null;
  globeSpin.rotation.y = rad(F.globe.yaw); globeRoot.updateMatrixWorld(true);
  for (let lon = 108; lon <= 360; lon += 36) {
    const v = new THREE.Vector3(Math.cos(lat) * Math.sin(rad(lon)), Math.sin(lat), Math.cos(lat) * Math.cos(rad(lon)));
    const w = v.clone(); globe.localToWorld(w);
    if (w.z > globeRoot.position.z + GR * F.small.zmin && (!best || w.x * F.small.side > best.x * F.small.side)) best = { x: w.x, v };
  }
  NODE.copy(best.v);
}
// red-and-white baker's twine
function twineMaterial() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 16;
  const g = c.getContext('2d'); g.fillStyle = '#f3ede0'; g.fillRect(0, 0, 64, 16);
  g.fillStyle = '#d8121b'; for (let i = -16; i < 64; i += 16) { g.beginPath(); g.moveTo(i, 16); g.lineTo(i + 8, 16); g.lineTo(i + 16, 0); g.lineTo(i + 8, 0); g.fill(); }
  const t = texFrom(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (len) => { const m = t.clone(); m.needsUpdate = true; m.repeat.set(len * 9, 1); return new THREE.MeshStandardMaterial({ map: m, roughness: 0.85, envMapIntensity: 0.5 }); };
}
const twine = twineMaterial();
const rope = (pts, r = 0.028) => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 140, r, 10, false), twine(curve.getLength()));
  m.castShadow = true; return m;
};
// main loop: down the front from the hook, through the eyelet, back up behind
{
  const e = -L, z = 0.06 * TS, top = BIG.top * TS;
  twist.add(rope([[0, -0.05, 0], [0.02, e + top + 0.5, z * 0.6], [0.0, e + top * 0.55, z * 1.3], [0, e + 0.05 * TS, z], [0, e, 0],
    [0, e + 0.05 * TS, -z], [0.0, e + top * 0.55, -z * 1.3], [-0.02, e + top + 0.5, -z * 0.6], [0, -0.05, 0]]));
  // the small tag's loop
  const zs = 0.05 * SS, ts = SMALL.top * SS;
  smallTwist.add(rope([[0, 0, 0], [0.01, -LS + ts + 0.25, zs * 0.6], [0, -LS + ts * 0.55, zs * 1.3], [0, -LS + 0.04 * SS, zs], [0, -LS, 0],
    [0, -LS + 0.04 * SS, -zs], [0, -LS + ts * 0.55, -zs * 1.3], [-0.01, -LS + ts + 0.25, -zs * 0.6], [0, 0, 0]], 0.022));
}
// the wall behind: takes only shadows, so the tag throws a soft one onto the glow
const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x050008, opacity: 0.55 }));
wall.position.z = -1.6; wall.receiveShadow = true; scene.add(wall);
key.intensity = 2.6;
const tagMid = new THREE.Vector3(wx(F.globe.x), wy(F.globe.y) - GR - L - BIG.h * TS * 0.45, 0);
key.target.position.copy(tagMid);
key.position.copy(tagMid).add(new THREE.Vector3(-4.5, 6.5, 9));
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
key.shadow.camera.updateProjectionMatrix();
key.shadow.radius = 14; key.shadow.blurSamples = 24;
// a warm red bounce from the tag back onto the globe's underside
const bounce = new THREE.PointLight(0xff3020, 6, 8, 1.6); bounce.position.copy(tagMid).add(new THREE.Vector3(0, BIG.h * TS * 0.3, 1.5)); scene.add(bounce);

// ---------- 2D ----------
const head = document.getElementById('head');
head.style.left = F.head.x + 'px'; head.style.top = F.head.top + 'px';
{
  const m = document.createElement('canvas').getContext('2d'); m.font = '400 100px Anton';
  head.innerHTML = F.head.lines.map((l) => {
    const size = (F.head.width / m.measureText(l).width) * 100;
    return `<span style="font-size:${size.toFixed(1)}px;margin-bottom:${F.head.gap}px">${l}</span>`;
  }).join('');
}
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
// the starburst sticker: 18 points, slightly irregular, yellow with a red keyline
const burst = document.getElementById('burst');
{
  const B = F.burst, r = mulberry(18), pts = [];
  for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU - Math.PI / 2, R = i % 2 ? 0.78 + r() * 0.04 : 1; pts.push(`${(Math.cos(a) * R).toFixed(3)},${(Math.sin(a) * R).toFixed(3)}`); }
  burst.style.cssText = `left:${B.x - B.d / 2}px;top:${B.y - B.d / 2}px;--burstD:${B.d}px;--burstSize:${B.size}px;transform:rotate(${B.rot}deg)`;
  burst.innerHTML = `<svg viewBox="-1.08 -1.08 2.16 2.16"><polygon points="${pts.join(' ')}" fill="#ffd31a" stroke="#e3141c" stroke-width="0.035" stroke-linejoin="round"/></svg><div class="txt">${B.text}</div>`;
}
const gar = document.getElementById('garamond');
gar.innerHTML = F.garamond.text;
gar.style.cssText = `left:${F.garamond.x}px;top:${F.garamond.y}px;width:${F.garamond.w}px;--gSize:${F.garamond.size}px;text-align:${F.garamond.align || 'left'}`;
const cta = document.getElementById('cta');
cta.style.cssText = `top:${F.cta.top}px;--ctaH:${F.cta.h}px;--ctaSize:${F.cta.size}px;--ctaSmall:${F.cta.small}px`;
cta.innerHTML = `<div class="go">Shop now <i class="tri"></i> any website</div>` + (F.cta.small ? `<div class="side">Limited time<br>While internet lasts</div>` : '');
const foot = document.getElementById('foot');
if (F.foot.top < 0) foot.style.display = 'none';
else {
  foot.style.cssText = `top:${F.foot.top}px;right:${F.foot.right ?? F.gut}px;--lockW:${F.foot.lockW}px;--fineSize:${F.foot.fineSize}px`;
  document.getElementById('fine').innerHTML = F.foot.fineSize ? '<em>Every website. Black Friday only.</em>Friday 27 November 2026<br>No purchase necessary' : '';
}

// the glow on the wall behind the tag
const tagCY = F.globe.y + F.globe.d / 2 + F.tag.L + F.tag.w * (BIG.h / BIG.w) * 0.45;
document.getElementById('glow').style.background =
  `radial-gradient(${F.tag.w * 1.25}px ${F.tag.w * 1.4}px at ${F.globe.x}px ${tagCY}px, rgba(255,40,30,0.34), rgba(150,10,30,0.14) 55%, rgba(0,0,0,0) 100%),` +
  `radial-gradient(${F.globe.d * 1.3}px ${F.globe.d * 1.1}px at ${F.globe.x}px ${F.globe.y}px, rgba(70,110,255,0.22), rgba(0,0,0,0) 100%)`;
{ // the spotlight cone: narrow at the top of the frame, as wide as the tag where it ends
  const beam = document.getElementById('beam'), x = F.globe.x, top = 0, bot = tagCY + F.tag.w * 0.8, w0 = F.tag.w * 0.18, w1 = F.tag.w * 1.15;
  beam.style.cssText = `left:${x - w1 / 2}px;top:${top}px;width:${w1}px;height:${bot - top}px;` +
    `clip-path:polygon(${(w1 - w0) / 2}px 0, ${(w1 + w0) / 2}px 0, 100% 100%, 0 100%);` +
    `background:linear-gradient(180deg, rgba(190,205,255,0.03) 0%, rgba(180,195,250,0.10) 22%, rgba(170,185,240,0.07) 50%, rgba(255,120,100,0.05) 80%, rgba(0,0,0,0) 100%)`;
}
document.querySelector('.haze').style.background = `linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(120,140,190,0.10) 90%, rgba(170,180,200,0.16) 100%)`;

// bloom: a quarter-size copy of the 3D layer, blurred and screened back over it
const bloom = document.getElementById('bloom');
bloom.width = F.w / 4; bloom.height = F.h / 4;
bloom.style.width = F.w + 'px'; bloom.style.height = F.h + 'px';
const bctx = bloom.getContext('2d');
// what is actually shown of the 3D layer: a 2D copy of the WebGL canvas
const view = document.getElementById('view');
view.width = F.w; view.height = F.h;
view.style.width = F.w + 'px'; view.style.height = F.h + 'px';
const vctx = view.getContext('2d');

// grain and dust, drawn once from a seed
{
  const rnd = mulberry(2026);
  const n = 384, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  document.getElementById('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  const dust = document.getElementById('dust'); dust.width = F.w; dust.height = F.h;
  const d = dust.getContext('2d');
  for (let i = 0; i < 60; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, s = 0.6 + rnd() * rnd() * 2.4;
    d.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.5)' : 'rgba(240,235,225,0.35)';
    d.beginPath(); d.ellipse(x, y, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
}
const grain = document.getElementById('grain');

// one four-point glint on the chrome lattice, once per loop
const glintEl = document.getElementById('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINT = { t0: 2.2, life: 1.0, size: F.globe.d * 0.28 };

// ---------- time ----------
const pole = new THREE.Vector3();
function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  // the globe drifts and turns a little
  globeSpin.rotation.y = rad(F.globe.yaw + 9 * Math.sin(TAU * u));
  globeRoot.position.y = wy(F.globe.y) + 0.05 * Math.sin(TAU * u * 2);
  globeRoot.updateMatrixWorld(true);
  hook.getWorldPosition(pole); pole.y -= 0.06;
  // the tag: a pendulum swing, a gentle twist, and once a loop a slow full turn to show its maker
  hang.position.copy(pole);
  hang.rotation.z = rad(2.6 * Math.sin(TAU * u * 3 + 0.4));
  twist.rotation.y = rad(9 * Math.sin(TAU * u * 2 + 0.3));
  const nw = NODE.clone(); globe.localToWorld(nw);
  smallHang.position.copy(nw);
  smallHang.rotation.z = rad(3.2 * Math.sin(TAU * u * 3 + 1.7));
  smallTwist.rotation.y = rad(F.small.yaw + 16 * Math.sin(TAU * u * 2 + 2.2)) + TAU * smooth((t - 6.2) / 3.6);
  scene.environmentRotation.y = 0.4 * Math.sin(TAU * u + 0.8);

  renderer.render(scene, camera);
  vctx.clearRect(0, 0, F.w, F.h);
  vctx.drawImage(canvas, 0, 0);
  bctx.clearRect(0, 0, bloom.width, bloom.height);
  bctx.drawImage(canvas, 0, 0, bloom.width, bloom.height);

  const p = (t - GLINT.t0) / GLINT.life, on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.5 : 0;
  const gp = new THREE.Vector3(-0.55, 0.62, 0.55).multiplyScalar(GR); globeTilt.localToWorld(gp); gp.project(camera);
  const gx = (gp.x + 1) / 2 * F.w, gy = (1 - gp.y) / 2 * F.h;
  glintSvg.style.cssText = `left:${gx - GLINT.size / 2}px;top:${gy - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 10px rgba(255,255,255,0.9))`;

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer } };
setTime(Number(q.get('t') || 0));
window.ready = true;
