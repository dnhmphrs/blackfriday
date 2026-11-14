// Design: USA. Star-spangled savings: a waving flag (drawn on a canvas, with 30% more stripes),
// fireworks, bunting and a very large eagle. Land of the free*, home of the 30% off.
globalThis.thirtyOffDesign = {
  css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .usa {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      --red: #e4132c; --blue: #1634c4; --navy: #06114f; --gold: #ffd41c;
      background: var(--red); border-left: 4px solid #000; color: #fff;
      /* Impact only has one weight; 900 is for the fallbacks, and synthesis is off so Impact is not smeared. */
      font-family: Impact, Haettenschweiler, "Arial Narrow Bold", "Arial Black", sans-serif; font-weight: 900; font-synthesis: none;
    }
    canvas { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
    /* never shown: it tells the canvas how big to paint the blue field of stars */
    .canton { position: absolute; left: 0; top: 0; width: 55cqw; height: 19cqh; visibility: hidden; pointer-events: none; }
    .emo { font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; font-weight: 400; font-style: normal; }

    /* flying money, between the flag and the lettering */
    .air { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    .air span { position: absolute; left: var(--x); top: var(--y); font-size: 9.5cqw; line-height: 1; animation: fly 7s linear infinite; }
    .air span:nth-child(1) { --x: 4cqw; --y: 38cqh; animation-delay: -1s; }
    .air span:nth-child(2) { --x: 84cqw; --y: 60cqh; animation-delay: -4.6s; animation-duration: 9s; }
    .air span:nth-child(3) { --x: 6cqw; --y: 84cqh; animation-delay: -2.8s; animation-duration: 6s; }
    .air span:nth-child(4) { --x: 80cqw; --y: 27cqh; animation-delay: -6.2s; animation-duration: 8s; }
    @keyframes fly {
      from { transform: translate(calc(-16cqw - var(--x)), 6cqh) rotate(-25deg); }
      to { transform: translate(calc(106cqw - var(--x)), -14cqh) rotate(30deg); }
    }

    .in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; text-align: center; white-space: nowrap; text-transform: uppercase; }
    .in > * { flex: none; display: flex; align-items: center; justify-content: center; }
    .in span, .in b { line-height: 1; }

    .sky { height: 19cqh; align-self: stretch; position: relative; }
    .eagle { position: absolute; right: 3cqw; bottom: 0; font-size: min(37cqw, 16cqh); line-height: 1; filter: drop-shadow(0.9cqw 0.9cqw 0 rgba(6, 17, 79, 0.9)); animation: bob 2.2s ease-in-out infinite; }
    .eagle.two { display: none; }
    @keyframes bob { 50% { transform: translateY(-1.2cqh) rotate(-5deg); } }

    /* two sashes that run off both edges of the sign */
    .sash { height: 6cqh; }
    .sash > div { flex: none; width: 124cqw; height: 5.2cqh; display: flex; align-items: center; justify-content: center; transform: rotate(-3deg); background: var(--blue); border: solid var(--gold); border-width: 0.9cqw 0; box-shadow: 0 0.9cqw 0 var(--navy), 0 -0.5cqw 0 var(--navy); }
    .sash span { font-size: min(84cqw / var(--em, 7.3), 4.6cqh); text-shadow: 0.07em 0.07em 0 var(--navy); }
    .sash span.m { display: none; }
    .sash i { font-style: normal; color: var(--gold); }
    .sash.bf { height: 6.5cqh; }
    .sash.bf > div { height: 5.4cqh; transform: rotate(2deg); background: var(--red); }
    .sash.bf span { font-size: min(84cqw / var(--em, 8.3), 4.7cqh); }

    .home { height: 5.5cqh; }
    .home span, .chant span { font-size: min(68cqw / var(--em, 5.3), 5.2cqh); letter-spacing: 0.04em; -webkit-text-stroke: 0.15em var(--navy); paint-order: stroke fill; text-shadow: 0.08em 0.08em 0 #000; }

    /* 30% is set as wide as the sign (--hw), or as tall as the room allows. OFF is set a little
       bigger and then stretched sideways to the same width, the way a sign shop would. --w and
       --h are each word's measured width and ink height in ems, --lift centres the ink in its
       line; setup() fills them in. */
    .hero { height: 44cqh; flex-direction: column; animation: pump 1.1s ease-in-out infinite;
            --w30: 1.76; --h30: 0.8; --woff: 1.42; --hoff: 0.8; --lift: 0; --room: 42cqh;
            --per: min(1 / var(--woff), 1.15 / var(--w30));
            --hw: min(86cqw, var(--room) / 1.1 / (var(--h30) / var(--w30) + var(--hoff) * var(--per))); }
    @keyframes pump { 50% { transform: scale(1.035) rotate(-1deg); } }
    .hero .big { display: block; position: relative; top: calc(var(--lift) * 1em); z-index: 0; letter-spacing: -0.01em; -webkit-text-stroke: 0.06em var(--gold); paint-order: stroke fill; }
    .big::before, .big::after { content: attr(data-t); position: absolute; left: 0; top: 0; z-index: -1; color: var(--navy); -webkit-text-stroke: 0.135em var(--navy); }
    .big::after { z-index: -2; color: #000; -webkit-text-stroke-color: #000; transform: translate(0.045em, 0.045em); }
    .n30 { font-size: calc(var(--hw) / var(--w30)); line-height: calc(var(--h30) * 1.1); color: var(--red); }
    .off { font-size: calc(var(--hw) * var(--per)); line-height: calc(var(--hoff) * 1.1); color: #2c52ff; transform: scaleX(min(1.35, 0.95 / (var(--per) * var(--woff)))); }

    .net { height: 7cqh; }
    .net .two, .chant { display: none; }
    .net span { font-size: min(88cqw / var(--em, 8.7), 6.4cqh); letter-spacing: 0.05em; color: var(--gold); -webkit-text-stroke: 0.13em var(--navy); paint-order: stroke fill; text-shadow: 0.08em 0.08em 0 #000; }

    .money { height: 4cqh; gap: 1.6cqw; font-size: min(8cqw, 3.3cqh); }
    .money b { font-weight: 900; color: var(--gold); -webkit-text-stroke: 0.22em var(--navy); paint-order: stroke fill; }

    .fine { height: 4.5cqh; }
    .fine span { padding: 0.25cqh 2cqw; background: #fff; border: 0.4cqw solid var(--navy); color: var(--navy); font: 700 min(3.4cqw, 1.65cqh) / 1.15 Arial, Helvetica, sans-serif; text-transform: none; }

    .ticker { height: 3.5cqh; align-self: stretch; justify-content: flex-start; overflow: hidden; background: var(--navy); border-top: 0.7cqw solid var(--gold); }
    .ticker span { flex: none; font: italic 900 min(4.6cqw, 2.2cqh) / 1 "Arial Black", "Arial Bold", Arial, sans-serif; color: var(--gold); animation: slide 18s linear infinite; }
    @keyframes slide { to { transform: translateX(-50%); } }

    /* pleated fans along the top */
    .bunting { position: absolute; top: 0; left: -4cqw; right: -4cqw; display: flex; justify-content: center; border-top: 0.9cqw solid var(--gold); filter: drop-shadow(0 0.8cqw 0 rgba(6, 17, 79, 0.85)); pointer-events: none; }
    .bunting i { flex: none; position: relative; width: 24cqw; height: 12cqw; border-radius: 0 0 12cqw 12cqw; border: 0.8cqw solid var(--gold); border-top: 0;
      background: repeating-conic-gradient(from 90deg at 50% 0, rgba(0, 0, 40, 0.24) 0 6deg, rgba(255, 255, 255, 0) 6deg 12deg), radial-gradient(circle 12cqw at 50% 0, var(--blue) 0 31%, #fff 32% 63%, var(--red) 64%); }
    .bunting i::after { content: "\\2605"; position: absolute; left: 0; right: 0; top: -0.6cqw; text-align: center; color: #fff; font: 400 5cqw/1 Arial, sans-serif; }

    /* tall, thin signs (a half-screen window): rows take their height from the width instead,
       THE ENTIRE INTERNET gets two lines, and the taller it is the bigger the eagle */
    @container (max-aspect-ratio: 3 / 8) {
      .in { justify-content: space-between; }
      .canton { height: 46cqw; }
      .sky { flex: 0 1 46cqw; height: auto; min-height: 30cqw; } .eagle { font-size: 39cqw; }
      .sash { height: 15.5cqw; } .sash > div { height: 13cqw; }
      .home { height: 13.5cqw; }
      .hero { height: auto; padding: 2cqw 0; --room: 400cqw; }
      .net { height: auto; flex-direction: column; padding: 1cqw 0; } .net .one { display: none; }
      .net .two { display: block; font-size: calc(84cqw / var(--em, 4)); line-height: 1.02; }
      .sash.bf { height: 16cqw; } .sash.bf > div { height: 13cqw; }
      .money { height: 12cqw; font-size: 8.6cqw; }
      .fine { height: 13.5cqw; } .fine span { font-size: 4.3cqw; }
      .ticker { height: 8.5cqw; }
    }
    @container (max-aspect-ratio: 3 / 10) {
      .canton { height: 72cqw; }
      .sky { flex-basis: 72cqw; } .eagle { font-size: 54cqw; right: 1cqw; }
      .chant { display: flex; height: 20cqw; } .chant span { font-size: calc(80cqw / var(--em, 5.3)); }
    }

    /* short windows: the offer and the flag, no furniture */
    @container (max-height: 560px) {
      .sky, .bunting, .money, .ticker, .air { display: none; }
      .canton { height: 19cqh; }
      .sash { height: 10cqh; } .sash > div { height: 8.4cqh; } .sash span { font-size: min(84cqw / var(--em, 7.3), 7.4cqh); }
      .home { height: 9cqh; } .home span { font-size: min(68cqw / var(--em, 5.3), 8.2cqh); }
      .hero { height: 52cqh; --room: 50cqh; }
      .net { height: 11cqh; } .net span { font-size: min(88cqw / var(--em, 8.7), 9.6cqh); }
      .sash.bf { height: 10.5cqh; } .sash.bf > div { height: 8.6cqh; } .sash.bf span { font-size: min(84cqw / var(--em, 8.3), 7.4cqh); }
      .fine { height: 7.5cqh; } .fine span { font-size: min(3.4cqw, 2.6cqh); }
    }

    /* phones: the top third of the page, the offer on one line */
    @media (max-width: 768px) {
      .usa { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #000; }
      .bunting, .money, .ticker, .air, .home { display: none; }
      .canton { width: 27cqw; height: 58cqh; }
      .sky { display: block; position: absolute; inset: 0; height: auto; }
      .eagle { left: auto; right: 1.5cqw; top: 25cqh; bottom: auto; width: auto; font-size: 30cqh; filter: drop-shadow(0.5cqw 0.5cqw 0 rgba(6, 17, 79, 0.9)); }
      .eagle.two { display: block; left: 1.5cqw; right: auto; animation: none; transform: scaleX(-1); }
      .sash { height: 15cqh; margin-top: 1cqh; } .sash > div { height: 11.5cqh; transform: rotate(-1deg); border-width: 0.5cqw 0; box-shadow: 0 0.5cqw 0 var(--navy), 0 -0.3cqw 0 var(--navy); }
      .sash span { font-size: min(90cqw / var(--em, 13.5), 9.4cqh); } .sash span.d { display: none; } .sash span.m { display: inline; }
      .hero { height: 41cqh; flex-direction: row; }
      .n30, .off { font-size: min(88cqw / (var(--w30) + var(--woff) + 0.2), 37cqh / var(--h30)); }
      .off { margin-left: 0.2em; transform: none; }
      .net { height: 15cqh; } .net span { font-size: min(80cqw / var(--em, 8.7), 12.5cqh); }
      .sash.bf { height: 14cqh; margin-top: 0; } .sash.bf > div { height: 11cqh; transform: rotate(1deg); } .sash.bf span { font-size: min(84cqw / var(--em, 8.3), 9.2cqh); }
      .fine { height: 11cqh; } .fine span { font-size: min(3cqw, 6cqh); padding: 0.4cqh 1.5cqw; border-width: 0.3cqw; } .fine br { display: none; }
      @container (max-aspect-ratio: 22 / 10) { .eagle, .eagle.two { display: none; } }
    }
    @media (prefers-reduced-motion: reduce) { .eagle, .hero, .air span, .ticker span { animation: none; } }
  `,

  html: `
    <div class="usa" role="img" aria-label="Star-spangled savings. Land of the free, home of the 30% off: 30% off the entire internet. Black Friday only. The extension is free.">
      <canvas></canvas>
      <div class="canton"></div>
      <div class="air" data-scrolls><span class="emo">&#128184;</span><span class="emo">&#128181;</span><span class="emo">&#128184;</span><span class="emo">&#128181;</span></div>
      <div class="bunting"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="in">
        <div class="sky"><div class="eagle emo">&#129413;</div><div class="eagle two emo">&#129413;</div></div>
        <div class="sash"><div><span class="d" data-fit>LAND OF THE <i>FREE*</i></span><span class="m" data-fit>LAND OF THE <i>FREE*</i> &#9733; HOME OF THE</span></div></div>
        <div class="home"><span data-fit>HOME OF THE</span></div>
        <div class="hero"><span class="big n30" data-t="30%">30%</span><span class="big off" data-t="OFF">OFF</span></div>
        <div class="net"><span class="one" data-fit>THE ENTIRE INTERNET</span><span class="two" data-fit>THE ENTIRE</span><span class="two" data-fit>INTERNET</span></div>
        <div class="sash bf"><div><span data-fit>&#9733; BLACK FRIDAY ONLY &#9733;</span></div></div>
        <div class="chant"><span data-fit>U-S-A! U-S-A!</span></div>
        <div class="money"><span class="emo">&#128184;</span><b>$</b><span class="emo">&#128181;</span><b>$</b><span class="emo">&#129413;</span><b>$</b><span class="emo">&#128181;</span><b>$</b><span class="emo">&#128184;</span></div>
        <div class="fine"><span>*the extension is free. <br>the internet is 30% off.</span></div>
        <div class="ticker" data-scrolls><span>U-S-A! U-S-A! &#9733; STAR-SPANGLED SAVINGS &#9733; 30% OFF FROM SEA TO SHINING SEA &#9733; NOW WITH 30% MORE STRIPES &#9733; CALL 1-800-555-0130 &#9733; EAGLES ARE STANDING BY &#9733; U-S-A! U-S-A! &#9733; STAR-SPANGLED SAVINGS &#9733; 30% OFF FROM SEA TO SHINING SEA &#9733; NOW WITH 30% MORE STRIPES &#9733; CALL 1-800-555-0130 &#9733; EAGLES ARE STANDING BY &#9733; </span></div>
      </div>
    </div>
  `,

  setup(root) {
    const frame = root.querySelector(".usa");
    const canvas = root.querySelector("canvas");
    const canton = root.querySelector(".canton");
    const ctx = canvas.getContext("2d");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Impact is not the same width everywhere, so measure each headline once in its own font
    // and hand its width in ems to the stylesheet, which sizes it to fill the sign.
    function fit() {
      const ruler = document.createElement("span");
      ruler.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap;font-size:100px;line-height:1;text-transform:uppercase";
      frame.append(ruler);
      const ems = (el) => {
        const cs = getComputedStyle(el);
        ruler.style.fontFamily = cs.fontFamily;
        ruler.style.fontWeight = cs.fontWeight;
        ruler.style.letterSpacing = (parseFloat(cs.letterSpacing) || 0) / (parseFloat(cs.fontSize) || 1) + "em";
        ruler.textContent = el.textContent.replace(/\s+/g, " ").trim();
        return ruler.getBoundingClientRect().width / 100;
      };
      for (const el of root.querySelectorAll("[data-fit]")) {
        const width = ems(el);
        if (width) el.style.setProperty("--em", width.toFixed(3));
      }
      // The two big words also need their ink height, which differs even more between fonts.
      const hero = root.querySelector(".hero");
      for (const [name, el] of [["30", root.querySelector(".n30")], ["off", root.querySelector(".off")]]) {
        const width = ems(el);
        ctx.font = "400 100px " + getComputedStyle(el).fontFamily;
        const m = ctx.measureText(el.textContent);
        const height = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 100;
        if (!width || !(height > 0.3)) continue;
        hero.style.setProperty("--w" + name, width.toFixed(3));
        hero.style.setProperty("--h" + name, height.toFixed(3));
        // where the ink sits in a line box, against where its middle should be
        const lift = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent - m.fontBoundingBoxAscent + m.fontBoundingBoxDescent) / 200;
        if (Number.isFinite(lift)) el.style.setProperty("--lift", lift.toFixed(3));
      }
      ruler.remove();
    }

    // Fireworks go off behind the lettering, mostly near the edges where they can be seen.
    const SPOTS = [[0.82, 0.07], [0.1, 0.34], [0.9, 0.5], [0.09, 0.7], [0.9, 0.86], [0.5, 0.2], [0.12, 0.95], [0.88, 0.3]];
    const COLORS = ["#ffd41c", "#ffffff", "#8fe6ff"];
    const LIFE = 1500;
    let bursts = [], nextBurst = 0, spot = 0, fitted = false, last = -1000;

    function star(x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.4 : r;
        ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
      }
      ctx.closePath();
      ctx.fill();
    }

    function burst(b, p, w) {
      const R = b.r * (1 - Math.pow(1 - p, 3));
      const lw = Math.max(1.5, w * 0.011);
      ctx.globalAlpha = p < 0.65 ? 1 : Math.max(0, (1 - p) / 0.35);
      ctx.lineCap = "round";
      for (const [color, width] of [["#06114f", lw * 2.7], [b.color, lw]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (let j = 0; j < b.n; j++) {
          const a = b.rot + (j / b.n) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
          ctx.moveTo(b.x + c * R * (0.45 + 0.35 * p), b.y + s * R * (0.45 + 0.35 * p));
          ctx.lineTo(b.x + c * R, b.y + s * R);
          const a2 = a + Math.PI / b.n, c2 = Math.cos(a2), s2 = Math.sin(a2);
          ctx.moveTo(b.x + c2 * R * (0.12 + 0.3 * p), b.y + s2 * R * (0.12 + 0.3 * p));
          ctx.lineTo(b.x + c2 * R * 0.55, b.y + s2 * R * 0.55);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    function draw(now) {
      if (!canvas.isConnected) return; // the overlay was hidden; a new one starts its own loop
      if (!still) requestAnimationFrame(draw);
      if (!fitted) { fitted = true; fit(); }
      if (!still && now - last < 30) return; // about 30 frames a second is plenty for a flag
      last = now;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const scale = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * scale) || canvas.height !== Math.round(h * scale)) {
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const t = still ? 0.7 : now / 1000;

      // The flag. The blue field is as big as the stylesheet says; the stripes take their
      // height from it and simply carry on down the sign until it ends.
      const cw = canton.offsetWidth, ch = canton.offsetHeight;
      const rows = Math.max(3, Math.round(ch / Math.min(w * 0.085, h / 11)));
      const sh = ch / rows, amp = sh * 0.38, k = (Math.PI * 2) / (sh * 9);
      const dy = (x) => amp * (Math.sin(x * k - t * 2.1) + 0.3 * Math.sin(x * k * 2.3 - t * 3.4 + 1));
      const edge = (y, from, to, step) => { for (let x = from; step > 0 ? x < to : x > to; x += step) ctx.lineTo(x, y + dy(x)); ctx.lineTo(to, y + dy(to)); };
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e4132c";
      for (let i = -2; i * sh - amp * 1.3 < h; i += 2) {
        ctx.beginPath();
        edge(i * sh, 0, w, 8);
        edge((i + 1) * sh, w, 0, -8);
        ctx.fill();
      }
      ctx.fillStyle = "#1634c4";
      ctx.beginPath();
      ctx.moveTo(0, -sh * 2);
      ctx.lineTo(cw, -sh * 2);
      edge(rows * sh, cw, 0, -8);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      const cols = Math.max(3, Math.round(cw / (sh * 1.25))), sx = cw / cols;
      const lines = Math.max(2, Math.round(ch / (sx * 0.72))), sy = ch / lines;
      for (let r = 0; r < lines; r++) {
        for (let c = 0; c < cols - (r % 2); c++) {
          const x = (c + 0.5 + (r % 2) * 0.5) * sx;
          star(x, (r + 0.5) * sy + dy(x), Math.min(sx, sy) * 0.3);
        }
      }
      // light and shade across the folds
      const shade = ctx.createLinearGradient(0, 0, w, 0), stops = Math.ceil(w / 12);
      for (let i = 0; i <= stops; i++) {
        const s = Math.cos((i / stops) * w * k - t * 2.1);
        shade.addColorStop(i / stops, s > 0 ? `rgba(255,255,255,${(0.2 * s).toFixed(3)})` : `rgba(0,0,50,${(-0.26 * s).toFixed(3)})`);
      }
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);

      const size = Math.min(w * 0.25, h * 0.3);
      if (still) {
        SPOTS.slice(0, 4).forEach(([x, y], i) => burst({ x: x * w, y: y * h, r: size * 0.9, n: 12, rot: i, color: COLORS[i % 3] }, 0.55, w));
        return;
      }
      if (now >= nextBurst) {
        const [x, y] = SPOTS[spot++ % SPOTS.length];
        bursts.push({ born: now, x: (x + (Math.random() - 0.5) * 0.08) * w, y: (y + (Math.random() - 0.5) * 0.06) * h, r: size * (0.7 + Math.random() * 0.35), n: 10 + Math.floor(Math.random() * 5), rot: Math.random() * 6, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
        nextBurst = now + 380 + Math.random() * 420;
      }
      bursts = bursts.filter((b) => now - b.born < LIFE);
      for (const b of bursts) burst(b, (now - b.born) / LIFE, w);
    }
    requestAnimationFrame(draw);
    // With motion switched off the flag is painted once, and again only if the sign changes size.
    if (still) {
      const watcher = new ResizeObserver(() => { if (canvas.isConnected) draw(performance.now()); else watcher.disconnect(); });
      watcher.observe(canvas);
    }
  },
};
