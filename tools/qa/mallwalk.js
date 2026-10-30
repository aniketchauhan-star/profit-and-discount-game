// Party Prep from the mall to the end, silent: the first time, the controller hidden till Swifty names it (and which word
// was being said as it came in); back out of a shop, no introduction, the controller alone (and when it came in); walk
// (arrow keys) into each shop in turn; the way in (camera zoom, he fades); in the shop, both selling prices right and
// Buy the better deal (mouse); back out; …; his fit check; the end.   node tools/qa/mallwalk.js OUT
const { chromium, GAME, LAUNCH } = require('./browser');
const fs = require('fs');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const F = 2;
const K = 1920 / 1672;
const DOORS = { shirtshop: [[388, 360], [665, 296]], pantsshop: [[1000, 300], [1290, 368]], watchshop: [[1388, 420], [1560, 510]], sunshop: [[115, 515], [298, 414]] };
const BEST = { shirtshop: 1, pantsshop: 0, watchshop: 1, sunshop: 1 };
const NAMES = { 'Blue shirt': 960, 'Green shirt': 850, Jeans: 1260, Trousers: 1300, 'Silver watch': 1600, 'Brown watch': 1550, 'Black sunglasses': 960, 'Brown sunglasses': 810 };
const inr = n => '₹' + n.toLocaleString('en-IN');
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(F => {
    try { localStorage.setItem('bj.music', '0'); localStorage.setItem('bj.autoplay', '0'); } catch (e) {}
    const st = window.setTimeout, si = window.setInterval;
    window.setTimeout = (fn, ms = 0, ...a) => st(fn, ms / F, ...a);
    window.setInterval = (fn, ms = 0, ...a) => si(fn, ms / F, ...a);
    if (window.speechSynthesis) { const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { u.volume = 0; u.rate = Math.min(10, F); s(u); }; }
    const play = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; return play.call(this); };
    // when the controller comes in: the word lit in Swifty's bubble then, and how long after the mall came; and whether
    // Swifty's dimmed introduction came (since 2026-10-30 only the first time: after a shop, the controller alone)
    window.__padIn = [];
    window.__mallIn = [];
    window.__intro = [];
    new MutationObserver(ms => ms.forEach(m => { const t = m.target; if (!t.classList) return;
      if (t.dataset && t.dataset.scene === 'mallfloor' && t.classList.contains('is-active') && !/is-active/.test(m.oldValue || '')) window.__mallIn.push(performance.now());
      if (t.dataset && t.dataset.scene === 'mallfloor' && t.classList.contains('is-introducing') && !/is-introducing/.test(m.oldValue || '')) window.__intro.push(performance.now());
      if (t.classList.contains('joy2') && m.oldValue && /is-away/.test(m.oldValue) && !t.classList.contains('is-away')) {
        const w = document.querySelector('.scene.is-active .b-word.is-now'); const b = document.querySelector('.scene.is-active .bubble');
        window.__padIn.push({ at: performance.now(), word: w ? w.textContent : null, bubble: b ? b.textContent.replace(/\s+/g, ' ').trim() : null }); } }))
      .observe(document, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
  }, F);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_ABORTED/.test(m.text())) errors.push(m.text()); });
  await page.goto(GAME);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const active = () => page.evaluate(() => document.querySelector('.scene.is-active:not(.is-leaving)')?.dataset.scene);
  const pos = () => page.evaluate(() => { const w = document.querySelector('.scene.is-active:not(.is-leaving) .tw'); if (!w) return null; const m = w.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/); return m ? [+m[1], +m[2]] : null; });
  const hold = async (keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };
  const until = async (fn, arg, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = await page.evaluate(fn, arg); if (v) return v; await page.waitForTimeout(80); } return null; };
  const mid = sel => page.evaluate(sel => { const b = document.querySelector(sel).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const walkTo = async ([tx, ty]) => {
    for (let n = 0; n < 120; n++) {
      if ((await active()) !== 'mallfloor') return;
      const p = await pos(); if (!p) return;
      const dx = tx - p[0], dy = ty - p[1];
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
      const keys = [];
      if (Math.abs(dx) >= 14) keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      if (Math.abs(dy) >= 14) keys.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
      await hold(keys, Math.min(500, Math.max(60, Math.max(Math.abs(dx), Math.abs(dy)) * 4)));
    }
  };
  const priceRight = async () => {
    if (!await until(() => { const q = document.querySelector('.scene.is-active .qcard-pos--deal'); return q && [...q.querySelectorAll('.q-opt')].some(o => !o.disabled); })) return console.log('   no price card');
    const { name, labels } = await page.evaluate(() => { const q = document.querySelector('.scene.is-active .qcard-pos--deal'); return { name: q.querySelector('.qd-name').textContent, labels: [...q.querySelectorAll('.q-label')].map(x => x.textContent.trim()) }; });
    await page.mouse.click(...await mid(`.scene.is-active .qcard-pos--deal .q-opt:nth-child(${labels.indexOf(inr(NAMES[name])) + 1})`));
    await until(() => !document.querySelector('.scene.is-active .qcard-pos--deal'));
  };
  const i = await page.evaluate(() => [...document.querySelectorAll('.scene')].findIndex(s => s.dataset.scene === 'mallfloor'));
  await page.evaluate(i => document.querySelectorAll('.scene-item')[i].click(), i);
  let visit = 0;
  for (const [shop, [a, b]] of Object.entries(DOORS)) {
    visit++;
    await until(() => document.querySelector('.scene.is-active:not(.is-leaving)')?.dataset.scene === 'mallfloor');
    await page.waitForTimeout(300);
    const early = await page.evaluate(() => { const j = document.querySelector('.scene.is-active .joy2'); return j && j.classList.contains('is-away'); });
    await page.screenshot({ path: `${OUT}/mall-${visit}-before.jpg`, type: 'jpeg', quality: 70 });
    await until(() => { const j = document.querySelector('.scene.is-active .joy2'); return j && !j.classList.contains('is-away'); });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/mall-${visit}-controller.jpg`, type: 'jpeg', quality: 70 });
    const { padIn, after, intro } = await page.evaluate(() => {
      const padIn = window.__padIn.at(-1), came = window.__mallIn.at(-1);
      return { padIn, after: padIn && came ? Math.round(padIn.at - came) : null, intro: window.__intro.some(t => t >= came) };
    });
    console.log(`mall, visit ${visit}: Swifty's dimmed introduction: ${intro}; ` + (intro
      ? `the controller hidden at first: ${early}; it came in on the word "${padIn && padIn.word}" of "${padIn && padIn.bubble}"`
      : `the controller came in ${after} ms after the mall (timers ${F}× fast)${padIn && padIn.bubble ? `, with a bubble: "${padIn.bubble}"` : ', no bubble'}`));
    const along = [b[0] - a[0], b[1] - a[1]]; const len = Math.hypot(...along);
    const inward = [along[1] / len, -along[0] / len];
    const midDoor = [(a[0] + b[0]) / 2 * K, (a[1] + b[1]) / 2 * K];
    await walkTo([960, 700]);
    await walkTo([midDoor[0] - inward[0] * 50, midDoor[1] - inward[1] * 50]);
    const keys = ['ArrowUp']; if (inward[0] < -0.3) keys.push('ArrowLeft'); if (inward[0] > 0.3) keys.push('ArrowRight');
    let zoom = null;
    for (let n = 0; n < 8 && (await active()) === 'mallfloor' && !zoom; n++) {
      for (const k of keys) await page.keyboard.down(k);
      for (let m = 0; m < 12 && !zoom; m++) {
        await page.waitForTimeout(60);
        zoom = await page.evaluate(() => { const s = document.querySelector('.scene[data-scene="mallfloor"]'); const w = s.querySelector('.scene-world'); const tr = getComputedStyle(w).transform; const sc = tr && tr !== 'none' ? +tr.match(/matrix\(([-\d.]+)/)[1] : 1; return sc > 1.15 ? sc : null; });
      }
      for (const k of keys) await page.keyboard.up(k);
    }
    if (zoom) { await page.screenshot({ path: `${OUT}/enter-${shop}.jpg`, type: 'jpeg', quality: 70 }); }
    const inShop = await until(id => document.querySelector('.scene.is-active:not(.is-leaving)')?.dataset.scene === id, shop, 20000);
    const boy = await page.evaluate(() => { const w = document.querySelector('.scene[data-scene="mallfloor"] .tw'); return w ? +getComputedStyle(w).opacity : null; });
    console.log(`   ${shop}: into it ${!!inShop}; the camera moved in (scale ${zoom ? zoom.toFixed(2) : 'none'}); the boy's opacity as it ended ${boy}`);
    if (!inShop) continue;
    await until(() => [...document.querySelectorAll('.scene.is-active .deal-spot')].length === 2 && [...document.querySelectorAll('.scene.is-active .deal-spot')].every(b => parseFloat(getComputedStyle(b).opacity) > 0.95));
    await page.waitForTimeout(400);
    await page.mouse.click(...await mid(`.scene.is-active .deal-spot:nth-of-type(1)`));
    await priceRight(); await priceRight();
    // (since 2026-10-29 the Buys come under the two once both prices are found: wait till they are there)
    await until(i => { const b = document.querySelector(`.scene.is-active:not(.is-leaving) .dc-buy[data-deal="${i}"]`); return b && !b.disabled && parseFloat(getComputedStyle(b).opacity) > 0.95; }, BEST[shop], 60000);
    await page.waitForTimeout(300);
    await page.mouse.click(...await mid(`.scene.is-active:not(.is-leaving) .dc-buy[data-deal="${BEST[shop]}"]`));
    await until(() => document.querySelector('#btn-next').classList.contains('is-ready'), null, 90000);
    console.log(`   bought; wallet ${await page.evaluate(() => document.querySelector('.scene.is-active .ph-amount')?.textContent)}`);
    await page.click('#btn-next');
    await page.waitForTimeout(1500);
  }
  const came = await until(() => document.querySelector('.scene.is-active:not(.is-leaving)')?.dataset.scene === 'fitcheck');
  console.log('after the last buy:', came ? 'fitcheck' : await active());
  await until(() => document.querySelector('#btn-next').classList.contains('is-ready'), null, 40000);
  await page.click('#btn-next');
  // (the dance at the party comes between the fit check and the end since 2026-10-28)
  if (await until(() => document.querySelector('.scene.is-active:not(.is-leaving)')?.dataset.scene === 'dancing', null, 8000)) {
    await until(() => document.querySelector('#btn-next').classList.contains('is-ready'), null, 60000);
    await page.click('#btn-next');
  }
  await until(() => !!document.querySelector('.scene.is-active .pt-left') && parseFloat(getComputedStyle(document.querySelector('.scene.is-active .pt-left')).opacity) > 0.95);
  console.log('the end:', (await page.evaluate(() => [...document.querySelectorAll('.scene.is-active .pt-sum')].map(n => n.textContent.replace(/\s+/g, ' ').trim()))).join(' | '));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(0);
})();
