/* ==========================================================================
   Bookstore Journey — sound
   Every sound is synthesised with the Web Audio API, so there are no audio
   files to load and it works offline. Browsers only allow sound after the
   player clicks/taps, so game.js calls Sound.unlock() on the first input.
   ========================================================================== */
(function () {
  'use strict';

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const MUSIC_LEVEL = 0.32;
  const DUCKED_LEVEL = 0.1;

  const readPref = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v === '1';
    } catch (e) {
      return fallback;
    }
  };
  const writePref = (key, on) => {
    try { localStorage.setItem(key, on ? '1' : '0'); } catch (e) { /* storage blocked: keep in memory */ }
  };

  const state = { sfx: readPref('bj.sfx', true), music: readPref('bj.music', true), ducked: false };
  const ducks = new Set(); // reasons the music is lowered right now
  let ctx = null;
  let sfxBus, musicBus, noiseBuf;

  const rand = (a, b) => a + Math.random() * (b - a);
  const now = () => ctx.currentTime;

  function init() {
    if (ctx) return true;
    if (!AudioCtx) return false;
    ctx = new AudioCtx();

    // Gentle compressor so overlapping sounds never clip.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 14;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(comp);
    comp.connect(ctx.destination);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = state.sfx ? 1 : 0;
    sfxBus.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // 1 s of white noise
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend();
      else ctx.resume();
    });
    return true;
  }

  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (state.music) music.start();
  }

  // ---------- building blocks ----------

  function route(node, pan, dest) {
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(p);
      p.connect(dest);
    } else {
      node.connect(dest);
    }
  }

  // A gain node with a fast exponential attack and decay.
  function envelope(t, attack, decay, peak) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  function tone({ type = 'sine', f, to, glide, t = now(), attack = 0.005, decay = 0.3, gain = 0.2, pan = 0, dest = sfxBus }) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + (glide || attack + decay));
    const g = envelope(t, attack, decay, gain);
    o.connect(g);
    route(g, pan, dest);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  function noise({ t = now(), attack = 0.002, decay = 0.08, gain = 0.2, filter = 'bandpass', f = 1000, to, glide, q = 1, pan = 0, dest = sfxBus }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const flt = ctx.createBiquadFilter();
    flt.type = filter;
    flt.Q.value = q;
    flt.frequency.setValueAtTime(f, t);
    if (to) flt.frequency.exponentialRampToValueAtTime(to, t + (glide || attack + decay));
    const g = envelope(t, attack, decay, gain);
    src.connect(flt);
    flt.connect(g);
    route(g, pan, dest);
    src.start(t, Math.random() * 0.5, attack + decay + 0.05); // random slice so repeats differ
  }

  // ---------- sound effects ----------

  const effects = {
    // Sneaker on shiny mall tiles: a short tap plus a soft heel thud. `pan` follows the walker.
    step(pan = 0, level = 1) {
      const t = now();
      noise({ t, filter: 'bandpass', f: rand(1500, 2100), q: 1.4, attack: 0.002, decay: 0.05, gain: 0.26 * level, pan });
      noise({ t, filter: 'lowpass', f: 520, q: 0.8, attack: 0.004, decay: 0.09, gain: 0.5 * level, pan });
      tone({ t, f: rand(105, 125), to: 55, attack: 0.003, decay: 0.1, gain: 0.3 * level, pan });
    },
    pop() {
      const t = now();
      tone({ t, f: 280, to: 1250, glide: 0.07, attack: 0.003, decay: 0.14, gain: 0.55 });
      tone({ t: t + 0.01, type: 'triangle', f: 560, to: 1800, glide: 0.06, attack: 0.003, decay: 0.08, gain: 0.14 });
      noise({ t, filter: 'highpass', f: 2500, attack: 0.001, decay: 0.025, gain: 0.22 });
    },
    bloop() {
      tone({ f: 430, to: 860, glide: 0.09, attack: 0.004, decay: 0.15, gain: 0.26 });
    },
    // Tiny "voice" blips while a speech bubble types out.
    blip(voice) {
      if (voice === 'bird') {
        tone({ f: rand(1150, 1450), to: rand(1600, 1900), glide: 0.04, attack: 0.003, decay: 0.05, gain: 0.06 });
        return;
      }
      const boy = voice !== 'man';
      tone({ type: 'triangle', f: boy ? rand(560, 700) : rand(250, 320), attack: 0.004, decay: 0.05, gain: boy ? 0.07 : 0.1 });
    },
    whoosh() {
      noise({ filter: 'bandpass', f: 300, to: 2200, glide: 0.45, q: 0.9, attack: 0.18, decay: 0.42, gain: 0.3 });
    },
    swish() {
      noise({ filter: 'bandpass', f: 900, to: 2400, glide: 0.2, q: 1.2, attack: 0.05, decay: 0.2, gain: 0.12 });
    },
    chime() {
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
        const t = now() + i * 0.075;
        tone({ t, f, attack: 0.004, decay: 0.8, gain: 0.13 });
        tone({ t, type: 'triangle', f: f * 2, attack: 0.003, decay: 0.2, gain: 0.025 });
      });
    },
    ding() {
      const t = now();
      tone({ t, f: 1568, attack: 0.003, decay: 0.7, gain: 0.17 });
      tone({ t, f: 2349, attack: 0.003, decay: 0.45, gain: 0.07 });
      tone({ t, type: 'triangle', f: 3136, attack: 0.002, decay: 0.15, gain: 0.03 });
    },
    sparkle() {
      for (let i = 0; i < 6; i++) {
        tone({ t: now() + i * 0.07 + rand(0, 0.03), f: rand(2400, 4200), attack: 0.003, decay: 0.2, gain: 0.045 });
      }
    },
    kaching() {
      const t = now();
      noise({ t, filter: 'bandpass', f: 3800, q: 2.5, attack: 0.001, decay: 0.05, gain: 0.3 }); // drawer "ka"
      noise({ t: t + 0.03, filter: 'lowpass', f: 900, attack: 0.002, decay: 0.08, gain: 0.25 });
      [2093, 2637, 3136].forEach(f => tone({ t: t + 0.07, f, attack: 0.002, decay: 0.9, gain: 0.07 }));
      [2637, 3520].forEach(f => tone({ t: t + 0.17, f, attack: 0.002, decay: 1.0, gain: 0.07 }));
    },
    click() {
      tone({ type: 'triangle', f: 760, to: 520, glide: 0.05, attack: 0.002, decay: 0.06, gain: 0.14 });
    },
    // Right answer: a quick bright arpeggio with a sparkle on top.
    correct() {
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
        tone({ t: now() + i * 0.06, type: 'triangle', f, attack: 0.004, decay: 0.4, gain: 0.12 });
      });
      effects.sparkle();
    },
    // Swifty: one soft wing beat.
    flap() {
      noise({ filter: 'bandpass', f: 700, to: 380, glide: 0.09, q: 0.8, attack: 0.012, decay: 0.08, gain: 0.09 });
    },
    // Swifty: a happy two-note chirp.
    chirp() {
      const t = now();
      tone({ t, f: 2300, to: 3300, glide: 0.05, attack: 0.004, decay: 0.07, gain: 0.07 });
      tone({ t: t + 0.09, f: 2500, to: 3700, glide: 0.06, attack: 0.004, decay: 0.09, gain: 0.07 });
    },
    // A marker writing on paper: a few quick scratches.
    scribble() {
      const t = now();
      for (let i = 0; i < 5; i++) {
        noise({ t: t + i * 0.06 + rand(0, 0.02), filter: 'bandpass', f: rand(2600, 4200), q: 2.5, attack: 0.004, decay: 0.04, gain: 0.06 });
      }
    },
    // A rubber stamp landing: a low thud with a little slap on top.
    stamp() {
      const t = now();
      tone({ t, f: 150, to: 55, glide: 0.18, attack: 0.003, decay: 0.26, gain: 0.45 });
      noise({ t, filter: 'lowpass', f: 700, attack: 0.002, decay: 0.12, gain: 0.35 });
      noise({ t, filter: 'bandpass', f: 2600, q: 1.4, attack: 0.001, decay: 0.03, gain: 0.2 });
    },
    // A price going down: a falling "whoop".
    drop() {
      const t = now();
      tone({ t, type: 'triangle', f: 880, to: 300, glide: 0.42, attack: 0.01, decay: 0.45, gain: 0.13 });
      noise({ t, filter: 'bandpass', f: 1600, to: 500, glide: 0.4, q: 1.1, attack: 0.04, decay: 0.36, gain: 0.08 });
    },
    // The garden gate: a latch click and a soft creak as it swings open…
    gateOpen() {
      const t = now();
      noise({ t, filter: 'bandpass', f: 3200, q: 3, attack: 0.001, decay: 0.03, gain: 0.25 });
      tone({ t: t + 0.06, type: 'sawtooth', f: 210, to: 290, glide: 0.45, attack: 0.05, decay: 0.42, gain: 0.025 });
      tone({ t: t + 0.06, type: 'triangle', f: 420, to: 560, glide: 0.45, attack: 0.05, decay: 0.4, gain: 0.03 });
    },
    // …and a metal clank as it shuts, with the latch catching.
    gateShut() {
      const t = now();
      noise({ t, filter: 'bandpass', f: 1800, q: 2, attack: 0.001, decay: 0.08, gain: 0.3 });
      tone({ t, type: 'triangle', f: 260, to: 190, glide: 0.1, attack: 0.002, decay: 0.18, gain: 0.12 });
      noise({ t: t + 0.03, filter: 'bandpass', f: 4200, q: 4, attack: 0.001, decay: 0.03, gain: 0.15 });
    },
    // A thought cloud's little puffs popping up: soft "plip"s, each one a little higher (i = 0, 1, 2).
    puff(i = 0) {
      const k = Math.pow(1.26, i);
      tone({ f: 600 * k, to: 980 * k, glide: 0.05, attack: 0.003, decay: 0.1, gain: 0.13 });
    },
    // A curious, rising "hmm?" (Aniket puzzled by a new word).
    wonder() {
      const t = now();
      tone({ t, type: 'triangle', f: 392, to: 523, glide: 0.12, attack: 0.01, decay: 0.2, gain: 0.12 });
      tone({ t: t + 0.18, type: 'triangle', f: 523, to: 880, glide: 0.2, attack: 0.01, decay: 0.32, gain: 0.12 });
    },
    // Comic surprise: a quick rising "zwip!" and a low "bwong".
    shock() {
      const t = now();
      tone({ t, type: 'triangle', f: 420, to: 1600, glide: 0.11, attack: 0.004, decay: 0.14, gain: 0.14 });
      tone({ t: t + 0.11, f: 196, to: 98, glide: 0.5, attack: 0.006, decay: 0.55, gain: 0.32 });
      tone({ t: t + 0.11, type: 'triangle', f: 392, to: 262, glide: 0.45, attack: 0.006, decay: 0.4, gain: 0.07 });
      noise({ t: t + 0.11, filter: 'lowpass', f: 900, attack: 0.002, decay: 0.12, gain: 0.2 });
    },
    // Wrong answer: a soft two-step "buzz", never harsh.
    wrong() {
      const t = now();
      tone({ t, type: 'square', f: 196, to: 160, glide: 0.18, attack: 0.005, decay: 0.2, gain: 0.06 });
      tone({ t: t + 0.18, type: 'square', f: 147, to: 120, glide: 0.22, attack: 0.005, decay: 0.28, gain: 0.06 });
    },
  };

  // ---------- background music: a soft marimba loop (C – G – Am – F …) ----------

  const music = (() => {
    const EIGHTH = 60 / 92 / 2; // 92 BPM
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    // [bass note, chord tones] per bar (MIDI numbers)
    const BARS = [
      [48, [60, 64, 67]], [43, [59, 62, 67]], [45, [60, 64, 69]], [41, [60, 65, 69]],
      [48, [60, 64, 67]], [41, [60, 65, 69]], [43, [59, 62, 67]], [48, [60, 64, 67]],
    ];
    const ARP = [0, 1, 2, 3, 2, 1, 2, 1]; // 3 = root an octave up
    let timer = null;
    let step = 0;
    let next = 0;

    function mallet(f, t, gain) {
      const o = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o.frequency.value = f;
      o2.frequency.value = f * 4; // bright "knock" of the mallet
      const g = envelope(t, 0.004, 0.55, gain);
      const g2 = envelope(t, 0.002, 0.07, gain * 0.35);
      o.connect(g);
      o2.connect(g2);
      g.connect(musicBus);
      g2.connect(musicBus);
      o.start(t);
      o2.start(t);
      o.stop(t + 0.62);
      o2.stop(t + 0.1);
    }

    function bass(f, t) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 500;
      const g = envelope(t, 0.01, 0.5, 0.22);
      o.connect(lp);
      lp.connect(g);
      g.connect(musicBus);
      o.start(t);
      o.stop(t + 0.56);
    }

    function schedule() {
      if (next < ctx.currentTime) next = ctx.currentTime + 0.05; // skip ahead after the tab was hidden
      while (next < ctx.currentTime + 0.15) {
        const [root, chord] = BARS[Math.floor(step / 8) % BARS.length];
        const i = step % 8;
        const tones = chord.concat(chord[0] + 12);
        mallet(mtof(tones[ARP[i]] + 12), next, i === 0 ? 0.1 : 0.075);
        if (i === 0 || i === 4) bass(mtof(root), next);
        if (i % 2 === 1) noise({ t: next, filter: 'highpass', f: 7000, attack: 0.003, decay: 0.035, gain: 0.03, dest: musicBus });
        next += EIGHTH;
        step++;
      }
    }

    return {
      get playing() { return timer !== null; },
      start() {
        if (timer !== null) { setLevel(); return; }
        step = 0;
        next = ctx.currentTime + 0.1;
        schedule();
        timer = setInterval(schedule, 40);
        setLevel();
      },
      stop() {
        setLevel(0);
        clearInterval(timer);
        timer = null;
      },
    };
  })();

  function setLevel(level) {
    if (!ctx) return;
    const target = level !== undefined ? level : (state.music ? (state.ducked ? DUCKED_LEVEL : MUSIC_LEVEL) : 0);
    musicBus.gain.setTargetAtTime(target, ctx.currentTime, 0.25);
  }

  // ---------- public API ----------

  const Sound = {
    unlock,
    get sfxOn() { return state.sfx; },
    get musicOn() { return state.music; },
    setSfx(on) {
      state.sfx = on;
      writePref('bj.sfx', on);
      if (ctx) sfxBus.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.03);
    },
    setMusic(on) {
      state.music = on;
      writePref('bj.music', on);
      if (!ctx) return;
      if (on) {
        if (ctx.state === 'suspended') ctx.resume();
        music.start();
      } else {
        music.stop();
      }
    },
    // Lower the music (e.g. while Aniket walks, or while someone speaks). Each reason has its own
    // key, so one reason ending doesn't bring the music back while another is still active.
    duck(on, key = 'scene') {
      if (on) ducks.add(key);
      else ducks.delete(key);
      state.ducked = ducks.size > 0;
      if (music.playing) setLevel();
    },
  };

  // Each effect is a no-op until audio is unlocked, while effects are muted, or while the tab is hidden.
  Object.keys(effects).forEach(name => {
    Sound[name] = (...args) => {
      if (!ctx || ctx.state === 'closed' || !state.sfx || document.hidden) return;
      try { effects[name](...args); } catch (e) { /* never let a sound break the game */ }
    };
  });

  window.Sound = Sound;
})();
