// Design: Geocities. The right-hand 30% of the page is somebody's 1998 home page: tiled stars,
// a marquee, rainbow Comic Sans, UNDER CONSTRUCTION tape, a visitor counter and a webring.
globalThis.thirtyOffDesign = (() => {
  // Every length is a multiple of --u: 1% of the frame's width, or less when the frame is
  // too squat to fit the page at that size. u(8) is "8 units".
  const u = (n) => `calc(${n} * var(--u))`;
  const RAINBOW = "#ff2a2a, #ff9d00, #fff200, #3dff1f, #19e6ff, #7f8cff, #ff4df5, #ff2a2a";
  const star = (x, y, r, colour) => `radial-gradient(circle at ${x}% ${y}%, ${colour} 0, ${colour} ${u(r)}, rgba(0, 0, 0, 0) ${u(r + 0.12)})`;

  return {
    css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background: #00002e; border-left: 4px ridge #c0c0c0;
    }
    .page {
      --u: min(1cqw, 0.49cqh);
      position: absolute; inset: 0; overflow: hidden;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding-bottom: ${u(2)}; text-align: center; color: #fff;
      font: 700 ${u(5)}/1.15 "Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", sans-serif;
      /* the starry night tile, repeated the way a 4 KB background image was */
      background-color: #00002e;
      background-image:
        ${star(12, 16, 0.5, "#ffffff")}, ${star(63, 8, 0.3, "#fffbd0")}, ${star(86, 40, 0.55, "#a8d4ff")},
        ${star(36, 52, 0.3, "#ffffff")}, ${star(9, 76, 0.42, "#ffef8a")}, ${star(58, 86, 0.6, "#ffffff")},
        ${star(79, 68, 0.25, "#ffffff")}, ${star(41, 28, 0.25, "#ffc9f6")}, ${star(24, 93, 0.25, "#ffffff")};
      background-size: ${u(31)} ${u(31)};
    }
    .page > * { flex: none; }

    @keyframes scroll { to { transform: translateX(-50%); } }
    @keyframes rainbow { to { background-position: 200% 0; } }
    @keyframes flash { 50% { color: #ff0; background: #f00; } }
    @keyframes newflash { 50% { color: #f00; background: #ff0; } }
    @keyframes spin { to { transform: rotateY(360deg); } }
    @keyframes wobble { 50% { transform: rotate(9deg) scale(1.08); } }

    /* <marquee>, rebuilt: two copies of the line side by side, slid left by one copy */
    .mq { align-self: stretch; overflow: hidden; white-space: nowrap; text-align: left; background: #000080; color: #ff0; border-bottom: ${u(0.8)} ridge #ff0; font-size: ${u(5)}; line-height: ${u(7.8)}; }
    .run { display: inline-block; white-space: pre; animation: scroll 22s linear infinite; }

    .rb { background: linear-gradient(90deg, ${RAINBOW}) 0 0 / 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: rainbow 4s linear infinite; }

    .hi { font-size: ${u(5.2)}; color: #0ff; text-shadow: ${u(0.4)} ${u(0.4)} 0 #00f; }
    .host { font-size: calc(var(--fs, 8.6) * var(--u)); line-height: 1.12; max-width: ${u(96)}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .uc { align-self: stretch; padding: ${u(1.8)} 0; background: repeating-linear-gradient(-45deg, #000 0, #000 ${u(3)}, #ffd400 ${u(3)}, #ffd400 ${u(6)}); }
    .uc b { display: block; background: #ffd400; color: #000; font: 900 ${u(5.3)}/1.55 "Arial Black", "Arial Bold", Impact, Arial, sans-serif; white-space: nowrap; }

    .hero { position: relative; }
    .big { position: relative; font-size: ${u(41)}; line-height: 0.8; letter-spacing: -0.03em; white-space: nowrap; }
    /* three copies of the word: a fat white outline with a pink shadow, a black outline, and
       the rainbow on top. A transparent stroke lets the rainbow show through it, which
       fattens the letters where the font is thin. */
    .big .sh, .big .ol { position: absolute; left: 0; right: 0; top: 0; }
    .big .sh { color: #fff; -webkit-text-stroke: ${u(3.9)} #fff; text-shadow: ${u(1.6)} ${u(1.6)} 0 #ff00d0; }
    .big .ol { color: #000; -webkit-text-stroke: ${u(2.1)} #000; }
    .big .rb { position: relative; -webkit-text-stroke: ${u(1.2)} transparent; animation-duration: 3s; }
    .new { position: absolute; right: ${u(-6)}; top: ${u(-3)}; transform: rotate(9deg); animation: wobble 1s steps(1) infinite; }
    .new span { display: block; padding: 0 ${u(1.6)}; border: ${u(0.6)} solid #000; background: #f00; color: #ff0; font: italic 900 ${u(5.6)}/1.45 "Arial Black", "Arial Bold", Impact, Arial, sans-serif; animation: newflash 1s steps(1) infinite; }

    .tei { font-size: ${u(12)}; line-height: 1; color: #ff0; text-shadow: ${u(0.55)} ${u(0.55)} 0 #f00; white-space: nowrap; }
    .bfo { padding: 0 ${u(2.5)}; background: #ff0; color: #f00; font: 700 ${u(7.2)}/1.3 "Times New Roman", Times, serif; white-space: nowrap; animation: flash 1s steps(1) infinite; }

    .hr { font-size: ${u(5.2)}; line-height: 1.1; letter-spacing: ${u(0.6)}; white-space: nowrap; font-weight: 400; }

    /* <table border=3 bgcolor=silver> */
    .tbl { display: flex; gap: ${u(0.8)}; width: ${u(95)}; padding: ${u(0.8)}; background: #c0c0c0; border: ${u(0.8)} outset #f2f2f2; color: #000; font: 700 ${u(4.5)}/1.15 "Times New Roman", Times, serif; }
    .cell { flex: 1 1 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: ${u(0.6)} ${u(0.5)}; border: ${u(0.5)} inset #f2f2f2; }
    .cell:first-child { flex-grow: 1.9; }
    .odo { display: flex; margin: ${u(0.6)} 0 0; border: ${u(0.5)} ridge #9a9a9a; }
    .odo i { width: ${u(5.7)}; font: 700 ${u(7.6)}/1.2 "Courier New", Courier, monospace; color: #fff; background: linear-gradient(#6b6b6b, #000 38%, #000 62%, #6b6b6b); border-left: ${u(0.25)} solid #777; }
    .odo i:first-child { border-left: 0; }
    .at { font: 700 ${u(10)}/0.8 "Times New Roman", Times, serif; color: #ffc400; -webkit-text-stroke: ${u(0.35)} #6b3d00; text-shadow: ${u(0.5)} ${u(0.5)} 0 #6b3d00; animation: spin 2.4s linear infinite; margin-bottom: ${u(1)}; }
    .cell u { color: #00e; }

    .best { padding: 0 ${u(3)}; border: ${u(0.5)} outset #d8d8d8; background: #008080; color: #fff; font: 700 ${u(4.6)}/1.6 Verdana, Tahoma, Arial, sans-serif; white-space: nowrap; }
    .best b { color: #ff0; font-weight: 700; }
    /* more furniture, for frames tall enough to have room */
    .tall, .vtall { display: none; }
    .award { padding: 0 ${u(2.5)}; border: ${u(0.7)} ridge #ffd400; background: #800080; color: #ff0; font: 700 ${u(5)}/1.6 "Times New Roman", Times, serif; white-space: nowrap; }
    .guest { font: 700 ${u(4.4)}/1.3 "Times New Roman", Times, serif; white-space: nowrap; }
    .guest u { color: #0ff; }
    .links { flex-direction: column; align-items: flex-start; width: ${u(88)}; padding: ${u(1.5)} ${u(3)} ${u(2)}; border: ${u(0.7)} ridge #0ff; background: #000; text-align: left; font: 700 ${u(5)}/1.4 "Times New Roman", Times, serif; white-space: nowrap; }
    .links b { align-self: center; color: #f0f; font: 700 ${u(5.6)}/1.5 "Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", sans-serif; }
    .links u { color: #0ff; }
    .links em { padding: 0 ${u(1)}; background: #f00; color: #ff0; font: italic 900 ${u(3.6)}/1 "Arial Black", "Arial Bold", Impact, Arial, sans-serif; animation: newflash 1s steps(1) infinite; }
    .midi { padding: 0 ${u(2.5)}; background: #000; border: ${u(0.4)} solid #0f0; color: #0f0; font: 700 ${u(4.4)}/1.7 "Courier New", Courier, monospace; white-space: nowrap; }
    .ring { font: 700 ${u(4.9)}/1.3 "Times New Roman", Times, serif; white-space: nowrap; }
    .ring u { color: #0ff; }
    .ring b { color: #ff0; font-weight: 700; }
    .fine { max-width: ${u(96)}; font: 400 ${u(3.3)}/1.15 "Times New Roman", Times, serif; color: #d6d6d6; }

    @container (max-aspect-ratio: 21/50) and (min-height: 561px) { .tall { display: block; } }
    @container (max-aspect-ratio: 8/25) and (min-height: 561px) { .vtall { display: flex; } }
    /* squat frames: the offer, the tape and the webring; the rest of the furniture goes */
    @container (max-height: 560px) or (min-aspect-ratio: 2/3) {
      .page { --u: min(1cqw, 0.74cqh); }
      .hr, .tbl, .best, .fine, .tei br { display: none; }
      .tei { font-size: ${u(7)}; }
    }
    /* phones and narrow windows: a banner across the top third */
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; border-left: 0; border-bottom: 4px ridge #c0c0c0; }
      .page { --u: min(1cqw, 2.3cqh); padding-bottom: 0; }
      .welcome, .hr, .tbl, .best, .ring, .fine, .tall, .vtall, .tei br, .uc b { display: none; }
      .mq { font-size: ${u(3.2)}; line-height: ${u(5)}; border-bottom-width: ${u(0.5)}; }
      .big { display: inline-block; font-size: ${u(19)}; }
      .big + .big { margin-left: ${u(4)}; }
      .big .sh { -webkit-text-stroke-width: ${u(2)}; text-shadow: ${u(0.9)} ${u(0.9)} 0 #ff00d0; }
      .big .ol { -webkit-text-stroke-width: ${u(1.05)}; }
      .big .rb { -webkit-text-stroke-width: ${u(0.55)}; }
      .new { right: ${u(-9)}; top: ${u(-1)}; }
      .new span { font-size: ${u(3.4)}; border-width: ${u(0.4)}; }
      .tei { font-size: ${u(7)}; text-shadow: ${u(0.4)} ${u(0.4)} 0 #f00; }
      .bfo { font-size: ${u(4.6)}; }
      .uc { order: 9; padding: ${u(1.3)} 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .run, .rb, .new, .new span, .bfo, .at, .links em { animation: none; }
    }
  `,

    html: `
    <div class="frame" role="img" aria-label="A 1998 personal home page, under construction. 30% off the entire internet. Black Friday only."><div class="page">
      <div class="mq" data-scrolls><div class="run"><span class="m">~*~ WELCOME 2 MY HOME PAGE ~*~ 30% OFF THE ENTIRE INTERNET ~*~ BLACK FRIDAY ONLY ~*~ </span><span class="m">~*~ WELCOME 2 MY HOME PAGE ~*~ 30% OFF THE ENTIRE INTERNET ~*~ BLACK FRIDAY ONLY ~*~ </span></div></div>
      <div class="welcome">
        <div class="hi">~*~ WeLcOmE tO ~*~</div>
        <div class="host"><span class="rb site">my home page</span></div>
      </div>
      <div class="uc"><b>&#128679; UNDER CONSTRUCTION &#128679;</b></div>
      <div class="hero">
        <div class="big"><span class="sh">30%</span><span class="ol">30%</span><span class="rb">30%</span></div>
        <div class="big"><span class="sh">OFF</span><span class="ol">OFF</span><span class="rb">OFF</span></div>
        <div class="new"><span>NEW!</span></div>
      </div>
      <div class="tei">THE ENTIRE<br> INTERNET</div>
      <div class="bfo">BLACK FRIDAY ONLY!!!</div>
      <div class="hr">&#128293;&#127760;&#128293;&#127760;&#128293;&#127760;&#128293;&#127760;&#128293;</div>
      <div class="tbl">
        <div class="cell"><div>You are visitor no.</div><div class="odo"><i>0</i><i>0</i><i>0</i><i>0</i><i>0</i><i>3</i><i>0</i></div></div>
        <div class="cell"><div class="at">@</div><div><u>E-mail me!</u></div></div>
      </div>
      <div class="best">Best viewed at <b>70% width</b></div>
      <div class="hr tall">&#11088;&#128192;&#11088;&#128192;&#11088;&#128192;&#11088;&#128192;&#11088;</div>
      <div class="award tall">&#127942; COOL SALE OF THE DAY &#127942;</div>
      <div class="guest tall">&#128214; <u>Sign my guestbook</u> &#128214; <u>View my guestbook</u></div>
      <div class="links vtall">
        <b>~ My KeWL LiNkZ ~</b>
        <span>&#128073; <u>The other 70% of this page</u></span>
        <span>&#128073; <u>Pictures of my cat</u></span>
        <span>&#128073; <u>30% OFF midi files</u> <em>HOT!</em></span>
        <span>&#128073; <u>My awards (1)</u></span>
      </div>
      <div class="midi vtall">&#127925; Now playing: sale.mid &#127925;</div>
      <div class="ring">[ <u>Prev</u> | <b>30% OFF WEBRING</b> | <u>Next</u> ]</div>
      <div class="fine">*30% of each page will be unavailable for viewing.<br>This page last updated 11/27/98. Do not steal my HTML.</div>
    </div></div>
  `,

    setup(root) {
      const host = location.hostname || "my home page";
      const site = root.querySelector(".site");
      site.textContent = host;
      // long addresses get smaller letters, down to a floor where they are cut off with "..."
      site.parentNode.style.setProperty("--fs", String(Math.max(4.2, Math.min(9, 150 / host.length)).toFixed(2)));

      const line = `~*~ WELCOME 2 ${host.toUpperCase()} ~*~ 30% OFF THE ENTIRE INTERNET ~*~ BLACK FRIDAY ONLY ~*~ SiGn My GuEsTbOoK ~*~ THIS PAGE IS UNDER CONSTRUCTION ~*~ `;
      for (const copy of root.querySelectorAll(".m")) copy.textContent = line;

      // The visitor counter: goes up by a hundred a day, and always ends in 30.
      const now = new Date();
      const days = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 864e5);
      const digits = String(days * 100 + 30).padStart(7, "0").slice(-7);
      root.querySelectorAll(".odo i").forEach((cell, i) => { cell.textContent = digits[i]; });
    },
  };
})();
