// End-to-end checks of the extension in real Chromium: which day it shows on (in several
// time zones), the toolbar button, and pages that try hard to break it.
//   npm install && npx playwright install chromium && npm test
import { launchWithExtension, serve, makeTestCopy, clickAction } from './helpers.mjs';
import fs from 'node:fs';

const SRC = process.argv[2] || new URL('../src', import.meta.url).pathname;
const EXT = makeTestCopy(SRC);
const SHOTS = new URL('./shots/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });

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
// A page that streams: <head> now, <body> start after 400ms, the rest after another 1500ms.
routes['/slow'] = (req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.write(`<!doctype html><html><head><title>slow</title></head>${' '.repeat(2048)}`);
  setTimeout(() => res.write(`<body><h1>Slow page</h1>${' '.repeat(2048)}`), 400);
  setTimeout(() => res.end(`<p>done</p></body></html>`), 1900);
};

// ---------- in-page probes (run in the page's main world) ----------
const probe = () => {
  const host = document.querySelector('thirty-off-overlay');
  if (!host) return { present: false, count: 0 };
  const panel = host.shadowRoot?.querySelector('.overlay-container');
  const hr = host.getBoundingClientRect();
  const pr = panel?.getBoundingClientRect();
  const cs = panel && getComputedStyle(panel);
  const l1 = host.shadowRoot?.querySelector('.line1');
  const l3 = host.shadowRoot?.querySelector('.line3');
  let topLayer = null;
  try { topLayer = host.matches(':popover-open'); } catch {}
  return {
    present: true,
    count: document.querySelectorAll('thirty-off-overlay').length,
    parent: host.parentNode?.nodeName,
    topLayer,
    hostRect: [hr.x, hr.y, hr.width, hr.height].map(Math.round),
    panelRect: pr && [pr.x, pr.y, pr.width, pr.height].map(Math.round),
    viewport: [document.documentElement.clientWidth, innerWidth, innerHeight],
    bg: cs?.backgroundColor,
    hostDisplay: getComputedStyle(host).display,
    line1: l1 && { h: Math.round(l1.getBoundingClientRect().height), w: Math.round(l1.getBoundingClientRect().width),
      fs: getComputedStyle(l1).fontSize, ls: getComputedStyle(l1).letterSpacing, tt: getComputedStyle(l1).textTransform, dir: getComputedStyle(l1).direction },
    line3: l3 && { h: Math.round(l3.getBoundingClientRect().height), lh: getComputedStyle(l3).lineHeight, text: l3.textContent, vis: getComputedStyle(l3).visibility },
    hitRight: (() => { const e = document.elementFromPoint(innerWidth - 60, 200); return e?.nodeName; })(),
    hitLeft: (() => { const e = document.elementFromPoint(100, 200); return e?.nodeName; })(),
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
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console.error: ' + m.text()); });
  return errs;
}

// =====================================================================================
console.log('\n# 1. Which local day does it show on?');
const cases = [
  ['Los Angeles Thu 26 Nov 20:00 (Thanksgiving evening)', 'America/Los_Angeles', '2026-11-26T20:00:00-08:00', false],
  ['Los Angeles Thu 26 Nov 23:59:50',                     'America/Los_Angeles', '2026-11-26T23:59:50-08:00', false],
  ['Los Angeles Fri 27 Nov 00:00:05',                     'America/Los_Angeles', '2026-11-27T00:00:05-08:00', true],
  ['Los Angeles Fri 27 Nov 10:00',                        'America/Los_Angeles', '2026-11-27T10:00:00-08:00', true],
  ['Los Angeles Fri 27 Nov 18:00',                        'America/Los_Angeles', '2026-11-27T18:00:00-08:00', true],
  ['Los Angeles Fri 27 Nov 23:59:50',                     'America/Los_Angeles', '2026-11-27T23:59:50-08:00', true],
  ['Los Angeles Sat 28 Nov 00:00:05',                     'America/Los_Angeles', '2026-11-28T00:00:05-08:00', false],
  ['New York Fri 27 Nov 20:00',                           'America/New_York',    '2026-11-27T20:00:00-05:00', true],
  ['London Fri 27 Nov 12:00',                             'Europe/London',       '2026-11-27T12:00:00+00:00', true],
  ['Sydney Fri 27 Nov 09:00',                             'Australia/Sydney',    '2026-11-27T09:00:00+11:00', true],
  ['Sydney Sat 28 Nov 09:00',                             'Australia/Sydney',    '2026-11-28T09:00:00+11:00', false],
  ['Kolkata Fri 27 Nov 04:00 (UTC+5:30)',                 'Asia/Kolkata',        '2026-11-27T04:00:00+05:30', true],
  ['Kiritimati Fri 27 Nov 00:30 (UTC+14)',                'Pacific/Kiritimati',  '2026-11-27T00:30:00+14:00', true],
  ['Kiritimati Sat 28 Nov 00:30 (UTC+14)',                'Pacific/Kiritimati',  '2026-11-28T00:30:00+14:00', false],
  ['Pago Pago Fri 27 Nov 23:30 (UTC-11)',                 'Pacific/Pago_Pago',   '2026-11-27T23:30:00-11:00', true],
  ['Pago Pago Thu 26 Nov 23:30 (UTC-11)',                 'Pacific/Pago_Pago',   '2026-11-26T23:30:00-11:00', false],
];
const byTz = new Map();
for (const c of cases) byTz.set(c[1], [...(byTz.get(c[1]) || []), c]);
for (const [tz, list] of byTz) {
  const { context } = await launchWithExtension(EXT, { tz });
  const page = await context.newPage();
  for (const [label, , iso, expected] of list) {
    await page.goto(url('/plain', Date.parse(iso)));
    await sleep(150);
    const p = await page.evaluate(probe);
    check(label, p.present === expected, `overlay ${p.present ? 'shown' : 'not shown'}`);
  }

  // Every day 2024-2040 at local noon, plus the two midnight edges of each Black Friday,
  // without reloading: change the fake clock and fire the event the script re-checks on.
  if (tz === 'America/Los_Angeles' || tz === 'Australia/Sydney') {
    await page.goto(url('/plain', ORDINARY));
    const sweep = await page.evaluate(() => {
      const shown = () => !!document.querySelector('thirty-off-overlay');
      const at = (d) => { document.documentElement.dataset.fakeNow = String(d.getTime()); document.dispatchEvent(new Event('visibilitychange')); return shown(); };
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      // Independent definition: walk November to its fourth Thursday, add a day.
      const blackFriday = (year) => { let n = 0; for (let day = 1; day <= 30; day++) { if (new Date(year, 10, day).getDay() === 4 && ++n === 4) return fmt(new Date(year, 10, day + 1)); } };
      const days = [], wrong = [], edgesWrong = [];
      for (let year = 2024; year <= 2040; year++) {
        const expected = blackFriday(year);
        for (let d = new Date(year, 0, 1, 12); d.getFullYear() === year; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) {
          const on = at(d);
          if (on) days.push(fmt(d));
          if (on !== (fmt(d) === expected)) wrong.push(fmt(d));
        }
        const [y, m, dd] = expected.split('-').map(Number);
        const edges = [[new Date(y, m - 1, dd, 0, 0, 0, 0), true], [new Date(y, m - 1, dd, 23, 59, 59, 999), true],
                       [new Date(y, m - 1, dd - 1, 23, 59, 59, 999), false], [new Date(y, m - 1, dd + 1, 0, 0, 0, 0), false]];
        for (const [d, want] of edges) if (at(d) !== want) edgesWrong.push(d.toString());
      }
      return { days, wrong, edgesWrong };
    });
    const original = ['2024-11-29', '2025-11-28', '2026-11-27', '2027-11-26', '2028-11-24', '2029-11-23', '2030-11-29', '2031-11-28', '2032-11-26', '2033-11-25'];
    check(`${tz}: 2024-2040 day-by-day sweep, one day per year`, sweep.days.length === 17 && sweep.wrong.length === 0, `shown on ${sweep.days.length} days, ${sweep.wrong.length} wrong`);
    check(`${tz}: midnight edges of every Black Friday`, sweep.edgesWrong.length === 0, sweep.edgesWrong.slice(0, 3).join(' | '));
    check(`${tz}: matches the original hand-written 2024-2033 list`, JSON.stringify(sweep.days.slice(0, 10)) === JSON.stringify(original), sweep.days.slice(0, 10).join(' '));
  }
  await context.close();
}

// =====================================================================================
console.log('\n# 2. Tabs left open across midnight (timer path, no events fired)');
{
  const { context } = await launchWithExtension(EXT, { tz: 'America/Chicago' });
  const page = await context.newPage();
  await page.goto(url('/plain', Date.parse('2026-11-26T23:59:57.500-06:00')));
  await sleep(200);
  check('Thu 23:59:57 - not shown yet', !(await page.evaluate(probe)).present);
  await sleep(4300);
  check('same tab ~4s later, now Friday - shown without reload', (await page.evaluate(probe)).present);
  await page.goto(url('/plain', Date.parse('2026-11-27T23:59:57.500-06:00')));
  await sleep(200);
  check('Fri 23:59:57 - shown', (await page.evaluate(probe)).present);
  await sleep(4300);
  check('same tab ~4s later, now Saturday - gone without reload', !(await page.evaluate(probe)).present);
  await context.close();
}

// =====================================================================================
console.log('\n# 3. Toolbar button: nothing until Black Friday');
{
  const { context, sw, extensionId } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  await sw.evaluate(() => { self.__errs = []; self.addEventListener('unhandledrejection', (e) => self.__errs.push(String(e.reason))); self.addEventListener('error', (e) => self.__errs.push(String(e.message))); });
  const manifest = await sw.evaluate(() => chrome.runtime.getManifest());
  check('asks for no permissions', !manifest.permissions?.length && !manifest.host_permissions?.length, JSON.stringify(manifest.permissions));
  const page = await context.newPage();
  const errs = await watchErrors(context, page);
  await page.goto(url('/plain', ORDINARY));
  await sleep(150);
  check('ordinary day: nothing shown on load', !(await page.evaluate(probe)).present);
  for (const n of [1, 2, 3]) {
    await clickAction(context, page, extensionId); await sleep(400);
    check(`ordinary day: click ${n} does nothing`, !(await page.evaluate(probe)).present);
  }
  for (const [label, iso] of [['the day before', '2026-11-26T12:00:00Z'], ['the day after', '2026-11-28T12:00:00Z']]) {
    await page.goto(url('/plain', Date.parse(iso))); await sleep(150);
    await clickAction(context, page, extensionId); await sleep(400);
    check(`${label}: click does nothing`, !(await page.evaluate(probe)).present);
  }

  await page.goto(url('/plain', BF)); await sleep(150);
  check('Black Friday: shown on load', (await page.evaluate(probe)).present);
  await clickAction(context, page, extensionId); await sleep(400);
  check('Black Friday: click hides it on this tab', !(await page.evaluate(probe)).present);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await sleep(100);
  check('Black Friday: stays hidden when the tab regains focus', !(await page.evaluate(probe)).present);
  await clickAction(context, page, extensionId); await sleep(400);
  check('Black Friday: click brings it back', (await page.evaluate(probe)).count === 1);
  await clickAction(context, page, extensionId); await sleep(400);
  await page.evaluate((t) => { document.documentElement.dataset.fakeNow = String(t); document.dispatchEvent(new Event('visibilitychange')); }, Date.parse('2026-11-28T12:00:00Z')); await sleep(100);
  await clickAction(context, page, extensionId); await sleep(400);
  check('hidden on Black Friday, then Saturday: a click still does nothing', !(await page.evaluate(probe)).present);

  // Tabs with no content script: Chrome's own pages, and tabs open since before install.
  const restricted = await context.newPage();
  await restricted.goto('chrome://version/');
  await clickAction(context, restricted, extensionId).catch((e) => check('click on chrome:// page could be triggered', false, e.message));
  const old = await context.newPage();
  await old.goto(url('/plain', BF) + '&preinstall=1'); await sleep(200);
  await clickAction(context, old, extensionId); await sleep(400);
  check('tab open since before install: click does nothing', !(await old.evaluate(probe)).present);
  const swErrs = await sw.evaluate(() => self.__errs).catch(() => ['worker restarted']);
  check('clicks on tabs without the script: no error in the worker', swErrs.length === 0, swErrs.join(' | '));
  check('no content-script errors so far', errs.length === 0, errs.join(' | '));
  await context.close();
}
{
  // The extension is updated (reloaded) while a tab is showing the overlay. The copy of the
  // content script in that tab is cut off from the extension from then on.
  const { context, sw } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const errs = await watchErrors(context, page);
  await page.goto(url('/plain', BF)); await sleep(200);
  check('update: shown before the update', (await page.evaluate(probe)).count === 1);
  await sw.evaluate(() => chrome.runtime.reload()).catch(() => {});
  await sleep(1500);
  const fresh = await context.newPage();
  await fresh.goto(url('/plain', BF)); await sleep(300);
  check('update: tabs opened after the update work normally', (await fresh.evaluate(probe)).count === 1);
  await fresh.close();
  await page.bringToFront();
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await sleep(200);
  check('update: cut-off overlay removes itself', !(await page.evaluate(probe)).present);
  await page.reload(); await sleep(300);
  check('update: back after a reload, exactly one', (await page.evaluate(probe)).count === 1);
  check('update: no errors', errs.length === 0, errs.join(' | '));
  await context.close();
}

// =====================================================================================
console.log('\n# 4. Hostile and unusual pages (Black Friday)');
{
  const { context, extensionId } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const errs = await watchErrors(context, page);

  await page.goto(url('/plain', BF)); await sleep(250);
  const base = await page.evaluate(probe);
  await page.screenshot({ path: SHOTS + 'plain.png' });
  const vw = base.viewport[0];
  check('plain: panel is the right-hand 30%, full height', Math.abs(base.panelRect[2] - Math.round(vw * 0.3)) <= 1 && base.panelRect[1] === 0 && base.panelRect[3] === 800 && base.panelRect[0] + base.panelRect[2] === vw, JSON.stringify(base.panelRect) + ' of ' + JSON.stringify(base.viewport));
  check('plain: mounted under <html>, in the top layer', base.parent === 'HTML' && base.topLayer === true);
  check('plain: panel blocks the right side, left side still clickable', base.hitRight === 'THIRTY-OFF-OVERLAY' && base.hitLeft !== 'THIRTY-OFF-OVERLAY', `${base.hitRight} / ${base.hitLeft}`);
  await page.mouse.move(400, 400); await page.mouse.wheel(0, 600); await sleep(150);
  const y1 = await page.evaluate(() => scrollY);
  await page.mouse.move(vw - 100, 400); await page.mouse.wheel(0, 600); await sleep(150);
  const y2 = await page.evaluate(() => scrollY);
  check('plain: mouse wheel over the panel still scrolls the page', y1 > 0 && y2 > y1, `${y1} -> ${y2}`);
  check('plain: panel does not scroll away', (await page.evaluate(probe)).panelRect[1] === 0);
  await page.emulateMedia({ media: 'print' });
  check('plain: hidden when printing', (await page.evaluate(probe)).hostDisplay === 'none');
  await page.emulateMedia({ media: 'screen' });

  await page.goto(url('/hostile', BF)); await sleep(900);
  const h = await page.evaluate(probe);
  await page.screenshot({ path: SHOTS + 'hostile.png' });
  check('hostile CSS: same geometry as on a plain page', JSON.stringify(h.panelRect) === JSON.stringify(base.panelRect), JSON.stringify(h.panelRect));
  check('hostile CSS: same type metrics as on a plain page', JSON.stringify(h.line1) === JSON.stringify(base.line1) && JSON.stringify(h.line3) === JSON.stringify(base.line3), JSON.stringify(h.line1) + ' ' + JSON.stringify(h.line3));
  check('hostile CSS: above a max z-index wall added later', h.hitRight === 'THIRTY-OFF-OVERLAY', h.hitRight);

  await page.goto(url('/csp', BF)); await sleep(250);
  const c = await page.evaluate(probe).catch(() => null);
  const cspProbe = c || await (await context.newCDPSession(page)).send('Runtime.evaluate', { expression: `(${probe})()`, returnByValue: true }).then((r) => r.result.value).catch((e) => ({ present: false, err: e.message }));
  await page.screenshot({ path: SHOTS + 'csp.png' });
  check('strict CSP + Trusted Types: rendered and styled', cspProbe.present && cspProbe.bg === 'rgb(0, 0, 255)' && JSON.stringify(cspProbe.panelRect) === JSON.stringify(base.panelRect), JSON.stringify(cspProbe.panelRect) + ' ' + cspProbe.bg);

  await page.goto(url('/frames', BF)); await sleep(500);
  const inFrames = await Promise.all(page.frames().slice(1).map((f) => f.evaluate(() => document.querySelectorAll('thirty-off-overlay').length)));
  check('iframes: only the top frame gets one', (await page.evaluate(probe)).count === 1 && inFrames.every((n) => n === 0), `frames: ${inFrames}`);

  await page.goto(url('/plain', BF)); await sleep(200);
  await page.evaluate(() => { document.body.innerHTML = '<h1>wiped body</h1>'; }); await sleep(100);
  check('page wipes <body>: still there', (await page.evaluate(probe)).count === 1);
  await page.evaluate(() => document.documentElement.replaceChildren(document.head, document.body)); await sleep(100);
  let p = await page.evaluate(probe);
  check('page removes it from <html>: put back, back in the top layer', p.count === 1 && p.topLayer === true);
  await page.evaluate(() => { document.open(); document.write('<!doctype html><title>rewritten</title><h1>document.write</h1>'); document.close(); }); await sleep(250);
  p = await page.evaluate(probe);
  check('page rewrites the whole document: put back', p.count === 1 && p.parent === 'HTML', JSON.stringify(p.panelRect));

  await page.goto(url('/fighter', BF)); await sleep(600);
  const removed = await page.evaluate(() => window.removed);
  p = await page.evaluate(probe);
  check('page that deletes it every time: gives up instead of looping forever', removed > 0 && removed < 40 && !p.present, `removed ${removed} times`);

  await page.goto(url('/dialog', BF)); await sleep(200);
  await page.evaluate(() => { document.getElementById('d').showModal(); document.getElementById('pop').showPopover(); }); await sleep(150);
  p = await page.evaluate(probe);
  check('site modal dialog + popover open: still shown, no breakage', p.count === 1 && JSON.stringify(p.panelRect) === JSON.stringify(base.panelRect));

  for (const path of ['/svg', '/xml', '/txt', '/json', '/xhtml', '/frameset']) {
    await page.goto(url(path, BF)); await sleep(250);
    const r = await page.evaluate(() => ({ n: document.querySelectorAll('thirty-off-overlay').length, type: document.contentType })).catch((e) => ({ n: '?', type: e.message.slice(0, 60) }));
    console.log(`        ${path}: ${r.type}, overlays: ${r.n}`);
  }

  await page.goto(url('/headscript', BF)); await sleep(250);
  const hs = await page.evaluate(() => ({ first: window.firstChildAtHead, kids: window.childrenAtHead, now: [...document.documentElement.children].map((c) => c.tagName).join(',') }));
  check('head scripts never see a foreign element under <html>', hs.first === 'HEAD' && hs.kids === 'HEAD', `${hs.kids} -> ${hs.now}`);

  // Back/forward cache.
  await page.goto(url('/plain', BF)); await sleep(150);
  await page.goto(url('/dialog', BF)); await sleep(150);
  await page.goBack(); await sleep(300);
  check('back button: still exactly one', (await page.evaluate(probe)).count === 1);

  check('no content-script errors on any of these pages', errs.length === 0, errs.join(' | '));
  await context.close();
}
{
  // Appears with <body>, not after the whole page has loaded.
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London' });
  const page = await context.newPage();
  const nav = page.goto(url('/slow', BF));
  await sleep(1100);
  const mid = await page.evaluate(() => ({ state: document.readyState, shown: !!document.querySelector('thirty-off-overlay') })).catch((e) => ({ err: e.message }));
  check('slow page: shown while the document is still loading', mid.state === 'loading' && mid.shown === true, JSON.stringify(mid));
  await nav;
  await context.close();
}

// =====================================================================================
console.log('\n# 5. Screenshots at other sizes');
for (const [name, viewport] of [['wide-1920', { width: 1920, height: 1080 }], ['narrow-700', { width: 700, height: 900 }]]) {
  const { context } = await launchWithExtension(EXT, { tz: 'Europe/London', viewport });
  const page = await context.newPage();
  await page.goto(url('/plain', BF)); await sleep(300);
  await page.screenshot({ path: `${SHOTS}${name}.png` });
  const p = await page.evaluate(probe);
  console.log(`        ${name}: panel ${JSON.stringify(p.panelRect)} viewport ${JSON.stringify(p.viewport)}`);
  await context.close();
}

server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) { console.log('FAILED:\n' + failed.map((f) => ` - ${f.name}  ${f.detail}`).join('\n')); process.exit(1); }
