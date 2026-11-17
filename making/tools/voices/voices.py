# A line none of the user's recordings has, voiced with Chatterbox (Resemble AI's open-source voice model, MIT licence),
# cloned from its speaker's reference in refs/. Since 2026-11-03 every line in the game is from the user's recordings
# (making/source/FINAL.mp3, boy.mp3, father.mp3, shop.mp3: Swifty, Amit, his father, the shopkeeper), cut and, on a film,
# laid on the lips by recording_cut.py, and each refs/<who>.flac is that speaker's lines from them, as said (Amit about
# 219 Hz, his father about 118 Hz, the shopkeeper about 130 Hz). (From 2026-10-26 to 11-03 the three men were Chatterbox
# voices from their studio clips shaped with the WORLD vocoder, making/tools/vo_deepen.py: in git's history.)
# Don't shape the clips in assets/VO-EN again: they are these voices already. Each line (its spoken form, from
# making/tools/vo_script.json): takes (seeds 1000, 1001, …) until one has exactly its words (whisper) and its pitch in the voice's
# range, at least TAKES and at most MAX_TAKES; the likest of those to the voice kept, trimmed, as loud as Swifty's clips
# (−16 LUFS): OUT/<id>.wav. A line already in OUT is skipped (a run cut short goes on where it stopped). Then
# making/tools/voices/finish.py and making/tools/vo_build.py. Needs ~/.cache/bj-voices/venv (chatterbox-tts, praat-parselmouth,
# pyloudnorm) and whisper.cpp's whisper-cli with ~/.cache/whisper-models/ggml-large-v3-turbo.bin. Files only: nothing is
# played.
#   ~/.cache/bj-voices/venv/bin/python making/tools/voices/voices.py OUT [id …]        (no ids: every line of the three)
# On 2026-10-28 the user found the three "too fast", "like reading, not a conversation", and asked for the films' lips to
# go with the words: they talk livelier and slower now (VOICES: exaggeration up, cfg 0.3, as Chatterbox's notes advise
# for a calmer pace), and with TARGETS=file.json each line is made to it: {id: seconds} as long as that, or (a line on a
# film: making/tools/flow_import.py --timing) {id: [[from, to] …]} on its character's lips, each phrase starting as they start
# moving again (see align). Of its takes (with SEED=2000 … more of them), the likest that fits with little stretch,
# fitted with ffmpeg's atempo (the pitch kept), by no more than STRETCH.
import json, os, re, subprocess, sys, warnings
warnings.filterwarnings('ignore')
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK', '1')
import numpy as np, soundfile as sf, torch, parselmouth, pyloudnorm as pyln, librosa
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lips import STRETCH, reach, spans_of, paired, stretches, align, speech_seconds, fit  # noqa: E402 (laying a voice on its lips)

HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
GAME = os.path.dirname(os.path.dirname(os.path.dirname(HERE.rstrip('/')))) + '/'  # the project (this is making/tools/voices/)
MODEL = os.path.expanduser('~/.cache/whisper-models/ggml-large-v3-turbo.bin')
OUT = sys.argv[1]
ONLY = set(sys.argv[2:])
TAKES = int(os.environ.get('TAKES', 3))
MAX_TAKES = int(os.environ.get('MAX_TAKES', 6))
SEED = int(os.environ.get('SEED', 1000))  # the first take's seed (another SEED: other takes of a line)
# (for those other takes: how lively and how closely to the usual pace, instead of the voice's own: see VOICES)
EXAG = float(os.environ['EXAG']) if os.environ.get('EXAG') else None
CFG = float(os.environ['CFG']) if os.environ.get('CFG') else None
LUFS = -16.0  # (Swifty's clips, measured)
os.makedirs(f'{OUT}/takes', exist_ok=True)

VOICES = {  # how lively (exaggeration), how closely it keeps to the usual pace (cfg: lower is slower), the pitch range to keep (Hz)
    'Amit': dict(exaggeration=0.7, cfg=0.3, range=(190, 255)),  # (his recording's voice, about 219 Hz; only a line it lacks)
    'Father': dict(exaggeration=0.55, cfg=0.3, range=(100, 145)),  # (his recording's voice, about 118 Hz; only a line it lacks)
    'Shopkeeper': dict(exaggeration=0.6, cfg=0.3, range=(105, 150)),  # (his recording's voice, about 130 Hz)
    # Swifty's lines come from the user's recording (making/source/FINAL.mp3, 2026-11-03: recording_cut.py); only a line it
    # doesn't have is made, when asked for by its id, cloned from refs/swifty.flac (six of her clips from it, as they are)
    'Swifty': dict(exaggeration=0.5, cfg=0.5, range=(215, 330)),
}
TARGETS = json.load(open(os.environ['TARGETS'])) if os.environ.get('TARGETS') else {}  # {id: seconds of speech}
SR = 24000

# ---------- words as said (to compare whisper's words with the line's) ----------
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
    t = re.sub(r'\brs\.?\s?([\d,]+)', lambda m: m[1].replace(',', '') + ' rupees', t)  # (whisper writes rupees as "Rs. 1800")
    t = re.sub(r'(\d),(\d)', r'\1\2', t)
    t = re.sub(r'(\d+)\s*/\s*(\d+)', r'\1 over \2', t)
    t = t.replace('÷', ' divided by ').replace('×', ' times ').replace('=', ' equals ').replace('−', ' minus ').replace('%', ' percent ')
    t = re.sub(r'\bmp\b', 'm p', t)
    t = re.sub(r'\bsp\b', 's p', t)
    t = t.replace('-', ' ')
    t = re.sub(r"[’'`]", '', t)
    t = re.sub(r'[^a-z0-9 ]', ' ', t)
    t = re.sub(r'\banna kate\b|\banakate\b|\banikate\b|\bani kate\b', 'aniket', t)
    t = re.sub(r'\b(ameet|amith|ammit|amitt|a meet)\b', 'amit', t)  # (the boy's name since 2026-10-28)
    t = re.sub(r'\bbottom wear\b|\bbottomware\b', 'bottomwear', t)
    t = re.sub(r'\bhole\b', 'whole', t)
    return words_to_digits(t.split())


# ---------- sound ----------
def praat_pitch(y, sr):
    p = parselmouth.Sound(y.astype(np.float64), sampling_frequency=sr).to_pitch_ac(pitch_floor=70, pitch_ceiling=500, octave_jump_cost=0.6, voicing_threshold=0.5)
    f = p.selected_array['frequency']
    f = f[f > 0]
    return float(np.median(f)) if len(f) else 0.0


def trim(y, sr):
    """Leading and trailing quiet cut to 50 ms before the voice and 120 ms after it, with short fades."""
    hop, win = int(0.005 * sr), int(0.020 * sr)
    fr = np.lib.stride_tricks.sliding_window_view(np.pad(y, (win // 2, win // 2)), win)[::hop]
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
    loud = np.where(db > db.max() - 40)[0]
    a = max(0, loud[0] * hop - int(0.05 * sr))
    b = min(len(y), loud[-1] * hop + win + int(0.12 * sr))
    y = y[a:b].copy()
    n = int(0.008 * sr)
    y[:n] *= np.linspace(0, 1, n)
    y[-n:] *= np.linspace(1, 0, n)
    return y




def heard(path):
    w16 = path[:-4] + '.16k.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ar', '16000', '-ac', '1', w16], check=True)
    subprocess.run(['whisper-cli', '-l', 'en', '-nt', '-oj', '-np', '-m', MODEL, '-f', w16], capture_output=True)
    return ' '.join(s['text'].strip() for s in json.load(open(w16 + '.json'))['transcription'])


# ---------- the lines ----------
script = {e['id']: e for e in json.load(open(GAME + 'making/tools/vo_script.json'))}
parts = [r for r in json.load(open(HERE + 'pieces.json')) if r['speaker'] != 'Swifty']
if ONLY:  # (any line of the script, by its id)
    parts = [{'id': e['id'], 'speaker': e['speaker'], 'line': e['line']} for e in script.values() if e['id'] in ONLY]
todo = [r for r in parts if not os.path.exists(f"{OUT}/{r['id']}.wav")]
print(f'{len(parts) - len(todo)} of {len(parts)} lines done already; {len(todo)} to make', flush=True)
said = {r['id']: script[r['id']]['spoken'].replace('’', "'") for r in parts}  # (amounts in words; plain apostrophes)

# ---------- the voices ----------
refs = {who: f'{HERE}refs/{who.lower()}.flac' for who in {r['speaker'] for r in parts}}
if not todo:
    sys.exit(0)

from chatterbox.tts import ChatterboxTTS
from chatterbox.models.voice_encoder import VoiceEncoder
from huggingface_hub import hf_hub_download
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
tts = ChatterboxTTS.from_pretrained(device=dev)
ve = VoiceEncoder()
ve.load_state_dict(torch.load(hf_hub_download('ResembleAI/chatterbox', 've.pt'), map_location='cpu'))
ve.eval()
emb = lambda y, sr: ve.embeds_from_wavs([librosa.resample(y.astype(np.float32), orig_sr=sr, target_sr=16000)], sample_rate=16000)[0]
ref_emb = {}
for who, path in refs.items():
    e = emb(sf.read(path)[0], SR)
    ref_emb[who] = e / np.linalg.norm(e)
meter = pyln.Meter(SR)

log = f'{OUT}/takes.jsonl'
# takes made before in OUT (a run cut short, or a line made again at another length) are used again, not made again
made = {}
if os.path.exists(log):
    for row in map(json.loads, open(log)):
        if os.path.exists(row['path']):
            made[row['path']] = row
for r in todo:
    v = VOICES[r['speaker']]
    lo, hi = v['range']
    ready = False
    takes = []
    for k in range(MAX_TAKES):
        p = f"{OUT}/takes/{r['id']}_{k}.wav" if SEED == 1000 else f"{OUT}/takes/{r['id']}_s{SEED + k}.wav"
        if p in made and made[p]['line'] == r['line']:
            t = dict(made[p])
            y = sf.read(p)[0]
        else:
            if not ready:
                tts.prepare_conditionals(refs[r['speaker']], exaggeration=EXAG or v['exaggeration'])
                ready = True
            torch.manual_seed(SEED + k)
            wav = tts.generate(said[r['id']], exaggeration=EXAG or v['exaggeration'], cfg_weight=CFG or v['cfg'], temperature=0.8)
            y = trim(wav.cpu().numpy()[0].astype(np.float64), tts.sr)
            sf.write(p, y.astype(np.float32), tts.sr)
            e = emb(y, tts.sr)
            t = dict(id=r['id'], who=r['speaker'], line=r['line'], take=k, path=p, seconds=round(len(y) / tts.sr, 2),
                     likeness=round(float(e @ ref_emb[r['speaker']] / np.linalg.norm(e)), 3), pitch=round(praat_pitch(y, tts.sr)), heard=heard(p))
        t['exact'] = tokens(t['line']) == tokens(t['heard'])
        t['in_range'] = lo <= t['pitch'] <= hi
        t['speech'] = round(speech_seconds(y, tts.sr), 3)
        takes.append(t)
        with open(log, 'a') as fh:
            fh.write(json.dumps(t, ensure_ascii=False) + '\n')
        print(f"  {r['id']} take {k}: {t['seconds']:.2f} s, likeness {t['likeness']:.3f}, pitch {t['pitch']} Hz{'' if t['in_range'] else ' (out of range)'}{'' if t['exact'] else ' WORDS: ' + t['heard']}", flush=True)
        if k >= TAKES - 1 and any(x['exact'] and x['in_range'] for x in takes):
            break
    for p, row in made.items():  # (and its takes made with other seeds)
        if row['id'] == r['id'] and row['line'] == r['line'] and all(p != t['path'] for t in takes):
            t = dict(row)
            t['exact'] = tokens(t['line']) == tokens(t['heard'])
            t['in_range'] = lo <= t['pitch'] <= hi
            t['speech'] = round(speech_seconds(sf.read(p)[0], tts.sr), 3)
            takes.append(t)
    want = TARGETS.get(r['id'])
    # (with a length wanted, or its lips: a take that can be fitted with little stretch, as stretching drags the voice)
    if isinstance(want, list):
        for t in takes:
            t['pieces'] = spans_of(sf.read(t['path'])[0], tts.sr)
        def off(t):  # (the most stretch it needs, beyond what its phrase may have, counted as more than STRETCH's)
            ks = [(k, reach(e - s)) for k, (_, (s, e)) in zip(stretches(t['pieces'], want), paired(t['pieces'], want))]
            return max((abs(np.log(k)) - max(0.0, np.log(hi) - np.log(1 / STRETCH)) for k, (_, hi) in ks), default=9.0)
    else:
        off = lambda t: abs(np.log(t['speech'] / want)) if want else 0.0
    best = max(takes, key=lambda t: (t['exact'], t['in_range'], t['likeness'] - 0.3 * off(t) - 3 * max(0.0, off(t) - np.log(1 / STRETCH))))
    y, sr = sf.read(best['path'])
    loud = meter.integrated_loudness(y) if len(y) > sr * 0.45 else float('nan')
    if np.isfinite(loud):
        y = pyln.normalize.loudness(y, loud, LUFS)
    y *= min(1.0, 0.89 / max(1e-9, np.abs(y).max()))
    if isinstance(want, list):  # on its lips
        ks = stretches(best['pieces'], want)
        y = align(y, sr, want)
        fitted = f", laid on its lips: {len(ks)} piece(s), each ×{', ×'.join(f'{k:.2f}' for k in ks)} wanted, {speech_seconds(y, sr):.2f} s, its lips {want[-1][1]:.2f} s"
    elif want:  # as long as wanted, or as near as STRETCH allows
        tempo = min(1 / STRETCH, max(STRETCH, speech_seconds(y, sr) / want))
        if abs(tempo - 1) > 0.01:
            y = fit(y, sr, tempo)
        fitted = f", {best['speech']:.2f} s made {best['speech'] / tempo:.2f} s, {want:.2f} s wanted"
    else:
        fitted = ''
    sf.write(f"{OUT}/{r['id']}.wav", y.astype(np.float32), sr)
    print(f"{r['id']} ({best['who']}): take {best['take']} of {len(takes)}{'' if best['exact'] else ' (words not exact!)'}{'' if best['in_range'] else ' (pitch out of range!)'}, likeness {best['likeness']:.3f}, pitch {best['pitch']} Hz{fitted} | heard: {best['heard']}", flush=True)
