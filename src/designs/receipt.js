// Design: Receipt. The right-hand 30% of the page is torn off along a perforation and
// replaced with the till receipt for it. System monospace only.
globalThis.thirtyOffDesign = {
  css: `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .frame { position: absolute; top: 0; right: 0; width: 30%; height: 100%; container-type: size; pointer-events: auto; user-select: none; cursor: default; filter: drop-shadow(-3px 0 6px rgba(0, 0, 0, 0.4)); }
    .paper {
      position: absolute; inset: 0; overflow: hidden;
      background: #fbfaf4 linear-gradient(90deg, rgba(0, 0, 0, 0.13), rgba(0, 0, 0, 0) 9%);
      color: #17171c; font: 400 4.3cqw/1.5 ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, "Courier New", monospace;
      padding: 5cqh 7cqw 0 11cqw; text-transform: uppercase;
      /* the torn edge: a row of triangular bites out of the left side */
      --bite: 2.2cqw;
      -webkit-mask: conic-gradient(from 225deg at var(--bite) 50%, #0000 90deg, #000 0) 0 0 / 100% calc(var(--bite) * 2);
              mask: conic-gradient(from 225deg at var(--bite) 50%, #0000 90deg, #000 0) 0 0 / 100% calc(var(--bite) * 2);
    }
    .cut { position: absolute; left: 4.6cqw; top: 0; bottom: 0; border-left: 0.5cqw dashed #8b8b93; }
    .cut::before { content: "\\2702"; position: absolute; left: -2.6cqw; top: 2cqh; font-size: 5cqw; transform: rotate(90deg); color: #55555c; }
    h1 { font-size: 8.6cqw; line-height: 1.05; font-weight: 700; text-align: center; letter-spacing: 0.02em; }
    .c { text-align: center; }
    hr { border: 0; border-top: 0.45cqw dashed #17171c; margin: 1.6cqh 0; }
    hr.d { border-top-style: double; border-top-width: 1.2cqw; }
    .r { display: flex; align-items: baseline; gap: 1.5cqw; }
    .r i { flex: 1; border-bottom: 0.4cqw dotted #77777f; transform: translateY(-0.9cqw); }
    .r b { font-weight: 700; }
    .r span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .big { font-size: 6cqw; font-weight: 700; }
    .off { margin: 2.2cqh 0 1cqh; padding: 1.2cqh 0; border: 0.7cqw solid #17171c; text-align: center; font-size: 12cqw; line-height: 1; font-weight: 700; letter-spacing: -0.03em; }
    .off small { display: block; font-size: 4cqw; letter-spacing: 0.08em; margin-top: 0.6cqh; }
    .bars { height: 9cqh; margin: 2cqh 4cqw 0.6cqh; background: repeating-linear-gradient(90deg, #17171c 0 0.9cqw, #0000 0 1.4cqw, #17171c 0 1.8cqw, #0000 0 3.3cqw, #17171c 0 4.6cqw, #0000 0 5.1cqw, #17171c 0 5.5cqw, #0000 0 6.6cqw); }
    @container (max-height: 560px) { .bars, .hide-short { display: none; } }
    @media (max-width: 768px) {
      .frame { width: 100%; height: 33%; }
      .paper { padding: 2cqh 4cqw 0; font-size: 2.6cqw; -webkit-mask: none; mask: none; border-bottom: 3px dashed #17171c; }
      h1 { font-size: 5cqw; } .off { font-size: 6cqw; margin: 1cqh 0; } .off small { font-size: 2.4cqw; }
      .cut, .bars, .hide-short { display: none; }
    }
  `,

  html: `
    <div class="frame" role="img" aria-label="Receipt: one web page, Black Friday discount 30%. You get 70%."><div class="paper">
      <div class="cut"></div>
      <h1>The Internet</h1>
      <div class="c">open 24 hours</div>
      <hr>
      <div class="r"><span>Black Friday</span><i></i><span class="date"></span></div>
      <div class="r"><span>Site</span><i></i><span class="site"></span></div>
      <hr>
      <div class="r"><span>1 &times; web page</span><i></i><b>100%</b></div>
      <div class="r"><span>Black Friday</span><i></i><b>&minus;30%</b></div>
      <hr class="d">
      <div class="r big"><span>You get</span><i></i><span>70%</span></div>
      <div class="r"><span>You save</span><i></i><b>30%</b></div>
      <div class="off">30% OFF<small>the entire internet</small></div>
      <div class="r hide-short"><span>Paid</span><i></i><span>nothing</span></div>
      <div class="r hide-short"><span>Cashier</span><i></i><span>your browser</span></div>
      <div class="bars"></div>
      <div class="c hide-short">Black Friday only<br>no refunds &middot; no exchanges<br>thank you for browsing</div>
    </div></div>
  `,

  setup(root) {
    root.querySelector(".site").textContent = location.hostname || "this page";
    root.querySelector(".date").textContent = new Date().toLocaleDateString();
  },
};
