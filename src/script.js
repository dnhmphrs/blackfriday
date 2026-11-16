// 30% Off EVERYTHING - content script.
//
// On Black Friday the overlay appears on every page. The toolbar button shows or hides it
// on the current tab on any day of the year. What it looks like lives in designs/.
(() => {
  const TOGGLE = "thirty-off:toggle";
  const TAG = "thirty-off-overlay";
  const design = globalThis.thirtyOffDesign;

  // This file can run twice in one page: the toolbar button injects it into tabs that were
  // already open when the extension was installed or updated. The newcomer takes over, both
  // from a copy of itself in this JavaScript world and from an overlay left on the page by
  // a copy that an update has since cut off.
  globalThis.thirtyOff?.destroy();
  for (const stale of document.querySelectorAll(TAG)) stale.remove();

  // Black Friday is the day after US Thanksgiving, the fourth Thursday of November. That
  // Thursday always lands on the 22nd-28th, so Black Friday is the one Friday on the 23rd-29th.
  // These are the visitor's local calendar fields on purpose: the UTC date is already
  // Saturday by Friday afternoon in the Americas, and still Thursday on Friday morning in
  // Asia and Australia.
  function isBlackFriday(date) {
    const day = date.getDate();
    return date.getMonth() === 10 && date.getDay() === 5 && day >= 23 && day <= 29;
  }

  // The host covers the viewport and lets clicks through; the design decides which part of
  // it is solid. Declarations are !important because for !important the shadow tree outranks
  // the page, so no site stylesheet can restyle, shrink or hide the host.
  const HOST_CSS = `
    :host {
      all: initial !important;
      position: fixed !important;
      inset: 0 !important;
      display: block !important;
      overflow: hidden !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      direction: ltr !important;
      unicode-bidi: isolate !important;
    }
    @media print {
      :host { display: none !important; }
    }
  `;

  let override = null; // true/false once the toolbar button is used; null follows the calendar
  let wanted = false;
  let host = null;
  let appends = 0;
  let midnightTimer;

  function createHost() {
    // The namespace and the separate HTML parse keep this working on XHTML pages and in
    // Chrome's raw XML viewer, where createElement() and innerHTML follow XML rules.
    const element = document.createElementNS("http://www.w3.org/1999/xhtml", TAG);
    element.lang = "en";
    element.popover = "manual";
    const markup = `<style>${HOST_CSS}${design.css}</style>${design.html}`;
    const parsed = new DOMParser().parseFromString(markup, "text/html");
    const shadow = element.attachShadow({ mode: "open" });
    shadow.append(...parsed.head.childNodes, ...parsed.body.childNodes);
    design.setup?.(shadow);
    return element;
  }

  // Make the page match `wanted`. Also runs whenever <html>'s children change, which is how
  // it waits for <body> at document_start and puts the overlay back if a page removes it.
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
    if (!(root instanceof HTMLHtmlElement)) return; // raw XML or SVG, or not parsed yet
    keeper.observe(root, { childList: true });
    if (!document.body) return; // nothing is painted before <body> exists
    host ??= createHost();
    if (host.parentNode !== root) {
      if (appends++ > 20) return; // the page deletes it every time; stop fighting
      root.append(host);
    }
    // The top layer sits above every z-index on the page and is not moved or recoloured
    // by a transform or filter on <html> or <body>. Without it the fixed, max z-index
    // host above still does the job on ordinary pages.
    try {
      if (!host.matches(":popover-open")) host.showPopover();
    } catch {}
  }
  const keeper = new MutationObserver(render);

  // True once the extension has been disabled, removed or updated under this tab. From then
  // on this copy can no longer be reached by the toolbar button, so it cleans up and leaves.
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
    wanted = override ?? isBlackFriday(now);
    render();
    // Look again just after the next local midnight, so tabs left open pick up the start
    // of Black Friday and drop the overlay when it ends.
    clearTimeout(midnightTimer);
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    midnightTimer = setTimeout(sync, midnight - now + 1000);
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") sync();
  }

  function onMessage(message, sender, sendResponse) {
    if (message?.type !== TOGGLE) return;
    override = message.show ?? !wanted;
    sync();
    sendResponse({ shown: wanted });
  }

  function destroy() {
    wanted = false;
    render();
    clearTimeout(midnightTimer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", sync);
    try {
      chrome.runtime.onMessage.removeListener(onMessage);
    } catch {}
    if (globalThis.thirtyOff === instance) delete globalThis.thirtyOff;
  }

  const instance = { destroy };
  globalThis.thirtyOff = instance;

  if (!design) return;
  chrome.runtime.onMessage.addListener(onMessage);
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", sync); // also fires when restored from the back/forward cache
  sync();
})();
