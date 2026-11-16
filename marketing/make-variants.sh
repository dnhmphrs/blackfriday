#!/bin/sh
# Renders the sale-ad variants: a vertical and a square video of each, plus a poster frame.
# (The banner pack is rendered by hand, see comps/banners.js.)
set -e
cd "$(dirname "$0")"
mkdir -p out/video out/posters
render() { # composition, format, tape amount (or the word clean)
  name="$1-$2"
  node render.mjs "$1" "format=$2" "$name"
  if [ "$3" = clean ]; then flag="--clean"; else flag="--amount $3"; fi
  python3 vhs.py "$name" $flag --out "out/video/$name.mp4"
  python3 vhs.py "$name" $flag --still 60 "out/posters/$name.png"
}
for fmt in 9x16 1x1; do
  render dealer "$fmt" 1.0
  render infomercial "$fmt" 1.0
  render circular "$fmt" clean
  render breaking "$fmt" 0.6
  render blowout "$fmt" 1.0
done
