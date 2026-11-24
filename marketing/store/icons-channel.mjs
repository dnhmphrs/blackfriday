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
// The lettering is drawn on a canvas, measured by its own pixels, and drawn again at the size and
// place that put the letters and their shadow in the middle of the box, `fill` of its width across.
const page = (size, art, lines, fill) => `<!doctype html><html><head><style>
  @font-face { font-family: B; src: url(${font}) format("woff2"); }
  html, body { margin: 0; background: transparent; }
  .i { position: relative; width: ${size}px; height: ${size}px; }
  .a { position: absolute; left: ${(size - art) / 2}px; top: ${(size - art) / 2}px; width: ${art}px; height: ${art}px; border-radius: ${art * 0.22}px; overflow: hidden;
       background: radial-gradient(circle at 50% 46%, #4fb6ff 0%, #2a8cff 18%, #1348ee 42%, transparent 75%), linear-gradient(#0a22d6, #070f9c);
       box-shadow: inset 0 0 0 ${Math.max(1, art * 0.03)}px rgba(255, 255, 255, 0.25); }
  canvas { position: absolute; left: 0; top: 0; }
</style></head><body><div class="i"><div class="a"><canvas id="c" width="${art}" height="${art}"></canvas></div></div>
<script type="module">
  await document.fonts.load('100px B');
  const A = ${art}, LINES = ${JSON.stringify(lines)}, FILL = ${fill}, LEAD = 0.2, TAN = Math.tan((9 * Math.PI) / 180);
  const STEP = Math.max(0.5, A * 0.012), STEPS = 4;      // the stacked shadow, down and right
  // Draw the lettering at z times its size: each line's middle on x, the first baseline on y.
  // mids: where each line's own middle falls, so the lines sit centred on one another; only: one line.
  function draw(g, z, px, x, y, mids, only) {
    g.font = px + 'px B'; g.letterSpacing = -0.05 * px + 'px'; g.textBaseline = 'alphabetic';
    const cap = g.measureText('H').actualBoundingBoxAscent;
    const layer = (ox, oy, colour) => LINES.forEach((t, n) => {
      if (only !== undefined && n !== only) return;
      g.setTransform(z, 0, -TAN * z, z, (x + ox - (mids ? mids[n] : 0)) * z, (y + oy + n * cap * (1 + LEAD)) * z); // slanted about its baseline
      g.fillStyle = colour; g.fillText(t, 0, 0);
    });
    for (let k = STEPS; k >= 1; k--) layer(k * STEP, k * STEP, '#0a0f66');
    layer(0, 0, '#fff035');
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  // The box of what a drawing covers, in the box's own pixels: measured at 8 times the size, on a
  // canvas twice the box across, with the box's middle in its middle.
  const BIG = 8, W = A * BIG * 2;
  const scratch = new OffscreenCanvas(W, W).getContext('2d', { willReadFrequently: true });
  function measure(px, mids, only) {
    scratch.clearRect(0, 0, W, W);
    draw(scratch, BIG, px, A, A, mids, only);
    const d = scratch.getImageData(0, 0, W, W).data; let x0 = W, x1 = -1, y0 = W, y1 = -1;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 96) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { w: (x1 + 1 - x0) / BIG, cx: (x0 + x1 + 1) / 2 / BIG - A, cy: (y0 + y1 + 1) / 2 / BIG - A }; // cx, cy: from the point it was drawn at
  }
  const at = (px) => { const mids = LINES.map((_, n) => measure(px, null, n).cx); return { mids, ...measure(px, mids) }; };
  // the size that makes the whole thing FILL of the box across; then put its middle in the middle of the box
  let px = A * 0.3;
  px *= (A * FILL) / at(px).w;
  const m = at(px);
  draw(document.getElementById('c').getContext('2d'), 1, px, A / 2 - m.cx, A / 2 - m.cy, m.mids);
  window.ready = true;
</script></body></html>`;

const out = root + 'marketing/out/icons-channel/';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [size, art, lines, fill] of [[16, 16, ['%'], 0.8], [32, 32, ['30%', 'OFF'], 0.92], [48, 46, ['30%', 'OFF'], 0.92], [128, 96, ['30%', 'OFF'], 0.92]]) {
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
