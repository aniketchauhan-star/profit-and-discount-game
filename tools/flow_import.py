#!/usr/bin/env python3
"""Makes the story's films from the user's Google Flow takes (in "flow video new/", 2026-10-27).

Each story screen with a film gets its part of a take (two takes joined, for one), cut to the frame:
  * the Gemini sparkle taken off (tools/flow_sparkle.py);
  * where two parts join, the first fades into the second over JOIN seconds;
  * the whole film a little slower than the take, evenly (PACE: the user, 2026-10-28, of the 2-second breaks made after
    each line the day before by slowing the take's quiet moments: "it's lagging and awkward; if you make the video
    slow, this won't come"): its in-between frames made by motion interpolation, so the talk keeps the take's own
    rhythm, at a calmer pace, with no moment slower than the rest;
  * enhanced (ENHANCE: a non-local-means clean-up of the take's compression, then contrast-adaptive sharpening) and
    encoded well (H.264, CRF 20, tuned for animation), without sound (the game says the lines), 1920 x 1080, 24 fps,
    marked as the takes are (BT.601, sRGB), so the browser shows it in the same colours as its picture;
  * as assets/video/<screen>.mp4, with its first frame as assets/video/<screen>.webp (the screen's picture: the film
    starts on exactly what the screen shows) and, where the next screen goes on from it, its last frame as
    <screen>-end.webp.
Then js/video_clips.js: each film's length, and for each line said on it when its speaker's lips start to move in it
(from the take's own voices: the start of the speech nearest the time given in FILMS, at the film's pace).

  ~/.cache/bj-voices/venv/bin/python tools/flow_import.py              all the films
  ~/.cache/bj-voices/venv/bin/python tools/flow_import.py home ask     only these (js/video_clips.js lists them all)
  ... --index                                                          only js/video_clips.js
  ... --timing                                                         each line's lips (when they move, from its
      start, at its film's pace) into tools/voices/lengths.json, for the game's voices to be made to (voices.py)

Needs numpy and scipy, ffmpeg (with libx264) and cwebp.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from flow_sparkle import Sparkle  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
TAKES_DIR = ROOT / 'flow video new'
OUT = ROOT / 'assets' / 'video'
INDEX = ROOT / 'js' / 'video_clips.js'
FW, FH, FPS = 1920, 1080, 24
FRAME = FW * FH * 3 // 2
JOIN = 0.33        # seconds: one part fading into the next
CRF = 20
SOUND_LEVEL = 'loudnorm=I=-19:TP=-2:LRA=11'  # a film with its own sound: about as loud as the game's music
ENHANCE = 'nlmeans=s=3:p=7:r=9,cas=strength=0.5'
SLOW = 'minterpolate=fps={fps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'

# The user's takes (their file names, as they named them in Flow).
TAKES = {
    'home': 'start home..mp4',
    'walk-in': 'inter in showroom. .mp4',
    'book': 'hold the book .mp4',
    'counter-1': 'much is this bookHow?.mp4',
    'counter-2': 'Oh! The price printed on it is one thousand rupees." |.mp4',
    'counter-3': 'but I am selling it to you at eight hundred rupees." |.mp4',
    'counter-4': 'Thank you, uncle!.mp4',
    'walk-out': 'out of the bookstore.mp4',
    'shoes-1': 'Wow, nice sneakers! I love them..mp4',
    'shoes-2': 'What does thirty percent off mean here?.mp4',
    'shoes-3': 'So, after a thirty percent discount,.mp4',
    'back-home': 'How was your shopping?" .mp4',
    'party-message': "Wow! Rohan's birthday party is tonight!.mp4",
    'money-1': '"Here\'s five thousand rupees." | | 2.2 s | | Aniket takes the notes and holds them, .mp4',
    'money-2': 'Whatever is left after buying everything is yours." |.mp4',
    'fitcheck': 'fitcheck.mp4',
    'dancing': 'dancing.mp4',
}

# How much slower each film plays than its take (see the top). Each the median, over its lines, of how much longer a
# calm voice of the line (the boy about 3.8 syllables a second, his father 3.3, the shopkeeper 3.5) is than the take's
# lips, between 1 and 1.35; where a take goes on over screens (the sneakers, 16 → 17 → 18), one pace
# for them all, so nothing changes speed at the join. The others (the walks, the fit check with its music) as taken.
PACE = {'home': 1.25, 'browse': 1.35, 'ask': 1.35, 'reveal': 1.15, 'pay': 1.35, 'sneakers': 1.10,
        'shoe': 1.10, 'confused': 1.10, 'offmeans': 1.10, 'final': 1.20, 'return': 1.25, 'invite': 1.35, 'partymoney': 1.35,
        'partydeal': 1.25}
VOICES = ROOT / 'tools' / 'voices' / 'lengths.json'

# Each screen's film: its parts (take, from, to: seconds in the take; to None: its end); the lines said on it (the game's
# line ids): about when each starts, in seconds into the film as cut, and its recording (assets/vo/); `end`: its last
# frame is the next screen's picture too. Where a take goes on from one screen to the next, the second part starts where
# the first ends. Cut out: what the takes add that the game doesn't say (the shopkeeper's lips again after "It is too
# costly, uncle."; the extra words at the ends of the party message and of the ₹5,000), and Aniket's "Oh! The price
# printed on it is ₹1000." (the user, 2026-10-27: it is said on the close-up of the book, game screen 5).
FILMS = {
    'home': {'parts': [('home', 0, None)], 'lines': {'plan': (0.5, 'vo001'), 'advice': (5.0, 'vo002'), 'promise': (9.0, 'vo003')}},
    'outside': {'parts': [('walk-in', 0, None)], 'lines': {}},
    'browse': {'parts': [('book', 0, 5.0)], 'lines': {'browse': (1.0, 'vo004')}},
    'ask': {'parts': [('counter-1', 0, 5.3), ('counter-1', 7.0, None)],
            'lines': {'ask': (0.5, 'vo005'), 'price': (1.8, 'vo006'), 'costly': (3.6, 'vo139'), 'check-price': (5.75, 'vo140')}},
    'reveal': {'parts': [('counter-2', 4.45, None), ('counter-3', 0, 5.6)],
               'lines': {'reveal-1': (0.35, 'vo146'), 'reveal-2': (5.55, 'vo147'), 'reveal-3': (9.25, 'vo148')}},
    'pay': {'parts': [('counter-4', 0, 7.5)], 'lines': {'thanks': (4.07, 'vo154')}},
    'exit': {'parts': [('walk-out', 0, None)], 'lines': {}, 'end': True},
    'sneakers': {'parts': [('shoes-1', 0, 3.6)], 'lines': {'sneakers': (0.3, 'vo157')}},
    'shoe': {'parts': [('shoes-1', 3.6, 4.2)], 'lines': {}},
    'confused': {'parts': [('shoes-1', 4.2, None)], 'lines': {'shoe-price': (0.64, 'vo048')}, 'end': True},
    'offmeans': {'parts': [('shoes-2', 0, 8.6)], 'lines': {'off-what': (0.53, 'vo046'), 'shoe-ask': (3.2, 'vo049')}},
    'final': {'parts': [('shoes-3', 0, 8.6)], 'lines': {'final-1': (1.5, 'vo102'), 'final-2': (4.1, 'vo103')}},
    'return': {'parts': [('back-home', 0, None)], 'lines': {'home-ask': (0.8, 'vo127'), 'home-learnt': (2.4, 'vo128')}},
    'invite': {'parts': [('party-message', 0, 7.3)], 'lines': {'inv-1': (0.86, 'vo165'), 'inv-2': (4.4, 'vo166')}},
    'partymoney': {'parts': [('money-1', 0, 8.6)], 'lines': {'money': (0.43, 'vo132'), 'deal-use': (2.95, 'vo133')}},
    'partydeal': {'parts': [('money-2', 0, 8.6)],
                  'lines': {'deal-left': (0.35, 'vo134'), 'deal-really': (4.0, 'vo135'), 'deal-offers': (5.0, 'vo136')}},
    # His fit check in his new things, once all four are bought (the user, 2026-10-27), with its own music: `sound`, the
    # take's sound kept (brought to SOUND_LEVEL), the one film the game doesn't play muted.
    'fitcheck': {'parts': [('fitcheck', 0, None)], 'lines': {}, 'sound': True},
    # Then at Rohan's party, he dances (the user, 2026-10-28: "use this dancing video in the end, after the fit check"),
    # with its own music too; the summary comes in on its last frame.
    'dancing': {'parts': [('dancing', 0, None)], 'lines': {}, 'end': True, 'sound': True},
}


def take_path(take):
    return TAKES_DIR / TAKES[take]


def frames_of(take):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries',
                          'stream=nb_read_packets', '-of', 'csv=p=0', str(take_path(take))], capture_output=True, text=True, check=True)
    return int(out.stdout.strip())


def speech(path):
    """The stretches of speech in a file's sound (seconds): [(start, end), …]."""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'silencedetect=noise=-38dB:d=0.18',
                          '-f', 'null', '-'], capture_output=True, text=True).stderr
    length = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', out).group(3))
    marks = re.findall(r'silence_(start|end): ([0-9.]+)', out)
    spans, at = [], 0.0
    for kind, t in marks:
        t = float(t)
        if kind == 'start' and t > at + 0.02:
            spans.append((at, t))
        if kind == 'end':
            at = t
    if not marks or marks[-1][0] == 'end':
        spans.append((at, length))
    return [s for s in spans if s[1] - s[0] > 0.05]


def layout(name):
    """The film's parts as frame ranges in their takes, with where each starts in the cut film (frames)."""
    parts, at = [], 0
    for i, (take, a, b) in enumerate(FILMS[name]['parts']):
        f0 = round(a * FPS)
        f1 = frames_of(take) if b is None else round(b * FPS)
        start = at - (round(JOIN * FPS) if i else 0)
        parts.append({'take': take, 'f0': f0, 'f1': f1, 'at': start})
        at = start + (f1 - f0)
    return parts, at


def plan(name, log=print):
    """The film's lines, in order: where each one's lips start in the take as cut (cue), the stretches its lips move in
    there, from the cue (spans), and where it starts in the finished film (at: its cue at the film's pace). Then the
    number of frames as cut, and the pace."""
    parts, total = layout(name)
    spans = []  # the takes' speech, in the cut film's seconds
    for p in parts:
        for s, e in speech(take_path(p['take'])):
            lo, hi = max(s, p['f0'] / FPS), min(e, p['f1'] / FPS)
            if hi > lo:
                spans.append((p['at'] / FPS + lo - p['f0'] / FPS, p['at'] / FPS + hi - p['f0'] / FPS))
    spans.sort()
    pace = PACE.get(name, 1.0)
    lines = []
    for line, (t, vo) in FILMS[name]['lines'].items():
        cue = min((s for s, _ in spans), key=lambda s: abs(s - t), default=None)
        if cue is None or abs(cue - t) > 0.6:
            log(f'  {name}: no speech near {t:.2f} s for "{line}": kept {t:.2f} s')
            cue = t
        lines.append({'id': line, 'vo': vo, 'cue': cue, 'at': cue * pace})
    lines.sort(key=lambda l: l['cue'])
    for i, ln in enumerate(lines):
        nxt = lines[i + 1]['cue'] if i + 1 < len(lines) else total / FPS
        ln['spans'] = [(max(0.0, s - ln['cue']), e - ln['cue']) for s, e in spans if ln['cue'] - 0.05 <= s < nxt] or [(0.0, 0.5)]
    return lines, total, pace


def decode(take, f0, f1):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(take_path(take)), '-an', '-vf',
                          f'trim=start_frame={f0}:end_frame={f1},setpts=PTS-STARTPTS', '-f', 'rawvideo',
                          '-pix_fmt', 'yuv420p', '-'], stdout=subprocess.PIPE)
    while True:
        raw = p.stdout.read(FRAME)
        if len(raw) < FRAME:
            break
        yield raw
    p.wait()


def blend(a, b, k):
    x = np.frombuffer(a, np.uint8).astype(np.float32)
    y = np.frombuffer(b, np.uint8).astype(np.float32)
    return np.round(x * (1 - k) + y * k).astype(np.uint8).tobytes()


def cut_frames(name, sparkle):
    """The cut film's frames (yuv420p), the sparkle off and the parts joined."""
    parts, _ = layout(name)
    join = round(JOIN * FPS)
    held = []      # the last frames of a part, kept to fade into the next one
    for i, p in enumerate(parts):
        last = i == len(parts) - 1
        n = p['f1'] - p['f0']
        for k, raw in enumerate(decode(p['take'], p['f0'], p['f1'])):
            raw = sparkle.frame(raw)
            if i and k < join and held:  # fading in over the end of the part before
                raw = blend(held.pop(0), raw, (k + 1) / (join + 1))
            if not last and k >= n - join:
                held.append(raw)
                continue
            yield raw


def make(name, sparkle, log):
    lines, total, pace = plan(name, log)
    dest = OUT / f'{name}.mp4'
    tmp = dest.with_suffix('.part.mp4')
    sound = ['-an']
    if FILMS[name].get('sound'):  # (its take's own sound, as it is: so only for a film cut straight from one take)
        parts = FILMS[name]['parts']
        assert len(parts) == 1 and pace == 1 and not parts[0][1], f'{name}: its sound would not fit its film'
        sound = ['-map', '0:v', '-map', '1:a', '-af', SOUND_LEVEL, '-ar', '48000', '-c:a', 'aac', '-b:a', '128k', '-shortest']
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', f'{FW}x{FH}',
                            '-r', str(FPS), '-i', '-',
                            *(['-i', str(take_path(FILMS[name]['parts'][0][0]))] if FILMS[name].get('sound') else []),
                            '-vf', ENHANCE if pace == 1 else f'setpts={pace}*PTS,{SLOW.format(fps=FPS)},{ENHANCE}',
                            '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation',
                            '-crf', str(CRF), '-pix_fmt', 'yuv420p', '-g', str(2 * FPS), '-colorspace', 'smpte170m',
                            '-color_trc', 'iec61966-2-1', '-color_primaries', 'bt709', '-color_range', 'tv',
                            '-movflags', '+faststart', *sound, str(tmp)], stdin=subprocess.PIPE)
    raw = None
    for raw in cut_frames(name, sparkle):
        enc.stdin.write(raw)
    if pace != 1 and raw is not None:  # (the last frame once more: the slowed film reaches it, so the next goes on from it)
        enc.stdin.write(raw)
    enc.stdin.close()
    if enc.wait():
        raise SystemExit(f'{name}: encoding failed')
    tmp.replace(dest)
    poster(dest, OUT / f'{name}.webp', first=True)
    if FILMS[name].get('end'):
        poster(dest, OUT / f'{name}-end.webp', first=False)
    log(f'  {name}: {frames_in(dest) / FPS:.2f} s ({total / FPS:.2f} s as taken, at ×{pace:.2f}), {dest.stat().st_size / 1e6:.2f} MB')


def frames_in(film):
    return int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries',
                               'stream=nb_read_packets', '-of', 'csv=p=0', str(film)], capture_output=True, text=True).stdout.strip())


def poster(film, dest, first=True):
    """The finished film's first (or last) frame, as the browser shows it (BT.601, TV range), as a WebP."""
    with tempfile.TemporaryDirectory() as d:
        png = Path(d) / 'f.png'
        where = ['-frames:v', '1'] if first else ['-update', '1']  # (the last: every frame from 0.2 s before the end, each over the one before)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', *([] if first else ['-sseof', '-0.2']), '-i', str(film), '-vf',
                        'scale=in_color_matrix=bt601:in_range=tv:flags=bicubic+accurate_rnd+full_chroma_int',
                        '-pix_fmt', 'rgb24', *where, str(png)], check=True)
        subprocess.run(['cwebp', '-quiet', '-q', '90', '-m', '6', '-sharp_yuv', '-noalpha', str(png), '-o', str(dest)], check=True)


def index(log):
    films = {}
    for name in FILMS:
        film = OUT / f'{name}.mp4'
        if not film.exists():
            continue
        lines, total, pace = plan(name, lambda *_: None)
        frames = frames_in(film)
        if abs(frames - total * pace) > 3:
            log(f'  {name}: the film has {frames} frames, {total} at ×{pace:.2f} planned: make it again')
        films[name] = {'seconds': round(frames / FPS, 3), 'lines': {ln['id']: round(ln['at'], 2) for ln in lines}}
        if FILMS[name].get('sound'):
            films[name]['sound'] = True
    body = ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in films.items())
    INDEX.write_text(
        '// Made by tools/flow_import.py from the user\'s Google Flow takes: do not edit by hand.\n'
        '// Each story screen\'s film in "assets/video/" (its first frame, the screen\'s picture: "<screen>.webp"): its length\n'
        '// in seconds, and when each line said on it starts in it (seconds: its speaker\'s lips start to move); `sound`: it\n'
        '// plays with its own sound (the others are muted: the game says the lines). The game plays only the films listed here.\n'
        f'const VIDEO_CLIPS = {{\n{body},\n}};\n')
    log(f'wrote {INDEX.relative_to(ROOT)}: {len(films)} films')


def timing(log):
    """Each film line's lips, at its film's pace: when they move, from the line's start ([[from, to] …], seconds), into
    tools/voices/lengths.json (the lines said on no film keep their lengths there)."""
    want = json.loads(VOICES.read_text())
    for name in FILMS:
        lines, _, pace = plan(name, log)
        for ln in lines:
            want[ln['vo']] = [[round(a * pace, 2), round(b * pace, 2)] for a, b in ln['spans']]
    VOICES.write_text(json.dumps(want, indent=1) + '\n')
    log(f'wrote {VOICES.relative_to(ROOT)}')


def main(args):
    only = [a for a in args if not a.startswith('--')]
    unknown = [a for a in only if a not in FILMS]
    if unknown:
        raise SystemExit(f'no such film: {", ".join(unknown)} (films: {", ".join(FILMS)})')
    OUT.mkdir(parents=True, exist_ok=True)
    if '--timing' in args:
        return timing(print)
    if '--index' not in args:
        sparkle = Sparkle()
        for name in only or FILMS:
            make(name, sparkle, print)
    index(print)


if __name__ == '__main__':
    main(sys.argv[1:])
