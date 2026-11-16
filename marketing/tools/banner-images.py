#!/usr/bin/env python3
"""Writes the pictures the extension's banner uses into src/images/.

    node tools/globe-loop.mjs 36 300      # one turn of the cut globe, transparent frames
    python3 tools/banner-images.py

globe.webp        the globe turning, over the banner's own glow (an animated picture)
globe-still.webp  one frame of it, for people who ask for reduced motion
gme-white.webp    the Gary Mustard Enterprises lockup in white (top of the banner)
gme-navy.webp     the same in navy (printed on the plinth)
"""
import glob, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '..', 'src', 'images')
SIZE, QUALITY, TURN_MS = 240, 45, 3600


def glow(size):
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2)
    stops = [(0.0, (0x58, 0xc4, 0xff)), (0.42, (0x2a, 0x8c, 0xff)), (0.85, (0x13, 0x48, 0xee)), (1.5, (0x0c, 0x30, 0xe0))]
    out = np.zeros((size, size, 3), np.float32)
    for (r0, c0), (r1, c1) in zip(stops, stops[1:]):
        t = ((r - r0) / (r1 - r0))[..., None]
        out = np.where(((r >= r0) & (r <= r1))[..., None], np.array(c0) * (1 - t) + np.array(c1) * t, out)
    return Image.fromarray(out.astype(np.uint8)).convert('RGBA')


def lockup(colour, width, name):
    white = Image.open(os.path.join(ROOT, 'assets', 'gme', 'gme-primary.png')).convert('RGBA')
    white = white.crop(white.getbbox())
    small = white.resize((width, round(white.height * width / white.width)), Image.LANCZOS)
    ink = Image.new('RGBA', small.size, colour + (255,))
    ink.putalpha(small.getchannel('A'))
    ink.save(os.path.join(OUT, name), 'WEBP', lossless=True, method=6)


os.makedirs(OUT, exist_ok=True)
frames = sorted(glob.glob(os.path.join(ROOT, 'frames', 'globe-loop', '*.png')))
assert frames, 'run tools/globe-loop.mjs first'
back = glow(SIZE)
turn = [Image.alpha_composite(back, Image.open(f).convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)).convert('RGB') for f in frames]
turn[0].save(os.path.join(OUT, 'globe.webp'), 'WEBP', save_all=True, append_images=turn[1:], duration=round(TURN_MS / len(turn)), loop=0, quality=QUALITY, method=6, minimize_size=True)
turn[0].save(os.path.join(OUT, 'globe-still.webp'), 'WEBP', quality=70, method=6)
lockup((255, 255, 255), 420, 'gme-white.webp')
lockup((0x0b, 0x1a, 0x5c), 420, 'gme-navy.webp')
for f in sorted(os.listdir(OUT)):
    print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
