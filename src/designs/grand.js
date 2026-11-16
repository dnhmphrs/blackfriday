// Design: Grand. The same offer with the hush of a fashion house: black, gold, serif capitals.
globalThis.thirtyOffDesign = {
  css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame { position: absolute; top: 0; right: 0; width: 30%; height: 100%; container-type: size; pointer-events: auto; user-select: none; cursor: default; }
    .salon {
      position: absolute; inset: 0; overflow: hidden;
      background: radial-gradient(ellipse 120% 70% at 50% 38%, #1c1a16, #0a0a0a 70%);
      border-left: 1px solid #b89a52; color: #d9c48a; text-align: center;
      font-family: Didot, "Bodoni 72", "Bodoni MT", "Playfair Display", "Times New Roman", Times, serif;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 7cqh 6cqw;
    }
    .salon::before { content: ""; position: absolute; inset: 3cqw; border: 1px solid rgba(184, 154, 82, 0.55); pointer-events: none; }
    .caps { font-size: 4.3cqw; letter-spacing: 0.42em; text-indent: 0.42em; text-transform: uppercase; }
    .rule { width: 12cqw; border-top: 1px solid #b89a52; margin: 2.4cqh auto; }
    .mark {
      width: 50cqw; height: 50cqw; border-radius: 50%; border: 1px solid #b89a52; display: grid; place-content: center;
      font-size: 21cqw; line-height: 1; letter-spacing: -0.02em;
      background: linear-gradient(180deg, #f6e7b4, #c9a85c 55%, #8f7334); -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .mark small { display: block; font-size: 4.2cqw; letter-spacing: 0.5em; text-indent: 0.5em; margin-top: 1.2cqw; }
    h1 { font-weight: 400; font-size: 12cqw; line-height: 1.08; letter-spacing: 0.1em; text-indent: 0.1em; text-transform: uppercase; }
    em { display: block; font-size: 7.6cqw; margin-top: 1.6cqh; }
    .foot { font-size: 3.7cqw; line-height: 1.7; letter-spacing: 0.3em; text-indent: 0.3em; text-transform: uppercase; color: #a8915a; }
    @container (max-height: 520px) { .mark, .foot { display: none; } }
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; }
      .salon { border-left: 0; border-bottom: 1px solid #b89a52; padding: 3cqh 4cqw; justify-content: center; gap: 1cqh; }
      .mark, .foot, .rule { display: none; } h1 { font-size: 5cqw; } em { font-size: 3.6cqw; } .caps { font-size: 2.2cqw; }
    }
  `,

  html: `
    <div class="frame" role="img" aria-label="The entire internet. Thirty percent off. Black Friday only."><div class="salon">
      <div>
        <div class="caps">Black Friday</div>
        <div class="rule"></div>
        <div class="caps">One day only</div>
      </div>
      <div class="mark">30%<small>OFF</small></div>
      <div>
        <h1>The Entire<br>Internet</h1>
        <em>thirty percent off</em>
      </div>
      <div class="foot">Sitewide.<br>Every site.</div>
    </div></div>
  `,
};
