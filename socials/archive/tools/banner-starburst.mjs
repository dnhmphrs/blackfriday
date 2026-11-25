// The Globe Badge as the extension's banner (site/v-starburst-banner.html), shown in place on the mock
// pages through tools/banner-in-place.html.
//   node tools/banner-starburst.mjs shots              in-context stills: desktop 1280x800, 1440x900, 1920x1080, 1366x650; phone 390x844 @2x
//   node tools/banner-starburst.mjs bare               the banner page alone at its box sizes (for checking the layouts)
//   node tools/banner-starburst.mjs video desktop|phone [seconds=6]
//                                                      6 s in context at 25 fps, H.264 (frames in frames/banner-starburst-*, deleted after)
// Build the page first: python3 tools/site-build.py v-starburst-banner
// The clock (performance.now) is replaced in every frame before it loads, so time moves only when this script moves it.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const root = new URL('../', import.meta.url).pathname;
const out = `${root}out/banner-starburst/`;
fs.mkdirSync(out, { recursive: true });
const [mode = 'shots', which = 'desktop', secs = '6'] = process.argv.slice(2);
const FPS = 25;
const harness = `file://${root}tools/banner-in-place.html`;
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
let errors = 0;

async function open(width, height, dsf, url, fixedClock) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dsf });
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', width, height, e.message); });
  page.on('console', (m) => { if (m.type() === 'error') { errors++; console.log('[console]', width, height, m.text()); } });
  if (fixedClock) await page.addInitScript(() => { window.__t = 0; performance.now = () => window.__t * 1000; });
  await page.goto(url);
  await page.waitForTimeout(4500); // fonts, layout, the globe's frames decoded
  return page;
}
const step = async (page, t) => {
  for (const f of page.frames()) await f.evaluate((t) => { window.__t = t; }, t); // every frame keeps its own clock
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

if (mode === 'shots') {
  for (const [w, h, dsf] of [[1280, 800, 1], [1440, 900, 1], [1920, 1080, 1], [1366, 650, 1], [390, 844, 2]]) {
    const page = await open(w, h, dsf, harness, true);
    await step(page, 2.2); // past the stamp's thud, the sticker settled
    const name = `${w <= 768 ? 'phone' : 'desktop'}-${w}x${h}.png`;
    await page.screenshot({ path: out + name });
    console.log(out + name);
    await page.close();
  }
} else if (mode === 'bare') {
  const dir = `${out}bare/`; fs.mkdirSync(dir, { recursive: true });
  for (const [w, h] of [[384, 800], [432, 900], [576, 1080], [410, 650], [390, 279], [768, 338]]) {
    const edge = w / h < 1 ? 'left' : 'bottom';
    const page = await open(w, h, 1, `file://${root}out/site/v-starburst-banner.html?keep&edge=${edge}&clear=17`, true);
    await step(page, 2.2);
    await page.screenshot({ path: `${dir}${w}x${h}.png` });
    console.log(`${dir}${w}x${h}.png`);
    await page.close();
  }
} else if (mode === 'video') {
  const [w, h, dsf] = which === 'phone' ? [390, 844, 2] : [1440, 900, 1];
  const frames = `${root}frames/banner-starburst-${which}/`;
  fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
  const page = await open(w, h, dsf, harness, true);
  const n = Math.round(Number(secs) * FPS);
  for (let i = 0; i < n; i++) {
    await step(page, i / FPS);
    await page.screenshot({ path: `${frames}${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  }
  await page.close();
  const file = `${out}${which}-${w}x${h}-6s.mp4`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${frames}%04d.jpg`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file]);
  fs.rmSync(frames, { recursive: true, force: true });
  console.log(file);
}
await browser.close();
if (errors) { console.log(errors, 'page errors'); process.exitCode = 1; }
