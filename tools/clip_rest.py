#!/usr/bin/env python3
"""When each talking clip's speaker is done: the lips still for good (game.js CLIP_REST). For the clips that come back to
their picture (Higgsfield's), each speaker's face box (stage px = the clip's px), frame to frame at 12 a second: the last
moment it moves more than a third of its biggest change, plus a little. Needs numpy and ffmpeg. Run it after new takes:
  python3 tools/clip_rest.py      (add a new clip's face box to FACES first: KEEP_CLEAR in js/game.js has them)
"""
import subprocess, numpy as np, json
D = str(__import__("pathlib").Path(__file__).resolve().parent.parent / "assets" / "video") + "/"
FACES = {
    's01-aniket-1': (500, 48, 758, 276), 's01-aniket-2': (500, 48, 758, 276), 's01-father': (1273, 185, 1500, 412),
    's05-aniket': (630, 79, 903, 352), 's06-aniket': (530, 164, 773, 406), 's06-shopkeeper': (1288, 164, 1515, 406),
    's22-aniket-3': (436, 73, 664, 345),
}
out = {}
for c, (x0, y0, x1, y1) in FACES.items():
    w, h = (x1 - x0) // 2 * 2, (y1 - y0) // 2 * 2; x0, y0 = x0 // 2 * 2, y0 // 2 * 2
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', D + c + '.mp4', '-vf', f'crop={w}:{h}:{x0}:{y0},fps=12', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
                         capture_output=True).stdout
    f = np.frombuffer(raw, dtype=np.uint8).astype(np.float32).reshape(-1, h, w)
    d = np.abs(f - f[0]).mean(axis=(1, 2))
    # a moving average of the frame-to-frame change: the lips moving
    m = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
    k = np.convolve(m, np.ones(3) / 3, mode='same')
    thr = max(0.6, k.max() / 3)
    moving = np.where(k > thr)[0]
    last = (moving[-1] + 2) / 12 + 0.25 if len(moving) else 0.5
    out[c] = round(min(last, len(f) / 12), 2)
    print(f"{c:15} {len(f) / 12:4.1f}s  lips still from {out[c]:4.2f}s  " + ''.join('#' if x > thr else '.' for x in k))
print("CLIP_REST for js/game.js:", json.dumps(out))
