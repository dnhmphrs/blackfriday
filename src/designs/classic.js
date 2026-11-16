// Design: Classic. A blue panel that takes the right-hand 30% off every page.
//
// A design is just the look: `css` and `html` are placed inside the overlay's shadow root,
// which script.js stretches over the whole viewport. To switch designs, change the first
// file listed under content_scripts in manifest.json.
globalThis.thirtyOffDesign = {
  css: `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .overlay-container {
      position: absolute;
      width: 30%;
      height: 100%;
      top: 0;
      right: 0;
      background-color: blue;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      color: red;
      /* font-weight keeps the letters heavy where Arial Black is missing (ChromeOS, Linux);
         without it the fallback is regular Arial and the 4px stroke swallows it. */
      font-family: "Arial Black", "Arial Bold", Arial, sans-serif;
      font-weight: 900;
      text-align: center;
      padding: 24px 8px;
      gap: 10px;
      border-left: 4px solid black;
      -webkit-text-stroke: 4px black;
      overflow: hidden;
      pointer-events: auto;
      user-select: none;
      cursor: default;
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
  `,

  html: `
    <div class="overlay-container" role="img" aria-label="30% off the entire internet. Black Friday only.">
      <div class="lineGlobe">$🌐$🌐$🌐$🌐$🌐$🌐$</div>
      <div class="line1 double-text" data-text="30%">30%</div>
      <div class="line2 double-text" data-text="&nbsp;OFF">&nbsp;OFF&nbsp;</div>
      <div class="line3">THE ENTIRE</div>
      <div class="line4">INTERNET</div>
      <div class="lineGlobe">🦅💸🦅💸🦅💸🦅</div>
      <div class="line5">BLACK FRIDAY ONLY</div>
      <div class="lineGlobe">$🌐$🌐$🌐$🌐$🌐$🌐$</div>
    </div>
  `,
};
