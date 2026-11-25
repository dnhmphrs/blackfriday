// Screenshot built site pages at several window sizes (the tape look kept on) and report scrolling, errors and link sizes.
//   node tools/site-shots.mjs <dir of built pages> <out dir> <name> [name...]
// Screenshot the live site pages at several window sizes (with the tape look kept on), and check nothing scrolls.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/home/user/blackfriday/package.json')('playwright');
const [dir, out, ...names] = process.argv.slice(2);
const SIZES = [['1440x900', 1440, 900, 1], ['1920x1080', 1920, 1080, 1], ['1280x800', 1280, 800, 1], ['1366x650', 1366, 650, 1], ['1024x768', 1024, 768, 1],
               ['phone', 390, 844, 2], ['tablet', 768, 1024, 1], ['phone-land', 844, 390, 2]];
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
for (const name of names) for (const [label, width, height, scale] of SIZES) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  page.on('pageerror', (e) => console.log('[pageerror]', name, label, e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', name, label, m.text().slice(0, 160)); });
  await page.goto(`file://${dir}/${name}.html?keep`); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, links: [...document.querySelectorAll('a')].map((a) => { const b = a.getBoundingClientRect(); return [a.textContent.trim().slice(0, 18), Math.round(b.width), Math.round(b.height), b.top >= 0 && b.bottom <= innerHeight + 200]; }) }));
  if (r.sw > width || r.sh > height) console.log('[scroll]', name, label, r.sw, r.sh);
  console.log(name, label, JSON.stringify(r.links));
  await page.screenshot({ path: `${out}/${name}-${label}.png` });
  await page.close();
}
await browser.close();
