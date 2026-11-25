#!/usr/bin/env python3
"""One self-contained page that shows the extension's banner and the banner designs on the mock pages
(templates/mock/), with buttons to switch between them and between a desktop and a phone screen.
    python3 tools/banner-compare.py          -> out/banner-compare.html
The current banner is the real extension: ../extension/src/content.js run on the mock page, with
chrome.runtime stood in for (its files handed over as data: URLs) and the date set to Black Friday.
A design is any templates/*-banner.html, built (tools/build-templates.py) and shown in the frame the
extension uses, given the same Black Friday date."""
import base64, json, os, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(ROOT), 'extension', 'src')
# button label -> template name: v-starburst-banner -> "Starburst"
DESIGNS = [(n[2:-7].replace('-', ' ').title(), n) for n in sorted(f[:-5] for f in os.listdir(os.path.join(ROOT, 'templates')) if f.endswith('-banner.html'))]
subprocess.run(['python3', os.path.join(ROOT, 'tools', 'build-templates.py'), *[n for _, n in DESIGNS]], check=True, stdout=subprocess.DEVNULL)

def data(path, mime):
    return f'data:{mime};base64,' + base64.b64encode(open(path, 'rb').read()).decode()
files = {}
for sub, mime in (('images', 'image/webp'), ('fonts', 'font/woff2')):
    for f in sorted(os.listdir(f'{SRC}/{sub}')):
        if f.endswith(('.webp', '.woff2')): files[f'{sub}/{f}'] = data(f'{SRC}/{sub}/{f}', mime)
# the stylesheet, with the pictures it names (relative to itself) put inside it
css = re.sub(r'url\((images/[\w-]+\.webp)\)', lambda m: f'url({files[m.group(1)]})', open(f'{SRC}/banner.css', encoding='utf-8').read())
files['banner.css'] = 'data:text/css;base64,' + base64.b64encode(css.encode()).decode()
read = lambda p: open(p, encoding='utf-8').read()
bundle = {
    'files': files,
    'content': read(f'{SRC}/content.js'),
    'mock': {'shop': read(f'{ROOT}/templates/mock/shop.html'), 'news': read(f'{ROOT}/templates/mock/news.html')},
    'designs': [{'label': label, 'html': read(f'{ROOT}/out/templates/{name}.html')} for label, name in DESIGNS],
}
# safe inside a <script>: no "</" can close it
payload = json.dumps(bundle).replace('</', '<\\/')

page = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Banner Comparison</title>
<style>
  :root { --bg: #16171c; --panel: #23242b; --text: #ececf1; --muted: #9a9ba6; --on: #fff035; --on-text: #111; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: var(--bg); color: var(--text); font: 14px/1.3 system-ui, -apple-system, sans-serif; overflow: hidden; }
  header { display: flex; flex-wrap: wrap; gap: 10px 22px; align-items: center; justify-content: center; padding: 12px 16px; }
  .group { display: flex; background: var(--panel); border-radius: 999px; padding: 3px; }
  .group button { border: 0; background: none; color: var(--text); font: 600 14px/1 system-ui, sans-serif; padding: 9px 16px; border-radius: 999px; cursor: pointer; }
  .group button[aria-pressed="true"] { background: var(--on); color: var(--on-text); }
  .note { color: var(--muted); font-size: 12px; }
  #stage { position: absolute; left: 0; right: 0; bottom: 0; display: grid; place-items: center; }
  #screen { position: absolute; border: 0; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.5); transform-origin: 0 0; border-radius: 6px; }
</style>
</head>
<body>
<header>
  <div class="group" role="group" aria-label="Banner">
    <button data-banner="current" aria-pressed="true">Current (__VERSION__)</button>
  </div>
  <div class="group" role="group" aria-label="Screen">
    <button data-screen="desktop" aria-pressed="true">Desktop</button>
    <button data-screen="phone" aria-pressed="false">Phone</button>
  </div>
  <span class="note">Shown as on Black Friday, 2pm. Keys: 1–9 switch banner, D / P switch screen.</span>
</header>
<div id="stage"><iframe id="screen" title="A web page on Black Friday"></iframe></div>
<script>
const B = __PAYLOAD__;
const SCREENS = { desktop: [1440, 900], phone: [390, 844] };
const state = { banner: 'current', screen: 'desktop' };
const screen = document.getElementById('screen'), stage = document.getElementById('stage');

// the mock page, with something added to the end of its <body>
const withExtra = (html, extra) => html.replace(/<\/body>/i, extra + '</body>');
const esc = (s) => s.replace(/<\//g, '<\\/');
// Black Friday, 2pm local, then running on
const DATE = `<script>(() => { const R = Date, t0 = new R(2026, 10, 27, 14).getTime(), s = R.now();
  class D extends R { constructor(...a) { a.length ? super(...a) : super(t0 + R.now() - s); } static now() { return t0 + R.now() - s; } }
  window.Date = D; })();<\/script>`;
// the design buttons, after Current
const group = document.querySelector('[aria-label="Banner"]');
B.designs.forEach((d, i) => group.insertAdjacentHTML('beforeend', `<button data-banner="${i}" aria-pressed="false">${d.label}</button>`));

// The current banner: the extension's own script, given what it asks Chrome for.
function current(mock) {
  const shim = `<script>
    window.chrome = { runtime: { id: 'demo', getURL: (p) => (${esc(JSON.stringify(B.files))})[p] || p } };
  <\/script>${DATE}<script>${esc(B.content)}<\/script>`;
  return withExtra(mock, shim);
}
// A design: the built banner page in the extension's frame, its options set in place of the query
// string it would otherwise read, and given the same date.
function design(i, mock, narrow) {
  const opts = `keep&edge=${narrow ? 'bottom' : 'left'}&clear=17`;
  const inner = B.designs[i].html.split('new URLSearchParams(location.search)').join(`new URLSearchParams(${JSON.stringify(opts)})`)
    .replace(/<head>/i, '<head>' + DATE);
  const frame = `<style>
    .bf-host { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; }
    .bf-frame { position: absolute; top: 0; right: 0; width: 30%; height: 100%; background: #000; pointer-events: auto; }
    .bf-trim, .bf-face { position: absolute; inset: 0; }
    .bf-trim { background: linear-gradient(90deg, #fffb86, #f0e11c 45%, #c9b400); }
    .bf-face { overflow: hidden; background: #0a22d6; }
    .bf-face iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }
    @media (max-width: 768px) { .bf-frame { width: 100%; height: 33%; } .bf-trim { background: linear-gradient(#c9b400, #f0e11c 55%, #fffb86); } }
  </style>
  <div class="bf-host"><div class="bf-frame"><div class="bf-trim"></div><div class="bf-face"><iframe scrolling="no" title="banner"></iframe></div></div></div>
  <script>
    (() => {
      const TOOTH = { period: 16, depth: 7 }, KEYLINE = 2, TRIM = 6, narrow = matchMedia('(max-width: 768px)').matches;
      const teeth = (w, h, inset) => { const p = TOOTH.period, d = TOOTH.depth, pts = [];
        if (narrow) { pts.push('0 0', w + 'px 0'); for (let x = w; x > -p; x -= p) pts.push(x + 'px ' + (h - inset) + 'px', (x - p / 2) + 'px ' + (h - inset - d) + 'px'); }
        else { pts.push(w + 'px 0', w + 'px ' + h + 'px'); for (let y = h; y > -p; y -= p) pts.push(inset + 'px ' + y + 'px', (inset + d) + 'px ' + (y - p / 2) + 'px'); }
        return 'polygon(' + pts.join(', ') + ')'; };
      const f = document.querySelector('.bf-frame'), W = f.clientWidth, H = f.clientHeight;
      f.style.clipPath = teeth(W, H, 0);
      document.querySelector('.bf-trim').style.clipPath = teeth(W, H, KEYLINE);
      document.querySelector('.bf-face').style.clipPath = teeth(W, H, KEYLINE + TRIM);
      document.querySelector('.bf-face iframe').srcdoc = window.parent.__design;
    })();
  <\/script>`;
  window.__design = inner;
  return withExtra(mock, frame);
}

function fit() {
  const [w, h] = SCREENS[state.screen], top = document.querySelector('header').offsetHeight;
  stage.style.top = top + 'px';
  const k = Math.min((innerWidth - 32) / w, (innerHeight - top - 24) / h, 1);
  Object.assign(screen.style, { width: w + 'px', height: h + 'px', left: (innerWidth - w * k) / 2 + 'px', top: Math.max(0, (innerHeight - top - h * k) / 2) + 'px', transform: `scale(${k})` });
}
function show() {
  for (const b of document.querySelectorAll('[data-banner]')) b.setAttribute('aria-pressed', b.dataset.banner === String(state.banner));
  for (const b of document.querySelectorAll('[data-screen]')) b.setAttribute('aria-pressed', b.dataset.screen === state.screen);
  fit();
  const narrow = state.screen === 'phone', mock = B.mock[narrow ? 'news' : 'shop'];
  if (state.banner !== 'current' && !B.designs[state.banner]) state.banner = 'current';
  screen.srcdoc = state.banner === 'current' ? current(mock) : design(+state.banner, mock, narrow);
  try { localStorage.setItem('bf-compare', JSON.stringify(state)); } catch {}
}
// the design page is handed to its frame through the parent of its parent
Object.defineProperty(window, '__design', { writable: true, value: '' });

try { Object.assign(state, JSON.parse(localStorage.getItem('bf-compare') || '{}')); } catch {}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.banner) state.banner = b.dataset.banner;
  if (b.dataset.screen) state.screen = b.dataset.screen;
  show();
});
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase(), n = Number(k) - 2;
  const m = k === '1' ? ['banner', 'current'] : n >= 0 && n < B.designs.length ? ['banner', String(n)] : { d: ['screen', 'desktop'], p: ['screen', 'phone'] }[k];
  if (m && state[m[0]] !== m[1]) { state[m[0]] = m[1]; show(); }
});
addEventListener('resize', fit);
show();
</script>
</body>
</html>
'''
out = os.path.join(ROOT, 'out/banner-compare.html')
version = json.load(open(f'{SRC}/manifest.json'))['version']
open(out, 'w', encoding='utf-8').write(page.replace('__VERSION__', version).replace('__PAYLOAD__', payload))
print(out, f'{os.path.getsize(out) / 1e6:.2f} MB')
