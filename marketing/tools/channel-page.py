#!/usr/bin/env python3
"""Build out/channel-page/channel.html: the Channel banner over a web page, one self-contained file.

The banner is laid out the way the extension will lay it out, from separate pieces so it can fill
any window shape: the lettering, the spinning globe and the column (cap, shaft, base: the shaft
stretches to whatever height there is) are pictures cut out of comps/tv-banner by
tools/channel-parts.mjs; the tickers, the price card and the strips are HTML. The page under it
loads first; the banner slides in once its pieces are ready.
    node tools/channel-parts.mjs && python3 tools/channel-page.py      (run from marketing/)"""
import base64, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, 'out', 'channel-page')
ASSETS = os.path.join(OUT_DIR, 'assets')
FONTS = os.path.join(ROOT, 'variants', 'v17', 'fonts')


def b64(path, mime):
    with open(path, 'rb') as f:
        return f'data:{mime};base64,' + base64.b64encode(f.read()).decode()


IMG = {k: b64(os.path.join(ASSETS, f), 'image/webp') for k, f in {
    'globe': 'globe-380.webp', 'cap': 'cap.webp', 'shaft': 'shaft.webp', 'base': 'base.webp',
    'sticker': 'sticker.webp', 'wow': 'wow.webp', 'typeDesktop': 'type-desktop.webp', 'typePhone': 'type-phone.webp'}.items()}
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
    --yellow: #fff035; --shade: #0a0f66; --red: #ff1616; --hard: rgba(6, 8, 70, 0.9); color-scheme: light;
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
  #frame.in, body.phone #frame.in { visibility: visible; opacity: 1; transform: none;
             transition: transform 0.55s cubic-bezier(0.2, 0.85, 0.25, 1), opacity 0.25s linear; }
  .trim, .face { position: absolute; inset: 0; }
  .trim { background: linear-gradient(90deg, #fffb86, #f0e11c 45%, #c9b400); }
  body.phone .trim { background: linear-gradient(#c9b400, #f0e11c 55%, #fffb86); }
  .face { overflow: hidden; background: linear-gradient(#0a1cc4, #0a22d6 45%, #070f9c); }
  .face > * { position: absolute; display: block; max-width: none; }
  #glow { border-radius: 50%; background: radial-gradient(closest-side, #58c4ff 0%, #2a8cff 22%, #1348ee 44%, transparent 72%); }

  /* the tickers: Garrett's lines along the top, BLACK FRIDAY ONLY! along the bottom */
  .ticker, .crawl { left: 0; right: 0; overflow: hidden; white-space: nowrap; }
  .ticker { top: 0; font-family: "TOE Antonio", "Arial Narrow", Arial, sans-serif; font-weight: 300; letter-spacing: 0.035em; word-spacing: 0.3em;
            color: #e9f0ff; text-shadow: 0.06em 0.06em 0 rgba(4, 8, 80, 0.85); }
  .ticker span { display: inline-block; animation: slide 44s linear infinite; }
  .crawl { bottom: 0; font-family: "TOE Black", "Arial Black", Arial, sans-serif; color: var(--yellow); letter-spacing: -0.02em; word-spacing: 0.08em; }
  .crawl span { display: inline-block; text-shadow: 0.027em 0.027em 0 var(--shade), 0.054em 0.054em 0 var(--shade), 0.08em 0.08em 0 var(--shade);
                animation: crawl 24s linear infinite; }

  /* the strips across the lower part (desktop): the yellow tape and the navy one tucked under it */
  .strip { display: flex; align-items: center; justify-content: center; white-space: nowrap; transform-origin: 50% 50%;
           font-family: "TOE Arimo", Arial, sans-serif; font-style: italic; font-weight: 700; }
  #strip { background: linear-gradient(#fffb86, #f0e11c); color: #111; box-shadow: inset 0 0.06em 0 rgba(170, 158, 0, 0.6), inset 0 -0.06em 0 rgba(170, 158, 0, 0.6); }
  #sub { background: var(--shade); color: #fff; letter-spacing: 0.14em; }
  body.phone #strip, body.phone #sub, body.phone #wow { display: none; }

  /* the price card, from v1.7; only its 70% moves */
  #card { width: 400px; height: 306px; background: #f3f4f6; color: #0c0c0c; border: 5px solid #000; box-sizing: border-box;
          box-shadow: 8px 8px 0 rgba(4, 6, 60, 0.92); transform-origin: left top; font: italic 700 50px/1 "TOE Arimo", Arial, sans-serif; }
  #card .head { background: var(--red); color: #fff46a; font: 600 41px/57px "TOE Antonio", "Arial Narrow", Arial, sans-serif;
                padding: 0 15px; border-bottom: 5px solid #000; white-space: nowrap; overflow: hidden; }
  #card .line { padding: 13px 17px 0; }
  #card s { position: relative; text-decoration: none; color: #6b6f78; margin-left: 9px; }
  #card s::after { content: ""; position: absolute; left: -8%; right: -8%; top: 46%; height: 8px; background: var(--red); transform: rotate(-11deg); box-shadow: 0 0 0 2px #000; }
  #card .big { position: absolute; right: 9px; bottom: -54px; font: 400 165px/0.9 "TOE Black", "Arial Black", Arial, sans-serif;
               color: var(--red); letter-spacing: -0.05em; -webkit-text-stroke: 11px #000; paint-order: stroke fill; transform-origin: 70% 80%;
               animation: jolt 1.1s ease-in-out infinite; }

  @keyframes slide { to { transform: translateX(-50%); } }
  @keyframes crawl { from { transform: skewX(-9deg); } to { transform: translateX(-50%) skewX(-9deg); } }
  @keyframes jolt {
    0%, 100% { transform: skewX(-8deg) scale(1) rotate(0deg); }
    12% { transform: skewX(-8deg) scale(1.18) rotate(-5deg); }
    26% { transform: skewX(-8deg) scale(0.96) rotate(3deg); }
    40% { transform: skewX(-8deg) scale(1.08) rotate(-2deg); }
    55% { transform: skewX(-8deg) scale(1) rotate(0deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .ticker span, .crawl span, #card .big { animation: none; }
    #frame.in, body.phone #frame.in { transition: opacity 0.3s linear; }
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
      <div id="glow"></div>
      <img id="type" alt="">
      <img id="shaft" alt="" src="__I_SHAFT__">
      <img id="cap" alt="" src="__I_CAP__">
      <img id="base" alt="" src="__I_BASE__">
      <img id="globe" alt="" src="__I_GLOBE__">
      <img id="sticker" alt="" src="__I_STICKER__">
      <div id="card"><div class="head">The Internet (All Of It)</div><div class="line">WAS: <s>100%</s></div><div class="line">NOW:</div><div class="big">70%</div></div>
      <img id="wow" alt="" src="__I_WOW__">
      <div class="strip" id="sub"><span>GARY MUSTARD ENTERPRISES</span></div>
      <div class="strip" id="strip"><span>EVERY SITE 30% OFF!</span></div>
      <div class="ticker"><span>__TICKER__</span></div>
      <div class="crawl"><span>__CRAWL__</span></div>
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
  // Positions in banner pixels (the artwork's own): u is CSS px per banner px. "top" pieces hang
  // from the top ticker, "bottom" pieces stand on the crawl; the column's shaft stretches between
  // its cap and its base, so the banner fills a window of any height. Extra width spreads the
  // pieces apart (the lettering left or centred, the monument right) instead of leaving margins.
  const L = {
    desktop: {
      w: 1080, tick: 84, tickFont: 56, crawl: 150, crawlFont: 112, minArt: 1800,
      type: { x: 97, y: 38, w: 895, h: 926, src: 'typeDesktop', spread: 0.5 },
      mon: { x: 516, y: 972, k: 1 },   // the globe picture's top left; k scales the whole monument
      sticker: { dx: 306, dy: 6, s: 1 },
      card: { x: 80, y: 1002, s: 1.0, r: -1.4, spread: 0 },
      wow: { x: 129, fromCrawl: -645, w: 276, h: 278 },
      strips: [{ id: 'sub', fromCrawl: -273, h: 68, cap: 30, dx: 18 }, { id: 'strip', fromCrawl: -375, h: 126, cap: 54, dx: 12 }],
      glow: { rx: 648, ry: 729 },
    },
    phone: {
      w: 1170, tick: 70, tickFont: 46, crawl: 90, crawlFont: 66, minArt: 560,
      type: { x: 39, y: 27, w: 594, h: 577, src: 'typePhone', spread: 0 },
      mon: { x: 780, y: -15, k: 320 / 384 },
      sticker: { dx: 20, dy: 40, s: 0.8 },
      card: { x: 584, y: 384, s: 0.56, r: -1.4, spread: 0.5 },
      glow: { rx: 538, ry: 517 },
    },
  };
  const MON = { globe: 480, capX: 40, capY: 410, colW: 400, capH: 136, baseH: 144 }; // the monument's pieces, unscaled
  const IMG = { typeDesktop: '__I_TYPE_DESKTOP__', typePhone: '__I_TYPE_PHONE__' };
  const PAGES = { shop: '__SHOP_JSON__', news: '__NEWS_JSON__' };
  const TOOTH = { period: 16, depth: 7 }, KEY = 2, TRIM = 6; // CSS px: the teeth, the black keyline, the gold trim
  const RESERVE = TOOTH.depth + KEY + TRIM + 2; // kept clear of the teeth on the page-facing edge

  const $ = (id) => document.getElementById(id);
  const state = { screen: 'desktop', page: 'shop', url: '' };
  const frame = $('frame'), face = frame.querySelector('.face'), trim = frame.querySelector('.trim');

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
  const place = (el, x, y, w, h) => Object.assign(el.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });

  function layout() {
    const phone = state.screen === 'phone', g = L[state.screen];
    const W = frame.clientWidth, H = frame.clientHeight;
    if (!W || !H) return;
    frame.style.clipPath = teeth(W, H, phone, 0);
    trim.style.clipPath = teeth(W, H, phone, KEY);
    face.style.clipPath = teeth(W, H, phone, KEY + TRIM);
    // the room inside the teeth, and the scale: as big as fits across, or down at the least height
    const x0 = phone ? 0 : RESERVE, aw = W - x0, ah = (phone ? H - RESERVE : H);
    const u = Math.min(aw / g.w, ah / (g.tick + g.minArt + g.crawl));
    const extra = aw - g.w * u;                         // spare width, shared out between the pieces
    const X = (x, spread = 0) => x0 + x * u + extra * spread;
    const top = g.tick * u;                              // where the artwork hangs from
    const crawlTop = ah - g.crawl * u;                   // where it stands
    const Y = (y) => top + y * u;

    const tk = face.querySelector('.ticker'), cr = face.querySelector('.crawl');
    Object.assign(tk.style, { left: x0 + 'px', height: g.tick * u + 'px', fontSize: g.tickFont * u + 'px', lineHeight: g.tick * u + 'px' });
    Object.assign(cr.style, { left: x0 + 'px', bottom: (H - ah) + 'px', height: g.crawl * u + 'px', fontSize: g.crawlFont * u + 'px', lineHeight: g.crawl * u + 'px' });

    const t = g.type, type = $('type');
    type.src = IMG[t.src];
    place(type, X(t.x, t.spread), Y(t.y), t.w * u, t.h * u);

    // the monument: globe, then the column under it, its shaft stretched down to the crawl
    const m = g.mon, k = m.k * u, mx = X(m.x, 1), my = Y(m.y);
    place($('globe'), mx, my, MON.globe * k, MON.globe * k);
    const capTop = my + MON.capY * k, capL = mx + MON.capX * k, colW = MON.colW * k;
    place($('cap'), capL, capTop, colW, MON.capH * k);
    const baseTop = Math.max(capTop + MON.capH * k + 4, crawlTop - MON.baseH * k + 2);
    place($('base'), capL, baseTop, colW, MON.baseH * k);
    place($('shaft'), capL, capTop + MON.capH * k - 2, colW, baseTop - (capTop + MON.capH * k) + 4);
    const gl = g.glow, gcx = mx + (MON.globe / 2) * k, gcy = my + (MON.globe / 2) * k;
    place($('glow'), gcx - gl.rx * u, gcy - gl.ry * u, gl.rx * 2 * u, gl.ry * 2 * u);
    const s = g.sticker;
    place($('sticker'), mx + s.dx * k, my + s.dy * k, 187 * s.s * k, 188 * s.s * k);

    const c = g.card, card = $('card');
    Object.assign(card.style, { left: X(c.x, c.spread) + 'px', top: Y(c.y) + 'px', transform: `scale(${c.s * u}) rotate(${c.r}deg)` });

    if (!phone) {
      // the burst and the strips stand on the crawl; in a window too short for the burst to clear the
      // card (and its 70%), it sits this one out
      const w = g.wow, cardBottom = Y(c.y) + (306 + 60) * c.s * u, wowTop = crawlTop + w.fromCrawl * u;
      place($('wow'), X(w.x), wowTop, w.w * u, w.h * u);
      $('wow').style.visibility = wowTop >= cardBottom ? '' : 'hidden';
      const cx = x0 + aw / 2, span = Math.hypot(W, H) * 1.4;
      for (const st of g.strips) {
        const el = $(st.id), h = st.h * u;
        place(el, cx - span / 2, crawlTop + st.fromCrawl * u - h / 2, span, h);
        Object.assign(el.style, { fontSize: (st.cap / 0.72) * u + 'px', paddingLeft: st.dx * 2 * u + 'px', transform: 'rotate(-6deg)' });
        if (st.id === 'strip') el.style.boxShadow = `inset 0 ${4 * u}px 0 rgba(170,158,0,0.6), inset 0 ${-4 * u}px 0 rgba(170,158,0,0.6), ${11 * u}px ${11 * u}px 0 var(--hard)`;
      }
    }
  }

  function fitPhone() {
    const s = Math.min(1, (innerHeight - 90) / 844, (innerWidth - 40) / 390);
    $('view').style.transform = state.screen === 'phone' ? `translate(-50%, -50%) scale(${s})` : '';
  }

  // Show the banner only when its pieces and type are ready, after the page underneath has had
  // its turn, then slide it in.
  let showing = 0;
  async function show() {
    const ticket = ++showing;
    frame.classList.remove('in');
    layout();
    const pics = [...face.querySelectorAll('img')].map((i) => i.decode().catch(() => {}));
    const type = ['300 56px "TOE Antonio"', '600 41px "TOE Antonio"', '112px "TOE Black"', 'italic 700 50px "TOE Arimo"'].map((f) => document.fonts.load(f).catch(() => {}));
    const settled = new Promise((r) => {
      const f = $('site');
      let done = false; const go = () => { if (!done) { done = true; r(); } };
      if (f.contentDocument && f.contentDocument.readyState === 'complete') go(); else f.addEventListener('load', go, { once: true });
      setTimeout(go, 1500); // a slow page does not keep the banner waiting for ever
    });
    await Promise.all([...pics, ...type, settled]);
    await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 400 }) : setTimeout(r, 50)));
    if (ticket !== showing) return;
    layout();
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
  addEventListener('resize', () => { fitPhone(); layout(); });

  render();
  show();
</script>
'''

js = lambda s: s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('</', '<\\/')
page = PAGE
for k, v in {'__F_ANTONIO_LIGHT__': FONT['antonio-light'], '__F_ANTONIO_SEMIBOLD__': FONT['antonio-semibold'],
             '__F_ARCHIVO_BLACK__': FONT['archivo-black'], '__F_ARIMO__': FONT['arimo-bold-italic'],
             '__I_SHAFT__': IMG['shaft'], '__I_CAP__': IMG['cap'], '__I_BASE__': IMG['base'], '__I_GLOBE__': IMG['globe'],
             '__I_STICKER__': IMG['sticker'], '__I_WOW__': IMG['wow'],
             '__I_TYPE_DESKTOP__': IMG['typeDesktop'], '__I_TYPE_PHONE__': IMG['typePhone'],
             '__SHOP_SRCDOC__': html.escape(PAGES['shop'], quote=True),
             '__TICKER__': html.escape(TICKER * 4), '__CRAWL__': html.escape(CRAWL * 12),
             '__SHOP_JSON__': js(PAGES['shop']), '__NEWS_JSON__': js(PAGES['news'])}.items():
    page = page.replace(k, v)

# channel.html is the file to download and open; channel-artifact.html is the same page without
# the document skeleton, which the artifact host adds itself.
with open(os.path.join(OUT_DIR, 'channel.html'), 'w', encoding='utf-8') as f:
    f.write('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + page.replace('<div id="view">', '</head>\n<body>\n<div id="view">', 1) + '</body>\n</html>\n')
with open(os.path.join(OUT_DIR, 'channel-artifact.html'), 'w', encoding='utf-8') as f:
    f.write(page)
print(os.path.join(OUT_DIR, 'channel.html'), round(os.path.getsize(os.path.join(OUT_DIR, 'channel.html')) / 1e6, 2), 'MB')
