// Draw the extension icons in the banner's look: the studio blue, a yellow sale "%" (with "30%" at
// the larger sizes) in the slanted heavy type with its stacked navy shadow.
//   node store/icons-channel.mjs      -> ../src/icons/icon{16,32,48,128}.png, out/icons-channel/preview.png
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const here = new URL('.', import.meta.url).pathname, root = here + '../../';
const font = 'data:font/woff2;base64,' + fs.readFileSync(root + 'src/fonts/archivo-black.woff2').toString('base64');

// size: the icon; art: the artwork's box inside it (the store wants 96 of 128, with clear padding)
const page = (size, art, text) => `<!doctype html><html><head><style>
  @font-face { font-family: B; src: url(${font}) format("woff2"); }
  html, body { margin: 0; background: transparent; }
  .i { position: relative; width: ${size}px; height: ${size}px; display: grid; place-items: center; }
  .a { position: relative; width: ${art}px; height: ${art}px; border-radius: ${art * 0.22}px; overflow: hidden;
       background: radial-gradient(circle at 60% 40%, #4fb6ff 0%, #2a8cff 18%, #1348ee 42%, transparent 75%), linear-gradient(#0a22d6, #070f9c);
       box-shadow: inset 0 0 0 ${Math.max(1, art * 0.03)}px rgba(255, 255, 255, 0.25); display: grid; place-items: center; }
  .t { font: ${art * (text === '%' ? 0.74 : 0.42)}px/1 B; color: #fff035; letter-spacing: -0.05em; transform: skewX(-9deg) translate(-${art * 0.03}px, ${art * 0.02}px);
       text-shadow: ${[1, 2, 3, 4].map((k) => `${k * art * 0.012}px ${k * art * 0.012}px 0 #0a0f66`).join(', ')}; }
</style></head><body><div class="i"><div class="a"><div class="t">${text}</div></div></div></body></html>`;

const out = root + 'marketing/out/icons-channel/';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ deviceScaleFactor: 1 });
for (const [size, art, text] of [[16, 16, '%'], [32, 32, '%'], [48, 46, '30%'], [128, 96, '30%']]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(page(size, art, text));
  await p.evaluate(() => document.fonts.ready);
  await p.locator('.i').screenshot({ path: `${root}src/icons/icon${size}.png`, omitBackground: true });
}
// a preview, each size drawn large with hard pixels
await p.setViewportSize({ width: 900, height: 300 });
await p.setContent(`<body style="margin:0;background:#e9ebf2;display:flex;gap:30px;align-items:center;padding:30px">${[16, 32, 48, 128]
  .map((s) => `<img src="data:image/png;base64,${fs.readFileSync(`${root}src/icons/icon${s}.png`).toString('base64')}" style="width:${s <= 48 ? s * 4 : 192}px;image-rendering:pixelated">`).join('')}</body>`);
await p.screenshot({ path: out + 'preview.png' });
await b.close();
console.log('icons written');
