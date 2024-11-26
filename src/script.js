// List of pre-calculated Black Friday dates (next 10 years)
const blackFridays = [
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
  const today = new Date().toISOString().split("T")[0];
  return blackFridays.includes(today);
  // return true; // For testing purposes, always return true
}

if (isTodayBlackFriday()) {
  // Create and append the side panel div
  const sidePanel = document.createElement("div");

  // Attach a shadow root to encapsulate styles and HTML content
  const shadow = sidePanel.attachShadow({ mode: "open" });

  // CSS and HTML for the overlay
  shadow.innerHTML = `
    <style>
      /* Reset and base styles */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      .overlay-container {
        position: fixed;
        width: 30%;
        height: 100%;
        top: 0;
        right: 0;
        background-color: blue;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        color: red;
        font-family: "Arial Black", Arial, sans-serif;
        text-align: center;
        padding: 24px 8px;
        gap: 10px;
        border-left: 4px solid black;
        -webkit-text-stroke: 4px black;
      }

      .double-text {
        position: relative;
        text-transform: uppercase;
      }

      .line1 { font-size: 12vw; letter-spacing: -3px; line-height: 0.8; -webkit-text-stroke: 4px black; }
      .line2 { font-size: 10vw; letter-spacing: -3px; line-height: 0.8; }
      .line3, .line4, .line5, .lineGlobe { letter-spacing: 1px; }
      .line3, .line4 { font-size: 4vw; color: yellow; -webkit-text-stroke: 4px black; }
      .lineGlobe { font-size: 2vw; color: yellow; -webkit-text-stroke: 2px black; }
      .line5 { font-size: 2.1vw; color: red; -webkit-text-stroke: 3px black; }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .overlay-container { width: 100%; height: 33%; }
        .line1 { font-size: 20vw; }
        .line2 { font-size: 15vw; }
        .line3, .line4 { font-size: 9vw; }
        .line5 { font-size: 6.5vw; }
      }
    </style>

    <div class="overlay-container">
      <div class="lineGlobe">$🌐$🌐$🌐$🌐$🌐$🌐$</div>
      <div class="line1 double-text" data-text="30%">30%</div>
      <div class="line2 double-text" data-text="&nbsp;OFF">&nbsp;OFF&nbsp;</div>
      <div class="line3">THE ENTIRE</div>
      <div class="line4">INTERNET</div>
      <div class="lineGlobe">🦅💸🦅💸🦅💸🦅</div>
      <div class="line5">BLACK FRIDAY ONLY</div>
      <div class="lineGlobe">$🌐$🌐$🌐$🌐$🌐$🌐$</div>
    </div>
  `;

  // Append the sidePanel with shadow DOM to the body
  document.body.appendChild(sidePanel);
}
