#!/usr/bin/env python3
"""The Marathi voice-over (?lan=mr): one clip per line the game says, made with ElevenLabs, into assets/VO-MR/.

  ELEVENLABS_API_KEY=… python3 making/tools/vo_mr_build.py --list            the lines, spoken forms, speakers (no API)
  ELEVENLABS_API_KEY=… python3 making/tools/vo_mr_build.py --make id id …    make these clips
  ELEVENLABS_API_KEY=… python3 making/tools/vo_mr_build.py --make all        make every clip not made yet
  python3 making/tools/vo_mr_build.py --wire                                  write voiceOver.mr into the locales

The lines voiced are the ones the Hindi pack voices (voiceOver.hi): the same keys, in Marathi. A clip is named after
the key the game looks it up by (I18n's _keyOf: the first key, in file order, whose Marathi says that line), so two keys
that say the same words share one clip. Amounts, signs and short forms are written out as they are said (SPOKEN).
Masters (MP3) go to making/vo-mr-masters/, clips (Ogg Opus 32 kbps mono) to assets/VO-MR/. The key is never stored.
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
MASTERS = ROOT / 'making' / 'vo-mr-masters'
CLIPS = ROOT / 'assets' / 'VO-MR'
LOG = MASTERS / 'log.json'
DIR = 'assets/VO-MR/'

MODEL = 'eleven_v3'
VOICES = {  # all Marathi (ElevenLabs voice library)
    'Swifty': 'ObcUVfo3RbQv9i2RBbAe',      # Sayali – warm, clear and welcoming, young female
    'Amit': 'ritE7mWIE55SDe0J11Kk',        # Vardaan – bright, upbeat, young male
    'Father': '1CmdrvPq0GFHIvBb1M4Z',      # Raghav – clear and warm, middle-aged male
    'Shopkeeper': 'Xy2k22lbbOX8fqfkkHWb',  # Sharad – clear and confident, middle-aged male
}

# How a line is said, where the screen shows figures, signs or short forms (by the clip's key).
SPOKEN = {
    'askPrice': 'हे आठशे रुपयांना आहे!',
    'subShock': 'अरे! यावर छापलेली किंमत तर एक हजार रुपये आहे.',
    'mpqSaid': 'बरोबर! पुस्तकावर छापलेली किंमत, एक हजार रुपये, हीच त्याची छापील किंमत आहे.',
    'revealPart1': 'बघ, पुस्तकावर छापलेली किंमत एक हजार रुपये आहे,',
    'revealPart2': 'पण मी ते तुला आठशे रुपयांना विकतोय.',
    'dqHint': 'थोडे चुकले! आठशे रुपये ही दुकानदाराची विक्री किंमत आहे.',
    'dqSaid': 'हो! अमितने छापील किमतीपेक्षा दोनशे रुपये कमी दिले.',
    'formulaSo': 'म्हणजे, सूट दोनशे रुपये आहे.',
    'frLetters.0': 'डी म्हणजे सूट, डिस्काउंट,',
    'frLetters.1': 'एम पी म्हणजे छापील किंमत, मार्क्ड प्राइस,',
    'frLetters.2': 'एस पी म्हणजे विक्री किंमत, सेलिंग प्राइस.',
    'frShortSaid.0': 'म्हणजे, डी',
    'frShortSaid.1': 'बरोबर एम पी',
    'frShortSaid.2': 'वजा एस पी.',
    'shoeOff': 'इथे तीस टक्के ऑफ म्हणजे काय?',
    'subConfused': 'याच्या टॅगवर किंमत एक हजार आठशे रुपये आहे.',
    'smqSaid': 'बरोबर! बुटांच्या टॅगवरची किंमत एक हजार आठशे रुपये आहे: हीच त्यांची छापील किंमत.',
    'offMeans.0': 'इथे तीस टक्के ऑफ म्हणजे',
    'offMeans.1': 'तीस टक्के सूट.',
    'subPercentRule': 'ए हे बी चे किती टक्के आहे?',
    'prRoles.0': 'ए म्हणजे भाग,',
    'prRoles.1': 'आणि बी म्हणजे पूर्ण.',
    'percentRuleSaid.2': 'मग शंभरने गुणा.',
    'prSign': 'मग त्यापुढे टक्क्याचे चिन्ह लिहा.',
    'subWhatPercent': 'एकशे पंचवीस हे पाचशेचे किती टक्के आहे?',
    'wpRoles.0': 'एकशे पंचवीस म्हणजे भाग,',
    'wpRoles.1': 'आणि पाचशे म्हणजे पूर्ण.',
    'wpWork': 'एकशे पंचवीस भागिले पाचशे गुणिले शंभर',
    'wpEquals': 'बरोबर पंचवीस टक्के.',
    'wpSo': 'म्हणजे, एकशे पंचवीस हे पाचशेचे पंचवीस टक्के आहे!',
    'subCheck': 'दोनशे पन्नास हे एक हजाराचे किती टक्के आहे?',
    'cfuIsPart': 'दोनशे पन्नास म्हणजे भाग,',
    'cfuIsWhole': 'एक हजार म्हणजे पूर्ण.',
    'cfuSum': 'दोनशे पन्नास भागिले एक हजार गुणिले शंभर बरोबर पंचवीस टक्के.',
    'cfuSo': 'म्हणजे, दोनशे पन्नास हे एक हजाराचे पंचवीस टक्के आहे.',
    'thMeans': 'तीस टक्के म्हणजे',
    'thOutOf100': 'शंभर पैकी तीस.',
    'thOfMp': 'म्हणून, एक हजार आठशे रुपयांचे तीस टक्के बरोबर',
    'thFraction': 'तीस भागिले शंभर, गुणिले एक हजार आठशे',
    'thDivide': 'एक हजार आठशे भागिले शंभर बरोबर अठरा,',
    'thMultiply': 'आणि अठरा गुणिले तीस बरोबर पाचशे चाळीस.',
    'thAnswer': 'म्हणजेच पाचशे चाळीस रुपये!',
    'thDiscountIs': 'म्हणजे, सूट पाचशे चाळीस रुपये आहे.',
    'payWrongMp': 'थोडे चुकले! एम पी या चौकटीत छापील किंमत येते: एक हजार आठशे रुपये.',
    'payWrongD': 'थोडे चुकले! सूट या चौकटीत सूट येते: पाचशे चाळीस रुपये.',
    'payWorkSum': 'एक हजार आठशे रुपये वजा पाचशे चाळीस रुपये',
    'payWorkEquals': 'बरोबर एक हजार दोनशे साठ रुपये.',
    'payWorkSo': 'म्हणजे बुटांसाठी एक हजार दोनशे साठ रुपये द्यावे लागतील!',
    'finalLine.0': 'म्हणजे, तीस टक्के सूट मिळाल्यावर,',
    'finalLine.1': 'मी एक हजार दोनशे साठ रुपये देईन.',
    'subPctOfMp': 'पाचशे चाळीस हे एक हजार आठशेचे किती टक्के आहे?',
    'poRoles.0': 'पाचशे चाळीस म्हणजे भाग,',
    'poRoles.1': 'आणि एक हजार आठशे म्हणजे पूर्ण.',
    'poWork': 'पाचशे चाळीस भागिले एक हजार आठशे गुणिले शंभर',
    'poEquals': 'बरोबर तीस टक्के.',
    'poSo': 'म्हणजे, पाचशे चाळीस हे एक हजार आठशेचे तीस टक्के आहे!',
    'poRule': 'म्हणून, सूट टक्के बरोबर सूट भागिले छापील किंमत गुणिले शंभर.',
    'subPartyMoney': 'हे घे पाच हजार रुपये.',
    'sumShirtBlue': 'निळा शर्ट: एक हजार दोनशे रुपये वजा दोनशे चाळीस रुपये बरोबर नऊशे साठ रुपये.',
    'sumShirtGreen': 'हिरवा शर्ट: एक हजार रुपये वजा एकशे पन्नास रुपये बरोबर आठशे पन्नास रुपये.',
    'sumPantsJeans': 'जीन्स: एक हजार आठशे रुपये वजा पाचशे चाळीस रुपये बरोबर एक हजार दोनशे साठ रुपये.',
    'sumPantsTrousers': 'ट्राउझर: एक हजार सहाशे रुपये वजा तीनशे रुपये बरोबर एक हजार तीनशे रुपये.',
    'sumWatchSilver': 'चंदेरी घड्याळ: दोन हजार रुपये वजा चारशे रुपये बरोबर एक हजार सहाशे रुपये.',
    'sumWatchBrown': 'तपकिरी घड्याळ: एक हजार आठशे रुपये वजा दोनशे पन्नास रुपये बरोबर एक हजार पाचशे पन्नास रुपये.',
    'sumSunglassesBlack': 'काळा गॉगल: एक हजार दोनशे रुपये वजा दोनशे चाळीस रुपये बरोबर नऊशे साठ रुपये.',
    'sumSunglassesBrown': 'तपकिरी गॉगल: नऊशे रुपये वजा नव्वद रुपये बरोबर आठशे दहा रुपये.',
    'rightShirt': 'बरोबर! हिरवा शर्ट एकशे दहा रुपयांनी स्वस्त आहे.',
    'rightPants': 'बरोबर! जीन्स चाळीस रुपयांनी स्वस्त आहे.',
    'rightWatch': 'बरोबर! तपकिरी घड्याळ पन्नास रुपयांनी स्वस्त आहे.',
    'rightSunglasses': 'बरोबर! तपकिरी गॉगल एकशे पन्नास रुपयांनी स्वस्त आहे.',
    'partyTotal|amount=₹4,470': 'एकूण रक्कम: चार हजार चारशे सत्तर रुपये.',
    'partyMoneyLeft|amount=₹530': 'उरलेले पैसे: पाचशे तीस रुपये.',
    'hintShirtBlue': 'थोडे चुकले! सूट आहे एक हजार दोनशे रुपयांचे वीस टक्के.',
    'hintShirtGreen': 'थोडे चुकले! एक हजार रुपयांमधून एकशे पन्नास रुपये कमी करा.',
    'hintPantsJeans': 'थोडे चुकले! सूट आहे एक हजार आठशे रुपयांचे तीस टक्के.',
    'hintPantsTrousers': 'थोडे चुकले! एक हजार सहाशे रुपयांमधून तीनशे रुपये कमी करा.',
    'hintWatchSilver': 'थोडे चुकले! सूट आहे दोन हजार रुपयांचे वीस टक्के.',
    'hintWatchBrown': 'थोडे चुकले! एक हजार आठशे रुपयांमधून दोनशे पन्नास रुपये कमी करा.',
    'hintSunglassesBrown': 'थोडे चुकले! सूट आहे नऊशे रुपयांचे दहा टक्के.',
    'poCheck': 'आता सूट रकमेवरून तीस टक्के कसे येतात ते तपासूया.',
    'mpqWhy': 'पुस्तकावर छापलेली किंमत, एक हजार रुपये, हीच त्याची छापील किंमत आहे.',
    'smqWhy': 'बुटांच्या टॅगवरची किंमत एक हजार आठशे रुपये आहे: हीच त्यांची छापील किंमत.',
    'dqWhy': 'अमितने छापील किमतीपेक्षा दोनशे रुपये कमी दिले.',
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
    mr, en, hi = data['mr'], data['en'], data['voiceOver']['hi']['files']
    key_of = {}
    for key, v in mr.items():  # I18n._build: the first key that says a line is its key
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
        text = text_of(mr, hid)
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
        data=json.dumps({'text': text, 'model_id': MODEL, 'language_code': 'mr',
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


def make(ids, key):
    log = json.loads(LOG.read_text(encoding='utf-8')) if LOG.exists() else {}
    MASTERS.mkdir(parents=True, exist_ok=True)
    CLIPS.mkdir(parents=True, exist_ok=True)
    todo = [e for e in lines() if (ids == ['all'] and e['id'] not in log) or e['id'] in ids]
    for n, e in enumerate(todo, 1):
        if problems(e):
            raise SystemExit(f"{e['id']}: say these in words first: {problems(e)} | {e['spoken']}")
        mp3, credits = tts(e['spoken'], VOICES[e['speaker']], key)
        name = file_name(e['id'])
        master = MASTERS / name.replace('.ogg', '.mp3')
        master.write_bytes(mp3)
        vo_build.make_clip(master, CLIPS / name, serial=abs(hash(e['id'])) % (1 << 31))
        secs = round(vo_build.ogg_seconds((CLIPS / name).read_bytes()), 2)
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
    data['voiceOver']['mr'] = {'dir': DIR, 'files': files}
    LOCALES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'voiceOver.mr: {len(files)} keys, {len(set(f[0] for f in files.values()))} clips')


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
    if args[:1] == ['--wire']:
        wire()
        return
    print(__doc__)


if __name__ == '__main__':
    main(sys.argv[1:])
