# BlackFriday
 30% Off everything on the internet, one day a year!

On Black Friday the extension covers the right-hand 30% of every page. The toolbar button
shows or hides it on the current tab on any other day.

## Working on it

- **Try it:** `chrome://extensions` → Developer mode → Load unpacked → pick `src/`. Click the
  toolbar button on any page.
- **Change the look:** the first file under `content_scripts` in `src/manifest.json` picks the
  design: `designs/classic.js` (default), `broadcast.js`, `receipt.js` or `grand.js`.
- **Test:** `npm install && npx playwright install chromium && npm test` drives the real
  extension in Chromium: the right day in several time zones, the toolbar button, and pages
  that try to break it.
- **Package:** `./package.sh` writes `src/black-friday.zip` for the Chrome Web Store. Bump
  `version` in the manifest first; the store rejects a version it has already seen.

`marketing/` holds the code that renders the ad videos, posters, store images and 3D objects
(`cd marketing && npm install && ./make-all.sh`).
