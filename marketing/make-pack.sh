#!/bin/sh
# The asset pack for "The 30% OFF Channel": the adverts and the banner in both shapes, as
# loops and stills, in out/pack/; and the two Chrome Web Store promo images in out/store/.
set -e
cd "$(dirname "$0")"
mkdir -p out/pack out/store
make() { # format, output name (frames already rendered are reused)
  [ "$(ls "frames/pack-$1/raw" 2>/dev/null | wc -l)" -ge 360 ] || node render.mjs broadcast "format=$1" "pack-$1"
  python3 vhs.py "pack-$1" --out "out/pack/$2.mp4"
  python3 vhs.py "pack-$1" --still 12 "out/pack/$2.png"
}
still() { # format, amount, destination
  node render.mjs broadcast "format=$1" "pack-$1" --workers 1 --from 12 --to 13 >/dev/null
  python3 vhs.py "pack-$1" --amount "$2" --still 12 "$3"
}
make 1x1 ad-square-1080x1080
make 16x9 ad-horizontal-1920x1080
make 9x16 ad-vertical-1080x1920
make banner-v banner-desktop-vertical-1080x2025
make banner-h banner-mobile-horizontal-1170x834
still 4x5 1.0 out/pack/ad-portrait-1080x1350.png
still marquee 0.55 out/store/marquee-1400x560.png
still tile 0.5 out/store/tile-880x560.png
python3 -c "
from PIL import Image
import glob, os
for p in glob.glob('out/pack/*.png'):
    Image.open(p).convert('RGB').save(p[:-4] + '.jpg', quality=93, subsampling=0); os.remove(p)
Image.open('out/store/tile-880x560.png').convert('RGB').resize((440, 280), Image.LANCZOS).save('out/store/small-promo-440x280.png')
Image.open('out/store/marquee-1400x560.png').convert('RGB').save('out/store/marquee-1400x560.png')
os.remove('out/store/tile-880x560.png')
"
ls -la out/pack out/store
