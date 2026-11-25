// Render the GIF-banner extension icons into ../out/icons-gif (not src/), plus a preview sheet.
//   node store/icons-gif.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from '../tools/serve.mjs';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }
const root = new URL('..', import.meta.url).pathname;
const dest = new URL('../out/icons-gif/', import.meta.url).pathname;
fs.mkdirSync(dest, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
for (const size of [16, 32, 48, 128]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/store/icon-gif.html?size=${size}`);
  await page.waitForFunction(() => window.ready);
  await page.screenshot({ path: `${dest}icon${size}.png`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
}
{
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/store/icon-gif.html`);
  await page.waitForFunction(() => window.ready);
  await page.screenshot({ path: `${dest}preview.png`, fullPage: true });
  await page.close();
}
await browser.close(); server.close();
console.log('wrote icons to', dest);
