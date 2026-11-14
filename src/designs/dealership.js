// Design: Dealership. The right-hand 30% of the page is the windscreen of a used car at dusk,
// covered in fluorescent window-marker lettering, with pennants, a price sticker and a tube man.
globalThis.thirtyOffDesign = (() => {
  // Window-marker lettering: every letter is its own box, tipped a little, the same way each
  // time. Two identical layers, so the outline of one letter never paints over its neighbour.
  let seed = 30;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const marker = (text, cls) => {
    const letters = [...text].map((ch) => (ch === " " ? " " : `<span class="c r${Math.floor(random() * 7)}">${ch}</span>`)).join("");
    return `<div class="mk ${cls}"><div class="o" aria-hidden="true">${letters}</div><div class="f">${letters}</div></div>`;
  };

  // Pennants: a string pinned every 50 units that sags in between, seven flags to a swag.
  const COLOURS = ["#ff2020", "#ffe600", "#1f7bff", "#ffffff", "#17d84b", "#ff7a00", "#ff3fb4"];
  const sag = (k) => 1.2 + 16 * ((k % 7) / 7) * (1 - (k % 7) / 7);
  let flags = "", string = "M0 1.2";
  for (let i = 0; i < 42; i++) {
    const left = (i * 50) / 7, right = ((i + 1) * 50) / 7;
    flags += `<polygon fill="${COLOURS[i % 7]}" points="${left.toFixed(2)},${sag(i).toFixed(2)} ${right.toFixed(2)},${sag(i + 1).toFixed(2)} ${((left + right) / 2).toFixed(2)},${((sag(i) + sag(i + 1)) / 2 + 8.2).toFixed(2)}"/>`;
    string += `L${right.toFixed(2)} ${sag(i + 1).toFixed(2)}`;
  }

  // Sizes below are written in "u": 1u is 1% of the windscreen's width, or less when the window
  // is too short to hold the lettering at that size. They become calc() at the bottom.
  const css = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .lot {
      position: absolute; top: 0; right: 0; width: 30%; height: 100%;
      container-type: size; overflow: hidden; pointer-events: auto; user-select: none; cursor: default;
      border-left: 4px solid #000; background: #0b0d2e;
    }
    .car {
      --u: 1cqw;
      --green: #8dff1f; --yellow: #fff200; --pink: #ff2aa3; --white: #fffdf2; --cyan: #37f3ff;
      position: absolute; inset: 0; overflow: hidden; isolation: isolate;
      display: flex; flex-direction: column; padding-top: 9.5u;
      color: var(--white); text-align: center; text-transform: uppercase; white-space: nowrap;
      font-family: "Comic Sans MS", "Comic Sans", "Chalkboard SE", "Comic Neue", cursive; font-weight: 700;
      /* dusk through tinted glass: night at the top, the last of the sunset over the bonnet */
      background:
        radial-gradient(ellipse 120% 24u at 50% calc(100% - 9u), #ff8a2a 0, rgba(255, 58, 110, 0.6) 45%, rgba(255, 58, 110, 0) 100%),
        linear-gradient(#050926, #141059 36%, #3b1470 66%, #6a1d6b);
    }
    /* the reflection across the glass, over the lettering */
    .car::after {
      content: ""; position: absolute; inset: 0; z-index: 5; pointer-events: none;
      background: linear-gradient(113deg, rgba(255, 255, 255, 0) 0 21%, rgba(255, 255, 255, 0.085) 21% 33%, rgba(255, 255, 255, 0) 33% 37%, rgba(255, 255, 255, 0.05) 37% 41%, rgba(255, 255, 255, 0) 41%);
    }

    /* the car itself: a strip of roof above the glass and the bonnet below it */
    .car::before, .zone::after { content: ""; position: absolute; left: 0; right: 0; background: linear-gradient(#ff7a66, #e0101f 38%, #8a0012); }
    .car::before { top: 0; height: 3.4u; border-bottom: 0.7u solid #000; }
    .zone::after { bottom: 0; height: 3.6u; border-top: 0.7u solid #000; border-radius: 50% 50% 0 0 / 1.6u 1.6u 0 0; z-index: 0; }

    .flags { position: absolute; left: 0; top: 0; width: 100%; height: 14u; z-index: 3; overflow: hidden; }
    .flags polygon { stroke: #000; stroke-width: 0.35; stroke-linejoin: round; transform-box: fill-box; transform-origin: 50% 0; animation: flap 0.9s ease-in-out infinite alternate; }
    .flags polygon:nth-child(3n) { animation-delay: -0.3s; }
    .flags polygon:nth-child(3n + 1) { animation-delay: -0.6s; }
    .flags path { fill: none; stroke: #f4f4f4; stroke-width: 0.5; }
    @keyframes flap { from { transform: skewX(-9deg); } to { transform: skewX(9deg) scaleY(0.93); } }

    /* marker lettering: .f is the paint, .o is whatever was drawn round or behind it */
    .mk { position: relative; flex: none; }
    .mk .o { position: absolute; left: 0; right: 0; top: 0; color: var(--oc, #05061c); -webkit-text-stroke: var(--ow, 0.2em) var(--oc, #05061c); }
    .mk .f { position: relative; color: var(--fc, var(--white)); -webkit-text-stroke: 0.035em var(--fc, var(--white)); }
    /* brush marks: the paint is thinner where the marker went over the glass once */
    .mk .f .c {
      background: repeating-linear-gradient(97deg, rgba(0, 0, 0, 0) 0 0.07em, rgba(0, 0, 0, 0.13) 0.07em 0.1em, rgba(0, 0, 0, 0) 0.1em 0.19em, rgba(255, 255, 255, 0.4) 0.19em 0.21em, rgba(0, 0, 0, 0) 0.21em 0.27em), var(--fc, var(--white));
      color: transparent; -webkit-background-clip: text; background-clip: text;
    }
    .mk.sh .o { -webkit-text-stroke-width: 0.035em; transform: translate(0.075em, 0.075em); }
    .c { display: inline-block; }
    .r0 { transform: rotate(-6deg) translateY(0.02em); } .r1 { transform: rotate(-3deg) translateY(-0.03em); } .r2 { transform: rotate(-1deg); }
    .r3 { transform: rotate(1.5deg) translateY(0.03em); } .r4 { transform: rotate(3deg) translateY(-0.02em); } .r5 { transform: rotate(5deg); }

    .bf { font-size: 10.6u; line-height: 1.08; --fc: var(--white); --oc: #1f55ff; transform: rotate(-2.5deg); z-index: 4; }
    .big { flex: none; position: relative; transform: rotate(-4deg); margin-top: -1.5u; filter: drop-shadow(0.7u 0.9u 0 rgba(0, 0, 0, 0.7)); }
    .n30 { font-size: 39u; line-height: 0.84; letter-spacing: 0.6u; --fc: var(--yellow); --oc: var(--pink); --ow: 3.4u; }
    .off { font-size: 30.5u; line-height: 0.86; letter-spacing: 0.4u; margin-top: -2u; --fc: var(--green); --oc: var(--pink); --ow: 3u; }
    .star { position: absolute; font: 400 9u/1 Arial, sans-serif; color: var(--white); }
    .star.a { left: 3u; top: 1u; transform: rotate(-18deg); }
    .star.b { right: 2.5u; top: 27u; font-size: 7u; color: var(--cyan); transform: rotate(14deg); }
    .tei { flex: none; margin-top: 0.5u; transform: rotate(2deg); }
    .the { font-size: 10.6u; line-height: 1.04; --fc: var(--white); --oc: #05061c; }
    .net { font-size: 14.6u; line-height: 1; --fc: var(--pink); --oc: var(--white); --ow: 1.5u; filter: drop-shadow(0.5u 0.6u 0 rgba(0, 0, 0, 0.7)); }

    /* everything below the headline: what is left of the height */
    .zone { flex: 1; min-height: 0; position: relative; }
    .deals { position: absolute; left: 0; top: 1u; bottom: 5u; width: 50u; overflow: hidden; z-index: 2;
             display: flex; flex-flow: column wrap; align-content: flex-start; justify-content: space-evenly; align-items: center; }
    .deals > * { flex: none; }
    .slot { width: 50u; padding: 0.9u 0; }
    .w { line-height: 1.2; }
    .w1 { font-size: 8.6u; --fc: var(--green); --oc: #0b5a00; transform: rotate(-4deg); }
    .w2 { font-size: 10.6u; --fc: var(--yellow); --oc: #ff3d00; transform: rotate(3deg); }
    .w3 { font-size: 7.6u; --fc: var(--white); --oc: #1f55ff; transform: rotate(-2deg); }
    .w4 { font-size: 6.5u; --fc: var(--cyan); --oc: #05061c; transform: rotate(3.5deg); }
    .w5 { font-size: 6.5u; --fc: var(--white); --oc: #d4006f; transform: rotate(-3deg); }
    .asis { position: absolute; right: 5u; top: 0; z-index: 2; font-size: 10u; line-height: 1.5; padding: 0 3u; --fc: var(--white); --oc: #05061c; transform: rotate(7deg); }
    .asis svg { position: absolute; inset: -1u -1u; width: calc(100% + 2u); height: calc(100% + 2u); overflow: visible; }
    .asis path { fill: none; stroke: var(--pink); stroke-width: 3; stroke-linecap: round; }

    .sticker { width: 43u; margin: 0 auto; background: #fffdea; border: 0.5u solid #000; color: #000; transform: rotate(-5deg); box-shadow: 0.9u 0.9u 0 rgba(0, 0, 0, 0.55);
               font-family: "Arial Black", "Arial Bold", Arial, sans-serif; font-weight: 900; }
    .sticker .head { background: #e8101c; color: #fff200; font-size: 3.5u; line-height: 1.7; border-bottom: 0.5u solid #000; }
    .sticker .was { font-size: 6u; line-height: 1.25; color: #333; }
    .sticker s { text-decoration: line-through; text-decoration-color: #e8101c; text-decoration-thickness: 0.9u; }
    .sticker .now { font-size: 12.5u; line-height: 0.95; color: #e8101c; letter-spacing: -0.04em; }
    .sticker .now small { font-size: 5u; letter-spacing: 0; color: #000; vertical-align: 0.45em; }
    .sticker .stk { margin: 0.6u 1.2u 0; border-top: 0.35u dashed #000; font: 700 2.9u/1.7 "Courier New", Courier, monospace; text-transform: none; overflow: hidden; text-overflow: ellipsis; }

    .tube { position: absolute; right: -1u; bottom: 1.2u; width: 58u; height: calc(100% - 14u); overflow: visible; z-index: 1; }
    .tube path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .tube .ao { stroke: #000; stroke-width: 9.4; } .tube .af { stroke: #ff3b1e; stroke-width: 6.8; }
    .tube .bo { stroke: #000; stroke-width: 19.6; } .tube .bd { stroke: #ff3b1e; stroke-width: 17; }
    .tube .hair { stroke: #fff200; stroke-width: 2.2; }
    .tube text { font: 900 8.6px "Arial Black", "Arial Bold", Arial, sans-serif; fill: #fff200; letter-spacing: 0.4px; dominant-baseline: central; }
    .wiper { position: absolute; left: 0; bottom: 2.6u; width: 100%; height: 13u; z-index: 0; }

    .shortline { display: none; flex: none; font-size: 5.7u; line-height: 1.5; --fc: var(--green); --oc: #05061c; }
    .legal { flex: none; position: relative; z-index: 6; background: #060606; border-top: 0.5u solid #3c3c44; padding: 1.1u 2.4u 1.3u; color: #f1f1f1;
             font: 700 max(2.9u, 10px)/1.2 Arial, Helvetica, sans-serif; white-space: normal; }

    /* a bit shorter: the lot gets cramped, so the circled one goes */
    @container (min-aspect-ratio: 56/100) { .asis { display: none; } .tube { height: calc(100% - 1.2u); } }
    /* short windows: the lettering and the small print, nothing else */
    @container (max-height: 560px) or (min-aspect-ratio: 66/100) {
      .car { --u: min(1cqw, 0.755cqh); }
      .bf, .big, .tei, .shortline { margin-top: auto; margin-bottom: auto; }
      .zone { display: none; }
      .shortline { display: block; }
    }
    @media (max-width: 768px) {
      .lot { width: 100%; height: 33%; border-left: 0; border-bottom: 4px solid #000; }
      .car { --u: min(1cqw, 2.7cqh); padding-top: 5u; padding-right: 52cqh; }
      .flags { height: 5.6u; }
      .bf { font-size: 4.6u; transform: rotate(-1.5deg); }
      .big { display: flex; justify-content: center; align-items: center; gap: 3u; transform: rotate(-2deg); }
      .n30, .off { font-size: 13.4u; line-height: 0.95; margin-top: 0; --ow: 1.6u; letter-spacing: 0.2u; }
      .star { display: none; }
      .tei { display: flex; justify-content: center; align-items: center; gap: 1.6u; transform: rotate(1deg); }
      .the, .net { font-size: 5.3u; line-height: 1.2; --ow: 0.8u; }
      .zone { display: block; flex: none; height: 0; margin-right: -52cqh; }
      .deals, .asis, .wiper, .shortline, .zone::after { display: none; }
      .tube { right: 1cqw; bottom: 0; width: 60cqh; height: 72cqh; }
      .legal { margin-right: -52cqh; font-size: max(1.72u, 10px); padding: 0.7u 1.5u 0.8u; }
      /* not so wide: 30% over OFF, and the tube man keeps his corner */
      @container (max-aspect-ratio: 18/10) {
        .car { --u: min(1cqw, 1.45cqh); padding-right: 0; }
        .bf, .big, .tei { margin-right: 46cqh; }
        .big, .tei { display: block; }
        .n30 { font-size: 22u; line-height: 0.86; --ow: 2.2u; } .off { font-size: 18u; line-height: 0.88; margin-top: -1u; --ow: 2u; }
        .the { font-size: 5.6u; line-height: 1.1; } .net { font-size: 7.4u; line-height: 1.05; }
        .zone, .legal { margin-right: 0; }
      }
    }
    @media (prefers-reduced-motion: reduce) { .flags polygon { animation: none; } }
  `.replace(/(-?\d*\.?\d+)u\b/g, "calc(var(--u) * $1)");

  const html = `
    <div class="lot" role="img" aria-label="Written on a used car windscreen: Black Friday. 30% off the entire internet. Was 100%, now 70%. One owner, low miles, runs great, sold as is."><div class="car">
      <svg class="flags" viewBox="0 0 300 14" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${flags}<path d="${string}"/></svg>
      ${marker("BLACK FRIDAY", "bf sh")}
      <div class="big">
        ${marker("30%", "n30")}
        ${marker("OFF!!", "off")}
        <span class="star a">&#9733;</span><span class="star b">&#9733;</span>
      </div>
      <div class="tei">
        ${marker("THE ENTIRE", "the sh")}
        ${marker("INTERNET", "net")}
      </div>
      <div class="zone">
        <svg class="wiper" viewBox="0 0 100 13" aria-hidden="true">
          <path d="M97 13 L52 6.2" stroke="#4a4a55" stroke-width="1.1" stroke-linecap="round"/>
          <path d="M3 2.2 L96 10.6" stroke="#000" stroke-width="1.9" stroke-linecap="round"/>
          <circle cx="97" cy="12.6" r="2" fill="#2a2a31"/>
        </svg>
        <div class="deals">
          <div class="slot"><div class="sticker">
            <div class="head">Manager's Special</div>
            <div class="was">WAS <s>100%</s></div>
            <div class="now"><small>NOW</small> 70%</div>
            <div class="stk">STK# <span class="site"></span></div>
          </div></div>
          <div class="slot">${marker("1 OWNER!", "w w1 sh")}</div>
          <div class="slot">${marker("0% APR*", "w w2 sh")}</div>
          <div class="slot">${marker("LOW MILES", "w w3 sh")}</div>
          <div class="slot">${marker("RUNS GREAT!", "w w4 sh")}</div>
          <div class="slot">${marker("CLEAN TITLE", "w w5 sh")}</div>
        </div>
        <div class="mk asis sh"><div class="o" aria-hidden="true">AS IS</div><div class="f">AS IS</div>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M14 6 C40 -2 92 0 96 18 C99 36 56 42 26 38 C4 35 -2 16 12 8 C22 2 44 1 58 3"/></svg>
        </div>
        <svg class="tube" viewBox="3 28 94 112" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <path class="ao"/><path class="ao"/><path class="af"/><path class="af"/>
          <path class="bo"/><path class="bd" id="dl-spine"/>
          <text><textPath href="#dl-spine" startOffset="9">30% OFF!</textPath></text>
          <path class="hair"/>
          <g class="face">
            <circle cx="-3.9" cy="-0.5" r="3.1" fill="#fff" stroke="#000" stroke-width="0.8"/><circle cx="3.9" cy="-0.5" r="3.1" fill="#fff" stroke="#000" stroke-width="0.8"/>
            <circle cx="-3.3" cy="0" r="1.4"/><circle cx="4.5" cy="0" r="1.4"/>
            <path d="M-5.2 4.6 Q0 11 5.2 4.6 Z" style="fill:#3a0008;stroke:#000;stroke-width:0.8"/>
          </g>
          <rect x="35" y="127" width="30" height="12" rx="2" fill="#2b2b33" stroke="#000" stroke-width="1"/>
          <path d="M38 133 H62" stroke="#fff200" stroke-width="2.4" stroke-dasharray="3 3" style="stroke-linecap:butt"/>
        </svg>
      </div>
      ${marker("1 OWNER ★ RUNS GREAT ★ AS IS", "shortline sh")}
      <div class="legal">*30% of each page will be unavailable for viewing. *APR = Amount of Page Returned. Internet sold as is: no warranty, no refunds, no test drives. Tube man not for sale. Ask about our undercoating. 1-800-555-0130</div>
    </div></div>
  `;

  function setup(root) {
    root.querySelector(".site").textContent = location.hostname || "this-page";

    // The tube man: a chain of short segments standing on a blower. A wave travels up the
    // chain, and every few seconds he buckles at the waist and whips back up. Arms and hair
    // are the same idea, smaller and faster.
    const svg = root.querySelector(".tube");
    const [armOutA, armOutB] = svg.querySelectorAll(".ao");
    const [armA, armB] = svg.querySelectorAll(".af");
    const bodyOut = svg.querySelector(".bo"), body = svg.querySelector(".bd"), hair = svg.querySelector(".hair"), face = svg.querySelector(".face");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const JOINTS = 12, LENGTH = 6.6;
    const n = (value) => value.toFixed(1);
    // a line through the middle of each segment, bending at the joints
    const curve = (p) => {
      let d = `M${n(p[0][0])} ${n(p[0][1])}`;
      for (let i = 1; i < p.length - 1; i++) d += `Q${n(p[i][0])} ${n(p[i][1])} ${n((p[i][0] + p[i + 1][0]) / 2)} ${n((p[i][1] + p[i + 1][1]) / 2)}`;
      const end = p[p.length - 1];
      return d + `L${n(end[0])} ${n(end[1])}`;
    };

    function draw(now) {
      if (!svg.isConnected) return; // the overlay was hidden; a new one starts its own loop
      const t = (still ? 2300 : now) / 1000, phase = t * 5.2;
      const buckle = Math.pow(Math.max(0, Math.sin(t * 0.9)), 8) * (Math.sin(t * 0.45) > 0 ? 1 : -1);
      let x = 50, y = 131, angle = 0;
      const spine = [[x, y]], lean = [0];
      for (let j = 1; j <= JOINTS; j++) {
        angle += 0.12 * (0.3 + (0.7 * j) / JOINTS) * Math.sin(phase - j * 0.7) + 0.035 * Math.sin(t * 1.3 + j * 0.4);
        if (j === 5) angle += 0.55 * buckle;
        if (j === 9) angle -= 0.45 * buckle;
        x += LENGTH * Math.sin(angle);
        y -= LENGTH * Math.cos(angle);
        spine.push([x, y]);
        lean.push(angle);
      }
      const arm = (side) => {
        let [ax, ay] = spine[8];
        let a = lean[8] + side * (1.2 + 0.35 * Math.sin(phase * 0.8 + side));
        const points = [[ax, ay]];
        for (let k = 1; k <= 5; k++) {
          a += 0.3 * Math.sin(phase * 1.5 - k * 0.9 + side * 1.3) - side * 0.08;
          ax += 5.6 * Math.sin(a);
          ay -= 5.6 * Math.cos(a);
          points.push([ax, ay]);
        }
        return curve(points);
      };
      const left = arm(-1), right = arm(1), trunk = curve(spine);
      armOutA.setAttribute("d", left); armA.setAttribute("d", left);
      armOutB.setAttribute("d", right); armB.setAttribute("d", right);
      bodyOut.setAttribute("d", trunk); body.setAttribute("d", trunk);

      const top = lean[JOINTS], [tx, ty] = spine[JOINTS];
      let strands = "";
      for (let s = -2; s <= 2; s++) {
        const a = top + s * 0.42 + 0.3 * Math.sin(phase * 1.7 + s);
        const sx = tx + 7 * Math.sin(top) + s * 3 * Math.cos(top), sy = ty - 7 * Math.cos(top) + s * 3 * Math.sin(top);
        strands += `M${n(sx)} ${n(sy)}l${n(8 * Math.sin(a))} ${n(-8 * Math.cos(a))}`;
      }
      hair.setAttribute("d", strands);
      const fx = (spine[JOINTS - 1][0] + tx) / 2, fy = (spine[JOINTS - 1][1] + ty) / 2;
      face.setAttribute("transform", `translate(${n(fx)} ${n(fy)}) rotate(${n((top * 180) / Math.PI)})`);
      if (!still) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw); // not drawn here: setup() runs before the overlay is on the page
  }

  return { css, html, setup };
})();
