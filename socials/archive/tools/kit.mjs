// The object kit: each hero object as transparent PNGs from three angles and as a .glb model.
//   node tools/kit.mjs [object ...]      -> out/kit/<object>-<angle>.png, out/kit/<object>.glb
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { startServer } from './serve.mjs';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const all = ['globe-core', 'globe', 'thirty', 'thirty-red', 'percent', 'dollar', 'cursor'];
const objects = process.argv.slice(2).length ? process.argv.slice(2) : all;
const root = new URL('..', import.meta.url).pathname;
const out = `${root}out/kit/`;
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await startServer(root);
const browser = await chromium.launch();
const SIZE = 1600;
for (const object of objects) {
  const page = await browser.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', object, e.message));
  await page.goto(`${origin}/comps/kit.html?object=${object}&w=${SIZE}&h=${SIZE}&dist=${object.startsWith('globe') ? 6.4 : 7.6}`);
  await page.waitForFunction(() => window.ready, null, { timeout: 120000 });
  for (const [label, yaw, elev] of [['front', 24, 12], ['left', -38, 12], ['right', 62, 18]]) {
    const dataUrl = await page.evaluate(([y, e]) => window.kit.png(y, e), [yaw, elev]);
    fs.writeFileSync(`${out}${object}-${label}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
  }
  const glb = await page.evaluate(async () => {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    window.kit.pivot.rotation.y = 0;
    const buffer = await new GLTFExporter().parseAsync(window.kit.object, { binary: true });
    let s = ''; const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  });
  fs.writeFileSync(`${out}${object}.glb`, Buffer.from(glb, 'base64'));
  console.log(object, 'ok', (fs.statSync(`${out}${object}.glb`).size / 1e6).toFixed(2), 'MB glb');
  if (object === 'globe-core') { // a full turn of the hero, as frames for a transparent loop
    fs.mkdirSync(`${root}frames/turntable`, { recursive: true });
    await page.evaluate(() => { window.kit.renderer.setSize(720, 720, false); window.kit.camera.aspect = 1; window.kit.camera.updateProjectionMatrix(); });
    for (let i = 0; i < 60; i++) {
      const dataUrl = await page.evaluate(([y]) => window.kit.png(y, 14), [i * 6]);
      fs.writeFileSync(`${root}frames/turntable/${String(i).padStart(3, '0')}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
    }
  }
  await page.close();
}
await browser.close(); server.close();
