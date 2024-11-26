chrome.action.onClicked.addListener((tab) => {
  // Only inject if it's a regular HTTP or HTTPS page
  if (tab.url.startsWith("http") || tab.url.startsWith("https")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["script.js"],
    });
  } else {
    console.log(
      "Cannot inject script into a chrome:// or chrome-extension:// page."
    );
  }
});
