# The user's Swifty recording (source/swifty.mp3, in the project's folder: her 82 lines, swifty_lines.txt, read in that order)
# cut into the game's clips: each line split into the pieces the game says one at a time (pieces.json: their ids and
# their keys in js/vo_lines.js), each piece trimmed of silence, with short fades. Where a piece is said twice in the
# recording, the take in a clause of its own is used (PREFER). See docs/VOICEOVER.md, "The voices now".
#
# Word times: swifty_words.json, made by whisper.cpp (large-v3-turbo) on the recording cut at its pauses of 0.3 s or more
# (ffmpeg's silencedetect, −40 dB), each piece transcribed with -ml 1 -sow. Where whisper's times put a cut inside a word,
# the cut is placed by hand in swifty_cuts.json ({"<slot index>": seconds}: the cut after that slot), each checked by
# transcribing the sound either side of it (whisper's words on a whole clip can't be trusted at a cut).
# Out: OUT/<id>.wav (44.1 kHz), cuts.json, slots.json.
#   ~/.cache/bj-voices/venv/bin/python tools/voices/swifty_cut.py OUT
import json, os, re, sys, difflib, subprocess
from pathlib import Path
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
MP3 = str(Path(__file__).resolve().parents[2] / 'source/swifty.mp3')
SR = 44100
PREFER = {'Not quite!': 32, 'Correct!': 36, '250 ÷ 1000 × 100 = 25%.': 32}  # (line index of the take to use)

# ---------- text → spoken tokens ----------
ONES = {w: i for i, w in enumerate('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split())}
TENS = {w: 10 * i for i, w in enumerate('_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()) if w != '_'}


def words_to_digits(tokens):
    out, i = [], 0
    while i < len(tokens):
        if tokens[i] in ONES or tokens[i] in TENS:
            total, cur, j = 0, 0, i
            while j < len(tokens) and (tokens[j] in ONES or tokens[j] in TENS or tokens[j] in ('hundred', 'thousand')):
                t = tokens[j]
                if t in ONES: cur += ONES[t]
                elif t in TENS: cur += TENS[t]
                elif t == 'hundred': cur *= 100
                elif t == 'thousand': total += cur * 1000; cur = 0
                j += 1
            out.append(str(total + cur))
            i = j
        else:
            out.append(tokens[i])
            i += 1
    return out


def tokens(text):
    t = text.lower()
    t = re.sub(r'₹\s?([\d,]+)', lambda m: m[1].replace(',', '') + ' rupees', t)
    t = re.sub(r'(\d),(\d)', r'\1\2', t)
    t = re.sub(r'(\d+)\s*/\s*(\d+)', r'\1 over \2', t)
    t = t.replace('÷', ' divided by ').replace('×', ' times ').replace('=', ' equals ').replace('−', ' minus ').replace('%', ' percent ')
    t = re.sub(r'\bmp\b', 'm p', t)
    t = re.sub(r'\bsp\b', 's p', t)
    t = t.replace('-', ' ')
    t = re.sub(r"[’'`]", '', t)
    t = re.sub(r'[^a-z0-9 ]', ' ', t)
    t = re.sub(r'\banna kate\b|\banakate\b|\banikate\b|\bani kate\b', 'aniket', t)
    t = re.sub(r'\bbottom wear\b|\bbottomware\b', 'bottomwear', t)
    t = re.sub(r'\bhole\b', 'whole', t)
    return words_to_digits(t.split())


def main(OUT):
    # ---------- the lines, as the game's pieces ----------
    lines = [l.rstrip('\n') for l in open(HERE + 'swifty_lines.txt', encoding='utf-8') if l.strip()]
    ids = {r['line']: r['id'] for r in json.load(open(HERE + 'pieces.json')) if r['speaker'] == 'Swifty'}
    keys = sorted(ids, key=len, reverse=True)
    slots = []  # (line index, key)
    for li, line in enumerate(lines):
        p = 0
        while p < len(line):
            k = next((k for k in keys if line.startswith(k, p) and (p + len(k) == len(line) or line[p + len(k)] == ' ')), None)
            if not k:
                sys.exit(f'no piece fits line {li + 1} at: {line[p:]}')
            slots.append((li, k))
            p += len(k) + 1
    missing = set(ids) - {k for _, k in slots}
    if missing:
        sys.exit(f'pieces not in the recording: {missing}')

    exp, exp_slot = [], []
    for si, (li, k) in enumerate(slots):
        for tok in tokens(k):
            exp.append(tok)
            exp_slot.append(si)
    rec, rec_t = [], []
    for chunk, a, b, w in json.load(open(HERE + 'swifty_words.json')):
        for tok in tokens(w):
            rec.append(tok)
            rec_t.append((a, b))

    # ---------- align the words heard with the words expected ----------
    match = {}
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, exp, rec, autojunk=False).get_opcodes():
        if op == 'equal' or (op == 'replace' and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                match[i1 + k] = j1 + k
        elif op == 'replace':
            for k in range(i2 - i1):
                match[i1 + k] = j1 + round(k * (j2 - j1 - 1) / max(1, i2 - i1 - 1))
    unmatched = [exp[i] for i in range(len(exp)) if i not in match]
    print(f'{len(exp)} words expected, {len(rec)} heard, {len(unmatched)} not found: {" ".join(unmatched[:40])}')
    span = []
    for si in range(len(slots)):
        ts = [rec_t[match[i]] for i in range(len(exp)) if exp_slot[i] == si and i in match]
        if not ts:
            sys.exit(f'nothing heard for {slots[si]}')
        span.append([min(t[0] for t in ts), max(t[1] for t in ts)])

    # ---------- the audio, and where to cut ----------
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', MP3, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).copy()
    HOP, WIN = int(0.005 * SR), int(0.020 * SR)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (WIN // 2, WIN // 2)), WIN)[::HOP]
    db = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    QUIET = np.percentile(db, 99) - 38  # (below this: a pause)
    f = lambda t: int(round(t * SR / HOP))

    def cut_between(e_a, s_b):
        """The quietest place between two pieces: the middle of the longest quiet run in the search window, or its
        quietest frame."""
        lo, hi = min(e_a, s_b) - 0.12, max(e_a, s_b) + 0.12
        a, b = max(0, f(lo)), min(len(db), f(hi))
        seg = db[a:b]
        best, run_start, best_len = None, None, 0
        for i, q in enumerate(np.append(seg < QUIET, False)):
            if q and run_start is None:
                run_start = i
            if not q and run_start is not None:
                if i - run_start > best_len:
                    best_len, best = i - run_start, (run_start + i) // 2
                run_start = None
        if best is None:
            best = int(np.argmin(np.convolve(seg, np.ones(5) / 5, mode='same')))
        return (a + best) * HOP / SR

    cuts = [max(0.0, span[0][0] - 0.3)] + [cut_between(span[si][1], span[si + 1][0]) for si in range(len(slots) - 1)]
    cuts.append(min(len(x) / SR, span[-1][1] + 0.5))
    try:
        for si, t in json.load(open(HERE + 'swifty_cuts.json')).items():  # (a cut placed by hand: after slot si)
            cuts[int(si) + 1] = t
    except FileNotFoundError:
        pass
    json.dump({'slots': slots, 'cuts': cuts}, open(f'{OUT}/slots.json', 'w'), ensure_ascii=False)

    out, used = [], set()
    for si, (li, k) in enumerate(slots):
        if (k in PREFER and PREFER[k] != li) or k in used:
            continue
        used.add(k)
        a, b = cuts[si], cuts[si + 1]
        fa, fb = f(a), f(b)
        loud = np.where(db[fa:fb] > QUIET + 6)[0]
        on = (fa + loud[0]) * HOP / SR if len(loud) else a
        off = (fa + loud[-1]) * HOP / SR + WIN / SR if len(loud) else b
        s0, s1 = max(a, on - 0.05), min(b, off + 0.12)
        y = x[int(s0 * SR):int(s1 * SR)].copy()
        n = int(0.008 * SR)
        y[:n] *= np.linspace(0, 1, n)
        y[-n:] *= np.linspace(1, 0, n)
        sf.write(f'{OUT}/{ids[k]}.wav', y, SR)
        out.append({'id': ids[k], 'line': k, 'from': round(s0, 3), 'to': round(s1, 3), 'seconds': round(s1 - s0, 2)})
    json.dump(out, open(f'{OUT}/cuts.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{len(out)} clips written to {OUT}')
    for k in range(1, len(slots)):  # every cut between two pieces: in a quiet gap, not inside a word?
        if db[max(0, f(cuts[k]) - 2):f(cuts[k]) + 3].max() > QUIET + 6:
            print(f"  cut {k} at {cuts[k]:.3f} is inside a sound: between '{slots[k - 1][1]}' and '{slots[k][1]}'")


if __name__ == '__main__':
    main(sys.argv[1])
