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

  const FONTS = [
    ["TOE Black", "fonts/archivo-black.woff2", {}],
    ["TOE Arimo", "fonts/arimo-bold-italic.woff2", { weight: "700", style: "italic" }],
    ["TOE Antonio", "fonts/antonio-light.woff2", { weight: "300" }],
    ["TOE Antonio", "fonts/antonio-semibold.woff2", { weight: "600" }],
    ["TOE Tinos", "fonts/tinos-bold-italic.woff2", { weight: "700", style: "italic" }],
  ];
  const SCROLL = "But wait… there’s less! ✦ No purchase necessary! ✦ Black Friday only! ✦ Every website, 30% off! ✦ Works like magic! ✦ ";
  const CRAWL = "BLACK FRIDAY ONLY ! ✦ ";

  // The host covers the viewport and lets clicks through; .frame in banner.css is the solid
  // part. !important because for !important the shadow tree outranks the page's styles.
  const HOST_CSS = `
    :host { all: initial !important; position: fixed !important; inset: 0 !important; display: block !important;
            overflow: hidden !important; z-index: 2147483647 !important; pointer-events: none !important; }
    @media print { :host { display: none !important; } }`;

  const url = (path) => chrome.runtime.getURL(path);
  const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function html() {
    return `
      <link rel="stylesheet" href="${url("banner.css")}">
      <div class="frame" role="img" aria-label="World Wide Sale: 30% off the entire internet. Black Friday only.">
        <div class="sheet">
          <div class="glow"></div>
          <div class="strip"><span>${SCROLL.repeat(6)}</span></div>
          <img class="bug" alt="" src="${url("images/gme-white.webp")}">
          <div class="title"><b>World Wide</b> <b>Sale</b></div>
          <div class="pill">Black Friday</div>
          <div class="oval"><span>As Seen On<br>Every Website</span></div>
          <div class="offer">
            <div class="pct">30%</div>
            <div class="row"><span class="off">OFF</span><span class="what">THE ENTIRE<br>INTERNET !</span></div>
          </div>
          <div class="cards"><i class="c1"><b>FREE</b></i><i class="c2"><b>Gratis</b></i><i class="c3"><b>$0.00</b></i><i class="c4"><b>NO CHARGE</b></i></div>
          <div class="plinth"><img alt="" src="${url("images/gme-navy.webp")}"></div>
          <img class="hero" alt="" src="${url(still() ? "images/globe-still.webp" : "images/globe.webp")}">
          <i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i>
          <div class="price">
            <div class="head">The Internet (All Of It)</div>
            <div class="line">WAS: <s>100%</s></div>
            <div class="line">NOW:</div>
            <div class="big">70%</div>
          </div>
        </div>
        <div class="foot"><div class="sheet"><div class="crawl"><span>${CRAWL.repeat(12)}</span></div></div></div>
      </div>`;
  }

  let host = null;
  let wanted = false;
  let appends = 0;
  let midnightTimer;
  let fontsAdded = false;

  function addFonts() {
    if (fontsAdded) return;
    fontsAdded = true;
    for (const [family, file, descriptors] of FONTS) {
      try {
        const face = new FontFace(family, `url(${url(file)})`, descriptors);
        document.fonts.add(face);
        face.load().catch(() => {});
      } catch {}
    }
  }

  function createHost() {
    // createElementNS and a separate HTML parse keep this working on XHTML and XML pages.
    const element = document.createElementNS("http://www.w3.org/1999/xhtml", TAG);
    element.popover = "manual";
    const parsed = new DOMParser().parseFromString(`<style>${HOST_CSS}</style>${html()}`, "text/html");
    const shadow = element.attachShadow({ mode: "open" });
    shadow.append(...parsed.head.childNodes, ...parsed.body.childNodes);
    // The sheet has a fixed size in pixels; zoom it to fit the frame, whatever its shape.
    const frame = shadow.querySelector(".frame");
    const sheets = shadow.querySelectorAll(".sheet");
    const fit = new ResizeObserver(() => {
      if (!element.isConnected) return fit.disconnect();
      const narrow = matchMedia("(max-width: 768px)").matches;
      const zoom = Math.min(frame.clientWidth / 1000, frame.clientHeight / (narrow ? 713 : 1770));
      if (zoom > 0) for (const sheet of sheets) sheet.style.zoom = zoom;
    });
    fit.observe(frame);
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
    addFonts();
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
