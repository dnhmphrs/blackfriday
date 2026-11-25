# 30% Off EVERYTHING

"30% Off EVERYTHING" is a joke Chrome extension by Gary Mustard Enterprises: on Black Friday, every
website you visit gets a big 30% OFF sale banner. On every other day it does nothing.

| Folder | What it is |
| --- | --- |
| [`extension/`](extension/) | The Chrome extension itself, its tests, and the script that packages it for the Chrome Web Store. |
| [`socials/`](socials/) | The kit: renders the social posts and the Chrome Web Store images, and zips them with the extension. |
| [`website/`](website/) | The one-page countdown site that counts down to Black Friday and links to the store. |

Each folder has its own README, `package.json` and `node_modules`; there is nothing to install at the top.

## Next Black Friday

1. The date logic is automatic: the extension and the website both work out Black Friday (the Friday
   after US Thanksgiving) from the visitor's own calendar. Nothing to change for a new year.
2. Update or redesign if wanted: the banner is `extension/src/`, the posts and store images are
   `socials/templates/v-starburst-post.html`.
3. Bump `version` in `extension/src/manifest.json` (it must be higher than the last version uploaded).
4. `cd extension && npm install && npm test && ./package.sh`
5. `cd socials && npm install && ./build-kit.sh` (the zip lands in `socials/out/`).
6. Upload `extension/black-friday.zip` to the Chrome Web Store (and any new images) about a week ahead,
   with "Publish automatically after review" on, so it is live in good time.
7. `cd website && npm install && SITE_URL=https://<where it lives>/ npm run build`, then deploy `website/dist/`.

On a new machine Playwright also needs its browser once: `npx playwright install chromium` in each folder.
