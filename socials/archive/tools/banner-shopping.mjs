// "Home Shopping Channel" as the extension's banner (site/v-shopping-channel-banner.html), shown in place
// on the mock pages through tools/banner-in-place.html, and bare at the banner's box sizes.
//   node tools/banner-shopping.mjs shots     in-context stills: desktop 1440x900 (and 1280x800, 1920x1080, 1366x650); phone 390x844 @2x
//   node tools/banner-shopping.mjs bare      the banner page alone at its box sizes (for checking the layouts)
// Build the page first: python3 tools/site-build.py v-shopping-channel-banner
// The clock (performance.now) is replaced in every frame before it loads, so time moves only when this
// script moves it; the date is Friday 27 November 2026, 14:00 local (Black Friday), moving with it.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const NAME = 'v-shopping-channel-banner';
const out = `${root}out/banner-shopping-channel/`;
fs.mkdirSync(out, { recursive: true });
const [mode = 'shots', at = '2.2'] = process.argv.slice(2);
const harness = `file://${root}tools/banner-in-place.html?banner=../out/site/${NAME}.html`;
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
let errors = 0;

async function open(width, height, dsf, url) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dsf });
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', width, height, e.message); });
  page.on('console', (m) => { if (m.type() === 'error') { errors++; console.log('[console]', width, height, m.text()); } });
  await page.addInitScript(() => {
    window.__t = 0;
    performance.now = () => window.__t * 1000;
    const Real = Date, start = new Real(2026, 10, 27, 14, 0, 0).getTime();
    class Fake extends Real { constructor(...a) { if (a.length) super(...a); else super(start + window.__t * 1000); } static now() { return start + window.__t * 1000; } }
    window.Date = Fake;
  });
  await page.goto(url);
  await page.waitForTimeout(4500); // fonts, layout, the globe's frames decoded
  return page;
}
const step = async (page, t) => {
  for (const f of page.frames()) await f.evaluate((t) => { window.__t = t; }, t); // every frame keeps its own clock
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

if (mode === 'shots') {
  for (const [w, h, dsf] of [[1440, 900, 1], [1280, 800, 1], [1920, 1080, 1], [1366, 650, 1], [390, 844, 2]]) {
    const page = await open(w, h, dsf, harness);
    await step(page, Number(at));
    const name = `${w <= 768 ? 'phone' : 'desktop'}-${w}x${h}.png`;
    await page.screenshot({ path: out + name });
    console.log(out + name);
    await page.close();
  }
} else if (mode === 'bare') {
  const dir = `${out}bare/`; fs.mkdirSync(dir, { recursive: true });
  for (const [w, h] of [[384, 800], [432, 900], [576, 1080], [410, 650], [390, 279], [768, 338]]) {
    const edge = w / h < 1 ? 'left' : 'bottom';
    const page = await open(w, h, 1, `file://${root}out/site/${NAME}.html?keep&edge=${edge}&clear=17`);
    await step(page, Number(at));
    await page.screenshot({ path: `${dir}${w}x${h}.png` });
    console.log(`${dir}${w}x${h}.png`);
    await page.close();
  }
}
await browser.close();
if (errors) { console.log(errors, 'page errors'); process.exitCode = 1; }
