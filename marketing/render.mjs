// Render every frame of a composition to PNG, a few browser pages at a time.
//   node render.mjs <comp> <query> <name> [--workers 3] [--from 0] [--to N] [--step 1]
// Frames land in frames/<name>/raw/0000.png ...  (then: python3 vhs.py <name>)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from './tools/serve.mjs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const [comp, query, name, ...rest] = process.argv.slice(2);
const opt = (k, d) => { const i = rest.indexOf('--' + k); return i >= 0 ? Number(rest[i + 1]) : d; };
const workers = opt('workers', 3);
const root = new URL('.', import.meta.url).pathname;
const outDir = `${root}frames/${name}/raw`;
fs.mkdirSync(outDir, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();

async function open() {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${origin}/comps/${comp}.html?${query}`);
  await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
  const meta = await page.evaluate(() => ({ width: window.comp.width, height: window.comp.height, fps: window.comp.fps, duration: window.comp.duration, glitches: window.comp.glitches }));
  await page.setViewportSize({ width: meta.width, height: meta.height });
  return { page, meta };
}
const first = await open();
const { meta } = first;
const total = Math.round(meta.duration * meta.fps);
const from = opt('from', 0), to = opt('to', total), step = opt('step', 1);
fs.writeFileSync(`${root}frames/${name}/meta.json`, JSON.stringify({ ...meta, frames: total, comp, query }, null, 2));
const queue = [];
for (let i = from; i < to; i += step) queue.push(i);
const started = Date.now();
let done = 0;
async function work(w) {
  const { page } = w;
  for (let i = queue.shift(); i !== undefined; i = queue.shift()) {
    await page.evaluate((t) => window.comp.setTime(t), i / meta.fps);
    await page.locator('#stage').screenshot({ path: `${outDir}/${String(i).padStart(4, '0')}.png`, type: 'png' });
    if (++done % 30 === 0) console.log(`${name}: ${done} frames, ${((Date.now() - started) / done / 1000).toFixed(2)}s each`);
  }
}
const pool = [first];
for (let i = 1; i < workers; i++) pool.push(await open());
await Promise.all(pool.map(work));
console.log(`${name}: ${done} frames in ${((Date.now() - started) / 1000).toFixed(0)}s -> frames/${name}/raw`);
await browser.close();
server.close();
