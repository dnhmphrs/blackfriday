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
  const RING = "EVERY SITE 30% OFF! ✦ WORKS LIKE MAGIC! ✦ NO PURCHASE NECESSARY! ✦ ";

  // The lettering is placed by its ink, from these measures of the banner's own typefaces (taken
  // once in Chromium; the faces never change), all per 1px of type: where each line's ink starts
  // and ends along it, the cap height, and the baseline's depth in a box of line-height 1. HEAD is
  // TOE Black at -0.05em, SUB TOE Arimo at -0.04em. Then the stamp's and the tag's boxes, and how
  // wide the navy tape's words run.
  const HEAD = { cap: 0.69, base: 0.835 }, SUB = { cap: 0.69, base: 0.8475 };
  const INK = { "30% OFF": [0.04, 4.547], "EVERYTHING ON": [0.015, 7.839], "THE INTERNET.": [0.07, 6.959],
                EVERYTHING: [0.015, 6.135], "ON THE": [0.045, 3.646], "INTERNET.": [0.015, 4.841] };
  const STAMP = { w: 9.48, h: 2.65 }, LABEL = { w: 12.69, h: 1.58 }, BRAND_W = 29.86;
  const inkW = (text) => INK[text][1] - INK[text][0];
  const TAN6 = Math.tan(Math.PI / 30), TAN9 = Math.tan(Math.PI / 20);
  // The coupon edge facing the page, in CSS px: the teeth, the black keyline, the gold trim.
  const TOOTH = { period: 16, depth: 7 }, KEYLINE = 2, TRIM = 6, CLEAR = TOOTH.depth + KEYLINE + TRIM + 2;

  // The host covers the viewport and lets clicks through; .frame in banner.css is the solid
  // part. !important because for !important the shadow tree outranks the page's styles.
  const HOST_CSS = `
    :host { all: initial !important; position: fixed !important; inset: 0 !important; display: block !important;
            overflow: hidden !important; z-index: 2147483647 !important; pointer-events: none !important;
            background: transparent !important; border: 0 !important; margin: 0 !important; padding: 0 !important; }
    @media print { :host { display: none !important; } }`;

  const url = (path) => chrome.runtime.getURL(path);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GRAIN_GAIN = 0.7; // how bright the specks of static are
  const GLINT = '<svg viewBox="-1 -1 2 2" aria-hidden="true"><path d="M0,-1 C0.06,-0.22 0.22,-0.06 1,0 C0.22,0.06 0.06,0.22 0,1 C-0.06,0.22 -0.22,0.06 -1,0 C-0.22,-0.06 -0.06,-0.22 0,-1Z"/></svg>';

  // The badge, each layer drawn in a box 224 across for a radius of 100: a red 16-point burst behind a
  // yellow 30-point one, each over a navy shadow of itself, turning opposite ways (banner.css); the
  // words round the yellow one's rim, a hair short of once round (see reveal); the plate the globe
  // sits on.
  const star = (n, outer, inner, turn = 0) => Array.from({ length: n * 2 }, (_, i) => {
    const a = ((i + turn) * Math.PI) / n - Math.PI / 2, r = i % 2 ? inner : outer;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  const RED = star(16, 108, 80, 0.5), YELLOW = star(30, 97, 86), RIM = 73.5;
  const layer = (cls, inside) => `<svg class="burst ${cls}" viewBox="-112 -112 224 224" aria-hidden="true">${inside}</svg>`;
  const BADGE = [
    layer("red shadow", `<polygon points="${RED}" fill="#0a0f66" opacity="0.92"/>`),
    layer("red", `<polygon points="${RED}" fill="#ff1616" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/>`),
    layer("yellow shadow", `<polygon points="${YELLOW}" fill="#0a0f66" opacity="0.7"/>`),
    layer("yellow", `<defs><radialGradient id="gold" r="0.9"><stop offset="0.6" stop-color="#fffb86"/><stop offset="1" stop-color="#f6d80c"/></radialGradient>
      <path id="rim" d="M ${-RIM} 0 A ${RIM} ${RIM} 0 1 1 ${RIM} 0 A ${RIM} ${RIM} 0 1 1 ${-RIM} 0"/></defs>
      <polygon points="${YELLOW}" fill="url(#gold)" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/>
      <text font-size="9.5"><textPath href="#rim">${RING}</textPath></text>`),
    layer("plate", `<radialGradient id="plate" cx="0.42" cy="0.36" r="0.75"><stop offset="0" stop-color="#3aa6ff"/><stop offset="0.45" stop-color="#1550ee"/><stop offset="1" stop-color="#071090"/></radialGradient>
      <circle r="68.5" fill="#000"/><circle r="67.2" fill="#fff"/><circle r="64.8" fill="url(#plate)"/>`),
  ].join("");

  // The look of a worn tape on a tube, as an SVG filter over the banner's face (.tube), after
  // marketing/vhs.py. The picture's brightness goes soft, then over-sharp, as a VCR leaves it; its
  // colour is smeared and arrives late, to the right and low; blotches of colour noise and a fine
  // streaky white static crawl over it, a few changes a second; the bright parts glow; black is lifted. layout() sets the
  // distances to suit the banner's size. Faint scanlines and dark corners are added in banner.css.
  const LUMA = "0.299 0.587 0.114 0 0";
  // noise: blotches of colour, as a shift about mid grey (two slow channels, the I and Q of a TV signal) ...
  const tint = (i, q) => `${i * 0.22} ${q * 0.2} 0 0 ${0.5 - 0.5 * (i * 0.22 + q * 0.2)}`;
  const MOTTLE = `${tint(0.956, 0.621)}  ${tint(-0.272, -0.647)}  ${tint(-1.106, 1.703)}  0 0 0 0 1`;
  // ... and static: only the brightest part of a fast channel shows, so the specks are white and scattered, as static is
  const GRAIN = `${`${GRAIN_GAIN} 0 0 0 ${-0.57 * GRAIN_GAIN}  `.repeat(3)} 0 0 0 0 1`;
  const crawl = (seeds, dur) => (still ? "" : `<animate attributeName="seed" values="${seeds}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>`);
  const add = (extra = "") => `operator="arithmetic" k2="1" k3="1" k4="-0.5" ${extra}`; // a + (b - mid grey)
  const TAPE = `
    <svg class="defs" width="0" height="0" aria-hidden="true">
      <filter id="tape" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
        <feFlood flood-color="#0a22d6"/>
        <feMerge result="picture"><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>

        <feGaussianBlur class="soft" in="picture"/>
        <feColorMatrix type="matrix" values="${LUMA} ${LUMA} ${LUMA} 0 0 0 1 0" result="luma"/>
        <feGaussianBlur class="halo"/>
        <feComposite in="luma" operator="arithmetic" k2="1.42" k3="-0.42" result="sharp"/>

        <feGaussianBlur class="smear" in="picture"/>
        <feOffset class="late"/>
        <feColorMatrix type="matrix" values="0.393 -0.329 -0.064 0 0.5  -0.167 0.231 -0.064 0 0.5  -0.167 -0.329 0.496 0 0.5  0 0 0 1 0"/>
        <feComposite in2="sharp" operator="arithmetic" k2="2" k3="1" k4="-1" result="clean"/>

        <feTurbulence type="fractalNoise" baseFrequency="0.042 0.167" numOctaves="1" seed="3">${crawl("3;11;7;19;5;13", 2)}</feTurbulence>
        <feColorMatrix type="matrix" values="${MOTTLE}"/>
        <feComposite in2="clean" ${add('result="mottled"')}/>
        <feTurbulence type="fractalNoise" baseFrequency="0.19 0.71" numOctaves="2" seed="2">${crawl("2;17;9;23;4;29", 1)}</feTurbulence>
        <feColorMatrix type="matrix" values="${GRAIN}"/>
        <feComposite in2="mottled" operator="arithmetic" k2="1" k3="1" result="taped"/>

        <feComponentTransfer><feFuncR type="linear" intercept="-0.55"/><feFuncG type="linear" intercept="-0.55"/><feFuncB type="linear" intercept="-0.55"/></feComponentTransfer>
        <feGaussianBlur class="bloom"/>
        <feComposite in2="taped" operator="arithmetic" k2="0.149" k3="0.93" k4="0.037"/>
      </filter>
    </svg>`;

  // The frame is hidden by its own style attribute, which applies at once, before the stylesheet
  // has loaded; it is shown only when everything in it is ready (see reveal). It reads left to
  // right and in English whatever the page does (a right-to-left page would run the tickers off
  // the wrong way).
  function html() {
    return `
      <link rel="stylesheet" href="${url("banner.css")}">
      <div class="frame" dir="ltr" lang="en" style="visibility: hidden" role="img" aria-label="30% off everything on the internet. Black Friday only!">
        <div class="trim"></div>
        <div class="face">
          <div class="tube">
            <div class="tiles"></div><div class="rays"></div><div class="glow"></div>
            ${BADGE}
            <img class="globe" alt="" src="${url(`images/${still ? "globe-still" : "globe"}.webp`)}">
            <div class="glint one">${GLINT}</div><div class="glint two">${GLINT}</div>
            <div class="sticker"><div class="head">30% OFF</div></div>
            <div class="card"><div class="hd">The Internet (All Of It)</div><div class="ln">WAS: <s>100%</s></div><div class="ln">NOW:</div><div class="big">70%</div></div>
            <div class="stamp"><span class="a">But wait…</span><span class="b">THERE’S LESS!</span></div>
            <div class="caption"></div><div class="caption"></div><div class="caption"></div>
            <div class="tag">BLACK FRIDAY ONLY!</div>
            <div class="cards"><i class="c1"><b>FREE</b></i><i class="c2"><b>Gratis</b></i><i class="c3"><b>$0.00</b></i><i class="c4"><b>NO CHARGE</b></i></div>
            <div class="strip sub"><span>${BRAND}</span></div>
            <div class="strip tape"><span>EVERY SITE 30% OFF!</span></div>
            <div class="ticker"><span>${TICKER.repeat(4)}</span></div>
            <div class="crawl"><span>${CRAWL.repeat(12)}</span></div>
          </div>
          <div class="lines"></div>
        </div>
        ${TAPE}
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
    ["TOE Tinos", "tinos-bold-italic", { weight: "700", style: "italic" }],
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

  const px = (n) => `${n}px`;
  const place = (el, x, y, w, h) => Object.assign(el.style, { left: px(x), top: px(y), width: px(w), height: px(h) });
  const at = (el, x, y, size) => Object.assign(el.style, { left: px(x), top: px(y), fontSize: px(size) });

  // Lay the banner out to fill its frame, whatever the window's shape: a column down the side (the
  // badge as large as the width allows, the words under it, the four cards if there is height to
  // spare, the tapes over the crawl), or a strip across the top (the badge at the left, the words
  // beside it, in a long strip the price card at the right).
  function layout(shadow) {
    const $ = (sel) => shadow.querySelector(sel);
    const frame = $(".frame"), face = $(".face");
    const narrow = matchMedia("(max-width: 768px)").matches;
    const W = frame.clientWidth, H = frame.clientHeight;
    if (!W || !H) return;
    frame.style.clipPath = teeth(W, H, narrow, 0);
    $(".trim").style.clipPath = teeth(W, H, narrow, KEYLINE);
    face.style.clipPath = teeth(W, H, narrow, KEYLINE + TRIM);

    // The face, less a strip clear of the teeth (at the left of the column, the bottom of the
    // strip); u: CSS px per banner px, as big as fits across (or down, in a short frame).
    const X0 = narrow ? 0 : CLEAR, Y1 = narrow ? H - CLEAR : H, FW = W - X0;
    const u = narrow ? Math.min(FW / 1170, Y1 / 720) : Math.min(FW / 1080, Y1 / 1900);
    const tick = (narrow ? 70 : 84) * u, crawlH = (narrow ? 90 : 150) * u;

    // the tape filter's distances, in step with the banner's size
    const s = 1.1 * u;
    $(".soft").setAttribute("stdDeviation", `${1.25 * s} ${0.5 * s}`);
    $(".halo").setAttribute("stdDeviation", `${5 * s} ${0.6 * s}`);
    $(".smear").setAttribute("stdDeviation", `${10 * s} ${1.6 * s}`);
    $(".late").setAttribute("dx", 7 * s); $(".late").setAttribute("dy", 1.7 * s);
    $(".bloom").setAttribute("stdDeviation", 14 * s);

    place($(".tiles"), -0.3 * W, -0.3 * H, 1.6 * W, 1.6 * H);
    $(".tiles").style.backgroundSize = `${364 * u}px ${313.6 * u}px`;
    Object.assign($(".ticker").style, { left: px(X0), height: px(tick), fontSize: px(0.66 * tick), lineHeight: px(tick) });
    Object.assign($(".crawl").style, { left: px(X0), top: px(Y1 - crawlH), height: px(crawlH), fontSize: px(0.75 * crawlH), lineHeight: px(crawlH) });

    // the badge, radius R round (cx, cy): the burst, the globe on its plate, the glow behind and
    // the rays turning round it across the whole face
    const badge = (cx, cy, R) => {
      for (const el of shadow.querySelectorAll(".burst")) place(el, cx - 1.12 * R, cy - 1.12 * R, 2.24 * R, 2.24 * R).fontSize = px(R);
      const k = (1.26 * R) / 374; // the globe picture: 480 across, the globe 374 across, its middle at (240, 234)
      place($(".globe"), cx - 240 * k, cy - 234 * k, 480 * k, 480 * k);
      place($(".glow"), cx - 1.5 * R, cy - 1.5 * R, 3 * R, 3 * R);
      const d = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy));
      place($(".rays"), cx - d, cy - d, 2 * d, 2 * d);
    };
    const glint = (sel, cx, cy, r) => { $(sel).hidden = !r; place($(sel), cx - r, cy - r, 2 * r, 2 * r); };
    // 30% OFF on its red sticker, w across, centred at (cx, cy)
    const sticker = (cx, cy, w) => {
      const ink = inkW("30% OFF") + HEAD.cap * TAN9, size = (w * 0.84) / ink, pad = HEAD.cap * size * 0.3, h = HEAD.cap * size + 2 * pad;
      place($(".sticker"), cx - w / 2, cy - h / 2, w, h).fontSize = px(size);
      set($(".sticker .head"), "30% OFF", HEAD, size, (w - ink * size) / 2 - size * 0.05, pad + HEAD.cap * size);
    };
    // a line of type with its ink's left edge at x and its baseline at y
    const set = (el, text, type, size, x, y) => { el.textContent = text; at(el, x - INK[text][0] * size, y - type.base * size, size); };
    // BUT WAIT… THERE'S LESS!, f its type size, centred at (cx, cy), at a tilt
    const stamp = (f, cx, cy, turn) => at($(".stamp"), cx - (STAMP.w * f) / 2, cy - (STAMP.h * f) / 2, f).setProperty("--turn", `${turn}deg`);
    // EVERYTHING ON THE INTERNET., its ink centred on cx, the first cap line's top at y; returns the last baseline
    const caption = (lines, size, cx, y) => {
      shadow.querySelectorAll(".caption").forEach((el, i) => {
        if ((el.hidden = i >= lines.length)) return;
        y += SUB.cap * size * (i ? 1.34 : 1);
        set(el, lines[i], SUB, size, cx - (inkW(lines[i]) * size) / 2, y);
      });
      return y;
    };
    const label = (f, cx, y) => at($(".tag"), cx - (LABEL.w * f) / 2, y, f);
    const cards = $(".cards"), card = $(".card"), tapes = [$(".strip.tape"), $(".strip.sub")];

    if (!narrow) {
      // The yellow tape and the navy one under it are fixed over the crawl; the badge is as large
      // as fits between the ticker and them, with the words (shrunk a little if need be) under it,
      // and the four cards under those if there is room for them as well.
      const crawlTop = Y1 - crawlH, tapeH = 126 * u, subH = 68 * u, tapeC = crawlTop - 232 * u, subC = crawlTop - 130 * u;
      const m = Math.max(8, 40 * u), cx = X0 + FW / 2, top = tick + 18 * u, gap = 34 * u;
      const floor = (half) => tapeC - tapeH / 2 - half * TAN6 - 22 * u; // the lowest a thing `half` wide either side may come, over the tape
      const lines = ["EVERYTHING ON", "THE INTERNET."];
      const ss0 = ((FW - 2 * m) * 0.95) / Math.max(...lines.map(inkW)), tf0 = ((FW - 2 * m) * 0.66) / LABEL.w;
      const words = (k) => (2.34 * SUB.cap * ss0 + 26 * u + tf0 * LABEL.h) * k;
      const cardsW = (FW - 2 * m) * 0.9, cardsH = (62 * cardsW) / 436;
      // from the badge's top (the stamp, 1.1 R over its middle) to the rays' tips (0.86 R under)
      const room = (k, withCards) => floor(withCards ? cardsW / 2 : (tf0 * k * LABEL.w) / 2) - top - words(k) - gap - (withCards ? cardsH + 2 * gap : 0);
      const Rmax = (FW - 0.8 * m) / 2.2;
      let k = 1, withCards = true, R = room(1, true) / 1.96;
      if (R < Rmax * 0.97) { withCards = false; R = room(1, false) / 1.96; }
      for (const kk of [0.9, 0.8, 0.72]) if (R < Rmax * 0.82) { k = kk; R = room(k, false) / 1.96; }
      R = Math.min(R, Rmax);
      const ss = ss0 * k, tf = tf0 * k, spare = Math.max(0, room(k, withCards) - R * 1.96);
      const cy = top + spare * 0.3 + R * 1.1;
      badge(cx, cy, R);
      glint(".glint.one", cx - R * 0.98, cy - R * 0.74, R * 0.15);
      glint(".glint.two", cx + R, cy + R * 0.7, R * 0.09);
      sticker(cx, cy + R * 0.06, Math.min(R * 2.12, FW - m * 0.5));
      stamp(R * 0.125, Math.min(cx + R * 0.8, W - m * 0.4 - STAMP.w * R * 0.125 * 0.52), cy - R * 0.86, 11);
      const y = caption(lines, ss, cx, cy + R * 0.86 + gap + spare * 0.3) + 26 * u * k;
      label(tf, cx, y);
      if (!(cards.hidden = !withCards)) Object.assign(cards.style, { left: px(cx - cardsW / 2), top: px(y + tf * LABEL.h + gap + spare * 0.2), transform: `scale(${cardsW / 436})` });
      card.hidden = true;

      const length = Math.hypot(W, H) * 1.4;
      let subFont = (25 / 0.72) * u;
      if (BRAND_W * subFont > (FW - m) / Math.cos(0.105)) subFont = (FW - m) / BRAND_W;
      place(tapes[1], cx - length / 2, subC - subH / 2, length, subH).fontSize = px(subFont);
      Object.assign(place(tapes[0], cx - length / 2, tapeC - tapeH / 2, length, tapeH), { fontSize: px((54 / 0.72) * u), paddingLeft: px(24 * u),
        boxShadow: `inset 0 ${4 * u}px 0 rgba(170, 158, 0, 0.6), inset 0 ${-4 * u}px 0 rgba(170, 158, 0, 0.6), ${11 * u}px ${11 * u}px 0 rgba(6, 8, 70, 0.9)` });
      for (const t of tapes) t.hidden = false;
    } else {
      // the badge as tall as goes between the ticker and the crawl, the words as large as fit beside it
      const top = tick, mid = Y1 - crawlH - top, m = Math.max(8, 36 * u);
      const R = Math.min(mid / 2.06, FW * 0.27), cx = X0 + m * 0.6 + R * 1.1, cy = top + mid / 2 + R * 0.02;
      badge(cx, cy, R);
      glint(".glint.one", 0, 0, 0);
      glint(".glint.two", cx + R * 1.02, cy + R * 0.7, R * 0.11);
      sticker(cx, cy + R * 0.04, R * 2.2);
      let right = W - m;
      const left = cx + R * 1.12 + m * 0.5, cs = Math.min((mid * 0.8) / 360, 0.7), cardW = 420 * cs;
      if (!(card.hidden = right - left - cardW - m <= 1.35 * mid)) {
        Object.assign(card.style, { left: px(right - cardW + 6 * cs), top: px(top + (mid - 360 * cs) / 2 + 10 * cs), transform: `scale(${cs}) rotate(-2.4deg)` });
        right -= cardW + m;
      }
      // the stamp, the caption in two lines (or broken shorter, where that sets it much larger) and the tag
      const colW = right - left, ccx = (left + right) / 2;
      const fit = (lines) => ({ lines, ss: (colW * 0.96) / Math.max(...lines.map(inkW)) });
      const parts = ({ lines, ss }) => {
        const fs = Math.min(ss * 0.72, (colW * 0.86) / STAMP.w), tf = Math.min(ss * 0.66, (colW * 0.92) / LABEL.w);
        return { lines, ss, fs, tf, h: STAMP.h * fs + ss * 0.42 + SUB.cap * ss * (lines.length * 1.34 - 0.34) + ss * 0.5 + tf * LABEL.h };
      };
      const shrink = (q) => (q.h > mid * 0.94 ? parts({ lines: q.lines, ss: (q.ss * mid * 0.94) / q.h }) : q);
      let q = parts(fit(["EVERYTHING ON", "THE INTERNET."]));
      const tall = fit(["EVERYTHING", "ON THE", "INTERNET."]);
      if (tall.ss > q.ss * 1.15) { const q3 = shrink(parts(tall)); if (q3.ss >= q.ss * 1.12) q = q3; }
      q = shrink(q);
      const y = top + (mid - q.h) / 2;
      stamp(q.fs, ccx + colW * 0.06, y + (STAMP.h * q.fs) / 2, 5);
      label(q.tf, ccx, caption(q.lines, q.ss, ccx, y + STAMP.h * q.fs + q.ss * 0.42) + q.ss * 0.5);
      cards.hidden = true;
      for (const t of tapes) t.hidden = true;
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
    await Promise.all([
      new Promise((resolve) => (sheet.sheet ? resolve() : (sheet.addEventListener("load", resolve, { once: true }), sheet.addEventListener("error", resolve, { once: true })))),
      loadFonts(),
      ...[...shadow.querySelectorAll("img")].map((i) => i.decode().catch(() => {})),
      Object.assign(new Image(), { src: url("images/tile.webp") }).decode().catch(() => {}), // the faint marks, a background in banner.css
    ]);
    await new Promise((resolve) => (window.requestIdleCallback ? requestIdleCallback(resolve, { timeout: 300 }) : setTimeout(resolve, 50)));
    if (element !== host) return; // taken down in the meantime
    const frame = shadow.querySelector(".frame");
    layout(shadow);
    // The last ✦ round the badge's rim is drawn in whatever face the computer has for it; if that
    // runs it off the end of the circle, set the words a little smaller.
    const ring = shadow.querySelector(".burst text"), on = () => { try { return ring.getExtentOfChar(RING.length - 2).width > 0; } catch { return true; } };
    for (let i = 1; i < 12 && !on(); i++) ring.setAttribute("font-size", 9.5 * 0.975 ** i);
    frame.style.removeProperty("visibility");
    void frame.offsetWidth; // start the slide from where the stylesheet put it, off the edge
    frame.classList.add("in");
    settleLook(element, shadow);
  }

  // The tape look costs next to nothing on a graphics card and a great deal without one (a remote
  // desktop, a virtual machine, an old laptop). So once the banner is in, see how fast the page is
  // drawing: if it is slow, take the look off; and if that made no difference, the page is slow by
  // itself, so put it back.
  const SLOW = 24; // frames a second
  // Frames a second over about two seconds of the tab drawing. A gap of over a second between
  // frames is the tab out of view, not a slow frame.
  const frameRate = () => new Promise((resolve) => {
    let frames = 0, drawing = 0, last = 0;
    const tick = (now) => {
      const gap = now - last;
      if (last && gap < 1000) { frames++; drawing += gap; }
      last = now;
      if (drawing < 2000) requestAnimationFrame(tick);
      else resolve((frames * 1000) / drawing);
    };
    requestAnimationFrame(tick);
  });
  async function settleLook(element, shadow) {
    if (still) return; // nothing moves, so nothing is redrawn
    const tube = shadow.querySelector(".tube");
    await new Promise((resolve) => setTimeout(resolve, 1200)); // let the slide in, and the page's own start, pass
    const withLook = await frameRate();
    if (element !== host || withLook >= SLOW) return;
    tube.style.filter = "none";
    const without = await frameRate();
    if (element === host && without < withLook * 1.5) tube.style.removeProperty("filter");
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
