// Toolbar button. It does nothing until Black Friday; on the day it hides the banner on the
// current tab, or brings it back. (The content script decides: it knows what day it is.)
chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return;
  chrome.tabs.sendMessage(tab.id, { type: "thirty-off:toggle" }, { frameId: 0 }).catch(() => {
    // No content script in this tab: a chrome:// page, the Web Store, or a tab that has not
    // been reloaded since the extension was installed.
  });
});
