#!/bin/sh
# Every site variant (site/v-*.html) as a 12 s vertical video, 1080 x 1920 at 25 frames a second,
# with the page's own live tape look: out/site/videos/<name>-1080x1920.mp4. Three at a time.
#   tools/site-videos.sh [name ...]
cd "$(dirname "$0")/.."
python3 tools/site-build.py >/dev/null
mkdir -p out/site/videos
if [ $# -eq 0 ]; then set -- $(ls site | sed -n 's/^\(v-.*\)\.html$/\1/p'); fi
printf '%s\n' "$@" | xargs -P 3 -I{} sh -c '
  node tools/site-video.mjs {} frames/video-{} 12 25 &&
  ffmpeg -loglevel error -y -framerate 25 -i frames/video-{}/%04d.png -vf format=yuv420p -c:v libx264 -crf 20 -preset slow -movflags +faststart out/site/videos/{}-1080x1920.mp4 &&
  echo "done {}"'
ls -la out/site/videos
