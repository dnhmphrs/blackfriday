#!/usr/bin/env python3
"""Build out/overlay-page/overlay.html: one self-contained file that shows a web page in an iframe
with a banner laid over it exactly where the extension puts it (the right 30% on desktop, the
top third on a phone). Banners and mock pages are inlined, so the file works on its own.
    python3 tools/overlay-page.py      (run from marketing/; media from out/overlay-page/media)"""
import base64, html, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MEDIA = os.path.join(ROOT, 'out', 'overlay-page', 'media')
OUT = os.path.join(ROOT, 'out', 'overlay-page', 'overlay.html')

def data(name):
    with open(os.path.join(MEDIA, name), 'rb') as f:
        return 'data:image/webp;base64,' + base64.b64encode(f.read()).decode()

banners = {k: {'desktop': data(f'{k}-desktop.webp'), 'phone': data(f'{k}-phone.webp'), 'pixel': k == '8bit'}
           for k in ('v17', '8bit', 'tv')}
pages = {k: open(os.path.join(ROOT, 'store', 'mock', f'{k}.html'), encoding='utf-8').read() for k in ('shop', 'news')}

TEMPLATE = r'''<title>30% Off Overlay</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  /* One look on purpose: a dark surround, so only the web page and the banner carry colour. */
  :root { --surround: #101218; --panel: rgba(16, 18, 30, 0.92); --ink: #f1f3fb; --muted: #9ea4c0; --accent: #2f55ff; color-scheme: dark; }
  html, body { height: 100%; }
  body { margin: 0; background: var(--surround); color: var(--ink); font: 13px/1.4 "Helvetica Neue", Arial, sans-serif; overflow: hidden; }

  /* the viewport: full window on desktop, a 390 x 844 phone screen otherwise */
  #view { position: absolute; inset: 0; overflow: hidden; background: #fff; }
  body.phone #view { inset: auto; left: 50%; top: 50%; width: 390px; height: 844px; transform-origin: 50% 50%; border-radius: 28px; box-shadow: 0 0 0 12px #000, 0 20px 60px rgba(0, 0, 0, 0.6); }
  #site { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; background: #fff; }

  /* the overlay, where the extension puts it */
  #overlay { position: absolute; top: 0; right: 0; width: 30%; height: 100%; z-index: 2; pointer-events: auto; }
  body.phone #overlay { left: 0; right: auto; width: 100%; height: 33%; }
  #overlay img { display: block; width: 100%; height: 100%; max-width: none; }
  #overlay img.pixel { image-rendering: pixelated; }

  /* the controls: a small panel bottom left; H hides it */
  #panel {
    position: fixed; z-index: 10; left: max(12px, env(safe-area-inset-left, 0px)); bottom: max(12px, env(safe-area-inset-bottom, 0px));
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center; max-width: calc(100vw - 24px);
    padding: 8px; border-radius: 12px; background: var(--panel); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
  }
  #panel.hidden > :not(#toggle) { display: none; }
  .seg { display: inline-flex; gap: 2px; padding: 2px; border-radius: 8px; background: rgba(255, 255, 255, 0.07); }
  button, input { font: inherit; color: var(--ink); }
  .seg button, #go, #toggle { border: 0; border-radius: 6px; padding: 6px 10px; background: transparent; cursor: pointer; white-space: nowrap; }
  .seg button[aria-pressed="true"], #go { background: var(--accent); }
  #toggle { color: var(--muted); }
  #url { width: 200px; max-width: 50vw; border: 0; border-radius: 6px; padding: 6px 8px; background: rgba(255, 255, 255, 0.1); }
  button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
</style>

<div id="view">
  <iframe id="site" title="The web page under the banner"></iframe>
  <div id="overlay"><img id="art" alt="The sale banner"></div>
</div>

<div id="panel">
  <div class="seg" id="banner-seg" role="group" aria-label="Banner">
    <button type="button" id="b-v17" data-banner="v17">v1.7</button>
    <button type="button" id="b-8bit" data-banner="8bit">8-bit</button>
    <button type="button" id="b-tv" data-banner="tv">Channel</button>
  </div>
  <div class="seg" id="screen-seg" role="group" aria-label="Screen">
    <button type="button" id="s-desktop" data-screen="desktop">Desktop</button>
    <button type="button" id="s-phone" data-screen="phone">Phone</button>
  </div>
  <div class="seg" id="page-seg" role="group" aria-label="Page">
    <button type="button" id="p-shop" data-page="shop">Shop</button>
    <button type="button" id="p-news" data-page="news">News</button>
  </div>
  <form id="url-form"><input id="url" type="url" placeholder="or any https:// page" aria-label="Web page address"> <button id="go" type="submit">Go</button></form>
  <button type="button" id="toggle" title="Hide or show these controls (H)">Hide</button>
</div>

<script>
  const BANNERS = __BANNERS__;
  const PAGES = __PAGES__;
  const state = { banner: 'v17', screen: 'desktop', page: 'shop', url: '' };
  const $ = (id) => document.getElementById(id);

  function fitPhone() {
    const s = Math.min(1, (innerHeight - 90) / 844, (innerWidth - 40) / 390);
    $('view').style.transform = document.body.classList.contains('phone') ? `translate(-50%, -50%) scale(${s})` : '';
  }
  function render() {
    document.body.classList.toggle('phone', state.screen === 'phone');
    const b = BANNERS[state.banner];
    $('art').src = b[state.screen];
    $('art').className = b.pixel ? 'pixel' : '';
    for (const el of document.querySelectorAll('[data-banner]')) el.setAttribute('aria-pressed', String(el.dataset.banner === state.banner));
    for (const el of document.querySelectorAll('[data-screen]')) el.setAttribute('aria-pressed', String(el.dataset.screen === state.screen));
    for (const el of document.querySelectorAll('[data-page]')) el.setAttribute('aria-pressed', String(!state.url && el.dataset.page === state.page));
    fitPhone();
  }
  function loadPage() {
    const f = $('site');
    if (state.url) { f.removeAttribute('srcdoc'); f.src = state.url; }
    else { f.removeAttribute('src'); f.srcdoc = PAGES[state.page]; }
  }

  $('banner-seg').addEventListener('click', (e) => { const t = e.target.closest('[data-banner]'); if (t) { state.banner = t.dataset.banner; render(); } });
  $('screen-seg').addEventListener('click', (e) => { const t = e.target.closest('[data-screen]'); if (t) { state.screen = t.dataset.screen; render(); } });
  $('page-seg').addEventListener('click', (e) => { const t = e.target.closest('[data-page]'); if (t) { state.page = t.dataset.page; state.url = ''; $('url').value = ''; loadPage(); render(); } });
  $('url-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let u = $('url').value.trim(); if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    state.url = u; loadPage(); render();
  });
  const toggle = () => { const p = $('panel'); p.classList.toggle('hidden'); $('toggle').textContent = p.classList.contains('hidden') ? 'Show' : 'Hide'; };
  $('toggle').addEventListener('click', toggle);
  addEventListener('keydown', (e) => { if ((e.key === 'h' || e.key === 'H') && e.target.tagName !== 'INPUT') toggle(); });
  addEventListener('resize', fitPhone);

  loadPage();
  render();
</script>
'''

page = TEMPLATE.replace('__BANNERS__', json.dumps(banners)).replace('__PAGES__', json.dumps(pages).replace('</', '<\\/'))
# overlay.html is the file to download and open; overlay-artifact.html is the same page without the
# document skeleton, which the artifact host adds itself.
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + page.replace('<div id="view">', '</head>\n<body>\n<div id="view">', 1) + '</body>\n</html>\n')
with open(OUT.replace('overlay.html', 'overlay-artifact.html'), 'w', encoding='utf-8') as f:
    f.write(page)
print(OUT, round(os.path.getsize(OUT) / 1e6, 2), 'MB')
