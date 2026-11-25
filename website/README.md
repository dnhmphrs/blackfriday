# 30% Off EVERYTHING: the countdown site

A one-screen Black Friday countdown for the Chrome extension **30% Off EVERYTHING** (brought to you by
Gary Mustard Enterprises), in the same look as the extension's banner and the store images and posts
("Globe Badge", see `socials/templates/v-starburst-post.html` and `extension/src/content.js`). The
badge (the red and yellow starbursts, the globe, 30% OFF on its sash, BUT WAIT… THERE'S LESS! stamped on
its shoulder) beside a split-flap clock; EVERYTHING ON THE INTERNET., the red BLACK FRIDAY ONLY! tag and
the four cards (FREE, Gratis, $0.00, NO CHARGE); the yellow tape; the navy credit; the ticker along the top and the crawl along the bottom; all on the
royal-blue tube with its rays and faint marks, through the banner's VHS tape filter. One link: the
yellow tape, ADD TO CHROME, to the Chrome Web Store.

Plain JavaScript and WebGL 1, no frameworks or rendering libraries, bundled with Rollup.

## Build

```sh
cd website
npm install
npm run build        # -> dist/: index.html (CSS inlined), assets/main-*.js, fonts/, images/, og.png, favicon.png
npm run dev          # rebuilds on change and serves dist/ at http://127.0.0.1:5173/
npm run serve        # serves an existing dist/ at http://127.0.0.1:5173/
```

Open it over http(s). Chrome will not load the web fonts for a page opened from `file://`. Everything
else still works there, but the lettering falls back to Arial Black.

## Previewing dates

The clock always counts to the next Black Friday (the day after US Thanksgiving, so the Friday between
23 and 29 November) in the visitor's own time zone. Override "now" with `?now=`:

| URL | What you see |
| --- | --- |
| `?now=2026-11-20T12:00` | before: STARTS IN, DAYS : HRS : MIN : SEC (06:12:00:00) |
| `?now=2026-11-27T14:00` | the day itself: ENDS IN, HRS : MIN : SEC to midnight (10:00:00), everything flashing |
| `?now=2026-11-28T10:00` | after: counting to next year's (362:14:00:00 to 26 Nov 2027) |
| `?now=2026-11-26T23:59:55` | watch it switch into Black Friday mode five seconds later |
| `?now=2026-11-27T23:59:55` | watch the day end and the count to next year start |

`now` takes an ISO date (`2026-11-27`, local midnight), a local date-time (`2026-11-27T14:00`), a
date-time with an offset (`2026-11-27T14:00Z`; write `+` as `%2B`), or milliseconds since 1970. The clock
runs on from that moment. Two more switches:

- `?freeze` stops the clock and all motion (for screenshots).
- `?keep` keeps the tape filter on even on a slow machine (see below).

To see the calm version, turn on "reduce motion" in the OS, or emulate `prefers-reduced-motion` in the
browser's dev tools.

## How it works

- `src/clock.js` does the date maths: `blackFriday(year)`, `status(now)` (mode `before` / `today` /
  `after`, the moment counted to, and the time left), the clock's units, and the `?now=` parser.
- `src/main.js` lays the page out (design px times a scale from the window: 1280 x 800 for wide windows,
  430 x 900 for tall ones), fits each piece of lettering to its box, runs the split-flap digits, and
  checks the time every frame. When the moment passes, the page switches mode live.
- The layout is a CSS grid (`.stage`): wide, the badge at the left and the clock over the words at the
  right; tall, the badge, then the clock, then the words. The bands (ticker, tape, credit, crawl) are
  rows of a flex column. The badge is plain HTML and SVG in `index.html` and sizes itself to its grid
  cell with container query units: inside `.badge`, 1em is the badge's radius, and every part (bursts,
  plate, globe, sash, stamp, glints) is placed in em, with the banner's own proportions.
- `src/gl/bg.glsl` draws the background under the page with WebGL: the royal-blue tube gradient, the
  maker's mark tiled at 9.5% (`src/images/tile.png`, as the banner's), 24 pale rays turning round the
  badge, and the glow behind it. On Black Friday, all day, it draws the same in warm sun tones instead
  (orange to red, sun-yellow rays, a hot glow); before and after the day it is the blue look.
- The tape look is the banner's own SVG filter (`#tape`, in `index.html`) on the whole picture, plus
  CSS scanlines and dark corners (`.lines`). If the page then draws under 24 frames a second, the filter
  is taken off (and put back if that made no difference).
- Without WebGL the page still works: a CSS gradient and a CSS glow behind the badge (warm on the day).
- Black Friday mode: the warm ground, and the bands and tag recoloured to read on it; the bursts and
  rays spin fast, 30% OFF pumps, the stamp thuds every 2 s, the tag jolts, the clock glows, the crawl
  adds TODAY ONLY!, and a yellow TODAY ONLY! tape slams across the screen every 9 seconds. On every
  other 0.25 s beat, all in step, the sash and the tag flip red/yellow, the clock's header and glow
  flare, and the rays and the screen's rim flash yellow: 2 flashes a second, under WCAG 2.3.1's limit
  of 3.
- With `prefers-reduced-motion` nothing moves: a still globe (a blue-facing frame), still bursts and
  rays, still tape noise, no flashing and no takeover; on the day, the warm palette, still. The clock
  still counts.

## Checking

`npm run check` (after a build) opens `dist/` in headless Chromium at 1440x900, 1280x800, 1366x650,
1920x1080, 390x844 @2x, 844x390 @2x and 768x1024. It covers each size before the day, on it (two frames,
either side of the beat) and with reduced motion, plus the day after, the live switches, and a browser
without WebGL. On each run it checks that the page does not scroll, that there
are no console errors, no failed or outside requests, that WebGL is on, and that the clock's digits
are right. Screenshots go to `screenshots/`. Playwright is a dev dependency (`npm install`); on a new machine also run
`npx playwright install chromium`.

`npm run og` re-renders the share image `public/og.png` (1200 x 630) from the built page. Run
`npm run build` again afterwards. If python3 with Pillow is available, the script cuts the image to
256 colours.

## Deploy

`dist/` is a static site that makes no requests to other servers. Put it on any static host (Netlify,
Cloudflare Pages, S3, GitHub Pages, a plain web server), at the root or in a subfolder, since all
paths are relative.

Social previews need an absolute image URL, so build with the address the site will live at:

```sh
SITE_URL=https://example.com/ npm run build
```

That fills in `og:url` and makes `og:image` / `twitter:image` absolute. Without it they stay relative,
and some previewers ignore relative URLs.

Vercel: set the project's Root Directory to `website`. `vercel.json` tells it to run `npm run build`
and serve `dist/`, and the build picks up the production domain itself for the share-image links.

GitHub Pages, for example, can use a workflow that runs `npm ci && SITE_URL=https://<user>.github.io/<repo>/ npm run build`
in `website/` and publishes `website/dist` with `actions/upload-pages-artifact` and `actions/deploy-pages`.

`dist/` is not committed (see `.gitignore`). It is rebuilt in a second from the sources, and the build
needs `SITE_URL` for the host it is going to, so a committed copy would go stale or carry the wrong
URLs.

## Files

```
src/index.html      the page (head, markup, the badge's SVG, the #tape filter); the build inlines style.css into it
src/style.css       layout and the look; Black Friday mode under .bf, its flashes under .bf.beat
src/main.js         layout, fitting, the clock, the beat, the WebGL drawing
src/clock.js        Black Friday date maths and ?now=
src/gl/             the WebGL helper and the background shader
src/images/tile.png the faint lockup tile (inlined into the script as a texture)
public/             copied into dist/ as-is: fonts (OFL, LICENSE.txt), the globe, favicon (the extension's icon), og.png
scripts/            serve.mjs (static server), check.mjs (screenshots + checks), og.mjs (share image)
screenshots/        the last check's screenshots
```
