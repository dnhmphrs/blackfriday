// Design: Doorbuster. The right-hand 30% of the page is the newspaper sale circular: cheap
// newsprint, black plus spot red and spot yellow printed out of register, and clip 'n save coupons.
globalThis.thirtyOffDesign = (() => {
  // Everything is sized in --u: 1% of the frame's width, or less when the frame is too short
  // for the full sheet at that size.
  const u = (n) => `calc(${n} * var(--u))`;
  // a starburst, as a clip-path
  const star = (points, inner) => "polygon(" + Array.from({ length: points * 2 }, (unused, i) => {
    const r = i % 2 ? inner : 50, a = (Math.PI * i) / points;
    return `${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`;
  }).join(",") + ")";
  // a halftone: rows of dots on a 45 degree screen that shrink away from one edge
  const halftone = (color, cell, rows, edge) => Array.from({ length: rows }, (unused, i) => {
    const r = Math.round(88 - (78 * i) / (rows - 1));
    return `radial-gradient(circle closest-side, ${color} 0 ${r}%, rgba(0, 0, 0, 0) ${r + 9}%) left ${u(i % 2 ? cell / 2 : 0)} ${edge} ${u((i - 1) * cell * 0.5)} / ${u(cell)} ${u(cell)} repeat-x`;
  }).join(", ");
  const IMPACT = `Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif`;

  return {
    css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background: #eadfc0; border-left: 3px solid #17130e; box-shadow: -3px 0 9px rgba(0, 0, 0, 0.4);
    }
    .paper {
      --u: min(1cqw, 0.48cqh); --k: #17130e; --r: #e0121a; --y: #ffe100; --p: #efe6cb;
      position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      color: var(--k); text-align: center; white-space: nowrap; font-synthesis: none;
      font: 900 ${u(4)}/1 "Arial Black", "Arial Bold", Arial, sans-serif;
      /* yellow ink bleeding down from the top, the newsprint screen, the fold, the yellowing */
      background:
        ${halftone("var(--y)", 3.2, 9, "top")},
        radial-gradient(circle, rgba(23, 19, 14, 0.2) 0 0.8px, rgba(0, 0, 0, 0) 1.3px) 0 0 / 4px 4px,
        linear-gradient(rgba(0, 0, 0, 0) 49.7%, rgba(60, 40, 0, 0.13) 50%, rgba(255, 255, 255, 0.2) 50.3%, rgba(0, 0, 0, 0) 50.8%),
        radial-gradient(ellipse at 35% 25%, #f4ecd4, #e5d7ad 95%);
    }
    /* specks of bare paper showing through all the ink */
    .paper::after { content: ""; position: absolute; inset: 0; z-index: 9; pointer-events: none; background: radial-gradient(circle, rgba(239, 230, 203, 0.34) 0 0.6px, rgba(0, 0, 0, 0) 1px) 1px 1px / 3px 3px; }
    .imp { font-family: ${IMPACT}; font-weight: 900; }
    .band br { display: none; }

    .strip, .foot { flex: none; align-self: stretch; height: ${u(5.4)}; display: flex; align-items: center; justify-content: center; overflow: hidden; background: var(--k); color: var(--y); }
    .strip span, .foot span { font-size: min(${u(3.5)}, calc(${u(93)} / var(--em, 30))); }
    .foot { background: var(--r); color: var(--p); }

    .mast { flex: none; margin-top: ${u(1)}; line-height: 0.92; }
    .mast span { display: block; }
    .bf { font-size: min(${u(16.4)}, calc(${u(92)} / var(--em, 5.8))); text-shadow: ${u(0.75)} ${u(0.55)} 0 var(--r); }
    .db { font-size: min(${u(16.4)}, calc(${u(92)} / var(--em, 5.7))); color: var(--r); text-shadow: ${u(0.85)} ${u(0.65)} 0 var(--k); }

    .sub { flex: none; align-self: stretch; margin: ${u(0.8)} ${u(4)} 0; padding: ${u(0.8)} 0 ${u(0.6)}; text-align: left;
           border-top: ${u(1)} solid var(--k); border-bottom: ${u(0.35)} solid var(--k);
           font: italic 700 ${u(4)}/1.1 "Times New Roman", Times, Georgia, serif; }
    .sub b { display: block; font-size: ${u(5.3)}; line-height: 1; color: var(--r); }

    .hero { display: contents; }
    /* the price point: a black keyline box with its yellow fill printed a little off */
    .deal { flex: none; align-self: stretch; position: relative; z-index: 0; height: ${u(48)}; margin: ${u(2.2)} ${u(5)} 0 ${u(4)}; }
    .deal::before, .deal::after { content: ""; position: absolute; inset: 0; z-index: -1; }
    .deal::before { transform: translate(${u(1.2)}, ${u(1)}); background: ${halftone("var(--p)", 2.6, 8, "top")}, var(--y); }
    .deal::after { border: ${u(0.9)} solid var(--k); }
    .price { position: absolute; left: 0; right: 0; bottom: ${u(3)}; display: flex; justify-content: center; align-items: flex-end; gap: ${u(1.6)};
             font-size: ${u(50)}; line-height: 0.8; color: var(--r); }
    .side { display: flex; flex-direction: column; align-items: flex-start; }
    .pct { font-size: 0.4em; }
    .off { font-size: 0.285em; margin-top: 0.14em; }
    /* red ink with the black plate's outline landing beside it */
    .ink { position: relative; display: block; }
    .ink::after { content: attr(data-t); position: absolute; left: 0; top: 0; color: rgba(0, 0, 0, 0); -webkit-text-stroke: ${u(0.85)} var(--k); transform: translate(${u(1)}, ${u(0.75)}); }

    .burst { position: absolute; z-index: 2; right: ${u(-2.2)}; top: ${u(-17)}; width: ${u(31)}; height: ${u(31)}; display: grid; place-items: center; transform: rotate(10deg); animation: wobble 1.1s steps(1) infinite; }
    .burst i { position: absolute; inset: 0; clip-path: ${star(16, 40)}; background: var(--r); }
    .burst i:first-child { background: var(--k); transform: translate(${u(1)}, ${u(0.9)}); }
    .burst b { position: relative; font-weight: 900; font-size: ${u(3.7)}; line-height: 1; color: var(--p); letter-spacing: 0.02em; }
    .burst strong { display: block; font-weight: 900; font-size: ${u(11.5)}; line-height: 1; color: var(--y); letter-spacing: 0; }
    @keyframes wobble { 0% { transform: rotate(10deg); } 50% { transform: rotate(4deg) scale(1.05); } }

    .band { flex: none; align-self: stretch; margin-top: ${u(2.6)}; padding: ${u(1.1)} 0 ${u(0.9)}; background: var(--k); color: var(--y); line-height: 1; }
    .band span { font-size: min(${u(10.8)}, calc(${u(90)} / var(--em, 8.9))); }

    .today { flex: none; max-width: 94cqw; overflow: hidden; text-overflow: ellipsis; margin-top: ${u(1.4)}; line-height: 1.15; color: var(--r); text-transform: uppercase;
             font-size: max(${u(3)}, min(${u(5.6)}, calc(${u(92)} / var(--em, 19)))); }

    .clip { flex: none; align-self: stretch; margin: ${u(1)} ${u(4)} 0; display: flex; align-items: center; gap: ${u(1.5)}; font-size: ${u(3.5)}; }
    .clip::before, .clip::after { content: ""; flex: 1; border-top: ${u(0.5)} dashed var(--k); }
    .coupons { flex: 1 1 0; min-height: 0; max-height: ${u(68)}; align-self: stretch; margin: ${u(1.4)} ${u(4.5)} 0 ${u(4)}; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: ${u(1.8)} ${u(2.2)}; }
    .cpn { position: relative; z-index: 0; min-height: 0; display: flex; align-items: center; gap: ${u(1)}; padding: 0 ${u(1)}; border: ${u(0.55)} dashed var(--k); text-align: left; }
    /* every other coupon gets the yellow plate, landing low and to the right of its box */
    .cpn:nth-child(4n + 1), .cpn:nth-child(4n) { background: linear-gradient(var(--y), var(--y)) ${u(0.9)} ${u(0.8)} / 100% 100% no-repeat border-box; box-shadow: ${u(0.9)} ${u(0.8)} 0 var(--y); }
    .cpn::before { content: "\\2702\\FE0E"; position: absolute; left: ${u(2.5)}; top: ${u(-3.2)}; font: 400 ${u(5.4)}/1 "Segoe UI Symbol", "Apple Symbols", "DejaVu Sans", sans-serif; animation: snip 0.9s steps(1) infinite; }
    @keyframes snip { 50% { transform: translateX(${u(1.4)}) rotate(-14deg); } }
    /* the product photos: one black plate, so no colour */
    .cpn i { flex: none; width: ${u(10.5)}; text-align: center; font: normal 400 ${u(8.6)}/1 "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; filter: grayscale(1) contrast(1.35); }
    .cpn b { display: block; font-weight: 900; font-size: min(${u(5.6)}, calc(${u(28)} / var(--em, 4.4))); line-height: 1; }
    .cpn em { display: block; font-style: normal; font-size: ${u(7.1)}; line-height: 0.98; color: var(--r); text-shadow: ${u(0.4)} ${u(0.3)} 0 var(--k); }
    .cpn small { display: block; margin-top: ${u(0.4)}; font: 700 ${u(2.5)}/1 Arial, Helvetica, sans-serif; letter-spacing: 0.03em; }

    .limit { flex: none; margin-top: ${u(1.5)}; letter-spacing: 0.02em; line-height: 1; font-size: min(${u(7)}, calc(${u(91)} / var(--em, 16.5))); }
    .fine { flex: none; margin: ${u(0.8)} 0 ${u(1)}; font: 700 ${u(2.6)}/1.25 Arial, Helvetica, sans-serif; }

    /* squatter frames: fewer coupons, then none, so the sheet keeps its width */
    @container (min-aspect-ratio: 49/100) { .paper { --u: min(1cqw, 0.53cqh); } .cpn:nth-child(n + 5) { display: none; } }
    @container (min-aspect-ratio: 58/100) { .paper { --u: min(1cqw, 0.59cqh); } .cpn:nth-child(n + 3) { display: none; } }
    @container (min-aspect-ratio: 66/100) { .paper { --u: min(1cqw, 0.725cqh); } .clip, .coupons, .fine { display: none; } }
    @container (max-height: 560px) { .paper { --u: min(1cqw, 0.725cqh); } .clip, .coupons, .fine { display: none; } }
    @container (min-aspect-ratio: 80/100) { .paper { --u: min(1cqw, 0.9cqh); } .sub, .limit, .foot, .burst { display: none; } }

    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; border-left: 0; border-bottom: 3px solid #17130e; box-shadow: 0 3px 9px rgba(0, 0, 0, 0.4); }
      .paper { --u: min(1cqh, 0.7cqw); justify-content: flex-start; }
      .strip, .sub, .clip, .coupons, .fine, .foot, .burst { display: none; }
      .mast { display: flex; justify-content: center; gap: 0.22em; margin-top: ${u(2)}; line-height: 1; font-size: min(${u(15)}, calc(95cqw / (var(--mast, 11.6) + 0.22))); }
      .bf, .db { font-size: 1em; }
      .hero { flex: 1; min-height: 0; align-self: stretch; display: flex; align-items: center; justify-content: center; gap: ${u(5.5)}; }
      .deal { align-self: center; height: auto; margin: 0; padding: ${u(3.6)} ${u(3)} ${u(3)}; }
      .price { position: static; font-size: ${u(54)}; }
      .band { align-self: center; margin: 0; padding: ${u(2)} ${u(2.6)} ${u(1.6)}; transform: rotate(-3deg); box-shadow: ${u(1)} ${u(0.9)} 0 var(--r); }
      .band span { display: block; font-size: ${u(10.2)}; line-height: 1.02; }
      .band br { display: inline; }
      .limit { display: block; margin: 0 0 ${u(1)}; font-size: min(${u(5.2)}, calc(94cqw / var(--em, 16.5))); }
      .today { order: 2; align-self: stretch; max-width: none; margin: 0; padding: ${u(1.5)} 2cqw; background: var(--k); color: var(--y); font-size: max(${u(3)}, min(${u(5.6)}, calc(94cqw / var(--em, 19)))); }
      @container (min-aspect-ratio: 21/10) {
        .hero { padding-left: ${u(31)}; }
        .price { font-size: ${u(63)}; }
        .band span { font-size: ${u(12)}; }
        .burst { display: grid; right: auto; left: ${u(-33)}; top: 50%; margin-top: ${u(-15.5)}; }
      }
    }
    @media (prefers-reduced-motion: reduce) { .burst, .cpn::before { animation: none; } }
  `,

    html: `
    <div class="frame" role="img" aria-label="Newspaper sale circular. Black Friday doorbusters: 30% off the entire internet. Today only. Limit one internet per customer."><div class="paper">
      <div class="strip"><span data-fit>&#9733; FREE! TAKE ONE &#9733; SAVINGS ON EVERY PAGE &#9733;</span></div>
      <div class="mast imp"><span class="bf" data-fit>BLACK FRIDAY</span><span class="db" data-fit>DOORBUSTERS</span></div>
      <div class="sub"><b>Every website must go!</b>Our manager has lost his mind!</div>
      <div class="hero">
        <div class="deal">
          <div class="burst imp"><i></i><i></i><b>DOORS OPEN<strong>5AM</strong>SHARP!</b></div>
          <div class="price imp"><span class="ink" data-t="30">30</span><span class="side"><span class="ink pct" data-t="%">%</span><span class="ink off" data-t="OFF">OFF</span></span></div>
        </div>
        <div class="band imp"><span data-fit>THE ENTIRE <br>INTERNET</span></div>
      </div>
      <div class="today" data-fit>Today only at <span class="host"></span></div>
      <div class="clip">CLIP 'N SAVE!</div>
      <div class="coupons">
        <div class="cpn"><i>&#128240;</i><div><b class="imp" data-fit>NEWS</b><em class="imp">30% OFF</em><small>GOOD OR BAD</small></div></div>
        <div class="cpn"><i>&#128252;</i><div><b class="imp" data-fit>VIDEOS</b><em class="imp">30% OFF</em><small>CATS INCLUDED</small></div></div>
        <div class="cpn"><i>&#128231;</i><div><b class="imp" data-fit>EMAIL</b><em class="imp">30% OFF</em><small>SPAM INCLUDED</small></div></div>
        <div class="cpn"><i>&#128722;</i><div><b class="imp" data-fit>SHOPPING</b><em class="imp">30% OFF</em><small>CART NOT INCL.</small></div></div>
        <div class="cpn"><i>&#128008;</i><div><b class="imp" data-fit>CAT PICS</b><em class="imp">30% OFF</em><small>ASSORTED CATS</small></div></div>
        <div class="cpn"><i>&#128172;</i><div><b class="imp" data-fit>COMMENTS</b><em class="imp">30% OFF</em><small>DO NOT READ</small></div></div>
      </div>
      <div class="limit imp" data-fit>LIMIT ONE INTERNET PER CUSTOMER</div>
      <div class="fine">WHILE SUPPLIES LAST &middot; NO RAINCHECKS &middot; NO DEALERS<br>*30% of each page will be unavailable for viewing.</div>
      <div class="foot"><span data-fit>QUESTIONS? CALL 1-800-555-0130 &#9733; OPEN 24 HRS</span></div>
    </div></div>
  `,

    setup(root) {
      const paper = root.querySelector(".paper");
      root.querySelector(".host").textContent = location.hostname || "this website";

      // Headlines are set to fill the column, like a paste-up. Impact is not the same width
      // everywhere (and a hostname can be any length), so measure each line once in its own
      // font and hand its width in ems to the stylesheet, which does the division.
      let tries = 0;
      function fit() {
        if (!paper.isConnected) { if (tries++ < 300) requestAnimationFrame(fit); return; }
        const ruler = document.createElement("span");
        ruler.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font-size:100px;line-height:1";
        paper.append(ruler);
        const ems = (el) => {
          const cs = getComputedStyle(el);
          ruler.style.fontFamily = cs.fontFamily;
          ruler.style.fontWeight = cs.fontWeight;
          ruler.style.fontStyle = cs.fontStyle;
          ruler.style.textTransform = cs.textTransform;
          ruler.style.letterSpacing = (parseFloat(cs.letterSpacing) || 0) / (parseFloat(cs.fontSize) || 1) + "em";
          ruler.textContent = el.textContent.replace(/\s+/g, " ").trim();
          return ruler.offsetWidth / 100;
        };
        let masthead = 0;
        for (const el of root.querySelectorAll("[data-fit]")) {
          const width = ems(el);
          if (!width) continue;
          el.style.setProperty("--em", width.toFixed(3));
          if (el.parentNode.classList.contains("mast")) masthead += width;
        }
        if (masthead) root.querySelector(".mast").style.setProperty("--mast", masthead.toFixed(3));
        ruler.remove();
      }
      requestAnimationFrame(fit);
    },
  };
})();
