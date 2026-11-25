// The Globe Badge as pictures: out/site/v-starburst-post.html (built by tools/site-build.py) opened at a
// frame's exact size with ?f=<format>&keep (its own arrangement, the tape look kept on), its clock
// stepped by hand as in tools/site-video.mjs (performance.now and Date replaced before it loads).
//   node tools/post-render.mjs <format> <W> <H> still <out.png> [t=4.44 ...]   one PNG per time (-0, -1 ... when several)
//   node tools/post-render.mjs <format> <W> <H> video <frames dir> [seconds=12] [fps=25]   JPEG frames
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const [f, w, h, mode, out, ...rest] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', f, e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', f, m.text().slice(0, 300)); });
await page.addInitScript(() => {
  window.__t = 0;
  performance.now = () => window.__t * 1000;
  const Real = Date, start = new Real(2026, 10, 25, 20, 0, 0).getTime();
  class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(start + window.__t * 1000); } static now() { return start + window.__t * 1000; } }
  window.Date = Fake;
});
await page.goto(`file://${root}out/site/v-starburst-post.html?keep&f=${f}`);
await page.waitForFunction(() => window.ready !== undefined, null, { timeout: 60000 });
if (await page.evaluate(() => window.globeFailed)) console.log('[warn] the globe frames did not decode: it will not turn');
const rafs = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const at = async (t) => { await page.evaluate((t) => { window.__t = t; }, t); await rafs(); };
if (mode === 'still') {
  const times = rest.length ? rest.map(Number) : [4.44];
  for (const [i, t] of times.entries()) {
    await at(t);
    const path = times.length === 1 ? out : out.replace(/\.png$/, `-${i}.png`);
    await page.screenshot({ path, type: 'png' });
    console.log(f, `t=${t}`, '->', path);
  }
} else {
  const [secs = '12', fpsArg = '25'] = rest, fps = Number(fpsArg), n = Math.round(Number(secs) * fps);
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < n; i++) {
    await at(i / fps);
    await page.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  console.log(f, n, 'frames ->', out);
}
await browser.close();
