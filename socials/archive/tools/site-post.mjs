// The live site's pages as vertical posts (1080 x 1920): a still, and a 12 s loop as frames, from the
// page's own tall arrangement in its ?post mode (no links, no filter; tools/site-posts.sh adds the look).
//   node tools/site-post.mjs <one|two> still <out.png>
//   node tools/site-post.mjs <one|two> loop <frames dir>        180 frames, 15 a second
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const [layout, mode, out] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`file://${root}out/site/live-${layout}.html?post`);
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });
if (mode === 'still') {
  await page.evaluate(() => window.setT(0));
  await page.screenshot({ path: out });
} else {
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < 180; i++) {
    await page.evaluate((t) => window.setT(t), i / 15);
    await page.screenshot({ path: `${out}/${String(i).padStart(4, '0')}.png` });
  }
}
console.log(layout, mode, '->', out);
await browser.close();
