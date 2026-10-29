// Seamless audit, silent, real time: every screen from the scene list (autoplay on; question cards answered, things
// tapped, Buys pressed, with the mouse), and when each piece on it comes into view: a block of text or a picture in the
// screen's own layers (words in one bubble or line are one piece). Logs, per screen, the moments where three or more
// pieces came in together (within 150 ms), and pieces that came in at once (no fade: hidden one sample, fully there the
// next).   node tools/qa/seamless_audit.js OUT [id …]
const { chromium, GAME, LAUNCH } = require('./browser');
const fs = require('fs');
const [OUT, ...ONLY] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const SKIP = new Set(['mallfloor']); // (walked with the controller: its first moment was checked on its own)
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => {
    try { localStorage.setItem('bj.music', '0'); localStorage.setItem('bj.autoplay', '1'); } catch (e) {}
    if (window.speechSynthesis) { const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { u.volume = 0; s(u); }; }
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; return play.call(this); };
    // The tracker: every 60 ms, the pieces in view on the screen showing, and when each came (and how: faded or at once).
    window.__pieces = new Map(); // el → { id, desc, t0, tIn, gone }
    let nid = 0;
    const blockOf = n => { // (an inline piece of text counts with the block it is in)
      let e = n;
      while (e && e.parentElement && /^inline/.test(getComputedStyle(e).display) && !/^(IMG|svg|BUTTON)$/i.test(e.tagName)) e = e.parentElement;
      return e;
    };
    const seen = el => { // how much of it shows: its opacity and its ancestors' up to the screen
      let o = 1;
      for (let e = el; e && !e.classList.contains('scene'); e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
        o *= +cs.opacity;
        if (o < 0.05) return 0;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 14 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) return 0;
      return o;
    };
    const tick = () => {
      const s = document.querySelector('.scene.is-active:not(.is-leaving)');
      const now = performance.now();
      if (s) {
        const roots = [s.querySelector('.scene-ui'), s.querySelector('.scene-layer'), s.querySelector('.sheet-panel')].filter(Boolean);
        const blocks = new Set();
        roots.forEach(root => root.querySelectorAll('*').forEach(n => {
          const text = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
          if (text || /^(IMG|svg)$/i.test(n.tagName)) blocks.add(blockOf(n));
        }));
        blocks.forEach(b => {
          const o = seen(b);
          let p = window.__pieces.get(b);
          if (!p) {
            p = { id: ++nid, scene: s.dataset.scene, desc: `${b.tagName.toLowerCase()}.${[...b.classList].slice(0, 2).join('.')} "${(b.textContent || b.getAttribute('alt') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}"`, last: 0 };
            window.__pieces.set(b, p);
          }
          if (o > 0.85 && !p.tIn) { p.tIn = now; p.jump = p.last < 0.15 && p.lastT && now - p.lastT < 90; }
          if (o > 0 && !p.t0) p.t0 = now;
          p.last = o; p.lastT = now;
        });
      }
      setTimeout(tick, 60);
    };
    window.addEventListener('load', () => setTimeout(tick, 100));
  });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(GAME);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const ids = await page.evaluate(() => [...document.querySelectorAll('.scene')].map(s => s.dataset.scene));
  const report = [];
  for (const [i, id] of ids.entries()) {
    if (SKIP.has(id) || (ONLY.length && !ONLY.includes(id))) continue;
    await page.evaluate(() => { window.__pieces = new Map(); });
    await page.evaluate(i => document.querySelectorAll('.scene-item')[i].click(), i);
    await page.waitForSelector(`.scene[data-scene="${id}"].is-active`, { timeout: 20000 }).catch(() => {});
    const t0 = Date.now();
    let lastPress = 0;
    // play it through: till the next screen comes (autoplay), or 45 s
    while (Date.now() - t0 < 45000) {
      const on = await page.evaluate(() => (document.querySelector('.scene.is-active:not(.is-leaving)') || {}).dataset?.scene);
      if (on !== id) break;
      if (Date.now() - lastPress > 2500) { // something to press: an answer, a thing to tap, a Buy
        const target = await page.evaluate(id => {
          const s = document.querySelector(`.scene[data-scene="${id}"]`);
          const vis = b => b && !b.disabled && +getComputedStyle(b).opacity > 0.9 && b.getBoundingClientRect().width > 0;
          const pick = [...s.querySelectorAll('.q-opt')].find(b => vis(b) && !b.classList.contains('is-wrong') && !b.classList.contains('is-correct'))
            || [...s.querySelectorAll('.deal-spot')].find(vis) || [...s.querySelectorAll('.dc-buy')].find(vis);
          if (!pick) return null;
          const r = pick.getBoundingClientRect();
          return [r.left + r.width / 2, r.top + r.height / 2];
        }, id);
        if (target) { await page.mouse.click(target[0], target[1]); lastPress = Date.now(); }
      }
      await page.waitForTimeout(200);
    }
    const pieces = await page.evaluate(id => [...window.__pieces.values()].filter(p => p.scene === id && p.tIn).map(p => ({ id: p.id, desc: p.desc, t: Math.round(p.tIn), jump: !!p.jump })), id);
    pieces.sort((a, b) => a.t - b.t);
    const start = pieces.length ? pieces[0].t : 0;
    // moments where 3+ pieces came within 150 ms of each other
    const bursts = [];
    for (let k = 0; k < pieces.length;) {
      let j = k;
      while (j + 1 < pieces.length && pieces[j + 1].t - pieces[k].t <= 150) j++;
      if (j - k + 1 >= 3) bursts.push(pieces.slice(k, j + 1));
      k = j + 1;
    }
    const jumps = pieces.filter(p => p.jump);
    report.push({ i: i + 1, id, pieces: pieces.length, bursts: bursts.map(b => ({ at: ((b[0].t - start) / 1000).toFixed(1), n: b.length, what: b.map(p => p.desc) })), jumps: jumps.map(p => `${((p.t - start) / 1000).toFixed(1)} s ${p.desc}`) });
    console.log(`${String(i + 1).padStart(2)} ${id}: ${pieces.length} pieces; ${bursts.length} together-moments; ${jumps.length} at once`);
  }
  fs.writeFileSync(`${OUT}/seamless.json`, JSON.stringify(report, null, 1));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(0);
})();
