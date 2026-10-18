"""Pizza Max - finish the renders that stand on the table (they cast their shadow on a shadow catcher).

  python blender/box_finish.py                  # assets/boxes/stack-*.png from box_scene.py -> .webp, the png goes
  python blender/box_finish.py props <folder>   # <folder>/props/*.png from pizza_scene.py --props -> assets/props/*.webp

The shadow catcher also records a faint grey over the whole table, which shows as a hard-edged rectangle on light
grounds. The shadow is kept where it is real (contact and cast shadow), the faint wash is removed, and what is left
fades out before the frame edge. Then the picture is trimmed to the object and its shadow, with a small margin.
"""
import glob, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOL = os.path.expanduser(os.path.join('~', '.claude', 'skills', 'impeccable', 'scripts', 'impeccable.cmd'))
ORIGIN = {
    'boxes': ("Origin: rendered in Blender 5.2 (Cycles) by blender/box_scene.py, finished by blender/box_finish.py: Pizza Max "
              "boxes stacked, printed with the kit's own artwork (brand/export/box-lid.png, box-side.png) on the kit's kraft, "
              "the top one open on the shop's own pizza render. No generated or stock imagery."),
    'props': ("Origin: rendered in Blender 5.2 (Cycles) by blender/pizza_scene.py --props, finished by blender/box_finish.py: "
              "loose ingredients modelled for the hero (basil, cherry tomato, chilli, sauce bowl), lit with the pizza rig and "
              "lying on the table with their own shadow. No generated or stock imagery."),
}


def finish(src, out, origin, cap=None, shade=1.0):
    a = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
    rgb, al = a[..., :3], a[..., 3]
    shadow = rgb.max(axis=2) < 10                      # the catcher writes black with alpha; the objects are never this dark
    h, w = al.shape
    # remove the faint wash, keep the real shadow
    sa = np.clip((al - 14) / (255 - 14), 0, 1) * 255 * shade
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
    if cap and max(img.size) > cap:
        img.thumbnail((cap, cap), Image.LANCZOS)
    img.save(out, 'WEBP', quality=86, alpha_quality=95, method=6)
    if os.path.isfile(TOOL):
        subprocess.run(['cmd', '/c', TOOL, 'embed-prompt', out, '--prompt', origin], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    print(os.path.basename(out), img.size)


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'props':
        for p in sorted(glob.glob(os.path.join(sys.argv[2], 'props', '*.png'))):
            name = os.path.splitext(os.path.basename(p))[0]
            if name == 'olives':
                continue                               # near-black skins would read as shadow here; not used on the site
            finish(p, os.path.join(ROOT, 'assets', 'props', name + '.webp'), ORIGIN['props'], cap=520, shade=.6)   # small things: a lighter shadow
    else:
        for p in sorted(glob.glob(os.path.join(ROOT, 'assets', 'boxes', 'stack-*.png'))):
            finish(p, p[:-4] + '.webp', ORIGIN['boxes'])
            os.remove(p)
