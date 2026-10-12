/* ==========================================================================
   Bookstore Journey — voices
   The characters speak their lines in Indian English, recorded with the TTS
   studio "Ai Wala Human By Aamir": Swifty as Female Teacher (Standard), Aniket
   as Male Child (Energetic), the shopkeeper as Male Teacher (Formal). Each clip
   is found by the exact text its line shows (js/vo_lines.js; see
   docs/VOICEOVER.md). A line without a clip, a browser that can't play Ogg
   Opus, or ?vo=0 in the address uses the text-to-speech voices already on the
   player's device instead (Web Speech API): Rishi on a Mac, Heera / Ravi or
   Neerja / Prabhat on Windows, the Indian English voices on Android and
   Chromebooks.
   ========================================================================== */
(function () {
  'use strict';

  // The recorded lines: { "line as shown": [clip, seconds] } (js/vo_lines.js, made by tools/vo_build.py).
  const LINES = typeof VO_LINES === 'object' ? VO_LINES : {};
  const DIR = 'game assets/vo/';
  const player = new Audio(); // one audio element for every line (tablets only play from one they have unlocked)
  player.preload = 'auto';
  const recorded = !/[?&]vo=0\b/.test(location.search) && !!player.canPlayType('audio/ogg; codecs="opus"');
  // A line's key: its text as shown, without highlight marks ({…}, *…*), line breaks as spaces.
  const key = text => String(text).replace(/[{}*]/g, '').replace(/\s+/g, ' ').trim();
  const clipOf = text => (recorded && LINES[key(text)]) || null;

  // How each character sounds in the device's voice (for a line with no clip): `gender` picks the voice, pitch
  // and rate shape it. A female part played by a male voice is pitched up (pitch + 0.45).
  const CAST = {
    boy: { gender: 'm', pitch: 1.25, rate: 0.92 },  // Aniket
    man: { gender: 'm', pitch: 0.9, rate: 0.88 },   // the shopkeeper
    bird: { gender: 'f', pitch: 1.3, rate: 0.95 },  // Swifty, who also explains every teaching screen
  };

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voices = [];
  const loadVoices = () => { voices = synth ? synth.getVoices() : []; };
  if (synth) {
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);
  }

  const FEMALE = /female|tara|veena|heera|neerja|kajal|lekha|swara|kalpana|aditi|raveena|isha|priya|ananya/i;
  const MALE = /\bmale\b|rishi|aman|ravi|prabhat|hemant|madhur|kunal|aarav/i;
  const better = v => (/natural|neural|online|enhanced|premium|google/i.test(v.name) ? 0 : 1);

  // The best voice for a character: Indian English first (the right gender if there is one),
  // then Hindi voices (they read English with an Indian accent), then any English voice.
  function pick(gender) {
    const enIN = voices.filter(v => /^en[-_]IN/i.test(v.lang));
    const hiIN = voices.filter(v => /^hi[-_]IN/i.test(v.lang));
    const fits = v => (gender === 'f' ? FEMALE.test(v.name) : MALE.test(v.name) && !FEMALE.test(v.name));
    const pools = [enIN.filter(fits), enIN, hiIN.filter(fits), hiIN, voices.filter(v => /^en/i.test(v.lang))];
    const pool = pools.find(p => p.length);
    return pool ? pool.slice().sort((a, b) => better(a) - better(b))[0] : null;
  }

  // A price in front of one of these nouns is read as "200 rupee", like "a 200 rupee discount".
  const RUPEE_BEFORE_NOUN = /₹\s?(\d[\d,]*\d|\d) (?=(?:discount|reduction|book|note|notes|profit|loss|price|item|article|gift)\b)/gi;

  // "It's ₹800!" → "It's 800 rupees!", "D = MP − SP" → "D equals M P minus S P", "₹500 ÷ 2" → "500 rupees
  // divided by 2", "30/100" → "30 over 100", without line breaks or highlight marks.
  function spoken(text) {
    return text
      .replace(/\b(a|an) ₹\s?(\d[\d,]*\d|\d) (?=[a-z])/gi, '$1 $2 rupee ') // "a ₹200 discount" → "a 200 rupee discount"
      .replace(RUPEE_BEFORE_NOUN, '$1 rupee ') // "this ₹200 reduction" → "this 200 rupee reduction"
      .replace(/₹\s?(\d[\d,]*\d|\d)/g, '$1 rupees') // digits (with any 1,000-style commas), not a trailing comma
      .replace(/\b(M|S|C)P\b/g, '$1 P') // the short forms are read letter by letter
      .replace(/\s*=\s*/g, ' equals ')
      .replace(/\s*−\s*/g, ' minus ')
      .replace(/\s*÷\s*/g, ' divided by ')
      .replace(/\s*×\s*/g, ' times ')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 over $2') // a fraction
      .replace(/[{}*]/g, '')
      .replace(/\s*[\n—]\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let token = 0;
  let playing = null; // { stop } for the line being spoken

  // Plays a recorded line on the one player. Resolves when it has ended or was stopped, and at the latest its
  // remaining length + 0.6 s after it starts playing (so a stalled clip never holds the game up). If it can't be
  // played (the file is missing, or play() is refused), `fallback` says the line instead.
  function playClip([id, seconds], fallback) {
    return new Promise(resolve => {
      let over = false;
      let guard = 0;
      const off = () => {
        clearTimeout(guard);
        player.removeEventListener('ended', end);
        player.removeEventListener('error', fail);
        player.removeEventListener('playing', started);
      };
      const end = () => {
        if (over) return;
        over = true;
        off();
        resolve();
      };
      const fail = () => {
        if (over) return;
        over = true;
        off();
        if (playing === line) playing = null;
        fallback().then(resolve);
      };
      const started = () => {
        clearTimeout(guard);
        guard = setTimeout(end, (seconds - player.currentTime) * 1000 + 600);
      };
      const line = { stop() { player.pause(); end(); } };
      playing = line;
      player.addEventListener('ended', end);
      player.addEventListener('error', fail);
      player.addEventListener('playing', started);
      guard = setTimeout(end, seconds * 1000 + 4000); // in case it never starts
      player.muted = false;
      player.src = DIR + id + '.ogg';
      const p = player.play();
      if (p) p.catch(err => { if (err.name !== 'AbortError') fail(); }); // AbortError: stopped before it began
    });
  }

  // Tablets only let a page play audio from an element it started during a tap: on the first tap (or key press)
  // the player plays a clip muted, then stops, which unlocks it for every line after. Then every clip is fetched.
  let unlocked = false;
  function unlock() {
    if (unlocked || !recorded || playing) return;
    const first = Object.values(LINES)[0];
    if (!first) return;
    unlocked = true;
    player.muted = true;
    player.src = DIR + first[0] + '.ogg';
    const p = player.play();
    if (p) {
      p.then(() => {
        if (playing) return; // a line has started meanwhile
        player.pause();
        player.muted = false;
      }, err => {
        if (err.name !== 'AbortError') unlocked = false; // not allowed yet: the next tap tries again
        player.muted = false;
      });
    }
    prefetch();
  }

  // Every clip, fetched quietly one at a time, so each is ready when its line comes (served over http(s);
  // opened as a file, the clips are read straight from the disk).
  let fetched = false;
  async function prefetch() {
    if (fetched || !/^https?:$/.test(location.protocol)) return;
    fetched = true;
    for (const id of new Set(Object.values(LINES).map(([clip]) => clip))) {
      try {
        await (await fetch(DIR + id + '.ogg')).blob();
      } catch (e) { /* that clip loads when its line comes */ }
    }
  }

  function speakText(text, cast) {
    return new Promise(resolve => {
      if (!synth || !text) return resolve();
      const voice = pick(cast.gender);
      const u = new SpeechSynthesisUtterance(text);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = 'en-IN';
      }
      const femaleVoice = voice && FEMALE.test(voice.name);
      u.pitch = cast.gender === 'f' && !femaleVoice ? Math.min(2, cast.pitch + 0.45) : cast.pitch;
      u.rate = cast.rate;
      let done = false;
      const end = () => {
        if (done) return;
        done = true;
        clearTimeout(guard);
        resolve();
      };
      // Some browsers never fire `end` for a dropped line: give up after a generous time.
      const guard = setTimeout(end, 2500 + text.length * 110);
      u.onend = end;
      u.onerror = end;
      playing = { u, stop() { synth.cancel(); end(); } }; // holding on to `u` keeps it from being garbage-collected mid-line
      setTimeout(() => { if (!done) synth.speak(u); }, 40); // right after a cancel(), an immediate speak() can be dropped
    });
  }

  // Speaks one line (`id` names it) as `who` ('boy' | 'man' | 'bird'): its recording, found by its text, or else
  // the device's voice. Resolves when it has finished or was stopped. Silent (resolves at once) while sound
  // effects are off.
  function say(id, text, who = 'boy') {
    stop();
    if (!window.Sound || !Sound.sfxOn || document.hidden) return Promise.resolve();
    const mine = ++token;
    Sound.duck(true, 'voice');
    const device = () => (mine === token ? speakText(spoken(text), CAST[who] || CAST.boy) : Promise.resolve());
    const clip = clipOf(text);
    const run = clip ? playClip(clip, device) : device();
    return run.then(() => { if (mine === token) Sound.duck(false, 'voice'); });
  }

  function stop() {
    token++;
    if (window.Sound) Sound.duck(false, 'voice');
    if (playing) {
      const line = playing;
      playing = null;
      line.stop();
    } else if (synth) {
      synth.cancel();
    }
  }

  window.Voice = {
    say,
    stop,
    unlock,
    // How long a line's recording lasts (seconds) when it is the one that will play; otherwise null.
    seconds(text) {
      const clip = clipOf(text);
      return clip && window.Sound && Sound.sfxOn && !document.hidden ? clip[1] : null;
    },
    // Whether anything can be heard: recorded lines, or a speech engine with voices.
    get available() { return (recorded && Object.keys(LINES).length > 0) || (!!synth && voices.length > 0); },
  };
})();
