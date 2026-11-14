// Design: Infomercial. The right-hand 30% of the page is a paid programme, as seen at 3 a.m.:
// a gold 30% OFF on a starburst, BUT WAIT THERE'S MORE, and a clock that really counts down to midnight.
globalThis.thirtyOffDesign = (() => {
  // Every length is a multiple of --u: 1% of the frame's width, or less when the frame is
  // too squat to fit the whole offer at that size. u(8) is "8 units".
  const u = (n) => `calc(${n} * var(--u))`;
  // Sizes of the Impact lettering also carry --k (or --kh for the gold 30% OFF), which setup()
  // sets below 1 where Impact is missing and a wider font is standing in for it.
  const k = (n, fit = "--k") => `calc(${n} * var(--u) * var(${fit}, 1))`;
  const burst = (points, inner) => {
    const out = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : 50, a = (Math.PI * i) / points;
      out.push(`${(50 + r * Math.sin(a)).toFixed(1)}% ${(50 - r * Math.cos(a)).toFixed(1)}%`);
    }
    return `polygon(${out.join(", ")})`;
  };
  const extrude = (steps, step, colour) => Array.from({ length: steps }, (unused, i) => `${((i + 1) * step).toFixed(3)}em ${((i + 1) * step).toFixed(3)}em 0 ${colour}`).join(", ");
  // gold lettering: a dark outline and red extrusion underneath, trophy-shop chrome on top
  const gold = (cls, text) => `<div class="g ${cls}"><span class="b" aria-hidden="true">${text}</span><span class="f">${text}</span></div>`;
  const IMPACT = `Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif`;
  const BLACK = `"Arial Black", "Arial Bold", Arial, sans-serif`;

  return {
    css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .tv {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background: linear-gradient(#0718a8 0%, #1a14c0 30%, #5a10b4 66%, #8a0f9c 88%, #4a0670 100%);
      border-left: 4px solid #000;
    }
    .in {
      --u: min(1cqw, 0.48cqh);
      position: absolute; inset: 0; isolation: isolate;
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      padding-bottom: ${u(1.5)}; text-align: center; color: #fff; text-transform: uppercase; white-space: nowrap;
      font: 900 ${k(5)}/1 ${IMPACT}; font-synthesis: none;
    }
    .in > * { flex: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes flash { 0%, 49.9% { background: #ffe600; color: #d80000; } 50%, 100% { background: #d80000; color: #ffe600; } }
    @keyframes twinkle { 0%, 100% { transform: scale(0.3) rotate(0deg); opacity: 0.2; } 50% { transform: scale(1) rotate(45deg); opacity: 1; } }

    /* the channel strip */
    .strip { width: 100%; background: #000; border-bottom: ${u(0.8)} solid #ffd21e; color: #ffe600; font: italic 900 ${u(4.9)}/1.5 ${BLACK}; letter-spacing: 0.02em; }
    .strip .m { display: none; }
    .strip i { font-style: normal; color: #ff2a1a; }

    /* 30% OFF on its starburst */
    .hero { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; }
    .rays, .glow { position: absolute; left: 50%; top: 50%; z-index: -1; border-radius: 50%; }
    .rays {
      width: ${u(210)}; height: ${u(210)}; margin: ${u(-105)} 0 0 ${u(-105)};
      background: repeating-conic-gradient(rgba(255, 208, 46, 0.95) 0deg 5deg, rgba(255, 208, 46, 0) 5.6deg 14.4deg, rgba(255, 208, 46, 0.95) 15deg);
      -webkit-mask: radial-gradient(circle closest-side, #000 0, rgba(0, 0, 0, 0.8) 34%, rgba(0, 0, 0, 0) 82%);
              mask: radial-gradient(circle closest-side, #000 0, rgba(0, 0, 0, 0.8) 34%, rgba(0, 0, 0, 0) 82%);
      animation: spin 70s linear infinite;
    }
    .glow { width: ${u(120)}; height: ${u(120)}; margin: ${u(-60)} 0 0 ${u(-60)}; background: radial-gradient(circle closest-side, rgba(255, 250, 190, 0.95) 0, rgba(255, 170, 0, 0.6) 38%, rgba(255, 60, 120, 0) 100%); }
    .g { position: relative; display: inline-block; line-height: 0.86; letter-spacing: 0.01em; transform: rotate(-4deg) skewX(-7deg); }
    /* the padding gives the gradient room to cover the whole glyph, whatever the font's metrics */
    .g span { display: block; padding: 0.16em 0.08em; margin: -0.16em -0.08em; }
    .g .b { position: absolute; left: 0; top: 0; color: #22003a; -webkit-text-stroke: 0.062em #22003a; text-shadow: ${extrude(5, 0.013, "#e00012")}, 0.085em 0.085em 0 #22003a; }
    .g .f { position: relative; background: linear-gradient(#fffbd6 12%, #ffe14a 32%, #fffef4 49%, #8d4a00 51.5%, #ff9f00 66%, #ffe98a 86%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
    .n30 { font-size: ${k(42, "--kh")}; margin-top: ${u(4)}; }
    .row2 { display: flex; align-items: center; justify-content: center; gap: ${u(2)}; margin-top: ${u(-2.5)}; }
    .off { font-size: ${k(32, "--kh")}; }
    .tw { position: absolute; font: normal 400 ${u(9)}/1 Arial, sans-serif; color: #fff; text-shadow: 0 0 ${u(1.5)} #fff; animation: twinkle 1.6s ease-in-out infinite; }
    .tw.t1 { left: ${u(5)}; top: ${u(2)}; } .tw.t2 { right: ${u(4)}; top: ${u(27)}; animation-delay: -0.5s; font-size: ${u(7)}; } .tw.t3 { left: ${u(7)}; bottom: ${u(0)}; animation-delay: -1.1s; font-size: ${u(6)}; }

    /* the round red badge; its insides are in em so the whole thing can be resized at once */
    .badge { position: relative; width: 30em; height: 30em; font-size: ${u(1)}; transform: rotate(11deg); filter: drop-shadow(0.5em 0.7em 0 rgba(20, 0, 50, 0.6)); }
    .badge::before, .badge::after { content: ""; position: absolute; inset: 0; clip-path: ${burst(18, 43)}; background: #fff200; }
    .badge::after { inset: 1em; background: radial-gradient(circle at 36% 28%, #ff6b57 0, #ee0012 46%, #a8000d 100%); }
    .badge div { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5em; text-shadow: 0.25em 0.25em 0 rgba(90, 0, 0, 0.8); }
    .badge .a { font-size: calc(3.8em * var(--k, 1)); letter-spacing: 0.04em; }
    .badge .hn { width: 21.5em; }
    .badge .site { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; white-space: normal; word-break: break-all; text-transform: none; color: #fff200; font: 700 4.4em/1.05 Arial, Helvetica, sans-serif; }
    .badge .e { font-size: calc(2.8em * var(--k, 1)); letter-spacing: 0.04em; }

    .net { font-size: ${k(8.6)}; line-height: 1.12; letter-spacing: 0.035em; color: #fff200; -webkit-text-stroke: ${u(1.3)} #000; paint-order: stroke fill; text-shadow: ${u(0.6)} ${u(0.6)} 0 #000; }

    .ribbon { width: ${u(88)}; font: 900 ${u(4.6)}/${u(8.4)} ${BLACK}; letter-spacing: 0.03em; background: linear-gradient(#ff4133, #d40010 55%, #b0000c); clip-path: polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%); transform: rotate(1.5deg); text-shadow: ${u(0.4)} ${u(0.4)} 0 #5a0000; }
    .ribbon b { color: #ffe600; font-weight: 900; }

    /* before and after */
    .ba { display: flex; gap: ${u(2.4)}; width: ${u(91)}; }
    .card { flex: 1; min-width: 0; background: #fff; color: #111; border: ${u(0.6)} solid #000; box-shadow: ${u(0.9)} ${u(0.9)} 0 rgba(15, 0, 45, 0.7); transform: rotate(-2deg); }
    .card b { display: block; font: 900 ${u(3.7)}/1.4 ${BLACK}; letter-spacing: 0.08em; background: #444; color: #fff; }
    .card div { display: flex; align-items: center; justify-content: center; gap: ${u(2)}; height: ${u(11.5)}; }
    .card .pg { position: relative; width: ${u(15)}; height: ${u(9.6)}; border: ${u(0.45)} solid #222; background: linear-gradient(#5d6f95 0 22%, rgba(0, 0, 0, 0) 0), repeating-linear-gradient(#fff 0 ${u(1.2)}, #b4bccb 0 ${u(1.9)}); }
    .card .face { font: normal 400 ${u(8.4)}/1 "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; }
    .card p { font: 700 ${u(3)}/${u(5.4)} Arial, Helvetica, sans-serif; }
    .before { filter: grayscale(1); background: #e4e4e4; }
    .after { transform: rotate(2deg); background: #fffbd0; border-color: #d80000; }
    .after b { background: #d80000; color: #ffe600; }
    .after .pg::after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; width: 30%; border-left: ${u(0.3)} solid #000; background: radial-gradient(circle at 50% 45%, #ffd21e 0 28%, rgba(0, 0, 0, 0) 30%), linear-gradient(#1226c8, #7a12a8); }
    .after p { font: 900 ${k(5)}/${u(5.4)} ${IMPACT}; color: #d80000; letter-spacing: 0.03em; }

    /* but wait */
    .sw { position: relative; width: 100%; height: ${u(13)}; }
    .sw svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
    .sw span { position: absolute; left: 0; right: 0; top: 50%; font-size: ${k(7.2)}; line-height: 1; letter-spacing: 0.02em; transform: translateY(-58%) rotate(-5deg) skewX(-8deg); -webkit-text-stroke: ${u(1)} #2a0030; paint-order: stroke fill; }
    .sw em { font-style: normal; color: #fff200; }

    .pay { display: flex; align-items: center; justify-content: center; gap: ${u(2.5)}; }
    .pay span { font: 900 ${u(4.9)}/1.08 ${BLACK}; text-align: right; text-shadow: ${u(0.5)} ${u(0.5)} 0 #1a0040; }
    .pay b { font-weight: 900; font-size: ${k(14)}; line-height: 0.9; color: #6dff2e; -webkit-text-stroke: ${u(1.2)} #06300a; paint-order: stroke fill; text-shadow: ${u(0.7)} ${u(0.7)} 0 #06300a; transform: rotate(-3deg); }

    /* the clock */
    .clock { width: ${u(90)}; padding: ${u(1.4)} ${u(2)} ${u(1.6)}; background: #000; border: ${u(0.7)} solid #ffd21e; border-radius: ${u(2)}; box-shadow: ${u(0.9)} ${u(0.9)} 0 rgba(15, 0, 45, 0.7); }
    .bf { font-size: ${k(7)}; letter-spacing: 0.05em; color: #ffe600; }
    .clock .row { display: flex; align-items: center; justify-content: center; gap: ${u(2.5)}; margin-top: ${u(1)}; }
    .lab { font: 700 ${u(3.7)}/1.08 Arial, Helvetica, sans-serif; text-align: right; }
    .time { font: 700 ${u(12)}/1 "Courier New", Courier, monospace; font-variant-numeric: tabular-nums; }
    .clock .time { padding: ${u(0.3)} ${u(1.2)} 0; background: #2a0000; border-radius: ${u(0.8)}; color: #ff2a14; text-shadow: 0 0 ${u(1.4)} #ff2a14; letter-spacing: -0.03em; }

    /* call now */
    .call { width: 100%; padding: ${u(1.1)} 0 ${u(1.3)}; border: solid #000; border-width: ${u(0.8)} 0; background: #ffe600; color: #d80000; animation: flash 1s step-end infinite; }
    .c1 { font-size: ${k(7)}; letter-spacing: 0.04em; }
    .c1 i { font: normal 400 0.8em/1 "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; }
    .c2 { font-size: ${k(11.6)}; letter-spacing: 0.01em; }
    .ops { font: italic 900 ${u(3.8)}/1.3 ${BLACK}; letter-spacing: 0.03em; }
    .ops b { color: #ffe600; font-weight: 900; }
    .fine { width: ${u(93)}; font: 400 ${u(2.6)}/1.15 Arial, Helvetica, sans-serif; text-transform: none; white-space: normal; opacity: 0.92; }
    .testi { display: none; width: ${u(90)}; padding: ${u(1.2)} ${u(2)}; font: italic 700 ${u(4)}/1.2 Georgia, "Times New Roman", serif; text-transform: none; white-space: normal; background: rgba(255, 255, 255, 0.14); border: ${u(0.4)} dashed #ffe600; }
    .testi b { display: block; font: 700 ${u(2.9)}/1.4 Arial, Helvetica, sans-serif; color: #ffe600; }

    /* very tall frames get a satisfied customer */
    @container (max-aspect-ratio: 44 / 100) { .testi { display: block; } }
    /* squatter frames: drop furniture, least important first, and refit what is left */
    @container (min-aspect-ratio: 56 / 100) { .ba, .ribbon { display: none; } .in { --u: min(1cqw, 0.57cqh); } }
    @container (min-aspect-ratio: 68 / 100) { .pay, .sw, .fine { display: none; } .in { --u: min(1cqw, 0.7cqh); } }
    @container (min-aspect-ratio: 85 / 100) { .strip, .ops, .clock .row { display: none; } .in { --u: min(1cqw, 0.86cqh); } }
    /* short windows: the small print would be too small to read */
    @container (max-height: 560px) { .fine, .testi { display: none; } }

    @media (max-width: 768px) {
      .tv { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #000; }
      .in { --u: min(1cqw, 1.9cqh); padding-bottom: 0; }
      .ba, .ribbon, .sw, .fine, .ops, .clock, .testi, .pay, .badge, .strip .d, .tw.t3 { display: none; }
      .strip { display: block; font: 900 ${k(4.4)}/${u(7)} ${IMPACT}; letter-spacing: 0.05em; }
      .strip .m { display: inline; }
      .strip .time { font-size: 1em; color: #ff2a1a; }
      .hero { flex-direction: row; justify-content: center; gap: ${u(4)}; }
      .n30, .off { font-size: ${k(23, "--kh")}; margin-top: 0; }
      .row2 { margin-top: 0; gap: ${u(3)}; }
      .rays { width: ${u(150)}; height: ${u(150)}; margin: ${u(-75)} 0 0 ${u(-75)}; }
      .glow { width: ${u(110)}; height: ${u(60)}; margin: ${u(-30)} 0 0 ${u(-55)}; }
      .tw.t1 { top: ${u(-1)}; left: ${u(3)}; } .tw.t2 { top: ${u(8)}; right: ${u(2)}; }
      .net { font-size: ${k(8)}; }
      .call { display: flex; align-items: baseline; justify-content: center; gap: ${u(2.2)}; padding: ${u(0.9)} 0 ${u(1.2)}; border-bottom: 0; }
      .c1 { font-size: ${k(5.3)}; } .c2 { font-size: ${k(6.7)}; }
      @container (min-aspect-ratio: 2 / 1) { .badge { display: block; font-size: ${u(0.6)}; } .hero { gap: ${u(3)}; } }
      @container (max-aspect-ratio: 165 / 100) { .pay { display: flex; } .pay b { font-size: ${k(11)}; } .in { --u: min(1cqw, 1.57cqh); } }
    }
    @media (prefers-reduced-motion: reduce) { .rays, .call, .tw { animation: none; } }
  `,

    html: `
    <div class="tv" role="img" aria-label="Late-night TV offer: 30% off the entire internet. Black Friday only. Offer ends at midnight. Call now, 1-800-555-0130."><div class="in">
      <div class="strip"><span class="d"><i>&#9733;</i> As seen at 3 a.m.! <i>&#9733;</i></span><span class="m">Black Friday only <i>&#9733;</i> ends in <span class="time">00:00:00</span></span></div>
      <div class="hero">
        <div class="rays"></div><div class="glow"></div>
        <span class="tw t1">&#10022;</span><span class="tw t2">&#10022;</span><span class="tw t3">&#10022;</span>
        ${gold("n30", "30%")}
        <div class="row2">
          ${gold("off", "OFF")}
          <div class="badge"><div><span class="a">As seen on</span><span class="hn"><span class="site">this page</span></span><span class="e">&amp; everywhere!</span></div></div>
        </div>
      </div>
      <div class="net">The entire internet!</div>
      <div class="ribbon"><b>&#9733;</b> Not sold in stores <b>&#9733;</b></div>
      <div class="ba">
        <div class="card before"><b>Before</b><div><i class="pg"></i><span class="face">&#128553;</span></div><p>100% of a web page</p></div>
        <div class="card after"><b>After</b><div><i class="pg"></i><span class="face">&#129321;</span></div><p>Only 70%!</p></div>
      </div>
      <div class="sw">
        <svg viewBox="0 0 100 13" preserveAspectRatio="none" aria-hidden="true"><path d="M-1,14.6 Q28,-4.2 101,0.6 Q72,18.4 -1,14.6 Z" fill="#ffe600"/><path d="M1.5,13.4 Q29,-2.8 98.5,1.4 Q71,16.6 1.5,13.4 Z" fill="#f2003c"/></svg>
        <span>But wait... <em>there's more!</em></span>
      </div>
      <div class="pay"><span>Only 3 easy<br>payments of</span><b>$0.00</b></div>
      <div class="clock">
        <div class="bf">Black Friday only!</div>
        <div class="row"><span class="lab">Offer<br>ends in:</span><span class="time">00:00:00</span></div>
      </div>
      <div class="testi">&ldquo;I used to see 100% of every web page. Not anymore!&rdquo;<b>&#9733;&#9733;&#9733;&#9733;&#9733; A Real Customer, not an actor*</b></div>
      <div class="call"><div class="c1"><i>&#128222;</i> Call now! <i>&#128222;</i></div><div class="c2">1-800-555-0130</div></div>
      <div class="ops"><b>&#9733;</b> Operators are standing by <b>&#9733;</b></div>
      <div class="fine">*30% of each page will be unavailable for viewing. Results not typical. Internet sold separately. Plus $0.00 shipping &amp; handling. Void where prohibited.</div>
    </div></div>
  `,

    setup(root) {
      // the badge: the site you are on, shrunk to fit when its name is long
      const host = (location.hostname || "this page").replace(/^www\./, "");
      const site = root.querySelector(".site");
      site.textContent = host;
      site.style.fontSize = `${Math.max(2.7, Math.min(4.6, 40 / host.length)).toFixed(2)}em`;

      // Impact is missing on some systems (ChromeOS, most Linux) and whatever stands in for it
      // is wider. Measure, and where the lettering would not fit, scale it down until it does.
      const pen = document.createElement("canvas").getContext("2d");
      pen.font = `900 100px ${IMPACT}`;
      const fit = (text, widest) => Math.min(1, widest / pen.measureText(text).width);
      const inner = root.querySelector(".in");
      inner.style.setProperty("--k", fit("30% OFF THE ENTIRE INTERNET 1-800-555-0130", 2020).toFixed(3));
      inner.style.setProperty("--kh", Math.min(fit("30%", 215), fit("30%OFF", 355)).toFixed(3));

      // the clock: counts down to local midnight, then sits at 00:00:00
      const clocks = root.querySelectorAll(".time");
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
      const two = (n) => String(n).padStart(2, "0");
      let mounted = false; // setup() runs just before the overlay is put on the page
      (function tick() {
        if (mounted && !clocks[0].isConnected) return; // the overlay was hidden; a new one starts its own clock
        mounted = true;
        const left = Math.max(0, Math.ceil((midnight - Date.now()) / 1000));
        const text = `${two(Math.floor(left / 3600))}:${two(Math.floor(left / 60) % 60)}:${two(left % 60)}`;
        for (const clock of clocks) clock.textContent = text;
        if (left > 0) setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
      })();
    },
  };
})();
