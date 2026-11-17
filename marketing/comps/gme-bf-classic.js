// The Classic. A standard, loud American Black Friday sale sign: BLACK FRIDAY stacked tight,
// "UP TO" crossed out by hand, 30% OFF enormous, the red bar. Then GME's touches: the black is
// GME's grained navy night with haze and glow; the two dots of the % sign are chrome globes with
// 30% of the world cut away; one Garamond line; the GME lockup as the sponsor.
// Everything on screen is a pure function of time:  window.comp.setTime(seconds)
import * as THREE from 'three';
import { createStage, canvasTexture, materials } from '../lib/stage.js';
import { makeGlobe } from '../lib/objects.js';

const q = new URLSearchParams(location.search);
const FORMATS = {
  // y0: cap top of BLACK. bf2: BLACK/FRIDAY stacked (else one line). offerMax: cap height cap for 30.
  '9x16': {
    w: 1080, h: 1920, gut: 60, y0: 254, bf2: true, lead: 14, gapUp: 44, upH: 74, gapOffer: 26, offerMax: 460,
    gapBar: 34, barCap: 74, gapFoot: 24, baseTop: 1600, burstK: 1.62,
    css: { docTop: '104px', docSize: '27px', starSize: '30px', serifSize: '45px', serifGap: '8px', presSize: '15px', markW: '220px', rulesH: '40px', ruleStep: '8px', fineGap: '26px', fineSize: '19px', glowBlur: '28px' },
  },
  '1x1': {
    w: 1080, h: 1080, gut: 54, y0: 104, bf2: true, bfW: 0.72, lead: 10, gapUp: 22, upH: 48, gapOffer: 16, offerMax: 360, bottom: 36,
    gapBar: 22, barCap: 46, gapFoot: 18, baseTop: null, burstCorner: true, burstR: 122,
    css: { docTop: '30px', docSize: '20px', starSize: '22px', serifSize: '33px', serifGap: '4px', presSize: '11px', markW: '170px', rulesH: '0px', ruleStep: '8px', fineGap: '0px', fineSize: '16px', glowBlur: '22px' },
  },
  'banner-v': {
    w: 1080, h: 2025, gut: 64, y0: 250, bf2: true, lead: 28, gapUp: 50, upH: 80, gapOffer: 96, offerMax: 520, burstK: 1.62,
    gapBar: 50, barCap: 92, gapFoot: 44, baseTop: 1850,
    css: { docTop: '72px', docSize: '36px', starSize: '40px', serifSize: '58px', serifGap: '14px', presSize: '22px', markW: '330px', rulesH: '44px', ruleStep: '11px', fineGap: '28px', fineSize: '30px', glowBlur: '30px' },
  },
};
const COPY = {
  '9x16': {
    c3: 'Sale Ends<br>Saturday', bar: 'THE ENTIRE INTERNET*', star: '*Every website. Black Friday only.',
    serif: 'The remaining 70% is in good order.', presents: 'A Black Friday event by',
    fine: '<span>Friday 27 November 2026</span><span>While supplies last</span>', burst: ['NO', 'PURCHASE', 'NECESSARY!'],
  },
  '1x1': {
    c3: 'Sale Ends<br>Saturday', bar: 'THE ENTIRE INTERNET*', star: '*Every website. Black Friday only.',
    serif: 'The remaining 70% is in good order.', presents: 'A Black Friday event by',
    fine: '', burst: ['NO', 'PURCHASE', 'NECESSARY!'],
  },
  'banner-v': {
    c3: '27.11.2026', bar: 'THIS WEBSITE*', star: '*And every other website.',
    serif: 'The remaining 70%<br>is in good order.', presents: 'Brought to you by',
    fine: '<span>Every website</span><span>Black Friday only</span>', burst: ['NO', 'PURCHASE', 'NECESSARY!'],
  },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format], C = COPY[format];
const W = F.w, H = F.h, CW = W - 2 * F.gut;
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;
const RED = '#e5141d', YELLOW = '#ffd21a', WHITE = '#f4f1ea';

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = W + 'px';
stage.style.height = H + 'px';
for (const [k, v] of Object.entries(F.css)) stage.style.setProperty('--' + k, v);
stage.style.setProperty('--gut', F.gut + 'px');

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const FACES = ['400 100px Anton', '400 100px "Archivo Black"', '400 100px "Permanent Marker"', '500 30px "Libre Franklin"', '600 30px "Libre Franklin"', '700 30px "Libre Franklin"', 'italic 400 60px "EB Garamond"'];
await Promise.all(FACES.map((f) => document.fonts.load(f)));

// ---------- type ----------
const mkCanvas = (id, w = W, h = H) => { const c = document.getElementById(id); c.width = w; c.height = h; c.style.width = w + 'px'; c.style.height = h + 'px'; return c; };
const typeC = mkCanvas('type'), glowC = mkCanvas('glow');
const tg = typeC.getContext('2d'), gg = glowC.getContext('2d');

// ink metrics of a string at a size (letter-spacing in em)
function ink(ctx, text, family, size, ls = 0) {
  ctx.font = `400 ${size}px ${family}`;
  ctx.letterSpacing = (ls * size).toFixed(2) + 'px';
  const m = ctx.measureText(text);
  return { w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, l: m.actualBoundingBoxLeft, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent };
}
// draw text so its ink box starts at (x, top)
function put(ctxs, text, family, size, ls, x, top, fill, glowA = 1) {
  for (const ctx of ctxs) {
    const m = ink(ctx, text, family, size, ls);
    ctx.globalAlpha = ctx === gg ? glowA : 1;
    ctx.fillStyle = typeof fill === 'function' ? fill(ctx, top, m.asc + m.desc) : fill;
    ctx.fillText(text, x + m.l, top + m.asc);
  }
}
const ANTON = 'Anton', LS = -0.004;
const sizeForWidth = (text, w, fam = ANTON, ls = LS) => (w / ink(tg, text, fam, 100, ls).w) * 100;
const sizeForCap = (text, h, fam = ANTON, ls = LS) => (h / ink(tg, text, fam, 100, ls).asc) * 100;

const both = [tg, gg];
const L = {}; // layout, for the 3D and the DOM
let y = F.y0;

// BLACK FRIDAY
const BF = F.bfFace || '"Archivo Black"', BLS = F.bfLs ?? -0.02;
for (const word of F.bf2 ? ['BLACK', 'FRIDAY'] : ['BLACK FRIDAY']) {
  const s = sizeForWidth(word, CW * (F.bfW ?? 1), BF, BLS);
  const m = ink(tg, word, BF, s, BLS);
  put(both, word, BF, s, BLS, F.gut, y, WHITE, 0.32);
  y += m.asc + F.lead;
}
y -= F.lead;
L.bfBottom = y;
y += F.gapUp;

// UP TO, crossed out by hand; EXACTLY, written in.
{
  const s = sizeForCap('UP TO', F.upH);
  const m = ink(tg, 'UP TO', ANTON, s, 0.02);
  put([tg], 'UP TO', ANTON, s, 0.02, F.gut, y, 'rgba(244,241,234,0.92)');
  // two marker strokes, slightly different angles
  const strike = (ctx, a, b, wgt) => {
    ctx.save(); ctx.strokeStyle = YELLOW; ctx.lineCap = 'round'; ctx.lineWidth = wgt;
    ctx.beginPath(); ctx.moveTo(F.gut - 10, y + F.upH * a);
    ctx.quadraticCurveTo(F.gut + m.w * 0.5, y + F.upH * (a + b) / 2 - F.upH * 0.06, F.gut + m.w + 14, y + F.upH * b);
    ctx.stroke(); ctx.restore();
  };
  for (const ctx of both) { strike(ctx, 0.62, 0.40, F.upH * 0.13); strike(ctx, 0.70, 0.52, F.upH * 0.09); }
  // EXACTLY in marker, a little above the line and tilted
  const ms = F.upH * 1.32;
  const mm = ink(tg, 'EXACTLY', '"Permanent Marker"', ms, 0);
  const ex = F.gut + m.w + F.upH * 0.62, ey = y - F.upH * 0.08; // clear of the strike's tail
  for (const ctx of both) {
    ctx.save(); ctx.translate(ex, ey + mm.asc); ctx.rotate(-0.055);
    ctx.font = `400 ${ms}px "Permanent Marker"`; ctx.letterSpacing = '0px'; ctx.fillStyle = YELLOW;
    ctx.fillText('EXACTLY', mm.l, 0);
    ctx.restore();
  }
  L.upRight = ex + mm.w;
  L.upMid = y + F.upH / 2;
  y += F.upH + F.gapOffer;
}

// 30% OFF: "30" in red, then a column with the % (its dots are globes) over OFF.
{
  const r30 = ink(tg, '30', ANTON, 100, -0.01), rOFF = ink(tg, 'OFF', ANTON, 100, LS);
  const pctH = 0.53, offH = 0.42, colGap = 0.06, gap = 0.05; // fractions of the 30's cap height
  const k30 = r30.w / r30.asc, kOFF = (rOFF.w / rOFF.asc) * offH;
  const kPct = pctH * 0.98;
  const colK = Math.max(kOFF, kPct);
  let cap = CW / (k30 + gap + colK);
  cap = Math.min(cap, F.offerMax);
  if (F.bottom != null) { // square: give the offer whatever height the bar and foot leave
    const footH = parseFloat(F.css.presSize) * 1.7 + parseFloat(F.css.markW) * 610 / 1142;
    cap = Math.min(cap, H - F.bottom - footH - F.gapFoot - F.barCap * 1.62 - F.gapBar - y);
  }
  const total = cap * (k30 + gap + colK);
  const x0 = F.gut + (CW - total) / 2;
  const s30 = (cap / r30.asc) * 100;
  const redFill = (ctx, top, h) => { const g = ctx.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, '#ff3a2c'); g.addColorStop(0.55, RED); g.addColorStop(1, '#b20a12'); return g; };
  put(both, '30', ANTON, s30, -0.01, x0, y, redFill);
  const cx = x0 + cap * (k30 + gap), cw = cap * colK;
  // the % sign: a heavy red slash, and two round dots that the 3D globes sit in
  const ph = cap * pctH, pw = Math.min(cw, ph * 1.0), px = cx + (cw - pw) / 2;
  const d = ph * 0.5;
  L.dots = [{ x: px + d / 2, y: y + d / 2, d }, { x: px + pw - d / 2, y: y + ph - d / 2, d }];
  for (const ctx of both) {
    ctx.save();
    const sw = ph * 0.19; // slash weight
    const x1 = px + pw * 0.2, y1 = y + ph + ph * 0.02, x2 = px + pw * 0.8, y2 = y - ph * 0.02;
    const ang = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
    ctx.translate((x1 + x2) / 2, (y1 + y2) / 2); ctx.rotate(ang);
    ctx.fillStyle = RED;
    ctx.fillRect(-len / 2, -sw / 2, len, sw);
    ctx.restore();
    // a red ring, so each dot reads as the % sign's dot even before the globe is seen
    if (ctx === gg) for (const D of L.dots) { ctx.beginPath(); ctx.arc(D.x, D.y, D.d * 0.62, 0, TAU); ctx.fillStyle = RED; ctx.fill(); }
  }
  const capOFF = cap * offH;
  const sOFF = sizeForCap('OFF', capOFF);
  const mOFF = ink(tg, 'OFF', ANTON, sOFF, LS);
  put(both, 'OFF', ANTON, sOFF, LS, cx + (cw - mOFF.w) / 2, y + cap - capOFF, WHITE, 0.32);
  L.offerTop = y; L.offerCap = cap;
  y += cap + F.gapBar;
}

// the red bar, full bleed, with GME's stepped pinstripes above and below
{
  const barH = F.barCap * 1.62;
  for (const ctx of both) {
    const steps = [[-F.barCap * 0.34, 0.05], [-F.barCap * 0.2, 0.07], [-F.barCap * 0.08, 0.06]];
    ctx.fillStyle = RED;
    for (const [off, th] of steps) { ctx.fillRect(0, y + off, W, F.barCap * th); ctx.fillRect(0, y + barH - off - F.barCap * th, W, F.barCap * th); }
    const g = ctx.createLinearGradient(0, y, 0, y + barH); g.addColorStop(0, '#f2251e'); g.addColorStop(1, '#c80f17');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, barH);
  }
  const s = sizeForCap(C.bar.replace('*', ''), F.barCap);
  let m = ink(tg, C.bar, ANTON, s, 0.03);
  let sz = s;
  if (m.w > CW) { sz = s * CW / m.w; m = ink(tg, C.bar, ANTON, sz, 0.03); }
  const capReal = ink(tg, C.bar.replace('*', ''), ANTON, sz, 0.03).asc;
  put([tg], C.bar, ANTON, sz, 0.03, (W - m.w) / 2, y + (barH - capReal) / 2, WHITE);
  L.barTop = y; L.barH = barH;
  y += barH + F.gapFoot;
}
L.footTop = y;

// ---------- the starburst sticker ----------
const burst = document.getElementById('burst');
{
  const R = F.burstR ?? F.upH * (F.burstK ?? 1.75), pad = 20, n = Math.ceil(2 * R + 2 * pad);
  mkCanvas('burst', n, n);
  const b = burst.getContext('2d'), c = n / 2, P = 22;
  b.beginPath();
  for (let i = 0; i < P * 2; i++) { const a = (i / (P * 2)) * TAU - Math.PI / 2, r = i % 2 ? R * 0.83 : R; b.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
  b.closePath();
  const g = b.createRadialGradient(c - R * 0.3, c - R * 0.35, R * 0.1, c, c, R);
  g.addColorStop(0, '#fff07a'); g.addColorStop(0.6, YELLOW); g.addColorStop(1, '#f4b400');
  b.fillStyle = g; b.shadowColor = 'rgba(255,200,20,0.55)'; b.shadowBlur = 40; b.fill(); b.shadowBlur = 0;
  b.lineWidth = 3; b.strokeStyle = 'rgba(120,60,0,0.25)'; b.stroke();
  // three lines of black type, fitted to the circle
  const lines = C.burst, widths = [0.62, 1.32, 1.36].map((k) => k * R), tops = [];
  const sizes = lines.map((t, i) => sizeForWidth(t, widths[i]));
  const caps = sizes.map((s, i) => ink(b, lines[i], ANTON, s, LS).asc);
  const lg = R * 0.07, tot = caps.reduce((a, v) => a + v, 0) + lg * 2;
  let yy = c - tot / 2;
  lines.forEach((t, i) => { const m = ink(b, t, ANTON, sizes[i], LS); b.fillStyle = '#0b0b10'; b.fillText(t, c - m.w / 2 + m.l, yy + m.asc); tops.push(yy); yy += caps[i] + lg; });
  // tall formats: tucked under FRIDAY, its points just clear of the Y, over the top of the % slash.
  // square: in the corner beside the (narrower) BLACK FRIDAY.
  const cx = F.burstCorner ? (F.gut + CW * F.bfW + W - F.gut) / 2 + R * 0.08 : W - F.gut - R * 0.8;
  const cy = F.burstCorner ? (F.y0 + L.bfBottom) / 2 + R * 0.06 : L.bfBottom + R + 10;
  L.burst = { n, x: cx - n / 2, y: cy - n / 2 };
  burst.style.left = L.burst.x + 'px';
  burst.style.top = L.burst.y + 'px';
}

// ---------- haze ----------
const hazeBlue = document.getElementById('haze-blue'), hazeRed = document.getElementById('haze-red');
hazeBlue.style.background = `radial-gradient(${W * 0.75}px ${(L.bfBottom - F.y0) * 0.9}px at 46% ${(F.y0 + L.bfBottom) / 2}px, rgba(70,105,200,0.30), rgba(40,70,160,0.12) 55%, rgba(0,0,0,0) 100%)`;
hazeRed.style.background = `radial-gradient(${W * 0.62}px ${L.offerCap * 0.95}px at 40% ${L.offerTop + L.offerCap * 0.52}px, rgba(230,30,30,0.34), rgba(160,10,30,0.12) 55%, rgba(0,0,0,0) 100%)`;

// ---------- DOM copy ----------
document.getElementById('doc-c3').innerHTML = C.c3;
document.getElementById('star').innerHTML = C.star;
document.getElementById('serif').innerHTML = C.serif;
document.getElementById('presents').innerHTML = C.presents;
document.getElementById('fine').innerHTML = C.fine;
const foot = document.getElementById('foot');
foot.style.top = L.footTop + 'px';
const base = document.getElementById('base');
if (F.baseTop == null) base.style.display = 'none'; else base.style.top = F.baseTop + 'px';
const mark = new Image();
mark.src = '/assets/gme/gme-primary.png';
await mark.decode();

// ---------- 3D: the two dots of the % ----------
const glC = document.getElementById('gl');
glC.style.width = W + 'px'; glC.style.height = H + 'px';
const FOV = 14, DIST = 12;
const { renderer, scene, camera, key } = createStage({ canvas: glC, width: W, height: H, pixelRatio: Number(q.get('pr') || 1), fov: FOV });
renderer.shadowMap.enabled = false;
scene.environment = nightStudio(renderer);
key.intensity = 1.6; key.position.set(-5, 7, 6);
camera.position.set(0, 0, DIST); camera.lookAt(0, 0, 0);
const ppu = H / (2 * DIST * Math.tan((FOV * Math.PI) / 360));
const core = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.02, 0.05, 0.2), metalness: 0.6, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.05 });
const cut = cutMaterial();
const globes = L.dots.map((D, i) => {
  const holder = new THREE.Group();
  holder.position.set((D.x - W / 2) / ppu, (H / 2 - D.y) / ppu, 0);
  holder.scale.setScalar((D.d * 0.5 * 0.93) / ppu);
  holder.rotation.x = 0.42;
  const spin = new THREE.Group();
  holder.add(spin);
  spin.add(makeGlobe({ R: 1, tubeRadius: 0.058, step: 36, wedge: 108, core, cut, sliceOut: 0, material: materials.chrome() }));
  scene.add(holder);
  return { holder, spin, phase: i * 0.5 };
});

function cutMaterial() {
  const map = canvasTexture(512, (g, n) => {
    g.fillStyle = '#e5141d'; g.fillRect(0, 0, n, n);
    g.fillStyle = '#c40e16'; g.fillRect(n / 2, 0, n / 2, n);
    g.beginPath(); g.arc(n / 2, n / 2, n * 0.5 * 0.9, 0, TAU); g.lineWidth = n * 0.05; g.strokeStyle = '#f4f1ea'; g.stroke();
    const cr = g.createLinearGradient(n * 0.4, 0, n * 0.6, 0);
    cr.addColorStop(0, 'rgba(0,0,0,0)'); cr.addColorStop(0.5, 'rgba(0,0,0,0.4)'); cr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = cr; g.fillRect(n * 0.4, 0, n * 0.2, n);
  });
  return new THREE.MeshPhysicalMaterial({ map, metalness: 0, roughness: 0.5, clearcoat: 0.4, envMapIntensity: 0.4, side: THREE.DoubleSide });
}

// A dark studio: navy cyclorama, a big soft key overhead left, a long rim strip, and one red card
// low on the right so the chrome picks up the sale sign around it.
function nightStudio(r, size = 512) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; void main(){
      vec3 d = normalize(vD); float up = d.y;
      vec3 zen = vec3(0.002, 0.004, 0.016), band = vec3(0.015, 0.045, 0.2), haze = vec3(0.24, 0.29, 0.4), flo = vec3(0.004, 0.006, 0.02);
      vec3 c = mix(band, zen, smoothstep(0.0, 0.8, up));
      c = mix(c, haze, smoothstep(0.12, -0.02, up) * smoothstep(-0.25, -0.02, up));
      c = mix(c, flo, smoothstep(-0.05, -0.6, up));
      gl_FragColor = vec4(c, 1.0); }`,
  })));
  const card = (w, h, pos, k, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * k, tint[1] * k, tint[2] * k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  card(7, 7, [-7, 10, 6], 18);
  card(1.1, 16, [11, 2, 1], 20, [0.92, 0.96, 1]);
  card(12, 0.7, [0, 11, -2], 14);
  card(4, 9, [3, 3, 11], 0.0);
  card(1.1, 12, [-11, 1, -3], 6, [0.7, 0.82, 1]);
  card(14, 2.2, [0, -3, 12], 1.4, [0.75, 0.82, 1]);
  card(5, 3, [8, -4, 6], 7, [1, 0.08, 0.06]);
  const pmrem = new THREE.PMREMGenerator(r);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// ---------- grain and dust ----------
const tile = (n, seed, amp) => {
  const rnd = mulberry(seed), c = document.createElement('canvas'); c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * amp; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); return c.toDataURL();
};
const grain = document.getElementById('grain'), grain2 = document.getElementById('grain2');
grain.style.backgroundImage = `url(${tile(384, 2026, 130)})`;
grain2.style.backgroundImage = `url(${tile(192, 30, 90)})`;
{
  const rnd = mulberry(1127);
  const dust = mkCanvas('dust'), d = dust.getContext('2d');
  for (let i = 0; i < 80; i++) {
    const x = rnd() * W, yy = rnd() * H, s = 0.6 + rnd() * rnd() * 2.6;
    d.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.6)' : 'rgba(235,235,225,0.35)';
    d.beginPath(); d.ellipse(x, yy, s, s * (0.6 + rnd() * 0.5), rnd() * 3, 0, TAU); d.fill();
  }
  d.strokeStyle = 'rgba(235,235,225,0.16)'; d.lineWidth = 0.9;
  for (let i = 0; i < 5; i++) {
    const x = rnd() * W, yy = rnd() * H, a = rnd() * TAU, Ln = 14 + rnd() * 30;
    d.beginPath(); d.moveTo(x, yy); d.quadraticCurveTo(x + Math.cos(a) * Ln * 0.5 + 6, yy + Math.sin(a) * Ln * 0.5 - 5, x + Math.cos(a) * Ln, yy + Math.sin(a) * Ln); d.stroke();
  }
}

// ---------- the glint: GME's four-point star, once on each globe per loop ----------
const STAR = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
const glintEl = document.getElementById('glint');
glintEl.innerHTML = `<svg viewBox="-1 -1 2 2"><path d="${STAR}" fill="#fff"/></svg>`;
const glintSvg = glintEl.firstChild;
const GLINTS = [{ dot: 0, t0: 5.2, life: 1.0 }, { dot: 1, t0: 9.4, life: 1.0 }];

// a slow sheen across BLACK FRIDAY, like a passing headlight on a shop window, once per loop.
// It is light added (screen), so it shows in the dark between and around the letters as a soft
// diagonal streak on the "glass", feathered out above and below the headline.
const sheenC = mkCanvas('sheen'), sh = sheenC.getContext('2d');
const sheenTop = F.y0 - 70, sheenBot = L.bfBottom + 70;
function sheen(t) {
  sh.clearRect(0, 0, W, H);
  const p = (t - 2.2) / 2.6;
  if (p <= 0 || p >= 1) return;
  const env = Math.sin(p * Math.PI) ** 0.8;
  sh.globalCompositeOperation = 'source-over';
  const cx = -W * 0.45 + p * W * 1.9, band = W * 0.2, slope = 0.45 * (sheenBot - sheenTop);
  sh.save(); sh.translate(cx, (sheenTop + sheenBot) / 2); sh.transform(1, 0, -slope / (sheenBot - sheenTop), 1, 0, 0);
  const g = sh.createLinearGradient(-band, 0, band, 0);
  g.addColorStop(0, 'rgba(150,180,255,0)'); g.addColorStop(0.42, `rgba(170,195,255,${(0.16 * env).toFixed(3)})`);
  g.addColorStop(0.5, `rgba(215,228,255,${(0.30 * env).toFixed(3)})`); g.addColorStop(0.58, `rgba(170,195,255,${(0.16 * env).toFixed(3)})`); g.addColorStop(1, 'rgba(150,180,255,0)');
  sh.fillStyle = g; sh.fillRect(-band, sheenTop - (sheenTop + sheenBot) / 2, band * 2, sheenBot - sheenTop);
  sh.restore();
  sh.globalCompositeOperation = 'destination-in';
  const v = sh.createLinearGradient(0, sheenTop, 0, sheenBot);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.2, '#000'); v.addColorStop(0.8, '#000'); v.addColorStop(1, 'rgba(0,0,0,0)');
  sh.fillStyle = v; sh.fillRect(0, sheenTop, W, sheenBot - sheenTop);
  sh.globalCompositeOperation = 'source-over';
}

function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const ph = (TAU * t) / DURATION;
  for (const G of globes) G.spin.rotation.y = 0.3 * Math.sin(ph + G.phase * TAU) - 0.95;
  scene.environmentRotation.y = 0.3 * Math.sin(ph + 0.8);
  renderer.render(scene, camera);
  sheen(t);

  glowC.style.opacity = (0.5 + 0.12 * Math.sin(ph * 2)).toFixed(3);
  hazeBlue.style.opacity = (0.85 + 0.15 * Math.sin(ph + 1)).toFixed(3);
  hazeRed.style.opacity = (0.85 + 0.15 * Math.sin(ph * 2 + 2)).toFixed(3);
  burst.style.transform = `rotate(${(-11 + 2.2 * Math.sin(ph * 2)).toFixed(2)}deg) scale(${(1 + 0.015 * Math.sin(ph * 4)).toFixed(4)})`;

  let shown = false;
  for (const G of GLINTS) {
    const p = (t - G.t0) / G.life;
    if (p < 0 || p > 1) continue;
    const D = L.dots[G.dot], k = Math.sin(p * Math.PI) ** 1.5, sz = D.d * 0.9;
    const gx = D.x - D.d * 0.22, gy = D.y - D.d * 0.26;
    glintSvg.style.cssText = `left:${gx - sz / 2}px;top:${gy - sz / 2}px;width:${sz}px;height:${sz}px;opacity:1;transform:scale(${k.toFixed(3)}) rotate(${(p * 30).toFixed(2)}deg);filter:drop-shadow(0 0 8px rgba(255,255,255,0.9))`;
    shown = true;
  }
  if (!shown) glintSvg.style.opacity = 0;

  // grain at 12 steps a second; 144 steps per loop, so the loop is seamless
  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
  grain2.style.backgroundPosition = `${Math.floor(r() * 192)}px ${Math.floor(r() * 192)}px`;
}

window.comp = { duration: DURATION, fps: FPS, width: W, height: H, glitches: [], setTime, layout: L };
setTime(Number(q.get('t') || 0));
window.ready = true;
