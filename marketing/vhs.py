#!/usr/bin/env python3
"""Run rendered frames through a worn-VHS-on-a-CRT look and encode them.

    python3 vhs.py <name> [--out out/x.mp4] [--amount 1.0] [--still N out.png] [--clean]

--clean encodes the frames as they are (for print-style pieces that should not look taped).

Reads frames/<name>/raw/*.png and frames/<name>/meta.json (written by render.mjs).
Every frame is a pure function of its index, so the result is reproducible.
"""
import argparse, json, os, subprocess, sys
from multiprocessing import Pool
import numpy as np
import cv2

ROOT = os.path.dirname(os.path.abspath(__file__))


def blur(a, sx, sy):
    return cv2.GaussianBlur(a, (0, 0), sigmaX=sx, sigmaY=max(sy, 0.01))


def degrade(rgb, index, fps, glitch, amount=1.0):
    """rgb: uint8 HxWx3. glitch: 0..1 strength of a tape glitch on this frame."""
    rng = np.random.default_rng(1000 + index)
    f = rgb.astype(np.float32) / 255.0
    H, W = f.shape[:2]
    k = W / 1080.0                       # scale every pixel distance with the frame
    line = max(2.0, H / 480.0) if H >= W else max(2.0, H / 270.0)   # scanline pitch

    # --- to luma/chroma (YIQ), where tape does its damage ---
    R, G, B = f[..., 0], f[..., 1], f[..., 2]
    Y = 0.299 * R + 0.587 * G + 0.114 * B
    I = 0.596 * R - 0.274 * G - 0.322 * B
    Q = 0.211 * R - 0.523 * G + 0.312 * B

    # luma: soft, with the overshoot halo a VCR's sharpening circuit leaves beside edges
    Ys = blur(Y, 1.25 * k, 0.5 * k)
    Y = Ys + 0.42 * amount * (Ys - blur(Ys, 5.0 * k, 0.6 * k))

    # chroma: a fraction of luma's bandwidth, late and low (smears right and down)
    def smear(c, sx, dx, dy):
        c = blur(c, sx * k * amount + 0.01, 1.6 * k)
        m = np.float32([[1, 0, dx * k * amount], [0, 1, dy * k * amount]])
        return cv2.warpAffine(c, m, (W, H), borderMode=cv2.BORDER_REPLICATE)
    I = smear(I, 9.0, 6.0, 1.5)
    Q = smear(Q, 12.0, 8.0, 2.0)

    # --- noise: streaky in luma, blotchy in chroma ---
    n = rng.standard_normal((H, W)).astype(np.float32)
    Y += blur(n, 2.2 * k, 0.4) * 0.055 * amount
    small = (max(8, H // 6), max(8, W // 24))
    for C, s in ((I, 0.035), (Q, 0.03)):
        cn = rng.standard_normal(small).astype(np.float32)
        C += cv2.resize(cn, (W, H), interpolation=cv2.INTER_CUBIC) * s * amount

    # --- time-base wobble: every scanline starts a little early or late ---
    rows = np.arange(H, dtype=np.float32)
    wob = blur(rng.standard_normal((H, 1)).astype(np.float32), 0.01, 40 * k)[:, 0] * 4.2
    wob += blur(rng.standard_normal((H, 1)).astype(np.float32), 0.01, 2.0)[:, 0] * 0.5
    off = wob * k * amount
    # head-switching tear along the bottom edge
    hs = int(22 * k)
    ramp = np.clip((rows - (H - hs)) / hs, 0, 1)
    off += (ramp ** 2) * (38 + 10 * np.sin(index * 0.9)) * k * amount
    # glitch: slabs of picture knocked sideways
    if glitch > 0:
        for _ in range(int(2 + 4 * glitch)):
            y0 = rng.integers(0, H - 10)
            h = int(rng.integers(8, 140) * k)
            off[y0:y0 + h] += rng.uniform(-70, 70) * k * glitch
    xs = np.arange(W, dtype=np.float32)[None, :] - off[:, None]
    ys = np.repeat(rows[:, None], W, axis=1)
    Y, I, Q = (cv2.remap(C, xs, ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for C in (Y, I, Q))

    # noise bar inside the head-switch zone
    Y[H - hs:] += (rng.standard_normal((hs, W)).astype(np.float32) * 0.25 * amount) * ramp[H - hs:, None]

    # dropouts: short bright scratches where the tape has shed oxide
    for _ in range(rng.poisson(1.2 * amount + 10 * glitch)):
        y = int(rng.integers(0, H - 3)); x = int(rng.integers(0, W)); ln = int(rng.integers(20, 260) * k)
        tail = np.linspace(1, 0, min(ln, W - x), dtype=np.float32) ** 0.6
        Y[y:y + max(1, int(1.5 * k)), x:x + len(tail)] += 0.75 * tail
    if glitch > 0:
        y0 = int(rng.integers(0, H - 60)); h = int(rng.integers(20, 60) * k)
        Y[y0:y0 + h] += rng.standard_normal((min(h, H - y0), W)).astype(np.float32) * 0.22 * glitch
        ang = rng.uniform(-0.9, 0.9) * glitch          # chroma phase slips: colours swing
        I, Q = I * np.cos(ang) - Q * np.sin(ang), I * np.sin(ang) + Q * np.cos(ang)

    # --- back to RGB ---
    sat = 1.12
    I *= sat; Q *= sat
    out = np.stack([Y + 0.956 * I + 0.621 * Q, Y - 0.272 * I - 0.647 * Q, Y - 1.106 * I + 1.703 * Q], axis=-1)

    # --- the tube: glow, scanlines, a lifted black, darker corners ---
    out = np.clip(out, 0, 1.3)
    out += 0.16 * amount * blur(np.clip(out - 0.55, 0, None), 14 * k, 14 * k)
    scan = 0.5 - 0.5 * np.cos(2 * np.pi * (rows + 0.5) / line)
    out *= (1.0 - 0.26 * amount * scan)[:, None, None] * (1.0 + 0.10 * amount)
    yy = (rows / H - 0.5)[:, None]; xx = (np.arange(W, dtype=np.float32) / W - 0.5)[None, :]
    out *= (1.0 - 0.55 * amount * (xx ** 2 + yy ** 2) ** 1.4)[..., None]
    out = 0.035 * amount + out * (1 - 0.035 * amount)
    out *= 1.0 + 0.012 * np.sin(index * 2.1)           # tape gain flutter
    return (np.clip(out, 0, 1) * 255.0 + 0.5).astype(np.uint8)


def glitch_strength(index, fps, glitches):
    for g in glitches:
        d = index - round(g * fps)
        if 0 <= d < 5:
            return (1.0, 0.8, 0.9, 0.5, 0.25)[d]
    return 0.0


def _work(job):
    path, index, fps, glitches, amount = job
    bgr = cv2.imread(path, cv2.IMREAD_COLOR)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    if amount is None:
        return rgb.tobytes()
    return degrade(rgb, index, fps, glitch_strength(index, fps, glitches), amount).tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('--out')
    ap.add_argument('--amount', type=float, default=1.0)
    ap.add_argument('--crf', type=int, default=23)
    ap.add_argument('--still', nargs=2, metavar=('FRAME', 'PNG'))
    ap.add_argument('--loops', type=int, default=1)
    ap.add_argument('--clean', action='store_true')
    a = ap.parse_args()
    if a.clean:
        a.amount = None
    base = os.path.join(ROOT, 'frames', a.name)
    meta = json.load(open(os.path.join(base, 'meta.json')))
    fps, W, H = meta['fps'], meta['width'], meta['height']
    raw = os.path.join(base, 'raw')
    files = sorted(f for f in os.listdir(raw) if f.endswith('.png'))
    if a.still:
        i = int(a.still[0])
        data = _work((os.path.join(raw, f'{i:04d}.png'), i, fps, meta['glitches'], a.amount))
        cv2.imwrite(a.still[1], cv2.cvtColor(np.frombuffer(data, np.uint8).reshape(H, W, 3), cv2.COLOR_RGB2BGR))
        print('wrote', a.still[1]); return
    out = a.out or os.path.join(ROOT, 'out', a.name + '.mp4')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                           '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2',  # H.264 needs even dimensions
                           '-c:v', 'libx264', '-preset', 'slow', '-crf', str(a.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                           '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    jobs = [(os.path.join(raw, f), int(f[:4]), fps, meta['glitches'], a.amount) for f in files] * a.loops
    with Pool(4) as pool:
        for n, data in enumerate(pool.imap(_work, jobs, chunksize=2)):
            ff.stdin.write(data)
            if n % 60 == 0: print(f'{a.name}: {n}/{len(jobs)}', flush=True)
    ff.stdin.close(); ff.wait()
    print('wrote', out, f'{os.path.getsize(out) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
