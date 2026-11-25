// Exports the extension's banner artwork from comps/gif-banner at its native pixel size:
//   node tools/banner-export.mjs            -> ../src/images/{desktop,phone}{,-still}.webp, ticker-*.png
// (and prints the sizes, which src/banner.css relies on)
// The artwork (everything above the footer) becomes an animated WebP, one frame per tenth of a
// second over the 12 s loop; the marquee's text strip and frame become small PNGs that the
// extension scrolls itself.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { startServer } from './serve.mjs';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const root = new URL('..', import.meta.url).pathname;
const dest = new URL('../../src/images/', import.meta.url).pathname;
const tmp = fs.mkdtempSync('/tmp/banner-export-');
fs.mkdirSync(dest, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
const meta = {};
for (const [name, format] of [['desktop', 'banner-v'], ['phone', 'banner-h']]) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 2100 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${origin}/comps/gif-banner.html?format=${format}&part=body`);
  await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
  const parts = await page.evaluate(() => window.comp.marqueeParts());
  fs.mkdirSync(`${tmp}/${name}`);
  for (let i = 0; i < 120; i++) {
    const url = await page.evaluate((t) => { window.comp.setTime(t); return window.comp.pixels(); }, i / 10);
    fs.writeFileSync(`${tmp}/${name}/${String(i).padStart(3, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
  }
  fs.writeFileSync(`${dest}ticker-${name}.png`, Buffer.from(parts.strip.split(',')[1], 'base64'));
  fs.writeFileSync(`${dest}ticker-frame.png`, Buffer.from(parts.frame.split(',')[1], 'base64'));
  meta[name] = { width: parts.gifW, ticker: { h: parts.h, stripTop: parts.stripTop, speed: parts.speed } };
  await page.close();
}
await browser.close(); server.close();
// Crop each format to the artwork (drop the blank rows where the footer goes), then encode.
execFileSync('python3', ['-c', `
import glob, json, os
from PIL import Image
meta = json.loads('${JSON.stringify(meta)}')
for name in ('desktop', 'phone'):
    frames = [Image.open(f).convert('RGB') for f in sorted(glob.glob('${tmp}/' + name + '/*.png'))]
    blue = frames[0].getpixel((0, frames[0].height - 1))
    bottom = 0
    for im in frames:
        px = im.load()
        for y in range(im.height - 1, -1, -1):
            if any(px[x, y] != blue for x in range(im.width)):
                bottom = max(bottom, y + 1); break
    frames = [im.crop((0, 0, im.width, bottom + 2)) for im in frames]
    frames[0].save('${dest}' + name + '.webp', 'WEBP', save_all=True, append_images=frames[1:], duration=100, loop=0, lossless=True, method=6)
    frames[0].save('${dest}' + name + '-still.webp', 'WEBP', lossless=True, method=6)
    meta[name]['height'] = frames[0].height
    meta[name]['blue'] = '#%02x%02x%02x' % blue
for f in sorted(os.listdir('${dest}')):
    print(f, os.path.getsize('${dest}' + f) // 1024, 'KB')
print(json.dumps(meta))
`], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });
