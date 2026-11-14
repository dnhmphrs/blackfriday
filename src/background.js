// Toolbar button: show or hide the overlay on the current tab, on any day of the year.
const TOGGLE = "thirty-off:toggle";

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return;
  const send = (message) => chrome.tabs.sendMessage(tab.id, message, { frameId: 0 });
  try {
    await send({ type: TOGGLE });
  } catch {
    // Nobody answered, so this tab has no content script: it was already open when the
    // extension was installed or updated. Inject it (activeTab allows this on a click)
    // and show the overlay. Asking for "show" rather than a toggle matters on Black
    // Friday, when the freshly injected script has already shown it by itself.
    try {
      const files = chrome.runtime.getManifest().content_scripts[0].js;
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files });
      await send({ type: TOGGLE, show: true });
    } catch {
      // chrome:// pages, the Web Store and the like cannot be scripted by any extension.
    }
  }
});
