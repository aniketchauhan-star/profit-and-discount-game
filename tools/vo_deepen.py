#!/usr/bin/env python3
"""Gives a speaker's voice clips a man's voice, where the TTS studio made them too high. See docs/VOICEOVER.md.

  python3 tools/vo_deepen.py Father                  the father's clips (every line tools/vo_script.json gives him)
  python3 tools/vo_deepen.py Father --pitch 0.5      lower still (default 0.52: about 240 Hz → 125 Hz)
  python3 tools/vo_deepen.py Father --check          only say which clips are done

The studio's "Male Senior" clips came out at about 240-270 Hz, a woman's pitch (a man speaks at about 85-155 Hz).
Each clip is taken apart with the WORLD vocoder (its pitch, its voice's colour, its breath), its pitch multiplied by
--pitch, its colour moved down as a man's longer throat would make it (--throat, 0.85), and put back together: the
same length, as loud as before, written over the clip (Ogg Opus, 32 kbps, mono, as tools/vo_build.py writes them)
and marked as done, so running it again changes nothing. Clips remade in the studio need this again.
Needs numpy and pyworld (python3 -m pip install numpy pyworld) and ffmpeg.
"""
import argparse
import json
import subprocess
from pathlib import Path

import numpy as np
import pyworld as pw

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / 'tools' / 'vo_script.json'
CLIPS = ROOT / 'game assets' / 'vo'
RATE = 24000   # the studio's sample rate
FRAME = 5.0    # ms between the vocoder's frames
MARK = 'deepened'


def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(RATE), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def done(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream_tags:format_tags', '-of', 'json', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return MARK in out.lower()


def write(path, x, note):
    part = path.with_suffix('.part.ogg')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(RATE), '-ac', '1', '-i', '-',
                    '-c:a', 'libopus', '-b:a', '32k', '-metadata', f'{MARK}={note}', str(part)],
                   input=x.astype(np.float32).tobytes(), check=True)
    part.replace(path)


def loudness(x):
    """How loud the clip is where someone is speaking (RMS over its louder 20 ms frames)."""
    n = RATE // 50
    rms = np.sqrt((x[: len(x) // n * n].reshape(-1, n) ** 2).mean(1))
    return rms[rms > rms.max() * 0.1].mean()


def deepen(x, pitch, throat):
    f0, t = pw.harvest(x, RATE, f0_floor=60, f0_ceil=500, frame_period=FRAME)
    sp = pw.cheaptrick(x, f0, t, RATE)
    ap = pw.d4c(x, f0, t, RATE)
    bins = np.arange(sp.shape[1])
    src = np.minimum(bins / throat, bins[-1])  # each bin takes the colour from higher up: the formants move down
    warp = lambda a: np.ascontiguousarray([np.interp(src, bins, row) for row in a])
    y = pw.synthesize(f0 * pitch, warp(sp), warp(ap), RATE, FRAME)[: len(x)]
    y *= loudness(x) / loudness(y)
    peak = np.abs(y).max()
    return y * (0.89 / peak) if peak > 0.89 else y  # (never louder than -1 dBFS)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('speaker', help='as tools/vo_script.json names them, e.g. Father')
    ap.add_argument('--pitch', type=float, default=0.52, help='the pitch is multiplied by this')
    ap.add_argument('--throat', type=float, default=0.85, help="the voice's colour (its formants) moves down by this")
    ap.add_argument('--check', action='store_true', help='only say which clips are done')
    a = ap.parse_args()
    ids = [e['id'] for e in json.loads(SCRIPT.read_text(encoding='utf-8')) if e['speaker'] == a.speaker]
    if not ids:
        raise SystemExit(f'no lines for {a.speaker} in {SCRIPT.name}')
    for id_ in ids:
        path = CLIPS / f'{id_}.ogg'
        if not path.exists():
            print(f'{id_}: no clip yet')
        elif done(path):
            print(f'{id_}: done already')
        elif a.check:
            print(f'{id_}: not done yet')
        else:
            write(path, deepen(read(path), a.pitch, a.throat), f'pitch {a.pitch}, throat {a.throat}')
            print(f'{id_}: done (pitch × {a.pitch}, throat × {a.throat})')


if __name__ == '__main__':
    main()
