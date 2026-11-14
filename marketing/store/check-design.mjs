// Checks one overlay design in the real extension at four window shapes and writes one
// contact sheet to look at.
//   node store/check-design.mjs <design>     -> out/designs/check/<design>.png   (exit 1 on problems)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { launchWithExtension, clickAction } from '../../test/helpers.mjs';
import { startServer } from '../tools/serve.mjs';

const design = process.argv[2];
const root = new URL('..', import.meta.url).pathname;
const src = new URL('../../src', import.meta.url).pathname;
const file = `${src}/designs/${design}.js`;
if (!design || !fs.existsSync(file)) { console.error('usage: node store/check-design.mjs <design>   (src/designs/<design>.js must exist)'); process.exit(2); }
const problems = [];
const code = fs.readFileSync(file, 'utf8');
for (const [re, why] of [
  [/https?:\/\//, 'contains a URL: designs must not load anything from the network'],
  [/@import|url\(\s*["']?(?!data:)/, 'uses @import or a non-data url(): no external resources'],
  [/\bfetch\(|XMLHttpRequest|\beval\(|new Function\(|<script/i, 'uses fetch/XHR/eval/script'],
  [/@font-face/, '@font-face does not work inside a shadow root; use system fonts'],
  [/\b(localStorage|sessionStorage|document\.cookie)\b/, 'touches page storage or cookies'],
]) if (re.test(code)) problems.push(why);
if (!/globalThis\.thirtyOffDesign\s*=/.test(code)) problems.push('must assign globalThis.thirtyOffDesign');
if (!/aria-label=/.test(code)) problems.push('the outer element needs role="img" and an aria-label');
if (!/pointer-events:\s*auto/.test(code)) problems.push('the solid part needs pointer-events: auto (the host lets clicks through)');

const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-check-'));
fs.cpSync(src, ext, { recursive: true, filter: (f) => !f.endsWith('.zip') });
const mf = JSON.parse(fs.readFileSync(`${ext}/manifest.json`, 'utf8'));
mf.content_scripts[0].js[0] = `designs/${design}.js`;
fs.writeFileSync(`${ext}/manifest.json`, JSON.stringify(mf, null, 2));

const outDir = `${root}out/designs/check/`;
fs.mkdirSync(outDir, { recursive: true });
const { server, origin } = await startServer(root);
const shapes = [['desktop', 1280, 800, 'shop'], ['large', 1920, 1080, 'news'], ['short', 1280, 520, 'shop'], ['narrow', 700, 900, 'news']];
const shots = [];
for (const [label, width, height, pageName] of shapes) {
  const { context, extensionId } = await launchWithExtension(ext, { viewport: { width, height } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Runtime.enable');
  cdp.on('Runtime.exceptionThrown', (e) => problems.push(`${label}: script error: ${(e.exceptionDetails.exception?.description || e.exceptionDetails.text).split('\n')[0]}`));
  await page.goto(`${origin}/store/mock/${pageName}.html`);
  await clickAction(context, page, extensionId);
  // wait for the overlay rather than a fixed pause: on a busy machine the click can take a while to land
  await page.waitForFunction(() => document.querySelector('thirty-off-overlay'), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const host = document.querySelector('thirty-off-overlay');
    const solid = host && [...host.shadowRoot.children].find((el) => el.tagName !== 'STYLE');
    if (!solid) return null;
    const r = solid.getBoundingClientRect();
    // text that pokes out of the solid area horizontally
    const spill = [...solid.querySelectorAll('*')].filter((el) => el.children.length === 0 && el.textContent.trim() && getComputedStyle(el).display !== 'none')
      .map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ el, r: q }) => q.width > 0 && (q.right > r.right + 2 || q.left < r.left - 2) && !el.closest('[data-scrolls]'))
      .map(({ el }) => (el.textContent.trim().slice(0, 30)));
    return { rect: [r.x, r.y, r.width, r.height].map(Math.round), vw: document.documentElement.clientWidth, vh: innerHeight, spill: [...new Set(spill)].slice(0, 6), hit: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.nodeName };
  });
  if (!info) problems.push(`${label}: the overlay did not appear`);
  else {
    const [x, y, w, h] = info.rect;
    if (width > 768) {
      if (Math.abs(w - info.vw * 0.3) > 3 || x + w < info.vw - 2 || y !== 0 || h < info.vh - 1) problems.push(`${label}: solid area should be the right-hand 30%, full height; got x=${x} y=${y} w=${w} h=${h} in ${info.vw}x${info.vh}`);
    } else if (w < info.vw - 2 || y !== 0 || Math.abs(h - info.vh * 0.33) > 6) problems.push(`${label}: at <=768px wide the solid area should be the top 33%, full width; got x=${x} y=${y} w=${w} h=${h} in ${info.vw}x${info.vh}`);
    if (info.hit !== 'THIRTY-OFF-OVERLAY') problems.push(`${label}: clicks pass through the solid area (needs pointer-events: auto)`);
    if (info.spill.length) console.log(`note (${label}): text reaching outside the solid area (fine only if it is a deliberate scroller): ${info.spill.join(' | ')}`);
  }
  const shot = `${outDir}${design}-${label}.png`;
  await page.screenshot({ path: shot });
  shots.push(shot);
  await context.close();
}
server.close();
execFileSync('python3', ['-c', `
from PIL import Image
ims=[Image.open(p).convert('RGB') for p in ${JSON.stringify(shots)}]
H=760
scaled=[im.resize((round(im.width*H/im.height),H),Image.LANCZOS) if im.height>=H else im for im in ims]
W=sum(i.width for i in scaled)+10*(len(scaled)-1)
sheet=Image.new('RGB',(W,H),(30,30,30)); x=0
for im in scaled:
    sheet.paste(im,(x,0)); x+=im.width+10
if W>2000: sheet=sheet.resize((2000,round(H*2000/W)),Image.LANCZOS)
sheet.save('${outDir}${design}.png')
`]);
for (const s of shots) fs.rmSync(s);
console.log(`sheet (desktop 1280x800 | large 1920x1080 | short 1280x520 | narrow 700x900): out/designs/check/${design}.png`);
if (problems.length) { console.log('PROBLEMS:\n - ' + [...new Set(problems)].join('\n - ')); process.exit(1); }
console.log('OK: no problems found');
