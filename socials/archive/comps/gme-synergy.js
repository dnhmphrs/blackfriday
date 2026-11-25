// GME Synergy: the SYNERGY band from the Gary Mustard Enterprises sheet, put to work selling
// 30% off the entire internet. Paper bands of stepped bold italic Garamond slide over the navy;
// each band is 30% smaller (and 30% slower) than the one above it. Pure function of time:
//   window.comp.setTime(seconds)
import * as THREE from 'three';
import { makeGlobe } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const format = q.get('format') || '9x16';
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// ---------- copy ----------
const COPY = {
  a: '30% OFF', b: 'EVERY WEBSITE', c: 'BLACK FRIDAY ONLY',
  bAlt: 'BUT WAIT… THERE’S LESS!', cAlt: 'NO PURCHASE NECESSARY',
};

// Each band: phrase, size (px), rows, the alternate phrase and when it rolls in/out (s),
// speed in px/s (sign = direction). Sizes and speeds step down by 30% band to band.
const bandSet = (size, rows, speed, extra = {}) => [
  { key: 'a', phrase: COPY.a, size, rows, speed, ...extra.a },
  { key: 'b', phrase: COPY.b, size: size * 0.7, rows, speed: -speed * 0.7, alt: COPY.bAlt, altAt: [4.1, 7.5], ...extra.b },
  { key: 'c', phrase: COPY.c, size: size * 0.49, rows, speed: speed * 0.49, alt: COPY.cAlt, altAt: [8.7, 11.3], ...extra.c },
];

const FORMATS = {
  '9x16': {
    w: 1080, h: 1920,
    sky: 'linear-gradient(180deg, #020307 0%, #04071a 12%, #08153d 26%, #0f2a6e 40%, #1a46a2 56%, #2253ab 68%, #4562a0 80%, #77809a 92%, #8f939e 100%)',
    header: { y: 262, size: 30, x: 64 },
    labels: ['Gary Mustard\nEnterprises', 'EST2026', '30% OFF\n& STUFF'],
    globe: { x: 214, y: 528, d: 290 },
    lockup: { x: 392, y: 404, big: 196, sub: 90 },
    dim: { y: 384 },
    bands: { y: 700, top: 30, gap: 28, foot: 44, list: bandSet(88, 3, 70) },
    say: { x: 64, y: 1412, size: 54, text: 'Now with 30% less internet.' },
    meta: { x: 64, y: 1484, text: ['FRIDAY 27 NOVEMBER 2026', 'AS SEEN ON EVERY WEBSITE'], stack: true },
    mark: { right: 1016, y: 1478, w: 236 },
    fine: { x: 64, y: 1820, w: 952, text: '*Savings are applied to the right-hand 30% of every website, for one day only. No coupon is required. Gary Mustard Enterprises accepts no responsibility for the remaining 70%.' },
  },
  '1x1': {
    w: 1080, h: 1080,
    sky: 'linear-gradient(180deg, #020307 0%, #06102e 22%, #0f2a6e 42%, #1a46a2 60%, #2f5fb5 74%, #7486b0 92%, #959cb0 100%)',
    header: { y: 40, size: 26, x: 48 },
    labels: ['Gary Mustard\nEnterprises', 'EST2026', '30% OFF\n& STUFF'],
    globe: { x: 172, y: 262, d: 220 },
    lockup: { x: 312, y: 168, big: 164, sub: 74 },
    dim: { y: 134 },
    bands: { y: 412, top: 22, gap: 22, foot: 34, list: bandSet(84, 3, 64).slice(0, 2) },
    say: { x: 48, y: 922, size: 46, text: 'Now with 30% less internet.' },
    meta: { x: 48, y: 996, text: ['FRIDAY 27 NOVEMBER 2026', 'AS SEEN ON EVERY WEBSITE'], size: 22 },
    mark: { right: 1032, y: 984, w: 184 },
  },
  // The extension's own banner: scaled down into the right-hand 30% of a desktop browser.
  'banner-v': {
    w: 1080, h: 2025,
    sky: 'linear-gradient(180deg, #020307 0%, #050a22 14%, #0b1f55 32%, #163b92 50%, #2453ad 64%, #5f77aa 86%, #8e97ae 100%)',
    header: { y: 52, size: 38, x: 56 },
    labels: ['Gary Mustard\nEnterprises', null, '30% OFF\n& STUFF'],
    dim: { y: 178, full: true },
    globe: { x: 540, y: 446, d: 340 },
    lockup: { x: 540, y: 650, big: 250, sub: 118, center: true },
    bands: { y: 1050, top: 34, gap: 34, foot: 48, tagSize: 28, list: bandSet(116, 2, 80) },
    say: { x: 540, y: 1764, size: 54, text: 'You are looking at the discounted\nportion of this website.', center: true },
    meta: { x: 540, y: 1918, text: ['FRIDAY 27 NOVEMBER 2026'], size: 34, center: true },
  },
};
const F = FORMATS[format];
if (!F) throw new Error('unknown format ' + format);

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
const layout = document.getElementById('layout');
const el = (tag, cls, parent = layout, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.append(e); return e; };
const px = (e, o) => { for (const [k, v] of Object.entries(o)) e.style[k] = typeof v === 'number' ? v + 'px' : v; return e; };

// A seeded random, so every render is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- fonts and marks ----------
await document.fonts.ready;
await Promise.all([
  'italic 700 100px "EB Garamond"', '500 100px "EB Garamond"', '400 100px "EB Garamond"', 'italic 400 100px "EB Garamond"',
  '500 30px "Libre Franklin"', '400 20px "Libre Franklin"',
].map((f) => document.fonts.load(f)));

// GME marks are white on transparent; tint them flat with a canvas and hand them over as data URLs.
async function tinted(name, color) {
  const img = new Image();
  img.src = `/assets/gme/${name}.png`;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return { url: c.toDataURL(), w: c.width, h: c.height };
}
const INK = '#1b1a18', CHALK = '#e9e7e1';
const [globeInk, primaryChalk] = await Promise.all([tinted('wire-globe', INK), tinted('gme-primary', CHALK)]);
const pending = [];
const image = (m, parent, style) => { const i = el('img', '', parent); i.src = m.url; px(i, { position: 'absolute', ...style }); pending.push(i.decode()); return i; };

// ---------- sky, grain, dust ----------
px(stage.querySelector('.sky'), { width: F.w, height: F.h, background: `radial-gradient(ellipse 70% 30% at 30% 0%, rgba(30,50,110,0.25), rgba(0,0,0,0) 70%), ${F.sky}` });

function noiseTile(size, seed, amp) {
  const r = mulberry(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const d = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const n = (r() + r() + r() - 1.5) * amp; // roughly gaussian
    const v = Math.max(0, Math.min(255, 128 + n));
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return c.toDataURL();
}
const grain = stage.querySelector('.grain');
px(grain, {
  width: F.w, height: F.h,
  backgroundImage: `url(${noiseTile(384, 7, 90)}), url(${noiseTile(256, 11, 70)})`,
  backgroundSize: '384px 384px, 768px 768px',
  mixBlendMode: 'soft-light', opacity: 0.7,
});

{ // dust and the odd hair, like a scan of a printed sheet
  const c = document.getElementById('dust');
  c.width = F.w; c.height = F.h;
  const g = c.getContext('2d');
  const r = mulberry(2026);
  const n = Math.round((F.w * F.h) / 9000);
  for (let i = 0; i < n; i++) {
    const x = r() * F.w, y = r() * F.h, s = 0.5 + r() * r() * 2.6;
    g.fillStyle = r() < 0.55 ? `rgba(8,8,10,${0.35 + r() * 0.4})` : `rgba(235,232,225,${0.25 + r() * 0.45})`;
    g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * 3, 0, TAU); g.fill();
  }
  for (let i = 0; i < 7; i++) {
    const x = r() * F.w, y = r() * F.h, L = 20 + r() * 60, a = r() * TAU;
    g.strokeStyle = r() < 0.5 ? 'rgba(10,10,12,0.45)' : 'rgba(235,232,225,0.4)';
    g.lineWidth = 0.8 + r() * 0.6;
    g.beginPath(); g.moveTo(x, y);
    g.bezierCurveTo(x + Math.cos(a) * L * 0.4 + r() * 14, y + Math.sin(a) * L * 0.4 + r() * 14, x + Math.cos(a + 0.6) * L * 0.8, y + Math.sin(a + 0.6) * L * 0.8, x + Math.cos(a + 0.3) * L, y + Math.sin(a + 0.3) * L);
    g.stroke();
  }
}

// ---------- header labels ----------
{
  const { y, size, x } = F.header;
  const [l, c, r] = F.labels;
  if (l) px(el('div', 'label'), { left: x, top: y, fontSize: size }).textContent = l;
  if (c) px(el('div', 'label c'), { left: F.w / 2, top: y, fontSize: size }).textContent = c;
  if (r) px(el('div', 'label r'), { right: x, top: y, fontSize: size }).textContent = r;
}

// ---------- the dimension line across the right-hand 30% ----------
if (F.dim) {
  const d = el('div', 'dim');
  const x0 = F.dim.full ? F.header.x : Math.round(F.w * 0.7);
  const x1 = F.dim.full ? F.w - F.header.x : F.w - 2;
  px(d, { left: x0, top: F.dim.y - 20, width: x1 - x0 });
  el('i', 'tick', d); el('i', 'ln', d);
  const txt = el('span', 'txt', d, F.dim.full ? 'THIS 30%' : '30%');
  el('i', 'ln', d); el('i', 'tick', d);
  if (F.dim.full) px(txt, { fontSize: 34 });
}

// ---------- the lockup: "30% Off / Everything", set like the GME wordmark ----------
const lockup = el('div', 'lockup');
lockup.innerHTML = `<span class="big">30<span class="pc">%</span> Off${F.fine ? '<span class="asterisk">*</span>' : ''}</span><span class="sub">Everything</span>`;
px(lockup, { left: F.lockup.x, top: F.lockup.y });
px(lockup.querySelector('.big'), { fontSize: F.lockup.big });
px(lockup.querySelector('.sub'), { fontSize: F.lockup.sub, marginTop: F.lockup.big * 0.06 });
if (F.lockup.center) { lockup.style.textAlign = 'center'; lockup.style.transform = 'translateX(-50%)'; }
else lockup.querySelector('.sub').style.marginLeft = (F.lockup.big * 0.02) + 'px';

// ---------- SYNERGY bands ----------
const bands = [];
const pin = (y, h, lines, tag) => { // lines: [offset, thickness] in px, drawn in chalk
  const p = px(el('div', 'pin'), { top: y, height: h });
  p.style.background = 'var(--paper)';
  for (const [o, t] of lines) px(el('i', '', p), { position: 'absolute', left: 0, right: 0, top: o, height: t, background: INK, opacity: 0.92 });
  if (tag) { const g = el('span', 'tag', p); g.textContent = tag; if (F.bands.tagSize) px(g, { fontSize: F.bands.tagSize, right: F.header.x }); else g.style.right = F.header.x + 'px'; }
};
{
  let y = F.bands.y;
  const thin = (h) => [[Math.round(h * 0.22) - 1, 2], [Math.round(h * 0.5) - 1, 2], [Math.round(h * 0.78) - 1, 2]];
  pin(y, F.bands.top, thin(F.bands.top)); y += F.bands.top;
  F.bands.list.forEach((b, bi) => {
    const rh = Math.round(b.size * 0.86), pad = Math.round(b.size * 0.16);
    const H = b.rows * rh + pad * 2;
    const band = px(el('div', 'band'), { top: y, height: H });
    const capW = Math.round(H * 1.02);
    const rows = [];
    for (let i = 0; i < b.rows; i++) {
      // each row is a window that starts a step further right than the one below it, as the
      // rows are stepped on the sheet; the type slides through it and is cut clean at its edge
      const clip = Math.round(H * 1.12 + (b.rows - 1 - i) * b.size * 0.5);
      const row = px(el('div', 'row', band), { top: pad + i * rh, height: rh, left: clip, width: F.w - clip });
      const mk = (text, top) => {
        const line = px(el('div', 'line', row), { top, fontSize: b.size, lineHeight: rh + 'px', height: rh });
        const s = el('span', '', line); s.textContent = text;
        const gapPx = b.size * 1.2;
        s.style.marginRight = gapPx + 'px';
        const unit = s.getBoundingClientRect().width + gapPx;
        const n = Math.ceil((F.w + unit * 2) / unit) + 1;
        for (let k = 1; k < n; k++) line.append(s.cloneNode(true));
        return { line, unit };
      };
      const main = mk(b.phrase, 0);
      const alt = b.alt ? mk(b.alt, rh) : null;
      rows.push({ row, main, alt, x0: Math.round(b.size * 0.5) });
    }
    // the wire-globe roundel at the start of the band
    const cap = px(el('div', 'cap', band), { width: capW });
    const gd = Math.round(H * 0.8);
    image(globeInk, cap, { left: Math.round((capW - gd) / 2 + H * 0.06), top: Math.round((H - gd) / 2), width: gd, height: gd });

    // whole repeats per loop keep the loop seamless
    const perLoop = Math.max(1, Math.round((Math.abs(b.speed) * DURATION) / rows[0].main.unit));
    // the alternate line is phased so that, just after it rolls in, it reads from its first word
    if (b.alt) for (const r of rows) {
      const m = r.alt, tRead = b.altAt[0] + 0.9;
      m.phase = (m.unit - (((tRead / DURATION) * perLoop * m.unit) % m.unit)) % m.unit;
    }
    bands.push({ ...b, rows, rh, perLoop, dir: Math.sign(b.speed) });
    y += H;
    const last = bi === F.bands.list.length - 1;
    if (!last) { pin(y, F.bands.gap, thin(F.bands.gap), '\u221230%'); y += F.bands.gap; }
    else { // the heavier rule that closes the stack, as under the sheet's band
      const f = F.bands.foot;
      pin(y, f, [[Math.round(f * 0.16), Math.round(f * 0.14)], [Math.round(f * 0.42), Math.round(f * 0.14)], [Math.round(f * 0.68), 2], [Math.round(f * 0.84), 2]]);
      y += f;
    }
  });
  F.bands.bottom = y;
}

// ---------- foot ----------
if (F.say) {
  const s = px(el('div', 'say'), { left: F.say.x, top: F.say.y, fontSize: F.say.size });
  s.textContent = F.say.text;
  if (F.say.center) s.style.transform = 'translateX(-50%)';
}
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const starSvg = (size, color = CHALK) => `<svg width="${size}" height="${size}" viewBox="-1 -1 2 2" style="vertical-align:middle"><path d="${STAR}" fill="${color}"/></svg>`;
if (F.meta) {
  const size = F.meta.size || 26;
  const m = px(el('div', 'label'), { left: F.meta.x, top: F.meta.y, fontSize: size, letterSpacing: '0.06em' });
  m.innerHTML = F.meta.stack ? F.meta.text.join('<br>') : F.meta.text.join(`<span style="display:inline-block;margin:0 0.8em">${starSvg(size * 0.8)}</span>`);
  if (F.meta.stack) m.style.lineHeight = '1.3';
  if (F.meta.center) m.style.transform = 'translateX(-50%)';
}
if (F.mark) {
  const w = F.mark.w, h = w * (primaryChalk.h / primaryChalk.w);
  const left = F.mark.right != null ? F.mark.right - w : F.mark.x - w / 2;
  image(primaryChalk, layout, { left, top: F.mark.y - h / 2, width: w, height: h });
}
if (F.fine) {
  const f = px(el('div', 'fine'), { left: F.fine.x, top: F.fine.y, width: F.fine.w });
  f.textContent = F.fine.text;
}

// a single glint, the one bit of infomercial sparkle we allow ourselves
const glint = el('div', 'star');
glint.innerHTML = starSvg(100);
glint.firstChild.setAttribute('width', '100%'); glint.firstChild.setAttribute('height', '100%');

// ---------- the globe: the GME wire globe, in the round, with 30% of it gone ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(F.w, F.h, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const FOV = 18;
const camera = new THREE.PerspectiveCamera(FOV, F.w / F.h, 0.1, 200);
const pxPerUnit = F.globe.d / 2;
const dist = F.h / (2 * Math.tan((FOV * Math.PI) / 360) * pxPerUnit);
const elev = ((Number(q.get('elev') ?? F.globe.elev ?? 34)) * Math.PI) / 180;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
camera.setViewOffset(F.w, F.h, F.w / 2 - F.globe.x, F.h / 2 - F.globe.y, F.w, F.h);
// Flat chalk, like the printed mark; fog the far side into the navy so the near wires lead.
scene.fog = new THREE.Fog(new THREE.Color('#0a1641'), dist - 0.3, dist + 0.95);
const wire = new THREE.MeshBasicMaterial({ color: new THREE.Color(CHALK), fog: true });
// a dark core so the missing 30% reads as a notch, with the cut faces lettered in the house serif
const faceTex = (() => {
  const c = document.createElement('canvas'); const n = 1024; c.width = c.height = n;
  const g = c.getContext('2d');
  g.fillStyle = '#2b4c9c'; g.fillRect(0, 0, n / 2, n);
  g.fillStyle = '#1d3a85'; g.fillRect(n / 2, 0, n / 2, n);
  g.fillStyle = CHALK; g.textAlign = 'center'; g.textBaseline = 'middle';
  // the face we dwell on (the left half) says it outright; the other carries the house star
  g.font = 'italic 700 176px "EB Garamond"';
  g.fillText('30%', n * 0.29, n * 0.41); g.fillText('OFF', n * 0.29, n * 0.6);
  g.save(); g.translate(n * 0.72, n * 0.5); g.scale(70, 70); g.fill(new Path2D(STAR)); g.restore();
  g.strokeStyle = CHALK; g.lineWidth = 10; g.beginPath(); g.arc(n / 2, n / 2, n / 2 - 6, 0, TAU); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
})();
const core = new THREE.MeshLambertMaterial({ color: new THREE.Color('#132a66'), fog: false });
const cut = new THREE.MeshLambertMaterial({ map: faceTex, fog: false, side: THREE.DoubleSide });
scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-3, 4, 5); scene.add(sun);
const globe = makeGlobe({ tubeRadius: 0.028, material: wire, sliceOut: 0, core, cut, latitudes: [-60, -30, 0, 30, 60] });
const pivot = new THREE.Group();
pivot.add(globe);
scene.add(pivot);
// one turn a loop, dwelling while the cut faces us
const yawAt = (t) => { const u = t / DURATION - 0.06; return ((Number(q.get('yaw') ?? -48) * Math.PI) / 180) + TAU * u - 0.75 * Math.sin(TAU * u); };

// ---------- time ----------
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const roll = (t, [t0, t1], i) => { const d = i * 0.08, L = 0.55; return ease((t - t0 - d) / L) - ease((t - t1 - d) / L); };

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  for (const b of bands) {
    b.rows.forEach((r, i) => {
      const off = (m) => {
        const travel = (t / DURATION) * b.perLoop * m.unit + (m.phase || 0);
        const x = b.dir > 0 ? (travel % m.unit) - m.unit : -(travel % m.unit);
        return r.x0 + x - m.unit;
      };
      const p = b.alt ? roll(t, b.altAt, i) : 0;
      r.main.line.style.transform = `translate(${off(r.main).toFixed(2)}px, ${(-p * b.rh).toFixed(2)}px)`;
      if (r.alt) r.alt.line.style.transform = `translate(${off(r.alt).toFixed(2)}px, ${(-p * b.rh).toFixed(2)}px)`;
    });
  }
  pivot.rotation.y = yawAt(t);
  renderer.render(scene, camera);

  // the glint flares twice a loop, on the globe's upper right
  let k = 0;
  for (const g0 of [1.6, 7.6]) { const p = (t - g0) / 0.5; if (p > 0 && p < 1) k = Math.sin(p * Math.PI); }
  const s = F.globe.d * 0.32;
  px(glint, { left: F.globe.x + F.globe.d * 0.3 - s / 2, top: F.globe.y - F.globe.d * 0.36 - s / 2, width: s, height: s, opacity: k > 0 ? 1 : 0, transform: `scale(${k.toFixed(3)}) rotate(${(k * 20).toFixed(1)}deg)` });
}

await Promise.all(pending);
window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime, three: { THREE, scene, camera, renderer, pivot } };
setTime(Number(q.get('t') || 0));
window.ready = true;
