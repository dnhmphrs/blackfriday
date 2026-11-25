"""The worn-VHS-on-a-CRT look as a function: soft luma, smeared chroma, noise, time-base wobble,
scanlines, glow and dark corners. tools/icons-tape.py gives the extension's icons this look.
Every frame is a pure function of its index, so the result is reproducible."""
import numpy as np
import cv2


def blur(a, sx, sy):
    return cv2.GaussianBlur(a, (0, 0), sigmaX=sx, sigmaY=max(sy, 0.01))


def degrade(rgb, index, fps, glitch, amount=1.0, scratches=True, scale=None):
    """rgb: uint8 HxWx3. glitch: 0..1 strength of a tape glitch on this frame.
    scratches=False leaves out the dropout scratches (for clips whose grain is held still, where a
    scratch would sit in one place for the whole clip). scale: the size of the look, as a fraction of
    its size on a picture 1080 wide (default: the picture's own width / 1080); small pictures such as
    icons need it larger than that, or the look is too fine to see."""
    rng = np.random.default_rng(1000 + index)
    f = rgb.astype(np.float32) / 255.0
    H, W = f.shape[:2]
    k = scale or W / 1080.0              # scale every pixel distance with the frame
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
    for _ in range(rng.poisson(1.2 * amount + 10 * glitch) if scratches else 0):
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
