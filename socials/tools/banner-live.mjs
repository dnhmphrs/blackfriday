// Screenshots of a copy of the extension, running for real in Chromium, on the mock pages in
// templates/mock (a shop on the desktop, a news site on a phone), at a few window sizes, on Black
// Friday. Taken just after the banner has slid in, while the tape look is on. For checking a new
// banner on realistic pages; not for public use (see README).
//   node tools/banner-live.mjs [extension folder=../extension/src] [out folder=out/banner-live] [scale=1]   (the phone at twice the scale)
// Uses the extension's test helpers, so run `npm install` in ../extension first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';
import { launchWithExtension, makeTestCopy } from '../../extension/test/helpers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const [ext = path.join(root, '../extension/src'), out = path.join(root, 'out/banner-live'), scale = '1'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await startServer(root);
const BF = new Date(2026, 10, 27, 14).getTime();
const SIZES = [['desktop-1280x800', 1280, 800, 'shop'], ['desktop-1440x900', 1440, 900, 'shop'], ['desktop-1920x1080', 1920, 1080, 'shop'],
               ['desktop-1366x650', 1366, 650, 'shop'], ['desktop-1024x1000', 1024, 1000, 'shop'], ['phone-390x844', 390, 844, 'news']];
const dir = makeTestCopy(path.resolve(ext));
for (const [name, width, height, page] of SIZES) {
  const { context } = await launchWithExtension(dir, { tz: 'Europe/London', viewport: { width, height }, deviceScaleFactor: width <= 768 ? 2 * Number(scale) : Number(scale) });
  const tab = await context.newPage();
  tab.on('pageerror', (e) => console.log('[pageerror]', name, e.message));
  await tab.goto(`${origin}/templates/mock/${page}.html?fakeNow=${BF}`);
  await tab.waitForFunction(() => document.querySelector('thirty-off-everything')?.shadowRoot?.querySelector('.frame.in'), null, { timeout: 15000 });
  await tab.waitForTimeout(800); // the slide in is over; the look is still on
  // every animation 2.2 s in: the stamp down, the sticker still
  await tab.evaluate(() => { for (const a of document.querySelector('thirty-off-everything').shadowRoot.getAnimations()) if (a.animationName) a.currentTime = 2200; });
  await tab.waitForTimeout(100);
  await tab.screenshot({ path: `${out}/${name}.png` });
  console.log(name);
  await context.close();
}
server.close();
