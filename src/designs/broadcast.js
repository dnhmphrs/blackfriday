// Design: Broadcast. The right-hand 30% of the page becomes a late-night shopping channel:
// tickers, a spinning wireframe globe with 30% cut out of it, and a price card for the site
// you are on. System fonts and a canvas only, so nothing has to be loaded from anywhere.
globalThis.thirtyOffDesign = {
  css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      background:
        radial-gradient(ellipse 85% 34% at 50% 56%, #5fd0ff 0%, #2f95ff 24%, #1450f8 48%, rgba(10, 34, 214, 0) 76%),
        linear-gradient(#0a1cc4, #0a22d6 45%, #070f9c);
      border-left: 4px solid #000; color: #fff;
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-weight: 700; font-style: italic;
      --yellow: #fff035; --shade: #0a0f66;
    }
    /* scanlines and a slow roll of brightness, like a tube TV */
    .panel::after {
      content: ""; position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(rgba(0, 0, 30, 0.22) 0 1px, rgba(0, 0, 0, 0) 1px 3px), linear-gradient(rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0) 30%);
      background-size: auto, 100% 60%; background-repeat: repeat, no-repeat; animation: roll 7s linear infinite;
    }
    @keyframes roll { from { background-position: 0 0, 0 -60cqh; } to { background-position: 0 0, 0 160cqh; } }
    @keyframes slide { to { transform: translateX(-50%); } }

    .col { position: absolute; inset: 0; display: flex; flex-direction: column; }
    .ticker { flex: none; white-space: nowrap; overflow: hidden; }
    .ticker span { display: inline-block; animation: slide 18s linear infinite; }
    .ticker.top { margin-top: 1.6cqh; font: normal 400 4.6cqw/1.5 "Arial Narrow", "Helvetica Neue", Arial, sans-serif; font-stretch: condensed; letter-spacing: 0.06em; color: #e9f0ff; text-shadow: 0.3cqw 0.3cqw 0 rgba(4, 8, 80, 0.85); }
    .ticker.bottom { margin-bottom: 1.6cqh; font: italic 900 9.5cqw/1.3 "Arial Black", Arial, sans-serif; color: var(--yellow); text-shadow: 0.35cqw 0.35cqw 0 var(--shade), 0.7cqw 0.7cqw 0 var(--shade); }
    .ticker.bottom span { animation-duration: 9s; }

    .title { flex: none; margin-top: 1.4cqh; text-align: center; font-size: 15.5cqw; line-height: 0.92; letter-spacing: -0.04em; filter: drop-shadow(0.7cqw 0.7cqw 0 rgba(6, 8, 70, 0.95)); }
    .title b { display: block; font-weight: 700; }
    .title b + b { font-size: 18cqw; }

    .pill { flex: none; align-self: flex-start; margin: 2.4cqh 0 0 4cqw; padding: 0.3cqw 3.4cqw 0.7cqw 2.8cqw; border-radius: 1.2cqw; background: linear-gradient(#fffb86, #f0e11c); color: #111; font-size: 5.2cqw; transform: skewX(-9deg) rotate(-2deg); box-shadow: 0.6cqw 0.6cqw 0 rgba(6, 8, 70, 0.9); }
    .offer { flex: none; margin: 1.8cqh 0 0 4cqw; font: normal 900 25cqw/0.9 "Arial Black", Arial, sans-serif; color: var(--yellow); letter-spacing: -0.05em; transform: skewX(-9deg); transform-origin: left bottom;
             text-shadow: 0.25cqw 0.25cqw 0 var(--shade), 0.5cqw 0.5cqw 0 var(--shade), 0.75cqw 0.75cqw 0 var(--shade), 1cqw 1cqw 0 var(--shade), 1.25cqw 1.25cqw 0 var(--shade); }
    .offer small { display: block; font: italic 700 5cqw/1.1 Arial, sans-serif; letter-spacing: 0; color: #fff; margin-top: 1.2cqw; text-shadow: 0.4cqw 0.4cqw 0 rgba(6, 8, 70, 0.95); }

    /* whatever height is left: the globe on its plinth, and the price card beside it */
    .stage { flex: 1; min-height: 0; position: relative; margin-top: 1.5cqh; }
    canvas { position: absolute; right: 2cqw; top: 0; width: 46cqw; height: 46cqw; }
    .plinth { position: absolute; right: 7cqw; top: 45cqw; width: 36cqw; bottom: -20cqh; background: linear-gradient(90deg, #fff, #e9ecfb 55%, #b9c1ee); }
    .plinth::before { content: ""; position: absolute; left: 0; right: 0; top: -4.2cqw; height: 8.4cqw; border-radius: 50%; background: radial-gradient(ellipse at 50% 50%, #9aa3d6 0 28%, #f6f7ff 62%); }

    .price { position: absolute; left: 4cqw; top: 14cqw; width: 45cqw; background: #f3f4f6; border: 0.6cqw solid #000; color: #0c0c0c; box-shadow: 1cqw 1cqw 0 rgba(4, 6, 60, 0.92); transform: rotate(-1.5deg); font-size: 5.6cqw; line-height: 1.25; padding-bottom: 1cqw; }
    .price .site { background: #ff1616; color: #fff46a; font: normal 700 4.2cqw/1.7 "Arial Narrow", Arial, sans-serif; padding: 0 1.4cqw; border-bottom: 0.6cqw solid #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .price div + div { padding: 0.6cqw 1.8cqw 0; }
    .price s { text-decoration: line-through; text-decoration-color: #ff1616; text-decoration-thickness: 0.8cqw; color: #6b6f78; }
    .price .now { font: italic 900 14cqw/1 "Arial Black", Arial, sans-serif; color: #ff1616; -webkit-text-stroke: 1.1cqw #000; paint-order: stroke fill; text-align: right; padding-right: 1.5cqw; letter-spacing: -0.05em; }

    /* short windows: keep the offer, drop the furniture */
    @container (max-height: 560px) { .stage > *, .pill { display: none; } }
    @media (max-width: 768px) {
      .panel { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #000; }
      .title { font-size: 7cqw; } .title b { display: inline; } .title b + b { font-size: 7cqw; }
      .offer { margin-left: 0; text-align: center; font-size: 15cqw; transform: none; } .offer small { display: none; }
      .ticker.top { font-size: 3cqw; } .ticker.bottom { font-size: 5cqw; }
      .stage > *, .pill { display: none; }
    }
    @media (prefers-reduced-motion: reduce) { .ticker span, .panel::after { animation: none; } }
  `,

  html: `
    <div class="panel" role="img" aria-label="30% off the entire internet. Black Friday only.">
      <div class="col">
      <div class="ticker top"><span>YOU'RE WATCHING THE 30% OFF CHANNEL &#10022; LIVE ON THE RIGHT-HAND SIDE OF EVERY WEBSITE &#10022; BLACK FRIDAY ONLY &#10022; YOU'RE WATCHING THE 30% OFF CHANNEL &#10022; LIVE ON THE RIGHT-HAND SIDE OF EVERY WEBSITE &#10022; BLACK FRIDAY ONLY &#10022; </span></div>
      <div class="title"><b>World Wide</b><b>Sale</b></div>
      <div class="pill">Black Friday</div>
      <div class="offer">30% OFF<small>THE ENTIRE INTERNET !</small></div>
      <div class="stage">
        <div class="plinth"></div>
        <canvas></canvas>
        <div class="price">
          <div class="site"></div>
          <div>WAS: <s>100%</s></div>
          <div>NOW:</div>
          <div class="now">70%</div>
        </div>
      </div>
      <div class="ticker bottom"><span>BLACK FRIDAY ONLY &#10022; 30% OFF EVERYTHING &#10022; BLACK FRIDAY ONLY &#10022; 30% OFF EVERYTHING &#10022; </span></div>
      </div>
    </div>
  `,

  setup(root) {
    root.querySelector(".site").textContent = location.hostname || "This Page";

    // The globe: latitude and longitude lines on a sphere with a 108 degree wedge (30% of
    // the way round) left out, spun about its axis and drawn flat. Lines on the far side are
    // drawn first and fainter; the two faces of the cut are filled when they face us.
    const canvas = root.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const WEDGE = 108, STEP = 36, TILT = 0.3;
    const rad = (deg) => (deg * Math.PI) / 180;
    const lines = [];
    const arc = (point, count) => Array.from({ length: count + 1 }, (unused, i) => point(i / count));
    const at = (lat, lon) => [Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))];
    for (let lon = WEDGE; lon <= 360; lon += STEP) lines.push(arc((t) => at(-90 + 180 * t, lon), 28));
    for (const lat of [-60, -30, 0, 30, 60]) lines.push(arc((t) => at(lat, WEDGE + (360 - WEDGE) * t), 42));
    const faces = [[WEDGE, "#ff1616"], [360, "#ffd800"]].map(([lon, fill]) => ({ fill, lon, points: arc((t) => at(-90 + 180 * t, lon), 28) }));

    function draw(now) {
      if (!canvas.isConnected) return; // the overlay was hidden; a new one starts its own loop
      const size = Math.round(canvas.clientWidth * devicePixelRatio);
      if (size && canvas.width !== size) canvas.width = canvas.height = size;
      const R = size * 0.44, yaw = still ? 0.9 : now / 1400;
      const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosT = Math.cos(TILT), sinT = Math.sin(TILT);
      const project = ([x, y, z]) => {
        const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY;
        return [size / 2 + R * x1, size / 2 - R * (y * cosT - z1 * sinT), y * sinT + z1 * cosT];
      };
      ctx.clearRect(0, 0, size, size);
      ctx.lineCap = "round";
      const stroke = (front) => {
        ctx.strokeStyle = front ? "#ffffff" : "rgba(190, 215, 255, 0.45)";
        ctx.lineWidth = size * (front ? 0.014 : 0.008);
        ctx.shadowColor = "rgba(150, 220, 255, 0.9)";
        ctx.shadowBlur = front ? size * 0.02 : 0;
        ctx.beginPath();
        for (const line of lines) {
          for (let i = 1; i < line.length; i++) {
            const a = project(line[i - 1]), b = project(line[i]);
            if ((a[2] + b[2] > 0) === front) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
          }
        }
        ctx.stroke();
      };
      stroke(false);
      ctx.shadowBlur = 0;
      for (const face of faces) {
        // a face looks towards us when the side of it that is open to the gap does
        const side = face.lon === 360 ? 90 : WEDGE - 90;
        if (project(at(0, side))[2] <= 0) continue;
        ctx.fillStyle = face.fill;
        ctx.beginPath();
        face.points.forEach((p, i) => { const q = project(p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
        ctx.closePath();
        ctx.globalAlpha = 0.92;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      stroke(true);
      if (!still) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  },
};
