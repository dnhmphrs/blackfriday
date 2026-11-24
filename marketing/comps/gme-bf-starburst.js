// The Starburst. The loudest shape in retail, made properly: a lacquered, chrome-backed
// explosion with "30% OFF" bursting out of it, turning slowly in a hazy GME sky.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { createStage, materials } from '../lib/stage.js';
import { makeText, extrudeShape } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// burst: centre and diameter (px) of the big yellow burst.  title: lines, fitted width, top.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, gut: 56, docTop: 96, docSize: 26,
    kicker: { y: 266, size: 34 },
    title: { lines: ['Black Friday'], width: 984, top: 308 },
    burst: { x: 540, y: 912, d: 905 },
    ribbon: { x: 540, y: 1284, w: 820, h: 124, angle: -6 },
    under: { y: 1392, size: 48 },
    lockup: { x: 56, y: 1464, h: 94 },
    foot: { x: 400, y: 1490, w: 624, size: 36, align: 'right' },
    strip: { y: 1652, size: 24 },
    pins: { y: 1604, h: 30 },
    fine: { y: 1730, size: 19 },
  },
  '1x1': {
    w: 1080, h: 1080, gut: 44, docTop: 30, docSize: 19,
    kicker: null,
    title: { lines: ['Black Friday'], width: 992, top: 92 },
    burst: { x: 392, y: 642, d: 690 },
    ribbon: { x: 392, y: 930, w: 560, h: 90, angle: -6 },
    under: null,
    side: { x: 772, y: 352, w: 262, gap: 10 },
    lockup: { x: 772, y: 724, h: 74 },
    foot: { x: 772, y: 830, w: 270, size: 25 },
    strip: { y: 1034, size: 17 },
    pins: { y: 1004, h: 18 },
    fine: null,
  },
  'banner-v': {
    w: 1080, h: 2025, gut: 60, docTop: 56, docSize: 30,
    kicker: { y: 170, size: 46 },
    title: { lines: ['Black', 'Friday'], width: 780, top: 226 },
    burst: { x: 540, y: 1240, d: 900 },
    ribbon: { x: 540, y: 1618, w: 760, h: 150, angle: -6 },
    under: { y: 1768, size: 57 },
    lockup: { x: 60, y: 1850, h: 110 },
    pins: { y: 1990, h: 35 },
    foot: { x: 380, y: 1878, w: 640, size: 38, align: 'right' },
    strip: null,
    fine: null,
  },
};
const COPY = {
  '9x16': {
    c3: 'Doorbusters<br>&amp; Stuff',
    kicker: 'One day only',
    under: 'On the <b>entire</b> internet',
    foot: '*The remaining 70% is in good&nbsp;order.',
    strip: ['Friday 27 November 2026', 'Every website'],
    fine: 'Limit one internet per customer. While supplies last. No purchase necessary.<br>Gary Mustard Enterprises accepts no responsibility for the remaining 70%.',
  },
  '1x1': {
    c3: 'Doorbusters<br>&amp; Stuff',
    side: [['On the', 0], ['entire', 1], ['internet', 0]],
    sideSub: 'Every website.<br>Black Friday only.',
    foot: '*The remaining 70%<br>is in good order.',
    strip: ['Friday 27 November 2026', 'Every website', 'One day only'],
  },
  'banner-v': {
    c3: 'This page<br>(30% off)',
    kicker: 'One day only',
    under: 'This <b>whole</b> website',
    foot: '*The remaining 70% is in good&nbsp;order.',
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const C = COPY[format];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
Object.assign(stage.style, { width: F.w + 'px', height: F.h + 'px' });
stage.style.setProperty('--gut', F.gut + 'px');
stage.style.setProperty('--docTop', F.docTop + 'px');
stage.style.setProperty('--docSize', F.docSize + 'px');

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const FACES = ['400 100px "Anton"', '400 100px "Oswald"', '500 100px "Oswald"', '600 100px "Oswald"', '500 40px "Libre Franklin"', '600 40px "Libre Franklin"',
  'italic 400 60px "EB Garamond"', '400 60px "EB Garamond"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));

// ---------- 3D ----------
const canvas = document.getElementById('gl');
Object.assign(canvas.style, { width: F.w + 'px', height: F.h + 'px' });
const FOV = 20;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
renderer.shadowMap.enabled = false;
scene.environment = lacquerStudio(renderer);
scene.environmentIntensity = 1.0;
const chromeEnv = lacquerStudio(renderer, 512, true);
key.castShadow = false;
key.intensity = 1.6;
key.position.set(-4, 6, 7);
const fill = new THREE.DirectionalLight(0xffe2c8, 0.7);
fill.position.set(5, -2, 6);
scene.add(fill);

const pxPerUnit = F.burst.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
camera.position.set(0, 0, dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.burst.x, F.h / 2 - F.burst.y, F.w, F.h);

const anton = new Font(await new TTFLoader().loadAsync('/node_modules/@fontsource/anton/files/anton-latin-400-normal.woff'));

const lacquer = (hex, extra = {}) => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), metalness: 0, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.035, ...extra });
const M = {
  yellow: lacquer('#ffc200'),
  yellowSide: lacquer('#d88a00', { roughness: 0.4 }),
  red: lacquer('#d4000c'),
  redSide: lacquer('#7d0610', { roughness: 0.35 }),
  chrome: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#e9eefc'), metalness: 1, roughness: 0.07, clearcoat: 0.6, clearcoatRoughness: 0.05 }),
  pearl: lacquer('#fbf6ea', { roughness: 0.2, sheen: 0.4, sheenColor: new THREE.Color('#ffd9c0') }),
  textSide: lacquer('#6a040c', { roughness: 0.3 }),
};
M.chrome.envMap = chromeEnv;

// a starburst outline: n points, alternate points pulled in by `alt` so it reads as an explosion
function burstShape(n, rOut, rIn, alt = 0, phase = 0) {
  const s = new THREE.Shape();
  for (let i = 0; i < 2 * n; i++) {
    const a = phase + Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 === 0 ? rOut * ((i / 2) % 2 === 1 ? 1 - alt : 1) : rIn;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
const pivot = new THREE.Group();
scene.add(pivot);
const LAYERS = {
  chrome: { n: 32, mesh: extrudeShape(burstShape(32, 1.075, 0.9, 0.05), { depth: 0.05, bevel: 0.025, front: M.chrome }), z: -0.2, turn: -720 / 32 },
  yellow: { n: 24, mesh: extrudeShape(burstShape(24, 1.0, 0.8, 0.075), { depth: 0.12, bevel: 0.035, front: M.yellow, side: M.yellowSide }), z: -0.06, turn: 720 / 24 },
  red: { n: 18, mesh: extrudeShape(burstShape(18, 0.83, 0.69, 0.06, 0.1), { depth: 0.12, bevel: 0.035, front: M.red, side: M.redSide }), z: 0.1, turn: -720 / 18 },
};
for (const L of Object.values(LAYERS)) { L.mesh.position.z = L.z; pivot.add(L.mesh); }

// "30%" / "OFF" in Anton, lacquered pearl with a deep red return, bursting past the red disc
const textGroup = new THREE.Group();
pivot.add(textGroup);
const fitText = (str, width, depth) => {
  const g = makeText(str, anton, { size: 1, depth, bevel: 0.03, front: M.pearl, side: M.textSide, curveSegments: 12 });
  const s = width / g.userData.size.x;
  g.scale.setScalar(s);
  g.userData.h = g.userData.size.y * s;
  return g;
};
const t30 = fitText('30%', 1.26, 0.22);
const tOff = fitText('OFF', 0.86, 0.22);
const gap = 0.07;
const stackH = t30.userData.h + gap + tOff.userData.h;
t30.position.set(0, stackH / 2 - t30.userData.h / 2 + 0.02, 0.3);
tOff.position.set(0, -stackH / 2 + tOff.userData.h / 2 + 0.02, 0.3);
textGroup.add(t30, tOff);

// A dark studio for lacquer: long soft boxes make long creamy highlights; the navy cyc and a
// warm kicker give the chrome its colour.
function lacquerStudio(r, size = 1024, chrome = false) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = ${chrome ? 'vec3(0.05, 0.07, 0.2)' : 'vec3(0.002, 0.004, 0.02)'}, band = ${chrome ? 'vec3(0.12, 0.28, 0.85)' : 'vec3(0.02, 0.07, 0.32)'};
      vec3 haze = ${chrome ? 'vec3(0.75, 0.8, 0.95)' : 'vec3(0.35, 0.4, 0.55)'}, flo = ${chrome ? 'vec3(0.35, 0.12, 0.1)' : 'vec3(0.05, 0.01, 0.01)'};
      vec3 c = mix(band, zen, smoothstep(0.0, 0.8, up));
      c = mix(c, haze, smoothstep(0.14, -0.02, up) * smoothstep(-0.3, -0.02, up));
      c = mix(c, flo, smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m); return m;
  };
  card(9, 5, [-7, 8, 9], 9);                        // big soft key, high left, in front
  card(1.2, 16, [10, 1, 6], 12, [0.9, 0.95, 1]);     // tall strip, right
  card(14, 0.8, [0, 10, 4], 8);                      // thin overhead strip: a clean line on every edge
  if (!chrome) card(5, 5, [0, 0, 14], 0.0);          // black flag straight ahead: deep colour where it faces us
  card(4, 2.4, [-3.6, 3.2, 12], 4, [1, 0.97, 0.92]); // soft box just off-axis: a sheen that drifts across the faces as it turns
  card(1.2, 12, [-11, 0, -2], 5, [0.6, 0.75, 1]);   // cool strip back left
  card(10, 3, [0, -8, 8], 3, [1, 0.45, 0.25]);       // warm bounce from below (the sale glow)
  card(2, 2, [7, 7, -8], 9, [1, 0.85, 0.6]);         // warm kicker
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- 2D ----------
const $ = (id) => document.getElementById(id);
const place = (el, css) => Object.assign(el.style, css);
const px = (v) => v + 'px';
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const starSvg = (fill = 'currentColor') => `<svg viewBox="-1 -1 2 2" style="width:0.8em;height:0.8em;vertical-align:0.02em;overflow:visible"><path d="${STAR}" fill="${fill}"/></svg>`;

$('doc-c3').innerHTML = C.c3;

// kicker
const kicker = $('kicker');
if (F.kicker) {
  kicker.innerHTML = `${starSvg()}&ensp;${C.kicker}&ensp;${starSvg()}`;
  place(kicker, { top: px(F.kicker.y) }); stage.style.setProperty('--kick', px(F.kicker.size));
} else kicker.remove();

// title, each line fitted to the same width
const meas = document.createElement('canvas').getContext('2d');
meas.font = '400 100px "Anton"';
const titleHTML = F.title.lines.map((l, i) => {
  const w = meas.measureText(l.toUpperCase()).width;
  const size = (F.title.width / w) * 100;
  return `<span class="line${i ? ' hot' : ''}" style="font-size:${size.toFixed(1)}px">${l}</span>`;
}).join('');
$('title-ink').innerHTML = titleHTML;
$('title-bloom').innerHTML = titleHTML;
place($('title'), { top: px(F.title.top) });
stage.style.setProperty('--bloomBlur', px(Math.round(F.w * 0.022)));

// the backdrop: a hot glow behind the burst, and the burst's rays
const B = F.burst;
$('glow').style.background = [
  `radial-gradient(${B.d * 0.74}px ${B.d * 0.74}px at ${B.x}px ${B.y}px, rgba(255,160,70,0.6), rgba(255,60,50,0.26) 58%, rgba(120,30,120,0.08) 82%, rgba(0,0,0,0) 100%)`,
  `radial-gradient(${B.d * 1.15}px ${B.d * 0.9}px at ${B.x}px ${B.y + B.d * 0.1}px, rgba(60,90,200,0.28), rgba(30,50,140,0.1) 60%, rgba(0,0,0,0) 100%)`,
].join(',');
const rays = $('rays');
const RAYS = 24, RAYD = Math.max(F.w, F.h) * 1.6;
place(rays, {
  left: px(B.x - RAYD / 2), top: px(B.y - RAYD / 2), width: px(RAYD), height: px(RAYD),
  background: `repeating-conic-gradient(from 0deg, rgba(255,206,70,0.36) 0deg 5deg, rgba(255,90,60,0.10) 6.5deg 13deg, rgba(255,206,70,0.36) 15deg)`,
  WebkitMaskImage: `radial-gradient(circle closest-side, rgba(0,0,0,1) ${(B.d / RAYD) * 60}%, rgba(0,0,0,0.5) ${(B.d / RAYD) * 110}%, rgba(0,0,0,0) 100%)`,
  maskImage: `radial-gradient(circle closest-side, rgba(0,0,0,1) ${(B.d / RAYD) * 60}%, rgba(0,0,0,0.5) ${(B.d / RAYD) * 110}%, rgba(0,0,0,0) 100%)`,
  filter: 'blur(2px)',
});
$('haze').style.background = `radial-gradient(${B.d * 1.2}px ${B.d * 0.32}px at ${B.x}px ${B.y + B.d * 0.5}px, rgba(210,220,255,0.16), rgba(0,0,0,0) 100%)`;

// the DOORBUSTER ribbon: a band with folded, notched tails
const ribbon = $('ribbon');
const svgNS = 'http://www.w3.org/2000/svg';
{
  const R = F.ribbon, W = R.w, H = R.h, T = H * 0.8, drop = H * 0.32, fold = H * 0.36;
  ribbon.setAttribute('width', F.w); ribbon.setAttribute('height', F.h);
  const half = W / 2;
  ribbon.innerHTML = `
    <defs>
      <linearGradient id="rb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1b1c22"/><stop offset="0.45" stop-color="#0b0b0e"/><stop offset="1" stop-color="#000"/>
      </linearGradient>
      <linearGradient id="rs" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="rclip"><rect x="${-half}" y="${-H / 2}" width="${W}" height="${H}"/></clipPath>
      <filter id="rsh" x="-20%" y="-50%" width="140%" height="220%"><feGaussianBlur stdDeviation="${H * 0.14}"/></filter>
    </defs>
    <g id="rib">
      <ellipse cx="0" cy="${H * 0.7}" rx="${half * 1.05}" ry="${H * 0.4}" fill="rgba(0,0,0,0.55)" filter="url(#rsh)"/>
      <path d="M${-half + fold},${-H / 2 + drop} L${-half - T},${-H / 2 + drop} L${-half - T + H * 0.34},${drop} L${-half - T},${H / 2 + drop} L${-half + fold},${H / 2 + drop}Z" fill="#c40d14"/>
      <path d="M${half - fold},${-H / 2 + drop} L${half + T},${-H / 2 + drop} L${half + T - H * 0.34},${drop} L${half + T},${H / 2 + drop} L${half - fold},${H / 2 + drop}Z" fill="#c40d14"/>
      <path d="M${-half},${H / 2} L${-half + fold},${H / 2 + drop} L${-half + fold},${H / 2}Z" fill="#4a0206"/>
      <path d="M${half},${H / 2} L${half - fold},${H / 2 + drop} L${half - fold},${H / 2}Z" fill="#4a0206"/>
      <rect x="${-half}" y="${-H / 2}" width="${W}" height="${H}" fill="url(#rb)"/>
      <rect x="${-half}" y="${-H / 2 + H * 0.09}" width="${W}" height="${H * 0.03}" fill="#ffd60a"/>
      <rect x="${-half}" y="${H / 2 - H * 0.12}" width="${W}" height="${H * 0.03}" fill="#ffd60a"/>
      <rect id="rshine" clip-path="url(#rclip)" x="${-half}" y="${-H / 2}" width="${W * 0.3}" height="${H}" fill="url(#rs)"/>
      <text x="0" y="${H * 0.255}" text-anchor="middle" font-family="Anton" font-size="${H * 0.66}" fill="#ffd60a" letter-spacing="${H * 0.06}"
        textLength="${W * 0.8}" lengthAdjust="spacing">DOORBUSTER</text>
    </g>`;
}
const ribG = ribbon.querySelector('#rib');
const ribShine = ribbon.querySelector('#rshine');

// copy under the sign
const side = $('side');
if (F.side) {
  meas.font = '400 100px "Anton"';
  side.innerHTML = C.side.map(([l, hot]) => `<span class="${hot ? 'hot' : ''}" style="font-size:${((F.side.w / meas.measureText(l.toUpperCase()).width) * 100).toFixed(1)}px">${l}</span>`).join('') + `<em>${C.sideSub}</em>`;
  place(side, { left: px(F.side.x), top: px(F.side.y), width: px(F.side.w) });
} else side.remove();
const under = $('under');
if (F.under) { under.innerHTML = C.under; place(under, { top: px(F.under.y) }); stage.style.setProperty('--under', px(F.under.size)); } else under.remove();
const lockup = $('lockup');
const mark = new Image();
mark.src = '/assets/gme/gme-primary.png';
await mark.decode();
place(lockup, { left: px(F.lockup.x), top: px(F.lockup.y), height: px(F.lockup.h), width: px(F.lockup.h * mark.naturalWidth / mark.naturalHeight) });
const foot = $('foot');
foot.innerHTML = C.foot;
place(foot, { left: px(F.foot.x), top: px(F.foot.y), width: px(F.foot.w), textAlign: F.foot.align || 'left' }); stage.style.setProperty('--foot', px(F.foot.size));
const strip = $('strip');
if (F.strip) { strip.innerHTML = C.strip.map((s) => `<span>${s}</span>`).join(`<span>${starSvg()}</span>`); place(strip, { top: px(F.strip.y) }); stage.style.setProperty('--strip', px(F.strip.size)); } else strip.remove();
const pins = $('pins');
if (F.pins) place(pins, { top: px(F.pins.y), height: px(F.pins.h) }); else pins.remove();
const fine = $('fine');
if (F.fine) { fine.innerHTML = C.fine; place(fine, { top: px(F.fine.y) }); stage.style.setProperty('--fine', px(F.fine.size)); } else fine.remove();

// (each layer alternates long and short tips, so it repeats every TWO point-steps: turn = 720 / n per loop)
// glints: GME four-point stars catching on the burst's tips, and a few in the sky
const glints = $('glints');
const GL = [
  { layer: 'yellow', tip: 3, t0: 1.6, life: 1.0, size: 0.17 },
  { layer: 'chrome', tip: 21, t0: 5.2, life: 0.9, size: 0.13 },
  { layer: 'yellow', tip: 15, t0: 8.4, life: 1.1, size: 0.19 },
  { layer: 'red', tip: 6, t0: 10.6, life: 0.8, size: 0.12 },
].map((g) => { const s = document.createElementNS(svgNS, 'svg'); s.setAttribute('viewBox', '-1 -1 2 2'); s.innerHTML = `<path d="${STAR}" fill="#fff"/>`; glints.append(s); return { ...g, el: s }; });
const SKY = [[0.08, 0.52, 0], [0.92, 0.47, 0.35], [0.85, 0.74, 0.7], [0.06, 0.62, 0.15]].map(([x, y, ph]) => {
  const s = document.createElementNS(svgNS, 'svg'); s.setAttribute('viewBox', '-1 -1 2 2'); s.innerHTML = `<path d="${STAR}" fill="#fff"/>`; glints.append(s);
  return { x: x * F.w, y: y * F.h, ph, el: s };
});

// grain and dust, drawn once from a seed
{
  const rnd = mulberry(1127);
  const n = 384, c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  const dust = $('dust'); dust.width = F.w; dust.height = F.h;
  const d = dust.getContext('2d');
  for (let i = 0; i < 60; i++) {
    const x = rnd() * F.w, y = rnd() * F.h, s = 0.6 + rnd() * rnd() * 2.4;
    d.fillStyle = rnd() < 0.5 ? 'rgba(6,8,20,0.5)' : 'rgba(235,235,225,0.35)';
    d.beginPath(); d.ellipse(x, y, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
}
const grain = $('grain');

// halation: the burst, blurred and screened back over itself, like light bleeding on tape
const HS = 4;
const hal = $('halation');
hal.width = Math.ceil(F.w / HS); hal.height = Math.ceil(F.h / HS);
place(hal, { width: px(hal.width), height: px(hal.height), transform: `scale(${HS})`, opacity: 0.24 });
const hctx = hal.getContext('2d');

// clouds: a soft bank the burst floats above, drawn once from a seed, drifting a little
const CL = F.clouds || { y: F.burst.y + F.burst.d * 0.48, h: F.burst.d * 0.5 };
const cloudCanvas = $('clouds');
{
  const rnd = mulberry(27);
  const W = F.w + 200, H = F.h;
  cloudCanvas.width = W; cloudCanvas.height = H;
  place(cloudCanvas, { width: px(W), height: px(H), left: '-100px' });
  const g = cloudCanvas.getContext('2d');
  g.filter = `blur(${Math.round(F.w * 0.012)}px)`;
  for (let i = 0; i < 46; i++) {
    const x = rnd() * W, yy = CL.y + (rnd() ** 1.6) * CL.h, r = F.w * (0.05 + rnd() * 0.09) * (1 - (yy - CL.y) / CL.h * 0.3);
    const gr = g.createRadialGradient(x, yy - r * 0.3, r * 0.1, x, yy, r);
    gr.addColorStop(0, 'rgba(236,240,250,0.55)'); gr.addColorStop(0.6, 'rgba(190,205,235,0.32)'); gr.addColorStop(1, 'rgba(150,170,215,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, yy, r, 0, TAU); g.fill();
  }
}

const tipLocal = (layer, i) => {
  const L = LAYERS[layer], n = L.n;
  const a = Math.PI / 2 + (2 * i * Math.PI) / n;
  const r = layer === 'chrome' ? 1.075 : layer === 'yellow' ? 1.0 : 0.83;
  return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.1);
};
const toScreen = (obj, v) => { const p = v.clone(); obj.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  // the burst: a slow, floating turn
  pivot.rotation.y = 0.2 * Math.sin(TAU * u);
  pivot.rotation.x = 0.09 * Math.sin(TAU * u + 1.2);
  pivot.rotation.z = 0.025 * Math.sin(TAU * u * 2);
  pivot.position.y = 0.018 * Math.sin(TAU * u * 2 + 0.6);
  for (const L of Object.values(LAYERS)) L.mesh.rotation.z = (L.turn * u * Math.PI) / 180;
  textGroup.rotation.y = -0.08 * Math.sin(TAU * u);
  scene.environmentRotation.y = 0.5 * Math.sin(TAU * u + 0.4);
  M.chrome.envMapRotation.y = scene.environmentRotation.y;
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  // backdrop
  rays.style.transform = `rotate(${(360 / RAYS) * u}deg)`;
  const pulse = 0.88 + 0.12 * Math.sin(TAU * u * 2);
  $('glow').style.opacity = pulse.toFixed(3);

  // ribbon sways a touch, a light sweep crosses it once per loop
  const R = F.ribbon;
  ribG.setAttribute('transform', `translate(${R.x} ${R.y + 4 * Math.sin(TAU * u + 2)}) rotate(${R.angle + 0.8 * Math.sin(TAU * u + 0.5)})`);
  const sweep = ((u * 1.0 + 0.3) % 1) * 2.2 - 0.6;
  ribShine.setAttribute('x', (-R.w / 2 + sweep * R.w).toFixed(1));

  // glints
  for (const g of GL) {
    const p = (t - g.t0) / g.life, on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.4 : 0;
    const s = toScreen(LAYERS[g.layer].mesh, tipLocal(g.layer, g.tip));
    const size = g.size * F.burst.d;
    g.el.style.cssText = `left:${s.x - size / 2}px;top:${s.y - size / 2}px;width:${size}px;height:${size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 40).toFixed(1)}deg);filter:drop-shadow(0 0 ${size * 0.08}px rgba(255,255,255,0.95))`;
  }
  for (const s of SKY) {
    const k = 0.5 + 0.5 * Math.sin(TAU * (u * 2 + s.ph));
    const size = F.w * 0.035 * (0.5 + 0.5 * k);
    s.el.style.cssText = `left:${s.x - size / 2}px;top:${s.y - size / 2}px;width:${size}px;height:${size}px;opacity:${(0.25 + 0.6 * k).toFixed(3)};filter:drop-shadow(0 0 4px rgba(255,255,255,0.8))`;
  }

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;

  renderer.render(scene, camera);
  hctx.clearRect(0, 0, hal.width, hal.height);
  hctx.filter = `blur(${Math.round(F.w * 0.012)}px) brightness(1.15)`;
  hctx.drawImage(canvas, 0, 0, hal.width, hal.height);
  cloudCanvas.style.transform = `translateX(${(28 * Math.sin(TAU * u + 1)).toFixed(2)}px)`;
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot } };
setTime(Number(q.get('t') || 0));
window.ready = true;
