// Design: Mattress. The mattress warehouse blowout: stars, bunting, a diagonal BLOWOUT banner
// and an explosion badge, all in red, white and blue. The manager has lost his mind.
globalThis.thirtyOffDesign = (() => {
  // Spiky shapes for clip-path, as percentages of the box. `rough` above 0 makes every spike a
  // different length and a little off its angle, the same way each time: an explosion, not a star.
  const burst = (spikes, inner, rough = 0) => {
    const points = [];
    for (let i = 0; i < spikes * 2; i++) {
      const noise = Math.sin(i * 12.9898 + spikes) * 43758.5453;
      const random = noise - Math.floor(noise);
      const angle = ((i + (random - 0.5) * rough) / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = 50 * (i % 2 ? inner * (1 + (random - 0.5) * rough * 0.3) : 1 - random * rough * 0.35);
      points.push(`${(50 + radius * Math.cos(angle)).toFixed(1)}% ${(50 + radius * Math.sin(angle)).toFixed(1)}%`);
    }
    return `polygon(${points.join(",")})`;
  };

  // One row of five-pointed stars, reused down the panel.
  const star = (cx, cy, r) => {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2, reach = i % 2 ? r * 0.42 : r;
      d += `${i ? "L" : "M"}${(cx + reach * Math.cos(angle)).toFixed(2)} ${(cy + reach * Math.sin(angle)).toFixed(2)}`;
    }
    return d + "Z";
  };
  let starRow = "", starRows = "";
  for (let x = 6; x < 300; x += 16) starRow += star(x, 4, 2.3);
  for (let row = 0; row < 52; row++) starRows += `<use href="#mw-stars" x="${row % 2 ? 8 : 0}" y="${row * 9}"/>`;

  // Bunting: a string that sags between fixings every 50 units, with pennants hanging from it.
  const sag = (x) => { const t = (x % 50) / 50; return 1 + 13 * t * (1 - t); };
  let string = "M0 1", pennants = "";
  for (let x = 50; x <= 400; x += 50) string += `Q${x - 25} 7.5 ${x} 1`;
  for (let i = 0; i < 48; i++) {
    const left = i * (50 / 6) + 0.6, right = left + 7.1, mid = (left + right) / 2;
    pennants += `<polygon class="c${i % 3}" points="${left.toFixed(2)},${sag(left).toFixed(2)} ${right.toFixed(2)},${sag(right).toFixed(2)} ${mid.toFixed(2)},${(sag(mid) + 9.4).toFixed(2)}"/>`;
  }

  // Sizes below are written in "u": 1u is 1% of the panel's width, or less when the panel is
  // too short to hold the whole sign at that size. They are turned into calc() at the bottom.
  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      border-left: 4px solid #000; background: #1024d4;
    }
    .in {
      --u: min(1cqw, 0.47cqh);
      --red: #e8101c; --blue: #1024d4; --yellow: #ffe600;
      --impact: Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif;
      --black: "Arial Black", "Arial Bold", Arial, sans-serif;
      position: absolute; inset: 0; overflow: hidden; isolation: isolate; display: flex; flex-direction: column;
      background: radial-gradient(ellipse 90% 45% at 50% 42%, #3f7bff, #1024d4 60%, #0a188f);
      color: #fff; text-align: center; text-transform: uppercase; white-space: nowrap;
      /* Impact has one weight. 900 is for the fallbacks, and Impact itself is not faked bolder. */
      font: 900 4u/1 var(--impact); font-synthesis-weight: none;
      paint-order: stroke fill; -webkit-text-stroke: 0 #000;
    }
    svg { position: absolute; display: block; pointer-events: none; }
    .stars { z-index: -1; top: 0; left: 50%; width: 300u; height: 468u; margin-left: -150u; fill: #fff; }
    .bunting { top: -0.4u; left: 50%; width: 400u; height: 15u; margin-left: -200u; overflow: visible; }
    .bunting path { fill: none; stroke: #fff; stroke-width: 0.7; }
    .bunting polygon { stroke: #000; stroke-width: 0.45; stroke-linejoin: round; transform-box: fill-box; transform-origin: 50% 0; animation: sway 1.9s ease-in-out infinite alternate; }
    .bunting .c0 { fill: var(--red); }
    .bunting .c1 { fill: #fff; animation-delay: -0.6s; }
    .bunting .c2 { fill: #2f9bff; animation-delay: -1.3s; }
    .bunting polygon:nth-child(even) { animation-duration: 2.3s; }
    @keyframes sway { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }
    @keyframes spin { to { rotate: 360deg; } }
    @keyframes pump { to { scale: 1.05; } }

    /* the top of the sign, on the star field */
    .sky { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: space-around; padding: 11u 0 2u; }
    .bf { flex: none; font-size: 14.5u; letter-spacing: 0.02em; -webkit-text-stroke: 1.7u #000; text-shadow: 0.8u 0.8u 0 var(--red); }

    .ban { position: relative; z-index: 1; flex: none; width: 130cqw; rotate: -6deg; margin: 4.5u 0 0; box-shadow: 0 0 0 0.6u #000, 0 2u 0 0.6u rgba(0, 0, 0, 0.5); }
    .blow { background: var(--red); border: solid var(--yellow); border-width: 1.3u 0; font-size: 20u; line-height: 1.1; letter-spacing: 0.03em; -webkit-text-stroke: 1.8u #000; text-shadow: 1u 1u 0 #000; }
    .blow span { display: inline-block; transform: skewX(-9deg); }
    .emg { background: var(--yellow); color: #000; font: 900 5.2u/1.5 var(--black); letter-spacing: 0.02em; }

    .boom { position: relative; flex: none; width: 98u; height: 67u; margin: -3u 0 -3u; rotate: -4deg; animation: pump 0.6s ease-in-out infinite alternate; }
    .boom i { position: absolute; inset: 0; clip-path: ${burst(19, 0.74, 0.7)}; }
    .boom .k { background: #000; transform: translate(0.9u, 1.2u) scale(1.04); }
    .boom .r { background: var(--red); }
    .boom .y { inset: 8% 7%; background: radial-gradient(closest-side, #fff, var(--yellow) 62%); clip-path: ${burst(17, 0.8, 0.6)}; }
    .off { position: absolute; inset: 0; padding-top: 1.5u; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: var(--black); color: var(--red); -webkit-text-stroke: 2.2u #000; text-shadow: 0.9u 0.9u 0 #000; }
    .off b { font-size: 32u; line-height: 0.84; letter-spacing: -0.05em; }
    .off b + b { font-size: 22.5u; line-height: 0.92; letter-spacing: -0.02em; }

    .net { position: relative; flex: none; display: flex; flex-direction: column; align-items: center; }
    .tag { position: absolute; top: -8.5u; right: -9u; width: 17.5u; height: 17.5u; display: grid; place-content: center; border-radius: 50%; background: #fff; color: var(--red); border: 0.5u solid #000; box-shadow: inset 0 0 0 0.8u #fff, inset 0 0 0 1.3u var(--red), 0.7u 0.7u 0 #000; font-style: normal; font-size: 4.7u; line-height: 1.02; rotate: 13deg; }
    .tag.free { right: auto; left: -9u; background: var(--red); color: #fff; box-shadow: inset 0 0 0 0.8u var(--red), inset 0 0 0 1.3u #fff, 0.7u 0.7u 0 #000; font-size: 6.6u; rotate: -14deg; }
    .net span { font-size: 8.6u; letter-spacing: 0.04em; -webkit-text-stroke: 1.3u #000; }
    .net b { font-size: 20.5u; line-height: 0.98; letter-spacing: 0.02em; color: var(--yellow); -webkit-text-stroke: 2u #000; text-shadow: 1u 1u 0 #000; }

    .list { display: none; flex: none; flex-direction: column; align-items: center; gap: 1.6u; }
    .list b { padding: 0.8u 4u 1u; border: 0.6u solid #000; box-shadow: 0.8u 0.8u 0 #000; background: var(--red); font-size: 11u; letter-spacing: 0.03em; rotate: -3deg; }
    .list b + b { background: #fff; color: var(--blue); rotate: 2deg; }
    .list b + b + b { background: var(--yellow); color: #000; rotate: -2deg; }

    /* the bottom of the sign: the small print of the genre, on red */
    .floor { position: relative; flex: none; padding-bottom: 1.4u; border-top: 1.5u solid #fff; box-shadow: 0 -0.6u 0 #000; background: repeating-linear-gradient(90deg, #dc0f1a 0 6u, #c70a15 6u 12u); }
    .deal { display: flex; align-items: center; justify-content: center; gap: 2.5u; padding: 2u 2u 0.8u; }
    .wow { position: relative; flex: none; width: 27u; height: 27u; }
    .wow div { position: absolute; inset: 0; animation: spin 16s linear infinite; }
    .wow i { position: absolute; inset: 0; background: #fff; clip-path: ${burst(16, 0.76)}; }
    .wow .k { background: #000; transform: scale(1.09); }
    .wow b { position: absolute; inset: 0; display: grid; place-items: center; font-size: 8.7u; color: var(--blue); rotate: -12deg; }
    .terms { display: flex; flex-direction: column; align-items: center; gap: 1u; }
    .terms b { font-size: 12.5u; letter-spacing: 0.02em; -webkit-text-stroke: 1.6u #000; text-shadow: 0.8u 0.8u 0 #000; }
    .terms span { font-size: 5.7u; letter-spacing: 0.03em; color: var(--yellow); -webkit-text-stroke: 1.1u #000; }
    .terms em { font-style: normal; font-size: 5.3u; letter-spacing: 0.03em; padding: 0.6u 1.6u 0.7u; background: var(--blue); border: 0.5u solid #fff; box-shadow: 0.7u 0.7u 0 #000; rotate: -2deg; }
    .mgr { width: 108%; margin: 1u 0 0 -4%; padding: 1.4u 0; rotate: 1.2deg; color: #000; font-size: 7u; line-height: 1.25; letter-spacing: 0.03em;
      background: repeating-linear-gradient(-45deg, #000 0 1.2u, var(--yellow) 0 2.4u) top / 100% 1.3u no-repeat, repeating-linear-gradient(-45deg, #000 0 1.2u, var(--yellow) 0 2.4u) bottom / 100% 1.3u no-repeat, var(--yellow); }
    .call { display: none; flex-direction: column; align-items: center; margin: 2.6u 5u 0.6u; padding: 1.4u 0 1.6u; background: #fff; border: 0.6u solid #000; box-shadow: 0.9u 0.9u 0 #000; color: var(--red); rotate: -1deg; }
    .call b { font-size: 8u; letter-spacing: 0.04em; }
    .call span { font: 900 9.6u/1.12 var(--black); letter-spacing: -0.03em; color: var(--blue); }
    .call small { font: 900 3.3u/1.3 var(--black); color: #000; }
    .fine { padding: 1.6u 3u 0; font: 700 2.9u/1.22 Arial, Helvetica, sans-serif; text-transform: none; white-space: normal; text-wrap: balance; }
    .fine b { white-space: nowrap; }

    /* tall, thin windows have room for more */
    @container (max-aspect-ratio: 100 / 245) { .call { display: flex; } }
    @container (max-aspect-ratio: 100 / 292) { .list { display: flex; } }
    /* shorter (or squatter) windows lose the terms first, then everything but the banner, the badge and the manager */
    @media (min-width: 769px) {
      @container (max-height: 700px) or (min-aspect-ratio: 66 / 100) {
        .in { --u: min(1cqw, 0.545cqh); }
        .deal { display: none; }
        .mgr { margin-top: 0; rotate: none; }
      }
      @container (max-height: 560px) or (min-aspect-ratio: 76 / 100) {
        .in { --u: min(1cqw, 0.61cqh); }
        .sky { padding-top: 1u; }
        .bunting, .fine { display: none; }
        .floor { padding-bottom: 0.6u; }
      }
    }
    /* narrow windows: a strip across the top, badge on the left, banner beside it */
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #000; }
      .in { --u: min(1cqw, 1.4cqh); }
      .bunting { width: 280u; height: 10.5u; margin-left: -140u; }
      .sky { display: grid; grid-template-columns: auto auto; grid-template-rows: auto auto auto; justify-content: center; align-content: center; justify-items: center; column-gap: 1u; padding: 8u 0 0; }
      .boom { grid-column: 1; grid-row: 1 / span 3; align-self: center; width: 51u; height: 48u; margin: 0; }
      .off { padding-top: 0.8u; -webkit-text-stroke-width: 1.5u; text-shadow: 0.6u 0.6u 0 #000; }
      .off b { font-size: 18u; }
      .off b + b { font-size: 13.5u; }
      .bf { grid-column: 2; font-size: 7.2u; -webkit-text-stroke-width: 1u; text-shadow: 0.5u 0.5u 0 var(--red); }
      .ban { grid-column: 2; width: auto; margin: 1.6u 0 1u; rotate: -4deg; box-shadow: 0 0 0 0.4u #000, 0.8u 1u 0 0.4u rgba(0, 0, 0, 0.5); }
      .blow { padding: 0 1.8u; border-width: 0.8u 0; font-size: 9.6u; -webkit-text-stroke-width: 1.1u; text-shadow: 0.6u 0.6u 0 #000; }
      .net { grid-column: 2; }
      .net span { font-size: 5.4u; -webkit-text-stroke-width: 0.9u; }
      .net b { font-size: 11u; -webkit-text-stroke-width: 1.2u; text-shadow: 0.6u 0.6u 0 #000; }
      .emg, .tag, .list, .deal, .call, .fine { display: none; }
      .floor { position: static; padding-bottom: 0; border-top-width: 0.8u; }
      .mgr { width: 100%; margin: 0; rotate: none; font-size: 5.4u; padding: 1.2u 0; }
      /* wide enough for a third column: the terms come back */
      @container (min-aspect-ratio: 21 / 10) {
        .sky { padding-right: calc(48u + (100cqw - 143u) / 3); }
        .deal { display: flex; flex-direction: column; gap: 1u; padding: 0; position: absolute; top: 9u; bottom: 11u; right: calc((100cqw - 143u) / 3); width: 48u; }
        .wow { width: 21u; height: 21u; }
        .wow b { font-size: 6.8u; }
        .terms b { font-size: 10u; -webkit-text-stroke-width: 1.3u; text-shadow: 0.6u 0.6u 0 #000; }
        .terms span { font-size: 4.5u; -webkit-text-stroke-width: 0.9u; }
        .terms em { font-size: 4.2u; background: var(--red); }
      }
    }
    @media (prefers-reduced-motion: reduce) { .bunting polygon, .boom, .wow div { animation: none; } }
  `.replace(/(?<![\w#.-])(-?[\d.]+)u\b/g, "calc($1 * var(--u))");

  const html = `
    <div class="frame" role="img" aria-label="Mattress warehouse blowout sign: 30% off the entire internet. Black Friday. Everything must go.">
      <div class="in">
        <svg class="stars" viewBox="0 0 300 468" aria-hidden="true"><defs><path id="mw-stars" d="${starRow}"/></defs>${starRows}</svg>
        <div class="sky">
          <div class="bf">Black Friday</div>
          <div class="ban">
            <div class="blow"><span>Blowout!</span></div>
            <div class="emg"><span>&#9733; Everything must go! &#9733;</span></div>
          </div>
          <div class="boom"><i class="k"></i><i class="r"></i><i class="y"></i><div class="off"><b>30%</b><b>OFF</b></div></div>
          <div class="net">
            <span>The entire</span>
            <b>Internet</b>
            <i class="tag free">Free!</i>
            <i class="tag">One day<br>only!</i>
          </div>
          <div class="list"><b>All sites!</b><b>All pages!</b><b>All day!</b></div>
        </div>
        <div class="floor">
          <div class="deal">
            <div class="wow"><div><i class="k"></i><i></i></div><b>Wow!</b></div>
            <div class="terms"><b>0% down!</b><span>No payments until 2031*</span><em>We finance everybody!</em></div>
          </div>
          <div class="mgr"><span>The manager has lost his mind!</span></div>
          <div class="call"><b>Call now!</b><span>1-800-555-0130</span><small>Operators are not standing by</small></div>
          <p class="fine">*30% of <span class="site">each page</span> will be unavailable for viewing. Mattress not included. <b>Call 1-800-555-0130</b></p>
        </div>
        <svg class="bunting" viewBox="0 0 400 15" aria-hidden="true"><path d="${string}"/>${pennants}</svg>
      </div>
    </div>
  `;

  return {
    css,
    html,
    setup(root) {
      // the small print names the site, unless its name would push the sign off the panel
      const host = location.hostname;
      if (host && host.length <= 18) root.querySelector(".site").textContent = host;
    },
  };
})();
