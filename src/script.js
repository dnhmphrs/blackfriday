// List of pre-calculated Black Friday dates (next 10 years)
const blackFridays = [
  "2024-10-31",
  "2024-11-29",
  "2025-11-28",
  "2026-11-27",
  "2027-11-26",
  "2028-11-24",
  "2029-11-23",
  "2030-11-29",
  "2031-11-28",
  "2032-11-26",
  "2033-11-25",
];

// Function to check if today is Black Friday
function isTodayBlackFriday() {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  return blackFridays.includes(today);
}

// Only create and append the side panel if today is Black Friday
if (isTodayBlackFriday()) {
  // Create and append the side panel div
  var sidePanel = document.createElement("div");
  sidePanel.className = "thirtyOffOverlay"; // Apply the class from styles.css

  // Add the HTML content for the overlay
  sidePanel.innerHTML = `
    <p class="lineGlobe">$🌐$🌐$🌐$🌐$🌐$🌐$</p>
    <p class="line1 double-text" data-text="30%">30%</p>
    <p class="line2 double-text" data-text="&nbsp;OFF">&nbsp;OFF&nbsp;</p>
    <p class="line3">THE ENTIRE</p>
    <p class="line4">INTERNET</p>
    <p class="lineGlobe">🦅💸🦅💸🦅💸🦅</p>
    <p class="line5">BLACK FRIDAY ONLY</p>
    <p class="lineGlobe">$🌐$🌐$🌐$🌐$🌐$🌐$</p>
  `;

  // Append the side panel to the body
  // <p class="lineGlobe">$🌐$🌐$🌐$🌐$</p>
  document.body.appendChild(sidePanel);
}
