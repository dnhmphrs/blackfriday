// GME Black Friday TV spot: the loud local-retailer kind, the one that runs between the news
// and the weather. Red light rays, a huge spiky yellow flash shouting 30% OFF!, BLACK FRIDAY
// slammed in chrome with a bevel, the product (the internet, as GME's chrome cut globe) spinning
// with a dayglo discount sticker stamped on it, the store's own logo with "Every website. Fri
// 27 Nov.", and a crawl along the bottom. Cheap lens flares. Tape glow is added in vhs.py.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, castShadows, canvasTexture } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';
import { onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Layout per format (px).
//   title: chrome BLACK FRIDAY, centred on cx, top at y, each line fitted to w
//   hero: the globe's centre and diameter on screen; rays fan out from it
//   burst: the big spiky flash (centre, diameter, tilt); hurry: the small one
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    title: { cx: 540, y: 268, w: 990, lines: ['BLACK', 'FRIDAY'], gap: 0.1, rot: -3 },
    hero: { x: 716, y: 950, d: 480 },
    burst: { cx: 262, cy: 1010, d: 520, rot: -12 },
    hurry: { cx: 966, cy: 1110, d: 236, rot: 14 },
    strip: { x: -30, y: 1230, w: 1140, h: 98, size: 70, rot: -2 },
    store: { x: 34, y: 1330, w: 1012, h: 124, size: 48 },
    ticker: { y: 1462, h: 96, size: 50, speed: 190 },
    door: { x: 40, y: 1600, w: 1000, h: 190, size: 104 },
  },
  '1x1': {
    w: 1080, h: 1080,
    title: { cx: 540, y: 66, w: 1030, lines: ['BLACK FRIDAY'], gap: 0, rot: -2, sy: 1.75 },
    hero: { x: 744, y: 476, d: 400 },
    burst: { cx: 280, cy: 486, d: 470, rot: -12 },
    hurry: { cx: 990, cy: 640, d: 176, rot: 14 },
    strip: { x: -30, y: 708, w: 1140, h: 84, size: 60, rot: -2 },
    store: { x: 30, y: 800, w: 1020, h: 118, size: 44 },
    ticker: { y: 942, h: 100, size: 50, speed: 180 },
  },
  // the extension's own banner, down the right-hand 30% of a desktop page (seen ~400px wide)
  'banner-v': {
    w: 1080, h: 2025,
    title: { cx: 540, y: 56, w: 1010, lines: ['BLACK', 'FRIDAY'], gap: 0.1, rot: -3 },
    hero: { x: 716, y: 790, d: 540 },
    burst: { cx: 268, cy: 860, d: 560, rot: -12 },
    hurry: { cx: 950, cy: 1000, d: 250, rot: 14 },
    strip: { x: -30, y: 1150, w: 1140, h: 124, size: 88, rot: -2 },
    store: { x: 30, y: 1296, w: 1020, h: 170, size: 64 },
    ticker: { y: 1500, h: 136, size: 74, speed: 230 },
    door: { x: 30, y: 1676, w: 1020, h: 290, size: 150 },
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
F.yaw0 = Number(q.get('yaw') ?? 40);       // the globe's turn at frame 12
F.elev = Number(q.get('elev') ?? 14);
F.slon = Number(q.get('slon') ?? 320);     // where the sticker is stamped (globe longitude, latitude)
F.slat = Number(q.get('slat') ?? 32);

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (parent) parent.append(e); return e; };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const wrap = (t) => ((t % DURATION) + DURATION) % DURATION;
// distance from t to the nearest occurrence of t0 in the loop, signed (t - t0)
const since = (t, t0) => { let p = wrap(t - t0); if (p > DURATION / 2) p -= DURATION; return p; };

// ---------- fonts ----------
await Promise.all(['400 100px "Archivo Black"', 'italic 900 100px "Inter"', '900 100px "Inter"'].map((f) => document.fonts.load(f)));

// ---------- light rays ----------
const rays = $('rays');
rays.width = F.w; rays.height = F.h;
const rctx = rays.getContext('2d');
const NRAYS = 18;
function drawRays(t) {
  const g = rctx, cx = F.hero.x, cy = F.hero.y, R = Math.hypot(F.w, F.h) * 1.1;
  g.fillStyle = '#9a0008'; g.fillRect(0, 0, F.w, F.h);
  const step = TAU / NRAYS, rot = (t / DURATION) * step * 2;   // turns two rays per loop
  g.fillStyle = '#e4000c';
  for (let i = 0; i < NRAYS; i++) {
    const a = rot + i * step;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    g.lineTo(cx + Math.cos(a + step * 0.5) * R, cy + Math.sin(a + step * 0.5) * R);
    g.closePath(); g.fill();
  }
  // hot centre behind the product, breathing
  const k = 1 + 0.06 * Math.sin(TAU * t / 3);
  let rg = g.createRadialGradient(cx, cy, 0, cx, cy, F.hero.d * 1.25 * k);
  rg.addColorStop(0, 'rgba(255,250,210,1)'); rg.addColorStop(0.3, 'rgba(255,214,60,0.9)'); rg.addColorStop(0.62, 'rgba(255,90,0,0.45)'); rg.addColorStop(1, 'rgba(255,40,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, F.w, F.h);
  // vignette to black at the edges of the screen, like a cheap TV studio
  rg = g.createRadialGradient(cx, cy, F.hero.d * 0.5, cx, cy, Math.max(F.w, F.h) * 0.85);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(0.55, 'rgba(10,0,0,0.35)'); rg.addColorStop(1, 'rgba(0,0,0,0.92)');
  g.fillStyle = rg; g.fillRect(0, 0, F.w, F.h);
  // the top of the screen is darker, where the chrome title sits
  const lg = g.createLinearGradient(0, 0, 0, F.title.y + F.w * 0.5);
  lg.addColorStop(0, 'rgba(0,0,0,0.75)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = lg; g.fillRect(0, 0, F.w, F.h);
}

// ---------- 3D: the product, spinning ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px'; canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = studio(renderer);
scene.environmentIntensity = 1.15;
key.intensity = 2.6; key.position.set(-5, 7, 6);
{
  const pxPerUnit = F.hero.d / 2;
  const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
  const elev = (F.elev * Math.PI) / 180;
  camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(F.w, F.h, F.w / 2 - F.hero.x, F.h / 2 - F.hero.y, F.w, F.h);
}
const pivot = new THREE.Group();
scene.add(pivot);
const globe = castShadows(await buildObject('globe-core'));
globe.userData.slice.visible = false;
// the cut faces: printed card, not lacquer, so the colours stay hot under the studio lights
globe.traverse((o) => { if (o.isMesh && o.material.map && !o.material.metalness) { o.material.clearcoat = 0.12; o.material.envMapIntensity = 0.22; o.material.roughness = 0.7; o.material.toneMapped = false; } });
pivot.add(globe);

// A TV studio lit hot: a white key, a long strip, and red and yellow gels that the chrome picks up.
function studio(r, size = 1024) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.02, 0.02, 0.05), band = vec3(0.12, 0.12, 0.16), glow = vec3(1.3, 1.1, 0.85), flo = vec3(0.02, 0.0, 0.0);
      vec3 c = mix(band, zen, smoothstep(0.0, 0.8, up));
      c += glow * smoothstep(0.15, 1.0, -d.z) * (1.0 - smoothstep(0.0, 0.5, abs(up)));
      c = mix(c, flo, smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(8, 8, [-7, 9, 7], 16);                         // key softbox
  card(1.2, 16, [11, 2, 2], 16, [0.95, 0.97, 1]);      // strip right
  card(12, 0.8, [0, 11, -2], 10);                      // overhead bar
  card(1.6, 12, [-11, 1, -3], 10, [1, 0.1, 0.05]);    // red gel, back left
  card(3, 3, [7, 6, -8], 10, [1, 0.8, 0.1]);          // yellow gel, back right
  card(14, 2.5, [0, -3, 12], 2.2, [1, 0.85, 0.6]);    // warm bounce from the floor
  card(4, 9, [3, 3, 11], 0);                            // black flag
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// The discount sticker, stamped on the globe's lattice: a round dayglo label wrapped to the
// sphere, its lower-right edge peeling up to show the white backing.
const sticker = new THREE.Group();
{
  const tex = canvasTexture(1024, (g, n) => {
    const c = n / 2;
    g.clearRect(0, 0, n, n);
    // dayglo disc with a slightly darker printed ring
    const rg = g.createRadialGradient(c, c * 0.9, 0, c, c, c);
    rg.addColorStop(0, '#a8ff2a'); rg.addColorStop(0.8, '#62ff00'); rg.addColorStop(1, '#3ee000');
    g.fillStyle = rg; g.beginPath(); g.arc(c, c, c * 0.985, 0, TAU); g.fill();
    g.lineWidth = n * 0.02; g.strokeStyle = '#0a0a0a'; g.beginPath(); g.arc(c, c, c * 0.87, 0, TAU); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#0a0a0a';
    g.font = `900 ${n * 0.13}px Inter`; g.fillText('SAVE', c, c * 0.62);
    g.font = `400 ${n * 0.36}px "Archivo Black"`; g.fillText('30%', c, c * 1.24);
    g.font = `900 ${n * 0.15}px Inter`; g.fillText('OFF', c, c * 1.56);
  });
  const alpha = canvasTexture(256, (g, n) => { g.fillStyle = '#000'; g.fillRect(0, 0, n, n); g.fillStyle = '#fff'; g.beginPath(); g.arc(n / 2, n / 2, n / 2 * 0.985, 0, TAU); g.fill(); });
  const N = 48, size = 1.16, Rw = 1.06;
  const geo = new THREE.PlaneGeometry(size, size, N, N);
  geo.userData.flat = geo.attributes.position.array.slice();
  // dayglo: the ink fluoresces, so it carries a little of its own light
  const front = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.22, alphaTest: 0.5, roughness: 0.55, metalness: 0, side: THREE.FrontSide, envMapIntensity: 0.15 });
  front.color.setScalar(0.5);   // keeps the lit ink from blowing out to white (it is not tone mapped)
  const back = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, alphaMap: alpha, alphaTest: 0.5, roughness: 0.7, side: THREE.BackSide });
  // alphaMap reads the green channel; the disc is opaque there, the corners are clear
  front.toneMapped = false;
  const m1 = new THREE.Mesh(geo, front), m2 = new THREE.Mesh(geo, back);
  m1.castShadow = m2.castShadow = true; m1.receiveShadow = true;
  sticker.add(m1, m2);
  sticker.userData = { geo, Rw, size };
  // place it: tangent at (lat, lon) on the globe, facing out
  const p = onSphere(1, F.slat, F.slon);
  sticker.position.copy(p);
  sticker.lookAt(p.clone().multiplyScalar(2));
  sticker.rotateZ(Number(q.get('srot') ?? 0.35));
  globe.add(sticker);
}
// wrap the label to the sphere and lift the peel: everything past the peel line turns up about it
function shapeSticker(peel) {
  const { geo, Rw } = sticker.userData;
  const flat = geo.userData.flat, pos = geo.attributes.position.array;
  const dir = new THREE.Vector2(Number(q.get('pdx') ?? -0.4), Number(q.get('pdy') ?? -1)).normalize();   // towards the peeling edge
  const line = 0.37;                                         // distance from centre where it lets go
  for (let i = 0; i < pos.length; i += 3) {
    const x = flat[i], y = flat[i + 1];
    let z = Math.sqrt(Math.max(0, Rw * Rw - x * x - y * y)) - Rw + (Rw - 1);  // on the sphere, just outside the wires
    let X = x, Y = y;
    const d = x * dir.x + y * dir.y - line;
    if (d > 0) {
      // curl: bend up around the line with a radius, like real vinyl lifting
      const a = Math.min(peel, d * 8 * peel);
      const along = d;
      const bx = (Math.cos(a) - 1) * along, bz = Math.sin(a) * along;
      X += dir.x * bx; Y += dir.y * bx; z += bz + 0.006;
    }
    pos[i] = X; pos[i + 1] = Y; pos[i + 2] = z + 0.004;
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeVertexNormals();
}

// bloom: a blurred copy of the product, screened back over it (the hot studio halation)
const bloomEl = $('bloom'); const BS = 4;
bloomEl.width = Math.ceil(F.w / BS); bloomEl.height = Math.ceil(F.h / BS);
bloomEl.style.width = F.w + 'px'; bloomEl.style.height = F.h + 'px';
const bctx = bloomEl.getContext('2d');

// ---------- the chrome title ----------
const title = $('title');
title.setAttribute('width', F.w); title.setAttribute('height', F.h);
title.setAttribute('viewBox', `0 0 ${F.w} ${F.h}`);
const defs = svgEl('defs', {}, title);
// burst face: hot yellow, deeper at the points
{
  const g = svgEl('radialGradient', { id: 'burst-grad', cx: '0', cy: '-0.1', r: '1.05', gradientUnits: 'userSpaceOnUse' }, defs);
  [['0', '#fffbd0'], ['0.35', '#fff200'], ['0.75', '#ffd400'], ['1', '#ff9d00']].forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, g));
}
const TITLE = { lines: [], group: svgEl('g', {}, title) };
{
  const T = F.title;
  const mc = document.createElement('canvas').getContext('2d');
  mc.font = '400 100px "Archivo Black"';
  const capK = mc.measureText('H').actualBoundingBoxAscent / 100;
  let y = T.y;
  const SKEW = 12, skewT = Math.tan((SKEW * Math.PI) / 180);
  T.lines.forEach((text, i) => {
    const w100 = mc.measureText(text).width;
    const S = (100 * (T.w - capK * 100 * skewT * 0)) / w100;
    const cap = capK * S;
    const base = y + cap;
    // per-line chrome: sky, a bright horizon, a dark line, warm ground (the 1980s airbrush chrome)
    const cg = svgEl('linearGradient', { id: `chrome-${i}`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: -cap, x2: 0, y2: 0 }, defs);
    [['0', '#1d4fd8'], ['0.18', '#6e9bff'], ['0.47', '#ffffff'], ['0.5', '#ffffff'], ['0.515', '#1a0f2a'], ['0.58', '#5b3a52'],
      ['0.8', '#f4c9a0'], ['0.95', '#fffaf0'], ['1', '#ffffff']].forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, cg));
    const ext = svgEl('linearGradient', { id: `ext-${i}`, gradientUnits: 'userSpaceOnUse', x1: 0, y1: -cap, x2: 0, y2: 0 }, defs);
    [['0', '#ff4a3a'], ['0.5', '#c4000a'], ['1', '#5a0004']].forEach(([o, c]) => svgEl('stop', { offset: o, 'stop-color': c }, ext));
    const sh = svgEl('linearGradient', { id: `shine-${i}`, gradientUnits: 'userSpaceOnUse', x1: -S, y1: 0, x2: S, y2: -cap * 0.3 }, defs);
    [['0', 'rgba(255,255,255,0)'], ['0.42', 'rgba(255,255,255,0)'], ['0.5', 'rgba(255,255,255,0.95)'], ['0.58', 'rgba(255,255,255,0)'], ['1', 'rgba(255,255,255,0)']]
      .forEach(([o, c]) => { const [r, g, b, a] = c.match(/[\d.]+/g); svgEl('stop', { offset: o, 'stop-color': `rgb(${r},${g},${b})`, 'stop-opacity': a }, sh); });
    const f = svgEl('filter', { id: `bevel-${i}`, x: '-5%', y: '-15%', width: '110%', height: '130%', 'color-interpolation-filters': 'sRGB' }, defs);
    f.innerHTML = `
      <feGaussianBlur in="SourceAlpha" stdDeviation="${(S * 0.022).toFixed(2)}" result="blur"/>
      <feSpecularLighting in="blur" surfaceScale="${(S * 0.05).toFixed(2)}" specularConstant="1.25" specularExponent="22" lighting-color="#ffffff" result="spec"><feDistantLight azimuth="235" elevation="34"/></feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
      <feDiffuseLighting in="blur" surfaceScale="${(S * 0.05).toFixed(2)}" diffuseConstant="1" lighting-color="#ffffff" result="diff"><feDistantLight azimuth="235" elevation="48"/></feDiffuseLighting>
      <feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.25" k2="0" k3="0" k4="0" result="shaded"/>
      <feComposite in="shaded" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.85" k4="0" result="lit"/>
      <feComposite in="lit" in2="SourceAlpha" operator="in"/>`;
    const g = svgEl('g', { transform: `translate(${T.cx},${base.toFixed(1)}) skewX(${-SKEW})` }, TITLE.group);
    const common = { x: 0, y: 0, 'text-anchor': 'middle', 'font-family': 'Archivo Black', 'font-size': S.toFixed(2) };
    // a dark halo so the chrome reads against anything
    const halo = svgEl('text', { ...common, fill: '#000', stroke: '#000', 'stroke-width': (S * 0.09).toFixed(1), 'stroke-linejoin': 'round', opacity: 0.55, style: `filter: blur(${(S * 0.06).toFixed(1)}px)` }, g);
    halo.textContent = text;
    // the extrusion: a red block going back down and to the right
    const NX = 14, dx = S * 0.0042, dy = S * 0.0062;
    for (let k = NX; k >= 1; k--) {
      const e = svgEl('text', { ...common, fill: k === NX ? '#000' : `url(#ext-${i})`, stroke: k === NX ? '#000' : 'none', 'stroke-width': S * 0.03, 'stroke-linejoin': 'round', transform: `translate(${(k * dx).toFixed(2)},${(k * dy).toFixed(2)})` }, g);
      e.textContent = text;
      if (k < NX) e.setAttribute('style', `filter: brightness(${(1 - k / NX * 0.55).toFixed(3)})`);
    }
    const outline = svgEl('text', { ...common, fill: '#000', stroke: '#0a0a14', 'stroke-width': (S * 0.035).toFixed(2), 'stroke-linejoin': 'round' }, g);
    outline.textContent = text;
    const face = svgEl('text', { ...common, fill: `url(#chrome-${i})`, filter: `url(#bevel-${i})` }, g);
    face.textContent = text;
    const rim = svgEl('text', { ...common, fill: 'none', stroke: '#ffffff', 'stroke-width': (S * 0.008).toFixed(2), opacity: 0.75 }, g);
    rim.textContent = text;
    const shine = svgEl('text', { ...common, fill: `url(#shine-${i})`, style: 'mix-blend-mode: screen' }, g);
    shine.textContent = text;
    TITLE.lines.push({ S, cap, base, w: w100 * S / 100, shine: sh });
    y = base + T.gap * cap + S * 0.09;
  });
  TITLE.box = { x: T.cx - T.w / 2, y: T.y, w: T.w, h: y - T.y };
}

// ---------- the flashes ----------
const star = (n, inner, rot = 0, jag = 0) => Array.from({ length: n * 2 }, (_, i) => {
  const a = (i / (n * 2)) * TAU + rot;
  // a hand-cut flash: the points are not all the same length
  const r = i % 2 ? inner : 1 - jag * (0.5 + 0.5 * Math.sin(i * 2.399));
  return `${(Math.sin(a) * r).toFixed(4)},${(-Math.cos(a) * r).toFixed(4)}`;
}).join(' ');
{
  const B = F.burst, el = $('burst');
  el.style.left = (B.cx - B.d / 2) + 'px'; el.style.top = (B.cy - B.d / 2) + 'px';
  stage.style.setProperty('--bw', B.d + 'px');
  $('burst-shadow').setAttribute('points', star(16, 0.74, 0, 0.12));
  $('burst-edge').setAttribute('points', star(16, 0.74, 0, 0.12));
  $('burst-face').setAttribute('points', star(16, 0.74, 0, 0.12));
  $('burst-face').setAttribute('transform', 'scale(0.9)');
  const H = F.hurry, h = $('hurry');
  h.style.left = (H.cx - H.d / 2) + 'px'; h.style.top = (H.cy - H.d / 2) + 'px';
  stage.style.setProperty('--hw', H.d + 'px');
  $('hurry-edge').setAttribute('points', star(12, 0.78, 0.1, 0.06));
  $('hurry-face').setAttribute('points', star(12, 0.78, 0.1, 0.06));
  $('hurry-face').setAttribute('transform', 'scale(0.9)');
}

// ---------- strip, store card ----------
{
  const S = F.strip, el = $('strip');
  Object.assign(el.style, { left: S.x + 'px', top: S.y + 'px', width: S.w + 'px', transform: `rotate(${S.rot}deg)` });
  stage.style.setProperty('--sh', S.h + 'px'); stage.style.setProperty('--ss', S.size + 'px');
  const C = F.store, c = $('store');
  Object.assign(c.style, { left: C.x + 'px', top: C.y + 'px', width: C.w + 'px' });
  stage.style.setProperty('--ch', C.h + 'px'); stage.style.setProperty('--cs', C.size + 'px');
}

// ---------- doorbuster sign with chaser bulbs ----------
const DOOR = { bulbs: [] };
if (F.door) {
  const D = F.door, el = $('door');
  Object.assign(el.style, { left: D.x + 'px', top: D.y + 'px', width: D.w + 'px', height: D.h + 'px' });
  stage.style.setProperty('--dh', D.h + 'px'); stage.style.setProperty('--ds', D.size + 'px');
  // fit the big word inside the bulbs
  const word = el.querySelector('.door-txt b'), ww = word.getBoundingClientRect().width;
  if (ww > D.w * 0.84) stage.style.setProperty('--ds', (D.size * D.w * 0.84 / ww).toFixed(1) + 'px');
  const pitch = D.h * 0.16, inset = D.h * 0.07;
  const nx = Math.round((D.w - 2 * inset) / pitch), ny = Math.max(1, Math.round((D.h - 2 * inset) / pitch));
  const pts = [];
  for (let i = 0; i < nx; i++) pts.push([inset + (i + 0.5) * (D.w - 2 * inset) / nx, inset]);
  for (let i = 0; i < ny; i++) pts.push([D.w - inset, inset + (i + 0.5) * (D.h - 2 * inset) / ny]);
  for (let i = nx - 1; i >= 0; i--) pts.push([inset + (i + 0.5) * (D.w - 2 * inset) / nx, D.h - inset]);
  for (let i = ny - 1; i >= 0; i--) pts.push([inset, inset + (i + 0.5) * (D.h - 2 * inset) / ny]);
  for (const [x, y] of pts) { const b = document.createElement('i'); b.style.left = x + 'px'; b.style.top = y + 'px'; $('bulbs').append(b); DOOR.bulbs.push(b); }
} else $('door').style.display = 'none';

// ---------- ticker: the five lines, on a loop ----------
const LINES = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];
const STAR5 = 'M0,-1 L0.2245,-0.309 L0.951,-0.309 L0.3633,0.118 L0.5878,0.809 L0,0.382 L-0.5878,0.809 L-0.3633,0.118 L-0.951,-0.309 L-0.2245,-0.309Z';
const TK = { el: $('ticker'), track: $('track') };
{
  const T = F.ticker;
  Object.assign(TK.el.style, { top: T.y + 'px' });
  stage.style.setProperty('--th', T.h + 'px'); stage.style.setProperty('--ts', T.size + 'px');
  const unit = document.createElement('div'); unit.className = 'unit';
  unit.innerHTML = LINES.map((l) => `<span class="line">${l}</span><svg class="sep" viewBox="-1 -1 2 2"><path d="${STAR5}"/></svg>`).join('');
  TK.track.append(unit);
  TK.unitW = unit.getBoundingClientRect().width;
  const copies = Math.ceil(F.w / TK.unitW) + 1;
  for (let i = 0; i < copies; i++) TK.track.append(unit.cloneNode(true));
  TK.loops = Math.max(1, Math.round((T.speed * DURATION) / TK.unitW));   // whole units per loop: seamless
}

// ---------- sparkles on the chrome ----------
const STAR4 = 'M0,-1 C0.07,-0.22 0.22,-0.07 1,0 C0.22,0.07 0.07,0.22 0,1 C-0.07,0.22 -0.22,0.07 -1,0 C-0.22,-0.07 -0.07,-0.22 0,-1Z';
const SPARKS = [];
{
  const B = TITLE.box, L = TITLE.lines;
  const spots = [
    [B.x + B.w * 0.06, L[0].base - L[0].cap * 0.95, 1.0, 0.0],
    [B.x + B.w * 0.93, L[L.length - 1].base - L[L.length - 1].cap * 0.2, 0.85, 0.35],
    [B.x + B.w * 0.56, L[0].base - L[0].cap * 0.55, 0.7, 0.6],
    [F.hero.x - F.hero.d * 0.3, F.hero.y - F.hero.d * 0.36, 0.8, 0.8],
  ];
  for (const [x, y, s, ph] of spots) {
    const el = svgEl('svg', { viewBox: '-1 -1 2 2' }); el.innerHTML = `<path d="${STAR4}" fill="#fff"/>`;
    $('sparks').append(el);
    SPARKS.push({ el, x, y, size: F.w * 0.11 * s, ph });
  }
}

// ---------- cheap lens flare ----------
const flare = $('flare');
flare.width = F.w; flare.height = F.h;
const fctx = flare.getContext('2d');
function drawFlare(sx, sy, k) {
  const g = fctx, cx = F.w / 2, cy = F.h * 0.55, s = F.w / 1080;
  if (k <= 0.001) return;
  g.globalCompositeOperation = 'lighter';
  const blob = (x, y, r, col, a, hard = 0.0) => {
    const rg = g.createRadialGradient(x, y, r * hard, x, y, r);
    rg.addColorStop(0, `rgba(${col},${a * k})`); rg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };
  blob(sx, sy, 200 * s, '255,240,200', 0.75);
  blob(sx, sy, 60 * s, '255,255,255', 1, 0.2);
  // anamorphic streak
  g.save(); g.translate(sx, sy); g.scale(1, 0.03);
  blob(0, 0, 620 * s, '170,200,255', 0.8);
  g.restore();
  // star rays
  g.save(); g.translate(sx, sy);
  for (let i = 0; i < 6; i++) {
    g.rotate(TAU / 12 + (i ? TAU / 6 : 0));
    const lg = g.createLinearGradient(0, 0, 260 * s, 0);
    lg.addColorStop(0, `rgba(255,255,255,${0.7 * k})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg; g.fillRect(0, -1.5 * s, 260 * s, 3 * s);
  }
  g.restore();
  // rainbow ring
  const ring = g.createRadialGradient(sx, sy, 150 * s, sx, sy, 190 * s);
  [['0', 'rgba(255,0,0,0)'], ['0.25', `rgba(255,60,0,${0.18 * k})`], ['0.5', `rgba(255,255,0,${0.16 * k})`], ['0.7', `rgba(0,255,120,${0.12 * k})`], ['0.85', `rgba(0,120,255,${0.14 * k})`], ['1', 'rgba(0,0,255,0)']].forEach(([o, c]) => ring.addColorStop(Number(o), c));
  g.fillStyle = ring; g.beginPath(); g.arc(sx, sy, 190 * s, 0, TAU); g.fill();
  // ghosts down the line through the centre of the lens
  const ghosts = [[0.45, 22, '120,255,170', 0.35], [0.7, 46, '80,140,255', 0.22], [1.15, 30, '255,200,80', 0.3], [1.4, 80, '160,90,255', 0.14], [1.75, 18, '255,255,255', 0.4], [2.0, 120, '255,120,40', 0.08]];
  for (const [f, r, col, a] of ghosts) {
    const x = sx + (cx - sx) * f, y = sy + (cy - sy) * f;
    // hexagonal aperture ghost
    g.fillStyle = `rgba(${col},${a * k})`;
    g.beginPath();
    for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + 0.3; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(ang) * r * s, y + Math.sin(ang) * r * s); }
    g.closePath(); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
}

// marks must be decoded before ready
await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

const toScreen = (v, obj = globe) => { const p = v.clone(); obj.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

// The beats of the spot, in seconds (the loop repeats every 12):
//   0.0  BLACK FRIDAY re-slams (frame 12 is just after the hit, the shot everyone remembers)
//   2.0, 6.0, 10.0  the flash zooms in and punches
//   6.0  BLACK FRIDAY slams again
//   the globe turns once a loop; the flare rides its chrome
const SLAMS = [11.85, 5.85];
const PUNCHES = [1.9, 5.9, 9.9];

function setTime(t) {
  t = wrap(t);
  const u = t / DURATION;

  drawRays(t);

  // the product turns once per loop; the sticker's flap breathes in the studio fans
  // it lingers on the cut (the product shot) and whips round the back: one turn a loop
  const v = (t - 0.4) / DURATION;
  pivot.rotation.y = ((F.yaw0 - 360 * (v - 0.8 * Math.sin(TAU * v) / TAU)) * Math.PI) / 180;
  pivot.position.y = 0.025 * Math.sin(TAU * u * 3);
  shapeSticker(Number(q.get('peel') ?? 1.45) + 0.1 * Math.sin(TAU * u * 4));
  scene.environmentRotation.y = 0.25 * Math.sin(TAU * u);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();
  renderer.render(scene, camera);
  bctx.clearRect(0, 0, bloomEl.width, bloomEl.height);
  bctx.filter = 'blur(6px) brightness(1.1)';
  bctx.drawImage(canvas, 0, 0, bloomEl.width, bloomEl.height);

  // BLACK FRIDAY: comes in from huge, hits, wobbles to rest
  let s = 1, flash = 0;
  for (const t0 of SLAMS) {
    const p = since(t, t0);
    if (p >= -0.15 && p < 0) s *= 1 + 1.6 * Math.pow(-p / 0.15, 1.6);
    else if (p >= 0 && p < 1.2) { s *= 1 - 0.07 * Math.exp(-p * 6) * Math.cos(p * 26); flash = Math.max(flash, Math.exp(-p * 7)); }
  }
  const T = F.title, B = TITLE.box, ox = T.cx, oy = B.y + B.h / 2;
  const sway = 1.2 * Math.sin(TAU * u * 2);
  // (on the square the operator stretched it tall to fill the frame)
  TITLE.group.setAttribute('transform', `translate(${ox},${oy}) rotate(${(T.rot + sway * 0.3).toFixed(3)}) scale(${s.toFixed(4)}) scale(1,${T.sy || 1}) translate(${-ox},${-oy})`);
  TITLE.group.style.opacity = s > 2 ? 0 : 1;
  // a shine crosses the chrome: right after each slam
  for (const L of TITLE.lines) {
    const ps = clamp(Math.min(...SLAMS.map((t0) => { const p = since(t, t0 + 0.05); return p < 0 ? 9 : p; })) / 0.9, 0, 1.2);
    const x = -L.w * 0.9 + ps * L.w * 1.8;
    L.shine.setAttribute('gradientTransform', `translate(${x.toFixed(1)},0)`);
  }

  // the big flash: always turning a little and throbbing, and a zoom punch every four seconds
  {
    const Bu = F.burst;
    let z = 1 + 0.035 * Math.sin(TAU * u * 6);
    for (const t0 of PUNCHES) {
      const p = since(t, t0);
      if (p >= -0.25 && p < 0) z *= 0.7 + 0.3 * (1 + p / 0.25);
      else if (p >= 0 && p < 1) z *= 1 + 0.16 * Math.exp(-p * 7) * Math.cos(p * 22);
    }
    const r = Bu.rot + 4 * Math.sin(TAU * u * 2);
    $('burst').style.transform = `rotate(${r.toFixed(2)}deg) scale(${z.toFixed(4)})`;
    const H = F.hurry, zh = 1 + 0.07 * Math.max(0, Math.sin(TAU * u * 12));
    // it rocks rather than turns: its points are hand-cut and uneven, so a turn would pop at the loop
    $('hurry').style.transform = `rotate(${(H.rot + 9 * Math.sin(TAU * u * 2)).toFixed(2)}deg) scale(${zh.toFixed(4)})`;
  }

  // the doorbuster's bulbs chase round, a step every eighth of a second (96 steps a loop)
  { const step = Math.floor(t * 8 + 1e-6); DOOR.bulbs.forEach((b, i) => b.classList.toggle('on', (i + step) % 3 === 0)); }

  // the crawl
  const off = ((u * TK.loops) % 1) * TK.unitW;
  TK.track.style.transform = `translateX(${(-off).toFixed(2)}px)`;

  // sparkles twinkle over the chrome
  for (const S of SPARKS) {
    const k = Math.max(0, Math.sin(TAU * (u * 3 + S.ph))) ** 4;
    S.el.style.cssText = `left:${S.x - S.size / 2}px;top:${S.y - S.size / 2}px;width:${S.size}px;height:${S.size}px;opacity:${k.toFixed(3)};transform:scale(${(0.2 + 0.8 * k).toFixed(3)}) rotate(${(u * 90).toFixed(1)}deg);filter:drop-shadow(0 0 ${(S.size * 0.12).toFixed(1)}px #fff)`;
  }

  // the lens flare: a hot point riding the top of the globe, swelling at each slam
  fctx.clearRect(0, 0, F.w, F.h);
  const fx = F.hero.x + F.hero.d * (0.28 + 0.06 * Math.sin(TAU * u)), fy = F.hero.y - F.hero.d * 0.38;
  drawFlare(fx, fy, 0.55 + 0.2 * Math.sin(TAU * u * 2) + 0.45 * flash);
  // and a second one that sweeps the title on the slam
  if (flash > 0.02) drawFlare(B.x + B.w * (0.15 + 0.7 * (1 - flash)), B.y + B.h * 0.35, flash * 0.9);
}

if (q.get('debug') === 'nofx') { bloomEl.style.display = 'none'; flare.style.display = 'none'; }
if (q.get('debug') === 'glonly') { for (const el of stage.children) if (el !== canvas) el.style.display = 'none'; }
window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe } };
setTime(Number(q.get('t') || 0.4));
window.ready = true;
