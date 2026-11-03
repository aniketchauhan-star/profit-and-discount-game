// Every screen in turn from the scene list, silent and sped up: errors, and whether its picture (or film) shows.
const { chromium, GAME, LAUNCH } = require('./browser');
const F = 3;
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(F => { try { localStorage.setItem('bj.music', '0'); localStorage.setItem('bj.autoplay', '0'); } catch (e) {}
    const st = window.setTimeout; window.setTimeout = (fn, ms = 0, ...a) => st(fn, ms / F, ...a);
    if (window.speechSynthesis) { const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { u.volume = 0; u.rate = Math.min(10, F); s(u); }; }
    const play = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; try { this.playbackRate = F; } catch (e) {} return play.call(this); }; }, F);
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/ERR_ABORTED/.test(m.text())) errors.push(m.text()); });
  await page.goto(GAME);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const ids = await page.evaluate(() => [...document.querySelectorAll('.scene')].map(s => s.dataset.scene));
  const bad = [];
  for (const [i, id] of ids.entries()) {
    await page.evaluate(i => document.querySelectorAll('.scene-item')[i].click(), i);
    await page.waitForTimeout(3500);
    const st = await page.evaluate(id => {
      const s = document.querySelector(`.scene[data-scene="${id}"]`);
      const imgs = [...s.querySelectorAll('img, .scene-bg')];
      const bgOk = imgs.some(n => n.tagName === 'IMG' ? n.complete && n.naturalWidth > 0 : getComputedStyle(n).backgroundImage !== 'none');
      const v = s.querySelector('video');
      return { active: s.classList.contains('is-active'), bgOk, film: v ? { t: +v.currentTime.toFixed(2), err: !!v.error } : null };
    }, id);
    if (!st.active || !st.bgOk || (st.film && st.film.err)) bad.push(`${i} ${id} ${JSON.stringify(st)}`);
  }
  console.log(`${ids.length} screens; problems: ${bad.length ? '\n  ' + bad.join('\n  ') : 'none'}`);
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(0);
})();
