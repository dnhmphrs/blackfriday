// The Neon Sale Sign. A Black Friday sign buzzing in GME's dark shop window on a wet night:
// BLACK FRIDAY in red tubes, 30% in pink, OFF in white, EVERYTHING in yellow between chasing
// chevrons, and the GME half-globe in blue, its missing half still there as dead glass.
// One tube (the Y) is on the way out. Everything on screen is a pure function of t.
const q = new URLSearchParams(location.search);
const DURATION = 12, FPS = 30, TAU = Math.PI * 2;

// Tube colours: the body of the lit glass, the light it throws, the white-hot core, and dead glass.
const TUBE = {
  red:    { k: 1, body: '#ff2e44', glow: '255,24,52',   core: '#ffd9dd', glass: 'rgba(255,140,150,0.13)' },
  pink:   { k: 1, body: '#ff58b0', glow: '255,46,156',  core: '#fff0f8', glass: 'rgba(255,170,215,0.13)' },
  white:  { k: 0.5, body: '#ffe6f2', glow: '255,140,210', core: '#ffffff', glass: 'rgba(235,235,255,0.13)' },
  yellow: { k: 1, body: '#ffd03a', glow: '255,168,24',  core: '#fff8dc', glass: 'rgba(255,230,160,0.12)' },
  blue:   { k: 1.7, body: '#4f8bff', glow: '46,104,255',  core: '#e6eeff', glass: 'rgba(160,190,255,0.14)' },
};

// box: [x, top, width, cap height]. Words are fitted inside their box and centred in it.
const FORMATS = {
  '9x16': {
    w: 1080, h: 1920, ledgeY: 1490, sill: 140,
    panel: { x: 54, y: 252, w: 972, h: 1196, r: 22 },
    words: [
      { id: 'black', text: 'BLACK', face: 'Tilt Neon', color: 'red', box: [262, 296, 556, 146], track: 0.04 },
      { id: 'friday', text: 'FRIDAY', face: 'Tilt Neon', color: 'red', box: [92, 482, 896, 160], track: 0.04, bad: 5 },
      { id: 'thirty', text: '30%', face: 'Anton', color: 'pink', box: [92, 686, 896, 392], stroke: 15, track: 0.03 },
      { id: 'off', text: 'OFF', face: 'Anton', color: 'white', box: [96, 1114, 508, 180], stroke: 11, track: 0.06 },
      { id: 'every', text: 'EVERYTHING', face: 'Tilt Neon', color: 'yellow', box: [226, 1322, 628, 62], track: 0.07 },
    ],
    globe: { cx: 822, cy: 1204, R: 92, lw: 10 },
    chevrons: { y: 1353, size: 26, gap: 30, inner: 346, lw: 8 },
    leaf: { x: 72, y: 306, mark: 92, size: 12, align: 'left', line: 'Est2026' },
    sticker: { x: 838, y: 270, w: 200, rot: 4, mark: 26, size: 21 },
    burst: { cx: 188, cy: 1500, r: 104, rot: -9 },
    card: { x: 716, bottom: 1554, w: 292, h: 156, rot: 2, big: 60 },
    tx: [P => P.x + 250, P => P.y + P.h - 46],
    lip: { y: 1690, size: 30 },
  },
  '1x1': {
    w: 1080, h: 1080, ledgeY: 900, sill: 100,
    panel: { x: 36, y: 34, w: 1008, h: 842, r: 20 },
    words: [
      { id: 'black', text: 'BLACK FRIDAY', face: 'Tilt Neon', color: 'red', box: [80, 84, 920, 116], track: 0.03, bad: 11 },
      { id: 'thirty', text: '30%', face: 'Anton', color: 'pink', box: [56, 252, 650, 400], stroke: 14, track: 0.03 },
      { id: 'off', text: 'OFF', face: 'Anton', color: 'white', box: [714, 262, 300, 170], stroke: 10, track: 0.06 },
      { id: 'every', text: 'EVERYTHING', face: 'Tilt Neon', color: 'yellow', box: [100, 716, 560, 50], track: 0.07 },
    ],
    globe: { cx: 866, cy: 548, R: 88, lw: 8 },
    chevrons: { cx: 380, y: 741, size: 24, gap: 26, inner: 272, lw: 7 },
    leaf: null,
    sticker: { x: 770, y: 680, w: 244, rot: 3, mark: 30, size: 24 },
    burst: { cx: 588, cy: 896, r: 92, rot: -8 },
    card: { x: 56, bottom: 1012, w: 250, h: 176, rot: -2.5, big: 52 },
    tx: [P => P.x + 300, P => P.y + P.h - 52],
    lip: { y: 1034, size: 22 },
  },
  'banner-v': {
    w: 1080, h: 2025, ledgeY: 1736, sill: 140,
    panel: { x: 40, y: 140, w: 1000, h: 1420, r: 24 },
    words: [
      { id: 'black', text: 'BLACK', face: 'Tilt Neon', color: 'red', box: [80, 196, 920, 176], track: 0.03 },
      { id: 'friday', text: 'FRIDAY', face: 'Tilt Neon', color: 'red', box: [80, 414, 920, 176], track: 0.03, bad: 5 },
      { id: 'thirty', text: '30%', face: 'Anton', color: 'pink', box: [70, 650, 940, 440], stroke: 17, track: 0.03 },
      { id: 'off', text: 'OFF', face: 'Anton', color: 'white', box: [80, 1140, 560, 210], stroke: 13, track: 0.06 },
      { id: 'every', text: 'EVERYTHING', face: 'Tilt Neon', color: 'yellow', box: [210, 1402, 660, 64], track: 0.07 },
    ],
    globe: { cx: 846, cy: 1245, R: 116, lw: 11 },
    chevrons: { y: 1434, size: 32, gap: 32, inner: 330, lw: 9 },
    leaf: { x: 540, y: 18, mark: 84, size: 14 },
    sticker: { x: 46, y: 1600, w: 316, rot: -3, mark: 38, size: 31 },
    burst: { cx: 474, cy: 1664, r: 126, rot: -8 },
    card: { x: 628, bottom: 1866, w: 380, h: 262, rot: 2.5, big: 76 },
    lip: { y: 1940, size: 28 },
  },
};
const COPY = {
  b1: 'One day<br>only!',
  b2: 'Fri 27 Nov',
  leaf: 'Est2026 &middot; The &ldquo;Business&rdquo; Business',
  st1: 'Every website.<br>Black Friday only.',
  st2: 'Friday 27 November 2026',
  cd1: 'Doorbuster',
  cd2: 'While supplies last',
  cd3: 'Supplies: the entire internet.',
  lip: 'No purchase necessary. The remaining 70% is in good order.',
};
const format = FORMATS[q.get('format')] ? q.get('format') : '9x16';
const F = FORMATS[format];
const W = F.w, H = F.h;

const stage = document.getElementById('stage');
stage.classList.add('f-' + format);
stage.style.width = W + 'px';
stage.style.height = H + 'px';

function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; };

await Promise.all([
  '400 100px "Tilt Neon"', '400 100px "Anton"', 'italic 500 40px "EB Garamond"', 'italic 400 40px "EB Garamond"',
  '600 20px "Libre Franklin"', '800 20px "Inter"', '500 20px "IBM Plex Mono"',
].map((f) => document.fonts.load(f)));
await Promise.all(['gme-primary'].map((n) => { const i = new Image(); i.src = `/assets/gme/${n}.png`; return i.decode(); }));

// ---------- geometry of the tubes ----------
const meas = canvas(8, 8).getContext('2d');
function layoutWord(wd) {
  const [bx, by, bw, bh] = wd.box;
  meas.font = `400 100px "${wd.face}"`;
  const capPer = meas.measureText('H').actualBoundingBoxAscent / 100;
  const chars = [...wd.text];
  const adv = (s) => chars.reduce((a, ch) => (meas.font = `400 ${s}px "${wd.face}"`, a + meas.measureText(ch).width), 0) + wd.track * s * (chars.length - 1);
  const lw = wd.stroke || 0;
  let size = bh / capPer;
  const wAt = adv(size) + lw;
  if (wAt > bw) size *= bw / wAt;
  const font = `400 ${size}px "${wd.face}"`;
  meas.font = font;
  const cap = capPer * size, total = adv(size);
  const tube = lw || size * 0.083;
  let x = bx + (bw - total) / 2;
  const base = by + (bh + cap) / 2;
  const glyphs = chars.map((ch) => {
    const m = meas.measureText(ch);
    const g = { ch, x, l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight, a: base - m.actualBoundingBoxAscent, d: base + m.actualBoundingBoxDescent };
    x += m.width + wd.track * size;
    return g;
  });
  return { ...wd, font, size, cap, base, tube, glyphs };
}
const WORDS = F.words.map(layoutWord);

// A segment is one tube (or a few) that lights together. Each knows how to draw its own shape.
const segs = [];
function textSeg(word, glyphs, extra = {}) {
  const pad = 150;
  const x0 = Math.min(...glyphs.map((g) => g.l)) - pad, x1 = Math.max(...glyphs.map((g) => g.r)) + pad;
  const y0 = Math.min(...glyphs.map((g) => g.a)) - pad, y1 = Math.max(...glyphs.map((g) => g.d)) + pad;
  const shape = (g, style, mode = 'body') => {
    g.font = word.font;
    for (const gl of glyphs) {
      if (word.stroke) {
        g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = style;
        g.lineWidth = mode === 'core' ? word.stroke * 0.34 : mode === 'hi' ? word.stroke * 0.22 : word.stroke;
        g.strokeText(gl.ch, gl.x, word.base);
      } else { g.fillStyle = style; g.fillText(gl.ch, gl.x, word.base); }
    }
  };
  // the hot core of a filled glyph: the glyph eroded from its edges
  const erode = word.stroke ? 0 : word.tube * 0.33;
  segs.push({ x0, y0, w: x1 - x0, h: y1 - y0, shape, erode, erodeFont: word.font, glyphs, base: word.base, color: word.color, ...extra });
}
for (const wd of WORDS) {
  if (wd.bad == null) textSeg(wd, wd.glyphs, { id: wd.id });
  else {
    textSeg(wd, wd.glyphs.filter((_, i) => i !== wd.bad), { id: wd.id });
    textSeg(wd, [wd.glyphs[wd.bad]], { id: wd.id + '-bad', bad: true });
  }
}

function pathSeg(id, color, lw, build, extra = {}) {
  const p = new Path2D(); const bb = build(p);
  const pad = 150;
  segs.push({ id, color, x0: bb[0] - pad, y0: bb[1] - pad, w: bb[2] - bb[0] + pad * 2, h: bb[3] - bb[1] + pad * 2,
    shape: (g, style, mode = 'body') => { g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = style; g.lineWidth = mode === 'core' ? lw * 0.36 : mode === 'hi' ? lw * 0.22 : lw; g.stroke(p); }, erode: 0, ...extra });
}

// The GME half globe, bent in blue glass. Its right half is there too, dead: 30% off the world.
const G = F.globe;
const globeLeft = (p) => {
  const { cx, cy, R } = G;
  p.moveTo(cx, cy + R); p.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5);
  p.moveTo(cx, cy - R * 1.12); p.lineTo(cx, cy + R * 1.12);
  p.moveTo(cx, cy + R); p.ellipse(cx, cy, R * 0.64, R, 0, Math.PI / 2, Math.PI * 1.5);
  p.moveTo(cx, cy + R); p.ellipse(cx, cy, R * 0.28, R, 0, Math.PI / 2, Math.PI * 1.5);
  for (const k of [-0.56, 0, 0.56]) {
    const y = cy + k * R, x0 = cx - R * Math.sqrt(1 - k * k);
    p.moveTo(x0, y); p.quadraticCurveTo((x0 + cx) / 2, y + R * 0.07, cx, y + R * 0.04 * (k === 0 ? 1 : 0.6));
  }
  return [cx - R, cy - R * 1.12, cx, cy + R * 1.12];
};
const globeRight = (p) => {
  const { cx, cy, R } = G;
  p.moveTo(cx, cy - R); p.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2);
  p.moveTo(cx, cy - R); p.ellipse(cx, cy, R * 0.64, R, 0, -Math.PI / 2, Math.PI / 2);
  p.moveTo(cx, cy - R); p.ellipse(cx, cy, R * 0.28, R, 0, -Math.PI / 2, Math.PI / 2);
  for (const k of [-0.56, 0, 0.56]) {
    const y = cy + k * R, x1 = cx + R * Math.sqrt(1 - k * k);
    p.moveTo(cx, y + R * 0.04 * (k === 0 ? 1 : 0.6)); p.quadraticCurveTo((x1 + cx) / 2, y + R * 0.07, x1, y);
  }
  return [cx, cy - R, cx + R, cy + R];
};
pathSeg('globe', 'blue', G.lw, globeLeft);
pathSeg('globe-dead', 'blue', G.lw, globeRight, { dead: true });

// Chevrons either side of EVERYTHING, chasing inward.
const C = F.chevrons;
for (let side of [-1, 1]) for (let k = 0; k < 3; k++) {
  pathSeg(`chev${side}${k}`, 'yellow', C.lw, (p) => {
    const cx = (C.cx || W / 2) + side * (C.inner + (2 - k) * C.gap), s = C.size;
    // left side points right (towards the word), right side points left
    p.moveTo(cx + side * s * 0.45, C.y - s); p.lineTo(cx - side * s * 0.45, C.y); p.lineTo(cx + side * s * 0.45, C.y + s);
    return [cx - s, C.y - s, cx + s, C.y + s];
  }, { chev: k });
}

// ---------- pre-render every segment: dead glass, glow, and lit tube ----------
for (const s of segs) {
  const T = TUBE[s.color];
  const local = (c) => { const g = c.getContext('2d'); g.translate(-s.x0, -s.y0); return g; };
  // dead glass: faint tube with a highlight along its top edge
  s.unlit = canvas(s.w, s.h);
  { const g = local(s.unlit); s.shape(g, T.glass); g.translate(-1.2, -1.6); g.globalAlpha = 0.6; s.shape(g, 'rgba(255,255,255,0.10)', 'hi'); }
  if (s.dead) continue;
  // the light it throws, wide and soft
  s.glow = canvas(s.w, s.h);
  { const g = local(s.glow); g.globalCompositeOperation = 'lighter';
    for (const [b, a] of [[2, 0.55], [7, 0.6], [18, 0.5], [42, 0.42], [90, 0.36]]) { g.filter = `blur(${b}px)`; g.globalAlpha = Math.min(1, a * T.k); s.shape(g, `rgb(${T.glow})`); } }
  // the tube: saturated glass, then a white-hot core
  s.lit = canvas(s.w, s.h);
  { const g = local(s.lit); s.shape(g, T.body);
    const core = canvas(s.w, s.h), cg = local(core);
    if (s.erode) { s.shape(cg, T.core); cg.globalCompositeOperation = 'destination-out'; cg.font = s.erodeFont; cg.lineWidth = s.erode * 2; cg.lineJoin = 'round'; cg.strokeStyle = '#000';
      for (const gl of s.glyphs) cg.strokeText(gl.ch, gl.x, s.base); }
    else s.shape(cg, T.core, 'core');
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(1.4px)'; g.drawImage(core, 0, 0); g.filter = 'blur(0.6px)'; g.globalAlpha = 0.7; g.drawImage(core, 0, 0); }
}

// ---------- the room behind the glass ----------
const room = document.getElementById('room');
room.width = W; room.height = F.ledgeY;
const rc = room.getContext('2d');
const P = F.panel;
const bg = canvas(W, F.ledgeY);
{
  const g = bg.getContext('2d'), L = F.ledgeY;
  const sky = g.createLinearGradient(0, 0, 0, L);
  sky.addColorStop(0, '#010208'); sky.addColorStop(0.3, '#040817'); sky.addColorStop(0.62, '#09143a'); sky.addColorStop(0.86, '#132a68'); sky.addColorStop(1, '#2a4380');
  g.fillStyle = sky; g.fillRect(0, 0, W, L);
  // the shop behind, out of focus: a few far lights
  const rnd = mulberry(27);
  for (let i = 0; i < 9; i++) {
    const x = rnd() * W, y = L * (0.45 + rnd() * 0.5), r = 40 + rnd() * 120, warm = rnd() < 0.3;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, warm ? 'rgba(255,190,110,0.10)' : 'rgba(120,160,255,0.10)'); gr.addColorStop(0.7, warm ? 'rgba(255,190,110,0.05)' : 'rgba(120,160,255,0.04)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  // chains from the ceiling to the backer
  const chain = (x, y0, y1) => {
    g.lineWidth = 2.2;
    for (let y = y0, i = 0; y < y1; y += 13, i++) {
      g.strokeStyle = 'rgba(150,160,185,0.55)';
      g.beginPath(); if (i % 2) g.ellipse(x, y, 1.6, 7, 0, 0, TAU); else g.ellipse(x, y, 4.6, 7.5, 0, 0, TAU); g.stroke();
    }
  };
  chain(P.x + 70, 0, P.y + 6); chain(P.x + P.w - 70, 0, P.y + 6);
  // the clear acrylic backer, edges catching light
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  rr(P.x, P.y, P.w, P.h, P.r); g.fillStyle = 'rgba(150,175,255,0.035)'; g.fill();
  g.lineWidth = 3; g.strokeStyle = 'rgba(190,210,255,0.16)'; g.stroke();
  rr(P.x + 5, P.y + 5, P.w - 10, P.h - 10, P.r - 4); g.lineWidth = 1; g.strokeStyle = 'rgba(190,210,255,0.08)'; g.stroke();
  // shadow of the tubes on the backer would be lit away; instead, the drilled holes of the standoffs
  const bolt = (x, y, r) => {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, '#e9eef8'); gr.addColorStop(0.35, '#8d95a8'); gr.addColorStop(0.8, '#2b303c'); gr.addColorStop(1, '#151820');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.2; g.stroke();
  };
  for (const [x, y] of [[P.x + 70, P.y + 34], [P.x + P.w - 70, P.y + 34], [P.x + 34, P.y + P.h - 34], [P.x + P.w - 34, P.y + P.h - 34]]) bolt(x, y, 12);
  // the transformer, screwed to the back of the backer, and its cable going down out of sight
  const tx = F.tx ? F.tx[0](P) : P.x + P.w - 210, ty = F.tx ? F.tx[1](P) : P.y + P.h - 58;
  g.fillStyle = '#0b0d14'; g.fillRect(tx, ty, 120, 34); g.strokeStyle = 'rgba(160,170,200,0.25)'; g.lineWidth = 1; g.strokeRect(tx + 0.5, ty + 0.5, 119, 33);
  g.fillStyle = 'rgba(200,205,220,0.5)'; g.font = '500 9px "IBM Plex Mono", monospace'; g.fillText('GME  NEON 12kV', tx + 8, ty + 15); g.fillText('DO NOT DISCOUNT', tx + 8, ty + 27);
  g.strokeStyle = '#06070b'; g.lineWidth = 4; g.beginPath(); g.moveTo(tx + 120, ty + 18); g.bezierCurveTo(tx + 190, ty + 30, tx + 150, L - 40, tx + 200, L + 10); g.stroke();
}

// Hardware in front of the glow and around the tubes: painted-out jumpers between letters,
// electrode boots at each end, and the little clips that hold each letter to the backer.
const hwBack = canvas(W, F.ledgeY), hwFront = canvas(W, F.ledgeY);
{
  const b = hwBack.getContext('2d'), f = hwFront.getContext('2d');
  const darkTube = (g, path, lw) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.globalAlpha = 0.5; g.strokeStyle = '#0a0a12'; g.lineWidth = lw; g.stroke(path); g.globalAlpha = 1;
    g.save(); g.translate(-0.8, -lw * 0.22); g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = lw * 0.22; g.stroke(path); g.restore();
  };
  const clip = (g, x, y, tw) => {
    const w = Math.max(4, tw * 0.38), h = tw * 1.45;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#2a2e38'); gr.addColorStop(0.45, '#c4cad8'); gr.addColorStop(1, '#3a3f4c');
    g.fillStyle = gr; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, w * 0.4); g.fill();
  };
  const boot = (g, x, y, tw) => {
    const w = tw * 1.05, h = tw * 1.7;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, '#050507'); gr.addColorStop(0.4, '#2c2f38'); gr.addColorStop(1, '#050507');
    g.fillStyle = gr; g.beginPath(); g.roundRect(x - w / 2, y - tw * 0.3, w, h, w * 0.45); g.fill();
    // GTO wire into the backer
    g.fillStyle = '#000'; g.beginPath(); g.arc(x, y + h - tw * 0.1, tw * 0.3, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(180,190,220,0.25)'; g.lineWidth = 1.2; g.stroke();
  };
  for (const wd of WORDS) {
    const tw = wd.tube, gl = wd.glyphs, y = wd.base - tw * 0.5;
    for (let i = 0; i + 1 < gl.length; i++) {
      const a = gl[i], c = gl[i + 1];
      if (a.ch === ' ' || c.ch === ' ') continue;
      const p = new Path2D(), x0 = a.r - tw * 0.7, x1 = c.l + tw * 0.7;
      p.moveTo(x0, y + tw * 0.2); p.bezierCurveTo(x0 + tw * 0.6, y + tw * 0.55, x1 - tw * 0.6, y + tw * 0.55, x1, y + tw * 0.2);
      void p; // painted-out jumpers read as a dotted underline from across the room: left out
    }
    boot(f, gl[0].l + tw * 0.6, wd.base, tw);
    boot(f, gl[gl.length - 1].r - tw * 0.6, wd.base, tw);
  }
  boot(f, G.cx, G.cy + G.R * 1.12, G.lw);
  clip(f, G.cx - G.R, G.cy, G.lw); clip(f, G.cx, G.cy - G.R * 0.56, G.lw);
}

// low-resolution light buffer for bloom and haze
const SC = 0.25, small = canvas(W * SC, F.ledgeY * SC), sg = small.getContext('2d');
const bloom = canvas(W * SC, F.ledgeY * SC), bgc = bloom.getContext('2d');

// ---------- intensities ----------
function badTube(t) {
  // the Y is dying: three bad spells per loop, and in between it holds, mostly
  const spells = [[1.4, 0.55], [5.9, 1.25], [9.6, 0.3]];
  const f = Math.floor(t * FPS);
  for (const [s, d] of spells) if (t >= s && t < s + d) {
    const v = hash(f * 3.1 + 7);
    return v < 0.4 ? 0.0 : v < 0.62 ? 0.3 : v < 0.8 ? 0.7 : 1;
  }
  if (t >= 7.15 && t < 7.7) return 0.0; // out for a beat after the long spell
  return 1;
}
function intensity(s, t) {
  const f = Math.floor(t * FPS);
  let I = 0.95 + 0.05 * hash(f + s.x0 * 0.01); // mains shimmer
  if (s.bad) I *= badTube(t);
  if (s.chev != null) {
    const ph = (t % 1) * 4; // chase inward: outer, middle, inner, then all off
    I *= ph >= s.chev && ph < 3 ? 1 : 0.0;
  }
  // the whole sign dips once, when the bad tube gives up
  if (t >= 7.15 && t < 7.22) I *= 0.55;
  return I;
}

// ---------- the sill: wet stone, the sign in it ----------
const ledge = document.getElementById('ledge');
const LH = H - F.ledgeY;
ledge.width = W; ledge.height = LH; ledge.style.top = F.ledgeY + 'px';
const lc = ledge.getContext('2d');
const refl = canvas(W, F.sill), rg = refl.getContext('2d');
const wet = canvas(W, F.sill);
const refl2 = canvas(W, F.sill), rc2 = refl2.getContext('2d');
{
  const g = wet.getContext('2d'), rnd = mulberry(91);
  g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(0, 0, W, F.sill);
  for (let i = 0; i < 40; i++) { // puddles: where the stone is a mirror
    const x = rnd() * W, y = rnd() * F.sill, rx = 60 + rnd() * 220, ry = rx * (0.08 + rnd() * 0.12);
    const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, TAU); g.fill(); g.restore();
  }
}
const stone = canvas(W, LH);
{
  const g = stone.getContext('2d'), S = F.sill;
  const top = g.createLinearGradient(0, 0, 0, S);
  top.addColorStop(0, '#0d1226'); top.addColorStop(1, '#070a17');
  g.fillStyle = top; g.fillRect(0, 0, W, S);
  const face = g.createLinearGradient(0, S, 0, LH);
  face.addColorStop(0, '#1a2140'); face.addColorStop(0.08, '#0b0f20'); face.addColorStop(1, '#03040a');
  g.fillStyle = face; g.fillRect(0, S, W, LH - S);
  const rnd = mulberry(5), img = g.getImageData(0, 0, W, LH), d = img.data; // stone speckle
  for (let i = 0; i < d.length; i += 4) { const k = (rnd() - 0.5) * 14; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
  g.putImageData(img, 0, 0);
}
const DROPS = (() => { const rnd = mulberry(404); return Array.from({ length: 14 }, () => ({ x: 40 + rnd() * (W - 80), y: 0.15 + rnd() * 0.8, ph: rnd() * 12, per: [3, 4, 6, 12][Math.floor(rnd() * 4)] })); })();

const REFL = (F.ledgeY - (P.y + P.h) + 320) / F.sill;
function drawLedge(t) {
  const S = F.sill;
  lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1; lc.filter = 'none';
  lc.drawImage(stone, 0, 0);
  // the reflection: rows of the room, flipped, rippled
  rg.globalCompositeOperation = 'source-over'; rg.clearRect(0, 0, W, S);
  for (let y = 0; y < S; y += 2) {
    const sy = F.ledgeY - 4 - y * REFL;
    if (sy < 0) break;
    const dx = 5 * Math.sin(y * 0.21 + TAU * t * 3 / DURATION) + 3 * Math.sin(y * 0.53 - TAU * t * 5 / DURATION);
    rg.drawImage(room, 0, sy - 5, W, 5, dx, y, W, 2);
  }
  // wet stone mirrors the tubes, not the haze: square the reflection to keep only what is bright
  rc2.globalCompositeOperation = 'copy'; rc2.drawImage(refl, 0, 0);
  rg.globalCompositeOperation = 'multiply'; rg.drawImage(refl2, 0, 0);
  rg.globalCompositeOperation = 'destination-in'; rg.drawImage(wet, 0, 0);
  lc.globalCompositeOperation = 'lighter';
  lc.filter = 'blur(1.5px)'; lc.globalAlpha = 1; lc.drawImage(refl, 0, 0);
  // and smears each light downward, the way a wet street does
  lc.save(); lc.beginPath(); lc.rect(0, 0, W, S); lc.clip(); lc.filter = 'blur(5px)';
  for (const [dy, a] of [[8, 0.32], [18, 0.24], [32, 0.16], [50, 0.1]]) { lc.globalAlpha = a; lc.drawImage(refl, 0, dy); }
  lc.restore(); lc.filter = 'none';
  // rain landing on the sill, ringing out in neon colours
  lc.globalAlpha = 1;
  for (const d of DROPS) {
    const p = (((t + d.ph) % d.per) + d.per) % d.per / 1.1;
    if (p > 1) continue;
    const r = 6 + p * 64, a = (1 - p) * 0.7, y = d.y * S;
    lc.strokeStyle = `rgba(255,190,225,${a.toFixed(3)})`; lc.lineWidth = 1.4;
    lc.beginPath(); lc.ellipse(d.x, y, r, r * 0.22, 0, 0, TAU); lc.stroke();
  }
  // the nosing of the sill catching the sign
  lc.globalCompositeOperation = 'source-over';
  const nose = lc.createLinearGradient(0, 0, 0, 6);
  nose.addColorStop(0, 'rgba(255,170,215,0.55)'); nose.addColorStop(1, 'rgba(255,170,215,0)');
  lc.fillStyle = nose; lc.fillRect(0, 0, W, 6);
  const edge = lc.createLinearGradient(0, S - 2, 0, S + 8);
  edge.addColorStop(0, 'rgba(255,150,200,0.28)'); edge.addColorStop(1, 'rgba(255,150,200,0)');
  lc.fillStyle = edge; lc.fillRect(0, S - 2, W, 10);
}

// ---------- DOM: gold leaf, sticker, card, small print ----------
const px = (n) => n + 'px';
const leaf = document.getElementById('leaf');
if (F.leaf) {
  const left = F.leaf.align === 'left';
  leaf.style.cssText = left ? `left:${px(F.leaf.x)};top:${px(F.leaf.y)};text-align:left;--leafSize:${px(F.leaf.size)}`
    : `left:${px(F.leaf.x - 300)};top:${px(F.leaf.y)};width:600px;--leafSize:${px(F.leaf.size)}`;
  leaf.querySelector('.mark').style.cssText = `height:${px(F.leaf.mark)};width:${px(F.leaf.mark * 1142 / 610)}` + (left ? ';margin:0' : '');
  document.getElementById('leaf-line').innerHTML = F.leaf.line || COPY.leaf;
  document.getElementById('leaf-line').style.marginTop = px(F.leaf.size * 0.8);
} else leaf.remove();
const st = document.getElementById('sticker');
if (F.sticker) {
  const s = F.sticker;
  st.style.cssText = `left:${px(s.x)};top:${px(s.y)};width:${px(s.w)};transform:rotate(${s.rot}deg);--stPad:${px(s.size * 0.6)};--stMark:${px(s.mark)};--stSize:${px(s.size)};--stGap:${px(s.size * 0.45)};--curl:${px(s.size * 0.9)}`;
  document.getElementById('st-1').innerHTML = COPY.st1;
  document.getElementById('st-2').innerHTML = COPY.st2;
} else st.remove();
// the starburst stuck to the glass: the one thing every sale window has
const burst = document.getElementById('burst');
if (F.burst) {
  const b = F.burst, n = 22, pts = (rIn) => Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * TAU - Math.PI / 2, r = i % 2 ? rIn : 1;
    return `${(50 + 50 * r * Math.cos(a)).toFixed(2)}% ${(50 + 50 * r * Math.sin(a)).toFixed(2)}%`;
  }).join(',');
  burst.style.cssText = `left:${px(b.cx - b.r)};top:${px(b.cy - b.r)};width:${px(b.r * 2)};height:${px(b.r * 2)};transform:rotate(${b.rot}deg);--bR:${px(b.r)}`;
  burst.querySelector('.rim').style.clipPath = `polygon(${pts(0.8)})`;
  burst.querySelector('.fill').style.clipPath = `polygon(${pts(0.8)})`;
  document.getElementById('bu-1').innerHTML = COPY.b1;
  document.getElementById('bu-2').innerHTML = COPY.b2;
} else burst.remove();
const card = document.getElementById('card');
{
  const c = F.card;
  card.style.cssText = `left:${px(c.x)};top:${px(c.bottom - c.h)};width:${px(c.w)};height:${px(c.h)};transform:rotate(${c.rot}deg);--cdPad:${px(c.big * 0.28)};--cdBig:${px(c.big)}`;
  document.getElementById('cd-1').innerHTML = COPY.cd1;
  document.getElementById('cd-2').innerHTML = COPY.cd2;
  document.getElementById('cd-3').innerHTML = COPY.cd3;
  const k1 = document.getElementById('cd-1'); let big = c.big;
  while (k1.scrollWidth > k1.clientWidth + 1 && big > 10) { big -= 1; card.style.setProperty('--cdBig', px(big)); }
}
const lip = document.getElementById('lip');
lip.innerHTML = COPY.lip;
lip.style.cssText = `left:0;right:0;top:${px(F.lip.y)};--lipSize:${px(F.lip.size)}`;

// grain
const grain = document.getElementById('grain');
{
  const rnd = mulberry(2026), n = 384, c = canvas(n, n), g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 120; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  grain.style.backgroundImage = `url(${c.toDataURL()})`;
}

// ---------- one frame ----------
function setTime(t) {
  t = ((t % DURATION) + DURATION) % DURATION;
  const I = segs.map((s) => (s.dead ? 0 : intensity(s, t)));
  rc.globalCompositeOperation = 'source-over'; rc.globalAlpha = 1; rc.filter = 'none';
  rc.drawImage(bg, 0, 0);
  for (const s of segs) rc.drawImage(s.unlit, s.x0, s.y0);
  // light: the glows, and a quarter-size copy of them for the haze
  sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1; sg.clearRect(0, 0, small.width, small.height);
  rc.globalCompositeOperation = 'lighter'; sg.globalCompositeOperation = 'lighter';
  segs.forEach((s, i) => {
    if (I[i] < 0.004) return;
    rc.globalAlpha = I[i]; rc.drawImage(s.glow, s.x0, s.y0);
    sg.globalAlpha = I[i]; sg.drawImage(s.glow, s.x0 * SC, s.y0 * SC, s.w * SC, s.h * SC);
  });
  bgc.globalCompositeOperation = 'source-over'; bgc.clearRect(0, 0, bloom.width, bloom.height);
  bgc.filter = 'blur(14px)'; bgc.drawImage(small, 0, 0); bgc.filter = 'blur(40px)'; bgc.globalCompositeOperation = 'lighter'; bgc.drawImage(small, 0, 0); bgc.filter = 'none';
  rc.globalAlpha = 0.7; rc.drawImage(bloom, 0, 0, W, F.ledgeY);
  rc.globalCompositeOperation = 'source-over'; rc.globalAlpha = 1;
  rc.drawImage(hwBack, 0, 0);
  segs.forEach((s, i) => { if (I[i] < 0.004) return; rc.globalAlpha = Math.min(1, I[i] * 1.1); rc.drawImage(s.lit, s.x0, s.y0); });
  rc.globalAlpha = 1;
  rc.drawImage(hwFront, 0, 0);

  drawLedge(t);

  const step = Math.floor(t * 12) % 144, r = mulberry(step + 1);
  grain.style.backgroundPosition = `${Math.floor(r() * 384)}px ${Math.floor(r() * 384)}px`;
}

window.comp = { duration: DURATION, fps: FPS, width: W, height: H, glitches: [], setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
