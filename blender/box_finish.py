"""Pizza Max - finish the box renders: assets/boxes/<id>.png (from box_scene.py) -> <id>.webp, then the png goes.

  python blender/box_finish.py

The shadow catcher also records a faint grey over the whole table, which shows as a hard-edged rectangle on light
grounds. The shadow is kept where it is real (contact and cast shadow), the faint wash is removed, and what is left
fades out before the frame edge. Then the picture is trimmed to the box and its shadow, with a small margin.
"""
import glob, os, subprocess
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'assets', 'boxes')
TOOL = os.path.expanduser(os.path.join('~', '.claude', 'skills', 'impeccable', 'scripts', 'impeccable.cmd'))
ORIGIN = ("Origin: rendered in Blender 5.2 (Cycles) by blender/box_scene.py, finished by blender/box_finish.py: Pizza Max "
          "boxes stacked, printed with the kit's own artwork (brand/export/box-lid.png, box-side.png) on the kit's kraft, "
          "the top one open on the shop's own pizza render. No generated or stock imagery.")


def finish(src):
    a = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    shadow = rgb.max(axis=2) < 10                      # the catcher writes black with alpha; the boxes are never this dark
    h, w = al.shape
    # remove the faint wash, keep the real shadow
    sa = np.clip((al - 14) / (255 - 14), 0, 1) * 255
    # and let it fade out before the frame edge
    y = np.arange(h)[:, None] / h
    x = np.arange(w)[None, :] / w
    edge = np.minimum(np.minimum(x, 1 - x), np.minimum(y, 1 - y))
    fade = np.clip(edge / .08, 0, 1) ** 1.5
    al = np.where(shadow, sa * fade, al)
    a[..., 3] = al
    # trim to what is visible, with a margin
    ys, xs = np.nonzero(al > 3)
    m = int(.03 * max(h, w))
    box = (max(xs.min() - m, 0), max(ys.min() - m, 0), min(xs.max() + m + 1, w), min(ys.max() + m + 1, h))
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).crop(box)
    out = src[:-4] + '.webp'
    img.save(out, 'WEBP', quality=86, alpha_quality=95, method=6)
    if os.path.isfile(TOOL):
        subprocess.run(['cmd', '/c', TOOL, 'embed-prompt', out, '--prompt', ORIGIN], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    os.remove(src)
    print(os.path.basename(out), img.size)


if __name__ == '__main__':
    for p in sorted(glob.glob(os.path.join(DIR, 'stack-*.png'))):
        finish(p)
