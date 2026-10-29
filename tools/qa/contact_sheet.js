// Every screen, silent: a picture of each `at` seconds in (autoplay off, so it stays), for looking at them all at
// once (OUT/<n>-<id>.png; put them on a sheet with ffmpeg's tile).   node tools/qa/contact_sheet.js OUT [at]
const fs = require('fs');
const { chromium, GAME, LAUNCH, silent } = require('./browser');
const [OUT, AT = '6'] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch(LAUNCH);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(silent, false);
  await page.goto(GAME);
  await page.waitForSelector('#loader.is-done', { timeout: 60000 });
  const ids = await page.evaluate(() => [...document.querySelectorAll('.scene')].map(s => s.dataset.scene));
  for (const [i, id] of ids.entries()) {
    await page.evaluate(i => document.querySelectorAll('.scene-item')[i].click(), i);
    await page.waitForSelector(`.scene[data-scene="${id}"].is-active`, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(+AT * 1000);
    await page.screenshot({ path: `${OUT}/${String(i + 1).padStart(2, '0')}-${id}.png` });
  }
  await browser.close();
  process.exit(0);
})();
