#!/usr/bin/env python3
"""Puts images side by side at the same height, for comparing a design with a reference.

    python3 tools/beside.py out.png a.png b.png [c.png ...]
"""
import sys
from PIL import Image

out, paths = sys.argv[1], sys.argv[2:]
H = 960
ims = [Image.open(p).convert('RGB') for p in paths]
ims = [im.resize((round(im.width * H / im.height), H), Image.LANCZOS) for im in ims]
sheet = Image.new('RGB', (sum(im.width for im in ims) + 12 * (len(ims) - 1), H), (24, 24, 28))
x = 0
for im in ims:
    sheet.paste(im, (x, 0))
    x += im.width + 12
sheet.save(out)
print(out, sheet.size)
