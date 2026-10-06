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
  function balloonPath(w, h, r, b) {
    return [
      `M ${r} 0`, `Q ${w / 2} ${-b} ${w - r} 0`, `A ${r} ${r} 0 0 1 ${w} ${r}`,
      `Q ${w + b} ${h / 2} ${w} ${h - r}`, `A ${r} ${r} 0 0 1 ${w - r} ${h}`,
      `Q ${w / 2} ${h + b} ${r} ${h}`, `A ${r} ${r} 0 0 1 0 ${h - r}`,
      `Q ${-b} ${h / 2} 0 ${r}`, `A ${r} ${r} 0 0 1 ${r} 0`, 'Z',
    ].join(' ');
  }

  // Curved wedge from a base point inside the balloon to the tip (both in balloon coordinates).
  function tailPath([bx, by], [tx, ty], halfWidth, bend) {
    const len = Math.hypot(tx - bx, ty - by) || 1;
    const nx = -(ty - by) / len;
    const ny = (tx - bx) / len;
    const p1 = [bx + nx * halfWidth, by + ny * halfWidth];
    const p2 = [bx - nx * halfWidth, by - ny * halfWidth];
    const c1 = [(p1[0] + tx) / 2 + nx * bend, (p1[1] + ty) / 2 + ny * bend];
    const c2 = [(p2[0] + tx) / 2 + nx * bend * 0.4, (p2[1] + ty) / 2 + ny * bend * 0.4];
    const f = pt => `${num(pt[0])} ${num(pt[1])}`;
    return `M ${f(p1)} Q ${f(c1)} ${f([tx, ty])} Q ${f(c2)} ${f(p2)} Z`;
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
  function paintShapes(art, paths, shadow = [6, 8]) {
    [['b-shadow', { transform: `translate(${shadow[0]} ${shadow[1]})`, opacity: 0.2 }], ['b-line', {}], ['b-fill', {}]].forEach(([cls, extra]) => {
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

    // The tail leaves the bottom edge (or the top edge, when it points up) on the side nearest the speaker.
    const r = Math.min(36, h / 2);
    const half = o.tailWidth || 16;
    const side = tip[0] < w / 2 ? 1 : -1;
    const lean = o.lean ?? 70; // how far along the edge from the speaker the tail starts
    const up = tip[1] < 0;
    const base = [Math.max(r + half, Math.min(w - r - half, tip[0] + lean * side)), up ? 10 : h - 10];
    const body = balloonPath(w, h, r, 5);
    const tail = tailPath(base, tip, half, o.bend !== undefined ? o.bend : 10);
    const art = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    float.insertBefore(art, textBox);
    paintShapes(art, [body, tail]);
    const rot = o.rotate || 0;

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
      paintShapes(svg('svg', { width: 2 * pr, height: 2 * pr, viewBox: `0 0 ${2 * pr} ${2 * pr}` }, bob), [ellipsePath(pr, pr, pr, pr)], [3, 4]);
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

        await ctx.wait(560);
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

  // A glowing ring that pulses around a spot (e.g. a price sticker) to draw the eye to it.
  function ring(parent, { x, y, r }) {
    const node = el('div', 'spot-ring', parent, { left: px(x - r), top: px(y - r), width: px(2 * r), height: px(2 * r) });
    reveal(node, [{ opacity: 0, transform: 'scale(1.7)' }, { opacity: 1, transform: 'none' }], {
      duration: T(600), easing: 'cubic-bezier(.2,.8,.3,1)',
    });
    return node;
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
      await ctx.wait(380);
    }
    reveal(head, [
      { opacity: 0, transform: 'translateY(-34px)' },
      { opacity: 1, transform: 'none' },
    ], { duration: T(620), easing: 'cubic-bezier(.2,.8,.3,1)' });
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
      // The card springs up.
      open() {
        Sound.whoosh();
        return reveal(card, [
          { opacity: 0, transform: 'translateY(70px) scale(.86)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(700), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The header drops in, then the words appear one by one (see revealDefinition).
      define(ctx, opts) {
        return revealDefinition(ctx, { head, words }, opts);
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
  function pricePanel(parent, { price, term, abbr, definition, compare }) {
    const root = el('div', 'mp', parent);
    const panel = el('div', 'mp-panel', root);
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
      // The panel springs up with the (empty) pink strip on it.
      open() {
        Sound.whoosh();
        strip.style.opacity = '';
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      term(i) {
        Sound.bloop();
        return popIn(longTerms[i]);
      },
      op(i) {
        Sound.pop();
        return popIn(longOps[i]);
      },
      // The (empty) blue box for the short form.
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

  // ---------- worked example (the formula used on the book) ----------

  /**
   * The book on the left; on the right a solution written out line by line with its = signs lined up, and
   * under it an answer box.
   *  rows    [{ label, tone, value: [{ t, tone } | { t, op: true }] }], or 'rule' for a dividing line
   *  answer  { label, value }
   * write(i) writes row i's label and = sign; its values then come in with fromSticker(i, j),
   * copy([i, j], [k, l]) (a value flies down from another line) or show(i, j). rule(i) draws a dividing
   * line; answer() lands the answer box.
   */
  function workedExample(parent, { price, rows, answer }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', 'we-panel', root);
    const bookBox = el('div', 'we-book', panel);
    bookBox.innerHTML = bookArt(price);
    const sticker = bookBox.querySelector('.mp-sticker-card');
    const side = el('div', 'we-side', panel);
    const sheet = el('div', 'we-sheet', side);
    const lines = rows.map(row => {
      if (row === 'rule') return { rule: el('div', 'we-rule', sheet) };
      const label = el('div', `we-label${row.tone ? ' tone-' + row.tone : ''}`, sheet);
      label.textContent = row.label || '';
      const eq = el('div', 'we-eq', sheet);
      eq.textContent = '=';
      const cell = el('div', 'we-value', sheet);
      const vals = row.value.map(v => Object.assign(el('span', v.op ? 'we-op' : `we-num tone-${v.tone}`, cell), { textContent: v.t }));
      return { label, eq, vals };
    });
    const ans = el('div', 'we-answer', side);
    el('span', '', ans).textContent = `${answer.label} = `;
    el('span', 'we-answer-value', ans).textContent = answer.value;
    sheet.setAttribute('role', 'group');
    sheet.setAttribute('aria-label', rows.filter(r => r !== 'rule')
      .map(r => `${r.label || ''} = ${r.value.map(v => v.t).join(' ')}`).join(', '));
    [panel, bookBox, ans, ...lines.flatMap(l => (l.rule ? [l.rule] : [l.label, l.eq, ...l.vals]))]
      .forEach(n => { n.style.opacity = '0'; });
    const wipe = (node, ms) => reveal(node, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: T(ms), easing: 'cubic-bezier(.3,.1,.3,1)',
    });
    const settleIn = node => reveal(node, [{ transform: 'scale(1.18)' }, { transform: 'none' }], {
      duration: T(320), easing: 'cubic-bezier(.3,1.6,.5,1)',
    });

    return {
      el: root,
      panel,
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
        const r = panelBox(panel, sticker);
        Sound.sparkle();
        return ring(panel, { x: (r.l + r.r) / 2, y: (r.t + r.b) / 2, r: Math.max(r.r - r.l, r.b - r.t) * 0.72 });
      },
      // Row i's label and = sign are written in, left to right.
      async write(i) {
        const { label, eq } = lines[i];
        Sound.scribble();
        if (label.textContent) await wipe(label, 520);
        else label.style.opacity = '';
        await wipe(eq, 220);
      },
      // The price on the book's sticker flies into row i's value j.
      async fromSticker(i, j) {
        Sound.swish();
        await flyInto(panel, sticker, lines[i].vals[j], { text: price, card: true });
        Sound.pop();
        await settleIn(lines[i].vals[j]);
      },
      // A copy of one value flies down into another line (putting the numbers into the formula).
      async copy([i, j], [k, l]) {
        const from = lines[i].vals[j];
        const to = lines[k].vals[l];
        Sound.swish();
        await flyInto(panel, from, to, { text: from.textContent, cls: from.className.replace('we-num', '').trim(), lift: 60, ms: 800 });
        Sound.pop();
        await settleIn(to);
      },
      // Row i's value j pops in; { stamp } lands it harder (an answer).
      show(i, j, { stamp = false } = {}) {
        const node = lines[i].vals[j];
        if (stamp) Sound.stamp();
        else Sound.bloop();
        return reveal(node, [
          { opacity: 0, transform: stamp ? 'scale(1.8) rotate(-6deg)' : 'scale(.55)' },
          { opacity: 1, transform: stamp ? 'scale(.94)' : 'scale(1.08)', offset: 0.62 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(560), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The dividing line is drawn across.
      rule(i) {
        Sound.swish();
        return wipe(lines[i].rule, 600);
      },
      // The answer box lands like a stamp.
      answer() {
        Sound.stamp();
        return reveal(ans, [
          { opacity: 0, transform: 'translateY(-30px) scale(1.6) rotate(-6deg)' },
          { opacity: 1, transform: 'scale(.95) rotate(1deg)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(620), easing: 'cubic-bezier(.3,.6,.3,1)' }).then(() => ans.classList.add('is-landed'));
      },
      answerEl: ans,
    };
  }

  // ---------- summary (Let's remember!) ----------

  /**
   * A recap: a title, cards ({ term, tone, value, desc }) joined by arrows, and the formula under them
   * (segments: [{ t, tone }], tone optional). Reveal it with open() → title() → card(ctx, i) / arrow(i) → formula().
   * The panel sits left of centre, leaving room on its right for a character (see the CSS).
   */
  function summaryPanel(parent, { title, cards, formula }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', 'sm-panel', root);
    const head = el('div', 'sm-title', panel);
    head.textContent = title;
    const row = el('div', 'sm-row', panel);
    const arrows = [];
    const parts = cards.map((c, i) => {
      if (i) {
        row.insertAdjacentHTML('beforeend', ARROW);
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

  // ---------- reduction card (₹1000 → ₹200 reduced → ₹800) ----------

  /**
   * Card on the right of the screen: the old price, a red arrow down labelled with how much less, the new price.
   *  from, to   { price, tone: 'yellow' | 'blue' }      cut  e.g. '₹200'      note  e.g. 'reduced'
   * Reveal it with enter() → showFrom() → showTo() → showCut().
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

    return {
      el: pos,
      // The empty card swings in from the right.
      enter() {
        Sound.whoosh();
        return reveal(card, [
          { opacity: 1, transform: 'translateX(135%) rotate(9deg)' },
          { opacity: 1, transform: 'translateX(-5%) rotate(-2.5deg)', offset: 0.62 },
          { opacity: 1, transform: 'translateX(1.5%) rotate(.8deg)', offset: 0.82 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(950), easing: 'cubic-bezier(.22,.9,.28,1)' });
      },
      showFrom() {
        Sound.bloop();
        return pop(top);
      },
      // The red arrow grows down (with a falling "whoop"), then the new price appears.
      async showTo(ctx) {
        arrow.style.opacity = '';
        Sound.drop();
        await settle(arrow.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
          duration: reducedMotion ? 1 : T(800), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards',
        }));
        await ctx.wait(150);
        Sound.bloop();
        await pop(bottom);
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
      // How much less: pops in beside the arrow, then keeps pulsing gently.
      async showCut() {
        Sound.pop();
        await reveal(tag, [
          { opacity: 0, transform: 'scale(0) rotate(-12deg)' },
          { opacity: 1, transform: 'scale(1.25) rotate(4deg)', offset: 0.6 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(650), easing: 'cubic-bezier(.2,.8,.3,1)' });
        tag.classList.add('is-pulsing');
      },
    };
  }

  // ---------- discount panel (₹1000 → ₹200 reduced → ₹800, and the word for it) ----------

  /**
   * Panel that sums up a discount: on the left a price flow (each step { price, label, tone }, with an arrow
   * growing down between steps), on the right a spot where a character stands (`spot`) and a word stamp.
   * Reveal it with open() → flow() → stamp(); highlight(i) makes one step of the flow pulse.
   */
  function discountPanel(parent, { steps, word }) {
    const root = el('div', 'mp', parent); // the same centring wrapper as the price panels
    const panel = el('div', 'dc-panel', root);
    const flowEl = el('div', 'dc-flow', panel);
    const boxes = [];
    const arrows = [];
    steps.forEach((step, i) => {
      if (i) {
        const holder = el('div', 'dc-arrow', flowEl);
        holder.innerHTML = downArrow();
        arrows.push(holder.firstElementChild);
      }
      const box = el('div', `cmp-box cmp-box--${step.tone} dc-box`, flowEl);
      el('div', 'cmp-price', box).textContent = step.price;
      el('div', 'cmp-label', box).textContent = step.label;
      boxes.push(box);
    });
    const right = el('div', 'dc-right', panel);
    const spot = el('div', 'dc-spot', right);
    const stampEl = el('div', 'dc-stamp', right);
    el('span', '', stampEl).textContent = word;
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', `${steps.map(s => `${s.price} ${s.label}`).join(', ')}: ${word}`);
    [panel, ...boxes, ...arrows, stampEl].forEach(n => { n.style.opacity = '0'; });

    return {
      el: root,
      panel,
      spot,
      stampEl,
      open() {
        Sound.whoosh();
        return reveal(panel, [
          { opacity: 0, transform: 'translateY(80px) scale(.82)' },
          { opacity: 1, transform: 'translateY(-8px) scale(1.015)', offset: 0.7 },
          { opacity: 1, transform: 'none' },
        ], { duration: T(680), easing: 'cubic-bezier(.2,.8,.3,1)' });
      },
      // The flow builds from the top: each box pops in, and an arrow grows down to the next one.
      async flow(ctx) {
        for (const [i, box] of boxes.entries()) {
          if (i) {
            const arrow = arrows[i - 1];
            arrow.style.opacity = '';
            Sound.swish();
            await settle(arrow.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
              duration: reducedMotion ? 1 : T(500), easing: 'cubic-bezier(.45,0,.3,1)', fill: 'backwards',
            }));
          }
          if (steps[i].tone === 'red') Sound.drop();
          else Sound.bloop();
          reveal(box, [
            { opacity: 0, transform: 'scale(.6)' },
            { opacity: 1, transform: 'scale(1.06)', offset: 0.65 },
            { opacity: 1, transform: 'none' },
          ], { duration: T(560), easing: 'cubic-bezier(.2,.8,.3,1)' });
          await ctx.wait(650);
        }
      },
      // One step pulses with a red ring: twice, or for as long as it stays the key point (`keep`).
      highlight(i, keep = false) {
        const box = boxes[i];
        box.classList.remove('is-glowing', 'is-key');
        void box.offsetWidth; // restart the animation
        box.classList.add(keep ? 'is-key' : 'is-glowing');
      },
      // Already complete, with the reduction glowing (to carry the panel over from the screen before).
      showNow() {
        [panel, ...boxes, ...arrows, stampEl].forEach(n => { n.style.opacity = ''; });
        stampEl.classList.add('is-landed');
        boxes[1].classList.add('is-key');
      },
      // Shrinks away and is removed.
      close() {
        return settle(panel.animate([
          { opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(50px) scale(.9)' },
        ], { duration: reducedMotion ? 1 : T(420), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })).then(() => root.remove());
      },
      // The word lands like a rubber stamp, then keeps gently pulsing.
      stamp() {
        Sound.stamp();
        stampEl.style.opacity = '';
        return settle(stampEl.animate([
          { opacity: 0, transform: 'scale(2.4) rotate(-14deg)' },
          { opacity: 1, transform: 'scale(.92) rotate(-3deg)', offset: 0.55 },
          { opacity: 1, transform: 'scale(1.04) rotate(-5deg)', offset: 0.78 },
          { opacity: 1, transform: 'rotate(-4deg)' },
        ], { duration: reducedMotion ? 1 : T(560), easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'backwards' }))
          .then(() => stampEl.classList.add('is-landed'));
      },
    };
  }

  // ---------- definitions panel ----------

  const ARROW = '<svg class="def-arrow" viewBox="0 0 64 40" aria-hidden="true"><path pathLength="1" d="M6 20h44M36 7l15 13-15 13"/></svg>';

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
          await ctx.wait(400);
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
    CANCELLED, el, rand, settle, glow, motes, twinkles, burst, shine, exclaim, bubble, thought, badge, ring, question, definitions, pricePanel,
    reduction, discountPanel, definitionCard, formulaPanel, formulaReveal, workedExample, summaryPanel, Bird, Walker,
    setPace(p) { pace = p; },
  };
})();
