/* ==========================================================================
 * Bookstore Journey — i18n: every word the player reads, by key
 * --------------------------------------------------------------------------
 * Every line lives in locales/locales.json, under one key, in each language
 * the game has ("en" is the source; the others have exactly its keys). The
 * language is chosen by the address:
 *
 *     index.html?lan=hi        Hindi          (?lang=hi works too)
 *     index.html               the file's defaultLanguage (English)
 *
 * A code the file does not have falls back to the default; a key a language
 * lacks falls back to English; a key English lacks shows the key itself (so
 * it can be seen and fixed in the JSON).
 *
 * ---- loading ----
 * index.html loads this file, then I18n.load(), then the game's scripts. On
 * a web server the JSON is read (an edit to it is live at once). Opened from
 * disk (file://) a browser refuses to read it, so the generated copy
 * locales/locales.js (window.GAME_LOCALES) is loaded instead. After editing
 * the JSON, regenerate (and check) that copy:
 *
 *     python3 making/tools/gen_locales.py
 *
 * ---- what a line can hold ----
 *   T('key')                 the line as text
 *   T('key', { amount: x })  {amount} in it filled in
 *   I18n.seg('key')          the line as the game's segments for speech
 *                            bubbles: [{ t }, { t, em: true }, { t, cls }]
 *       <em>₹800</em>        an amount in orange          → { t, em: true }
 *       <key>discount</key>  a word being taught, in red  → { t, cls: 'key' }
 *       <stress>…</stress>, <tone-sp>…</tone-sp>, <part>…</part> …
 *                            any other tag: its name is the segment's class
 *       an array             a line said in parts (one recording each): the
 *                            parts are joined by a space (unless one is there
 *                            already, or a "\n" line break), and each part but
 *                            the last ends its segment list ({ end: true })
 *   I18n.rich('key')         a question card's text: <hl>…</hl> → {…}
 *                            (highlighter), <stress>…</stress> → *…*
 * Translate only the words between the tags; keep the tags, {placeholders},
 * amounts (₹1,200, 30%), sums (250 ÷ 1000 × 100) and short forms (MP, SP, D).
 *
 * ---- the voice-over ----
 * The recordings (js/vo_lines.js) are found by the ENGLISH words of a line.
 * So every line of the chosen language is remembered against its English
 * (I18n.source): a Hindi line on the screen still plays the English recording
 * of the same line, in step, until the language has recordings of its own.
 * Those go under "voiceOver" in the JSON, by the KEY of the line they say
 * (a part of a line in parts: "key.0", "key.1"; a line with an amount filled
 * in: "key|amount=₹4,470"), with their length in seconds:
 *
 *     "voiceOver": { "hi": { "dir": "assets/vo/hi/",
 *                            "files": { "homePlan": ["homePlan.ogg", 5.4] } } }
 *
 * I18n.voice(text) gives { src, seconds } for a line on the screen, or null.
 *
 * ---- static markup ----
 * index.html marks its own words, filled by applyStatic():
 *     data-i18n="key"                      textContent
 *     data-i18n-html="key"                 innerHTML (the JSON's own <br>, <kbd>)
 *     data-i18n-attr="aria-label:key;title:key"   attributes
 * ========================================================================== */
var I18n = (function () {
  'use strict';

  var PARAM = 'lan';                          /* ?lan=hi */
  var PARAM_ALT = 'lang';                     /* …and ?lang=hi */
  var JSON_PATH = 'locales/locales.json';
  var JS_PATH = 'locales/locales.js';         /* generated copy, for file:// */
  /* the file's codes, and what <html lang> says for them where the two differ (Odia is "or" to the browser) */
  var BCP47 = { od: 'or' };
  /* the file's keys that are not languages */
  var META = { defaultLanguage: 1, languageLabels: 1, supportedLanguages: 1, voiceOver: 1 };

  var _data = null;
  var _lang = 'en';
  var _source = Object.create(null);          /* a line of this language (plain) → the same line in English */
  var _keyOf = Object.create(null);           /* a line of this language (plain) → its key (for its recording) */

  /* ---------- which language ---------- */
  function _urlLang() {
    try {
      var p = new URLSearchParams(window.location.search);
      return String(p.get(PARAM) || p.get(PARAM_ALT) || '').trim().toLowerCase();
    } catch (e) { return ''; }
  }
  function _isLang(code) {
    return !!(code && _data && !META[code] && _data[code] && typeof _data[code] === 'object');
  }
  function _pick() {
    var want = _urlLang();
    if (_isLang(want)) return want;
    var def = _data && _data.defaultLanguage;
    if (_isLang(def)) return def;
    return 'en';
  }

  /* ---------- reading a line ---------- */
  /* a line as the voice-over compares it: no tags, no highlight marks, every run of spaces (and line breaks) one space */
  function norm(text) {
    return String(text).replace(/<[^<>]*>/g, '').replace(/[{}*]/g, '').replace(/\s+/g, ' ').trim();
  }
  function _sub(str, repl) {
    if (!repl) return str;
    Object.keys(repl).forEach(function (k) { str = str.split('{' + k + '}').join(String(repl[k])); });
    return str;
  }
  function _raw(lang, key) {
    var dict = (_data && _data[lang]) || {};
    var en = (_data && _data.en) || {};
    if (key in dict) return dict[key];
    if (key in en) return en[key];
    return undefined;
  }
  /* "It’s <em>₹800</em>!" → [{ t: 'It’s ' }, { t: '₹800', em: true }, { t: '!' }] */
  function _parse(str) {
    var out = [];
    var re = /<([a-z][\w-]*)>([\s\S]*?)<\/\1>/g;
    var last = 0;
    var m;
    str = String(str);
    while ((m = re.exec(str))) {
      if (m.index > last) out.push({ t: str.slice(last, m.index) });
      out.push(m[1] === 'em' ? { t: m[2], em: true } : { t: m[2], cls: m[1] });
      last = re.lastIndex;
    }
    if (last < str.length) out.push({ t: str.slice(last) });
    return out;
  }
  /* a value (a string, or an array: a line in parts) → segments */
  function _segments(val, repl) {
    if (!Array.isArray(val)) return _parse(_sub(String(val), repl));
    var out = [];
    var prev = '';
    val.forEach(function (item, i) {
      var text = _sub(String(item), repl);
      var segs = _parse(text);
      if (i > 0 && segs.length && !/\s$/.test(prev) && !/^\s/.test(text)) { // (the space between two parts)
        if (!segs[0].em && !segs[0].cls) segs[0] = { t: ' ' + segs[0].t };
        else segs.unshift({ t: ' ' });
      }
      if (i < val.length - 1 && segs.length) segs[segs.length - 1] = Object.assign({}, segs[segs.length - 1], { end: true });
      out.push.apply(out, segs);
      prev = text;
    });
    return out;
  }
  /* the plain words of a value, whole and part by part */
  function _plains(val) {
    var segs = _segments(val);
    var whole = norm(segs.map(function (s) { return s.t; }).join(''));
    var parts = [];
    if (Array.isArray(val)) {
      var cur = '';
      segs.forEach(function (s) {
        cur += s.t;
        if (s.end) { parts.push(norm(cur)); cur = ''; }
      });
      parts.push(norm(cur));
    }
    return { whole: whole, parts: parts };
  }
  function _note(text, enText, id) {
    if (!text) return;
    if (enText && text !== enText && !(text in _source)) _source[text] = enText;
    if (id && !(text in _keyOf)) _keyOf[text] = id;
  }
  /* every line of the chosen language, against its English and its key */
  function _build() {
    _source = Object.create(null);
    _keyOf = Object.create(null);
    var dict = (_data && _data[_lang]) || {};
    var en = (_data && _data.en) || {};
    Object.keys(dict).forEach(function (key) {
      var v = dict[key];
      var e = en[key];
      if (typeof v !== 'string' && !Array.isArray(v)) return;
      if (/\{\w+\}/.test(JSON.stringify(v))) return; // (a line with something to fill in: noted when it is filled, see t)
      var p = _plains(v);
      var q = (typeof e === 'string' || Array.isArray(e)) ? _plains(e) : { whole: '', parts: [] };
      _note(p.whole, q.whole, key);
      p.parts.forEach(function (part, i) { _note(part, q.parts[i], key + '.' + i); });
    });
  }
  /* a line with something filled in: its English, and its key for a recording ("key|amount=₹4,470") */
  function _noteFilled(key, repl, val) {
    if (!repl) return;
    var enVal = _data && _data.en ? _data.en[key] : undefined;
    var id = key + Object.keys(repl).sort().map(function (k) { return '|' + k + '=' + repl[k]; }).join('');
    var p = _plains(_sub(Array.isArray(val) ? val.join('\n') : String(val), repl));
    var q = enVal === undefined ? null : _plains(_sub(Array.isArray(enVal) ? enVal.join('\n') : String(enVal), repl));
    _note(p.whole, q && q.whole, id);
  }

  /* ---------- the lookup ---------- */
  /* T(key, { name: value }): the line in the current language (an array comes back as a fresh array) */
  function t(key, repl) {
    var val = _raw(_lang, key);
    if (val === undefined) return String(key);
    if (Array.isArray(val)) return val.map(function (v) { return _sub(String(v), repl); });
    if (typeof val !== 'string') return String(key);
    _noteFilled(key, repl, val);
    return _sub(val, repl);
  }
  /* the line as segments for a speech bubble, a hint strip or a sum (see the header) */
  function seg(key, repl) {
    var val = _raw(_lang, key);
    if (val === undefined) return [{ t: String(key) }];
    _noteFilled(key, repl, val);
    return _segments(val, repl);
  }
  /* a question card's text (FX.question, card.flip): <hl>x</hl> → {x}, <stress>x</stress> → *x*; an array: one per line */
  function rich(key, repl) {
    var conv = function (s) {
      return String(s).replace(/<hl>([\s\S]*?)<\/hl>/g, '{$1}').replace(/<stress>([\s\S]*?)<\/stress>/g, '*$1*');
    };
    var val = t(key, repl);
    return Array.isArray(val) ? val.map(conv) : conv(val);
  }
  function has(key) {
    return _raw(_lang, key) !== undefined;
  }
  /* the English of a line on the screen, or the line itself (English already, or never one of ours) */
  function source(text) {
    var n = norm(text);
    return (n in _source) ? _source[n] : String(text);
  }

  /* ---------- the voice-over of a language of its own (see the header) ---------- */
  function _pack() {
    var vo = _data && _data.voiceOver;
    var p = vo && vo[_lang];
    return (p && p.files) ? p : null;
  }
  function hasVoice() { return !!_pack(); }
  /* the recording of a line on the screen in this language: { src, seconds } (seconds may be null), or null */
  function voice(text) {
    var p = _pack();
    if (!p || text == null) return null;
    var id = _keyOf[norm(text)];
    var file = id && p.files[id];
    if (!file) return null;
    var name = Array.isArray(file) ? file[0] : file;
    var seconds = Array.isArray(file) && typeof file[1] === 'number' ? file[1] : null;
    return { src: (p.dir || '') + name + (p.rev ? '?v=' + p.rev : ''), seconds: seconds };
  }

  /* ---------- static markup ---------- */
  function applyStatic(root) {
    root = root || document;
    var each = function (sel, fn) { Array.prototype.forEach.call(root.querySelectorAll(sel), fn); };
    each('[data-i18n]', function (el) {
      var key = el.getAttribute('data-i18n');
      if (has(key)) el.textContent = t(key);
    });
    each('[data-i18n-html]', function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (has(key)) el.innerHTML = t(key);
    });
    each('[data-i18n-attr]', function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var at = pair.indexOf(':');
        if (at < 0) return;
        var attr = pair.slice(0, at).trim();
        var key = pair.slice(at + 1).trim();
        if (attr && has(key)) el.setAttribute(attr, t(key));
      });
    });
  }

  /* ---------- loading ---------- */
  function _readJson(path, cb) {
    var xhr;
    try { xhr = new XMLHttpRequest(); xhr.open('GET', path, true); } catch (e) { return cb(null); }
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status !== 200 && xhr.status !== 0) return cb(null);
      try { cb(JSON.parse(xhr.responseText)); } catch (e) { cb(null); }
    };
    try { xhr.send(); } catch (e) { cb(null); }
  }
  function _readScript(path, cb) {
    if (window.GAME_LOCALES) return cb(window.GAME_LOCALES);
    var s = document.createElement('script');
    s.src = path;
    s.onload = function () { cb(window.GAME_LOCALES || null); };
    s.onerror = function () { cb(null); };
    (document.head || document.documentElement).appendChild(s);
  }
  function _finish(data, cb) {
    _data = data || { defaultLanguage: 'en', en: {} };
    _lang = _pick();
    _build();
    try { document.documentElement.lang = BCP47[_lang] || _lang; } catch (e) { /* (no document) */ }
    if (cb) cb(_lang);
  }
  /* Reads the locale, then calls back with the language's code. The game always starts: with no locale at all, every
     line shows its key. */
  function load(cb) {
    var fromScript = function () {
      _readScript(JS_PATH, function (js) {
        if (!js && window.console) console.warn('[i18n] could not read ' + JSON_PATH + ' or ' + JS_PATH + ': showing keys');
        _finish(js, cb);
      });
    };
    var local = false;
    try { local = window.location.protocol === 'file:'; } catch (e) { /* (no location) */ }
    if (local) return fromScript(); // (a page opened from disk can't read a file beside it: the generated copy)
    _readJson(JSON_PATH, function (json) {
      if (json) return _finish(json, cb);
      fromScript();
    });
  }

  /* ---------- the language, read and changed ---------- */
  function getLang() { return _lang; }
  function getSupportedLanguages() {
    return (_data && _data.supportedLanguages) ? _data.supportedLanguages : {};
  }
  /* the address is the switch: a new language is a reload with ?lan=xx, so every line and clip is made for it from
     the first frame */
  function setLang(code) {
    code = String(code || '').toLowerCase();
    if (!_isLang(code) || code === _lang) return false;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set(PARAM, code);
      url.searchParams.delete(PARAM_ALT);
      window.location.href = url.toString();
      return true;
    } catch (e) { return false; }
  }

  return {
    load: load,
    t: t,
    seg: seg,
    rich: rich,
    has: has,
    norm: norm,
    source: source,
    hasVoice: hasVoice,
    voice: voice,
    applyStatic: applyStatic,
    getLang: getLang,
    setLang: setLang,
    getSupportedLanguages: getSupportedLanguages,
  };
})();

/* T('key'): the line in the current language (the localization skill's short name) */
var T = function (key, repl) { return I18n.t(key, repl); };
