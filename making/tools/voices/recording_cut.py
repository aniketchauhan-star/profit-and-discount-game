# The user's recordings of the game's voices, cut into its clips (RECORDINGS):
#   Swifty  making/source/FINAL.mp3 (2026-11-03): her 110 lines, swifty_lines.txt
#   Amit    making/source/boy.mp3 (2026-11-03): his 19 lines, amit_lines.txt
#   Father  making/source/father.mp3 (2026-11-03, uploaded as "father .mp3"): his 5 lines, father_lines.txt
#   Shopkeeper  making/source/shop.mp3 (2026-11-03): his 4 lines, shopkeeper_lines.txt
# Each file holds its lines as read: each once, in the order the game first says it. Each line is split into the
# pieces the game says one at a time (the speaker's lines in making/tools/vo_script.json, matched by their spoken words),
# each piece trimmed of silence, with short fades, and brought to the loudness of the game's other lines (LOUDNESS), the
# peaks that would pass −1 dBFS held under it by a limiter. A piece said on a film is then laid on its lips (lips.py,
# lengths.json: each phrase starting as they start to move, drawn out or hurried by no more than lips.reach); one with a
# length to fill (said off the lips) fitted to it, by no more than lips.STRETCH. (A piece said twice: the first take.)
#
# Word times: <who>_words.json, from `align` below: torchaudio's MMS forced aligner (MMS_FA, its model cached in
# ~/.cache/torch) on the recording, given the words read. Between two pieces the cut is at the quietest place between
# the one's last word and the other's first; where they were run together, a cut can be placed by hand in
# <who>_cuts.json ({"<slot index>": seconds}: the cut after that slot). check.py then has whisper hear every clip.
# Out: OUT/<id>.wav (44.1 kHz), cuts.json, slots.json. Then check.py OUT, finish.py ZIP OUT, vo_build.py ZIP.
#   ~/.cache/bj-voices/venv/bin/python making/tools/voices/recording_cut.py WHO align   (the word times, once)
#   ~/.cache/bj-voices/venv/bin/python making/tools/voices/recording_cut.py WHO OUT
import json, os, re, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf

HERE = Path(__file__).resolve().parent  # (making/tools/voices/)
ROOT = HERE.parents[2]
SCRIPT = ROOT / 'making' / 'tools' / 'vo_script.json'
LIPS = HERE / 'lengths.json'
WHISPER = Path('~/.cache/whisper-models/ggml-large-v3-turbo.bin').expanduser()
RECORDINGS = {'Swifty': ('FINAL.mp3', 'swifty'), 'Amit': ('boy.mp3', 'amit'), 'Father': ('father.mp3', 'father'),
              'Shopkeeper': ('shop.mp3', 'shopkeeper')}  # who: (making/source/…, the stem of its files)
SR = 44100
LOUDNESS = -16.8  # LUFS, each clip (−17.0 to −17.2 once in the game: its MP3 and Opus take a little off). Before: Swifty's
                  # clips (the studio's, 2026-10-30) −16.7, Amit's −17.1, Dad's −17.9, the shopkeeper's −17.4 (medians)
LIMIT = 0.89      # −1 dBFS

# ---------- text → spoken tokens (to compare what is heard with what is meant) ----------
ONES = {w: i for i, w in enumerate('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split())}
TENS = {w: 10 * i for i, w in enumerate('_ _ twenty thirty forty fifty sixty seventy eighty ninety'.split()) if w != '_'}


def words_to_digits(tokens):
    """Numbers in words as digits: "one thousand eight hundred" → 1800, "five hundred and forty" → 540."""
    out, i = [], 0
    while i < len(tokens):
        if tokens[i] in ONES or tokens[i] in TENS:
            total, cur, j = 0, 0, i
            while j < len(tokens):
                t = tokens[j]
                if t in ONES: cur += ONES[t]
                elif t in TENS: cur += TENS[t]
                elif t == 'hundred': cur *= 100
                elif t == 'thousand': total += cur * 1000; cur = 0
                elif not (t == 'and' and tokens[j - 1] in ('hundred', 'thousand') and j + 1 < len(tokens)
                          and (tokens[j + 1] in ONES or tokens[j + 1] in TENS)):
                    break
                j += 1
            out.append(str(total + cur))
            i = j
        else:
            out.append(tokens[i])
            i += 1
    return out


def tokens(text):
    t = text.lower()
    t = re.sub(r'(₹|\brs\.?)\s?([\d,]+)', lambda m: m[2].replace(',', '') + ' rupees', t)
    t = re.sub(r'(\d),(\d)', r'\1\2', t)
    t = re.sub(r'(\d+)\s*/\s*(\d+)', r'\1 over \2', t)
    t = t.replace('÷', ' divided by ').replace('×', ' times ').replace('=', ' equals ').replace('−', ' minus ').replace('%', ' percent ')
    t = re.sub(r'\bmp\b', 'm p', t)
    t = re.sub(r'\bsp\b', 's p', t)
    t = t.replace('-', ' ')
    t = re.sub(r"\bi[’']m\b", 'i am', t)  # (Amit says "Then I am definitely …" for "I’m", the shopkeeper "I’m" for "I am")
    t = re.sub(r"[’'`]", '', t)
    t = re.sub(r'[^a-z0-9 ]', ' ', t)
    t = re.sub(r'\bamid\b|\bameet\b|\bamith\b', 'amit', t)  # (whisper's spellings of his name)
    t = re.sub(r'\blearned\b', 'learnt', t)  # (said alike: whisper spells it either way)
    t = re.sub(r'\bbottom wear\b|\bbottomware\b', 'bottomwear', t)
    t = re.sub(r'\bhole\b', 'whole', t)
    return words_to_digits(t.split())


def said(text):
    """The words of a line as said, letters only (as the aligner takes them): "twenty-five" → twenty five."""
    t = re.sub(r"\bi[’']m\b", 'i am', text.lower())
    return re.sub(r'[^a-z ]', ' ', t.replace('’', '').replace("'", '').replace('-', ' ')).split()


def files(who):
    mp3, stem = RECORDINGS[who]
    return ROOT / 'making' / 'source' / mp3, HERE / f'{stem}_lines.txt', HERE / f'{stem}_words.json', HERE / f'{stem}_cuts.json'


def read_lines(who):
    return [l.rstrip('\n') for l in open(files(who)[1], encoding='utf-8') if l.strip()]


def decode(mp3, rate):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(mp3), '-ac', '1', '-ar', str(rate), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


# ---------- the word times ----------

def align_words(who):
    import torch
    from torchaudio.pipelines import MMS_FA as bundle
    mp3, _, words_file, _ = files(who)
    words = [w for line in read_lines(who) for w in said(line)]
    x = decode(mp3, 16000)
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(mp3), '-af', 'silencedetect=noise=-40dB:d=0.3', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    quiet = zip(map(float, re.findall(r'silence_start: ([\d.]+)', log)), map(float, re.findall(r'silence_end: ([\d.]+)', log)))
    bounds = [0.0] + [(a + b) / 2 for a, b in quiet] + [len(x) / 16000]
    model = bundle.get_model()
    ems, times = [], []
    with torch.inference_mode():  # (the stretches between the pauses one at a time, each frame at its own time)
        for a, b in zip(bounds, bounds[1:]):
            seg = torch.from_numpy(x[int(a * 16000):int(b * 16000)])[None]
            em, _ = model(seg)
            ratio = seg.shape[1] / 16000 / em.shape[1]
            ems.append(em[0])
            times.append(a + np.arange(em.shape[1] + 1) * ratio)
    frame_t = np.concatenate([t[:-1] for t in times] + [times[-1][-1:]])
    spans = bundle.get_aligner()(torch.cat(ems), bundle.get_tokenizer()(words))
    out = [[w, round(float(frame_t[s[0].start]), 3), round(float(frame_t[s[-1].end]), 3),
            round(float(np.mean([t.score for t in s])), 2)] for w, s in zip(words, spans)]
    json.dump(out, open(words_file, 'w'))
    print(f'{len(out)} words placed: {words_file}')


# ---------- the clips ----------

def split(line, pieces, texts):
    """The pieces a line is said in: the fewest whose words, one after another, are its words; of two with the same
    words ("minus Selling Price," and "minus Selling Price."), the one whose text, stops and commas too, is in the line."""
    plain = lambda s: s.replace('’', "'")
    want = tokens(line)
    best = [None] * (len(want) + 1)
    best[0] = (0, 0, [])
    for i in range(len(want)):
        if best[i] is None:
            continue
        for pid, toks in pieces.items():
            j = i + len(toks)
            if toks and want[i:j] == toks:
                n, misses, got = best[i]
                cand = (n + 1, misses + (plain(texts[pid]) not in plain(line)), got + [pid])
                if best[j] is None or cand[:2] < best[j][:2]:
                    best[j] = cand
    return best[-1] and best[-1][2]


def limit(y, ceiling=LIMIT, win=int(0.025 * SR)):
    """A look-ahead limiter: the gain each peak needs, eased in and out over 25 ms round it (slow enough not to
    roughen the voice)."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    need = np.minimum(1.0, ceiling / np.maximum(np.abs(y), 1e-9))
    if need.min() >= 1.0:
        return y
    g = uniform_filter1d(minimum_filter1d(need, win), win)
    return y * np.minimum(g, need)


def main(who, OUT):
    import pyloudnorm as pyln
    from lips import STRETCH, reach, spans_of, paired, stretches, align, speech_seconds, fit
    mp3, _, words_file, cuts_file = files(who)
    script = json.load(open(SCRIPT, encoding='utf-8'))
    texts = {e['id']: e['spoken'] for e in script if e['speaker'] == who}
    pieces = {pid: tokens(t) for pid, t in texts.items()}
    lines = read_lines(who)
    slots = []  # (line index, piece id)
    for li, line in enumerate(lines):
        got = split(line, pieces, texts)
        if got is None:
            sys.exit(f'no pieces make up line {li + 1}: {line}')
        slots += [(li, pid) for pid in got]
    missing = set(pieces) - {pid for _, pid in slots}
    if missing:
        sys.exit(f'pieces not in the recording: {sorted(missing)}')
    print(f'{who}: {len(lines)} lines, {len(slots)} pieces said, {len(pieces)} clips')

    # ---------- each piece's words, and when they are said ----------
    words = json.load(open(words_file))
    span, k = [], 0
    for li, pid in slots:
        want = said(texts[pid])
        n = len(want)
        got = [w for w, *_ in words[k:k + n]]
        if got != want:
            sys.exit(f'the words placed are not the words of {pid}: {got} | {want}')
        span.append([words[k][1], words[k + n - 1][2]])
        k += n
    if k != len(words):
        sys.exit(f'{len(words) - k} words placed that no piece has')

    # ---------- the audio, and where to cut ----------
    x = decode(mp3, SR).astype(np.float64)
    HOP, WIN = int(0.005 * SR), int(0.020 * SR)
    frames = np.lib.stride_tricks.sliding_window_view(np.pad(x, (WIN // 2, WIN // 2)), WIN)[::HOP]
    db = 20 * np.log10(np.sqrt((frames ** 2).mean(axis=1)) + 1e-9)
    QUIET = np.percentile(db, 99) - 38  # (below this: a pause)
    f = lambda t: int(round(t * SR / HOP))

    def cut_between(e_a, s_b):
        """The quietest place between two pieces: the middle of the longest quiet run from where the one's last word
        ends to where the other's first begins, or else its quietest frame."""
        lo, hi = min(e_a, s_b) - 0.03, max(e_a, s_b) + 0.03
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
    by_hand = json.load(open(cuts_file)) if cuts_file.exists() else {}
    for si, t in by_hand.items():  # (a cut placed by hand: after slot si)
        cuts[int(si) + 1] = t
    os.makedirs(OUT, exist_ok=True)
    json.dump({'slots': slots, 'cuts': cuts}, open(f'{OUT}/slots.json', 'w'), ensure_ascii=False)

    clips, used = [], set()
    for si, (li, pid) in enumerate(slots):
        if pid in used:
            continue
        used.add(pid)
        a, b = cuts[si], cuts[si + 1]
        fa, fb = f(a), f(b)
        loud = np.where(db[fa:fb] > QUIET + 6)[0]
        on = (fa + loud[0]) * HOP / SR if len(loud) else a
        off = (fa + loud[-1]) * HOP / SR + WIN / SR if len(loud) else b
        s0, s1 = max(a, on - 0.05), min(b, off + 0.12)
        y = x[int(s0 * SR):int(s1 * SR)].copy()
        # fades: 8 ms; 25 ms where the cut is in the voice (words run together), so the sound eases in or out
        edge = lambda t: 0.025 if db[max(0, f(t) - 1):f(t) + 2].max() > QUIET + 6 else 0.008
        n0, n1 = int(edge(s0) * SR), int(edge(s1) * SR)
        y[:n0] *= np.linspace(0, 1, n0)
        y[-n1:] *= np.linspace(1, 0, n1)
        clips.append((pid, li, s0, s1, y))

    # ---------- each clip as loud as the next (LOUDNESS): a line is heard on its own ----------
    meter = pyln.Meter(SR)
    pad = lambda y: np.concatenate([np.zeros(int(0.3 * SR)), y, np.zeros(int(0.4 * SR))])  # (as finish.py will)
    level = lambda y: meter.integrated_loudness(pad(y))
    lips = json.load(open(LIPS))
    out = []
    for pid, li, s0, s1, y in clips:
        g = 10 ** ((LOUDNESS - level(y)) / 20)
        g *= 10 ** ((LOUDNESS - level(limit(y * g))) / 20)  # (what the limiter takes off, given back)
        held = round(20 * np.log10(max(1.0, np.abs(y * g).max() / LIMIT)), 1)
        z = limit(y * g)
        row = {'id': pid, 'line': li + 1, 'from': round(s0, 3), 'to': round(s1, 3), 'seconds': round(s1 - s0, 2),
               'gain_dB': round(20 * np.log10(g), 1), 'peak_held_dB': held}
        want = lips.get(pid)
        if isinstance(want, list):  # said on a film: on its lips, phrase by phrase
            ours = spans_of(z, SR)
            ks = stretches(ours, want)
            caps = [reach(e - s) for _, (s, e) in paired(ours, want)]
            z = limit(align(z, SR, want))
            row['lips'] = {'phrases': len(ks), 'wanted': [round(k, 2) for k in ks],
                           'made': [round(min(hi, max(lo, k)), 2) for k, (lo, hi) in zip(ks, caps)],
                           'voice_s': round(speech_seconds(z, SR), 2), 'lips_s': want[-1][1]}
        elif want:  # a length to fill, off the lips
            have = speech_seconds(z, SR)
            tempo = min(1 / STRETCH, max(STRETCH, have / want))
            if abs(tempo - 1) > 0.01:
                z = limit(fit(z, SR, tempo))
            row['length'] = {'had_s': round(have, 2), 'made_s': round(speech_seconds(z, SR), 2), 'wanted_s': want}
        sf.write(f'{OUT}/{pid}.wav', z.astype(np.float32), SR)
        out.append(row)
    json.dump(out, open(f'{OUT}/cuts.json', 'w'), ensure_ascii=False, indent=1)
    gains = [o['gain_dB'] for o in out]
    print(f'{len(out)} clips written to {OUT}, each at {LOUDNESS} LUFS: gains {min(gains):+.1f} to {max(gains):+.1f} dB, peaks held'
          f' in {sum(o["peak_held_dB"] > 0 for o in out)} of them (at most {max(o["peak_held_dB"] for o in out)} dB)')
    for o in out:
        if 'lips' in o:
            L = o['lips']
            print(f"  {o['id']} on its lips: {L['phrases']} phrase(s), ×{', ×'.join(map(str, L['wanted']))} wanted, "
                  f"×{', ×'.join(map(str, L['made']))} made: the voice {L['voice_s']} s, its lips {L['lips_s']} s")
        elif 'length' in o:
            L = o['length']
            print(f"  {o['id']} to its length: {L['had_s']} s made {L['made_s']} s, {L['wanted_s']} s wanted")
    for k in range(1, len(slots)):  # every cut between two pieces: in a quiet gap, not inside a word? (or placed by hand)
        if str(k - 1) not in by_hand and db[max(0, f(cuts[k]) - 2):f(cuts[k]) + 3].max() > QUIET + 6:
            print(f"  cut {k - 1} at {cuts[k]:.3f} is inside a sound: between {slots[k - 1][1]} and {slots[k][1]}")


if __name__ == '__main__':
    sys.path.insert(0, str(HERE))
    if len(sys.argv) != 3 or sys.argv[1] not in RECORDINGS:
        sys.exit(f'usage: recording_cut.py {"|".join(RECORDINGS)} align|OUT')
    if sys.argv[2] == 'align':
        align_words(sys.argv[1])
    else:
        main(sys.argv[1], sys.argv[2])
