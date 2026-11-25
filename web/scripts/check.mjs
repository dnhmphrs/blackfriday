// Opens dist/ in Chromium at several window sizes, in each mode, and checks: no scrolling, no console
// or page errors, WebGL on, and the clock's digits right for ?now=. Saves screenshots to screenshots/.
//   npm run build && npm run check            (Playwright comes from the repository root's node_modules)
//   npm run check -- --quick                  (two sizes only)
process.env.TZ = 'America/New_York'; // the browser runs in the same zone (timezoneId below)
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
import { serve } from './serve.mjs';

const { chromium } = createRequire(new URL('../../package.json', import.meta.url))('playwright');
const QUICK = process.argv.includes('--quick');
const OUT = 'screenshots';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const SIZES = [[1440, 900, 1], [1280, 800, 1], [1366, 650, 1], [1920, 1080, 1], [390, 844, 2], [844, 390, 2], [768, 1024, 1]]
  .filter((_, i) => !QUICK || i === 0 || i === 4);
// what the clock must read the moment the page opens (s), and its heading
const DATES = {
  before: { now: '2026-11-20T12:00', left: 6 * 86400 + 12 * 3600, units: 4, label: 'STARTS IN' },
  today: { now: '2026-11-27T14:00', left: 10 * 3600, units: 3, label: 'ENDS IN' },
  after: { now: '2026-11-28T10:00', left: 362 * 86400 + 14 * 3600, units: 4, label: 'STARTS IN' },
};
const RUNS = [
  ...SIZES.flatMap(([w, h, d]) => ['before', 'today'].map((m) => ({ w, h, d, m }))),
  ...SIZES.filter(([w]) => w === 1440 || w === 390).map(([w, h, d]) => ({ w, h, d, m: 'after' })),
  ...SIZES.filter(([w]) => w === 1440 || w === 390 || w === 844).flatMap(([w, h, d]) => ['before', 'today'].map((m) => ({ w, h, d, m, still: true }))),
];

const server = await serve('dist', 0, { quiet: true });
const browser = await chromium.launch();
let failures = 0;
const fail = (what) => { failures++; console.log(`  FAIL ${what}`); };

async function open({ w, h, d, still = false }, url) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, timezoneId: 'America/New_York',
                                         reducedMotion: still ? 'reduce' : 'no-preference', isMobile: w < 900 && d > 1, hasTouch: w < 900 && d > 1 });
  const page = await ctx.newPage(), errors = [];
  // (the software GL driver's own performance notes, while screenshots read the canvas back, are not the page's)
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message/.test(m.text())) errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  page.on('request', (r) => { if (!r.url().startsWith(server.url) && !r.url().startsWith('data:') && !r.url().startsWith('file:')) errors.push(`external request: ${r.url()}`); });
  await page.goto(url);
  await page.waitForFunction(() => window.__bf && window.__bf.ready, null, { timeout: 15000 });
  return { ctx, page, errors };
}
const read = (page) => page.evaluate(() => {
  const units = [...document.querySelectorAll('.clock .u')].map((u) => [...u.querySelectorAll('em > .up > b')].map((b) => b.textContent).join(''));
  const de = document.documentElement;
  return { units, label: document.querySelector('.clock .lbl').textContent, now: window.__bf.now(), gl: window.__bf.gl, mode: window.__bf.mode,
           tape: window.__bf.tape, scroll: [de.scrollWidth, de.scrollHeight, document.body.scrollWidth, document.body.scrollHeight, innerWidth, innerHeight] };
});
const secondsOf = (units) => {
  const v = units.map(Number);
  return v.length === 4 ? v[0] * 86400 + v[1] * 3600 + v[2] * 60 + v[3] : v[0] * 3600 + v[1] * 60 + v[2];
};
function verify(r, spec, forced, name) {
  const [sw, sh, bw, bh, iw, ih] = r.scroll;
  if (sw !== iw || sh !== ih || bw > iw || bh > ih) fail(`${name}: scrolls (${r.scroll.join(' ')})`);
  if (!r.gl) fail(`${name}: no WebGL`);
  if (r.units.length !== spec.units) fail(`${name}: ${r.units.length} units, wanted ${spec.units}`);
  if (r.label !== spec.label) fail(`${name}: label ${r.label}, wanted ${spec.label}`);
  const want = spec.left - (r.now - forced) / 1000, got = secondsOf(r.units);
  if (Math.abs(got - want) > 1.01) fail(`${name}: clock ${r.units.join(':')} = ${got}s, wanted ~${want.toFixed(1)}s`);
  return `${r.units.join(':')} (${r.label}, ${r.mode})`;
}

for (const run of RUNS) {
  const spec = DATES[run.m], name = `${run.w}x${run.h}-${run.m}${run.still ? '-still' : ''}`;
  const forced = new Date(spec.now).getTime();
  const { ctx, page, errors } = await open(run, `${server.url}?now=${spec.now}&keep`);
  await page.waitForTimeout(run.still ? 600 : 1800);
  const r = await read(page);
  const clock = verify(r, spec, forced, name);
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 60 });
  if (run.m === 'today' && !run.still && run.w === 1440) { // a second frame, off the beat
    await page.waitForTimeout(130);
    await page.screenshot({ path: `${OUT}/${name}-b.jpg`, type: 'jpeg', quality: 60 });
  }
  errors.forEach((e) => fail(`${name}: ${e}`));
  console.log(`${errors.length ? 'FAIL' : 'ok  '} ${name.padEnd(26)} ${clock}  tape:${r.tape}`);
  await ctx.close();
}

// the live switch: a few seconds before the day starts, and before it ends
for (const [from, to, label] of [['2026-11-26T23:59:58', 'today', 'ENDS IN'], ['2026-11-27T23:59:58', 'after', 'STARTS IN']]) {
  const { ctx, page, errors } = await open({ w: 1280, h: 800, d: 1 }, `${server.url}?now=${from}`);
  await page.waitForTimeout(3200);
  const r = await read(page);
  const ok = r.mode === to && r.label === label;
  if (!ok) fail(`switch from ${from}: mode ${r.mode}, label ${r.label}`);
  errors.forEach((e) => fail(`switch ${from}: ${e}`));
  console.log(`${ok && !errors.length ? 'ok  ' : 'FAIL'} switch from ${from} -> ${r.mode} ${r.units.join(':')} (tape filter kept on this machine: ${r.tape})`);
  await ctx.close();
}

// no WebGL: still a page
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return /webgl/.test(t) ? null : get.call(this, t, o); }; });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${server.url}?now=2026-11-27T14:00`);
  await page.waitForFunction(() => window.__bf && window.__bf.ready);
  const r = await read(page);
  if (r.gl || errors.length) fail(`no-WebGL fallback: gl ${r.gl}, ${errors.join('; ')}`);
  await page.screenshot({ path: `${OUT}/1280x800-today-nowebgl.jpg`, type: 'jpeg', quality: 60 });
  console.log(`${!r.gl && !errors.length ? 'ok  ' : 'FAIL'} no WebGL: ${r.units.join(':')}`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
