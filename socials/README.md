# The kit: social posts and store images

The kit is every picture the launch needs, rendered from one HTML template, plus the extension
package and the store listing text, zipped as one file to hand over:

```
out/30-off-everything-<version>.zip
  posts/             30off-square-1080x1080.png + .mp4        feed post
                     30off-horizontal-1920x1080.png + .mp4    X, YouTube, LinkedIn
                     30off-portrait-1080x1920.png + .mp4      stories, reels, TikTok
                     30off-portrait-1080x1350.png             4:5 feed post
  extension-store/   store-icon-128.png, marquee-promo-1400x560.png, small-promo-440x280.png,
                     screenshot-1/2/3-1280x800.png, black-friday.zip, LISTING.txt
```

The videos are 12 s loops at 25 frames a second; the stills are the frame at 10.32 s.

## Setup

- `npm install` (Playwright). On a machine that has never had it: `npx playwright install chromium`.
- `python3` with Pillow (`pip install pillow`); for the icon tools also NumPy and OpenCV
  (`pip install numpy opencv-python`).
- `ffmpeg` (with libx264) and `zip` on the PATH.

## Build

```sh
./build-kit.sh              # everything, for the version in ../extension/src/manifest.json
./build-kit.sh --no-video   # the stills only, in a few seconds
```

It builds the template, renders every still and video (frames go to a temporary folder, deleted
once each video is encoded), runs `../extension/package.sh`, and writes `out/kit-<version>/` and
`out/30-off-everything-<version>.zip`. `out/` is not committed.

## Edit the design

The design is `templates/v-starburst-post.html`. One page draws every format, each with its own
arrangement, picked with `?f=`: `square`, `horizontal`, `portrait`, `p45` (1080 x 1350), `marquee`,
`small`, `shot1`, `shot2`, `shot3` (the comment at the top of the file says what each holds).
Everything moves off one clock and comes round at exactly 12 s, so the videos loop.

To preview, build it and open it in Chrome at the format's size (or any size; it scales):

```sh
python3 tools/build-templates.py      # -> out/templates/<name>.html, every picture and font inlined
```

then open `file:///<path to>/socials/out/templates/v-starburst-post.html?f=square&keep` in Chrome
(`?keep` keeps the tape look on, however slow the machine).

`{{fonts}}` and `{{img:NAME}}` in a template are filled in by `tools/build-templates.py`: the fonts come
from `../extension/src/fonts/`, the pictures from `assets/` (the GME lockup, the 60 frames of the
turning globe).

## Tools

```
tools/build-templates.py   templates/*.html -> out/templates/*.html, self-contained
tools/render.mjs           one format of the post template as a PNG still or as JPEG frames (build-kit.sh uses it)
tools/icons.mjs            redraws the extension's icons (and so the store icon) with tools/icons-tape.py and tools/vhs.py
tools/banner-compare.py    out/banner-compare.html: the real extension and each templates/*-banner.html design,
                           on the mock shop and news pages (templates/mock/), desktop or phone
tools/banner-live.mjs      screenshots of the real extension on the mock pages at several window sizes
                           (needs `npm install` in ../extension)
```

`templates/v-starburst-banner.html` is the design page the extension's banner was drawn from. A new
banner design can start as another `templates/<name>-banner.html` and be compared with the current one
in `tools/banner-compare.py`; the extension itself is then rebuilt by hand in `../extension/src/`.

## Rules for public images

- No in-situ shots: nothing public may show the banner sitting over part of a real or mock web page
  (no screenshots from `banner-live.mjs` or `banner-compare.py`). The joke is told by the posts.
- Only approved copy: the words already in the template and in `store/LISTING.txt`. New wording needs
  approval before it goes out.

`archive/` holds earlier explorations, kept for reference and not maintained.
