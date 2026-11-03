# Every clip in DIR (voNNN.wav): does whisper (large-v3-turbo) hear exactly its words (its line in vo_script.json)?
#   ~/.cache/bj-voices/venv/bin/python making/tools/voices/check.py DIR
import glob, json, os, subprocess, sys
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recording_cut import tokens, SCRIPT, WHISPER

DIR = sys.argv[1]
lines = {e['id']: e['spoken'] for e in json.load(open(SCRIPT, encoding='utf-8'))}
wavs = sorted(glob.glob(f'{DIR}/vo[0-9][0-9][0-9].wav'))
os.makedirs(f'{DIR}/qa', exist_ok=True)
for w in wavs:
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', w, '-ar', '16000', '-ac', '1', f'{DIR}/qa/' + os.path.basename(w)], check=True)
subprocess.run(['whisper-cli', '-l', 'en', '-nt', '-oj', '-np', '-m', str(WHISPER),
                *sum((['-f', f'{DIR}/qa/' + os.path.basename(w)] for w in wavs), [])], capture_output=True)
bad = 0
for w in wavs:
    vid = os.path.basename(w)[:-4]
    heard = ' '.join(s['text'].strip() for s in json.load(open(f'{DIR}/qa/{vid}.wav.json'))['transcription'])
    if tokens(lines[vid]) != tokens(heard):
        bad += 1
        print(f'{vid}: want "{lines[vid]}" | heard "{heard}"')
print(f'{len(wavs) - bad} of {len(wavs)} clips say exactly their words')
