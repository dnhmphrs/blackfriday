// A smoke test of the extension in one browser: does the banner come up and look right on a
// handful of awkward pages, do its tickers show, is anything logged, how fast does a page run
// under it. Screenshots go to test/shots/smoke-<name>/.
//   node test/smoke.mjs [name] [path to a Chromium-based browser]     (default: Playwright's Chromium)
//   test/smoke-all.sh <folder of browsers>                             runs it in each and prints a table
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { launchWithExtension, serve, makeTestCopy } from './helpers.mjs';

const [name = 'chromium', browser] = process.argv.slice(2);
const EXT = makeTestCopy(process.env.BF_SRC || new URL('../src', import.meta.url).pathname); // BF_SRC: another copy of the extension to test
const shots = new URL(`./shots/smoke-${name}/`, import.meta.url).pathname;
fs.mkdirSync(shots, { recursive: true });
const results = [];
const check = (label, pass, detail = '') => { results.push({ label, pass: !!pass, detail }); console.log(`${pass ? '  ok  ' : ' FAIL '} ${label}${detail ? '  — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const filler = Array.from({ length: 60 }, (_, i) => `<p>Paragraph ${i} of ordinary page text that goes on for a while so the page scrolls.</p>`).join('');
const html = (attrs, head, body = `<h1>Page</h1>${filler}`) => `<!doctype html><html ${attrs}><head><meta charset="utf-8"><title>t</title>${head}</head><body>${body}</body></html>`;
const { server, origin } = await serve({
  '/plain': html('lang="en"', ''),
  '/rtl': html('dir="rtl" lang="ar"', '', `<h1>صفحة عربية</h1>${filler}`),
  '/turkish': html('lang="tr"', ''),
  '/quirks': `<html><head><title>quirks</title></head><body><h1>No doctype</h1>${filler}</body></html>`,
  '/zoomed': html('lang="en"', '<style>html { zoom: 0.6 } body { zoom: 1.4; font-size: 30px }</style>'),
  '/dark': html('lang="en"', '<meta name="color-scheme" content="dark"><style>:root { color-scheme: dark } * { color: #eee !important; background: #111 !important }</style>'),
  '/csp': { body: html('lang="en"', ''), headers: { 'Content-Security-Policy': "default-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'; sandbox allow-same-origin" } },
  '/layers': html('lang="en"', '', `<h1>Layers</h1><dialog id="d"><p>a modal dialog</p></dialog><div popover id="p">a popover</div>${filler}
    <script>addEventListener('load', () => setTimeout(() => { document.getElementById('p').showPopover?.(); }, 300));</script>`),
});
const BF = new Date(2026, 10, 27, 14).getTime(), ORDINARY = new Date(2026, 5, 10, 14).getTime();
const url = (p, t = BF) => `${origin}${p}?fakeNow=${t}`;

// what the page shows (runs in the page)
const probe = () => {
  const host = document.querySelector('thirty-off-everything'), s = host?.shadowRoot, frame = s?.querySelector('.frame');
  if (!frame) return { present: false };
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
  const covered = (sel) => { const box = r(s.querySelector(sel)), text = r(s.querySelector(sel + ' span')); return Math.max(0, Math.min(box.r, text.r) - Math.max(box.l, text.l)) / box.w; };
  const cs = getComputedStyle(frame);
  return {
    present: true, revealed: frame.classList.contains('in') && cs.visibility === 'visible' && cs.opacity === '1',
    frame: r(frame), vw: document.documentElement.clientWidth, vh: innerHeight, innerW: innerWidth,
    direction: getComputedStyle(s.querySelector('.tube')).direction,
    ticker: covered('.ticker'), crawl: covered('.crawl'),
    sub: s.querySelector('.strip.sub').innerText.trim(), tape: s.querySelector('.strip.tape').innerText.trim(),
    images: [...s.querySelectorAll('img')].filter((i) => !i.hidden).map((i) => i.naturalWidth),
    faces: [...document.fonts].filter((f) => f.family.replace(/"/g, '').startsWith('TOE') && f.status === 'loaded').length,
    filter: getComputedStyle(s.querySelector('.tube')).filter,
    topLayer: (() => { try { return host.matches(':popover-open'); } catch { return 'no popover'; } })(),
    hit: document.elementFromPoint(innerWidth - 40, innerHeight / 2)?.nodeName,
  };
};
// the banner's pixels: is it blue, is the yellow headline there, how grainy is the blue (the tape look)
// (counted in a blank page of a second browser: a page under test may forbid pictures of its own)
const counter = await chromium.launch(), lab = await counter.newPage();
async function pixels(page, clip) {
  const png = await page.screenshot({ clip });
  return lab.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height }), g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data; let blue = 0, yellow = 0, white = 0, n = d.length / 4, pairs = 0, rough = 0;
    const isBlue = (i) => d[i + 2] > 140 && d[i] < 110 && d[i + 1] < 130;
    for (let i = 0; i < d.length; i += 4) {
      const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
      if (isBlue(i)) { blue++; if ((i / 4) % c.width && isBlue(i - 4)) { pairs++; rough += Math.abs(R - d[i - 4]) + Math.abs(G - d[i - 3]) + Math.abs(B - d[i - 2]); } }
      if (R > 190 && G > 180 && B < 130) yellow++;
      if (R > 200 && G > 200 && B > 200) white++;
    }
    return { blue: blue / n, yellow: yellow / n, white: white / n, grain: pairs ? rough / pairs : 0 };
  }, png.toString('base64'));
}

console.log(`\n=== ${name} ===`);
let version = '?';
try {
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London', browser });
  version = context.browser()?.version() || '?';
  const page = await context.newPage();
  if (version === '?') version = await page.evaluate(() => navigator.userAgent.match(/(?:Edg|Chrome)\/[\d.]+/g).pop());
  console.log('version', version);
  const errors = [];
  const where = () => new URL(page.url()).pathname;
  page.on('pageerror', (e) => errors.push(`${where()}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(`${where()}: ${m.text()}`); });
  const revealed = () => page.waitForFunction(() => document.querySelector('thirty-off-everything')?.shadowRoot?.querySelector('.frame.in'), null, { timeout: 8000 }).catch(() => {});

  // ---- an ordinary day: nothing ----
  await page.goto(url('/plain', ORDINARY)); await sleep(800);
  check('ordinary day: nothing on the page', !(await page.evaluate(probe)).present);
  const fps = (ms) => page.evaluate((ms) => new Promise((res) => { let n = 0; const t0 = performance.now(); const tick = (t) => { n++; t - t0 < ms ? requestAnimationFrame(tick) : res(Math.round((n * 1000) / (t - t0))); }; requestAnimationFrame(tick); }), ms);
  const fpsOff = await fps(3000);

  // ---- Black Friday, desktop ----
  await page.goto(url('/plain')); await revealed(); await sleep(900);
  const p = await page.evaluate(probe);
  check('Black Friday: banner up and revealed', p.present && p.revealed, JSON.stringify({ revealed: p.revealed }));
  if (p.present) {
    check('covers the right 30%, full height', Math.abs(p.frame.w - p.vw * 0.3) <= 2 && p.frame.t === 0 && Math.abs(p.frame.h - p.vh) <= 1 && Math.abs(p.frame.r - p.vw) <= 1, JSON.stringify(p.frame));
    check('pictures and typefaces loaded', p.images.length === 6 && p.images.every((w) => w > 0) && p.faces === 4, `${JSON.stringify(p.images)} faces ${p.faces}`);
    check('tickers show across the banner', p.ticker > 0.9 && p.crawl > 0.9, `ticker ${p.ticker.toFixed(2)} crawl ${p.crawl.toFixed(2)}`);
    check('in the top layer (or, before Chrome 114, fixed above the page)', p.topLayer === true || p.topLayer === 'no popover', String(p.topLayer));
    check('blocks its part of the page', p.hit === 'THIRTY-OFF-EVERYTHING', p.hit);
    const clip = { x: Math.round(p.frame.l), y: 0, width: Math.round(p.frame.w), height: Math.round(p.frame.h) };
    const px = await pixels(page, clip);
    check('looks like the banner: blue ground, yellow lettering', px.blue > 0.35 && px.yellow > 0.04, JSON.stringify({ blue: +px.blue.toFixed(2), yellow: +px.yellow.toFixed(2) }));
    await page.screenshot({ path: shots + 'desktop.png' });
    // by now the banner has had time to see how fast the page draws, and to take the tape look off if it is slow
    await sleep(8000);
    const look = await page.evaluate(() => getComputedStyle(document.querySelector('thirty-off-everything').shadowRoot.querySelector('.tube')).filter);
    const fpsOn = await fps(3000);
    check('page still runs smoothly under the banner', fpsOn >= Math.min(24, fpsOff * 0.5), `${fpsOn} frames a second with the banner (tape look ${look === 'none' ? 'taken off' : 'on'}), ${fpsOff} without; software rendering here`);
    await page.screenshot({ path: shots + 'desktop-settled.png' });
    // the tape look, as the banner came in: grain on the blue that is not there with the filter off
    const kept = await page.evaluate(() => { const t = document.querySelector('thirty-off-everything').shadowRoot.querySelector('.tube'), was = t.style.filter; t.style.filter = 'none'; return was; });
    await sleep(400);
    const clean = await pixels(page, clip);
    await page.evaluate((was) => { document.querySelector('thirty-off-everything').shadowRoot.querySelector('.tube').style.filter = was; }, kept);
    check('comes in with the tape look', p.filter.includes('tape') && px.grain > clean.grain * 1.5 + 1, `${p.filter}; grain ${px.grain.toFixed(1)} with, ${clean.grain.toFixed(1)} without`);
    await page.mouse.move(300, 400); await page.mouse.wheel(0, 900); await sleep(300);
    check('page scrolls', (await page.evaluate(() => scrollY)) > 0);
  }

  // ---- awkward pages ----
  for (const [route, label] of [['/rtl', 'right-to-left page'], ['/turkish', 'Turkish page'], ['/quirks', 'page without a doctype'], ['/zoomed', 'page that zooms itself'],
                                ['/dark', 'dark page'], ['/csp', 'strictest content policy, sandboxed'], ['/layers', 'page with its own popover']]) {
    await page.goto(url(route)); await sleep(2600);
    const q = await page.evaluate(probe).catch((e) => ({ present: false, err: e.message }));
    const { width: W, height: H } = page.viewportSize();
    const on = await pixels(page, { x: Math.round(W * 0.72), y: 0, width: Math.round(W * 0.26), height: H }).catch(() => ({ blue: 0 }));
    const off = await pixels(page, { x: Math.round(W * 0.5), y: 0, width: Math.round(W * 0.18), height: H }).catch(() => ({ blue: 1 }));
    const ok = q.present && q.revealed && q.images.every((w) => w > 0) && q.ticker > 0.9 && q.crawl > 0.9
      && q.direction === 'ltr' && q.sub === 'BROUGHT TO YOU BY GARY MUSTARD ENTERPRISES' && q.tape === 'EVERY SITE 30% OFF!'
      && on.blue > 0.35 && off.blue < 0.02;
    check(label, ok, q.present ? JSON.stringify({ revealed: q.revealed, ticker: +q.ticker.toFixed(2), crawl: +q.crawl.toFixed(2), direction: q.direction, sub: q.sub, blueOnBanner: +on.blue.toFixed(2), blueBesideIt: +off.blue.toFixed(2), images: q.images.length }) : `no banner ${q.err || ''}`);
    await page.screenshot({ path: `${shots}${route.slice(1)}.png` });
  }

  // ---- reduced motion, forced colours, a phone-width window ----
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url('/plain')); await sleep(2600);
  const still = await page.evaluate(() => { const s = document.querySelector('thirty-off-everything')?.shadowRoot; return s ? { globe: s.querySelector('.globe').src.includes('globe-still'), moving: s.getAnimations().filter((a) => a.playState === 'running').length } : null; });
  check('reduced motion: a still banner', still && still.globe && still.moving === 0, JSON.stringify(still));
  await page.emulateMedia({ reducedMotion: null });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url('/plain')); await sleep(2600);
  const n = await page.evaluate(probe);
  check('narrow window: across the top third', n.present && n.revealed && n.frame.l === 0 && Math.abs(n.frame.w - n.vw) <= 1 && Math.abs(n.frame.h - n.vh * 0.33) <= 2 && n.crawl > 0.9, n.present ? JSON.stringify(n.frame) : 'no banner');
  await page.screenshot({ path: shots + 'narrow.png' });
  const ours = errors.filter((e) => !(e.startsWith('/layers') && e.includes("Found a 'popover' attribute"))); // that page's own popover, in Chrome 113
  check('nothing logged as an error', ours.length === 0, ours.slice(0, 3).join(' | '));
  await context.close();

  // ---- a high-density screen ----
  for (const dsf of [1.5, 2]) {
    const { context: c2 } = await launchWithExtension(EXT, { tz: 'Europe/London', browser, deviceScaleFactor: dsf });
    const pg = await c2.newPage();
    await pg.goto(url('/plain')); await sleep(3000);
    const d = await pg.evaluate(probe);
    check(`screen density ${dsf}: banner up, in place`, d.present && d.revealed && Math.abs(d.frame.w - d.vw * 0.3) <= 2 && d.ticker > 0.9, d.present ? JSON.stringify({ w: Math.round(d.frame.w), of: d.vw }) : 'no banner');
    if (dsf === 2) await pg.screenshot({ path: shots + 'dense.png' });
    await c2.close();
  }
} catch (e) {
  check('ran to the end', false, e.message.split('\n')[0]);
}
server.close(); await counter.close();
const failed = results.filter((r) => !r.pass);
console.log(`${name} (${version}): ${results.length - failed.length}/${results.length} passed${failed.length ? '  FAILED: ' + failed.map((f) => f.label).join('; ') : ''}`);
fs.writeFileSync(path.join(shots, 'result.json'), JSON.stringify({ name, version, results }, null, 1));
process.exit(failed.length ? 1 : 0);
