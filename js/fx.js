/* ==========================================================================
   Bookstore Journey — visual effects
   Glows, dust, sparkles, light sweeps, comic speech bubbles,
   the price badge and the walking sprite. All coordinates are stage pixels
   (1920x1080), i.e. the same pixels as the scene artwork.
   ========================================================================== */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const CANCELLED = Symbol('scene-cancelled');

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const px = v => v + 'px';
  const num = v => Math.round(v * 10) / 10;
  // Animation.finished rejects when an animation is cancelled; we don't care about that case.
  const settle = anim => anim.finished.catch(() => {});
  const reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Story pace: 1 = brisk, higher = slower. game.js sets it (PACE); the story and teaching
  // animations below scale with it, quick feedback (pops, sparkles, button presses) does not.
  let pace = 1;
  const T = ms => ms * pace;

  function el(tag, className, parent, style) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (style) Object.assign(node.style, style);
    if (parent) parent.appendChild(node);
    return node;
  }

  function svg(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function setVars(node, vars) {
    for (const k in vars) node.style.setProperty('--' + k, vars[k]);
  }

  const classes = (...names) => names.filter(Boolean).join(' ');
  // Something that holds writing (a sheet, a table, a box of rules) is never shown empty: it starts hidden, and
  // the first thing written on it calls the function this returns, which brings it in (once) just before.
  const sheetFirst = node => {
    let shown = null;
    return () => {
      if (!shown) {
        Sound.bloop();
        reveal(node, [
          { opacity: 0, transform: 'translateY(26px) scale(.95)' },
          { opacity: 1, transform: 'translateY(-3px) scale(1.01)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(460), easing: 'cubic-bezier(.2,.8,.3,1)' });
        shown = new Promise(resolve => setTimeout(resolve, reducedMotion ? 0 : T(110))); // the writing starts as it comes in
      }
      return shown;
    };
  };
  // Restarts the animation that class `cls` gives `node` (e.g. a pop while something is talked about).
  const replay = (node, cls) => {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
  };

  // ---------- ambient light ----------

  function glow(parent, x, y, w, h, opts = {}) {
    const g = el('div', 'glow' + (opts.cls ? ' ' + opts.cls : ''), parent, {
      left: px(x), top: px(y), width: px(w), height: px(h || w),
    });
    g.style.animationDelay = (opts.delay !== undefined ? opts.delay : -rand(0, 3)).toFixed(2) + 's';
    return g;
  }

  function motes(parent, { area = [0, 0, 1920, 1080], count = 16 } = {}) {
    const [x0, y0, x1, y1] = area;
    for (let i = 0; i < count; i++) {
      const m = el('div', 'mote', parent, { left: px(rand(x0, x1)), top: px(rand(y0, y1)) });
      setVars(m, {
        sz: px(rand(5, 13).toFixed(1)),
        a: rand(0.35, 0.8).toFixed(2),
        dx: px(rand(-60, 60).toFixed(0)),
        dy: px(rand(-260, -120).toFixed(0)),
        sx: px(rand(-40, 40).toFixed(0)),
        dur: rand(7, 13).toFixed(1) + 's',
        delay: (-rand(0, 12)).toFixed(1) + 's',
      });
    }
  }

  // ---------- sparkles ----------

  function twinkles(parent, points, { size = [24, 42], dur = [1.8, 3] } = {}) {
    return points.map(([x, y], i) => {
      const t = el('div', 'twinkle', parent, { left: px(x), top: px(y) });
      setVars(t, {
        s: px(rand(size[0], size[1]).toFixed(0)),
        dur: rand(dur[0], dur[1]).toFixed(2) + 's',
        delay: (i * 0.37 + rand(0, 0.4)).toFixed(2) + 's',
      });
      return t;
    });
  }

  const SPARK_COLORS = ['#ffd84d', '#fff2a8', '#ffb238', '#7fe3d4', '#ffffff'];

  function burst(parent, x, y, opts = {}) {
    const { count = 16, dist = [120, 260], size = [16, 34], colors = SPARK_COLORS, duration = [650, 1100], shapes = ['star', 'twinkle', 'dot'] } = opts;
    for (let i = 0; i < count; i++) {
      const s = rand(size[0], size[1]);
      const angle = (i / count) * Math.PI * 2 + rand(-0.25, 0.25);
      const d = rand(dist[0], dist[1]);
      const dx = Math.cos(angle) * d;
      const dy = Math.sin(angle) * d;
      const spin = rand(-240, 240);
      const p = el('div', 'spark spark--' + pick(shapes), parent, {
        left: px(x), top: px(y), width: px(s), height: px(s), marginLeft: px(-s / 2), marginTop: px(-s / 2), background: pick(colors),
      });
      settle(p.animate([
        { transform: 'translate(0, 0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${num(dx * 0.8)}px, ${num(dy * 0.8)}px) scale(1) rotate(${num(spin * 0.6)}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${num(dx)}px, ${num(dy + 40)}px) scale(0) rotate(${num(spin)}deg)`, opacity: 0 },
      ], { duration: rand(duration[0], duration[1]), easing: 'cubic-bezier(.12,.75,.3,1)', fill: 'forwards' })).then(() => p.remove());
    }
  }

  // A bright band that sweeps once across a polygon (e.g. the shop sign).
  function shine(parent, poly, { duration = 1100, width = 220, delay = 0, color = 'rgba(255, 255, 255, .7)' } = {}) {
    const xs = poly.map(p => p[0]);
    const ys = poly.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const clip = el('div', 'shine', parent);
    const path = `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(', ')})`;
    clip.style.clipPath = path;
    clip.style.webkitClipPath = path;
    const band = el('div', 'shine-band', clip, {
      top: px(minY - 60), height: px(maxY - minY + 120), width: px(width),
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    });
    return settle(band.animate([
      { transform: `translateX(${minX - width * 1.5}px) skewX(-22deg)` },
      { transform: `translateX(${maxX + width * 0.5}px) skewX(-22deg)` },
    ], { duration, delay, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'both' })).then(() => clip.remove());
  }

  // Comic "!" above a character's head.
  function exclaim(parent, x, y) {
    const root = el('div', 'exclaim', parent, { left: px(x), top: px(y) });
    const inner = el('div', 'exclaim-inner', root);
    const s = svg('svg', { viewBox: '-90 -130 180 200', width: 180, height: 200 }, inner);
    [[-50, -72, -76, -98], [50, -72, 76, -98], [-60, -22, -92, -18], [60, -22, 92, -18]].forEach(([x1, y1, x2, y2]) => {
      svg('line', { x1, y1, x2, y2 }, s);
    });
    svg('text', { x: 0, y: 34 }, s).textContent = '!';
    settle(root.animate([
      { transform: 'scale(0) rotate(-20deg)', opacity: 0 },
      { transform: 'scale(1.35) rotate(8deg)', opacity: 1, offset: 0.55 },
      { transform: 'scale(.92) rotate(-3deg)', opacity: 1, offset: 0.8 },
      { transform: 'scale(1) rotate(0deg)', opacity: 1 },
    ], { duration: 560, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }));
    return root;
  }

  // ---------- speech bubble ----------

  // A speech bubble's body: a rounded rectangle, w × h, with round corners of radius r.
  function balloonPath(w, h, r) {
    return [
      `M ${r} 0`, `H ${w - r}`, `A ${r} ${r} 0 0 1 ${w} ${r}`, `V ${h - r}`, `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
      `H ${r}`, `A ${r} ${r} 0 0 1 0 ${h - r}`, `V ${r}`, `A ${r} ${r} 0 0 1 ${r} 0`, 'Z',
    ].join(' ');
  }

  // A speech bubble's tail: half its base, how far it always stops short of the speaker, its shortest and longest.
  const POINTER = { half: 20, gap: 26, min: 24, max: 58 };

  // A speech bubble's tail: a small straight-sided point, the same on every bubble. It leaves the edge that faces
  // the speaker at `tip` (in the bubble's own px): the bottom or the top, or a side when the speaker is beside the
  // bubble; it is aimed at the speaker (at most 38° off straight out), and stops POINTER.gap short of them, so a
  // bubble never touches anyone. A bubble set beside the speaker (`sideways`) keeps its point on the side even when it
  // is a single line: the point is narrower then.
  function pointerPath(w, h, r, [tx, ty], sideways = false) {
    const { gap, min, max } = POINTER;
    const half = sideways ? Math.min(POINTER.half, (h - 2 * r - 12) / 2) : POINTER.half;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), v));
    const beside = (tx < 0 || tx > w) && ty > r && ty < h - r && h - 2 * r >= 2 * half + 12 && half >= 10;
    const n = beside ? [tx < 0 ? -1 : 1, 0] : [0, ty > h / 2 ? 1 : -1]; // the edge's outward direction
    const s = [-n[1], n[0]];                                            // along the edge
    const base = beside
      ? [tx < 0 ? 0 : w, clamp(ty, r + half + 6, h - r - half - 6)]
      : [clamp(tx, r + half + 6, w - r - half - 6), ty > h / 2 ? h : 0];
    const d = [tx - base[0], ty - base[1]];
    const angle = clamp(Math.atan2(d[0] * s[0] + d[1] * s[1], Math.max(1, d[0] * n[0] + d[1] * n[1])), -0.66, 0.66);
    const length = clamp(Math.hypot(d[0], d[1]) - gap, min, max);
    const at = (k, j) => [0, 1].map(i => num(base[i] + n[i] * k + s[i] * j)); // k out from the edge, j along it
    const apex = [0, 1].map(i => num(base[i] + length * (Math.cos(angle) * n[i] + Math.sin(angle) * s[i])));
    return `M ${at(-2, -half).join(' ')} L ${apex.join(' ')} L ${at(-2, half).join(' ')} Z`; // its base just inside the body
  }

  // Splits text into per-letter spans (kept inside per-word spans so words never break apart).
  // `text` is a string ('\n' = new line) or segments: [{ t: "It's " }, { t: '₹800', em: true }, { t: '!' }];
  // a segment can also carry a class of its own, e.g. { t: 'Selling Price', cls: 'stress' } ('key' = a new word, in red),
  // and `end: true` closes a part of the line, so it can be typed out (and spoken) part by part.
  function buildLetters(host, text) {
    const segments = typeof text === 'string' ? [{ t: text }] : text;
    const letters = [];
    let partNo = 0;
    segments.forEach(seg => {
      const target = seg.em ? el('span', 'em', host) : seg.cls ? el('span', seg.cls, host) : host;
      seg.t.split('\n').forEach((line, n) => {
        if (n > 0) el('br', '', target);
        line.split(/([ \t]+)/).forEach(part => { // (a no-break space keeps a sum together: see softBreaks)
          if (!part) return;
          if (/^[ \t]+$/.test(part)) {
            target.appendChild(document.createTextNode(' '));
            return;
          }
          const word = el('span', 'b-word', target);
          Array.from(part).forEach((c, i, all) => {
            const letter = el('span', 'ch', word);
            letter.textContent = c;
            letter.dataset.part = partNo;
            if (i === all.length - 1) letter.dataset.end = '1';
            letters.push(letter);
          });
        });
      });
      if (seg.end) partNo++;
    });
    return letters;
  }

  // The plain text of each part of a split bubble text (a part ends at a segment with `end: true`).
  function partTexts(text) {
    const parts = [''];
    (typeof text === 'string' ? [{ t: text }] : text).forEach(seg => {
      parts[parts.length - 1] += seg.t;
      if (seg.end) parts.push('');
    });
    return parts.map(p => p.replace(/\s*\n\s*/g, ' ').trim());
  }

  // The words of a speech bubble or thought cloud, laid out in `host` and measured (the letters are
  // invisible but already take their space): `box` is the text box and `w` × `h` its size.
  // { wrap }: the revamp's dialogue box (screens with `.is-v2`): its words wrap by themselves into balanced lines no
  // longer than WRAP_MEASURE (about 20–28 letters) or than the room it has (`max`, the box's width), and the box
  // shrinks to its longest line (see softBreaks for the line breaks written in the text).
  const WRAP_MEASURE = 450; // px of text, at 34 px

  function lineText(host, o, { wrap = false, max = Infinity } = {}) {
    const size = o.size || 34;
    const box = el('div', wrap ? 'b-text b-text--wrap' : 'b-text', host, { fontSize: px(size) });
    const icon = o.icon ? el('span', 'b-icon', box) : null; // (before the words: ✗ or ✓)
    if (icon) icon.innerHTML = o.icon === 'cross' ? ICON_CROSS : ICON_CHECK;
    const letters = buildLetters(box, wrap ? softBreaks(o.text) : o.text);
    if (wrap) {
      const cs = getComputedStyle(box);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const words = [...box.querySelectorAll('.b-icon, .b-word, .em, .key')]; // (an .em or .key never breaks inside)
      // Lays the words out at this width of text: how many lines, and the longest (in layout px: the words' offsets
      // are measured from the box, so the stage's scale doesn't count).
      const layout = width => {
        box.style.width = px(width + padX);
        const lines = new Map();
        words.forEach(word => {
          const top = Math.round((word === icon && words[1] ? words[1] : word).offsetTop / 4); // (the icon is on the first word's line)
          const [l, r] = lines.get(top) || [Infinity, -Infinity];
          lines.set(top, [Math.min(l, word.offsetLeft), Math.max(r, word.offsetLeft + word.offsetWidth)]);
        });
        return { count: lines.size, longest: Math.max(...[...lines.values()].map(([l, r]) => r - l)) };
      };
      let lo = Math.max(...words.map(w => w.offsetWidth));
      let hi = Math.max(lo, Math.min((WRAP_MEASURE * size) / 34, max - padX - 4));
      // Balanced: the narrowest width that needs no more lines than the widest does (no line is left nearly empty).
      const count = layout(hi).count;
      while (hi - lo > 3) {
        const mid = (lo + hi) / 2;
        if (layout(mid).count > count) lo = mid;
        else hi = mid;
      }
      box.style.width = px(Math.ceil(layout(hi).longest + padX + 2));
    }
    const h = box.offsetHeight;
    const w = Math.max(box.offsetWidth, h + 24);
    box.style.width = px(w);
    return { box, letters, w, h };
  }

  // A bubble's text for the revamp's dialogue box: a written line break becomes a space, so the words wrap by
  // themselves, except after a short exclamation that opens the line ("Correct!", "Not quite!"), which keeps a line of
  // its own; and a sum (125 ÷ 500 × 100) is kept on one line (no-break spaces round its signs).
  function softBreaks(text) {
    let sentence = '';
    return (typeof text === 'string' ? [{ t: text }] : text).map(seg => {
      let t = '';
      for (const c of seg.t) {
        const keep = c === '\n' && /^[^.!?]{1,11}[!?.]$/.test(sentence.trim()) && !/\d/.test(sentence);
        t += c === '\n' && !keep ? ' ' : c;
        sentence = c === '\n' ? '' : sentence + c;
      }
      t = t.replace(/ {2,}/g, ' ').replace(/ ([=−×÷+]) /g, '\u00a0$1\u00a0');
      return Object.assign({}, seg, { t });
    });
  }

  // The revamp's dialogue box shows its whole line at once; each word lights up as it is said (`part`: only that part's
  // words). Each word's time is its share of the recording (`seconds`; or about 62 ms a letter when the device's voice
  // reads it), a word after a comma or full stop three letters more (the voice pauses there); the last one goes out as
  // the voice ends. `light: false` (Amit, his father, the shopkeeper: the user, 2026-10-28, "the conversation should
  // look like a conversation, not reading"): no word lights up; the line is just there while it is said.
  async function sayWords(ctx, root, { part, seconds, light = true }) {
    const words = [...root.querySelectorAll('.b-word')].filter(w => !w.classList.contains('was-said') &&
      (part === undefined || +w.firstElementChild.dataset.part === part));
    if (!words.length) return;
    const share = (w, i) => w.textContent.length + 1 + (i > 0 && /[!?.,]$/.test(words[i - 1].textContent) ? 3 : 0);
    const total = words.reduce((sum, w, i) => sum + share(w, i), 0);
    const unit = seconds ? Math.max(16, ((seconds - 0.35) * 1000) / total) : 62;
    if (!light) {
      words.forEach(w => w.classList.add('was-said'));
      await ctx.wait(total * unit, { real: true });
      return;
    }
    const start = performance.now();
    let at = 0;
    for (const [i, word] of words.entries()) {
      word.classList.add('is-now');
      at += share(word, i) * unit;
      try {
        await ctx.wait(Math.max(0, start + at - performance.now()), { real: true });
      } finally {
        word.classList.remove('is-now');
        word.classList.add('was-said');
      }
    }
  }

  // What speech bubbles and thought clouds have in common: the line as plain text (for the voice),
  // typing it out, and making its highlights pulse.
  function lineMethods(root, letters, o) {
    return {
      el: root,
      // The whole line as plain text (for the voice).
      words: (typeof o.text === 'string' ? o.text : o.text.map(seg => seg.t).join('')).replace(/\n/g, ' '),
      // Each part's plain text, for a bubble that is said one part at a time.
      parts: partTexts(o.text),
      // Types the text letter by letter; `ctx.wait` throws if the player leaves the scene.
      // The little voice blips are left out while a real voice reads the line.
      // { part } types only up to the end of that part (see buildLetters), continuing from where it stopped.
      // { seconds }: its recording lasts this long, so the letters come in step with it, the last one as the voice
      // ends (0.35 s before the clip does): each takes max(16 ms, (seconds − 0.35) / letters), and the one after a
      // comma or full stop three letters' time more (the voice pauses there).
      async type(ctx, { speed = 46, blips = true, part, seconds } = {}) {
        if (o.calm) return sayWords(ctx, root, { part, seconds, light: !o.voice || o.voice === 'bird' }); // the revamp's dialogue box
        if (seconds) {
          const todo = letters.filter(l => !l.classList.contains('on') && (part === undefined || +l.dataset.part <= part));
          const before = i => 1 + (i > 0 && /[!?.,]/.test(todo[i - 1].textContent) ? 3 : 0);
          const unit = Math.max(16, ((seconds - 0.35) * 1000) / todo.reduce((sum, l, i) => sum + before(i), 0));
          const start = performance.now();
          let at = 0;
          for (const [i, letter] of todo.entries()) {
            at += before(i) * unit;
            await ctx.wait(Math.max(0, start + at - performance.now()), { real: true });
            letter.classList.add('on');
          }
          return;
        }
        let n = 0;
        for (const letter of letters) {
          if (letter.classList.contains('on')) continue;
          if (part !== undefined && +letter.dataset.part > part) break;
          letter.classList.add('on');
          const c = letter.textContent;
          if (blips && /[A-Za-z0-9₹]/.test(c) && n++ % 2 === 0) Sound.blip(o.voice);
          let delay = speed;
          if (letter.dataset.end) delay += speed * 0.8;
          if (/[!?.,]/.test(c)) delay += 140;
          await ctx.wait(delay);
        }
      },
      emphasize() {
        if (o.calm) return; // the revamp: nothing jumps
        root.querySelectorAll('.em, .key').forEach(e => e.classList.add('pulse'));
      },
    };
  }

  // Speech bubbles and thought clouds are flat: one off-white shape (its parts filled alike, so they read as one),
  // with a soft shadow under it (style.css: .bubble svg, .b-fill).
  function paintShapes(art, paths) {
    const g = svg('g', { class: 'b-fill' }, art);
    paths.forEach(d => svg('path', { d }, g));
  }

  // Where a box (x, y, w × h) can go nearest to where it was asked for without covering any of `avoid` ([left, top,
  // right, bottom] stage rects, 14 px of room round them), on the stage (clear of the top buttons) and inside `within`
  // ([minX, maxX]) if given: the nearest free spot on rings round it, 12 px apart, up to 420 px away.
  function clearOf(avoid, x, y, w, h, within) {
    const lo = within ? within[0] : 24;
    const hi = (within ? within[1] : 1896) - w;
    const free = (px0, py0) => px0 >= lo && px0 <= hi && py0 >= 104 && py0 + h <= 1056 &&
      avoid.every(([l, t, r, b]) => px0 + w <= l - 14 || px0 >= r + 14 || py0 + h <= t - 14 || py0 >= b + 14);
    if (free(x, y)) return [x, y];
    for (let d = 12; d <= 420; d += 12) {
      for (let a = 0; a < 360; a += 15) {
        const rad = (a * Math.PI) / 180;
        const nx = x + Math.round(Math.cos(rad) * d);
        const ny = y - Math.round(Math.sin(rad) * d); // (0° is right, 90° up)
        if (free(nx, ny)) return [nx, ny];
      }
    }
    return [x, y];
  }

  /**
   * Speech bubble, sized to fit its text; every bubble in the game looks the same (see pointerPath, paintShapes).
   *  anchor   [x, y] stage point where one corner (or edge middle) of the bubble sits
   *  corner   which point that is: 'bl' (default) | 'br' | 'tl' | 'tr' | 'bc' | 'tc' (c = centred) | 'ml' | 'mr' (the
   *           middle of its left or right edge: a bubble beside the speaker)
   *  within   optional [minX, maxX] the bubble must stay inside
   *  tip      [x, y] stage point of the speaker (their mouth or head): the tail points at it and stops short of it
   *  text     see buildLetters; size (px, default 34), voice ('boy' | 'dad' | 'man' | 'bird'), rotate (deg)
   */
  function bubble(parent, o) {
    const calm = !!parent.closest('.is-v2'); // the revamp's dialogue box: calm, its whole line at once (see sayWords)
    if (calm) o = Object.assign({}, o, { calm });
    const root = el('div', 'bubble', parent);
    const float = el('div', 'bubble-float', root);
    const { box: textBox, letters, w, h } = lineText(float, o, { wrap: calm, max: o.within ? o.within[1] - o.within[0] : Infinity });
    if (calm) letters.forEach(l => l.classList.add('on'));
    const corner = o.corner || 'bl';
    let x = { r: o.anchor[0] - w, c: o.anchor[0] - w / 2 }[corner[1]] ?? o.anchor[0];
    if (o.within) x = Math.max(o.within[0], Math.min(o.within[1] - w, x));
    let y = { b: o.anchor[1] - h, m: o.anchor[1] - h / 2 }[corner[0]] ?? o.anchor[1];
    // keep-clear areas (faces, prices, tags, the book): given, or the scene's own for a bubble on its picture
    const onPicture = parent.classList.contains('scene-layer');
    const avoid = o.avoid || (calm && onPicture && parent.closest('.scene').keepClear);
    if (avoid) [x, y] = clearOf(avoid, x, y, w, h, o.within);
    const tip = [o.tip[0] - x, o.tip[1] - y];
    Object.assign(root.style, {
      left: px(x), top: px(y), width: px(w), height: px(h),
      transformOrigin: `${num(tip[0])}px ${num(tip[1])}px`, // grows out of the speaker's mouth
    });

    // A rounded body, and a small point from the edge facing the speaker, aimed at them.
    const r = Math.min(18, h / 2);
    const body = balloonPath(w, h, r);
    const tail = pointerPath(w, h, r, tip, corner[0] === 'm');
    const art = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    float.insertBefore(art, textBox);
    paintShapes(art, [body, tail]);
    const rot = 0; // it sits straight, so its words are crisp (it only tilts a little as it pops up)

    return Object.assign(lineMethods(root, letters, o), {
      show() {
        if (calm) { // a soft fade in: no bounce, no sound
          return settle(root.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 300, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'forwards' }));
        }
        Sound.bloop();
        return settle(root.animate([
          { opacity: 0, transform: `scale(.15) rotate(${rot - 10}deg)` },
          { opacity: 1, transform: `scale(1.08) rotate(${rot + 2}deg)`, offset: 0.55 },
          { opacity: 1, transform: `scale(.97) rotate(${rot - 0.5}deg)`, offset: 0.8 },
          { opacity: 1, transform: `scale(1) rotate(${rot}deg)` },
        ], { duration: T(480), easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }));
      },
      // Already up and fully typed (to carry a bubble over from the screen before, unchanged).
      showNow() {
        root.classList.add('is-static');
        letters.forEach(letter => letter.classList.add('on'));
        Object.assign(root.style, { opacity: '1', transform: `rotate(${rot}deg)` });
        requestAnimationFrame(() => root.classList.remove('is-static'));
      },
      // Shrinks back towards the speaker and is removed.
      hide() {
        if (calm) return settle(root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' })).then(() => root.remove());
        return settle(root.animate([
          { opacity: 1, transform: `scale(1) rotate(${rot}deg)` },
          { opacity: 0, transform: `scale(.3) rotate(${rot - 8}deg)` },
        ], { duration: T(260), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })).then(() => root.remove());
      },
    });
  }

  // ---------- thought cloud ----------

  // An ellipse as a path, always drawn the same way round, so overlapping ones fill as one shape.
  const ellipsePath = (cx, cy, rx, ry) =>
    `M ${num(cx - rx)} ${num(cy)} a ${num(rx)} ${num(ry)} 0 1 0 ${num(2 * rx)} 0 a ${num(rx)} ${num(ry)} 0 1 0 ${num(-2 * rx)} 0 Z`;

  // A puffy cloud around a w × h text box: an ellipse ringed with round bumps, big and small in turn,
  // spread evenly along its edge. `a` × `b` is the cloud's outer half-size.
  function cloudPath(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const ea = w / 2 + 14;
    const eb = h / 2 + 12;
    const r = Math.max(20, Math.min(30, (ea + eb) * 0.15));
    const pts = []; // points along the ellipse with the distance travelled so far, to space the bumps evenly
    for (let i = 0, s = 0; i <= 360; i++) {
      const t = (i / 360) * Math.PI * 2 - Math.PI / 2;
      const p = { x: cx + ea * Math.cos(t), y: cy + eb * Math.sin(t), s };
      if (i) p.s = s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
      pts.push(p);
    }
    const total = pts[pts.length - 1].s;
    const n = 2 * Math.max(4, Math.round(total / (r * 3.1))); // even, so big and small bumps alternate all the way round
    let d = ellipsePath(cx, cy, ea, eb);
    for (let k = 0, j = 0; k < n; k++) {
      const s = (k / n) * total;
      while (pts[j + 1].s < s) j++;
      const br = k % 2 ? r * 0.82 : r;
      d += ' ' + ellipsePath(pts[j].x, pts[j].y, br, br);
    }
    return { d, a: ea + r, b: eb + r };
  }

  /**
   * Thought cloud, sized to fit its text, with a trail of three little puffs leading down to the
   * thinker's head. show(): the puffs pop up one by one from the head, then the cloud billows out.
   * The rest works like a speech bubble (type, emphasize, showNow, hide, words).
   *  at    [x, y] stage point at the middle of the cloud
   *  tip   [x, y] where the trail starts: the thinker's head
   *  text  see buildLetters; size (px, default 34), voice ('boy' | 'dad' | 'man' | 'bird')
   */
  function thought(parent, o) {
    const calm = !!parent.closest('.is-v2'); // the revamp: a soft fade, the whole line at once
    if (calm) o = Object.assign({}, o, { calm });
    const root = el('div', 'bubble thought', parent);
    const cloud = el('div', 'thought-cloud', root);
    const float = el('div', 'bubble-float', cloud);
    const { box, letters, w, h } = lineText(float, o, { wrap: calm });
    if (calm) letters.forEach(l => l.classList.add('on'));
    const x = o.at[0] - w / 2;
    const y = o.at[1] - h / 2;
    Object.assign(root.style, { left: px(x), top: px(y), width: px(w), height: px(h) });
    const shape = cloudPath(w, h);
    const art = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    float.insertBefore(art, box);
    paintShapes(art, [shape.d]);

    // The trail: from the head towards the middle of the cloud, small puffs to big ones, bowing gently upwards.
    const head = [o.tip[0] - x, o.tip[1] - y];
    const dist = Math.hypot(w / 2 - head[0], h / 2 - head[1]);
    const u = [(w / 2 - head[0]) / dist, (h / 2 - head[1]) / dist];
    const edge = 1 / Math.hypot(u[0] / (shape.a - 12), u[1] / (shape.b - 12)); // middle → the cloud's edge, towards the head
    const room = dist - edge;
    const radii = [7.5, 11, 15];
    const gap = Math.max(5, Math.min(30, (room - 2 - 2 * radii.reduce((t, pr) => t + pr, 0)) / 3));
    const up = u[0] >= 0 ? [u[1], -u[0]] : [-u[1], u[0]];
    let along = 2;
    const puffs = radii.map((pr, i) => {
      along += pr;
      const bow = Math.sin(Math.PI * Math.min(1, along / room)) * room * 0.08;
      const pcx = head[0] + u[0] * along + up[0] * bow;
      const pcy = head[1] + u[1] * along + up[1] * bow;
      along += pr + gap;
      const puff = el('div', 'thought-puff', root, { left: px(pcx - pr), top: px(pcy - pr), width: px(2 * pr), height: px(2 * pr), opacity: '0' });
      const bob = el('div', 'thought-puff-bob', puff, { animationDelay: `${-i * 0.45}s` });
      paintShapes(svg('svg', { width: 2 * pr, height: 2 * pr, viewBox: `0 0 ${2 * pr} ${2 * pr}` }, bob), [ellipsePath(pr, pr, pr, pr)]);
      return puff;
    });
    // The cloud billows out from where the trail meets it.
    cloud.style.transformOrigin = `${num(w / 2 - u[0] * edge)}px ${num(h / 2 - u[1] * edge)}px`;
    cloud.style.opacity = '0';
    const later = (ms, fn) => setTimeout(() => root.isConnected && fn(), ms);

    return Object.assign(lineMethods(root, letters, o), {
      show() {
        root.style.opacity = '1';
        const step = T(150);
        if (calm) { // the puffs and the cloud fade in, one after the other: no bounce, no sound
          puffs.forEach((puff, i) => {
            puff.style.opacity = '';
            settle(puff.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: i * step, fill: 'backwards' }));
          });
          cloud.style.opacity = '';
          return settle(cloud.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 340, delay: puffs.length * step, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'backwards' }));
        }
        puffs.forEach((puff, i) => {
          puff.style.opacity = '';
          settle(puff.animate(reducedMotion ? [{ opacity: 0 }, { opacity: 1 }] : [
            { opacity: 0, transform: 'scale(0)' },
            { opacity: 1, transform: 'scale(1.3)', offset: 0.6 },
            { opacity: 1, transform: 'scale(1)' },
          ], { duration: T(260), delay: i * step, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }));
          later(i * step, () => Sound.puff(i));
        });
        later(puffs.length * step, () => Sound.bloop());
        cloud.style.opacity = '';
        return settle(cloud.animate(reducedMotion ? [{ opacity: 0 }, { opacity: 1 }] : [
          { opacity: 0, transform: 'scale(.1)' },
          { opacity: 1, transform: 'scale(1.07, 1.04)', offset: 0.55 },
          { opacity: 1, transform: 'scale(.97, .99)', offset: 0.8 },
          { opacity: 1, transform: 'scale(1)' },
        ], { duration: T(620), delay: puffs.length * step, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }));
      },
      // Already up and fully typed (to carry a cloud over from the screen before, unchanged).
      showNow() {
        root.classList.add('is-static');
        letters.forEach(letter => letter.classList.add('on'));
        root.style.opacity = '1';
        [cloud, ...puffs].forEach(n => { n.style.opacity = ''; });
        requestAnimationFrame(() => root.classList.remove('is-static'));
      },
      // The cloud melts away, then the puffs, back towards the head; then it is removed.
      hide() {
        const melt = (node, delay) => settle(node.animate(reducedMotion ? [{ opacity: 1 }, { opacity: 0 }] : [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.08)' },
        ], { duration: T(300), delay, easing: 'ease-in', fill: 'forwards' }));
        const gone = [melt(cloud, 0), ...puffs.slice().reverse().map((puff, i) => melt(puff, T(70) * (i + 1)))];
        return Promise.all(gone).then(() => root.remove());
      },
    });
  }

  // ---------- price badge (starburst) ----------

  function starPoints(spikes, outer, inner) {
    const pts = [];
    for (let i = 0; i < spikes * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / spikes;
      const rad = i % 2 ? inner : outer;
      pts.push(`${num(Math.cos(a) * rad)},${num(Math.sin(a) * rad)}`);
    }
    return pts.join(' ');
  }

  let gradientId = 0;

  // Starburst price tag centred on (x, y); `radius` is the outer radius of the spikes.
  function badge(parent, { x, y, text, radius = 80 }) {
    const R = radius;
    const pad = R * 0.25;
    const size = 2 * (R + pad);
    const root = el('div', 'badge', parent, { left: px(x), top: px(y) });
    el('div', 'badge-rays', root, { left: px(-R * 2), top: px(-R * 2), width: px(R * 4), height: px(R * 4) });
    const inner = el('div', 'badge-inner', root);
    const art = svg('svg', { viewBox: `${num(-R - pad)} ${num(-R - pad)} ${num(size)} ${num(size)}`, width: num(size), height: num(size) }, inner);
    Object.assign(art.style, { left: px(-(R + pad)), top: px(-(R + pad)) });
    const id = 'badge-grad-' + (++gradientId);
    const grad = svg('radialGradient', { id, cx: '42%', cy: '35%', r: '70%' }, svg('defs', {}, art));
    [['0%', '#fff3a3'], ['55%', '#ffcb3b'], ['100%', '#f59d12']].forEach(([offset, color]) => {
      svg('stop', { offset, 'stop-color': color }, grad);
    });
    const pts = starPoints(16, R, R * 0.86);
    svg('polygon', { class: 'burst-shadow', points: pts, transform: `translate(${num(R * 0.05)} ${num(R * 0.07)})` }, art);
    svg('polygon', { class: 'burst-line', points: pts }, art).style.strokeWidth = px(R * 0.1);
    svg('polygon', { points: pts, fill: `url(#${id})` }, art);
    const label = svg('text', { class: 'price', x: 0, y: num(R * 0.22) }, art);
    label.textContent = text;
    Object.assign(label.style, { fontSize: px(R * 0.64), strokeWidth: px(R * 0.1) });

    return {
      el: root,
      pop() {
        Sound.pop();
        root.classList.add('is-lit');
        return settle(root.animate([
          { transform: 'scale(0) rotate(-30deg)', opacity: 0 },
          { transform: 'scale(1.25) rotate(8deg)', opacity: 1, offset: 0.5 },
          { transform: 'scale(.9) rotate(-3deg)', opacity: 1, offset: 0.72 },
          { transform: 'scale(1.04) rotate(1deg)', opacity: 1, offset: 0.88 },
          { transform: 'scale(1) rotate(0deg)', opacity: 1 },
        ], { duration: 760, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }));
      },
    };
  }

  // ---------- question card ----------

  const ICON_CHECK = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 25l9 9 17-19"/></svg>';
  const ICON_CROSS = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 15l18 18M33 15L15 33"/></svg>';

  // Text with marked parts: {₹800} gets a highlighter swipe (class `markClass`), *Selling Price* is stressed,
  // and \n starts a new line.
  function richText(host, text, markClass = 'hl') {
    text.split(/(\{[^}]+\}|\*[^*]+\*)/).forEach(part => {
      if (!part) return;
      if (part[0] === '{') el('span', markClass, host).textContent = part.slice(1, -1);
      else if (part[0] === '*') el('strong', 'stress', host).textContent = part.slice(1, -1);
      else part.split('\n').forEach((line, i) => {
        if (i) el('br', '', host);
        if (line) host.appendChild(document.createTextNode(line));
      });
    });
    return host;
  }
  const plain = text => text.replace(/[{}*]/g, '').replace(/\s*\n\s*/g, ' ');

  // Text whose fractions are stacked: "30/100" is written 30 over a bar over 100, as on the worked sheets. The slash
  // stays in the text, hidden, so the text still reads (and copies) as "30/100".
  function fracText(host, text) {
    text.split(/(\d+\/\d+)/).forEach(part => {
      const m = /^(\d+)\/(\d+)$/.exec(part);
      if (!m) {
        if (part) host.appendChild(document.createTextNode(part));
        return;
      }
      const f = el('span', 'frac', host);
      el('span', 'frac-num', f).textContent = m[1];
      el('span', 'frac-slash', f).textContent = '/';
      el('span', 'frac-den', f).textContent = m[2];
    });
    return host;
  }

  // A wrong answer, felt as well as heard (the user, 2026-10-28: "when the user does wrong, a red light comes from the
  // frame's corners and it vibrates slightly", in all the story and the game): its buzz, a red glow in from the
  // screen's corners, and the picture shakes a little (not with motion turned down). The buttons and the nav stay put.
  let wrongGlow = null;
  function wrongFlash() {
    Sound.wrong();
    const stage = document.getElementById('stage');
    if (!stage) return;
    if (!wrongGlow || !wrongGlow.isConnected) wrongGlow = el('div', 'wrong-glow', stage);
    settle(wrongGlow.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' }));
    const scenes = document.getElementById('scenes');
    if (scenes && !reducedMotion) {
      settle(scenes.animate([{ translate: '0 0' }, { translate: '-7px 0' }, { translate: '6px 0' }, { translate: '-4px 0' },
        { translate: '2px 0' }, { translate: '0 0' }], { duration: 420, easing: 'ease-out' }));
    }
  }

  // Shows a node that was hidden with opacity 0, with an entrance animation (a plain fade if motion is reduced).
  function reveal(node, frames, opts) {
    node.style.opacity = '';
    if (reducedMotion) frames = [{ opacity: 0 }, { opacity: 1 }];
    return settle(node.animate(frames, Object.assign({ fill: 'backwards' }, opts)));
  }

  /**
   * Multiple-choice question card that swings in from the right.
   *  lines     question lines; wrap a part in {braces} to highlight it, e.g. '{₹800} is the —'
   *  options   [{ label, correct }]
   *  onAnswer  (correct, button) => void
   */
  function question(parent, { lines, options, onAnswer, fromLeft = false }) { // (fromLeft: a card on the left swings in from there)
    const pos = el('div', 'qcard-pos', parent);
    const card = el('div', 'qcard', pos);
    card.setAttribute('role', 'group');
    const tape = el('div', 'qcard-tape', card);
    const q = el('div', 'qcard-q', card);
    const lineEls = lines.map(text => richText(el('div', 'q-line', q), text, 'q-mark hl'));
    const marks = Array.from(q.querySelectorAll('.q-mark'));
    const list = el('div', 'qcard-options', card);
    card.setAttribute('aria-label', plain(lines.join(' ')));

    let answered = false;
    const buttons = options.map((opt, i) => {
      const b = el('button', 'q-opt', list);
      b.type = 'button';
      b.disabled = true; // enabled once the card has finished arriving
      const chip = el('span', 'q-chip', b);
      chip.textContent = String.fromCharCode(65 + i);
      el('span', 'q-label', b).textContent = opt.label;
      b.addEventListener('click', () => {
        if (answered || b.disabled) return;
        if (opt.correct) {
          answered = true;
          b.classList.add('is-correct');
          chip.innerHTML = ICON_CHECK;
          buttons.forEach(other => {
            other.disabled = true;
            if (other !== b) other.classList.add('is-dim');
          });
          Sound.correct();
          settle(card.animate([
            { transform: 'none' },
            { transform: 'translateY(-12px) rotate(-1deg)', offset: 0.4 },
            { transform: 'none' },
          ], { duration: 560, easing: 'cubic-bezier(.3,.7,.4,1)' }));
        } else {
          b.classList.add('is-wrong');
          chip.innerHTML = ICON_CROSS;
          b.disabled = true; // the player can still pick another answer
          wrongFlash();
        }
        if (onAnswer) onAnswer(!!opt.correct, b);
      });
      return b;
    });

    // Everything inside starts hidden and is revealed in turn by enter().
    const staged = [tape, ...lineEls, ...marks, ...buttons];
    staged.forEach(n => { n.style.opacity = '0'; });

    return {
      el: pos,
      card,
      // Blocks every answer while feedback plays.
      lock() {
        buttons.forEach(b => { b.disabled = true; });
      },
      // Lets the player answer again (after a wrong answer: it stays crossed out).
      unlock() {
        buttons.forEach(b => { if (!b.classList.contains('is-wrong')) b.disabled = false; });
      },
      // Shows the right answer, as if it had been picked (no more tries: after the last hint).
      showAnswer() {
        answered = true;
        buttons.forEach((b, i) => {
          b.disabled = true;
          if (options[i].correct) {
            b.classList.add('is-correct');
            b.querySelector('.q-chip').innerHTML = ICON_CHECK;
          } else if (!b.classList.contains('is-wrong')) b.classList.add('is-dim');
        });
        Sound.ding();
      },
      // Shrinks the card out of the way while a bigger panel is up.
      hide() {
        return settle(card.animate([
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(40px) scale(.86)' },
        ], { duration: reducedMotion ? 1 : T(360), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
      },
      // Turns the card over to show the result, e.g. "Correct!" and why. `wide`: it turns over wider (css .is-wide),
      // as tall as what is on it, so the reason runs in full lines. `wrong`: "Not quite!", in grey, with a ✗.
      async flip({ title, text, wide = false, wrong = false }) {
        const back = el('div', wrong ? 'qcard-back is-wrong' : 'qcard-back', card);
        back.setAttribute('role', 'status');
        const head = el('div', 'qback-head', back);
        const tick = el('span', 'qback-tick', head);
        tick.innerHTML = wrong ? ICON_CROSS : ICON_CHECK;
        el('span', 'qback-title', head).textContent = title;
        const body = richText(el('div', 'qback-text', back), text);
        back.style.visibility = 'hidden';

        const P = 'perspective(1600px) ';
        Sound.swish();
        const turn = card.animate([{ transform: P + 'rotateY(0deg)' }, { transform: P + 'rotateY(90deg)' }], {
          duration: reducedMotion ? 1 : T(260), easing: 'cubic-bezier(.55,0,.8,.45)', fill: 'forwards',
        });
        await settle(turn);
        q.style.visibility = 'hidden';
        list.style.visibility = 'hidden';
        if (wide) { // edge-on now: it widens unseen
          pos.style.transition = 'none';
          pos.classList.add('is-wide');
          q.style.display = 'none';
          list.style.display = 'none';
          void pos.offsetWidth;
          pos.style.transition = '';
        }
        back.style.visibility = '';
        card.setAttribute('aria-label', `${title} ${plain(text)}`);
        const land = card.animate([
          { transform: P + 'rotateY(-90deg)' },
          { transform: P + 'rotateY(8deg)', offset: 0.7 },
          { transform: P + 'rotateY(0deg)' },
        ], { duration: reducedMotion ? 1 : T(520), easing: 'cubic-bezier(.2,.7,.3,1)' });
        turn.cancel();

        // The green header drops in, the tick pops (with a ding), then the explanation.
        reveal(head, [{ transform: 'translateY(-105%)' }, { transform: 'none' }], {
          duration: T(420), delay: T(140), easing: 'cubic-bezier(.2,.8,.3,1)',
        });
        reveal(tick, [
          { transform: 'scale(0) rotate(-120deg)' },
          { transform: 'scale(1.25) rotate(8deg)', offset: 0.65 },
          { transform: 'none' },
        ], { duration: T(520), delay: T(330), easing: 'cubic-bezier(.2,.8,.3,1)' });
        if (!wrong) setTimeout(() => Sound.ding(), T(380));
        reveal(body, [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }], {
          duration: T(600), delay: T(480), easing: 'cubic-bezier(.25,.1,.25,1)',
        });
        setTimeout(() => body.querySelectorAll('.hl').forEach(m => m.classList.add('is-marked')), T(1100));
        await settle(land);
      },
      // Swings in from the right, then reveals the tape, the question and the buttons one by one.
      async enter(ctx) {
        if (reducedMotion) {
          staged.forEach(n => { n.style.opacity = ''; });
          marks.forEach(m => m.classList.add('is-marked'));
          settle(card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }));
          buttons.forEach(b => { b.disabled = false; });
          return;
        }
        Sound.whoosh();
        const k = fromLeft ? -1 : 1;
        settle(card.animate([
          { transform: `translateX(${135 * k}%) rotate(${9 * k}deg)` },
          { transform: `translateX(${-5 * k}%) rotate(${-2.5 * k}deg)`, offset: 0.62 },
          { transform: `translateX(${1.5 * k}%) rotate(${0.8 * k}deg)`, offset: 0.82 },
          { transform: 'translateX(0) rotate(0deg)' },
        ], { duration: T(950), easing: 'cubic-bezier(.22,.9,.28,1)' }));

        await ctx.wait(60); // its words come in with it (it is never empty)
        reveal(tape, [
          { opacity: 0, transform: 'translateY(-46px) rotate(-18deg) scale(.6)' },
          { opacity: 1, transform: 'translateY(4px) rotate(-2deg) scale(1.06)', offset: 0.7 },
          { opacity: 1, transform: 'rotate(-4deg)' },
        ], { duration: T(420), easing: 'cubic-bezier(.3,.8,.4,1.2)' });

        await ctx.wait(140);
        for (const line of lineEls) {
          reveal(line, [
            { opacity: 0, transform: 'translateY(22px)' },
            { opacity: 1, transform: 'none' },
          ], { duration: T(420), easing: 'cubic-bezier(.2,.8,.3,1)' });
          await ctx.wait(200); // (one line, then the next: the user, 2026-10-29, "things come one by one")
        }

        if (marks.length) Sound.pop();
        marks.forEach(m => reveal(m, [
          { opacity: 0, transform: 'scale(.3) rotate(-8deg)' },
          { opacity: 1, transform: 'scale(1.18) rotate(3deg)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(520), easing: 'cubic-bezier(.2,.8,.3,1)' }));
        await ctx.wait(240);
        marks.forEach(m => m.classList.add('is-marked')); // highlighter swipes in behind it

        await ctx.wait(260);
        for (const b of buttons) {
          reveal(b, [
            { opacity: 0, transform: 'translateX(70px) scale(.92)' },
            { opacity: 1, transform: 'translateX(-6px) scale(1.01)', offset: 0.7 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(520), easing: 'cubic-bezier(.2,.8,.3,1)' });
          Sound.bloop();
          await ctx.wait(280); // (each answer on its own, in turn)
        }

        await ctx.wait(300);
        buttons.forEach(b => { b.disabled = false; });
      },
    };
  }

  // ---------- attention ring ----------

  // A glowing ring that pulses around a spot (e.g. a price sticker) to draw the eye to it, centred on (x, y):
  // a circle of radius `r`, or a w × h frame with rounded corners (`round` px), e.g. around a price tag.
  // It closes in on the spot as it appears; { instant: true } puts it there at once (carried over a cut).
  function ring(parent, { x, y, r = 0, w = 2 * r, h = 2 * r, round, instant = false }) {
    const node = el('div', 'spot-ring', parent, { left: px(x - w / 2), top: px(y - h / 2), width: px(w), height: px(h) });
    if (round !== undefined) node.style.setProperty('--ring-round', px(round));
    if (!instant) {
      reveal(node, [{ opacity: 0, transform: 'scale(1.7)' }, { opacity: 1, transform: 'none' }], {
        duration: T(600), easing: 'cubic-bezier(.2,.8,.3,1)',
      });
    }
    return node;
  }

  // ---------- marks on the picture (a line struck through, a tag stuck on) ----------

  // A red line across something on the picture (e.g. an old price), from `from` to `to` (stage px).
  // draw() draws it, with a marker scribble; showNow() shows it already drawn.
  function strike(parent, { from: [x0, y0], to: [x1, y1] }) {
    const pad = 12;
    const left = Math.min(x0, x1) - pad;
    const top = Math.min(y0, y1) - pad;
    const w = Math.abs(x1 - x0) + 2 * pad;
    const h = Math.abs(y1 - y0) + 2 * pad;
    const art = svg('svg', { class: 'strike', width: num(w), height: num(h), viewBox: `0 0 ${num(w)} ${num(h)}` }, parent);
    Object.assign(art.style, { left: px(left), top: px(top), opacity: '0' });
    const path = svg('path', { pathLength: 1, d: `M ${num(x0 - left)} ${num(y0 - top)} L ${num(x1 - left)} ${num(y1 - top)}` }, art);
    return {
      el: art,
      draw() {
        Sound.scribble();
        art.style.opacity = '';
        return settle(path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: reducedMotion ? 1 : T(420), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards',
        }));
      },
      showNow() {
        art.style.opacity = '';
      },
    };
  }

  // A price tag stuck onto the picture (e.g. on a shop's stand), centred on (x, y), a little tilted; `tone`
  // 'green' is a new price. stamp() lands it like a stamp; showNow() shows it already stuck on.
  function stickTag(parent, { x, y, text, tone = 'green' }) {
    const tag = el('div', `stick-tag stick-tag--${tone}`, parent);
    tag.textContent = text;
    tag.setAttribute('role', 'img');
    tag.setAttribute('aria-label', text);
    Object.assign(tag.style, { left: px(x - tag.offsetWidth / 2), top: px(y - tag.offsetHeight / 2), opacity: '0' });
    return {
      el: tag,
      stamp() {
        Sound.stamp();
        return reveal(tag, [
          { opacity: 0, transform: 'scale(1.9) rotate(-12deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(0deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' }, // (it lands straight: the user, 2026-10-21)
        ], { duration: T(600), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      showNow() {
        tag.style.opacity = '';
      },
    };
  }

  // ---------- "price on the book" panel (Marked Price) ----------

  let artId = 0;

  // The book "A Brighter Tomorrow" with its price sticker, drawn to match the cover in the story art.
  function bookArt(price) {
    const id = 'mp' + (++artId);
    const bars = [0, 5, 9, 15, 18, 24, 30, 33, 39, 44, 48, 54, 59, 63, 69, 74, 78, 84]
      .map((x, i) => `<rect x="${14 + x}" y="46" width="${i % 3 === 1 ? 3.5 : 2}" height="22"/>`).join('');
    return `<svg class="mp-book-art" viewBox="0 0 400 540" aria-hidden="true">
  <defs>
    <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f86e3"/><stop offset="1" stop-color="#1d50a8"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f7ff"/><stop offset="1" stop-color="#8fcaf5"/></linearGradient>
    <clipPath id="${id}k"><rect x="14" y="10" width="350" height="500" rx="18"/></clipPath>
  </defs>
  <rect class="mp-pages" x="34" y="26" width="352" height="506" rx="14"/>
  <path class="mp-page-lines" d="M374 46 V514 M364 42 V518"/>
  <rect x="14" y="10" width="350" height="500" rx="18" fill="url(#${id}c)"/>
  <g clip-path="url(#${id}k)">
    <rect x="14" y="10" width="40" height="500" fill="rgba(0,0,0,.16)"/>
    <circle cx="232" cy="352" r="38" fill="#ffd36b"/>
    <path d="M54 400 L128 332 L186 378 L258 306 L364 398 V510 H54 Z" fill="#1b3f7a"/>
    <path d="M54 438 Q140 404 220 436 T364 428 V510 H54 Z" fill="#132f5c"/>
    <path d="M206 510 C236 482 176 462 220 442 C246 430 226 416 236 406 L244 406 C238 418 262 432 232 448 C196 466 254 486 232 510 Z" fill="url(#${id}r)"/>
  </g>
  <rect class="mp-cover-line" x="14" y="10" width="350" height="500" rx="18"/>
  <text class="mp-book-title" x="80" y="84">A Brighter</text>
  <text class="mp-book-title" x="80" y="126">Tomorrow</text>
  <path class="mp-book-text" d="M80 168 H318 M80 192 H300 M80 216 H312 M80 240 H262"/>
  <g class="mp-sticker" transform="translate(236 412) rotate(-3)">
    <rect class="mp-sticker-card" width="112" height="78" rx="10"/>
    <text x="56" y="34">${price}</text>
    <g class="mp-bars">${bars}</g>
  </g>
</svg>`;
  }

  // A formula on a yellow sticky note: segments [{ t, tone }] (a tone for a term: 'mp', 'sp', 'd', 'part', 'whole').
  // { small }: the note as it is kept in the notebook, or shown again at the start of the next topic.
  function formulaNote(parent, segments, { small = false } = {}) {
    const note = el('div', small ? 'f-note f-note--small' : 'f-note', parent);
    segments.forEach(({ t, tone }) => { el('span', tone ? `tone-${tone}` : 'f-op', note).textContent = t; });
    note.setAttribute('aria-label', segments.map(s => s.t).join(' '));
    return note;
  }

  /**
   * The revamp's Concept layout (rule 5): a value on a taped paper note (it flies in from the story's snapshot: see
   * game.js), the new word under it, big, in its colour, and one line saying what it means.
   *  value, term, abbr, meaning, tone ('mp' | 'sp' | 'd')
   * showNote() → showTerm() → showMeaning(): each comes in, and returns what came in.
   */
  function concept(parent, { value, term, abbr, meaning, tone = 'mp' }) {
    const root = el('div', 'mp', parent); // the content area (see .is-v2 .mp)
    const box = el('div', `cn cn--${tone}`, root);
    const note = el('div', 'cn-note', box);
    const valueEl = el('div', 'cn-value', note);
    valueEl.textContent = value;
    const termEl = el('div', 'cn-term', box);
    el('span', '', termEl).textContent = term;
    if (abbr) el('span', 'cn-abbr', termEl).textContent = ` ${abbr}`;
    const meaningEl = el('div', 'cn-meaning', box);
    meaningEl.textContent = meaning;
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', `${value}: ${term} ${abbr || ''}. ${meaning}`);
    [note, termEl, meaningEl].forEach(n => { n.style.opacity = '0'; });
    const pop = (node, from) => {
      reveal(node, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: T(560), easing: 'cubic-bezier(.2,.8,.3,1)' });
      return node;
    };
    return {
      el: root,
      note,
      value: valueEl,
      term: termEl,
      meaning: meaningEl,
      showNote: () => pop(note, 'scale(.92)'),
      showTerm: () => pop(termEl, 'translateY(18px)'),
      showMeaning: () => pop(meaningEl, 'translateY(14px)'),
    };
  }

  /**
   * A bar model (the revamp, screens 17, 32 and 34): the whole amount as a long bar, then split into its parts.
   *  total   { value, label, tone }: what the whole bar is (written over it)
   *  parts   [{ value, label, tone, share }]: the parts, left to right (shares add up to 1)
   *  tenths  { each, shade, label, tone }: or the bar cut into ten equal parts of `each`, `shade` of them shaded
   * open() draws the bar; split() divides it (or cuts it into tenths); shade() shades the tenths, one at a time.
   */
  function barModel(parent, { total, parts = [], tenths = null }) {
    const root = el('div', 'bm', parent);
    const head = el('div', `bm-total tone-${total.tone}`, root);
    el('b', '', head).textContent = total.value;
    el('span', '', head).textContent = ` ${total.label}`;
    const bar = el('div', 'bm-bar', root);
    const segs = tenths
      ? Array.from({ length: 10 }, () => el('div', `bm-seg bm-tenth tone-${tenths.tone}`, bar))
      : parts.map(p => {
        const seg = el('div', `bm-seg bm-seg--${p.tone}`, bar);
        seg.style.flex = String(p.share);
        el('b', `tone-${p.tone}`, seg).textContent = p.value;
        el('small', '', seg).textContent = p.label;
        return seg;
      });
    if (tenths) segs.forEach(seg => { el('small', '', seg).textContent = tenths.each; });
    segs.forEach((seg, i) => seg.style.setProperty('--i', String(i))); // (split: they come in turn, left to right: css)
    const note = tenths ? el('div', `bm-note tone-${tenths.tone}`, root) : null;
    if (note) note.textContent = tenths.label;
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', tenths
      ? `${total.value} cut into ten parts of ${tenths.each}; ${tenths.label}`
      : `${total.value} ${total.label} = ${parts.map(p => `${p.value} ${p.label}`).join(' + ')}`);
    [root, ...(note ? [note] : [])].forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      bar,
      segs,
      note,
      async open(ctx) {
        reveal(root, [{ opacity: 0 }, { opacity: 1 }], { duration: T(350), easing: 'ease-out' }); // (as the panel's paper grows to it)
        await settle(bar.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
          { duration: reducedMotion ? 1 : T(700), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards' }));
      },
      split() {
        root.classList.add('is-split');
        return Sound.swish();
      },
      async shade(ctx) {
        for (let i = 0; i < tenths.shade; i++) {
          segs[i].classList.add('is-shaded');
          await ctx.wait(T(260));
        }
        note.style.opacity = '';
        reveal(note, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: T(420) });
      },
    };
  }

  /**
   * A 10 × 10 grid of squares (the revamp, screens 28–30): `shade` of the hundred shaded in the part's colour, and under
   * it what that is (e.g. "25 out of 100 = 25%"). fill() shades them, a row at a time.
   */
  function grid100(parent, { shade, label }) {
    const root = el('div', 'g100', parent);
    const grid = el('div', 'g100-grid', root);
    const cells = Array.from({ length: 100 }, () => el('span', 'g100-cell', grid));
    const caption = el('div', 'g100-label', root);
    caption.textContent = label;
    root.setAttribute('role', 'img');
    root.setAttribute('aria-label', `A grid of 100 squares, ${shade} shaded: ${label}`);
    root.style.opacity = '0';
    caption.style.opacity = '0';
    return {
      el: root,
      open() {
        return reveal(root, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: T(500), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      async fill(ctx) {
        for (let i = 0; i < shade; i += 10) {
          cells.slice(i, Math.min(shade, i + 10)).forEach(c => c.classList.add('is-on'));
          await ctx.wait(T(150));
        }
        caption.style.opacity = '';
        reveal(caption, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: T(420) });
      },
      shown() { // already filled (carried over from the screen before)
        root.style.opacity = '';
        caption.style.opacity = '';
        cells.slice(0, shade).forEach(c => c.classList.add('is-on'));
      },
    };
  }

  // Big down arrow (shaft and head in one outlined shape) for "this becomes that": 'blue', or 'red' for a reduction.
  const ARROW_TONES = {
    blue: ['#d9e8f6', '#6f97c2', '#2a5687'],
    red: ['#ffd0cc', '#ff6b5e', '#d32f2f'],
  };
  function downArrow(tone = 'blue') {
    const id = 'da' + (++artId);
    const [a, b, c] = ARROW_TONES[tone];
    return `<svg class="cmp-arrow" viewBox="0 0 96 168" aria-hidden="true">
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>
  <path d="M33 8 H63 V102 H86 L48 160 L10 102 H33 Z" fill="url(#${id})"/>
</svg>`;
  }

  // A node's box in a panel's own pixels (the stage is scaled to fit the window), measured from the inside
  // of the panel's border: where an absolutely positioned child of the panel at left/top 0 starts.
  function panelBox(panel, node) {
    const P = panel.getBoundingClientRect();
    const k = P.width / panel.offsetWidth;
    const r = node.getBoundingClientRect();
    const x0 = P.left + panel.clientLeft * k;
    const y0 = P.top + panel.clientTop * k;
    return { l: (r.left - x0) / k, t: (r.top - y0) / k, r: (r.right - x0) / k, b: (r.bottom - y0) / k };
  }

  /**
   * A copy of `text` flies from `from` to `to` (both inside `panel`, which must be positioned), starting the
   * size of `from` and ending the size of `to`; then `to` is shown. { card } starts it as a white sticker card
   * that it sheds on the way (a price lifting off a sticker). `cls` colours the copy; `lift` is the arc's height.
   */
  async function flyInto(panel, from, to, { text, cls = '', card = false, lift = 120, ms = 950 } = {}) {
    const chip = el('div', `fly-chip${card ? ' fly-chip--card' : ''}${cls ? ' ' + cls : ''}`, panel);
    chip.textContent = text;
    chip.style.fontSize = getComputedStyle(to).fontSize;
    const a = panelBox(panel, from);
    const b = panelBox(panel, to);
    const w = chip.offsetWidth;
    const h = chip.offsetHeight;
    const k0 = card // starts the size of the sticker, or of the text it is copied from
      ? (a.b - a.t) / h
      : parseFloat(getComputedStyle(from).fontSize) / parseFloat(chip.style.fontSize);
    const x0 = (a.l + a.r) / 2 - w / 2;
    const y0 = (a.t + a.b) / 2 - h / 2;
    const x1 = (b.l + b.r) / 2 - w / 2;
    const y1 = (b.t + b.b) / 2 - h / 2;
    const top = Math.min(y0, y1) - lift;
    const solid = card ? { backgroundColor: '#ffffff', borderColor: '#1b2a33' } : {};
    const shed = card ? { backgroundColor: 'rgba(255, 255, 255, 0)', borderColor: 'rgba(27, 42, 51, 0)' } : {};
    await settle(chip.animate([
      Object.assign({ transform: `translate(${num(x0)}px, ${num(y0)}px) scale(${num(k0)}) rotate(-3deg)` }, solid),
      Object.assign({ transform: `translate(${num((x0 + x1) / 2)}px, ${num(top)}px) scale(${num((k0 + 1) / 2)}) rotate(5deg)`, offset: 0.5 }, solid),
      Object.assign({ transform: `translate(${num(x1)}px, ${num(y1)}px) scale(1) rotate(0deg)` }, shed),
    ], { duration: reducedMotion ? 1 : T(ms), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }));
    to.style.opacity = '';
    chip.remove();
  }

  /**
   * The book on the left, then a sum built one piece at a time: three boxes ({ label, value, tone }) with
   * the operators between them (ops, e.g. ['−', '=']). { namesLater: true }: the boxes show their amounts only, and
   * name(i) writes box i's name in above its amount (its place is kept, so nothing moves).
   * Reveal it with open() → showBook() → highlight() → box(0, { empty: true }) → fly() → op(0) → box(1) → …
   * ping(node) makes a box or operator pop with a ring (for reading the formula out); glow(i) keeps a box glowing.
   */
  function formulaPanel(parent, { price, terms, ops, namesLater = false }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', 'fm-panel', root);
    const bookBox = el('div', 'fm-book', panel);
    bookBox.innerHTML = bookArt(price);
    const sticker = bookBox.querySelector('.mp-sticker-card');
    const side = el('div', 'fm-side', panel); // the sum, and under it what is added later (screen 14: the bar)
    const row = el('div', 'fm-row', side);
    const boxes = [];
    const values = [];
    const names = [];
    const opEls = [];
    terms.forEach((term, i) => {
      if (i) {
        const op = el('div', 'fm-op', row);
        op.textContent = ops[i - 1];
        opEls.push(op);
      }
      const box = el('div', `cmp-box cmp-box--${term.tone} fm-box`, row);
      const name = el('div', 'cmp-label', box);
      name.textContent = term.label;
      if (namesLater) name.style.opacity = '0'; // written in later (name(i))
      const value = el('div', 'cmp-price', box);
      value.textContent = term.value;
      boxes.push(box);
      values.push(value);
      names.push(name);
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', terms.map((t, i) => `${i ? ops[i - 1] + ' ' : ''}${t.label} ${t.value}`).join(' '));
    [panel, bookBox, ...boxes, ...opEls].forEach(n => { n.style.opacity = '0'; });
    const local = node => panelBox(panel, node);
    const popIn = (node, big) => reveal(node, [
      { opacity: 0, transform: big ? 'scale(1.9) rotate(-8deg)' : 'scale(.55)' },
      { opacity: 1, transform: big ? 'scale(.94) rotate(1deg)' : 'scale(1.07)', offset: 0.62 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(big ? 600 : 560), easing: 'cubic-bezier(.2,.8,.3,1)' });

    return {
      el: root,
      panel,
      side,
      boxes,
      ops: opEls,
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      showBook() {
        Sound.bloop();
        return reveal(bookBox, [
          { opacity: 0, transform: 'translateY(60px) rotate(-6deg) scale(.9)' },
          { opacity: 1, transform: 'translateY(-6px) rotate(1deg) scale(1.02)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(800), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // A pulsing ring around the price sticker on the book.
      highlight() {
        const s = local(sticker);
        Sound.sparkle();
        return ring(panel, { x: (s.l + s.r) / 2, y: (s.t + s.b) / 2, r: Math.max(s.r - s.l, s.b - s.t) * 0.72 });
      },
      // Box i pops in; { empty } keeps its value hidden (fly() fills it), { stamp } lands it like a stamp.
      box(i, { empty = false, stamp = false } = {}) {
        if (empty) values[i].style.opacity = '0';
        if (stamp) Sound.stamp();
        else Sound.bloop();
        return popIn(boxes[i], stamp);
      },
      op(i) {
        Sound.pop();
        return popIn(opEls[i]);
      },
      // The price lifts off the sticker on the book and flies into the first box, growing as it goes and
      // shedding its white sticker card, so it lands as the box's own value.
      async fly() {
        Sound.swish();
        await flyInto(panel, sticker, values[0], { text: price, card: true });
        Sound.pop();
        await reveal(values[0], [{ transform: 'scale(1.18)' }, { transform: 'none' }], {
          duration: T(320), easing: 'cubic-bezier(.3,1.6,.5,1)',
        });
      },
      // Box i's name is written in above its amount, left to right.
      name(i) {
        Sound.scribble();
        return reveal(names[i], [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
          duration: T(560), easing: 'cubic-bezier(.3,.1,.3,1)',
        });
      },
      // A box or operator pops, with a ring in its colour.
      ping(node) {
        node.classList.remove('is-ping');
        void node.offsetWidth; // restart the animation
        node.classList.add('is-ping');
      },
      // Box i keeps glowing (the answer).
      glow(i) {
        boxes[i].classList.remove('is-ping');
        boxes[i].classList.add('is-key');
      },
    };
  }

  // ---------- formula reveal (Discount = Marked Price − Selling Price, then D = MP − SP) ----------

  /**
   * A formula in words on a pink strip, and under it the same formula in short, made from the words'
   * first letters. terms: [{ words, short, tone: 'd' | 'mp' | 'sp' }], ops: e.g. ['=', '−'].
   * Reveal it with open() → term(i) / op(i) (the strip) → showShort() → lightUp(i) → fly(i) / shortOp(i).
   * ping(node) makes a part pop. `foot` is the empty space at the bottom (it keeps the formula a little above the middle).
   */
  function formulaReveal(parent, { terms, ops }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', 'fr-panel', root);
    const strip = el('div', 'fr-strip', panel);
    const shortBox = el('div', 'fr-short', panel);
    const foot = el('div', 'fr-foot', panel);
    const longTerms = [];
    const longOps = [];
    const shortTerms = [];
    const shortOps = [];
    const initials = []; // per term: the first-letter spans in the strip
    const letters = []; // per term: the letter spans in the short form
    terms.forEach((term, i) => {
      if (i) {
        longOps.push(Object.assign(el('span', 'fr-op', strip), { textContent: ops[i - 1] }));
        shortOps.push(Object.assign(el('span', 'fr-op', shortBox), { textContent: ops[i - 1] }));
      }
      const long = el('span', `fr-term tone-${term.tone}`, strip);
      const firsts = [];
      term.words.split(' ').forEach((word, j) => {
        if (j) long.appendChild(document.createTextNode(' '));
        firsts.push(Object.assign(el('span', 'fr-ini', long), { textContent: word[0] }));
        long.appendChild(document.createTextNode(word.slice(1)));
      });
      longTerms.push(long);
      initials.push(firsts);
      const short = el('span', `fr-term tone-${term.tone}`, shortBox);
      letters.push(Array.from(term.short).map(c => Object.assign(el('span', 'fr-letter', short), { textContent: c })));
      shortTerms.push(short);
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', terms.map((t, i) => `${i ? ops[i - 1] + ' ' : ''}${t.words}`).join(' ') + '. In short: ' +
      terms.map((t, i) => `${i ? ops[i - 1] + ' ' : ''}${t.short}`).join(' '));
    [panel, strip, shortBox, ...longTerms, ...longOps, ...shortOps, ...letters.flat()].forEach(n => { n.style.opacity = '0'; });
    const showStrip = sheetFirst(strip);
    const local = node => panelBox(panel, node);
    const popIn = node => reveal(node, [
      { opacity: 0, transform: 'scale(.5)' },
      { opacity: 1, transform: 'scale(1.1)', offset: 0.62 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(520), easing: 'cubic-bezier(.2,.8,.3,1)' });
    const springUp = node => reveal(node, [
      { opacity: 0, transform: 'translateY(40px) scale(.9)' },
      { opacity: 1, transform: 'translateY(-4px) scale(1.01)', offset: 0.7 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(600), easing: 'cubic-bezier(.2,.8,.3,1)' });

    return {
      el: root,
      panel,
      foot,
      shortBox,
      longTerms,
      longOps,
      shortTerms,
      shortOps,
      // The panel springs up (its pink strip comes in with the first word: see term).
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      async term(i) {
        await showStrip();
        Sound.bloop();
        return popIn(longTerms[i]);
      },
      op(i) {
        Sound.pop();
        return popIn(longOps[i]);
      },
      // The blue box for the short form (shown just as the first letters fly down into it).
      showShort() {
        Sound.bloop();
        return springUp(shortBox);
      },
      // Term i's first letters light up in the strip.
      lightUp(i) {
        Sound.sparkle();
        initials[i].forEach(ini => ini.classList.add('is-lit'));
      },
      // Term i's first letters lift out of the strip and fly down into the short form, growing as they go.
      async fly(i) {
        Sound.swish();
        await Promise.all(initials[i].map(async (ini, j) => {
          const target = letters[i][j];
          const chip = el('span', `fr-chip tone-${terms[i].tone}`, panel);
          chip.textContent = ini.textContent;
          const a = local(ini);
          const b = local(target);
          const w = chip.offsetWidth;
          const h = chip.offsetHeight;
          const k0 = (a.b - a.t) / (b.b - b.t); // starts the size of the letter in the strip
          const x0 = (a.l + a.r) / 2 - w / 2;
          const y0 = (a.t + a.b) / 2 - h / 2;
          const x1 = (b.l + b.r) / 2 - w / 2;
          const y1 = (b.t + b.b) / 2 - h / 2;
          await settle(chip.animate([
            { transform: `translate(${num(x0)}px, ${num(y0)}px) scale(${num(k0)})` },
            { transform: `translate(${num(x0)}px, ${num(y0 - 34)}px) scale(${num(k0 * 1.25)})`, offset: 0.22 },
            { transform: `translate(${num(x1)}px, ${num(y1)}px) scale(1)` },
          ], { duration: reducedMotion ? 1 : T(760 + j * 90), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }));
          target.style.opacity = '';
          chip.remove();
        }));
        Sound.pop();
        await reveal(shortTerms[i], [{ transform: 'scale(1.15)' }, { transform: 'none' }], {
          duration: T(300), easing: 'cubic-bezier(.3,1.6,.5,1)',
        });
      },
      shortOp(i) {
        Sound.pop();
        return popIn(shortOps[i]);
      },
      // A part of either formula pops (for reading it out).
      ping(node) {
        node.classList.remove('is-ping');
        void node.offsetWidth; // restart the animation
        node.classList.add('is-ping');
      },
    };
  }

  // ---------- an item with its price and discount tags, and a question about it; worked lines ----------

  // The photo of an item with its price tag hanging on it (like the white tag on the sneakers in the shop's
  // pictures), and under the photo its discount tag (like the red one on the stand), built in `host`. `knot` is
  // where the price tag is tied, in % of the photo ([left, top]). showPhoto(), showPrice() (the tag drops on and
  // swings on its string) and showOff() (it lands like a stamp, then a gold frame glows around it) reveal them;
  // `percent` is the discount tag's first line (e.g. "30%").
  function productParts(host, { photo, price, off, knot = [50, 40] }) {
    const shot = el('div', 'pc-shot', host);
    const pic = el('div', 'pc-photo', shot);
    const img = el('img', '', pic);
    img.src = photo;
    img.alt = '';
    img.draggable = false;
    const hang = el('div', 'pc-hang', shot); // the string and the tag, hanging from the knot
    hang.style.left = knot[0] + '%';
    hang.style.top = knot[1] + '%';
    el('span', 'pc-string', hang);
    const priceTag = el('div', 'pc-price', hang);
    el('span', 'pc-hole', priceTag);
    el('span', 'pc-price-value', priceTag).textContent = price;
    const tags = el('div', 'pc-tags', host);
    const offPos = el('div', 'pc-off-pos', tags); // tilted like the tag on the stand; its gold frame turns with it
    const offTag = el('div', 'pc-off', offPos);
    const lines = off.map(t => Object.assign(el('span', 'pc-off-line', offTag), { textContent: t }));
    [pic, hang, offTag].forEach(n => { n.style.opacity = '0'; });
    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    const SWING = 'cubic-bezier(.45,0,.55,1)';
    return {
      photo: pic,
      priceTag,
      offTag,
      percent: lines[0],
      showPhoto() {
        Sound.bloop();
        return reveal(pic, [
          { opacity: 0, transform: 'translateY(30px) scale(.92)' },
          { opacity: 1, transform: 'translateY(-4px) scale(1.01)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(700), easing: EASE });
      },
      // The price tag drops onto the sneakers and swings on its string until it hangs still.
      showPrice() {
        Sound.pop();
        return reveal(hang, [
          { opacity: 0, transform: 'translateY(-40px) rotate(-26deg)', easing: 'ease-out' },
          { opacity: 1, transform: 'rotate(15deg)', offset: 0.3, easing: SWING },
          { opacity: 1, transform: 'rotate(-8deg)', offset: 0.56, easing: SWING },
          { opacity: 1, transform: 'rotate(3deg)', offset: 0.8, easing: SWING },
          { opacity: 1, transform: 'none' },
        ], { duration: T(1000) });
      },
      async showOff() {
        Sound.stamp();
        await reveal(offTag, [
          { opacity: 0, transform: 'scale(1.9) rotate(-11deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(600), easing: EASE });
        Sound.sparkle();
        const w = offPos.offsetWidth;
        const h = offPos.offsetHeight;
        ring(offPos, { x: w / 2, y: h / 2, w: w + 28, h: h + 28, round: 27 });
      },
    };
  }

  // A panel springs up (the same entrance as the other panels).
  const springUp = node => {
    Sound.whoosh();
    return reveal(node, [
      { opacity: 0, transform: 'translateY(80px) scale(.82)' },
      { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
  };

  /**
   * An item and a question about it: on the left the item's photo with its price tag and discount tag (as on
   * the product card), on the right the question on a pink strip, with room under it for answer buttons
   * (`below`, see choices).
   *  question  the question (\n starts a new line); photo, price, off, knot as for productCard
   *  wide      bigger, across the room a Next button would take (for a question that moves on by itself)
   *  hint      a rule to use, shown under the question on a light-blue band: [{ t, cls }] (see showHint)
   * Reveal it with open() → showItem(ctx) → showQuestion() (→ showHint()); ping(node) pops a tag (priceTag,
   * offTag, percent) or the hint.
   */
  function productQuestion(parent, { photo, price, off, knot, question, wide = false, hint = null }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', classes('pqp-panel', wide && 'pqp-panel--wide'), root);
    const item = productParts(el('div', 'pqp-item', panel), { photo, price, off, knot });
    const side = el('div', 'pqp-side', panel);
    const strip = el('div', 'pqp-question', side);
    strip.textContent = question;
    const hintEl = hint ? el('div', 'pqp-hint', side) : null;
    if (hint) {
      el('span', 'pqp-hint-label', hintEl).textContent = 'Hint:';
      hint.forEach(seg => { el('span', seg.cls || '', hintEl).textContent = seg.t; });
    }
    const below = el('div', 'pqp-answers', side);
    const slot = hint ? null : el('div', 'q-slot', side); // under the answers: what to remember after a wrong answer
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${price}, ${off.join(' ')}. ${question.replace(/\n/g, ' ')}` +
      (hint ? ` Hint: ${hint.map(seg => seg.t).join(' ')}` : ''));
    [panel, strip, hintEl].forEach(n => { if (n) n.style.opacity = '0'; });
    return {
      el: root,
      panel,
      below,
      slot,
      hint: hintEl,
      priceTag: item.priceTag,
      offTag: item.offTag,
      percent: item.percent,
      open: () => springUp(panel),
      // The photo, then the price tag, then the discount tag (stamped, and framed in gold).
      async showItem(ctx) {
        await item.showPhoto();
        await ctx.wait(250);
        await item.showPrice();
        await ctx.wait(300);
        await item.showOff();
      },
      // The question drops in on its strip.
      showQuestion() {
        Sound.bloop();
        return reveal(strip, [
          { opacity: 0, transform: 'translateY(-40px) scale(.9)' },
          { opacity: 1, transform: 'translateY(4px) scale(1.02)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(620), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The hint pops in under the question.
      showHint() {
        Sound.pop();
        return reveal(hintEl, [
          { opacity: 0, transform: 'scale(.6)' },
          { opacity: 1, transform: 'scale(1.06)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(520), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      ping(node) {
        replay(node, 'is-ping');
      },
    };
  }

  // The pieces of a worked line, built in `expr`: each { t, cls } (a word or number), { op } (an operator,
  // e.g. '−'), { frac: [top, bottom], cls, top, bottom, split } (a stacked fraction: `top` and `bottom` colour
  // its halves; `split` hides them, to bring them in one at a time), { answer } (the answer) or { slot, t, cls }
  // (an empty box showing the faint word `slot`, which the player fills with `t`: see workedSheet's drag).
  // Returns the nodes.
  function lineParts(expr, parts) {
    return parts.map(part => {
      if (part.slot) {
        const box = el('span', classes('ws-slot', part.cls), expr);
        el('span', 'ws-slot-hint', box).textContent = part.slot;
        el('span', 'ws-slot-value', box).textContent = part.t;
        return box;
      }
      if (part.frac) {
        const f = el('div', classes('pf-frac', part.cls), expr);
        const halves = [
          Object.assign(el('span', classes('pf-num', part.top), f), { textContent: part.frac[0] }),
          el('span', 'pf-bar', f),
          Object.assign(el('span', classes('pf-den', part.bottom), f), { textContent: part.frac[1] }),
        ];
        if (part.split) [halves[0], halves[2]].forEach(n => { n.style.opacity = '0'; });
        return f;
      }
      if (part.answer) return Object.assign(el('span', 'pf-answer', expr), { textContent: part.answer });
      return Object.assign(el('span', classes('ws-text', part.op && 'ws-op', part.cls), expr), { textContent: part.op || part.t });
    });
  }

  /**
   * A worked solution on a panel: an optional column of value boxes on the left, joined by down arrows (e.g.
   * Marked Price ₹1800 ↓ Discount ₹540), and a white sheet where the working is written line by line, its =
   * signs lined up.
   *  boxes  [{ label, value, tone }]: tone as for the compare boxes ('yellow' | 'blue' | 'red')
   *  rows   [{ label, parts, band }]:
   *           label  [{ t, cls }] left of the = sign (none: the line carries on the one above)
   *           parts  what it equals, each { t, cls } (a word or number), { op } (an operator, e.g. '−'),
   *                  { frac: [top, bottom], cls } (a stacked fraction; `top` and `bottom` can colour its two
   *                  halves; { split: true } brings its halves in one at a time: see show), { answer }, or
   *                  { slot, t, cls } (an empty box for the player to drag a value into: see drag)
   *           band   the line sits on a band (the rule being used): light blue, or 'yellow'
   *  big    larger writing (for a sheet on its own)
   * Reveal it with open() → box(i) … → write(r) (its label is written in, then its = pops) → part(r, j) … →
   * drag(…) (the player fills the empty boxes) → answer(r) → mark(r) (on a yellow box).
   * A split fraction's part(r, j) only draws its bar; show(node) then pops in its top or bottom (.pf-num,
   * .pf-den). ping(node) pops anything while it is talked about: `boxes`, and `rows[r].parts[j]`.
   */
  function workedSheet(parent, { boxes = [], rows, big = false }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'ws-panel', root);
    const boxEls = [];
    const values = [];
    const arrows = [];
    if (boxes.length) {
      const column = el('div', 'ws-boxes', panel);
      boxes.forEach((b, i) => {
        if (i) {
          const holder = el('div', 'dc-arrow', column);
          holder.innerHTML = downArrow();
          arrows.push(holder.firstElementChild);
        }
        const box = el('div', `cmp-box cmp-box--${b.tone} ws-box`, column);
        el('div', 'cmp-label', box).textContent = b.label;
        values.push(Object.assign(el('div', 'cmp-price', box), { textContent: b.value }));
        boxEls.push(box);
      });
    }
    const sheet = el('div', big ? 'pf-sheet ws-sheet ws-sheet--big' : 'pf-sheet ws-sheet', panel);
    const lines = rows.map((row, r) => {
      const place = (node, column) => Object.assign(node.style, { gridRow: String(r + 1), gridColumn: column });
      if (row.band) place(el('div', row.band === 'yellow' ? 'ws-band ws-band--yellow' : 'ws-band', sheet), '1 / -1'); // first, so it sits behind the line
      const label = el('div', 'pf-label', sheet);
      (row.label || []).forEach(seg => { el('span', seg.cls || '', label).textContent = seg.t; });
      const eq = el('div', 'pf-eq', sheet);
      eq.textContent = '=';
      const expr = el('div', 'pf-expr', sheet);
      [[label, '1'], [eq, '2'], [expr, '3']].forEach(([node, column]) => place(node, column));
      const parts = lineParts(expr, row.parts);
      return { label, eq, parts, spec: row.parts };
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', [
      ...boxes.map(b => `${b.label} ${b.value}`),
      ...lines.map(l => `${l.label.textContent} = ${l.parts.map(n => (n.classList.contains('pf-frac')
        ? `${n.firstChild.textContent} over ${n.lastChild.textContent}`
        : n.classList.contains('ws-slot') ? n.lastChild.textContent : n.textContent)).join(' ')}`),
    ].join('. '));
    [panel, sheet, ...boxEls, ...arrows, ...lines.flatMap(l => [l.label, l.eq, ...l.parts])].forEach(n => { n.style.opacity = '0'; });
    const showSheet = sheetFirst(sheet); // the white sheet appears with its first line (never empty)

    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    const pop = node => reveal(node, [
      { opacity: 0, transform: 'scale(.4)' },
      { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(480), easing: EASE });
    const wipe = (node, ms) => reveal(node, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: T(ms), easing: 'cubic-bezier(.3,.1,.3,1)',
    });

    return {
      el: root,
      panel,
      boxes: boxEls,
      rows: lines,
      open: () => springUp(panel),
      // Box i pops in, after the arrow from the box above it has grown down.
      async box(i) {
        if (i) {
          const arrow = arrows[i - 1];
          arrow.style.opacity = '';
          Sound.swish();
          await settle(arrow.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
            duration: reducedMotion ? 1 : T(500), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards',
          }));
        }
        if (boxes[i].tone === 'red') Sound.drop();
        else Sound.bloop();
        await reveal(boxEls[i], [
          { opacity: 0, transform: 'scale(.6)' },
          { opacity: 1, transform: 'scale(1.06)', offset: 0.65 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: EASE });
      },
      // Line r's label is written in (left to right), then its = pops.
      async write(r) {
        await showSheet();
        const { label, eq } = lines[r];
        if (label.textContent) {
          Sound.scribble();
          await wipe(label, 520);
        } else {
          label.style.opacity = '';
        }
        Sound.pop();
        await pop(eq);
      },
      // Part j of line r appears: a fraction or a word is written in, a number or an operator pops in. A split
      // fraction only draws its bar (its halves come in with show).
      async part(r, j) {
        await showSheet();
        const node = lines[r].parts[j];
        if (lines[r].spec[j].split) {
          Sound.swish();
          node.style.opacity = '';
          return reveal(node.querySelector('.pf-bar'), [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: T(420), easing: 'ease-out' });
        }
        if (!lines[r].spec[j].slot && (node.classList.contains('pf-frac') || node.textContent.length > 5)) {
          Sound.scribble();
          return wipe(node, 560);
        }
        Sound.pop();
        return pop(node);
      },
      drag: (pairs, handlers) => dragValues(panel, pairs.map(([i, r, j]) => [values[i], lines[r].parts[j]]), handlers),
      // A hidden piece (e.g. the top of a split fraction) pops in.
      show(node) {
        Sound.pop();
        return pop(node);
      },
      // Line r's answer lands like a stamp.
      async answer(r) {
        await showSheet();
        const node = lines[r].parts.find(n => n.classList.contains('pf-answer'));
        Sound.stamp();
        return reveal(node, [
          { opacity: 0, transform: 'scale(1.9) rotate(-8deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(600), easing: EASE });
      },
      // Line r's answer is marked: it sits on a bright yellow box.
      mark(r) {
        Sound.pop();
        lines[r].parts.find(n => n.classList.contains('pf-answer')).classList.add('is-marked');
      },
      ping(node) {
        replay(node, 'is-ping');
      },
    };
  }

  // ---------- dragging values into empty boxes ----------

  /**
   * The player puts each value into its empty box: pairs [[value, box], …], both inside `panel` (positioned);
   * value n belongs in box n. A value can be dragged (mouse or touch), or tapped (or picked with Enter) and then
   * its box tapped. Let go over its own box, it settles in and the box shows its text (onRight(n)); over another
   * box it shakes there and goes back (onWrong(n, m): value n on box m); anywhere else it just goes back. A faint
   * copy of a value shows the way at the start, and again whenever nothing has happened for a while. Resolves
   * once every box is filled.
   */
  function dragValues(panel, pairs, { onRight, onWrong } = {}) {
    return new Promise(resolve => {
      const values = pairs.map(([value]) => value);
      const boxes = pairs.map(([, box]) => box);
      const filled = new Set(); // boxes done
      const moving = new Set(); // values on their way somewhere
      let picked = -1;          // a value picked up with a tap or a key, waiting for a box
      let held = null;          // the value being dragged: { n, id, x, y, chip }
      let idle = null;

      // A pointer, or a node's centre, in the panel's own pixels (the stage is scaled to fit the window).
      const inPanel = (cx, cy) => {
        const P = panel.getBoundingClientRect();
        const k = P.width / panel.offsetWidth;
        return [(cx - P.left) / k - panel.clientLeft, (cy - P.top) / k - panel.clientTop];
      };
      const centre = node => {
        const b = panelBox(panel, node);
        return [(b.l + b.r) / 2, (b.t + b.b) / 2];
      };
      // The empty box under the pointer (with a little leeway), or -1.
      const boxAt = (cx, cy) => boxes.findIndex((box, m) => {
        if (filled.has(m)) return false;
        const r = box.getBoundingClientRect();
        const pad = r.height * 0.4;
        return cx > r.left - pad && cx < r.right + pad && cy > r.top - pad && cy < r.bottom + pad;
      });
      // A copy of value n to move about; at(chip, [x, y], s) centres it on (x, y), at scale s.
      const chipOf = n => {
        const chip = el('div', 'fly-chip ws-chip', panel);
        chip.textContent = values[n].textContent;
        const cs = getComputedStyle(values[n]);
        Object.assign(chip.style, { fontSize: cs.fontSize, color: cs.color });
        return chip;
      };
      const at = (chip, [x, y], s) => `translate(${num(x - chip.offsetWidth / 2)}px, ${num(y - chip.offsetHeight / 2)}px) scale(${num(s)})`;
      // The size of value n's text in its box, compared with its copy's.
      const fit = (n, chip) => parseFloat(getComputedStyle(boxes[n].lastChild).fontSize) / parseFloat(chip.style.fontSize);
      const glide = (chip, to, s, ms) => {
        const end = at(chip, to, s);
        const anim = chip.animate([{ transform: chip.style.transform || end }, { transform: end }], {
          duration: reducedMotion ? 1 : ms, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards',
        });
        return settle(anim).then(() => {
          chip.style.transform = end;
          anim.cancel();
        });
      };
      const goBack = async (n, chip) => {
        await glide(chip, centre(values[n]), 1, 320);
        chip.remove();
        values[n].classList.remove('is-lifted');
        moving.delete(n);
      };

      const pick = n => {
        if (picked >= 0) values[picked].classList.remove('is-picked');
        picked = n;
        boxes.forEach((box, m) => box.classList.toggle('is-waiting', n >= 0 && !filled.has(m)));
        if (n >= 0) {
          values[n].classList.add('is-picked');
          Sound.blip();
        }
      };

      async function drop(n, m, chip) {
        pick(-1);
        moving.add(n);
        if (!chip) { // tapped: it lifts out of its box first
          chip = chipOf(n);
          chip.style.transform = at(chip, centre(values[n]), 1);
          values[n].classList.add('is-lifted');
        }
        if (m !== n) { // the wrong box: it shakes there, and goes back
          wrongFlash();
          replay(boxes[m], 'is-wrong');
          await glide(chip, centre(boxes[m]), fit(m, chip), 240);
          await settle(chip.animate([{ translate: '0 0' }, { translate: '-12px 0' }, { translate: '12px 0' }, { translate: '-8px 0' }, { translate: '0 0' }], {
            duration: reducedMotion ? 1 : 360,
          }));
          await goBack(n, chip);
          if (onWrong) onWrong(n, m);
          return;
        }
        filled.add(m);
        Sound.swish();
        await glide(chip, centre(boxes[m].lastChild), fit(m, chip), 300);
        chip.remove();
        moving.delete(n);
        values[n].classList.remove('is-lifted');
        values[n].classList.add('is-used');
        [values[n], boxes[m]].forEach(node => node.removeAttribute('tabindex'));
        boxes[m].classList.add('is-filled');
        Sound.pop();
        reveal(boxes[m].lastChild, [{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.3,1.6,.5,1)' });
        if (onRight) onRight(n);
        if (filled.size === pairs.length) {
          clearTimeout(idle);
          resolve();
        }
      }

      // A faint copy of the first empty box's value glides into it, and fades.
      const showHow = () => {
        idle = null;
        const n = boxes.findIndex((box, m) => !filled.has(m));
        if (n < 0 || !panel.isConnected) return;
        if (held || picked >= 0 || moving.has(n) || reducedMotion) {
          wait();
          return;
        }
        const ghost = chipOf(n);
        ghost.classList.add('is-ghost');
        const from = at(ghost, centre(values[n]), 1);
        const to = at(ghost, centre(boxes[n].lastChild), fit(n, ghost));
        settle(ghost.animate([
          { transform: from, opacity: 0 },
          { transform: from, opacity: 0.6, offset: 0.15 },
          { transform: to, opacity: 0.6, offset: 0.75 },
          { transform: to, opacity: 0 },
        ], { duration: 1900, easing: 'ease-in-out', fill: 'forwards' })).then(() => ghost.remove());
        wait();
      };
      const wait = (ms = 9000) => {
        clearTimeout(idle);
        idle = setTimeout(showHow, ms);
      };

      values.forEach((value, n) => {
        value.classList.add('ws-drag');
        value.tabIndex = 0;
        value.setAttribute('role', 'button');
        value.setAttribute('aria-label', `${value.textContent}: drag it into its box`);
        value.addEventListener('pointerdown', e => {
          if (filled.has(n) || moving.has(n) || held) return;
          e.preventDefault();
          value.setPointerCapture(e.pointerId);
          held = { n, id: e.pointerId, x: e.clientX, y: e.clientY, chip: null };
          wait();
        });
        value.addEventListener('pointermove', e => {
          if (!held || held.id !== e.pointerId) return;
          if (!held.chip) {
            if (Math.hypot(e.clientX - held.x, e.clientY - held.y) < 8) return; // not a drag yet (maybe a tap)
            pick(-1);
            held.chip = chipOf(n);
            held.chip.classList.add('is-held');
            value.classList.add('is-lifted');
            Sound.blip();
          }
          held.chip.style.transform = at(held.chip, inPanel(e.clientX, e.clientY), 1.1);
          const m = boxAt(e.clientX, e.clientY);
          boxes.forEach((box, k) => box.classList.toggle('is-over', k === m));
        });
        const letGo = e => {
          if (!held || held.id !== e.pointerId) return;
          const { chip } = held;
          held = null;
          boxes.forEach(box => box.classList.remove('is-over'));
          if (!chip) { // a tap: picks the value up (or puts it down again)
            if (e.type === 'pointerup') pick(picked === n ? -1 : n);
            return;
          }
          chip.classList.remove('is-held');
          moving.add(n);
          const m = e.type === 'pointerup' ? boxAt(e.clientX, e.clientY) : -1;
          if (m < 0) goBack(n, chip);
          else drop(n, m, chip);
        };
        value.addEventListener('pointerup', letGo);
        value.addEventListener('pointercancel', letGo);
        value.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.key === ' ') && !filled.has(n) && !moving.has(n)) {
            e.preventDefault();
            pick(picked === n ? -1 : n);
          }
        });
      });
      boxes.forEach((box, m) => {
        box.tabIndex = 0;
        box.setAttribute('role', 'button');
        box.setAttribute('aria-label', `the ${box.firstChild.textContent} box`);
        const put = () => {
          if (picked < 0 || filled.has(m)) return;
          wait();
          drop(picked, m, null);
        };
        box.addEventListener('click', put);
        box.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            put();
          }
        });
      });
      wait(700);
    });
  }

  // ---------- words flying across the screen ----------

  /**
   * A copy of `from`'s words flies from it to `to`, across the screen (e.g. a price from a speech bubble on the
   * picture to a card): it lifts off, a little bigger, glides along an arc (turning from `from`'s colour to
   * `to`'s) and lands the size of `to`. `layer`: a full-stage element (its px are stage px) to fly in, on top.
   * `to` is measured as it is laid out now (so call this before animating what holds it). Resolves as it lands;
   * the copy is then removed, and showing `to` is up to the caller.
   */
  async function flyAcross(layer, from, to, { text = from.textContent, ms = 900, lift = 140 } = {}) {
    const L = layer.getBoundingClientRect();
    const k = L.width / layer.offsetWidth || 1; // the stage's scale on the screen
    const at = node => {
      const r = node.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - L.left) / k, y: (r.top + r.height / 2 - L.top) / k, s: r.height / k / (node.offsetHeight || 1) };
    };
    const a = at(from);
    const b = at(to);
    const fromStyle = getComputedStyle(from);
    const toStyle = getComputedStyle(to);
    const chip = el('div', 'fly-chip fly-chip--across', layer);
    chip.textContent = text;
    Object.assign(chip.style, { fontSize: toStyle.fontSize, color: toStyle.color });
    const w = chip.offsetWidth;
    const h = chip.offsetHeight;
    const k0 = (parseFloat(fromStyle.fontSize) * a.s) / parseFloat(toStyle.fontSize); // its size in the bubble
    const k1 = b.s;
    const pos = (x, y, s, deg) => `translate(${num(x - w / 2)}px, ${num(y - h / 2)}px) scale(${num(s)}) rotate(${deg}deg)`;
    const top = Math.min(a.y, b.y) - lift;
    Sound.swish();
    await settle(chip.animate([
      { transform: pos(a.x, a.y, k0, 0), color: fromStyle.color },
      { transform: pos(a.x, a.y - 30, k0 * 1.3, -6), color: fromStyle.color, offset: 0.16 }, // lifts off
      { transform: pos((a.x + b.x) / 2, top, ((k0 * 1.3 + k1) / 2) * 1.1, 4), offset: 0.55 },
      { transform: pos(b.x, b.y, k1, 0), color: toStyle.color },
    ], { duration: reducedMotion ? 1 : T(ms), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }));
    chip.remove();
  }

  // ---------- answer buttons in a row (A, B, C …) ----------

  /**
   * A row of answer buttons for a question on the screen (the question card's own are in question()), or
   * with { stack: true } a column of them.
   *  options  [{ label, correct }];  onAnswer(correct, button, i, last) is called for each pick that counts: on the
   *           last (or right) one every button locks, the picked one turning green ✓ or red ✗.
   *  tries    1 (default: no second try), or 2: a first wrong pick is crossed out on its own (last: false; the
   *           game gives a hint meanwhile, lock() … unlock()), and the answers left can be picked again.
   * enter(ctx) brings them in one by one, then enables them; show(i) lights up the right answer (after a
   * wrong pick); ping(i) makes a button pop.
   */
  function choices(parent, { options, onAnswer, stack = false, tries = 1 }) {
    const row = el('div', stack ? 'pq-choices pq-choices--stack' : 'pq-choices', parent);
    let answered = false;
    let left = tries; // with tries: 2, a first wrong pick is crossed out and the others stay to pick from
    const buttons = options.map((opt, i) => {
      const letter = String.fromCharCode(65 + i);
      const b = el('button', 'q-opt pq-opt', row);
      b.type = 'button';
      b.disabled = true; // enabled once they have all arrived
      b.setAttribute('aria-label', `${letter}: ${opt.label}`);
      const chip = el('span', 'q-chip', b);
      chip.textContent = letter;
      el('span', 'q-label', b).textContent = opt.label;
      b.addEventListener('click', () => {
        if (answered || b.disabled) return;
        if (!opt.correct && left > 1) { // not the last try: only this one is out (onAnswer's `last` is false)
          left--;
          b.disabled = true;
          b.classList.add('is-wrong');
          chip.innerHTML = ICON_CROSS;
          wrongFlash();
          if (onAnswer) onAnswer(false, b, i, false);
          return;
        }
        answered = true;
        buttons.forEach(other => {
          other.disabled = true;
          if (other !== b) other.classList.add('is-dim');
        });
        b.classList.add(opt.correct ? 'is-correct' : 'is-wrong');
        chip.innerHTML = opt.correct ? ICON_CHECK : ICON_CROSS;
        if (opt.correct) Sound.correct();
        else wrongFlash();
        if (onAnswer) onAnswer(!!opt.correct, b, i, true);
      });
      b.style.opacity = '0';
      return b;
    });
    const open = () => buttons.filter(b => !b.classList.contains('is-wrong'));

    return {
      el: row,
      buttons,
      // While a hint is given after a first wrong pick, the answers left wait (lock), then can be picked again (unlock).
      lock() {
        buttons.forEach(b => { b.disabled = true; });
      },
      unlock() {
        if (!answered) open().forEach(b => { b.disabled = false; });
      },
      async enter(ctx) {
        for (const b of buttons) {
          reveal(b, [
            { opacity: 0, transform: 'translateY(60px) scale(.9)' },
            { opacity: 1, transform: 'translateY(-6px) scale(1.02)', offset: 0.7 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(520), easing: 'cubic-bezier(.2,.8,.3,1)' });
          Sound.bloop();
          await ctx.wait(160);
        }
        await ctx.wait(300);
        if (!answered) open().forEach(b => { b.disabled = false; });
      },
      // Lights up the right answer (after a wrong pick).
      show(i) {
        const b = buttons[i];
        b.classList.remove('is-dim');
        b.classList.add('is-correct');
        b.querySelector('.q-chip').innerHTML = ICON_CHECK;
        Sound.sparkle();
      },
      ping(i) {
        replay(buttons[i], 'is-ping');
      },
    };
  }

  // ---------- percentage formula ("a is what percent of b?") ----------

  // A question on a purple strip, its amounts marked with their roles: [{ t }, { t, role: 'part' | 'whole' } …]
  // (`valueCls` styles the amounts, e.g. 'var' for letters). show() drops it in; tag(role) gives an amount its
  // role's colour (the part blue, the whole green) and pops it.
  function questionStrip(parent, question, valueCls = '') {
    const strip = el('div', 'pf-question', parent);
    const tags = {};
    question.forEach(seg => {
      if (seg.role) tags[seg.role] = Object.assign(el('span', classes('pf-q-value', valueCls), strip), { textContent: seg.t });
      else strip.appendChild(document.createTextNode(seg.t));
    });
    strip.style.opacity = '0';
    return {
      strip,
      tags,
      show() {
        Sound.bloop();
        return reveal(strip, [
          { opacity: 0, transform: 'translateY(-40px) scale(.9)' },
          { opacity: 1, transform: 'translateY(4px) scale(1.02)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(620), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      tag(role) {
        tags[role].classList.add('is-' + role);
        replay(tags[role], 'is-ping');
      },
    };
  }

  // The words in `node` dissolve into `text`: the old words blur and fade away while the new ones come into focus
  // in the same place, the node growing (or shrinking) to fit them. `from` → `to` swaps its colour class.
  async function dissolveWords(node, text, { from = '', to = '', ms = 1100 } = {}) {
    const old = el('span', classes('dz-old', from));
    while (node.firstChild) old.appendChild(node.firstChild);
    const neu = el('span', classes('dz-new', to));
    neu.textContent = text;
    if (from) node.classList.remove(from);
    node.classList.add('dz');
    node.append(old, neu);
    const width = shown => { // the node's width with only one of them in it
      (shown === old ? neu : old).style.display = 'none';
      const w = node.offsetWidth;
      (shown === old ? neu : old).style.display = '';
      return w;
    };
    const w0 = width(old);
    const w1 = width(neu);
    const SOFT = 'cubic-bezier(.45,0,.3,1)';
    const d = reducedMotion ? 1 : T(ms);
    await Promise.all([
      settle(node.animate([{ width: `${w0}px` }, { width: `${w1}px` }], { duration: d, easing: SOFT, fill: 'forwards' })),
      settle(old.animate([
        { opacity: 1, filter: 'blur(0)', transform: 'none' },
        { opacity: 0, filter: 'blur(10px)', transform: 'scale(1.12)' },
      ], { duration: d * 0.8, easing: 'ease-in', fill: 'forwards' })),
      settle(neu.animate([
        { opacity: 0, filter: 'blur(10px)', transform: 'scale(.88)' },
        { opacity: 0, filter: 'blur(10px)', transform: 'scale(.88)', offset: 0.25 },
        { opacity: 1, filter: 'blur(0)', transform: 'none' },
      ], { duration: d, easing: 'ease-out', fill: 'backwards' })),
    ]);
    node.getAnimations().forEach(a => a.cancel());
    node.classList.remove('dz');
    if (to) node.classList.add(to);
    node.textContent = text;
  }

  // A small arrow pointing down (at the top of a fraction: "the part goes on top").
  const DOWN_HINT = '<svg class="pf-hint" viewBox="0 0 34 40" aria-hidden="true"><path d="M17 4 V 31 M 7 21 L 17 32 L 27 21"/></svg>';

  /**
   * "a is what percent of b?", worked out. On a panel: the question on a purple strip; the part and the whole
   * in two boxes on the left; and on a white sheet the formula, line by line, its = signs lined up:
   *     Percentage = Part / Whole × 100
   *                = 125 / 500 × 100
   *                = 25%
   * The part is blue and the whole green throughout (see .tone-part, .tone-whole).
   *  question  [{ t }, { t, role: 'part' | 'whole' } …]: the amounts carry their role
   *  part, whole  { label, value }, e.g. { label: 'Part', value: '125' }
   *  numbers   the part and the whole as they go into the formula, e.g. ['125', '500']
   *  answer    e.g. '25%'
   *  letters   the rule in general: the part and the whole are letters (e.g. a and b, in italic: see .var),
   *            and the last line is (a / b × 100)% instead of an answer
   * Reveal it with open() → showQuestion() → tag(role) + box(role) … → label() → fraction() → times(0) →
   * start(1) → hint() + fly('part') → fly('whole') → times(1) → start(2) → answer() → mark().
   * tag(role) colours an amount in the question by its role (and pops it).
   * Then the rule can be renamed for what the part and the whole are (e.g. the discount and the marked price):
   * dropBoxes() (the boxes go and the sheet moves into the middle) → rename('part' | 'whole' | 'label', text,
   * tone) (the words dissolve into the new ones, and the part's or the whole's amounts take the new colour).
   */
  function percentFormula(parent, { question, part, whole, numbers, answer, letters = false }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'pf-panel', root);
    const v = letters ? 'var' : '';
    const q = questionStrip(panel, question, v);
    const column = el('div', 'pf-boxes', panel);
    const boxes = {};
    const values = {};
    Object.entries({ part, whole }).forEach(([role, b]) => {
      const box = el('div', `pf-box pf-box--${role}`, column);
      el('span', 'pf-box-label', box).textContent = b.label;
      el('span', 'pf-box-eq', box).textContent = '=';
      values[role] = Object.assign(el('span', classes('pf-box-value', `tone-${role}`, v), box), { textContent: b.value });
      boxes[role] = box;
    });
    // The sheet: a grid of rows, each a label, an = sign and what it equals.
    const sheet = el('div', 'pf-sheet', panel);
    const row = text => {
      const label = el('div', 'pf-label', sheet);
      label.textContent = text;
      const eq = el('div', 'pf-eq', sheet);
      eq.textContent = '=';
      return { label, eq, expr: el('div', 'pf-expr', sheet) };
    };
    const fraction = (expr, top, bottom, cls = '') => {
      const f = el('div', 'pf-frac', expr);
      const num = Object.assign(el('span', classes('pf-num tone-part', cls), f), { textContent: top });
      const bar = el('span', 'pf-bar', f);
      const den = Object.assign(el('span', classes('pf-den tone-whole', cls), f), { textContent: bottom });
      return { f, num, bar, den };
    };
    const times = expr => Object.assign(el('span', 'pf-times', expr), { textContent: '× 100' });
    const rows = [row('Percentage'), row(''), row('')];
    const words = fraction(rows[0].expr, part.label, whole.label);
    const sums = fraction(rows[1].expr, numbers[0], numbers[1], v);
    const by100 = [times(rows[0].expr), times(rows[1].expr)];
    const ans = el('span', classes('pf-answer', letters && 'pf-answer--rule'), rows[2].expr);
    if (letters) { // (a / b × 100)%, its brackets as tall as the fraction
      const bracket = d => ans.insertAdjacentHTML('beforeend',
        `<svg class="pf-paren" viewBox="0 0 16 100" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`);
      bracket('M13 3 Q 1 50 13 97');
      fraction(ans, numbers[0], numbers[1], v);
      times(ans);
      bracket('M3 3 Q 15 50 3 97');
      el('span', 'pf-pct', ans).textContent = '%';
      answer = `(${numbers[0]} ÷ ${numbers[1]} × 100)%`;
    } else {
      ans.textContent = answer;
    }
    words.num.insertAdjacentHTML('beforeend', DOWN_HINT);
    const hint = words.num.lastElementChild;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${question.map(q => q.t).join('')} ${part.label} = ${part.value}, ${whole.label} = ${whole.value}. ` +
      `Percentage = ${part.label} ÷ ${whole.label} × 100 = ${numbers[0]} ÷ ${numbers[1]} × 100 = ${answer}`);
    [panel, boxes.part, boxes.whole, rows[0].label, words.f, hint, sums.bar, sums.num, sums.den, ans,
      ...rows.map(r => r.eq), ...by100].forEach(n => { n.style.opacity = '0'; });
    sheet.style.opacity = '0'; // it appears with its first line (never empty)

    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    const pop = node => reveal(node, [
      { opacity: 0, transform: 'scale(.4)' },
      { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(480), easing: EASE });
    const showSheet = sheetFirst(sheet);
    const wipe = (node, ms) => reveal(node, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: T(ms), easing: 'cubic-bezier(.3,.1,.3,1)',
    });
    const settleIn = node => reveal(node, [{ transform: 'scale(1.18)' }, { transform: 'none' }], {
      duration: T(320), easing: 'cubic-bezier(.3,1.6,.5,1)',
    });

    const tags = q.tags;
    return {
      el: root,
      panel,
      tags,
      answerEl: ans,
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: EASE });
      },
      // The question drops in on its strip.
      showQuestion: q.show,
      // An amount in the question takes its role's colour, and pops.
      tag: q.tag,
      // The box with the part (or the whole) pops in.
      box(role) {
        Sound.bloop();
        return reveal(boxes[role], [
          { opacity: 0, transform: 'translateX(-50px) scale(.8)' },
          { opacity: 1, transform: 'translateX(6px) scale(1.04)', offset: 0.65 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: EASE });
      },
      // "Percentage" is written in, left to right (the sheet appears with it).
      async label() {
        await showSheet();
        Sound.scribble();
        return wipe(rows[0].label, 520);
      },
      // "= Part / Whole": the = pops, then the fraction is written in.
      async fraction() {
        await showSheet();
        Sound.pop();
        await pop(rows[0].eq);
        Sound.scribble();
        await wipe(words.f, 560);
      },
      // Row r's "× 100" pops in.
      times(r) {
        Sound.pop();
        return pop(by100[r]);
      },
      // Row r's = pops in; on the second row the fraction bar draws itself too, ready for the numbers.
      async start(r) {
        await showSheet();
        Sound.pop();
        await pop(rows[r].eq);
        if (r !== 1) return;
        Sound.swish();
        await reveal(sums.bar, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: T(420), easing: 'ease-out' });
      },
      // The little arrow over "Part": the part goes on top. It pops in and nudges down twice.
      hint() {
        pop(hint).then(() => replay(hint, 'is-ping'));
      },
      // The part's (or the whole's) amount lifts out of its box (an exact copy, so it lifts off cleanly) and
      // flies into the fraction below.
      async fly(role) {
        const to = role === 'part' ? sums.num : sums.den;
        Sound.swish();
        await flyInto(panel, values[role], to, { text: values[role].textContent, cls: classes('tone-' + role, v), lift: -24, ms: 850 }); // a low glide, under the line above
        Sound.pop();
        await settleIn(to);
      },
      // The answer (or, for the rule, its last line) lands like a stamp.
      answer() {
        Sound.stamp();
        return reveal(ans, [
          { opacity: 0, transform: 'scale(1.9) rotate(-8deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(600), easing: EASE });
      },
      // The answer is marked: it sits on a bright yellow box.
      mark() {
        Sound.pop();
        ans.classList.add('is-marked');
      },
      // The boxes have done their job: they fade away, and their column folds up, so the sheet glides into the
      // middle, under the question; then it grows a little (the rule is what the screen is about now).
      async dropBoxes() {
        await settle(column.animate([
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateX(-40px) scale(.94)' },
        ], { duration: T(500), easing: 'ease-in', fill: 'forwards' }));
        const w = column.offsetWidth;
        const gap = getComputedStyle(panel).columnGap;
        sheet.style.justifySelf = 'center';
        Sound.swish();
        const GLIDE = { duration: reducedMotion ? 1 : T(750), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' };
        const fold = [
          column.animate([{ width: `${w}px` }, { width: '0px' }], GLIDE),
          panel.animate([{ columnGap: gap }, { columnGap: '0px' }], GLIDE),
        ];
        await Promise.all(fold.map(settle));
        panel.style.columnGap = '0px';
        fold[1].cancel();
        column.remove(); // (the sheet keeps its size: it already fills the room under the photo)
      },
      // A word of the rule dissolves into another: 'part' (over the line), 'whole' (under it) or 'label'
      // ("Percentage"), e.g. rename('part', 'Discount', 'tone-d'); the part's (or the whole's) amounts, in the
      // question and in the working, change to the same colour.
      async rename(which, text, tone = '') {
        Sound.sparkle();
        if (which === 'label') return dissolveWords(rows[0].label, text);
        const word = which === 'part' ? words.num : words.den;
        const amount = which === 'part' ? sums.num : sums.den;
        if (which === 'part' && hint.isConnected) {
          settle(hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T(300), fill: 'forwards' })).then(() => hint.remove());
        }
        amount.style.transition = 'color .9s ease';
        amount.classList.replace(`tone-${which}`, tone);
        const q = tags[which];
        if (q) {
          q.classList.remove('is-' + which);
          q.classList.add(tone);
        }
        return dissolveWords(word, text, { from: `tone-${which}`, to: tone });
      },
    };
  }

  // ---------- question panel (a quick check) ----------

  /**
   * A question on a purple strip, on a panel with room under it for answer buttons (`below`, see choices).
   *  question  as for questionStrip
   * Reveal it with open() → showQuestion(); tag(role) colours an amount in the question by its role.
   */
  function questionPanel(parent, { question }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'qp-panel', root);
    const q = questionStrip(panel, question);
    const below = el('div', 'qp-answers', panel);
    const slot = el('div', 'q-slot', panel); // under the answers: what to remember after a wrong answer, and on 25 the grid
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', question.map(seg => seg.t).join(''));
    panel.style.opacity = '0';
    return {
      el: root,
      panel,
      below,
      slot,
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      showQuestion: q.show,
      tag: q.tag,
    };
  }

  // ---------- reduction card (₹1000 → ₹200 reduced → ₹800) ----------

  /**
   * Card on the right of the screen: the old price, a red arrow down labelled with how much less, the new price.
   *  from, to   { price, tone: 'yellow' | 'blue' }      cut  e.g. '₹200'      note  e.g. 'reduced'
   * Fill it with enter() → pasteFrom() → arrowDown() → pasteTo() → pasteCut(), each price flying in first (see
   * FX.flyAcross and `prices`), or show it complete with showNow().
   */
  function reduction(parent, { from, to, cut, note }) {
    const pos = el('div', 'red-pos', parent);
    const card = el('div', 'red-card', pos);
    const box = ({ price, tone }) => {
      const b = el('div', `cmp-box cmp-box--${tone} red-box`, card);
      el('div', 'cmp-price', b).textContent = price;
      return b;
    };
    const top = box(from);
    const mid = el('div', 'red-mid', card);
    mid.innerHTML = downArrow('red');
    const arrow = mid.firstElementChild;
    const tag = el('div', 'red-tag', mid);
    if (cut) el('div', 'red-cut', tag).textContent = cut; // (no `cut`: only the note, e.g. "discount")
    el('div', 'red-note', tag).textContent = note;
    const bottom = box(to);
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', `${from.price}, ${cut ? cut + ' ' : ''}${note}, ${to.price}`);
    [card, top, arrow, tag, bottom].forEach(n => { n.style.opacity = '0'; });
    // A price (or the cut) is pasted in as it lands: its box (or tag) appears around it with a little squash,
    // like a sticker pressed on.
    const paste = node => {
      node.style.opacity = '';
      Sound.pop();
      return settle(node.animate([
        { transform: 'scale(1.1, .88)' },
        { transform: 'scale(.97, 1.04)', offset: 0.45 },
        { transform: 'none' },
      ], { duration: reducedMotion ? 1 : T(380), easing: 'cubic-bezier(.3,.7,.4,1)' }));
    };

    return {
      el: pos,
      // Where each price lands (see FX.flyAcross): the Marked Price, the Selling Price, and the cut.
      prices: { from: top.querySelector('.cmp-price'), to: bottom.querySelector('.cmp-price'), cut: tag.querySelector('.red-cut') || tag },
      // The card swings in from the right (as the first price flies to it).
      enter() {
        Sound.whoosh();
        return reveal(card, [
          { opacity: 1, transform: 'translateX(135%) rotate(9deg)' },
          { opacity: 1, transform: 'translateX(-5%) rotate(-2.5deg)', offset: 0.62 },
          { opacity: 1, transform: 'translateX(1.5%) rotate(.8deg)', offset: 0.82 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(950), easing: 'cubic-bezier(.22,.9,.28,1)' });
      },
      pasteFrom: () => paste(top),
      // The red arrow grows down (with a falling "whoop").
      async arrowDown() {
        arrow.style.opacity = '';
        Sound.drop();
        await settle(arrow.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
          duration: reducedMotion ? 1 : T(800), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards',
        }));
      },
      pasteTo: () => paste(bottom),
      // How much less, beside the arrow; then it keeps pulsing gently.
      async pasteCut() {
        await paste(tag);
        tag.classList.add('is-pulsing');
      },
      // Already complete (to carry the card over from the screen before, unchanged).
      showNow() {
        [card, top, arrow, tag, bottom].forEach(n => { n.style.opacity = ''; });
        tag.classList.add('is-pulsing');
      },
      // Swings back out to the right and is removed.
      leave() {
        Sound.whoosh();
        return settle(card.animate([
          { transform: 'none' },
          { transform: 'translateX(-4%) rotate(-1.5deg)', offset: 0.25 },
          { transform: 'translateX(135%) rotate(9deg)' },
        ], { duration: reducedMotion ? 1 : T(800), easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' })).then(() => pos.remove());
      },
    };
  }

  // Paper confetti raining down over the screen (a celebration), for `ms`.
  function confetti(parent, { count = 90, ms = 2600, colors = ['#ffd84d', '#ff7aa2', '#5cc8ff', '#7ee08a', '#b18cff', '#ff9f43'] } = {}) {
    if (reducedMotion) return;
    const layer = el('div', 'confetti', parent);
    for (let i = 0; i < count; i++) {
      const w = rand(12, 22);
      const piece = el('i', '', layer, {
        left: px(rand(0, 1920)), top: px(rand(-260, -20)), width: px(w), height: px(w * rand(0.4, 0.7)), background: pick(colors),
      });
      const fall = rand(900, 1250);
      const drift = rand(-160, 160);
      const spin = rand(-720, 720);
      settle(piece.animate([
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${num(drift)}px, ${num(fall)}px) rotate(${num(spin)}deg)` },
      ], { duration: rand(ms * 0.7, ms * 1.2), delay: rand(0, ms * 0.35), easing: 'cubic-bezier(.25,.4,.55,1)', fill: 'both' }));
    }
    setTimeout(() => layer.remove(), ms * 1.6);
  }

  const EASES = {
    in: t => t * t,
    out: t => 1 - Math.pow(1 - t, 2.4),
    inOut: t => 0.5 - Math.cos(Math.PI * t) / 2,
  };

  /**
   * A character with a flying strip and a standing (talking) strip; see SWIFTY in game.js.
   * The root's origin is the point between her feet. In flight that point just follows her body,
   * so switching between the two strips never jumps.
   */
  class Bird {
    constructor(parent, sheets, { scale = 0.5 } = {}) {
      const { fly, stand } = sheets;
      this.sheets = sheets;
      this.s = scale;
      this.x = 0;
      this.y = 0;
      this.tilt = 0;
      this.face = 1;
      this.root = el('div', 'bird', parent);
      this.shadow = el('div', 'bird-shadow', this.root);
      this.body = el('div', 'bird-body', this.root);
      this.standEl = this._strip(stand, { left: px(-stand.anchorX), top: px(-stand.anchorY) });
      this.flyEl = this._strip(fly, {
        left: px(-fly.anchorX),
        top: px(-stand.bodyY - fly.anchorY), // her body centre sits where it is when standing
        transformOrigin: `${fly.anchorX}px ${fly.anchorY}px`,
      });
      this.flyScale = stand.bodyR / fly.bodyR; // draw both strips at the same size
      this._pose();
      this.idle();
      this._tick = this._tick.bind(this);
      requestAnimationFrame(this._tick);
    }

    _strip(sheet, style) {
      return el('div', 'bird-strip', this.body, Object.assign({
        width: px(sheet.frameW), height: px(sheet.frameH), backgroundImage: `url("${sheet.src}")`,
      }, style));
    }

    // Which strip, which frames, how fast.
    play(mode, frames, fps, loop) {
      Object.assign(this, { mode, frames, fps, loop, t0: performance.now(), shown: -1 });
      this.flyEl.style.visibility = mode === 'fly' ? '' : 'hidden';
      this.standEl.style.visibility = mode === 'fly' ? 'hidden' : '';
      this._show(0);
    }

    _show(i) {
      this.shown = i;
      const f = this.frames[i];
      const fly = this.mode === 'fly';
      const sheet = fly ? this.sheets.fly : this.sheets.stand;
      (fly ? this.flyEl : this.standEl).style.backgroundPosition = `${-f * (sheet.frameW + sheet.gutter)}px 0px`;
      if (fly && f === sheet.flap && i > 0) Sound.flap();
    }

    _tick(now) {
      if (!this.root.isConnected) return; // removed along with its scene
      const n = Math.floor(((now - this.t0) / 1000) * this.fps);
      const i = this.loop ? n % this.frames.length : Math.min(n, this.frames.length - 1);
      if (i !== this.shown) this._show(i);
      requestAnimationFrame(this._tick);
    }

    _pose() {
      const k = this.flyScale;
      this.flyEl.style.transform = `rotate(${num(this.tilt)}deg) scale(${num(k * this.face)}, ${num(k)})`;
    }

    // (x, y) = the point between her feet, in stage px.
    place(x, y, s = this.s) {
      this.x = x;
      this.y = y;
      this.s = s;
      this.root.style.transform = `translate(${num(x)}px, ${num(y)}px) scale(${s.toFixed(4)})`;
    }

    idle() {
      this.play('stand', this.sheets.stand.idle, 4, true);
    }

    talk() {
      this.play('stand', this.sheets.stand.talk, 9, true);
    }

    // Points with her wings out, standing straight, until she does something else.
    point() {
      this.play('stand', this.sheets.stand.point, 4, true);
    }

    // A quick wings-up gesture while standing, then back to idle.
    wave() {
      if (this.mode !== 'stand') return;
      const { wave } = this.sheets.stand;
      this.play('stand', wave, 10, false);
      clearTimeout(this.waveTimer);
      this.waveTimer = setTimeout(() => this.frames === wave && this.idle(), (wave.length / 10) * 1000 + 150);
    }

    shadowOn(on) {
      this.shadow.classList.toggle('is-on', on);
    }

    // A little crouch with wings up, just before flying off.
    async takeOff(ctx) {
      this.play('stand', [this.sheets.stand.hop], 1, false);
      if (!reducedMotion) {
        settle(this.body.animate([{ transform: 'none' }, { transform: 'scale(1.06, .88)' }, { transform: 'none' }], { duration: 170 }));
      }
      await ctx.wait(160);
    }

    /**
     * Flies along an arc to (x, y), where her feet will be, flapping and tilting with the path.
     *  s     size on arrival; lift  how far the arc rises above the higher end; ease  'in' | 'out' | 'inOut'
     */
    flyTo(ctx, { x, y, s = this.s, duration = 1300, lift = 140, ease = 'inOut' }) {
      const x0 = this.x;
      const y0 = this.y;
      const s0 = this.s;
      const cx = (x0 + x) / 2;
      const cy = Math.min(y0, y) - lift;
      const easing = EASES[ease];
      this.face = x < x0 - 1 ? -1 : 1;
      this.play('fly', this.sheets.fly.loop, 18, true);
      this.shadowOn(false);
      if (reducedMotion) {
        this.place(x, y, s);
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        let start = null;
        const step = now => {
          if (!ctx.alive() || !this.root.isConnected) return reject(CANCELLED);
          if (start === null) start = now;
          const t = Math.min(1, (now - start) / duration);
          const e = easing(t);
          const u = 1 - e;
          const bx = u * u * x0 + 2 * u * e * cx + e * e * x;
          const by = u * u * y0 + 2 * u * e * cy + e * e * y;
          const dx = 2 * u * (cx - x0) + 2 * e * (x - cx);
          const dy = 2 * u * (cy - y0) + 2 * e * (y - cy);
          const bob = Math.sin((now / 1000) * Math.PI * 2 * 2.25) * 9 * (1 - t); // rises and dips with each flap
          this.tilt = Math.max(-18, Math.min(18, ((Math.atan2(dy, Math.abs(dx) + 1) * 180) / Math.PI) * 0.45)) * this.face;
          this._pose();
          this.place(bx, by + bob, s0 + (s - s0) * e);
          if (t < 1) return requestAnimationFrame(step);
          this.tilt = 0;
          this._pose();
          resolve();
        };
        requestAnimationFrame(step);
      });
    }

    // Touches down: the wings settle, a little squash, a happy chirp.
    land() {
      const { stand } = this.sheets;
      this.play('stand', stand.land, 14, false);
      this.shadowOn(true);
      Sound.chirp();
      if (!reducedMotion) {
        settle(this.body.animate([
          { transform: 'scale(1.08, .84)' },
          { transform: 'scale(.96, 1.06)', offset: 0.45 },
          { transform: 'none' },
        ], { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' }));
      }
      return new Promise(resolve => setTimeout(resolve, (stand.land.length / 14) * 1000 + 60)).then(() => this.idle());
    }

    remove() {
      this.root.remove();
    }
  }

  // ---------- Party Prep (screens 32–51: the user's designs of 2026-10-23) ----------
  // Rohan's party: Amit buys a party shirt, bottomwear, a watch and sunglasses at Sky Mall with ₹5,000. These are its
  // pieces, drawn as in the designs: the bar on top (the wallet, Party Prep and the shopping bag), the cards with a
  // question about a sale price (Check), its working out (Buy / Keep Looking), what was bought, the shopping list, the
  // party look's prices, and Mission Complete. All in stage px; where each sits is in css (.is-party, by screen).

  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN'); // ₹1,500 (as the designs write amounts)
  const PARTY_EASE = 'cubic-bezier(.2,.8,.3,1)';
  const springIn = (node, ms = 560) => reveal(node, [
    { opacity: 0, transform: 'translateY(40px) scale(.92)' },
    { opacity: 1, transform: 'translateY(-6px) scale(1.01)', offset: 0.7 },
    { opacity: 1, transform: 'none' },
  ], { duration: T(ms), easing: PARTY_EASE });
  const popIn = (node, ms = 420) => reveal(node, [
    { opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.65 }, { opacity: 1, transform: 'none' },
  ], { duration: T(ms), easing: PARTY_EASE });
  const nudge = node => node.animate([{ transform: 'none' }, { transform: 'scale(1.08)', offset: 0.4 }, { transform: 'none' }],
    { duration: 420, easing: 'ease-out' });
  const PARTY_ICONS = {
    cart: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 5h4l3.5 15h14L28 9H9"/><circle cx="12" cy="26" r="2.4"/><circle cx="23" cy="26" r="2.4"/></svg>',
    star: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3.5l6.2 13 14.2 1.8-10.5 9.8 2.7 14.1L24 35.3l-12.6 6.9 2.7-14.1L3.6 18.3l14.2-1.8z"/></svg>',
  };

  /**
   * The bar on top of the mall and its shops: the wallet (its money, counting down as he pays) and the shopping list (a
   * slot for each thing to buy, its picture, ticked once bought). count(to) counts the money; tick(i) ticks a slot.
   *  wallet: the wallet's picture;  items [{ icon, name, done }];  money
   */
  function partyHud(parent, { wallet, items, money }) {
    const root = el('div', 'ph', parent);
    const purse = el('div', 'ph-wallet', root);
    Object.assign(el('img', 'ph-wallet-icon', purse), { src: wallet, alt: '' });
    const amount = el('span', 'ph-amount', purse);
    amount.textContent = inr(money);
    purse.setAttribute('aria-label', `Wallet: ${inr(money)}`);
    const list = el('div', 'ph-list', root);
    el('span', 'ph-list-title', list).textContent = 'Shopping List';
    const row = el('div', 'ph-slots', list);
    const slots = items.map(it => {
      const slot = el('i', it.done ? 'ph-slot is-done' : 'ph-slot', row);
      Object.assign(el('img', '', slot), { src: it.icon, alt: '' });
      el('b', 'ph-tick', slot).innerHTML = ICON_CHECK;
      slot.setAttribute('aria-label', `${it.name}${it.done ? ': bought' : ''}`);
      return slot;
    });
    let shown = money;
    return {
      el: root,
      purse,
      slots,
      // The money counts to `to` (a purchase: down), the wallet pulsing as it does.
      async count(to, ms = 1100) {
        const from = shown;
        shown = to;
        purse.setAttribute('aria-label', `Wallet: ${inr(to)}`);
        if (reducedMotion) {
          amount.textContent = inr(to);
          return;
        }
        nudge(purse);
        const t0 = performance.now();
        await new Promise(resolve => {
          const step = now => {
            const t = Math.min(1, (now - t0) / ms);
            amount.textContent = inr(from + (to - from) * (1 - Math.pow(1 - t, 3)));
            if (t < 1 && amount.isConnected) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
        amount.textContent = inr(to);
      },
      tick(i) {
        const slot = slots[i];
        if (!slot || slot.classList.contains('is-done')) return;
        slot.classList.add('is-done');
        popIn(slot.querySelector('.ph-tick'), 460);
        Sound.correct();
      },
    };
  }

  /**
   * A joystick to walk with (the user's controller, 2026-10-26: a round base, a knob with four arrows on it). Press
   * anywhere on it, or drag the knob: the knob goes that way, as far as its rim, and value() is where it points, { x, y }
   * (length 1 at the rim, so a small push walks slowly; 0 in its middle and when let go: the knob springs back). The
   * arrow keys and W A S D move the knob too. pressed() resolves the first time it is used. destroy() takes it away.
   */
  function joystick(parent, { base, knob, cls = '' } = {}) {
    const root = el('div', classes('joy2', cls), parent);
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Controller: press and drag to walk, or use the arrow keys');
    Object.assign(el('img', 'joy2-base', root), { src: base, alt: '', draggable: false });
    const knobEl = el('div', 'joy2-knob', root);
    Object.assign(el('img', '', knobEl), { src: knob, alt: '', draggable: false });
    const TRAVEL = 70; // how far the knob goes from the middle (stage px)
    const DEAD = 0.18; // the middle where nothing happens (of TRAVEL)
    const WAYS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const KEY = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    const keys = new Set();
    let held = null; // the pointer pressing it
    let touch = { x: 0, y: 0 }; // where the pointer pushes it (length ≤ 1)
    let used = null;
    const firstUse = new Promise(resolve => { used = resolve; });
    const fromKeys = () => {
      let x = 0;
      let y = 0;
      keys.forEach(way => { x += WAYS[way][0]; y += WAYS[way][1]; });
      const n = Math.hypot(x, y);
      return n ? { x: x / n, y: y / n } : { x: 0, y: 0 };
    };
    const push = () => (held !== null ? touch : fromKeys());
    const show = () => {
      const t = push();
      knobEl.style.transform = `translate(${t.x * TRAVEL}px, ${t.y * TRAVEL}px)`;
      root.classList.toggle('is-held', t.x !== 0 || t.y !== 0);
    };
    const point = e => {
      const r = root.getBoundingClientRect();
      const travel = TRAVEL * (r.width / root.offsetWidth); // (in the window's px: the stage is scaled to fit it)
      let x = (e.clientX - (r.left + r.width / 2)) / travel;
      let y = (e.clientY - (r.top + r.height / 2)) / travel;
      const n = Math.hypot(x, y);
      if (n > 1) {
        x /= n;
        y /= n;
      }
      touch = { x, y };
      show();
    };
    root.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (held !== null) return;
      held = e.pointerId;
      try { root.setPointerCapture(e.pointerId); } catch (err) { /* (a synthetic pointer) */ }
      root.classList.add('is-dragged');
      point(e);
      used();
    });
    root.addEventListener('pointermove', e => { if (e.pointerId === held) point(e); });
    const letGo = e => {
      if (e.pointerId !== held) return;
      held = null;
      touch = { x: 0, y: 0 };
      root.classList.remove('is-dragged');
      show();
    };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => root.addEventListener(type, letGo));
    const keyDown = e => {
      const way = KEY[e.key];
      if (!way || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      keys.add(way);
      show();
      used();
    };
    const keyUp = e => {
      const way = KEY[e.key];
      if (!way) return;
      keys.delete(way);
      show();
    };
    const blur = () => {
      keys.clear();
      show();
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    return {
      el: root,
      pressed: () => firstUse,
      value() {
        const t = push();
        const n = Math.hypot(t.x, t.y);
        if (n < DEAD) return { x: 0, y: 0 };
        const k = Math.min(1, (n - DEAD) / (1 - DEAD)) / n; // (the dead middle taken out: a push starts from nothing)
        return { x: t.x * k, y: t.y * k };
      },
      destroy() {
        window.removeEventListener('keydown', keyDown);
        window.removeEventListener('keyup', keyUp);
        window.removeEventListener('blur', blur);
        root.remove();
      },
    };
  }

  /**
   * A spotlight on what to look at (the user, 2026-10-26: "focus on the things I want to see"): the rest of the screen
   * darkened and blurred, a hole with a soft edge where it isn't: an oval, or with `round`, a rectangle with rounded
   * corners (round the things on show in a shop). on({ x, y, rx, ry, round }) brings it in (or glides the hole there);
   * on([…, …]) makes a hole round each (the things on show, a card beside them, Swifty while she talks). A hole more
   * opens from its middle, a hole less closes to nothing, the others glide (holes are matched in their order: keep the
   * same ones first). off() takes it away. It never takes a press.
   */
  function focusVeil(parent) {
    const veil = el('div', 'focus-veil', parent);
    const SOFT = 26; // how soft the hole's edge is (the blur's spread, px)
    const W = 1920;
    const H = 1080; // (the veil covers the stage: its px)
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); // (its fade, in css)
    let now = null;
    let gliding = 0;
    const shape = ({ x, y, rx, ry, round }) => (round === null
      ? `<ellipse cx='${x}' cy='${y}' rx='${rx}' ry='${ry}'/>`
      : `<rect x='${x - rx}' y='${y - ry}' width='${2 * rx}' height='${2 * ry}' rx='${Math.min(round, rx, ry)}'/>`);
    const draw = holes => {
      const hole = holes.map(shape).join('');
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><defs><filter id='s' x='-50%' y='-50%' width='200%' height='200%'>` +
        `<feGaussianBlur stdDeviation='${SOFT}'/></filter><mask id='m'><rect width='${W}' height='${H}' fill='white'/><g fill='black' filter='url(#s)'>${hole}</g></mask></defs>` +
        `<rect width='${W}' height='${H}' mask='url(#m)'/></svg>`;
      const url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
      veil.style.webkitMaskImage = url;
      veil.style.maskImage = url;
    };
    return {
      el: veil,
      on(spots, ms = 650) {
        const to = [].concat(spots).map(sp => ({ x: sp.x, y: sp.y, rx: sp.rx, ry: sp.ry ?? sp.rx, round: sp.round ?? null }));
        cancelAnimationFrame(gliding);
        if (!now || !veil.classList.contains('is-on') || reducedMotion) { // (coming in: at once, as it fades in)
          now = to;
          draw(now);
          veil.classList.add('is-on');
          return wait(reducedMotion ? 0 : 450);
        }
        const none = h => ({ x: h.x, y: h.y, rx: 0, ry: 0, round: h.round }); // (a hole of nothing, at its middle)
        const from = [...now, ...to.slice(now.length).map(none)]; // a new hole opens from its middle…
        const goal = [...to, ...now.slice(to.length).map(none)]; // …and one that goes closes to nothing
        const t0 = performance.now();
        return new Promise(resolve => {
          const step = t => {
            const k = Math.min(1, (t - t0) / ms);
            const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
            const mix = (a, b) => a + (b - a) * e;
            // (an oval and a rectangle: the hole takes the new one's shape at once, and glides)
            now = goal.map((b, n) => ({ x: mix(from[n].x, b.x), y: mix(from[n].y, b.y), rx: mix(from[n].rx, b.rx), ry: mix(from[n].ry, b.ry), round: b.round }));
            draw(now);
            if (k < 1 && veil.isConnected) gliding = requestAnimationFrame(step);
            else {
              now = to; // (the closed holes go)
              draw(now);
              resolve();
            }
          };
          gliding = requestAnimationFrame(step);
        });
      },
      off() {
        cancelAnimationFrame(gliding);
        veil.classList.remove('is-on');
        return wait(reducedMotion ? 0 : 450);
      },
    };
  }

  /**
   * Amit seen from above (the mall's map): his walk in four ways, from a strip of frames (sheet: { src, frameW, frameH,
   * anchorX, anchorY (the point between his feet), rows: { down, up, left, right }, frames: { down: n, … }, stand:
   * { down: [row, col], up, right } (left: right, mirrored) }), drawn `scale` times as big. place(x, y) puts the point
   * between his feet there; walk(way, dist) turns him that way and plays his steps (a frame every `per` px he goes: a
   * number, or one for each way, so that a cycle of his steps covers the ground it should and his feet don't slide);
   * stand(way) is his standing pose.
   */
  class TopWalker {
    constructor(parent, sheet, { scale = 0.6, per = 9 } = {}) {
      this.sheet = sheet;
      this.scale = scale;
      this.per = per;
      this.root = el('div', 'tw', parent);
      el('div', 'tw-shadow', this.root);
      this.body = el('div', 'tw-body', this.root, {
        width: px(sheet.frameW), height: px(sheet.frameH), left: px(-sheet.anchorX), top: px(-sheet.anchorY),
        backgroundImage: `url("${sheet.src}")`, transformOrigin: `${sheet.anchorX}px ${sheet.anchorY}px`,
      });
      this.way = 'up';
      this.phase = 0;
      this.x = 0;
      this.y = 0;
      this.stand('up');
    }

    place(x, y) {
      this.x = x;
      this.y = y;
      this.root.style.transform = `translate(${num(x)}px, ${num(y)}px) scale(${this.scale})`;
    }

    _frame(row, col, mirror = false) {
      const s = this.sheet;
      this.body.style.backgroundPosition = `${-col * s.frameW}px ${-row * s.frameH}px`;
      this.body.style.transform = mirror ? 'scaleX(-1)' : '';
    }

    walk(way, dist) {
      if (way !== this.way) {
        this.way = way;
        this.phase = 0;
      }
      const n = this.sheet.frames[way];
      const per = typeof this.per === 'number' ? this.per : this.per[way];
      this.phase = (this.phase + dist / per) % n;
      this._frame(this.sheet.rows[way], Math.floor(this.phase));
    }

    stand(way = this.way) {
      this.way = way;
      const [row, col] = this.sheet.stand[way === 'left' ? 'right' : way];
      this._frame(row, col, way === 'left');
    }
  }

  /**
   * A shop's two deals and what each costs after its discount (the user, 2026-10-29: "on the right side show only the
   * glasses' picture and the discount price"; "place the Buy down side of the things"): a card on the right with a row
   * for each, its picture and its selling price, big ("?" till it is found: fill(i), which brings the card in first if
   * it isn't yet); and a Buy under each thing in the shop (`buyAt`: the middle of its top edge, stage px; showBuys()).
   * choose() resolves with the one whose Buy is pressed (a press before it is asked counts); wrong(i): that one crossed
   * out, red, its Buy gone, the other still to buy; right(i): ticked and green, "Better deal" on it, the other's Buy gone
   * too; stamp(i): PAID on it. pic(i): its picture (to fly onto the shopping list). `title`: a tab on its top edge,
   * saying what the prices are (the user, 2026-10-29: "write discount on the upper side, attached to the panel").
   *  deals [{ name, pic, pay }]
   */
  function dealCard(parent, { deals, buyAt, title = '', cls = '' }) {
    const root = el('div', classes('pc2 dc', cls), parent);
    const card = el('div', 'pc2-card dc-card', root);
    if (title) el('div', 'dc-tab', root).textContent = title;
    let choosing = null;
    let early = null;
    let shown = false;
    const rows = deals.map((d, i) => {
      const row = el('div', 'dc-row', card);
      const pic = el('div', 'dc-pic', row);
      const img = Object.assign(el('img', '', pic), { src: d.pic, alt: d.name });
      const pay = el('b', 'dc-pay is-unknown', row);
      pay.textContent = '?';
      const buy = el('button', 'pc2-btn pc2-btn--buy dc-buy', parent, { left: px(buyAt[i][0]), top: px(buyAt[i][1]), opacity: '0' });
      buy.type = 'button';
      buy.dataset.deal = String(i);
      buy.disabled = true; // (till showBuys)
      buy.innerHTML = `${PARTY_ICONS.cart}<span>Buy</span>`;
      buy.setAttribute('aria-label', `Buy the ${d.name.toLowerCase()}, ${inr(d.pay)}`);
      buy.addEventListener('click', () => {
        if (buy.disabled || root.classList.contains('is-paid')) return;
        Sound.click();
        if (choosing) {
          const resolve = choosing;
          choosing = null;
          resolve(i);
        } else if (early === null) {
          early = i;
          buy.classList.add('is-pressed');
        }
      });
      return { row, img, pay, buy };
    });
    const gone = buy => { // (a Buy goes: it fades and shrinks away)
      buy.disabled = true;
      if (reducedMotion) {
        buy.style.display = 'none';
        return;
      }
      settle(buy.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.7)' }], { duration: 280, easing: 'ease-in', fill: 'forwards' }))
        .then(() => { buy.style.display = 'none'; });
    };
    const open = async () => { // the card comes in, then its rows, one after the other
      if (shown) return;
      shown = true;
      rows.forEach(({ row }, k) => reveal(row, [{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }],
        { duration: reducedMotion ? 1 : 400, delay: reducedMotion ? 0 : 180 + k * 260, easing: 'cubic-bezier(.2,.8,.3,1)' }));
      await springIn(root, 620);
    };
    root.style.opacity = '0';
    return {
      el: root,
      card,
      pic: i => rows[i].img,
      open,
      // Its selling price comes into its row (`instant`: already there).
      async fill(i, { instant = false } = {}) {
        const { pay } = rows[i];
        pay.textContent = inr(deals[i].pay);
        pay.classList.remove('is-unknown');
        if (instant) return;
        await open();
        Sound.pop();
        await reveal(pay, [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.6 }, { opacity: 1, transform: 'none' }],
          { duration: reducedMotion ? 1 : 460, easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The Buys under the two pop up.
      showBuys() {
        rows.forEach(({ buy }, i) => {
          buy.disabled = false;
          reveal(buy, [{ opacity: 0, transform: 'translateY(16px) scale(.8)' }, { opacity: 1, transform: 'scale(1.06)', offset: 0.65 }, { opacity: 1, transform: 'none' }],
            { duration: reducedMotion ? 1 : 480, delay: reducedMotion ? 0 : i * 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
        });
      },
      choose() {
        if (early !== null) {
          const i = early;
          early = null;
          rows[i].buy.classList.remove('is-pressed');
          return Promise.resolve(i);
        }
        return new Promise(resolve => { choosing = resolve; });
      },
      wrong(i) {
        const { row, buy } = rows[i];
        row.classList.add('is-wrong');
        gone(buy);
        wrongFlash();
        settle(row.animate([{ transform: 'none' }, { transform: 'translateX(-12px)', offset: 0.2 }, { transform: 'translateX(12px)', offset: 0.45 },
          { transform: 'translateX(-7px)', offset: 0.7 }, { transform: 'none' }], { duration: reducedMotion ? 1 : 420, easing: 'ease' }));
      },
      right(i) {
        const { row } = rows[i];
        row.classList.add('is-best');
        const badge = el('span', 'dc-badge', row);
        badge.innerHTML = `${ICON_CHECK}<span>Better deal</span>`;
        popIn(badge, 460);
        rows.forEach(r => { if (!r.buy.disabled) gone(r.buy); });
      },
      // Paid: a stamp across it.
      stamp(i, text = 'PAID') {
        root.classList.add('is-paid');
        const st = el('div', 'pc2-stamp dc-stamp', rows[i].row);
        st.textContent = text;
        Sound.stamp();
        reveal(st, [{ opacity: 0, transform: 'scale(2.2) rotate(-14deg)' }, { opacity: 1, transform: 'scale(.95) rotate(-10deg)', offset: 0.7 },
          { opacity: 1, transform: 'rotate(-10deg)' }], { duration: 480, easing: 'cubic-bezier(.3,.7,.4,1)' });
      },
      async close() {
        rows.forEach(r => r.buy.remove());
        await settle(root.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(24px) scale(.96)' }],
          { duration: 320, easing: 'ease-in', fill: 'forwards' }));
        root.remove();
      },
    };
  }

  /** A green ✓ badge on a shop that is done (its item bought). */
  function doneBadge(parent, { x, y, instant = false }) {
    const b = el('div', 'pm-done', parent, { left: px(x - 34), top: px(y - 34) });
    b.innerHTML = ICON_CHECK;
    if (!instant) popIn(b, 460);
    return b;
  }

  /**
   * The party look, priced (as in the design "All Set for the Party!"): a green ribbon, a row for each item (its picture,
   * its name, its price struck through, what was paid), a line, the total, and the money left. row(i) brings one in.
   */
  function partyTable(parent, { title, items, total, left }) {
    const root = el('div', 'pt', parent);
    el('div', 'pt-ribbon', root).textContent = title;
    const card = el('div', 'pt-card', root);
    const rows = items.map(it => {
      const row = el('div', 'pt-row', card);
      Object.assign(el('img', 'pt-icon', row), { src: it.icon, alt: '' });
      el('span', 'pt-name', row).textContent = it.name;
      el('s', 'pt-was', row).textContent = inr(it.mp);
      el('b', 'pt-paid', row).textContent = inr(it.pay);
      row.style.opacity = '0';
      return row;
    });
    el('div', 'pt-line', card);
    const totalRow = el('div', 'pt-sum', card);
    el('span', '', totalRow).textContent = 'Total Amount';
    el('b', '', totalRow).textContent = inr(total);
    const leftRow = el('div', 'pt-sum pt-left', card);
    el('span', '', leftRow).textContent = 'Money Left';
    el('b', '', leftRow).textContent = inr(left);
    [totalRow, leftRow].forEach(n => { n.style.opacity = '0'; });
    root.style.opacity = '0';
    return {
      el: root,
      rows,
      totalRow,
      leftRow,
      open: () => springIn(root, 640),
      row: i => reveal(rows[i], [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: T(360), easing: PARTY_EASE }),
      showTotal: () => popIn(totalRow, 460),
      showLeft: () => popIn(leftRow, 460),
    };
  }

  /** Mission Complete (as in the design): three gold stars, a red ribbon, a line, and the items, each ticked. */
  function partyMission(parent, { title, text, items }) {
    const root = el('div', 'pmc', parent);
    const stars = el('div', 'pmc-stars', root);
    const starEls = [0, 1, 2].map(() => {
      const s = el('span', 'pmc-star', stars);
      s.innerHTML = PARTY_ICONS.star;
      s.style.opacity = '0';
      return s;
    });
    el('div', 'pmc-ribbon', root).textContent = title;
    const card = el('div', 'pmc-card', root);
    const textEl = el('div', 'pmc-text', card);
    textEl.textContent = text;
    const grid = el('div', 'pmc-grid', card);
    const tiles = items.map(it => {
      const tile = el('div', 'pmc-tile', grid);
      const pic = el('div', 'pmc-pic', tile);
      Object.assign(el('img', '', pic), { src: it.icon, alt: '' });
      el('span', 'pmc-tick', pic).innerHTML = ICON_CHECK;
      el('span', 'pmc-name', tile).textContent = it.name;
      tile.style.opacity = '0';
      return tile;
    });
    root.style.opacity = '0';
    return {
      el: root,
      text: textEl,
      async open(ctx) {
        await springIn(root, 640);
        for (const s of starEls) {
          Sound.sparkle();
          popIn(s, 520);
          await ctx.wait(160);
        }
      },
      async tiles(ctx) {
        for (const t of tiles) {
          popIn(t, 420);
          await ctx.wait(260); // (each in turn)
        }
      },
    };
  }

  window.FX = {
    CANCELLED, el, fracText, settle, reveal, flyAcross, glow, motes, twinkles, burst, shine, exclaim, bubble, thought, badge, ring, question, reduction,
    formulaNote, concept, barModel, grid100, formulaPanel, formulaReveal, productQuestion, workedSheet, strike, stickTag, choices, percentFormula,
    questionPanel, confetti, Bird, inr, partyHud, dealCard, doneBadge, partyTable, partyMission, joystick, focusVeil, TopWalker, wrongFlash,
    setPace(p) { pace = p; },
  };
})();
