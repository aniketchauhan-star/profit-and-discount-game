// Each shop, silent and sped up, pressed with the mouse: tap a thing; its price card (wrong answers: Swifty's hints on
// the left, then the answer; or right at once); the other's; then a wrong Buy, then the right one. Logs the light's
// window, the red glow on a wrong answer, and any overlap.   node tools/qa/shops.js OUT [F]
const { chromium, GAME, LAUNCH } = require('./browser');
const fs = require('fs');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const F = +(process.argv[3] || 3);
const PAY = { shirtshop: [960, 850], pantsshop: [1260, 1300], watchshop: [1600, 1550], sunshop: [960, 810] };
const BEST = { shirtshop: 1, pantsshop: 0, watchshop: 1, sunshop: 1 };
const PLAN = { shirtshop: { first: 0, wrongs: [2, 1] }, pantsshop: { first: 1, wrongs: [1, 1] }, watchshop: { first: 1, wrongs: [0, 2] }, sunshop: { first: 0, wrongs: [0, 0] } };
const inr = n => '₹' + n.toLocaleString('en-IN');
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(F => { try { localStorage.setItem('bj.music', '0'); localStorage.setItem('bj.autoplay', '0'); } catch (e) {}
    const st = window.setTimeout; window.setTimeout = (fn, ms = 0, ...a) => st(fn, ms / F, ...a);
    if (window.speechSynthesis) { const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { u.volume = 0; u.rate = Math.min(10, F); s(u); }; }
    const play = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; try { this.playbackRate = F; } catch (e) {} return play.call(this); };
    window.__glows = 0; const an = Element.prototype.animate; Element.prototype.animate = function (...a) { if (this.classList && this.classList.contains('wrong-glow')) window.__glows++; return an.apply(this, a); }; }, F);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: F });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(GAME);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const state = () => page.evaluate(() => {
    const s = document.querySelector('.scene.is-active:not(.is-leaving)');
    const vis = n => n && parseFloat(getComputedStyle(n).opacity) > 0.9;
    const b = [...s.querySelectorAll('.bubble')].find(vis);
    const q = s.querySelector('.qcard-pos--deal');
    const opts = q ? [...q.querySelectorAll('.q-opt')].map(o => ({ label: o.querySelector('.q-label').textContent.trim(), on: !o.disabled, cls: o.className })) : [];
    const v = s.querySelector('.focus-veil.is-on');
    const u = v ? decodeURIComponent(v.style.maskImage || '') : '';
    return {
      id: s.dataset.scene, veil: !!v,
      holes: [...u.matchAll(/<rect x='([-\d.]+)' y='([-\d.]+)' width='([\d.]+)' height='([\d.]+)'/g)].map(m => m.slice(1).map(Number).map(Math.round)),
      glows: window.__glows,
      birdX: (() => { const bd = [...s.querySelectorAll('.bird')].pop(); return bd ? Math.round(bd.getBoundingClientRect().left) : null; })(),
      bubble: b ? b.textContent.replace(/\s+/g, ' ').trim() : '',
      card: !!q, opts, cardText: q ? q.querySelector('.qcard').textContent.replace(/\s+/g, ' ') : '',
      prices: [...s.querySelectorAll('.dc-pay')].filter(vis).map(n => n.textContent),
      dc: !!s.querySelector('.dc') && vis(s.querySelector('.dc')), buys: [...s.querySelectorAll('.dc-buy')].map(x => !x.disabled),
      paid: !!s.querySelector('.dc.is-paid'), wallet: s.querySelector('.ph-amount')?.textContent,
      ready: document.querySelector('#btn-next').classList.contains('is-ready'),
    };
  });
  const overlaps = () => page.evaluate(() => {
    const s = document.querySelector('.scene.is-active:not(.is-leaving)');
    const vis = n => parseFloat(getComputedStyle(n).opacity) > 0.05 && getComputedStyle(n).visibility !== 'hidden';
    const box = n => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
    const things = [];
    s.querySelectorAll('.bubble svg').forEach(n => { if (vis(n.closest('.bubble'))) things.push(['bubble', box(n)]); });
    s.querySelectorAll('.dc-buy').forEach(n => { if (vis(n)) things.push(['buy', box(n)]); });
    s.querySelectorAll('.qcard').forEach(n => things.push(['qcard', box(n)]));
    s.querySelectorAll('.dc-card').forEach(n => { if (vis(n.closest('.dc'))) things.push(['dealcard', box(n)]); });
    const out = [];
    for (let i = 0; i < things.length; i++) for (let j = i + 1; j < things.length; j++) {
      const [a, A] = things[i], [b, B] = things[j];
      if (a === b && a !== 'price') continue;
      if ([a, b].sort().join() === 'dealcard,qcard') continue; // (by design: the next question card covers the price card while it asks)
      const w = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), h = Math.min(A[3], B[3]) - Math.max(A[1], B[1]);
      if (w > 0 && h > 0) out.push(`${a}×${b} ${Math.round(w)}×${Math.round(h)}`);
    }
    return out;
  });
  const seen = new Set();
  const check = async tag => { const o = await overlaps(); o.forEach(x => { const k = tag + ' ' + x; if (!seen.has(k)) { seen.add(k); console.log('   OVERLAP', k); } }); };
  const until = async (fn, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { const st = await state(); if (fn(st)) return st; await check(st.id); await page.waitForTimeout(80); } console.log('   TIMEOUT', fn.toString()); return state(); };
  const mid = sel => page.evaluate(sel => { const b = document.querySelector(sel).getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const shot = async name => { await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 72 }); };
  const answer = async (shop, i, nWrong) => {
    let st = await until(s => s.card && s.opts.length === 3 && s.opts.some(o => o.on));
    await page.waitForTimeout(200); await shot(`${shop}-q${i}`);
    const right = inr(PAY[shop][i]);
    console.log(`   card ${i}: ${st.opts.map(o => o.label).join(' / ')} (right ${right}); light ${JSON.stringify(st.holes)}`);
    for (let w = 0; w < nWrong; w++) {
      st = await until(s => s.opts.some(o => o.on && o.label !== right));
      const k = st.opts.findIndex(o => o.on && o.label !== right);
      const g0 = st.glows;
      await page.mouse.click(...await mid(`.scene.is-active .qcard-pos--deal .q-opt:nth-child(${k + 1})`));
      await page.waitForTimeout(40); await shot(`${shop}-q${i}-wrong${w + 1}`);
      st = await until(s => s.bubble && !s.bubble.startsWith('Let’s'));
      await page.waitForTimeout(250); st = await state();
      console.log(`   wrong ${w + 1}: red glows ${st.glows - g0}; hint (Swifty at x ${st.birdX}): "${st.bubble}"; card has hint text: ${/Not quite|=/.test(st.cardText)}`);
      await shot(`${shop}-q${i}-hint${w + 1}`);
      st = await until(s => !s.bubble && (w === 1 ? s.opts.some(o => /is-correct/.test(o.cls)) : s.opts.some(o => o.on)));
    }
    if (nWrong < 2) {
      st = await until(s => s.opts.some(o => o.on && o.label === right));
      const k = st.opts.findIndex(o => o.label === right);
      await page.mouse.click(...await mid(`.scene.is-active .qcard-pos--deal .q-opt:nth-child(${k + 1})`));
    }
    st = await until(s => !s.card);
    console.log(`   prices under: ${st.prices.join(' | ')}`);
  };
  for (const shop of ['shirtshop', 'pantsshop', 'watchshop', 'sunshop']) {
    console.log(shop);
    await page.evaluate(id => { const i = [...document.querySelectorAll('.scene')].findIndex(s => s.dataset.scene === id); document.querySelectorAll('.scene-item')[i].click(); }, shop);
    let st = await until(s => s.id === shop && s.bubble.startsWith('Tap'));
    await page.waitForTimeout(300); st = await state(); console.log(`   asks: "${st.bubble}"`); await shot(`${shop}-1-asks`);
    st = await until(s => !s.bubble && s.veil); await page.waitForTimeout(300); await shot(`${shop}-2-firstlook`); console.log(`   first look: light ${JSON.stringify((await state()).holes)}`);
    const { first, wrongs } = PLAN[shop];
    await page.mouse.click(...await mid(`.scene.is-active .deal-spot:nth-of-type(${first + 1})`));
    await answer(shop, first, wrongs[0]);
    st = await until(s => s.bubble.startsWith('Let’s'));
    await page.waitForTimeout(300); st = await state(); console.log(`   next: "${st.bubble}"`); await shot(`${shop}-3-next`);
    await answer(shop, 1 - first, wrongs[1]);
    st = await until(s => s.dc && s.bubble.startsWith('Which'));
    await page.waitForTimeout(300); await shot(`${shop}-4-which`); console.log(`   comparing: light ${JSON.stringify((await state()).holes)}`);
    const best = BEST[shop];
    st = await until(s => s.dc && s.buys.every(Boolean) && !s.bubble);
    if (shop !== 'sunshop') {
      const g0 = st.glows;
      await page.mouse.click(...await mid(`.scene.is-active .dc-buy[data-deal="${1 - best}"]`));
      await page.waitForTimeout(40); await shot(`${shop}-5-wrongbuy`);
      st = await until(s => s.bubble.startsWith('Not quite'));
      console.log(`   wrong Buy: red glows ${st.glows - g0}; "${st.bubble}"`);
      st = await until(s => !s.bubble);
    }
    await page.mouse.click(...await mid(`.scene.is-active .dc-buy[data-deal="${best}"]`));
    st = await until(s => s.bubble.startsWith('Correct')); console.log(`   "${st.bubble}"`); await page.waitForTimeout(300); await shot(`${shop}-6-correct`);
    st = await until(s => s.paid && s.bubble.startsWith('Great')); await page.waitForTimeout(500); await shot(`${shop}-7-bought`);
    st = await until(s => s.ready); console.log(`   bought: wallet ${st.wallet}`);
  }
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(0);
})();
