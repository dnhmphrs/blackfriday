#!/usr/bin/env python3
"""Build out/channel-page/channel.html: the Channel banner over a web page, one self-contained file.

The banner is built the way the extension would build it: a still picture (rendered from
comps/tv-banner with ?crawl=0&only=0&glints=0, see the stills below) with the live parts on top in
HTML: the top ticker, the BLACK FRIDAY ONLY! crawl, and the WAS/NOW price card whose 70% pulses.
The page under it loads first; the banner slides in once its picture and fonts are ready.
    python3 tools/channel-page.py      (run from marketing/)"""
import base64, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, 'out', 'channel-page')
FONTS = os.path.join(ROOT, 'variants', 'v17', 'fonts')


def b64(path, mime):
    with open(path, 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()


ART = {k: b64(os.path.join(OUT_DIR, f'art-{k}.webp'), 'image/webp') for k in ('desktop', 'phone')}
FONT = {k: b64(os.path.join(FONTS, f'{k}.woff2'), 'font/woff2')
        for k in ('antonio-light', 'antonio-semibold', 'archivo-black', 'arimo-bold-italic')}
PAGES = {k: open(os.path.join(ROOT, 'store', 'mock', f'{k}.html'), encoding='utf-8').read() for k in ('shop', 'news')}

TICKER = ' ✦ '.join(['But wait… there’s less!', 'No purchase necessary!', 'Black Friday only!',
                      'Every website, 30% off!', 'Works like magic!']) + ' ✦ '
CRAWL = 'BLACK FRIDAY ONLY! ✦ '

PAGE = r'''<title>30% Off Channel Banner</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
  @font-face { font-family: "TOE Antonio"; font-weight: 300; src: url(__F_ANTONIO_LIGHT__) format("woff2"); }
  @font-face { font-family: "TOE Antonio"; font-weight: 600; src: url(__F_ANTONIO_SEMIBOLD__) format("woff2"); }
  @font-face { font-family: "TOE Black"; src: url(__F_ARCHIVO_BLACK__) format("woff2"); }
  @font-face { font-family: "TOE Arimo"; font-style: italic; font-weight: 700; src: url(__F_ARIMO__) format("woff2"); }

  /* One look on purpose: the web page is the colour; the surround is only seen around the phone. */
  :root {
    --surround: #101218; --panel: rgba(16, 18, 30, 0.92); --ink: #f1f3fb; --muted: #9ea4c0; --accent: #2f55ff;
    --yellow: #fff035; --shade: #0a0f66; --red: #ff1616; color-scheme: light;
  }
  html, body { height: 100%; }
  body { margin: 0; background: #fff; color: var(--ink); font: 13px/1.4 "Helvetica Neue", Arial, sans-serif; overflow: hidden; }
  body.phone { background: var(--surround); }

  /* the viewport: the whole window on desktop, a 390 x 844 phone screen otherwise */
  #view { position: absolute; inset: 0; overflow: hidden; background: #fff; }
  body.phone #view { inset: auto; left: 50%; top: 50%; width: 390px; height: 844px; border-radius: 28px; box-shadow: 0 0 0 12px #000, 0 20px 60px rgba(0, 0, 0, 0.6); }
  #site { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; background: #fff; }

  /* ---------------- the banner ----------------
     #frame is the black keyline, .trim the gold coupon trim, .face the banner itself; each is cut
     with the same teeth along the page-facing edge (the left on desktop, the bottom on a phone),
     a little further in each time. Hidden until it is ready, then it slides in. */
  #frame { position: absolute; z-index: 2; top: 0; right: 0; width: 30%; height: 100%; background: #000; pointer-events: auto;
           user-select: none; cursor: default; opacity: 0; transform: translateX(104%); visibility: hidden; }
  body.phone #frame { left: 0; right: auto; width: 100%; height: 33%; transform: translateY(-104%); }
  #frame.in, body.phone #frame.in { visibility: visible; opacity: 1; transform: none; transition: transform 0.55s cubic-bezier(0.2, 0.85, 0.25, 1), opacity 0.25s linear; }
  .trim, .face { position: absolute; inset: 0; }
  .trim { background: linear-gradient(90deg, #fffb86, #f0e11c 45%, #c9b400); }
  body.phone .trim { background: linear-gradient(#c9b400, #f0e11c 55%, #fffb86); }
  .face { overflow: hidden; background: linear-gradient(#0a1cc4, #0a22d6 45%, #070f9c); }

  /* everything inside is laid out in banner pixels on a sheet; the script zooms it to fit */
  .tbox, .sbox { position: absolute; left: 0; right: 0; display: flex; justify-content: center; }
  .tbox { top: 0; } .sbox { bottom: 0; }
  .tsheet, .sheet { position: relative; flex: none; }

  /* the top ticker, Garrett's lines */
  .ticker { position: absolute; left: -1200px; right: -1200px; top: 0; overflow: hidden; white-space: nowrap;
            font: 300 56px/84px "TOE Antonio", "Arial Narrow", Arial, sans-serif; letter-spacing: 0.035em; word-spacing: 0.3em;
            color: #e9f0ff; text-shadow: 3px 3px 0 rgba(4, 8, 80, 0.85); }
  .ticker span { display: inline-block; padding-left: 1200px; animation: slide 44s linear infinite; }
  body.phone .ticker { font-size: 46px; line-height: 70px; }

  .art { position: absolute; left: 0; top: 0; display: block; max-width: none; }

  /* the crawl along the bottom: BLACK FRIDAY ONLY! */
  .crawl { position: absolute; left: -1200px; right: -1200px; bottom: 0; overflow: hidden; white-space: nowrap;
           font: 400 112px/150px "TOE Black", "Arial Black", Arial, sans-serif; color: var(--yellow); letter-spacing: -0.02em; word-spacing: 0.08em; }
  .crawl span { display: inline-block; padding-left: 1200px; text-shadow: 3px 3px 0 var(--shade), 6px 6px 0 var(--shade), 9px 9px 0 var(--shade);
                animation: crawl 24s linear infinite; }
  body.phone .crawl { font-size: 66px; line-height: 90px; }
  body.phone .crawl span { animation-duration: 18s; text-shadow: 2px 2px 0 var(--shade), 4px 4px 0 var(--shade), 6px 6px 0 var(--shade); }

  /* the price card, from v1.7; only its 70% moves */
  .price { position: absolute; width: 400px; height: 306px; background: #f3f4f6; color: #0c0c0c; border: 5px solid #000;
           box-shadow: 8px 8px 0 rgba(4, 6, 60, 0.92); transform-origin: left top; font: italic 700 50px/1 "TOE Arimo", Arial, sans-serif; }
  .price .head { background: var(--red); color: #fff46a; font: 600 41px/57px "TOE Antonio", "Arial Narrow", Arial, sans-serif; font-style: normal;
                 padding: 0 15px; border-bottom: 5px solid #000; white-space: nowrap; overflow: hidden; }
  .price .line { padding: 13px 17px 0; }
  .price s { position: relative; text-decoration: none; color: #6b6f78; margin-left: 9px; }
  .price s::after { content: ""; position: absolute; left: -8%; right: -8%; top: 46%; height: 8px; background: var(--red); transform: rotate(-11deg); box-shadow: 0 0 0 2px #000; }
  .price .big { position: absolute; right: 9px; bottom: -54px; font: 400 165px/0.9 "TOE Black", "Arial Black", Arial, sans-serif; font-style: normal;
                color: var(--red); letter-spacing: -0.05em; -webkit-text-stroke: 11px #000; paint-order: stroke fill;
                transform: skewX(-8deg); transform-origin: right bottom; animation: pulse 1.4s ease-in-out infinite; }

  @keyframes slide { to { transform: translateX(-50%); } }
  @keyframes crawl { from { transform: skewX(-9deg); } to { transform: translateX(-50%) skewX(-9deg); } }
  @keyframes pulse { 0%, 55%, 100% { scale: 1; } 25% { scale: 1.06; } }
  @media (prefers-reduced-motion: reduce) {
    .ticker span, .crawl span, .price .big { animation: none; }
    #frame.in { transition: opacity 0.3s linear; }
  }

  /* the controls: a small panel bottom left; H hides it */
  #panel { position: fixed; z-index: 10; left: max(12px, env(safe-area-inset-left, 0px)); bottom: max(12px, env(safe-area-inset-bottom, 0px));
           display: flex; flex-wrap: wrap; gap: 8px; align-items: center; max-width: calc(100vw - 24px);
           padding: 8px; border-radius: 12px; background: var(--panel); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4); }
  #panel.hidden > :not(#toggle) { display: none; }
  .seg { display: inline-flex; gap: 2px; padding: 2px; border-radius: 8px; background: rgba(255, 255, 255, 0.07); }
  #panel button, #panel input { font: inherit; color: var(--ink); }
  .seg button, #go, #toggle, #replay { border: 0; border-radius: 6px; padding: 6px 10px; background: transparent; cursor: pointer; white-space: nowrap; }
  .seg button[aria-pressed="true"], #go { background: var(--accent); }
  #toggle { color: var(--muted); }
  #url-form { display: inline-flex; gap: 4px; margin: 0; }
  #url { width: 190px; max-width: 46vw; border: 0; border-radius: 6px; padding: 6px 8px; background: rgba(255, 255, 255, 0.1); }
  #panel button:focus-visible, #panel input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
</style>

<div id="view">
  <iframe id="site" title="The web page under the banner" srcdoc="__SHOP_SRCDOC__"></iframe>
  <div id="frame" role="img" aria-label="30% off everything on the internet. Black Friday only!">
    <div class="trim"></div>
    <div class="face">
      <div class="tbox"><div class="tsheet"><div class="ticker"><span>__TICKER__</span></div></div></div>
      <div class="sbox"><div class="sheet">
        <img class="art" id="art" alt="" decoding="async">
        <div class="price"><div class="head">The Internet (All Of It)</div><div class="line">WAS: <s>100%</s></div><div class="line">NOW:</div><div class="big">70%</div></div>
        <div class="crawl"><span>__CRAWL__</span></div>
      </div></div>
    </div>
  </div>
</div>

<div id="panel">
  <div class="seg" id="screen-seg" role="group" aria-label="Screen">
    <button type="button" id="s-desktop" data-screen="desktop">Desktop</button>
    <button type="button" id="s-phone" data-screen="phone">Phone</button>
  </div>
  <div class="seg" id="page-seg" role="group" aria-label="Page">
    <button type="button" id="p-shop" data-page="shop">Shop</button>
    <button type="button" id="p-news" data-page="news">News</button>
  </div>
  <form id="url-form"><input id="url" type="url" placeholder="or any https:// page" aria-label="Web page address"><button id="go" type="submit">Go</button></form>
  <button type="button" id="replay">Replay</button>
  <button type="button" id="toggle" title="Hide or show these controls (H)">Hide</button>
</div>

<script>
  // Sizes in banner pixels. Desktop: the ticker strip, then the picture whose bottom 132 px is left
  // empty for the crawl, which is 150 tall. Phone the same, smaller. TOTAL fits the frame exactly at
  // 1280 x 800 (and 390 x 844): other shapes get a little more blue above the headline or beside it.
  const L = {
    desktop: { w: 1080, tt: 84, artH: 2148, artFoot: 132, crawl: 150, card: { x: 80, y: 1002, s: 1.0, r: -1.4 } },
    phone: { w: 1170, tt: 70, artH: 760, artFoot: 85, crawl: 90, card: { x: 584, y: 384, s: 0.56, r: -1.4 } },
  };
  const ART = { desktop: '__ART_DESKTOP__', phone: '__ART_PHONE__' };
  const PAGES = { shop: '__SHOP_JSON__', news: '__NEWS_JSON__' };
  const TOOTH = { period: 16, depth: 7 }, KEY = 2, TRIM = 6; // CSS px: the teeth, the black keyline, the gold trim
  const RESERVE = TOOTH.depth + KEY + TRIM + 4; // kept clear of the teeth on the page-facing edge

  const $ = (id) => document.getElementById(id);
  const state = { screen: 'desktop', page: 'shop', url: '' };
  const frame = $('frame'), face = frame.querySelector('.face'), trim = frame.querySelector('.trim');
  const tsheet = frame.querySelector('.tsheet'), sheet = frame.querySelector('.sheet'), tbox = frame.querySelector('.tbox'), sbox = frame.querySelector('.sbox');
  const card = frame.querySelector('.price'), art = $('art');

  // A zigzag along the page-facing edge, `s` px further in than the tips.
  function teeth(w, h, phone, s) {
    const { period: p, depth: d } = TOOTH, pts = [];
    if (phone) {
      pts.push('0 0', `${w}px 0`);
      for (let x = w; x > -p; x -= p) pts.push(`${x}px ${h - s}px`, `${x - p / 2}px ${h - s - d}px`);
    } else {
      pts.push(`${w}px 0`, `${w}px ${h}px`);
      for (let y = h; y > -p; y -= p) pts.push(`${s}px ${y}px`, `${s + d}px ${y - p / 2}px`);
    }
    return `polygon(${pts.join(', ')})`;
  }

  function fit() {
    const phone = state.screen === 'phone', g = L[state.screen];
    const w = frame.clientWidth, h = frame.clientHeight;
    if (!w || !h) return;
    frame.style.clipPath = teeth(w, h, phone, 0);
    trim.style.clipPath = teeth(w, h, phone, KEY);
    face.style.clipPath = teeth(w, h, phone, KEY + TRIM);
    const aw = phone ? w : w - RESERVE, ah = phone ? h - RESERVE : h;
    const sheetH = g.artH - g.artFoot + g.crawl, z = Math.min(aw / g.w, ah / (g.tt + sheetH));
    for (const box of [tbox, sbox]) { box.style.left = phone ? '0' : RESERVE + 'px'; }
    sbox.style.bottom = phone ? RESERVE + 'px' : '0';
    tsheet.style.width = sheet.style.width = g.w + 'px';
    tsheet.style.height = g.tt + 'px';
    sheet.style.height = sheetH + 'px';
    tsheet.style.zoom = sheet.style.zoom = z;
    art.style.width = g.w + 'px'; art.style.height = g.artH + 'px';
    card.style.left = g.card.x + 'px'; card.style.top = g.card.y + 'px';
    card.style.transform = `scale(${g.card.s}) rotate(${g.card.r}deg)`;
  }

  function fitPhone() {
    const s = Math.min(1, (innerHeight - 90) / 844, (innerWidth - 40) / 390);
    $('view').style.transform = state.screen === 'phone' ? `translate(-50%, -50%) scale(${s})` : '';
  }

  // Show the banner only when its picture and type are ready, after the page underneath has had
  // its turn, then slide it in.
  let showing = 0;
  async function show() {
    const ticket = ++showing;
    frame.classList.remove('in');
    art.src = ART[state.screen];
    const ready = Promise.all([
      art.decode().catch(() => {}),
      ...['300 56px "TOE Antonio"', '600 41px "TOE Antonio"', '112px "TOE Black"', 'italic 700 50px "TOE Arimo"'].map((f) => document.fonts.load(f).catch(() => {})),
    ]);
    const settled = new Promise((r) => {
      const f = $('site');
      let done = false; const go = () => { if (!done) { done = true; r(); } };
      if (f.contentDocument && f.contentDocument.readyState === 'complete') go(); else f.addEventListener('load', go, { once: true });
      setTimeout(go, 1500); // a slow page does not keep the banner waiting for ever
    });
    await Promise.all([ready, settled]);
    await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 400 }) : setTimeout(r, 50)));
    if (ticket !== showing) return;
    fit();
    void frame.offsetWidth; // start the slide from the hidden position
    frame.classList.add('in');
  }

  function render() {
    document.body.classList.toggle('phone', state.screen === 'phone');
    for (const el of document.querySelectorAll('[data-screen]')) el.setAttribute('aria-pressed', String(el.dataset.screen === state.screen));
    for (const el of document.querySelectorAll('[data-page]')) el.setAttribute('aria-pressed', String(!state.url && el.dataset.page === state.page));
    fitPhone();
  }
  function loadPage() {
    const f = $('site');
    if (state.url) { f.removeAttribute('srcdoc'); f.src = state.url; }
    else { f.removeAttribute('src'); f.srcdoc = PAGES[state.page]; }
  }

  $('screen-seg').addEventListener('click', (e) => { const t = e.target.closest('[data-screen]'); if (t && t.dataset.screen !== state.screen) { state.screen = t.dataset.screen; render(); loadPage(); show(); } });
  $('page-seg').addEventListener('click', (e) => { const t = e.target.closest('[data-page]'); if (t) { state.page = t.dataset.page; state.url = ''; $('url').value = ''; render(); loadPage(); show(); } });
  $('url-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let u = $('url').value.trim(); if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    state.url = u; render(); loadPage(); show();
  });
  $('replay').addEventListener('click', () => show());
  const toggle = () => { const p = $('panel'); p.classList.toggle('hidden'); $('toggle').textContent = p.classList.contains('hidden') ? 'Show' : 'Hide'; };
  $('toggle').addEventListener('click', toggle);
  addEventListener('keydown', (e) => { if ((e.key === 'h' || e.key === 'H') && e.target.tagName !== 'INPUT') toggle(); });
  addEventListener('resize', () => { fitPhone(); fit(); });

  render();
  show();
</script>
'''

js = lambda s: s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('</', '<\\/')
page = (PAGE
        .replace('__F_ANTONIO_LIGHT__', FONT['antonio-light']).replace('__F_ANTONIO_SEMIBOLD__', FONT['antonio-semibold'])
        .replace('__F_ARCHIVO_BLACK__', FONT['archivo-black']).replace('__F_ARIMO__', FONT['arimo-bold-italic'])
        .replace('__SHOP_SRCDOC__', html.escape(PAGES['shop'], quote=True))
        .replace('__TICKER__', html.escape(TICKER * 4)).replace('__CRAWL__', html.escape(CRAWL * 12))
        .replace('__ART_DESKTOP__', ART['desktop']).replace('__ART_PHONE__', ART['phone'])
        .replace('__SHOP_JSON__', js(PAGES['shop'])).replace('__NEWS_JSON__', js(PAGES['news'])))

# channel.html is the file to download and open; channel-artifact.html is the same page without
# the document skeleton, which the artifact host adds itself.
with open(os.path.join(OUT_DIR, 'channel.html'), 'w', encoding='utf-8') as f:
    f.write('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + page.replace('<div id="view">', '</head>\n<body>\n<div id="view">', 1) + '</body>\n</html>\n')
with open(os.path.join(OUT_DIR, 'channel-artifact.html'), 'w', encoding='utf-8') as f:
    f.write(page)
print(os.path.join(OUT_DIR, 'channel.html'), round(os.path.getsize(os.path.join(OUT_DIR, 'channel.html')) / 1e6, 2), 'MB')
