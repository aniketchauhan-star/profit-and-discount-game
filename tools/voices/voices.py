# Aniket (the boy), his father and the shopkeeper, voiced with Chatterbox (Resemble AI's open-source voice model, MIT
# licence), each cloned from his reference in refs/: his own studio clips (the TTS studio's Puck, Fenrir and Charon) shaped
# with the WORLD vocoder as tools/vo_deepen.py does, made on 2026-10-26 from the clips in git before that day's commit:
#   Aniket      vo001 vo047 vo102 vo005   pitch × 1.25, throat × 1.10: younger, a boy's voice (about 245 Hz; the studio's
#                                         "Male Child" was nearer a teenager, about 185 Hz)
#   Father      vo002 vo133 vo134         as they were (deepened before, about 135 Hz)
#   Shopkeeper  vo021 vo022 vo023         pitch × 0.66, throat × 0.88: deeper (about 125 Hz; his studio clips were at about
#                                         195 Hz, a woman's range)
# Don't shape the clips in game assets/vo again: they are these voices already. Each line (its spoken form, from
# tools/vo_script.json): takes (seeds 1000, 1001, …) until one has exactly its words (whisper) and its pitch in the voice's
# range, at least TAKES and at most MAX_TAKES; the likest of those to the voice kept, trimmed, as loud as Swifty's clips
# (−16 LUFS): OUT/<id>.wav. A line already in OUT is skipped (a run cut short goes on where it stopped). Then
# tools/voices/finish.py and tools/vo_build.py. Needs ~/.cache/bj-voices/venv (chatterbox-tts, praat-parselmouth,
# pyloudnorm) and whisper.cpp's whisper-cli with ~/.cache/whisper-models/ggml-large-v3-turbo.bin. Files only: nothing is
# played.
#   ~/.cache/bj-voices/venv/bin/python tools/voices/voices.py OUT [id …]        (no ids: every line of the three)
import json, os, re, subprocess, sys, warnings
warnings.filterwarnings('ignore')
os.environ.setdefault('PYTORCH_ENABLE_MPS_FALLBACK', '1')
import numpy as np, soundfile as sf, torch, parselmouth, pyloudnorm as pyln, librosa

HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
GAME = os.path.dirname(os.path.dirname(HERE.rstrip('/'))) + '/'
MODEL = os.path.expanduser('~/.cache/whisper-models/ggml-large-v3-turbo.bin')
OUT = sys.argv[1]
ONLY = set(sys.argv[2:])
TAKES = int(os.environ.get('TAKES', 3))
MAX_TAKES = int(os.environ.get('MAX_TAKES', 6))
LUFS = -16.0  # (Swifty's clips, measured)
os.makedirs(f'{OUT}/takes', exist_ok=True)

VOICES = {  # how lively, the pitch range to keep (Hz)
    'Aniket': dict(exaggeration=0.6, range=(205, 290)),
    'Father': dict(exaggeration=0.45, range=(100, 145)),
    'Shopkeeper': dict(exaggeration=0.5, range=(105, 150)),
    # Swifty's lines come from the user's recording (swifty_cut.py); only a line it doesn't have is made, when asked for
    # by its id, cloned from refs/swifty.flac (four of her clips from the recording, as they are): "You bought … already!"
    'Swifty': dict(exaggeration=0.5, range=(215, 330)),
}
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
script = {e['id']: e for e in json.load(open(GAME + 'tools/vo_script.json'))}
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
for r in todo:
    v = VOICES[r['speaker']]
    lo, hi = v['range']
    tts.prepare_conditionals(refs[r['speaker']], exaggeration=v['exaggeration'])
    takes = []
    for k in range(MAX_TAKES):
        torch.manual_seed(1000 + k)
        wav = tts.generate(said[r['id']], exaggeration=v['exaggeration'], cfg_weight=0.5, temperature=0.8)
        y = trim(wav.cpu().numpy()[0].astype(np.float64), tts.sr)
        p = f"{OUT}/takes/{r['id']}_{k}.wav"
        sf.write(p, y.astype(np.float32), tts.sr)
        e = emb(y, tts.sr)
        t = dict(id=r['id'], who=r['speaker'], line=r['line'], take=k, path=p, seconds=round(len(y) / tts.sr, 2),
                 likeness=round(float(e @ ref_emb[r['speaker']] / np.linalg.norm(e)), 3), pitch=round(praat_pitch(y, tts.sr)), heard=heard(p))
        t['exact'] = tokens(t['line']) == tokens(t['heard'])
        t['in_range'] = lo <= t['pitch'] <= hi
        takes.append(t)
        with open(log, 'a') as fh:
            fh.write(json.dumps(t, ensure_ascii=False) + '\n')
        print(f"  {r['id']} take {k}: {t['seconds']:.2f} s, likeness {t['likeness']:.3f}, pitch {t['pitch']} Hz{'' if t['in_range'] else ' (out of range)'}{'' if t['exact'] else ' WORDS: ' + t['heard']}", flush=True)
        if k >= TAKES - 1 and any(x['exact'] and x['in_range'] for x in takes):
            break
    best = max(takes, key=lambda t: (t['exact'], t['in_range'], t['likeness']))
    y, sr = sf.read(best['path'])
    loud = meter.integrated_loudness(y) if len(y) > sr * 0.45 else float('nan')
    if np.isfinite(loud):
        y = pyln.normalize.loudness(y, loud, LUFS)
    y *= min(1.0, 0.89 / max(1e-9, np.abs(y).max()))
    sf.write(f"{OUT}/{r['id']}.wav", y.astype(np.float32), sr)
    print(f"{r['id']} ({best['who']}): take {best['take']} of {len(takes)}{'' if best['exact'] else ' (words not exact!)'}{'' if best['in_range'] else ' (pitch out of range!)'}, likeness {best['likeness']:.3f}, pitch {best['pitch']} Hz | heard: {best['heard']}", flush=True)
