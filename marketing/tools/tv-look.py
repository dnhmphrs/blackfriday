#!/usr/bin/env python3
"""Give a still the worn-tape-on-a-tube look of vhs.py (soft luma, smeared chroma, scanlines, glow,
dark corners; no glitch).
    python3 tools/tv-look.py in.png out.png [amount=1.0] [WxH]
WxH: resize to this first, so the scanlines are drawn at the size the picture is shown at."""
import os, sys
import cv2
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vhs import degrade

src, out = sys.argv[1], sys.argv[2]
amount = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
rgb = cv2.cvtColor(cv2.imread(src, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
if len(sys.argv) > 4:
    w, h = (int(v) for v in sys.argv[4].split('x'))
    rgb = cv2.resize(rgb, (w, h), interpolation=cv2.INTER_AREA)
cv2.imwrite(out, cv2.cvtColor(degrade(rgb, 12, 30, 0.0, amount), cv2.COLOR_RGB2BGR))
print(out, rgb.shape[1], 'x', rgb.shape[0], 'amount', amount)
