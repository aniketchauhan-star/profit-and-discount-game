// Every line said on a film, in real time and silent: when its voice starts talking (the clip's 0.30 s lead after
// play(), less any #t= start) against the film's own clock, and where that line's lips start in the film (its cue in
// js/video_clips.js). Also the gap after each line before the next one (or the film's end).   node tools/qa/lipsync.js MAP.json
const { chromium, GAME, LAUNCH } = require('./browser');
const fs = require('fs');
const MAP = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // { voNNN: [film, line] }
const SCREENS = [...new Set(Object.values(MAP).map(([f]) => f))];
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => {
    try { localStorage.setItem('bj.music', '0'); localStorage.setItem('bj.autoplay', '1'); } catch (e) {}
    if (window.speechSynthesis) { const s = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { u.volume = 0; s(u); }; }
    window.__said = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.muted = true; this.volume = 0;
      const src = this.getAttribute('src') || this.src || ''; // (currentSrc still names the clip before, as play() starts)
      if (/assets\/vo\/vo\d+\.ogg/.test(src)) {
        const s = document.querySelector('.scene.is-active:not(.is-leaving)');
        const v = s && s.querySelector('video');
        const m = src.match(/(vo\d+)\.ogg(?:#t=([\d.]+))?/);
        window.__said.push({ vo: m[1], from: +(m[2] || 0), scene: s && s.dataset.scene, film: v ? v.currentTime : null, paused: v ? v.paused : null, at: performance.now() });
      }
      return play.call(this);
    };
  });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(GAME);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const clips = await page.evaluate(() => VIDEO_CLIPS);
  const rows = [];
  for (const id of SCREENS) {
    await page.evaluate(id => { window.__said = []; const i = [...document.querySelectorAll('.scene')].findIndex(s => s.dataset.scene === id); document.querySelectorAll('.scene-item')[i].click(); }, id);
    const film = clips[id];
    const want = Object.entries(MAP).filter(([, [f]]) => f === id);
    const t0 = Date.now();
    // till its lines are all said and the film has ended (or a minute)
    while (Date.now() - t0 < 60000) {
      const done = await page.evaluate(([id, n]) => {
        const s = document.querySelector(`.scene[data-scene="${id}"]`);
        const v = s && s.querySelector('video');
        return window.__said.filter(x => x.scene === id).length >= n && (!v || v.ended || v.currentTime >= v.duration - 0.05);
      }, [id, want.length]);
      if (done) break;
      await page.waitForTimeout(150);
    }
    const said = await page.evaluate(id => window.__said.filter(x => x.scene === id), id);
    const cues = Object.entries(film.lines).sort((a, b) => a[1] - b[1]);
    for (const [vo, [, line]] of want) {
      const x = said.find(s => s.vo === vo);
      const cue = film.lines[line];
      if (!x || x.film === null) { rows.push(`${id.padEnd(10)} ${line.padEnd(12)} ${vo}  NOT SAID ON THE FILM`); continue; }
      const start = x.film + (0.30 - x.from); // (its lead, less where it started in)
      const k = cues.findIndex(([l]) => l === line);
      const next = k + 1 < cues.length ? cues[k + 1][1] : film.seconds;
      rows.push(`${id.padEnd(10)} ${line.padEnd(12)} ${vo}  voice ${start.toFixed(2)} s, lips ${cue.toFixed(2)} s: ${((start - cue) * 1000).toFixed(0).padStart(5)} ms  (next at ${next.toFixed(2)} s)`);
    }
  }
  console.log(rows.join('\n'));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(0);
})();
