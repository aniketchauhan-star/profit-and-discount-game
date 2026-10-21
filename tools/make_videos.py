#!/usr/bin/env python3
"""Makes the story's animation clips with the Higgsfield API: Seedance 2.5, image to video.
The clips, their frames and their prompts are in "Animation Video Prompts.md".

  python3 tools/make_videos.py                          the clips: made or not, and what the missing ones would cost
  python3 tools/make_videos.py s04-to-s05 s01-aniket    make these clips (it asks first; --yes skips the question)
  python3 tools/make_videos.py --all                    make every clip not made yet
  python3 tools/make_videos.py --import "videos "       bring in clips made elsewhere (a folder or files; each file's name
                                                        holds its clip's name, e.g. "s01-idle.mp4"; --as CLIP names a
                                                        single file, --skip CLIP… leaves clips out; --gemini for clips
                                                        made with Google Gemini: see tools/gemini_clean.py)
  python3 tools/make_videos.py --index                  just list the clips there are, for the game (js/video_clips.js)
  python3 tools/make_videos.py --todo                   write "Animation Video Prompts - Left to Make.md": only the clips
                                                        not made yet, by picture, each with its prompt
  options: --resolution 720p|1080p (default 1080p)   --duration SECONDS (4-30; default: each clip's own length)
           --again (remake clips already made)

The key: an API key from https://console.higgsfield.ai (an ID and a secret), saved as one line, ID:SECRET, in
~/higgsfield-key.txt (or given in the HF_KEY environment variable). It is never printed. The API is billed from the API
balance on that console, not from a higgsfield.ai subscription.
Each clip is saved as "game assets/video/<clip>.mp4": H.264, 1920 × 1080, 24 fps, no sound (the game plays the voices),
and js/video_clips.js lists the clips there are (the game plays only those). Every request is noted in tools/video_log.jsonl.
HTTP goes through curl (macOS's Python can't open this server's TLS); the key reaches curl on its standard input,
never on its command line. Standard library only.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS = ROOT / 'Animation Video Prompts.md'
PICTURES = ROOT / 'game assets'
OUT = ROOT / 'game assets' / 'video'
LOG = ROOT / 'tools' / 'video_log.jsonl'
INDEX = ROOT / 'js' / 'video_clips.js'
TODO = ROOT / 'Animation Video Prompts - Left to Make.md'
# A clip to make again, and why (its first take didn't fit).
REDO = {
    's06-to-s07': "Make it again: the first take started on Screen 7's picture, so the book was never handed over.",
    's24-to-s25': 'Make it again on Higgsfield, with both frames: in the Gemini take he crossed his arms instead.',
}
API = 'https://api.higgsfield.ai'
MODEL = 'bytedance/seedance-2.5/image-to-video'
DONE = {'completed', 'failed', 'nsfw', 'canceled', 'cancelled'}
RATE = (0.0738, 0.21)  # US$ a second of video, as Higgsfield lists it (lowest and highest seen); 1080p may cost more


# ---------- the clips, from the prompts file ----------

def load_clips():
    text = PROMPTS.read_text(encoding='utf-8')
    frames = {}
    for line in text.splitlines():  # the table: file, screen, start frame, end frame, length, what happens
        cells = [c.strip().strip('`') for c in line.strip().strip('|').split('|')]
        if len(cells) == 6 and re.fullmatch(r's\d\d[\w-]*', cells[0]):
            name, screen, start, end, length, what = cells
            end = None if end.startswith('(none)') else start if end == 'same' else end
            frames[name] = (start, end, int(re.match(r'\d+', length).group()), what, screen)
    # each prompt: its heading "#### name.mp4", the line saying where to save it, then the prompt in a text block
    prompts = dict(re.findall(r'^#### (s\d\d[\w-]*)\.mp4\n[^\n]*\n```text\n(.*?)\n```', text, re.S | re.M))
    clips = []
    for name, (start, end, seconds, what, screen) in frames.items():
        if name not in prompts:
            sys.exit(f'{name}: no prompt for it in {PROMPTS.name}')
        for picture in filter(None, (start, end)):
            if not (PICTURES / picture).exists():
                sys.exit(f'{name}: no picture "{picture}" in {PICTURES}')
        clips.append({'name': name, 'screen': screen, 'start': start, 'end': end, 'seconds': seconds, 'what': what,
                      'prompt': prompts[name].strip()})
    return clips


# ---------- clips made elsewhere, and the list for the game ----------

def encode(src, dest):
    """A clip as the game plays it: H.264 (every browser plays it), 1920 x 1080, 24 fps, no sound, fast to start."""
    part = dest.with_suffix('.part.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-an', '-vf', 'scale=1920:1080', '-r', '24',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
                    '-movflags', '+faststart', str(part)], check=True)
    part.replace(dest)


def seconds_of(path):
    run = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True)
    return round(float(run.stdout.strip()), 2)


def write_index():
    clips = {p.stem: seconds_of(p) for p in sorted(OUT.glob('s*.mp4')) if '.' not in p.stem}
    INDEX.write_text(
        '// Generated by tools/make_videos.py (--import, --index). Do not edit by hand: see "Animation Video Prompts.md".\n'
        '// The story\'s video clips there are in "game assets/video/" → their length in seconds. The game plays only these.\n'
        'const VIDEO_CLIPS = {\n' + ''.join(f'  {json.dumps(k)}: {v},\n' for k, v in clips.items()) + '};\n', encoding='utf-8')
    print(f'{INDEX.relative_to(ROOT)}: {len(clips)} clip(s)')


def import_clips(paths, known, as_name=None, skip=(), gemini=False):
    """known: the clips by name. With gemini, each clip is readied by tools/gemini_clean.py (its framing put back on its
    story picture, the sparkle taken off), from the pictures the prompts file gives it."""
    if gemini:
        try:
            sys.path.insert(0, str(Path(__file__).resolve().parent))
            import gemini_clean
        except ImportError as e:
            sys.exit(f'--gemini needs numpy and Pillow ({e}): python3 -m pip install numpy pillow')
    files = []
    for p in map(Path, paths):
        files += sorted(f for f in p.iterdir() if f.suffix.lower() in ('.mp4', '.mov', '.m4v', '.webm')) if p.is_dir() else [p]
    OUT.mkdir(parents=True, exist_ok=True)
    for f in files:
        m = re.search(r'(s\d\d[a-z0-9-]*)\.(?:mp4|mov|m4v|webm)$', f.name, re.I)
        name = as_name or (m and m.group(1).lower())
        if not name or name not in known:
            print(f'skipped (no clip name in it): {f.name}')
            continue
        if name in skip:
            print(f'skipped (--skip): {f.name}')
            continue
        if gemini:
            c = known[name]
            print(f'{name}: from {f.name}')
            gemini_clean.clean(f, OUT / f'{name}.mp4', PICTURES / c['start'],
                               PICTURES / c['end'] if c['end'] and c['end'] != c['start'] else None)
        else:
            encode(f, OUT / f'{name}.mp4')
        print(f"{name}: from {f.name}, {(OUT / (name + '.mp4')).stat().st_size / 1e6:.1f} MB")
    write_index()


def write_todo(clips):
    """The clips not made yet, by the picture to upload first, each with what to set and its prompt."""
    made = {p.stem for p in OUT.glob('s*.mp4') if '.' not in p.stem}
    left = [c for c in clips if c['name'] not in made]
    negative = re.search(r'negative prompt.*?```text\n(.*?)\n```', PROMPTS.read_text(encoding='utf-8'), re.S | re.I)
    pictures = {}
    for c in left:
        pictures.setdefault(c['start'], []).append(c)
    out = [
        '# Animation clips left to make',
        '',
        f'{len(left)} of {len(clips)} clips are still to make; the other {len(clips) - len(left)} are in the game. This file holds only '
        'the ones left, by the picture you upload first, each with its prompt. Everything about them is in '
        '`Animation Video Prompts.md`. Made with `python3 tools/make_videos.py --todo`; it is written again after each batch.',
        '',
        '**For every clip, on Higgsfield** (Seedance 2.5, image to video):',
        '1. **Start frame:** the picture named with the clip, from the game folder `game assets`: '
        '`/Users/AniketChauhan/Desktop/profit and discount game/game assets/`.',
        '2. **End frame:** the picture named as its end frame. For a talking clip or a quiet loop, that is the same picture again.',
        '3. Paste the prompt. Set the **length** given, **1080p**, 16:9, and **sound off**.',
        '4. Make 2 or 3 takes and keep the cleanest. The first and last frames must be the pictures, the faces must stay '
        'the same, and the prices and signs must stay sharp.',
        '5. Save it with the clip\'s name, for example `s09-to-s10.mp4`, anywhere, and tell me. I put it in the game.',
        '',
        '**Check before you keep a take:** for a talking clip or a quiet loop, the last frame must look like the picture again. '
        'Two of the shopkeeper\'s first takes ended with his open hand down, so it jumped back up when the clip ended.',
        '',
        '**Made with Gemini instead?** That works for a talking clip or a quiet loop: keep the name Gemini gives the file '
        'and tell me which clip it is (or name it as above). I take the sparkle off and line it up with the picture '
        '(`--import --gemini`). Gemini can\'t be given an end frame, so make the **movement clips** (`…-to-…`) on '
        'Higgsfield. Ask for no captions: one Gemini take wrote "Really?" on the screen.',
        '',
    ]
    if negative:
        out += ['If there is a field for a **negative prompt**, paste this:', '', '```text', negative.group(1), '```', '']
    out += ['## The pictures left', '', '| Picture (start frame) | Screen | Clips to make |', '|---|---|---|']
    for picture, cs in pictures.items():
        screens = ', '.join(dict.fromkeys(c['screen'] for c in cs))
        out.append(f"| `{picture}` | {screens} | {len(cs)}: {', '.join(c['name'] for c in cs)} |")
    out.append('')
    n = 0
    for picture, cs in pictures.items():
        out += [f'## `{picture}`', '']
        for c in cs:
            n += 1
            end = 'the same picture' if c['end'] == c['start'] else f"`{c['end']}`" if c['end'] else 'none (it ends on a new pose)'
            out += [f"### {n}. {c['name']}.mp4 · Screen {c['screen']} · {c['what']}", '']
            if c['name'] in REDO:
                out += [f"**{REDO[c['name']]}**", '']
            out += [f"- [ ] Start frame `{c['start']}` · end frame {end} · **{c['seconds']} s** · 1080p · sound off · save as "
                    f"`{c['name']}.mp4`", '', '```text', c['prompt'], '```', '']
    TODO.write_text('\n'.join(out), encoding='utf-8')
    print(f'{TODO.name}: {len(left)} clip(s) left, from {len(pictures)} picture(s)')


# ---------- the key, and curl ----------

def load_key():
    key = os.environ.get('HF_KEY', '').strip()
    if not key and os.environ.get('HF_API_KEY_ID') and os.environ.get('HF_API_KEY_SECRET'):
        key = os.environ['HF_API_KEY_ID'].strip() + ':' + os.environ['HF_API_KEY_SECRET'].strip()
    if not key:
        path = Path.home() / 'higgsfield-key.txt'
        if path.exists():
            lines = [l.strip() for l in path.read_text(encoding='utf-8').splitlines() if l.strip()]
            key = lines[0] if len(lines) == 1 else ':'.join(lines[:2])
    if ':' not in key:
        sys.exit('No API key: save it as one line, ID:SECRET, in ~/higgsfield-key.txt (from https://console.higgsfield.ai).')
    return key


def curl(url, *, method='GET', body=None, key=None, headers=(), upload=None, out=None):
    """One HTTP request through curl. Returns (status code, response text); the key goes in on curl's standard input."""
    config = [f'url = "{url}"', f'request = "{method}"']
    if key:
        config.append(f'header = "Authorization: Key {key}"')
    config += [f'header = "{h}"' for h in headers]
    tmp = None
    if body is not None:
        tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
        json.dump(body, tmp)
        tmp.close()
        config += ['header = "Content-Type: application/json"', f'data-binary = "@{tmp.name}"']
    args = ['curl', '-sS', '--max-time', '600', '--retry', '2', '-K', '-', '-w', '\n%{http_code}']
    if upload:
        args += ['--upload-file', str(upload)]
    if out:
        args += ['-L', '-o', str(out)]
    try:
        run = subprocess.run(args, input='\n'.join(config), capture_output=True, text=True)
    finally:
        if tmp:
            os.unlink(tmp.name)
    if run.returncode:
        raise RuntimeError(f'curl failed ({run.returncode}): {run.stderr.strip()}')
    text, _, code = run.stdout.rpartition('\n')
    return int(code), text


def call(url, key, **kw):
    code, text = curl(url, key=key, **kw)
    if code >= 400:
        raise RuntimeError(f'HTTP {code} from {url}: {text[:400]}')
    return json.loads(text) if text.strip() else {}


# ---------- Higgsfield ----------

def upload(path, key, cache):
    """A picture, uploaded to Higgsfield's storage: its public URL (each picture once per run)."""
    if path in cache:
        return cache[path]
    slot = call(f'{API}/files/generate-upload-url', key, method='POST', body={'content_type': 'image/png'})
    headers = [f'{k}: {v}' for k, v in (slot.get('upload_headers') or {}).items()]
    code, text = curl(slot['upload_url'], method='PUT', headers=headers, upload=PICTURES / path)  # (no key: storage)
    if code >= 400:
        raise RuntimeError(f'upload of {path} failed: HTTP {code} {text[:300]}')
    cache[path] = slot['public_url']
    return cache[path]


def video_url(result):
    """The finished video's URL in a request's result (it is at video.url; else any .mp4/.mov URL in it)."""
    if isinstance(result.get('video'), dict) and result['video'].get('url'):
        return result['video']['url']
    found = re.findall(r'https?://[^"\s]+?\.(?:mp4|mov)(?:\?[^"\s]*)?', json.dumps(result))
    return found[0] if found else None


def log(entry):
    with LOG.open('a', encoding='utf-8') as f:
        f.write(json.dumps(dict(entry, time=time.strftime('%Y-%m-%d %H:%M:%S')), ensure_ascii=False) + '\n')


def make(clips, key, resolution, duration=None):
    OUT.mkdir(parents=True, exist_ok=True)
    cache = {}
    waiting = []
    for c in clips:  # send them all, then wait for them together
        body = {'image_url': upload(c['start'], key, cache), 'prompt': c['prompt'], 'duration': duration or c['seconds'],
                'resolution': resolution, 'generate_audio': False}
        if c['end']:
            body['end_image_url'] = upload(c['end'], key, cache)
        sent = call(f'{API}/{MODEL}', key, method='POST', body=body, headers=[f'Idempotency-Key: {uuid.uuid4()}'])
        print(f"{c['name']}: sent ({sent.get('request_id')})")
        log({'clip': c['name'], 'request_id': sent.get('request_id'), 'status': sent.get('status'), 'resolution': resolution,
             'duration': body['duration']})
        waiting.append((c, sent.get('status_url') or f"{API}/requests/{sent['request_id']}/status", sent.get('request_id')))
    made, problems = [], []
    while waiting:
        time.sleep(10)
        for item in list(waiting):
            c, status_url, request_id = item
            result = call(status_url, key)
            status = result.get('status')
            if status not in DONE:
                continue
            waiting.remove(item)
            url = video_url(result) if status == 'completed' else None
            if not url:
                problems.append(f"{c['name']}: {status} {json.dumps(result)[:300]}")
                log({'clip': c['name'], 'request_id': request_id, 'status': status})
                continue
            got = OUT / f"{c['name']}.download.mp4"
            code, _ = curl(url, out=got)
            if code >= 400 or not got.exists() or got.stat().st_size < 1000:
                problems.append(f"{c['name']}: download failed (HTTP {code})")
                continue
            encode(got, OUT / f"{c['name']}.mp4")  # as the game plays it (H.264, no sound)
            got.unlink()
            made.append(c['name'])
            log({'clip': c['name'], 'request_id': request_id, 'status': status, 'file': f"game assets/video/{c['name']}.mp4"})
            print(f"{c['name']}: made, {(OUT / (c['name'] + '.mp4')).stat().st_size / 1e6:.1f} MB")
    return made, problems


def main(args):
    if args[:1] == ['--index']:
        write_index()
        return
    if args[:1] == ['--todo']:
        write_todo(load_clips())
        return
    if args[:1] == ['--import']:
        known = {c['name']: c for c in load_clips()}
        gemini = '--gemini' in args
        rest = [a for a in args[1:] if a != '--gemini']
        as_name = rest[rest.index('--as') + 1] if '--as' in rest else None
        skip = set(rest[rest.index('--skip') + 1:]) if '--skip' in rest else set()
        paths = [a for a in rest[:rest.index('--skip')] if '--skip' in rest] if '--skip' in rest else rest
        paths = [a for i, a in enumerate(paths) if a != '--as' and (i == 0 or paths[i - 1] != '--as')]
        import_clips(paths, known, as_name, skip, gemini)
        write_todo(load_clips())
        return
    yes, again, every = '--yes' in args, '--again' in args, '--all' in args
    resolution, duration = '1080p', None
    names = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == '--resolution':
            resolution = args[i + 1]
            i += 1
        elif a == '--duration':
            duration = int(args[i + 1])
            i += 1
        elif not a.startswith('--'):
            names.append(a)
        i += 1
    if resolution not in ('480p', '720p', '1080p') or (duration is not None and not 4 <= duration <= 30):
        sys.exit('--resolution is 480p, 720p or 1080p; --duration is 4 to 30 seconds')
    clips = load_clips()
    by_name = {c['name']: c for c in clips}
    unknown = [n for n in names if n not in by_name]
    if unknown:
        sys.exit('No such clip: ' + ', '.join(unknown))
    exists = lambda c: (OUT / f"{c['name']}.mp4").exists()
    if not names and not every:
        for c in clips:
            print(f"{'made   ' if exists(c) else 'not yet'}  {c['name']:<18} {c['seconds']:>2} s  {c['what']}")
        todo = [c for c in clips if not exists(c)]
        seconds = sum(duration or c['seconds'] for c in todo)
        print(f'\n{len(todo)} not made yet: {seconds} s of video, about ${seconds * RATE[0]:.0f}–{seconds * RATE[1]:.0f} at {resolution}.')
        return
    chosen = [by_name[n] for n in names] if names else clips
    chosen = [c for c in chosen if again or not exists(c)]
    if not chosen:
        print('Nothing to make: those clips are made already (--again to remake them).')
        return
    seconds = sum(duration or c['seconds'] for c in chosen)
    print(f"{len(chosen)} clip(s): {', '.join(c['name'] for c in chosen)}")
    print(f'{seconds} s of video at {resolution}, about ${seconds * RATE[0]:.2f}–{seconds * RATE[1]:.2f} from the API balance.')
    if not yes and input('Make them? [y/N] ').strip().lower() != 'y':
        return
    made, problems = make(chosen, load_key(), resolution, duration)
    write_index()
    print(f"\nmade: {len(made)}" + (f" ({', '.join(made)})" if made else ''))
    for p in problems:
        print('problem:', p)


if __name__ == '__main__':
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')
    main(sys.argv[1:])
