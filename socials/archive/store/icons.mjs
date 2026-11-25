// Render the extension icons into ../../src/icons and a preview strip.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from '../tools/serve.mjs';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }
const root = new URL('..', import.meta.url).pathname;
const dest = new URL('../../src/icons/', import.meta.url).pathname;
fs.mkdirSync(dest, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
for (const size of [16, 32, 48, 128]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.goto(`${origin}/store/icon.html?size=${size}`);
  await page.waitForFunction(() => window.ready);
  await page.screenshot({ path: `${dest}icon${size}.png`, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
}
await browser.close(); server.close();
console.log('wrote icons to', dest);
