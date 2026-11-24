// Test helpers: launch Chromium with the unpacked extension, serve local test pages, fake the
// content script's clock, and press the toolbar button for real.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// browser: the path of another Chromium-based browser to test in (or set BF_BROWSER); by default,
// Playwright's own Chromium.
export async function launchWithExtension(extDir, { tz, viewport = { width: 1280, height: 800 }, deviceScaleFactor, browser = process.env.BF_BROWSER } = {}) {
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-profile-'));
  // Developer mode on, as on the machine of anyone who loads an unpacked extension. Without
  // it Chrome turns an unpacked extension OFF when it reloads itself.
  fs.mkdirSync(path.join(userDataDir, 'Default'), { recursive: true });
  fs.writeFileSync(path.join(userDataDir, 'Default', 'Preferences'), JSON.stringify({ extensions: { ui: { developer_mode: true } } }));
  const args = [
    `--disable-extensions-except=${extDir}`,
    `--load-extension=${extDir}`,
    '--enable-unsafe-extension-debugging',
    // branded browsers have stopped honouring --load-extension; this keeps it for a test run
    '--disable-features=DisableLoadExtensionCommandLineSwitch',
  ];
  const context = await chromium.launchPersistentContext(userDataDir, {
    // another browser runs headed as far as Playwright knows, with the new headless mode asked for
    // by hand: the old one, which Playwright would ask for, cannot run extensions
    ...(browser ? { executablePath: browser, headless: false, args: [...args, '--headless=new'] } : { channel: 'chromium', headless: true, args }),
    viewport,
    deviceScaleFactor,
    timezoneId: tz,
  });
  return { context, userDataDir };
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
  fs.cpSync(srcDir, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'test-clock.js'), PRELUDE);
  const mf = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const cs of mf.content_scripts) {
    cs.js.unshift('test-clock.js');
    // Pages with ?preinstall=1 get no content script, which is the state of any tab that was
    // already open when the extension was installed or updated.
    cs.exclude_globs = ['*preinstall=1*'];
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(mf, null, 2));
  return dir;
}

// Reload the extension, as an update from the store would, using the chrome://extensions page.
export async function reloadExtension(context) {
  const page = await context.newPage();
  await page.goto('chrome://extensions/');
  await page.evaluate(async () => {
    const [ext] = await chrome.developerPrivate.getExtensionsInfo();
    await chrome.developerPrivate.reload(ext.id, { failQuietly: true });
  });
  await page.close();
}
