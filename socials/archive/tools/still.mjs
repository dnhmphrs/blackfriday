// Render single frames of a composition for looking at.
//   node tools/still.mjs broadcast "format=9x16" out/test.png 0 [3.1 7 ...]
import { createRequire } from 'node:module';
import { startServer } from './serve.mjs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const [comp = 'broadcast', query = 'format=9x16', out = 'out/still.png', ...times] = process.argv.slice(2);
const root = new URL('..', import.meta.url).pathname;
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 300)); });
await page.goto(`${origin}/comps/${comp}.html?${query}`);
await page.waitForFunction(() => window.ready, null, { timeout: 90000 });
const { width, height } = await page.evaluate(() => ({ width: window.comp.width, height: window.comp.height }));
await page.setViewportSize({ width, height });
const list = times.length ? times.map(Number) : [0];
for (const [i, t] of list.entries()) {
  const t0 = Date.now();
  await page.evaluate((t) => window.comp.setTime(t), t);
  const path = list.length === 1 ? out : out.replace(/\.png$/, `-${i}.png`);
  await page.locator('#stage').screenshot({ path: root + path, type: 'png' });
  console.log(`t=${t}s -> ${path} (${Date.now() - t0}ms)`);
}
await browser.close(); server.close();
