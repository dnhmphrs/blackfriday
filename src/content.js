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

  // The page-facing edge of the banner: "straight", or "serrated" like a coupon.
  const EDGE = "straight";

  // The artwork's size in banner pixels (see banner.css), and the footer under it.
  const ART = { desktop: { w: 180, h: 309 }, phone: { w: 234, h: 143 } };
  const FOOT = { desktop: 31, phone: 26 }; // credit line + marquee, in banner pixels
  const TOOTH = { period: 8, depth: 4 }; // coupon teeth, in banner pixels
  const SPEED = 60; // the marquee, in banner pixels a second

  // The host covers the viewport and lets clicks through; .frame in banner.css is the solid
  // part. !important because for !important the shadow tree outranks the page's styles.
  const HOST_CSS = `
    :host { all: initial !important; position: fixed !important; inset: 0 !important; display: block !important;
            overflow: hidden !important; z-index: 2147483647 !important; pointer-events: none !important; }
    @media print { :host { display: none !important; } }`;

  const url = (path) => chrome.runtime.getURL(path);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches ? "-still" : "";

  function html() {
    return `
      <link rel="stylesheet" href="${url("banner.css")}">
      <div class="frame" role="img" aria-label="30% off everything on the internet. Black Friday only! Brought to you by Gary Mustard Enterprises.">
        <div class="top"><div class="sheet">
          <img class="art desktop" alt="" src="${url(`images/desktop${still}.webp`)}">
          <img class="art phone" alt="" src="${url(`images/phone${still}.webp`)}">
        </div></div>
        <div class="foot"><div class="sheet">
          <div class="credit">Brought to you by Gary Mustard Enterprises</div>
          <div class="ticker"><div class="run">
            <img class="desktop" alt="" src="${url("images/ticker-desktop.png")}"><img class="desktop" alt="" src="${url("images/ticker-desktop.png")}">
            <img class="phone" alt="" src="${url("images/ticker-phone.png")}"><img class="phone" alt="" src="${url("images/ticker-phone.png")}">
          </div></div>
        </div></div>
      </div>`;
  }

  let host = null;
  let wanted = false;
  let appends = 0;
  let midnightTimer;
  let fontAdded = false;

  function addFont() {
    if (fontAdded) return;
    fontAdded = true;
    try {
      const face = new FontFace("TOE Inter", `url(${url("fonts/inter-semibold.woff2")})`, { weight: "600" });
      document.fonts.add(face);
      face.load().catch(() => {});
    } catch {}
  }

  // Size everything to the frame: one zoom for the artwork and footer, so a banner pixel is the
  // same size in both; the footer runs the full width; the marquee scrolls at a steady speed.
  function fit(shadow) {
    const frame = shadow.querySelector(".frame");
    const [top, foot] = shadow.querySelectorAll(".sheet");
    const phone = matchMedia("(max-width: 768px)").matches;
    const art = ART[phone ? "phone" : "desktop"];
    const w = frame.clientWidth, h = frame.clientHeight;
    const zoom = Math.min(w / art.w, h / (art.h + 6 + FOOT[phone ? "phone" : "desktop"]));
    if (!(zoom > 0)) return;
    top.style.zoom = foot.style.zoom = zoom;
    foot.style.width = w / zoom + "px";
    const strip = shadow.querySelector(`.run img.${phone ? "phone" : "desktop"}`);
    if (strip.naturalWidth) shadow.querySelector(".run").style.animationDuration = strip.naturalWidth / SPEED + "s";
    // Steps of one banner pixel, like a real GIF marquee.
    if (strip.naturalWidth) shadow.querySelector(".run").style.animationTimingFunction = `steps(${strip.naturalWidth})`;
    frame.classList.toggle("serrated", EDGE === "serrated");
    frame.style.clipPath = EDGE === "serrated" ? teeth(w, h, zoom, phone) : "";
  }

  // A zigzag along the page-facing edge: the left edge of the side banner, the bottom of the strip.
  function teeth(w, h, zoom, phone) {
    const p = TOOTH.period * zoom, d = TOOTH.depth * zoom, points = [];
    if (phone) {
      points.push("0 0", `${w}px 0`);
      for (let x = w; x > -p; x -= p) points.push(`${x}px ${h}px`, `${x - p / 2}px ${h - d}px`);
    } else {
      points.push(`${w}px 0`, `${w}px ${h}px`);
      for (let y = h; y > -p; y -= p) points.push(`0 ${y}px`, `${d}px ${y - p / 2}px`);
    }
    return `polygon(${points.join(", ")})`;
  }

  function createHost() {
    // createElementNS and a separate HTML parse keep this working on XHTML and XML pages.
    const element = document.createElementNS("http://www.w3.org/1999/xhtml", TAG);
    element.popover = "manual";
    const parsed = new DOMParser().parseFromString(`<style>${HOST_CSS}</style>${html()}`, "text/html");
    const shadow = element.attachShadow({ mode: "open" });
    shadow.append(...parsed.head.childNodes, ...parsed.body.childNodes);
    const refit = () => (element.isConnected ? fit(shadow) : observer.disconnect());
    const observer = new ResizeObserver(refit);
    observer.observe(shadow.querySelector(".frame"));
    for (const img of shadow.querySelectorAll("img")) img.addEventListener("load", refit);
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
    addFont();
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
