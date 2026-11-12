#!/usr/bin/env python3
"""Checks locales/locales.json and writes locales/locales.js from it (the copy the game reads when it is opened from disk,
file://, where a browser won't let a page read the JSON beside it).   python3 making/tools/gen_locales.py

Every language must have exactly English's keys, in English's order, each the same kind (a line, or a list of the same
length: a line said in parts, or a card's lines), with the same {placeholders} and the same tags (<em>, <key>, <hl> …)
as the English. Nothing is written while anything is wrong."""
import json
import os
import re
import sys
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'locales', 'locales.json')
OUT = os.path.join(ROOT, 'locales', 'locales.js')
META = {'defaultLanguage', 'languageLabels', 'supportedLanguages', 'voiceOver'}

PLACE = re.compile(r'\{(\w+)\}')
TAG = re.compile(r'</?([a-z][\w-]*)\s*/?>')


def marks(value):
    """The placeholders and tags a line (or all the items of a list: in a translation they may move from one item to
    another, as the words do) carries."""
    text = ''.join(value) if isinstance(value, list) else value
    return [(Counter(PLACE.findall(text)), Counter(TAG.findall(text)))]


def check(data):
    problems = []
    en = data.get('en')
    if not isinstance(en, dict):
        return ['no "en" language']
    langs = [k for k in data if k not in META]
    for lang in langs:
        d = data[lang]
        if not isinstance(d, dict):
            problems.append(f'{lang}: not an object')
            continue
        if lang == 'en':
            continue
        missing = [k for k in en if k not in d]
        extra = [k for k in d if k not in en]
        if missing:
            problems.append(f'{lang}: missing {len(missing)} keys: {", ".join(missing[:12])}')
        if extra:
            problems.append(f'{lang}: {len(extra)} keys English lacks: {", ".join(extra[:12])}')
        if not missing and not extra and list(d) != list(en):
            problems.append(f'{lang}: keys not in English\'s order')
        for k, e in en.items():
            if k not in d:
                continue
            v = d[k]
            if type(v) is not type(e):
                problems.append(f'{lang}.{k}: a {type(v).__name__}, English has a {type(e).__name__}')
                continue
            if isinstance(e, list) and len(v) != len(e):
                problems.append(f'{lang}.{k}: {len(v)} items, English has {len(e)}')
                continue
            if isinstance(e, (str, list)):
                (pv, tv), (pe, te) = marks(v)[0], marks(e)[0]
                if pv != pe:
                    problems.append(f'{lang}.{k}: placeholders {dict(pv)} ≠ English {dict(pe)}')
                if tv != te:
                    problems.append(f'{lang}.{k}: tags {dict(tv)} ≠ English {dict(te)}')
                for i, s in enumerate(v if isinstance(v, list) else [v]):
                    if not s.strip():
                        problems.append(f'{lang}.{k}' + (f'[{i}]' if isinstance(e, list) else '') + ': empty')
    for lang in data.get('supportedLanguages', {}):
        if lang not in data:
            problems.append(f'supportedLanguages lists "{lang}", which has no words')
    return problems


def main():
    with open(SRC, encoding='utf-8') as f:
        data = json.load(f)
    problems = check(data)
    if problems:
        print('locales.json has problems (locales.js not written):')
        for p in problems:
            print('  -', p)
        sys.exit(1)
    body = json.dumps(data, ensure_ascii=False, indent=2)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('/* Generated from locales/locales.json by making/tools/gen_locales.py: do not edit by hand (edit the JSON, then run\n'
                '   python3 making/tools/gen_locales.py). The game reads this copy when it is opened from disk (file://). */\n')
        f.write('window.GAME_LOCALES = ' + body + ';\n')
    langs = [k for k in data if k not in META]
    print(f'locales.js written: {len(data["en"])} keys in {len(langs)} language(s): {", ".join(langs)}')


if __name__ == '__main__':
    main()
