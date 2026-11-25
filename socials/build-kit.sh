#!/bin/sh
# Rebuilds the whole kit for the extension's current version (from ../extension/src/manifest.json):
#   out/kit-<version>/posts/             the social posts: stills and 12 s loops
#   out/kit-<version>/extension-store/   the Chrome Web Store images, black-friday.zip and LISTING.txt
#   out/30-off-everything-<version>.zip  both folders, zipped
#   ./build-kit.sh              everything (the videos take ten minutes or so)
#   ./build-kit.sh --no-video   the stills and the store icon only, for a quick look (no zip)
set -e
cd "$(dirname "$0")"
VERSION=$(python3 -c 'import json; print(json.load(open("../extension/src/manifest.json"))["version"])')
KIT="out/kit-$VERSION"
T=10.32   # the moment the stills are taken: the badge in, the stamp down
FRAMES=$(mktemp -d "${TMPDIR:-/tmp}/kit-frames.XXXXXX")
trap 'rm -rf "$FRAMES"' EXIT INT TERM

echo "kit $VERSION -> $KIT"
python3 tools/build-templates.py v-starburst-post >/dev/null
rm -rf "$KIT"; mkdir -p "$KIT/posts" "$KIT/extension-store"

# Runs each line of its input ("function args...") as a background job; fails if any job did.
parallel() {
  pids=''
  while read -r line; do [ -n "$line" ] && { eval "$line" & pids="$pids $!"; }; done
  ok=0; for p in $pids; do wait "$p" || ok=1; done; return $ok
}
still() { node tools/render.mjs "$1" "$2" "$3" still "$KIT/$4" "$T" >/dev/null && echo "  $4"; }
video() {
  node tools/render.mjs "$1" "$2" "$3" video "$FRAMES/$1" 12 25 >/dev/null &&
  ffmpeg -loglevel error -y -framerate 25 -i "$FRAMES/$1/%04d.jpg" -c:v libx264 -preset slow -crf 20 \
    -pix_fmt yuv420p -r 25 -movflags +faststart "$KIT/$4" &&
  rm -rf "${FRAMES:?}/$1" && echo "  $4"
}

echo 'stills'
parallel <<EOF
still square 1080 1080 posts/30off-square-1080x1080.png
still horizontal 1920 1080 posts/30off-horizontal-1920x1080.png
still portrait 1080 1920 posts/30off-portrait-1080x1920.png
still p45 1080 1350 posts/30off-portrait-1080x1350.png
EOF
parallel <<EOF
still marquee 1400 560 extension-store/marquee-promo-1400x560.png
still small 440 280 extension-store/small-promo-440x280.png
still shot1 1280 800 extension-store/screenshot-1-1280x800.png
still shot2 1280 800 extension-store/screenshot-2-1280x800.png
still shot3 1280 800 extension-store/screenshot-3-1280x800.png
EOF
cp ../extension/src/icons/icon128.png "$KIT/extension-store/store-icon-128.png"
if [ "$1" = '--no-video' ]; then echo "stills only: $KIT"; exit 0; fi

echo 'videos'
parallel <<EOF
video square 1080 1080 posts/30off-square-1080x1080.mp4
video horizontal 1920 1080 posts/30off-horizontal-1920x1080.mp4
video portrait 1080 1920 posts/30off-portrait-1080x1920.mp4
EOF

echo 'extension package'
../extension/package.sh >/dev/null
cp ../extension/black-friday.zip "$KIT/extension-store/"
sed "s/{{version}}/$VERSION/" store/LISTING.txt > "$KIT/extension-store/LISTING.txt"

ZIP="out/30-off-everything-$VERSION.zip"
rm -f "$ZIP"
(cd "$KIT" && zip -X -q -r "../${ZIP#out/}" extension-store posts)
unzip -l "$ZIP"
