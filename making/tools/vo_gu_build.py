#!/usr/bin/env python3
"""The Gujarati voice-over (?lan=gu): one clip per line the game says, made with ElevenLabs, into assets/VO-GU/.

  ELEVENLABS_API_KEY=… python3 making/tools/vo_gu_build.py --list            the lines, spoken forms, speakers (no API)
  ELEVENLABS_API_KEY=… python3 making/tools/vo_gu_build.py --make id id …    make these clips
  ELEVENLABS_API_KEY=… python3 making/tools/vo_gu_build.py --make all        make every clip not made yet
  python3 making/tools/vo_gu_build.py --retrim                                re-make the clips from the masters, trimmed (no API)
  python3 making/tools/vo_gu_build.py --wire                                  write voiceOver.gu into the locales

The lines voiced are the ones the Hindi pack voices (voiceOver.hi): the same keys, in Gujarati. A clip is named after
the key the game looks it up by (I18n's _keyOf: the first key, in file order, whose Gujarati says that line), so two keys
that say the same words share one clip. Amounts, signs and short forms are written out as they are said (SPOKEN).
Masters (MP3) go to making/vo-gu-masters/, clips (Ogg Opus 32 kbps mono) to assets/VO-GU/. The key is never stored.
"""
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import vo_build  # noqa: E402  (make_clip, ogg_seconds)

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ROOT / 'locales' / 'locales.json'
SCRIPT = ROOT / 'making' / 'tools' / 'vo_script.json'
MASTERS = ROOT / 'making' / 'vo-gu-masters'
CLIPS = ROOT / 'assets' / 'VO-GU'
LOG = MASTERS / 'log.json'
DIR = 'assets/VO-GU/'

MODEL = 'eleven_v3'
VOICES = {  # all Gujarati (ElevenLabs voice library)
    'Swifty': '1wX3DrX9Q7x2fkeiljyg',      # Hetalben – bright, warm, young female (Swiftee and the narrator)
    'Amit': 'd2osXrwa36lUEkuaO4sP',        # Maahir – clear, upbeat, young male
    'Father': 'CSKFkvVtbvixo1staAot',      # Prahlad Rajgor – warm, clear, middle-aged male
    'Shopkeeper': 'UHwU6ReRgTsCs68KHc6C',  # Bhavesh Bhai – warm, expressive, middle-aged male
}

# How a line is said, where the screen shows figures, signs or short forms (by the clip's key).
SPOKEN = {
    'askPrice': 'આઠસો રૂપિયાનું છે!',
    'subShock': 'અરે! એના પર એક હજાર રૂપિયા કિંમત લખેલી છે.',
    'mpqSaid': 'સાચું! પુસ્તક પર લખેલી કિંમત, એક હજાર રૂપિયા, તેની છાપેલી કિંમત છે.',
    'revealPart1': 'જો, પુસ્તક પર એક હજાર રૂપિયા કિંમત લખેલી છે,',
    'revealPart2': 'પણ હું તને એ આઠસો રૂપિયામાં વેચું છું.',
    'dqHint': 'બરાબર નથી! આઠસો રૂપિયા તો દુકાનદારની વેચાણ કિંમત છે.',
    'dqSaid': 'હા! અમિતે છાપેલી કિંમત કરતાં બસો રૂપિયા ઓછા ચૂકવ્યા.',
    'formulaSo': 'એટલે, વળતર બસો રૂપિયા છે.',
    'frLetters.0': 'ડી એટલે વળતર, ડિસ્કાઉન્ટ,',
    'frLetters.1': 'એમ પી એટલે છાપેલી કિંમત, માર્ક્ડ પ્રાઇસ,',
    'frLetters.2': 'એસ પી એટલે વેચાણ કિંમત, સેલિંગ પ્રાઇસ.',
    'frShortSaid.0': 'એટલે, ડી',
    'frShortSaid.1': 'બરાબર એમ પી',
    'frShortSaid.2': 'ઓછા એસ પી.',
    'shoeOff': 'અહીં ત્રીસ ટકા ઑફ એટલે શું?',
    'subConfused': 'એના ટૅગ પર એક હજાર આઠસો રૂપિયા કિંમત લખેલી છે.',
    'smqSaid': 'સાચું! એક હજાર આઠસો રૂપિયા સ્નીકર્સના ટૅગ પર લખેલી કિંમત છે: એ જ તેની છાપેલી કિંમત.',
    'offMeans.0': 'ત્રીસ ટકા ઑફ એટલે',
    'offMeans.1': 'અહીં ત્રીસ ટકા વળતર.',
    'subPercentRule': 'એ, બી ના કેટલા ટકા છે?',
    'prRoles.0': 'એ, ભાગ છે,',
    'prRoles.1': 'અને બી, પૂર્ણ છે.',
    'percentRuleSaid.2': 'પછી સો વડે ગુણો.',
    'prSign': 'પછી તેની પાછળ ટકાનું ચિહ્ન મૂકો.',
    'subWhatPercent': 'એકસો પચ્ચીસ એ પાંચસો ના કેટલા ટકા છે?',
    'wpRoles.0': 'એકસો પચ્ચીસ એ ભાગ છે,',
    'wpRoles.1': 'અને પાંચસો એ પૂર્ણ છે.',
    'wpWork': 'એકસો પચ્ચીસ ભાગ્યા પાંચસો ગુણ્યા સો',
    'wpEquals': 'બરાબર પચ્ચીસ ટકા.',
    'wpSo': 'એટલે, એકસો પચ્ચીસ એ પાંચસો ના પચ્ચીસ ટકા છે!',
    'subCheck': 'બસો પચાસ એ એક હજાર ના કેટલા ટકા છે?',
    'cfuIsPart': 'બસો પચાસ એ ભાગ છે,',
    'cfuIsWhole': 'એક હજાર એ પૂર્ણ છે.',
    'cfuSum': 'બસો પચાસ ભાગ્યા એક હજાર ગુણ્યા સો બરાબર પચ્ચીસ ટકા.',
    'cfuSo': 'એટલે, બસો પચાસ એ એક હજાર ના પચ્ચીસ ટકા છે.',
    'thMeans': 'ત્રીસ ટકા એટલે',
    'thOutOf100': 'સો માંથી ત્રીસ.',
    'thOfMp': 'એટલે, એક હજાર આઠસો રૂપિયાના ત્રીસ ટકા બરાબર',
    'thFraction': 'ત્રીસ ભાગ્યા સો, ગુણ્યા એક હજાર આઠસો',
    'thDivide': 'એક હજાર આઠસો ભાગ્યા સો બરાબર અઢાર,',
    'thMultiply': 'અને અઢાર ગુણ્યા ત્રીસ બરાબર પાંચસો ચાળીસ.',
    'thAnswer': 'એટલે, એ પાંચસો ચાળીસ રૂપિયા થાય!',
    'thDiscountIs': 'એટલે, વળતર પાંચસો ચાળીસ રૂપિયા છે.',
    'payWrongMp': 'બરાબર નથી! એમ પી નું ખાનું છાપેલી કિંમત, એક હજાર આઠસો રૂપિયા, માટે છે.',
    'payWrongD': 'બરાબર નથી! વળતરનું ખાનું વળતરની રકમ, પાંચસો ચાળીસ રૂપિયા, માટે છે.',
    'payWorkSum': 'એક હજાર આઠસો રૂપિયા ઓછા પાંચસો ચાળીસ રૂપિયા',
    'payWorkEquals': 'બરાબર એક હજાર બસો સાઠ રૂપિયા.',
    'payWorkSo': 'એટલે, સ્નીકર્સ માટે એક હજાર બસો સાઠ રૂપિયા ચૂકવવાના!',
    'finalLine.0': 'એટલે, ત્રીસ ટકા વળતર પછી,',
    'finalLine.1': 'હું એક હજાર બસો સાઠ રૂપિયા ચૂકવીશ.',
    'subPctOfMp': 'પાંચસો ચાળીસ એ એક હજાર આઠસો ના કેટલા ટકા છે?',
    'poRoles.0': 'પાંચસો ચાળીસ એ ભાગ છે,',
    'poRoles.1': 'અને એક હજાર આઠસો એ પૂર્ણ છે.',
    'poWork': 'પાંચસો ચાળીસ ભાગ્યા એક હજાર આઠસો ગુણ્યા સો',
    'poEquals': 'બરાબર ત્રીસ ટકા.',
    'poSo': 'એટલે, પાંચસો ચાળીસ એ એક હજાર આઠસો ના ત્રીસ ટકા છે!',
    'poRule': 'એટલે, વળતર ટકા બરાબર વળતર ભાગ્યા છાપેલી કિંમત ગુણ્યા સો.',
    'subPartyMoney': 'આ લે પાંચ હજાર રૂપિયા.',
    'sumShirtBlue': 'વાદળી શર્ટ: એક હજાર બસો રૂપિયા ઓછા બસો ચાળીસ રૂપિયા બરાબર નવસો સાઠ રૂપિયા.',
    'sumShirtGreen': 'લીલો શર્ટ: એક હજાર રૂપિયા ઓછા એકસો પચાસ રૂપિયા બરાબર આઠસો પચાસ રૂપિયા.',
    'sumPantsJeans': 'જીન્સ: એક હજાર આઠસો રૂપિયા ઓછા પાંચસો ચાળીસ રૂપિયા બરાબર એક હજાર બસો સાઠ રૂપિયા.',
    'sumPantsTrousers': 'ટ્રાઉઝર: એક હજાર છસો રૂપિયા ઓછા ત્રણસો રૂપિયા બરાબર એક હજાર ત્રણસો રૂપિયા.',
    'sumWatchSilver': 'સિલ્વર ઘડિયાળ: બે હજાર રૂપિયા ઓછા ચારસો રૂપિયા બરાબર એક હજાર છસો રૂપિયા.',
    'sumWatchBrown': 'કથ્થઈ ઘડિયાળ: એક હજાર આઠસો રૂપિયા ઓછા બસો પચાસ રૂપિયા બરાબર એક હજાર પાંચસો પચાસ રૂપિયા.',
    'sumSunglassesBlack': 'કાળા ગોગલ્સ: એક હજાર બસો રૂપિયા ઓછા બસો ચાળીસ રૂપિયા બરાબર નવસો સાઠ રૂપિયા.',
    'sumSunglassesBrown': 'કથ્થઈ ગોગલ્સ: નવસો રૂપિયા ઓછા નેવું રૂપિયા બરાબર આઠસો દસ રૂપિયા.',
    'rightShirt': 'સાચું! લીલો શર્ટ એકસો દસ રૂપિયા સસ્તો છે.',
    'rightPants': 'સાચું! જીન્સ ચાળીસ રૂપિયા સસ્તું છે.',
    'rightWatch': 'સાચું! કથ્થઈ ઘડિયાળ પચાસ રૂપિયા સસ્તી છે.',
    'rightSunglasses': 'સાચું! કથ્થઈ ગોગલ્સ એકસો પચાસ રૂપિયા સસ્તા છે.',
    'partyTotal|amount=₹4,470': 'કુલ રકમ: ચાર હજાર ચારસો સિત્તેર રૂપિયા.',
    'partyMoneyLeft|amount=₹530': 'બચેલા પૈસા: પાંચસો ત્રીસ રૂપિયા.',
    'hintShirtBlue': 'બરાબર નથી! વળતર એક હજાર બસો રૂપિયાના વીસ ટકા છે.',
    'hintShirtGreen': 'બરાબર નથી! એક હજાર રૂપિયામાંથી એકસો પચાસ રૂપિયા ઓછા કરો.',
    'hintPantsJeans': 'બરાબર નથી! વળતર એક હજાર આઠસો રૂપિયાના ત્રીસ ટકા છે.',
    'hintPantsTrousers': 'બરાબર નથી! એક હજાર છસો રૂપિયામાંથી ત્રણસો રૂપિયા ઓછા કરો.',
    'hintWatchSilver': 'બરાબર નથી! વળતર બે હજાર રૂપિયાના વીસ ટકા છે.',
    'hintWatchBrown': 'બરાબર નથી! એક હજાર આઠસો રૂપિયામાંથી બસો પચાસ રૂપિયા ઓછા કરો.',
    'hintSunglassesBrown': 'બરાબર નથી! વળતર નવસો રૂપિયાના દસ ટકા છે.',
    'poCheck': 'ચાલો, વળતરની રકમ પરથી ત્રીસ ટકા કેવી રીતે આવે તે ચકાસીએ.',
    'mpqWhy': 'પુસ્તક પર લખેલી કિંમત, એક હજાર રૂપિયા, તેની છાપેલી કિંમત છે.',
    'smqWhy': 'એક હજાર આઠસો રૂપિયા સ્નીકર્સના ટૅગ પર લખેલી કિંમત છે: એ જ તેની છાપેલી કિંમત.',
    'dqWhy': 'અમિતે છાપેલી કિંમત કરતાં બસો રૂપિયા ઓછા ચૂકવ્યા.',
}


def norm(text):
    return re.sub(r'\s+', ' ', re.sub(r'[{}*]', '', re.sub(r'<[^<>]*>', '', str(text)))).strip()


def plains(val):
    """I18n._plains: the whole line, and each part of a line in parts (the parts normalised alone)."""
    if isinstance(val, list):
        return norm(' '.join(map(str, val))), [norm(v) for v in val]
    return norm(val), []


def lines():
    """[{id, files: [hi ids], text, spoken, speaker}] — one per clip, in the Hindi pack's order."""
    data = json.loads(LOCALES.read_text(encoding='utf-8'))
    gu, en, hi = data['gu'], data['en'], data['voiceOver']['hi']['files']
    key_of = {}
    for key, v in gu.items():  # I18n._build: the first key that says a line is its key
        if not isinstance(v, (str, list)) or re.search(r'\{\w+\}', json.dumps(v, ensure_ascii=False)):
            continue
        whole, parts = plains(v)
        key_of.setdefault(whole, key)
        for i, p in enumerate(parts):
            key_of.setdefault(p, f'{key}.{i}')
    script = json.loads(SCRIPT.read_text(encoding='utf-8'))
    speaker_of = {norm(e['line']): e['speaker'] for e in script}

    def text_of(lang, hid):
        base, *fills = hid.split('|')
        name, _, idx = base.partition('.')
        v = lang.get(base)
        if v is None:
            v = lang[name][int(idx)]
        for f in fills:
            a, b = f.split('=', 1)
            v = v.replace('{' + a + '}', b)
        return norm(v)

    out = {}
    for hid in hi:
        text = text_of(gu, hid)
        cid = key_of.get(text, hid)
        e = out.get(cid)
        if not e:
            e = out[cid] = {'id': cid, 'files': [], 'text': text,
                            'spoken': SPOKEN.get(cid, text),
                            'speaker': speaker_of.get(text_of(en, hid), 'Swifty')}
        e['files'].append(hid)
    return list(out.values())


def file_name(cid):
    return re.sub(r'[^\w.]+', '_', cid.replace('₹', '')).strip('_') + '.ogg'


def problems(e):
    """Figures, signs or Latin letters left in what the voice is sent."""
    return re.findall(r'[0-9₹%=×÷−+/A-Za-z]+', e['spoken'])


def tts(text, voice, key):
    req = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128',
        data=json.dumps({'text': text, 'model_id': MODEL, 'language_code': 'gu',
                         'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8}}).encode(),
        headers={'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return r.read(), int(r.headers.get('x-character-count') or len(text))
        except urllib.error.HTTPError as err:
            body = err.read().decode('utf-8', 'replace')
            if err.code in (429, 500, 502, 503) and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise SystemExit(f'ElevenLabs {err.code}: {body}')


def trimmed(mp3, out_wav):
    """The master as WAV, without the silence (and stray end click) eleven_v3 leaves after the words: the speech runs
    to the last loud 50 ms, then on while it fades, then 0.2 s more. Lead-in silence is cut to 0.1 s."""
    import array
    import subprocess
    import wave
    subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16', str(mp3), str(out_wav)], check=True)
    with wave.open(str(out_wav)) as w:
        params, rate, ch = w.getparams(), w.getframerate(), w.getnchannels()
        a = array.array('h', w.readframes(w.getnframes()))
    win = rate // 20 * ch
    env = [max(map(abs, a[i:i + win])) for i in range(0, len(a), win)]
    loud = [i for i, e in enumerate(env) if e > 3000]
    if not loud:
        return
    while len(loud) > 1:  # a click alone at the end (≤ 0.15 s, after ≥ 0.8 s of quiet) is not speech
        tail = [i for i in loud if i > loud[-1] - 4]
        before = [i for i in loud if i <= loud[-1] - 4]
        if not before or tail[0] - before[-1] < 16 or any(e > 600 for e in env[before[-1] + 3:tail[0] - 1]):
            break
        loud = before
    end = loud[-1]
    while end + 1 < len(env) and env[end + 1] > 600:
        end += 1
    start = max(0, loud[0] - 2)
    a = a[start * win:min(len(a), (end + 1) * win + rate // 5 * ch)]
    with wave.open(str(out_wav), 'wb') as w:
        w.setparams(params)
        w.writeframes(a.tobytes())


def encode(e_id, master):
    import tempfile
    name = file_name(e_id)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / 'clip.wav'
        trimmed(master, wav)
        vo_build.make_clip(wav, CLIPS / name, serial=abs(hash(e_id)) % (1 << 31))
    return round(vo_build.ogg_seconds((CLIPS / name).read_bytes()), 2)


def retrim():
    """Re-make every clip from its master with trimmed(), and record the new lengths (no API)."""
    log = json.loads(LOG.read_text(encoding='utf-8'))
    for cid, row in log.items():
        before = row['seconds']
        row['seconds'] = encode(cid, MASTERS / file_name(cid).replace('.ogg', '.mp3'))
        if before - row['seconds'] > 0.5:
            print(f'{cid}: {before}s -> {row["seconds"]}s')
    LOG.write_text(json.dumps(log, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def make(ids, key):
    log = json.loads(LOG.read_text(encoding='utf-8')) if LOG.exists() else {}
    MASTERS.mkdir(parents=True, exist_ok=True)
    CLIPS.mkdir(parents=True, exist_ok=True)
    todo = [e for e in lines() if (ids == ['all'] and e['id'] not in log) or e['id'] in ids]
    for n, e in enumerate(todo, 1):
        if problems(e):
            raise SystemExit(f"{e['id']}: say these in words first: {problems(e)} | {e['spoken']}")
        mp3, credits = tts(e['spoken'], VOICES[e['speaker']], key)
        master = MASTERS / file_name(e['id']).replace('.ogg', '.mp3')
        master.write_bytes(mp3)
        secs = encode(e['id'], master)
        log[e['id']] = {'speaker': e['speaker'], 'spoken': e['spoken'], 'credits': credits, 'seconds': secs}
        LOG.write_text(json.dumps(log, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f"[{n}/{len(todo)}] {e['id']} ({e['speaker']}) {secs}s {credits}cr  {e['spoken']}")


def wire():
    data = json.loads(LOCALES.read_text(encoding='utf-8'))
    files = {}
    for e in lines():
        clip = CLIPS / file_name(e['id'])
        if not clip.exists():
            print('no clip yet:', e['id'])
            continue
        secs = round(vo_build.ogg_seconds(clip.read_bytes()), 2)
        for hid in [e['id']] + e['files']:
            files[hid] = [clip.name, secs]
    data['voiceOver']['gu'] = {'dir': DIR, 'files': files}
    LOCALES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'voiceOver.gu: {len(files)} keys, {len(set(f[0] for f in files.values()))} clips')


def main(args):
    if args[:1] == ['--list']:
        for e in lines():
            print(f"{e['id']} [{e['speaker']}] {e['spoken']}" + (f"  !! {problems(e)}" if problems(e) else ''))
        return
    if args[:1] == ['--make']:
        key = os.environ.get('ELEVENLABS_API_KEY')
        if not key:
            raise SystemExit('set ELEVENLABS_API_KEY')
        make(args[1:], key)
        return
    if args[:1] == ['--retrim']:
        retrim()
        return
    if args[:1] == ['--wire']:
        wire()
        return
    print(__doc__)


if __name__ == '__main__':
    main(sys.argv[1:])
