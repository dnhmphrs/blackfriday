#!/bin/sh
# The advertising pack for the chosen design (comps/gif-banner), in out/gif-pack/: the advert in
# three shapes and the banner in two, as clean 12-second loops and stills.
#   EDGE=serrated ./make-gif-pack.sh   gives the banners and adverts the coupon edge.
# Frames already rendered in frames/ are reused; delete frames/gif-* to render again.
set -e
cd "$(dirname "$0")"
OUT=out/gif-pack
mkdir -p "$OUT"
EXTRA=""
[ "$EDGE" = serrated ] && EXTRA="&edge=serrated"
make() { # format, output name
  name="gif-$1${EDGE:+-$EDGE}"
  [ "$(ls "frames/$name/raw" 2>/dev/null | wc -l)" -ge 360 ] || node render.mjs gif-banner "format=$1$EXTRA" "$name"
  python3 vhs.py "$name" --clean --out "$OUT/$2.mp4"
  python3 vhs.py "$name" --clean --still 12 "$OUT/$2.png"
}
make 1x1 ad-square-1080x1080
make 16x9 ad-horizontal-1920x1080
make 9x16 ad-vertical-1080x1920
make banner-v banner-desktop-vertical-1080x2025
make banner-h banner-mobile-horizontal-1170x834
ls -la "$OUT"
