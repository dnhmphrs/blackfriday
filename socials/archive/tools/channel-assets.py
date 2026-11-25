#!/usr/bin/env python3
"""Make the extension's pictures (../src/images) from the parts cut by tools/channel-parts.mjs, and
those of the 2.1 banner, which 2.2 no longer uses (assets/banner-2.1).
    node tools/channel-parts.mjs && python3 tools/channel-assets.py      (run from marketing/)
  globe.webp        the spinning globe: one turn, 48 frames over 4 s, 340 px (shown at up to ~165 px)
  globe-still.webp  its first frame, for people who ask for reduced motion
  cap/shaft/base    the white column in three pieces; the banner stretches the shaft to fit
  type-top/mid      30% OFF and EVERYTHING ON THE INTERNET. (desktop); type-phone: both, for the strip"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = os.path.join(HERE, '..', 'out', 'channel-page', 'parts')
OUT = os.path.join(HERE, '..', '..', 'src', 'images')
OLD = os.path.join(HERE, '..', 'assets', 'banner-2.1')
part = lambda name: Image.open(os.path.join(PARTS, name)).convert('RGBA')
out = lambda name: os.path.join(OUT, name)
old = lambda name: os.path.join(OLD, name)

frames = [part(f'globe-{i:02d}.png') for i in range(60)]
turn = [frames[round(i * 60 / 48) % 60].resize((340, 340), Image.LANCZOS) for i in range(48)]
turn[0].save(out('globe.webp'), save_all=True, append_images=turn[1:], duration=round(4000 / 48), loop=0, quality=72, method=6, alpha_quality=80)
turn[0].save(out('globe-still.webp'), quality=85, method=6, alpha_quality=90)

column = part('column.png')  # 600 wide; the column itself spans x 100..500, y 170..682
for name, (top, bottom) in {'cap': (170, 306), 'shaft': (306, 538), 'base': (538, 682)}.items():
    column.crop((100, top, 500, bottom)).save(old(f'{name}.webp'), lossless=True)

desktop = part('type-desktop.png')  # the two blocks of lettering, parted at the empty rows between them
for name, box in {'type-top': (0, 0, 1080, 587), 'type-mid': (0, 587, 1080, 1000)}.items():
    block = desktop.crop(box)
    block.crop(block.split()[3].getbbox()).save(old(f'{name}.webp'), quality=92, method=6)
phone = part('type-phone.png')
phone.crop(phone.split()[3].getbbox()).save(old('type-phone.webp'), quality=92, method=6)

for f in [out('globe.webp'), out('globe-still.webp')] + [old(f) for f in sorted(os.listdir(OLD))]:
    print(f'{os.path.basename(f):18} {os.path.getsize(f):8}  {Image.open(f).size}')
