#!/bin/sh
# The advertising pack for the chosen design (comps/gif-banner), in out/gif-pack/: the advert in
# three shapes and the banner in two, each as a still (PNG) and a looping animated GIF.
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
  # The still: frame 12, where the marquee opens on its first line.
  cp "frames/$name/raw/0012.png" "$OUT/$2.png"
  # The GIF: 12 seconds at 20 fps, one palette for the whole loop, no dithering (the artwork is
  # already dithered pixel art), only the changed rectangle stored per frame, looping forever.
  ffmpeg -loglevel error -y -framerate 30 -i "frames/$name/raw/%04d.png" -vf \
    "fps=20,split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" \
    -loop 0 "$OUT/$2.gif"
}
make 1x1 ad-square-1080x1080
make 16x9 ad-horizontal-1920x1080
make 9x16 ad-vertical-1080x1920
make banner-v banner-desktop-vertical-1080x2025
make banner-h banner-mobile-horizontal-1170x834
ls -la "$OUT"
