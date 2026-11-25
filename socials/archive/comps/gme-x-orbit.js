// The Orbit. A4's cutaway world, floating in GME's grained sky, wears the scroll as its orbit
// ring: a paper band printed with the five lines, turning round the globe in 3D (the front half
// passes over the specimen, the back half behind it). B6 supplies the sale: BLACK FRIDAY above,
// 30% OFF below, a countdown that really counts.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials } from '../lib/stage.js';
import { makeGlobe, onSphere } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// The scroll copy, exactly as given, in this order.
const SCROLL = ['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!', 'Every website, 30% off!', 'Works like magic!'];

// Layout per format. hero: globe centre and diameter (px). ring: radius in globe radii, the
// type's on-screen size (px), tilt (front edge up, deg) and roll (deg).
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, gut: 64,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 14%, #0b1a48 32%, #13368a 52%, #2350a6 66%, #3d68b2 76%, #7389b4 85%, #a9b1bf 95%, #b7b8b9 100%)',
    doc: { y: 252, size: 27 },
    bf: { y: 374, w: 900 },
    kick: null,
    hero: { x: 540, y: 810, d: 520 }, elev: 30, yaw0: -20,
    ring: { r: 1.86, em: 48, tilt: -13, roll: -8 },
    core: { x: 822, y: 612 }, fig: null,
    offer: { y: 1114, w: 880, scope: 56, scopeGap: 4 },
    timer: { y: 1456, cell: 66, ends: 'Ends in', code: 'No code<br>needed' },
    lockup: { x: 540, y: 1606, h: 100 },
    foot: { y: 1748, rulesH: 34, step: 7, fine: 28, fineGap: 18 },
  },
  '1x1': {
    w: 1080, h: 1080, gut: 48,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 30%, #13368a 54%, #2350a6 74%, #4a6fb0 88%, #8d9bb6 100%)',
    doc: { y: 40, size: 20 },
    bf: { y: 104, w: 940 },
    kick: null,
    hero: { x: 540, y: 512, d: 356 }, elev: 28, yaw0: -20,
    ring: { r: 2.2, em: 34, tilt: -13, roll: -8 },
    core: { x: 724, y: 338 }, fig: { x: 48, y: 292, text: 'Fig. 1<em>Shown smaller<br>than actual size.</em>' },
    offer: { y: 766, w: 740, scope: 40, scopeGap: 4 },
    timer: null,
    lockup: null,
    foot: { y: 1028, fine: 22, bare: true },
  },
  'banner-v': {
    w: 1080, h: 2025, gut: 64,
    sky: 'linear-gradient(180deg, #04060f 0%, #070d24 12%, #0b1a48 30%, #13368a 50%, #2350a6 66%, #3d68b2 80%, #6d87b6 90%, #a9b1bf 97%, #b7b8b9 100%)',
    doc: { y: 50, size: 30 },
    bf: { y: 150, w: 760, lines: true },
    kick: null,
    hero: { x: 540, y: 992, d: 520 }, elev: 30, yaw0: -20,
    ring: { r: 1.86, em: 72, tilt: -13, roll: -8 },
    core: { x: 792, y: 744 }, fig: null,
    offer: { y: 1312, w: 860, scope: 64, scopeGap: 8 },
    timer: { y: 1652, cell: 96, ends: '', code: '' },
    lockup: null,
    foot: { y: 1846, rulesH: 30, step: 7, fine: 38, fineGap: 16, center: true },
  },
};
const COPY = {
  '9x16': { c3: 'Black Friday<br>(Abridged)', fine: '<span><u>Unsubscribe from the internet.</u></span><span class="caps">The ‘Business’ Business</span>' },
  '1x1': { c3: 'Black Friday<br>(Abridged)', fine: '<span>The remaining 70% is in good order.</span><span class="caps">No code needed</span>' },
  'banner-v': { c3: 'This Page<br>(Abridged)', fine: '<span>You are looking at the discounted portion of this website.</span>' },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const C = COPY[format];

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const $ = (id) => document.getElementById(id);
const css = (k, v) => stage.style.setProperty(k, v);

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

await Promise.all([
  '400 100px "Anton"', '500 60px "EB Garamond"', 'italic 400 60px "EB Garamond"', 'italic 600 60px "EB Garamond"',
  '500 30px "Libre Franklin"', '600 30px "Libre Franklin"',
].map((f) => document.fonts.load(f)));

// ---------- 2D layout ----------
$('sky').style.background = F.sky;
css('--gut', F.gut + 'px');
{
  const d = $('doc');
  d.style.left = F.gut + 'px'; d.style.right = F.gut + 'px'; d.style.top = F.doc.y + 'px';
  css('--docSize', F.doc.size + 'px');
  $('doc-c3').innerHTML = C.c3;
}

// Fit a block of big type to a width: measure at 100px, scale.
function fit(el, w) {
  el.style.fontSize = '100px';
  el.style.width = 'max-content';
  const natural = el.getBoundingClientRect().width;
  el.style.width = '';
  return (100 * w) / natural;
}
{
  const bf = $('bf');
  bf.innerHTML = F.bf.lines ? '<span class="line">Black</span><span class="line">Friday</span>' : 'Black Friday';
  bf.style.fontSize = fit(bf, F.bf.w) + 'px';
  bf.style.left = (F.w - F.bf.w) / 2 + 'px'; bf.style.width = F.bf.w + 'px'; bf.style.top = F.bf.y + 'px';
  const k = $('kick');
  if (F.kick) { k.textContent = F.kick.text; k.style.left = '0'; k.style.width = F.w + 'px'; k.style.top = F.kick.y + 'px'; css('--kickSize', F.kick.size + 'px'); }

  const big = $('big'), glow = $('big-glow');
  big.innerHTML = '30% Off';
  glow.innerHTML = big.innerHTML;
  const s = fit(big, F.offer.w);
  big.style.fontSize = glow.style.fontSize = s + 'px';
  css('--glowBlur', Math.round(s * 0.07) + 'px');
  const o = $('offer');
  o.style.left = '0'; o.style.width = F.w + 'px'; o.style.top = F.offer.y + 'px';
  $('scope').innerHTML = 'off the entire internet.';
  $('scope').innerHTML = 'the entire internet.';
  css('--scope', F.offer.scope + 'px'); css('--scopeGap', F.offer.scopeGap + 'px');

  const tm = $('timer');
  if (F.timer) {
    tm.style.left = '0'; tm.style.width = F.w + 'px'; tm.style.top = F.timer.y + 'px';
    css('--cell', F.timer.cell + 'px');
    $('ends').innerHTML = F.timer.ends; $('code').innerHTML = F.timer.code;
  } else tm.style.display = 'none';

  const L = $('lockup');
  if (F.lockup) { const w = F.lockup.h * 1.872; L.style.cssText = `left:${F.lockup.x - w / 2}px;top:${F.lockup.y}px;width:${w}px;height:${F.lockup.h}px`; } else L.style.display = 'none';

  const ft = $('foot');
  ft.style.top = F.foot.y + 'px';
  css('--fineSize', F.foot.fine + 'px'); css('--fineGap', (F.foot.fineGap || 0) + 'px');
  if (F.foot.bare) ft.querySelector('.rules').style.display = 'none';
  else { css('--rulesH', F.foot.rulesH + 'px'); css('--ruleStep', F.foot.step + 'px'); }
  $('fine').innerHTML = C.fine;
  if (F.foot.center) $('fine').style.justifyContent = 'center';

  css('--labSize', ({ '1x1': 14, '9x16': 17, 'banner-v': 24 })[format] + 'px'); css('--leadW', '1.4px');
  $('lab-core').innerHTML = F.core ? 'Inner core<em>Mustard</em>' : '';
  const fg = $('lab-fig');
  if (F.fig) { fg.innerHTML = F.fig.text; fg.style.left = F.fig.x + 'px'; fg.style.top = F.fig.y + 'px'; }
}

// ---------- 3D ----------
const canvas = $('gl');
canvas.style.width = F.w + 'px';
canvas.style.height = F.h + 'px';
const FOV = 22;
const { renderer, scene, camera, key } = createStage({ canvas, width: F.w, height: F.h, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
scene.environment = nightStudio(renderer);
scene.environmentIntensity = 1.0;
key.intensity = 2.4;
key.position.set(-5, 7, 5);
key.shadow.camera.left = key.shadow.camera.bottom = -3.4; key.shadow.camera.right = key.shadow.camera.top = 3.4; key.shadow.camera.updateProjectionMatrix();

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
globe.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
pivot.add(globe);

// ---------- the ring: a paper band printed with the scroll ----------
// The band stands still; the print runs round it. The texture's seam sits at the very back,
// where the printed side faces away from us, so the type can be any length and still loop.
const R = F.ring;
const FT = 100;          // type size in texture px
const HT = 172;          // band height in texture px
const s = R.em / (FT * pxPerUnit);           // world units per texture px
const bandH = HT * s;
const scrollFont = `italic 600 ${FT}px "EB Garamond"`;
const STAR4 = (g, x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.bezierCurveTo(x + r * 0.08, y - r * 0.25, x + r * 0.25, y - r * 0.08, x + r, y); g.bezierCurveTo(x + r * 0.25, y + r * 0.08, x + r * 0.08, y + r * 0.25, x, y + r); g.bezierCurveTo(x - r * 0.08, y + r * 0.25, x - r * 0.25, y + r * 0.08, x - r, y); g.bezierCurveTo(x - r * 0.25, y - r * 0.08, x - r * 0.08, y - r * 0.25, x, y - r); g.fill(); };
const ringTex = (() => {
  const m = document.createElement('canvas').getContext('2d');
  m.font = scrollFont;
  const GAP = FT * 1.9;   // room for the star between lines
  const widths = SCROLL.map((l) => m.measureText(l).width);
  const L = Math.ceil(widths.reduce((a, b) => a + b, 0) + GAP * SCROLL.length);
  const paint = (inside) => {
    const c = document.createElement('canvas'); c.width = L; c.height = HT;
    const g = c.getContext('2d');
    g.fillStyle = inside ? '#b9b3a2' : '#ece8dc'; g.fillRect(0, 0, L, HT);
    // a faint paper tooth
    const rnd = mulberry(inside ? 11 : 5), img = g.getImageData(0, 0, L, HT), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const k = (rnd() - 0.5) * 14; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
    g.putImageData(img, 0, 0);
    // pinstripes, top and bottom, like the brand sheet's bands
    g.fillStyle = inside ? 'rgba(12,22,52,0.25)' : '#0c1634';
    for (const y of [12, 22, HT - 24, HT - 14]) g.fillRect(0, y, L, 3);
    g.font = scrollFont; g.textBaseline = 'alphabetic';
    const base = HT / 2 + FT * 0.24;
    let x = GAP / 2;
    SCROLL.forEach((line, i) => {
      g.fillStyle = inside ? 'rgba(12,22,52,0.14)' : '#0c1634';
      g.fillText(line, x, base);
      x += widths[i] + GAP / 2;
      g.fillStyle = inside ? 'rgba(150,110,30,0.2)' : '#b8862a';
      STAR4(g, x, HT / 2, FT * 0.3);
      x += GAP / 2;
    });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  };
  return { L, out: paint(false), ins: paint(true) };
})();
const ringR = R.r;
const circTex = (TAU * ringR) / s;          // the circumference, in texture px
for (const tx of [ringTex.out, ringTex.ins]) tx.repeat.set(circTex / ringTex.L, 1);
const bandGeo = new THREE.CylinderGeometry(ringR, ringR, bandH, 720, 1, true, Math.PI, TAU);
const bandOut = new THREE.Mesh(bandGeo, new THREE.MeshStandardMaterial({ map: ringTex.out, emissive: 0xffffff, emissiveMap: ringTex.out, emissiveIntensity: 0.42, roughness: 0.82, metalness: 0, envMapIntensity: 0.5, side: THREE.FrontSide }));
const bandIn = new THREE.Mesh(bandGeo, new THREE.MeshStandardMaterial({ map: ringTex.ins, emissive: 0xffffff, emissiveMap: ringTex.ins, emissiveIntensity: 0.22, roughness: 0.9, metalness: 0, envMapIntensity: 0.4, side: THREE.BackSide }));
bandOut.castShadow = bandIn.castShadow = true;
const ring = new THREE.Group();
ring.add(bandOut, bandIn);
ring.rotation.order = 'ZXY';
ring.rotation.x = (R.tilt * Math.PI) / 180;
ring.rotation.z = (R.roll * Math.PI) / 180;
scene.add(ring);

// The world, in section (A4's strata).
function strataMaterial() {
  const rnd = mulberry(7);
  const map = canvasTexture(2048, (g, n) => {
    const c = n / 2;
    const disc = (r, fill) => { g.beginPath(); g.arc(c, c, r * c, 0, TAU); g.fillStyle = fill; g.fill(); };
    g.fillStyle = '#0a1a4a'; g.fillRect(0, 0, n, n);
    const layers = [[1.0, '#0b1b4e'], [0.955, '#e6e2d6'], [0.915, '#5a7fc4'], [0.76, '#2e57a8'], [0.54, '#122a6a'], [0.3, '#cf9f2f']];
    for (const [r, fill] of layers) disc(r, fill);
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

// A4's dark photo studio: chrome becomes black glass with clean white lines.
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
  card(1.6, 1.6, [6, 8, -9], 10, [1, 0.88, 0.66]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- atmosphere ----------
$('halo').style.background =
  `radial-gradient(${F.hero.d * 1.25}px ${F.hero.d * 0.95}px at ${F.hero.x - F.hero.d * 0.1}px ${F.hero.y - F.hero.d * 0.08}px, rgba(120,150,210,0.30), rgba(60,90,170,0.12) 55%, rgba(0,0,0,0) 100%)`;
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
    const x = rnd() * F.w, y = rnd() * F.h, sz = 0.6 + rnd() * rnd() * 2.6;
    d.fillStyle = rnd() < 0.6 ? 'rgba(6,8,20,0.55)' : 'rgba(235,235,225,0.4)';
    d.beginPath(); d.ellipse(x, y, sz, sz * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
}
const grain = $('grain');

await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// specimen label: a leader from the mustard core to the label
const leaders = $('leaders');
leaders.setAttribute('width', F.w); leaders.setAttribute('height', F.h);
const svgNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); leaders.append(e); return e; };
const labCore = $('lab-core');
const LAB = F.core ? { at: onSphere(0.15, -12, 108), line: mk('line', {}), dot: mk('circle', { r: 4 }), ringC: mk('circle', { class: 'ring', r: 10 }) } : null;
const toScreen = (v) => { const p = v.clone(); globe.localToWorld(p); p.project(camera); return { x: (p.x + 1) / 2 * F.w, y: (1 - p.y) / 2 * F.h }; };

// one four-point star glint on the chrome, once per loop
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
$('glint').innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = $('glint').firstChild;
const GLINT = { at: onSphere(1.0, 34, 150), t0: 4.4, life: 0.9, size: F.hero.d * 0.16 };

const pad = (n) => String(n).padStart(2, '0');
const hh = $('hh'), mm = $('mm'), ss = $('ss');

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const u = t / DURATION;
  pivot.rotation.y = ((F.yaw0 + 9 * Math.sin(TAU * u)) * Math.PI) / 180;
  pivot.position.y = Math.sin(TAU * u * 2) * 0.012;
  scene.environmentRotation.y = 0.35 * Math.sin(TAU * u + 0.8);
  // the print runs once round per loop
  ringTex.out.offset.x = ringTex.ins.offset.x = u;
  ring.position.y = pivot.position.y;
  ring.updateMatrixWorld(true);
  pivot.updateMatrixWorld(true);
  camera.updateMatrixWorld();

  if (LAB) {
    const p = toScreen(LAB.at);
    const left = F.core.x, ly = F.core.y;
    const box = labCore.getBoundingClientRect();
    LAB.line.setAttribute('x1', p.x); LAB.line.setAttribute('y1', p.y); LAB.line.setAttribute('x2', left - 12); LAB.line.setAttribute('y2', ly);
    LAB.dot.setAttribute('cx', p.x); LAB.dot.setAttribute('cy', p.y);
    LAB.ringC.setAttribute('cx', p.x); LAB.ringC.setAttribute('cy', p.y);
    labCore.style.left = left + 'px';
    labCore.style.top = (ly - box.height * 0.32) + 'px';
  }

  // the countdown really counts
  const left = 86399 - Math.floor(t);
  hh.textContent = pad(Math.floor(left / 3600)); mm.textContent = pad(Math.floor(left / 60) % 60); ss.textContent = pad(left % 60);

  const p = (t - GLINT.t0) / GLINT.life;
  const on = p >= 0 && p <= 1, k = on ? Math.sin(p * Math.PI) ** 1.5 : 0;
  const g = toScreen(GLINT.at);
  glintSvg.style.cssText = `left:${g.x - GLINT.size / 2}px;top:${g.y - GLINT.size / 2}px;width:${GLINT.size}px;height:${GLINT.size}px;opacity:${on ? 1 : 0};transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  renderer.render(scene, camera);
}

window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot, globe, ring } };
setTime(Number(q.get('t') || 0));
window.ready = true;
