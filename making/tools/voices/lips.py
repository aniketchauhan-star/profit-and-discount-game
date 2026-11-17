# A voice laid on its character's lips in a film: making/tools/flow_import.py --timing writes each film line's lips into
# lengths.json ({id: [[from, to] …]}: when they move, seconds from the line's first word, at the film's pace; or {id:
# seconds} for a line said off the lips). Used by voices.py (Chatterbox's voices) and recording_cut.py (the user's
# recordings). Files only (ffmpeg's silencedetect and atempo): nothing is played.
import re, subprocess, tempfile
import numpy as np, soundfile as sf

TMP = tempfile.mkdtemp(prefix='bj-lips-')  # (the sound measured and stretched, as files for ffmpeg)
STRETCH = 0.85  # a take is slowed (or sped up) by no more than this, to the length wanted
# …and a phrase laid on its lips (see align): a word or two (up to a second long, as the lips have it: "Great!",
# "Discount?") drawn out by up to ×1.5, as a voice does; a longer phrase by up to ×1.3
reach = lambda seconds: (1 / 1.5, 1.5) if seconds <= 1.0 else (1 / 1.3, 1.3)


def spans_of(y, sr, d=0.12):
    """Where a voice talks: its stretches between pauses (quiet at least `d` s), in seconds from its start."""
    path = f'{TMP}/measure.wav'
    sf.write(path, np.concatenate([np.zeros(int(0.30 * sr)), y, np.zeros(int(0.40 * sr))]).astype(np.float32), sr)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', f'silencedetect=noise=-38dB:d={d}', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    length = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', out).group(3))
    marks = [(k, float(t)) for k, t in re.findall(r'silence_(start|end): ([0-9.]+)', out)]
    spans, at = [], 0.0
    for kind, t in marks:
        if kind == 'start' and t > at + 0.02:
            spans.append([at - 0.30, t - 0.30])
        if kind == 'end':
            at = t
    if not marks or marks[-1][0] == 'end':
        spans.append([at - 0.30, length - 0.30])
    return [x for x in spans if x[1] - x[0] > 0.05]


def paired(ours, target):
    """A voice's stretches and the lips' paired up, as many of each: the voice's joined at its shortest pauses where it
    has more, the lips' where they have more."""
    ours, target = [list(x) for x in ours], [list(x) for x in target]
    for many in (ours, target):
        while len(many) > min(len(ours), len(target)):
            k = min(range(len(many) - 1), key=lambda i: many[i + 1][0] - many[i][1])
            many[k][1] = many.pop(k + 1)[1]
    return list(zip(ours, target))


def stretches(ours, target):
    """How much longer each of the voice's stretches must last to fill its stretch of the lips."""
    return [(e - s) / max(0.05, b - a) for (a, b), (s, e) in paired(ours, target)]


def align(y, sr, target):
    """The voice laid on its character's lips (target: [[from, to] …], seconds from the first word, at the film's pace):
    cut in its pauses into as many pieces as the lips have stretches (see paired), each piece fitted to its stretch by no
    more than STRETCH and started with it (a piece longer than its stretch still ends before the next one starts)."""
    pairs = paired(spans_of(y, sr), target)
    pieces, cursor = [], 0
    for n, ((a, b), (s, e)) in enumerate(pairs):
        lo = a - 0.04 if n == 0 else (pairs[n - 1][0][1] + a) / 2  # (cut in the middle of the pause before it…)
        hi = b + 0.08 if n == len(pairs) - 1 else (b + pairs[n + 1][0][0]) / 2  # (…and after it)
        piece = y[max(0, int(lo * sr)):min(len(y), int(hi * sr))].copy()
        lo_k, hi_k = reach(e - s)
        k = min(hi_k, max(lo_k, (e - s) / max(0.05, b - a)))  # (how much longer it is made)
        if abs(k - 1) > 0.01:
            piece = fit(piece, sr, 1 / k)
        fade = int(0.006 * sr)
        piece[:fade] *= np.linspace(0, 1, fade)
        piece[-fade:] *= np.linspace(1, 0, fade)
        lead = (a - max(0.0, lo)) * k  # (the quiet it starts with, as made)
        at = max(0, cursor - int(lead * sr), int((s - lead + 0.04) * sr))  # (its first word on its lips; never on the words before)
        pieces.append((at, piece))
        cursor = at + int(((b - max(0.0, lo)) * k + 0.03) * sr)  # (where its words end: its quiet end may go under the next)
    out = np.zeros(max(at + len(piece) for at, piece in pieces) + int(0.1 * sr))
    for at, piece in pieces:
        out[at:at + len(piece)] += piece
    return out


def speech_seconds(y, sr):
    """How long a voice talks, measured as making/tools/flow_import.py measures the game's clips: with the quiet the finished
    clip has before and after it (making/tools/voices/finish.py: 0.30 s and 0.40 s), its quiet start and end left out."""
    path = f'{TMP}/measure.wav'
    sf.write(path, np.concatenate([np.zeros(int(0.30 * sr)), y, np.zeros(int(0.40 * sr))]).astype(np.float32), sr)
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'silencedetect=noise=-38dB:d=0.18', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    length = float(re.search(r'Duration: (\d+):(\d+):([\d.]+)', out).group(3))
    marks = [(k, float(t)) for k, t in re.findall(r'silence_(start|end): ([0-9.]+)', out)]
    spans, at = [], 0.0
    for kind, t in marks:
        if kind == 'start' and t > at + 0.02:
            spans.append((at, t))
        if kind == 'end':
            at = t
    if not marks or marks[-1][0] == 'end':
        spans.append((at, length))
    spans = [x for x in spans if x[1] - x[0] > 0.05]
    return spans[-1][1] - spans[0][0] if spans else length


def fit(y, sr, tempo):
    """The voice faster (tempo > 1) or slower, its pitch kept (ffmpeg's atempo)."""
    a, b = f'{TMP}/fit-in.wav', f'{TMP}/fit-out.wav'
    sf.write(a, y.astype(np.float32), sr)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a, '-af', f'atempo={tempo:.5f}', b], check=True)
    return sf.read(b)[0]
