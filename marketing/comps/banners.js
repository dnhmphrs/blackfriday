// THE WEB 1.0 BANNER PACK: four animated-GIF banner ads, one composition.
//   ?format=728x90 | 468x60 | 300x250 | 160x600
// Everything on screen is a pure function of the frame number (t is snapped to 15 fps, as a GIF would be),
// so frames can be rendered in any order:  window.comp.setTime(seconds)
// The loop is 45 frames. Every period used below is 3, 5, 9, 15 or 45 frames, so frame 45 is frame 0.
const q = new URLSearchParams(location.search);
const FORMATS = {
  '728x90': { w: 728, h: 90 },
  '468x60': { w: 468, h: 60 },
  '300x250': { w: 300, h: 250 },
  '160x600': { w: 160, h: 600 },
};
const format = FORMATS[q.get('format')] ? q.get('format') : '300x250';
const F = FORMATS[format];
const DURATION = 3, FPS = 15, FRAMES = DURATION * FPS;
const TAU = Math.PI * 2;

const stage = document.getElementById('stage');
stage.style.width = F.w + 'px';
stage.style.height = F.h + 'px';
for (const b of [...stage.querySelectorAll('.banner')]) if (!b.classList.contains('b-' + format)) b.remove();
const banner = stage.querySelector('.banner');
const $$ = (sel) => [...banner.querySelectorAll(sel)];

await document.fonts.ready;
await Promise.all(['8px "Press Start 2P"', '30px Anton', '12.5px VT323', '16px Bangers'].map((f) => document.fonts.load(f)));

// A seeded random, so every render of this comp is identical.
function mulberry(seed) { return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const hex = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; // 4x4 ordered dither
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
const anims = []; // each: (frame) => void
const waits = [];
function newCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function asBackground(el, canvas) {
  const url = canvas.toDataURL();
  const img = new Image(); img.src = url; waits.push(img.decode());
  el.style.backgroundImage = `url(${url})`;
}

// ---------- pixel art from strings ----------
function pixelArt(canvas, rows, colors) {
  canvas.width = rows[0].length; canvas.height = rows.length;
  canvas.style.width = canvas.width + 'px'; canvas.style.height = canvas.height + 'px';
  const ctx = canvas.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) { ctx.fillStyle = colors[ch]; ctx.fillRect(x, y, 1, 1); } }));
}
const ARROW = [
  'X...........',
  'XX..........',
  'XoX.........',
  'XooX........',
  'XoooX.......',
  'XooooX......',
  'XoooooX.....',
  'XooooooX....',
  'XoooooooX...',
  'XooooooooX..',
  'XoooooooooX.',
  'XooooooXXXXX',
  'XoooXooX....',
  'XooXXooX....',
  'XoX..XooX...',
  'XX...XooX...',
  'X.....XooX..',
  '......XooX..',
  '.......XX...',
];
const ZAP = [
  'r....r....r',
  '.r...r...r.',
  '..r..r..r..',
  '...........',
  '...........',
  'rrr.....rrr',
];

// ---------- starfield: two tiles that swap, so the stars twinkle ----------
for (const el of $$('.stars')) {
  const bg = el.dataset.bg, T = 48;
  const rnd = mulberry(el.dataset.bg === '#000000' ? 27 : 11);
  const stars = Array.from({ length: 16 }, () => ({ x: Math.floor(rnd() * (T - 4)) + 2, y: Math.floor(rnd() * (T - 4)) + 2, kind: Math.floor(rnd() * 4), group: rnd() < 0.5 ? 0 : 1 }));
  const layers = [0, 1].map((v) => {
    const c = newCanvas(T, T), ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, T, T);
    for (const s of stars) {
      const lit = s.group === v;
      ctx.fillStyle = lit ? '#ffffff' : (s.kind === 0 ? '#ffff00' : '#9999cc');
      ctx.fillRect(s.x, s.y, 1, 1);
      if (lit && s.kind < 2) { ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); }
    }
    const layer = document.createElement('i'); layer.className = 'starlayer';
    asBackground(layer, c);
    el.prepend(layer);
    return layer;
  });
  anims.push((f) => { const a = f % 5 < 3; layers[0].style.visibility = a ? 'visible' : 'hidden'; layers[1].style.visibility = a ? 'hidden' : 'visible'; });
}

// ---------- the spinning globe, with the right-hand 30% taken off ----------
// A unit sphere cut by the plane x = CUT and seen from a little to the right, so the cut face shows
// (the hot core of the planet). CUT and VIEW are chosen so the object is exactly 70% of the globe's width.
const VIEW = (12 * Math.PI) / 180, CUT = 0.2;
const OCEAN = ['#000099', '#0033ff', '#33ccff'].map(hex), LAND = ['#006600', '#00cc00', '#99ff33'].map(hex), ICE = ['#9999cc', '#ffffff', '#ffffff'].map(hex);
const CORE = [[0.3, '#ffff99'], [0.55, '#ffcc00'], [0.78, '#ff6600'], [0.92, '#cc0000'], [2, '#663300']].map(([r, c]) => [r, hex(c)]);
for (const canvas of $$('canvas.globe')) {
  const S = Number(canvas.dataset.size);
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(S, S), d = img.data;
  const R = S / 2 - 1.5, c0 = S / 2, ct = Math.cos(VIEW), st = Math.sin(VIEW), rho = Math.sqrt(1 - CUT * CUT);
  const ecx = CUT * ct, ehw = rho * st;
  const mask = new Uint8Array(S * S);
  const L = [-0.5, -0.62, 0.6], ll = Math.hypot(...L);
  anims.push((f) => {
    const rot = (TAU * f) / FRAMES;
    const ghost = f % 5 < 3;
    d.fill(0); mask.fill(0);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const nx = (x + 0.5 - c0) / R, ny = (y + 0.5 - c0) / R, r2 = nx * nx + ny * ny;
      let col = null;
      if (r2 <= 1) {
        const zv = Math.sqrt(1 - r2);
        const xo = nx * ct + zv * st, zo = -nx * st + zv * ct;
        if (xo < CUT) {
          const lon = Math.atan2(xo, zo) + rot, lat = Math.asin(-ny);
          const v = Math.sin(3 * lon + 0.5) * Math.cos(2 * lat) + 0.6 * Math.sin(2 * lon + 2 + 2 * lat) + 0.5 * Math.sin(5 * lon - 3 * lat + 4) + 0.3 * Math.sin(7 * lon + 4 * lat + 1);
          const pal = Math.abs(lat) > 1.18 + 0.08 * Math.sin(4 * lon) ? ICE : v > 0.45 ? LAND : OCEAN;
          const b = Math.max(0, (nx * L[0] + ny * L[1] + zv * L[2]) / ll);
          const level = Math.min(2, Math.floor(b * 2.3 + bayer(x, y) * 0.9));
          col = b > 0.985 ? [255, 255, 255] : pal[level];
        }
      }
      if (!col) {
        const ex = (nx - ecx) / ehw, ey = ny / rho, e = Math.sqrt(ex * ex + ey * ey);
        if (e <= 1) col = CORE.find(([r]) => e < r)[1];
      }
      if (!col && ghost && r2 <= 1 && r2 > (1 - 2.2 / R) ** 2 && nx > ecx + 0.1) {
        // the 30% that is off: a dashed outline that blinks
        if (Math.floor((Math.atan2(ny, nx) + TAU) / (TAU / 36)) % 2 === 0) col = [255, 255, 0];
      } else if (col) mask[y * S + x] = 1;
      if (col) { const i = (y * S + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; }
    }
    // one-pixel black outline
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = y * S + x;
      if (mask[i] || d[i * 4 + 3]) continue;
      if ((x > 0 && mask[i - 1]) || (x < S - 1 && mask[i + 1]) || (y > 0 && mask[i - S]) || (y < S - 1 && mask[i + S])) d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

// ---------- sunburst: two-colour rays, turning by one ray pair every second, with a two-frame blue strobe ----------
for (const canvas of $$('canvas.rays')) {
  const w = canvas.offsetWidth, h = canvas.offsetHeight;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  const cx = Number(canvas.dataset.cx) * w, cy = Number(canvas.dataset.cy) * h, N = 10;
  const RED = [hex('#ff0000'), hex('#aa0000')], BLUE = [hex('#0000ff'), hex('#000099')];
  anims.push((f) => {
    const rot = (TAU / N) * ((f % 15) / 15);
    const [A, B] = f % 15 === 7 || f % 15 === 8 ? BLUE : RED; // once a second the burst strobes blue for two frames
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx) - rot + TAU * 2;
      const c = Math.floor(a / (Math.PI / N)) % 2 ? A : B, i = (y * w + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  });
}

// ---------- glints on the big number: four-point stars that flare for four frames ----------
for (const zone of $$('.z-pct')) {
  const w = zone.offsetWidth, h = zone.offsetHeight, c = newCanvas(w, h), ctx = c.getContext('2d');
  c.className = 'sparks'; zone.append(c);
  const rnd = mulberry(w * 7 + h);
  const glints = Array.from({ length: Math.round((w * h) / 2600) + 2 }, () => ({ x: 6 + Math.floor(rnd() * (w - 12)), y: 6 + Math.floor(rnd() * (h - 12)), t0: 2 + Math.floor(rnd() * (FRAMES - 6)) })); // none lit on frame 0, the still
  anims.push((f) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    for (const g of glints) {
      const p = (f - g.t0 + FRAMES) % FRAMES; // frames since this glint lit; wraps across the loop point
      if (p > 3) continue;
      const r = p === 1 || p === 2 ? 5 : 2;
      ctx.fillRect(g.x - r, g.y, r * 2 + 1, 1); ctx.fillRect(g.x, g.y - r, 1, r * 2 + 1);
      if (r > 2) ctx.fillRect(g.x - 1, g.y - 1, 3, 3);
    }
  });
}

// ---------- dithered gradient behind the click zone ----------
for (const el of $$('.z-click')) {
  const w = 8, h = el.offsetHeight, c = newCanvas(w, h), ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    ctx.fillStyle = (y + 0.5) / h * 1.1 - 0.05 > bayer(x, y) ? '#ff9900' : '#ffff00';
    ctx.fillRect(x, y, 1, 1);
  }
  asBackground(el, c);
}

// ---------- lettering that is split into letters: a bouncing wave, flashing or rainbow colours ----------
const RAINBOW = ['#ff3333', '#ffff00', '#00ff00', '#00ffff', '#ff66ff'];
for (const el of $$('.letters')) {
  const spans = [];
  const split = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of child.textContent) {
          if (ch === ' ') { frag.append(' '); continue; }
          const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; frag.append(s); spans.push(s);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') split(child);
    }
  };
  split(el);
  const amp = Number(el.dataset.amp || 0), hold = Number(el.dataset.rainbow || 0), flash = el.dataset.flash;
  anims.push((f) => {
    spans.forEach((s, i) => {
      if (amp) s.style.transform = `translateY(${-Math.round(amp * Math.abs(Math.sin((Math.PI * (f - i * 2)) / 15)))}px)`;
      if (hold) s.style.color = RAINBOW[(((i - Math.floor(f / hold)) % 5) + 5) % 5];
      if (flash) s.style.color = (f + i * 2) % 5 < 2 ? '#ffffff' : '#ffff00';
    });
  });
}

// ---------- hard blinks, colour cycles, scene swaps ----------
for (const el of $$('.blink')) {
  const [period, on] = (el.dataset.b || '5,3').split(',').map(Number);
  anims.push((f) => { el.style.visibility = f % period < on ? 'visible' : 'hidden'; });
}
for (const el of $$('.cycle')) {
  const colors = el.dataset.colors.split(','), hold = Number(el.dataset.hold);
  anims.push((f) => { el.style.color = colors[Math.floor(f / hold) % colors.length]; });
}
for (const el of $$('.show')) {
  const [from, to] = el.dataset.f.split(',').map(Number);
  anims.push((f) => { el.style.visibility = f >= from && f < to ? 'visible' : 'hidden'; });
}

// ---------- chasing bulbs, marching border, rainbow rules ----------
for (const el of $$('.bulbs')) {
  const dir = el.classList.contains('rev') ? -1 : 1;
  anims.push((f) => { el.style.backgroundPositionX = dir * 12 * (Math.floor(f / 3) % 3) + 'px'; });
}
for (const el of $$('.ants')) {
  const c = el.classList;
  anims.push((f) => {
    const p = (f % 5) * 2;
    if (c.contains('t')) el.style.backgroundPositionX = p + 'px';
    if (c.contains('b')) el.style.backgroundPositionX = -p + 'px';
    if (c.contains('r')) el.style.backgroundPositionY = p + 'px';
    if (c.contains('l')) el.style.backgroundPositionY = -p + 'px';
  });
}
for (const el of $$('.hr')) {
  const dir = el.classList.contains('rev') ? -1 : 1;
  anims.push((f) => { el.style.backgroundPositionX = dir * 2 * (f % 15) + 'px'; });
}

// ---------- ticker: a whole number of repeats per loop ----------
for (const el of $$('.ticker')) {
  const run = el.querySelector('.run'), text = run.dataset.text;
  run.textContent = text;
  const unit = Math.round(run.getBoundingClientRect().width);
  run.textContent = text.repeat(Math.ceil((F.w * 2) / unit) + 1);
  anims.push((f) => { run.style.transform = `translateX(${-Math.round((f * unit) / FRAMES)}px)`; }); // one unit per loop
}

// ---------- FREE! starburst: the star turns one point per second, the word wobbles ----------
for (const el of $$('.burst')) {
  const shape = el.querySelector('i'), word = el.querySelector('b'), P = 12;
  const pts = Array.from({ length: P * 2 }, (_, i) => { const a = (TAU * i) / (P * 2), r = i % 2 ? 37 : 50; return `${(50 + r * Math.cos(a)).toFixed(2)}% ${(50 + r * Math.sin(a)).toFixed(2)}%`; });
  shape.style.clipPath = `polygon(${pts.join(',')})`;
  anims.push((f) => {
    shape.style.transform = `rotate(${(((f % 15) / 15) * 360) / P}deg)`;
    word.style.transform = `translateY(${f % 5 < 3 ? 0 : -1}px)`;
    el.classList.toggle('alt', f % 5 >= 3);
  });
}

// ---------- the pointer: comes in, double-clicks the button, backs off ----------
for (const zone of $$('.z-click')) {
  const cursor = zone.querySelector('.cursor'), zap = zone.querySelector('.zap'), btn = zone.querySelector('.btn');
  pixelArt(cursor, ARROW, { X: '#000000', o: '#ffffff' });
  pixelArt(zap, ZAP, { r: '#ff0000' });
  const cs = getComputedStyle(cursor);
  const x0 = parseFloat(cs.left), y0 = parseFloat(cs.top), dx = Number(cs.getPropertyValue('--dx')), dy = Number(cs.getPropertyValue('--dy'));
  anims.push((f) => {
    const away = f < 10 ? (10 - f) / 10 : f < 30 ? 0 : (f - 30) / 15;
    const down = (f >= 12 && f < 15) || (f >= 18 && f < 21);
    const x = x0 + Math.round(away * dx), y = y0 + Math.round(away * dy);
    cursor.style.left = x + 'px'; cursor.style.top = y + 'px';
    zap.style.left = x - 5 + 'px'; zap.style.top = y - 8 + 'px';
    zap.style.visibility = down ? 'visible' : 'hidden';
    btn.classList.toggle('down', down);
    btn.classList.toggle('alt', f % 5 >= 3); // CLICK HERE! flashes blue on grey, red on yellow
  });
}

function setTime(t) {
  const f = ((Math.round(t * FPS) % FRAMES) + FRAMES) % FRAMES;
  for (const a of anims) a(f);
}

await Promise.all(waits);
window.comp = { duration: DURATION, fps: FPS, width: F.w, height: F.h, glitches: [], setTime };
setTime(Number(q.get('t') || 0));
window.ready = true;
