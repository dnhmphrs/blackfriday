# 30% Off EVERYTHING: the countdown site

A one-screen Black Friday countdown for the Chrome extension **30% Off EVERYTHING** (brought to you by
Gary Mustard Enterprises). It is the "Limited Time" spot as a real web page: a red BLACK FRIDAY ONLY!
marquee with chasing bulbs, a split-flap clock, the turning globe, 30% OFF / EVERYTHING ON THE INTERNET.,
the ticker along the top and the crawl along the bottom, all through a VHS tube. One link: ADD TO
CHROME, to the Chrome Web Store.

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
- WebGL, two full-window canvases:
  - `src/gl/bg.glsl`, under the page: the royal-blue tube gradient, the starburst of rays turning
    around the globe, the glow behind it, and the company lockup tiled faintly across it. On Black
    Friday the rays speed up, twist and pulse, and the palette flips blue/red on the beat.
  - `src/gl/fx.glsl`, over the page with `mix-blend-mode: hard-light`: scanlines, the tube's vignette,
    colour-blotch chroma noise, white static, a rolling tracking band, and on the day the beat's rim
    flash and a glow round the clock on each tick.
  - The softness and chroma smear come from an SVG filter (`#tape`) on the page itself. If the page
    then draws under 24 frames a second, the filter is taken off.
  - Without WebGL the page still works. It falls back to a CSS gradient and CSS scanlines.
- Black Friday mode: strobing bulbs, the marquee and background flipping colour, a shaking 30% OFF, a
  spinning TODAY ONLY! burst, fast rays, and an IT'S HAPPENING! / TODAY ONLY! tape that slams across
  the screen every 9 seconds. All the large flips run on one 0.25 s beat, in step. That is at most
  4 changes, so 2 flashes, a second, under WCAG 2.3.1's limit of 3.
- With `prefers-reduced-motion` nothing moves: a still globe, still rays, still static, no flashing
  and no takeover. The clock still counts.

## Checking

`npm run check` (after a build) opens `dist/` in headless Chromium at 1440x900, 1280x800, 1366x650,
1920x1080, 390x844 @2x, 844x390 @2x and 768x1024. It covers each mode and reduced motion, the live
switches, and a browser without WebGL. On each run it checks that the page does not scroll, that there
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
src/index.html      the page (head, markup, the #tape SVG filter); the build inlines style.css into it
src/style.css       layout and the look; Black Friday mode under .bf
src/main.js         layout, fitting, the clock, the beat, the WebGL drawing
src/clock.js        Black Friday date maths and ?now=
src/gl/             the WebGL helper and the shaders
src/images/tile.png the faint lockup tile (inlined into the script as a texture)
public/             copied into dist/ as-is: fonts (OFL, LICENSE.txt), the globe, favicon, og.png
scripts/            serve.mjs (static server), check.mjs (screenshots + checks), og.mjs (share image)
screenshots/        the last check's screenshots
```
