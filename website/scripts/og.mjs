// Renders the share image, public/og.png (1200 x 630), from the built page: a frozen frame of the
// countdown. Run after `npm run build`; then build again so dist/ carries the new picture.
//   npm run build && npm run og && npm run build
process.env.TZ = 'America/New_York';
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

process.chdir(fileURLToPath(new URL('..', import.meta.url))); // dist/ and public/ are the site's own

const server = await serve('dist', 0, { quiet: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, timezoneId: 'America/New_York' });
await page.goto(`${server.url}?now=2026-11-20T12:00&freeze&keep`);
await page.waitForFunction(() => window.__bf && window.__bf.ready);
await page.waitForTimeout(500);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
server.close();
// the tape's grain makes a big PNG: down to 256 colours if Python and Pillow are about (optional)
try {
  execFileSync('python3', ['-c', `from PIL import Image
im = Image.open('public/og.png').convert('RGB')
im.quantize(256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save('public/og.png', optimize=True)`], { stdio: 'pipe' });
} catch { console.log('(python3 with Pillow not found: og.png left at full colour)'); }
console.log(`wrote public/og.png, ${Math.round(statSync('public/og.png').size / 1024)} KB`);
