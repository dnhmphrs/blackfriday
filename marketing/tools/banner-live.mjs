// Screenshots of a copy of the extension, running for real in Chromium, on the mock pages in
// store/mock (a shop on the desktop, a news site on a phone), at a few window sizes, on Black
// Friday. Taken just after the banner has slid in, while the tape look is on (where a machine
// draws slowly, as this one does, the banner later takes the look off).
//   node tools/banner-live.mjs <extension folder> <out folder> [scale=1]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { startServer } from './serve.mjs';
const req = createRequire('/home/user/blackfriday/package.json');
const { launchWithExtension, makeTestCopy } = await import('/home/user/blackfriday/test/helpers.mjs');

const [ext, out, scale = '1'] = process.argv.slice(2);
if (!ext || !out) { console.error('usage: node tools/banner-live.mjs <extension folder> <out folder> [scale]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const root = new URL('..', import.meta.url).pathname;
const { server, origin } = await startServer(root);
const BF = new Date(2026, 10, 27, 14).getTime();
const SIZES = [['desktop-1280x800', 1280, 800, 'shop'], ['desktop-1440x900', 1440, 900, 'shop'], ['desktop-1920x1080', 1920, 1080, 'shop'],
               ['desktop-1366x650', 1366, 650, 'shop'], ['desktop-1024x1000', 1024, 1000, 'shop'], ['phone-390x844', 390, 844, 'news']];
const dir = makeTestCopy(path.resolve(ext));
for (const [name, width, height, page] of SIZES) {
  const { context } = await launchWithExtension(dir, { tz: 'Europe/London', viewport: { width, height }, deviceScaleFactor: Number(scale) });
  const tab = await context.newPage();
  tab.on('pageerror', (e) => console.log('[pageerror]', name, e.message));
  await tab.goto(`${origin}/store/mock/${page}.html?fakeNow=${BF}`);
  await tab.waitForFunction(() => document.querySelector('thirty-off-everything')?.shadowRoot?.querySelector('.frame.in'), null, { timeout: 15000 });
  await tab.waitForTimeout(800); // the slide in is over; the look is still on
  await tab.screenshot({ path: `${out}/${name}.png` });
  console.log(name);
  await context.close();
}
server.close();
