#!/bin/sh
# The asset pack: the banner in both shapes and the adverts, as loops and stills, in out/pack/.
set -e
cd "$(dirname "$0")"
mkdir -p out/pack
make() { # format, output name
  node render.mjs broadcast "format=$1" "pack-$1"
  python3 vhs.py "pack-$1" --amount 0.9 --out "out/pack/$2.mp4"
  python3 vhs.py "pack-$1" --amount 0.9 --still 12 "out/pack/$2.png"
}
make 1x1 ad-square-1080x1080
make 16x9 ad-horizontal-1920x1080
make banner-v banner-desktop-vertical-1080x2025
make banner-h banner-mobile-horizontal-1170x834
make 9x16 ad-vertical-1080x1920
python3 -c "
from PIL import Image
import glob, os
for p in glob.glob('out/pack/*.png'):
    Image.open(p).convert('RGB').save(p[:-4] + '.jpg', quality=93, subsampling=0); os.remove(p)
"
ls -la out/pack
