// A built site page as a vertical video: the page opened at 1080 x 1920 (so it takes its tall, phone
// arrangement), its clock stepped by hand frame by frame, each frame screenshotted with the tape look on.
//   node tools/site-video.mjs <name> <frames dir> [seconds=12] [fps=25]
// The page's clock (performance.now) and the date are replaced before it loads: time starts at 0 and
// moves only when this script moves it, and "now" is a fixed evening two days before Black Friday.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const [name, out, secs = '12', fpsArg = '25'] = process.argv.slice(2);
const fps = Number(fpsArg), n = Math.round(Number(secs) * fps);
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', name, e.message));
await page.addInitScript(() => {
  window.__t = 0;
  performance.now = () => window.__t * 1000;
  const Real = Date, start = new Real(2026, 10, 25, 20, 0, 0).getTime();
  class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(start + window.__t * 1000); } static now() { return start + window.__t * 1000; } }
  window.Date = Fake;
});
await page.goto(`file://${root}out/site/${name}.html?keep`);
await page.waitForTimeout(4000); // fonts, layout, the globe's frames decoded
const rafs = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => { window.__t = t; }, i / fps);
  await rafs();
  await page.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); // JPEG: a 12 s clip of PNGs is a gigabyte
}
await browser.close();
console.log(name, n, 'frames ->', out);
