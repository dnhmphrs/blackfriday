// Screenshots of the real extension on the mock sites, with the clock set to Black Friday.
//   node tools/banner-shots.mjs [out dir]   -> <out>/<page>-<width>x<height>.png
import fs from 'node:fs';
import { launchWithExtension, makeTestCopy } from '../../test/helpers.mjs';
import { startServer } from './serve.mjs';

const root = new URL('..', import.meta.url).pathname;
const out = process.argv[2] || `${root}out/banner-shots/`;
fs.mkdirSync(out, { recursive: true });
const ext = makeTestCopy(new URL('../../src', import.meta.url).pathname);
const { server, origin } = await startServer(root);
const BF = Date.parse('2026-11-27T12:00:00');
for (const [width, height, pages] of [[1280, 800, ['shop', 'news']], [1440, 900, ['shop']], [1366, 650, ['news']], [1920, 1080, ['shop']], [390, 844, ['shop']], [700, 900, ['news']]]) {
  const { context } = await launchWithExtension(ext, { viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const name of pages) {
    await page.goto(`${origin}/store/mock/${name}.html?fakeNow=${BF}`);
    await page.waitForFunction(() => document.querySelector('thirty-off-everything'), null, { timeout: 20000 }).catch(() => errors.push('no banner'));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}${name}-${width}x${height}.png` });
  }
  console.log(`${width}x${height}`, errors.length ? errors.join(' | ') : 'ok');
  await context.close();
}
server.close();
