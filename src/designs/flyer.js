// Design: Flyer. The right-hand 30% of the page is the break-room cork board, and taped to it,
// slightly crooked, is the flyer somebody made in WordArt and ran off on the office inkjet.
globalThis.thirtyOffDesign = (() => {
  // WordArt: a back layer (outline + extrusion) under a front layer (gradient-filled letters).
  const layers = (cls, inner) => `<div class="wa ${cls}"><span class="b" aria-hidden="true">${inner}</span><span class="f">${inner}</span></div>`;
  const letters = (text) => [...text].map((ch) => (ch === " " ? '<i class="sp">&nbsp;</i>' : `<i>${ch}</i>`)).join("");
  const extrude = (steps, dx, dy, colour) => Array.from({ length: steps }, (unused, i) => `${((i + 1) * dx).toFixed(3)}em ${((i + 1) * dy).toFixed(3)}em 0 ${colour}`).join(", ");
  // each letter of the arched word gets its place on the arch: --k runs from -5.5 to 5.5
  const ARCH = "Black Friday";
  const archRules = [...ARCH].map((ch, i) => `.wa1 i:nth-child(${i + 1}) { --k: ${i - (ARCH.length - 1) / 2}; }`).join("\n    ");
  const star = (points, inner) => {
    const out = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : 50, a = (Math.PI * i) / points;
      out.push(`${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`);
    }
    return `polygon(${out.join(", ")})`;
  };
  const tab = '<div class="tab"><div><b>30% OFF</b><span>the internet</span><i>1-800-555-0130</i></div></div>';
  const torn = '<div class="tab gone"></div>';

  return {
    css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background: #b98649;
    }
    /* the cork board, in its wood-effect frame. --u is the unit everything on it is sized in:
       1% of the frame's width, eased down when the frame is too short for the whole flyer */
    .board {
      --u: min(1cqw, 0.5cqh);
      position: absolute; inset: 0; color: #111;
      background:
        radial-gradient(circle at 30% 40%, rgba(74, 42, 12, 0.5) 0 0.7px, rgba(0, 0, 0, 0) 1.5px) 0 0 / 11px 13px,
        radial-gradient(circle at 70% 20%, rgba(255, 232, 180, 0.55) 0 0.7px, rgba(0, 0, 0, 0) 1.6px) 3px 5px / 17px 19px,
        radial-gradient(circle at 50% 70%, rgba(60, 32, 8, 0.4) 0 1.2px, rgba(0, 0, 0, 0) 2.3px) 7px 2px / 29px 31px,
        radial-gradient(circle at 20% 80%, rgba(255, 220, 160, 0.4) 0 1.6px, rgba(0, 0, 0, 0) 2.7px) 0 9px / 41px 37px,
        linear-gradient(100deg, #cc9c60, #b98649 60%, #c4934f);
      box-shadow: inset 0 0 0 calc(1.6 * var(--u)) #8a5a2b, inset 0 0 0 calc(2.1 * var(--u)) #53300f, inset 0 0 calc(5 * var(--u)) calc(2 * var(--u)) rgba(40, 20, 0, 0.45);
    }

    .sheet {
      /* fills the board top to bottom, up to the length of a sheet of paper plus its tabs */
      position: absolute; left: 6cqw; right: 6cqw; top: 3.4cqh; height: min(93.6cqh, 232cqw);
      display: flex; flex-direction: column; transform: rotate(-1.7deg);
      --shadow: calc(0.5 * var(--u)) calc(0.9 * var(--u)) calc(0.9 * var(--u)) rgba(30, 12, 0, 0.5);
    }
    .tape { position: absolute; z-index: 3; width: calc(17 * var(--u)); height: calc(5.6 * var(--u)); background: linear-gradient(rgba(255, 250, 215, 0.72), rgba(246, 232, 170, 0.62)); border-left: calc(0.3 * var(--u)) dotted rgba(150, 130, 70, 0.6); border-right: calc(0.3 * var(--u)) dotted rgba(150, 130, 70, 0.6); }
    .tape.a { left: calc(-6 * var(--u)); top: calc(0.4 * var(--u)); transform: rotate(-40deg); }
    .tape.b { right: calc(-6 * var(--u)); top: calc(0.8 * var(--u)); transform: rotate(47deg); }

    .page {
      flex: 1; min-height: 0; position: relative; overflow: hidden; box-shadow: var(--shadow);
      background: #fdfdf8 linear-gradient(90deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0) 6%, rgba(0, 0, 0, 0) 94%, rgba(0, 0, 0, 0.06));
      padding: calc(3 * var(--u)) calc(4 * var(--u)) calc(1.2 * var(--u));
      display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center;
    }
    /* the printer is low on ink: fine white banding all the way down, worse in places */
    .page::after {
      content: ""; position: absolute; inset: 0; z-index: 4; pointer-events: none;
      background:
        repeating-linear-gradient(rgba(255, 255, 255, 0) 0 calc(1.25 * var(--u)), rgba(255, 255, 255, 0.2) calc(1.25 * var(--u)) calc(1.5 * var(--u))),
        repeating-linear-gradient(rgba(255, 255, 255, 0) 0 calc(17 * var(--u)), rgba(255, 255, 255, 0.34) calc(17 * var(--u)) calc(17.7 * var(--u)), rgba(255, 255, 255, 0) calc(17.7 * var(--u)) calc(19.4 * var(--u)), rgba(255, 255, 255, 0.26) calc(19.4 * var(--u)) calc(19.8 * var(--u)), rgba(255, 255, 255, 0) calc(19.8 * var(--u)) calc(43 * var(--u)));
    }

    /* somebody put their coffee down on it */
    .page::before { content: ""; position: absolute; right: calc(-3 * var(--u)); top: 61%; width: calc(21 * var(--u)); height: calc(21 * var(--u)); border-radius: 50%; border: calc(0.9 * var(--u)) solid rgba(134, 84, 30, 0.2); box-shadow: inset 0 0 calc(1 * var(--u)) rgba(134, 84, 30, 0.18); transform: scaleY(0.96) rotate(20deg); border-left-color: rgba(134, 84, 30, 0.09); }

    .memo { font: 700 calc(3 * var(--u)) / 1.3 "Courier New", Courier, monospace; white-space: nowrap; border-bottom: calc(0.9 * var(--u)) double #111; padding: 0 calc(1 * var(--u)); }

    .head { display: flex; flex-direction: column; align-items: center; }
    .wa { position: relative; display: inline-block; white-space: nowrap; }
    .wa .b { position: absolute; left: 0; top: 0; display: block; }
    .wa .f { position: relative; display: block; }

    /* WordArt no. 1: "ocean" fill, arched, extruded */
    .wa1 { font: 900 calc(13 * var(--u)) / 1 Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif; font-synthesis: none; letter-spacing: 0.01em; margin: 0.05em 0 0.36em; }
    ${archRules}
    .wa1 i { display: inline-block; font-style: normal; transform: translateY(calc(var(--k) * var(--k) * 0.0155em)) rotate(calc(var(--k) * 4deg)); }
    .wa1 i.sp { width: 0.2em; }
    .wa1 .b i { color: #06206b; -webkit-text-stroke: 0.05em #06206b; text-shadow: ${extrude(6, 0.008, 0.02, "#06206b")}; }
    .wa1 .f i { background: linear-gradient(#d9fbff 8%, #2cc4ff 42%, #0a4fe0 74%, #0a2a9c 96%); -webkit-background-clip: text; background-clip: text; color: rgba(0, 0, 0, 0); }

    /* WordArt no. 2: the rainbow one, leaning, with the grey shadow lying on the floor */
    .wa2 { font: 900 calc(19 * var(--u)) / 0.95 Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif; font-synthesis: none; letter-spacing: 0.02em; transform: skewX(-9deg); }
    .wa2 .b { color: #a6a6a6; transform-origin: 0 86%; transform: skewX(-42deg) scaleY(0.5); }
    .wa2 .f { background: linear-gradient(90deg, #ff0a1c, #ff8a00 22%, #f2d400 40%, #12b800 58%, #0080ff 76%, #8a00e6 92%); -webkit-background-clip: text; background-clip: text; color: rgba(0, 0, 0, 0); filter: drop-shadow(0.012em 0.012em 0 #000) drop-shadow(-0.008em -0.008em 0 #000); }

    /* WordArt no. 3: the fire one. Does not go with the other two. */
    .wa3 { font: 900 calc(29.5 * var(--u)) / 0.84 "Arial Black", "Arial Bold", Arial, sans-serif; letter-spacing: -0.05em; transform: rotate(-4deg); margin: 0.05em 0 0.1em; }
    .wa3 .w { display: block; }
    .wa3 .b { color: #000; -webkit-text-stroke: 0.075em #000; text-shadow: ${extrude(9, 0.011, 0.013, "#a400c4")}; }
    .wa3 .f .w { background: linear-gradient(#fff36b 12%, #ffb400 45%, #ff1a00 82%); -webkit-background-clip: text; background-clip: text; color: rgba(0, 0, 0, 0); }

    .joke { font: 700 calc(8.2 * var(--u)) / 1.02 "Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive, sans-serif; color: #d8001c; transform: rotate(1.5deg); }
    .joke b { color: #0b2fd8; text-decoration: underline; text-decoration-thickness: 0.08em; text-underline-offset: 0.08em; }

    .row { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: calc(1 * var(--u)); }
    .burst { flex: none; position: relative; width: calc(25 * var(--u)); height: calc(25 * var(--u)); background: #e4001b; clip-path: ${star(14, 39)}; display: grid; place-items: center; transform: rotate(-10deg); }
    .burst::before { content: ""; position: absolute; inset: 0; background: #ffe81a; clip-path: ${star(14, 39)}; transform: scale(0.9); }
    .burst span { position: relative; font: 900 calc(4.1 * var(--u)) / 0.98 "Arial Black", "Arial Bold", Arial, sans-serif; color: #e4001b; letter-spacing: -0.03em; }
    .side { flex: 1; min-width: 0; }
    .clip { font-size: calc(9.5 * var(--u)); line-height: 1.15; white-space: nowrap; }
    .dave { font: 700 calc(4.1 * var(--u)) / 1.12 "Courier New", Courier, monospace; }
    .dave u { text-decoration-thickness: 0.1em; }

    .host { font: 700 calc(3.5 * var(--u)) / 1.5 Verdana, Geneva, Tahoma, sans-serif; background: #fff25e; padding: 0 calc(1.6 * var(--u)); white-space: nowrap; transform: rotate(-1deg); max-width: 100%; }
    .site { display: inline-block; max-width: calc(38 * var(--u)); overflow: hidden; text-overflow: ellipsis; vertical-align: bottom; }
    .link { font: 400 calc(4.6 * var(--u)) / 1.2 "Times New Roman", Times, serif; white-space: nowrap; }
    .link u { color: #0000ee; }
    .fine { font: italic 400 calc(2.5 * var(--u)) / 1.2 Arial, Helvetica, sans-serif; color: #333; }
    .foot { display: flex; justify-content: space-between; width: 100%; font: 400 calc(2.3 * var(--u)) / 1.3 "Times New Roman", Times, serif; color: #555; border-top: calc(0.2 * var(--u)) solid #999; white-space: nowrap; }

    /* tear-off tabs. Two have gone already. */
    .tabs { flex: none; position: relative; z-index: 1; height: calc(24 * var(--u)); display: flex; gap: calc(0.45 * var(--u)); }
    .tab { flex: 1; min-width: 0; background: #fdfdf8; border-top: calc(0.25 * var(--u)) dashed #9a9a9a; transform-origin: 50% 0; box-shadow: var(--shadow); }
    .tab > div { width: 100%; height: 100%; writing-mode: vertical-rl; transform: rotate(180deg); display: flex; flex-direction: column; align-items: center; justify-content: center; white-space: nowrap; }
    .tab b { font: 900 calc(4.1 * var(--u)) / 1 "Arial Black", "Arial Bold", Arial, sans-serif; color: #d8001c; }
    .tab span { font: 700 calc(3 * var(--u)) / 1.05 Arial, Helvetica, sans-serif; }
    .tab i { font: 700 calc(2.5 * var(--u)) / 1.05 "Courier New", Courier, monospace; font-style: normal; }
    .tab.gone { background: none; border: 0; box-shadow: none; }
    .tab.gone::before { content: ""; display: block; height: calc(3 * var(--u)); background: #fdfdf8; clip-path: polygon(0 0, 100% 0, 100% 55%, 86% 100%, 68% 50%, 50% 92%, 31% 45%, 13% 88%, 0 60%); }
    .tab.c1 { transform: rotate(2.5deg); background: linear-gradient(90deg, #fdfdf8 55%, #e6e6de); animation: flap 5.5s ease-in-out infinite; }
    .tab.c2 { transform: rotate(-3deg); background: linear-gradient(270deg, #fdfdf8 55%, #e3e3da); animation: flap 7s ease-in-out -2s infinite reverse; }
    @keyframes flap { 50% { transform: rotate(0.4deg) skewX(1.5deg); } }

    /* the rest of the board, which only shows when the frame is much taller than the flyer */
    .note { display: none; position: absolute; text-align: center; box-shadow: calc(0.4 * var(--u)) calc(0.8 * var(--u)) calc(1 * var(--u)) rgba(30, 12, 0, 0.45); }
    .note::before { content: ""; position: absolute; left: 50%; top: calc(1.2 * var(--u)); width: calc(4.4 * var(--u)); height: calc(4.4 * var(--u)); margin-left: calc(-2.2 * var(--u)); border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffb3b3 0 12%, #e60019 34%, #8f0010 90%); box-shadow: calc(0.5 * var(--u)) calc(0.8 * var(--u)) calc(0.6 * var(--u)) rgba(0, 0, 0, 0.4); }
    .n1 { left: 9cqw; top: calc(3.4cqh + 238cqw); width: calc(46 * var(--u)); height: calc(40 * var(--u)); padding-top: calc(8 * var(--u)); background: linear-gradient(170deg, #fff46e, #ffe94a 70%, #f2d936); color: #17309e; font: 700 calc(6.6 * var(--u)) / 1.08 "Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive, sans-serif; transform: rotate(5deg); }
    .n1 small { display: block; font-size: 0.68em; margin-top: 0.3em; }
    .n2 { right: 7cqw; top: calc(3.4cqh + 284cqw); width: calc(66 * var(--u)); height: calc(35 * var(--u)); padding-top: calc(6 * var(--u)); background: #fbfbf6 repeating-linear-gradient(rgba(0, 0, 0, 0) 0 calc(5.1 * var(--u)), #9cc3ea calc(5.1 * var(--u)) calc(5.4 * var(--u))); border-top: calc(0.5 * var(--u)) solid #e86a6a; color: #111; font: 700 calc(4 * var(--u)) / 1.35 "Courier New", Courier, monospace; transform: rotate(-3.5deg); }
    .n2::before { top: calc(-0.6 * var(--u)); }
    .n2 b { font: 900 1.5em / 0.9 "Arial Black", "Arial Bold", Arial, sans-serif; color: #d8001c; }
    @container (max-aspect-ratio: 100 / 293) { .n1 { display: block; } }
    @container (max-aspect-ratio: 100 / 335) { .n2 { display: block; } }

    /* squat frames: drop the small print rather than shrink it past reading */
    @container (min-aspect-ratio: 100 / 180) {
      .board { --u: min(1cqw, 0.53cqh); }
      .link, .fine, .foot { display: none; }
    }
    /* short windows: the two headlines, the joke and the tabs; the rest stays in the printer */
    @container (max-height: 560px) {
      .board { --u: min(1cqw, 0.74cqh); }
      .memo, .row, .host, .link, .fine, .foot, .tab i { display: none; }
      .wa3 { font-size: calc(29 * var(--u)); }
      .joke { font-size: calc(6.2 * var(--u)); white-space: nowrap; }
      .joke br { display: none; }
      .tabs { height: calc(21 * var(--u)); }
    }
    /* narrow windows: the flyer is taped up sideways across the top of the page */
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; }
      .board { --u: min(1cqw, 2.3cqh); }
      .sheet { left: 3cqw; right: 3cqw; top: 6cqh; bottom: 6cqh; height: auto; transform: rotate(-0.9deg); }
      .tape { width: calc(11 * var(--u)); height: calc(3.6 * var(--u)); }
      .tape.a { left: calc(-4 * var(--u)); top: calc(0.2 * var(--u)); }
      .tape.b { right: calc(-4 * var(--u)); top: calc(0.4 * var(--u)); }
      .page { padding: calc(1 * var(--u)) calc(3 * var(--u)); justify-content: space-around; }
      .memo, .host, .link, .fine, .foot, .tabs, .dave, .cart { display: none; }
      /* the starburst and the clip-art globe move up into the top corners */
      .row { position: absolute; inset: 0; display: block; }
      .burst { position: absolute; left: calc(4 * var(--u)); top: calc(0.6 * var(--u)); width: calc(13.5 * var(--u)); height: calc(13.5 * var(--u)); }
      .burst span { font-size: calc(2.2 * var(--u)); }
      .side { position: absolute; right: calc(5 * var(--u)); top: calc(1.2 * var(--u)); }
      .clip { font-size: calc(7.5 * var(--u)); }
      .page::before { top: 52%; right: calc(-5 * var(--u)); }
      .head { flex-direction: row; align-items: center; gap: calc(3 * var(--u)); }
      .wa1 { font-size: calc(6.4 * var(--u)); margin: 0 0 0.3em; }
      .wa2 { font-size: calc(8.6 * var(--u)); }
      .wa3 { font-size: calc(17.5 * var(--u)); transform: rotate(-1.5deg); margin: 0; }
      .wa3 .w { display: inline; }
      .joke { font-size: calc(4.6 * var(--u)); white-space: nowrap; transform: rotate(0.6deg); }
      .joke br { display: none; }
    }
    @media (prefers-reduced-motion: reduce) { .tab { animation: none !important; } }
  `,

    html: `
    <div class="frame" role="img" aria-label="A flyer taped to a cork board: Black Friday sale, 30% off the entire internet, one day only. See Dave for details."><div class="board">
      <div class="note n1">Dave is<br>OUT today<small>back Saturday!!</small></div>
      <div class="note n2"><b>LOST!!</b><br>30% of this web page<br>if found DO NOT RETURN</div>
      <div class="sheet">
        <div class="tape a"></div><div class="tape b"></div>
        <div class="page">
          <div class="memo">TO: EVERYBODY &nbsp; <span class="date">RE: SALE</span></div>
          <div class="head">
            ${layers("wa1", letters(ARCH))}
            ${layers("wa2", "SALE!!!")}
          </div>
          ${layers("wa3", '<span class="w">30%</span> <span class="w">OFF</span>')}
          <div class="joke">The <b>ENTIRE</b><br> Internet!!</div>
          <div class="row">
            <div class="burst"><span>ONE<br>DAY<br>ONLY!!!</span></div>
            <div class="side">
              <div class="clip"><span>&#x1F310;</span><span class="cart">&#x1F6D2;</span></div>
              <div class="dave">See <u>DAVE</u><br>for details!!!</div>
            </div>
          </div>
          <div class="host">&#x2714; YES, even <span class="site">this page</span>!!</div>
          <div class="link">&#x1F449; <u>Click Here for more info!</u>**</div>
          <div class="fine">*30% of each page will be unavailable for viewing.<br>**Link does not work. This is a piece of paper.</div>
          <div class="foot"><span>C:\\My Documents\\FLYER_final_FINAL(2).doc</span><span>Page 1 of 1</span></div>
        </div>
        <div class="tabs">${tab}${tab}${torn}${tab.replace('"tab"', '"tab c1"')}${tab}${torn}${tab.replace('"tab"', '"tab c2"')}</div>
      </div>
    </div></div>
  `,

    setup(root) {
      root.querySelector(".site").textContent = location.hostname || "this page";
      root.querySelector(".date").textContent = new Date().toLocaleDateString();
    },
  };
})();
