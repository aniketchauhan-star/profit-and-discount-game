#!/usr/bin/env python3
"""Cuts Amit's walking figure into the pieces of a jointed cutout, for the game's walk (js/fx.js, Walker).

  python3 tools/make_walk_rig.py      writes "assets/sprites/aniket-rig.webp" and prints the pieces' places in it

The pieces come from the first frame of the old walk sheet ("source/aniket-walk-clean.png"; its front leg is the
near one): the upper body (with the far hand by the hip), the hips (the jeans' top, to the crotch: the game draws them
over both thighs), and the near leg cut into thigh, shin and shoe, which also make the far leg, a little darker. As in a
cut-out puppet, each limb piece is round at its top joint, centred on it, so it shows no corner as it turns: the thigh's
top is hidden under the hips, and the knee is round on both pieces. The hips' back is cut along a smooth line from the
waist to the crotch, without the top of the drawing's back leg (it stood out behind him as a lump once his legs moved:
the user, 2026-10-23). Every piece keeps the frame's coordinates (its offset is printed), so the game turns it about its
joint as drawn there: the hip (206, 375), the knee (215, 476) and the ankle (234, 580); the ground is at y 610.
After running it, copy the printed PIECES into WALK_RIG in js/game.js. Needs Pillow and NumPy.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / 'source' / 'aniket-walk-clean.png'
OUT = ROOT / 'assets' / 'sprites' / 'aniket-rig.webp'
FW, FH = 358, 614
FAR = 0.86  # the far leg's shade


def mask(points, feather=0.0, circles=(), fade=None):
    m = Image.new('L', (FW, FH), 0)
    d = ImageDraw.Draw(m)
    d.polygon(points, fill=255)
    for cx, cy, r in circles:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    if feather:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    a = np.array(m).astype(np.float32) / 255.0
    if fade:  # fully hidden above y0, fully shown below y1
        y0, y1 = fade
        a *= np.clip((np.arange(FH, dtype=np.float32)[:, None] - y0) / (y1 - y0), 0, 1)
    return a


def main():
    frame = np.array(Image.open(SHEET).convert('RGBA').crop((0, 0, FW, FH))).astype(np.float32)

    def piece(a, shade=1.0):
        out = frame.copy()
        out[..., :3] *= shade
        out[..., 3] *= a
        return out.clip(0, 255).astype(np.uint8)

    upper = np.maximum(mask([(0, 0), (FW, 0), (FW, 333), (0, 333)]), mask([(236, 300), (300, 300), (300, 368), (236, 368)]))
    hips = mask([(118, 326), (238, 326), (238, 382), (234, 392), (224, 400), (206, 405), (183, 406), (169, 399),
                 (155, 389), (143, 376), (134, 361), (129, 346), (127, 335)], feather=0.6)
    thigh = mask([(176, 380), (236, 380), (238, 440), (238, 476), (192, 476), (186, 440), (181, 410)],
                 feather=0.8, circles=[(206, 375, 31), (215, 476, 23)])
    shin = mask([(192, 476), (238, 476), (243, 500), (248, 520), (252, 540), (257, 560), (263, 582), (206, 582), (205, 560),
                 (203, 520), (199, 500)], feather=0.8, circles=[(215, 476, 23)])
    shoe = mask([(196, 568), (262, 566), (320, 590), (320, 614), (196, 614)], feather=0.6)
    pieces = [('upper', piece(upper)), ('hips', piece(hips)), ('thigh', piece(thigh)), ('shin', piece(shin)),
              ('shoe', piece(shoe)), ('thighFar', piece(thigh, FAR)), ('shinFar', piece(shin, FAR)), ('shoeFar', piece(shoe, FAR))]

    crops = []
    for name, img in pieces:
        ys, xs = np.nonzero(img[..., 3] > 0)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        crops.append((name, img[y0:y1, x0:x1], int(x0), int(y0)))
    width = sum(c[1].shape[1] for c in crops) + 4 * (len(crops) - 1)
    height = max(c[1].shape[0] for c in crops)
    atlas = np.zeros((height, width, 4), np.uint8)
    places, x = {}, 0
    for name, img, ox, oy in crops:
        h, w = img.shape[:2]
        atlas[:h, x:x + w] = img
        places[name] = [x, 0, w, h, ox, oy]  # where in the atlas, and the piece's top-left in the frame
        x += w + 4
    Image.fromarray(atlas).save(OUT, lossless=True, quality=100, method=6, exact=True)  # (lossless WebP: every pixel kept)
    print(f'{OUT.relative_to(ROOT)}: {width} x {height}, {OUT.stat().st_size // 1024} KB')
    print('PIECES = {')
    for name, p in places.items():
        print(f'  {name}: {p},')
    print('}')


if __name__ == '__main__':
    main()
