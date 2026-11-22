// Render store/post.html: stills, and the 12 s loops as frames for GIFs and video.
//   node store/posts.mjs still square [query] [out.png]   -> out/posts/<name>.png (query e.g. "bg=wall&ball=380")
//   node store/posts.mjs loop square [query]              -> frames/post-square/0000.png ... (180 frames, 15 fps)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const SIZE = { square: [1080, 1080], story: [1080, 1920], shot: [1280, 800], 'shot-only': [1280, 800], 'shot-lines': [1280, 800], 'shot-globe': [1280, 800], 'shot-card': [1280, 800], marquee: [1400, 560], tile: [880, 560] };

const [mode = 'still', f = 'square', query = '', outArg] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const [w, h] = SIZE[f];
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
await page.goto(`file://${root}store/post.html?f=${f}${query ? '&' + query : ''}`);
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });
if (mode === 'still') {
  fs.mkdirSync(root + 'out/posts', { recursive: true });
  const out = outArg || `${root}out/posts/${f}${query ? '-' + query.replace(/[^a-z0-9]+/gi, '-') : ''}.png`;
  await page.evaluate(() => window.setT(0));
  await page.locator('#p').screenshot({ path: out });
  console.log(out, JSON.stringify(await page.evaluate(() => Object.fromEntries(Object.entries(window.report).map(([k, v]) => [k, Array.isArray(v) ? v.map(Math.round) : Math.round(v * 10) / 10])))));
} else {
  const dir = `${root}frames/post-${f}/`;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 180; i++) {
    await page.evaluate((t) => window.setT(t), i / 15);
    await page.locator('#p').screenshot({ path: `${dir}${String(i).padStart(4, '0')}.png` });
  }
  console.log('loop', f, '-> 180 frames in', dir);
}
await browser.close();
