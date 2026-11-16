// Contact sheet: one object from several angles in a single image, for looking at.
//   node tools/sheet.mjs globe [out.png] [extra query, e.g. "plinth=1&bg=blue"]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from './serve.mjs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');

const [object = 'globe', out = `out/sheet-${object}.png`, extra = 'bg=blue'] = process.argv.slice(2);
const root = new URL('..', import.meta.url).pathname;
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
const cell = 560, angles = [0, 45, 100, 160, 215, 290];
const page = await browser.newPage({ viewport: { width: cell, height: cell }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 240)); });
await page.goto(`${origin}/comps/kit.html?object=${object}&w=${cell}&h=${cell}&pr=2&${extra}`);
await page.waitForFunction(() => window.ready, null, { timeout: 60000 });
const shots = [];
for (const a of angles) {
  const t0 = Date.now();
  await page.evaluate((yaw) => window.kit.render(yaw), a);
  shots.push(await page.screenshot({ type: 'png' }));
  process.stdout.write(`${a}deg ${Date.now() - t0}ms  `);
}
await browser.close(); server.close();
// stitch with Python (PIL is already there)
const tmp = fs.mkdtempSync('/tmp/sheet-');
shots.forEach((b, i) => fs.writeFileSync(`${tmp}/${i}.png`, b));
const { execFileSync } = await import('node:child_process');
execFileSync('python3', ['-c', `
import sys
from PIL import Image
n=${angles.length}; c=${cell}; cols=3
im=Image.new('RGB',(c*cols,c*((n+cols-1)//cols)))
for i in range(n): im.paste(Image.open(f'${tmp}/{i}.png').convert('RGB'),((i%cols)*c,(i//cols)*c))
im.save('${root}${out}')
`]);
console.log('\nwrote', out);
