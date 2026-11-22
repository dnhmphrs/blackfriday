// Draw the extension icons in the banner's look: the studio blue and a yellow "30% OFF" in the
// slanted heavy type with its stacked navy shadow (at 16 px, where two lines cannot be read, a "%"),
// then give them the tape look (tools/tv-icons.py).
//   node store/icons-channel.mjs      -> out/icons-channel/clean-N.png, ../src/icons/iconN.png, out/icons-channel/preview.png
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const here = new URL('.', import.meta.url).pathname, root = here + '../../';
const font = 'data:font/woff2;base64,' + fs.readFileSync(root + 'src/fonts/archivo-black.woff2').toString('base64');

// size: the icon; art: the artwork's box inside it (the store wants 96 of 128, with clear padding).
// The lettering is measured and set by its ink, so that the letters and their shadow together sit
// in the middle of the box: fill is how much of the box's width they take.
const page = (size, art, lines, fill) => `<!doctype html><html><head><style>
  @font-face { font-family: B; src: url(${font}) format("woff2"); }
  html, body { margin: 0; background: transparent; }
  .i { position: relative; width: ${size}px; height: ${size}px; }
  .a { position: absolute; left: ${(size - art) / 2}px; top: ${(size - art) / 2}px; width: ${art}px; height: ${art}px; border-radius: ${art * 0.22}px; overflow: hidden;
       background: radial-gradient(circle at 50% 46%, #4fb6ff 0%, #2a8cff 18%, #1348ee 42%, transparent 75%), linear-gradient(#0a22d6, #070f9c);
       box-shadow: inset 0 0 0 ${Math.max(1, art * 0.03)}px rgba(255, 255, 255, 0.25); }
  .t { position: absolute; white-space: nowrap; line-height: 1; font-family: B; color: #fff035; letter-spacing: -0.05em; }
</style></head><body><div class="i"><div class="a" id="a"></div></div>
<script type="module">
  await document.fonts.load('100px B');
  const A = ${art}, LINES = ${JSON.stringify(lines)}, FILL = ${fill}, LS = -0.05, LEAD = 0.24, TAN = Math.tan((9 * Math.PI) / 180);
  const STEP = Math.max(0.5, A * 0.012), STEPS = 4, SHADOW = STEP * STEPS;      // the stacked shadow, down and right
  const c = document.createElement('canvas').getContext('2d');
  c.font = '200px B'; c.letterSpacing = LS * 200 + 'px';
  const ink = (t) => { const m = c.measureText(t); return { l: -m.actualBoundingBoxLeft / 200, w: (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / 200 - LS,
                                                       asc: m.actualBoundingBoxAscent / 200, base: ((1 - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 200) / 2) + m.fontBoundingBoxAscent / 200 }; };
  const inks = LINES.map(ink), cap = Math.max(...inks.map((i) => i.asc));
  // a slanted line is as wide as its ink plus the lean of its height
  const size = (A * FILL - SHADOW) / Math.max(...inks.map((i) => i.w + cap * TAN));
  const lineW = (i) => (i.w + cap * TAN) * size, blockW = Math.max(...inks.map(lineW)), capPx = cap * size;
  const blockH = capPx * (LINES.length + (LINES.length - 1) * LEAD);
  const left = (A - blockW - SHADOW) / 2, top = (A - blockH - SHADOW) / 2;
  LINES.forEach((t, n) => {
    const i = inks[n], el = document.createElement('div');
    el.className = 't'; el.textContent = t;
    const x = left + (blockW - lineW(i)) / 2, base = top + capPx + n * capPx * (1 + LEAD);
    Object.assign(el.style, { fontSize: size + 'px', left: x - i.l * size + 'px', top: base - i.base * size + 'px', transformOrigin: '0 ' + i.base * size + 'px', transform: 'skewX(-9deg)',
      textShadow: Array.from({ length: STEPS }, (_, k) => (k + 1) * STEP + 'px ' + (k + 1) * STEP + 'px 0 #0a0f66').join(', ') });
    document.getElementById('a').append(el);
  });
  window.ready = true;
</script></body></html>`;

const out = root + 'marketing/out/icons-channel/';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [size, art, lines, fill] of [[16, 16, ['%'], 0.74], [32, 32, ['30%', 'OFF'], 0.84], [48, 46, ['30%', 'OFF'], 0.82], [128, 96, ['30%', 'OFF'], 0.8]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(page(size, art, lines, fill));
  await p.waitForFunction(() => window.ready);
  await p.locator('.i').screenshot({ path: `${out}clean-${size}.png`, omitBackground: true });
}
console.log(execFileSync('python3', [root + 'marketing/tools/tv-icons.py']).toString().trim());
// a preview, each size drawn large with hard pixels
await p.setViewportSize({ width: 940, height: 300 });
await p.setContent(`<body style="margin:0;background:#e9ebf2;display:flex;gap:30px;align-items:center;padding:30px">${[16, 32, 48, 128]
  .map((s) => `<img src="data:image/png;base64,${fs.readFileSync(`${root}src/icons/icon${s}.png`).toString('base64')}" style="width:${s <= 48 ? s * 4 : 256}px;image-rendering:pixelated">`).join('')}</body>`);
await p.screenshot({ path: out + 'preview.png' });
await b.close();
console.log('icons written');
