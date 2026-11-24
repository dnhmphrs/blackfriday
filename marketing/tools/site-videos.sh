#!/bin/sh
# Every site variant (site/v-*.html) as a 12 s vertical video, 1080 x 1920 at 25 frames a second,
# with the page's own live tape look: out/site/videos/<name>-1080x1920.mp4. Three at a time.
#   tools/site-videos.sh [name ...]
cd "$(dirname "$0")/.."
python3 tools/site-build.py >/dev/null
mkdir -p out/site/videos
NAMES="${*:-$(ls site | sed -n 's/^\(v-.*\)\.html$/\1/p')}"
one() {
  node tools/site-video.mjs "$1" "frames/video-$1" 12 25 &&
  ffmpeg -loglevel error -y -framerate 25 -i "frames/video-$1/%04d.png" -vf format=yuv420p -c:v libx264 -crf 20 -preset slow -movflags +faststart "out/site/videos/$1-1080x1920.mp4" &&
  echo "done $1"
}
export -f one 2>/dev/null
for n in $NAMES; do echo "$n"; done | xargs -P 3 -I{} sh -c "$(declare -f one 2>/dev/null || true); cd '$PWD'; node tools/site-video.mjs {} frames/video-{} 12 25 && ffmpeg -loglevel error -y -framerate 25 -i frames/video-{}/%04d.png -vf format=yuv420p -c:v libx264 -crf 20 -preset slow -movflags +faststart out/site/videos/{}-1080x1920.mp4 && echo done {}"
ls -la out/site/videos
