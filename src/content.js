// 30% Off EVERYTHING
//
// On Black Friday, by the visitor's own calendar, a sale banner covers the right-hand 30% of
// every page (the top third on narrow screens). On every other day this script does nothing.
(() => {
  const TAG = "thirty-off-everything";

  // Black Friday is the day after US Thanksgiving, the fourth Thursday of November. That
  // Thursday always falls on the 22nd to 28th, so Black Friday is the one Friday on the 23rd
  // to 29th. Local date on purpose: the UTC date is wrong for most of the world for part of it.
  const isBlackFriday = (d) => d.getMonth() === 10 && d.getDay() === 5 && d.getDate() >= 23 && d.getDate() <= 29;

  const TICKER = "But wait… there’s less! ✦ No purchase necessary! ✦ Black Friday only! ✦ Every website, 30% off! ✦ Works like magic! ✦ ";
  const CRAWL = "BLACK FRIDAY ONLY! ✦ ";
  const BRAND = "Brought to you by Gary Mustard Enterprises";

  // The layout, in the artwork's own pixels ("banner px"). The banner is drawn at whatever scale
  // fits the frame across; spare height lengthens the column, and in a tall frame brings the globe
  // down (to halfway at most) with the lettering spreading out above it.
  const LAYOUT = {
    wide: {
      w: 1080, tick: 84, tickFont: 56, crawl: 150, crawlFont: 112, minArt: 1800,
      type: { x: 198, y: 38, w: 706, h: 522, src: "type-top" },
      type2: { x: 97, y: 615, w: 895, h: 349, src: "type-mid" },
      globe: { x: 516, y: 972, k: 1 },
      card: { x: 80, y: 1052, s: 1, spread: 0 },
      strip: { fromCrawl: -232, h: 126, cap: 54, dx: 12 },
      sub: { fromCrawl: -130, h: 68, cap: 25, dx: 0 },
      glow: { rx: 648, ry: 729 },
    },
    narrow: {
      w: 1170, tick: 70, tickFont: 46, crawl: 90, crawlFont: 66, minArt: 560,
      type: { x: 39, y: 27, w: 594, h: 577, src: "type-phone" },
      globe: { x: 780, y: -15, k: 320 / 384 },
      card: { x: 584, y: 384, s: 0.56, spread: 0.5 },
      glow: { rx: 538, ry: 517 },
    },
  };
  // The globe and the pieces of its column, in banner px before scaling.
  const MONUMENT = { globe: 480, columnX: 40, capY: 410, columnW: 400, capH: 136, baseH: 144 };
  // The coupon edge facing the page, in CSS px: the teeth, the black keyline, the gold trim.
  const TOOTH = { period: 16, depth: 7 }, KEYLINE = 2, TRIM = 6, CLEAR = TOOTH.depth + KEYLINE + TRIM + 2;
  const SLANT = -6; // degrees, the two strips

  // The host covers the viewport and lets clicks through; .frame in banner.css is the solid
  // part. !important because for !important the shadow tree outranks the page's styles.
  const HOST_CSS = `
    :host { all: initial !important; position: fixed !important; inset: 0 !important; display: block !important;
            overflow: hidden !important; z-index: 2147483647 !important; pointer-events: none !important;
            background: transparent !important; border: 0 !important; margin: 0 !important; padding: 0 !important; }
    @media print { :host { display: none !important; } }`;

  const url = (path) => chrome.runtime.getURL(path);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const img = (cls, file) => `<img class="${cls}" alt="" src="${url(`images/${file}.webp`)}">`;
  const GLINT = 'M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z';
  const glints = `<svg viewBox="0 0 100 200" aria-hidden="true">
    <path class="tw" d="${GLINT}" transform="translate(22 62) scale(38)"/><path class="tw b" d="${GLINT}" transform="translate(66 132) scale(22)"/></svg>`;

  // The frame is hidden by its own style attribute, which applies at once, before the stylesheet
  // has loaded; it is shown only when everything in it is ready (see reveal).
  function html() {
    return `
      <link rel="stylesheet" href="${url("banner.css")}">
      <div class="frame" style="visibility: hidden" role="img" aria-label="30% off everything on the internet. Black Friday only!">
        <div class="trim"></div>
        <div class="face">
          <div class="glow"></div>
          <img class="type" alt=""><img class="type2" alt="">
          <div class="glints left">${glints}</div><div class="glints right">${glints}</div>
          ${img("shaft", "shaft")}${img("cap", "cap")}${img("base", "base")}${img("globe", still ? "globe-still" : "globe")}
          <div class="card"><div class="head">The Internet (All Of It)</div><div class="line">WAS: <s>100%</s></div><div class="line">NOW:</div><div class="big">70%</div></div>
          <div class="strip sub"><span>${BRAND}</span></div>
          <div class="strip tape"><span>EVERY SITE 30% OFF!</span></div>
          <div class="ticker"><span>${TICKER.repeat(4)}</span></div>
          <div class="crawl"><span>${CRAWL.repeat(12)}</span></div>
        </div>
      </div>`;
  }

  let host = null;
  let wanted = false;
  let appends = 0;
  let midnightTimer;

  // The typefaces, registered under names of our own so they never meet the page's.
  const FACES = [
    ["TOE Antonio", "antonio-light", { weight: "300" }],
    ["TOE Antonio", "antonio-semibold", { weight: "600" }],
    ["TOE Black", "archivo-black", {}],
    ["TOE Arimo", "arimo-bold-italic", { weight: "700", style: "italic" }],
  ];
  let fonts = null;
  function loadFonts() {
    fonts ??= Promise.all(FACES.map(([family, file, desc]) => {
      try {
        const face = new FontFace(family, `url(${url(`fonts/${file}.woff2`)})`, desc);
        document.fonts.add(face);
        return face.load().catch(() => {});
      } catch {}
    }));
    return fonts;
  }

  // A zigzag along the page-facing edge (the left of the side banner, the bottom of the strip),
  // `inset` px in from the tips.
  function teeth(w, h, narrow, inset) {
    const { period: p, depth: d } = TOOTH, points = [];
    if (narrow) {
      points.push("0 0", `${w}px 0`);
      for (let x = w; x > -p; x -= p) points.push(`${x}px ${h - inset}px`, `${x - p / 2}px ${h - inset - d}px`);
    } else {
      points.push(`${w}px 0`, `${w}px ${h}px`);
      for (let y = h; y > -p; y -= p) points.push(`${inset}px ${y}px`, `${inset + d}px ${y - p / 2}px`);
    }
    return `polygon(${points.join(", ")})`;
  }

  const place = (el, x, y, w, h) => Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });

  // Lay the banner out to fill its frame, whatever the window's shape.
  function layout(shadow) {
    const $ = (sel) => shadow.querySelector(sel);
    const frame = $(".frame"), face = $(".face");
    const narrow = matchMedia("(max-width: 768px)").matches;
    const g = LAYOUT[narrow ? "narrow" : "wide"];
    const W = frame.clientWidth, H = frame.clientHeight;
    if (!W || !H) return;
    frame.style.clipPath = teeth(W, H, narrow, 0);
    $(".trim").style.clipPath = teeth(W, H, narrow, KEYLINE);
    face.style.clipPath = teeth(W, H, narrow, KEYLINE + TRIM);

    // u: CSS px per banner px, as big as fits across (or down, in a short frame)
    const x0 = narrow ? 0 : CLEAR, aw = W - x0, ah = narrow ? H - CLEAR : H;
    const u = Math.min(aw / g.w, ah / (g.tick + g.minArt + g.crawl));
    const spareW = aw - g.w * u;
    const X = (x, spread = 0) => x0 + x * u + spareW * spread;
    const Y = (y) => (g.tick + y) * u;
    const crawlTop = ah - g.crawl * u;

    Object.assign($(".ticker").style, { left: `${x0}px`, height: `${g.tick * u}px`, fontSize: `${g.tickFont * u}px`, lineHeight: `${g.tick * u}px` });
    Object.assign($(".crawl").style, { left: `${x0}px`, bottom: `${H - ah}px`, height: `${g.crawl * u}px`, fontSize: `${g.crawlFont * u}px`, lineHeight: `${g.crawl * u}px` });

    // In a tall frame the globe and the card come down, the globe no lower than halfway, and the
    // lettering spreads out above them.
    const m = g.globe, k = m.k * u;
    const spare = narrow ? 0 : Math.max(0, ah - (g.tick + g.minArt + g.crawl) * u);
    const drop = Math.min(spare, Math.max(0, ah / 2 - (Y(m.y) + (MONUMENT.globe / 2) * k)));

    const type = $(".type"), type2 = $(".type2");
    type.src = url(`images/${g.type.src}.webp`);
    place(type, X(g.type.x, 0.5), Y(g.type.y) + drop * 0.25, g.type.w * u, g.type.h * u);
    type2.hidden = !g.type2;
    if (g.type2) {
      type2.src = url(`images/${g.type2.src}.webp`);
      place(type2, X(g.type2.x, 0.5), Y(g.type2.y) + drop * 0.55, g.type2.w * u, g.type2.h * u);
      // the glints either side of 30% OFF
      place($(".glints.left"), X(20, 0.5), Y(161) + drop * 0.25, 130 * u, 260 * u);
      place($(".glints.right"), X(936, 0.5), Y(161) + drop * 0.25, 130 * u, 260 * u);
    }

    // the globe, and its column standing on the bottom edge (the crawl runs over its base)
    const gx = X(m.x, 1), gy = Y(m.y) + drop, M = MONUMENT;
    place($(".globe"), gx, gy, M.globe * k, M.globe * k);
    const capTop = gy + M.capY * k, colX = gx + M.columnX * k, colW = M.columnW * k;
    const baseTop = Math.max(capTop + M.capH * k + 4, ah - M.baseH * k);
    place($(".cap"), colX, capTop, colW, M.capH * k);
    place($(".base"), colX, baseTop, colW, M.baseH * k);
    place($(".shaft"), colX, capTop + M.capH * k - 2, colW, baseTop - capTop - M.capH * k + 4);
    const cx = gx + (M.globe / 2) * k, cy = gy + (M.globe / 2) * k;
    place($(".glow"), cx - g.glow.rx * u, cy - g.glow.ry * u, g.glow.rx * 2 * u, g.glow.ry * 2 * u);

    const c = g.card;
    Object.assign($(".card").style, { left: `${X(c.x, c.spread)}px`, top: `${Y(c.y) + drop}px`, transform: `scale(${c.s * u}) rotate(-1.4deg)` });

    // the yellow tape and the navy one under it, at a slant across the lower part (wide only)
    if (!narrow) {
      const mid = x0 + aw / 2, length = Math.hypot(W, H) * 1.4;
      for (const [sel, st] of [[".strip.tape", g.strip], [".strip.sub", g.sub]]) {
        const el = $(sel), h = st.h * u;
        place(el, mid - length / 2, crawlTop + st.fromCrawl * u - h / 2, length, h);
        Object.assign(el.style, { fontSize: `${(st.cap / 0.72) * u}px`, paddingLeft: `${st.dx * 2 * u}px`, transform: `rotate(${SLANT}deg)` });
      }
      $(".strip.tape").style.boxShadow = `inset 0 ${4 * u}px 0 rgba(170, 158, 0, 0.6), inset 0 ${-4 * u}px 0 rgba(170, 158, 0, 0.6), ${11 * u}px ${11 * u}px 0 rgba(6, 8, 70, 0.9)`;
    }
  }

  // The page comes first: the banner waits for the page to finish loading (or two seconds after
  // its content is in, if it is slow), and for its own stylesheet, typefaces and pictures. Then it
  // is laid out and slides in. Until then nothing of it shows.
  function pageSettled() {
    if (document.readyState === "complete") return Promise.resolve();
    return new Promise((resolve) => {
      window.addEventListener("load", resolve, { once: true });
      const soon = () => setTimeout(resolve, 2000);
      if (document.readyState === "interactive") soon();
      else document.addEventListener("DOMContentLoaded", soon, { once: true });
    });
  }
  async function reveal(element, shadow) {
    const sheet = shadow.querySelector("link");
    await pageSettled();
    layout(shadow); // sets the lettering's pictures, so they can be decoded below
    await Promise.all([
      new Promise((resolve) => (sheet.sheet ? resolve() : (sheet.addEventListener("load", resolve, { once: true }), sheet.addEventListener("error", resolve, { once: true })))),
      loadFonts(),
      ...[...shadow.querySelectorAll("img")].map((i) => i.decode().catch(() => {})),
    ]);
    await new Promise((resolve) => (window.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 300 }) : setTimeout(resolve, 50)));
    if (element !== host) return; // taken down in the meantime
    const frame = shadow.querySelector(".frame");
    layout(shadow);
    frame.style.removeProperty("visibility");
    void frame.offsetWidth; // start the slide from where the stylesheet put it, off the edge
    frame.classList.add("in");
  }

  function createHost() {
    // createElementNS and a separate HTML parse keep this working on XHTML and XML pages.
    const element = document.createElementNS("http://www.w3.org/1999/xhtml", TAG);
    element.popover = "manual";
    const parsed = new DOMParser().parseFromString(`<style>${HOST_CSS}</style>${html()}`, "text/html");
    const shadow = element.attachShadow({ mode: "open" });
    shadow.append(...parsed.head.childNodes, ...parsed.body.childNodes);
    const refit = () => (element.isConnected ? layout(shadow) : observer.disconnect());
    const observer = new ResizeObserver(refit);
    observer.observe(shadow.querySelector(".frame"));
    reveal(element, shadow);
    return element;
  }

  // Make the page match `wanted`. Also runs whenever <html>'s children change, which is how it
  // waits for <body> at document_start and puts the banner back if a page removes it.
  function render() {
    if (wanted && extensionIsGone()) return destroy();
    if (!wanted) {
      keeper.disconnect();
      host?.remove();
      host = null;
      appends = 0;
      return;
    }
    keeper.observe(document, { childList: true });
    const root = document.documentElement;
    if (!(root instanceof HTMLHtmlElement)) return;
    keeper.observe(root, { childList: true });
    if (!document.body) return;
    host ??= createHost();
    if (host.parentNode !== root) {
      if (appends++ > 20) return; // the page removes it every time; stop fighting
      root.append(host);
    }
    // The top layer sits above every z-index on the page and ignores transforms on <html>.
    try {
      if (!host.matches(":popover-open")) host.showPopover();
    } catch {}
  }
  const keeper = new MutationObserver(render);

  // True once the extension has been disabled, removed or updated under this tab.
  function extensionIsGone() {
    try {
      return !chrome.runtime?.id;
    } catch {
      return true;
    }
  }

  function sync() {
    if (extensionIsGone()) return destroy();
    const now = new Date();
    wanted = isBlackFriday(now);
    render();
    // Look again just after the next local midnight, so tabs left open switch on and off.
    clearTimeout(midnightTimer);
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    midnightTimer = setTimeout(sync, midnight - now + 1000);
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") sync();
  }

  function destroy() {
    wanted = false;
    render();
    clearTimeout(midnightTimer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", sync);
  }

  // A copy left behind by an earlier version of the extension is replaced.
  for (const stale of document.querySelectorAll(TAG)) stale.remove();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", sync); // also fires when restored from the back/forward cache
  sync();
})();
