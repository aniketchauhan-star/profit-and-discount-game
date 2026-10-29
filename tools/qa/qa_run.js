// QA, silent, real time (at 1920 × 1080, or VIEWPORT=WxH): each screen in a fresh page (autoplay on; answers, things to tap and Buys pressed with the
// mouse), and every half second: files that failed to load, console errors, words cut off in a bubble / card / strip /
// panel (their text wider or taller than their box), a bubble or card running off the screen, and bubbles over other
// bubbles, over a card or over Swifty.   node tools/qa/qa_run.js OUT [id …]   (writes OUT/qa.json; prints a line per screen)
const { chromium, GAME, LAUNCH } = require('./browser');
const fs = require('fs');
const [OUT, ...ONLY] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
const SKIP = new Set(['mallfloor']); // (walked with the controller: mallwalk.js)
const URL = GAME;
const [VW, VH] = (process.env.VIEWPORT || '1920x1080').split('x').map(Number); // (VIEWPORT=1024x768: a tablet)
async function screen(browser, id, index) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  await page.addInitScript(() => {
    try { localStorage.setItem('bj.music', '0'); localStorage.setItem('bj.autoplay', '1'); } catch (e) {}
    if (window.speechSynthesis) { const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { u.volume = 0; window.__tts = (window.__tts || []).concat(u.text); s(u); }; }
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; return play.call(this); };
  });
  const found = { failed: new Set(), errors: new Set(), cut: new Set(), off: new Set(), over: new Set() };
  page.on('requestfailed', r => { // (not a film let go of on purpose: one loaded ahead for a screen not gone to)
    if (!/ERR_ABORTED/.test(r.failure()?.errorText || '')) found.failed.add(`${r.url().split('/').slice(-2).join('/')} (${r.failure()?.errorText})`);
  });
  page.on('response', r => { if (r.status() >= 400) found.failed.add(`${r.url().split('/').slice(-2).join('/')} (${r.status()})`); });
  page.on('pageerror', e => found.errors.add(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_ABORTED/.test(m.text())) found.errors.add(m.text()); });
  await page.goto(URL);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  await page.evaluate(i => document.querySelectorAll('.scene-item')[i].click(), index);
  await page.waitForSelector(`.scene[data-scene="${id}"].is-active`, { timeout: 20000 }).catch(() => {});
  const t0 = Date.now();
  let lastPress = 0;
  while (Date.now() - t0 < 40000) {
    const on = await page.evaluate(() => (document.querySelector('.scene.is-active:not(.is-leaving)') || {}).dataset?.scene);
    if (on !== id) break;
    const look = await page.evaluate(id => {
      const s = document.querySelector(`.scene[data-scene="${id}"]`);
      const shows = el => { // seen, and fully (no fade, no move under way)
        for (let e = el; e && e !== s; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.95) return false; }
        return el.getAnimations({ subtree: true }).every(a => a.playState !== 'running') && !el.closest('.is-leaving');
      };
      const name = el => `${el.className.toString().split(' ').filter(Boolean).slice(0, 2).join('.')} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 36)}"`;
      const out = { cut: [], off: [], over: [] };
      const boxes = [...s.querySelectorAll('.bubble, .thought, .qcard, .pc2-card, .hint-strip, .mp > *, .dc-row, .dc-buy, .invite-card, .pt-card, .pmc-card')].filter(shows);
      boxes.forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.width < 10) return;
        if (r.left < -4 || r.top < -4 || r.right > innerWidth + 4 || r.bottom > innerHeight + 4) out.off.push(`${name(b)} [${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}]`);
        b.querySelectorAll('*').forEach(t => { // words that don't fit their box (and are clipped by it)
          if (![...t.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())) return;
          const cs = getComputedStyle(t);
          if ((t.scrollWidth > t.clientWidth + 2 && /hidden|clip/.test(cs.overflowX)) || (t.scrollHeight > t.clientHeight + 2 && /hidden|clip/.test(cs.overflowY))) out.cut.push(name(t));
        });
      });
      const bubbles = boxes.filter(b => b.matches('.bubble, .thought'));
      // (what a bubble must not cover: the words and pictures on a card or panel, as they show now, not their boxes, and Swifty)
      const content = [...s.querySelectorAll('.qcard *, .pc2-card *, .mp *, .dc-row *, .invite-card *, .pt-card *, .pmc-card *')]
        .filter(n => !n.closest('.bubble, .thought') && ([...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()) || /^(IMG|svg)$/i.test(n.tagName)) && shows(n));
      const others = [...content, ...[...s.querySelectorAll('.bird-body')].filter(shows)];
      const hit = (a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); const w = Math.min(p.right, q.right) - Math.max(p.left, q.left), h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top); return w > 12 && h > 12 ? Math.round(w * h) : 0; };
      bubbles.forEach((b, i) => {
        bubbles.slice(i + 1).forEach(c => { const a = hit(b, c); if (a) out.over.push(`${name(b)} × ${name(c)}: ${a} px²`); });
        others.forEach(c => { if (c.contains(b) || b.contains(c)) return; const a = hit(b, c); if (a > 150) out.over.push(`${name(b)} × ${c.classList.contains('bird-body') ? 'Swifty' : name(c)}: ${a} px²`); });
      });
      return out;
    }, id);
    look.cut.forEach(x => found.cut.add(x)); look.off.forEach(x => found.off.add(x)); look.over.forEach(x => found.over.add(x));
    if (Date.now() - lastPress > 2500) {
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
    await page.waitForTimeout(500);
  }
  const tts = await page.evaluate(() => window.__tts || []);
  await page.close();
  return { id, tts, ...Object.fromEntries(Object.entries(found).map(([k, v]) => [k, [...v]])) };
}
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage();
  await page.goto(URL);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const ids = await page.evaluate(() => [...document.querySelectorAll('.scene')].map(s => s.dataset.scene));
  await page.close();
  const all = [];
  for (const [i, id] of ids.entries()) {
    if (SKIP.has(id) || (ONLY.length && !ONLY.includes(id))) continue;
    const r = await screen(browser, id, i);
    all.push({ n: i + 1, ...r });
    const issues = ['failed', 'errors', 'cut', 'off', 'over', 'tts'].filter(k => r[k].length).map(k => `${k} ${r[k].length}`);
    console.log(`${String(i + 1).padStart(2)} ${id}: ${issues.length ? issues.join(', ') : 'ok'}`);
    fs.writeFileSync(`${OUT}/qa.json`, JSON.stringify(all, null, 1));
  }
  await browser.close();
  process.exit(0);
})();
