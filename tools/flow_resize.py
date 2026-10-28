"""The shoe shop's sneakers made smaller where they stand (the user, 2026-10-28, of screen 18: "The size of the sneakers
too large if we compare with Aniket's size. Fix the size.").

The pair on the stand, with its ₹1800 card, is lifted off the picture: its blue, and the light soles, laces and card
touching it. What was behind it is filled in (above the stand's top the wall, the pillar and the shelf's side carry
straight down; on the stand's top, across from either side), and the pair is put back smaller, standing where it stood;
a card standing in front of it a little less small, so its price still reads.

The camera never moves in the shoe shop's takes, so a take's sneakers are one still patch, made on its median picture
and laid over every frame (tools/flow_import.py: Smaller). The picture the working is done on, which shows the stand
closer, is made here from its original in git:

    python3 tools/flow_resize.py      assets/story/he-thinks-about-the-shoes.webp again
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent

# The pair as the shoe shop's films show it (stage px): where it is (roi), the stand top's back edge behind its soles
# (edge: its dark line, over the lit rim), how much smaller it is made (scale), and the tent card in front of it (its
# outline; card_scale).
SNEAKERS_FILM = {
    'roi': (1000, 400, 1600, 690), 'edge': 640, 'scale': 0.74,
    'card': [(1207, 653), (1225, 561), (1402, 546), (1424, 649), (1385, 652)], 'card_scale': 0.86,
}
# The picture the working is done on (he thinks, hand on his chin; the stand closer: its own px, 1672 × 941). Its card
# hangs from the laces on a string, so it goes with the pair.
SNEAKERS_THINKING = {'roi': (860, 380, 1440, 640), 'edge': 585, 'scale': 0.74, 'card': None,
                     'across': [(895, 476, 941, 592)]}  # (the shoe boxes behind its toe)
STILLS = {
    'assets/story/he-thinks-about-the-shoes.webp': ('6048baf', SNEAKERS_THINKING),  # (its original: that commit's)
}


def pair_mask(rgb, roi):
    """The sneakers (blue uppers, dark navy rims) and the light parts touching them (soles, laces, the card)."""
    h, w, _ = rgb.shape
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = (mx - mn) / (mx + 1e-6)
    x0, y0, x1, y1 = roi
    inside = np.zeros((h, w), bool)
    inside[y0:y1, x0:x1] = True
    blue = ((b > r + 0.10) & (b > g + 0.04) & (sat > 0.25) | (b > r + 0.05) & (b > g + 0.03) & (mx < 0.4)) & inside
    blue = ndi.binary_opening(blue, iterations=1)
    lab, n = ndi.label(blue)
    sizes = ndi.sum(blue, lab, range(1, n + 1))
    blue = np.isin(lab, 1 + np.where(sizes > 3000)[0])
    ys, xs = np.nonzero(blue)
    bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
    light = (mn > 0.6) & (sat < 0.115) & (r - b < 0.05) & inside & ~blue  # (not the warm cream of the stand's top)
    lab, n = ndi.label(light)
    keep = []
    for k in np.unique(lab[ndi.binary_dilation(blue, iterations=2) & light]):
        if not k:
            continue
        yy, xx = np.nonzero(lab == k)
        if xx.min() >= bx0 - 30 and xx.max() <= bx1 + 30 and yy.min() >= by0 - 5 and yy.max() <= by1 + 30:
            keep.append(k)
    yy, xx = np.mgrid[-6:7, -6:7]
    disk = xx ** 2 + yy ** 2 <= 36
    mask = ndi.binary_fill_holes(ndi.binary_closing(blue | np.isin(lab, keep), structure=disk))
    lab, n = ndi.label(mask)
    mask = lab == 1 + np.argmax(ndi.sum(mask, lab, range(1, n + 1)))
    ys, xs = np.nonzero(mask)
    for y in range(ys.max() - 50, ys.max() + 1):  # (the lowest rows edge to edge: the soles and the card are in front)
        row = np.nonzero(mask[y])[0]
        if row.size:
            mask[y, row.min():row.max() + 1] = True
    return mask


def behind(rgb, gone, edge, across=()):
    """The picture with what was behind the `gone` pixels filled in: above `edge` (the stand top's back edge) each run
    of them down a column takes the colour a few pixels above it (smoothed; higher if that is still the sneakers' blue),
    so the wall, the pillar and the shelf carry straight down; from `edge` on, across the stand's top from either side.
    In the boxes `across` (x0, y0, x1, y1), what is left of them carries on, mirrored (shoe boxes on a shelf)."""
    out = rgb.copy()
    smooth = ndi.uniform_filter(rgb, (5, 9, 1))
    for x in np.nonzero(gone[:edge].any(0))[0]:
        col = gone[:edge, x]
        y = 0
        while y < edge:
            if not col[y]:
                y += 1
                continue
            y2 = y
            while y2 < edge and col[y2]:
                y2 += 1
            k = y - 4
            while k > 0 and smooth[k, x, 2] > smooth[k, x, 0] + 0.08:
                k -= 2
            out[y:y2, x] = smooth[k, x]
            y = y2
    up = np.zeros_like(gone)
    up[:edge] = gone[:edge]
    out[up] = ndi.median_filter(out, size=(1, 7, 1))[up]  # (no thin streaks down it: the pillar's edges stay)
    for x0, y0, x1, y1 in across:
        for y in range(y0, y1):
            row = np.nonzero(gone[y, x0:x1])[0]
            if row.size:
                left = x0 + row.min()  # (the first gone pixel of the row: mirrored about it)
                xs = np.arange(left, x1)
                out[y, xs] = rgb[y, np.clip(2 * left - xs - 1, 0, None)]
    for y in range(edge, gone.shape[0]):
        m = gone[y]
        if not m.any():
            continue
        known = np.nonzero(~m)[0]
        for c in range(3):
            out[y, :, c][m] = np.interp(np.nonzero(m)[0], known, rgb[y, :, c][known])
    return out


def scaled(layer, s, anchor, to):
    """An RGBA layer (premultiplied, 0–1) made `s` times as big about the point `anchor`, which lands on `to`."""
    h, w, _ = layer.shape
    a = 1 / s
    (ax, ay), (tx, ty) = anchor, to
    img = Image.fromarray((layer * 255).round().astype(np.uint8), 'RGBA')
    out = img.transform((w, h), Image.AFFINE, (a, 0, ax - a * tx, 0, a, ay - a * ty), resample=Image.BICUBIC)
    return np.asarray(out).astype(np.float32) / 255


def smaller(rgb, spec):
    """The picture (float RGB, 0–1) with its sneakers made smaller; also where it changed (a soft alpha, 0–1) and how
    (`moved(x, y)`: where a point of the pair is now; `card(x, y, w, h)`: the card's box then)."""
    h, w, _ = rgb.shape
    pair = pair_mask(rgb, spec['roi'])
    ys, xs = np.nonzero(pair)
    edge = spec['edge']
    gone = ndi.binary_dilation(pair, iterations=5)
    for x in range(xs.min() - 6, xs.max() + 7):  # under the soles, down to the clean stand top: their dark edge, shadow
        col = np.nonzero(gone[:edge + 20, x])[0]
        if col.size:
            gone[col.max():edge + 20, x] = True
    out = behind(rgb, gone, edge, spec.get('across', ()))
    s = spec['scale']
    anchor = ((xs.min() + xs.max()) / 2, ys.max())  # (it stays standing where it stood)
    def moved(x, y):
        return anchor[0] + (x - anchor[0]) * s, anchor[1] + (y - anchor[1]) * s

    def put(mask, scale, at, to):
        nonlocal out
        alpha = ndi.gaussian_filter(ndi.binary_erosion(mask).astype(np.float32), 0.7)  # (its own edge: not the wall's)
        layer = scaled(np.dstack([rgb * alpha[..., None], alpha]), scale, at, to)
        out = out * (1 - layer[..., 3:4]) + layer[..., :3]

    put(pair, s, anchor, anchor)
    card = None
    if spec.get('card'):
        poly = Image.new('L', (w, h), 0)
        ImageDraw.Draw(poly).polygon(spec['card'], fill=255)
        tent = (np.asarray(poly) > 0) & pair
        cx = [p[0] for p in spec['card']]
        foot = ((min(cx) + max(cx)) / 2, max(p[1] for p in spec['card']))  # (it stands on its bottom edge)
        c = spec['card_scale']
        put(tent, c, foot, moved(*foot))

        def card(x, y, bw, bh):
            fx, fy = moved(*foot)
            return fx + (x - foot[0]) * c, fy + (y - foot[1]) * c, bw * c, bh * c
    alpha = np.clip(ndi.gaussian_filter(gone.astype(np.float32), 1.5) * 1.5, 0, 1)
    return np.clip(out, 0, 1), alpha, moved, card


def from_git(rev, path):
    with tempfile.NamedTemporaryFile(suffix=Path(path).suffix, delete=False) as f:
        f.write(subprocess.run(['git', 'show', f'{rev}:{path}'], cwd=ROOT, capture_output=True, check=True).stdout)
    img = Image.open(f.name).convert('RGB')
    Path(f.name).unlink()
    return np.asarray(img).astype(np.float32) / 255


def main():
    for path, (rev, spec) in STILLS.items():
        rgb = from_git(rev, path)
        out, _, moved, _ = smaller(rgb, spec)
        dest = ROOT / path
        with tempfile.TemporaryDirectory() as d:
            png = Path(d) / 'f.png'
            Image.fromarray((out * 255).round().astype(np.uint8)).save(png)
            subprocess.run(['cwebp', '-quiet', '-q', '90', '-m', '6', '-sharp_yuv', '-noalpha', str(png), '-o', str(dest)],
                           check=True)
        print(f'  {path}: its sneakers ×{spec["scale"]}, {dest.stat().st_size / 1e3:.0f} kB')


if __name__ == '__main__':
    sys.exit(main())
