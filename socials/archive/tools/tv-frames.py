#!/usr/bin/env python3
"""Give a folder of frames the worn-tape-on-a-tube look of vhs.py, frame by frame (the noise and
wobble are different on every frame, as on a real tube).
    python3 tools/tv-frames.py <in dir> <out dir> [--width W] [--amount 1.0] [--every N] [--hold N]
--width resizes first, so the scanlines are drawn at the size the picture is shown at.
--every N keeps one frame in N.
--hold N keeps the same grain for N frames at a time (0: for the whole clip). A GIF stores only
what changes between frames, so grain that changes on every frame makes it several times the size."""
import argparse, os, sys
from multiprocessing import Pool
import cv2
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vhs import degrade

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('dst')
ap.add_argument('--width', type=int); ap.add_argument('--amount', type=float, default=1.0); ap.add_argument('--every', type=int, default=1); ap.add_argument('--hold', type=int, default=1)
a = ap.parse_args()


def work(job):
    n, name = job
    rgb = cv2.cvtColor(cv2.imread(os.path.join(a.src, name), cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
    if a.width:
        h = round(rgb.shape[0] * a.width / rgb.shape[1] / 2) * 2
        rgb = cv2.resize(rgb, (a.width, h), interpolation=cv2.INTER_AREA)
    cv2.imwrite(os.path.join(a.dst, f'{n:04d}.png'), cv2.cvtColor(degrade(rgb, 12 if a.hold == 0 else 12 + (n // a.hold) * a.hold, 30, 0.0, a.amount, scratches=a.hold != 0), cv2.COLOR_RGB2BGR))


if __name__ == '__main__':
    os.makedirs(a.dst, exist_ok=True)
    names = sorted(f for f in os.listdir(a.src) if f.endswith('.png'))[::a.every]
    with Pool(3) as pool:
        pool.map(work, list(enumerate(names)), chunksize=4)
    print(a.dst, len(names), 'frames')
