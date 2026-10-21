#!/usr/bin/env python3
"""Sharpens the game's 1280 x 720 clips (Gemini's size) into 1920 x 1080, the stage's size. See "Animation Video Prompts.md".

  python3 tools/enhance_clips.py                     every 1280 x 720 clip in "game assets/video/"
  python3 tools/enhance_clips.py s22-aniket-1 …      just these
  python3 tools/enhance_clips.py --ai FOLDER …       with Real-ESRGAN (better): FOLDER holds realesrgan-ncnn-vulkan and
                                                     its models (github.com/xinntao/Real-ESRGAN/releases, v0.2.5.0)

The game stretches every clip to the screen; a browser does that softly, so lines and printed words in a 720p clip
look blurred. With --ai, each frame is redrawn at twice its size by Real-ESRGAN's model for cartoon video
(realesr-animevideov3: clean outlines and flat colours, steady from frame to frame) and brought to 1920 x 1080.
Without it, each clip is cleaned a little (a light denoise, less over time so that moving mouths don't smear), scaled
up with Lanczos and sharpened on its lines. Either way it is written as the other clips are: H.264, no sound, marked
sRGB as tools/gemini_clean.py marks them (so the colours stay the picture's), about twice as heavy. A clip already
1920 x 1080 (Higgsfield's, or one done before) is left as it is, so running it again changes nothing: to redo one,
put its 720p take back first (from git, or tools/gemini_clean.py). Standard library only (and ffmpeg).
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIPS = ROOT / 'game assets' / 'video'
SHARPEN = 'hqdn3d=1.5:1.5:2.5:2.5,scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.7:5:5:0.0'
MODEL = 'realesr-animevideov3-x2'
# RGB → the clips' YUV (BT.709, TV range), marked sRGB: as tools/gemini_clean.py writes them.
TO_CLIP = ('scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p,'
           'setparams=range=tv:colorspace=bt709:color_primaries=bt709:color_trc=iec61966-2-1')
ENCODE = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
          '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-color_range', 'tv',
          '-movflags', '+faststart']


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate',
                          '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout
    w, h, rate = out.strip().split(',')
    return int(w), int(h), rate


def sharpen(path, part):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-an', '-vf', SHARPEN, *ENCODE, str(part)], check=True)


def redraw(path, part, tool, rate):
    """Every frame redrawn by Real-ESRGAN at twice its size, then brought to 1920 x 1080."""
    with tempfile.TemporaryDirectory() as tmp:
        src, out = Path(tmp, 'in'), Path(tmp, 'out')
        src.mkdir()
        out.mkdir()
        subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-vf',
                        'scale=in_color_matrix=bt709:in_range=tv:flags=accurate_rnd+full_chroma_int', str(src / '%05d.png')], check=True)
        subprocess.run([str(tool / 'realesrgan-ncnn-vulkan'), '-i', str(src), '-o', str(out), '-n', MODEL, '-s', '2',
                        '-m', str(tool / 'models'), '-f', 'png'], check=True, capture_output=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', rate, '-i', str(out / '%05d.png'), '-vf', TO_CLIP,
                        *ENCODE, str(part)], check=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('clips', nargs='*', help='clip names (default: every 1280 x 720 clip)')
    ap.add_argument('--ai', type=Path, help="Real-ESRGAN's folder (realesrgan-ncnn-vulkan and models/)")
    a = ap.parse_args()
    paths = [CLIPS / f'{n}.mp4' for n in a.clips] if a.clips else sorted(p for p in CLIPS.glob('s*.mp4') if '.' not in p.stem)
    for path in paths:
        if not path.exists():
            print(f'{path.stem}: no such clip')
            continue
        w, h, rate = probe(path)
        if (w, h) != (1280, 720):
            print(f'{path.stem}: {w} x {h}, left as it is')
            continue
        before = path.stat().st_size
        part = path.with_suffix('.part.mp4')
        if a.ai:
            redraw(path, part, a.ai, rate)
        else:
            sharpen(path, part)
        part.replace(path)
        print(f'{path.stem}: 1920 x 1080{" (Real-ESRGAN)" if a.ai else ""}, {before / 1e6:.1f} → {path.stat().st_size / 1e6:.1f} MB', flush=True)


if __name__ == '__main__':
    main()
