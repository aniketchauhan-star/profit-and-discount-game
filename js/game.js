/* ==========================================================================
   Bookstore Journey — scenes, story timeline and navigation
   ========================================================================== */
(function () {
  'use strict';

  const { el, CANCELLED } = FX;
  const STAGE_W = 1920;
  const STAGE_H = 1080;
  const ASSETS = 'game assets/';
  const reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = sel => document.querySelector(sel);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Clean strip cut from "aniket walking sprite sheet.png": every frame cut along its own outline
  // and aligned on the head/torso and the floor line, with a 16px gap between frames.
  const WALK_SHEET = {
    src: ASSETS + 'sprites/aniket-walk-clean.png',
    frameW: 358, frameH: 614, gutter: 16, anchorX: 166, baselineY: 612,
    loop: [3, 4, 5, 6, 7, 0, 1],           // sheet frames in an even contact → passing rhythm
    stride: [96, 97, 77, 111, 26, 53, 87], // body travel (sprite px) from each loop frame to the next
    contact: [3, 5, 7],                    // a foot lands → footstep sound
    idle: 0,                               // both feet flat on the floor: the pose he stops on
  };

  // Shapes on the artwork (stage px).
  const TITLE_PLATE = [[150, 340], [860, 340], [884, 420], [862, 520], [800, 668], [200, 668], [128, 600], [108, 430]];
  const SHOP_SIGN = [[380, 148], [1885, 18], [1885, 172], [380, 292]];
  const MONEY = [[832, 470], [985, 436], [1066, 498], [1064, 582], [915, 586], [836, 545]];

  const SCENES = [
    {
      id: 'title', num: '★', title: 'Start', sub: 'Bookstore Journey',
      bg: ASSETS + 'start screen.png',
      kb: { origin: '60% 45%', from: 'scale(1.02)', to: 'scale(1.07) translate(-10px, -6px)' },
      lamps: [[826, 96, 300], [1442, 134, 320]],
      dust: [120, 140, 1000, 900],
      play: playTitle,
    },
    {
      id: 'outside', num: '1', title: 'The Bookstore', sub: 'Aniket walks to the store',
      bg: ASSETS + 'book store outside view.png',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[918, 382, 320], [1498, 352, 320]],
      dust: [420, 260, 1840, 820],
      exit: 'zoom', zoomOrigin: '52% 56%', // 1 → 2: the camera pushes into the store while fading
      play: playOutside,
    },
    {
      id: 'browse', num: '2', title: 'An Interesting Book', sub: '“This book looks interesting!”',
      bg: ASSETS + 'aniket hold the book scene.png',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      play: playBrowse,
    },
    {
      id: 'ask', num: '3', title: 'How Much?', sub: '“How much is this book?”',
      bg: ASSETS + 'aniket give a book to shopkepper.png',
      kb: { origin: '50% 38%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' },
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      play: playAsk,
    },
    {
      id: 'pay', num: '4', title: 'Paying ₹800', sub: 'Handing over the money',
      bg: ASSETS + 'aniket give money to shopkeeper.png',
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.075)' },
      lamps: [[1408, 86, 330]],
      dust: [300, 60, 1500, 700],
      play: playPay,
    },
  ];
  const LAST = SCENES.length - 1;

  // ======================================================================
  // Scene scripts. `ctx.wait()` throws CANCELLED as soon as the player
  // leaves the scene, so every script simply stops where it is.
  // ======================================================================

  async function playTitle(ctx, scene) {
    const L = scene.layer;
    FX.twinkles(L, [[300, 250], [700, 205], [140, 470], [884, 420], [250, 668], [810, 640], [520, 160]]);

    const wrap = el('div', 'start-wrap', L, { left: '495px', top: '812px' });
    const btn = el('button', 'start-btn', wrap);
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Start the story');
    const img = el('img', '', btn);
    img.src = ASSETS + 'start button.png';
    img.alt = '';
    img.draggable = false;
    btn.addEventListener('click', startStory);
    wrap.animate([
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.12)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration: 700, delay: 350, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'backwards' });

    for (;;) { // a light sweep across the logo every few seconds
      await ctx.wait(4200);
      FX.shine(L, TITLE_PLATE, { duration: 1300, width: 200, color: 'rgba(255, 255, 255, .8)' });
    }
  }

  function startStory() {
    if (Game.index !== 0 || Game.starting) return;
    Game.starting = true;
    Sound.unlock();
    Sound.chime();
    const scene = SCENES[0];
    FX.burst(scene.layer, 495, 812, { count: 22, dist: [150, 320] });
    const btn = scene.layer.querySelector('.start-btn');
    if (btn) {
      btn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(.86)', offset: 0.3 },
        { transform: 'scale(1.18)', opacity: 1, offset: 0.7 },
        { transform: 'scale(.2)', opacity: 0 },
      ], { duration: 520, easing: 'ease-in-out', fill: 'forwards' });
    }
    setTimeout(() => {
      Game.starting = false;
      go(1);
    }, 380);
  }

  async function playOutside(ctx, scene) {
    const L = scene.layer;
    const walker = new FX.Walker(L, WALK_SHEET);
    const from = { x: -190, y: 1016, s: 0.79 }; // off-screen left, slightly closer to the camera
    const to = { x: 925, y: 986, s: 0.76 };     // front of the store, by the display table
    walker.place(from.x, from.y, from.s);
    walker.setFrame(WALK_SHEET.loop[0]);
    const pan = x => (x / STAGE_W) * 1.6 - 0.8;

    await ctx.wait(600);
    Sound.duck(true);
    await walker.walk(ctx, { from, to, speed: 265, decel: 230, onStep: x => Sound.step(pan(x)) });
    Sound.step(pan(to.x), 0.5);
    Sound.duck(false);
    walker.idle(true);

    await ctx.wait(300);
    const headTop = to.y - (WALK_SHEET.baselineY - 10) * to.s;
    FX.exclaim(L, to.x + 22, headTop - 34);
    Sound.ding();

    await ctx.wait(500);
    FX.shine(L, SHOP_SIGN, { duration: 1400, width: 260 });
    FX.twinkles(L, [[468, 222], [1590, 90], [1120, 132]], { size: [30, 46] });
    Sound.sparkle();

    await ctx.wait(700);
    ctx.advance(1800);
  }

  async function playBrowse(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 1105, 505, 440, 440, { cls: 'glow--book', delay: 0 });
    FX.twinkles(L, [[985, 372], [1240, 405], [1252, 600], [975, 612], [1120, 338], [1185, 664]]);

    await ctx.wait(700);
    const line = FX.bubble(L, {
      anchor: [1005, 270], corner: 'bl', tip: [950, 318],
      text: 'This book looks\ninteresting!', voice: 'boy', rotate: -1.5,
    });
    await line.show();
    await line.type(ctx);
    ctx.advance(3000); // "wait 3 seconds, then next screen"
  }

  async function playAsk(ctx, scene) {
    const L = scene.layer;

    // First Aniket asks…
    await ctx.wait(700);
    const question = FX.bubble(L, {
      anchor: [778, 318], corner: 'bl', tip: [738, 372],
      text: 'How much is\nthis book?', voice: 'boy', rotate: -1.5,
    });
    await question.show();
    await question.type(ctx);
    await ctx.wait(1100);

    // …his bubble goes away, then the shopkeeper answers (never both on screen at once).
    await question.hide();
    await ctx.wait(250);
    const answer = FX.bubble(L, {
      anchor: [1262, 318], corner: 'br', tip: [1300, 372],
      text: [{ t: "It's " }, { t: '₹800', em: true }, { t: '!' }], voice: 'man', rotate: 1.5,
    });
    await answer.show();
    await answer.type(ctx);
    answer.emphasize();
    Sound.ding();
    ctx.advance(3000); // the shopkeeper holds the moment, then on to paying
  }

  async function playPay(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 950, 515, 460, 300, { cls: 'glow--money', delay: 0 });

    await ctx.wait(600);
    FX.shine(L, MONEY, { duration: 900, width: 140 });

    await ctx.wait(450);
    const price = FX.badge(L, { x: 942, y: 352, text: '₹800', radius: 72 });
    price.pop(); // pop sound + a small ₹800 just above the money
    FX.burst(L, 942, 352, { count: 14, dist: [90, 170], size: [10, 20] });

    await ctx.wait(500);
    Sound.kaching();
    FX.burst(L, 950, 515, { count: 10, dist: [70, 140], size: [10, 18] });

    await ctx.wait(250);
    FX.confetti(L, 942, 352, { count: 70 });
    ctx.finish();
  }

  // ======================================================================
  // Scene runner + navigation
  // ======================================================================

  const readPref = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v === '1';
    } catch (e) {
      return fallback;
    }
  };

  const Game = {
    index: -1,
    token: 0,      // bumps every time a scene starts; stale scripts see it and stop
    timers: new Set(),
    leaving: null,  // scene fading out underneath during a cross-fade
    fadeAnim: null,
    fadeTimer: 0,
    startTimer: 0,
    hold: null,    // { token, ms } while a scene waits to auto-advance
    countdown: 0,
    starting: false,
    autoplay: readPref('bj.autoplay', true),
  };

  function makeCtx() {
    const token = Game.token;
    const alive = () => token === Game.token;
    return {
      alive,
      wait(ms) {
        return new Promise((resolve, reject) => {
          if (!alive()) return reject(CANCELLED);
          const id = setTimeout(() => {
            Game.timers.delete(id);
            if (alive()) resolve(); else reject(CANCELLED);
          }, ms);
          Game.timers.add(id);
        });
      },
      // End of a scene: move on after `ms` (Next fills up as a timer), or wait for Next if auto-play is off.
      advance(ms) {
        if (!alive()) return;
        Game.hold = { token, ms };
        if (Game.autoplay) startCountdown();
        else UI.setReady(true);
      },
      // Last scene: nothing to advance to, just invite a replay.
      finish() {
        if (alive()) Game.timers.add(setTimeout(() => alive() && UI.setReady(true), 2500));
      },
    };
  }

  function stopScene() {
    Game.token++;
    Game.timers.forEach(clearTimeout);
    Game.timers.clear();
    Game.hold = null;
    clearTimeout(Game.countdown);
    UI.countdown(0);
    UI.setReady(false);
    Sound.duck(false);
  }

  function startCountdown() {
    const hold = Game.hold;
    if (!hold || hold.token !== Game.token) return;
    UI.setReady(false);
    UI.countdown(hold.ms);
    clearTimeout(Game.countdown);
    Game.countdown = setTimeout(() => {
      if (Game.hold === hold && hold.token === Game.token) next();
    }, hold.ms);
  }

  function setAutoplay(on) {
    Game.autoplay = on;
    try { localStorage.setItem('bj.autoplay', on ? '1' : '0'); } catch (e) { /* ignore */ }
    $('#autoplay-toggle').checked = on;
    if (on) {
      startCountdown();
    } else if (Game.hold && Game.hold.token === Game.token) {
      clearTimeout(Game.countdown);
      UI.countdown(0);
      UI.setReady(true);
    }
  }

  function activate(scene, mode) {
    scene.layer.replaceChildren();
    scene.el.classList.remove('is-leaving', 'is-entering');
    scene.el.classList.add('is-active');
    if (mode === 'cut' && !reducedMotion) {
      void scene.el.offsetWidth; // restart the settle-in animation
      scene.el.classList.add('is-entering');
    }
    if (scene.kbAnim) scene.kbAnim.cancel();
    if (reducedMotion) {
      scene.world.style.transform = scene.kb.from;
    } else {
      // Slow "Ken Burns" drift on the artwork (and everything placed on it).
      scene.kbAnim = scene.world.animate(
        [{ transform: scene.kb.from }, { transform: scene.kb.to }],
        { duration: 16000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
      );
    }
  }

  function deactivate(scene) {
    scene.el.classList.remove('is-active', 'is-entering', 'is-leaving');
    scene.el.style.zIndex = '';
    if (scene.kbAnim) {
      scene.kbAnim.cancel();
      scene.kbAnim = null;
    }
    scene.layer.replaceChildren();
  }

  function run(scene) {
    const ctx = makeCtx();
    Promise.resolve()
      .then(() => scene.play(ctx, scene))
      .catch(err => { if (err !== CANCELLED) console.error(err); });
  }

  // Cross-fade only between scenes 1 ↔ 2 and 2 ↔ 3; every other change is a straight cut.
  const FADE_PAIRS = new Set(['1-2', '2-3']);
  const FADE_MS = 1200;
  const fadesBetween = (a, b) => FADE_PAIRS.has(`${Math.min(a, b)}-${Math.max(a, b)}`);

  // Jump a running cross-fade to its end (e.g. the player clicked again mid-fade).
  function settleTransition() {
    clearTimeout(Game.fadeTimer);
    if (Game.fadeAnim) {
      Game.fadeAnim.cancel();
      Game.fadeAnim = null;
    }
    if (Game.leaving) {
      deactivate(Game.leaving);
      Game.leaving = null;
    }
    SCENES.forEach(s => { s.el.style.zIndex = ''; });
  }

  function go(i) {
    if (i < 0 || i > LAST) return;
    stopScene();
    clearTimeout(Game.startTimer);
    UI.closePanel(true);
    settleTransition();
    const from = SCENES[Game.index];
    const to = SCENES[i];
    const forward = i === Game.index + 1;
    const fade = from && from !== to && fadesBetween(Game.index, i);
    if (from && !fade) deactivate(from);
    Game.index = i;
    UI.update();

    if (!fade) {
      activate(to, 'cut');
      run(to);
      return;
    }

    // The new scene fades in on top while the old one drifts forward underneath
    // (1 → 2 pushes right into the store).
    Sound.whoosh();
    activate(to, 'fade');
    to.el.style.zIndex = 2;
    Game.fadeAnim = to.el.animate(
      reducedMotion
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }],
      { duration: FADE_MS, easing: 'ease-in-out' }
    );
    if (!reducedMotion) {
      from.el.classList.remove('is-entering');
      void from.el.offsetWidth;
      from.el.style.setProperty('--leave-scale', from.exit === 'zoom' && forward ? 1.3 : 1.05);
      from.el.classList.add('is-leaving');
    }
    Game.leaving = from;
    Game.startTimer = setTimeout(() => run(to), FADE_MS * 0.45); // first beats land as the fade ends
    Game.fadeTimer = setTimeout(settleTransition, FADE_MS);
  }

  function next() {
    if (Game.index === 0) startStory();
    else if (Game.index >= LAST) go(1); // Replay
    else go(Game.index + 1);
  }

  function back() {
    if (Game.index > 0) go(Game.index - 1);
  }

  // ======================================================================
  // HUD: back/next and the scene panel.
  // Music, sound and full screen have no on-screen buttons: keys M, S and F.
  // ======================================================================

  const ICONS = {
    scenes: '<rect x="6" y="8" width="15" height="13" rx="3"/><rect x="27" y="8" width="15" height="13" rx="3"/><rect x="6" y="27" width="15" height="13" rx="3"/><rect x="27" y="27" width="15" height="13" rx="3"/>',
    back: '<path d="M30 10L16 24l14 14"/>',
    next: '<path d="M18 10l14 14-14 14"/>',
    replay: '<path d="M10.5 26A14 14 0 1 0 14 14.5"/><path d="M12 6v9h9"/>',
  };
  const icon = name => `<svg class="icon" viewBox="0 0 48 48" aria-hidden="true">${ICONS[name]}</svg>`;

  const UI = {
    update() {
      const i = Game.index;
      const isLast = i === LAST;
      $('#nav').classList.toggle('is-hidden', i <= 0);
      $('#btn-back').disabled = i <= 0;
      $('#nav-count').textContent = `${Math.max(i, 1)} / ${LAST}`;
      $('#btn-next .nav-label').textContent = isLast ? 'Replay' : 'Next';
      $('#btn-next .nav-icon').innerHTML = icon(isLast ? 'replay' : 'next');
      $('#btn-next').setAttribute('aria-label', isLast ? 'Replay the story' : 'Next scene');
      SCENES.forEach((s, k) => {
        s.item.classList.toggle('is-current', k === i);
        if (k === i) s.item.setAttribute('aria-current', 'step');
        else s.item.removeAttribute('aria-current');
      });
    },
    countdown(ms) {
      const b = $('#btn-next');
      b.classList.remove('is-counting');
      if (ms > 0) {
        void b.offsetWidth; // restart the fill animation
        b.style.setProperty('--count', ms + 'ms');
        b.classList.add('is-counting');
      }
    },
    setReady(on) {
      $('#btn-next').classList.toggle('is-ready', on);
    },
    get panelOpen() {
      return $('#panel').classList.contains('is-open');
    },
    openPanel() {
      $('#panel').classList.add('is-open');
      $('#panel-scrim').classList.add('is-open');
      $('#panel').setAttribute('aria-hidden', 'false');
      $('#btn-panel').setAttribute('aria-expanded', 'true');
      Sound.swish();
      const current = SCENES[Math.max(Game.index, 0)].item;
      setTimeout(() => current.focus({ preventScroll: true }), 60);
    },
    closePanel(silent) {
      if (!UI.panelOpen) return;
      $('#panel').classList.remove('is-open');
      $('#panel-scrim').classList.remove('is-open');
      $('#panel').setAttribute('aria-hidden', 'true');
      $('#btn-panel').setAttribute('aria-expanded', 'false');
      if (!silent) Sound.swish();
    },
    togglePanel() {
      if (UI.panelOpen) UI.closePanel();
      else UI.openPanel();
    },
  };

  function toggleMusic() {
    Sound.unlock();
    Sound.setMusic(!Sound.musicOn);
  }

  function toggleSfx() {
    Sound.setSfx(!Sound.sfxOn);
    Sound.click();
  }

  function toggleFullscreen() {
    const d = document;
    const app = $('#app');
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      } else {
        const p = (app.requestFullscreen || app.webkitRequestFullscreen).call(app);
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* fullscreen not allowed here */ }
  }

  function buildScenes() {
    const host = $('#scenes');
    SCENES.forEach(scene => {
      scene.el = el('section', 'scene', host);
      scene.el.dataset.scene = scene.id;
      scene.el.setAttribute('aria-label', scene.title);
      if (scene.zoomOrigin) scene.el.style.setProperty('--zoom-origin', scene.zoomOrigin);
      scene.parallax = el('div', 'scene-parallax', scene.el);
      scene.world = el('div', 'scene-world', scene.parallax);
      scene.world.style.setProperty('--kb-origin', scene.kb.origin);
      const img = el('img', 'scene-bg', scene.world);
      img.src = scene.bg;
      img.alt = '';
      img.draggable = false;
      scene.ambient = el('div', 'scene-ambient', scene.world);
      scene.lamps.forEach(([x, y, r]) => FX.glow(scene.ambient, x, y, r, r * 0.8));
      if (!reducedMotion) FX.motes(scene.ambient, { area: scene.dust, count: 16 });
      scene.layer = el('div', 'scene-layer', scene.world);
    });
  }

  function buildPanel() {
    const list = $('#scene-list');
    SCENES.forEach((scene, i) => {
      const li = el('li', '', list);
      const item = el('button', 'scene-item', li);
      item.type = 'button';
      el('span', 'si-num', item).textContent = scene.num;
      const thumb = el('span', 'si-thumb', item);
      const img = el('img', '', thumb);
      img.src = scene.bg;
      img.alt = '';
      el('span', 'si-now', thumb).textContent = 'NOW';
      const text = el('span', 'si-text', item);
      el('strong', '', text).textContent = scene.title;
      el('small', '', text).textContent = scene.sub;
      item.setAttribute('aria-label', `${i === 0 ? 'Start screen' : 'Scene ' + i}: ${scene.title}`);
      item.addEventListener('click', () => {
        Sound.click();
        go(i);
      });
      scene.item = item;
    });
  }

  function wireUI() {
    $('#btn-panel').innerHTML = icon('scenes');
    $('#btn-panel').setAttribute('aria-expanded', 'false');
    $('#btn-back .nav-icon').innerHTML = icon('back');

    const press = fn => () => {
      Sound.click();
      fn();
    };
    $('#btn-back').addEventListener('click', press(back));
    $('#btn-next').addEventListener('click', press(next));
    $('#btn-panel').addEventListener('click', press(UI.togglePanel));
    $('#btn-panel-close').addEventListener('click', () => UI.closePanel());
    $('#panel-scrim').addEventListener('click', () => UI.closePanel());

    const auto = $('#autoplay-toggle');
    auto.checked = Game.autoplay;
    auto.addEventListener('change', () => {
      Sound.click();
      setAutoplay(auto.checked);
    });

    $('#rotate-hint').addEventListener('click', e => e.currentTarget.classList.add('is-dismissed'));

    // Browsers only allow sound after a user gesture.
    window.addEventListener('pointerdown', Sound.unlock, true);
    window.addEventListener('keydown', Sound.unlock, true);

    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = document.activeElement && document.activeElement.tagName;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          back();
          break;
        case ' ':
        case 'Enter':
          if (tag === 'BUTTON' || tag === 'INPUT') return; // let the focused control handle it
          e.preventDefault();
          next();
          break;
        case 'p': case 'P': UI.togglePanel(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': toggleMusic(); break;
        case 's': case 'S': toggleSfx(); break;
        case 'Escape': UI.closePanel(); break;
        default: break;
      }
    });
  }

  // Scale the 1920x1080 stage to fit the window (letterboxed 16:9).
  function fit() {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    $('#stage').style.transform = `scale(${s})`;
  }

  // Slight camera drift that follows the mouse.
  function startParallax() {
    if (reducedMotion || !matchMedia('(pointer: fine)').matches) return;
    const p = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', e => {
      p.tx = (e.clientX / window.innerWidth - 0.5) * -18;
      p.ty = (e.clientY / window.innerHeight - 0.5) * -12;
    });
    let applied = null;
    const loop = () => {
      const scene = SCENES[Game.index];
      const moving = Math.abs(p.tx - p.x) > 0.01 || Math.abs(p.ty - p.y) > 0.01;
      if (scene && (moving || applied !== scene)) {
        p.x += (p.tx - p.x) * 0.06;
        p.y += (p.ty - p.y) * 0.06;
        scene.parallax.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px)`;
        applied = scene;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function preload(urls, onProgress) {
    let done = 0;
    return Promise.all(urls.map(src => new Promise(resolve => {
      const img = new Image();
      const finish = () => {
        done++;
        onProgress(done / urls.length);
        resolve();
      };
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(finish);
      img.onerror = () => {
        console.warn('Could not load', src);
        finish();
      };
      img.src = src;
    })));
  }

  async function boot() {
    fit();
    window.addEventListener('resize', fit);
    buildScenes();
    buildPanel();
    wireUI();
    startParallax();

    const fill = $('#loader-fill');
    const label = $('#loader-text');
    const images = SCENES.map(s => s.bg).concat(ASSETS + 'start button.png', WALK_SHEET.src);
    const fonts = document.fonts
      ? Promise.race([document.fonts.load('800 40px "Baloo 2"', 'Ab₹'), sleep(2500)]).catch(() => {})
      : Promise.resolve();
    await Promise.all([
      preload(images, p => {
        fill.style.width = (p * 100).toFixed(0) + '%';
        label.textContent = `Loading… ${(p * 100).toFixed(0)}%`;
      }),
      fonts,
    ]);
    $('#loader').classList.add('is-done');
    go(0);
  }

  boot();
})();
