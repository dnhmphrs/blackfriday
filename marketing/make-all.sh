#!/bin/sh
# Re-creates everything in out/ from scratch (about half an hour on four cores).
set -e
cd "$(dirname "$0")"
mkdir -p out/video out/posters out/store
still() { # format, name, frame, amount, destination
  node render.mjs broadcast "format=$1" "$2" --workers 1 --from "$3" --to "$(($3 + 1))" >/dev/null
  python3 vhs.py "$2" --amount "$4" --still "$3" "$5"
}
python3 vhs.py broadcast-9x16 --out out/video/broadcast-9x16.mp4 || { node render.mjs broadcast "format=9x16" broadcast-9x16 && python3 vhs.py broadcast-9x16 --out out/video/broadcast-9x16.mp4; }
for f in 16x9 1x1; do
  node render.mjs broadcast "format=$f" "broadcast-$f"
  python3 vhs.py "broadcast-$f" --out "out/video/broadcast-$f.mp4"
done
python3 vhs.py broadcast-9x16 --still 12 out/posters/poster-9x16.png
python3 vhs.py broadcast-16x9 --still 12 out/posters/poster-16x9.png
python3 vhs.py broadcast-1x1 --still 12 out/posters/poster-1x1.png
still 4x5 poster-4x5 12 1.0 out/posters/poster-4x5.png
still marquee store-marquee 12 0.55 out/store/marquee-1400x560.png
still tile store-tile 12 0.5 out/store/tile-880x560.png
python3 -c "
from PIL import Image
Image.open('out/store/tile-880x560.png').convert('RGB').resize((440, 280), Image.LANCZOS).save('out/store/small-promo-440x280.png')
Image.open('out/store/marquee-1400x560.png').convert('RGB').save('out/store/marquee-1400x560.png')
"
rm -f out/store/tile-880x560.png
ls -la out/video out/posters out/store
