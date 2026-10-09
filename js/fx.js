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

  // The hand-made ("paper") look's filters, used from the CSS (filter: url(#…)):
  //  #paper-cut     an edge cut by hand with scissors: a gentle wobble
  //  #paper-deckle  a big sheet's deckled edge: a finer, rougher wobble
  //  #ink-brush     a line drawn with a brush pen: a slight wobble, and heavier on its lower-right side
  //                 (the dark parts are copied a little down and to the right, under the original)
  function inkDefs() {
    if (document.getElementById('ink-defs')) return;
    const holder = el('div', '', document.body);
    holder.id = 'ink-defs';
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = `<svg width="0" height="0" focusable="false"><defs>
  <filter id="paper-cut" x="-4%" y="-8%" width="108%" height="116%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="paper-deckle" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="9" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="ink-brush" x="-6%" y="-10%" width="112%" height="120%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="2" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="wob"/>
    <feColorMatrix in="wob" type="matrix" values="0 0 0 0 .18  0 0 0 0 .16  0 0 0 0 .14  -.5 -.5 -.5 1 0" result="ink"/>
    <feOffset in="ink" dx="2" dy="2.4" result="heavy"/>
    <feMerge><feMergeNode in="heavy"/><feMergeNode in="wob"/></feMerge>
  </filter>
</defs></svg>`;
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

  // ---------- comic speech bubble ----------

  // Rounded rectangle whose straight edges bulge outward by `b` px: a soft comic balloon.
  // A speech balloon's body: a rounded rectangle, w × h, with round corners of radius r that run on smoothly
  // into its straight sides.
  function balloonPath(w, h, r) {
    return [
      `M ${r} 0`, `H ${w - r}`, `A ${r} ${r} 0 0 1 ${w} ${r}`, `V ${h - r}`, `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
      `H ${r}`, `A ${r} ${r} 0 0 1 0 ${h - r}`, `V ${r}`, `A ${r} ${r} 0 0 1 ${r} 0`, 'Z',
    ].join(' ');
  }

  // A smooth line through points (Catmull-Rom, as cubic curves), continuing a path.
  function smoothThrough(pts) {
    const f = p => `${num(p[0])} ${num(p[1])}`;
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C ${f([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f(p2)}`;
    }
    return d;
  }

  // A speech balloon's tail, to the tip `tip` (in the balloon's own px), from whichever edge faces it best (the
  // bottom or top edge are preferred): a smooth horn whose middle leaves the edge straight out and curves on to
  // the tip, widest where it flares into the body (so the outline runs on without a hard corner), tapering to a
  // point. `lean`: how far along the edge, back towards the middle, it starts; `bend` curves it sideways.
  function tailPath(w, h, r, [tx, ty], { half = 17, lean = 40, bend = 0 } = {}) {
    const flare = half * 0.75;
    const room = half + flare + 4; // how far from a corner it can start
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), v));
    const toward = (v, mid) => (v < mid ? 1 : -1);
    const edges = [];
    if (ty > h - r) edges.push({ B: [clamp(tx + lean * toward(tx, w / 2), r + room, w - r - room), h], n: [0, 1], k: 1 });
    if (ty < r) edges.push({ B: [clamp(tx + lean * toward(tx, w / 2), r + room, w - r - room), 0], n: [0, -1], k: 1 });
    // a side, only for a speaker beside the balloon (not below or above it), and with a straight stretch long
    // enough for a tail
    const beside = h - 2 * (r + room) >= 0 && ty > -30 && ty < h + 30;
    if (tx < 0 && beside) edges.push({ B: [0, clamp(ty + lean * 0.5 * toward(ty, h / 2), r + room, h - r - room)], n: [-1, 0], k: 0.85 });
    if (tx > w && beside) edges.push({ B: [w, clamp(ty + lean * 0.5 * toward(ty, h / 2), r + room, h - r - room)], n: [1, 0], k: 0.85 });
    if (!edges.length) edges.push({ B: [clamp(tx, r + room, w - r - room), h], n: [0, 1], k: 1 });
    const facing = e => {
      const dx = tx - e.B[0], dy = ty - e.B[1];
      return ((dx * e.n[0] + dy * e.n[1]) / (Math.hypot(dx, dy) || 1)) * e.k;
    };
    const { B, n } = edges.reduce((best, e) => (facing(e) > facing(best) ? e : best));
    const L = Math.hypot(tx - B[0], ty - B[1]) || 1;
    const side = [-(ty - B[1]) / L, (tx - B[0]) / L];
    // the middle line: a quadratic curve from B (leaving the edge straight out) to the tip
    const C = [0, 1].map(i => B[i] + n[i] * L * 0.42 + ([tx, ty][i] - B[i]) * 0.18 + side[i] * bend);
    const at = s => [0, 1].map(i => (1 - s) * (1 - s) * B[i] + 2 * (1 - s) * s * C[i] + s * s * [tx, ty][i]);
    const dir = s => {
      const d = [0, 1].map(i => 2 * (1 - s) * (C[i] - B[i]) + 2 * s * ([tx, ty][i] - C[i]));
      const l = Math.hypot(d[0], d[1]) || 1;
      return [d[0] / l, d[1] / l];
    };
    const width = s => half * Math.pow(1 - s, 1.05) + flare * Math.pow(1 - s, 7);
    const left = [];
    const right = [];
    for (let i = 0; i <= 28; i++) {
      const s = i / 28;
      const m = at(s);
      const d = dir(s);
      const wv = width(s);
      left.push([m[0] - d[1] * wv, m[1] + d[0] * wv]);
      right.push([m[0] + d[1] * wv, m[1] - d[0] * wv]);
    }
    right.reverse();
    const f = p => `${num(p[0])} ${num(p[1])}`;
    const inside = p => [p[0] - n[0] * 10, p[1] - n[1] * 10]; // its base reaches into the body: no gap
    return `M ${f(inside(left[0]))} L ${f(left[0])}${smoothThrough(left)}${smoothThrough(right)} L ${f(inside(right[right.length - 1]))} Z`;
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
        line.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
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
  function lineText(host, o) {
    const box = el('div', 'b-text', host, { fontSize: px(o.size || 34) });
    const letters = buildLetters(box, o.text);
    const h = box.offsetHeight;
    const w = Math.max(box.offsetWidth, h + 24);
    box.style.width = px(w);
    return { box, letters, w, h };
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
      async type(ctx, { speed = 46, blips = true, part } = {}) {
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
        root.querySelectorAll('.em, .key').forEach(e => e.classList.add('pulse'));
      },
    };
  }

  // Outline + fill trick: stroke every shape, then fill them all on top so the seams disappear.
  // A soft, flat shadow under the shapes; their outline (every shape stroked, then all filled on top, so the
  // seams where they overlap disappear); and a fill that turns from white at the top to a warm cream at the
  // bottom (`height`: where the bottom is; the colours are set in the CSS: .b-stop-…).
  let paintId = 0;
  function paintShapes(art, paths, { shadow = [0, 8], height } = {}) {
    const id = 'bfill' + (++paintId);
    const box = art.viewBox.baseVal;
    const grad = svg('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: height || (box && box.height) || 100 }, svg('defs', {}, art));
    [['b-stop-top', 0], ['b-stop-mid', 0.62], ['b-stop-bottom', 1]].forEach(([cls, offset]) => svg('stop', { class: cls, offset }, grad));
    art.style.setProperty('--b-fill', `url(#${id})`);
    [['b-shadow', { transform: `translate(${shadow[0]} ${shadow[1]})` }], ['b-line', {}], ['b-fill', {}]].forEach(([cls, extra]) => {
      const g = svg('g', Object.assign({ class: cls }, extra), art);
      paths.forEach(d => svg('path', { d }, g));
    });
  }

  /**
   * Comic speech bubble, sized to fit its text.
   *  anchor   [x, y] stage point where one corner (or edge middle) of the balloon sits
   *  corner   which point that is: 'bl' (default) | 'br' | 'tl' | 'tr' | 'bc' | 'tc' (c = centred)
   *  within   optional [minX, maxX] the balloon must stay inside
   *  tip      [x, y] stage point the tail points at (the speaker's mouth, or what a note is about)
   *  lean     how far along the edge the tail starts from the speaker (default 70; small = more upright)
   *  tone     optional colour: 'yellow' (a note)
   *  text     see buildLetters; size (px, default 34), voice ('boy' | 'man' | 'bird'), rotate (deg)
   */
  function bubble(parent, o) {
    const root = el('div', o.tone ? `bubble bubble--${o.tone}` : 'bubble', parent);
    const float = el('div', 'bubble-float', root);
    const { box: textBox, letters, w, h } = lineText(float, o);
    const corner = o.corner || 'bl';
    let x = { r: o.anchor[0] - w, c: o.anchor[0] - w / 2 }[corner[1]] ?? o.anchor[0];
    if (o.within) x = Math.max(o.within[0], Math.min(o.within[1] - w, x));
    const y = corner[0] === 'b' ? o.anchor[1] - h : o.anchor[1];
    const tip = [o.tip[0] - x, o.tip[1] - y];
    Object.assign(root.style, {
      left: px(x), top: px(y), width: px(w), height: px(h),
      transformOrigin: `${num(tip[0])}px ${num(tip[1])}px`, // grows out of the speaker's mouth
    });

    // A rounded body, and a tail that sweeps out from the edge facing the speaker to the tip.
    const r = Math.min(40, h / 2);
    const body = balloonPath(w, h, r);
    const tail = tailPath(w, h, r, tip, { half: o.tailWidth || 17, lean: o.lean ?? 40, bend: o.bend || 0 });
    const art = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    float.insertBefore(art, textBox);
    paintShapes(art, [body, tail]);
    const rot = 0; // it sits straight, so its words are crisp (it only tilts a little as it pops up)

    return Object.assign(lineMethods(root, letters, o), {
      show() {
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
   *  text  see buildLetters; size (px, default 34), voice ('boy' | 'man' | 'bird')
   */
  function thought(parent, o) {
    const root = el('div', 'bubble thought', parent);
    const cloud = el('div', 'thought-cloud', root);
    const float = el('div', 'bubble-float', cloud);
    const { box, letters, w, h } = lineText(float, o);
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
      paintShapes(svg('svg', { width: 2 * pr, height: 2 * pr, viewBox: `0 0 ${2 * pr} ${2 * pr}` }, bob), [ellipsePath(pr, pr, pr, pr)], { shadow: [0, 4] });
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
  function question(parent, { lines, options, onAnswer }) {
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
      // Shrinks the card out of the way while a bigger panel is up.
      hide() {
        return settle(card.animate([
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(40px) scale(.86)' },
        ], { duration: reducedMotion ? 1 : T(360), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
      },
      // Turns the card over to show the result, e.g. "Correct!" and why.
      async flip({ title, text }) {
        const back = el('div', 'qcard-back', card);
        back.setAttribute('role', 'status');
        const head = el('div', 'qback-head', back);
        const tick = el('span', 'qback-tick', head);
        tick.innerHTML = ICON_CHECK;
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
        setTimeout(() => Sound.ding(), T(380));
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
        settle(card.animate([
          { transform: 'translateX(135%) rotate(9deg)' },
          { transform: 'translateX(-5%) rotate(-2.5deg)', offset: 0.62 },
          { transform: 'translateX(1.5%) rotate(.8deg)', offset: 0.82 },
          { transform: 'translateX(0) rotate(0deg)' },
        ], { duration: T(950), easing: 'cubic-bezier(.22,.9,.28,1)' }));

        await ctx.wait(300); // its words come in as it arrives (it is never empty)
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
          { opacity: 1, transform: 'rotate(-2deg)' },
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
   * returns is waited for); onMarked as each highlighted phrase is complete.
   */
  async function revealDefinition(ctx, { card, head, words }, { onRead, onMarked } = {}) {
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
    await ctx.wait(800);
    for (const word of words) {
      word.classList.add('on');
      const hl = word.closest('.hl');
      if (hl) {
        const inside = hl.querySelectorAll('.w');
        if (word === inside[inside.length - 1]) { // the whole highlighted phrase is out: swipe it
          hl.classList.add('is-marked');
          if (onMarked) onMarked();
        }
      }
      await ctx.wait(/[.,]$/.test(word.textContent) ? 420 : 230);
    }
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
  // A down arrow drawn with a thick blue marker (on the full-screen panel): a slightly wobbly line and its head.
  const MARKER_ARROW = '<svg class="cmp-arrow is-marker" viewBox="0 0 72 126" aria-hidden="true"><path d="M37 9C33 36 40 62 36 101M17 80C25 89 31 97 36 107C41 97 47 88 56 79"/></svg>';
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
   */
  function pricePanel(parent, { price, term, abbr, definition, compare, sheet = false }) {
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
      mid.innerHTML = sheet ? MARKER_ARROW : downArrow();
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
        const s = local(sticker);
        Sound.sparkle();
        ringed = ring(panel, { x: (s.l + s.r) / 2, y: (s.t + s.b) / 2, r: Math.max(s.r - s.l, s.b - s.t) * 0.72 });
        return ringed;
      },
      // A line draws itself from the sticker to the lens, then the lens pops open showing the price big.
      async zoom() {
        const lens = parts.lens;
        const s = local(sticker);
        const z = local(lens);
        const r = (z.r - z.l) / 2;
        const zc = [(z.l + z.r) / 2, (z.t + z.b) / 2];
        const a = [s.r + 18, (s.t + s.b) / 2];
        const dir = Math.atan2(a[1] - zc[1], a[0] - zc[0]);
        const b = [zc[0] + Math.cos(dir) * (r + 14), zc[1] + Math.sin(dir) * (r + 14)];
        const c = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 24]; // a gentle sag
        const line = svg('svg', { class: 'mp-link', width: panel.clientWidth, height: panel.clientHeight }, panel);
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
   * the operators between them (ops, e.g. ['−', '=']).
   * Reveal it with open() → showBook() → highlight() → box(0, { empty: true }) → fly() → op(0) → box(1) → …
   * ping(node) makes a box or operator pop with a ring (for reading the formula out); glow(i) keeps a box glowing.
   */
  function formulaPanel(parent, { price, terms, ops }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', 'fm-panel', root);
    const bookBox = el('div', 'fm-book', panel);
    bookBox.innerHTML = bookArt(price);
    const sticker = bookBox.querySelector('.mp-sticker-card');
    const row = el('div', 'fm-row', panel);
    const boxes = [];
    const values = [];
    const opEls = [];
    terms.forEach((term, i) => {
      if (i) {
        const op = el('div', 'fm-op', row);
        op.textContent = ops[i - 1];
        opEls.push(op);
      }
      const box = el('div', `cmp-box cmp-box--${term.tone} fm-box`, row);
      el('div', 'cmp-label', box).textContent = term.label;
      const value = el('div', 'cmp-price', box);
      value.textContent = term.value;
      boxes.push(box);
      values.push(value);
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
   * ping(node) makes a part pop. `foot` is the empty space at the bottom (for a note and a character).
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
      const card = el('div', `sm-card sm-card--${c.tone}`, row);
      el('div', `sm-head tone-${c.tone}`, card).textContent = c.term;
      const value = el('div', `sm-value tone-${c.tone}`, card);
      value.textContent = c.value;
      const desc = el('div', 'sm-desc', card);
      desc.textContent = c.desc;
      return { card, value, desc };
    });
    const sum = el('div', 'sm-formula', panel);
    formula.forEach(seg => {
      el('span', seg.tone ? `tone-${seg.tone}` : 'sm-op', sum).textContent = seg.t;
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${title} ` + cards.map(c => `${c.term}, ${c.value}: ${c.desc.replace(/\n/g, ' ')}`).join(' ') +
      ' ' + formula.map(seg => seg.t).join(' '));
    [panel, head, sum, ...arrows, ...parts.flatMap(p => [p.card, p.value, p.desc])].forEach(n => { n.style.opacity = '0'; });
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
        Sound.pop();
        reveal(value, [
          { opacity: 0, transform: 'scale(.5)' },
          { opacity: 1, transform: 'scale(1.12)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(480), easing: 'cubic-bezier(.2,.8,.3,1)' });
        await ctx.wait(300);
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

  // The photo of an item and, under it, its price tag and its discount tag (like the tags on the shop's stand),
  // built in `host`. showPhoto(), showPrice() and showOff() (it lands like a stamp, then a gold frame glows around
  // it) reveal them; `percent` is the discount tag's first line (e.g. "30%").
  function productParts(host, { photo, price, off }) {
    const pic = el('div', 'pc-photo', host);
    const img = el('img', '', pic);
    img.src = photo;
    img.alt = '';
    img.draggable = false;
    const tags = el('div', 'pc-tags', host);
    const priceTag = el('div', 'pc-price', tags);
    priceTag.textContent = price;
    const offPos = el('div', 'pc-off-pos', tags); // tilted like the tag on the stand; its gold frame turns with it
    const offTag = el('div', 'pc-off', offPos);
    const lines = off.map(t => Object.assign(el('span', 'pc-off-line', offTag), { textContent: t }));
    [pic, priceTag, offTag].forEach(n => { n.style.opacity = '0'; });
    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    return {
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
      showPrice() {
        Sound.pop();
        return reveal(priceTag, [
          { opacity: 0, transform: 'scale(.3) rotate(-6deg)' },
          { opacity: 1, transform: 'scale(1.1) rotate(2deg)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: EASE });
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
   * A photo of an item with its price tag and its discount tag under it, like the tags on the shop's stand.
   *  photo  the picture of the item;  price  e.g. '₹1800';  off  the discount tag's lines, e.g. ['30%', 'OFF']
   * Reveal it with open() → showPhoto() → showPrice() → showOff() (lands like a stamp, then a gold frame
   * glows around it). ping(node) makes a tag, or the discount tag's first line (`percent`), pop while it is
   * talked about.
   */
  function productCard(parent, { photo, price, off }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'pc-panel', root);
    const item = productParts(panel, { photo, price, off });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${price}, ${off.join(' ')}`);
    panel.style.opacity = '0';
    return {
      el: root,
      panel,
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
   *  question  the question (\n starts a new line); photo, price, off as for productCard
   * Reveal it with open() → showItem(ctx) → showQuestion(); ping(node) pops a tag (priceTag, offTag, percent).
   */
  function productQuestion(parent, { photo, price, off, question }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'pqp-panel', root);
    const item = productParts(el('div', 'pqp-item', panel), { photo, price, off });
    const side = el('div', 'pqp-side', panel);
    const strip = el('div', 'pqp-question', side);
    strip.textContent = question;
    const below = el('div', 'pqp-answers', side);
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${price}, ${off.join(' ')}. ${question.replace(/\n/g, ' ')}`);
    [panel, strip].forEach(n => { n.style.opacity = '0'; });
    return {
      el: root,
      panel,
      below,
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
   *  options  [{ label, correct }];  onAnswer(correct, button, i) is called for the first pick only: then every
   *           button locks (there is no second try), the picked one turning green ✓ or red ✗.
   * enter(ctx) brings them in one by one, then enables them; show(i) lights up the right answer (after a
   * wrong pick); ping(i) makes a button pop.
   */
  function choices(parent, { options, onAnswer, stack = false }) {
    const row = el('div', stack ? 'pq-choices pq-choices--stack' : 'pq-choices', parent);
    let answered = false;
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
        answered = true;
        buttons.forEach(other => {
          other.disabled = true;
          if (other !== b) other.classList.add('is-dim');
        });
        b.classList.add(opt.correct ? 'is-correct' : 'is-wrong');
        chip.innerHTML = opt.correct ? ICON_CHECK : ICON_CROSS;
        if (opt.correct) Sound.correct();
        else Sound.wrong();
        if (onAnswer) onAnswer(!!opt.correct, b, i);
      });
      b.style.opacity = '0';
      return b;
    });

    return {
      el: row,
      buttons,
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
        if (!answered) buttons.forEach(b => { b.disabled = false; });
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

  // ---------- pairs panel (Part ↔ Percentage, Whole ↔ 100%) ----------

  // A double-headed arrow, ↔ (drawn from left to right).
  const BOTH_WAYS = '<svg class="pp-arrow" viewBox="0 0 110 60" aria-hidden="true"><path pathLength="1" d="M10 30 H 100 M 26 16 L 10 30 L 26 44 M 84 16 L 100 30 L 84 44"/></svg>';

  /**
   * Pairs of things that go together, one pair per row, a double-headed arrow between them.
   *  rows  [{ left: { text, tone }, right: { text, tone } }]; tones: 'part' (blue), 'whole' (mint), 'pct' (yellow)
   * Reveal it with open() → row(0) → row(1) … (each: the left box, the arrow drawing itself, the right box).
   * ping(r, c) pops one box (c: 0 left, 1 right); pingRow(r) pops a whole pair, arrow and all.
   */
  function pairsPanel(parent, { rows }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'pp-panel', root);
    const pairs = rows.map(row => {
      const box = side => {
        const b = el('div', `pp-box pp-box--${side.tone}`, panel);
        el('span', 'pp-text', b).textContent = side.text;
        b.style.opacity = '0';
        return b;
      };
      const left = box(row.left);
      panel.insertAdjacentHTML('beforeend', BOTH_WAYS);
      const arrow = panel.lastElementChild;
      arrow.style.opacity = '0';
      return { boxes: [left, box(row.right)], arrow };
    });
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', rows.map(r => `${r.left.text} goes with ${r.right.text}`).join('; '));
    panel.style.opacity = '0';
    const EASE = 'cubic-bezier(.2,.8,.3,1)';
    const pop = node => reveal(node, [
      { opacity: 0, transform: 'scale(.5) rotate(-4deg)' },
      { opacity: 1, transform: 'scale(1.08) rotate(1deg)', offset: 0.6 },
      { opacity: 1, transform: 'none' },
    ], { duration: T(520), easing: EASE });

    return {
      el: root,
      panel,
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: EASE });
      },
      // One pair: the left box pops in, the arrow draws itself across, then the right box pops in.
      async row(r) {
        const { boxes, arrow } = pairs[r];
        Sound.bloop();
        await pop(boxes[0]);
        Sound.swish();
        arrow.style.opacity = '';
        await settle(arrow.querySelector('path').animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
          duration: reducedMotion ? 1 : T(450), easing: 'ease-in-out', fill: 'backwards',
        }));
        Sound.bloop();
        await pop(boxes[1]);
      },
      ping(r, c) {
        replay(pairs[r].boxes[c], 'is-ping');
      },
      pingRow(r) {
        pairs[r].boxes.forEach(b => replay(b, 'is-ping'));
        replay(pairs[r].arrow, 'is-ping');
      },
    };
  }

  // ---------- percentage formula ("a is what percent of b?") ----------

  // A question on a purple strip, its amounts marked with their roles: [{ t }, { t, role: 'part' | 'whole' } …].
  // show() drops it in; tag(role) gives an amount its role's colour (the part blue, the whole green) and pops it.
  function questionStrip(parent, question) {
    const strip = el('div', 'pf-question', parent);
    const tags = {};
    question.forEach(seg => {
      if (seg.role) tags[seg.role] = Object.assign(el('span', 'pf-q-value', strip), { textContent: seg.t });
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
   *  part, whole  { label, value }, e.g. { label: 'Part', value: '₹125' }
   *  numbers   the part and the whole as they go into the formula, e.g. ['125', '500']
   *  answer    e.g. '25%'
   * Reveal it with open() → showQuestion() → tag(role) + box(role) … → label() → fraction() → times(0) →
   * start(1) → hint() + fly('part') → fly('whole') → times(1) → start(2) → answer() → mark().
   * tag(role) colours an amount in the question by its role (and pops it).
   */
  function percentFormula(parent, { question, part, whole, numbers, answer }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the other panels
    const panel = el('div', 'pf-panel', root);
    const q = questionStrip(panel, question);
    const column = el('div', 'pf-boxes', panel);
    const boxes = {};
    const values = {};
    Object.entries({ part, whole }).forEach(([role, b]) => {
      const box = el('div', `pf-box pf-box--${role}`, column);
      el('span', 'pf-box-label', box).textContent = b.label;
      el('span', 'pf-box-eq', box).textContent = '=';
      values[role] = Object.assign(el('span', `pf-box-value tone-${role}`, box), { textContent: b.value });
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
    const fraction = (expr, top, bottom) => {
      const f = el('div', 'pf-frac', expr);
      const num = Object.assign(el('span', 'pf-num tone-part', f), { textContent: top });
      const bar = el('span', 'pf-bar', f);
      const den = Object.assign(el('span', 'pf-den tone-whole', f), { textContent: bottom });
      return { f, num, bar, den };
    };
    const times = expr => Object.assign(el('span', 'pf-times', expr), { textContent: '× 100' });
    const rows = [row('Percentage'), row(''), row('')];
    const words = fraction(rows[0].expr, part.label, whole.label);
    const sums = fraction(rows[1].expr, numbers[0], numbers[1]);
    const by100 = [times(rows[0].expr), times(rows[1].expr)];
    const ans = Object.assign(el('span', 'pf-answer', rows[2].expr), { textContent: answer });
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

    return {
      el: root,
      panel,
      tags: q.tags,
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
      // flies into the fraction below, where it lands as a plain number (₹125 → 125).
      async fly(role) {
        const to = role === 'part' ? sums.num : sums.den;
        Sound.swish();
        await flyInto(panel, values[role], to, { text: values[role].textContent, cls: 'tone-' + role, lift: -24, ms: 850 }); // a low glide, under the line above
        Sound.pop();
        await settleIn(to);
      },
      // The answer lands like a stamp.
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
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', question.map(seg => seg.t).join(''));
    panel.style.opacity = '0';
    return {
      el: root,
      panel,
      below,
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
    el('div', 'red-cut', tag).textContent = cut;
    el('div', 'red-note', tag).textContent = note;
    const bottom = box(to);
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', `${from.price}, ${cut} ${note}, ${to.price}`);
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
      prices: { from: top.querySelector('.cmp-price'), to: bottom.querySelector('.cmp-price'), cut: tag.querySelector('.red-cut') },
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
   * Big panel that explains terms side by side (shown after a wrong answer).
   *  items   [{ title, tone: 'blue' | 'yellow', pictures: [src, src], text }]   ({word} gets highlighted)
   * `spot` is the empty space on the right where a character can stand.
   * Reveal it with open() → fill().
   */
  function definitions(parent, { items }) {
    const root = el('div', 'defs', parent);
    const panel = el('div', 'defs-panel', root);
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', items.map(item => `${item.title}: ${plain(item.text)}`).join(' '));
    const row = el('div', 'defs-row', panel);
    const spot = el('div', 'defs-spot', panel);
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
      spot,
      // The empty panel springs up first.
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

    // Leans her whole body (degrees, about her feet; negative = towards the left), until told otherwise.
    lean(deg) {
      const from = this.leanDeg || 0;
      this.leanDeg = deg;
      if (this.leaning) this.leaning.cancel();
      this.leaning = null;
      if (reducedMotion || from === deg) return;
      this.leaning = this.body.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${deg}deg)` }], {
        duration: 340, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards',
      });
    }

    // Points to her left with her wing out, leaning that way, until she does something else.
    point() {
      this.play('stand', this.sheets.stand.point, 4, true);
      this.lean(-7);
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
  class Walker {
    constructor(parent, sheet, { matte = false, face = 1 } = {}) {
      this.sheet = sheet;
      this.face = face;
      this.root = el('div', matte ? 'walker walker--matte' : 'walker', parent);
      el('div', 'walker-shadow', this.root);
      this.reflection = this._layer('walker-sprite walker-reflect');
      this.body = this._layer('walker-sprite walker-body');
      let acc = 0;
      this.starts = sheet.stride.map(s => (acc += s) - s);
      this.loopLength = acc;
      this.frame = -1;
      this.x = 0;
    }

    _layer(cls) {
      const s = this.sheet;
      return el('div', cls, this.root, {
        width: px(s.frameW), height: px(s.frameH), left: px(-s.anchorX), top: px(-s.baselineY),
        backgroundImage: `url("${s.src}")`, transformOrigin: `${s.anchorX}px ${s.baselineY}px`,
      });
    }

    setFrame(f) {
      if (f === this.frame) return;
      this.frame = f;
      const pos = `${-f * (this.sheet.frameW + this.sheet.gutter)}px 0px`;
      this.body.style.backgroundPosition = pos;
      this.reflection.style.backgroundPosition = pos;
    }

    // (x, y) = point between the feet on the floor; s = sprite scale.
    place(x, y, s) {
      this.x = x;
      this.root.style.transform = `translate(${num(x)}px, ${num(y)}px) scale(${(s * this.face).toFixed(4)}, ${s.toFixed(4)})`;
    }

    // Index into sheet.loop whose stride span (centred on the frame) contains `phase`.
    loopIndexAt(phase) {
      const L = this.loopLength;
      const st = this.sheet.stride;
      const n = st.length;
      const p = ((phase % L) + L) % L;
      for (let k = 0; k < n; k++) {
        const lo = this.starts[k] - st[(k + n - 1) % n] / 2;
        const hi = this.starts[k] + st[k] / 2;
        if ((p >= lo && p < hi) || (p - L >= lo && p - L < hi)) return k;
      }
      return 0;
    }

    idle(on) {
      this.root.classList.toggle('is-idle', on);
    }

    /**
     * Walk from `from` to `to` ({x, y, s}) at `speed` stage px/s, easing to a stop over `decel` px,
     * and land on the sheet's idle frame. Calls onStep(x) whenever a foot touches the floor.
     */
    walk(ctx, { from, to, speed = 280, decel = 220, onStep }) {
      const sh = this.sheet;
      const D = Math.hypot(to.x - from.x, to.y - from.y);
      const slow = Math.min(decel, D * 0.45);
      const cruiseT = (D - slow) / speed;
      const slowT = (2 * slow) / speed;
      const totalT = cruiseT + slowT;
      const ds = to.s - from.s;
      // Distance in *sprite* px after a fraction u of the path (the scale changes along the way).
      const phaseAt = u => (Math.abs(ds) < 1e-6 ? (u * D) / from.s : (D * Math.log((from.s + ds * u) / from.s)) / ds);
      const phase0 = this.starts[sh.loop.indexOf(sh.idle)] + 4 - phaseAt(1); // finish on the idle pose
      const contacts = new Set(sh.contact);
      let lastK = -1;
      let t0 = null;

      return new Promise((resolve, reject) => {
        const tick = time => {
          if (!ctx.alive()) return reject(CANCELLED);
          if (t0 === null) t0 = time;
          const t = (time - t0) / 1000;
          let d;
          if (t < cruiseT) {
            d = speed * t;
          } else if (t < totalT) {
            const tau = t - cruiseT;
            d = D - slow + speed * tau - (speed * tau * tau) / (2 * slowT);
          } else {
            d = D;
          }
          const u = Math.min(1, d / D);
          this.place(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u, from.s + ds * u);
          const k = this.loopIndexAt(phase0 + phaseAt(u));
          if (k !== lastK) {
            const f = sh.loop[k];
            this.setFrame(f);
            if (lastK !== -1 && contacts.has(f) && onStep) onStep(this.x);
            lastK = k;
          }
          if (t >= totalT) {
            this.setFrame(sh.idle);
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
    CANCELLED, el, rand, settle, inkDefs, flyAcross, glow, motes, twinkles, burst, shine, exclaim, bubble, thought, badge, ring, question, definitions, pricePanel,
    reduction, definitionCard, formulaPanel, formulaReveal, summaryPanel, productCard, productQuestion, workedSheet, summarySheet, strike, stickTag, choices, pairsPanel, percentFormula, questionPanel, Bird, Walker,
    setPace(p) { pace = p; },
  };
})();
