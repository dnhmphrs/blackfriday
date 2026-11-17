// Overlay demos: the REAL extension (src/, as shipped) recorded on the mock store pages,
// frame by frame and deterministically, as a still and a looping GIF per page and device.
//
//   node tools/overlay-demo.mjs            (from marketing/)
//   node tools/overlay-demo.mjs phone      (only the demos whose name contains "phone")
//
// Writes out/demos/<name>.png and <name>.gif; frames go to frames/demo-<name>/ (both gitignored).
//
// How it stays deterministic: nothing is captured in real time. The page is loaded once with
// the extension running (its clock faked to Black Friday, 14:00 London), and then, for every
// output frame at time t:
//   - the artwork: the visible img.art gets one pre-decoded frame of its own animated WebP,
//     frame (ART_START + floor(t * 10)) % 120, served as a lossless PNG. The <img> element,
//     its classes, size and image-rendering stay exactly as the extension made them.
//   - the marquee: the CSS animation on .run is paused and its currentTime set, so the strip
//     sits where it would be at t (see marqueeMs for the seamless-loop timing).
// Then page.screenshot() (the banner is a popover in the top layer, which screenshots include).
//
// Before any of that, one ordinary screenshot of the untouched page is kept as live.png, and the
// banner's layout (every box in its shadow root) is measured before and after the swap: they
// must match, so the demo shows the banner exactly as the extension draws it.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { makeTestCopy, serve } from '../../test/helpers.mjs';

const MARKETING = new URL('..', import.meta.url).pathname;
const REPO = path.resolve(MARKETING, '..');
const SRC = path.join(REPO, 'src');
const OUT = path.join(MARKETING, 'out/demos');
const FRAMES = path.join(MARKETING, 'frames');

const FPS = 20;
const SECONDS = 12; // the artwork's loop: 120 frames of 100 ms
const FRAME_COUNT = FPS * SECONDS;
const ART_FRAMES = 120, ART_MS = 100;
const MARQUEE_SPEED = 60; // banner px a second (SPEED in src/content.js)
// The loop starts on artwork frame 11: "BLACK FRIDAY ONLY!" is yellow (it blinks white every
// half second) and the globe shows its cut face with "30% OFF". The marquee starts at its own
// beginning, "But wait… there's less!", at t = 0, so frame 0 is the still and the GIF's first
// frame, which is what most previews show.
const ART_START = 11;

// Black Friday 2026 is Friday 27 November. London is on GMT (UTC+0) in November, so 14:00
// local is 14:00 UTC. The test copy of the extension reads this from ?fakeNow= (it keeps
// ticking from there, which is harmless: the banner only cares about the date).
const TZ = 'Europe/London';
const FAKE_NOW = Date.UTC(2026, 10, 27, 14, 0, 0);

const DEVICES = {
  desktop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
};
const DEMOS = [
  { name: 'overlay-desktop-news-1280x800', device: 'desktop', page: 'news.html' },
  { name: 'overlay-desktop-shop-1280x800', device: 'desktop', page: 'shop.html' },
  { name: 'overlay-phone-shop-390x844', device: 'phone', page: 'shop.html' },
  { name: 'overlay-phone-news-390x844', device: 'phone', page: 'news.html' },
];

const GIF_LIMIT = 8 * 1024 * 1024;
const TAG = 'thirty-off-everything';

const log = (...a) => console.log(...a);
const mb = (n) => (n / 1048576).toFixed(2) + ' MB';

// --- the artwork, decoded -------------------------------------------------------------------

// Frame durations straight from the WebP's ANMF chunks (Pillow does not report them reliably).
function webpDurations(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${file}: not a WebP`);
  const durations = [];
  for (let i = 12; i + 8 <= b.length;) {
    const type = b.toString('ascii', i, i + 4), size = b.readUInt32LE(i + 4);
    if (type === 'ANMF') durations.push(b.readUIntLE(i + 8 + 12, 3)); // X, Y, W-1, H-1 (3 bytes each), then duration
    i += 8 + size + (size & 1);
  }
  return durations;
}

// Decode images/<kind>.webp (from the snapshot of src/ being recorded) into frames/demo-art-<kind>/NNN.png with Pillow (ImageSequence
// composites each frame onto the previous ones, as a browser does). Lossless in, lossless out.
function decodeArt(extDir, kind) {
  const file = path.join(extDir, `images/${kind}.webp`);
  const durations = webpDurations(file);
  if (durations.length !== ART_FRAMES || durations.some((d) => d !== ART_MS))
    throw new Error(`${file}: expected ${ART_FRAMES} frames of ${ART_MS} ms, got ${durations.length}: ${[...new Set(durations)]}`);
  const dir = path.join(FRAMES, `demo-art-${kind}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const out = execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image, ImageSequence
im = Image.open(sys.argv[1])
n = 0
for n, f in enumerate(ImageSequence.Iterator(im), 1):
    f.convert('RGBA').save('%s/%03d.png' % (sys.argv[2], n - 1))
print(n, im.size[0], im.size[1])
`, file, dir]).toString().trim().split(' ').map(Number);
  if (out[0] !== ART_FRAMES) throw new Error(`${file}: Pillow decoded ${out[0]} frames`);
  log(`  art ${kind}: ${out[0]} frames of ${ART_MS} ms, ${out[1]}x${out[2]} -> ${path.relative(MARKETING, dir)}/`);
  return dir;
}

// --- browser --------------------------------------------------------------------------------

// Like launchWithExtension() in test/helpers.mjs, plus a device scale factor (2 for the phone,
// so its 390x844 CSS px come out as 780x1688 images).
async function launch(extDir, device) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-demo-profile-'));
  fs.mkdirSync(path.join(userDataDir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(userDataDir, 'Default', 'Preferences'), JSON.stringify({ extensions: { ui: { developer_mode: true } } }));
  const d = DEVICES[device];
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport: d.viewport,
    deviceScaleFactor: d.deviceScaleFactor,
    timezoneId: TZ,
    reducedMotion: 'no-preference', // the animated banner, not the -still one
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`, '--enable-unsafe-extension-debugging'],
  });
  return { context, userDataDir };
}

// Wait until the banner is up and fully loaded: popover open, stylesheet applied, every image
// decoded, the page's fonts ready, and any text in the banner drawn in its web font.
async function waitForBanner(page) {
  await page.waitForFunction((tag) => {
    const host = document.querySelector(tag);
    const sr = host?.shadowRoot;
    if (!sr || !host.matches(':popover-open')) return false;
    const css = sr.querySelector('link[rel=stylesheet]');
    if (!css?.sheet) return false;
    return [...sr.querySelectorAll('img')].every((img) => img.complete && img.naturalWidth > 0);
  }, TAG, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await waitForBannerFonts(page);
  // Two frames so the zoom set by fit() on the last image load has been painted.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return fonts;
}

// The extension loads its font (v1.8: "TOE Inter", for the credit line) with a FontFace made in
// the content script's isolated world, which the page's own document.fonts does not list. So ask
// Chromium what it actually drew each text element in the banner with (CSS.getPlatformFontsForNode)
// and wait until that is a web font, not a fallback. Returns a description for the log.
async function waitForBannerFonts(page) {
  const textCount = await page.evaluate((tag) => {
    const sr = document.querySelector(tag).shadowRoot;
    window.__demoText = [...sr.querySelectorAll('*')].filter((el) =>
      getComputedStyle(el).display !== 'none' && [...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim()));
    return window.__demoText.length;
  }, TAG);
  if (!textCount) return 'no text in the banner (nothing to wait for)';
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const report = [];
  for (let k = 0; k < textCount; k++) {
    const { result } = await cdp.send('Runtime.evaluate', { expression: `window.__demoText[${k}]` });
    const { nodeId } = await cdp.send('DOM.requestNode', { objectId: result.objectId });
    let fonts = [];
    for (const deadline = Date.now() + 10000; Date.now() < deadline;) {
      ({ fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }));
      if (fonts.length && fonts.every((f) => f.isCustomFont)) break;
      await page.waitForTimeout(100);
    }
    const desc = `${result.description}: ${fonts.map((f) => `${f.familyName}${f.isCustomFont ? ' (web font)' : ' (FALLBACK)'}`).join(', ')}`;
    if (!fonts.length || !fonts.every((f) => f.isCustomFont)) throw new Error('banner text not in its web font: ' + desc);
    report.push(desc);
  }
  await cdp.detach();
  return report.join('; ');
}

// Every box in the banner, in CSS px, plus the styles that decide how the art is drawn.
// .run's x is left out of the comparison (it is the marquee's phase), everything else must match.
function measure(page) {
  return page.evaluate((tag) => {
    const sr = document.querySelector(tag).shadowRoot;
    const visible = (el) => getComputedStyle(el).display !== 'none';
    const box = (el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 1000) / 1000); };
    const art = [...sr.querySelectorAll('img.art')].find(visible);
    const strip = [...sr.querySelectorAll('.run img')].find(visible);
    const sheets = sr.querySelectorAll('.sheet');
    const credit = sr.querySelector('.credit'); // the credit line (v1.8; later versions may drop it)
    const cs = getComputedStyle(art);
    return {
      frame: box(sr.querySelector('.frame')), art: box(art), credit: credit && box(credit),
      ticker: box(sr.querySelector('.ticker')), runY: box(sr.querySelector('.run'))[1], strip: box(strip).slice(1),
      zoom: [sheets[0].style.zoom, sheets[1].style.zoom], footWidth: sheets[1].style.width,
      artStyle: { width: cs.width, height: cs.height, imageRendering: cs.imageRendering, display: cs.display },
      artClass: art.className, naturalSize: [art.naturalWidth, art.naturalHeight],
      runAnimation: getComputedStyle(sr.querySelector('.run')).animation,
      creditFont: credit && getComputedStyle(credit).font,
    };
  }, TAG);
}

// Get the page ready for frame-by-frame capture: preload every art frame (decoded, held in
// memory so nothing flashes), and pause the marquee. Returns the marquee timing.
async function takeControl(page, artUrls) {
  return page.evaluate(async ({ tag, artUrls }) => {
    const sr = document.querySelector(tag).shadowRoot;
    const art = [...sr.querySelectorAll('img.art')].find((el) => getComputedStyle(el).display !== 'none');
    const strip = [...sr.querySelectorAll('.run img')].find((el) => getComputedStyle(el).display !== 'none');
    window.__demo = { art, preload: artUrls.map((u) => Object.assign(new Image(), { src: u })) };
    await Promise.all(window.__demo.preload.map((im) => im.decode()));
    const anims = sr.querySelector('.run').getAnimations();
    if (anims.length !== 1 || anims[0].animationName !== 'crawl') throw new Error('expected one "crawl" animation on .run, got ' + anims.map((a) => a.animationName));
    anims[0].pause();
    window.__demo.crawl = anims[0];
    const t = anims[0].effect.getTiming();
    return { naturalWidth: strip.naturalWidth, duration: t.duration, easing: t.easing, iterations: t.iterations };
  }, { tag: TAG, artUrls });
}

// Put the banner in its state for output frame i (t = i / FPS) and wait until it is painted.
function setFrame(page, artIndex, marqueeMs) {
  return page.evaluate(async ({ artIndex, marqueeMs }) => {
    const { art, preload, crawl } = window.__demo;
    if (art.src !== preload[artIndex].src) {
      art.src = preload[artIndex].src;
      await art.decode();
    }
    crawl.currentTime = marqueeMs;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, { artIndex, marqueeMs });
}

// --- one demo -------------------------------------------------------------------------------

async function record(demo, { extDir, origin, artDirs }) {
  const dir = path.join(FRAMES, `demo-${demo.name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const { context, userDataDir } = await launch(extDir, demo.device);
  try {
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto(`${origin}/${demo.page}?fakeNow=${FAKE_NOW}`, { waitUntil: 'load' });
    demo.fonts = await waitForBanner(page);

    // 1. The reference: an ordinary screenshot, nothing paused or swapped.
    const live = await measure(page);
    await page.screenshot({ path: path.join(dir, 'live.png') });

    // 2. Take over the two animations.
    const kind = live.artClass.includes('phone') ? 'phone' : 'desktop';
    const artUrls = Array.from({ length: ART_FRAMES }, (_, k) => `${origin}/art/${kind}/${String(k).padStart(3, '0')}.png`);
    const crawl = await takeControl(page, artUrls);
    // Seamless marquee loop: the strip repeats every naturalWidth banner px, so period
    // p = naturalWidth / 60 s, and the clip shows a whole number of passes n = round(12 / p) in
    // its 12 s, i.e. the marquee runs at n*p/12 times its real speed.
    const p = crawl.naturalWidth / MARQUEE_SPEED, n = Math.max(1, Math.round(SECONDS / p));
    if (Math.abs(crawl.duration - p * 1000) > 1) throw new Error(`crawl lasts ${crawl.duration} ms, expected ${p * 1000}`);
    const marqueeMs = (t) => (t / SECONDS) * n * p * 1000;
    const artIndex = (t) => (ART_START + Math.floor(t * 1000 / ART_MS + 1e-9)) % ART_FRAMES;

    // 3. Frames. Frame FRAME_COUNT (t = 12 s) is rendered as a check only: it must equal frame 0.
    for (let i = 0; i <= FRAME_COUNT; i++) {
      const t = i / FPS;
      await setFrame(page, artIndex(t), marqueeMs(t));
      if (i === 0) {
        const swapped = await measure(page);
        demo.layout = compareLayout(live, swapped);
      }
      await page.screenshot({ path: path.join(dir, i === FRAME_COUNT ? 'loop-check.png' : `f${String(i).padStart(4, '0')}.png`) });
      if (i % 60 === 0) log(`  ${demo.name}: frame ${i}/${FRAME_COUNT}`);
    }
    demo.marquee = { naturalWidth: crawl.naturalWidth, periodS: p, passes: n, speedFactor: (n * p) / SECONDS, easing: crawl.easing };
    demo.live = live;
    demo.dir = dir;
    demo.kind = kind;
  } finally {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

function compareLayout(a, b) {
  const diffs = [];
  for (const key of Object.keys(a)) {
    if (key === 'naturalSize') continue; // same pixel size by construction, checked below
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) diffs.push(`${key}: live ${JSON.stringify(a[key])} vs demo ${JSON.stringify(b[key])}`);
  }
  if (JSON.stringify(a.naturalSize) !== JSON.stringify(b.naturalSize)) diffs.push(`art natural size: live ${a.naturalSize} vs demo ${b.naturalSize}`);
  return diffs;
}

// Pixel checks, in device pixels: (a) frame 0 vs the t = 12 s frame (must be identical),
// (b) outside the banner, live vs frame 0 (must be identical: the page is untouched), (c) the
// credit line if there is one (static; must be identical), (d) the art box in the live shot against the art box
// in every recorded frame (the live shot is at some unknown phase; one frame must match it),
// (e) the ticker's frame strip above and below the moving text.
function pixelChecks(demo) {
  const dpr = DEVICES[demo.device].deviceScaleFactor;
  const rect = (r) => [r[0], r[1], r[0] + r[2], r[1] + r[3]].map((v) => Math.round(v * dpr));
  const L = demo.live;
  const args = JSON.stringify({
    dir: demo.dir, count: FRAME_COUNT, banner: rect(L.frame), art: rect(L.art), credit: L.credit && rect(L.credit),
    tickerTop: rect([L.ticker[0], L.ticker[1], L.ticker[2], L.runY - L.ticker[1]]),
  });
  return JSON.parse(execFileSync('python3', ['-I', '-c', `
import json, sys
import numpy as np
from PIL import Image
a = json.loads(sys.argv[1])
load = lambda n: np.asarray(Image.open(a['dir'] + '/' + n).convert('RGB')).astype(int)
live, f0, last = load('live.png'), load('f0000.png'), load('loop-check.png')
crop = lambda im, r: im[r[1]:r[3], r[0]:r[2]]
diff = lambda x, y: int((np.abs(x - y).sum(axis=2) > 0).sum())
out = {'loop_frame240_vs_frame0_px': diff(f0, last)}
mask = np.ones(live.shape[:2], bool); b = a['banner']; mask[b[1]:b[3], b[0]:b[2]] = False
out['outside_banner_live_vs_frame0_px'] = int(((np.abs(live - f0).sum(axis=2) > 0) & mask).sum())
if a['credit']:
    out['credit_live_vs_frame0_px'] = diff(crop(live, a['credit']), crop(f0, a['credit']))
out['ticker_strip_above_text_live_vs_frame0_px'] = diff(crop(live, a['tickerTop']), crop(f0, a['tickerTop']))
la = crop(live, a['art']); best = None
for i in range(a['count']):
    d = diff(la, crop(load('f%04d.png' % i), a['art']))
    if best is None or d < best[1]: best = (i, d)
    if d == 0: break
out['art_live_best_match'] = {'frame': best[0], 'differing_px': best[1], 'art_box_px': la.shape[1] * la.shape[0]}
out['size'] = [live.shape[1], live.shape[0]]
print(json.dumps(out))
`, args]).toString());
}

// --- GIF ------------------------------------------------------------------------------------

// One palette for the whole clip (stats from every frame), no dithering (pixel art; and
// undithered frames stay identical where nothing moved), and only the changed rectangle
// re-encoded per frame. Smaller palettes are the fallback if a GIF goes over 8 MB.
function makeGif(demo) {
  const gif = path.join(OUT, `${demo.name}.gif`);
  const palette = path.join(demo.dir, 'palette.png');
  const attempts = [];
  for (const colors of [256, 192, 128]) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(demo.dir, 'f%04d.png'),
      '-vf', `palettegen=max_colors=${colors}:stats_mode=full`, '-frames:v', '1', '-update', '1', palette]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(demo.dir, 'f%04d.png'), '-i', palette,
      '-lavfi', 'paletteuse=dither=none:diff_mode=rectangle', '-loop', '0', gif]);
    const size = fs.statSync(gif).size;
    attempts.push(`${colors} colours: ${mb(size)}`);
    if (size <= GIF_LIMIT) break;
  }
  demo.gifAttempts = attempts;
  return gif;
}

// --- main -----------------------------------------------------------------------------------

const only = process.argv[2];
const demos = DEMOS.filter((d) => !only || d.name.includes(only));
fs.mkdirSync(OUT, { recursive: true });
// One snapshot of src/ for the whole run (makeTestCopy adds only the fake clock), so every
// demo and the decoded art come from the same version of the extension.
const extDir = makeTestCopy(SRC);
const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
const srcHash = execFileSync('sh', ['-c', 'cd "$1" && find . -type f ! -name test-clock.js ! -name manifest.json | sort | xargs sha256sum | sha256sum | cut -c1-12', 'sh', SRC]).toString().trim();
log(`extension: ${manifest.name} ${manifest.version}, src/ snapshot ${srcHash} (sha256 of files other than manifest.json)`);
log('decoding the artwork');
const artDirs = Object.fromEntries([...new Set(demos.map((d) => d.device))].map((k) => [k, decodeArt(extDir, k)]));

// Serve the mock pages and the decoded art frames over http (the extension only runs on http/s).
const routes = {};
for (const p of ['news.html', 'shop.html']) routes[`/${p}`] = fs.readFileSync(path.join(MARKETING, 'store/mock', p), 'utf8');
for (const [kind, dir] of Object.entries(artDirs))
  for (const f of fs.readdirSync(dir)) routes[`/art/${kind}/${f}`] = { body: fs.readFileSync(path.join(dir, f)), type: 'image/png', headers: { 'cache-control': 'max-age=3600' } };
const { server, origin } = await serve(routes);

try {
  for (const demo of demos) { // serially: the machine is shared
    log(`recording ${demo.name}`);
    await record(demo, { extDir, origin, artDirs });
    const still = path.join(OUT, `${demo.name}.png`);
    fs.copyFileSync(path.join(demo.dir, 'f0000.png'), still);
    demo.pixels = pixelChecks(demo);
    const gif = makeGif(demo);
    log(`  fonts: ${demo.fonts}`);
    log(`  layout vs live: ${demo.layout.length ? demo.layout.join('; ') : 'identical'}`);
    log(`  pixels: ${JSON.stringify(demo.pixels)}`);
    log(`  marquee: ${JSON.stringify(demo.marquee)}`);
    log(`  still ${path.relative(MARKETING, still)} ${mb(fs.statSync(still).size)}; gif ${path.relative(MARKETING, gif)} (${demo.gifAttempts.join(', ')})`);
  }
} finally {
  server.close();
  fs.rmSync(extDir, { recursive: true, force: true });
}

const bad = demos.filter((d) => d.layout.length || d.pixels.loop_frame240_vs_frame0_px || d.pixels.outside_banner_live_vs_frame0_px || d.pixels.credit_live_vs_frame0_px || fs.statSync(path.join(OUT, `${d.name}.gif`)).size > GIF_LIMIT);
log(bad.length ? `CHECK FAILED: ${bad.map((d) => d.name).join(', ')}` : 'all checks passed');
process.exitCode = bad.length ? 1 : 0;
