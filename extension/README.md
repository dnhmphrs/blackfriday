# The extension

On Black Friday, by the visitor's own local date, the extension covers the right-hand 30% of every
page with a sale banner (the top third, full width, on windows 768px wide or narrower). On every
other day it does nothing. It asks for no permissions and makes no network requests.

```
src/            the extension, exactly as packaged
  manifest.json   one content script on every http and https page; no permissions
  content.js      the date check, and builds the banner
  banner.css      the banner's layout and motion
  images/ fonts/ icons/
test/           end-to-end tests in real Chromium (Playwright)
package.sh      writes black-friday.zip, the file to upload to the Chrome Web Store
```

## Try it

`chrome://extensions` → turn on Developer mode → Load unpacked → pick `src/`. Then set the
computer's date to a Black Friday (e.g. Friday 27 November 2026) and open any web page.

## Test

```sh
npm install
npx playwright install chromium   # only on a machine that has never had Playwright's Chromium
npm test                          # test/e2e.mjs: 63 checks
node test/smoke.mjs [name] [path to a Chromium-based browser]
test/smoke-all.sh <folder of browsers> [label]
```

`npm test` drives the real extension: the right day in several time zones and across midnight,
nothing on other days, the banner's layout at several window sizes, and pages that try to break it.
`test/smoke.mjs` is a quicker check (23 checks) of one browser on a handful of awkward pages, with
screenshots in `test/shots/smoke-<name>/`; `test/smoke-all.sh` runs it in every browser in a folder
(see the comment at its top for the layout) and prints one line per browser.

## Package and publish an update

1. Raise `version` in `src/manifest.json` above the last version uploaded to the store.
2. `npm test`, then `./package.sh`. It writes `black-friday.zip` (19 files, about 1.1 MB) and lists it.
3. In the Chrome Web Store developer dashboard: the item → Package → Upload new package → pick
   `black-friday.zip`, then Submit for review. The listing text and images are in `../socials/`.
4. The old version stays live until the new one passes review, so upload about a week ahead.

## How it works

- **Date:** Black Friday is the one Friday from the 23rd to the 29th of November, by the local date
  (`isBlackFriday` in `content.js`). It checks again as the day starts and ends, so an open tab picks
  the banner up or drops it without a reload.
- **Isolation:** the banner lives in a shadow root on its own element, with `!important` host styles,
  so the page's CSS cannot reach it. It is shown in the top layer (a manual popover), above every
  z-index and unaffected by transforms on `<html>`. Clicks pass through everywhere but the banner.
- **Look:** the worn-VHS look is an SVG filter over the banner's face. If the page then draws too
  slowly, the filter comes off.
- **Reduced motion:** with `prefers-reduced-motion`, nothing moves.
- **Package audit:** section 0 of `test/e2e.mjs` checks what is in the package: one script, one
  stylesheet, pictures and typefaces, and no canvas, 3D, network or dynamic code (`eval`, `fetch`,
  imports, remote URLs and so on). Keep it passing; it is what the store review cares about.
