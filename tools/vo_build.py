#!/usr/bin/env python3
"""Builds the game's voice clips and their map, from the TTS studio's downloads. See docs/VOICEOVER.md.

  python3 tools/vo_build.py voiceovers_batch.zip [more.zip …]   make the clips, then the map
  python3 tools/vo_build.py                                      just regenerate the map (and the docs table)
  python3 tools/vo_build.py --xlsx vo012 vo040                   write studio sheets for these lines (one per voice)
  python3 tools/vo_build.py --log studio-log.json [more …]       record the Devanagari the studio sent to the voice
  python3 tools/vo_build.py --check                              check every clip: Devanagari, pace, the files
  python3 tools/vo_build.py --renumber                           ids in script order (as first heard), clips renamed

Clips are Ogg Opus, 32 kbps, mono, in "assets/vo/" (one per voiced line, nothing else). With ffmpeg they are
made by ffmpeg; without it (macOS), afconvert writes the Opus packets into a CAF file and this script copies them
into an Ogg file (RFC 7845), nothing re-encoded. Safe to run again: it only ever rebuilds what it is given.
Standard library only.
"""
import json
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
import zlib
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / 'tools' / 'vo_script.json'
CLIPS = ROOT / 'assets' / 'vo'
MAP = ROOT / 'js' / 'vo_lines.js'
DOC = ROOT / 'docs' / 'VOICEOVER.md'
VOICES = {
    'Swifty': 'Female Teacher (Standard)',  # Gemini voice Kore
    'Aniket': 'Male Child (Energetic)',     # Puck
    'Shopkeeper': 'Male Teacher (Formal)',  # Charon
    'Father': 'Male Senior (Pedagogical)',  # Fenrir
}
BITRATE = 32000


# ---------- the script ----------

def load_script():
    return json.loads(SCRIPT.read_text(encoding='utf-8'))


def save_script(script):
    SCRIPT.write_text(json.dumps(script, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


# ---------- MP3 → Ogg Opus ----------

def _crc_entry(i):
    crc = i << 24
    for _ in range(8):
        crc = ((crc << 1) ^ 0x04C11DB7) if crc & 0x80000000 else crc << 1
    return crc & 0xFFFFFFFF


_CRC = [_crc_entry(i) for i in range(256)]


def _ogg_crc(data):
    """Ogg's page checksum: CRC-32, polynomial 0x04C11DB7, not reflected, starting from 0."""
    crc = 0
    for byte in data:
        crc = ((crc << 8) & 0xFFFFFFFF) ^ _CRC[(crc >> 24) ^ byte]
    return crc


def _ogg_page(packets, granule, serial, seq, flags=0):
    lacing = []
    for p in packets:
        lacing += [255] * (len(p) // 255) + [len(p) % 255]
    header = struct.pack('<4sBBqIIIB', b'OggS', 0, flags, granule, serial, seq, 0, len(lacing)) + bytes(lacing)
    page = bytearray(header + b''.join(packets))
    page[22:26] = struct.pack('<I', _ogg_crc(page))
    return bytes(page)


def _opus_samples(packet):
    """Samples (at 48 kHz) in one Opus packet, from its TOC byte (RFC 6716, 3.1)."""
    toc = packet[0]
    config = toc >> 3
    if config < 12:
        size = (480, 960, 1920, 2880)[config % 4]
    elif config < 16:
        size = (480, 960)[config % 2]
    else:
        size = (120, 240, 480, 960)[config % 4]
    code = toc & 3
    frames = 1 if code == 0 else 2 if code in (1, 2) else packet[1] & 0x3F
    return size * frames


def caf_to_ogg(caf, serial):
    """The Opus packets of a CAF file, in an Ogg Opus file. Granule positions and the pre-skip count at 48 kHz
    (scaled from the CAF's rate); the last page's granule is the last valid sample, so the padding is trimmed."""
    chunks, i = {}, 8
    while i < len(caf):
        kind, size = caf[i:i + 4], struct.unpack('>q', caf[i + 4:i + 12])[0]
        body = caf[i + 12:] if size < 0 else caf[i + 12:i + 12 + size]
        chunks[kind] = body
        if size < 0:
            break
        i += 12 + size
    rate, fmt, _, _, _, channels, _ = struct.unpack('>d4sIIIII', chunks[b'desc'][:32])
    if fmt != b'opus':
        raise ValueError(f'not Opus: {fmt!r}')
    count, valid, priming, _ = struct.unpack('>qqii', chunks[b'pakt'][:24])
    sizes, pos, table = [], 24, chunks[b'pakt']
    for _ in range(count):
        n = 0
        while True:
            b = table[pos]
            pos += 1
            n = (n << 7) | (b & 0x7F)
            if not b & 0x80:
                break
        sizes.append(n)
    data, packets, at = chunks[b'data'][4:], [], 0  # skip the edit count
    for n in sizes:
        packets.append(data[at:at + n])
        at += n
    scale = 48000 / rate
    preskip = round(priming * scale)
    end = preskip + round(valid * scale)
    head = b'OpusHead' + struct.pack('<BBHIhB', 1, channels, preskip, int(rate), 0, 0)
    vendor = b'tools/vo_build.py (Opus from afconvert)'
    tags = b'OpusTags' + struct.pack('<I', len(vendor)) + vendor + struct.pack('<I', 0)
    pages = [_ogg_page([head], 0, serial, 0, flags=2), _ogg_page([tags], 0, serial, 1)]
    seq, granule, page, segments = 2, 0, [], 0
    for k, p in enumerate(packets):
        need = len(p) // 255 + 1
        if page and segments + need > 255:
            pages.append(_ogg_page(page, granule, serial, seq))
            seq, page, segments = seq + 1, [], 0
        page.append(p)
        segments += need
        granule += _opus_samples(p)
    pages.append(_ogg_page(page, min(granule, end), serial, seq, flags=4))
    return b''.join(pages)


def ogg_seconds(ogg):
    """Playing time of an Ogg Opus file: (last granule − pre-skip) / 48000."""
    preskip = struct.unpack('<H', ogg[ogg.index(b'OpusHead') + 10:][:2])[0]
    last = ogg.rindex(b'OggS')
    granule = struct.unpack('<q', ogg[last + 6:last + 14])[0]
    return (granule - preskip) / 48000


def make_clip(mp3, ogg, serial):
    if shutil.which('ffmpeg'):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(mp3), '-ac', '1', '-c:a', 'libopus', '-b:a', '32k', str(ogg)], check=True)
        return
    with tempfile.TemporaryDirectory() as tmp:
        caf = Path(tmp) / 'clip.caf'
        subprocess.run(['afconvert', '-f', 'caff', '-d', 'opus', '-c', '1', '-b', str(BITRATE), str(mp3), str(caf)], check=True)
        ogg.write_bytes(caf_to_ogg(caf.read_bytes(), serial))


def build_from_zips(zips, script):
    ids = {e['id'] for e in script}
    CLIPS.mkdir(parents=True, exist_ok=True)
    made = []
    with tempfile.TemporaryDirectory() as tmp:
        for z in zips:
            with zipfile.ZipFile(z) as archive:
                for name in archive.namelist():
                    m = re.fullmatch(r'(?:.*/)?(vo\d{3})\.mp3', name)
                    if not m or m[1] not in ids:
                        continue
                    mp3 = Path(tmp) / f'{m[1]}.mp3'
                    mp3.write_bytes(archive.read(name))
                    make_clip(mp3, CLIPS / f'{m[1]}.ogg', serial=int(m[1][2:]))
                    made.append(m[1])
    for e in script:  # a clip made again: its Devanagari is only known if a log of that run is read in (--log)
        if e['id'] in made:
            e.pop('devanagari', None)
    return made


# ---------- the map, the docs table, the clean-up ----------

def write_map(script):
    rows, seconds = [], {}
    for e in script:
        clip = CLIPS / f"{e['id']}.ogg"
        if clip.exists():
            seconds[e['id']] = round(ogg_seconds(clip.read_bytes()), 2)
            rows.append(f"  {json.dumps(e['line'], ensure_ascii=False)}: [{json.dumps(e['id'])}, {seconds[e['id']]}],")
    MAP.write_text(
        '// Generated by tools/vo_build.py from tools/vo_script.json. Do not edit by hand: see docs/VOICEOVER.md.\n'
        '// Each line exactly as the game shows it (highlight marks left out, line breaks as spaces)\n'
        '// → [its clip in "assets/vo/", seconds].\n'
        'const VO_LINES = {\n' + '\n'.join(rows) + '\n};\n', encoding='utf-8')
    return seconds


def write_table(script, seconds):
    if not DOC.exists():
        return
    cell = lambda s: s.replace('|', '\\|')
    lines = ['| Clip | Speaker | Line as shown | Spoken as | Devanagari sent to the voice | Seconds |', '|---|---|---|---|---|---|']
    for e in script:
        spoken = '=' if e['spoken'] == e['line'] else cell(e['spoken'])
        lines.append(f"| {e['id']} | {e['speaker']} | {cell(e['line'])} | {spoken} | {cell(e.get('devanagari', '—'))} | "
                     f"{seconds.get(e['id'], '—')} |")
    doc = DOC.read_text(encoding='utf-8')
    doc = re.sub(r'(<!-- vo-table -->\n).*?(<!-- /vo-table -->)', lambda m: m[1] + '\n'.join(lines) + '\n' + m[2], doc, flags=re.S)
    DOC.write_text(doc, encoding='utf-8')


def clean(script):
    keep = {f"{e['id']}.ogg" for e in script}
    gone = [f.name for f in CLIPS.iterdir() if f.name not in keep] if CLIPS.exists() else []
    for name in gone:
        (CLIPS / name).unlink()
    return gone


def renumber(script):
    """Gives every line the id of its place in the script (the order a player first hears the lines: vo001, vo002 …)
    and renames its clip to match. Clips no line uses are deleted first; the renaming goes through temporary names,
    so no clip is ever written over by another."""
    clean(script)
    moves = []
    for k, e in enumerate(script, 1):
        new = f'vo{k:03d}'
        if e['id'] != new:
            moves.append((e['id'], new))
            e['id'] = new
    for old, new in moves:
        if (CLIPS / f'{old}.ogg').exists():
            (CLIPS / f'{old}.ogg').rename(CLIPS / f'{old}.to-{new}')
    for old, new in moves:
        if (CLIPS / f'{old}.to-{new}').exists():
            (CLIPS / f'{old}.to-{new}').rename(CLIPS / f'{new}.ogg')
    return moves


# ---------- studio sheets, logs, checks ----------

def write_xlsx(path, rows):
    col = lambda i: chr(65 + i)
    sheet = ''.join(
        f'<row r="{r}">' + ''.join(f'<c r="{col(c)}{r}" t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>'
                                   for c, v in enumerate(row)) + '</row>'
        for r, row in enumerate(rows, 1))
    parts = {
        '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        'xl/worksheets/sheet1.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + sheet + '</sheetData></worksheet>',
    }
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in parts.items():
            z.writestr(name, data)


def export_xlsx(ids, script):
    chosen = [e for e in script if e['id'] in ids]
    for speaker, voice in VOICES.items():
        rows = [[e['id'], e['spoken']] for e in chosen if e['speaker'] == speaker]
        if rows:
            name = f'vo_batch_{speaker.lower()}.xlsx'
            write_xlsx(name, [['filename', 'text']] + rows)
            print(f'{name}: {len(rows)} rows. In the studio: Batch Generation, Language Hindi, Format .MP3, Voice {voice}, '
                  f'Text Column text, Filename Column filename, Start Row 1, Quantity {len(rows)}, Concurrency 3 (Recommended).')


def read_logs(logs, script):
    """The Devanagari each line was rewritten into (the script call's reply), from the studio runs' logs."""
    by_spoken = {e['spoken']: e for e in script}
    found = set()
    for log in logs:
        for entry in json.loads(Path(log).read_text(encoding='utf-8')):
            if entry.get('status') != 200 or not entry.get('text') or 'tts' in (entry.get('model') or ''):
                continue
            try:
                prompt = json.loads(entry['request'])['contents'][0]['parts'][0]['text']
            except (ValueError, KeyError, IndexError, TypeError):
                continue
            m = re.search(r'Input Text: (.*?)\n\s*Source Language:', prompt, re.S)
            e = m and by_spoken.get(m[1].strip())
            if e:
                e['devanagari'] = entry['text'].strip()
                found.add(e['id'])
    return len(found)


HINDI_NUMBERS = set('''एक दो तीन चार पाँच पांच छह छः छे सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह पन्द्रह सोलह सत्रह अठारह उन्नीस बीस
इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस
चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरेपन चौवन पचपन छप्पन
सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर
छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानवे बानवे
तिरानवे चौरानवे पचानवे छियानवे सत्तानवे अट्ठानवे निन्यानवे सौ हज़ार हजार लाख करोड़'''.split())
# Common Hindi words: an English word translated, rather than written out in Devanagari.
HINDI_WORDS = set('''है हैं था थी थे का की के को में से और या यह ये वह वे क्या कितना कितनी कितने कीमत मूल्य दाम छूट लागत विक्रय
अंकित बराबर घटा घटाओ गुणा भाग जोड़ बाकी हम आप मैं तुम नहीं अब तो फिर लेकिन पर जो किताब पुस्तक जूते दुकानदार सही गलत प्रतिशत
रुपये रुपए रुपया सूत्र याद देखो चलो बहुत अच्छा नया पैसा पैसे'''.split())


def check(script):
    problems = 0
    for e in script:
        clip = CLIPS / f"{e['id']}.ogg"
        notes = []
        if not clip.exists():
            notes.append('no clip')
        else:
            secs = ogg_seconds(clip.read_bytes())
            pace = len(e['spoken']) / secs if secs else 0
            if not 6 <= pace <= 22:
                notes.append(f'pace {pace:.1f} characters/s over {secs:.2f} s')
        dev = e.get('devanagari')
        if dev:
            words = re.findall(r'[ऀ-ॿ]+', dev)
            nums = [w for w in words if w in HINDI_NUMBERS]
            hindi = [w for w in words if w in HINDI_WORDS]
            if nums:
                notes.append('Hindi number words: ' + ' '.join(nums))
            if hindi:
                notes.append('translated words: ' + ' '.join(hindi))
            if re.search(r'[0-9०-९]', dev):
                notes.append('digits')
        else:
            notes.append('Devanagari not recorded')
        if notes:
            problems += 1
            print(f"{e['id']} ({e['speaker']}): {'; '.join(notes)} | {e['spoken']} | {dev or ''}")
    print('clean' if not problems else f'{problems} line(s) to look at')
    return problems


def main(args):
    script = load_script()
    if args[:1] == ['--xlsx']:
        export_xlsx(set(args[1:]), script)
        return
    if args[:1] == ['--check']:
        sys.exit(1 if check(script) else 0)
    if args[:1] == ['--renumber']:
        moves = renumber(script)
        print(f'{len(moves)} line(s) given a new id' + (f': {moves[0][0]} → {moves[0][1]} …' if moves else ''))
        save_script(script)
        args = []
    if args[:1] == ['--log']:
        print(f'{read_logs(args[1:], script)} line(s) given their Devanagari')
        save_script(script)
        args = []
    if args:
        made = build_from_zips([Path(a) for a in args], script)
        print(f'{len(made)} clip(s) made: {" ".join(sorted(made))}')
        save_script(script)
    seconds = write_map(script)
    write_table(script, seconds)
    gone = clean(script)
    if gone:
        print('removed (no line uses them):', ' '.join(gone))
    missing = [e for e in script if e['id'] not in seconds]
    total = sum(seconds.values())
    print(f'{MAP.relative_to(ROOT)}: {len(seconds)} of {len(script)} lines voiced, {total / 60:.1f} min of audio')
    for e in missing:
        print(f"  no clip yet: {e['id']} ({e['speaker']}) {e['line']}")


if __name__ == '__main__':
    # The lines hold ₹ and Devanagari: print them as UTF-8 even where the terminal's own code page can't (Windows).
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')
    main(sys.argv[1:])
