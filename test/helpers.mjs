// Test helpers: launch Chromium with the unpacked extension, serve local test pages, fake the
// content script's clock, and press the toolbar button for real.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export async function launchWithExtension(extDir, { tz, viewport = { width: 1280, height: 800 } } = {}) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-profile-'));
  // Developer mode on, as on the machine of anyone who loads an unpacked extension. Without
  // it Chrome turns an unpacked extension OFF when it reloads itself.
  fs.mkdirSync(path.join(userDataDir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(userDataDir, 'Default', 'Preferences'), JSON.stringify({ extensions: { ui: { developer_mode: true } } }));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    viewport,
    timezoneId: tz,
    args: [
      `--disable-extensions-except=${extDir}`,
      `--load-extension=${extDir}`,
      '--enable-unsafe-extension-debugging',
    ],
  });
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 });
  // Wait until the worker has actually run. On a busy machine a simulated toolbar click can
  // otherwise arrive before the worker has registered its click listener, and is lost.
  await sw.evaluate(() => chrome.runtime.id);
  const extensionId = new URL(sw.url()).host;
  return { context, sw, extensionId, userDataDir };
}

// A tiny static server with per-path response headers (for CSP tests).
export function serve(routes) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const route = routes[url.pathname];
      if (!route) { res.writeHead(404); res.end('nope'); return; }
      if (typeof route === 'function') return route(req, res);
      const { body, type = 'text/html; charset=utf-8', headers = {} } =
        typeof route === 'string' ? { body: route } : route;
      res.writeHead(200, { 'content-type': type, ...headers });
      res.end(body);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

// Copy an extension directory and add one test-only content script, listed first, that
// replaces `Date` in the extension's isolated world when the page URL carries ?fakeNow=<epoch ms>.
// Every real file is copied byte-for-byte; only the clock is faked. (CDP virtual time was tried
// first: any paused/budgeted policy deadlocks navigation, and "advance" drifts by hours.)
const PRELUDE = `(() => {
  const RealDate = Date;
  const param = new URLSearchParams(location.search).get('fakeNow');
  const started = RealDate.now();
  // "Now" is <html data-fake-now> if set (frozen), else ?fakeNow= (keeps ticking), else real.
  function fakeNow() {
    const attr = document.documentElement?.dataset?.fakeNow;
    if (attr) return Number(attr);
    if (param) return Number(param) + (RealDate.now() - started);
    return RealDate.now();
  }
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(fakeNow()); else super(...a); }
    static now() { return fakeNow(); }
  }
  globalThis.Date = FakeDate;
})();`;
export function makeTestCopy(srcDir) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-ext-'));
  fs.cpSync(srcDir, dir, { recursive: true, filter: (f) => !f.endsWith('.zip') });
  fs.writeFileSync(path.join(dir, 'test-clock.js'), PRELUDE);
  const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const cs of mf.content_scripts) {
    cs.js.unshift('test-clock.js');
    // Pages with ?preinstall=1 get no automatic content script, which is the state of any
    // tab that was already open when the extension was installed or updated.
    cs.exclude_globs = ['*preinstall=1*'];
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mf, null, 2));
  return dir;
}

// Real toolbar click (grants activeTab exactly like a user click does).
export async function clickAction(context, page, extensionId) {
  const browser = context.browser();
  if (!browser) throw new Error('no browser-level CDP session available');
  const bcdp = await browser.newBrowserCDPSession();
  // triggerAction wants the *tab* target that hosts this page, not the page target itself.
  const marker = `bf-${Math.random().toString(36).slice(2)}`;
  const oldTitle = await page.title();
  await page.evaluate((m) => { document.title = m; }, marker);
  const { targetInfos } = await bcdp.send('Target.getTargets', { filter: [{ type: 'tab' }] });
  await page.evaluate((t) => { document.title = t; }, oldTitle);
  const tab = targetInfos.find((t) => t.title === marker) ||
    targetInfos.find((t) => t.url === page.url());
  if (!tab) throw new Error('tab target not found: ' + JSON.stringify(targetInfos));
  await bcdp.send('Extensions.triggerAction', { id: extensionId, targetId: tab.targetId });
  await bcdp.detach();
}
