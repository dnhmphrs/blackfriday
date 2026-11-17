# BlackFriday
 30% Off everything on the internet, one day a year!

## Working on it (spoilers)

On Black Friday, by the visitor's own calendar, the extension covers the right-hand 30% of
every page with a sale banner (the top third on narrow screens). On every other day it does
nothing.

```
src/
  manifest.json   no permissions; one content script on http and https pages
  content.js      the date check, and puts the banner on the page
  banner.css      the banner's layout
  images/         the banner artwork (animated WebP) and the marquee strips
  fonts/          Inter, for the credit line (SIL Open Font License)
  icons/
```

- **Try it:** `chrome://extensions` → Developer mode → Load unpacked → pick `src/`, set the
  computer's date to Friday 27 November 2026 and open any page.
- **Test:** `npm install && npx playwright install chromium && npm test` drives the real
  extension in Chromium: the right day in several time zones, nothing on other days, the
  banner's layout at several window sizes, and pages that try to break it.
- **Package:** `./package.sh` writes `black-friday.zip`, the file to upload to the Chrome Web
  Store. Raise `version` in the manifest first.

`marketing/` renders the adverts, the banner artwork, the store images and the icons. The design
is `marketing/comps/gif-banner.*`; `cd marketing && npm install && node tools/banner-export.mjs`
writes `src/images/` from it.
