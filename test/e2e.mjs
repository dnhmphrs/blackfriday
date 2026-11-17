// End-to-end checks of the extension in real Chromium: which day it shows on (in several time
// zones and across midnight), that it does nothing on other days, the banner's layout, and
// pages that try hard to break it. The clock is faked; see test/helpers.mjs.
//   npm install && npx playwright install chromium && npm test
import { launchWithExtension, serve, makeTestCopy, reloadExtension } from './helpers.mjs';

const EXT = makeTestCopy(new URL('../src', import.meta.url).pathname);
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? '  — ' + detail : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- test pages ----------
const filler = Array.from({ length: 60 }, (_, i) => `<p>Paragraph ${i} of ordinary page text that goes on for a while so the page scrolls.</p>`).join('');
const routes = {
  '/plain': `<!doctype html><html><head><title>plain</title></head><body><h1>Plain page</h1>
    <button id="right" style="position:fixed;top:40px;right:40px">right-side button</button>${filler}</body></html>`,
  '/hostile': `<!doctype html><html dir="rtl" lang="tr"><head><title>hostile</title><style>
    html { filter: invert(1) hue-rotate(90deg); font-size: 40px; line-height: 5; letter-spacing: 12px;
           text-transform: lowercase; word-spacing: 30px; text-indent: 80px; visibility: hidden; color: lime; zoom: 1; }
    body { transform: translateX(7px); visibility: visible; }
    html > * { opacity: 0.2 !important; width: 60px !important; max-height: 10px !important;
               transform: scale(0.3) !important; pointer-events: none !important; border: 9px solid lime !important; }
    * { margin: 3px !important; padding: 3px !important; }
    div, [popover] { display: none !important; position: static !important; background: lime !important; }
    #wall { display: block !important; position: fixed !important; inset: 0; z-index: 2147483647; background: rgba(0,255,0,.9) !important; }
    </style></head><body><h1>Hostile page</h1>${filler}
    <script>addEventListener('load', () => { const w = document.createElement('section'); w.id = 'wall'; document.body.append(w);
      setTimeout(() => document.body.append(Object.assign(document.createElement('section'), { id: 'wall' })), 300); });</script>
    </body></html>`,
  '/csp': {
    body: `<!doctype html><html><head><title>csp</title></head><body><h1>Strict CSP</h1>${filler}</body></html>`,
    headers: { 'Content-Security-Policy': "default-src 'none'; style-src 'self'; img-src 'self'; script-src 'none'; require-trusted-types-for 'script'; trusted-types 'none'" },
  },
  '/frames': `<!doctype html><html><head><title>frames</title></head><body><h1>Frames</h1>
    <iframe src="/plain" width="600" height="300"></iframe><iframe src="/plain" width="600" height="300"></iframe></body></html>`,
  '/fighter': `<!doctype html><html><head><title>fighter</title><script>
    window.removed = 0;
    new MutationObserver(() => { for (const c of [...document.documentElement.children]) if (c !== document.head && c !== document.body) { c.remove(); window.removed++; } })
      .observe(document.documentElement, { childList: true });
    </script></head><body><h1>Removes anything foreign under html</h1></body></html>`,
  '/dialog': `<!doctype html><html><head><title>dialog</title></head><body><h1>Dialog</h1><dialog id="d"><p>modal</p></dialog>
    <div id="pop" popover>site popover</div>${filler}</body></html>`,
  '/svg': { body: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="teal"/></svg>`, type: 'image/svg+xml' },
  '/xml': { body: `<?xml version="1.0"?><root><a>1</a></root>`, type: 'text/xml' },
  '/txt': { body: `just text`, type: 'text/plain' },
  '/json': { body: `{"a":1}`, type: 'application/json' },
  '/xhtml': { body: `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>x</title></head><body><h1>XHTML</h1></body></html>`, type: 'application/xhtml+xml' },
  '/frameset': `<!doctype html><html><head><title>fs</title></head><frameset cols="50%,50%"><frame src="/txt"><frame src="/txt"></frameset></html>`,
  '/headscript': `<!doctype html><html><head><title>hs</title><script>
    window.firstChildAtHead = document.documentElement.firstElementChild?.tagName;
    window.childrenAtHead = [...document.documentElement.children].map((c) => c.tagName).join(',');
    </script></head><body><h1>head script</h1></body></html>`,
};
const { server, origin } = await serve(routes);
// A page that streams: <head> now, <body> after 400ms, the rest after another 1500ms.
routes['/slow'] = (req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.write(`<!doctype html><html><head><title>slow</title></head>${' '.repeat(2048)}`);
  setTimeout(() => res.write(`<body><h1>Slow page</h1>${' '.repeat(2048)}`), 400);
  setTimeout(() => res.end(`<p>done</p></body></html>`), 1900);
};

// ---------- what the page shows (runs in the page) ----------
const probe = () => {
  const host = document.querySelector('thirty-off-everything');
  if (!host) return { present: false, count: 0 };
  const s = host.shadowRoot;
  const rect = (el) => { const r = el?.getBoundingClientRect(); return r && [r.x, r.y, r.width, r.height].map(Math.round); };
  const visible = (sel) => { const el = s.querySelector(sel); const r = el?.getBoundingClientRect(); return !!r && r.width > 0 && getComputedStyle(el).display !== 'none'; };
  let topLayer = null;
  try { topLayer = host.matches(':popover-open'); } catch {}
  const frame = s.querySelector('.frame');
  return {
    present: true,
    count: document.querySelectorAll('thirty-off-everything').length,
    parent: host.parentNode?.nodeName,
    topLayer,
    styled: frame && getComputedStyle(frame).overflow === 'hidden' && getComputedStyle(frame).backgroundColor === 'rgb(0, 51, 255)',
    frame: rect(frame),
    art: rect([...s.querySelectorAll('.art')].find((i) => getComputedStyle(i).display !== 'none')),
    ticker: rect(s.querySelector('.ticker')),
    credit: visible('.credit') && s.querySelector('.credit').textContent,
    images: [...s.querySelectorAll('img')].filter((i) => getComputedStyle(i).display !== 'none').map((i) => i.naturalWidth),
    fonts: [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'TOE Inter' && f.status === 'loaded').length,
    viewport: [document.documentElement.clientWidth, innerHeight],
    hitRight: document.elementFromPoint(innerWidth - 60, innerHeight / 2)?.nodeName,
    hitLeft: document.elementFromPoint(100, 200)?.nodeName,
  };
};
const BF = Date.parse('2026-11-27T12:00:00Z');       // Black Friday 2026, midday UTC
const ORDINARY = Date.parse('2026-06-10T12:00:00Z'); // a Wednesday in June
const url = (p, t) => `${origin}${p}${t === undefined ? '' : `?fakeNow=${t}`}`;

async function watchErrors(context, page) {
  const errs = [];
  const cdp = await context.newCDPSession(page);
  await cdp.send('Runtime.enable');
  cdp.on('Runtime.exceptionThrown', (e) => errs.push(e.exceptionDetails.exception?.description || e.exceptionDetails.text));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push('console.error: ' + m.text()); });
  return errs;
}

// =====================================================================================
console.log('\n# 1. Which local day does it show on?');
const cases = [
  ['Los Angeles Thu 26 Nov 20:00 (Thanksgiving evening)', 'America/Los_Angeles', '2026-11-26T20:00:00-08:00', false],
  ['Los Angeles Thu 26 Nov 23:59:50',                     'America/Los_Angeles', '2026-11-26T23:59:50-08:00', false],
  ['Los Angeles Fri 27 Nov 00:00:05',                     'America/Los_Angeles', '2026-11-27T00:00:05-08:00', true],
  ['Los Angeles Fri 27 Nov 18:00',                        'America/Los_Angeles', '2026-11-27T18:00:00-08:00', true],
  ['Los Angeles Fri 27 Nov 23:59:50',                     'America/Los_Angeles', '2026-11-27T23:59:50-08:00', true],
  ['Los Angeles Sat 28 Nov 00:00:05',                     'America/Los_Angeles', '2026-11-28T00:00:05-08:00', false],
  ['New York Fri 27 Nov 20:00',                           'America/New_York',    '2026-11-27T20:00:00-05:00', true],
  ['London Fri 27 Nov 12:00',                             'Europe/London',       '2026-11-27T12:00:00+00:00', true],
  ['Sydney Fri 27 Nov 09:00',                             'Australia/Sydney',    '2026-11-27T09:00:00+11:00', true],
  ['Sydney Sat 28 Nov 09:00',                             'Australia/Sydney',    '2026-11-28T09:00:00+11:00', false],
  ['Kiritimati Fri 27 Nov 00:30 (UTC+14)',                'Pacific/Kiritimati',  '2026-11-27T00:30:00+14:00', true],
  ['Pago Pago Thu 26 Nov 23:30 (UTC-11)',                 'Pacific/Pago_Pago',   '2026-11-26T23:30:00-11:00', false],
  ['Pago Pago Fri 27 Nov 23:30 (UTC-11)',                 'Pacific/Pago_Pago',   '2026-11-27T23:30:00-11:00', true],
];
const byTz = new Map();
for (const c of cases) byTz.set(c[1], [...(byTz.get(c[1]) || []), c]);
for (const [tz, list] of byTz) {
  const { context } = await launchWithExtension(EXT, { tz });
  const page = await context.newPage();
  for (const [label, , iso, expected] of list) {
    await page.goto(url('/plain', Date.parse(iso)));
    await sleep(200);
    const p = await page.evaluate(probe);
    check(label, p.present === expected, `banner ${p.present ? 'shown' : 'not shown'}`);
  }
  if (tz === 'America/Los_Angeles') {
    // Every day 2024-2040 at local noon, without reloading: move the clock and wake the script.
    await page.goto(url('/plain', ORDINARY));
    const sweep = await page.evaluate(() => {
      const shown = () => !!document.querySelector('thirty-off-everything');
      const at = (d) => { document.documentElement.dataset.fakeNow = String(d.getTime()); document.dispatchEvent(new Event('visibilitychange')); return shown(); };
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const blackFriday = (year) => { let n = 0; for (let day = 1; day <= 30; day++) { if (new Date(year, 10, day).getDay() === 4 && ++n === 4) return fmt(new Date(year, 10, day + 1)); } };
      const days = [], wrong = [];
      for (let year = 2024; year <= 2040; year++) {
        const expected = blackFriday(year);
        for (let d = new Date(year, 0, 1, 12); d.getFullYear() === year; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) {
          const on = at(d);
          if (on) days.push(fmt(d));
          if (on !== (fmt(d) === expected)) wrong.push(fmt(d));
        }
      }
      return { days, wrong };
    });
    check('2024-2040, day by day: shown on exactly one day a year, the right one', sweep.days.length === 17 && sweep.wrong.length === 0, `${sweep.days.length} days, ${sweep.wrong.length} wrong; 2026: ${sweep.days.find((d) => d.startsWith('2026'))}`);
  }
  await context.close();
}

// =====================================================================================
console.log('\n# 2. Tabs left open across midnight');
{
  const { context } = await launchWithExtension(EXT, { tz: 'America/Chicago' });
  const page = await context.newPage();
  await page.goto(url('/plain', Date.parse('2026-11-26T23:59:57.500-06:00')));
  await sleep(200);
  check('Thu 23:59:57: not shown yet', !(await page.evaluate(probe)).present);
  await sleep(4300);
  check('same tab, now Friday: shown without a reload', (await page.evaluate(probe)).present);
  await page.goto(url('/plain', Date.parse('2026-11-27T23:59:57.500-06:00')));
  await sleep(4500);
  check('same tab, now Saturday: gone without a reload', !(await page.evaluate(probe)).present);
  await context.close();
}

// =====================================================================================
console.log('\n# 3. Nothing at all on other days');
{
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const errs = await watchErrors(context, page);
  for (const [label, t] of [['an ordinary day', ORDINARY], ['the day before', Date.parse('2026-11-26T12:00:00Z')], ['the day after', Date.parse('2026-11-28T12:00:00Z')]]) {
    await page.goto(url('/plain', t)); await sleep(300);
    const touched = await page.evaluate(() => ({ el: document.querySelectorAll('thirty-off-everything').length, fonts: [...document.fonts].filter((f) => f.family.includes('TOE')).length }));
    check(`${label}: no element, no fonts added to the page`, touched.el === 0 && touched.fonts === 0, JSON.stringify(touched));
  }
  check('no errors on those days', errs.length === 0, errs.join(' | '));
  await context.close();
}

// =====================================================================================
console.log('\n# 4. The banner (Black Friday)');
{
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const errs = await watchErrors(context, page);
  await page.goto(url('/plain', BF)); await sleep(1200);
  const base = await page.evaluate(probe);
  const [vw, vh] = base.viewport;
  check('right-hand 30%, full height', Math.abs(base.frame[2] - vw * 0.3) <= 2 && base.frame[1] === 0 && base.frame[3] === vh && base.frame[0] + base.frame[2] === vw, JSON.stringify(base.frame));
  check('under <html>, in the top layer', base.parent === 'HTML' && base.topLayer === true);
  check('stylesheet, artwork, ticker and font loaded', base.styled && base.images.length === 3 && base.images.every((w) => w > 0) && base.fonts === 1, `${JSON.stringify(base.images)} font ${base.fonts}`);
  check('credit line reads "Brought to you by Gary Mustard Enterprises"', base.credit === 'Brought to you by Gary Mustard Enterprises', base.credit);
  check('the ticker sits on the bottom edge', base.ticker && Math.abs(base.ticker[1] + base.ticker[3] - (base.frame[1] + base.frame[3])) <= 1, JSON.stringify(base.ticker));
  check('blocks the right side, left side still clickable', base.hitRight === 'THIRTY-OFF-EVERYTHING' && base.hitLeft !== 'THIRTY-OFF-EVERYTHING', `${base.hitRight} / ${base.hitLeft}`);
  await page.mouse.move(400, 400); await page.mouse.wheel(0, 600); await sleep(200);
  const y1 = await page.evaluate(() => scrollY);
  await page.mouse.move(vw - 100, 400); await page.mouse.wheel(0, 600); await sleep(200);
  const y2 = await page.evaluate(() => scrollY);
  check('the mouse wheel over the banner still scrolls the page', y1 > 0 && y2 > y1, `${y1} -> ${y2}`);
  await page.emulateMedia({ media: 'print' });
  check('hidden when printing', await page.evaluate(() => getComputedStyle(document.querySelector('thirty-off-everything')).display === 'none'));
  await page.emulateMedia({ media: 'screen' });
  for (const [w, h] of [[1366, 650], [1920, 1080], [2560, 1300], [1024, 600], [960, 1050]]) {
    await page.setViewportSize({ width: w, height: h }); await sleep(400);
    const p = await page.evaluate(probe);
    const fits = p.art && p.art[0] >= p.frame[0] - 1 && p.art[0] + p.art[2] <= p.frame[0] + p.frame[2] + 1 && p.art[1] + p.art[3] <= p.ticker[1];
    check(`${w}x${h}: artwork inside the banner and above the ticker, ticker on the bottom edge`, fits && Math.abs(p.ticker[1] + p.ticker[3] - (p.frame[1] + p.frame[3])) <= 1, `${JSON.stringify(p.art)} ${JSON.stringify(p.ticker)}`);
  }
  for (const [w, h] of [[390, 844], [700, 900]]) {
    await page.setViewportSize({ width: w, height: h }); await sleep(400);
    const p = await page.evaluate(probe);
    check(`${w}x${h}: across the top third, full width, ticker on its bottom edge`, p.frame[0] === 0 && p.frame[1] === 0 && p.frame[2] === p.viewport[0] && Math.abs(p.frame[3] - p.viewport[1] * 0.33) <= 2 && Math.abs(p.ticker[1] + p.ticker[3] - (p.frame[1] + p.frame[3])) <= 1, JSON.stringify(p.frame));
  }
  await page.setViewportSize({ width: 1280, height: 800 });
  check('no errors', errs.length === 0, errs.join(' | '));
  await context.close();
}

// =====================================================================================
console.log('\n# 5. Hostile and unusual pages (Black Friday)');
{
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const errs = await watchErrors(context, page);
  await page.goto(url('/plain', BF)); await sleep(1000);
  const base = await page.evaluate(probe);

  await page.goto(url('/hostile', BF)); await sleep(1200);
  const h = await page.evaluate(probe);
  check('hostile CSS: same geometry as on a plain page', JSON.stringify(h.frame) === JSON.stringify(base.frame) && JSON.stringify(h.art) === JSON.stringify(base.art), `${JSON.stringify(h.frame)} ${JSON.stringify(h.art)}`);
  check('hostile CSS: above a maximum z-index wall added later', h.hitRight === 'THIRTY-OFF-EVERYTHING', h.hitRight);

  await page.goto(url('/csp', BF)); await sleep(1200);
  const cdp = await context.newCDPSession(page);
  const c = (await cdp.send('Runtime.evaluate', { expression: `(${probe})()`, returnByValue: true })).result.value;
  check('strict Content-Security-Policy: styled, pictures and font loaded', c.present && c.styled && c.images.every((w) => w > 0) && c.fonts === 1 && JSON.stringify(c.frame) === JSON.stringify(base.frame), `${JSON.stringify(c.images)} font ${c.fonts}`);

  await page.goto(url('/frames', BF)); await sleep(800);
  const inFrames = await Promise.all(page.frames().slice(1).map((f) => f.evaluate(() => document.querySelectorAll('thirty-off-everything').length)));
  check('iframes: only the top frame gets one', (await page.evaluate(probe)).count === 1 && inFrames.every((n) => n === 0), `frames: ${inFrames}`);

  await page.goto(url('/plain', BF)); await sleep(400);
  await page.evaluate(() => { document.body.innerHTML = '<h1>wiped</h1>'; }); await sleep(100);
  check('page wipes <body>: still there', (await page.evaluate(probe)).count === 1);
  await page.evaluate(() => document.documentElement.replaceChildren(document.head, document.body)); await sleep(100);
  let p = await page.evaluate(probe);
  check('page removes it: put back, in the top layer', p.count === 1 && p.topLayer === true);
  await page.evaluate(() => { document.open(); document.write('<!doctype html><title>x</title><h1>rewritten</h1>'); document.close(); }); await sleep(300);
  check('page rewrites the whole document: put back', (await page.evaluate(probe)).count === 1);

  await page.goto(url('/fighter', BF)); await sleep(700);
  const removed = await page.evaluate(() => window.removed);
  check('page that deletes it every time: gives up instead of looping', removed > 0 && removed < 40 && !(await page.evaluate(probe)).present, `removed ${removed} times`);

  await page.goto(url('/dialog', BF)); await sleep(300);
  await page.evaluate(() => { document.getElementById('d').showModal(); document.getElementById('pop').showPopover(); }); await sleep(150);
  check('site modal dialog and popover open: still one banner', (await page.evaluate(probe)).count === 1);

  await page.goto(url('/headscript', BF)); await sleep(300);
  const hs = await page.evaluate(() => window.childrenAtHead);
  check('scripts in <head> never see a foreign element', hs === 'HEAD', hs);

  for (const path of ['/svg', '/xml', '/txt', '/json', '/xhtml']) {
    await page.goto(url(path, BF)); await sleep(300);
  }
  check('SVG, XML, text, JSON and XHTML pages: no errors', errs.length === 0, errs.join(' | '));

  await page.goto(url('/plain', BF)); await sleep(200);
  await page.goto(url('/dialog', BF)); await sleep(200);
  await page.goBack(); await sleep(400);
  check('back button: exactly one', (await page.evaluate(probe)).count === 1);
  check('no errors on any of these pages', errs.length === 0, errs.join(' | '));
  await context.close();
}
{
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const nav = page.goto(url('/slow', BF));
  await sleep(1100);
  const mid = await page.evaluate(() => ({ state: document.readyState, shown: !!document.querySelector('thirty-off-everything') })).catch((e) => ({ err: e.message }));
  check('slow page: shown while the page is still loading', mid.state === 'loading' && mid.shown === true, JSON.stringify(mid));
  await nav;
  await context.close();
}

// =====================================================================================
console.log('\n# 6. The extension is updated while a tab shows the banner');
{
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const errs = await watchErrors(context, page);
  await page.goto(url('/plain', BF)); await sleep(500);
  check('shown before the update', (await page.evaluate(probe)).count === 1);
  await reloadExtension(context);
  await sleep(1500);
  await page.bringToFront();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await sleep(200);
  check('the cut-off banner removes itself', !(await page.evaluate(probe)).present);
  await page.reload(); await sleep(600);
  check('back after a reload, exactly one', (await page.evaluate(probe)).count === 1);
  check('no errors', errs.length === 0, errs.join(' | '));
  await context.close();
}

server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) { console.log('FAILED:\n' + failed.map((f) => ` - ${f.name}  ${f.detail}`).join('\n')); process.exit(1); }
