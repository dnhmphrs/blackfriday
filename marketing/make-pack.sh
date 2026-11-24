#!/bin/sh
# The advertising pack, in out/pack/: the advert in three shapes and the banner in two, as
# 12-second loops and stills. Frames already rendered in frames/ are reused.
set -e
cd "$(dirname "$0")"
mkdir -p out/pack
make() { # format, output name
  [ "$(ls "frames/pack-$1/raw" 2>/dev/null | wc -l)" -ge 360 ] || node render.mjs broadcast "format=$1" "pack-$1"
  python3 vhs.py "pack-$1" --out "out/pack/$2.mp4"
  python3 vhs.py "pack-$1" --still 12 "out/pack/$2.png"
}
make 1x1 ad-square-1080x1080
make 16x9 ad-horizontal-1920x1080
make 9x16 ad-vertical-1080x1920
make banner-v banner-desktop-vertical-1080x2025
make banner-h banner-mobile-horizontal-1170x834
python3 -c "
from PIL import Image
import glob, os
for p in glob.glob('out/pack/*.png'):
    Image.open(p).convert('RGB').save(p[:-4] + '.jpg', quality=93, subsampling=0); os.remove(p)
"
ls -la out/pack
