#!/usr/bin/env python3
"""Builds the pictures the Broadcast overlay design carries and writes them, as data: URLs, to
src/designs/broadcast.art.js (the manifest lists that file just before broadcast.js).

    node tools/globe-loop.mjs 36 300      # the globe, one turn, transparent
    python3 store/embed-art.py

A design may not load anything from a URL, so its pictures travel as text. They are:
globe (a looping picture of the cut globe over the panel's own glow), still (one frame of it,
for people who ask for reduced motion), and the Gary Mustard Enterprises lockup in navy.
"""
import base64, glob, io, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ART = os.path.join(ROOT, '..', 'src', 'designs', 'broadcast.art.js')
SIZE, QUALITY, TURN_MS = 240, 45, 3600
INK = (0x0b, 0x1a, 0x5c)


def glow(size):
    """The light behind the globe: #58c4ff at the centre falling to #1348ee, as in the adverts."""
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2)
    stops = [(0.0, (0x58, 0xc4, 0xff)), (0.42, (0x2a, 0x8c, 0xff)), (0.85, (0x13, 0x48, 0xee)), (1.5, (0x0c, 0x30, 0xe0))]
    out = np.zeros((size, size, 3), np.float32)
    for (r0, c0), (r1, c1) in zip(stops, stops[1:]):
        t = ((r - r0) / (r1 - r0))[..., None]
        out = np.where(((r >= r0) & (r <= r1))[..., None], np.array(c0) * (1 - t) + np.array(c1) * t, out)
    return Image.fromarray(out.astype(np.uint8)).convert('RGBA')


def data_url(image_bytes, mime='image/webp'):
    return f'data:{mime};base64,' + base64.b64encode(image_bytes).decode('ascii')


def webp(image, **options):
    buffer = io.BytesIO()
    image.save(buffer, 'WEBP', **options)
    return buffer.getvalue()


def lockup(name, width):
    """A white-on-transparent lockup from assets/gme, recoloured navy and shrunk."""
    white = Image.open(os.path.join(ROOT, 'assets', 'gme', name + '.png')).convert('RGBA')
    white = white.crop(white.getbbox())
    small = white.resize((width, round(white.height * width / white.width)), Image.LANCZOS)
    navy = Image.new('RGBA', small.size, INK + (255,))
    navy.putalpha(small.getchannel('A'))
    return webp(navy, lossless=True, method=6)


frames = sorted(glob.glob(os.path.join(ROOT, 'frames', 'globe-loop', '*.png')))
assert frames, 'run tools/globe-loop.mjs first'
back = glow(SIZE)
turn = [Image.alpha_composite(back, Image.open(f).convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)).convert('RGB') for f in frames]
buffer = io.BytesIO()
turn[0].save(buffer, 'WEBP', save_all=True, append_images=turn[1:], duration=round(TURN_MS / len(turn)), loop=0, quality=QUALITY, method=6, minimize_size=True)
art = {
    'globe': data_url(buffer.getvalue()),
    'still': data_url(webp(turn[0], quality=70, method=6)),
    'gme': data_url(lockup('gme-primary', 420)),
}
for key, value in art.items():
    print(f'{key}: {len(value) / 1024:.0f} KB')

lines = ',\n'.join(f'  {key}: "{value}"' for key, value in art.items())
open(ART, 'w', encoding='utf8').write(
    '// Pictures for the Broadcast design, as data: URLs. Written by marketing/store/embed-art.py;\n'
    '// not for editing by hand. A function, so the text only becomes strings when the banner shows.\n'
    'globalThis.thirtyOffArt = () => ({\n' + lines + ',\n});\n')
print('written to src/designs/broadcast.art.js')
