#!/bin/sh
# Renders a labelled contact sheet of variants for choosing between.
#   tools/variants.sh <sheet name> "<label>|<comp>|<query after format=9x16>" ...
set -e
cd "$(dirname "$0")/.."
sheet="$1"; shift
mkdir -p out/variants
list=""
for item in "$@"; do
  label="${item%%|*}"; rest="${item#*|}"; comp="${rest%%|*}"; query="${rest#*|}"
  png=$(tools/proof.sh "$comp" "9x16$query" 12 1.0 | tail -1)
  list="$list$label|$png
"
done
printf '%s' "$list" | python3 -c "
import sys
from PIL import Image, ImageDraw, ImageFont
rows=[l.rstrip('\n').split('|') for l in sys.stdin if l.strip()]
font=ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 30)
W,H,G,L=540,960,18,56
cols=min(len(rows),4); n=(len(rows)+cols-1)//cols
sheet=Image.new('RGB',(cols*W+(cols+1)*G, n*(H+L)+(n+1)*G),(22,22,26)); d=ImageDraw.Draw(sheet)
for i,(label,png) in enumerate(rows):
    x=G+(i%cols)*(W+G); y=G+(i//cols)*(H+L+G)
    d.text((x+2,y+12),label,fill=(255,255,255),font=font)
    sheet.paste(Image.open(png).convert('RGB').resize((W,H),Image.LANCZOS),(x,y+L))
sheet.save('out/variants/$sheet.jpg',quality=92); print('out/variants/$sheet.jpg',sheet.size)
"
