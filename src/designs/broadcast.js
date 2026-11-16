// Design: Broadcast. "The 30% OFF Channel", a Gary Mustard Enterprises production: the banner
// from the adverts, live. The scroll, the World Wide Sale, a turning globe with 30% cut out of
// it on a GME plinth, and the price card. Down the side of the page on a desktop,
// across the top on a phone.
globalThis.thirtyOffDesign = (() => {
  // Everything is drawn on a sheet 100 units wide. A unit is as large as the frame allows
  // (see --u below), so the whole sheet scales as one piece and nothing can run off the end.
  const u = (n) => `calc(var(--u) * ${n})`;
  const serif = `Garamond, "Adobe Garamond Pro", "EB Garamond", Georgia, "Times New Roman", serif`;
  const black = `"Arial Black", "Arial Bold", Arial, sans-serif`;
  const shade = (steps, step) => Array.from({ length: steps }, (unused, i) => `${u(step * (i + 1))} ${u(step * (i + 1))} 0 var(--shade)`).join(", ");

  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background: linear-gradient(#0a1cc4, #0a22d6 45%, #070f9c);
      border-left: 4px solid #000; color: #fff;
      font: italic 700 16px/1 Arial, "Helvetica Neue", Helvetica, sans-serif;
    }
    /* a faint set of scanlines and a slow roll of brightness, like a tube television */
    .frame::after {
      content: ""; position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(rgba(0, 0, 30, 0.16) 0 1px, rgba(0, 0, 0, 0) 1px 3px), linear-gradient(rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0) 30%);
      background-size: auto, 100% 60%; background-repeat: repeat, no-repeat; animation: roll 8s linear infinite;
    }
    .sheet {
      position: absolute; inset: 0;
      --u: min(1cqw, 100cqh / 187.5);
      --yellow: #fff035; --shade: #0a0f66; --red: #ff1616;
    }
    @keyframes roll { from { background-position: 0 0, 0 -60cqh; } to { background-position: 0 0, 0 160cqh; } }
    @keyframes slide { to { transform: translateX(-50%); } }
    @keyframes crawl { from { transform: skewX(-9deg); } to { transform: translateX(-50%) skewX(-9deg); } }
    @keyframes sway { from { rotate: -0.8deg; } to { rotate: 0.8deg; } }
    @keyframes bob { from { translate: 0 ${u(-0.5)}; } to { translate: 0 ${u(0.5)}; } }
    @keyframes pulse { 0%, 55%, 100% { scale: 1; } 25% { scale: 1.04; } }
    @keyframes glint { 0%, 78%, 100% { scale: 0; rotate: 0deg; } 88% { scale: 1; rotate: 12deg; } }

    /* ---- the Gary Mustard Enterprises lockup, and the scroll under it ---- */
    .bug { position: absolute; left: ${u(4.1)}; top: ${u(3.1)}; height: ${u(9.6)}; z-index: 1; }
    .bug img { display: block; height: 100%; width: auto; filter: brightness(0) invert(1); }
    .strip {
      position: absolute; left: 0; right: 0; top: ${u(13.7)}; height: ${u(7.8)}; overflow: hidden; white-space: nowrap;
      color: #e9f0ff; letter-spacing: 0.035em; word-spacing: 0.3em; text-shadow: ${u(0.28)} ${u(0.28)} 0 rgba(4, 8, 80, 0.85);
      font: normal 400 ${u(5.2)}/${u(7.8)} "Arial Narrow", "Helvetica Neue", Arial, sans-serif; font-stretch: condensed;
    }
    .strip span { display: inline-block; animation: slide 30s linear infinite; }

    /* ---- the sheet's middle column, centred when the frame is wider than the sheet ---- */
    .col { position: absolute; top: ${u(8.9)}; bottom: 0; left: 50%; width: ${u(100)}; margin-left: ${u(-50)}; }
    .glow { position: absolute; left: ${u(76.1)}; top: ${u(88)}; width: ${u(124)}; height: ${u(124)}; margin: ${u(-62)} 0 0 ${u(-62)}; background: radial-gradient(closest-side, #58c4ff 0%, #2a8cff 22%, #1348ee 44%, rgba(19, 72, 238, 0) 72%); }

    .title { position: absolute; left: 0; right: 0; top: ${u(13.9)}; text-align: center; font-size: ${u(16.3)}; line-height: 0.9; letter-spacing: -0.04em; filter: drop-shadow(${u(0.74)} ${u(0.74)} 0 rgba(6, 8, 70, 0.95)); }
    .title b { display: block; font-weight: 700; padding: 0 0.12em; background: linear-gradient(#ffffff 35%, #c5d4fb 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .title b + b { font-size: ${u(18.9)}; }

    .pill {
      position: absolute; left: ${u(1.1)}; top: ${u(51.9)}; padding: ${u(0.37)} ${u(3.3)} ${u(0.74)} ${u(2.8)}; border-radius: ${u(1.1)};
      background: linear-gradient(#fffb86, #f0e11c); color: #111; font-size: ${u(4.8)}; line-height: 1.15; white-space: nowrap;
      transform: skewX(-9deg) rotate(-1.5deg); transform-origin: left top; animation: sway 2s ease-in-out infinite alternate;
      box-shadow: ${u(0.55)} ${u(0.55)} 0 rgba(6, 8, 70, 0.9), inset 0 0 0 ${u(0.37)} rgba(170, 158, 0, 0.6);
    }
    .oval {
      position: absolute; left: ${u(65.4)}; top: ${u(47.8)}; width: ${u(31.9)}; height: ${u(13.9)}; border-radius: 50%;
      background: radial-gradient(ellipse at 40% 30%, #fffc9a, #efe01c 72%); color: #151515;
      display: grid; place-items: center; text-align: center; font: italic 700 ${u(4.2)}/0.98 ${serif};
      transform: rotate(-7deg); animation: sway 1.5s ease-in-out infinite alternate;
      box-shadow: ${u(0.55)} ${u(0.65)} 0 rgba(6, 8, 70, 0.9), inset 0 0 0 ${u(0.37)} rgba(170, 158, 0, 0.5);
    }

    .offer { position: absolute; left: ${u(2.8)}; top: ${u(62.2)}; z-index: 1; }
    .offer .pct, .offer .off {
      font: normal 900 ${u(21.85)}/0.86 ${black}; color: var(--yellow); letter-spacing: -0.05em;
      transform: skewX(-9deg); transform-origin: left bottom; text-shadow: ${shade(6, 0.19)};
    }
    .offer .row { display: flex; align-items: flex-end; gap: ${u(2.4)}; margin-top: ${u(0.55)}; }
    .offer .off { font-size: ${u(13.9)}; line-height: 0.9; }
    .offer .what { font-size: ${u(3.8)}; line-height: 1.04; padding-bottom: ${u(1.1)}; white-space: nowrap; text-shadow: ${u(0.37)} ${u(0.37)} 0 rgba(6, 8, 70, 0.95); }

    /* ---- the globe on its plinth ---- */
    .hero {
      position: absolute; left: ${u(52)}; top: ${u(63.9)}; width: ${u(48.2)}; height: ${u(48.2)}; display: block;
      -webkit-mask-image: radial-gradient(closest-side, #000 84%, rgba(0, 0, 0, 0) 100%); mask-image: radial-gradient(closest-side, #000 84%, rgba(0, 0, 0, 0) 100%);
      animation: bob 3s ease-in-out infinite alternate;
    }
    .plinth { position: absolute; left: ${u(56.6)}; top: ${u(116.2)}; width: ${u(39)}; bottom: 0; background: linear-gradient(90deg, #ffffff 0%, #f2f3fc 42%, #c6cbee 100%); }
    .plinth::before { content: ""; position: absolute; left: 0; right: 0; top: ${u(-5.1)}; height: ${u(10.2)}; border-radius: 50%; background: radial-gradient(ellipse at 50% 46%, rgba(10, 16, 60, 0.5) 0%, rgba(10, 16, 60, 0.16) 36%, #f8f9ff 64%); }
    .plinth img { position: absolute; left: 50%; top: ${u(8.6)}; width: ${u(23.9)}; margin-left: ${u(-11.95)}; display: block; }
    .spark { position: absolute; width: ${u(8)}; height: ${u(8)}; background: #fff; scale: 0; filter: drop-shadow(0 0 ${u(0.6)} #fff); animation: glint 4.2s linear infinite;
             clip-path: polygon(50% 0, 56% 44%, 100% 50%, 56% 56%, 50% 100%, 44% 56%, 0 50%, 44% 44%); }
    .s1 { left: ${u(86)}; top: ${u(72)}; }
    .s2 { left: ${u(60)}; top: ${u(84)}; width: ${u(5.5)}; height: ${u(5.5)}; animation-delay: -1.5s; }
    .s3 { left: ${u(78)}; top: ${u(98)}; width: ${u(6.5)}; height: ${u(6.5)}; animation-delay: -2.9s; }

    /* ---- price card ---- */
    .price {
      position: absolute; left: ${u(2.2)}; top: ${u(100.9)}; width: ${u(40)}; height: ${u(30.6)}; background: #f3f4f6; color: #0c0c0c;
      border: ${u(0.46)} solid #000; box-shadow: ${u(0.83)} ${u(0.83)} 0 rgba(4, 6, 60, 0.92); transform: rotate(-1.4deg);
    }
    .price .head { background: var(--red); color: #fff46a; font: normal 700 ${u(4.1)}/${u(5.74)} "Arial Narrow", Arial, sans-serif; font-stretch: condensed; padding: 0 ${u(1.5)}; border-bottom: ${u(0.46)} solid #000; white-space: nowrap; overflow: hidden; }
    .price .head span { display: inline-block; transform-origin: left center; }
    .price .line { font-size: ${u(5)}; padding: ${u(1.3)} ${u(1.7)} 0; }
    .price s { position: relative; text-decoration: none; color: #6b6f78; margin-left: ${u(0.9)}; }
    .price s::after { content: ""; position: absolute; left: -8%; right: -8%; top: 46%; height: ${u(0.83)}; background: var(--red); transform: rotate(-11deg); box-shadow: 0 0 0 ${u(0.19)} #000; }
    .price .big {
      position: absolute; right: ${u(0.9)}; bottom: ${u(-5.4)}; font: normal 900 ${u(16.5)}/0.9 ${black}; color: var(--red); letter-spacing: -0.05em;
      -webkit-text-stroke: ${u(1.1)} #000; paint-order: stroke fill; transform: skewX(-8deg); transform-origin: right bottom; animation: pulse 1.4s ease-in-out infinite;
    }

    /* ---- the lower crawl and the small print ---- */
    .crawl { position: absolute; left: 0; right: 0; bottom: ${u(7.9)}; height: ${u(13.9)}; overflow: hidden; white-space: nowrap; font: normal 900 ${u(10.4)}/${u(13.9)} ${black}; color: var(--yellow); letter-spacing: -0.02em; word-spacing: 0.08em; }
    .crawl span { display: inline-block; padding-left: ${u(1)}; text-shadow: ${shade(3, 0.28)}; animation: crawl 16s linear infinite; }
    .fine { position: absolute; left: 0; right: 0; bottom: ${u(1.3)}; padding: ${u(0.8)} 0 ${u(1)}; text-align: center; white-space: nowrap; overflow: hidden; font: normal 400 ${u(2.3)}/1.2 "Arial Narrow", Arial, sans-serif; letter-spacing: 0.045em; color: #e9f0ff; background: rgba(2, 4, 52, 0.72); }

    /* squat frames (short windows): a shorter sheet, without the price card or the crawl */
    @container (min-aspect-ratio: 62 / 100) {
      .sheet { --u: min(1cqw, 100cqh / 150); }
      .price, .crawl { display: none; }
    }

    /* narrow windows and phones: the banner lies across the top; fewer things, bigger */
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #000; }
      .sheet { --u: min(1cqw, 100cqh / 71.3); }
      .col { top: 0; }
      .strip { top: ${u(1.2)}; height: ${u(6)}; font-size: ${u(4.1)}; line-height: ${u(6)}; }
      .bug { left: 0; top: ${u(1.2)}; height: ${u(6)}; width: ${u(18)}; padding: ${u(0.4)} 0 ${u(0.4)} ${u(1.9)}; background: linear-gradient(90deg, #0a1cc4 76%, rgba(10, 28, 196, 0)); }
      .glow { left: ${u(82.2)}; top: ${u(31.8)}; width: ${u(84)}; height: ${u(84)}; margin: ${u(-42)} 0 0 ${u(-42)}; }
      .title { top: ${u(8.6)}; left: ${u(3.4)}; right: auto; text-align: left; font-size: ${u(8.4)}; filter: drop-shadow(${u(0.5)} ${u(0.5)} 0 rgba(6, 8, 70, 0.95)); white-space: nowrap; }
      .title b { display: inline; padding: 0; } .title b + b { font-size: ${u(8.4)}; }
      .offer { left: ${u(3.4)}; top: ${u(17.6)}; }
      .offer .pct { font-size: ${u(22.9)}; } .offer .off { font-size: ${u(16.75)}; } .offer .what { font-size: ${u(4.96)}; padding-bottom: ${u(1.4)}; }
      .pill { left: ${u(3.4)}; top: ${u(55.4)}; font-size: ${u(4.98)}; }
      .oval { left: ${u(74.5)}; top: ${u(8)}; width: ${u(23.5)}; height: ${u(10.3)}; font-size: ${u(3.15)}; }
      .hero { left: ${u(66.7)}; top: ${u(16.3)}; width: ${u(31)}; height: ${u(31)}; }
      .plinth { left: ${u(69.65)}; top: ${u(50)}; width: ${u(25.1)}; }
      .plinth::before { top: ${u(-3.3)}; height: ${u(6.6)}; }
      .plinth img { top: ${u(5.6)}; width: ${u(15.4)}; margin-left: ${u(-7.7)}; }
      .s1 { left: ${u(88)}; top: ${u(21)}; } .s2 { left: ${u(70)}; top: ${u(29)}; } .s3 { left: ${u(83)}; top: ${u(40)}; }
      .spark { width: ${u(5.2)}; height: ${u(5.2)}; }
      .price, .crawl { display: none; }
      .fine { bottom: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .frame::after, .strip span, .crawl span, .pill, .oval, .hero, .price .big { animation: none; }
      .spark { animation: none; scale: 1; }
    }
  `;

  const scroll = "But wait&#8230; there&#8217;s less! &#10022; No purchase necessary! &#10022; Black Friday only! &#10022; Every website, 30% off! &#10022; Works like magic! &#10022; ";
  const html = `
    <div class="frame" role="img" aria-label="World Wide Sale. 30% off the entire internet. Black Friday only. A Gary Mustard Enterprises production.">
      <div class="sheet">
        <div class="strip" data-scrolls><span>${scroll.repeat(4)}</span></div>
        <div class="bug"><img alt=""></div>
        <div class="col">
          <div class="glow"></div>
          <div class="title"><b>World Wide</b> <b>Sale</b></div>
          <div class="pill">Black Friday</div>
          <div class="oval"><span>As Seen On<br>Every Website</span></div>
          <div class="offer">
            <div class="pct">30%</div>
            <div class="row"><span class="off">OFF</span><span class="what">THE ENTIRE<br>INTERNET !</span></div>
          </div>
          <div class="plinth"><img class="lockup" alt=""></div>
          <img class="hero" alt="">
          <i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i>
          <div class="price">
            <div class="head"><span>The Internet (All Of It)</span></div>
            <div class="line">WAS: <s>100%</s></div>
            <div class="line">NOW:</div>
            <div class="big">70%</div>
          </div>
        </div>
        <div class="crawl" data-scrolls><span>${"BLACK FRIDAY ONLY ! &#10022; ".repeat(8)}</span></div>
        <div class="fine">*Savings applied directly to the website. No coupon needed. Void where prohibited. Black Friday only.</div>
      </div>
    </div>
  `;

  function setup(root) {
    // The pictures travel as data: URLs in broadcast.art.js (a design may not load anything
    // from a URL); the manifest lists that file just before this one.
    const pictures = globalThis.thirtyOffArt?.() ?? {};
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const show = (selector, url) => { if (url) root.querySelector(selector).src = url; };
    show(".hero", still ? pictures.still : pictures.globe);
    show(".lockup", pictures.gme);
    show(".bug img", pictures.gme);

    // The card's heading is set in Arial Narrow, which not every machine has. Where the
    // stand-in is too wide, squeeze the line to fit instead of letting it be cut off.
    const head = root.querySelector(".price .head"), line = head.firstElementChild;
    const fit = new ResizeObserver(() => {
      if (!head.isConnected) return fit.disconnect();
      const room = head.clientWidth - 2 * parseFloat(getComputedStyle(head).paddingLeft);
      line.style.transform = line.offsetWidth > room && room > 0 ? `scaleX(${(room / line.offsetWidth).toFixed(3)})` : "";
    });
    fit.observe(head);
  }

  return { css, html, setup };
})();
