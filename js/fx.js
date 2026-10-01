/* ==========================================================================
   Bookstore Journey — visual effects
   Glows, dust, sparkles, confetti, light sweeps, comic speech bubbles,
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

  const CONFETTI_COLORS = ['#ffc83d', '#ff7a59', '#2fb5a3', '#5b8def', '#b36bd8', '#7ccf5b', '#ffffff'];

  // Pieces shoot up out of (x, y), then flutter down past the bottom of the stage.
  function confetti(parent, x, y, { count = 90 } = {}) {
    for (let i = 0; i < count; i++) {
      const w = rand(12, 22);
      const h = rand(18, 34);
      const c = el('div', 'confetti', parent, {
        left: px(x), top: px(y), width: px(w), height: px(h), marginLeft: px(-w / 2), marginTop: px(-h / 2),
        background: pick(CONFETTI_COLORS), borderRadius: Math.random() < 0.3 ? '50%' : '3px',
      });
      const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05);
      const speed = rand(380, 820);
      const peakX = Math.cos(angle) * speed;
      const peakY = Math.sin(angle) * speed;
      const endX = peakX * 1.5 + rand(-120, 120);
      const endY = 1160 - y + rand(0, 100);
      const rot = rand(360, 1080) * (Math.random() < 0.5 ? -1 : 1);
      settle(c.animate([
        { transform: 'translate(0, 0) rotate(0deg) rotateX(0deg)', opacity: 1, easing: 'cubic-bezier(.15,.6,.35,1)' },
        { transform: `translate(${num(peakX)}px, ${num(peakY)}px) rotate(${num(rot * 0.3)}deg) rotateX(${num(rot)}deg)`, opacity: 1, offset: 0.28, easing: 'cubic-bezier(.45,0,.8,.6)' },
        { transform: `translate(${num(endX)}px, ${num(endY)}px) rotate(${num(rot)}deg) rotateX(${num(rot * 3)}deg)`, opacity: 0.9 },
      ], { duration: rand(2200, 3600), fill: 'forwards' })).then(() => c.remove());
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
  // `text` is a string ('\n' = new line) or segments: [{ t: "It's " }, { t: '₹800', em: true }, { t: '!' }].
  function buildLetters(host, text) {
    const segments = typeof text === 'string' ? [{ t: text }] : text;
    const letters = [];
    segments.forEach(seg => {
      const target = seg.em ? el('span', 'em', host) : host;
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
            if (i === all.length - 1) letter.dataset.end = '1';
            letters.push(letter);
          });
        });
      });
    });
    return letters;
  }

  /**
   * Comic speech bubble, sized to fit its text.
   *  anchor   [x, y] stage point where one corner of the balloon sits
   *  corner   which corner that is: 'bl' (default) | 'br' | 'tl' | 'tr'
   *  tip      [x, y] stage point the tail points at (the speaker's mouth)
   *  text     see buildLetters; size (px, default 34), voice ('boy' | 'man'), rotate (deg)
   */
  function bubble(parent, o) {
    const root = el('div', 'bubble', parent);
    const float = el('div', 'bubble-float', root);
    const textBox = el('div', 'b-text', float, { fontSize: px(o.size || 34) });
    const letters = buildLetters(textBox, o.text);

    // Measure the laid-out text (letters are invisible but already take their space).
    const h = textBox.offsetHeight;
    const w = Math.max(textBox.offsetWidth, h + 24);
    textBox.style.width = px(w);
    const corner = o.corner || 'bl';
    const x = corner[1] === 'r' ? o.anchor[0] - w : o.anchor[0];
    const y = corner[0] === 'b' ? o.anchor[1] - h : o.anchor[1];
    const tip = [o.tip[0] - x, o.tip[1] - y];
    Object.assign(root.style, {
      left: px(x), top: px(y), width: px(w), height: px(h),
      transformOrigin: `${num(tip[0])}px ${num(tip[1])}px`, // grows out of the speaker's mouth
    });

    // The tail leaves the bottom edge on the side nearest the speaker.
    const r = Math.min(36, h / 2);
    const half = o.tailWidth || 16;
    const side = tip[0] < w / 2 ? 1 : -1;
    const base = [Math.max(r + half, Math.min(w - r - half, tip[0] + 70 * side)), h - 10];
    const body = balloonPath(w, h, r, 5);
    const tail = tailPath(base, tip, half, o.bend !== undefined ? o.bend : 10);
    const art = svg('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    float.insertBefore(art, textBox);
    // Outline + fill trick: stroke both shapes, then fill both on top so the seam disappears.
    [['b-shadow', { transform: 'translate(6 8)', opacity: 0.2 }], ['b-line', {}], ['b-fill', {}]].forEach(([cls, extra]) => {
      const g = svg('g', Object.assign({ class: cls }, extra), art);
      svg('path', { d: body }, g);
      svg('path', { d: tail }, g);
    });
    const rot = o.rotate || 0;

    return {
      el: root,
      show() {
        Sound.bloop();
        return settle(root.animate([
          { opacity: 0, transform: `scale(.15) rotate(${rot - 10}deg)` },
          { opacity: 1, transform: `scale(1.08) rotate(${rot + 2}deg)`, offset: 0.55 },
          { opacity: 1, transform: `scale(.97) rotate(${rot - 0.5}deg)`, offset: 0.8 },
          { opacity: 1, transform: `scale(1) rotate(${rot}deg)` },
        ], { duration: 480, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }));
      },
      // Types the text letter by letter; `ctx.wait` throws if the player leaves the scene.
      async type(ctx, speed = 46) {
        let n = 0;
        for (const letter of letters) {
          letter.classList.add('on');
          const c = letter.textContent;
          if (/[A-Za-z0-9₹]/.test(c) && n++ % 2 === 0) Sound.blip(o.voice);
          let delay = speed;
          if (letter.dataset.end) delay += speed * 0.8;
          if (/[!?.,]/.test(c)) delay += 140;
          await ctx.wait(delay);
        }
      },
      emphasize() {
        root.querySelectorAll('.em').forEach(e => e.classList.add('pulse'));
      },
      // Shrinks back into the speaker's mouth and is removed.
      hide() {
        return settle(root.animate([
          { opacity: 1, transform: `scale(1) rotate(${rot}deg)` },
          { opacity: 0, transform: `scale(.3) rotate(${rot - 8}deg)` },
        ], { duration: 260, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })).then(() => root.remove());
      },
    };
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

  // ---------- walking sprite ----------

  /**
   * Plays a cleaned walk strip (see WALK_SHEET in game.js).
   * Frames are picked by *distance walked*, not by time: each frame stays up while the body travels
   * the stride measured from the planted foot. That keeps the feet from skating at any speed.
   */
  class Walker {
    constructor(parent, sheet) {
      this.sheet = sheet;
      this.root = el('div', 'walker', parent);
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
      this.root.style.transform = `translate(${num(x)}px, ${num(y)}px) scale(${s.toFixed(4)})`;
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

  window.FX = { CANCELLED, el, rand, settle, glow, motes, twinkles, burst, confetti, shine, exclaim, bubble, badge, Walker };
})();
