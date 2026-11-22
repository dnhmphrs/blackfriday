// Cut the Channel banner's pictures out of comps/tv-banner, each on a transparent ground, for the
// live banner to lay out itself:
//   globe-NN.png  the spinning globe, one 4 s turn at 15 fps (it bobs over its column as it turns)
//   column.png    the chrome column under it, with its shadow
//   sticker.png   the -30% sticker            wow.png   the WOW! starburst
//   type-desktop.png, type-phone.png   the lettering, 30% OFF and EVERYTHING ON THE INTERNET.
//   node tools/channel-parts.mjs                         -> out/channel-page/parts/
//   node tools/channel-parts.mjs parts-white white=1     -> another folder, with more of the comp's options
//   node tools/channel-parts.mjs parts-white white=1 1   -> only the first globe frame and the column (for a still)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from './serve.mjs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');

const root = new URL('..', import.meta.url).pathname;
const [folder = 'parts', extra = '', only] = process.argv.slice(2);
const out = root + `out/channel-page/${folder}/`;
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
const CLEAR = 'html, body, #stage { background: transparent !important; } .bg { display: none !important; }';

async function open(query, hide) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 2025 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${origin}/comps/tv-banner.html?format=banner-v&crawl=0&only=0&glints=0&${query}${extra ? '&' + extra : ''}`);
  await page.waitForFunction(() => window.ready, null, { timeout: 90000 });
  await page.addStyleTag({ content: CLEAR + hide.map((s) => `${s} { display: none !important; }`).join(' ') });
  return page;
}
const shot = (page, path, clip) => page.screenshot({ path: out + path, clip, omitBackground: true });

// the globe alone: everything else in the 3D scene hidden
{
  const page = await open('burst=0&sticker=0&strips=0', ['#type', '#blink', '#over']);
  await page.evaluate(() => { const { scene, pivot } = window.comp.three; for (const o of scene.children) if (o !== pivot && !o.isLight) o.visible = false; });
  const FPS = 15, N = only ? Number(only) : 4 * FPS; // one turn of the spin and one bob: the loop
  for (let i = 0; i < N; i++) {
    await page.evaluate((t) => window.comp.setTime(t), 0.4 + i / FPS); // start on the hero pose
    await shot(page, `globe-${String(i).padStart(2, '0')}.png`, { x: 756 - 240, y: 1212 - 240, width: 480, height: 480 });
  }
  await page.close();
}
// the column alone
{
  const page = await open('burst=0&sticker=0&strips=0', ['#type', '#blink', '#over']);
  await page.evaluate(() => { window.comp.three.pivot.visible = false; window.comp.setTime(0.4); });
  await shot(page, 'column.png', { x: 756 - 300, y: 1212, width: 600, height: 2025 - 1212 });
  await page.close();
}
// the sticker and the starburst, each alone on the overlay canvas
if (!only) {
  const page = await open('burst=0&strips=0', ['#type', '#blink', '#gl']);
  await page.evaluate(() => window.comp.setTime(0.5)); // the hop is at rest
  await shot(page, 'sticker.png', { x: 912 - 160, y: 1068 - 160, width: 320, height: 320 });
  await page.close();
}
if (!only) {
  const page = await open('sticker=0&strips=0', ['#type', '#blink', '#gl']);
  await page.evaluate(() => window.comp.setTime(0.07)); // the burst at full size, its word yellow
  await shot(page, 'wow.png', { x: 264 - 180, y: 1506 - 180, width: 360, height: 360 });
  await page.close();
}
// the lettering: 30% OFF and EVERYTHING ON THE INTERNET., for the desktop and the phone layouts
for (const [name, query, clip] of only ? [] : [['type-desktop.png', 'format=banner-v', { x: 0, y: 0, width: 1080, height: 1000 }],
                                   ['type-phone.png', 'format=banner-h&h=760', { x: 0, y: 0, width: 640, height: 640 }]]) {
  const page = await browser.newPage({ viewport: { width: 1170, height: 2025 }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/comps/tv-banner.html?${query}&crawl=0&only=0&glints=0&burst=0&sticker=0&strips=0`);
  await page.waitForFunction(() => window.ready, null, { timeout: 90000 });
  await page.addStyleTag({ content: CLEAR + '#blink, #gl, #over { display: none !important; }' });
  await shot(page, name, clip);
  await page.close();
}
await browser.close();
server.close();
console.log('parts in', out);
