// A short clip of the real banner (a copy of the extension running in Chromium on the mock shop page),
// made frame by frame: every CSS animation and the noise's SVG clock are stopped and stepped, so the
// clip shows the true speed whatever this machine manages. For checking motion; not for public use.
//   node tools/banner-clip.mjs <out.mp4> [seconds=6] [extension folder=../extension/src]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startServer } from './serve.mjs';
import { launchWithExtension, makeTestCopy } from '../../extension/test/helpers.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const [out, secs = '6', ext = path.join(root, '../extension/src')] = process.argv.slice(2);
const FPS = 25, frames = fs.mkdtempSync(path.join(os.tmpdir(), 'banner-clip-'));
const { server, origin } = await startServer(root);
const { context } = await launchWithExtension(makeTestCopy(path.resolve(ext)), { tz: 'Europe/London', viewport: { width: 1440, height: 900 } });
const tab = await context.newPage();
await tab.goto(`${origin}/templates/mock/shop.html?fakeNow=${new Date(2026, 10, 27, 14).getTime()}`);
await tab.waitForFunction(() => document.querySelector('thirty-off-everything')?.shadowRoot?.querySelector('.frame.in'), null, { timeout: 15000 });
await tab.waitForTimeout(800);
const box = await tab.evaluate(() => { const r = document.querySelector('thirty-off-everything').shadowRoot.querySelector('.frame').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
for (let i = 0; i < Number(secs) * FPS; i++) {
  await tab.evaluate((t) => {
    const s = document.querySelector('thirty-off-everything').shadowRoot;
    s.querySelector('.tube').style.removeProperty('filter'); // keep the look on, however slowly this machine draws
    for (const a of s.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
    const svg = s.querySelector('svg.defs'); svg.pauseAnimations(); svg.setCurrentTime(t);
  }, i / FPS);
  await tab.screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92, clip: box });
}
await context.close(); server.close();
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(frames, '%04d.jpg'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-movflags', '+faststart', out]);
fs.rmSync(frames, { recursive: true, force: true });
console.log(out);
