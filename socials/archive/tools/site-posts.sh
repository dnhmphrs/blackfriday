#!/bin/sh
# The vertical posts from the live site's pages (screenshot 1 and screenshot 2, stacked for 9:16):
# a still, a 12 s video and a GIF of each, with the tape look, into the kit's posts folder.
#   tools/site-posts.sh [kit folder]          (default out/kit-2.4)
# Builds the pages first (tools/site-build.py).
set -e
cd "$(dirname "$0")/.."
KIT="${1:-out/kit-2.4}"; mkdir -p "$KIT/posts" out/posts
python3 tools/site-build.py >/dev/null
for n in 1 2; do
  L=$([ $n = 1 ] && echo one || echo two); OUT="$KIT/posts/30off-vertical-$n"
  node tools/site-post.mjs $L still out/posts/vertical-$n.png
  python3 tools/tv-look.py out/posts/vertical-$n.png "$OUT-1080x1920.png" >/dev/null
  node tools/site-post.mjs $L loop frames/vertical-$n
  python3 tools/tv-frames.py frames/vertical-$n frames/vertical-$n-tv >/dev/null
  ffmpeg -loglevel error -y -framerate 15 -i frames/vertical-$n-tv/%04d.png -vf "fps=30,format=yuv420p" -c:v libx264 -crf 22 -preset slow -movflags +faststart "$OUT-1080x1920.mp4"
  # the GIF: held grain, as narrow and with as few colours as it takes to stay under 10 MB
  for spec in "600 256" "600 128" "540 128" "480 128"; do set -- $spec
    python3 tools/tv-frames.py frames/vertical-$n frames/vertical-$n-gif --width $1 --hold 0 >/dev/null
    ffmpeg -loglevel error -y -framerate 15 -i frames/vertical-$n-gif/%04d.png -vf "split[a][b];[a]palettegen=max_colors=$2:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" -loop 0 "$OUT-animated.gif"
    [ "$(stat -c %s "$OUT-animated.gif")" -lt 10000000 ] && break
  done
  echo "vertical-$n: gif $1 wide, $2 colours"
done
ls -la "$KIT/posts" | grep vertical
