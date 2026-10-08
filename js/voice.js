/* ==========================================================================
   Bookstore Journey — voices
   The characters speak their lines in Indian English. By default the game uses
   the text-to-speech voices already on the player's device (Web Speech API):
   Rishi on a Mac, Heera / Ravi or Neerja / Prabhat on Windows, the Indian
   English voices on Android and Chromebooks. A recorded line (for example one
   made with an AI voice service) is played instead when it is listed in
   RECORDINGS below.
   ========================================================================== */
(function () {
  'use strict';

  // Recorded lines, by line id: { shock: 'shock.mp3', ... } (files in "game assets/voice/").
  // Line ids: wake, browse, ask, price, hint, def0-title, def0-text, def1-title, def1-text, here, correct, shock,
  // mp-line, mp-term, mp-def, cmp-mp, cmp-sp, cmp-why, reveal-1, reveal-2, reveal-3, disc-2, ddef,
  // f-mp, f-sp, f-d, rule-1, rule-2, rule-3, fr-1 … fr-10, fr-use, sum-0 … sum-4, sneakers, shoe-think, shoe-ask, recall-1, recall-2,
  // idea-1, idea-2, wp-ask, wp-part, wp-whole, wp-rule-1 … wp-rule-3, wp-put-1, wp-put-2,
  // wp-work, wp-equals, wp-so, cfu-ask, cfu-right-1, cfu-right-2, cfu-wrong-1 … cfu-wrong-4, cfu-so,
  // mq-back, mq-ask, mq-right-1, mq-right-2, mq-wrong-1, mq-wrong-2, mq-so, th-1 … th-7,
  // rp-ask, rp-right-1, rp-right-2, rp-wrong-1, rp-wrong-2, rp-so, pay-1, pay-2, pay-try, pay-wrong-mp, pay-wrong-d, pay-3 … pay-5, final-1, final-2,
  // dp-1 … dp-7, ss-0 … ss-4, ss-rule-1 … ss-rule-3, ss-end.
  const RECORDINGS = {};
  const DIR = 'game assets/voice/';

  // How each character sounds: `gender` picks the voice, pitch and rate shape it. A female part played
  // by a male voice is pitched up (pitch + 0.45).
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

  function playFile(src) {
    return new Promise(resolve => {
      const audio = new Audio(src);
      playing = { stop() { audio.pause(); resolve(); } };
      audio.addEventListener('ended', resolve, { once: true });
      audio.addEventListener('error', resolve, { once: true });
      audio.play().catch(resolve);
    });
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

  // Speaks one line as `who` ('boy' | 'man' | 'bird'); resolves when it has finished or was stopped.
  // Silent (resolves at once) while sound effects are off.
  function say(id, text, who = 'boy') {
    stop();
    if (!window.Sound || !Sound.sfxOn || document.hidden) return Promise.resolve();
    const mine = ++token;
    Sound.duck(true, 'voice');
    const run = RECORDINGS[id] ? playFile(DIR + RECORDINGS[id]) : speakText(spoken(text), CAST[who] || CAST.boy);
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
    // Whether anything can be heard: a speech engine with voices, or recorded lines.
    get available() { return (!!synth && voices.length > 0) || Object.keys(RECORDINGS).length > 0; },
  };
})();
