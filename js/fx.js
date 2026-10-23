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
  // the voice ends.
  async function sayWords(ctx, root, { part, seconds }) {
    const words = [...root.querySelectorAll('.b-word')].filter(w => !w.classList.contains('was-said') &&
      (part === undefined || +w.firstElementChild.dataset.part === part));
    if (!words.length) return;
    const share = (w, i) => w.textContent.length + 1 + (i > 0 && /[!?.,]$/.test(words[i - 1].textContent) ? 3 : 0);
    const total = words.reduce((sum, w, i) => sum + share(w, i), 0);
    const unit = seconds ? Math.max(16, ((seconds - 0.35) * 1000) / total) : 62;
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
        if (o.calm) return sayWords(ctx, root, { part, seconds }); // the revamp's dialogue box
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
          Sound.wrong();
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
          await ctx.wait(130);
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
          await ctx.wait(150);
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

  // ---------- summary sheet (a table of the amounts, and the rules) ----------

  /**
   * A summary on a panel: a title, a table of amounts (each row a label and its value) and a box of rules,
   * written as lines with their = signs lined up.
   *  title  e.g. 'Sneaker Example Summary'
   *  rows   [{ label, value, tone }]: tone colours the label ('mp' | 'd' | 'sp', the colours used since screen 11)
   *  rules  [{ label, parts }]: as the lines of the worked sheet (label segments [{ t, cls }]; parts, see lineParts)
   * Reveal it with open() → showTitle() → showTable() → row(i) … → showRules() → rule(i) …
   */
  function summarySheet(parent, { title, rows, rules }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'ss-panel', root);
    const head = el('div', 'ss-title', panel);
    head.textContent = title;
    const table = el('div', 'ss-table', panel);
    const cells = rows.map((row, i) => [
      Object.assign(el('div', classes('ss-label', `ss-label--${row.tone}`, i && 'ss-row'), table), { textContent: row.label }),
      Object.assign(el('div', classes('ss-value', i && 'ss-row'), table), { textContent: row.value }),
    ]);
    const box = el('div', 'ss-rules', panel);
    const lines = rules.map(rule => {
      const label = el('div', 'pf-label', box);
      (rule.label || []).forEach(seg => { el('span', seg.cls || '', label).textContent = seg.t; });
      const eq = el('div', 'pf-eq', box);
      eq.textContent = '=';
      const expr = el('div', 'pf-expr', box);
      return { label, eq, expr, parts: lineParts(expr, rule.parts) };
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', [title, ...rows.map(r => `${r.label}: ${r.value}`), ...lines.map(l => `${l.label.textContent} = ${l.parts
      .map(n => (n.classList.contains('pf-frac') ? `${n.firstChild.textContent} over ${n.lastChild.textContent}` : n.textContent)).join(' ')}`)].join('. '));
    [panel, head, table, box, ...cells.flat(), ...lines.flatMap(l => [l.label, l.eq, l.expr])].forEach(n => { n.style.opacity = '0'; });

    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    const pop = node => reveal(node, [
      { opacity: 0, transform: 'scale(.5)' },
      { opacity: 1, transform: 'scale(1.08)', offset: 0.6 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(520), easing: EASE });
    const wipe = (node, ms) => reveal(node, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: T(ms), easing: 'cubic-bezier(.3,.1,.3,1)',
    });
    const showTable = sheetFirst(table);
    const showRules = sheetFirst(box);

    return {
      el: root,
      panel,
      rows: cells,
      rules: lines,
      open: () => springUp(panel),
      // The title drops in.
      showTitle() {
        Sound.bloop();
        return reveal(head, [
          { opacity: 0, transform: 'translateY(-40px) scale(.9)' },
          { opacity: 1, transform: 'translateY(4px) scale(1.03)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(600), easing: EASE });
      },
      // Row i: its label slides in, then its value pops in (the table comes in with its first row).
      async row(i) {
        await showTable();
        const [label, value] = cells[i];
        Sound.swish();
        await reveal(label, [
          { opacity: 0, transform: 'translateX(-40px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: T(420), easing: EASE });
        Sound.pop();
        await pop(value);
      },
      // Rule i is written in: its label, its = sign, then what it equals (the box comes in with its first rule).
      async rule(i) {
        await showRules();
        const { label, eq, expr } = lines[i];
        Sound.scribble();
        await wipe(label, 420);
        eq.style.opacity = '';
        await wipe(expr, 600);
      },
      ping(node) {
        replay(node, 'is-ping');
      },
    };
  }

  // ---------- crossing out a price, and sticking on a new one ----------

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

  // The price sticker seen through a round zoom lens: the blue cover around it, the sticker big.
  function zoomArt(price) {
    const id = 'mz' + (++artId);
    const bars = [0, 9, 17, 27, 33, 44, 55, 61, 72, 81, 88, 99, 108, 115, 126, 135, 142, 152]
      .map((x, i) => `<rect x="${28 + x}" y="84" width="${i % 3 === 1 ? 6 : 3.5}" height="38"/>`).join('');
    return `<svg class="mp-zoom-art" viewBox="0 0 300 300" aria-hidden="true">
  <defs><clipPath id="${id}"><circle cx="150" cy="150" r="140"/></clipPath></defs>
  <g clip-path="url(#${id})">
    <rect width="300" height="300" fill="#2a63c6"/>
    <path d="M-10 250 Q90 190 170 236 T320 220 V310 H-10 Z" fill="#132f5c"/>
    <path d="M118 310 C150 270 96 252 140 226 C160 214 150 204 156 196 L168 196 C162 206 178 220 152 238 C116 262 172 284 150 310 Z" fill="#a8dcff"/>
    <g class="mp-zoom-sticker" transform="translate(48 88) rotate(-3)">
      <rect class="mp-sticker-card" width="208" height="134" rx="16"/>
      <text x="104" y="66">${price}</text>
      <g class="mp-bars">${bars}</g>
    </g>
  </g>
  <path class="mp-zoom-shine" d="M62 102 A100 100 0 0 1 112 52"/>
  <circle class="mp-zoom-rim" cx="150" cy="150" r="143"/>
</svg>`;
  }

  /**
   * Reveals a definition card: the card eases in (unless it is already up: card = null), its header drops in,
   * then the words appear one by one. onRead is called as the header lands (e.g. to start the voice; what it
   * returns is waited for); onMarked as each highlighted phrase is complete. voice: { seconds, lead } when it is
   * read from a recording: the words come in step with it, after its first `lead` characters (the term said
   * first), each in its share of the rest (as typing does, a comma or full stop three letters more).
   */
  async function revealDefinition(ctx, { card, head, words }, { onRead, onMarked, voice } = {}) {
    Sound.bloop();
    if (card) {
      reveal(card, [
        { opacity: 0, transform: 'translateX(70px) scale(.96)' },
        { opacity: 1, transform: 'none' },
      ], { duration: T(750), easing: 'cubic-bezier(.25,.1,.25,1)' });
    }
    if (head) { // it drops in as the card comes in (the card is never empty)
      reveal(head, [
        { opacity: 0, transform: 'translateY(-34px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: T(620), easing: 'cubic-bezier(.2,.8,.3,1)' });
    }
    const reading = onRead ? onRead() : null;
    const share = w => w.textContent.length + 1 + (/[.,]$/.test(w.textContent) ? 3 : 0); // a word, its space and pause
    const last = words[words.length - 1];
    // The whole reading, in letters: the term, every word but the last with its share, then the last word itself
    // (so the last word ends as the voice does).
    const said = words.slice(0, -1).reduce((sum, w) => sum + share(w), voice ? voice.lead : 0) + (last ? last.textContent.length : 1);
    const unit = voice ? Math.max(16, ((voice.seconds - 0.35) * 1000) / said) : 0;
    const start = performance.now();
    let at = voice ? voice.lead * unit : 0;
    await (voice ? ctx.wait(Math.max(0, start + at - performance.now()), { real: true }) : ctx.wait(800));
    let lastWord = null;
    for (const word of words) {
      word.classList.add('on', 'is-said'); // it appears, lit as it is said (the user, 2026-10-21)
      if (lastWord) lastWord.classList.remove('is-said');
      lastWord = word;
      const hl = word.closest('.hl');
      if (hl) {
        const inside = hl.querySelectorAll('.w');
        if (word === inside[inside.length - 1]) { // the whole highlighted phrase is out: swipe it
          hl.classList.add('is-marked');
          if (onMarked) onMarked();
        }
      }
      if (voice) {
        at += share(word) * unit;
        await ctx.wait(Math.max(0, start + at - performance.now()), { real: true });
      } else {
        await ctx.wait(/[.,]$/.test(word.textContent) ? 420 : 230);
      }
    }
    if (lastWord) lastWord.classList.remove('is-said');
    await Promise.all([ctx.wait(600), reading]);
  }

  /**
   * A definition on a card of its own, in the middle of the screen (room is left on its right for a character).
   *  term   the header, e.g. 'Discount'
   *  text   {phrase} gets highlighted, *word* is the term itself (in red), \n starts a new line
   * Reveal it with open() → define().
   */
  function definitionCard(parent, { term, text }) {
    const root = el('div', 'dd', parent);
    const card = el('div', 'mp-def dd-card', root);
    const head = el('div', 'mp-def-head', card);
    el('span', '', head).textContent = term;
    const words = wordify(richText(el('div', 'mp-def-text dd-text', card), text));
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${term}: ${plain(text)}`);
    [card, head].forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      card,
      // The card springs up, with its heading on it (it is never empty).
      open() {
        Sound.whoosh();
        head.style.opacity = '';
        return reveal(card, [
          { opacity: 0, transform: 'translateY(70px) scale(.86)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(700), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The words appear one by one (see revealDefinition); the heading is already up.
      define(ctx, opts) {
        return revealDefinition(ctx, { words }, opts);
      },
      // The term at the end of the definition pulses.
      emphasize() {
        card.querySelectorAll('.stress').forEach(e => e.classList.add('pulse'));
      },
    };
  }

  /**
   * A checkpoint (the revamp brief, rule 8), closing a topic: on top, the topic (ticked when it
   * is done); then 2–3 lined index cards, each a term in its colour, what it means and (optionally) its value; and one
   * formula on a yellow sticky note. (No example and no buttons of its own since the meeting of 2026-10-21: the screen
   * moves on by itself, or with the top Next.)
   *  index, topic   which checkpoint it is, and its topic
   *  say            the line her voice opens with ("Let’s remember!"), written above the cards
   *  cards          [{ term, tone: 'mp' | 'sp' | 'd' | 'part' | 'whole' | 'ink', text, value }]
   *  note           the formula: segments [{ t, tone }] (see formulaNote)
   * open() → card(i) … → showNote() → done(): each returns what came in.
   */
  function checkpoint(parent, { index, topic, say, cards, note }) {
    const root = el('div', 'ck', parent);
    const head = el('div', 'ck-head', root);
    const title = el('div', 'ck-title', head);
    el('span', '', title).textContent = topic;
    const tick = el('span', 'ck-tick', title);
    tick.textContent = '✓';
    tick.setAttribute('aria-label', 'done');
    const body = el('div', 'ck-body', root);
    body.setAttribute('role', 'group');
    body.setAttribute('aria-label', `Checkpoint ${index}: ${topic}`);
    const sayEl = say ? el('div', 'ck-say', body) : null; // what her voice says first ("Let’s remember!"), written
    if (sayEl) sayEl.textContent = say;
    const row = el('div', 'ck-cards', body);
    const cardEls = cards.map(c => {
      const card = el('div', `ck-card ck-card--${c.tone || 'ink'}`, row);
      el('div', 'ck-term', card).textContent = c.term;
      if (c.value) el('div', 'ck-value', card).textContent = c.value;
      fracText(el('div', 'ck-text', card), c.text);
      return card;
    });
    const foot = el('div', 'ck-foot', body);
    const noteEl = note ? formulaNote(foot, note) : null;
    [head, sayEl, ...cardEls, noteEl].forEach(n => { if (n) n.style.opacity = '0'; });
    const pop = (node, from = 'translateY(24px)') => {
      reveal(node, [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }], { duration: T(520), easing: 'cubic-bezier(.2,.8,.3,1)' });
      return node;
    };
    return {
      el: root,
      head,
      say: sayEl,
      cards: cardEls,
      note: noteEl,
      open: () => {
        if (sayEl) pop(sayEl);
        return pop(head, 'translateY(-14px)');
      },
      card: i => pop(cardEls[i]),
      showNote: () => noteEl && pop(noteEl, 'translateY(24px) rotate(-4deg)'),
      // The topic is done: its tick pops.
      done() {
        tick.classList.add('is-on');
        return tick;
      },
    };
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

  // Wraps every word of `node` (keeping highlight spans around them) in its own span,
  // so the words can appear one at a time.
  function wordify(node) {
    const words = [];
    const walk = parent => {
      Array.from(parent.childNodes).forEach(child => {
        if (child.nodeType === 1) return walk(child);
        if (child.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const word = el('span', 'w');
          word.textContent = part;
          frag.appendChild(word);
          words.push(word);
        });
        parent.replaceChild(frag, child);
      });
    };
    walk(node);
    return words;
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
   * Panel with a big picture of the book and its price sticker on the left, and one of three right sides.
   * The panel and the book sit in exactly the same place in every mode, so one can dissolve into the next.
   *  default      the sticker zooms into a round lens and `term` (e.g. "Marked Price (MP)") is named under it;
   *               `talk` is empty space kept for a speech bubble.
   *               open() → showBook() → highlight() → zoom() → name()
   *  definition   a card with `term` as its header and the definition ({word} highlighted, *term* stressed,
   *               \n = new line) read out word by word.            open() → showBook() (or showNow()) → define()
   *  compare      { top, bottom } price boxes ({ price, label, tone: 'yellow' | 'blue' }) with a down arrow
   *               between them.                                    open() → showBook() (or showNow()) → compare()
   *  pin          { x, y, r }: in the review's new look the book is the story's snapshot in the corner (its
   *               sticker there, in `parent`'s px): the ring and the line to the lens start from it, not the drawn book.
   */
  function pricePanel(parent, { price, term, abbr, definition, compare, sheet = false, pin = null }) {
    const root = el('div', 'mp', parent);
    const panel = el('div', 'mp-panel', root); // { sheet: true }: on the big panel that fills the screen (see game.js)
    const left = el('div', 'mp-left', panel);
    const bookBox = el('div', 'mp-book', left);
    bookBox.innerHTML = bookArt(price);
    const book = bookBox.firstElementChild;
    const sticker = book.querySelector('.mp-sticker-card');
    const mode = definition ? 'define' : compare ? 'compare' : 'lens';
    const side = el('div', `mp-side mp-side--${mode}`, panel);
    const parts = {};
    if (mode === 'define') {
      parts.card = el('div', 'mp-def', side);
      parts.head = el('div', 'mp-def-head', parts.card);
      el('span', '', parts.head).textContent = term;
      if (abbr) el('span', 'mp-def-abbr', parts.head).textContent = abbr;
      parts.words = wordify(richText(el('div', 'mp-def-text', parts.card), definition));
      panel.setAttribute('aria-label', `${term} ${abbr || ''}: ${plain(definition)}`);
    } else if (mode === 'compare') {
      const box = ({ price: p, label, tone }) => {
        const b = el('div', `cmp-box cmp-box--${tone}`, null);
        el('div', 'cmp-price', b).textContent = p;
        el('div', 'cmp-label', b).textContent = label;
        return b;
      };
      parts.top = side.appendChild(box(compare.top));
      const mid = el('div', 'cmp-mid', side);
      mid.innerHTML = downArrow();
      parts.arrow = mid.firstElementChild;
      parts.bottom = side.appendChild(box(compare.bottom));
      panel.setAttribute('aria-label', `${compare.top.label} ${compare.top.price}, ${compare.bottom.label} ${compare.bottom.price}`);
    } else {
      parts.talk = el('div', 'mp-talk', side);
      parts.lens = el('div', 'mp-zoom', side);
      parts.lens.innerHTML = zoomArt(price);
      parts.pill = el('div', 'mp-pill', side);
      el('span', '', parts.pill).textContent = term;
      if (abbr) el('span', 'mp-abbr', parts.pill).textContent = abbr;
      panel.setAttribute('aria-label', `${price}: ${term} ${abbr || ''}`.trim());
    }
    panel.setAttribute('role', 'group');
    [panel, bookBox, parts.lens, parts.pill, parts.card, parts.head, parts.top, parts.arrow, parts.bottom]
      .forEach(n => { if (n) n.style.opacity = '0'; });

    const local = node => panelBox(panel, node);
    const SOFT = 'cubic-bezier(.25,.1,.25,1)';
    let ringed = null;

    return {
      el: root,
      panel,
      book,
      talk: parts.talk,
      pill: parts.pill, // the name, under the lens
      boxes: { top: parts.top, bottom: parts.bottom }, // the compared prices
      open() {
        if (sheet) { // nothing to spring up: the screen is the panel
          panel.style.opacity = '';
          return Promise.resolve();
        }
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
      // The panel and book, already in place (when this follows another price panel).
      showNow() {
        panel.style.opacity = '';
        bookBox.style.opacity = '';
      },
      // A pulsing ring around the price sticker (only one, however often it is asked for).
      highlight() {
        if (ringed) return ringed;
        Sound.sparkle();
        if (pin) {
          ringed = ring(parent, { x: pin.x, y: pin.y, r: pin.r * 1.25 });
          return ringed;
        }
        const s = local(sticker);
        ringed = ring(panel, { x: (s.l + s.r) / 2, y: (s.t + s.b) / 2, r: Math.max(s.r - s.l, s.b - s.t) * 0.72 });
        return ringed;
      },
      // A line draws itself from the sticker to the lens, then the lens pops open showing the price big.
      async zoom() {
        const lens = parts.lens;
        const host = pin ? parent : panel; // the line is drawn in the snapshot's layer when the sticker is there
        const s = pin ? { l: pin.x - pin.r, r: pin.x + pin.r, t: pin.y - pin.r * 0.7, b: pin.y + pin.r * 0.7 } : local(sticker);
        const z = pin ? panelBox(parent, lens) : local(lens);
        const r = (z.r - z.l) / 2;
        const zc = [(z.l + z.r) / 2, (z.t + z.b) / 2];
        const a = [s.r + 18, (s.t + s.b) / 2];
        const dir = Math.atan2(a[1] - zc[1], a[0] - zc[0]);
        const b = [zc[0] + Math.cos(dir) * (r + 14), zc[1] + Math.sin(dir) * (r + 14)];
        const c = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 24]; // a gentle sag
        const line = svg('svg', { class: 'mp-link', width: host.clientWidth, height: host.clientHeight }, host);
        const path = svg('path', { pathLength: 1, d: `M ${num(a[0])} ${num(a[1])} Q ${num(c[0])} ${num(c[1])} ${num(b[0])} ${num(b[1])}` }, line);
        svg('circle', { class: 'mp-link-dot', cx: num(a[0]), cy: num(a[1]), r: 9 }, line);
        const end = svg('circle', { class: 'mp-link-dot', cx: num(b[0]), cy: num(b[1]), r: 9 }, line);
        end.style.opacity = '0';
        Sound.swish();
        await settle(path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: reducedMotion ? 1 : T(650), easing: 'ease-in-out', fill: 'backwards',
        }));
        end.style.opacity = '';
        Sound.pop();
        await reveal(lens, [
          { opacity: 0, transform: 'scale(.2) rotate(-25deg)' },
          { opacity: 1, transform: 'scale(1.1) rotate(4deg)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(700), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The name for it drops in under the lens.
      name() {
        Sound.bloop();
        return reveal(parts.pill, [
          { opacity: 0, transform: 'translateY(-26px) scale(.6)' },
          { opacity: 1, transform: 'translateY(4px) scale(1.08)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(620), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The definition card eases in beside the book, then its header and words (see revealDefinition).
      define(ctx, opts) {
        return revealDefinition(ctx, parts, opts);
      },
      // Top price box, then the arrow grows down, then the bottom price box.
      // onTop / onBottom are called as each box appears; what they return (e.g. a voice line) is waited for.
      async compare(ctx, { onTop, onBottom } = {}) {
        Sound.bloop();
        reveal(parts.top, [
          { opacity: 0, transform: 'translateY(-40px) scale(.94)' },
          { opacity: 1, transform: 'none' },
        ], { duration: T(800), easing: SOFT });
        await Promise.all([ctx.wait(900), onTop && onTop()]);

        Sound.swish();
        parts.arrow.style.opacity = '';
        await settle(parts.arrow.animate([
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0 0)' },
        ], { duration: reducedMotion ? 1 : T(900), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards' }));
        await ctx.wait(400);

        Sound.bloop();
        reveal(parts.bottom, [
          { opacity: 0, transform: 'translateY(46px) scale(.94)' },
          { opacity: 1, transform: 'none' },
        ], { duration: T(800), easing: SOFT });
        await Promise.all([ctx.wait(900), onBottom && onBottom()]);
      },
    };
  }

  // ---------- formula panel (Marked Price − Selling Price = Discount) ----------

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

  // ---------- summary (Let's remember!) ----------

  /**
   * A recap: a title, cards ({ term, tone, value, desc }) joined by arrows, and the formula under them
   * (segments: [{ t, tone }], tone optional). Reveal it with open() → title() → card(ctx, i) / arrow(i) → formula().
   * The panel sits left of centre, leaving room on its right for a character (see the CSS). With { note: true }
   * there is no panel: the recap looks made by hand on the big panel behind it (a sheet, see game.js):
   * a taped-on title, index cards, pencil arrows and a sticky note.
   */
  function summaryPanel(parent, { title, cards, formula, note = false }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', note ? 'sm-panel sm-panel--note' : 'sm-panel', root);
    const head = el('div', 'sm-title', panel);
    head.textContent = title;
    const row = el('div', 'sm-row', panel);
    const arrows = [];
    const parts = cards.map((c, i) => {
      if (i) {
        row.insertAdjacentHTML('beforeend', note ? SKETCH_ARROW : ARROW);
        arrows.push(row.lastElementChild);
      }
      const card = el('div', classes(`sm-card sm-card--${c.tone}`, !c.value && 'sm-card--general'), row);
      el('div', `sm-head tone-${c.tone}`, card).textContent = c.term;
      const value = c.value ? el('div', `sm-value tone-${c.tone}`, card) : null; // no amount: the idea in general
      if (value) value.textContent = c.value;
      const desc = el('div', 'sm-desc', card);
      desc.textContent = c.desc;
      return { card, value, desc };
    });
    const sum = el('div', 'sm-formula', panel);
    formula.forEach(seg => {
      el('span', seg.tone ? `tone-${seg.tone}` : 'sm-op', sum).textContent = seg.t;
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${title} ` + cards.map(c => `${c.term}${c.value ? ', ' + c.value : ''}: ${c.desc.replace(/\n/g, ' ')}`).join(' ') +
      ' ' + formula.map(seg => seg.t).join(' '));
    [panel, head, sum, ...arrows, ...parts.flatMap(p => [p.card, p.value, p.desc])].filter(Boolean).forEach(n => { n.style.opacity = '0'; });
    const pop = (node, ms = 560) => reveal(node, [
      { opacity: 0, transform: 'scale(.7) translateY(30px)' },
      { opacity: 1, transform: 'scale(1.04)', offset: 0.65 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(ms), easing: 'cubic-bezier(.2,.8,.3,1)' });

    return {
      el: root,
      panel,
      sum,
      cards: parts.map(p => p.card),
      open() {
        if (note) { // nothing to spring up: the page is already there
          panel.style.opacity = '';
          return Promise.resolve();
        }
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The title drops in.
      title() {
        Sound.bloop();
        return reveal(head, [
          { opacity: 0, transform: 'translateY(-40px) scale(.8)' },
          { opacity: 1, transform: 'translateY(4px) scale(1.04)', offset: 0.65 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // Card i pops in, then its value, then its description.
      async card(ctx, i) {
        const { card, value, desc } = parts[i];
        Sound.bloop();
        pop(card);
        await ctx.wait(380);
        if (value) {
          Sound.pop();
          reveal(value, [
            { opacity: 0, transform: 'scale(.5)' },
            { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(480), easing: 'cubic-bezier(.2,.8,.3,1)' });
          await ctx.wait(300);
        }
        reveal(desc, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
          duration: T(500), easing: 'cubic-bezier(.25,.1,.25,1)',
        });
      },
      // The arrow after card i draws itself.
      arrow(i) {
        const node = arrows[i];
        node.style.opacity = '';
        Sound.swish();
        return settle(node.querySelector('path').animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: reducedMotion ? 1 : T(500), easing: 'ease-in-out', fill: 'backwards',
        }));
      },
      // The formula pops in under the cards.
      formula() {
        Sound.pop();
        return pop(sum, 620);
      },
    };
  }

  // ---------- product card (a photo of an item, its price tag and its discount tag) ----------

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
   * A photo of an item with its price tag hanging on it and its discount tag under it, like the tags on the
   * sneakers and on the stand in the shop's pictures.
   *  photo  the picture of the item;  price  e.g. '₹1800';  off  the discount tag's lines, e.g. ['30%', 'OFF']
   *  knot   where the price tag is tied, in % of the photo: [left, top]
   * Reveal it with open() → showPhoto() → showPrice() (the tag swings on its string) → showOff() (lands like a
   * stamp, then a gold frame glows around it). ping(node) makes a tag, or the discount tag's first line
   * (`percent`), pop while it is talked about.
   */
  function productCard(parent, { photo, price, off, knot }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'pc-panel', root);
    const item = productParts(panel, { photo, price, off, knot });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${price}, ${off.join(' ')}`);
    panel.style.opacity = '0';
    return {
      el: root,
      panel,
      photo: item.photo,
      priceTag: item.priceTag,
      offTag: item.offTag,
      percent: item.percent,
      open: () => springUp(panel),
      showPhoto: item.showPhoto,
      showPrice: item.showPrice,
      showOff: item.showOff,
      ping(node) {
        replay(node, 'is-ping');
      },
    };
  }

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

  /**
   * What a tag means, written big: the red discount tag (as on the sneakers), "means" over an arrow, and the
   * same thing said another way on a card, line for line: 30% / OFF → means → 30% / Discount.
   *  tag   the tag's lines, e.g. ['30%', 'OFF'];  card  the card's lines, [{ t, cls }], e.g. [{ t: '30%' }, { t: 'Discount', cls: 'tone-d' }]
   * Reveal it with open() → stamp() (the tag lands like a stamp, then a gold frame glows round it) → means()
   * (the word, and the arrow drawn) → card() (it springs up); ping(node) pops a piece (tagEl, cardEl, word)
   * while it is read out.
   */
  function meansPanel(parent, { tag, card, means = 'means' }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'mn-panel', root);
    const tagPos = el('div', 'pc-off-pos', panel); // tilted like the tag on the stand
    const tagEl = el('div', 'pc-off mn-tag', tagPos);
    tag.forEach(t => { el('span', 'pc-off-line', tagEl).textContent = t; });
    const mid = el('div', 'mn-means', panel);
    const word = el('span', 'mn-word', mid);
    word.textContent = means;
    mid.insertAdjacentHTML('beforeend',
      '<svg class="mn-arrow" viewBox="0 0 200 56" aria-hidden="true"><path pathLength="1" d="M8 28h176M156 6l28 22-28 22"/></svg>');
    const arrow = mid.lastElementChild;
    const cardEl = el('div', 'mn-card', panel);
    card.forEach(p => { el('span', classes('mn-card-line', p.cls), cardEl).textContent = p.t; });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${tag.join(' ')} ${means} ${card.map(p => p.t).join(' ')}`);
    [panel, tagEl, word, arrow, cardEl].forEach(n => { n.style.opacity = '0'; });
    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    return {
      el: root,
      panel,
      tagEl,
      cardEl,
      word,
      open: () => springUp(panel),
      async stamp() {
        Sound.stamp();
        await reveal(tagEl, [
          { opacity: 0, transform: 'scale(1.9) rotate(-11deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(600), easing: EASE });
        Sound.sparkle();
        const w = tagPos.offsetWidth;
        const h = tagPos.offsetHeight;
        ring(tagPos, { x: w / 2, y: h / 2, w: w + 28, h: h + 28, round: 34 });
      },
      // "means" rises in, and the arrow draws itself towards the card.
      async means() {
        Sound.swish();
        reveal(word, [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: T(500), easing: EASE });
        arrow.style.opacity = '';
        await settle(arrow.querySelector('path').animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: reducedMotion ? 1 : T(620), easing: 'ease-in-out', fill: 'backwards',
        }));
      },
      card() {
        Sound.bloop();
        return reveal(cardEl, [
          { opacity: 0, transform: 'translateY(40px) scale(.86)' },
          { opacity: 1, transform: 'translateY(-6px) scale(1.02)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(640), easing: EASE });
      },
      ping(node) {
        replay(node, 'is-ping');
      },
    };
  }

  // ---------- worked solution (value boxes, and the working written line by line) ----------

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
          Sound.wrong();
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
          Sound.wrong();
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
        else Sound.wrong();
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
    const pop = node => reveal(node, [
      { opacity: 0, transform: 'scale(.6)' },
      { opacity: 1, transform: 'scale(1.06)', offset: 0.65 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(560), easing: 'cubic-bezier(.2,.8,.3,1)' });

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

  // ---------- definitions panel ----------

  const ARROW = '<svg class="def-arrow" viewBox="0 0 64 40" aria-hidden="true"><path pathLength="1" d="M6 20h44M36 7l15 13-15 13"/></svg>';
  // The same, drawn by hand in pencil: a slightly wavy line, and a head in one stroke (screen 19).
  const SKETCH_ARROW = '<svg class="def-arrow is-sketch" viewBox="0 0 64 40" aria-hidden="true"><path pathLength="1" d="M5 24C16 18 30 27 47 20M36 11C41 14 45 17 49 20C44 23 40 27 37 32"/></svg>';

  /**
   * Terms explained side by side, on the big panel left of Swifty's stand (shown after a wrong answer).
   *  items   [{ title, tone: 'blue' | 'yellow', pictures: [src, src], text }]   ({word} gets highlighted)
   * Reveal it with open() → fill().
   */
  function definitions(parent, { items }) {
    const root = el('div', 'defs', parent);
    const panel = el('div', 'defs-panel', root);
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', items.map(item => `${item.title}: ${plain(item.text)}`).join(' '));
    const row = el('div', 'defs-row', panel);
    const cards = items.map(item => {
      const card = el('div', `def def--${item.tone}`, row);
      const title = el('div', 'def-title', card);
      title.textContent = item.title;
      const pics = el('div', 'def-pics', card);
      const parts = [];
      item.pictures.forEach((src, i) => {
        if (i) {
          pics.insertAdjacentHTML('beforeend', ARROW);
          parts.push(pics.lastElementChild);
        }
        const frame = el('div', 'def-pic', pics);
        const img = el('img', '', frame);
        img.src = src;
        img.alt = '';
        img.draggable = false;
        parts.push(frame);
      });
      const text = richText(el('div', 'def-text', card), item.text);
      return { card, title, parts, text };
    });

    const staged = [panel, ...cards.flatMap(c => [c.card, c.title, ...c.parts, c.text])];
    staged.forEach(n => { n.style.opacity = '0'; });

    return {
      el: root,
      panel,
      // The panel springs up (its first card comes in with it: see fill).
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // Then one card at a time, slowly enough to follow (Cost Price first, then Selling Price).
      // Each piece eases in on its own: the card, its title, the first picture, the arrow drawing
      // itself, the second picture, the definition, and the highlight on the key word, then a pause to read.
      // Hooks (card index i): onCard as the card appears; onTitle / onText as its title / definition
      // appears (onText may return a promise, e.g. the definition being read out, to wait for).
      async fill(ctx, { onCard, onTitle, onText } = {}) {
        const SOFT = 'cubic-bezier(.25,.1,.25,1)';
        const rise = (node, ms) => reveal(node, [
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: T(ms), easing: SOFT });
        for (const [i, c] of cards.entries()) {
          reveal(c.card, [
            { opacity: 0, transform: 'translateY(46px) scale(.97)' },
            { opacity: 1, transform: 'none' },
          ], { duration: T(800), easing: SOFT });
          Sound.bloop();
          if (onCard) onCard(i);
          await ctx.wait(150); // its title comes in with it (a card is never empty)
          rise(c.title, 650);
          if (onTitle) onTitle(i);
          await ctx.wait(500);
          for (const part of c.parts) {
            if (part.classList.contains('def-arrow')) {
              part.style.opacity = '';
              settle(part.querySelector('path').animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
                duration: reducedMotion ? 1 : T(560), easing: 'ease-in-out', fill: 'backwards',
              }));
            } else {
              reveal(part, [
                { opacity: 0, transform: 'scale(.84)' },
                { opacity: 1, transform: 'none' },
              ], { duration: T(600), easing: SOFT });
            }
            await ctx.wait(380);
          }
          await ctx.wait(170);
          rise(c.text, 700);
          const reading = onText ? onText(i) : null;
          await ctx.wait(600);
          c.text.querySelectorAll('.hl').forEach(m => m.classList.add('is-marked'));
          await Promise.all([ctx.wait(1100), reading]); // time to read (and hear it) before the next card
        }
      },
    };
  }

  // ---------- the shopping challenge's opening panel ("Game Begins") ----------

  /**
   * The design's "Game Begins" panel: a cream panel with the GAME BEGINS banner and its "School Shopping Challenge"
   * ribbon, the wallet, the shopping list (its items side by side, each a small card with its picture and its name
   * under it) and the START SHOPPING button, with room between them. The pictures are cut from the design's panel
   * sheet (art: { panel, banner, ribbon, wallet, button }; the panel made at the design's size from the sheet's, its
   * round corners kept as they are); the list is drawn.
   *  items   [{ icon, label }]      wallet  the wallet's words, for screen readers (e.g. 'Wallet: ₹5,000')
   * Reveal it with open() → ribbon() → wallet() → list() → item(ctx, i) → start(onPress).
   */
  function challengePanel(parent, { art, items, wallet }) {
    const root = el('div', 'cp', parent);
    const picture = (cls, src, alt, host = root) => Object.assign(el('img', cls, host), { src, alt, draggable: false });
    const panel = picture('cp-panel', art.panel, '');
    const banner = picture('cp-banner', art.banner, 'Game begins');
    const ribbon = picture('cp-ribbon', art.ribbon, 'School Shopping Challenge');
    const purse = el('div', 'cp-wallet', root);
    picture('', art.wallet, wallet, purse);
    const glint = el('div', 'cp-glint', purse); // a shine across the wallet's navy pill (₹5,000)
    const list = el('div', 'cp-list-title', root);
    list.textContent = 'Shopping List';
    const row = el('div', 'cp-items', root);
    row.setAttribute('role', 'list');
    row.setAttribute('aria-label', 'Shopping List');
    const cards = items.map(item => {
      const card = el('div', 'cp-item', row);
      card.setAttribute('role', 'listitem');
      picture('cp-icon', item.icon, '', card);
      el('span', 'cp-label', card).textContent = item.label.replace(' ', '\n'); // "School / Uniform", on two lines
      return card;
    });
    const button = el('button', 'cp-start', root);
    button.type = 'button';
    button.setAttribute('aria-label', 'Start shopping');
    picture('', art.button, '', button);
    [panel, banner, ribbon, purse, list, button, ...cards].forEach(n => { n.style.opacity = '0'; });

    const SPRING = 'cubic-bezier(.2,.8,.3,1)';
    const pop = (node, ms = 420) => reveal(node, [
      { opacity: 0, transform: 'scale(.4)' },
      { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(ms), easing: SPRING });

    return {
      el: root,
      button,
      // The panel springs up and its banner drops onto it, with a little bounce (the panel never waits empty).
      open() {
        Sound.whoosh();
        reveal(panel, [
          { opacity: 0, transform: 'translateY(70px) scale(.9)' },
          { opacity: 1, transform: 'translateY(-6px) scale(1.01)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(620), easing: SPRING });
        return reveal(banner, [
          { opacity: 0, transform: 'translateY(-170px) rotate(-3deg)' },
          { opacity: 1, transform: 'translateY(12px) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'translateY(-4px)', offset: 0.84 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(820), delay: T(140), easing: 'cubic-bezier(.3,.7,.4,1)' });
      },
      // The ribbon unrolls under the banner.
      ribbon() {
        Sound.swish();
        return reveal(ribbon, [
          { opacity: 0, transform: 'scaleX(.15)' },
          { opacity: 1, transform: 'scaleX(1.05)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(480), easing: SPRING });
      },
      // The wallet pops in, and a shine runs across it (cha-ching).
      async wallet() {
        Sound.pop();
        await pop(purse, 480);
        glint.classList.add('is-on');
        Sound.kaching();
      },
      // The list's title comes in.
      list() {
        Sound.bloop();
        return reveal(list, [
          { opacity: 0, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'none' },
        ], { duration: T(420), easing: SPRING });
      },
      // One item of the list: its card pops in, with its picture and its name.
      async item(ctx, i) {
        Sound.pop();
        await pop(cards[i], 460);
      },
      // The START SHOPPING button bounces in, then glows gently while it waits to be pressed.
      async start(onPress) {
        Sound.bloop();
        button.addEventListener('click', () => {
          Sound.click();
          if (onPress) onPress();
        });
        await reveal(button, [
          { opacity: 0, transform: 'translateY(30px) scale(.7)' },
          { opacity: 1, transform: 'translateY(-6px) scale(1.06)', offset: 0.65 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING });
        button.classList.add('is-calling');
      },
    };
  }

  // ---------- the shopping game: the wallet and the shopping list ----------

  const rupees = n => '₹' + n.toLocaleString('en-IN');

  // The rupees shown in `node` count from `from` to `to` over `ms`, slowing down at the end.
  function countRupees(node, from, to, ms) {
    if (reducedMotion || from === to) {
      node.textContent = rupees(to);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const start = performance.now();
      const step = now => {
        const k = Math.min(1, (now - start) / ms);
        node.textContent = rupees(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  const picture = (cls, src, host) => Object.assign(el('img', cls, host), { src, alt: '', draggable: false });

  /**
   * The shopping game's wallet and shopping list on a white panel, as in the design of screen 47: the wallet with its
   * money in a pale pill, a thin line, "Shopping List" and a line for each item (its checkbox, its picture, its name).
   * On the streets it is two small white cards in the top-left corner, the wallet and the list, as in the street's
   * design ({ street: true }).
   *  items   [{ id, name, icon, tone }]      art  { wallet, check, done }: the wallet, an empty and a ticked checkbox
   *  money   the rupees in the wallet        bought  the ids of the items bought so far (their boxes are ticked)
   *  shown   false: its parts start hidden, to come in one by one (see shopPicker's enter)
   * countTo(n) counts the money to n; tick(i) ticks item i's box; light(i) lights up item i's line.
   */
  function walletPanel(parent, { items, art, money, bought = [], street = false, shown = true }) {
    const panel = el('div', street ? 'sp-panel sp-panel--street' : 'sp-panel', parent);
    const wallet = el('div', 'sp-wallet', panel);
    picture('sp-wallet-icon', art.wallet, wallet);
    const amount = el('div', 'sp-amount', wallet);
    const rule = el('div', 'sp-rule', panel);
    const title = el('div', 'sp-title', panel);
    title.textContent = 'Shopping List';
    const rows = items.map(item => {
      const done = bought.includes(item.id);
      const row = el('div', classes('sp-row', `sp-row--${item.tone}`, `sp-row--${item.id}`, done && 'is-ticked'), panel);
      const check = picture('sp-check', done ? art.done : art.check, row);
      picture('sp-row-icon', item.icon, row);
      el('span', 'sp-row-label', row).textContent = item.name;
      return { el: row, check };
    });
    const setMoney = n => {
      amount.textContent = rupees(n);
      wallet.setAttribute('aria-label', 'Wallet: ' + rupees(n));
    };
    setMoney(money);
    if (!shown) [panel, wallet, rule, title, ...rows.map(r => r.el)].forEach(n => { n.style.opacity = '0'; });
    return {
      el: panel,
      wallet,
      amount,
      rule,
      title,
      rows: rows.map(r => r.el),
      setMoney,
      // The money counts from what it shows now to n, then pops.
      async countTo(n, ms = 900) {
        await countRupees(amount, +amount.textContent.replace(/\D/g, ''), n, ms);
        setMoney(n);
        amount.animate([{ transform: 'none' }, { transform: 'scale(1.1)', offset: 0.4 }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // Item i's box is ticked: the green tick pops in.
      tick(i) {
        const { el: row, check } = rows[i];
        check.src = art.done;
        row.classList.add('is-ticked');
        Sound.correct();
        check.animate([
          { transform: 'scale(.3) rotate(-20deg)' },
          { transform: 'scale(1.3) rotate(6deg)', offset: 0.6 },
          { transform: 'none' },
        ], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // Item i's line lights up in its colour (-1: none).
      light(i) {
        rows.forEach((r, k) => r.el.classList.toggle('is-picked', k === i));
      },
    };
  }

  // ---------- choosing a shop (screen 47) ----------

  /**
   * The design's shop picker: the four shops' cards in a 2×2 grid, each in its shop's colour with its picture,
   * little sparks and its name on a pill, and on the right the wallet and the shopping list (walletPanel). The
   * pictures are cut from the design's sheet; the rest is drawn. A card is a button: tapping it picks that shop (the
   * card glows and a "Selected" tag pops up on it, and its line on the list lights up). A shop whose item is bought
   * is light grey with a big green tick on it, and its button is disabled: it can't be picked again.
   *  shops   [{ id, name, icon, tone, sparks: [[x %, y %, angle], …] }]   tone: yellow | pink | green | purple
   *  art     { wallet, check, done }   money  the rupees in the wallet   bought  the ids of the items bought so far
   *  onPick  (i) => void, once a shop is picked
   * Reveal it with enter(ctx) (or enter(ctx, { quick: true }), coming back from a shop: the panel is already there,
   * the cards pop up quickly); then invite(ctx) bounces the cards now and then until one is picked.
   */
  function shopPicker(parent, { shops, art, money, bought = [], onPick }) {
    const root = el('div', 'sp', parent);
    const hint = el('div', 'sp-hint', el('div', 'sp-hint-pos', root));
    const left = shops.filter(shop => !bought.includes(shop.id)).length;
    hint.textContent = left ? 'Tap to Select' : 'All done!';
    const grid = el('div', 'sp-grid', root);
    const cards = shops.map(shop => {
      const done = bought.includes(shop.id);
      const card = el('button', classes('sp-card', `sp-card--${shop.tone}`, `sp-card--${shop.id}`, done && 'is-bought'), grid);
      card.type = 'button';
      card.disabled = done; // bought: it can't be picked again
      card.setAttribute('aria-label', done ? `${shop.name}: bought` : `${shop.name} shop`);
      const sparks = el('span', 'sp-sparks', card);
      shop.sparks.forEach(([x, y, angle]) => el('i', 'sp-spark', sparks, {
        left: x + '%', top: y + '%', transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      }));
      picture('sp-icon', shop.icon, card);
      el('span', 'sp-name', card).textContent = shop.name;
      el('span', 'sp-tag', card).textContent = 'Selected';
      if (done) picture('sp-done', art.done, card); // a big green tick, over its greyed picture
      return { el: card, sparks, done };
    });
    const board = walletPanel(root, { items: shops, art, money, bought, shown: false });
    const { el: panel, wallet, amount, rule, title, rows } = board;
    [hint, ...cards.map(c => c.el)].forEach(n => { n.style.opacity = '0'; });

    const SPRING = 'cubic-bezier(.2,.8,.3,1)';
    let ready = false; // the cards can be picked once they are all in
    let picked = -1;

    function pick(i) {
      if (!ready) return;
      const card = cards[i];
      if (card.done || picked === i) { // bought already (its button is disabled anyway), or picked already: it just wiggles
        Sound.click();
        card.el.animate([{ transform: 'none' }, { transform: 'rotate(-1.6deg)' }, { transform: 'rotate(1.6deg)' }, { transform: 'none' }], { duration: 380, easing: 'ease-in-out' });
        return;
      }
      picked = i;
      Sound.click();
      Sound.sparkle();
      cards.forEach((c, k) => c.el.classList.toggle('is-picked', k === i));
      board.light(i);
      card.el.animate([{ transform: 'scale(.93)' }, { transform: 'scale(1.035)', offset: 0.55 }, { transform: 'none' }], { duration: 480, easing: SPRING });
      card.sparks.animate([{ transform: 'none' }, { transform: 'scale(1.22)', offset: 0.35 }, { transform: 'none' }], { duration: 560, easing: 'ease-out' });
      rows[i].animate([{ transform: 'none' }, { transform: 'scale(1.03)', offset: 0.4 }, { transform: 'none' }], { duration: 420, easing: SPRING });
      hint.classList.remove('is-bobbing');
      hint.classList.add('is-done');
      if (onPick) onPick(i);
    }
    cards.forEach((c, i) => c.el.addEventListener('click', () => pick(i)));

    const popCard = (node, ms = 480) => reveal(node, [
      { opacity: 0, transform: 'translateY(46px) scale(.8)' },
      { opacity: 1, transform: 'translateY(-6px) scale(1.03)', offset: 0.65 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(ms), easing: SPRING });
    async function showHint() {
      if (picked >= 0) return;
      Sound.swish();
      await reveal(hint, [
        { opacity: 0, transform: 'translateY(-36px)' },
        { opacity: 1, transform: 'translateY(5px)', offset: 0.7 },
        { opacity: 1, transform: 'none' },
      ], { duration: T(520), easing: SPRING });
      if (picked < 0 && left) hint.classList.add('is-bobbing');
    }

    return {
      el: root,
      board,
      // The panel slides in from the right while the cards pop up one after another (they can be picked from then
      // on); the wallet comes in meanwhile and its money counts up from ₹0 (cha-ching); then the list, line by line,
      // and the hint to tap a shop. { quick: true }: the panel is there at once, and the cards pop up quickly.
      async enter(ctx, { quick = false } = {}) {
        if (quick) {
          [panel, wallet, rule, title, ...rows].forEach(n => { n.style.opacity = ''; });
          for (const c of cards) {
            Sound.pop();
            popCard(c.el, 380);
            await ctx.wait(60);
          }
          await ctx.wait(300);
          ready = true;
          await showHint();
          return;
        }
        Sound.whoosh();
        reveal(panel, [
          { opacity: 0, transform: 'translateX(120px)' },
          { opacity: 1, transform: 'translateX(-8px)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING });
        const cardsIn = (async () => {
          for (const c of cards) {
            Sound.pop();
            popCard(c.el);
            await ctx.wait(100);
          }
          ready = true;
        })();
        cardsIn.catch(() => {}); // the screen was left: the rest stops too
        await ctx.wait(260);
        Sound.pop();
        if (!reducedMotion) amount.textContent = rupees(0);
        await reveal(wallet, [
          { opacity: 0, transform: 'scale(.6)' },
          { opacity: 1, transform: 'scale(1.06)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(400), easing: SPRING });
        const counted = countRupees(amount, 0, money, 700); // ₹0 → ₹5,000
        reveal(rule, [{ opacity: 0, transform: 'scaleX(0)' }, { opacity: 1, transform: 'none' }], { duration: T(380), easing: 'ease-out' });
        reveal(title, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: T(320), easing: 'ease-out' });
        await counted;
        await ctx.wait(0); // (not if the screen was left meanwhile)
        Sound.kaching();
        amount.animate([{ transform: 'none' }, { transform: 'scale(1.08)', offset: 0.4 }, { transform: 'none' }], { duration: 380, easing: SPRING });
        await ctx.wait(120);
        for (const row of rows) {
          Sound.bloop();
          reveal(row, [
            { opacity: 0, transform: 'translateX(46px)' },
            { opacity: 1, transform: 'translateX(-4px)', offset: 0.7 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(380), easing: SPRING });
          await ctx.wait(90);
        }
        await cardsIn;
        await ctx.wait(300);
        await showHint();
      },
      // Until a shop is picked, the cards still to visit bounce one after another every few seconds.
      async invite(ctx) {
        if (reducedMotion) return;
        for (;;) {
          await ctx.wait(3600, { real: true });
          if (picked >= 0) return;
          for (const c of cards.filter(card => !card.done)) {
            c.el.animate([
              { transform: 'none' },
              { transform: 'translateY(-14px)', offset: 0.4 },
              { transform: 'translateY(2px)', offset: 0.75 },
              { transform: 'none' },
            ], { duration: 560, easing: 'ease-in-out' });
            await ctx.wait(140, { real: true });
          }
        }
      },
    };
  }

  // ---------- the shopping game's rounds: a street of three shops ----------

  // A piece of the street's asset sheet with words on it (they are written by the game, in its own font): the
  // picture, and the words centred on it (where exactly: see the CSS of each kind).
  function artLabel(host, cls, src, text, tag = 'div') {
    const node = el(tag, 'art-label ' + cls, host);
    picture('art-pic', src, node);
    const words = el('span', 'art-words', node);
    if (text !== undefined) words.textContent = text;
    return { el: node, words };
  }

  // The marked price on the sheet's white tag: "Marked Price", and the amount under it. Its size follows its font size.
  function priceTag(host, art, value, cls = '') {
    const { el: tag, words } = artLabel(host, classes('tg-price', cls), art.price);
    el('span', 'tg-label', words).textContent = 'Marked Price';
    el('span', 'tg-value', words).textContent = value;
    return tag;
  }

  // An offer on the sheet's red tag, a line each (e.g. ['10%', 'OFF']), tilted with the tag.
  function offerTag(host, art, lines, cls = '') {
    const { el: tag, words } = artLabel(host, classes('tg-offer', cls), art.offer);
    lines.forEach(t => { el('span', 'tg-line', words).textContent = t; });
    return tag;
  }

  // A clothes hanger: its hook, and its sloping arms under the uniform's shoulders (the uniform hides the rest).
  const HANGER = '<svg class="st-hanger" viewBox="0 0 120 60" aria-hidden="true"><path d="M60 31 V 24 C 60 20 67 19 67 12 C 67 6 62 3 57 4 C 54 5 52 8 52 10"/><path d="M60 31 L 16 54 H 104 Z"/></svg>';

  /**
   * A street with three shops (Uniform Street, Shoe Street, …), as in the street's design: the street's picture behind
   * (the sky, the town, the pavement and the road), two clouds drifting across the sky, and the three shop fronts side
   * by side on the pavement (the street's name and its item are only for screen readers: the question bar tells). Each is
   * the shop front from "new shops for game .png" in its colour (a sign with a bump on top, a striped awning with a
   * scalloped edge, a cream front with a big window and its lamps), with the game's words and things on it: the shop's
   * name on its sign, and in the window the item on the left, its marked price on a tag hanging on the right, and the
   * shop's offer on a red tag under it. A shop is a button: tap(skip) waits for the player to tap one (not in
   * `skip`). Once its offer is checked, the green badge under it gives its Selling Price, "SP = ₹1,440" (paid(i));
   * choose(texts) turns the three badges into Buy buttons, one under each shop ("Buy for ₹1,440" …), for the
   * player to pick where to buy; best(i) marks the best deal with the yellow ribbon.
   *  id     the item's id (its size in the windows: see the CSS);  name  e.g. 'Uniform Street';  item  e.g. 'School Uniform'
   *  icon   the item's picture
   *  shops  [{ name: 'Shop A', tone: 'coral' | 'blue' | 'purple', price: '₹1,600', off: ['10%', 'OFF'], pay: '₹1,440' }]
   *  art    { backdrop } the street's picture, { fronts: { coral, blue, purple } } the shop fronts, and the sheet's
   *         pieces { pill, ribbon, button } (badge, ribbon, Buy)
   * veil() puts a calm backdrop over the whole street, the wallet, the list and Aniket while a card is up.
   */
  function street(parent, { id, name, item, icon, shops, art }) {
    const root = el('div', `st st--${id}`, parent);
    el('div', 'st-backdrop', root).style.backgroundImage = `url("${art.backdrop}")`;
    el('div', 'st-cloud st-cloud--1', root);
    el('div', 'st-cloud st-cloud--2', root);
    const fronts = shops.map((shop, i) => {
      const b = el('button', `st-shop st-shop--${shop.tone} st-shop--${i}`, root);
      b.type = 'button';
      b.disabled = true;
      b.setAttribute('aria-label', `${shop.name}: ${item}. Marked price ${shop.price}, offer ${shop.off.join(' ')}`);
      el('div', 'st-glow', b);
      picture('st-art', art.fronts[shop.tone], b); // the shop front: its sign, its awning, its window
      el('span', 'st-board-name', b).textContent = shop.name; // on the sign
      const display = el('div', 'st-display', b); // what is in the window
      if (id === 'uniform') display.insertAdjacentHTML('beforeend', HANGER); // under the uniform, which hangs on it
      const pic = picture('st-item', icon, display);
      el('div', 'st-price', display).textContent = shop.price;
      const offer = el('div', 'st-offer', display);
      shop.off.forEach(t => { el('span', /\d/.test(t) ? 'st-offer-big' : 'st-offer-small', offer).textContent = t; }); // the amount big, the word small
      const pay = artLabel(b, 'st-pay', art.pill, `SP = ${shop.pay}`).el;
      pay.style.opacity = '0';
      const ribbon = artLabel(b, 'st-best', art.ribbon, 'Best deal!').el;
      ribbon.style.opacity = '0';
      b.style.opacity = '0';
      return { el: b, pic, display, pay, ribbon, done: false };
    });
    root.setAttribute('aria-label', `${name}: ${item}`);
    const SPRING = 'cubic-bezier(.2,.8,.3,1)';
    const popIn = node => reveal(node, [
      { opacity: 0, transform: 'translateY(-20px) scale(.6)' },
      { opacity: 1, transform: 'translateY(4px) scale(1.06)', offset: 0.6 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(460), easing: SPRING });
    let waiting = null; // { skip, resolve } while waiting for a tap
    fronts.forEach((f, i) => f.el.addEventListener('click', () => {
      if (!waiting || waiting.skip.has(i)) return;
      const { resolve } = waiting;
      waiting = null;
      fronts.forEach(g => { g.el.disabled = true; g.el.classList.remove('is-open'); });
      Sound.click();
      f.el.animate([{ transform: 'scale(.95)' }, { transform: 'scale(1.03)', offset: 0.5 }, { transform: 'none' }], { duration: 380, easing: SPRING });
      resolve(i);
    }));

    return {
      el: root,
      shops: fronts.map(f => f.el),
      pictures: fronts.map(f => f.pic),
      // While a card is up: a calm backdrop over everything on the screen so far (the street, the wallet and the list,
      // Aniket), so all eyes are on the card that comes up over it (the question bar stays: Swifty helps from there).
      veil: () => streetVeil(parent),
      // The shops pop up one after another.
      async enter(ctx) {
        for (const f of fronts) {
          Sound.pop();
          reveal(f.el, [
            { opacity: 0, transform: 'translateY(60px) scale(.85)' },
            { opacity: 1, transform: 'translateY(-8px) scale(1.02)', offset: 0.65 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(520), easing: SPRING });
          await ctx.wait(160);
        }
        await ctx.wait(400);
      },
      // Waits for the player to tap a shop (not one in `skip`, a Set of indexes); resolves with its index. The
      // shops still to check glow softly meanwhile.
      tap(skip = new Set()) {
        fronts.forEach((f, i) => {
          f.el.disabled = skip.has(i);
          f.el.classList.toggle('is-open', !skip.has(i));
        });
        return new Promise(resolve => { waiting = { skip, resolve }; });
      },
      // The shops still to check bounce one after another (a reminder to tap one).
      async bounce(ctx, skip = new Set()) {
        if (reducedMotion) return;
        for (const [i, f] of fronts.entries()) {
          if (skip.has(i)) continue;
          f.el.animate([
            { transform: 'none' },
            { transform: 'translateY(-16px)', offset: 0.4 },
            { transform: 'translateY(2px)', offset: 0.75 },
            { transform: 'none' },
          ], { duration: 560, easing: 'ease-in-out' });
          await ctx.wait(150, { real: true });
        }
      },
      // Shop i's green "SP = …" badge pops in under it.
      paid(i) {
        fronts[i].done = true;
        fronts[i].el.classList.add('is-checked');
        Sound.pop();
        return popIn(fronts[i].pay);
      },
      // Shop i is the best deal: it glows, and a ribbon says so; the others fade back a little.
      best(i) {
        fronts.forEach((f, k) => f.el.classList.toggle('is-faded', k !== i));
        fronts[i].el.classList.add('is-best');
        Sound.sparkle();
        return popIn(fronts[i].ribbon);
      },
      // Where to buy: each shop's green SP badge dissolves into a yellow Buy button with its price (texts[i], e.g.
      // "Buy for ₹1,440"). pick() waits for one to be pressed and resolves with its shop's index: a wrong one
      // shakes and buzzes and is crossed out (it can't be pressed again); guide(i) makes button i glow; finish(i)
      // presses it home, and every button dissolves back into its badge.
      async choose(texts) {
        const SOFT = 'cubic-bezier(.45,0,.3,1)';
        const buttons = fronts.map((f, i) => {
          const btn = artLabel(f.el, 'st-buy', art.button, texts[i], 'button').el;
          btn.type = 'button';
          btn.disabled = true;
          btn.setAttribute('aria-label', texts[i]);
          btn.addEventListener('click', e => {
            e.stopPropagation(); // not a tap on the shop itself
            if (!waitingBuy || btn.disabled) return;
            const resolve = waitingBuy;
            waitingBuy = null;
            buttons.forEach(b => { b.disabled = true; });
            Sound.click();
            resolve(i);
          });
          return btn;
        });
        let waitingBuy = null;
        Sound.swish();
        await Promise.all(fronts.map((f, i) => Promise.all([
          settle(f.pay.animate([
            { opacity: 1, filter: 'blur(0)', transform: 'none' },
            { opacity: 0, filter: 'blur(8px)', transform: 'scale(1.08)' },
          ], { duration: reducedMotion ? 1 : T(700), delay: T(i * 160), easing: 'ease-in', fill: 'forwards' })),
          reveal(buttons[i], [
            { opacity: 0, filter: 'blur(8px)', transform: 'scale(.9)' },
            { opacity: 0, filter: 'blur(8px)', transform: 'scale(.9)', offset: 0.3 },
            { opacity: 1, filter: 'blur(0)', transform: 'none' },
          ], { duration: T(900), delay: T(i * 160), easing: SOFT }),
        ])));
        fronts.forEach(f => { f.pay.style.visibility = 'hidden'; f.pay.getAnimations().forEach(a => a.cancel()); });
        return {
          buttons,
          pick() {
            buttons.forEach(b => { if (!b.classList.contains('is-out')) b.disabled = false; });
            return new Promise(resolve => { waitingBuy = resolve; });
          },
          // A wrong pick: button i shakes, buzzes and is crossed out.
          wrong(i) {
            const b = buttons[i];
            Sound.wrong();
            b.classList.add('is-out');
            b.animate([
              { transform: 'none' }, { transform: 'translateX(-12px)' }, { transform: 'translateX(10px)' },
              { transform: 'translateX(-6px)' }, { transform: 'none' },
            ], { duration: 420, easing: 'ease-in-out' });
          },
          guide(i) {
            buttons[i].classList.add('is-guide');
          },
          // The right one: it squeezes, then every button dissolves back into its badge (the Selling Prices).
          async finish(i) {
            Sound.correct();
            await settle(buttons[i].animate([{ transform: 'scale(.92)' }, { transform: 'scale(1.06)', offset: 0.5 }, { transform: 'none' }], { duration: 420 }));
            await Promise.all(fronts.map((f, k) => {
              f.pay.style.visibility = '';
              return Promise.all([
                settle(buttons[k].animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducedMotion ? 1 : T(420), easing: 'ease-in', fill: 'forwards' }))
                  .then(() => buttons[k].remove()),
                popIn(f.pay),
              ]);
            }));
          },
        };
      },
      // Shop i's sale: a SOLD stamp lands on its window.
      sold(i) {
        const stamp = el('div', 'st-sold', fronts[i].display);
        stamp.textContent = 'SOLD';
        Sound.stamp();
        return reveal(stamp, [
          { opacity: 0, transform: 'scale(1.9) rotate(-8deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING });
      },
    };
  }

  // A calm backdrop over the street while a card is up (see .st-veil), put in before `before` (by default on top of
  // everything in `parent` so far: what is added after it, the card, comes over it).
  function streetVeil(parent, before = null) {
    const veil = el('div', 'st-veil');
    parent.insertBefore(veil, before);
    reveal(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: 'ease-out' });
    return {
      el: veil,
      hide: () => settle(veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 340, easing: 'ease-in', fill: 'forwards' })).then(() => veil.remove()),
    };
  }

  /**
   * The shopping game's question bar, at the top of the screen and always fully on it (in the top row, between the
   * wallet and the Back / Next buttons): a big white bar with Swifty in a round frame inside its left end (her real,
   * talking self, her face filling the frame), and beside her what she says, typed in step with her voice, one line at
   * a time, each on one line at 34 px (a line too long for that is said in two parts). While she isn't saying anything,
   * it says the question or what to do (the task), in a softer blue. One bar serves every screen that has it (see
   * game.js).
   *  sheets  Swifty's sprite sheets (see Bird)
   * toggle(on) slides it up or down; reset() takes its line down and empties the task. line(text) makes a line on it
   * (see buildLetters; its line breaks become spaces), to show(), type (as a bubble's) and hide(); task(text) sets what
   * to do and showTask() shows it. `speaker` is Swifty in the frame: talk(), idle(), point() and wave(), as for Bird
   * (her frame glows while she talks).
   */
  function questionBar(parent, { sheets }) {
    const root = el('div', 'qb', parent);
    root.setAttribute('aria-live', 'polite');
    const frame = el('div', 'qb-face', root);
    frame.setAttribute('aria-label', 'Swifty');
    const bird = new Bird(frame, sheets, { scale: 0.341 });
    bird.place(52, 137); // her face in the middle of the frame (her feet below it, out of sight)
    const box = el('div', 'qb-box', root);
    const taskEl = el('div', 'qb-task', box);
    const talking = on => root.classList.toggle('is-talking', on);
    const speaker = {
      talk() { bird.talk(); talking(true); },
      idle() { bird.idle(); talking(false); },
      point() { bird.point(); talking(false); },
      wave() { bird.wave(); talking(false); },
    };
    // Every line (and the task) is one line, at 34 px; one that would overflow the bar is set a little smaller (a safety
    // net: the game's lines are written to fit, a long one said in two parts).
    const fit = node => {
      let size = parseFloat(getComputedStyle(node).fontSize);
      while (size > 24 && node.scrollWidth > node.clientWidth + 1) {
        size -= 1;
        node.style.fontSize = px(size);
      }
    };
    return {
      el: root,
      speaker,
      toggle(on) {
        root.classList.toggle('is-up', on);
        if (!on) speaker.idle();
      },
      reset() {
        box.querySelectorAll('.qb-line').forEach(n => n.remove());
        taskEl.textContent = '';
        taskEl.classList.remove('is-hidden');
        speaker.idle();
      },
      task(text) {
        taskEl.textContent = text;
        taskEl.style.fontSize = '';
        fit(taskEl);
      },
      showTask() {
        taskEl.classList.remove('is-hidden');
      },
      line(text) {
        const segs = (typeof text === 'string' ? [{ t: text }] : text).map(seg => Object.assign({}, seg, { t: seg.t.replace(/\s*\n\s*/g, ' ') }));
        const node = el('div', 'qb-line', box);
        const letters = buildLetters(node, segs);
        fit(node);
        node.style.opacity = '0';
        return Object.assign(lineMethods(node, letters, { text: segs, voice: 'bird' }), {
          show() {
            taskEl.classList.add('is-hidden');
            return reveal(node, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
          },
          hide() {
            return settle(node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' })).then(() => node.remove());
          },
        });
      },
    };
  }

  // Answer buttons for the shopping game (no letters: the shops are already A, B and C). A wrong pick shakes, turns
  // red and is crossed out; the right one turns green with a tick. pick() resolves with the index of the next one
  // picked; guide(i) makes button i glow (the one to pick).
  function answerButtons(host, labels, right, cls = '') {
    const buttons = labels.map((label, i) => {
      const b = el('button', classes('q-opt pq-opt gm-opt', cls), host);
      b.type = 'button';
      b.disabled = true;
      b.setAttribute('aria-label', label.replace(/\n/g, ' '));
      el('span', 'q-label', b).textContent = label;
      el('span', 'gm-mark', b);
      return b;
    });
    let waiting = null;
    buttons.forEach((b, i) => b.addEventListener('click', () => {
      if (!waiting || b.disabled) return;
      const resolve = waiting;
      waiting = null;
      if (i === right) {
        buttons.forEach(o => { o.disabled = true; o.classList.remove('is-guide'); });
        b.classList.add('is-correct');
        b.querySelector('.gm-mark').innerHTML = ICON_CHECK;
        Sound.correct();
      } else {
        buttons.forEach(o => { o.disabled = true; }); // until the next pick (Swifty helps first)
        b.classList.add('is-wrong');
        b.querySelector('.gm-mark').innerHTML = ICON_CROSS;
        Sound.wrong();
        setTimeout(() => { b.classList.remove('is-wrong'); b.classList.add('is-out'); }, 700);
      }
      resolve(i);
    }));
    return {
      buttons,
      // Waits for a pick; resolves with its index (the buttons still in play are enabled meanwhile).
      pick() {
        buttons.forEach(b => { if (!b.classList.contains('is-out') && !b.classList.contains('is-wrong')) b.disabled = false; });
        return new Promise(resolve => { waiting = resolve; });
      },
      guide(i) {
        buttons[i].classList.add('is-guide');
      },
    };
  }

  /**
   * One shop's offer, checked: a big card over the street with the shop's name on its coloured band; on the left the
   * item in a frame with its marked price and the offer; on the right "How much will you pay?" on a purple strip, and
   * under it three answers (answerButtons: pick() resolves with the next one picked, guide(i)). The question is only
   * here (the question bar steps away meanwhile). Once the right one is picked, the answers make way for the working,
   * written line by line under the question (line(i)), and the Selling Price is stamped under it (result(): SP = ₹1,440).
   *  name, tone   as the shop's;  item, icon  the item;  price  '₹1,600';  off  ['10%', 'OFF']
   *  options  ['₹1,590', '₹1,440', '₹160'];  right  the right one's index;  pay  '₹1,440'
   *  work     the working, a line each: { left, right } (written left = right) or { text } (a plain line)
   *  art      the street's sheet (its tags, and the green badge for the Selling Price)
   */
  function offerCard(parent, { name, tone, item, icon, price, off, options, right, work, pay, art }) {
    const root = el('div', 'oc', parent);
    const card = el('div', `oc-card oc-card--${tone}`, root);
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `${name}: ${item}, marked price ${price}, offer ${off.join(' ')}. How much will you pay?`);
    const band = el('div', 'oc-band', card);
    el('span', 'oc-shop', band).textContent = name;
    const body = el('div', 'oc-body', card);
    const side = el('div', 'oc-side', body);
    const frame = el('div', 'oc-frame', side);
    picture('oc-pic', icon, frame);
    const tags = el('div', 'oc-tags', side);
    const markedTag = priceTag(tags, art, price);
    const offTag = offerTag(tags, art, off);
    const main = el('div', 'oc-main', body);
    const question = el('div', 'oc-question', main);
    question.textContent = 'How much will you pay?';
    const answers = el('div', 'oc-answers', main);
    const buttons = answerButtons(answers, options, right);
    const sheet = el('div', 'oc-work', main);
    const lines = work.map(w => {
      const line = el('div', w.text ? 'oc-line oc-line--text' : 'oc-line', sheet);
      if (w.text) {
        el('span', 'oc-text', line).textContent = w.text;
      } else {
        el('span', 'oc-left', line).textContent = w.left;
        el('span', 'oc-eq', line).textContent = '=';
        el('span', 'oc-right', line).textContent = w.right;
      }
      line.style.opacity = '0';
      return line;
    });
    const { el: result, words: paid } = artLabel(main, 'oc-result', art.pill);
    el('span', 'oc-result-label', paid).textContent = 'SP =';
    el('span', 'oc-result-value', paid).textContent = pay;
    [card, question, sheet, result, ...buttons.buttons].forEach(n => { n.style.opacity = '0'; });
    sheet.style.display = 'none';
    result.style.display = 'none';
    const SPRING = 'cubic-bezier(.2,.8,.3,1)';

    return {
      el: root,
      card,
      priceTag: markedTag,
      offTag,
      buttons: buttons.buttons,
      pick: buttons.pick,
      guide: buttons.guide,
      // The card springs up out of the shop at `from` (a stage point), then the question drops in and the answers come in.
      async open(ctx, from) {
        if (from) card.style.transformOrigin = `${num(from[0] - card.offsetLeft)}px ${num(from[1] - card.offsetTop)}px`;
        Sound.whoosh();
        await reveal(card, [
          { opacity: 0, transform: 'scale(.2)' },
          { opacity: 1, transform: 'scale(1.03)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING });
        Sound.bloop();
        await reveal(question, [{ opacity: 0, transform: 'translateY(-24px)' }, { opacity: 1, transform: 'none' }], { duration: T(380), easing: SPRING });
        for (const b of buttons.buttons) {
          reveal(b, [
            { opacity: 0, transform: 'translateX(60px)' },
            { opacity: 1, transform: 'translateX(-6px)', offset: 0.7 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(440), easing: SPRING });
          Sound.bloop();
          await ctx.wait(120);
        }
        await ctx.wait(250);
      },
      ping(node) {
        replay(node, 'is-ping');
      },
      // The answers make way for the working (its sheet comes in with its first line).
      async toWork(ctx) {
        await ctx.wait(500);
        await settle(answers.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 260, fill: 'forwards' }));
        answers.style.display = 'none';
        sheet.style.display = '';
      },
      // Line i of the working is written in.
      line(i) {
        sheet.style.opacity = '';
        Sound.scribble();
        return reveal(lines[i], [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
          duration: T(560), easing: 'cubic-bezier(.3,.1,.3,1)',
        });
      },
      // The Selling Price is stamped under the working: SP = ₹1,440.
      result() {
        result.style.display = '';
        Sound.stamp();
        return reveal(result, [
          { opacity: 0, transform: 'scale(1.8) rotate(-6deg)' },
          { opacity: 1, transform: 'scale(.95) rotate(3deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING });
      },
      // The card shrinks back into the shop at `to` (a stage point) and is removed.
      close(to) {
        if (to) card.style.transformOrigin = `${num(to[0] - card.offsetLeft)}px ${num(to[1] - card.offsetTop)}px`;
        return settle(card.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.2)' }], {
          duration: T(380), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards',
        })).then(() => root.remove());
      },
    };
  }

  // A picture (or a copy of `node`) flies in an arc from one stage rectangle to another, shrinking or growing to fit,
  // and is removed when it lands (see flyAcross for text). { src } flies that picture instead of a copy of `node`.
  function flyPicture(layer, src, from, to, { ms = 900, lift = 160 } = {}) {
    const img = picture('fly-pic', src, layer);
    Object.assign(img.style, { left: px(from.left), top: px(from.top), width: px(from.width), height: px(from.height) });
    if (reducedMotion) {
      img.remove();
      return Promise.resolve();
    }
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const k = Math.min(to.width / from.width, to.height / from.height);
    return settle(img.animate([
      { transform: 'none', offset: 0 },
      { transform: `translate(${num(dx * 0.5)}px, ${num(dy * 0.5 - lift)}px) scale(${num((1 + k) / 2 * 1.15)})`, offset: 0.5 },
      { transform: `translate(${num(dx)}px, ${num(dy)}px) scale(${num(k)})`, offset: 1 },
    ], { duration: ms, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' })).then(() => img.remove());
  }

  /**
   * "Uniform purchased!": a slip in the middle of the street with the item, and the wallet's sum under it:
   * ₹5,000 − ₹1,300 = ₹3,700 left.
   */
  function purchaseSlip(parent, { icon, title, from, cost, left }) {
    const root = el('div', 'oc', parent);
    const slip = el('div', 'ps-slip', root);
    slip.setAttribute('role', 'status');
    slip.setAttribute('aria-label', `${title} ${rupees(from)} − ${rupees(cost)} = ${rupees(left)} left`);
    picture('ps-pic', icon, slip);
    el('div', 'ps-title', slip).textContent = title;
    const sum = el('div', 'ps-sum', slip);
    el('span', 'ps-from', sum).textContent = rupees(from);
    el('span', 'ps-op', sum).textContent = '−';
    el('span', 'ps-cost', sum).textContent = rupees(cost);
    el('span', 'ps-op', sum).textContent = '=';
    const leftEl = el('span', 'ps-left', sum);
    leftEl.textContent = rupees(left);
    el('span', 'ps-word', sum).textContent = 'left';
    slip.style.opacity = '0';
    leftEl.style.opacity = '0';
    const SPRING = 'cubic-bezier(.2,.8,.3,1)';
    return {
      el: root,
      async show(ctx) {
        Sound.chime();
        await reveal(slip, [
          { opacity: 0, transform: 'translateY(60px) scale(.7)' },
          { opacity: 1, transform: 'translateY(-6px) scale(1.03)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING });
        await ctx.wait(500);
        Sound.kaching();
        await reveal(leftEl, [
          { opacity: 0, transform: 'scale(1.8) rotate(-8deg)' },
          { opacity: 1, transform: 'scale(.95)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(520), easing: SPRING });
      },
      hide() {
        return settle(slip.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.9)' }], { duration: 300, fill: 'forwards' })).then(() => root.remove());
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

  // ---------- the end of the shopping game ----------

  const SPRING_EASE = 'cubic-bezier(.2,.8,.3,1)';
  const dropIn = (node, ms = 640) => reveal(node, [
    { opacity: 0, transform: 'translateY(-90px) scale(.8) rotate(-3deg)' },
    { opacity: 1, transform: 'translateY(10px) scale(1.03) rotate(1deg)', offset: 0.62 },
    { opacity: 1, transform: 'none' },
  ], { duration: T(ms), easing: SPRING_EASE });
  const popUp = (node, ms = 480) => reveal(node, [
    { opacity: 0, transform: 'scale(.4)' },
    { opacity: 1, transform: 'scale(1.1)', offset: 0.6 },
    { opacity: 1, transform: 'none' },
  ], { duration: T(ms), easing: SPRING_EASE });
  const riseIn = (node, ms = 480) => reveal(node, [
    { opacity: 0, transform: 'translateY(28px)' },
    { opacity: 1, transform: 'none' },
  ], { duration: T(ms), easing: SPRING_EASE });

  // A big banner (the end of the game): its words in gold on blue (or green).
  function banner(host, text, tone = 'blue') {
    const b = el('div', `cl-banner cl-banner--${tone}`, host);
    el('div', 'cl-title', b).textContent = text;
    return b;
  }

  /**
   * Everything is bought (screen 52): a big banner ("SHOPPING COMPLETE!") and a line under it; on the left the wallet
   * and the shopping list (the Shopping Area's panel: the money left, and each item's line), and on the right the four
   * things bought, each on its card in its shop's colour. Reveal it with enter(ctx): the panel comes in, then line by
   * line the list is ticked as each thing pops up on its card (ticked too), and the money left pops.
   *  title, text  the banner and the line under it;  items  [{ id, name, icon, tone }];  art  { wallet, check, done };
   *  money  rupees left
   */
  function celebration(parent, { title, text, items, art, money }) {
    const root = el('div', 'cl cl--done', parent);
    const top = banner(root, title);
    const line = el('div', 'cl-text', root);
    line.textContent = text;
    const holder = el('div', 'cl-board', root); // sizes the Shopping Area's panel down to fit beside the cards
    const board = walletPanel(holder, { items, art, money, shown: false }); // its lines get ticked in enter
    const left = el('span', 'cl-board-left', board.wallet);
    left.textContent = 'left';
    const grid = el('div', 'cl-grid', root);
    const cards = items.map(item => {
      const card = el('div', `cl-card sp-card--${item.tone} cl-card--${item.id}`, grid);
      picture('cl-pic', item.icon, card);
      el('div', 'cl-name', card).textContent = item.name;
      const tick = picture('cl-tick', art.done, card);
      tick.style.opacity = '0';
      return { card, tick };
    });
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${title} ${text} ${items.map(i => i.name).join(', ')}. ${rupees(money)} left.`);
    [top, line, left, ...cards.map(c => c.card)].forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      banner: top,
      line,
      async enter(ctx) {
        Sound.whoosh();
        await dropIn(top);
        Sound.chime();
        confetti(parent, { count: 110 });
        await riseIn(line);
        await ctx.wait(150);
        // the wallet and the list come in from the left, all at once
        Sound.swish();
        [board.wallet, board.rule, board.title, ...board.rows].forEach(n => { n.style.opacity = ''; });
        await reveal(board.el, [
          { opacity: 0, transform: 'translateX(-70px)' },
          { opacity: 1, transform: 'translateX(8px)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: 'cubic-bezier(.2,.8,.3,1)' });
        await ctx.wait(250);
        // each thing on the list: its line is ticked, and it pops up on its card on the right, ticked too
        for (const [i, c] of cards.entries()) {
          board.tick(i);
          Sound.pop();
          popUp(c.card);
          await ctx.wait(220);
          popUp(c.tick, 420);
          await ctx.wait(260);
        }
        await ctx.wait(250);
        Sound.kaching();
        board.amount.animate([{ transform: 'none' }, { transform: 'scale(1.12)', offset: 0.4 }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
        await popUp(left, 420);
      },
    };
  }

  /**
   * A shop receipt: white paper with zigzag edges, a heading, and a table (a heading row, a row for each item with its
   * picture, then the total) that prints row by row. Reveal it with open() → row(i) … → total().
   *  title  e.g. "Aniket's School Shopping";  head  the columns' names
   *  rows   [{ icon, cells: ['Uniform', '₹1,600', '₹300', '₹1,300'] }];  total  ['Total', '₹5,400', '₹1,060', '₹4,340']
   */
  function receipt(parent, { title, head, rows, total }) {
    const root = el('div', 'rc', parent);
    const paper = el('div', 'rc-paper', root);
    el('div', 'rc-kind', paper).textContent = 'RECEIPT';
    el('div', 'rc-title', paper).textContent = title;
    const table = el('div', 'rc-table', paper);
    const cell = (text, cls, host = table) => Object.assign(el('div', cls, host), { textContent: text });
    const heads = head.map((h, i) => cell(h, `rc-head rc-col${i}`));
    const lines = rows.map(row => row.cells.map((c, i) => {
      if (i) return cell(c, `rc-cell rc-col${i}`);
      const first = el('div', 'rc-cell rc-col0', table);
      picture('rc-pic', row.icon, first);
      el('span', '', first).textContent = c;
      return first;
    }));
    const sums = total.map((c, i) => cell(c, `rc-cell rc-total rc-col${i}`));
    paper.setAttribute('role', 'table');
    paper.setAttribute('aria-label', `${title}. ` + [head, ...rows.map(r => r.cells), total].map(r => r.join(', ')).join('. '));
    [paper, ...heads, ...lines.flat(), ...sums].forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      paper,
      // The paper slides up, printing; the heading row is on it.
      async open() {
        Sound.whoosh();
        await reveal(paper, [
          { opacity: 0, transform: 'translateY(120px)', clipPath: 'inset(0 0 100% 0)' },
          { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0 0)' },
        ], { duration: T(700), easing: 'cubic-bezier(.3,.7,.4,1)' });
        heads.forEach(h => { h.style.opacity = ''; });
      },
      // Row i is printed (left to right).
      async row(i) {
        Sound.scribble();
        for (const c of lines[i]) {
          riseIn(c, 360);
          await new Promise(r => setTimeout(r, T(70)));
        }
        await new Promise(r => setTimeout(r, T(300)));
      },
      async total() {
        Sound.stamp();
        sums.forEach(c => popUp(c, 520));
        await new Promise(r => setTimeout(r, T(520)));
      },
      ping(i) {
        (i === 'total' ? sums : lines[i]).forEach(c => replay(c, 'is-ping'));
      },
    };
  }

  /**
   * Two amounts that must not be mixed up, side by side on two cards, each with its name, the amount, what it is and
   * the sum it comes from. Reveal it with open() → card(i) ….
   *  title  e.g. 'Two Different Amounts';  cards  [{ term, value, text, sum, tone: 'off' | 'left' }]
   */
  function twoAmounts(parent, { title, cards }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'ta-panel', root);
    const head = el('div', 'ta-title', panel);
    head.textContent = title;
    const row = el('div', 'ta-row', panel);
    const parts = cards.map((c, i) => {
      if (i) el('div', 'ta-not', row).textContent = '≠';
      const card = el('div', `ta-card ta-card--${c.tone}`, row);
      el('div', 'ta-term', card).textContent = c.term;
      const value = el('div', 'ta-value', card);
      value.textContent = c.value;
      const text = el('div', 'ta-text', card);
      text.textContent = c.text;
      const sum = el('div', 'ta-sum', card);
      sum.textContent = c.sum;
      return { card, value, text, sum };
    });
    const not = row.querySelector('.ta-not');
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${title}: ` + cards.map(c => `${c.term} ${c.value}, ${c.text} ${c.sum}`).join('; '));
    [panel, head, not, ...parts.flatMap(p => [p.card, p.value, p.text, p.sum])].filter(Boolean).forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      panel,
      values: parts.map(p => p.value),
      async open() {
        await springUp(panel);
        Sound.bloop();
        await dropIn(head, 520);
      },
      // Card i comes in: the card, its amount, what it is, its sum (the ≠ sign before the second one).
      async card(ctx, i) {
        if (i && not) {
          Sound.pop();
          popUp(not);
        }
        const p = parts[i];
        Sound.bloop();
        await riseIn(p.card, 560);
        Sound.pop();
        await popUp(p.value);
        await ctx.wait(200);
        riseIn(p.text);
        await ctx.wait(300);
        await riseIn(p.sum);
      },
      ping(i) {
        replay(parts[i].value, 'is-ping');
      },
    };
  }

  /**
   * The mission's result: a banner, the items on the list ticked, and the amounts (budget, spent, left, discount).
   *  title  'MISSION COMPLETE';  items  [{ name, icon }];  art  { done };  stats  [{ label, value, tone }]
   * Reveal it with enter(ctx).
   */
  function missionPanel(parent, { title, items, art, stats }) {
    const root = el('div', 'cl cl--wide', parent);
    const top = banner(root, title, 'green');
    const card = el('div', 'ms-card', root);
    const list = el('div', 'ms-list', card);
    const rows = items.map(item => {
      const row = el('div', 'ms-item', list);
      const tick = picture('ms-tick', art.done, row);
      picture('ms-pic', item.icon, row);
      el('span', 'ms-name', row).textContent = item.name;
      return { row, tick };
    });
    const grid = el('div', 'ms-stats', card);
    const boxes = stats.map(st => {
      const box = el('div', `ms-stat ms-stat--${st.tone}`, grid);
      el('div', 'ms-label', box).textContent = st.label;
      el('div', 'ms-value', box).textContent = st.value;
      return box;
    });
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${title}. ${items.map(i => i.name).join(', ')}. ` + stats.map(st => `${st.label}: ${st.value}`).join('. '));
    [top, card, ...rows.map(r => r.row), ...rows.map(r => r.tick), ...boxes].forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      async enter(ctx) {
        Sound.whoosh();
        await dropIn(top);
        Sound.chime();
        confetti(parent, { count: 70 });
        await springUp(card);
        for (const r of rows) {
          Sound.bloop();
          riseIn(r.row, 380);
          await ctx.wait(140);
          Sound.correct();
          popUp(r.tick, 420);
          await ctx.wait(160);
        }
        await ctx.wait(250);
        for (const box of boxes) {
          Sound.pop();
          popUp(box, 520);
          await ctx.wait(260);
        }
      },
    };
  }

  /**
   * What we learnt, on four cards (2 × 2), each with a term, what it means and/or its formula.
   *  title  e.g. 'What We Learnt';  cards  [{ term, text, formula, tone: 'mp' | 'd' | 'pct' | 'sp' }]
   * Reveal it with open() → card(i) ….
   */
  function recapCards(parent, { title, cards }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'rk-panel', root);
    const head = el('div', 'rk-title', panel);
    head.textContent = title;
    const grid = el('div', 'rk-grid', panel);
    const parts = cards.map(c => {
      const card = el('div', `rk-card rk-card--${c.tone}`, grid);
      el('div', 'rk-term', card).textContent = c.term;
      const text = c.text ? Object.assign(el('div', 'rk-text', card), { textContent: c.text }) : null;
      const formula = c.formula ? Object.assign(el('div', 'rk-formula', card), { textContent: c.formula }) : null;
      return { card, text, formula };
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${title}: ` + cards.map(c => [c.term, c.text, c.formula].filter(Boolean).join(', ')).join('; '));
    [panel, head, ...parts.flatMap(p => [p.card, p.text, p.formula])].filter(Boolean).forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      panel,
      cards: parts.map(p => p.card),
      async open() {
        await springUp(panel);
        Sound.bloop();
        await dropIn(head, 520);
      },
      // Card i comes in, then what it means, then its formula.
      async card(ctx, i) {
        const p = parts[i];
        Sound.bloop();
        await riseIn(p.card, 520);
        if (p.text) riseIn(p.text);
        if (p.formula) {
          await ctx.wait(p.text ? 350 : 0);
          Sound.scribble();
          await reveal(p.formula, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: T(560), easing: 'cubic-bezier(.3,.1,.3,1)' });
        }
      },
      ping(i) {
        replay(parts[i].card, 'is-ping');
      },
    };
  }

  /**
   * The game's lesson, shown with two offers: a bigger percentage off, and a smaller-looking offer that costs less in
   * the end (the best deal); then the takeaway on a banner.
   *  offers  [{ off: ['25%', 'OFF'], price: 'MP ₹1,600', pay: '₹1,200' }, …];  best  the cheaper one's index
   *  text    the takeaway, e.g. 'Compare the final price before you buy.'
   *  art     the street's sheet (its red tag for each offer, its yellow ribbon for the best deal)
   * Reveal it with open() → offer(i) … → best() → banner().
   */
  function takeaway(parent, { offers, best, text, art }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'tk-panel', root);
    const row = el('div', 'tk-row', panel);
    const parts = offers.map((o, i) => {
      if (i) el('div', 'tk-vs', row).textContent = 'vs';
      const card = el('div', 'tk-offer', row);
      offerTag(card, art, o.off, 'tk-off');
      el('div', 'tk-mp', card).textContent = o.price;
      const pay = el('div', 'tk-pay', card);
      el('span', 'tk-pay-label', pay).textContent = 'SP =';
      el('span', 'tk-pay-value', pay).textContent = o.pay;
      return { card, pay };
    });
    const vs = row.querySelector('.tk-vs');
    const strip = el('div', 'tk-banner', panel);
    strip.textContent = text;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', offers.map(o => `${o.off.join(' ')}, ${o.price}: Selling Price ${o.pay}`).join(' versus ') + `. ${text}`);
    [panel, vs, strip, ...parts.flatMap(p => [p.card, p.pay])].filter(Boolean).forEach(n => { n.style.opacity = '0'; });
    let stamp = null;
    return {
      el: root,
      panel,
      open: () => springUp(panel),
      async offer(ctx, i) {
        if (i && vs) {
          Sound.pop();
          popUp(vs);
        }
        Sound.bloop();
        await riseIn(parts[i].card, 520);
        await ctx.wait(250);
        Sound.pop();
        await popUp(parts[i].pay);
      },
      // The cheaper one is the best deal: it glows, and a stamp says so.
      best() {
        parts[best].card.classList.add('is-best');
        stamp = artLabel(parts[best].card, 'tk-stamp', art.ribbon, 'Best deal!').el;
        Sound.stamp();
        return reveal(stamp, [
          { opacity: 0, transform: 'scale(1.8) rotate(-7deg)' },
          { opacity: 1, transform: 'scale(.94) rotate(1deg)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: SPRING_EASE });
      },
      banner() {
        Sound.chime();
        return dropIn(strip, 700);
      },
    };
  }

  // ---------- Swifty, the bird ----------

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

  // ---------- walking sprite ----------

  /**
   * Plays a cleaned walk strip (see WALK_SHEET in game.js).
   * Frames are picked by *distance walked*, not by time: each frame stays up while the body travels
   * the stride measured from the planted foot. That keeps the feet from skating at any speed.
   * { matte: true } leaves out the reflection on the shiny mall floor (e.g. outdoors);
   * { face: -1 } mirrors him, to walk to the left.
   */
  // Aniket walking: a jointed cutout (the user, 2026-10-23: "fix his walk, his steps smooth, not ramp walk type"; the
  // eight drawn poses before held a quarter of a second each, his feet sliding between them, and two kicked a foot up
  // behind). His figure is cut into pieces (tools/make_walk_rig.py): the upper body, the hips, and a leg in three
  // (thigh, shin, shoe) that also makes the far leg, a shade darker. Every animation frame works out where his feet are
  // (each planted for 60% of a two-step cycle, rolling from the heel onto the ball, then swinging forward in a low arc),
  // how high his hips can be with the planted leg almost straight, and his knees (two-joint inverse kinematics); then
  // draws the pieces turned about their joints onto a canvas, and its reflection. He moves a cycle's length for every
  // cycle, so a planted foot stays put on the floor.
  //  rig: { src, frameW, frameH, anchorX, baselineY (where the canvas sits: as the old walk sheet's frames did),
  //         hip, knee, ankle, ground (the joints in the frame), pieces: { name: [atlas x, y, w, h, frame x, y] }, gait }
  class Walker {
    constructor(parent, rig, { matte = false, face = 1 } = {}) {
      this.rig = rig;
      this.face = face;
      this.pad = 40; // room round the frame for a foot reaching out
      this.root = el('div', matte ? 'walker walker--matte' : 'walker', parent);
      el('div', 'walker-shadow', this.root);
      this.reflection = this._canvas('walker-sprite walker-reflect');
      this.body = this._canvas('walker-sprite walker-body');
      const [hx, hy] = rig.hip;
      const [kx, ky] = rig.knee;
      const [ax, ay] = rig.ankle;
      this.L1 = Math.hypot(kx - hx, ky - hy);
      this.L2 = Math.hypot(ax - kx, ay - ky);
      this.thigh0 = Math.atan2(kx - hx, ky - hy); // each limb's angle as drawn (from straight down; + = forward)
      this.shin0 = Math.atan2(ax - kx, ay - ky);
      this._setCycle(rig.gait.cycle);
      this.x = 0;
      this.last = null;
      this.atlas = new Image();
      this.atlas.src = rig.src;
      this.atlas.decode().then(() => { if (this.last) this._draw(this.last); }, () => {});
    }

    _canvas(cls) {
      const { frameW, frameH, anchorX, baselineY } = this.rig;
      const p = this.pad;
      const c = el('canvas', cls, this.root, {
        left: px(-anchorX - p), top: px(-baselineY - p), width: px(frameW + 2 * p), height: px(frameH + 2 * p),
        transformOrigin: `${anchorX + p}px ${baselineY + p}px`,
      });
      c.width = frameW + 2 * p;
      c.height = frameH + 2 * p;
      return c;
    }

    // (x, y) = the point on the floor under him; s = his scale.
    place(x, y, s) {
      this.x = x;
      this.root.style.transform = `translate(${num(x)}px, ${num(y)}px) scale(${(s * this.face).toFixed(4)}, ${s.toFixed(4)})`;
    }

    idle(on) {
      this.root.classList.toggle('is-idle', on);
    }

    // A pose: 'idle' (standing, both feet down: how a walk starts and ends), or a point in the walk (0–1 of the cycle).
    setFrame(f) {
      if (f === 'idle') this._pose(this._stop(), 1);
      else this._pose(f || 0, 0);
    }

    // Where in the cycle he stands: the planted foot just ahead of his hips (gait.standFront).
    _stop() {
      const g = this.rig.gait;
      return (g.heelStrike - g.standFront) / this.cycle;
    }

    // How far he goes in a cycle (two steps): the gait's own, or a little more or less, so a walk is whole cycles.
    _setCycle(c) {
      this.cycle = c;
      this.hipTable = this._hips(96);
    }

    // Where a foot is at `phi` of the cycle (0 = its heel strikes): its ankle (x from the hip, y in the frame) and its
    // tilt (+ = toe up).
    _foot(phi) {
      const g = this.rig.gait;
      const [, ankleY] = this.rig.ankle;
      const ground = this.rig.ground;
      phi = ((phi % 1) + 1) % 1;
      const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
      const turn = ([x, y], a) => [x * Math.cos(a) + y * Math.sin(a), -x * Math.sin(a) + y * Math.cos(a)];
      const sole = ground - ankleY;
      if (phi < g.stance) {
        const at = g.heelStrike - phi * this.cycle; // planted: it goes back under him as he moves on
        if (phi < g.roll) { // the heel down first, the toe coming down onto the floor
          const a = g.toeUp * (1 - smooth(phi / g.roll));
          const [ox, oy] = turn([g.heel, sole], a);
          return [at + g.heel - ox, ground - oy, a];
        }
        if (phi < g.heelOff) return [at, ankleY, 0];
        const a = -g.heelUp * smooth((phi - g.heelOff) / (g.stance - g.heelOff)); // up onto the ball of the foot
        const [ox, oy] = turn([g.ball, sole], a);
        return [at + g.ball - ox, ground - oy, a];
      }
      const s = (phi - g.stance) / (1 - g.stance); // swinging forward, in a low arc
      const [x0, y0, a0] = this._foot(g.stance - 1e-6);
      const [x1, y1, a1] = this._foot(0);
      const e = 0.5 - 0.5 * Math.cos(Math.PI * s);
      return [x0 + (x1 - x0) * e, y0 + (y1 - y0) * e - g.lift * Math.sin(Math.PI * s), a0 + (a1 - a0) * smooth(s / 0.85)];
    }

    // The hips' height round the cycle: as high as the planted leg (almost straight) allows, smoothed.
    _hips(n) {
      const reach = this.L1 + this.L2 - 2.5;
      const raw = Array.from({ length: n }, (_, k) => {
        let y = 0;
        for (const d of [0, 0.5]) {
          const phi = (k / n + d) % 1;
          if (phi >= this.rig.gait.stance) continue;
          const [x, ay] = this._foot(phi);
          y = Math.max(y, ay - Math.sqrt(reach * reach - x * x));
        }
        return y;
      });
      return raw.map((_, k) => [-2, -1, 0, 1, 2].reduce((sum, j) => sum + raw[(k + j + n) % n], 0) / 5);
    }

    _hipAt(phi) {
      const t = this.hipTable;
      const f = (((phi % 1) + 1) % 1) * t.length;
      const k = Math.floor(f);
      return t[k % t.length] + (t[(k + 1) % t.length] - t[k % t.length]) * (f - k);
    }

    // The pose at `phi` of the cycle; `rest` (0–1) brings the other foot down beside the planted one, to stand, the hips
    // as low as that needs.
    _pose(phi, rest) {
      const near = this._foot(phi);
      const far = this._foot(phi + 0.5);
      let hipY = this._hipAt(phi);
      if (rest > 0) {
        const [, ankleY] = this.rig.ankle;
        far[0] += (this.rig.gait.standBack - far[0]) * rest;
        far[1] += (ankleY - far[1]) * rest;
        far[2] *= 1 - rest;
        const reach = this.L1 + this.L2 - 2.5;
        hipY += Math.max(0, ankleY - Math.sqrt(reach * reach - far[0] * far[0]) - hipY) * rest;
      }
      this._draw({ hipY, legs: [[far, false], [near, true]] });
    }

    _draw(pose) {
      this.last = pose;
      if (!this.atlas.complete || !this.atlas.naturalWidth) return;
      const r = this.rig;
      const P = r.pieces;
      const p = this.pad;
      const g = this.body.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, this.body.width, this.body.height);
      const [hx] = r.hip;
      const hip = [hx, pose.hipY];
      // a piece, turned by `angle` (+ = a limb pointing down swings forward) about its joint `at` as drawn, put at `to`
      const put = (name, at, angle, to) => {
        const [sx, sy, w, h, ox, oy] = P[name];
        g.setTransform(1, 0, 0, 1, to[0] + p, to[1] + p);
        g.rotate(-angle);
        g.drawImage(this.atlas, sx, sy, w, h, ox - at[0], oy - at[1], w, h);
      };
      // the far leg, the near leg, then the hips over both thighs' tops (round, so they never show a corner), then the
      // upper body
      for (const [[ax, ay, tilt], near] of pose.legs) {
        const ankle = [hx + ax, ay];
        const dx = ankle[0] - hip[0];
        const dy = ankle[1] - hip[1];
        const D = Math.max(Math.abs(this.L1 - this.L2) + 1, Math.min(this.L1 + this.L2 - 0.3, Math.hypot(dx, dy)));
        const bend = Math.acos(Math.max(-1, Math.min(1, (this.L1 * this.L1 + D * D - this.L2 * this.L2) / (2 * this.L1 * D))));
        const thigh = Math.atan2(dx, dy) + bend; // the knee bends forward
        const knee = [hip[0] + this.L1 * Math.sin(thigh), hip[1] + this.L1 * Math.cos(thigh)];
        const shin = Math.atan2(ankle[0] - knee[0], ankle[1] - knee[1]);
        const k = near ? '' : 'Far';
        put('shoe' + k, r.ankle, tilt, ankle);
        put('shin' + k, r.knee, shin - this.shin0, knee);
        put('thigh' + k, r.hip, thigh - this.thigh0, hip);
      }
      put('hips', r.hip, 0, hip);
      put('upper', r.hip, 0, hip);
      const m = this.reflection.getContext('2d');
      m.clearRect(0, 0, this.reflection.width, this.reflection.height);
      m.drawImage(this.body, 0, 0);
    }

    /**
     * Walk from `from` to `to` ({x, y, s}) at `speed` stage px/s, easing to a stop over `decel` px. He sets off from
     * standing and stands again at the end (the same pose: the walk is a whole number of cycles, its steps a little
     * longer or shorter to fit). Calls onStep(x) as each foot comes down.
     */
    walk(ctx, { from, to, speed = 280, decel = 220, onStep }) {
      const g = this.rig.gait;
      const D = Math.hypot(to.x - from.x, to.y - from.y);
      const slow = Math.min(decel, D * 0.45);
      const cruiseT = (D - slow) / speed;
      const slowT = (2 * slow) / speed;
      const totalT = cruiseT + slowT;
      const ds = to.s - from.s;
      // his own (sprite px) distance after a fraction u of the way (his scale changes on the way)
      const travel = u => (Math.abs(ds) < 1e-6 ? (u * D) / from.s : (D * Math.log((from.s + ds * u) / from.s)) / ds);
      const all = travel(1);
      this._setCycle(all / Math.max(1, Math.round(all / g.cycle)));
      const stop = this._stop();
      const liftTo = Math.min(0.4, (0.3 * this.cycle) / all); // setting off: the passing foot lifts…
      const restFrom = Math.max(liftTo, 1 - (slow * 0.6) / D); // …and at the end of the slowing down it comes down
      let half = null;
      let t0 = null;
      return new Promise((resolve, reject) => {
        const tick = time => {
          if (!ctx.alive()) return reject(CANCELLED);
          if (t0 === null) t0 = time;
          const t = (time - t0) / 1000;
          let d;
          if (t < cruiseT) d = speed * t;
          else if (t < totalT) {
            const tau = t - cruiseT;
            d = D - slow + speed * tau - (speed * tau * tau) / (2 * slowT);
          } else d = D;
          const u = Math.min(1, d / D);
          this.place(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u, from.s + ds * u);
          const phi = stop + travel(u) / this.cycle;
          const k = Math.floor(phi * 2);
          if (half !== null && k !== half && onStep) onStep(this.x); // a foot comes down
          half = k;
          const rest = u < liftTo ? 1 - u / liftTo : u <= restFrom ? 0 : (u - restFrom) / (1 - restFrom);
          this._pose(phi, rest * rest * (3 - 2 * rest));
          if (t >= totalT) {
            this._pose(stop, 1);
            resolve();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
  }

  window.FX = {
    CANCELLED, el, fracText, rand, settle, reveal, flyAcross, glow, motes, twinkles, burst, shine, exclaim, bubble, thought, badge, ring, question, definitions, pricePanel,
    reduction, definitionCard, checkpoint, formulaNote, concept, barModel, grid100, formulaPanel, formulaReveal, summaryPanel, productCard, productQuestion, meansPanel, workedSheet, summarySheet, strike, stickTag, choices, percentFormula, questionPanel, challengePanel, walletPanel, shopPicker, street, streetVeil, questionBar, offerCard, flyPicture, purchaseSlip, confetti, celebration, receipt, twoAmounts, missionPanel, recapCards, takeaway, Bird, Walker,
    setPace(p) { pace = p; },
  };
})();
