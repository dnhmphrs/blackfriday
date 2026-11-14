// Design: Clearance. The right-hand 30% of the page is the clearance rack: a pegboard buried
// under dayglo price stickers, shelf tags and a marker-pen markdown. System fonts and CSS only.
globalThis.thirtyOffDesign = (() => {
  // a starburst, as a clip-path
  const star = (points, inner) => "polygon(" + Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 ? inner : 50, a = (Math.PI * i) / points;
    return `${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`;
  }).join(",") + ")";
  const IMPACT = `Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif`;
  const BLACK = `"Arial Black", "Arial Bold", Arial, sans-serif`;
  const MARKER = `"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Marker Felt", cursive`;
  // Blank garage-sale dots stuck all over the board, as background layers: [colour, radius,
  // x, y, tile width, tile height]. One dot (and its shadow) per tile; the tiles never line up.
  const disc = (colour, r, x, y, w, h) =>
    `radial-gradient(circle at ${x}u ${y}u, ${colour} 0 ${r}u, rgba(0, 0, 0, 0) ${(r + 0.15).toFixed(2)}u) 0 0 / ${w}u ${h}u`;
  const dots = [["var(--o)", 3.6, 11, 17, 47, 59], ["var(--p)", 3, 40, 30, 61, 43], ["var(--g)", 3.3, 33, 55, 53, 71], ["var(--y)", 2.8, 22, 70, 37, 83]]
    .map(([colour, r, x, y, w, h]) => `${disc(colour, r, x, y, w, h)}, ${disc("rgba(45, 22, 0, 0.5)", r, x + 0.4, y + 0.6, w, h)}`)
    .join(",\n        ");

  // Stickers are placed by their centres, in percent of the frame (cqw / cqh), and sized in
  // "u": 1% of the frame's width, or less when the frame is too short for the whole pile at
  // that size. Lengths below are written like 12u and turned into calc(12 * var(--u)) at the end.
  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background: #c9a36a; border-left: 4px solid #111;
    }
    .wall {
      --u: min(1cqw, 0.52cqh); --y: #fff200; --o: #ff8a00; --p: #ff4fa8; --g: #5dff2b; --r: #f20d0d; --k: #111;
      position: absolute; inset: 0; overflow: hidden; color: var(--k); text-align: center; white-space: nowrap;
      text-transform: uppercase; font-synthesis-weight: none; font: 900 4u/1 ${BLACK};
      /* loose dots, then the pegboard */
      background:
        ${dots},
        radial-gradient(circle, #3d2710 0 0.8u, #e6cb9c 0.95u 1.2u, rgba(0, 0, 0, 0) 1.35u) 0 0 / 9u 9u,
        linear-gradient(100deg, #d2ad74, #c1975a);
    }

    .s { position: absolute; translate: -50% -50%; display: flex; flex-direction: column; align-items: center; justify-content: center; filter: drop-shadow(0.5u 0.7u 0 rgba(45, 22, 0, 0.5)); }

    /* shelf strip */
    .clr { left: 50cqw; top: 12.8cqh; width: 140u; height: 16u; rotate: 2deg; background: var(--r); border-block: 1u solid var(--y); color: #fff; }
    .clr span { font: 900 14.5u/1 ${IMPACT}; letter-spacing: 0.07em; text-shadow: 0.6u 0.6u 0 var(--k); translate: -8u 0; }

    .bf { left: 38cqw; top: 4.8cqh; width: 72u; height: 15u; rotate: -3deg; background: var(--k); color: var(--y); border-radius: 1.6u; box-shadow: inset 0 0 0 0.7u var(--k), inset 0 0 0 1.3u var(--y); }
    .bf span { font: 900 11.5u/1 ${IMPACT}; letter-spacing: 0.02em; }

    /* the big one, stuck on top of last year's */
    .echo { left: 50cqw; top: 40.3cqh; width: 103u; height: 103u; rotate: 2.5deg; background: var(--p); clip-path: ${star(24, 42.5)}; filter: none; }
    .main { left: 50cqw; top: 40.3cqh; width: 93u; height: 93u; rotate: -5deg; filter: drop-shadow(0.8u 1.2u 0 rgba(45, 22, 0, 0.55)); animation: throb 0.8s ease-in-out infinite alternate; }
    .main::before, .main::after { content: ""; position: absolute; clip-path: ${star(24, 42.5)}; }
    .main::before { inset: 0; background: var(--k); }
    .main::after { inset: 1.7u; background: radial-gradient(circle, #ffffa0 0 28%, var(--y) 58%); }
    .main b { position: relative; z-index: 1; font: 900 30u/0.86 ${BLACK}; letter-spacing: -0.06em; color: var(--r); -webkit-text-stroke: 2.4u var(--k); paint-order: stroke fill; text-shadow: 1u 1u 0 var(--k); }
    .main i { position: relative; z-index: 1; margin-top: 1.2u; padding: 0.6u 2.4u; background: var(--k); color: var(--y); font: italic 900 5u/1.1 ${BLACK}; rotate: -2deg; }
    @keyframes throb { to { scale: 1.045; } }

    .mgr { left: 87cqw; top: 5.8cqh; width: 27u; height: 27u; rotate: 12deg; animation: wag 1.6s ease-in-out infinite alternate; }
    .mgr::before { content: ""; position: absolute; inset: 0; background: var(--p); clip-path: ${star(14, 43)}; }
    .mgr span, .mgr b { position: relative; font: 900 3.9u/1 ${IMPACT}; letter-spacing: 0.02em; }
    .mgr b { font-size: 6u; }
    @keyframes wag { to { rotate: 4deg; } }

    /* shelf-edge tag */
    .shelf { left: 50cqw; top: 66.3cqh; width: 84u; height: 25.5u; rotate: -2deg; justify-content: flex-start; background: var(--g); border: 0.8u solid var(--k); border-radius: 1.2u; overflow: hidden; }
    .shelf .hd { align-self: stretch; display: flex; justify-content: space-between; gap: 3u; padding: 0 2u 0 5u; background: var(--k); color: #fff; font: 700 3.2u/1.45 Arial, Helvetica, sans-serif; }
    .shelf .site { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    .shelf b { font: 900 10u/0.93 ${BLACK}; letter-spacing: -0.03em; }
    .shelf .hd + b { margin-top: 0.9u; }

    /* the markdown, by hand */
    .was { left: 27cqw; top: 80.8cqh; width: 46u; height: 28.5u; rotate: -4deg; justify-content: flex-start; background: #fffef2; border: 0.6u solid var(--k); }
    .was .hd { align-self: stretch; background: var(--r); color: #fff; font: 900 4u/1.35 ${IMPACT}; letter-spacing: 0.12em; }
    .was .row { display: flex; align-items: baseline; justify-content: center; gap: 2u; }
    .was .row span { font: 700 4u/1 Arial, Helvetica, sans-serif; }
    .was s { position: relative; text-decoration: none; font: 900 8.6u/1.1 ${BLACK}; letter-spacing: -0.04em; }
    .was svg { position: absolute; left: -2u; top: -0.5u; width: calc(100% + 4u); height: calc(100% + 1u); overflow: visible; fill: none; stroke: var(--r); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; }
    .was .now b { font: 700 12.5u/0.95 ${MARKER}; color: var(--r); rotate: -5deg; letter-spacing: -0.04em; }

    /* hang tag on its string */
    .hang { left: 76.5cqw; top: 80.9cqh; width: 40u; height: 32u; rotate: 6deg; transform-origin: 50% 10%; animation: swing 2.2s ease-in-out infinite alternate; }
    .hang::before { content: ""; position: absolute; z-index: 1; left: calc(50% - 1.6u); top: -3.4u; width: 3.2u; height: 7.4u; border: 0.5u solid #fff; border-radius: 50%; rotate: 16deg; transform-origin: 50% 100%; box-shadow: 0.25u 0.25u 0 rgba(0, 0, 0, 0.4); }
    .hang .tag { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 1u;
      background: radial-gradient(circle at 50% 3.8u, #3d2710 0 1.3u, #fff 1.4u 2.4u, rgba(0, 0, 0, 0) 2.5u), var(--o);
      clip-path: polygon(24% 0, 76% 0, 100% 19%, 100% 100%, 0 100%, 0 19%); }
    .hang span { font: 900 4.9u/1.05 ${IMPACT}; letter-spacing: 0.03em; }
    .hang b { font: 900 10.6u/1 ${IMPACT}; color: #fff; -webkit-text-stroke: 1.2u var(--k); paint-order: stroke fill; }
    .hang small { font: 700 2.8u/1.2 Arial, Helvetica, sans-serif; }
    @keyframes swing { to { rotate: 1deg; } }

    .fs { left: 27cqw; top: 91.6cqh; width: 46u; height: 11.5u; rotate: 3deg; background: var(--p); border: 0.6u solid var(--k); }
    .fs span { font: 900 9.4u/1 ${IMPACT}; letter-spacing: 0.04em; }
    .nr { left: 75cqw; top: 92cqh; width: 45u; height: 10.5u; rotate: -3deg; background: var(--y); border: 0.9u solid var(--r); color: var(--r); }
    .nr span { font: 900 5.5u/1 ${BLACK}; letter-spacing: -0.02em; }

    /* two more strips, only for frames tall enough to have room (see below) */
    .more { display: none; width: 140u; height: 13.5u; }
    .more span { font: 900 10.5u/1 ${IMPACT}; letter-spacing: 0.05em; }
    .m1 { left: 50cqw; top: 16.4cqh; rotate: -2.5deg; background: var(--y); border-block: 0.8u solid var(--k); }
    .m2 { left: 50cqw; top: 69cqh; rotate: 2.5deg; background: var(--o); border-block: 0.8u dashed var(--k); }

    .asis { left: 91.5cqw; top: 55.2cqh; width: 16u; height: 16u; rotate: 14deg; border-radius: 50%; background: #fff; border: 1u solid var(--r); color: var(--r); }
    .asis span { font: 900 5.6u/0.9 ${BLACK}; }

    .dot { width: 14u; height: 14u; border-radius: 50%; background: var(--o); }
    .dot span { font: 900 3.1u/1 ${IMPACT}; letter-spacing: 0.03em; }
    .d1 { left: 7.5cqw; top: 57.8cqh; rotate: -18deg; }
    .d2 { left: 52cqw; top: 88.2cqh; rotate: 11deg; }
    .d3 { left: 93cqw; top: 21.5cqh; rotate: 24deg; }
    .sv { left: 7.5cqw; top: 22cqh; width: 15u; height: 15u; rotate: -14deg; border-radius: 50%; background: var(--g); }
    .sv span { font: 900 4.6u/1 ${IMPACT}; }

    /* the small print, on a barcode label */
    .foot { position: absolute; left: 0; right: 0; bottom: 0; height: 9u; display: flex; align-items: center; gap: 2.5u; padding: 0 2.5u; background: #fff; border-top: 0.6u solid var(--k); text-align: left; }
    .bars { flex: none; width: 22u; height: 6.4u; background: repeating-linear-gradient(90deg, var(--k) 0 0.5u, #fff 0 1u, var(--k) 0 2.2u, #fff 0 2.6u, var(--k) 0 3u, #fff 0 4.1u, var(--k) 0 4.5u, #fff 0 5.3u); }
    .foot p { font: 700 2.9u/1.15 "Arial Narrow", Arial, Helvetica, sans-serif; white-space: normal; text-transform: none; }

    /* tall, thin frames (a half-screen window): the pile is as wide as it can get, so it gets longer */
    @container (max-aspect-ratio: 21/50) {
      .more { display: flex; }
      .bf { top: 3.2cqh; }
      .mgr { top: 4.2cqh; }
      .clr { top: 9.3cqh; }
      .main, .echo { top: 37cqh; }
      .asis { top: 51.5cqh; }
      .d1 { top: 52.5cqh; }
      .shelf { top: 59.3cqh; }
      .was, .hang { top: 79.3cqh; }
      .d2 { top: 86.5cqh; }
      .fs, .nr { top: 90.2cqh; }
    }
    /* short windows: the big sticker, the day and the joke; the rest goes back in the box */
    @container (max-height: 560px) {
      .wall { --u: min(1cqw, 0.74cqh); }
      .clr, .more, .was, .hang, .fs, .nr, .d2, .d3, .foot { display: none; }
      .bf { top: 7.2cqh; }
      .mgr { top: 10cqh; }
      .main { top: 50cqh; width: 90u; height: 90u; }
      .echo { top: 50cqh; width: 99u; height: 99u; }
      .shelf { top: 88cqh; }
      .d1 { top: 75.5cqh; }
      .asis { top: 71cqh; }
    }
    /* narrow windows: a strip across the top, the big sticker on the left and the tags beside it */
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #111; }
      .wall { --u: min(1cqh, 0.42cqw); }
      .clr, .more, .nr, .foot, .d2, .d3 { display: none; }
      .was, .hang, .fs { display: flex; } /* the strip is always a short window; these come back */
      .s { scale: 1.15; }
      .main { left: 21cqw; top: 50cqh; width: 93u; height: 93u; scale: 1; }
      .echo { left: 21cqw; top: 50cqh; width: 101u; height: 101u; scale: 1; }
      .d1 { left: 44cqw; top: 14cqh; }
      .bf { left: 66.5cqw; top: 13cqh; }
      .mgr { left: 92.5cqw; top: 17cqh; }
      .shelf { left: 63cqw; top: 46cqh; }
      .hang { left: 90.5cqw; top: 59cqh; }
      .was { left: 53.5cqw; top: 81cqh; }
      .sv { left: 71.5cqw; top: 70cqh; }
      .fs { left: 78cqw; top: 88cqh; }
      .asis { left: 95.5cqw; top: 88cqh; }
      /* a squarer strip (a really narrow window): fewer tags, so the ones left stay readable */
      @container (max-aspect-ratio: 2/1) {
        .wall { --u: min(1cqh, 0.6cqw); }
        .mgr, .fs, .asis, .d1, .sv { display: none; }
        .main, .echo { left: 28cqw; }
        .bf { left: 77cqw; top: 13cqh; scale: 0.95; }
        .shelf { left: 76.5cqw; top: 44cqh; scale: 0.88; }
        .was { left: 65.5cqw; top: 81cqh; scale: 1; }
        .hang { left: 89.5cqw; top: 80cqh; scale: 0.92; }
      }
    }
    @media (prefers-reduced-motion: reduce) { .main, .mgr, .hang { animation: none; } }
  `;

  return {
    css: css.replace(/(-?\d*\.?\d+)u\b/g, "calc($1 * var(--u))"),

    html: `
    <div class="frame" role="img" aria-label="A clearance rack of price stickers: 30% off the entire internet. Black Friday. Was 100%, now 70%. Final sale, no returns."><div class="wall">
      <div class="s dot d3"><span>Reduced</span></div>
      <div class="s echo"></div>
      <div class="s main"><b>30%</b><b>OFF</b><i>Every website!</i></div>
      <div class="s clr"><span>Clearance</span></div>
      <div class="s bf"><span>Black Friday</span></div>
      <div class="s more m1"><span>Everything must go!</span></div>
      <div class="s mgr"><span>Manager's</span><b>Special</b></div>
      <div class="s sv"><span>Save!</span></div>
      <div class="s shelf">
        <div class="hd"><span class="site">Item: this page</span><span>Aisle 30</span></div>
        <b>The Entire</b><b>Internet</b>
      </div>
      <div class="s dot d1"><span>Reduced</span></div>
      <div class="s more m2"><span>Scratch &amp; dent</span></div>
      <div class="s asis"><span>As</span><span>Is</span></div>
      <div class="s was">
        <div class="hd">Markdown</div>
        <div class="row"><span>Was</span><s>100%<svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M1 27 C 24 17, 44 30, 62 19 S 88 20, 99 10"/></svg></s></div>
        <div class="row now"><span>Now</span><b>70%</b></div>
      </div>
      <div class="s hang"><div class="tag"><span>Take an</span><span>additional</span><b>30% OFF</b><small>at the register*</small></div></div>
      <div class="s fs"><span>Final Sale</span></div>
      <div class="s nr"><span>No Returns</span></div>
      <div class="s dot d2"><span>Reduced</span></div>
      <div class="foot"><div class="bars"></div><p>*30% of each page will be unavailable for viewing. All sales final. Internet sold as is.</p></div>
    </div></div>
  `,

    setup(root) {
      root.querySelector(".site").textContent = "Item: " + (location.hostname || "this page");
    },
  };
})();
