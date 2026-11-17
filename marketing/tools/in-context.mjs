// Shows a banner design where it will actually live: on a web page, covering the right-hand 30%
// of a desktop browser window and the top third of a phone.
//   node tools/in-context.mjs <banner-v.png> <banner-h.png> <out.png>
// The page screenshots are taken once and cached in out/context-pages/.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { startServer } from './serve.mjs';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch { ({ chromium } = createRequire('/opt/node-tools/node_modules/')('playwright')); }

const [bannerV, bannerH, out] = process.argv.slice(2);
if (!bannerV || !bannerH || !out) { console.error('usage: node tools/in-context.mjs <banner-v.png> <banner-h.png> <out.png>'); process.exit(2); }
const root = new URL('..', import.meta.url).pathname;
const cache = `${root}out/context-pages/`;
fs.mkdirSync(cache, { recursive: true });
if (!fs.existsSync(`${cache}desktop.png`) || !fs.existsSync(`${cache}phone.png`)) {
  const { server, origin } = await startServer(root);
  const browser = await chromium.launch();
  const desk = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await desk.goto(`${origin}/store/mock/shop.html`); await desk.waitForTimeout(400);
  await desk.screenshot({ path: `${cache}desktop.png` });
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await phone.goto(`${origin}/store/mock/news.html`); await phone.waitForTimeout(400);
  await phone.screenshot({ path: `${cache}phone.png` });
  await browser.close(); server.close();
}
execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw
desk = Image.open('${cache}desktop.png').convert('RGB')          # 1280x800
phone = Image.open('${cache}phone.png').convert('RGB')           # 780x1688 (2x)
v = Image.open('${bannerV}').convert('RGB')
h = Image.open('${bannerH}').convert('RGB')
# desktop: the banner fills the right-hand 30%, zoomed to fit and centred, edges filled with its own corner colour
W, H = round(1280 * 0.3), 800
k = min(W / v.width, H / v.height)
vs = v.resize((round(v.width * k), round(v.height * k)), Image.LANCZOS)
panel = Image.new('RGB', (W, H), v.getpixel((2, 2)))
panel.paste(vs, ((W - vs.width) // 2, 0))
desk.paste(panel, (1280 - W, 0))
# phone: the banner fills the top third
PW, PH = phone.width, round(phone.height * 0.33)
k = min(PW / h.width, PH / h.height)
hs = h.resize((round(h.width * k), round(h.height * k)), Image.LANCZOS)
strip = Image.new('RGB', (PW, PH), h.getpixel((2, 2)))
strip.paste(hs, ((PW - hs.width) // 2, 0))
phone.paste(strip, (0, 0))
phone = phone.resize((round(phone.width * 800 / phone.height), 800), Image.LANCZOS)
sheet = Image.new('RGB', (1280 + 24 + phone.width, 800), (24, 24, 28))
sheet.paste(desk, (0, 0)); sheet.paste(phone, (1280 + 24, 0))
sheet.save('${out}')
print('${out}', sheet.size)
`], { stdio: 'inherit' });
