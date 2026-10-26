#!/usr/bin/env python3
"""Readies a clip made with Google Gemini (Veo) for the game. tools/make_videos.py --import --gemini runs it on each clip,
with the clip's story pictures from "docs/prompts/Animation Video Prompts.md". It also runs on its own:

  python3 tools/gemini_clean.py SOURCE DEST --picture PICTURE [--end-picture PICTURE] [--trim FROM-TO] [--pingpong]
                                [--cover X0,Y0,X1,Y1@FROM-TO ...] [--keep-camera] [--framing ZOOM,DX,DY]
                                [--star-from DX,DY]

What it does to the clip:
  * The framing. Gemini shows the story picture about 2% closer than it is, and in some takes the camera keeps pushing
    in. The zoom (and any shift) is measured against the picture, frame by frame when it changes, and undone. The clip
    then sits exactly on the picture, so it takes over from the still picture, and hands back to it, without a jump. The
    thin border this leaves is filled from the picture, its colours matched to the frame.
  * The Gemini sparkle, bottom right: covered with the same spot of the picture, its colours matched to the frame
    round it, through a soft edge.
  * The colours: put back to the picture's (a gain and an offset per channel, from the first frame).
  * --trim FROM-TO keeps only that part (seconds). --pingpong plays it forwards, then backwards: a quiet loop that
    wanders off its picture comes back to it, so it loops without a jump.
  * --cover X0,Y0,X1,Y1@FROM-TO: something else Gemini drew where only the picture's background is (a caption, say),
    covered the way the sparkle is, in that box (the clip's own pixels) during that time (seconds, before any trim).
  * --keep-camera: for a clip whose camera move is wanted (the camera moving in on the price tags, say). Its framing
    is left as Gemini made it; the camera is followed frame by frame, so that the sparkle is still covered with the
    spot of the picture that lies under it.
  * --framing ZOOM,DX,DY: where to start looking for the picture in the clip (as the log prints it), for a take framed
    further off than Gemini's usual 2% (outgoing.mp4, Screens 20-21, sits 15 px higher: 1.0226,0.6,-15). Without it,
    only the zoom is searched widely, so a take that is also shifted is lined up wrongly, and its sparkle covered
    with the wrong spot of the picture.
  * --star-from DX,DY: the sparkle covered with the clip's own pixels from DX,DY away (on a 1280 x 720 frame), for a
    take that drew the spot under it differently from the picture (outgoing.mp4: -70,0, the floor and the glass's base
    just left of it; nothing passes over it).
  * The result is written like the game's other clips (H.264, no sound), at the clip's own size and frame rate
    (Gemini's clips are 1280 x 720; tools/enhance_clips.py then makes them 1920 x 1080: sharpened, as
    tools/make_videos.py --import --gemini does by itself, or redrawn by Real-ESRGAN with --ai). It is marked as sRGB, as Gemini marks it and as the pictures are: so marked, the browser shows
    it in exactly the picture's colours (marked BT.709, or not marked, it shows a little lighter).

A movement clip (one picture turning into the next, --end-picture) fills its border from its first picture, then from
its last. Needs numpy and Pillow (python3 -m pip install numpy pillow) and ffmpeg.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ZOOM = 1.022          # how much closer Gemini shows the picture (the same on every clip measured so far)
# The sparkle: a four-pointed star, |dx/r|^(2/3) + |dy/r|^(2/3) <= 1, at (1160, 600) with r = 25 on a 1280 x 720 frame.
STAR = (1160 / 1280, 600 / 720, 25 / 1280)
SW, SH = 640, 360     # the size the framing is measured at


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height,r_frame_rate,color_space', '-of', 'json', str(path)],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)['streams'][0]
    num, den = map(int, s['r_frame_rate'].split('/'))
    return s['width'], s['height'], f'{num}/{den}', num / den, s.get('color_space', '')


def read_frames(path, w, h, space):
    """The clip's frames, in RGB (converted with the matrix the clip says it was made with)."""
    matrix = 'bt709' if space == 'bt709' else 'bt601'
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-an', '-vf',
                          f'scale=in_color_matrix={matrix}:in_range=tv:flags=bicubic+accurate_rnd+full_chroma_int',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def picture_coeffs(out_w, w, h, pw, ph, s, dx, dy):
    """PIL affine coefficients: a pixel of an output `out_w` wide (the clip's shape) → the picture's pixel there, when the
    clip shows the picture zoomed s times about its centre and moved by (dx, dy) clip pixels."""
    k = w / out_w
    kx, ky = pw / w, ph / h
    return (kx * k / s, 0, kx * ((-w / 2 - dx) / s + w / 2), 0, ky * k / s, ky * ((-h / 2 - dy) / s + h / 2))


def frame_coeffs(w, h, s, dx, dy):
    """PIL affine coefficients: a pixel of the output (the picture's framing, the clip's size) → the clip frame's pixel there."""
    return (s, 0, w / 2 * (1 - s) + dx, 0, s, h / 2 * (1 - s) + dy)


def fit_colour(src, dst):
    """Per channel, the gain and offset taking src's colours to dst's (least squares)."""
    g, o = np.ones(3, np.float32), np.zeros(3, np.float32)
    for c in range(3):
        x, y = src[:, c], dst[:, c]
        A = np.vstack([x, np.ones_like(x)]).T
        (g[c], o[c]), *_ = np.linalg.lstsq(A, y, rcond=None)
    return g, o


class Framing:
    """Measures where the picture sits in the clip's frames."""

    def __init__(self, picture, w, h):
        self.pic, self.w, self.h = picture, w, h
        yy, xx = np.mgrid[0:SH, 0:SW]
        corner = (xx > SW * 0.80) & (yy > SH * 0.72)                        # the sparkle's corner
        self.whole = ~corner
        edge = (xx < SW * 0.17) | (xx > SW * 0.83) | (yy < SH * 0.17) | (yy > SH * 0.86)
        self.edge = edge & ~corner                                          # the room round the people

    def small(self, frame):
        return np.asarray(Image.fromarray(frame).resize((SW, SH), Image.BOX), dtype=np.float32)

    def error(self, f, mask, s, dx, dy):
        p = np.asarray(self.pic.transform((SW, SH), Image.AFFINE,
                                          picture_coeffs(SW, self.w, self.h, *self.pic.size, s, dx, dy), Image.BILINEAR),
                       dtype=np.float32)
        a, b = p[mask], f[mask]
        g, o = fit_colour(a, b)
        e = np.abs(a * g + o - b).mean(1)
        return float(np.sort(e)[: int(len(e) * 0.7)].mean())               # the people moving don't count

    def fit(self, f, mask, guess, wide=False, steps=((0.003, 3.0, 2), (0.001, 1.0, 2), (0.0004, 0.4, 1))):
        s0, x0, y0 = guess
        if wide:  # first, the zoom alone, over a wide range
            s0 = min(np.arange(0.97, 1.10, 0.004), key=lambda s: self.error(f, mask, s, 0, 0))
        best = (self.error(f, mask, s0, x0, y0), s0, x0, y0)
        for ds, dd, n in steps:
            _, s0, x0, y0 = best
            for s in s0 + ds * np.arange(-n, n + 1):
                for dx in x0 + dd * np.arange(-n, n + 1):
                    for dy in y0 + dd * np.arange(-n, n + 1):
                        e = self.error(f, mask, s, dx, dy)
                        if e < best[0]:
                            best = (e, s, dx, dy)
        return best


def follow_camera(framing, frames, first):
    """Where the picture sits in every frame of a clip whose camera moves on purpose: fitted on every other frame,
    each guess carried on from the two before it, and filled in between."""
    n = len(frames)
    at = list(range(0, n, 2)) + ([n - 1] if (n - 1) % 2 else [])
    found = [np.array(first[1:])]
    for i in at[1:]:
        guess = 2 * found[-1] - found[-2] if len(found) > 1 else found[-1]
        r = framing.fit(framing.small(frames[i]), framing.edge, tuple(guess),
                        steps=((0.004, 3.0, 3), (0.001, 1.0, 2), (0.0004, 0.4, 1)))
        found.append(np.array(r[1:]))
    found = np.array(found)
    return np.stack([np.interp(np.arange(n), at, found[:, k]) for k in range(3)], 1)


def star_mask(cx, cy, r, box, u):
    """The sparkle (grown a little, with a soft edge) and the ring round it where colours are matched, on a window of
    the output, box = (x0, y0, x1, y1). u: the output's width over 1280."""
    x0, y0, x1, y1 = box
    yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + 0.5
    star = (np.abs(xx - cx) / r) ** (2 / 3) + (np.abs(yy - cy) / r) ** (2 / 3) <= 1
    img = Image.fromarray((star * 255).astype(np.uint8))
    grow = lambda px: np.asarray(img.filter(ImageFilter.MaxFilter(2 * round(px * u) + 1))) > 0
    cover = Image.fromarray((grow(3.5) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2 * u))
    soft = np.asarray(cover, dtype=np.float32)[..., None] / 255
    ring = grow(20) & ~grow(7)
    return soft, ring


def ramp(n, lo, hi, margin, feather):
    """Along one side of the output: 1 where the clip has picture, falling to 0 over `feather` px at its edges (lo, hi),
    `margin` px inside them (a video's outermost pixels are often smudged)."""
    x = np.arange(n, dtype=np.float32) + 0.5
    return np.clip((x - lo - margin) / feather, 0, 1) * np.clip((hi - margin - x) / feather, 0, 1)


def cover_box(out, pic, box, weight, u):
    """Covers a box of the output (x0, y0, x1, y1) with the picture, its colours moved to the frame's round it, through
    a soft edge; `weight` (0-1) fades the cover in and out."""
    x0, y0, x1, y1 = box
    fe, pad = 4 * u, 18 * u
    X0, Y0, X1, Y1 = int(x0 - pad), int(y0 - pad), int(x1 + pad) + 1, int(y1 + pad) + 1
    yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32) + 0.5
    inside = np.minimum(np.minimum(xx - x0, x1 - xx), np.minimum(yy - y0, y1 - yy))   # < 0 outside the box
    m = (np.clip(inside / fe + 1, 0, 1) * weight)[..., None]
    ring = inside < -(fe + 2 * u)
    win, pw = out[Y0:Y1, X0:X1], pic[Y0:Y1, X0:X1]
    near = np.median(win[ring] - pw[ring], 0)
    out[Y0:Y1, X0:X1] = (pw + near) * m + win * (1 - m)


def clean(src, dest, picture, end_picture=None, trim=None, pingpong=False, covers=(), keep_camera=False, log=print,
          start=None, star_from=None):
    w, h, rate, fps, space = probe(src)
    u = w / 1280
    frames = read_frames(src, w, h, space)
    skip = int(round(trim[0] * fps)) if trim else 0
    if trim:
        frames = frames[skip: int(round(trim[1] * fps))]
    n = len(frames)
    pics = [Image.open(p).convert('RGB') for p in filter(None, (picture, end_picture))]
    big = [np.asarray(p.resize((w, h), Image.LANCZOS), dtype=np.float32) for p in pics]

    # The framing: measured on the first frame (from `start`, if given); through the clip as well if the last frame's
    # differs.
    framing = Framing(pics[0], w, h)
    first = framing.fit(framing.small(frames[0]), framing.whole, start or (ZOOM, 0.0, 0.0), wide=not start)
    last = framing.fit(framing.small(frames[-1]), framing.edge, first[1:]) if not end_picture else first
    moving = abs(last[1] - first[1]) > 0.004 or abs(last[2] - first[2]) > 2 * u or abs(last[3] - first[3]) > 2 * u
    camera = None
    if keep_camera:
        moving = False
        camera = follow_camera(framing, frames, first)
        log(f'  the camera, followed: zoom {camera[0, 0]:.3f} → {camera[-1, 0]:.3f}, '
            f'shift {camera[-1, 1]:+.0f},{camera[-1, 2]:+.0f} px at the end')
        at = list(range(0, n, 6)) + ([n - 1] if (n - 1) % 6 else [])
        found, guess = [], first[1:]
        for i in at:
            r = framing.fit(framing.small(frames[i]), framing.edge if i else framing.whole, guess)
            found.append(r[1:])
            guess = r[1:]
        found = np.array(found)
        smooth = found.copy()
        smooth[1:-1] = (found[:-2] + found[1:-1] + found[2:]) / 3
        geo = np.stack([np.interp(np.arange(n), at, smooth[:, k]) for k in range(3)], 1)
    else:
        geo = np.tile(np.array(first[1:]), (n, 1))
    log(f'  framing: zoom {first[1]:.4f}, shift {first[2]:+.1f},{first[3]:+.1f} px (fit {first[0]:.1f})'
        + (f'; the camera moves, to zoom {geo[-1, 0]:.4f}, shift {geo[-1, 1]:+.1f},{geo[-1, 2]:+.1f} px' if moving else '')
        + ('; kept as it is (--keep-camera)' if keep_camera else ''))

    # The colours: if the first frame's are off the picture's, by the same in every part of it, that is taken off.
    s, dx, dy = geo[0]
    f0 = np.asarray(Image.fromarray(frames[0]).transform((w, h), Image.AFFINE, frame_coeffs(w, h, s, dx, dy), Image.BICUBIC),
                    dtype=np.float32)
    inner = np.zeros((h, w), bool)
    inner[h // 10:h - h // 10:2, w // 10:w - w // 10:2] = True
    inner[int(h * 0.70):, int(w * 0.80):] = False
    offset = np.median(big[0][inner] - f0[inner], 0).astype(np.float32)
    if np.abs(offset).max() < 1.5:
        offset[:] = 0
    log(f'  colours: {"as the picture" if not offset.any() else "moved by " + str(np.round(offset, 1).tolist())}')

    order = list(range(n)) + (list(range(n - 2, 0, -1)) if pingpong else [])
    part = Path(dest).with_suffix('.part.mp4')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', rate,
                            '-i', '-', '-an', '-vf',
                            'scale=out_color_matrix=bt709:out_range=tv:flags=bicubic+accurate_rnd+full_chroma_int,format=yuv420p,'
                            'setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=iec61966-2-1',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-color_range', 'tv',
                            '-movflags', '+faststart', str(part)], stdin=subprocess.PIPE)
    sx, sy, sr = STAR[0] * w, STAR[1] * h, STAR[2] * w
    cache = {}
    for i in order:
        s, dx, dy = (1.0, 0.0, 0.0) if keep_camera else geo[i]
        if keep_camera:
            out = frames[i].astype(np.float32) + offset
        else:
            out = np.asarray(Image.fromarray(frames[i]).transform((w, h), Image.AFFINE, frame_coeffs(w, h, s, dx, dy),
                                                                  Image.BICUBIC), dtype=np.float32) + offset
        if camera is not None:  # the picture, where the moving camera has it in this frame
            pic = np.asarray(pics[0].transform((w, h), Image.AFFINE, picture_coeffs(w, w, h, *pics[0].size, *camera[i]),
                                               Image.BICUBIC), dtype=np.float32)
        elif end_picture:  # the border, from the first picture, then the last
            t = np.clip((i / max(1, n - 1) - 0.25) / 0.5, 0, 1)
            pic = big[0] + (big[1] - big[0]) * (t * t * (3 - 2 * t))
        else:
            pic = big[0]
        # The border the zoom leaves round the clip, filled from the picture (its colours moved to the frame's).
        lo_x, hi_x = w / 2 - (w / 2 + dx) / s, w / 2 + (w / 2 - dx) / s
        lo_y, hi_y = h / 2 - (h / 2 + dy) / s, h / 2 + (h / 2 - dy) / s
        m, fe = 2 * u, 11 * u
        wgt = np.outer(ramp(h, lo_y, hi_y, m, fe), ramp(w, lo_x, hi_x, m, fe))
        if wgt.min() < 1 and not keep_camera:
            band = (wgt == 1) & ~(np.outer(ramp(h, lo_y, hi_y, m + 32 * u, fe), ramp(w, lo_x, hi_x, m + 32 * u, fe)) == 1)
            band[1::2, :] = False
            near = np.median(out[band] - pic[band], 0)
            out = out * wgt[..., None] + (pic + near) * (1 - wgt[..., None])
        # The sparkle, covered with the picture (or with the clip's own pixels beside it: star_from).
        cx, cy, r = (sx - w / 2 - dx) / s + w / 2, (sy - h / 2 - dy) / s + h / 2, sr / s
        box = (int(cx - 2.6 * r), int(cy - 2.6 * r), int(cx + 2.6 * r), int(cy + 2.6 * r))
        key = (box, round(cx, 1), round(cy, 1), round(r, 1))
        if key not in cache:
            cache.clear()
            cache[key] = star_mask(cx, cy, r, box, u)
        soft, ring = cache[key]
        x0, y0, x1, y1 = box
        win = out[y0:y1, x0:x1]
        if star_from:
            fx, fy = round(star_from[0] * u), round(star_from[1] * u)
            out[y0:y1, x0:x1] = out[y0 + fy:y1 + fy, x0 + fx:x1 + fx] * soft + win * (1 - soft)
        else:
            pw = pic[y0:y1, x0:x1]
            g, o = fit_colour(pw[ring], win[ring])
            out[y0:y1, x0:x1] = (pw * np.clip(g, 0.7, 1.3) + o) * soft + win * (1 - soft)
        # Anything else to cover (in the clip's own pixels, at the clip's own times), fading in and out over 3 frames.
        for (bx0, by0, bx1, by1), t0, t1 in covers:
            f = skip + i
            weight = np.clip(1 - max(t0 * fps - f, f - t1 * fps, 0) / 3, 0, 1)
            if weight > 0:
                at = lambda x, y: ((x - w / 2 - dx) / s + w / 2, (y - h / 2 - dy) / s + h / 2)
                cover_box(out, pic, (*at(bx0, by0), *at(bx1, by1)), weight, u)
        enc.stdin.write(np.clip(out + 0.5, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close()
    if enc.wait():
        sys.exit(f'{src}: ffmpeg could not write the clip')
    part.replace(dest)
    return len(order) / fps


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('source')
    ap.add_argument('dest')
    ap.add_argument('--picture', required=True, help='the story picture the clip starts from')
    ap.add_argument('--end-picture', help="a movement clip's last picture")
    ap.add_argument('--trim', help='FROM-TO, in seconds: keep only that part')
    ap.add_argument('--pingpong', action='store_true', help='forwards, then backwards (for a quiet loop)')
    ap.add_argument('--cover', action='append', default=[], help='X0,Y0,X1,Y1@FROM-TO: a box to cover with the picture, then')
    ap.add_argument('--keep-camera', action='store_true', help="keep Gemini's framing and camera move")
    ap.add_argument('--framing', help='ZOOM,DX,DY: where to start looking for the picture in the clip')
    ap.add_argument('--star-from', help="DX,DY: cover the sparkle with the clip's own pixels from this far away")
    a = ap.parse_args()
    trim = tuple(map(float, a.trim.split('-'))) if a.trim else None
    start = tuple(map(float, a.framing.split(','))) if a.framing else None
    star_from = tuple(map(float, a.star_from.split(','))) if a.star_from else None
    covers = []
    for c in a.cover:
        box, _, when = c.partition('@')
        covers.append((tuple(map(float, box.split(','))), *map(float, when.split('-'))))
    print(f'{Path(a.source).name} → {Path(a.dest).name}')
    seconds = clean(a.source, a.dest, a.picture, a.end_picture, trim, a.pingpong, covers, a.keep_camera, start=start,
                    star_from=star_from)
    print(f'  {seconds:.1f} s, {Path(a.dest).stat().st_size / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
