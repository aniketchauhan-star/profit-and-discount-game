# New clips made ready for tools/vo_build.py: 0.30 s of silence before the voice and 0.40 s after it (as the studio's
# clips have: the game's typing is timed to that), no louder than −1 dBFS, as MP3 (192 kbps) named by line id, in a zip
# as the studio's download is (voiceovers/voNNN.mp3).
#   ~/.cache/bj-voices/venv/bin/python tools/voices/finish.py ZIP DIR [DIR …]   (each DIR holds voNNN.wav)
import glob, os, subprocess, sys, tempfile, zipfile
import numpy as np, soundfile as sf

BEFORE, AFTER = 0.30, 0.40


def finish(y, sr):
    hop, win = int(0.005 * sr), int(0.020 * sr)
    fr = np.lib.stride_tricks.sliding_window_view(np.pad(y, (win // 2, win // 2)), win)[::hop]
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
    loud = np.where(db > db.max() - 40)[0]
    on, off = loud[0] * hop, min(len(y), loud[-1] * hop + win)
    a, b = max(0, on - int(0.03 * sr)), min(len(y), off + int(0.06 * sr))  # (a little room round the voice)
    z = y[a:b].copy()
    n = int(0.006 * sr)
    z[:n] *= np.linspace(0, 1, n)
    z[-n:] *= np.linspace(1, 0, n)
    lead = np.zeros(int((BEFORE - (on - a) / sr) * sr))
    tail = np.zeros(int((AFTER - (b - off) / sr) * sr))
    z = np.concatenate([lead, z, tail])
    peak = np.abs(z).max()
    return z * (0.89 / peak) if peak > 0.89 else z


def main(zip_path, dirs):
    made = []
    with tempfile.TemporaryDirectory() as tmp, zipfile.ZipFile(zip_path, 'w') as out:
        for d in dirs:
            for path in sorted(glob.glob(f'{d}/vo[0-9][0-9][0-9].wav')):
                vid = os.path.basename(path)[:-4]
                y, sr = sf.read(path)
                wav = f'{tmp}/{vid}.wav'
                sf.write(wav, finish(y, sr).astype(np.float32), sr)
                mp3 = f'{tmp}/{vid}.mp3'
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', mp3], check=True)
                out.write(mp3, f'voiceovers/{vid}.mp3')
                made.append(vid)
    print(f'{len(made)} clips in {zip_path}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2:])
