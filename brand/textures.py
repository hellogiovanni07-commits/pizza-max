"""Pizza Max - the brand's surfaces as seamless tiles (assets/tex/*.webp).

  python brand/textures.py

Every tile is built from noise filtered in the frequency domain, so it repeats with no seam in either direction:
  planks.webp   white-painted wood planks: grain under the paint, a tone per board, bevelled seams, staggered joints
  kraft.webp    brown kraft board: mottling, fibres, dark specks, a faint flute under the liner
  paper.webp    thermal / card paper: a quiet fibre texture
  chalk.webp    the pavement board: dark green-black, wiped chalk haze
No photos, no generated imagery: every pixel comes from the maths below.
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'tex')
rng = np.random.default_rng(7)


def fnoise(h, w, sy, sx, seed=None):
    """periodic noise: white noise low-passed with a gaussian of the given size (pixels) in y and x, scaled to -1..1"""
    r = np.random.default_rng(seed) if seed is not None else rng
    f = np.fft.fft2(r.standard_normal((h, w)))
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.fftfreq(w)[None, :]
    g = np.exp(-((fy * sy) ** 2 + (fx * sx) ** 2) * 2 * np.pi ** 2)
    n = np.real(np.fft.ifft2(f * g))
    return n / (np.abs(n).max() + 1e-9)


def save(name, rgb, q=88):
    os.makedirs(OUT, exist_ok=True)
    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    img.save(os.path.join(OUT, name), 'WEBP', quality=q, method=6)
    print(name, img.size)


def planks(size=1600, n=8):
    """white-painted wood planks, seen from above"""
    h = w = size
    ph = h // n
    y = np.arange(h)[:, None]
    x = np.arange(w)[None, :]
    plank = (y // ph) % n
    # wood grain under the paint: long streaks along the board, a little wavy
    grain = fnoise(h, w, 2.2, 260, 1) * .55 + fnoise(h, w, 6, 90, 2) * .3 + fnoise(h, w, 1.2, 600, 3) * .25
    wave = fnoise(h, w, 120, 300, 4) * 9
    grain = np.roll(grain, 0, axis=0)
    yy = (y + wave).astype(int) % h
    grain = grain[yy, x]
    # a few knots: soft ellipses, painted over
    knots = np.zeros((h, w))
    for k in range(6):
        cy, cx = rng.integers(0, h), rng.integers(0, w)
        ry, rx = rng.uniform(5, 10), rng.uniform(16, 34)
        dy = ((y - cy + h / 2) % h - h / 2) / ry
        dx = ((x - cx + w / 2) % w - w / 2) / rx
        d = np.sqrt(dy ** 2 + dx ** 2)
        knots += np.exp(-d ** 2) * .9 + np.clip(np.cos(d * 6) * np.exp(-d / 2.5), 0, None) * .25
    # each board its own white, its own butt joint
    tone = rng.uniform(-1, 1, n) * 3.6
    joints = rng.integers(0, w, n)
    base = np.array([243.0, 241.0, 236.0])
    v = np.zeros((h, w))
    v += tone[plank]
    v += -grain * 10.5 - knots * 15
    v += fnoise(h, w, 1.2, 9, 5) * 3.0                        # brushed paint, along the board
    v += fnoise(h, w, 40, 120, 6) * 3.2                       # slow unevenness of the paint
    # seams: a dark groove, then the bevel catching the light on the board below
    py = y % ph
    seam = np.where(py < 2, -26.0, 0) + np.where(py == 2, 9.0, 0) + np.where((py >= 3) & (py < 7), 2.5, 0) + np.where(py > ph - 5, -3.0 * (py - (ph - 5)) / 4, 0)
    v += seam
    # butt joints: a short vertical crack per board
    jx = joints[plank]
    dxj = (x - jx + w) % w
    v += np.where(dxj < 2, -16.0, 0) + np.where(dxj == 2, 6.0, 0)
    rgb = base[None, None, :] + v[:, :, None] * np.array([1.0, 1.0, 1.06])[None, None, :]
    # the grain shows a touch warm through the paint
    rgb[:, :, 2] += -np.clip(grain, 0, None) * 6 - knots * 5     # wood shows warm where the paint is thin
    rgb[:, :, 1] += -np.clip(grain, 0, None) * 2
    save('planks.webp', rgb)


def kraft(size=1024):
    """brown kraft board"""
    h = w = size
    base = np.array([201.0, 166.0, 112.0])
    mott = fnoise(h, w, 40, 40, 11) * 9 + fnoise(h, w, 10, 10, 12) * 5 + fnoise(h, w, 2, 2, 13) * 4
    v = mott.copy()
    # fibres: short strokes in every direction, lighter and darker
    fib = np.zeros((h, w))
    y = np.arange(h)[:, None]
    x = np.arange(w)[None, :]
    for i in range(2600):
        cy, cx = rng.uniform(0, h), rng.uniform(0, w)
        a = rng.uniform(0, np.pi)
        L = rng.uniform(6, 26)
        s = rng.choice([-1, 1]) * rng.uniform(5, 13)
        t = np.linspace(-L / 2, L / 2, int(L * 2))
        py = ((cy + t * np.sin(a)).astype(int)) % h
        px = ((cx + t * np.cos(a)).astype(int)) % w
        fib[py, px] += s
    fib = gaussian_filter(fib, .6, mode='wrap')        # wrap: the tile stays seamless
    v += fib
    # dark specks
    sp = np.zeros((h, w))
    idx = rng.integers(0, h * w, 900)
    sp.flat[idx] = rng.uniform(-60, -25, 900)
    sp = gaussian_filter(sp, .7, mode='wrap')
    v += sp
    # the flute under the liner: faint bands
    v += np.sin(y * 2 * np.pi / 16) * 1.2
    rgb = base[None, None, :] + v[:, :, None] * np.array([1.0, .92, .78])[None, None, :]
    save('kraft.webp', rgb)


def paper(size=512):
    """thermal / card paper"""
    h = w = size
    v = fnoise(h, w, 1.2, 1.2, 21) * 2.2 + fnoise(h, w, 8, 8, 22) * 2.0 + fnoise(h, w, 30, 30, 23) * 1.4
    rgb = np.array([252.0, 251.0, 248.0])[None, None, :] + v[:, :, None]
    save('paper.webp', rgb, 90)


def chalk(size=1024):
    """a write-on board, wiped many times"""
    h = w = size
    v = fnoise(h, w, 90, 140, 31) * 10 + fnoise(h, w, 20, 60, 32) * 6 + fnoise(h, w, 1.4, 1.4, 33) * 5
    haze = np.clip(fnoise(h, w, 60, 200, 34), 0, None) * 18          # wiped chalk
    rgb = np.array([34.0, 46.0, 40.0])[None, None, :] + v[:, :, None] + haze[:, :, None] * np.array([1.0, 1.0, .95])[None, None, :]
    save('chalk.webp', rgb)


if __name__ == '__main__':
    planks()
    kraft()
    paper()
    chalk()
