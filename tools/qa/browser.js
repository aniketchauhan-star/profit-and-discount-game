// The QA scripts' shared start: Playwright (the project's, the PLAYWRIGHT path, or the one npx keeps), the game's
// index.html (wherever the project is), and the page made silent: no music, no voices heard, every film and clip muted
// (nothing may be heard while testing: the user's rule). Each script: node tools/qa/<script>.js OUT [screen ids …]
const path = require('path');

function playwright() {
  const tries = [process.env.PLAYWRIGHT, 'playwright', path.join(process.env.HOME || '', '.npm/_npx/db89d7302a373f10/node_modules/playwright')];
  for (const m of tries) {
    if (!m) continue;
    try { return require(m); } catch (e) { /* the next */ }
  }
  throw new Error('Playwright not found: npm i -D playwright (then npx playwright install chromium), or set PLAYWRIGHT to its folder');
}

const { chromium } = playwright();
const GAME = 'file://' + encodeURI(path.resolve(__dirname, '..', '..', 'index.html'));
const LAUNCH = { headless: true, args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] };

// For page.addInitScript: music off, autoplay as asked, the device's speech at volume 0, media muted when played.
function silent(autoplay) {
  try {
    localStorage.setItem('bj.music', '0');
    localStorage.setItem('bj.autoplay', autoplay ? '1' : '0');
  } catch (e) { /* (private window) */ }
  if (window.speechSynthesis) {
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = u => { u.volume = 0; window.__tts = (window.__tts || []).concat(u.text); speak(u); };
  }
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { this.muted = true; this.volume = 0; return play.call(this); };
}

module.exports = { chromium, GAME, LAUNCH, silent };
