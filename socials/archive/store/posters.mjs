// Render store/poster.html: stills, and the 12 s loops as frames for GIFs and video.
//   node store/posters.mjs stills            -> out/posters-channel/<f>.png for every format
//   node store/posters.mjs loop square       -> frames/poster-square/0000.png ... (180 frames, 15 fps)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const SIZE = { square: [1080, 1080], portrait: [1080, 1350], shot: [1280, 800], marquee: [1400, 560], tile: [880, 560] };
const STILL_T = 0; // the globe on its hero pose, a glint lit, the 70% at rest

const [mode = 'stills', ...names] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
async function open(f) {
  const [w, h] = SIZE[f];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`file://${root}store/poster.html?f=${f}`);
  await page.evaluate(() => window.ready);
  return page;
}
if (mode === 'stills') {
  fs.mkdirSync(root + 'out/posters-channel', { recursive: true });
  for (const f of names.length ? names : Object.keys(SIZE)) {
    const page = await open(f);
    await page.evaluate((t) => window.setT(t), STILL_T);
    await page.locator('#p').screenshot({ path: `${root}out/posters-channel/${f}.png` });
    await page.close();
    console.log('still', f);
  }
} else {
  for (const f of names) {
    const dir = `${root}frames/poster-${f}/`;
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const page = await open(f);
    for (let i = 0; i < 180; i++) {
      await page.evaluate((t) => window.setT(t), STILL_T + i / 15);
      await page.locator('#p').screenshot({ path: `${dir}${String(i).padStart(4, '0')}.png` });
    }
    await page.close();
    console.log('loop', f, '-> 180 frames');
  }
}
await browser.close();
