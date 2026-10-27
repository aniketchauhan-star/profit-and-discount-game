#!/usr/bin/env python3
"""The Gemini sparkle on the user's Google Flow takes, and how it comes off (tools/flow_import.py uses it).

The sparkle: a white four-pointed star, |dx/R|^(2/3) + |dy/R|^(2/3) <= 1 with R = 39 px, at (1740, 900) on every
1920 x 1080 take, laid over it see-through: out = alpha * white + (1 - alpha) * under. It comes off in the video's own
planes (yuv420p: Y at full size, U and V at half size, so its colour edge, which the video keeps at half size, comes
off too):
  1. exactly: under = (out - alpha * white) / (1 - alpha), alpha learnt pixel by pixel (tools/flow_sparkle.npz);
  2. its outline, where compression smeared the star's edge differently on every take (no fixed alpha undoes that):
     in a 2 px band along it, each pixel becomes the median of 7 points across the outline (along its normal), twice.
     A thin line along the outline goes; an edge crossing it stays.

  ~/.cache/bj-voices/venv/bin/python tools/flow_sparkle.py learn TAKE.mp4 ...
      learns alpha again from takes (as many as there are) and writes tools/flow_sparkle.npz.

How alpha was learnt (2026-10-27, from the user's 15 takes in "flow video new/"):
  a. Its shape. In each take, what lies under the star is guessed by filling it smoothly (Laplace) from round it, and
     alpha fitted to white over the take; then the median over the takes (each one's furniture biases another place),
     and that as a function of the distance to the outline (near it) and of the star's shape value (inside).
  b. Its level. Where the inside of the star is plain, what it shows against the plain surface round it lies on a
     straight line, out = alpha * white + (1 - alpha) * under, over the takes: alpha inside 0.28 and white 238 (Y), and
     no colour (U and V: 128). The shape is scaled to that alpha (the smooth filling of (a) guesses `under` too dark
     where a dark edge is near, so its alpha came out too high).
  c. The outline band: alpha pixel by pixel, the median over the frames of (out - under) / (white - under), `under`
     being the frame with its outline filled across from both sides.
Needs numpy and scipy (python3 -m pip install numpy scipy), and ffmpeg.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy.ndimage import map_coordinates, sobel
from scipy.sparse import csr_matrix, lil_matrix
from scipy.sparse.linalg import factorized
from scipy.spatial import cKDTree

MAPS = Path(__file__).resolve().parent / 'flow_sparkle.npz'
X0, Y0, W, H = 1660, 820, 160, 160            # the box round the star, on a 1920 x 1080 frame (even: U and V line up)
CX, CY, R = 80.0, 80.0, 39.0                   # the star in the box
WHITE_Y, WHITE_C = 238.0, 128.0                # the overlay, in Y and in U and V


def geometry(w, h, cx, cy, r, n=20000):
    """Per pixel of a w x h box: the signed distance to the star's outline (inside < 0), the nearest point on it and
    the outward normal there."""
    yy, xx = np.mgrid[0:h, 0:w] + 0.5
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    c, s = np.cos(t), np.sin(t)
    curve = np.stack([cx + r * c ** 3, cy + r * s ** 3], 1)
    tangent = np.stack([-3 * r * c ** 2 * s, 3 * r * s ** 2 * c], 1)
    normal = np.stack([tangent[:, 1], -tangent[:, 0]], 1)
    normal /= np.maximum(np.linalg.norm(normal, axis=1, keepdims=True), 1e-9)
    normal *= np.where(np.sign((curve - [cx, cy]) * normal).sum(1, keepdims=True) < 0, -1, 1)  # (away from the middle)
    dist, k = cKDTree(curve).query(np.stack([xx.ravel(), yy.ravel()], 1))
    inside = ((np.abs(xx - cx) / r) ** (2 / 3) + (np.abs(yy - cy) / r) ** (2 / 3) <= 1).ravel()
    return (dist * np.where(inside, -1, 1)).reshape(h, w), curve[k].reshape(h, w, 2), normal[k].reshape(h, w, 2)


def planes(raw, w, h):
    """yuv420p frames (bytes) → float arrays Y (n, h, w), U and V (n, h/2, w/2)."""
    a = np.frombuffer(raw, np.uint8).reshape(-1, w * h * 3 // 2).astype(np.float32)
    q = w * h // 4
    return (a[:, :w * h].reshape(-1, h, w), a[:, w * h:w * h + q].reshape(-1, h // 2, w // 2),
            a[:, w * h + q:].reshape(-1, h // 2, w // 2))


class AcrossMedian:
    """In the outline band, each pixel becomes the median of `taps` points across the outline (along its normal,
    `step` px apart), its weight easing off over `soft` px at the band's edges."""

    def __init__(self, geo, half, soft, taps, step):
        d, _, n = geo
        sel = np.abs(d) <= half + soft
        yy, xx = np.nonzero(sel)
        nn = n[sel]
        self.coords = [np.stack([yy + o * nn[:, 1], xx + o * nn[:, 0]]) for o in (np.arange(taps) - (taps - 1) / 2) * step]
        self.sel = sel
        self.w = np.clip((half + soft - np.abs(d[sel])) / soft, 0, 1)

    def __call__(self, img):
        out = img.copy()
        across = np.median(np.stack([map_coordinates(img, c, order=1, mode='nearest') for c in self.coords]), 0)
        out[self.sel] = across * self.w + img[self.sel] * (1 - self.w)
        return out


class Sparkle:
    """Takes the sparkle off a frame's corner box (Y: H x W; U, V: H/2 x W/2; floats)."""

    def __init__(self, maps=None):
        m = np.load(MAPS) if maps is None else maps
        self.aY, self.aU, self.aV = (np.asarray(m[k], np.float32) for k in ('y', 'u', 'v'))
        self.mY = AcrossMedian(geometry(W, H, CX, CY, R), 2.0, 0.75, 7, 1.0)
        self.mC = AcrossMedian(geometry(W // 2, H // 2, CX / 2, CY / 2, R / 2), 1.25, 0.5, 5, 1.0)

    def clean(self, y, u, v):
        y = (y - self.aY * WHITE_Y) / (1 - self.aY)
        u = (u - self.aU * WHITE_C) / (1 - self.aU)
        v = (v - self.aV * WHITE_C) / (1 - self.aV)
        for _ in range(2):
            y, u, v = self.mY(y), self.mC(u), self.mC(v)
        return [np.clip(p, 0, 255) for p in (y, u, v)]

    def frame(self, raw):
        """One whole yuv420p frame (1920 x 1080, bytes) with the sparkle taken off (bytes)."""
        fw, fh = 1920, 1080
        a = np.frombuffer(raw, np.uint8).copy()
        y = a[:fw * fh].reshape(fh, fw)
        u = a[fw * fh:fw * fh * 5 // 4].reshape(fh // 2, fw // 2)
        v = a[fw * fh * 5 // 4:].reshape(fh // 2, fw // 2)
        by, bx, cy, cx = slice(Y0, Y0 + H), slice(X0, X0 + W), slice(Y0 // 2, (Y0 + H) // 2), slice(X0 // 2, (X0 + W) // 2)
        ny, nu, nv = self.clean(y[by, bx].astype(np.float32), u[cy, cx].astype(np.float32), v[cy, cx].astype(np.float32))
        y[by, bx], u[cy, cx], v[cy, cx] = (np.round(p).astype(np.uint8) for p in (ny, nu, nv))
        return a.tobytes()


# ---------- learning alpha (see the top) ----------

def corners(path, step=1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf', f'crop={W}:{H}:{X0}:{Y0}',
                          '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-'], capture_output=True, check=True).stdout
    y, u, v = planes(raw, W, H)
    return y[::step], u[::step], v[::step]


class Laplace:
    """Fills `mask` of an image smoothly from the pixels round it."""

    def __init__(self, mask):
        h, w = mask.shape
        idx = -np.ones((h, w), int)
        pts = np.argwhere(mask)
        idx[mask] = np.arange(len(pts))
        A = lil_matrix((len(pts), len(pts)))
        rows, cols = [], []
        for k, (y, x) in enumerate(pts):
            A[k, k] = 4
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                j = idx[y + dy, x + dx]
                if j >= 0:
                    A[k, j] = -1
                else:
                    rows.append(k)
                    cols.append((y + dy) * w + x + dx)
        self.solve = factorized(csr_matrix(A).tocsc())
        self.B = csr_matrix((np.ones(len(rows)), (rows, cols)), shape=(len(pts), h * w))
        self.mask = mask

    def __call__(self, img):
        out = img.copy()
        out[self.mask] = self.solve(self.B @ img.ravel())
        return out


class Band:
    """Fills the band |d| <= half across, from just inside it to just outside it (along the outline's normal)."""

    def __init__(self, geo, half, soft):
        d, at, n = geo
        sel = np.abs(d) <= half + soft
        reach = half + 1.0
        self.pin = (at[sel] - n[sel] * reach - 0.5)[:, ::-1].T   # (row, col); pixel centres are at index + 0.5
        self.pout = (at[sel] + n[sel] * reach - 0.5)[:, ::-1].T
        self.t = np.clip((d[sel] + reach) / (2 * reach), 0, 1)
        self.w = np.clip((half + soft - np.abs(d[sel])) / soft, 0, 1)
        self.sel = sel

    def __call__(self, img):
        a = map_coordinates(img, self.pin, order=1, mode='nearest')
        b = map_coordinates(img, self.pout, order=1, mode='nearest')
        out = img.copy()
        out[self.sel] = (a * (1 - self.t) + b * self.t) * self.w + img[self.sel] * (1 - self.w)
        return out


def learn(takes, log=print):
    data = [corners(p, 2) for p in takes]
    d, _, _ = geometry(W, H, CX, CY, R)
    s = ((np.abs(np.mgrid[0:H, 0:W][1] + 0.5 - CX) / R) ** (2 / 3) + (np.abs(np.mgrid[0:H, 0:W][0] + 0.5 - CY) / R) ** (2 / 3))

    # a. the shape
    yy, xx = np.mgrid[0:H, 0:W]
    fill = Laplace((np.abs(xx - CX) <= 47) & (np.abs(yy - CY) <= 47))
    per_take = []
    for y, _, _ in data:
        num = np.zeros((H, W))
        den = np.zeros((H, W))
        for f in y[::2]:
            e = fill(f)
            num += (f - e) * (WHITE_Y - e)
            den += (WHITE_Y - e) ** 2
        per_take.append(np.where(den > 1, num / np.maximum(den, 1), 0))
    med = np.median(np.stack(per_take), 0)
    bins = np.arange(-6, 10.01, 0.25)
    edge = np.array([np.median(med[(d >= lo) & (d < lo + 0.25)]) for lo in bins[:-1]])
    sbins = np.arange(0, 1.0001, 0.05)
    inner = np.array([np.median(med[(s >= lo) & (s < lo + 0.05) & (d < -4)]) if ((s >= lo) & (s < lo + 0.05) & (d < -4)).any()
                      else np.nan for lo in sbins[:-1]])
    ok = ~np.isnan(inner)
    inner = np.interp(sbins[:-1] + 0.025, (sbins[:-1] + 0.025)[ok], inner[ok])
    w = np.clip((d + 6) / 2, 0, 1)
    shape = np.interp(s, sbins[:-1] + 0.025, inner) * (1 - w) + np.interp(d, bins[:-1] + 0.125, edge) * w
    shape = np.clip(np.where(d > 9.5, 0, shape), 0, 1)

    # b. the level, from plain insides
    I, O = d <= -4, (d >= 6) & (d <= 14)

    def plain(x, width=6):
        h, e = np.histogram(x, bins=np.arange(0, 258, 2))
        m = e[h.argmax()] + 1
        return float(np.median(x[np.abs(x - m) <= width]))
    pts = [(plain(f[O]), float(np.median(f[I]))) for y, _, _ in data for f in y if np.std(f[I]) <= 1.5]
    arr = np.array(pts)
    (slope, icpt), *_ = np.linalg.lstsq(np.stack([arr[:, 0], np.ones(len(arr))], 1), arr[:, 1], rcond=None)
    log(f'level: {len(arr)} plain frames; the line gives alpha inside {1 - slope:.3f}, white {icpt / (1 - slope):.1f}')
    k = WHITE_Y - arr[:, 0]
    alpha_in = float(np.sum((arr[:, 1] - arr[:, 0]) * k) / np.sum(k * k))   # (white taken as WHITE_Y)
    log(f'       with white {WHITE_Y:.0f}: alpha inside {alpha_in:.3f}')
    alpha = shape * alpha_in / float(np.median(shape[I]))

    # c. the outline band, pixel by pixel
    geoY = geometry(W, H, CX, CY, R)
    geoC = geometry(W // 2, H // 2, CX / 2, CY / 2, R / 2)
    dC = geoC[0]
    aY = (alpha * (d <= 2.0)).astype(np.float32)
    aC = aY.reshape(H // 2, 2, W // 2, 2).mean((1, 3))
    tips = [(CX + R, CY), (CX - R, CY), (CX, CY + R), (CX, CY - R)]
    bandY, bandC = Band(geoY, 2.0, 0.75), Band(geoC, 1.25, 0.5)
    for band, tp, (k0, k1) in ((bandY, tips, (3.0, 10.0)), (bandC, [(x / 2, y / 2) for x, y in tips], (1.5, 5.0))):
        at = np.stack(np.nonzero(band.sel), 1)[:, ::-1] + 0.5
        gap = np.min([np.hypot(*(at - t).T) for t in tp], 0)
        band.w *= np.clip((gap - k0) / (k1 - k0), 0, 1)  # (near a tip the star is thinner than the band: not filled)
    selY, selC = np.abs(d) <= 3.5, np.abs(dC) <= 2.0
    est = {'y': [[] for _ in range(selY.sum())], 'u': [[] for _ in range(selC.sum())], 'v': [[] for _ in range(selC.sum())]}
    for y, u, v in data:
        for fy, fu, fv in zip(y, u, v):
            ty = np.clip(bandY((fy - aY * WHITE_Y) / (1 - aY)), 0, 255)
            grad = np.hypot(sobel(ty, 0), sobel(ty, 1))
            ok = (WHITE_Y - ty > 25) & (grad < 40)
            e = (fy - ty) / np.maximum(WHITE_Y - ty, 1)
            for i in np.nonzero(ok[selY])[0]:
                est['y'][i].append(e[selY][i])
            okc = (grad < 40).reshape(H // 2, 2, W // 2, 2).all((1, 3))
            for key, f in (('u', fu), ('v', fv)):
                t = np.clip(bandC((f - aC * WHITE_C) / (1 - aC)), 0, 255)
                dd = WHITE_C - t
                ec = (f - t) / np.where(np.abs(dd) > 1e-3, dd, 1e-3)
                for i in np.nonzero((okc & (np.abs(dd) > 8))[selC])[0]:
                    est[key][i].append(ec[selC][i])

    def band_alpha(base, sel, e):
        out = base.copy()
        got = np.array([np.median(x) if len(x) >= 40 else np.nan for x in e])
        keep = np.isnan(got)
        got[keep] = base[sel][keep]
        out[sel] = np.clip(got, 0, 0.9)
        return out
    maps = {'y': band_alpha(aY, selY, est['y']), 'u': band_alpha(aC, selC, est['u']), 'v': band_alpha(aC, selC, est['v'])}
    return {k: v.astype(np.float16) for k, v in maps.items()}


if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] != 'learn':
        sys.exit(__doc__)
    maps = learn(sys.argv[2:])
    np.savez(MAPS, **maps)
    print(f'wrote {MAPS}')
