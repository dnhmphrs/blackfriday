// The cut globe as a small transparent loop for the extension's banner: one full turn.
//   node tools/globe-loop.mjs [frames=48] [size=300]  -> frames/globe-loop/*.png (assemble with store/embed-art.py)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from './serve.mjs';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }
const frames = Number(process.argv[2] || 48), size = Number(process.argv[3] || 300);
const root = new URL('..', import.meta.url).pathname;
const out = `${root}frames/globe-loop/`;
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
await page.goto(`${origin}/comps/kit.html?object=globe-core&w=${size}&h=${size}&dist=5.05&pr=2`);
await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
for (let i = 0; i < frames; i++) {
  const url = await page.evaluate(([yaw]) => window.kit.png(yaw, 15), [24 + (i * 360) / frames]);
  fs.writeFileSync(`${out}${String(i).padStart(3, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close(); server.close();
console.log(`${frames} frames -> frames/globe-loop`);
