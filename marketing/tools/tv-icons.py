#!/usr/bin/env python3
"""Give the extension's icons the tape look: out/icons-channel/clean-N.png -> ../src/icons/iconN.png.
The look is drawn larger than on a poster (an icon is tiny) and gentler at the small sizes, where
the lettering has to stay readable. The icon keeps its own shape: only its colours change."""
import os, sys
import cv2
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from vhs import degrade

SRC = os.path.join(HERE, '..', 'out', 'icons-channel')
DST = os.path.join(HERE, '..', '..', 'src', 'icons')
BLUE = np.array([0x0a, 0x22, 0xd6], np.float32)
# size: (how big the look is drawn, how strong)
LOOK = {16: (0.08, 0.45), 32: (0.13, 0.6), 48: (0.18, 0.75), 128: (0.36, 1.0)}

for size, (scale, amount) in LOOK.items():
    rgba = cv2.cvtColor(cv2.imread(os.path.join(SRC, f'clean-{size}.png'), cv2.IMREAD_UNCHANGED), cv2.COLOR_BGRA2RGBA).astype(np.float32)
    alpha = rgba[..., 3:] / 255
    rgb = (rgba[..., :3] * alpha + BLUE * (1 - alpha)).astype(np.uint8)   # on its own blue, so nothing dark bleeds in at the edge
    pad = 16                                                              # the tear along a tape's bottom edge lands in here
    tall = cv2.copyMakeBorder(rgb, 0, pad, 0, 0, cv2.BORDER_REPLICATE)
    look = degrade(tall, 12, 30, 0.0, amount, scratches=False, scale=scale)[:size]
    out = np.dstack([look, rgba[..., 3].astype(np.uint8)])
    cv2.imwrite(os.path.join(DST, f'icon{size}.png'), cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA))
print('tape look on', ', '.join(f'icon{s}.png' for s in LOOK))
