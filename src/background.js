chrome.action.onClicked.addListener((tab) => {
  // Check if the URL is not a chrome:// or chrome-extension:// page
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
