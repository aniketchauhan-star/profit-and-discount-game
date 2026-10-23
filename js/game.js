/* ==========================================================================
   Bookstore Journey — scenes, story timeline and navigation
   ========================================================================== */
(function () {
  'use strict';

  const { el, CANCELLED } = FX;
  const STAGE_W = 1920;
  const STAGE_H = 1080;
  const ASSETS = 'game assets/';
  const reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = sel => document.querySelector(sel);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Teaching pace for the whole story: 1 = brisk, 1.5 = calm (current). It stretches every pause,
  // letter-by-letter typing and panel/card reveal; walking, flying, pops and button feedback keep their
  // own speed, and so does changing screens (the auto-advance hold and the cross-fade, see FADE_MS).
  const PACE = 1.5;
  FX.setPace(PACE);

  // Clean strip cut from "aniket walking sprite sheet.png": every frame cut along its own outline
  // and aligned on the head/torso and the floor line, with a 16px gap between frames.
  // Aniket walking (FX.Walker): his figure as a jointed cutout, made by tools/make_walk_rig.py from the first frame of the
  // old walk sheet (sprites/aniket-walk-clean.png), whose frame coordinates it keeps. anchorX, baselineY: the point on
  // the floor the screens place him by (as the sheet's frames had it); hip, knee, ankle: the joints; ground: the floor.
  const WALK_RIG = {
    src: ASSETS + 'sprites/aniket-rig.png',
    frameW: 358, frameH: 614, anchorX: 166, baselineY: 612,
    hip: [200, 355], knee: [215, 476], ankle: [234, 580], ground: 610,
    pieces: { // [atlas x, y, w, h, frame x, y], as tools/make_walk_rig.py prints them
      upper: [0, 0, 216, 350, 53, 10],
      hips: [220, 0, 124, 90, 117, 323],
      thigh: [348, 0, 74, 152, 166, 351],
      shin: [426, 0, 75, 134, 191, 451],
      shoe: [505, 0, 107, 48, 204, 564],
      thighFar: [616, 0, 74, 152, 166, 351],
      shinFar: [694, 0, 75, 134, 191, 451],
      shoeFar: [773, 0, 107, 48, 204, 564],
    },
    // The walk (frame px): two steps of 150 a cycle; each foot planted for 60% of it, landing 80 ahead of the hip, heel
    // first (toe up 14°, rolling down by 8% of the cycle), heel up onto the ball from 42% (to 32°), then swinging in an
    // arc 16 high. The heel and the ball are 26 behind and 52 ahead of the ankle. He stands (and sets off and stops)
    // 15% into a cycle: one foot planted a little ahead of him, the other down 55 behind (as the drawing stands).
    gait: {
      cycle: 300, stance: 0.6, heelStrike: 80, roll: 0.08, heelOff: 0.42, lift: 16,
      toeUp: 14 * Math.PI / 180, heelUp: 32 * Math.PI / 180, heel: -26, ball: 52, stop: 0.15, standBack: -55,
    },
  };

  // Swifty, the teal bird with a backpack: clean strips cut from "bird fly .png" and "bird talk .png"
  // the same way (each frame cut along its own outline, all frames lined up), 16px gap between frames.
  const SWIFTY = {
    fly: {
      src: ASSETS + 'sprites/swifty-fly.png', frameW: 486, frameH: 374, gutter: 16,
      anchorX: 291, anchorY: 197,           // centre of her body
      bodyR: 116,                           // body radius, to match her size to the standing strip
      loop: [0, 1, 2, 3, 4, 5, 6, 7],
      flap: 3,                              // downstroke → wing-beat sound
    },
    stand: {
      src: ASSETS + 'sprites/swifty-talk.png', frameW: 425, frameH: 408, gutter: 16,
      anchorX: 205, anchorY: 406,           // between her feet
      bodyY: 209, bodyR: 134,               // body centre above her feet, body radius
      crestY: 400,                          // the tip of her head feathers above her feet (the tallest frame)
      idle: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5], // stands still, with a happy blink now and then
      talk: [1, 0, 2, 0, 4, 6, 0, 3, 1, 0], // beak opens and closes, wings gesture
      land: [3, 2, 1, 0],                   // wings settle after touching down
      wave: [2, 3, 3, 2, 1],
      hop: 3,                               // wings up, about to fly
      point: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5], // one wing stretched out to her left (a blink now and then)
    },
  };

  // Pictures for the definitions panel, cropped from the scene artwork.
  const ART = {
    money: ASSETS + 'ui/money-in-hand.png',
    book: ASSETS + 'ui/book.png',
  };

  // The counter picture once more, with Aniket puzzled by the word "discount": it lines up exactly with
  // "aniket give a book to shopkepper.png" (only his face differs), so it can fade in over it.
  const PUZZLED = ASSETS + 'what is discount.png';

  // Sheets: the teaching screens are on one big cream panel that fills the screen (`sheet: 'panel'`, drawn by the
  // game: see buildScenes), with no picture behind it. A sheet slides up over the story picture before it, and
  // back down after (see slide); between two sheets only what is on them changes. Swifty's stand, a stack of
  // books (STAND, cut out of an illustration), sits in the bottom-right corner; she stands on it (CORNER).
  const STAND = ASSETS + 'ui/book-stack.png';

  // Shapes on the artwork (stage px).
  const TITLE_PLATE = [[410, 150], [740, 150], [745, 280], [985, 280], [1010, 330], [1010, 470], [960, 535], [290, 535], [245, 470], [250, 300], [405, 285]];
  const START_AT = [567, 640]; // the Start button's centre: under the title, between the planter and Aniket's hand and bags
  const SHOP_SIGN = [[380, 148], [1885, 18], [1885, 172], [380, 292]];
  const MONEY = [[896, 534], [1011, 477], [1040, 498], [1062, 514], [1062, 612], [942, 624], [930, 600], [896, 560]];
  const PRICE_TAG = { x: 975, y: 404, text: '₹800', radius: 72 }; // small ₹800 just above the money
  const STICKER = { shock: { x: 1108, y: 868, r: 106 } }; // ₹1000 on the cover

  // Where Swifty stands (her feet) on the teaching screens: on her stand in the bottom-right corner, with the panel
  // on her left and her speech bubbles above her head (kept between CORNER.bubbles). She stays there from
  // one screen to the next.
  const CORNER = { x: 1725, y: 910, s: 0.8, bubbles: [1380, 1848] }; // both feet on the top book; her bubbles stay on the panel's paper, clear of its edge
  // On the shoe shop's picture with only the stand sharp (screens 23–27, standFocus), her bubbles keep clear of the
  // sneakers (with the ₹1800 tag on them) and the 30% OFF tag (the user, 2026-10-22: her bubble was over the shoes).
  const STAND_CLEAR = [[1036, 452, 1618, 692], [1124, 711, 1442, 844]];

  // The review's new look, tried first on screens 8–19 (`v2: true`; css: .is-v2): calmer dialogue boxes and panels, fewer
  // colours, and on a teaching screen the story picture it came from stays in view as a framed snapshot in the top-left
  // corner (SNAP; `snap`: that picture), with the screen's title beside it (`head`). Into such a screen the story picture
  // shrinks into the frame; out of it, the frame grows back into the next picture (see shrinkInto, growOut).
  const SNAP = { x: 96, y: 116, w: 600, h: 338 }; // (top left, now that no title is over it; big: the user, 2026-10-22)

  // Keep-clear areas on the story pictures (the revamp, rule 2): faces, prices, tags and the book, [left, top, right, bottom]
  // in the picture's px. A speech bubble on the picture moves around them (FX.bubble: avoid).
  const KEEP_CLEAR = {
    home: [[500, 48, 758, 276], [1273, 185, 1500, 412]],                                  // Aniket's face, his father's
    browse: [[630, 79, 903, 352], [888, 382, 1161, 639]],                                 // Aniket's head, the book
    ask: [[530, 164, 773, 406], [742, 482, 939, 694], [1288, 164, 1515, 406]],            // Aniket, the book, the shopkeeper
    shock: [[STICKER.shock.x - 106, STICKER.shock.y - 106, STICKER.shock.x + 106, STICKER.shock.y + 106], [1509, 133, 1812, 406]],
    sneakers: [[436, 73, 664, 345], [1045, 446, 1540, 648], [1088, 679, 1406, 800]],     // Aniket, the sneakers and ₹1800, 30% OFF
    confused: [[342, 79, 600, 382], [1248, 558, 1444, 710], [1116, 701, 1452, 855]],     // Aniket, the ₹1800 tag, 30% OFF
    offmeans: [[342, 79, 600, 382], [1248, 558, 1444, 710], [1116, 701, 1452, 855]],     // (the same picture)
    final: [[436, 73, 664, 345], [1224, 558, 1406, 648], [1088, 679, 1406, 800]],        // Aniket, the two tags
    return: [[373, 73, 600, 315], [1327, 194, 1600, 436]],                                // Aniket, his father
    school: [[364, 127, 606, 370], [1303, 127, 1545, 370]],
    money: [[285, 67, 573, 370], [1270, 97, 1542, 370], [830, 370, 1179, 642]],          // his father, Aniket, the money
    deal: [[433, 218, 691, 491], [1236, 36, 1479, 309]],
  };

  // Aniket's questions, carried from the story to the top of the teaching screens that answer them (the revamp, Part 2:
  // screen 16, and 26–34, where 34 answers it).

  // Camera for screens with a card on the right (the question, the reduction): both characters
  // stay in view on the left. QUIZ_DRIFT is where its slow drift goes.
  const QUIZ_CAMERA = 'translateX(-282px) scale(1.04)';
  const QUIZ_DRIFT = 'translateX(-290px) scale(1.055)';

  // Screens 43 and 44 share one view (only Aniket's hands change), and so one slow drift: the fade between them
  // carries the camera over.
  const KB_TABLE = { origin: '55% 40%', from: 'scale(1.02)', to: 'scale(1.05) translate(-4px, 3px)' };

  // The shopping game's four streets (screens 48–51), as the scene list names them.
  const ROUND_TITLES = [['Uniform Street', 'School Uniform: three shops'], ['Shoe Street', 'School Shoes: three shops'],
    ['Bag Corner', 'School Bag: three shops'], ['Bottle Stop', 'Water Bottle: the final challenge']];

  const SCENES = [
    {
      id: 'title', title: 'Start', sub: 'Bookstore Journey',
      bg: ASSETS + 'start screen.png',
      kb: { origin: '60% 45%', from: 'scale(1.02)', to: 'scale(1.07) translate(-10px, -6px)' },
      lamps: [[826, 96, 300], [1442, 134, 320]],
      dust: [120, 140, 1000, 900],
      play: playTitle,
    },
    {
      id: 'home', title: 'Talking to Dad', sub: 'Dad, I want to buy a book and a new pair of sneakers…',
      bg: ASSETS + 'starting boy talking with father.png',
      kb: { origin: '50% 28%', from: 'scale(1.02)', to: 'scale(1.05) translate(-4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[288, 360, 320]],    // the daylight through the open door
      dust: [180, 120, 1100, 760], // specks floating in the sunlight
      play: playHome,
    },
    {
      id: 'outside', title: 'The Bookstore', sub: 'Aniket walks to the store',
      bg: ASSETS + 'book store outside view.png',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]], // the wall lamp; ceiling lights behind the glass
      dust: [420, 260, 1840, 820],
      exit: 'zoom', zoomOrigin: '52% 56%', // into the next screen (Aniket with the book): the camera pushes into the store while fading
      play: playOutside,
    },
    {
      id: 'browse', title: 'An Interesting Book', sub: 'This book looks interesting!',
      bg: ASSETS + 'aniket hold the book scene.png',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      shot: 'shelf',
      setup: standTitles,
      play: playBrowse,
    },
    {
      id: 'ask', title: 'How Much?', sub: 'How much is this book?',
      bg: ASSETS + 'aniket give a book to shopkepper.png',
      kb: { origin: '50% 38%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' },
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      play: playAsk,
    },
    {
      id: 'shock', title: 'The Printed Price', sub: 'Oh! The price printed on it is ₹1000.',
      bg: ASSETS + 'shocked aniket.png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover',
      play: playShock,
    },
    {
      id: 'mp', title: 'Marked Price', sub: 'The price printed on an item is its marked price',
      // On the story picture (the user, 2026-10-22): the camera moves in on the book, everything blurs but its price tag,
      // and Swifty comes in from the right to say what it is, on a panel (see setupMarked, playMarked).
      bg: ASSETS + 'shocked aniket.png',
      kb: null, origin: '55% 80%', still: true, // (the camera of screen 7, carried over: the same origin; no parallax)
      lamps: [[1292, 128, 300]], dust: [150, 60, 1500, 760],
      shot: 'cover',
      setup: setupMarked,
      play: playMarked,
    },
    {
      id: 'mpcard', title: 'The Book’s Marked Price', sub: 'The marked price of the book is —',
      // The user's doc (2026-10-23): a question card, on the book as screen 6 ends (the camera on it, all blurred but its
      // ₹1000 tag); a wrong answer: "Check the price printed on the book.", and another try.
      bg: ASSETS + 'shocked aniket.png',
      kb: null, origin: '55% 80%', still: true,
      lamps: [[1292, 128, 300]], dust: [150, 60, 1500, 760],
      shot: 'cover-tag',
      setup: setupMpCard,
      play: playMpCard,
    },
    {
      id: 'reveal', title: 'I Gave You a Discount', sub: 'Printed ₹1000, but selling it at ₹800',
      bg: ASSETS + 'aniket give a book to shopkepper.png',
      kb: { origin: '50% 46%', from: QUIZ_CAMERA, to: QUIZ_DRIFT }, // framed left, like the question screen
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      backdrop: true, // the picture is shifted left: a soft blurred copy fills in past its right edge
      shot: 'counter-talk', // screen 15 carries on from this exact picture
      setup: scene => instantly(scene, () => scene.el.classList.add('is-feathered')),
      play: playReveal,
    },
    {
      id: 'discount', title: 'What Is a Discount?', sub: 'Discount? What is that?',
      bg: ASSETS + 'aniket give a book to shopkepper.png',
      react: PUZZLED, // fades in over the picture when he hears "discount" (see playDiscount)
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' },
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      backdrop: true,
      shot: 'counter-talk',
      glide: true, // coming from screen 14, the camera glides back from its framing (see glideCamera)
      setup: setupDiscount,
      play: playDiscount,
    },
    {
      id: 'dcard', title: 'How Much Discount?', sub: 'How much discount did Aniket get on the book?',
      // The user's doc (2026-10-23): a question card at the counter, as on the old Cost/Selling Price question (the camera
      // moves left to make room for it): it starts on screen 9's view (his puzzled face), so the change is seamless.
      bg: PUZZLED,
      kb: null, // this screen moves its own camera (see playDiscountCard)
      origin: '50% 46%', // the camera origin of screen 9
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      backdrop: true, // the camera pans left: a soft blurred copy fills in past the picture's right edge
      shot: 'counter-talk', // (carried over from screen 9: see playDiscountCard)
      play: playDiscountCard,
    },
    {
      // Back at the user's word (2026-10-23: "after screen 10 add this"): the formula with the book, then in short.
      id: 'formula', title: 'The Discount Formula', sub: 'Marked Price − Selling Price = Discount',
      snap: PUZZLED, snapFocus: [900, 520, 1.25],
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playFormula,
    },
    {
      id: 'formula-reveal', title: 'Formula Reveal', sub: 'D = MP − SP',
      snap: PUZZLED, snapFocus: [900, 520, 1.25],
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: scene => scene.snapEl.getAnimations().forEach(a => a.cancel()), // (its photo back in the corner: see playFormulaReveal)
      play: playFormulaReveal,
    },
    {
      id: 'pay', title: 'Thank You!', sub: 'The shopkeeper gives Aniket the book',
      bg: ASSETS + 'aniket give money to shopkeeper.png',
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.075)' },
      lamps: [[1408, 86, 330]],
      dust: [300, 60, 1500, 700],
      play: playPay,
    },
    {
      id: 'exit', title: 'Coming Out of the Bookstore', sub: 'The doors swing open and Aniket comes out',
      bg: ASSETS + 'book store outside view.png', // the bookstore from the mall, as on screen 3
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]], // the wall lamp; ceiling lights behind the glass
      dust: [420, 260, 1840, 820],
      shot: 'storefront', // the same view as the next screen, so the fade there changes nothing but what Aniket does
      setup: setupExit,
      play: playExit,
    },
    {
      id: 'leave', title: 'To the Shoe Shop', sub: 'Let’s help Aniket buy the sneakers!',
      bg: ASSETS + 'book store outside view.png',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]],
      dust: [420, 260, 1840, 820],
      shot: 'storefront',
      setup: setupLeave,
      play: playLeave,
    },
    {
      id: 'sneakers', title: 'The Shoe Shop', sub: 'Wow, nice sneakers! I love them.',
      bg: ASSETS + 'he saw a shoe.png', // Aniket at the stand, pointing at the sneakers: the picture his clips start on
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the price tags
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], // shelf lights, a ceiling light
      dust: [600, 40, 1900, 720],
      shot: 'point', // the same view as screen 23, so the change there is a plain dissolve
      setup: tentCard, // the ₹1800 card, as the picture has it
      play: playSneakers,
    },
    {
      id: 'shoe', title: 'Tagged Price', sub: 'Aniket points at the ₹1800 tag',
      bg: ASSETS + 'he saw a shoe.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the price tags
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], // shelf lights, a ceiling light
      dust: [600, 40, 1900, 720],
      shot: 'point', // the same view as screen 22; its clip then moves in on the tags
      play: playShoe,
    },
    {
      id: 'confused', title: 'The Price Tag', sub: 'The price tagged on it is ₹1800.',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: null, origin: '50% 50%', still: true, // (still: the question card after it is on the same view, so the change is a plain dissolve)
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      setup: setupConfused,
      play: playConfused,
    },
    {
      id: 'smcard', title: 'The Sneakers’ Marked Price', sub: 'The marked price of the sneakers is —',
      // The user's doc (2026-10-23): a question card on the shoe shop, all blurred but the sneakers and their tags, the
      // card on the left; a wrong answer: "Check the price tagged on the sneakers.", and another try.
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the card on the left
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus,
      cornerClear: STAND_CLEAR, // (her bubbles keep clear of the sneakers and their tags)
      play: playSneakerCard,
    },
    {
      id: 'offmeans', title: 'What Does 30% OFF Mean?', sub: 'If this is a discount, how much do I actually have to pay?',
      // The user's doc (2026-10-23): Aniket sees the 30% OFF tag and wonders; Swifty: "30% OFF means 30% discount here."
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: null, origin: '63% 66%', still: true, // (screen 19's camera origin: it ends on the same view, so that change is seamless)
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupConfused,
      play: playOffMeans,
    },
    {
      id: 'recall', title: 'Recall Percentages', sub: 'Let’s first recall how percentages work.',
      swifty: true,
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shop as screen 19 ends: the camera on the sneakers, the rest blurred
      kb: null, origin: '63% 66%', still: true, // (screen 19's camera origin, so the same view: a seamless cut)
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      shot: 'stand',
      setup: setupRecall,
      play: playRecall,
    },
    {
      id: 'percentrule', title: 'Percentage Rule', sub: 'a is what percent of b?',
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: setupPracticeStart, // (from screen 20 it begins on 20's view, then blurs all and eases out: see zoomOutOfShoes)
      play: playPercentRule,
    },
    {
      id: 'whatpercent', title: 'What Percent?', sub: '125 is what percent of 500?',
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: allBlur, // (the whole picture blurred, the panel in the middle: the user, 2026-10-22)
      play: playWhatPercent,
    },
    {
      id: 'check', title: 'Quick CFU', sub: '250 is what percent of 1000?',
      swifty: true,
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: allBlur, // (the whole picture blurred, the panel in the middle, as 22 and 23: the user, 2026-10-23)
      play: playCheck,
    },
    {
      id: 'topay', title: 'How Much to Pay?', sub: 'How much does Aniket have to pay?',
      swifty: true,
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the question on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus, // (blurred but the sneakers and their tags, from the first frame)
      cornerClear: STAND_CLEAR, // (her bubbles keep clear of the sneakers and their tags)
      play: playToPay,
    },
    {
      id: 'thirty', title: 'The Discount: 30% of ₹1800', sub: '30/100 × 1800 = ₹540',
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus, // (blurred but the sneakers and their tags, from the first frame)
      play: playThirty,
    },
    {
      id: 'paywork', title: 'The Amount to Pay', sub: 'SP = MP − Discount = ₹1260',
      swifty: true,
      bg: ASSETS + 'he is tinking to see the shoes.png', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus, // (blurred but the sneakers and their tags, from the first frame)
      cornerClear: STAND_CLEAR, // (her bubbles keep clear of the sneakers and their tags)
      play: playPayWork,
    },
    {
      id: 'final', title: 'Final Answer', sub: 'After a 30% discount, I will pay ₹1260.',
      bg: ASSETS + 'he saw a shoe.png', // the same view as screens 23–34: Aniket pointing at the tags
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: tentCard,
      play: playFinal,
    },
    {
      id: 'boxed', title: 'Here Are Your Sneakers', sub: 'The shopkeeper hands Aniket the sneakers in a box',
      bg: ASSETS + 'shopkeeper gives sneakers box.png',
      kb: { origin: '54% 56%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the box
      lamps: [[1760, 170, 240], [1760, 360, 240], [300, 85, 170]], // shelf lights, a ceiling light in the mall
      dust: [600, 40, 1900, 720],
      play: playBoxed,
    },
    {
      id: 'pctofmp', title: 'What Percent Is the Discount?', sub: '540 is what percent of 1800?',
      snap: ASSETS + 'he is tinking to see the shoes.png', snapFocus: [1300, 640, 2], swifty: true,
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playPercentOfMP,
    },
    {
      id: 'return', title: 'Back Home', sub: 'How was your shopping?',
      bg: ASSETS + 'boy return home .png',
      kb: { origin: '50% 30%', from: 'scale(1.02)', to: 'scale(1.05) translate(4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[1030, 250, 300]],   // the daylight through the far window
      dust: [560, 80, 1300, 720],  // specks floating in the sunlight
      play: playReturn,
    },
    {
      id: 'school', title: 'School Starts Soon', sub: 'Your new school session starts in a few days.',
      bg: ASSETS + 'boy and his father talking.png',
      kb: { origin: '60% 32%', from: 'scale(1.02)', to: 'scale(1.05) translate(-4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[1062, 240, 260]],   // the daylight through the far doorway
      dust: [620, 80, 1300, 640],
      play: playSchool,
    },
    {
      id: 'list', title: 'The Shopping List', sub: 'School uniform, shoes, bag and water bottle',
      bg: ASSETS + 'father gave him list.png',
      kb: null, origin: '55% 40%', still: true, // the camera pushes in on the list and back (see playList)
      lamps: [[1856, 250, 300]],   // the sunny window
      dust: [1100, 60, 1900, 640],
      play: playList,
    },
    {
      id: 'money', title: '₹5,000 to Spend', sub: 'Here’s ₹5,000.',
      bg: ASSETS + 'father gave him money.png',
      kb: KB_TABLE, lamps: [[1856, 250, 300]], dust: [1100, 60, 1900, 640],
      shot: 'table',
      play: playMoney,
    },
    {
      id: 'deal', title: 'Find the Best Deals', sub: 'Then I’m definitely finding the best offers!',
      bg: ASSETS + 'boy stand and talk .png',
      kb: { origin: '52% 30%', from: 'scale(1.02)', to: 'scale(1.05) translate(4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[1520, 300, 300]],   // the sunny window behind Aniket
      dust: [700, 80, 1500, 640],
      play: playDeal,
    },
    {
      id: 'begin', title: 'Game Begins', sub: 'School Shopping Challenge',
      bg: ASSETS + 'game begins.png',
      kb: { origin: '25% 45%', from: 'scale(1.02)', to: 'scale(1.04) translate(3px, 2px)' }, // a slow drift on Aniket
      lamps: [[1560, 110, 380]],   // the morning sun over the trees
      dust: [80, 60, 980, 820],
      play: playBegin,
    },
    {
      id: 'shops', title: 'Shopping Area', sub: 'Choose any item first',
      look: 'shops', // no picture: the game draws the design's light blue (see css: .scene.look-shops)
      kb: null, origin: '50% 50%', lamps: [], dust: null,
      exit: 'zoom', // into a street: the camera pushes in on the card picked (see playShops)
      next: () => (SHOPS.find(shop => !Shopping.bought.includes(shop.id)) || { id: 'complete' }).id, // the next item to buy
      play: playShops,
    },
    ...['uniform', 'shoes', 'bag', 'bottle'].map((id, i) => ({
      id, title: ROUND_TITLES[i][0], sub: ROUND_TITLES[i][1],
      look: 'street', // drawn by the game: a street of three shops (see FX.street)
      kb: null, origin: '50% 50%', lamps: [], dust: null,
      next: () => (allBought() ? 'complete' : 'shops'), // back to the Shopping Area (or on to the end)
      back: () => 'shops',
      play: playRound,
    })),
    {
      id: 'complete', title: 'Shopping Complete!', sub: 'You bought everything on the list!',
      look: 'party', kb: null, origin: '50% 50%', lamps: [], dust: null,
      back: () => 'shops',
      play: playComplete,
    },
    {
      id: 'receipt', title: 'Final Receipt', sub: 'Aniket’s School Shopping',
      look: 'party', kb: null, origin: '50% 50%', lamps: [], dust: null,
      play: playReceipt,
    },
    {
      id: 'left', title: 'Money Left', sub: '₹5,000 − ₹4,340 = ₹660',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playMoneyLeft,
    },
    {
      id: 'two', title: 'Two Different Amounts', sub: 'Discount received ₹1,060, money left ₹660',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playTwoAmounts,
    },
    {
      id: 'homeagain', title: 'Back Home', sub: 'Did you get everything?',
      bg: ASSETS + 'return home shopping list .png', // Aniket home with his shopping bag, his father at the table
      kb: { origin: '52% 30%', from: 'scale(1.02)', to: 'scale(1.05) translate(4px, 3px)' },
      lamps: [[1020, 270, 240]],   // the sunny window in the room behind them
      dust: [700, 80, 1500, 640],
      play: playHomeAgain,
    },
    {
      id: 'mission', title: 'Mission Complete', sub: 'Budget, amount spent, money left, discount',
      look: 'party', kb: null, origin: '50% 50%', lamps: [], dust: null,
      play: playMission,
    },
    {
      id: 'recap', title: 'What We Learnt', sub: 'Marked Price, Discount, Discount %, Selling Price',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playRecap,
    },
    {
      id: 'takeaway', title: 'Final Takeaway', sub: 'Compare the final price before you buy',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playTakeaway,
    },
  ];
  const LAST = SCENES.length - 1;
  SCENES.forEach((scene, i) => { scene.num = i ? String(i) : '★'; }); // each screen's number is its place
  // The revamp (Bookstore Journey - Revamp Brief.docx) covers the story, screens 1–46, and the conversation back home at
  // the end (the same dialogue boxes): `v2` (css: .is-v2).
  const REVAMP_END = SCENES.findIndex(s => s.id === 'begin');
  SCENES.forEach((scene, i) => { if ((i >= 1 && i <= REVAMP_END) || scene.id === 'homeagain') scene.v2 = true; });

  // ======================================================================
  // Scene scripts. `ctx.wait()` throws CANCELLED as soon as the player
  // leaves the scene, so every script simply stops where it is.
  // ======================================================================

  async function playTitle(ctx, scene) {
    const L = scene.layer;
    FX.twinkles(L, [[380, 125], [760, 125], [570, 100], [870, 250], [230, 520], [420, 570], [900, 560]]); // round the title, off Aniket

    const wrap = el('div', 'start-wrap', L, { left: `${START_AT[0]}px`, top: `${START_AT[1]}px` });
    const btn = el('button', 'start-btn', wrap);
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Start the story');
    const img = el('img', '', btn);
    img.src = ASSETS + 'ui/start-button.png'; // (a square cut of "start button.png", its disc the old button's size)
    img.alt = '';
    img.draggable = false;
    btn.addEventListener('click', startStory);
    wrap.animate([
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.12)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1)', opacity: 1 },
    ], { duration: 700, delay: 350, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'backwards' });

    for (;;) { // a light sweep across the logo every few seconds
      await ctx.wait(4200);
      FX.shine(L, TITLE_PLATE, { duration: 1300, width: 200, color: 'rgba(255, 255, 255, .8)' });
    }
  }

  function startStory() {
    if (Game.index !== 0 || Game.starting) return;
    Game.starting = true;
    Sound.unlock();
    Sound.chime();
    const scene = SCENES[0];
    FX.burst(scene.layer, ...START_AT, { count: 22, dist: [150, 320] });
    const btn = scene.layer.querySelector('.start-btn');
    if (btn) {
      btn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(.86)', offset: 0.3 },
        { transform: 'scale(1.18)', opacity: 1, offset: 0.7 },
        { transform: 'scale(.2)', opacity: 0 },
      ], { duration: 520, easing: 'ease-in-out', fill: 'forwards' });
    }
    setTimeout(() => {
      Game.starting = false;
      go(1);
    }, 380);
  }

  // At home: Aniket, ready to go out, tells his father what he wants to buy at the mall; his father says yes, with a
  // word of advice; Aniket promises. One of them talks at a time.
  async function playHome(ctx, scene) {
    const L = scene.layer;
    const say = async (bubble, id, who) => {
      const line = FX.bubble(L, Object.assign({ voice: who }, bubble));
      await line.show();
      await speak(ctx, line, id, who);
      return line;
    };
    await ctx.wait(700);
    const plan = await say({
      anchor: [832, 300], corner: 'bl', tip: [742, 206], // on the wall right of his face, the tail at his mouth
      text: 'Dad, I want to buy\na book and a new\npair of sneakers\nfrom the mall.',
    }, 'plan', 'boy');
    await ctx.wait(900);
    await plan.hide();
    await ctx.wait(250);
    const advice = await say({
      anchor: [1262, 236], corner: 'br', tip: [1318, 332], // on the wall up-left of his head, the tail at his mouth
      text: 'Sure. But compare\nthe prices and\nbuy wisely.',
    }, 'advice', 'dad');
    await ctx.wait(900);
    await advice.hide();
    await ctx.wait(250);
    await say({ anchor: [800, 172], corner: 'bl', tip: [742, 206], text: 'I will!' }, 'promise', 'boy'); // up-right of his face
    ctx.advance(3000); // then off to the mall
  }

  // Aniket walks up to the bookstore. With its clip (s03-walk-in, the meeting of 2026-10-21: the door opens and he goes
  // in, a real walk), the clip plays and the screen moves on as it ends. Without it, the game draws his walk.
  async function playOutside(ctx, scene) {
    if (Clips.has('s03-walk-in')) {
      const v = scene.clipEls && scene.clipEls['s03-walk-in'];
      const left = v && v.duration ? v.duration - v.currentTime : VIDEO_CLIPS['s03-walk-in'];
      await ctx.wait(Math.max(0, left * 1000 - 400), { real: true });
      ctx.advance(400);
      return;
    }
    const L = scene.layer;
    const walker = new FX.Walker(L, WALK_RIG);
    const from = { x: -190, y: 1016, s: 0.79 }; // off-screen left, slightly closer to the camera
    const to = { x: 925, y: 986, s: 0.76 };     // front of the store, by the display table
    walker.place(from.x, from.y, from.s);
    walker.setFrame('idle');
    const pan = x => (x / STAGE_W) * 1.6 - 0.8;

    await ctx.wait(600);
    Sound.duck(true);
    await walker.walk(ctx, { from, to, speed: 265, decel: 230, onStep: x => Sound.step(pan(x)) });
    Sound.step(pan(to.x), 0.5);
    Sound.duck(false);
    walker.idle(true);

    await ctx.wait(300);
    const headTop = to.y - (WALK_RIG.baselineY - 10) * to.s;
    FX.exclaim(L, to.x + 22, headTop - 34);
    Sound.ding();

    await ctx.wait(500);
    FX.shine(L, SHOP_SIGN, { duration: 1400, width: 260 });
    Sound.sparkle();

    await ctx.wait(700);
    ctx.advance(1800);
  }

  // The bookstore's glass doors, opening. The picture's doorway (stage px: x 694–1429, its top from y 289 to 225, its
  // bottom from y 842 to 881) is covered by DOORWAY: the same picture with the doors taken out (their seam, handles
  // and fittings painted out, and the glass's haze off, so the shop is seen clearly through the open doorway). Over it,
  // the two door leaves, drawn in one SVG: pale glass (the haze the picture's glass has, so closed they look just as it
  // does), a sheen, their edges, the pull handles and the fittings. They swing open into the shop on their hinges, the
  // left one on the doorway's left side and the right one on its right, drawn in perspective by doorLeaf (the same in
  // every browser). Anything put under them (under) is seen through the glass while they are closed.
  const DOORWAY = { src: ASSETS + 'ui/bookstore-doorway.png', x: 694, y: 225 };
  // Each leaf, closed: its hinge (x, and its top and bottom there), its free edge (the same), its width, and the side
  // it swings from (+1: the hinge on the left, the leaf to its right; −1: the other way round).
  const DOOR_LEAVES = [
    { hinge: [694, 289, 842], free: [1044, 258.6, 860.6], dir: 1 },
    { hinge: [1429, 225, 881], free: [1044, 258.6, 860.6], dir: -1 },
  ];
  const DOOR_OPEN = 68;       // how far they swing (deg)
  const DOOR_EYE = 1800;      // how far the eye is from the doors (stage px): the depth of the perspective
  const HANDLE = { from: 32, w: 15, top: 504, bottom: 698 };   // the pull handle: its distance from the free edge, width, top and bottom
  let doorIds = 0;

  // A point on a leaf turned `deg` into the shop, in stage px: u its distance from the hinge (closed), y its height
  // (closed). The leaf turns about its hinge; seen from the front, a point further in looks smaller, towards the
  // hinge's middle height.
  function doorPoint(lf, deg, u, y) {
    const a = (deg * Math.PI) / 180;
    const k = DOOR_EYE / (DOOR_EYE + u * Math.sin(a)); // further away: smaller
    const mid = (lf.hinge[1] + lf.hinge[2]) / 2;
    return [lf.hinge[0] + lf.dir * u * Math.cos(a) * k, mid + (y - mid) * k];
  }

  // One leaf's shapes at `deg`, as SVG markup: the glass, its sheen, its edges, the dark free edge, the handle, the fittings.
  function doorLeaf(lf, deg, id, i) {
    const width = Math.abs(lf.free[0] - lf.hinge[0]);
    const edgeY = (u, which) => lf.hinge[which] + (lf.free[which] - lf.hinge[which]) * (u / width); // the top (1) or bottom (2) at u
    const pt = (u, y) => doorPoint(lf, deg, u, y).map(v => v.toFixed(1)).join(',');
    const quad = (u0, u1, y0f, y1f) => [pt(u0, y0f(u0)), pt(u1, y0f(u1)), pt(u1, y1f(u1)), pt(u0, y1f(u0))].join(' ');
    const top = u => edgeY(u, 1);
    const bottom = u => edgeY(u, 2);
    const glass = quad(0, width, top, bottom);
    const free = [pt(width, top(width)), pt(width, bottom(width))];
    const hu = width - HANDLE.from;
    const handle = quad(hu - HANDLE.w, hu, () => HANDLE.top, () => HANDLE.bottom);
    const fitTop = quad(width - 50, width - 2, u => top(u) + 2, u => top(u) + 16);
    const fitBottom = quad(width - 50, width - 2, u => bottom(u) - 22, u => bottom(u) - 4);
    return `<polygon points="${glass}" fill="rgb(242,234,226)" fill-opacity=".22"/>
      <polygon points="${glass}" fill="url(#${id}s${i})"/>
      <polygon points="${glass}" fill="none" stroke="rgba(40,60,80,.35)" stroke-width="2"/>
      <line x1="${free[0].split(',')[0]}" y1="${free[0].split(',')[1]}" x2="${free[1].split(',')[0]}" y2="${free[1].split(',')[1]}" stroke="rgba(25,40,60,.7)" stroke-width="4"/>
      <polygon points="${handle}" fill="url(#${id}h)" stroke="rgba(60,40,25,.45)" stroke-linejoin="round"/>
      <polygon points="${fitTop}" fill="#a9a29a" stroke="rgba(60,60,60,.4)"/>
      <polygon points="${fitBottom}" fill="#a9a29a" stroke="rgba(60,60,60,.4)"/>`;
  }

  function bookstoreDoors(layer, { open = false } = {}) {
    // decoded before the screen is first painted: so it never shows the picture's closed doors, even for a moment
    Object.assign(el('img', 'bs-doorway', layer), { decoding: 'sync', src: DOORWAY.src, alt: '', draggable: false })
      .style.cssText = `left:${DOORWAY.x}px;top:${DOORWAY.y}px`;
    const id = 'bsd' + (++doorIds);
    const holder = el('div', 'bs-doors', layer);
    holder.innerHTML = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true">
      <defs>
        ${DOOR_LEAVES.map((lf, i) => `<linearGradient id="${id}s${i}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/>
          <stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`).join('')}
        <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6f5a45"/><stop offset=".35" stop-color="#ead9c4"/><stop offset=".62" stop-color="#b39579"/><stop offset="1" stop-color="#6a5440"/>
        </linearGradient>
      </defs>
      <g class="bs-leaves"></g>
    </svg>`;
    const leaves = holder.querySelector('.bs-leaves');
    const draw = deg => { leaves.innerHTML = DOOR_LEAVES.map((lf, i) => doorLeaf(lf, deg, id, i)).join(''); };
    draw(open ? DOOR_OPEN : 0);
    return {
      // Puts `node` (e.g. Aniket inside the shop) between the doorway and the doors: seen through the glass.
      under(node) {
        layer.insertBefore(node, holder);
      },
      // The doors swing open into the shop (a little too far, then back), with the shop's bell.
      open(ctx) {
        Sound.chime();
        Sound.swish();
        if (reducedMotion) {
          draw(DOOR_OPEN);
          return ctx.wait(0);
        }
        const ms = 900;
        const easeOut = t => 1 - Math.pow(1 - t, 3);
        const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        return new Promise((resolve, reject) => {
          const t0 = performance.now();
          const step = now => {
            if (!ctx.alive() || !holder.isConnected) return reject(CANCELLED);
            const t = Math.min(1, (now - t0) / ms);
            draw(t < 0.75 ? (DOOR_OPEN + 4) * easeOut(t / 0.75) : DOOR_OPEN + 4 - 4 * easeInOut((t - 0.75) / 0.25));
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
      },
    };
  }

  // Where Aniket stands once he is out of the doors (the next screen starts him there).
  const OUT_OF_THE_DOORS = { x: 1070, y: 958, s: 0.7 };

  // Coming out of the bookstore (the same view as screen 3). With its clip (s20-out): Aniket comes out of the open door,
  // stops in front of the shop, smiling, and walks off to the right; the next screen's clip carries on from its last
  // frame, as it ends. Without it: he walks up to the doors inside the shop,
  // seen through the glass; the doors swing open (the shop's bell), and he walks out through them into the mall, coming
  // closer. The doors are there from the screen's first frame (setup).
  function setupExit(scene) {
    if (!Clips.has('s20-out')) scene.doors = bookstoreDoors(scene.layer); // (the clip has its own)
  }

  async function playExit(ctx, scene) {
    if (Clips.has('s20-out')) {
      const v = scene.clipEls && scene.clipEls['s20-out'];
      const left = v && v.duration ? v.duration - v.currentTime : VIDEO_CLIPS['s20-out']; // (the clip started with the screen)
      await ctx.wait(Math.max(0, left * 1000 - 250), { real: true });
      ctx.advance(250); // on as it ends, so he walks straight on into the next screen's clip
      return;
    }
    const L = scene.layer;
    const doors = scene.doors;
    const walker = new FX.Walker(L, WALK_RIG);
    doors.under(walker.root); // inside the shop, behind the glass
    const inside = { x: 760, y: 822, s: 0.5 };      // inside the shop, by the left-hand door
    const atDoors = { x: 905, y: 830, s: 0.52 };    // at the doors
    walker.place(inside.x, inside.y, inside.s);
    walker.setFrame('idle');
    walker.root.style.opacity = '0';
    const pan = x => (x / STAGE_W) * 1.6 - 0.8;

    await ctx.wait(500);
    walker.root.style.opacity = '';
    FX.settle(walker.root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedMotion ? 1 : 400, easing: 'ease-out' }));
    Sound.duck(true, 'walk');
    try {
      await walker.walk(ctx, { from: inside, to: atDoors, speed: 170, decel: 90, onStep: x => Sound.step(pan(x), 0.5) });
    } finally {
      Sound.duck(false, 'walk');
    }
    await ctx.wait(250);
    await doors.open(ctx);
    await ctx.wait(200);
    Sound.duck(true, 'walk');
    try {
      await walker.walk(ctx, { from: atDoors, to: OUT_OF_THE_DOORS, speed: 200, decel: 120, onStep: x => Sound.step(pan(x)) });
    } finally {
      Sound.duck(false, 'walk');
    }
    walker.idle(true);
    ctx.advance(1600); // then on to the next shop
  }

  // On to the shoe shop (the same view): Aniket walks off along the mall to the right. With its clip (s21-walk, the rest
  // of the take s20-out comes from), he walks on past the open door. Without it, the doors stand open behind
  // him and he walks off, coming a little closer as he goes: the open doors and Aniket, just out of them, are there from
  // the screen's first frame (setup), exactly as the screen before left them. Either way, the cut between the two
  // changes nothing.
  function setupLeave(scene) {
    if (Clips.has('s21-walk')) return;
    bookstoreDoors(scene.layer, { open: true });
    const walker = new FX.Walker(scene.layer, WALK_RIG);
    walker.place(OUT_OF_THE_DOORS.x, OUT_OF_THE_DOORS.y, OUT_OF_THE_DOORS.s);
    walker.setFrame('idle');
    walker.idle(true);
    scene.walker = walker;
  }

  async function playLeave(ctx, scene) {
    if (Clips.has('s21-walk')) {
      const v = scene.clipEls && scene.clipEls['s21-walk'];
      const left = v && v.duration ? v.duration - v.currentTime : VIDEO_CLIPS['s21-walk']; // (the clip started with the screen)
      await ctx.wait(Math.max(0, left * 1000 - 200), { real: true }); // he walks on and away
    } else {
      const walker = scene.walker;
      const from = OUT_OF_THE_DOORS;               // just out of the doors, as the screen before left him
      const to = { x: 2200, y: 1012, s: 0.8 };      // off to the right
      const pan = x => (x / STAGE_W) * 1.6 - 0.8;

      await ctx.wait(700);
      walker.idle(false);
      Sound.duck(true, 'walk');
      try {
        await walker.walk(ctx, { from, to, speed: 260, decel: 40, onStep: x => Sound.step(pan(x)) });
      } finally {
        Sound.duck(false, 'walk');
      }
    }
    // Then Swifty sums up the bookstore and says what comes next (the user's doc, 2026-10-23), in her bubble: she pops up
    // in the bottom-left corner (Aniket has walked on to the right), says it, and goes.
    await ctx.wait(300);
    await swiftyCornerLines(ctx, scene, [
      ['book-done', [{ t: 'Aniket bought the book and understood the ' }, { t: 'discount', cls: 'key' }, { t: '.' }]],
      ['to-sneakers', [{ t: 'Let’s help Aniket buy the ' }, { t: 'sneakers', cls: 'stress' }, { t: '!' }]],
    ], { upTo: 1180 }); // (clear of him)
    ctx.advance(900); // then on to the shoe shop
  }

  // The names of the three books on the display stand by the counter (on the screen where Aniket holds the book), each
  // written on its cover as if printed there: centred in the cover's top part and slanted with it (the books lean back
  // on the stand). On the pictures' layer, so they move with the camera. x, y: the title's centre (stage px); slant: how
  // far the cover leans (deg); tone: light words (on the green and the night-blue covers) or dark ones (on the pale
  // sunset sky). The screen's clips (s05-idle, s05-aniket) show the stand a little smaller and higher up and to the left
  // than the picture does: while one is on, the names move with it (css: .stand-names).
  const STAND_BOOKS = [
    { lines: ['Magic', 'Tree'], x: 1357, y: 679, slant: 12.8, tone: 'light' },
    { lines: ['Golden', 'Hills'], x: 1500, y: 684, slant: 10.7, tone: 'dark' },
    { lines: ['Starry', 'Nights'], x: 1638, y: 680, slant: 10, tone: 'light' },
  ];

  function standTitles(scene) {
    const names = el('div', 'stand-names', scene.layer);
    STAND_BOOKS.forEach(book => {
      const title = el('div', `cover-title cover-title--${book.tone}`, names);
      book.lines.forEach(line => { el('span', '', title).textContent = line; });
      Object.assign(title.style, { left: book.x + 'px', top: book.y + 'px', transform: `translate(-50%, -50%) skewX(${-book.slant}deg)` });
    });
  }

  // A piece of a screen's picture laid back over its clips, where a clip draws it wrong (the clips sit exactly on their
  // pictures, so it lines up); its edges fade out (css: .pic-patch). box: [x, y, w, h] (stage px). Just over the clips,
  // so it moves with the camera, and stays as the picture shrinks into a teaching screen's photo (only what is on the
  // picture fades then).
  function pictureOver(scene, [x, y, w, h]) {
    if (!scene.patchBox) return null; // (no clips: the picture is all there is)
    return el('div', 'pic-patch', scene.patchBox, {
      left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`,
      backgroundImage: `url("${scene.bg}")`, backgroundPosition: `${-x}px ${-y}px`,
    });
  }

  async function playBrowse(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 1030, 510, 420, 420, { cls: 'glow--book', delay: 0 });

    // He picks the book up first (its clip, once it is made: the user, 2026-10-21), then says what he thinks of it.
    const pickup = Clips.has('s05-pickup') ? VIDEO_CLIPS['s05-pickup'] : 0;
    await (pickup ? ctx.wait(pickup * 1000 - 300, { real: true }) : ctx.wait(700));
    const line = FX.bubble(L, {
      anchor: [962, 296], corner: 'bl', tip: [905, 334], // right of his face, above the book; the tail at his mouth
      text: 'This book looks\ninteresting!', voice: 'boy', rotate: -1.5,
    });
    await line.show();
    await speak(ctx, line, 'browse', 'boy');
    ctx.advance(3000); // "wait 3 seconds, then next screen"
  }

  async function playAsk(ctx, scene) {
    const L = scene.layer;

    // First Aniket asks…
    await ctx.wait(700);
    const question = FX.bubble(L, {
      anchor: [778, 318], corner: 'bl', tip: [738, 372],
      text: 'How much is\nthis book?', voice: 'boy', rotate: -1.5,
    });
    await question.show();
    await speak(ctx, question, 'ask', 'boy');
    await ctx.wait(1100);

    // …his bubble goes away, then the shopkeeper answers (never both on screen at once).
    await question.hide();
    await ctx.wait(250);
    const answer = FX.bubble(L, {
      anchor: [1262, 318], corner: 'br', tip: [1300, 372],
      text: [{ t: 'It’s ' }, { t: '₹800', em: true }, { t: '!' }], voice: 'man', rotate: 1.5,
    });
    await answer.show();
    await speak(ctx, answer, 'price', 'man');
    answer.emphasize();
    Sound.ding();
    await ctx.wait(1300);

    // Then (the user's doc, 2026-10-23) Aniket finds it too much, and the shopkeeper sends him to the price on the book:
    // one bubble at a time, as before.
    await answer.hide();
    await ctx.wait(250);
    const costly = FX.bubble(L, {
      anchor: [778, 318], corner: 'bl', tip: [738, 372],
      text: [{ t: 'It is too ' }, { t: 'costly', cls: 'stress' }, { t: ', uncle.' }], voice: 'boy', rotate: -1.5,
    });
    await costly.show();
    await speak(ctx, costly, 'costly', 'boy');
    await ctx.wait(1000);
    await costly.hide();
    await ctx.wait(250);
    const check = FX.bubble(L, {
      anchor: [1262, 318], corner: 'br', tip: [1300, 372],
      text: [{ t: 'Check the ' }, { t: 'printed price', cls: 'stress' }, { t: ' on the book.' }], voice: 'man', rotate: 1.5,
    });
    await check.show();
    await speak(ctx, check, 'check-price', 'man');
    check.emphasize();
    ctx.advance(3000); // then he looks at the book's price
  }

  // One part of a bubble split into parts (see FX.bubble), typed while it is spoken (in step with its recording).
  // A line said in the voice of `who`, for the screen whose script `ctx` runs; never once the player has left that screen
  // (a script carrying on after its line was cut short by Next or Back must not speak over the next screen).
  function sayHere(ctx, id, text, who) {
    if (!ctx.alive()) return Promise.reject(CANCELLED);
    const showing = Clips.talk(SCENES[Game.index], id); // the speaker's talking clip, if this picture has one (see Clips)
    if (!showing) return Voice.say(id, text, who);
    // The voice starts as the clip comes on screen (at most 0.4 s later), so the lips move with the words from the start
    // (the meeting of 2026-10-21: the movement came a little after the voice). The line is done once the speaker is done
    // in the clip too (the user, 2026-10-22: "no need to cut the video, play full video"): a natural pause, and the next
    // line's clip never cuts this one short while its speaker still moves (see CLIP_REST).
    const saying = Promise.race([showing, new Promise(r => setTimeout(r, 400))])
      .then(() => (ctx.alive() ? Voice.say(id, text, who) : Promise.reject(CANCELLED)));
    return Promise.all([saying, showing.done]).then(([said]) => said);
  }

  async function speakPart(ctx, line, part, id, words, who, speaker) {
    if (speaker) speaker.talk();
    await Promise.all([line.type(ctx, { part, blips: !Voice.available, seconds: Voice.seconds(words) }), sayHere(ctx, id, words, who)]);
    if (speaker) speaker.idle();
  }

  // A speech bubble's line, typed out while the character's voice says it, in step with its recording (no
  // typing blips then). `speaker` (Swifty) moves her beak while she talks.
  async function speak(ctx, line, id, who, speaker) {
    if (speaker) speaker.talk();
    await Promise.all([line.type(ctx, { blips: !Voice.available, seconds: Voice.seconds(line.words) }), sayHere(ctx, id, line.words, who)]);
    if (speaker) speaker.idle();
  }

  // Where Swifty's speech bubble goes: centred above her head (kept between `within`), its tail pointing straight
  // down at her and stopping well short of her head feathers (see FX's pointerPath).
  function overHead(bird, within) {
    const crest = bird.y - bird.s * SWIFTY.stand.crestY;
    return { anchor: [bird.x, crest - 76], corner: 'bc', within, tip: [bird.x, crest] };
  }

  // Swifty's lines on a teaching screen. Each one comes in a speech bubble (placed by `place(bird)`) that is
  // typed while her voice says it, and takes the place of the bubble before. A bubble can be split into
  // parts (see FX.bubble) that she says one at a time, in step with what happens on screen.
  function swiftyTalk(ctx, ui, bird, place) {
    let line = null;
    const talk = {
      bird,
      get line() { return line; },
      // Puts up the bubble for her next line, once the one before has gone; if she isn't there, she rises in first.
      async show(text) {
        if (line) {
          await line.hide();
          await ctx.wait(120);
        }
        await swiftyIn(ctx, bird);
        line = FX.bubble(ui, Object.assign(place(bird), { text, voice: 'bird', rotate: 1.5 }));
        await line.show();
      },
      // Types part `i` of the bubble while she says it; never quicker than `ms`.
      part(id, i, ms = 0) {
        return Promise.all([speakPart(ctx, line, i, id, line.parts[i], 'bird', bird), ctx.wait(ms)]);
      },
      // Her bubble goes; she stays (her voice reads on: see voice).
      async hideLine() {
        if (!line) return;
        const old = line;
        line = null;
        await old.hide();
      },
      // Her bubble goes, and she goes with it (e.g. before her voice reads out something written on the screen).
      async clear() {
        if (!line) return;
        const old = line;
        line = null;
        await old.hide();
        await swiftyOut(ctx, bird);
      },
      // A whole line in a new bubble, typed while she says it; never quicker than `ms`.
      async say(id, text, ms = 0) {
        await talk.show(text);
        await Promise.all([speak(ctx, line, id, 'bird', bird), ctx.wait(ms)]);
      },
      // A line said while her bubble stays up (its words are written elsewhere on the screen: `marks` light up meanwhile),
      // e.g. a hint read out under her "Not quite!".
      async voice(id, text, marks = [], ms = 0) {
        const { lit, timers, cues } = lightUp(text, marks);
        if (bird && bird.here) bird.talk();
        try {
          await Promise.all([sayHere(ctx, id, text, 'bird'), ctx.wait(ms)]);
        } finally {
          timers.forEach(clearTimeout);
          if (bird) bird.idle();
          lit.forEach(m => m.classList.remove('is-said'));
          cues.forEach(([, node]) => node && node.classList.remove('is-said'));
        }
      },
      // A line whose words (or what it says) are already on the screen (the revamp: no second copy in a bubble): her
      // voice on its own (she is only there with a bubble, so her bubble goes and she with it), and `marks` (what it is
      // about, on the panel) light up meanwhile: the words written on them, each as it is said (see lightUp), or the
      // whole mark when none of its words is in the line. `cues`: [[word, node], …] instead: each node lights up
      // as its word is said (and goes out at the next one), so the words on the panel are lit as they are spoken.
      // `text` is the line's plain words, as recorded. Never quicker than `ms`.
      async read(id, text, marks = [], ms = 0, given = []) {
        await talk.clear();
        const { lit, timers, cues } = lightUp(text, marks, given);
        if (bird && bird.here) bird.talk();
        try {
          await Promise.all([sayHere(ctx, id, text, 'bird'), ctx.wait(ms)]);
        } finally {
          timers.forEach(clearTimeout);
          if (bird) bird.idle();
          lit.forEach(m => m.classList.remove('is-said'));
          cues.forEach(([, node]) => node && node.classList.remove('is-said'));
        }
      },
    };
    return talk;
  }

  // What lights up while a line is said about `marks` on the panel (the user, 2026-10-21: what is written there highlighted
  // with the voice-over, as in the bubbles): each written word that is in the line, as it is said (one at a time, in the
  // yellow highlighter: css .sw); a mark with none of the line's words on it (or a picture, the 10 × 10 grid) is lit
  // whole instead. `given` cues (see cueWords) are used as they are. Returns what to put out afterwards.
  function lightUp(text, marks, given = []) {
    const all = marks.filter(Boolean);
    let cues = given;
    let lit = all;
    if (!cues.length && all.length) {
      const texty = all.filter(m => !m.matches('.g100'));
      cues = cuesFor(text, wordsOf(texty));
      if (cues.length) lit = all.filter(m => !texty.includes(m) || !cues.some(([, w]) => m.contains(w)));
    }
    lit.forEach(m => m.classList.add('is-said'));
    dimOthers([...lit, ...cues.map(([, w]) => w)]);
    return { lit, cues, timers: cueWords(text, cues) };
  }

  // While a line is read, what was read before it on the panel fades back, and what is being read stays bright (the user,
  // 2026-10-21: "fade before statement, after all statement come all show"): each piece (UNITS) already up dims; when
  // the screen has said everything (ctx.advance), they all show again (see showAll). The answers and the amounts to drag
  // never dim: the player uses them.
  const UNITS = ['.cn-note', '.cn-term', '.cn-meaning', '.cmp-box:not(.ws-box)', '.fm-book', '.fm-box', '.bm', '.fr-strip',
    '.fr-short', '.ck-say', '.ck-card', '.ck .f-note', '.def', '.mp-def', '.pf-question', '.pqp-question', '.pf-box',
    '.pf-sheet', '.ta-card', '.rk-card', '.tk-offer', '.qcard-back'].join(', ');
  let dimTurn = 0; // (a later line, or showAll, cancels a dimming still waiting)
  function dimOthers(nodes, turn = ++dimTurn, tries = 16) {
    const scene = nodes.length ? nodes[0].closest('.scene') : null;
    if (!scene || turn !== dimTurn || !scene.classList.contains('is-active')) return;
    const focus = nodes.map(n => n.closest(UNITS)).filter(Boolean);
    if (!focus.length) return;
    // only once what is being read is on the screen (e.g. a name that comes in as it is said): until then, nothing fades
    if (!focus.some(f => parseFloat(getComputedStyle(f).opacity) > 0.5)) {
      if (tries > 0) setTimeout(() => dimOthers(nodes, turn, tries - 1), 200);
      return;
    }
    scene.querySelectorAll(UNITS).forEach(u => {
      if (focus.some(f => f === u || f.contains(u) || u.contains(f))) u.classList.remove('is-dim');
      else if (u.style.opacity !== '0' && getComputedStyle(u).opacity !== '0') u.classList.add('is-dim');
    });
  }
  function showAll(scene) {
    dimTurn++;
    scene.el.querySelectorAll(UNITS).forEach(u => { // (only what the reading dimmed: an answer not picked stays dimmed)
      if (!u.classList.contains('is-dim')) return;
      u.classList.remove('is-dim');
      u.classList.add('is-undim'); // (it comes back softly)
      setTimeout(() => u.classList.remove('is-undim'), 600);
    });
  }

  // The words written in `nodes`, one span each (css .sw: made once; a definition's own word spans, .w, are used as they
  // are), in the order they are written.
  function wordsOf(nodes) {
    const words = [];
    nodes.forEach(node => {
      if (node.querySelector('.w')) {
        words.push(...node.querySelectorAll('.w'));
        return;
      }
      if (!node.dataset.words) {
        node.dataset.words = '1';
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const texts = [];
        while (walker.nextNode()) if (walker.currentNode.textContent.trim()) texts.push(walker.currentNode);
        texts.forEach(t => {
          const run = el('span', 'sw-run'); // (one piece, so the spaces between its words stay, also in a flex box)
          t.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) run.appendChild(document.createTextNode(part));
            else el('span', 'sw', run).textContent = part;
          });
          t.replaceWith(run);
        });
      }
      words.push(...node.querySelectorAll('.sw'));
    });
    return words;
  }

  // The cues for a line (see cueWords): each of its words that is written on the panel (`words`), in the order it is said;
  // a word written twice is matched to its next copy not yet said.
  function cuesFor(text, words) {
    const norm = w => w.toLowerCase().replace(/[^\p{L}\p{N}₹%]/gu, '');
    const left = words.map(w => ({ w, k: norm(w.textContent) })).filter(x => x.k);
    const cues = [];
    text.split(/\s+/).forEach(token => {
      const k = norm(token);
      if (!k) return;
      const i = left.findIndex(x => x.k === k);
      if (i < 0) return;
      cues.push([token, left[i].w]);
      left.splice(i, 1);
    });
    return cues;
  }

  // Lights each cue's node as its word is said: its place in the line, as a share of the line's recording (or about
  // 62 ms a letter when the device's voice reads it). One at a time: each goes out as the next one lights up.
  function cueWords(text, cues) {
    if (!cues.length) return [];
    const total = (Voice.seconds(text) || text.length * 0.062) * 1000;
    const lower = text.toLowerCase();
    let from = 0;
    const at = cues.map(([word, node]) => {
      const i = lower.indexOf(word.toLowerCase(), from);
      if (i >= 0) from = i + word.length;
      return [Math.max(0, (i >= 0 ? i : from) / text.length) * total, node];
    });
    return at.map(([ms, node], k) => setTimeout(() => {
      if (k) at[k - 1][1] && at[k - 1][1].classList.remove('is-said');
      if (node) node.classList.add('is-said');
    }, ms));
  }

  // The shopkeeper gives him the book, and he pays ₹800 and says thank you (the user's doc, 2026-10-23).
  async function playPay(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 978, 551, 420, 280, { cls: 'glow--money', delay: 0 });

    await ctx.wait(600);
    FX.shine(L, MONEY, { duration: 900, width: 140 });

    await ctx.wait(450);
    FX.badge(L, PRICE_TAG).pop(); // pop sound + a small ₹800 just above the money

    await ctx.wait(500);
    Sound.kaching();
    await ctx.wait(700);
    const thanks = FX.bubble(L, Object.assign({ text: 'Thank you, uncle!', voice: 'boy', rotate: -1.5 }, THANKS_AT));
    await thanks.show();
    await speak(ctx, thanks, 'thanks', 'boy');
    ctx.advance(3000); // then out of the bookstore
  }
  // His bubble: right of his face, between the two of them, its tail at his mouth (aniket give money to shopkeeper.png,
  // stage px), as on screen 4.
  const THANKS_AT = { anchor: [746, 300], corner: 'bl', tip: [694, 368] }; // (clear of the ₹800 badge above the money)


  // After an answer has been explained, or a teaching screen has said all it has to say, the story moves on by itself this
  // long after (the user, 2026-10-21: no Next buttons of their own on the screens, "after 5 second the screen is jump to
  // next screen"; with Auto-play off, the top Next waits, as at the end of every screen).
  const NEXT_IN = 5000;

  // Lights the words of `marks` as `text` is said (see lightUp) and puts them out once it has been.
  async function readLit(ctx, id, text, marks) {
    const reading = lightUp(text, marks);
    try {
      await sayHere(ctx, id, text, 'bird');
    } finally {
      reading.timers.forEach(clearTimeout);
      reading.cues.forEach(([, w]) => w.classList.remove('is-said'));
      reading.lit.forEach(m => m.classList.remove('is-said'));
    }
  }

  // A wrong answer in the revamp (the user, 2026-10-22): at once, Swifty pops up in the bottom-left corner of the picture
  // to say "Not quite! The shopkeeper sold the book for ₹800.", and goes; then the picture blurs and dims behind, and the
  // card makes way for a small panel with the Cost Price and Selling Price cards, read out one at a time. Then the picture
  // clears, and a note over the money he hands over ties it to the story. 5 seconds later the story moves on.
  const NOT_QUITE = { x: 220, y: 1066, s: 0.74 }; // her feet, at the picture's bottom-left edge
  const ON_PANEL = { x: 220, y: 1040, s: 0.74 }; // …and on the panel, inside its edge
  async function swiftyCorner(ctx, scene, id, text, opts = {}) {
    return swiftyCornerLines(ctx, scene, [[id, text]], opts);
  }
  // …or more than one line (one bubble after another), e.g. her words outside the bookstore (screen 13).
  async function swiftyCornerLines(ctx, scene, lines, { icon = null, at = NOT_QUITE, upTo = 1500 } = {}) { // (upTo: her bubbles' right edge)
    const { x, y, s } = at;
    const bird = new FX.Bird(scene.ui, SWIFTY, { scale: s });
    bird.place(x, y);
    bird.root.classList.add('is-mirrored'); // (she points to her right, at her bubble)
    bird.point();
    const ms = reducedMotion ? 1 : 600;
    Sound.chirp();
    await FX.settle(bird.body.animate([{ transform: 'translateY(320px)' }, { transform: 'translateY(-8px)', offset: 0.75 }, { transform: 'none' }],
      { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)' }));
    const head = y - s * 300; // (level with her beak)
    try {
      for (const [k, [id, text]] of lines.entries()) {
        const line = FX.bubble(scene.ui, { anchor: [x + 176, head], corner: 'ml', tip: [x + 120, head + 6], text, icon: k ? null : icon, size: 46, voice: 'bird', within: [x + 176, upTo] });
        await line.show();
        await speak(ctx, line, id, 'bird', bird);
        bird.point();
        await ctx.wait(700);
        await line.hide();
        if (k < lines.length - 1) await ctx.wait(200);
      }
      await FX.settle(bird.body.animate([{ transform: 'none' }, { transform: 'translateY(320px)' }],
        { duration: reducedMotion ? 1 : 450, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
    } finally {
      bird.root.remove();
    }
  }

  // He looks at the price printed on the book (the shopkeeper told him to): it says ₹1000!
  async function playShock(ctx, scene) {
    await ctx.wait(150);
    Sound.shock();
    jolt(scene);
    FX.ring(scene.layer, STICKER.shock);
    await ctx.wait(650);
    const line = FX.bubble(scene.layer, {
      anchor: [1030, 350], corner: 'bl', tip: [966, 300], // right of his head, the tail at his hair (his face is turned away)
      text: [{ t: 'Oh! The price printed on it is ' }, { t: '₹1000', em: true }, { t: '.' }], // (the user's doc, 2026-10-23)
      voice: 'boy', rotate: -1.5,
    });
    await line.show();
    await speak(ctx, line, 'shock', 'boy');
    line.emphasize();
    ctx.advance(3000); // then Swifty says what it is
  }

  // The Marked Price (the revamp's Concept layout). The shocked picture has shrunk into the snapshot on the left, zoomed
  // on the book, its ₹1000 sticker ringed in gold. Swifty rises in on her books (she introduces the new idea) and says
  // what the ₹1000 is, in her bubble; meanwhile the ₹1000 flies out of the sticker onto a taped note in the middle. Then
  // she says its name, with no bubble (it is written there: "Marked Price (MP)" comes in under the note as she says it),
  // and one line says what it means. She goes as the screen ends (screen 12 is read out without her).
  // Screens 8 and 9 (the user, 2026-10-22: "focus on the image, then blur everything but the price tag, and Swifty comes
  // from the right side and says it, in a panel"): the shocked picture, the camera on the book; everything blurs and dims
  // but its ₹1000 sticker (a spotlight); Swifty slides in from the right on her books; and a panel in the middle says
  // what it is (8: the ₹1000, Marked Price (MP), what it means; 9: the definition), read out by her.
  // The sticker on screen: left of the middle, close enough that the picture still covers the whole screen (its right
  // and bottom edges stay past the screen's), the panel and Swifty on its right. (The picture is drawn at twice the
  // screen's size, so it stays sharp this close.)
  const TAG_CAM = { face: [STICKER.shock.x, STICKER.shock.y], to: [470, 700], s: 2 };
  function tagSpotlight(scene, cam, on) {
    const [x, y] = cam.at([STICKER.shock.x, STICKER.shock.y]);
    const spot = { x, y, r: STICKER.shock.r * TAG_CAM.s };
    const veil = el('div', 'spot-veil');
    [['--x', spot.x], ['--y', spot.y], ['--r', spot.r * 1.2]].forEach(([k, v]) => veil.style.setProperty(k, `${v}px`));
    scene.ui.insertBefore(veil, scene.ui.firstChild); // (under the panel and Swifty: only the picture blurs)
    if (on) veil.classList.add('is-on', 'is-instant');
    return { veil, spot, on: () => veil.classList.add('is-on') };
  }
  // Swifty and her books slide in from the right edge (on): or are there already (carried over from the screen before).
  // `bubbles`: where her bubbles go ([minX, maxX]; her corner's room by default).
  async function swiftyFromRight(ctx, scene, already = false, { bubbles = CORNER.bubbles } = {}) {
    const stand = standFor(scene);
    const bird = new FX.Bird(scene.ui, SWIFTY, { scale: CORNER.s });
    bird.place(CORNER.x, CORNER.y);
    bird.shadowOn(true);
    Object.assign(bird, { stand, here: true });
    scene.bird = bird;
    const talk = swiftyTalk(ctx, scene.ui, bird, b => overHead(b, bubbles));
    if (already) {
      bird.point();
      return talk;
    }
    const ms = reducedMotion ? 1 : 750;
    const slide = d => [{ transform: `translateX(${d}px)`, opacity: 0 }, { transform: 'translateX(-10px)', opacity: 1, offset: 0.8 }, { transform: 'none', opacity: 1 }];
    stand.animate(slide(420), { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)' });
    bird.body.animate(slide(525), { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)' }); // (her body is drawn at 0.8)
    Sound.chirp();
    await ctx.wait(ms);
    bird.wave();
    return talk;
  }
  // The panel in the middle, between the sticker and Swifty.
  function tagPanel(scene, cls = 'pop-card--tag') {
    const card = el('div', `pop-card ${cls}`, scene.ui);
    card.style.opacity = '0';
    return {
      card,
      open: () => FX.reveal(card, [
        { opacity: 0, transform: 'translateY(30px) scale(.92)' },
        { opacity: 1, transform: 'translateY(-4px) scale(1.01)', offset: 0.7 },
        { opacity: 1, transform: 'none' },
      ], { duration: 600, easing: 'cubic-bezier(.2,.8,.3,1)' }),
    };
  }

  function setupMarked(scene) {
    // Coming from screen 5, the camera is where it was (it moves in on the book as the screen plays).
    if (scene.startFrom && scene.startFrom !== 'none') scene.world.style.transform = scene.startFrom;
    scene.panel = tagPanel(scene, 'pop-card--tag pop-card--mp');
    const c = FX.concept(scene.panel.card, { value: '₹1000', term: 'Marked Price', abbr: '(MP)', meaning: '', tone: 'mp' });
    // what it is, in the two parts her voice says (each lights up as it is said); it wraps at the card's edge
    c.parts = ['The price printed on an item ', 'is called its marked price.'].map(t => Object.assign(el('span', '', c.meaning), { textContent: t }));
    scene.concept = c;
  }

  async function playMarked(ctx, scene) {
    const ui = scene.ui;
    const c = scene.concept;
    // The camera moves in on the book, then everything but its price tag blurs.
    const cam = faceCamera(scene, TAG_CAM);
    moveCamera(scene, cam.transform, reducedMotion ? 1 : 1500);
    await ctx.wait(1600);
    const light = tagSpotlight(scene, cam, false);
    void light.veil.offsetWidth; // (so it fades in)
    light.on();
    FX.ring(ui, { x: light.spot.x, y: light.spot.y, r: light.spot.r * 1.05 });
    Sound.sparkle();
    await ctx.wait(700);

    // No Swifty (the user, 2026-10-23: "remove Swifty; the ₹1000 panel big, on the right side; only her voice"): the ₹1000
    // lifts off the tag and flies to a big panel on the right, which springs up with it (never empty); then what it is
    // comes in under it, and her voice says it (the user's doc: "The price printed on an item is called its marked
    // price."), each word lighting up as it is said; its name comes in as she says it.
    const reader = swiftyTalk(ctx, ui, null, null);
    await flyFromSnap(ctx, scene, light.spot, '₹1000', c.value);
    scene.panel.open();
    c.showNote();
    await ctx.wait(800);
    c.showMeaning();
    await ctx.wait(500);
    await reader.read('mp-1', 'The price printed on an item', [c.parts[0]], 300);
    const naming = reader.read('mp-2', 'is called its marked price.', [c.parts[1], c.term], 600);
    naming.catch(() => {}); // if the player leaves mid-line, the wait below reports it
    await ctx.wait(800);
    c.showTerm();
    await naming;
    Sound.ding();
    await ctx.wait(1200);
    ctx.advance(NEXT_IN); // then the question card
  }

  // Swifty's bubble goes, and she and her books slide back out to the right (as she came: see swiftyFromRight).
  async function swiftyAway(ctx, talk) {
    const bird = talk.bird;
    await talk.hideLine();
    if (!bird || bird.gone) return;
    const ms = reducedMotion ? 1 : 520;
    bird.shadowOn(false); // (her shadow goes with her)
    const out = d => [{ transform: 'none', opacity: 1 }, { transform: `translateX(${d}px)`, opacity: 0 }];
    bird.stand.animate(out(420), { duration: ms, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    bird.body.animate(out(525), { duration: ms, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    await ctx.wait(ms);
    bird.stand.remove();
    bird.remove();
    Object.assign(bird, { gone: true, here: false });
  }

  // Something on the picture (`spot`: its place on the screen) flies onto the panel, landing on `to`: a copy of
  // `text` lifts off it and glides there (FX.flyAcross).
  async function flyFromSnap(ctx, scene, spot, text, to) {
    const pin = el('div', 'pin', scene.ui, { left: `${spot.x - 60}px`, top: `${spot.y - 16}px`, width: '120px', height: '32px', fontSize: '28px', opacity: '0' });
    pin.textContent = text;
    try {
      await FX.flyAcross(scene.ui, pin, to, { text, ms: 1000, lift: 90 });
      await ctx.wait(0); // (stops here if the player has left meanwhile)
    } finally {
      pin.remove();
    }
  }

  // A question card on a story picture (the user's doc, 2026-10-23: "the CFU comes in card form"): it swings in with its
  // question and answers. A wrong answer brings Swifty up with a hint in her bubble (in the picture's bottom-left corner,
  // or on her books in the bottom-right one: `hintAt`), and the player tries again; the right one turns the card over in
  // the middle of the screen, wide, the picture blurring behind it, and her voice reads why. 5 seconds later the story
  // moves on (NEXT_IN).
  //  lines, options: the card's (see FX.question); title, why: its back; said: what her voice reads then (as recorded);
  //  hint: her bubble's words after a wrong answer; onHint(): what lights up meanwhile; id: names her lines.
  async function cardQuestion(ctx, scene, { id, lines, options, title = 'Correct!', why, said, hint, hintAt = 'left', onHint = null, fromLeft = false }) {
    const card = FX.question(scene.ui, {
      lines,
      options,
      fromLeft,
      onAnswer(correct, button) {
        const reply = correct ? right(button) : wrong();
        reply.catch(err => { if (err !== CANCELLED) console.error(err); });
      },
    });
    async function wrong() {
      card.lock();
      await ctx.wait(700); // let the shake and buzz land first
      if (onHint) onHint();
      if (hintAt === 'left') {
        await swiftyCorner(ctx, scene, `${id}-hint`, hint, { icon: 'cross' });
      } else {
        const talk = await cornerSwifty(ctx, scene);
        talk.bird.point();
        await talk.say(`${id}-hint`, hint, 600);
        await ctx.wait(900);
        await talk.clear(); // (she goes with her bubble)
      }
      card.unlock(); // another try (the wrong answer stays crossed out)
    }
    async function right(button) {
      const [x, y] = stagePoint(button);
      FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
      // what a hint lit up goes (it would be over the card in the middle)
      scene.ui.querySelectorAll('.spot-ring').forEach(ring => {
        FX.settle(ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })).then(() => ring.remove());
      });
      await ctx.wait(700);
      const veil = el('div', 'pop-veil');
      scene.ui.insertBefore(veil, card.el);
      void veil.offsetWidth; // (so it fades in)
      veil.classList.add('is-on');
      scene.el.classList.remove('is-asking');
      card.el.classList.add('is-middle');
      await ctx.wait(reducedMotion ? 60 : 1100);
      await card.flip({ title, text: why, wide: true });
      await readLit(ctx, `${id}-right`, said, [card.el.querySelector('.qcard-back')]); // its words light up as they are said
      ctx.advance(NEXT_IN);
    }
    await card.enter(ctx);
    return card;
  }

  // Screen 7: the marked price of the book, on the book as screen 6 ends (set at once: it carries straight on).
  function setupMpCard(scene) {
    const cam = faceCamera(scene, TAG_CAM);
    scene.world.style.transform = cam.transform;
    scene.light = tagSpotlight(scene, cam, true);
  }

  async function playMpCard(ctx, scene) {
    const { spot } = scene.light;
    await ctx.wait(650);
    await cardQuestion(ctx, scene, {
      id: 'mpq',
      lines: ['The {marked price}', 'of the book is —'],
      options: [{ label: '₹800' }, { label: '₹1000', correct: true }],
      why: 'The price printed on the book, {₹1000}, is its *marked price*.',
      said: 'Correct! The price printed on the book, ₹1000, is its marked price.',
      hint: [{ t: 'Not quite!' }, { t: '\nCheck the price printed on the book.' }],
      hintAt: 'corner', // (the card is in the middle, the tag on its left)
      onHint: () => { // the price on the book lights up
        FX.ring(scene.ui, { x: spot.x, y: spot.y, r: spot.r * 1.05 });
        Sound.sparkle();
      },
    });
  }

  // Screen 10: how much discount he got, on a card at the counter. It starts on screen 9's view (his puzzled face, close),
  // then the camera moves back and left to make room for the card (as on the old Cost/Selling Price question), the
  // picture's right edge feathering into a soft copy of it.
  async function playDiscountCard(ctx, scene) {
    const cam = scene.world;
    const start = scene.startFrom && scene.startFrom !== 'none' ? scene.startFrom : 'scale(1.02)';
    const pan = cam.animate([{ transform: start }, { transform: QUIZ_CAMERA }], {
      duration: reducedMotion ? 1 : 1400, delay: 300, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both',
    });
    scene.kbAnim = pan;
    Game.timers.add(setTimeout(() => ctx.alive() && scene.el.classList.add('is-feathered'), 300));
    FX.settle(pan).then(() => {
      if (!ctx.alive() || reducedMotion) return;
      scene.kbAnim = cam.animate([{ transform: QUIZ_CAMERA }, { transform: QUIZ_DRIFT }], {
        duration: 14000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out',
      });
      pan.cancel();
    });
    el('div', 'q-scrim', scene.ui); // the right side darkens softly so the card stands out
    Game.timers.add(setTimeout(() => ctx.alive() && scene.el.classList.add('is-asking'), 400));
    await ctx.wait(1300);
    await cardQuestion(ctx, scene, {
      id: 'dq',
      lines: ['How much {discount} did', 'Aniket get on the book?'],
      options: [{ label: '₹200', correct: true }, { label: '₹800' }],
      title: 'Yes!',
      why: 'Aniket paid {₹200} less than the *marked price*.',
      said: 'Yes! Aniket paid ₹200 less than the marked price.',
      hint: [{ t: 'Not quite!' }, { t: '\n' }, { t: '₹800', em: true }, { t: ' is the shopkeeper’s selling price.' }],
    });
  }

  // Back at the counter, the shopkeeper explains, one part at a time; as he says each price, it lifts out of his
  // speech bubble and flies to the card on the right, which builds ₹1000 → (₹200 reduced) → ₹800; his last
  // words are the new word, "discount".
  const REDUCTION_CARD = {
    from: { price: '₹1000', tone: 'yellow' }, // the same colours as on the compare screen
    to: { price: '₹800', tone: 'blue' },
    cut: null, // (the user's doc, 2026-10-23: how much, ₹200, is the question on screen 10, so the card doesn't say it)
    note: 'discount',
  };
  const REVEAL_LINE = {
    anchor: [1256, 296], corner: 'br', tip: [1318, 370], // between them, clear of both heads, the tail at his mouth
    text: [
      { t: 'The price printed on\nthe book is ' }, { t: '₹1000', em: true }, { t: ',', end: true },
      { t: '\nbut you paid only ' }, { t: '₹800', em: true }, { t: '.', end: true },
      { t: '\nSo, you got a ' }, { t: '₹200', em: true }, { t: ' ' }, { t: 'discount.', cls: 'key' },
    ],
    voice: 'man', rotate: 1.5,
  };

  // The shopkeeper's line in the review's dialogue boxes: a box for each part, one after the other (at most two lines each).
  // (The user's doc, 2026-10-23: "See the price printed on the book is ₹1000, but I am selling to you at ₹800." "I gave
  // you discount.")
  const REVEAL_PARTS = [
    [{ t: 'See, the price printed on the book is ' }, { t: '₹1000', em: true }, { t: ',' }],
    [{ t: 'but I am selling it to you at ' }, { t: '₹800', em: true }, { t: '.' }],
    [{ t: 'I gave you a ' }, { t: 'discount.', cls: 'key' }],
  ];
  const revealPart = (scene, i) => FX.bubble(scene.layer, Object.assign({}, REVEAL_LINE, { text: REVEAL_PARTS[i] }));

  async function playReveal(ctx, scene) {
    if (scene.v2) return playRevealParts(ctx, scene);
    const card = FX.reduction(scene.ui, REDUCTION_CARD);
    await ctx.wait(500);
    const line = FX.bubble(scene.layer, REVEAL_LINE);
    await line.show();
    const [said1000, said800, said200] = line.el.querySelectorAll('.em'); // the prices in his bubble
    // A price lifts out of his bubble and flies to the card (FX.flyAcross).
    const fly = async (from, to, ms) => {
      await FX.flyAcross(scene.ui, from, to, { ms, lift: 70 }); // a low arc, out over the bubble's right side
      await ctx.wait(0); // (stops here if the player has left meanwhile)
    };

    // "The price printed on the book is ₹1000,": the ₹1000 flies out to the card, which swings in to catch it; it is
    // pasted into the top box.
    await speakPart(ctx, line, 0, 'reveal-1', 'The price printed on the book is ₹1000,', 'man');
    const flying = fly(said1000, card.prices.from, 1000);
    card.enter();
    await flying;
    await card.pasteFrom();
    await ctx.wait(400);

    // "but you paid only ₹800.": the red arrow grows down, and the ₹800 flies into the bottom box.
    await speakPart(ctx, line, 1, 'reveal-2', 'but you paid only ₹800.', 'man');
    await card.arrowDown();
    await fly(said800, card.prices.to, 900);
    await card.pasteTo();
    await ctx.wait(400);

    // "So, you got a ₹200 discount.": the ₹200 flies beside the arrow: "₹200 reduced".
    await speakPart(ctx, line, 2, 'reveal-3', 'So, you got a ₹200 discount.', 'man');
    await fly(said200, card.prices.cut, 800);
    await card.pasteCut();
    line.emphasize(); // "discount." pulses: the new word
    Sound.ding();
    ctx.advance(3000); // then Aniket wonders what it means
  }

  async function playRevealParts(ctx, scene) {
    const card = FX.reduction(scene.ui, REDUCTION_CARD);
    await ctx.wait(500);
    const fly = async (from, to, ms) => {
      await FX.flyAcross(scene.ui, from, to, { ms, lift: 70 });
      await ctx.wait(0); // (stops here if the player has left meanwhile)
    };
    let line = null;
    const part = async i => {
      if (line) {
        await line.hide();
        await ctx.wait(120);
      }
      line = revealPart(scene, i);
      await line.show();
      await speak(ctx, line, `reveal-${i + 1}`, 'man');
      return line.el.querySelector('.em');
    };
    // "See, the price printed on the book is ₹1000,": the ₹1000 flies out to the card, which swings in to catch it.
    const said1000 = await part(0);
    const flying = fly(said1000, card.prices.from, 1000);
    card.enter();
    await flying;
    await card.pasteFrom();
    await ctx.wait(400);
    // "but I am selling it to you at ₹800.": the red arrow grows down, and the ₹800 flies into the bottom box.
    const said800 = await part(1);
    await card.arrowDown();
    await fly(said800, card.prices.to, 900);
    await card.pasteTo();
    await ctx.wait(400);
    // "I gave you a discount.": the word comes beside the arrow (how much is the question on screen 10).
    await part(2);
    await card.pasteCut();
    line.emphasize(); // "discount." pulses: the new word
    Sound.ding();
    ctx.advance(3000); // then Aniket wonders what it means
  }

  // "Discount?" Coming from screen 14 the picture, the card and the bubble are first exactly as they
  // were; then the bubble and the card go, and the camera glides back to the middle. Aniket doesn't know
  // the shopkeeper's new word: his face turns puzzled (PUZZLED fades in over the picture) and he wonders
  // about it in a thought cloud.
  function setupDiscount(scene) {
    scene.carried = scene.cameFrom === 'reveal';
    if (!scene.carried) return;
    instantly(scene, () => scene.el.classList.add('is-feathered'));
    scene.oldCard = FX.reduction(scene.ui, REDUCTION_CARD);
    scene.oldCard.showNow();
    scene.oldLine = scene.v2 ? revealPart(scene, 2) : FX.bubble(scene.layer, REVEAL_LINE);
    scene.oldLine.showNow();
  }

  async function playDiscount(ctx, scene) {
    if (scene.carried) {
      await ctx.wait(500);
      scene.oldLine.hide();
      scene.oldCard.leave();
      await ctx.wait(300);
      const glide = glideCamera(ctx, scene, 1300);
      await ctx.wait(600); // about halfway: the soft right edge eases away as the picture slides over
      scene.el.classList.remove('is-feathered');
      await glide;
    }
    await ctx.wait(500);

    // He doesn't know the word: his face turns puzzled, and he wonders about it. Only he matters here (the meeting of
    // 2026-10-21: the shopkeeper isn't needed): the camera moves in on his face, and his thought comes beside his head.
    const cam = faceCamera(scene, FACE_ZOOM);
    moveCamera(scene, cam.transform, reducedMotion ? 1 : 1400);
    scene.el.classList.add('is-reacting');
    Clips.react(scene);
    Sound.wonder();
    await ctx.wait(1500);
    const tip = cam.at(DISCOUNT_THOUGHT.tip);
    const wondering = FX.thought(scene.ui, Object.assign({}, DISCOUNT_THOUGHT, { tip, at: [tip[0] + 560, tip[1] - 50] }));
    await wondering.show();
    await speak(ctx, wondering, 'disc-2', 'boy');
    wondering.emphasize();
    await ctx.wait(1200);

    // Then the answer, on this screen (the user's doc, 2026-10-23: "Swifty comes and says the definition of discount"): his
    // thought goes, the picture blurs and dims, and Swifty slides in from the right and says it in her bubble, as on
    // screen 6; then she goes, and the picture clears for the question.
    await wondering.hide();
    const veil = el('div', 'pop-veil');
    scene.ui.insertBefore(veil, scene.ui.firstChild); // (under Swifty)
    void veil.offsetWidth; // (so it fades in)
    veil.classList.add('is-on');
    await ctx.wait(reducedMotion ? 60 : 700);
    const talk = await swiftyFromRight(ctx, scene);
    await ctx.wait(300);
    await talk.show([{ t: 'The ' }, { t: 'reduction', cls: 'key' }, { t: ' given on the marked price of an item', end: true },
      { t: ' is called a ' }, { t: 'discount', cls: 'key' }, { t: '.' }]);
    await talk.part('ddef-1', 0, 600);
    await talk.part('ddef-2', 1, 600);
    talk.line.emphasize();
    Sound.ding();
    await ctx.wait(1800);
    await swiftyAway(ctx, talk);
    veil.classList.remove('is-on');
    await ctx.wait(800);
    ctx.advance(2000); // then the question: how much discount did he get?
  }

  // Aniket's thought: a cloud above and to the right of his head, its puffs rising from the top of his hair (`tip`: the
  // picture's px; on screen it follows the camera, see faceCamera).
  const DISCOUNT_THOUGHT = {
    tip: [748, 226],
    text: [{ t: 'Discount?', cls: 'key' }, { t: '\nWhat is that?' }], voice: 'boy', // (the user's doc, 2026-10-23)
    size: 54, // big (the user, 2026-10-21), in the room the shopkeeper leaves
  };
  // His face, in the picture (stage px), and where the camera brings it on screen, how close: close enough that the
  // shopkeeper (his face, his hand) is out of the picture (the user, 2026-10-21: "no need to show shopkeeper"; the
  // picture is drawn at twice the screen's size, so it stays sharp this close).
  const FACE_ZOOM = { face: [651, 300], to: [700, 640], s: 2.2 }; // (his hand, below the frame)

  // The camera on a point of the picture: `face` at `to` on screen, `s` times closer (about the world's own origin, so
  // the slow drift it had doesn't jump). at(p): where a point of the picture is on screen then.
  function faceCamera(scene, { face: [fx, fy], to: [tx, ty], s }) {
    const [ox, oy] = getComputedStyle(scene.world).transformOrigin.split(' ').map(parseFloat);
    const x = tx - ox - (fx - ox) * s;
    const y = ty - oy - (fy - oy) * s;
    return { transform: `translate(${x}px, ${y}px) scale(${s})`, at: ([px, py]) => [ox + (px - ox) * s + x, oy + (py - oy) * s + y] };
  }

  // The camera moves from where it is to `transform`, and stays there.
  function moveCamera(scene, transform, ms) {
    const from = getComputedStyle(scene.world).transform;
    if (scene.kbAnim) scene.kbAnim.cancel();
    scene.kbAnim = scene.world.animate([{ transform: from === 'none' ? 'none' : from }, { transform }],
      { duration: ms, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  }

  // Screens 11 and 12, the formula (back at the user's word, 2026-10-23: "after screen 10 add this", with pictures of both).
  // The discount formula (Swifty isn't here: a worked example, her voice on its own). The book, then the sum built one piece
  // at a time with the amounts only: the ₹1000 lifts off the book's sticker into the first box, then − ₹800, then = ₹200.
  // As her voice says the formula in words, each box's name is written in above its amount. Then a bar of ₹1000 is split
  // into ₹800 paid and ₹200 discount (the revamp's new visual), and "So, the discount is ₹200." lights up the ₹200.
  async function playFormula(ctx, scene) {
    const reader = swiftyTalk(ctx, scene.ui, null, null);
    const fp = FX.formulaPanel(scene.ui, {
      price: '₹1000',
      terms: [
        { label: 'Marked Price', value: '₹1000', tone: 'yellow' }, // the colours used since screen 13
        { label: 'Selling Price', value: '₹800', tone: 'blue' },
        { label: 'Discount', value: '₹200', tone: 'red' },
      ],
      ops: ['−', '='],
      namesLater: true, // the amounts first: each name is written in as it is said
    });
    const bar = FX.barModel(fp.side, { // under the sum, beside the book
      total: { value: '₹1000', label: 'Marked Price', tone: 'mp' },
      parts: [{ value: '₹800', label: 'paid', tone: 'sp', share: 0.8 }, { value: '₹200', label: 'discount', tone: 'd', share: 0.2 }],
    });
    await ctx.wait(450); // the screen before finishes fading away first
    fp.open();
    await ctx.wait(500);
    fp.showBook();
    await ctx.wait(900);

    // ₹1000 − ₹800 = ₹200, the amounts only (the sum builds by itself)
    fp.highlight();
    await ctx.wait(500);
    await fp.box(0, { empty: true });
    await ctx.wait(200);
    await fp.fly();
    await ctx.wait(700);
    fp.op(0);
    await ctx.wait(350);
    await fp.box(1);
    await ctx.wait(900);
    fp.op(1);
    await ctx.wait(350);
    await fp.box(2, { stamp: true });
    await ctx.wait(1000);

    // The formula in words: each box's name is written in above its amount as it is said.
    const said = ['Marked Price,', 'minus Selling Price,', 'equals Discount.']; // as recorded
    const lit = [[fp.boxes[0]], [fp.ops[0], fp.boxes[1]], [fp.ops[1], fp.boxes[2]]];
    for (const [i, parts] of lit.entries()) {
      parts.forEach((part, k) => ctx.wait(k * 420).then(() => {
        fp.ping(part);
        if (part === fp.boxes[i]) fp.name(i);
      }, () => {}));
      await reader.read(`rule-${i + 1}`, said[i], [fp.boxes[i]], 900);
    }
    await ctx.wait(400);

    // The bar: ₹1000, split into ₹800 paid and ₹200 discount; the ₹200 is the discount.
    await bar.open(ctx);
    await ctx.wait(300);
    bar.split();
    await ctx.wait(700);
    fp.glow(2); // the Discount keeps glowing
    await reader.read('f-so', 'So, the discount is ₹200.', [bar.segs[1]], 600);
    ctx.advance(NEXT_IN); // then the formula itself
  }

  // Screen 13's pictures over the prices: 16:9, centred on the term, just above the formula's strip.
  const PAY_FOCUS = [990, 500, 1.5]; // the notes handed over, both faces in view (aniket give money to shopkeeper.png)
  function overTerm(term) {
    const t = stageRect(term);
    const strip = stageRect(term.closest('.fr-strip'));
    const width = 440;
    const height = width * 9 / 16;
    return { left: t.left + t.width / 2 - width / 2, top: strip.top - 30 - height, width, height };
  }

  // The formula (Swifty isn't here: her voice on its own): first in words, written part by part as it is said; then the
  // first letters of each term light up and fly down to make the short form, D = MP − SP, on a yellow sticky note, which is
  // read out, each part lighting up as it is said.
  async function playFormulaReveal(ctx, scene) {
    const reader = swiftyTalk(ctx, scene.ui, null, null);
    const fr = FX.formulaReveal(scene.ui, {
      terms: [
        { words: 'Discount', short: 'D', tone: 'd' }, // the colours used since screen 13
        { words: 'Marked Price', short: 'MP', tone: 'mp' },
        { words: 'Selling Price', short: 'SP', tone: 'sp' },
      ],
      ops: ['=', '−'],
    });
    await ctx.wait(450); // the formula panel finishes fading away first
    fr.open();
    await ctx.wait(700);

    // In words, one part at a time; a picture comes over each price as it is said (the user, 2026-10-22): the photo of the
    // counter (the book Aniket holds) glides from the corner over "Marked Price", and Aniket paying comes over "Selling
    // Price".
    fr.term(0);
    await reader.read('fr-1', 'Discount', [fr.longTerms[0]], 700);
    fr.op(0);
    await ctx.wait(300);
    fr.term(1);
    const mp = overTerm(fr.longTerms[1]);
    scene.snapEl.style.transformOrigin = '0 0';
    FX.settle(scene.snapEl.animate([{ transform: 'none' }, { transform: `translate(${mp.left - SNAP.x}px, ${mp.top - SNAP.y}px) scale(${mp.width / SNAP.w})` }],
      { duration: reducedMotion ? 1 : 900, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }));
    await reader.read('fr-2', 'equals Marked Price,', [fr.longTerms[1]], 900);
    fr.op(1);
    await ctx.wait(300);
    fr.term(2);
    const sp = overTerm(fr.longTerms[2]);
    const pay = el('div', 'scene-snap', scene.ui, { left: `${sp.left}px`, top: `${sp.top}px`, width: `${sp.width}px`, height: `${sp.height}px` });
    Object.assign(el('img', '', pay), { src: ASSETS + 'aniket give money to shopkeeper.png', alt: '', draggable: false });
    focusOn(pay, PAY_FOCUS);
    Sound.bloop();
    FX.reveal(pay, [{ opacity: 0, transform: 'translateY(24px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.8,.3,1)' });
    await reader.read('fr-3', 'minus Selling Price.', [fr.longTerms[2]], 900);
    await ctx.wait(600);

    // In short: Swifty pops up in the bottom-left corner to say so, in her bubble, and goes (the user, 2026-10-22: its words
    // on screen, as with her "Not quite!"); then each term's first letters fly down onto the sticky note (which comes in as
    // the first ones go).
    await swiftyCorner(ctx, scene, 'fr-4', 'Let’s write it in short.', { at: ON_PANEL });
    const letters = ['D for Discount,', 'MP for Marked Price,', 'SP for Selling Price.']; // as recorded
    for (let i = 0; i < 3; i++) {
      if (i) {
        fr.shortOp(i - 1);
        await ctx.wait(350);
      }
      fr.lightUp(i);
      const saying = reader.read(`fr-${5 + i}`, letters[i], [], 800);
      saying.catch(() => {}); // if the player leaves mid-line, the waits below report it
      await ctx.wait(450);
      if (!i) fr.showShort(); // as the first letters fly down to it
      await fr.fly(i);
      await saying;
    }
    await ctx.wait(400);

    // The short form, read out: each part lights up as it is said.
    const read = [[fr.shortTerms[0]], [fr.shortOps[0], fr.shortTerms[1]], [fr.shortOps[1], fr.shortTerms[2]]];
    const said = ['So, D', '= MP', '− SP.']; // as recorded
    for (const [i, pieces] of read.entries()) {
      pieces.forEach((piece, k) => ctx.wait(k * 420).then(() => fr.ping(piece), () => {}));
      await reader.read(`fr-${8 + i}`, said[i], [], 900);
    }
    await ctx.wait(500);
    ctx.advance(NEXT_IN); // then he pays for the book (the photo grows back out into it)
  }

  // A screen over the blurred counter that starts out already blurred: during a dissolve from the screen
  // before (also blurred), only what was on top of it visibly changes.
  function blurredFromStart(scene) {
    if (scene.sheet) return; // nothing behind a sheet to blur
    el('div', 'fb-dim', scene.ui);
    hush(scene, true, { instant: true });
  }

  function setupGuide(scene) {
    blurredFromStart(scene);
  }

  // Runs of screens where Swifty keeps talking, one after another: at the end of a screen in a run, her last bubble
  // stays up (see swiftyDone); after the last, she goes. Swifty is on screen only while one of her speech bubbles is,
  // her books with her (the user's rule, 2026-10-21): she rises in with a bubble and goes back down when it goes, and a
  // line with no bubble is her voice on its own (see swiftyTalk). So she isn't there during worked solutions either.
  // (The revamp, Part 1 rule 3: she comes only to introduce an idea, ask a question or react to an answer, and celebrate
  // at a checkpoint.)
  const RUNS = [['left', 'two'], ['recap', 'takeaway']];
  const lastOfRun = scene => {
    const run = RUNS.find(r => r.includes(scene.id));
    return !run || run[run.length - 1] === scene.id;
  };

  // The revamp: Swifty's books are there only with her (they come and go together).
  function standFor(scene) {
    const stand = el('img', 'sheet-stand', scene.ui);
    Object.assign(stand, { src: STAND, alt: '', draggable: false });
    return stand;
  }

  // Swifty on her stand (CORNER), ready to talk (her bubbles go above her head). She is out of sight until her first
  // bubble: then she and her books rise in together from the bottom edge (swiftyIn), and they go back down when her
  // bubble goes (swiftyOut). { size }: her bubbles' text size (default 34 px).
  async function cornerSwifty(ctx, scene, { size, within = CORNER.bubbles } = {}) { // (within: her bubbles' room)
    let bird = scene.bird && !scene.bird.gone ? scene.bird : null;
    if (!bird) {
      const stand = standFor(scene); // first, so that she is drawn over it: both feet on the top book
      bird = new FX.Bird(scene.ui, SWIFTY, { scale: CORNER.s });
      bird.place(CORNER.x, CORNER.y);
      bird.shadowOn(true);
      bird.stand = stand;
      bird.here = false;
      [bird.root, bird.stand].forEach(n => { n.style.visibility = 'hidden'; });
      scene.bird = bird;
    }
    return swiftyTalk(ctx, scene.ui, bird, b => Object.assign(overHead(b, within), size ? { size } : {},
      scene.cornerClear ? { avoid: scene.cornerClear } : {}));
  }

  // She and her books rise in from the bottom edge and settle (for a bubble)…
  async function swiftyIn(ctx, bird) {
    if (!bird || bird.here || bird.gone) return;
    bird.here = true;
    [bird.root, bird.stand].forEach(n => { n.style.visibility = ''; });
    const ms = reducedMotion ? 1 : 650;
    const rise = d => [{ transform: `translateY(${d}px)`, opacity: 0 }, { transform: 'translateY(-8px)', opacity: 1, offset: 0.75 }, { transform: 'none', opacity: 1 }];
    bird.stand.animate(rise(380), { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)' });
    bird.body.animate(rise(475), { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1)' }); // (her body is drawn at 0.8)
    Sound.chirp();
    await ctx.wait(ms);
  }

  // …and go back down out of sight (when it has gone).
  async function swiftyOut(ctx, bird) {
    if (!bird || !bird.here) return;
    bird.here = false;
    const ms = reducedMotion ? 1 : 480;
    const sink = d => [{ transform: 'none', opacity: 1 }, { transform: `translateY(${d}px)`, opacity: 0 }];
    const going = [bird.stand.animate(sink(380), { duration: ms, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }),
      bird.body.animate(sink(475), { duration: ms, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })];
    await ctx.wait(ms);
    [bird.root, bird.stand].forEach(n => { n.style.visibility = 'hidden'; });
    going.forEach(a => a.cancel());
  }

  // Swifty's part is over: if she is there, she waves with her last bubble still up; then the bubble goes, and she and
  // her books go back down with it.
  async function flyOff(ctx, bird, bubble) {
    await ctx.wait(600); // her last words sink in first
    if (bird.here) {
      bird.wave();
      await ctx.wait(450);
    }
    if (bubble) await bubble.hide();
    await swiftyOut(ctx, bird);
    bird.stand.remove();
    bird.remove();
    bird.gone = true; // (cornerSwifty brings her back if she is needed again)
  }

  // Swifty's lines on this screen are done. If she talks on the next screen too (the same run), she stays on her
  // stand, upright again as she is when that screen starts, and her last bubble stays up; at the end of a run she
  // flies off, her bubbles (and any `extra` ones, e.g. a note) going with her.
  async function swiftyDone(ctx, scene, talk, extra = []) {
    if (lastOfRun(scene)) {
      extra.forEach(b => b.hide());
      await flyOff(ctx, talk.bird, talk.line);
      return;
    }
    await ctx.wait(1000);
    talk.bird.idle();
  }

  // The end of a screen where Swifty talks: see swiftyDone; the screen holds `ms`, then on to the next.
  function endWithSwifty(ctx, scene, talk, ms = NEXT_IN, extra = []) {
    swiftyDone(ctx, scene, talk, extra).catch(err => { if (err !== CANCELLED) console.error(err); });
    ctx.advance(ms);
  }

  // What to remember shows only when the learner needs it (the meeting of 2026-10-21): after a first wrong answer, the
  // formula pops in on a small sticky note under the photo, with "Remember" over it.
  const PERCENT_HINT = {
    note: [{ t: 'Percentage' }, { t: '=' }, { t: 'Part', tone: 'part' }, { t: '÷' }, { t: 'Whole', tone: 'whole' }, { t: '× 100' }],
    say: ['To find the percentage,', 'divide the part by the whole,', 'then multiply by 100.'],
  };
  function rememberBox(scene, segments) {
    const box = el('div', 'remember', scene.ui.querySelector('.q-slot') || scene.ui); // (under the answers: css .q-slot)
    el('small', '', box).textContent = 'Remember';
    const note = FX.formulaNote(box, segments, { small: true });
    if (!reducedMotion) {
      box.animate([{ opacity: 0, transform: 'translateY(18px) scale(.9)' }, { opacity: 1, transform: 'none' }],
        { duration: 450, easing: 'cubic-bezier(.2,.8,.3,1)' });
    }
    Sound.swish();
    return note;
  }

  // A first wrong answer, with a second try: "Not quite! Try again!" in her bubble; between the two, what to remember
  // comes in (`show` brings it in and returns it) and her voice reads it out, her bubble staying up.
  async function tryAgain(ctx, talk, id, show, lines) {
    await talk.show([{ t: 'Not quite!', end: true }, { t: '\nTry again!' }]);
    await talk.part(`${id}-1`, 0, 300);
    const lit = show();
    await ctx.wait(450);
    for (const [k, line] of lines.entries()) await talk.voice(`${id}-r${k}`, line, [lit], 250);
    await talk.part(`${id}-2`, 1, 300);
  }

  // The blue sneakers on the stand in the shoe shop, as Aniket points at them (stage px), for the light sweeping
  // across them.
  const SNEAKERS = [[1045, 600], [1070, 545], [1150, 500], [1230, 462], [1330, 470], [1400, 448], [1505, 452], [1540, 520],
    [1540, 610], [1450, 640], [1150, 645], [1050, 630]];

  // A new find: in a shoe shop in the mall, a pair of blue sneakers on the stand catches Aniket's eye, and he points
  // at them.
  async function playSneakers(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 1290, 548, 560, 260, { cls: 'glow--book', delay: 0 });
    await ctx.wait(700);
    FX.shine(L, SNEAKERS, { duration: 1100, width: 160 });
    Sound.sparkle();
    await ctx.wait(800);
    // Aniket's lines, one bubble at a time, right of his face, above the sneakers (the tail at his mouth), as on 35.
    const say = async (text, id) => {
      const line = FX.bubble(L, { anchor: FINAL_LINE.anchor, corner: 'bl', tip: FINAL_LINE.tip, text, voice: 'boy', rotate: -1.5 });
      await line.show();
      await speak(ctx, line, id, 'boy');
      return line;
    };
    await say([{ t: 'Wow, nice sneakers! ' }, { t: 'I love them.' }], 'sneakers'); // (the user's doc, 2026-10-23)
    ctx.advance(3000); // then a closer look (the 30% OFF comes after the question on their price: screen 18)
  }

  // Nothing to say here: Aniket points at the sneakers, and the camera moves in on their ₹1800 price tag (the clip,
  // s23-zoom); the screen waits for it to get there.
  async function playShoe(ctx) {
    if (Clips.has('s23-zoom')) {
      await ctx.wait(5000, { real: true });
      ctx.advance(2000);
      return;
    }
    await ctx.wait(600);
    ctx.advance(2600);
  }

  // The red "30% OFF" label on the front of the sneakers' stand: a glowing frame hugging it (stage px). It sits
  // here on screens 22 and 35; on 25 the picture shows the stand a little closer (THINKING_OFF_TAG).
  const OFF_TAG = { x: 1253, y: 733, w: 322, h: 141, round: 24 };
  const THINKING_OFF_TAG = { x: 1284, y: 778, w: 336, h: 153, round: 26 };

  // The ₹1800 card is the picture's: its clips blur the price into "e1800" (laid on first, so the rings stay on top).
  function setupConfused(scene) {
    pictureOver(scene, PRICE_CARD_FACE);
  }

  // Aniket, hand on his chin, looks at the sneakers' tags: he says what he sees, and asks how much he will actually
  // pay, one bubble at a time, right of his face, the tail at his mouth by his hand.
  const SHOE_SAY = { anchor: [717, 332], corner: 'bl', tip: [655, 342], voice: 'boy', rotate: -1.5 };
  // (The user's doc, 2026-10-23: "The price tagged on it will be ₹1800"; "What 30% off means here, if this is discount
  // how much I actually have to pay.")
  const SHOE_PRICE = Object.assign({ text: [{ t: 'The price tagged on it is ' }, { t: '₹1800', em: true }, { t: '.' }] }, SHOE_SAY);
  const SHOE_OFF = Object.assign({ text: [{ t: 'What does ' }, { t: '30% OFF', em: true }, { t: ' mean here?' }] }, SHOE_SAY);
  const SHOE_PAY = Object.assign({
    text: [{ t: 'If this is a ' }, { t: 'discount', cls: 'key' }, { t: ', how much do I actually have to pay?' }],
  }, SHOE_SAY);
  const PRICE_CARD = { x: 1346, y: 634, w: 196, h: 152, round: 16 }; // the white ₹1800 card on the sneakers (stage px)
  const PRICE_CARD_FACE = [1259, 566, 173, 135]; // that card's face, with a little round it: x, y, w, h (stage px)
  // The ₹1800 tent card on the stand, with a little round it, on the picture of screens 22 and 35 (he saw a shoe.png):
  // their clips redraw the price roughly, so the picture's is laid over them.
  const TENT_CARD = { 'he saw a shoe.png': [1196, 538, 236, 130] };
  function tentCard(scene) {
    pictureOver(scene, TENT_CARD[scene.bg.slice(ASSETS.length)]);
  }

  // Screen 16: he says the price he sees (the price card on the sneakers lights up); then the question on it (screen 17).
  async function playConfused(ctx, scene) {
    await ctx.wait(700);
    const price = FX.bubble(scene.layer, SHOE_PRICE);
    FX.ring(scene.layer, PRICE_CARD);
    Sound.sparkle();
    await price.show();
    await speak(ctx, price, 'shoe-price', 'boy');
    price.emphasize();
    ctx.advance(3000); // then the question card on it
  }

  // Screen 17: the marked price of the sneakers, on a card on the left (the sneakers and their tags sharp on the right).
  async function playSneakerCard(ctx, scene) {
    await ctx.wait(650);
    await cardQuestion(ctx, scene, {
      id: 'smq',
      lines: ['The {marked price} of', 'the sneakers is —'],
      options: [{ label: '30%' }, { label: '₹1800', correct: true }, { label: '₹1830' }],
      why: '{₹1800} is the price tagged on the sneakers: their *marked price*.',
      said: 'Correct! ₹1800 is the price tagged on the sneakers: their marked price.',
      hint: [{ t: 'Not quite!' }, { t: ' Check the price tagged on the sneakers.' }],
      hintAt: 'corner', // (on her books, bottom right: the card is on the left)
      fromLeft: true,
      onHint: () => { // the price card on the sneakers lights up
        FX.ring(scene.ui, PRICE_CARD);
        Sound.sparkle();
      },
    });
  }

  // Screen 18: then he sees the 30% OFF tag, and wonders (the user's doc, 2026-10-23), one bubble at a time.
  async function playOffMeans(ctx, scene) {
    await ctx.wait(500);
    FX.ring(scene.layer, THINKING_OFF_TAG); // the 30% OFF label lights up first
    Sound.sparkle();
    await ctx.wait(700);
    const off = FX.bubble(scene.layer, SHOE_OFF);
    await off.show();
    await speak(ctx, off, 'off-what', 'boy');
    off.emphasize();
    await ctx.wait(900);
    await off.hide();
    await ctx.wait(250);
    const ask = FX.bubble(scene.layer, SHOE_PAY);
    await ask.show();
    await speak(ctx, ask, 'shoe-ask', 'boy');
    ask.emphasize();
    await ctx.wait(1200);
    await ask.hide();

    // What 30% OFF means (the user, 2026-10-22: "show only the shoes and the discount, and Swifty comes and says it"; no
    // panel): the camera moves in on the sneakers and their tags, everything else blurs, and Swifty slides in from the
    // right and says "30% OFF means 30% Discount." in her bubble (the 30% OFF tag is still lit); then she goes with it.
    const cam = faceCamera(scene, SHOES_CAM);
    moveCamera(scene, cam.transform, reducedMotion ? 1 : 1500);
    await ctx.wait(1600);
    shoesFocus(scene, cam, { instant: false });
    await ctx.wait(reducedMotion ? 60 : 800);
    const talk = await swiftyFromRight(ctx, scene, false, { bubbles: SHOES_BUBBLES });
    await ctx.wait(200);
    await talk.show([{ t: '30% OFF', em: true }, { t: ' means', end: true }, { t: '\n30% ' }, { t: 'discount', cls: 'key' }, { t: ' here.' }]);
    await talk.part('om-1', 0, 600);
    await talk.part('om-2', 1, 600);
    talk.line.emphasize();
    await ctx.wait(1400);
    await swiftyAway(ctx, talk);
    ctx.advance(NEXT_IN); // then the sneakers, and what we need to work it out
  }
  // The camera on the sneakers and their two tags (the picture's px), and where they come on screen, how close.
  const SHOES_CAM = { face: [1300, 650], to: [1000, 560], s: 1.5 };
  // Swifty's bubbles there: right of the sneakers (on screen they end at x 1477), so none covers them (the user,
  // 2026-10-23: her bubble on screen 21 was over the shoes); a long line wraps into more lines.
  const SHOES_BUBBLES = [1495, 1890];
  // The sharp window round the sneakers and their tags, as the camera `cam` shows them (screens 19 and 20).
  function shoesFocus(scene, cam, opts) {
    const [x0, y0] = cam.at([STAND_FOCUS.x, STAND_FOCUS.y]);
    const [x1, y1] = cam.at([STAND_FOCUS.x + STAND_FOCUS.w, STAND_FOCUS.y + STAND_FOCUS.h]);
    return standFocus(scene, { x: x0, y: y0, w: x1 - x0, h: y1 - y0, round: STAND_FOCUS.round * SHOES_CAM.s, soft: STAND_FOCUS.soft }, opts);
  }

  const SNEAKER_CARD = { photo: ASSETS + 'ui/sneakers.png', price: '₹1800', off: ['30%', 'OFF'], knot: [60, 49] };

  // A line read out while something happens on the panel `ms` into it (`at`).
  async function readWith(ctx, talk, id, text, ms, at, cues = []) {
    const saying = talk.read(id, text, [], 600, cues);
    saying.catch(() => {}); // if the player leaves mid-line, the wait below reports it
    await ctx.wait(ms);
    const done = at();
    await saying;
    return done;
  }

  // The link to percentages: the sneakers' card (photo, price tag, 30% OFF tag); and Swifty says what comes next in her
  // bubble (a line linking two topics). Then she goes (28–29 are worked without her).
  // Screen 20 (the user, 2026-10-22: "like 19: only this dialogue, the rest blurred, only the shoes visible"): the shop as
  // screen 19 ends, the camera on the sneakers and their tags and everything else blurred; Swifty slides in from the
  // right and says what comes next in her bubble, the 30% OFF tag lit as she says "discount amount"; then she goes.
  function setupRecall(scene) {
    const cam = faceCamera(scene, SHOES_CAM);
    scene.world.style.transform = cam.transform;
    shoesFocus(scene, cam);
  }

  async function playRecall(ctx, scene) {
    await ctx.wait(400);
    const talk = await swiftyFromRight(ctx, scene, false, { bubbles: SHOES_BUBBLES });
    await ctx.wait(200);
    // (The user's doc, 2026-10-23: "To calculate how much Aniket has to pay to buy these sneakers, let's recall the
    // percentage of a value concept.")
    await talk.show([
      { t: 'To calculate how much Aniket has to pay for these sneakers,', end: true },
      { t: ' let’s first recall how ' }, { t: 'percentages', cls: 'key' }, { t: ' work.' },
    ]);
    FX.ring(scene.layer, THINKING_OFF_TAG); // the 30% OFF (on the picture: it moves with the camera)
    Sound.sparkle();
    await talk.part('recall-1', 0, 600);
    await talk.part('recall-2', 1, 600);
    await ctx.wait(1200);
    await swiftyAway(ctx, talk);
    ctx.advance(NEXT_IN); // then the rule
  }

  // The answers to a question: they slide in under it, stacked, while Swifty points at them. Then she explains: right()
  // after a right pick (with sparkles), wrong(answers) after a wrong one, and so(answers) either way. With hint(answers)
  // (the meeting of 2026-10-21: what to remember shows only after a wrong answer), a first wrong pick gets the hint and a
  // second try; wrong() comes only if that one is wrong too (it shows the answer).
  // Once she is done (she goes, at the end of her run), the screen moves on by itself NEXT_IN later (no Next button of
  // its own); with { auto: true }, 3 seconds after her answer; or it carries on with then(answers).
  async function percentQuestion(ctx, scene, t, talk, { options, right, wrong, so, hint = null, stack = false, auto = false, then = null }) {
    const answers = FX.choices(t.below, {
      options,
      stack,
      tries: hint ? 2 : 1,
      onAnswer(correct, button, i, last) {
        const reply = last ? explain(correct, button) : giveHint();
        reply.catch(err => { if (err !== CANCELLED) console.error(err); });
      },
    });
    async function giveHint() {
      answers.lock();
      await ctx.wait(800); // let the shake and buzz land first
      await hint(answers);
      answers.unlock();
      talk.bird.point();
    }
    async function explain(correct, button) {
      if (correct) {
        const [x, y] = stagePoint(button);
        FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] }); // (sparkles: a right answer)
        await ctx.wait(700);
        await right();
      } else {
        await ctx.wait(800); // let the shake and buzz land first
        await wrong(answers);
      }
      await ctx.wait(500);
      await so(answers);
      if (talk.line) talk.line.emphasize();
      talk.bird.point();
      if (then) {
        await then(answers);
        return;
      }
      if (auto) {
        endWithSwifty(ctx, scene, talk); // on by itself, 3 seconds later
        return;
      }
      if (lastOfRun(scene)) await swiftyDone(ctx, scene, talk); // she goes
      else talk.bird.idle();
      ctx.advance(NEXT_IN); // then on by itself
    }
    await answers.enter(ctx);
    talk.bird.point();
  }

  // How screens 28, 29 and 37 begin: the panel springs up and the question is read out (its words are on the strip, lit
  // as it is read); then the part and the whole: each takes its colour in the question as it is said, and its box comes in.
  // `talk` reads: her voice on its own (28, 29), or Swifty herself (37).
  async function percentStart(ctx, f, ask, [part, whole], talk) {
    await ctx.wait(450); // the panel before finishes fading away first
    f.open();
    const asked = f.showQuestion(); // (with the panel: it is never empty)
    await ctx.wait(600);
    await asked;
    await ctx.wait(300);
    const strip = f.el.querySelector('.pf-question');
    await talk.read('wp-ask', ask, [strip], 1400);
    await ctx.wait(400);
    f.tag('part');
    await readWith(ctx, talk, 'wp-part', `${part} is the part,`, 600, () => f.box('part'), [[part, f.tags.part]]);
    f.tag('whole');
    await readWith(ctx, talk, 'wp-whole', `and ${whole} is the whole.`, 700, () => f.box('whole'), [[whole, f.tags.whole]]);
    await ctx.wait(500);
  }

  // Then the formula is written in as it is said, each word on the sheet lit as it is spoken; and the part goes on top
  // and the whole below: they fly out of their boxes into the next line.
  async function percentRule(ctx, talk, f) {
    const q = sel => f.el.querySelector(sel);
    const label = q('.pf-sheet .pf-label');
    const top = q('.pf-sheet .pf-num');
    const bottom = q('.pf-sheet .pf-den');
    const times = q('.pf-sheet .pf-times');
    let writing = null;
    await readWith(ctx, talk, 'wp-rule-1', 'To find the percentage,', 500, () => { writing = f.label(); }, [['percentage', label]]);
    await writing;
    await readWith(ctx, talk, 'wp-rule-2', 'divide the part by the whole,', 400, () => { writing = f.fraction(); }, [['part', top], ['whole', bottom]]);
    await writing;
    await readWith(ctx, talk, 'wp-rule-3', 'then multiply by 100.', 700, () => f.times(0), [['100', times]]);
    await ctx.wait(500);
    await f.start(1);
    await ctx.wait(300);
    let flying = null;
    await readWith(ctx, talk, 'wp-put-1', 'Put the part on top,', 500, () => {
      f.hint();
      flying = f.fly('part');
    });
    await flying;
    await readWith(ctx, talk, 'wp-put-2', 'and the whole below.', 500, () => { flying = f.fly('whole'); });
    await flying;
    await f.times(1);
    await ctx.wait(600);
  }

  // The answer lands and is circled in red pen (one effect: no sparkles).
  function markAnswer(scene, f) {
    f.mark();
    f.tag('part');
    f.tag('whole');
  }

  // The rule first, in general: "a is what percent of b?" (Swifty isn't here: a worked example, her voice on its own.) a is
  // the part and b the whole, and the formula is written line by line as it is said: Percentage = Part / Whole × 100 =
  // a / b × 100 = (a / b × 100)%. Then "Let's take an example!"
  const PERCENT_RULE = {
    question: [{ t: 'a', role: 'part' }, { t: ' is what percent of ' }, { t: 'b', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: 'a' },
    whole: { label: 'Whole', value: 'b' },
    numbers: ['a', 'b'],
    letters: true,
  };

  // Screens 21–27 (the user, 2026-10-22: "remove the panel, show it in the image; a small panel on the image of the shoes"):
  // on the shoe shop's picture, the working on a small panel on it.
  const practiceHost = scene => growPapers(el('div', 'practice-host', scene.ui));
  // Such a panel comes in with what is first on it (never empty).
  const panelIn = node => FX.reveal(node, [{ opacity: 0, transform: 'translateY(30px) scale(.94)' }, { opacity: 1, transform: 'none' }],
    { duration: 500, easing: 'cubic-bezier(.2,.8,.3,1)' });

  // And its paper grows down as what is on it comes in: it reaches just below the lowest piece showing (a piece still to
  // come has opacity 0 set on it, or on a box round it), so no empty paper waits under the question for the answers.
  // (css .practice-host .is-growing: the paper is drawn behind the panel's content, --grown tall)
  function growPapers(host) {
    const papers = () => [...host.querySelectorAll('.pf-panel, .qp-panel, .pqp-panel, .ws-panel')]
      .map(n => (n.classList.contains('ws-panel') ? n.parentElement : n)); // (a worked sheet's paper is the box round it)
    const waiting = (node, paper) => {
      for (let n = node; n && n !== paper; n = n.parentElement) if (n.style.opacity === '0') return true;
      return false;
    };
    const painted = node => {
      if ([...node.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()) || /^(IMG|CANVAS|BUTTON)$/.test(node.tagName)) return true;
      const cs = getComputedStyle(node);
      return cs.backgroundImage !== 'none' || !/^(transparent|rgba\(.*,\s*0\))$/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0;
    };
    const bottom = (node, paper) => { // where it ends on the paper, as laid out (not where a moving piece is for a moment)
      let y = node.offsetHeight;
      for (let n = node; n !== paper; n = n.offsetParent) {
        if (!n || !n.offsetParent) return 0; // (not shown at all)
        y += n.offsetTop + (n.offsetParent === paper ? 0 : n.offsetParent.clientTop);
      }
      return y;
    };
    const fit = paper => {
      paper.classList.add('is-growing');
      let low = 0;
      for (const node of paper.querySelectorAll('*')) {
        if (node instanceof HTMLElement && !waiting(node, paper) && painted(node)) low = Math.max(low, bottom(node, paper));
      }
      const h = low ? Math.ceil(low + parseFloat(getComputedStyle(paper).paddingBottom)) : 0;
      const was = paper.style.getPropertyValue('--grown');
      if (was === h + 'px') return;
      if (!parseFloat(was)) { // its first piece: the paper is that size at once (it springs up with it)
        paper.classList.add('is-instant');
        requestAnimationFrame(() => requestAnimationFrame(() => paper.classList.remove('is-instant')));
      }
      paper.style.setProperty('--grown', h + 'px');
    };
    new MutationObserver(() => papers().forEach(fit))
      .observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['style'] });
    return host;
  }

  // Screens 21–23: the whole picture blurs and dims behind the panel in the middle (the user, 2026-10-22).
  function allBlur(scene, { instant = true } = {}) {
    const veil = el('div', instant ? 'spot-veil is-on is-instant' : 'spot-veil', null);
    scene.ui.insertBefore(veil, scene.ui.firstChild); // (under everything on the screen: only the picture blurs)
    Object.assign(veil.style, { webkitMaskImage: 'none', maskImage: 'none' });
    if (!instant) {
      void veil.offsetWidth; // (so it fades in)
      veil.classList.add('is-on');
    }
    return veil;
  }

  // Screen 21, coming from screen 20: it begins on 20's view (the camera on the sneakers, only they sharp), so the change
  // is seamless; then everything blurs as the camera eases back out (zoomOutOfShoes), and the panel comes in.
  function setupPracticeStart(scene) {
    if (scene.cameFrom !== 'recall' || reducedMotion) {
      allBlur(scene);
      return;
    }
    const cam = faceCamera(scene, SHOES_CAM);
    scene.world.style.transform = cam.transform;
    scene.shoesView = shoesFocus(scene, cam);
  }
  async function zoomOutOfShoes(ctx, scene) {
    const spot = scene.shoesView;
    if (!spot) return;
    scene.shoesView = null;
    allBlur(scene, { instant: false });
    spot.classList.remove('is-instant', 'is-on'); // (it fades out as the whole blur fades in)
    await ctx.wait(500);
    moveCamera(scene, 'none', 1300);
    await ctx.wait(1300);
    spot.remove();
  }

  // Screens 24–26: the picture blurs and dims but the stand with the sneakers and their two tags, the point of all this maths (the user,
  // 2026-10-22: "blur the image, focus on shoes and discount"): a soft-edged window in the veil (its mask: an SVG).
  const STAND_FOCUS = { x: 1040, y: 425, w: 610, h: 450, round: 70, soft: 22 }; // the picture's stage px
  function standFocus(scene, rect = STAND_FOCUS, { instant = true } = {}) { // (rect: on screen, when the camera has moved)
    const { x, y, w, h, round: r, soft } = rect;
    const hole = `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
      `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><filter id="s" filterUnits="userSpaceOnUse" ' +
      `x="-300" y="-300" width="2520" height="1680"><feGaussianBlur stdDeviation="${soft}"/></filter>` +
      `<path filter="url(#s)" fill-rule="evenodd" d="M-200 -200H2120V1280H-200Z ${hole}"/></svg>`;
    const veil = el('div', instant ? 'spot-veil is-on is-instant' : 'spot-veil', null);
    scene.ui.insertBefore(veil, scene.ui.firstChild); // (under everything on the screen: only the picture blurs)
    const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    Object.assign(veil.style, { webkitMaskImage: mask, maskImage: mask, webkitMaskSize: '100% 100%', maskSize: '100% 100%', webkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' });
    if (!instant) {
      void veil.offsetWidth; // (so it fades in)
      veil.classList.add('is-on');
    }
    return veil;
  }

  async function playPercentRule(ctx, scene) {
    await zoomOutOfShoes(ctx, scene); // (from screen 20)
    const voice = swiftyTalk(ctx, scene.ui, null, null);
    const f = FX.percentFormula(practiceHost(scene), PERCENT_RULE);
    await percentStart(ctx, f, 'a is what percent of b?', ['a', 'b'], voice);
    await percentRule(ctx, voice, f);
    // The last line, (a / b × 100)%: the answer is a percentage.
    await f.start(2);
    await readWith(ctx, voice, 'pr-sign', 'Then put a % sign after it.', 500, () => f.answer());
    markAnswer(scene, f);
    await ctx.wait(900);
    // Then Swifty rises in on her books with what comes next (the user, 2026-10-23: "Let's have some practice!" before
    // screen 23, not on 24; it takes the place of "Let's take an example!"), her bubble right of the panel, and goes.
    const talk = await cornerSwifty(ctx, scene, { within: [1500, 1890] });
    talk.bird.point();
    await talk.say('practice', [{ t: 'Let’s have some ' }, { t: 'practice', cls: 'key' }, { t: '!' }], 600);
    await ctx.wait(1200);
    await talk.clear(); // (she goes with her bubble)
    ctx.advance(NEXT_IN); // then the example
  }

  // The example: "125 is what percent of 500?" (her voice on its own), worked out the same way; then a 10 × 10 grid shows
  // it: 25 of the hundred squares shaded, 25 out of 100 = 25% (the revamp's new visual).
  const WHAT_PERCENT = {
    question: [{ t: '125', role: 'part' }, { t: ' is what percent of ' }, { t: '500', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: '125' },
    whole: { label: 'Whole', value: '500' },
    numbers: ['125', '500'],
    answer: '25%',
  };

  async function playWhatPercent(ctx, scene) {
    const voice = swiftyTalk(ctx, scene.ui, null, null);
    const f = FX.percentFormula(practiceHost(scene), WHAT_PERCENT);
    const grid = FX.grid100(f.panel, { shade: 25, label: '25 out of 100 = 25%' }); // under the working (css .practice-host .g100)
    await percentStart(ctx, f, '125 is what percent of 500?', ['125', '500'], voice);
    await percentRule(ctx, voice, f);
    await voice.read('wp-work', '125 ÷ 500 × 100', [], 600);
    await f.start(2);
    await readWith(ctx, voice, 'wp-equals', '= 25%.', 350, () => f.answer());
    markAnswer(scene, f);
    await ctx.wait(400);
    grid.open();
    await grid.fill(ctx);
    await voice.read('wp-so', 'So, 125 is 25% of 500!', [grid.el], 600);
    ctx.advance(NEXT_IN); // then a quick check
  }

  // A quick check: "250 is what percent of 1000?" Swifty rises in on her books and reads it out (its words are on the
  // strip), and three answers slide in, stacked. Whichever the player picks, she explains it the way screen 29 worked it
  // out (the part and the whole take their colours in the question as she names them), and the same 10 × 10 grid shows
  // 25%, under the snapshot.
  const CHECK = {
    question: [{ t: '250', role: 'part' }, { t: ' is what percent of ' }, { t: '1000', role: 'whole' }, { t: '?' }],
  };
  const CHECK_SUM = [{ t: '250', cls: 'tone-part' }, { t: ' ÷ ' }, { t: '1000', cls: 'tone-whole' }, { t: ' × 100 = ' }, { t: '25%', em: true }, { t: '.' }];

  async function playCheck(ctx, scene) {
    const q = FX.questionPanel(practiceHost(scene), CHECK);
    const grid = FX.grid100(q.slot, { shade: 25, label: '25 out of 100 = 25%' }); // under the answers, at the end
    await ctx.wait(450); // the formula finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she asks the question ("Let's have some practice!" is said before 23)
    arriving.catch(() => {});
    q.open();
    const asked = q.showQuestion(); // (with the panel: it is never empty)
    await ctx.wait(600);
    await asked;
    const talk = await arriving;
    await ctx.wait(300);
    await talk.read('cfu-ask', '250 is what percent of 1000?', [scene.ui.querySelector('.pf-question')], 1400);
    await ctx.wait(400);

    await percentQuestion(ctx, scene, q, talk, {
      options: [{ label: '20%' }, { label: '25%', correct: true }, { label: '50%' }],
      stack: true,
      // A first wrong answer: what to remember (the percentage formula), and a second try.
      hint: () => tryAgain(ctx, talk, 'cfu-hint', () => rememberBox(scene, PERCENT_HINT.note), PERCENT_HINT.say),
      // Right: "Correct! 250 ÷ 1000 × 100 = 25%." (the part and the whole take their colours as she says them)
      async right() {
        await talk.show([{ t: 'Correct!', cls: 'stress', end: true }, { t: '\n' }, ...CHECK_SUM]);
        await talk.part('cfu-right-1', 0, 600);
        const saying = talk.part('cfu-right-2', 1, 600);
        saying.catch(() => {}); // if the player leaves mid-line, the waits below report it
        await ctx.wait(250);
        q.tag('part');
        await ctx.wait(700);
        q.tag('whole');
        await saying;
      },
      // Wrong: "Not quite! 250 is the part, 1000 is the whole. 250 ÷ 1000 × 100 = 25%." (then the right answer lights up)
      async wrong(answers) {
        await talk.show([
          { t: 'Not quite!', end: true },
          { t: '\n' }, { t: '250', cls: 'tone-part' }, { t: ' is the ' }, { t: 'part', cls: 'tone-part' }, { t: ',', end: true },
          { t: '\n' }, { t: '1000', cls: 'tone-whole' }, { t: ' is the ' }, { t: 'whole', cls: 'tone-whole' }, { t: '.', end: true },
          { t: '\n' }, ...CHECK_SUM,
        ]);
        await talk.part('cfu-wrong-1', 0, 600);
        await partWith(ctx, talk, 'cfu-wrong-2', 1, 300, () => q.tag('part'));
        await partWith(ctx, talk, 'cfu-wrong-3', 2, 300, () => q.tag('whole'));
        await partWith(ctx, talk, 'cfu-wrong-4', 3, 1900, () => answers.show(1));
      },
      // Both ways: "So, 250 is 25% of 1000." while the grid shows 25 of 100 (where the hint was, if there was one).
      async so(answers) {
        scene.ui.querySelectorAll('.remember').forEach(n => FX.settle(n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })).then(() => n.remove()));
        grid.open();
        const filling = grid.fill(ctx);
        filling.catch(() => {});
        await talk.show([
          { t: 'So, ' }, { t: '250', cls: 'tone-part' }, { t: ' is ' }, { t: '25%', em: true },
          { t: '\nof ' }, { t: '1000', cls: 'tone-whole' }, { t: '.' },
        ]);
        await partWith(ctx, talk, 'cfu-so', 0, 700, () => {
          answers.ping(1);
          q.tag('part');
          q.tag('whole');
        });
        await filling;
      },
    });
  }

  // Swifty says one part of her bubble; `at` (after `ms` of it) shows what she is talking about.
  async function partWith(ctx, talk, id, i, ms, at) {
    const saying = talk.part(id, i, 600);
    saying.catch(() => {}); // if the player leaves mid-line, the wait below reports it
    await ctx.wait(ms);
    at();
    await saying;
  }

  // 30% of ₹1800, worked out (Swifty isn't here: her voice on its own). On graph paper, line by line as it is said:
  //   30% = 30/100,   30% of ₹1800 = 30/100 × 1800,   = ₹540 (circled in red pen);
  // then a bar of ₹1800 cut into ten parts of ₹180, three of them shaded: 30% = ₹540 (the revamp's new visual).
  const THIRTY_SHEET = {
    big: true,
    rows: [
      { label: [{ t: '30%' }], parts: [{ frac: ['30', '100'], cls: 'tone-pct' }] },
      { label: [{ t: '30% of ₹1800' }], parts: [{ frac: ['30', '100'], cls: 'tone-pct' }, { t: '× 1800' }] },
      { parts: [{ answer: '₹540' }] },
    ],
  };

  async function playThirty(ctx, scene) {
    const voice = swiftyTalk(ctx, scene.ui, null, null);
    const w = FX.workedSheet(practiceHost(scene), THIRTY_SHEET);
    const bar = FX.barModel(w.el, { total: { value: '₹1800', label: 'Marked Price', tone: 'mp' }, tenths: { each: '₹180', shade: 3, label: 'Discount: 3 parts = 30% = ₹540', tone: 'd' } });
    w.el.style.opacity = '0'; // (the small panel comes in with its first line: never empty)
    await ctx.wait(450); // the question finishes fading away first
    w.open();
    // 30% = 30/100
    await readWith(ctx, voice, 'th-1', '30% means', 200, () => { panelIn(w.el); return w.write(0); });
    await readWith(ctx, voice, 'th-2', '30 out of 100.', 300, () => w.part(0, 0));
    await ctx.wait(400);
    // 30% of ₹1800 = 30/100 × 1800
    await readWith(ctx, voice, 'th-3', 'So, 30% of ₹1800 =', 200, () => w.write(1));
    let writing = null;
    await readWith(ctx, voice, 'th-4', '30/100 × 1800', 300, () => { writing = w.part(1, 0).then(() => w.part(1, 1)); });
    await writing;
    await ctx.wait(400);
    // 1800 ÷ 100 = 18, and 18 × 30 = 540: the answer lands, circled in red.
    const sum = w.rows[1].parts;
    await readWith(ctx, voice, 'th-5', '1800 ÷ 100 = 18,', 300, () => {
      w.ping(sum[1]);                              // × 1800
      w.ping(sum[0].querySelector('.pf-den'));     // and the 100
    });
    await readWith(ctx, voice, 'th-6', 'and 18 × 30 = 540.', 300, () => w.ping(sum[0].querySelector('.pf-num'))); // the 30
    await w.write(2);
    await readWith(ctx, voice, 'th-7', 'So, it’s ₹540!', 450, () => w.answer(2));
    w.mark(2);
    // The bar: ₹1800 in ten parts of ₹180; three shaded are 30%, ₹540.
    await ctx.wait(500);
    await bar.open(ctx);
    bar.split();
    await ctx.wait(400);
    await bar.shade(ctx);
    await ctx.wait(400);
    // What the ₹540 is (the question on it went with the user's doc of 2026-10-23): the discount.
    await voice.read('th-8', 'So, the discount is ₹540.', [bar.note], 600);
    ctx.advance(NEXT_IN); // then the amount to pay
  }

  const PAY_SHEET = {
    boxes: [
      { label: 'Marked Price (MP)', value: '₹1800', tone: 'yellow' }, // the colours used since screen 11
      { label: 'Discount', value: '₹540', tone: 'red' },
    ],
    rows: [
      { label: [{ t: 'SP', cls: 'tone-sp' }], band: true, parts: [{ t: 'MP', cls: 'tone-mp' }, { op: '−' }, { t: 'Discount', cls: 'tone-d' }] },
      { parts: [{ slot: 'MP', t: '₹1800', cls: 'tone-mp' }, { op: '−' }, { slot: 'Discount', t: '₹540', cls: 'tone-d' }] }, // the player fills these
      { parts: [{ answer: '₹1260' }] },
    ],
  };
  // Swifty's hint when an amount is dropped on the wrong box: what that box is for (the MP box, the Discount box).
  const PAY_HINTS = [
    ['pay-wrong-mp', [{ t: 'Not quite!' }, { t: '\nThe ' }, { t: 'MP', cls: 'tone-mp' }, { t: ' box is for\nthe ' }, { t: 'marked price', cls: 'tone-mp' },
      { t: ', ' }, { t: '₹1800', em: true }, { t: '.' }]],
    ['pay-wrong-d', [{ t: 'Not quite!' }, { t: '\nThe ' }, { t: 'Discount', cls: 'tone-d' }, { t: ' box is for\nthe ' }, { t: 'discount', cls: 'tone-d' },
      { t: ', ' }, { t: '₹540', em: true }, { t: '.' }]],
  ];

  // Screen 23 (the user's doc, 2026-10-23: "Then we will go back to the scene and ask how much he has to pay directly,
  // then we will give the explanation"): Swifty says what to find, and asks it; three answers, one try; then screens 24
  // (the discount, 30% of ₹1800) and 25 (the amount to pay: the player drags ₹1800 and ₹540 into SP = MP − Discount, and
  // a bar of ₹1800 splits into ₹1260 paid and ₹540 discount) work it out.
  async function playToPay(ctx, scene) {
    await ctx.wait(500); // the question before finishes fading away first
    const talk = await cornerSwifty(ctx, scene); // she rises in with her bubble
    const bird = talk.bird;
    bird.point();
    await talk.say('pay-intro', 'Now, let’s find out how much money Aniket needs to pay.', 600);
    await ctx.wait(400);

    // The question, asked straight away (the user's doc, 2026-10-23: "ask how much he has to pay directly, then give the
    // explanation"): she reads it out (its words are on the panel). One try: either way the next screens work it out.
    const pq = FX.productQuestion(practiceHost(scene), Object.assign({ question: 'How much does Aniket have to pay?' }, SNEAKER_CARD));
    pq.open();
    await pq.showQuestion(); // (with the panel: it is never empty)
    await ctx.wait(300);
    await talk.read('pay-ask', 'How much does Aniket have to pay?', [scene.ui.querySelector('.pqp-question')], 1400);
    bird.point();
    await ctx.wait(300);

    await percentQuestion(ctx, scene, pq, talk, {
      options: [{ label: '₹2340' }, { label: '₹1260', correct: true }, { label: '₹540' }],
      stack: true,
      async right() {
        await talk.say('pay-right', [{ t: 'Correct!', cls: 'stress' }], 600);
      },
      // Wrong: "Not quite!" (then the right answer lights up)
      async wrong(answers) {
        await talk.say('pay-wrong', 'Not quite!', 600);
        answers.show(1);
        await ctx.wait(900);
      },
      // Both ways: "Let's see how to work it out!" (then it is worked out: screens 24 and 25)
      async so(answers) {
        await talk.show('Let’s see how to work it out!');
        await partWith(ctx, talk, 'pay-so', 0, 500, () => answers.ping(1));
      },
      auto: true, // on by itself, 3 seconds after her line
    });
  }

  // Screen 25: the amount to pay, worked out (after the discount, ₹540, on screen 24): SP = MP − Discount, the player
  // dragging the amounts into it, and the bar.
  async function playPayWork(ctx, scene) {
    const w = FX.workedSheet(practiceHost(scene), PAY_SHEET);
    w.el.style.opacity = '0'; // (the small panel comes in with its first box: never empty)
    await ctx.wait(450); // the working before finishes fading away first
    const talk = await cornerSwifty(ctx, scene); // (she comes with her bubble: "Your turn!")
    const bird = talk.bird;
    w.open();
    panelIn(w.el);
    await w.box(0);
    await ctx.wait(300);
    await w.box(1);
    bird.point();
    await ctx.wait(400);

    // How to find the amount to pay: the rule is written in as her voice says it (no bubble: it is written there).
    await readWith(ctx, talk, 'pay-1', 'To find how much you have to pay,', 300, () => w.write(0));
    let writing = null;
    await readWith(ctx, talk, 'pay-2', 'subtract the discount from the marked price.', 200, () => {
      writing = (async () => {
        await w.part(0, 0); // MP …
        w.ping(w.boxes[0]);
        await ctx.wait(200);
        await w.part(0, 1); // − …
        await ctx.wait(200);
        await w.part(0, 2); // Discount
        w.ping(w.boxes[1]);
      })();
    });
    await writing;
    await ctx.wait(500);

    // The player's turn: the next line has an empty box for each amount, and they drag the amounts (or tap one, then its
    // box) out of the boxes on the left into them. A wrong box sends the amount back, with a hint in her bubble.
    await w.write(1);
    await w.part(1, 0);
    await ctx.wait(150);
    await w.part(1, 1);
    await ctx.wait(150);
    await w.part(1, 2);
    await ctx.wait(300);
    await talk.say('pay-try', [{ t: 'Your turn!', cls: 'key' }, { t: '\nDrag each amount into its box.' }], 600);
    bird.point();
    let hinting = null;
    await w.drag([[0, 1, 0], [1, 1, 2]], {
      onRight(n) {
        const r = stageRect(w.rows[1].parts[2 * n]);
        FX.burst(scene.ui, r.left + r.width / 2, r.top + r.height / 2, { count: 14, dist: [80, 170], size: [10, 20] });
        bird.wave();
      },
      onWrong(n, m) {
        if (hinting || !ctx.alive()) return; // she is still giving the last hint
        const [id, text] = PAY_HINTS[m];
        hinting = talk.say(id, text)
          .then(() => bird.point())
          .catch(err => { if (err !== CANCELLED) console.error(err); })
          .finally(() => { hinting = null; });
      },
    });
    if (hinting) await hinting;
    await ctx.wait(500);

    // ₹1800 − ₹540 = ₹1260 (her voice; the working says it).
    await readWith(ctx, talk, 'pay-3', '₹1800 − ₹540', 200, () => {
      w.ping(w.rows[1].parts[0]);
      ctx.wait(450).then(() => w.ping(w.rows[1].parts[2]), () => {});
    });
    await w.write(2);
    await readWith(ctx, talk, 'pay-4', '= ₹1260.', 350, () => w.answer(2));
    w.mark(2);
    await ctx.wait(400);

    // The bar: ₹1800, split into ₹1260 paid and ₹540 discount; and Aniket's question is answered.
    const bar = FX.barModel(w.el, {
      total: { value: '₹1800', label: 'Marked Price', tone: 'mp' },
      parts: [{ value: '₹1260', label: 'pay', tone: 'sp', share: 0.7 }, { value: '₹540', label: 'discount', tone: 'd', share: 0.3 }],
    });
    await bar.open(ctx);
    bar.split();
    await ctx.wait(500);
    await talk.read('pay-5', 'So, you pay ₹1260 for the sneakers!', [bar.segs[0]], 900);
    bird.point();
    // As after a question: her run ends here, so she goes; then the story moves on by itself.
    await swiftyDone(ctx, scene, talk);
    ctx.advance(NEXT_IN);
  }

  // The final answer, in Aniket's words. Coming from screen 34, the sheet slides down (Swifty's part is done) and
  // Aniket is at the stand, pointing at the tags. As he
  // says "So, after a 30% discount, I will pay ₹1260.", the 30% OFF tag lights up and a red line crosses out
  // the ₹1800, then a green ₹1260 tag stamps onto the stand.
  const STRIKE_1800 = { from: [1244, 630], to: [1380, 580] }; // across the "₹1800" on the tag hanging from the sneakers (stage px)
  const PAID_TAG = { x: 1253, y: 880, text: '₹1260' };        // on the stand's front, under both tags
  const FINAL_LINE = {
    anchor: [736, 282], corner: 'bl', tip: [636, 304], // right of his face, above the sneakers; the tail at his mouth
    text: [
      { t: 'So, after a ' }, { t: '30%', cls: 'key' }, { t: '\ndiscount,', end: true },
      { t: ' I will pay\n' }, { t: '₹1260', cls: 'tone-pay' }, { t: '.' },
    ],
    voice: 'boy', rotate: -1.5,
  };

  async function playFinal(ctx, scene) {
    await ctx.wait(600); // the sheet finishes sliding away: Aniket, pointing at the tags

    const crossOut = FX.strike(scene.layer, STRIKE_1800);
    const paid = FX.stickTag(scene.layer, PAID_TAG);
    const line = FX.bubble(scene.layer, FINAL_LINE);
    await line.show();

    // "So, after a 30% discount," — the 30% OFF tag lights up, and the ₹1800 is crossed out.
    const discount = speakPart(ctx, line, 0, 'final-1', line.parts[0], 'boy');
    discount.catch(() => {}); // if the player leaves mid-line, the waits below report it
    await ctx.wait(500);
    FX.ring(scene.layer, OFF_TAG);
    Sound.sparkle();
    await ctx.wait(600);
    crossOut.draw();
    await discount;
    await ctx.wait(300);

    // "I will pay ₹1260." — the new price stamps onto the stand.
    const pay = speakPart(ctx, line, 1, 'final-2', line.parts[1], 'boy');
    pay.catch(() => {});
    await ctx.wait(700);
    await paid.stamp();
    const r = stageRect(paid.el);
    FX.burst(scene.ui, r.left + r.width / 2, r.top + r.height / 2, { count: 18, dist: [130, 250], size: [12, 24] });
    await pay;
    line.emphasize();
    Sound.chime();
    ctx.advance(3000); // then the sneakers, in their box
  }

  // The sneakers, in their box: over the counter, the shopkeeper hands them to Aniket. No words: a light sweeps
  // across the box, with twinkles round it and a chime.
  const SNEAKER_BOX = [[905, 440], [1245, 452], [1292, 598], [1240, 700], [880, 775], [800, 700], [800, 600], [935, 520]]; // the box and its lid (stage px)
  // Where the box ends up in the clip (s36-box), in Aniket's hands.
  const SNEAKER_BOX_HELD = [[440, 700], [630, 628], [752, 580], [1000, 598], [880, 702], [880, 800], [686, 864], [438, 792]];

  async function playBoxed(ctx, scene) {
    if (Clips.has('s36-box')) { // the clip hands the box over: the chime as Aniket takes it, the light once it's his
      await ctx.wait(1250, { real: true }); // (the clip started about half a second before this script)
      Sound.chime();
      await ctx.wait(2400, { real: true });
      FX.shine(scene.layer, SNEAKER_BOX_HELD, { duration: 1300, width: 260 });
      await ctx.wait(1300, { real: true });
      ctx.advance(2600);
      return;
    }
    await ctx.wait(900);
    FX.shine(scene.layer, SNEAKER_BOX, { duration: 1300, width: 260 });
    await ctx.wait(450);
    Sound.chime();
    await ctx.wait(800);
    ctx.advance(2600); // then the discount as a percent of the marked price
  }

  // What percent of the marked price is the discount? The sneakers are in the snapshot (their ₹1800 and 30% OFF: where 540 and 1800 come from). Swifty rises in to introduce
  // it (she reads the question out), then leaves for the working, which her voice does on its own, the way screens 28 and
  // 29 did: 540 is the part and 1800 the whole; Percentage = Part / Whole × 100 = 540 / 1800 × 100 = 30%. Then the boxes
  // go, and as her voice says "Here, the part is the discount, and the whole is the marked price.", the words dissolve into
  // the new ones and take their colours (Part → Discount, red; Whole → Marked Price, amber), and, as the rule is read out,
  // Percentage → Discount %.
  const PERCENT_OF_MP = {
    question: [{ t: '540', role: 'part' }, { t: ' is what percent of ' }, { t: '1800', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: '540' },
    whole: { label: 'Whole', value: '1800' },
    numbers: ['540', '1800'],
    answer: '30%',
  };

  async function playPercentOfMP(ctx, scene) {
    const f = FX.percentFormula(scene.ui, PERCENT_OF_MP);
    await ctx.wait(300);
    const talk = await cornerSwifty(ctx, scene); // she introduces it…
    await percentStart(ctx, f, '540 is what percent of 1800?', ['540', '1800'], talk);
    await swiftyDone(ctx, scene, talk); // …then leaves for the working (her voice goes on)
    const voice = swiftyTalk(ctx, scene.ui, null, null);
    await percentRule(ctx, voice, f);

    // Work it out: = 30%.
    await voice.read('po-work', '540 ÷ 1800 × 100', [], 600);
    await f.start(2);
    await readWith(ctx, voice, 'po-equals', '= 30%.', 350, () => f.answer());
    markAnswer(scene, f);
    await voice.read('po-so', 'So, 540 is 30% of 1800!', [], 900);
    await ctx.wait(500);

    // What the part and the whole are here: the boxes go, and the words dissolve into the new ones as they are said.
    f.dropBoxes();
    await ctx.wait(400);
    let renaming = null;
    await readWith(ctx, voice, 'po-part', 'Here, the part is the discount,', 900, () => { renaming = f.rename('part', 'Discount', 'tone-d'); });
    await renaming;
    await readWith(ctx, voice, 'po-whole', 'and the whole is the marked price.', 1000, () => { renaming = f.rename('whole', 'Marked Price', 'tone-mp'); });
    await renaming;
    await ctx.wait(500);

    // The rule for the discount percentage, read out (it is written on the sheet).
    await readWith(ctx, voice, 'po-rule', 'So, Discount % = Discount ÷ Marked Price × 100.', 500, () => f.rename('label', 'Discount %'));
    ctx.advance(NEXT_IN); // then back home (the discount percentage's screen and its checkpoint were taken out on 2026-10-22)
  }

  // Back home: his father asks how the shopping went, Aniket says what he learnt, and his father hints at another
  // shopping job. One of them talks at a time; the story so far ends here.
  async function playReturn(ctx, scene) {
    const L = scene.layer;
    const say = async (bubble, id, who) => {
      const line = FX.bubble(L, Object.assign({ voice: who }, bubble));
      await line.show();
      await speak(ctx, line, id, who);
      return line;
    };
    const DAD = { anchor: [1262, 252], corner: 'br', tip: [1330, 372] }; // on the wall up-left of his head, the tail at his mouth
    await ctx.wait(700);
    const ask = await say(Object.assign({ text: 'How was your shopping?' }, DAD), 'home-ask', 'dad');
    await ctx.wait(900);
    await ask.hide();
    await ctx.wait(250);
    const learnt = await say({
      anchor: [722, 376], corner: 'bl', tip: [645, 282], // on the wall right of his face, the tail at his mouth
      text: 'Great! I learnt\nabout marked price,\ndiscount and discount\npercentage.',
    }, 'home-learnt', 'boy');
    await ctx.wait(900);
    await learnt.hide();
    await ctx.wait(250);
    await say(Object.assign({ text: 'That’s useful, because\nyou have another\nshopping job.' }, DAD), 'home-next', 'dad');
    ctx.advance(3000); // then the talk turns to school
  }

  // A bubble on a story picture, typed while its speaker says it; resolves with the bubble, still up.
  async function sayOnPicture(ctx, scene, bubble, id, who) {
    const line = FX.bubble(scene.layer, Object.assign({ voice: who }, bubble));
    await line.show();
    await speak(ctx, line, id, who);
    return line;
  }

  // At the table, his father brings up school, one line after the other from the same place beside his face.
  async function playSchool(ctx, scene) {
    const DAD = { anchor: [1234, 400], corner: 'br', tip: [1322, 336] }; // between them, the tail at his mouth
    await ctx.wait(700);
    const soon = await sayOnPicture(ctx, scene, Object.assign({ text: 'Your new school session\nstarts in a few days.' }, DAD), 'school-soon', 'dad');
    await ctx.wait(900);
    await soon.hide();
    await ctx.wait(250);
    await sayOnPicture(ctx, scene, Object.assign({ text: 'You still need some\nthings for school.' }, DAD), 'school-need', 'dad');
    ctx.advance(3000); // then the list
  }

  // The list his father hands him: the camera pushes in until the list fills the middle of the screen, and it
  // lights up; then the camera eases back out to the framing screen 43 starts from (KB_TABLE.from, about the same
  // `origin`), so the dissolve there only changes what is in their hands. No words.
  const SCHOOL_LIST = [[878, 384], [1118, 356], [1194, 622], [954, 660]]; // the sheet of paper (stage px)
  async function playList(ctx, scene) {
    const move = (to, ms) => {
      if (reducedMotion) return;
      const from = getComputedStyle(scene.world).transform;
      scene.kbAnim = scene.world.animate([{ transform: from }, { transform: to }], {
        duration: ms * PACE, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards',
      });
    };
    await ctx.wait(500);
    move('translate(-62px, -20px) scale(1.7)', 2200); // the list's centre (1036, 508) to the middle, 1.7× bigger
    await ctx.wait(1700);
    FX.glow(scene.layer, 1036, 508, 420, 440, { cls: 'glow--book', delay: 0 });
    FX.shine(scene.layer, SCHOOL_LIST, { duration: 1100, width: 120 });
    Sound.sparkle();
    await ctx.wait(1800);
    move(KB_TABLE.from, 1500); // back out, for the money
    await ctx.wait(1500);
    ctx.advance(1500); // then the money
  }

  // His father holds out the money: it shines (cha-ching), and he says how much.
  const NOTES_FAN = [[836, 436], [919, 396], [1010, 385], [1102, 402], [1148, 459], [1174, 540], [1102, 574], [988, 643], [947, 620], [873, 517]];
  async function playMoney(ctx, scene) {
    await ctx.wait(600);
    FX.glow(scene.layer, 1004, 512, 420, 300, { cls: 'glow--money', delay: 0 });
    FX.shine(scene.layer, NOTES_FAN, { duration: 1000, width: 140 });
    Sound.kaching();
    await ctx.wait(700);
    const line = await sayOnPicture(ctx, scene, {
      anchor: [690, 236], corner: 'bl', tip: [650, 312], // up-right of his face, the tail at his mouth
      text: [{ t: 'Here’s ' }, { t: '₹5,000', em: true }, { t: '.' }],
    }, 'money', 'dad');
    line.emphasize();
    Sound.ding();
    ctx.advance(3000); // then into his pocket
  }


  // His father's advice, then Aniket's answer: one bubble at a time. The story so far ends here.
  async function playDeal(ctx, scene) {
    const DAD = { anchor: [790, 330], corner: 'bl', tip: [742, 380] }; // up-right of his head, the tail at his mouth
    const say = async (bubble, id, who, keep) => {
      const line = await sayOnPicture(ctx, scene, bubble, id, who);
      if (keep) return line;
      await ctx.wait(900);
      await line.hide();
      await ctx.wait(250);
      return null;
    };
    await ctx.wait(700);
    await say(Object.assign({ text: 'Use what you\nhave learnt and\nfind the best\ndeals.' }, DAD), 'deal-use', 'dad');
    await say(Object.assign({ text: 'Whatever is left\nafter buying\neverything\nis yours.' }, DAD), 'deal-left', 'dad');
    await say({ anchor: [1176, 184], corner: 'br', tip: [1234, 282], text: 'Really?' }, 'deal-really', 'boy'); // up-left of his face
    await say({
      anchor: [1160, 352], corner: 'br', tip: [1236, 282], // left of his face, the tail at his mouth
      text: 'Then I’m\ndefinitely finding\nthe best offers!',
    }, 'deal-offers', 'boy', true);
    ctx.advance(3000); // then the challenge begins
  }

  // The shopping challenge begins: outside his house, Aniket is ready to go, and the challenge's panel builds up
  // beside him, as in the design (FX.challengePanel): the banner and its ribbon, the wallet (₹5,000, cha-ching),
  // the shopping list one item at a time, and the START SHOPPING button, which waits for the player and takes
  // them to the shops (screen 47).
  const BEGIN = ASSETS + 'ui/begin/';
  const BEGIN_ART = {
    panel: BEGIN + 'panel.png', banner: BEGIN + 'banner.png', ribbon: BEGIN + 'ribbon.png',
    wallet: BEGIN + 'wallet.png', button: BEGIN + 'button.png',
  };
  const SHOPPING_LIST = [
    { icon: ASSETS + 'ui/shop/icon-uniform.png', label: 'School Uniform' }, // the same pictures as everywhere in the game
    { icon: ASSETS + 'ui/shop/icon-shoes.png', label: 'School Shoes' },
    { icon: ASSETS + 'ui/shop/icon-bag.png', label: 'School Bag' },
    { icon: ASSETS + 'ui/shop/icon-bottle.png', label: 'Water Bottle' },
  ];

  async function playBegin(ctx, scene) {
    Shopping.bought = []; // the challenge starts afresh: nothing bought yet
    const panel = FX.challengePanel(scene.ui, { art: BEGIN_ART, items: SHOPPING_LIST, wallet: 'Wallet: ₹5,000' });
    await ctx.wait(700);
    await panel.open();
    await panel.ribbon();
    await ctx.wait(250);
    await panel.wallet();
    await ctx.wait(500);
    await panel.list();
    for (let i = 0; i < SHOPPING_LIST.length; i++) {
      await panel.item(ctx, i);
      await ctx.wait(180);
    }
    await ctx.wait(300);
    await panel.start(() => next()); // no countdown: the button (or Next) moves on
  }

  // ======================================================================
  // The shopping game (screens 47–51): the Shopping Area, then a street of three shops for each item. The player
  // picks any item first; on its street they check each shop's offer (working out what they would pay), compare the
  // three, buy at the best one, and go back to the Shopping Area, until everything on the list is bought.
  // ======================================================================

  // Choosing a shop, as in the design (FX.shopPicker): the four shops' cards on the left (uniform, shoes, bag and
  // water bottle), the wallet and the shopping list on the right. The pictures are cut from "select shop sheet.png"
  // (game assets/ui/shop/).
  const SHOP = ASSETS + 'ui/shop/';
  const SHOP_ART = { wallet: SHOP + 'wallet.png', check: SHOP + 'check-empty.png', done: SHOP + 'check-done.png' };
  const MONEY_NOTES = SHOP + 'money.png';
  // The streets: their picture (the sky, the town, the pavement and the road; the sign and the clouds are drawn by the
  // game), the three shop fronts cut from "new shops for game .png", and the pieces cut from "sheet .png" (made with
  // ChatGPT from the asset prompt): the price and offer tags (on the offer cards), the green badge (the Selling Price), the
  // yellow ribbon (best deal) and the Buy button. They have no words on them: the game writes them.
  const STREET = ASSETS + 'ui/street/';
  const STREET_ART = {
    backdrop: ASSETS + 'game background.png',
    fronts: { coral: STREET + 'front-coral.png', blue: STREET + 'front-blue.png', purple: STREET + 'front-purple.png' },
    price: STREET + 'tag-price.png', offer: STREET + 'tag-offer.png',
    pill: STREET + 'pill.png', ribbon: STREET + 'ribbon.png', button: STREET + 'button.png',
  };
  const SHOPS = [ // sparks: [x %, y %, angle] of each little dash beside the picture, as in the design
    { id: 'uniform', name: 'Uniform', icon: SHOP + 'icon-uniform.png', tone: 'yellow', sparks: [[14.2, 33.3, 41], [13.9, 46.6, -19], [85.9, 33.2, -40], [85.9, 46.7, 21]] },
    { id: 'shoes', name: 'Shoes', icon: SHOP + 'icon-shoes.png', tone: 'pink', sparks: [[17.9, 25.6, 54], [12.7, 35.9, 17], [85.6, 22.8, -53], [89.8, 35.1, -11]] },
    { id: 'bag', name: 'Bag', icon: SHOP + 'icon-bag.png', tone: 'green', sparks: [[15.1, 30.4, 49], [11.2, 41.4, 10], [85.5, 28, -49], [89.3, 39, -11]] },
    { id: 'bottle', name: 'Bottle', icon: SHOP + 'icon-bottle.png', tone: 'purple', sparks: [[21.7, 34, 46], [19.1, 45.3, 4], [78.1, 34, -47], [81, 45.2, -6]] },
  ];

  // What has been bought so far (the ids, in the order bought). Screen 46 starts the challenge afresh.
  const BUDGET = 5000;
  const Shopping = { bought: [] };
  const rupees = n => '₹' + n.toLocaleString('en-IN');
  const bestPrice = id => ROUNDS[id].shops[ROUNDS[id].best].pay;
  const moneyLeft = () => BUDGET - Shopping.bought.reduce((sum, id) => sum + bestPrice(id), 0);
  const allBought = () => SHOPS.every(shop => Shopping.bought.includes(shop.id));
  const sceneIndex = id => SCENES.findIndex(s => s.id === id);

  // The question bar. In the shopping game's own screens (the streets, Shopping Complete and the receipt) Swifty doesn't
  // stand on her books: she speaks from a bar at the top of the screen (in the top row, between the wallet and Back /
  // Next), her face in a round frame on its left corner (FX.questionBar). On the big panel's screens (the money left, the two amounts, the recap, the takeaway) she
  // stands on her books, as on every teaching screen. It is one bar for all of its screens, on the stage over them: it
  // slides up with the first and stays put from one to the next (so it never jumps), and slides down when the game
  // goes to a screen without it. Every line she says is written on it as she says it; between lines it says what to
  // do (the task).
  const BAR_SCREENS = new Set(['uniform', 'shoes', 'bag', 'bottle', 'complete', 'receipt']);
  let questionBar = null; // made the first time a screen with it comes up

  function syncBar(scene) {
    const on = BAR_SCREENS.has(scene.id);
    if (!questionBar && !on) return;
    if (!questionBar) {
      questionBar = FX.questionBar($('#stage'), { sheets: SWIFTY });
      $('#scenes').after(questionBar.el); // over the screens, under the buttons and the scene list
    }
    questionBar.reset(); // the screen before may have left a line on it
    questionBar.toggle(on);
  }

  // Swifty's lines on the question bar, for a screen's script: each one takes the place of the one before, typed while
  // her voice says it (as swiftyTalk does with bubbles). `task`: the question, or what to do, shown while she isn't
  // saying anything. Nothing on the bar repeats what a panel shows: the panels carry no question of their own.
  function barTalk(ctx, task = '') {
    const bar = questionBar;
    bar.task(task);
    let line = null;
    let away = false; // stepped away while a question panel is up (see away)
    const live = () => { if (!ctx.alive()) throw CANCELLED; }; // the player has left this screen: hands off the bar
    // Whenever she speaks, she is on screen: the bar slides back in first if it had stepped away.
    const back = async () => {
      if (!away) return;
      away = false;
      bar.toggle(true);
      await ctx.wait(450, { real: true });
    };
    const talk = {
      bird: bar.speaker,
      get line() { return line; },
      // While a question panel is up (an offer to check, the three offers compared), the bar isn't needed: the question
      // is on the panel, above its answers. It slides away, empty, and comes back when she next speaks.
      away() {
        live();
        if (away) return;
        away = true;
        if (line) {
          line.el.remove();
          line = null;
        }
        bar.task('');
        bar.toggle(false);
      },
      back,
      async show(text) {
        live();
        await back();
        if (line) {
          const old = line;
          line = null;
          await old.hide();
          live();
        }
        line = bar.line(text);
        await line.show();
      },
      // Types part `i` of the line while she says it; never quicker than `ms`.
      part(id, i, ms = 0) {
        return Promise.all([speakPart(ctx, line, i, id, line.parts[i], 'bird', bar.speaker), ctx.wait(ms)]);
      },
      // Her line goes, and the task shows.
      async clear() {
        live();
        if (line) {
          const old = line;
          line = null;
          await old.hide();
          live();
        }
        bar.showTask();
      },
      // A whole line, typed while she says it; never quicker than `ms`. An array of strings is a line too long for one
      // line of the bar: its parts are said one after the other, each on its own line of the bar.
      async say(id, text, ms = 0) {
        if (Array.isArray(text) && typeof text[0] === 'string') {
          for (const [k, part] of text.entries()) await talk.say(`${id}-${k + 1}`, part, ms);
          return;
        }
        await talk.show(text);
        await Promise.all([speak(ctx, line, id, 'bird', bar.speaker), ctx.wait(ms)]);
      },
      task(text) {
        if (ctx.alive()) bar.task(text);
      },
      // She reads out something written on the screen as it is written (`show`). Its words are there, so the bar doesn't
      // repeat them: it keeps what it shows (her last line, or what to do) while she talks.
      async readOut(id, text, show) {
        live();
        await back();
        bar.speaker.talk();
        const saying = sayHere(ctx, id, text, 'bird');
        try {
          await show;
          await Promise.all([saying, ctx.wait(500)]);
        } finally {
          bar.speaker.idle();
        }
      },
    };
    return talk;
  }

  async function playShops(ctx, scene) {
    const back = SHOPS.some(shop => shop.id === scene.cameFrom); // back from a shop: no need to build it all up again
    const picker = FX.shopPicker(scene.ui, {
      shops: SHOPS,
      art: SHOP_ART,
      money: moneyLeft(),
      bought: Shopping.bought,
      onPick(i) { // on to that item's street, once the card has glowed
        const r = stageRect(picker.el.querySelectorAll('.sp-card')[i]);
        scene.el.style.setProperty('--zoom-origin', `${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px`);
        Game.timers.add(setTimeout(() => ctx.alive() && go(sceneIndex(SHOPS[i].id)), 900));
      },
    });
    await ctx.wait(200);
    await picker.enter(ctx, { quick: back });
    if (allBought()) {
      ctx.advance(2500); // everything is bought: on to the end
      return;
    }
    await picker.invite(ctx);
  }

  // The four streets. Each shop: its marked price (mp), its offer (off, as on its red tag), the three answers to
  // "How much will you pay?" (options) and the right one (pay), the working, a line each, and which hint helps (kind:
  // a percentage, a flat amount off, or "get at" a price). `best`: the shop with the lowest final price.
  const SHOP_NAMES = ['Shop A', 'Shop B', 'Shop C'];
  const SHOP_TONES = ['coral', 'blue', 'purple'];
  const ROUNDS = {
    uniform: {
      street: 'Uniform Street', item: 'School Uniform',
      intro: ['Three shops sell\nthe same uniform.', 'Tap each shop\nto check its offer!'],
      question: 'Which shop gives the best deal?',
      shops: [
        { mp: 1600, off: ['10%', 'OFF'], kind: 'percent', options: [1590, 1440, 160], pay: 1440,
          work: [{ left: '10% of ₹1,600', right: '₹160' }, { left: '₹1,600 − ₹160', right: '₹1,440' }] },
        { mp: 1600, off: ['₹250', 'OFF'], kind: 'flat', options: [1850, 250, 1350], pay: 1350,
          work: [{ left: '₹1,600 − ₹250', right: '₹1,350' }] },
        { mp: 1600, off: ['GET AT', '₹1,300'], kind: 'getat', options: [300, 1300, 1600], pay: 1300,
          work: [{ text: 'GET AT ₹1,300' }, { left: 'Final Price', right: '₹1,300' }] },
      ],
      best: 2,
      bought: 'Uniform purchased!',
    },
    shoes: {
      street: 'Shoe Street', item: 'School Shoes',
      intro: ['Every shop marks\nthe shoes at ₹1,800.', 'Tap each shop\nto check its offer!'],
      question: 'Where should Aniket buy the shoes?',
      shops: [
        { mp: 1800, off: ['20%', 'OFF'], kind: 'percent', options: [1440, 360, 1780], pay: 1440,
          work: [{ left: '10% of ₹1,800', right: '₹180' }, { left: '20%', right: '₹360' }, { left: '₹1,800 − ₹360', right: '₹1,440' }] },
        { mp: 1800, off: ['₹400', 'OFF'], kind: 'flat', options: [400, 1400, 2200], pay: 1400,
          work: [{ left: '₹1,800 − ₹400', right: '₹1,400' }] },
        { mp: 1800, off: ['25%', 'OFF'], kind: 'percent', options: [1775, 450, 1350], pay: 1350,
          work: [{ text: '25% means one-quarter.' }, { left: '₹1,800 ÷ 4', right: '₹450' }, { left: '₹1,800 − ₹450', right: '₹1,350' }] },
      ],
      best: 2,
      bought: 'Shoes purchased!',
    },
    bag: {
      street: 'Bag Corner', item: 'School Bag',
      intro: ['Now the marked prices\nare different!', 'Don’t choose just by\nthe discount percentage.'],
      question: 'Which shop gives the best value?',
      shops: [
        { mp: 1600, off: ['25%', 'OFF'], kind: 'percent', options: [1200, 1575, 400], pay: 1200,
          work: [{ left: '25% of ₹1,600', right: '₹400' }, { left: '₹1,600 − ₹400', right: '₹1,200' }] },
        { mp: 1500, off: ['20%', 'OFF'], kind: 'percent', options: [300, 1200, 1480], pay: 1200,
          work: [{ left: '20% of ₹1,500', right: '₹300' }, { left: '₹1,500 − ₹300', right: '₹1,200' }] },
        { mp: 1400, off: ['₹250', 'OFF'], kind: 'flat', options: [1650, 250, 1150], pay: 1150,
          work: [{ left: '₹1,400 − ₹250', right: '₹1,150' }] },
      ],
      best: 2,
      lesson: ['Even though Shop A offers 25% OFF,', 'Shop C has the lowest final price.'], // said in two parts: one line of the bar each
      bought: 'Bag purchased!',
    },
    bottle: {
      street: 'Bottle Stop', item: 'Water Bottle',
      intro: ['This is the\nfinal challenge!', 'Different prices,\ndifferent offers.\nCheck each one!'],
      question: 'Which bottle should Aniket buy?',
      shops: [
        { mp: 800, off: ['25%', 'OFF'], kind: 'percent', options: [775, 600, 200], pay: 600,
          work: [{ left: '25% of ₹800', right: '₹200' }, { left: '₹800 − ₹200', right: '₹600' }] },
        { mp: 700, off: ['₹150', 'OFF'], kind: 'flat', options: [550, 850, 150], pay: 550,
          work: [{ left: '₹700 − ₹150', right: '₹550' }] },
        { mp: 600, off: ['10%', 'OFF'], kind: 'percent', options: [60, 590, 540], pay: 540,
          work: [{ left: '10% of ₹600', right: '₹60' }, { left: '₹600 − ₹60', right: '₹540' }] },
      ],
      best: 2,
      bought: 'Bottle purchased!',
    },
  };

  // Swifty's help when an answer is wrong: first "check what you will actually pay"; then a hint about how (by the
  // kind of offer, or for the comparison), while the one answer left glows.
  const HINTS = {
    again: 'Check how much\nyou will actually pay.',
    percent: ['Find the discount first,', 'then subtract it from the marked price.'], // in two parts: one line of the bar each
    flat: 'Subtract the discount\nfrom the marked price.',
    getat: 'Get at tells you\nthe price you pay.',
    compare: 'Compare the final prices,\nnot just the discount\npercentages.',
    lowest: 'Buy where the Selling Price\nis the lowest.',
  };

  // Aniket walks in from the left along the road and stops in front of the shops (bottom-left).
  async function walkOn(ctx, scene) {
    const walker = new FX.Walker(scene.ui, WALK_RIG, { matte: true });
    const from = { x: -170, y: 1032, s: 0.56 };
    const to = { x: 190, y: 1032, s: 0.56 };
    walker.place(from.x, from.y, from.s);
    walker.setFrame('idle');
    const pan = x => (x / STAGE_W) * 1.6 - 0.8;
    Sound.duck(true, 'walk');
    try {
      await walker.walk(ctx, { from, to, speed: 260, decel: 200, onStep: x => Sound.step(pan(x)) });
    } finally {
      Sound.duck(false, 'walk');
    }
    Sound.step(pan(to.x), 0.5);
    walker.idle(true);
  }

  // A street of three shops: one item's round of the game. The street builds up and Swifty, on the question bar, tells
  // what to do; the player checks the three offers in any order (checkOffer: each shop's Selling Price goes under
  // it), then chooses where to buy, by pressing one of the Buy buttons the prices turn into (buyItem). Then the game
  // goes back to the Shopping Area (or on to the end).
  async function playRound(ctx, scene) {
    const id = scene.id;
    const round = ROUNDS[id];
    const n = SHOPS.findIndex(shop => shop.id === id); // its line on the shopping list
    Shopping.bought = Shopping.bought.filter(b => b !== id); // shopping for it (again): it isn't bought yet
    const money = moneyLeft();
    const shops = round.shops.map((shop, k) => ({
      name: SHOP_NAMES[k], tone: SHOP_TONES[k], price: rupees(shop.mp), off: shop.off, pay: rupees(shop.pay),
    }));
    const st = FX.street(scene.ui, { id, name: round.street, item: round.item, icon: SHOPS[n].icon, shops, art: STREET_ART });
    const board = FX.walletPanel(scene.ui, { items: SHOPS, art: SHOP_ART, money, bought: Shopping.bought, street: true });
    board.light(n);
    const talk = barTalk(ctx, `${round.street} · ${round.item}`); // where we are, while the street builds up
    const walking = walkOn(ctx, scene); // Aniket walks onto the road while the street builds up
    walking.catch(() => {});
    await ctx.wait(300);
    await st.enter(ctx);
    await walking;
    await talk.say(id + '-intro-1', round.intro[0], 300);
    await talk.say(id + '-intro-2', round.intro[1], 300);
    talk.task('Tap a shop to check its offer.');
    talk.bird.point();

    // The offers, checked one at a time, in any order. While the game waits for a tap, the shops still to check
    // bounce now and then.
    const checked = new Set();
    while (checked.size < shops.length) {
      let waiting = true;
      (async () => {
        while (waiting) {
          await ctx.wait(5000, { real: true });
          if (waiting) await st.bounce(ctx, checked);
        }
      })().catch(() => {});
      const k = await st.tap(checked);
      waiting = false;
      await checkOffer(ctx, scene, talk, round, shops, st, k, SHOPS[n].icon);
      checked.add(k);
      await st.paid(k);
      talk.task(checked.size < shops.length ? 'Tap another shop to check its offer.' : 'Now compare the three prices.');
      await talk.clear();
      await ctx.wait(300);
    }
    await buyItem(ctx, scene, talk, round, shops, st, board, n, money);
    talk.bird.wave();
    ctx.advance(2500); // back to the Shopping Area (or on to the end)
  }

  // One shop's offer: its card comes up out of the shop with "How much will you pay?" above three answers, and the
  // question bar steps away. A wrong answer is crossed out and Swifty helps from the bar, which comes back (see HINTS);
  // the right one is worked out on the card, line by line, as she reads it out, and the Selling Price is stamped under
  // it (SP = ₹1,440). Then the card goes back into the shop.
  async function checkOffer(ctx, scene, talk, round, shops, st, k, icon) {
    const shop = round.shops[k];
    const right = shop.options.indexOf(shop.pay);
    const veil = st.veil();
    const card = FX.offerCard(scene.ui, {
      name: shops[k].name, tone: shops[k].tone, item: round.item, icon,
      price: shops[k].price, off: shop.off, options: shop.options.map(rupees), right, work: shop.work, pay: shops[k].pay, art: STREET_ART,
    });
    const at = stagePoint(st.shops[k]);
    talk.away(); // the question is on the card, above its answers: the bar comes back when Swifty speaks
    await card.open(ctx, at);
    let wrong = 0;
    while ((await card.pick()) !== right) {
      wrong++;
      await ctx.wait(400);
      if (wrong > 1) card.guide(right);
      await talk.say(wrong > 1 ? 'hint-' + shop.kind : 'hint-again', wrong > 1 ? HINTS[shop.kind] : HINTS.again);
      talk.bird.point();
    }
    const [x, y] = stagePoint(card.buttons[right]);
    FX.burst(scene.ui, x, y, { count: 16, dist: [100, 200], size: [12, 24] });
    await talk.say('right', 'Correct!');
    await card.toWork(ctx);
    talk.task('Here is how to work it out.');
    await talk.clear();
    for (const [i, line] of shop.work.entries()) {
      await talk.readOut(`${scene.id}-${k}-work-${i}`, line.text || `${line.left} = ${line.right}`, card.line(i));
    }
    await card.result();
    talk.bird.point();
    await ctx.wait(1300);
    await Promise.all([card.close(at), veil.hide()]);
    await talk.back();
  }

  // Where to buy: once the three Selling Prices are under the shops, they dissolve into Buy buttons ("Buy for ₹1,440"
  // …), and Swifty asks the round's question on the bar ("Where should Aniket buy the shoes?"). A wrong shop's button
  // shakes and is crossed out, with Swifty's help from the bar (see HINTS; after two, the one left glows); the best
  // one's button is pressed home, the prices come back, the best shop gets the "Best deal!" ribbon and she says why.
  // Then the money flies from the wallet to the shop (SOLD), the item flies from the shop onto the shopping list
  // (ticked), and a slip shows the wallet's sum (₹5,000 − ₹1,300 = ₹3,700 left) while the wallet counts down, and the
  // bar says what comes next.
  async function buyItem(ctx, scene, talk, round, shops, st, board, n, money) {
    const k = round.best;
    const cost = round.shops[k].pay;
    talk.task('Tap Buy at the best shop.');
    const choice = await st.choose(shops.map(shop => 'Buy for ' + shop.pay));
    await talk.say(scene.id + '-where', round.question);
    talk.bird.point();
    let wrong = 0;
    for (let i; (i = await choice.pick()) !== k;) {
      wrong++;
      choice.wrong(i);
      await ctx.wait(500);
      if (wrong > 1) choice.guide(k);
      await talk.say(wrong > 1 ? 'hint-lowest' : 'hint-compare', wrong > 1 ? HINTS.lowest : HINTS.compare);
      talk.bird.point();
    }
    const [x, y] = stagePoint(choice.buttons[k]);
    FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
    await choice.finish(k);
    await st.best(k);
    // Why it is the best deal (the street already shows each shop's Selling Price, and the ribbon).
    await talk.say(scene.id + '-best', round.lesson || `${shops[k].name} has the lowest\nfinal price.`);
    talk.task(`Paying ${rupees(cost)}…`);
    await talk.clear();
    const purse = stageRect(board.wallet.querySelector('.sp-wallet-icon'));
    const shop = stageRect(st.pictures[k]);
    Sound.swish();
    await FX.flyPicture(scene.ui, MONEY_NOTES, purse, shop, { ms: 800 });
    Sound.kaching();
    st.sold(k);
    await ctx.wait(300);
    Sound.swish();
    await FX.flyPicture(scene.ui, SHOPS[n].icon, shop, stageRect(board.rows[n].querySelector('.sp-row-icon')), { ms: 900, lift: 220 });
    board.tick(n);
    Shopping.bought.push(scene.id);
    const slip = FX.purchaseSlip(scene.ui, { icon: SHOPS[n].icon, title: round.bought, from: money, cost, left: money - cost });
    const counting = board.countTo(money - cost, 1000);
    talk.task(allBought() ? 'That was the last thing on the list!' : 'Next: back to the Shopping Area.');
    await slip.show(ctx);
    await counting;
    await talk.readOut(scene.id + '-bought', round.bought, null); // she reads the slip out (its words aren't repeated on the bar)
    await ctx.wait(1400);
    slip.hide();
  }

  // ======================================================================
  // The end of the shopping game (screens 52–59): everything bought, the receipt, the money left, the two amounts
  // not to mix up, back home, the mission's result, what we learnt, and the takeaway.
  // ======================================================================

  // What Aniket paid for each item (at its best shop), and the totals: ₹5,400 marked, ₹1,060 off, ₹4,340 paid.
  const PAID = SHOPS.map(shop => {
    const round = ROUNDS[shop.id];
    const best = round.shops[round.best];
    return { name: shop.name, icon: shop.icon, mp: best.mp, off: best.mp - best.pay, pay: best.pay };
  });
  const TOTAL = PAID.reduce((t, p) => ({ mp: t.mp + p.mp, off: t.off + p.off, pay: t.pay + p.pay }), { mp: 0, off: 0, pay: 0 });
  const FULL_NAMES = { uniform: 'Uniform', shoes: 'School Shoes', bag: 'School Bag', bottle: 'Water Bottle' };

  // Everything on the list is bought: a banner and confetti; the wallet (the money left) and the list on the left, its
  // lines ticked one by one as the four things bought pop up on the right. Swifty, on the question bar, says how well
  // it went (the banner already says it is complete).
  async function playComplete(ctx, scene) {
    const party = FX.celebration(scene.ui, {
      title: 'SHOPPING COMPLETE!', text: 'You bought everything on the list!', items: SHOPS, art: SHOP_ART, money: BUDGET - TOTAL.pay,
    });
    const talk = barTalk(ctx); // the banner says it is complete: her line adds how well it went
    await ctx.wait(300);
    const building = party.enter(ctx);
    building.catch(() => {}); // if the player leaves meanwhile, the wait below reports it
    await ctx.wait(200);
    await talk.say('complete-well', 'Well done! You found the best\nprice for every item.');
    await building;
    talk.bird.wave();
    ctx.advance(3000);
  }

  // Aniket's receipt, printed row by row: each item's marked price, its discount and what he paid, and the totals.
  const RECEIPT = {
    title: 'Aniket’s School Shopping',
    head: ['Item', 'Marked Price', 'Discount', 'Amount Paid'],
    rows: PAID.map(p => ({ icon: p.icon, cells: [p.name, rupees(p.mp), rupees(p.off), rupees(p.pay)] })),
    total: ['Total', rupees(TOTAL.mp), rupees(TOTAL.off), rupees(TOTAL.pay)],
  };

  async function playReceipt(ctx, scene) {
    const rc = FX.receipt(scene.ui, RECEIPT);
    const talk = barTalk(ctx); // the receipt has its own heading: her lines say how to read it
    await ctx.wait(300);
    await rc.open();
    await talk.say('receipt-colours', [{ t: 'The discounts are in ' }, { t: 'red', cls: 'tone-d' }, { t: ',\nwhat he paid in ' }, { t: 'green', cls: 'tone-pay' }, { t: '.' }]);
    for (let i = 0; i < RECEIPT.rows.length; i++) {
      await rc.row(i);
      await ctx.wait(150);
    }
    await rc.total();
    await talk.say('receipt-paid', [{ t: 'He paid ' }, { t: rupees(TOTAL.pay), em: true }, { t: '\nfor everything.' }]);
    talk.line.emphasize();
    rc.ping('total');
    talk.bird.point();
    ctx.advance(3000);
  }

  // Swifty reads out a line that is written on the screen as she says it (no bubble: its words are there).
  async function readOut(ctx, bird, id, text, show) {
    bird.talk();
    const saying = sayHere(ctx, id, text, 'bird');
    await show;
    await Promise.all([saying, ctx.wait(500)]);
    bird.idle();
  }

  // The money left, worked out on the big panel (the way screen 34 worked out the amount to pay): what his father gave,
  // what he spent, and Money left = ₹5,000 − ₹4,340 = ₹660.
  const LEFT_SHEET = {
    boxes: [{ label: 'Father gave', value: rupees(BUDGET), tone: 'blue' }, { label: 'Aniket spent', value: rupees(TOTAL.pay), tone: 'red' }],
    rows: [
      { label: [{ t: 'Money left' }], parts: [{ t: rupees(BUDGET) }, { op: '−' }, { t: rupees(TOTAL.pay) }] },
      { parts: [{ answer: rupees(BUDGET - TOTAL.pay) }] },
    ],
  };

  async function playMoneyLeft(ctx, scene) {
    const w = FX.workedSheet(scene.ui, LEFT_SHEET);
    const arriving = cornerSwifty(ctx, scene); // she flies in as the panel opens
    arriving.catch(() => {});
    w.open();
    await ctx.wait(600);
    const talk = await arriving;
    talk.bird.point();
    await talk.show([{ t: 'His father gave\nhim ' }, { t: rupees(BUDGET), em: true }, { t: '.' }]);
    await partWith(ctx, talk, 'left-gave', 0, 500, () => w.box(0));
    await talk.show([{ t: 'He spent ' }, { t: rupees(TOTAL.pay), em: true }, { t: '.' }]);
    await partWith(ctx, talk, 'left-spent', 0, 500, () => w.box(1));
    await talk.show([
      { t: 'Money left\n= ₹5,000 − ₹4,340', end: true },
      { t: '\n= ' }, { t: '₹660', em: true }, { t: '.' },
    ]);
    let writing = null;
    await partWith(ctx, talk, 'left-sum', 0, 300, () => {
      writing = (async () => {
        await w.write(0);
        for (let j = 0; j < 3; j++) await w.part(0, j);
      })();
    });
    await writing;
    await partWith(ctx, talk, 'left-660', 1, 200, () => {
      writing = w.write(1).then(() => w.answer(1)).then(() => w.mark(1));
    });
    await writing;
    talk.line.emphasize();
    talk.bird.point();
    endWithSwifty(ctx, scene, talk); // then the two amounts not to mix up
  }

  // Two different amounts, on two cards: the discount Aniket received in all (₹1,060), and the money left from the
  // budget (₹660), which he keeps. Swifty reads each card out.
  const TWO_AMOUNTS = {
    title: 'Two Different Amounts',
    cards: [
      { term: 'Total Discount Received', value: rupees(TOTAL.off), text: 'The difference between the marked prices and the prices Aniket paid.', sum: `${rupees(TOTAL.mp)} − ${rupees(TOTAL.pay)} = ${rupees(TOTAL.off)}`, tone: 'off' },
      { term: 'Money Left From the ₹5,000 Budget', value: rupees(BUDGET - TOTAL.pay), text: 'The amount Aniket gets to keep.', sum: `${rupees(BUDGET)} − ${rupees(TOTAL.pay)} = ${rupees(BUDGET - TOTAL.pay)}`, tone: 'left' },
    ],
  };

  async function playTwoAmounts(ctx, scene) {
    const t = FX.twoAmounts(scene.ui, TWO_AMOUNTS);
    const arriving = cornerSwifty(ctx, scene);
    arriving.catch(() => {});
    await ctx.wait(450); // the money-left sheet finishes fading away first
    await t.open();
    const talk = await arriving;
    talk.bird.point();
    await talk.say('two-intro', 'These are two\ndifferent amounts.', 400);
    await talk.clear();
    for (const [i, c] of TWO_AMOUNTS.cards.entries()) {
      const showing = t.card(ctx, i);
      showing.catch(() => {});
      await ctx.wait(500);
      await readOut(ctx, talk.bird, 'two-' + i, `${c.term}: ${c.value}. ${c.text}`, showing);
      t.ping(i);
      await ctx.wait(500);
    }
    talk.bird.point();
    endWithSwifty(ctx, scene, talk); // she flies off; the panel slides down
  }

  // Back home: Aniket comes in with his shopping bag and talks with his father, who sits at the table with his tea and
  // the newspaper, one bubble at a time between them.
  async function playHomeAgain(ctx, scene) {
    const DAD = { anchor: [1300, 330], corner: 'br', tip: [1348, 398] };        // up-left of his head, the tail at his mouth
    const BOY = { anchor: [700, 255], corner: 'bl', tip: [620, 292] };          // up-right of his face, the tail at his mouth
    const say = async (bubble, id, who) => {
      const line = await sayOnPicture(ctx, scene, bubble, id, who);
      await ctx.wait(900);
      await line.hide();
      await ctx.wait(250);
    };
    await ctx.wait(700);
    await say(Object.assign({ text: 'Did you get\neverything?' }, DAD), 'end-everything', 'dad');
    await say(Object.assign({ text: 'Yes!' }, BOY), 'end-yes', 'boy');
    await say(Object.assign({ text: 'How much did\nyou spend?' }, DAD), 'end-spend', 'dad');
    await say(Object.assign({ text: rupees(TOTAL.pay) + '.' }, BOY), 'end-spent', 'boy');
    await say(Object.assign({ text: 'So you still have\n' + rupees(BUDGET - TOTAL.pay) + ' left!' }, DAD), 'end-left', 'dad');
    await say(Object.assign({ text: 'And I got the\nbest deal for\nevery item!' }, BOY), 'end-best', 'boy');
    await sayOnPicture(ctx, scene, Object.assign({ text: 'Well done! You\nreally did shop\nwisely.' }, DAD), 'end-welldone', 'dad');
    ctx.advance(3000);
  }

  // The mission's result: MISSION COMPLETE, the four things ticked, and the four amounts.
  async function playMission(ctx, scene) {
    const m = FX.missionPanel(scene.ui, {
      title: 'MISSION COMPLETE',
      items: SHOPS.map(shop => ({ name: FULL_NAMES[shop.id], icon: shop.icon })),
      art: SHOP_ART,
      stats: [
        { label: 'Budget', value: rupees(BUDGET), tone: 'blue' },
        { label: 'Amount Spent', value: rupees(TOTAL.pay), tone: 'orange' },
        { label: 'Money Left', value: rupees(BUDGET - TOTAL.pay), tone: 'green' },
        { label: 'Total Discount Received', value: rupees(TOTAL.off), tone: 'pink' },
      ],
    });
    await ctx.wait(400);
    await m.enter(ctx);
    ctx.advance(3500);
  }

  // What we learnt, on four cards, each read out by Swifty as it comes in.
  const RECAP = {
    title: 'What We Learnt',
    cards: [
      { term: 'Marked Price', text: 'The price written on the item.', tone: 'mp' },
      { term: 'Discount', text: 'The amount reduced from the marked price.', formula: 'Discount =\nMarked Price − Selling Price', tone: 'd' },
      { term: 'Discount Percentage', text: 'The discount written as a percentage of the marked price.', formula: 'Discount % =\n(Discount ÷ Marked Price) × 100', tone: 'pct' },
      { term: 'Price After Discount', formula: 'Selling Price =\nMarked Price − Discount', tone: 'sp' },
    ],
  };

  async function playRecap(ctx, scene) {
    const r = FX.recapCards(scene.ui, RECAP);
    const arriving = cornerSwifty(ctx, scene); // she flies in as the panel opens
    arriving.catch(() => {});
    await ctx.wait(300);
    await r.open();
    const talk = await arriving;
    talk.bird.point();
    await talk.say('recap-intro', 'Let’s remember\nwhat we learnt!', 300);
    await talk.clear();
    for (const [i, c] of RECAP.cards.entries()) {
      const showing = r.card(ctx, i);
      showing.catch(() => {});
      await ctx.wait(400);
      await readOut(ctx, talk.bird, 'recap-' + i, [c.term + '.', c.text, c.formula].filter(Boolean).join(' '), showing);
      await ctx.wait(300);
    }
    talk.bird.point();
    endWithSwifty(ctx, scene, talk); // then the takeaway
  }

  // The takeaway, with the bag's two offers from Bag Corner: 25% OFF (SP = ₹1,200) against ₹250 OFF (₹1,150, the best
  // deal). Swifty: "A bigger discount percentage does not always mean a better deal." "Calculate how much you actually
  // have to pay." Then the banner: "Compare the final price before you buy."
  const TAKEAWAY = {
    offers: [
      { off: ['25%', 'OFF'], price: 'Marked Price ₹1,600', pay: '₹1,200' },
      { off: ['₹250', 'OFF'], price: 'Marked Price ₹1,400', pay: '₹1,150' },
    ],
    best: 1,
    text: 'Compare the final price before you buy.',
  };

  async function playTakeaway(ctx, scene) {
    const tk = FX.takeaway(scene.ui, Object.assign({ art: STREET_ART }, TAKEAWAY));
    const arriving = cornerSwifty(ctx, scene);
    arriving.catch(() => {});
    await ctx.wait(450); // the recap finishes fading away first
    tk.open();
    await ctx.wait(500);
    await tk.offer(ctx, 0);
    await tk.offer(ctx, 1);
    const talk = await arriving;
    talk.bird.point();
    await talk.say('takeaway-1', 'A bigger discount\npercentage does not\nalways mean a\nbetter deal.', 300);
    await tk.best();
    await ctx.wait(400);
    await talk.say('takeaway-2', 'Calculate how much\nyou actually have\nto pay.', 300);
    await ctx.wait(400);
    await tk.banner();
    talk.bird.point();
    endWithSwifty(ctx, scene, talk); // the last screen: then Replay
  }

  // A comic jolt of the whole picture, for a surprise.
  function jolt(scene) {
    if (reducedMotion) return;
    scene.el.animate([
      { transform: 'none' },
      { transform: 'scale(1.05) translate(-8px, 5px) rotate(-.6deg)', offset: 0.16 },
      { transform: 'scale(1.035) translate(8px, -6px) rotate(.5deg)', offset: 0.34 },
      { transform: 'scale(1.03) translate(-6px, 3px)', offset: 0.52 },
      { transform: 'scale(1.015) translate(3px, -2px)', offset: 0.72 },
      { transform: 'none' },
    ], { duration: 560, easing: 'ease-out' });
  }

  // Runs `fn` (class changes) with the scene's transitions switched off, so the new state applies at once.
  function instantly(scene, fn) {
    scene.el.classList.add('is-instant');
    void scene.el.offsetWidth;
    fn();
    void scene.el.offsetWidth;
    requestAnimationFrame(() => scene.el.classList.remove('is-instant'));
  }

  // Blurs and dims the scene behind the feedback, and pauses its slow camera drift meanwhile.
  // { instant: true } skips the fade, for a screen that should start out already blurred.
  function hush(scene, on, { instant = false } = {}) {
    if (scene.sheet) return; // nothing behind a sheet to blur
    const apply = () => scene.el.classList.toggle('is-hushed', on);
    if (instant) instantly(scene, apply);
    else apply();
    if (scene.kbAnim) {
      if (on) scene.kbAnim.pause();
      else scene.kbAnim.play();
    }
  }

  // An element's box in stage pixels (the stage itself is scaled to fit the window).
  function stageRect(node) {
    const stage = $('#stage').getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const k = STAGE_W / stage.width;
    const left = (r.left - stage.left) * k;
    const top = (r.top - stage.top) * k;
    return { left, top, width: r.width * k, height: r.height * k, right: left + r.width * k, bottom: top + r.height * k };
  }

  function stagePoint(node) {
    const r = stageRect(node);
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  // ======================================================================
  // The story pictures, brought to life (the revamp brief, rule 1)
  // ======================================================================
  // Short videos made from the story's pictures with Higgsfield (Seedance 2.5; the prompts are in "Animation Video
  // Prompts.md"), kept in game assets/video/ and listed in js/video_clips.js: the game plays only the clips there are, and
  // where one isn't made yet the still picture stays, as before (so it does with reduced motion). On a screen with clips,
  // its quiet loop plays while nobody speaks and each line's talking clip as the line is said; every clip of a screen
  // starts on its picture, so each takes over from another without a jump. (The clips made with Gemini don't end on it:
  // a talking clip with no loop to go back to stays on its last frame, and on some screens, `hold`, so does every one.)
  // A movement clip (one picture turning into the next) plays in place of the fade into the next screen, which then
  // comes in on its last frame.
  const CLIP_DIR = ASSETS + 'video/';
  // Each screen's clips: its quiet loop (`idle`; `once`: it plays once and holds its last frame), and its lines' talking
  // clips by line id (a list: the first one made; '': the clip already playing goes on). `hold`: after a talking clip
  // the loop doesn't start again, the clip stays on its last frame (where the people have moved on from the picture,
  // e.g. Aniket has finished stepping in, so starting the loop again would jump back). `react` and `after`: the clip of
  // a reaction (see Clips.react), and the loop after it.
  const CLIPS = {
    home: { idle: 's01-idle', lines: { plan: 's01-aniket-1', advice: 's01-father', promise: 's01-aniket-2' } },
    browse: { intro: 's05-pickup', idle: 's05-idle', lines: { browse: 's05-aniket' } }, // (intro: he picks the book up first, once it is made)
    ask: { idle: 's06-idle', lines: { ask: 's06-aniket', price: 's06-shopkeeper', costly: 's06-aniket', 'check-price': 's06-shopkeeper' } },
    pay: { idle: 's07-idle' },
    shock: { lines: { shock: 's10-aniket' } },
    reveal: {
      idle: 's06-idle',
      lines: { 'reveal-1': ['s14-shopkeeper-1', 's06-shopkeeper'], 'reveal-2': ['s14-shopkeeper-2', 's06-shopkeeper'], 'reveal-3': ['s14-shopkeeper-3', 's06-shopkeeper'] },
    },
    discount: { idle: 's06-idle', react: 's14-to-s15', after: 's15-idle' },
    outside: { idle: 's03-walk-in', once: true }, // into the bookstore (once it is made: see playOutside)
    // Out of the bookstore: one take cut in two, each played once (its last frame stays), and a cut between the screens.
    exit: { idle: 's20-out', once: true },
    leave: { idle: 's21-walk', once: true },
    // (The shoe shop is all clips: Screen 22 and 35 share Aniket pointing (s23-idle) and his talking clips.)
    sneakers: { idle: 's23-idle', lines: { sneakers: 's22-aniket-1', 'sneakers-off': 's22-aniket-2', 'sneakers-discount': 's22-aniket-3' } },
    shoe: { idle: 's23-zoom', once: true },
    confused: { idle: 's25-idle', lines: { 'shoe-price': 's25-aniket-1' } },
    offmeans: { idle: 's25-idle', lines: { 'off-what': 's25-aniket-1', 'shoe-ask': 's25-aniket-2' } },
    final: { idle: 's23-idle', lines: { 'final-1': 's22-aniket-1', 'final-2': 's22-aniket-3' } },
    boxed: { idle: 's36-box', once: true },
    return: { idle: 's40-idle', hold: true, lines: { 'home-ask': 's40-father-1', 'home-learnt': 's40-aniket', 'home-next': 's40-father-2' } },
    school: { idle: 's41-idle', lines: { 'school-soon': 's41-father-1', 'school-need': ['s41-father-2', 's41-father-1'] } },
    money: { lines: { money: 's43-father' } },
    deal: {
      idle: 's45-idle', hold: true,
      lines: { 'deal-use': 's45-father-1', 'deal-left': ['s45-father-2', 's45-father-1'], 'deal-really': 's45-aniket-1', 'deal-offers': 's45-aniket-2' },
    },
    begin: { idle: 's46-idle' },
    homeagain: {
      idle: 's56-idle',
      lines: {
        'end-everything': 's56-father-1', 'end-yes': 's56-aniket-1', 'end-spend': 's56-father-2', 'end-spent': 's56-aniket-2',
        'end-left': 's56-father-3', 'end-best': 's56-aniket-3', 'end-welldone': 's56-father-4',
      },
    },
  };
  // The movement clips, going forward from one screen to the next ("from>to").
  const CLIP_FADE = 400; // ms: a clip fades in over the one before (css .scene-clip)
  // A talking clip plays until its speaker's lips have stopped for good (the seconds here, measured on the speaker's face
  // in each clip: frame to frame, the last movement) before the next line comes in; from there its face is still, so the
  // next clip takes over with no cut to see. A clip not listed here (the Gemini ones, whose people go on moving to their
  // last frame) plays to its end first (the user, 2026-10-22: "no need to cut the video, play full video"). Measure a new
  // take again (tools/clip_rest.py).
  const CLIP_REST = {
    's01-aniket-1': 4.5, 's01-aniket-2': 1.42, 's01-father': 3.58, 's05-aniket': 2.5, 's06-aniket': 1.83, 's06-shopkeeper': 2.67,
    's22-aniket-3': 3.83,
  };
  const CLIP_MOVES = {
    'list>money': 's42-to-s43', // (s06-to-s07, from Aniket asking to his paying, went with the user's doc of 2026-10-23: he pays later)
  };

  const Clips = {
    // A clip there is to play (made, and listed in js/video_clips.js), unless motion is turned down.
    has: name => !!name && !reducedMotion && typeof VIDEO_CLIPS === 'object' && Object.prototype.hasOwnProperty.call(VIDEO_CLIPS, name),
    first: names => [].concat(names || []).find(n => Clips.has(n)) || null,
    planned: scene => !!CLIPS[scene.id] || Object.keys(CLIP_MOVES).some(k => k.startsWith(scene.id + '>')),
    moveFor: (from, to) => (Clips.has(CLIP_MOVES[`${from.id}>${to.id}`]) ? CLIP_MOVES[`${from.id}>${to.id}`] : null),

    // The <video> of a clip on its screen: made when first needed, and loaded straight away (muted: the game plays the
    // voices; inline, for tablets). `key`: a second copy of the clip (see play).
    video(scene, name, key = name) {
      scene.clipEls = scene.clipEls || {};
      let v = scene.clipEls[key];
      if (!v) {
        v = el('video', 'scene-clip', scene.clipBox);
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.preload = 'auto';
        ['muted', 'playsinline', 'disablepictureinpicture'].forEach(a => v.setAttribute(a, ''));
        v.setAttribute('aria-hidden', 'true');
        v.src = CLIP_DIR + name + '.mp4';
        scene.clipEls[key] = v;
      }
      return v;
    },

    // Plays a clip from its start, taking over from the clip on screen: it fades in over it (and then that one goes),
    // so nothing jumps. Resolves (true) once it has ended, or at once for a loop; false if another clip took over first,
    // or the clip isn't there. `onShow` is called as it comes on screen. `instant`: it shows at once, with no fade (the
    // first clip of a screen that carries straight on from the one before, e.g. Aniket walking out: 20 → 21).
    // A loop never jumps where it starts again (the user, 2026-10-21: "seamless, no atka atka"): just before its end,
    // a copy of it starts and fades in over it (CLIP_FADE), and so on, the two taking turns.
    play(scene, name, { loop = false, onShow = null, instant = false, onEnding = null, restAt = null, onRest = null } = {}) {
      if (!scene.clipBox || !Clips.has(name)) return Promise.resolve(false);
      let v = Clips.video(scene, name);
      if (v.classList.contains('is-on')) v = Clips.video(scene, name, name + ' again'); // said again while it shows: a copy fades in over it
      const turn = (scene.clipTurn || 0) + 1;
      scene.clipTurn = turn;
      v.loop = false;
      v.style.zIndex = turn;
      if (v.currentTime) v.currentTime = 0;
      const others = () => Object.values(scene.clipEls).filter(o => o !== v);
      const show = () => {
        if (scene.clipTurn !== turn) return;
        if (instant) {
          v.style.transition = 'none';
          v.classList.add('is-on');
          void v.offsetWidth;
          v.style.transition = '';
        } else v.classList.add('is-on');
        if (onShow) onShow();
        setTimeout(() => {
          if (scene.clipTurn !== turn) return;
          others().forEach(o => { o.classList.remove('is-on'); o.pause(); });
        }, instant ? 0 : CLIP_FADE + 20); // (once it has faded in over them: css .scene-clip)
      };
      // Just before its end: a loop starts again (a copy, fading in over it); `onEnding` (e.g. back to the quiet loop) is
      // called, so what comes next fades in while this one still moves, and nothing waits on a still last frame.
      if (onRest && restAt !== null) { // (its speaker's lips have stopped: see CLIP_REST)
        const rest = () => {
          if (scene.clipTurn !== turn || v.currentTime >= restAt) {
            v.removeEventListener('timeupdate', rest);
            if (scene.clipTurn === turn) onRest();
          }
        };
        v.addEventListener('timeupdate', rest);
      }
      const ending = loop ? () => Clips.play(scene, name, { loop: true }) : onEnding;
      if (ending) {
        const near = () => {
          if (scene.clipTurn !== turn) { v.removeEventListener('timeupdate', near); return; }
          if (v.duration && v.duration - v.currentTime < (CLIP_FADE + 250) / 1000) {
            v.removeEventListener('timeupdate', near);
            ending();
          }
        };
        v.addEventListener('timeupdate', near);
      }
      if (v.readyState >= 2 && !v.seeking) show();
      else ['seeked', 'playing'].forEach(type => v.addEventListener(type, show, { once: true })); // (rewound, or loading)
      const playing = v.play();
      if (playing) playing.catch(() => {}); // (refused or interrupted: the picture stays)
      if (loop) return Promise.resolve(true);
      return new Promise(resolve => {
        const done = () => {
          clearTimeout(guard);
          v.removeEventListener('ended', done);
          resolve(scene.clipTurn === turn);
        };
        const guard = setTimeout(done, (VIDEO_CLIPS[name] + 1.5) * 1000); // a clip that stalls never holds the story up
        v.addEventListener('ended', done);
      });
    },

    // Back to the screen's quiet loop. Without one (or on a `hold` screen), the clip that just ended stays on its last
    // frame; after a reaction with no loop, the clips make way for the reaction picture.
    idle(scene) {
      const plan = CLIPS[scene.id] || {};
      const name = Clips.first(scene.reacted ? plan.after : plan.idle);
      if (scene.reacted && !name) Clips.fade(scene);
      else if (name && !plan.hold && !(plan.once && !scene.reacted)) return Clips.play(scene, name, { loop: true });
      return Promise.resolve(false);
    },

    // The clips fade out, leaving the picture (and anything over it, e.g. a reaction picture).
    fade(scene) {
      scene.clipTurn = (scene.clipTurn || 0) + 1;
      Object.values(scene.clipEls || {}).forEach(v => { v.classList.remove('is-on'); v.pause(); });
    },

    // A screen starts: its quiet loop (or its one clip), if it has clips; at once when the screen carries straight on
    // from the one before (`instant`). The next screen's clips start loading meanwhile, and any loaded for another screen
    // are let go.
    start(scene, instant = false) {
      scene.reacted = false;
      const plan = scene.clipBox && CLIPS[scene.id];
      if (plan) {
        const intro = Clips.first(plan.intro); // played once first, from the screen's first frame, then the quiet loop
        const name = Clips.first(plan.idle);
        if (intro) Clips.play(scene, intro, { instant: true, onEnding: () => Clips.idle(scene) });
        else if (name) Clips.play(scene, name, { loop: !plan.once, instant });
      }
      const next = SCENES[SCENES.indexOf(scene) + 1];
      SCENES.forEach(s => { // clips loaded ahead for a screen the player didn't go to are let go
        if (s !== scene && s !== next && s.clipEls && !s.el.classList.contains('is-active')) Clips.stop(s);
      });
      if (next && next.clipBox) Clips.preload(next);
    },

    preload(scene) {
      const plan = CLIPS[scene.id] || {};
      [plan.intro, plan.idle, ...Object.values(plan.lines || {})].map(Clips.first).filter(Boolean).forEach(n => Clips.video(scene, n));
    },

    // A line is said: its talking clip plays with it, then the quiet loop again. Returns a promise that resolves as the
    // clip comes on screen (so the voice can start with the lips: see sayHere), and its `done` one once the speaker is
    // done in it (see CLIP_REST); or null without a clip.
    talk(scene, id) {
      const plan = scene && CLIPS[scene.id];
      if (!plan || !plan.lines || !(id in plan.lines) || plan.lines[id] === '') return null;
      const name = Clips.first(plan.lines[id]);
      if (!name) return null;
      let rested = null;
      const done = new Promise(r => { rested = r; });
      let on = false;
      const shown = new Promise(resolve => {
        const back = () => { if (SCENES[Game.index] === scene) Clips.idle(scene); }; // (the quiet loop, as it ends)
        const show = () => { on = true; resolve(); };
        Clips.play(scene, name, { onShow: show, onEnding: back, restAt: CLIP_REST[name] ?? null, onRest: rested })
          .then(() => { resolve(); rested(); });
      });
      setTimeout(() => { if (!on) rested(); }, 1500); // (a clip that doesn't play at all holds no line up)
      shown.done = done; // (its speaker done: lips still, or the clip at its end; see CLIP_REST, sayHere)
      return shown;
    },

    // A reaction (screen 15: Aniket's face turns puzzled): its clip, then the loop after it. Without one, the clips make
    // way for the reaction picture the screen fades in.
    react(scene) {
      const plan = CLIPS[scene.id] || {};
      scene.reacted = true;
      const name = Clips.first(plan.react);
      if (!name) {
        if (Clips.first(plan.after)) Clips.idle(scene);
        else Clips.fade(scene);
        return;
      }
      Clips.play(scene, name).then(mine => { if (mine && SCENES[Game.index] === scene) Clips.idle(scene); });
    },

    // The screen is left: its clips stop and let go of their files.
    stop(scene) {
      scene.clipTurn = (scene.clipTurn || 0) + 1;
      Object.values(scene.clipEls || {}).forEach(v => {
        v.pause();
        v.removeAttribute('src');
        v.load();
        v.remove();
      });
      scene.clipEls = {};
    },
  };

  // ======================================================================
  // Scene runner + navigation
  // ======================================================================

  const readPref = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v === '1';
    } catch (e) {
      return fallback;
    }
  };

  const Game = {
    index: -1,
    token: 0,      // bumps every time a scene starts; stale scripts see it and stop
    timers: new Set(),
    leaving: null,  // scene fading out underneath during a cross-fade
    fadeAnim: null,
    fadeTimer: 0,
    startTimer: 0,
    hold: null,    // { token, ms } while a scene waits to auto-advance
    countdown: 0,
    starting: false,
    autoplay: readPref('bj.autoplay', true),
    moving: null,  // { from } while a movement clip plays in place of a screen change (see go, Clips)
  };

  function makeCtx() {
    const token = Game.token;
    const alive = () => token === Game.token;
    return {
      alive,
      // A story pause, stretched by PACE (so is the typing, which waits between letters).
      // { real: true } waits exactly `ms`, e.g. the "after 3 seconds" asked for the Next button.
      wait(ms, { real = false } = {}) {
        return new Promise((resolve, reject) => {
          if (!alive()) return reject(CANCELLED);
          const id = setTimeout(() => {
            Game.timers.delete(id);
            if (alive()) resolve(); else reject(CANCELLED);
          }, real ? ms : ms * PACE);
          Game.timers.add(id);
        });
      },
      // End of a scene: move on after `ms` (Next fills up as a timer; not stretched by PACE, so changing
      // screens stays brisk), or wait for Next if auto-play is off. The last screen waits for Replay instead.
      advance(ms) {
        if (!alive()) return;
        showAll(SCENES[Game.index]); // everything said on it shows again (see dimOthers)
        if (Game.index === LAST) return UI.setReady(true); // the story so far ends here: invite a replay
        Game.hold = { token, ms };
        if (Game.autoplay) startCountdown();
        else UI.setReady(true);
      },
    };
  }

  function stopScene() {
    Game.token++;
    Game.timers.forEach(clearTimeout);
    Game.timers.clear();
    Game.hold = null;
    clearTimeout(Game.countdown);
    UI.countdown(0);
    UI.setReady(false);
    Sound.duck(false);
    Voice.stop();
  }

  function startCountdown() {
    const hold = Game.hold;
    if (!hold || hold.token !== Game.token) return;
    UI.setReady(false);
    UI.countdown(hold.ms);
    clearTimeout(Game.countdown);
    Game.countdown = setTimeout(() => {
      if (Game.hold === hold && hold.token === Game.token) next();
    }, hold.ms);
  }

  function setAutoplay(on) {
    Game.autoplay = on;
    try { localStorage.setItem('bj.autoplay', on ? '1' : '0'); } catch (e) { /* ignore */ }
    $('#autoplay-toggle').checked = on;
    if (on) {
      startCountdown();
    } else if (Game.hold && Game.hold.token === Game.token) {
      clearTimeout(Game.countdown);
      UI.countdown(0);
      UI.setReady(true);
    }
  }

  // mode: 'cut' (settle-in zoom), 'fade' or 'continue' (no settle). `camera` carries the
  // previous screen's camera over when both screens share one shot. A screen's `setup` then runs at once,
  // before any cross-fade starts.
  function activate(scene, mode, camera) {
    scene.layer.replaceChildren();
    scene.ui.replaceChildren();
    scene.bird = null; // (Swifty comes with her first bubble: see cornerSwifty)
    if (scene.patchBox) scene.patchBox.replaceChildren();
    scene.el.classList.remove('is-leaving', 'is-entering', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting', 'has-sheet');
    scene.el.classList.add('is-active');
    if (mode === 'cut' && !reducedMotion && !scene.still) {
      void scene.el.offsetWidth; // restart the settle-in animation
      scene.el.classList.add('is-entering');
    }
    startCamera(scene, camera);
    if (camera) scene.parallax.style.transform = camera.parallax;
    if (scene.setup) scene.setup(scene);
    Clips.start(scene, mode === 'continue');
  }

  function startCamera(scene, camera) {
    if (scene.kbAnim) scene.kbAnim.cancel();
    scene.kbAnim = null;
    scene.world.style.transform = '';
    scene.startFrom = camera ? camera.transform : null;
    if (!scene.kb) return; // this screen moves its own camera
    if (camera && scene.glide) { // hold the previous screen's framing; the script glides from it (glideCamera)
      scene.world.style.transform = camera.transform;
      return;
    }
    if (reducedMotion) {
      scene.world.style.transform = scene.kb.from;
      return;
    }
    // Slow "Ken Burns" drift on the artwork (and everything placed on it).
    scene.kbAnim = scene.world.animate(
      [{ transform: scene.kb.from }, { transform: scene.kb.to }],
      { duration: 16000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' }
    );
    if (camera && camera.time) scene.kbAnim.currentTime = camera.time;
  }

  // From the framing held by startCamera to this screen's own, then on with its usual slow drift.
  function glideCamera(ctx, scene, ms) {
    const from = scene.world.style.transform;
    if (!from || reducedMotion) {
      startCamera(scene, null);
      return Promise.resolve();
    }
    const glide = scene.world.animate([{ transform: from }, { transform: scene.kb.from }], {
      duration: ms * PACE, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards',
    });
    scene.kbAnim = glide;
    return FX.settle(glide).then(() => {
      if (!ctx.alive() || scene.kbAnim !== glide) return;
      startCamera(scene, null); // starts at kb.from, exactly where the glide ended
    });
  }

  function deactivate(scene) {
    scene.el.classList.remove('is-active', 'is-entering', 'is-leaving', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting', 'has-sheet');
    scene.el.style.zIndex = '';
    scene.el.style.transitionDuration = '';
    unsnap(scene);
    if (scene.kbAnim) {
      scene.kbAnim.cancel();
      scene.kbAnim = null;
    }
    scene.layer.replaceChildren();
    scene.ui.replaceChildren();
    if (scene.clipBox) Clips.stop(scene);
  }

  function cameraOf(scene) {
    return {
      time: scene.kbAnim ? scene.kbAnim.currentTime : null,
      transform: getComputedStyle(scene.world).transform,
      parallax: scene.parallax.style.transform,
    };
  }

  function run(scene) {
    const ctx = makeCtx();
    Promise.resolve()
      .then(() => scene.play(ctx, scene))
      .catch(err => { if (err !== CANCELLED) console.error(err); });
  }

  // Cross-fade only between these neighbouring screens (at home → at the mall, Bookstore → sees the
  // book → holds it → How Much?, question → closer look at his new book, and into the shoe shop → at the
  // sneakers' stand → the discount on them → his questions about it, and his final answer → the sneakers in their
  // box), both ways; and, going forward only, between screens
  // over the same blurred picture: the price panels (Marked Price → its definition → MP vs SP, so only their
  // right side changes), MP vs SP → the counter, the Discount definition → formula → formula reveal → summary,
  // what the 30% OFF tag means → the sneakers card → the percentage rule → its example → a quick check → Checkpoint 2 → the sneakers' question → 30% of ₹1800
  // worked out → what ₹540 is → the amount to pay → the final answer; and 540 as a percent of 1800 → the discount
  // percentage → the summary.
  // Every other change is a straight cut.
  const FADES = [['home', 'outside'], ['return', 'school'], ['school', 'list'], ['list', 'money'], ['money', 'deal'], ['deal', 'begin'], ['begin', 'shops'], ['shops', 'uniform'], ['shops', 'shoes'], ['shops', 'bag'], ['shops', 'bottle'], ['shops', 'complete'], ['uniform', 'complete'], ['shoes', 'complete'], ['bag', 'complete'], ['bottle', 'complete'], ['complete', 'receipt'], ['homeagain', 'mission'], ['mpcard', 'reveal'], ['pay', 'exit'], ['outside', 'browse'], ['browse', 'ask'], ['leave', 'sneakers'], ['sneakers', 'shoe'], ['shoe', 'confused'], ['final', 'boxed']];
  const FORWARD_FADES = [['mp', 'mpcard'], ['formula', 'formula-reveal'], ['confused', 'smcard'], ['smcard', 'offmeans'], ['percentrule', 'whatpercent'],
    ['whatpercent', 'check'], ['check', 'topay'], ['topay', 'thirty'], ['thirty', 'paywork'], ['paywork', 'final'], ['left', 'two'], ['recap', 'takeaway']];
  const FADE_MS = 1200; // not stretched by PACE: changing screens stays brisk
  const SLIDE_MS = 950;  // a sheet sliding up over a story picture (see slide)
  const fadesBetween = (a, b) =>
    FADES.some(([x, y]) => (a.id === x && b.id === y) || (a.id === y && b.id === x)) ||
    FORWARD_FADES.some(([x, y]) => a.id === x && b.id === y);

  // Jump a running cross-fade to its end (e.g. the player clicked again mid-fade).
  function settleTransition() {
    clearTimeout(Game.fadeTimer);
    if (Game.fadeAnim) {
      Game.fadeAnim.cancel();
      Game.fadeAnim = null;
    }
    if (Game.leaving) {
      deactivate(Game.leaving);
      Game.leaving = null;
    }
    SCENES.forEach(s => {
      s.el.style.zIndex = '';
      s.el.classList.remove('is-sliding', 'is-snapping');
      s.el.style.transformOrigin = '';
      s.el.querySelectorAll(':scope > .snap-ghost').forEach(n => n.remove());
      if (s.snapEl) s.snapEl.style.opacity = '';
    });
  }

  // Undoes what moving a scene into or out of the snapshot frame left on it (see shrinkInto, growOut).
  function unsnap(scene) {
    (scene.snapAnims || []).forEach(a => a.cancel());
    scene.snapAnims = null;
    scene.el.classList.remove('is-snapping');
    scene.el.style.transformOrigin = '';
    scene.parallax.style.transformOrigin = '';
    scene.parallax.style.opacity = '';
    scene.world.style.transformOrigin = '';
    scene.el.querySelectorAll(':scope > .snap-ghost').forEach(n => n.remove());
  }

  // `afterMove`: the screen comes in on the last frame of the movement clip that just played (see Clips): a cut.
  // `jump`: chosen in the scene list, so it comes in straight away (no movement clip on the way).
  function go(i, { afterMove = false, jump = false } = {}) {
    if (i < 0 || i > LAST) return;
    const moving = Game.moving; // a movement clip was playing: the player moved on (or back) meanwhile, so it stops here
    if (moving) {
      Game.moving = null;
      Clips.fade(moving.from);
    }
    stopScene();
    clearTimeout(Game.startTimer);
    UI.closePanel(true);
    settleTransition();
    const from = SCENES[Game.index];
    const to = SCENES[i];
    const forward = i === Game.index + 1;
    const changing = from && from !== to;
    // The picture turns into the next one (a movement clip, in place of the fade): the clip plays on this screen, its
    // bubbles going, and the next screen then comes in on its last frame.
    const move = changing && forward && !moving && !afterMove && !jump && Clips.moveFor(from, to);
    if (move) {
      Game.moving = { from };
      from.layer.querySelectorAll('.bubble').forEach(b => {
        b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
      });
      Clips.play(from, move).then(() => {
        if (!Game.moving || Game.moving.from !== from) return; // the player has moved on
        Game.moving = null;
        go(i, { afterMove: true });
      });
      return;
    }
    // Into a sheet (see SHEETS) from a screen next to it, the sheet slides up over the picture; out of it, it
    // slides back down (jumps further away are cuts).
    const onSheet = s => !!s.sheet || s.el.classList.contains('has-sheet');
    const sheet = changing && !reducedMotion && Math.abs(i - Game.index) === 1 && onSheet(from) !== onSheet(to);
    const fade = changing && !sheet && !afterMove && fadesBetween(from, to);
    // Same camera shot (4 ↔ 5, 7 → 8): carry the camera over so nothing jumps.
    const sameFraming = from && to && from.kb && to.kb && ['origin', 'from', 'to'].every(k => from.kb[k] === to.kb[k]);
    const carry = changing && from.shot && from.shot === to.shot && (forward || sameFraming);
    const camera = carry ? cameraOf(from) : null;
    to.cameFrom = from ? from.id : null; // lets a screen carry on from the one before it
    if (from && !fade && !sheet) deactivate(from);
    Game.index = i;
    UI.update();
    syncBar(to);

    if (sheet) {
      const framed = x => !!x.snapEl;
      if (to.snapEl && !onSheet(from)) shrinkInto(from, to); // the revamp: the picture shrinks into the frame
      else if (framed(from) && !onSheet(to)) growOut(from, to); // …and grows back out of it
      else slide(from, to);
      return;
    }
    if (!fade) {
      activate(to, carry || afterMove ? 'continue' : 'cut', camera);
      run(to);
      return;
    }

    // The new scene fades in on top while the old one drifts forward underneath
    // (3 → 4 pushes right into the store; same-shot fades are a pure dissolve).
    Sound.whoosh();
    activate(to, 'fade', camera);
    to.el.style.zIndex = 2;
    const still = carry || reducedMotion || from.still || to.still; // a still picture just dissolves
    Game.fadeAnim = to.el.animate(
      still
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }],
      { duration: FADE_MS, easing: 'ease-in-out' }
    );
    if (!still) {
      from.el.classList.remove('is-entering');
      void from.el.offsetWidth;
      from.el.style.setProperty('--leave-scale', from.exit === 'zoom' && i > Game.index ? 1.3 : 1.05);
      from.el.style.transitionDuration = FADE_MS + 'ms'; // drift for as long as the fade lasts
      from.el.classList.add('is-leaving');
    }
    // The shop picture with only the sneakers sharp (screens 24–27) going into a different picture: it blurs all over as
    // the next one comes in, so the two stands don't show double in the dissolve.
    if (from.bg !== to.bg && (from.blurOut || from.ui.querySelector('.spot-veil'))) allBlur(from, { instant: false }).style.transitionDuration = '400ms';
    Game.leaving = from;
    Game.startTimer = setTimeout(() => run(to), FADE_MS * 0.45); // first beats land as the fade ends
    Game.fadeTimer = setTimeout(settleTransition, FADE_MS);
  }

  // A sheet (the big panel) comes up from the bottom over the picture and settles with a little
  // bounce (only the sheet itself moves: the screen's own things, e.g. Swifty carried over from the screen
  // before, stay where they are); leaving, the whole sheet slides back down. The picture underneath doesn't
  // move or blur.
  function slide(from, to) {
    const up = !!to.sheet;
    Sound.whoosh();
    activate(to, 'continue', null);
    const sheet = up ? to : from;
    sheet.el.style.zIndex = 2;
    sheet.el.classList.add('is-sliding');
    const node = up ? to.parallax : from.el;
    Game.fadeAnim = node.animate(up
      ? [{ transform: 'translateY(100%)' }, { transform: 'translateY(-1.2%)', offset: 0.78 }, { transform: 'none' }]
      : [{ transform: 'none' }, { transform: 'translateY(100%)' }], {
      duration: up ? SLIDE_MS : SLIDE_MS * 0.8,
      easing: up ? 'cubic-bezier(.2,.7,.3,1)' : 'cubic-bezier(.5,0,.75,.45)',
      fill: 'forwards',
    });
    Game.leaving = from;
    Game.startTimer = setTimeout(() => run(to), (up ? SLIDE_MS : SLIDE_MS * 0.8) * 0.6);
    Game.fadeTimer = setTimeout(settleTransition, up ? SLIDE_MS : SLIDE_MS * 0.8);
  }

  // The review's continuity (v2). Into a teaching screen, the screen before (its words and marks fading away, its camera
  // easing back to rest) shrinks into the snapshot frame in the corner of the new screen, which is already in place
  // underneath; then the new screen's own snapshot, the same picture, takes its place.
  const SNAP_MS = 1100;
  const SNAP_EASE = 'cubic-bezier(.65,0,.25,1)';
  const snapFrames = (grow = false, rect = SNAP) => { // (rect: the frame, 16:9)
    const k = rect.w / STAGE_W;
    const big = { transform: 'none', borderRadius: '0px', boxShadow: '0 0 0 0 rgba(255, 255, 255, 0), 0 0 0 0 rgba(27, 42, 51, 0)' };
    const small = {
      transform: `translate(${rect.x}px, ${rect.y}px) scale(${k})`,
      borderRadius: `${22 / k}px`, // 22 px, 8 px and so on once it is scaled down
      boxShadow: `0 0 0 ${8 / k}px #fff, 0 ${16 / k}px ${36 / k}px rgba(27, 42, 51, .22)`,
    };
    return grow ? [small, big] : [big, small];
  };

  function shrinkInto(from, to) {
    Sound.whoosh();
    // The camera, as it is now, about the picture's top-left corner; and zoomed in on what matters (the revamp, rule 4:
    // the ₹1000 sticker, the 30% OFF tag), as the snapshot will show it.
    const cs = getComputedStyle(from.world);
    const camera = cs.transform === 'none' ? new DOMMatrix() : new DOMMatrix(cs.transform);
    const [ox, oy] = cs.transformOrigin.split(' ').map(parseFloat);
    const now = new DOMMatrix().translate(ox, oy).multiply(camera).translate(-ox, -oy);
    const same = [from.bg, from.react].includes(to.snap); // the snapshot is of this very picture (or of its reaction)
    const [fx, fy, z] = same && to.snapFocus ? to.snapFocus : [STAGE_W / 2, STAGE_H / 2, 1];
    const zoomed = new DOMMatrix().translate(fx, fy).scale(z).translate(-fx, -fy);
    activate(to, 'continue', null);
    to.el.style.zIndex = 1;
    to.snapEl.style.opacity = '0';
    from.el.style.zIndex = 3;
    from.el.style.transformOrigin = '0 0';
    from.el.classList.add('is-snapping');
    if (from.kbAnim) {
      from.kbAnim.cancel();
      from.kbAnim = null;
    }
    from.world.style.transformOrigin = '0 0';
    const ms = SNAP_MS + 500; // the zoom, then the shrink
    from.snapAnims = [
      from.world.animate([{ transform: now.toString() }, { transform: zoomed.toString(), offset: 0.42 }, { transform: zoomed.toString() }],
        { duration: ms, easing: 'ease-in-out', fill: 'forwards' }),
      ...[from.layer, from.ui].map(n => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })),
    ];
    const [big, small] = snapFrames();
    Game.fadeAnim = from.el.animate([big, Object.assign({}, big, { offset: 0.36 }), small], { duration: ms, easing: SNAP_EASE, fill: 'forwards' });
    Game.leaving = from;
    Game.startTimer = setTimeout(() => run(to), ms * 0.7);
    Game.fadeTimer = setTimeout(() => {
      settleTransition();
      if (!same && to.snapEl) to.snapEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450 }); // (another picture)
    }, ms);
  }

  // Out of a teaching screen (v2): the next screen grows out of the snapshot frame to fill the screen, over the panel;
  // at first it shows the snapshot's picture (zoomed as the snapshot was), which melts into its own as it grows.
  function growOut(from, to) {
    Sound.whoosh();
    activate(to, 'continue', null);
    from.el.style.zIndex = 1; // (its own layer, so nothing on it, e.g. its Next button, shows over the new screen)
    to.el.style.zIndex = 3;
    to.el.style.transformOrigin = '0 0';
    to.el.classList.add('is-snapping');
    (from.snapEl || from.parallax).style.opacity = '0'; // the growing frame takes its place
    const ghost = el('img', 'snap-ghost');
    Object.assign(ghost, { src: from.snap || from.bg, alt: '' });
    focusOn(ghost, from.snapFocus);
    to.el.insertBefore(ghost, to.ui);
    to.snapAnims = [ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SNAP_MS * 0.7, delay: SNAP_MS * 0.15, easing: 'ease-in-out', fill: 'both' })];
    Game.fadeAnim = to.el.animate(snapFrames(true), { duration: SNAP_MS, easing: SNAP_EASE });
    Game.leaving = from;
    Game.startTimer = setTimeout(() => run(to), SNAP_MS * 0.8);
    Game.fadeTimer = setTimeout(() => {
      unsnap(to);
      settleTransition();
    }, SNAP_MS);
  }

  // Next and Back go to the screen after or before, unless the screen says where (`next`, `back`: a screen's id). The
  // shopping game isn't a straight line: Next on the Shopping Area goes to the next item to buy, and from a street
  // both go back to the Shopping Area (or, once everything is bought, Next goes on to the end).
  function next() {
    const scene = SCENES[Game.index];
    if (Game.index === 0) startStory();
    else if (scene.next) go(sceneIndex(scene.next()));
    else if (Game.index >= LAST) go(1); // Replay
    else go(Game.index + 1);
  }

  function back() {
    const scene = SCENES[Game.index];
    if (scene.back) go(sceneIndex(scene.back()));
    else if (Game.index > 0) go(Game.index - 1);
  }

  // ======================================================================
  // HUD: back/next and the scene panel.
  // Music, sound and full screen have no on-screen buttons: keys M, S and F.
  // ======================================================================

  const ICONS = {
    scenes: '<rect x="6" y="8" width="15" height="13" rx="3"/><rect x="27" y="8" width="15" height="13" rx="3"/><rect x="6" y="27" width="15" height="13" rx="3"/><rect x="27" y="27" width="15" height="13" rx="3"/>',
    back: '<path d="M30 10L16 24l14 14"/>',
    next: '<path d="M18 10l14 14-14 14"/>',
    replay: '<path d="M10.5 26A14 14 0 1 0 14 14.5"/><path d="M12 6v9h9"/>',
  };
  const icon = name => `<svg class="icon" viewBox="0 0 48 48" aria-hidden="true">${ICONS[name]}</svg>`;

  const UI = {
    update() {
      const i = Game.index;
      const isLast = i === LAST;
      $('#nav').classList.toggle('is-hidden', i <= 0);
      $('#btn-back').disabled = i <= 0;
      $('#nav-count').textContent = `${Math.max(i, 1)} / ${LAST}`;
      $('#btn-next .nav-label').textContent = isLast ? 'Replay' : 'Next';
      $('#btn-next .nav-icon').innerHTML = icon(isLast ? 'replay' : 'next');
      $('#btn-next').setAttribute('aria-label', isLast ? 'Replay the story' : 'Next scene');
      SCENES.forEach((s, k) => {
        s.item.classList.toggle('is-current', k === i);
        if (k === i) s.item.setAttribute('aria-current', 'step');
        else s.item.removeAttribute('aria-current');
      });
    },
    countdown(ms) {
      const b = $('#btn-next');
      b.classList.remove('is-counting');
      if (ms > 0) {
        void b.offsetWidth; // restart the fill animation
        b.style.setProperty('--count', ms + 'ms');
        b.classList.add('is-counting');
      }
    },
    setReady(on) {
      $('#btn-next').classList.toggle('is-ready', on);
    },
    get panelOpen() {
      return $('#panel').classList.contains('is-open');
    },
    openPanel() {
      $('#panel').classList.add('is-open');
      $('#panel-scrim').classList.add('is-open');
      $('#panel').setAttribute('aria-hidden', 'false');
      $('#btn-panel').setAttribute('aria-expanded', 'true');
      Sound.swish();
      // The list scrolls once it is taller than the panel: bring the current screen into the middle of it.
      const list = $('#scene-list');
      const current = SCENES[Math.max(Game.index, 0)].item;
      const row = current.parentElement;
      list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
      setTimeout(() => current.focus({ preventScroll: true }), 60);
    },
    closePanel(silent) {
      if (!UI.panelOpen) return;
      $('#panel').classList.remove('is-open');
      $('#panel-scrim').classList.remove('is-open');
      $('#panel').setAttribute('aria-hidden', 'true');
      $('#btn-panel').setAttribute('aria-expanded', 'false');
      if (!silent) Sound.swish();
    },
    togglePanel() {
      if (UI.panelOpen) UI.closePanel();
      else UI.openPanel();
    },
  };

  function toggleMusic() {
    Sound.unlock();
    Sound.setMusic(!Sound.musicOn);
  }

  function toggleSfx() {
    Sound.setSfx(!Sound.sfxOn); // the voices follow the sound-effects switch
    if (!Sound.sfxOn) Voice.stop();
    Sound.click();
  }

  function toggleFullscreen() {
    const d = document;
    const app = $('#app');
    try {
      if (d.fullscreenElement || d.webkitFullscreenElement) {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      } else {
        const p = (app.requestFullscreen || app.webkitRequestFullscreen).call(app);
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* fullscreen not allowed here */ }
  }

  function buildScenes() {
    const host = $('#scenes');
    SCENES.forEach(scene => {
      scene.el = el('section', 'scene', host);
      scene.el.dataset.scene = scene.id;
      scene.el.setAttribute('aria-label', scene.title);
      if (scene.zoomOrigin) scene.el.style.setProperty('--zoom-origin', scene.zoomOrigin);
      if (scene.backdrop) el('div', 'scene-backdrop', scene.el).style.backgroundImage = `url("${scene.bg}")`;
      scene.parallax = el('div', 'scene-parallax', scene.el);
      scene.world = el('div', 'scene-world', scene.parallax);
      scene.world.style.setProperty('--kb-origin', scene.kb ? scene.kb.origin : scene.origin);
      if (scene.sheet) scene.el.classList.add('is-sheet');
      if (scene.look) scene.el.classList.add('look-' + scene.look);
      if (BAR_SCREENS.has(scene.id)) scene.el.classList.add('has-bar'); // Swifty speaks from the question bar
      // She comes on this screen: her corner is kept (also on screen 8, whose panel slides up over the picture).
      if (scene.v2 && scene.swifty) scene.el.classList.add('has-swifty');
      if (scene.sheet === 'panel') el('div', 'sheet-panel', scene.world); // one big panel filling the screen (Swifty's books come with her: see standFor)
      // The picture and its clips; where the camera pans past its edge, in one layer whose right edge feathers into the
      // backdrop, so that the picture never shows through a clip there (the user, 2026-10-21: words doubled).
      const pic = scene.backdrop ? el('div', 'scene-pic scene-bg--feather', scene.world) : scene.world;
      [scene.bg, scene.react].filter(Boolean).forEach((src, i) => { // the picture, and a reaction to fade in over it
        const img = el('img', 'scene-bg' + (i ? ' scene-react' : ''), pic);
        img.src = src;
        img.alt = '';
        img.draggable = false;
      });
      if (Clips.planned(scene)) { // its picture brought to life, over it (see Clips), once its clips are made
        scene.clipBox = el('div', 'scene-clips', pic);
        scene.patchBox = el('div', 'scene-patches', pic); // pieces of the picture over its clips (see pictureOver)
      }
      scene.ambient = el('div', 'scene-ambient', scene.world);
      scene.lamps.forEach(([x, y, r]) => FX.glow(scene.ambient, x, y, r, r * 0.8));
      if (!reducedMotion && scene.dust) FX.motes(scene.ambient, { area: scene.dust, count: 16 });
      scene.layer = el('div', 'scene-layer', scene.world);  // things placed on the picture (move with the camera)
      if (scene.v2) scene.el.classList.add('is-v2'); // the revamp's look (see SNAP)
      scene.el.keepClear = KEEP_CLEAR[scene.id] || null; // where a bubble on the picture must not go
      if (scene.snap) { // the story picture it came from, framed on the left, zoomed on what matters
        scene.el.classList.add('has-snap'); // (its content goes under it: css .has-snap)
        scene.snapEl = el('div', 'scene-snap', scene.el);
        Object.assign(el('img', '', scene.snapEl), { src: scene.snap, alt: '', draggable: false });
        focusOn(scene.snapEl, scene.snapFocus);
      }
      // (No title or question on top: the meeting of 2026-10-21 took out the text at the top left of every screen.)
      scene.ui = el('div', 'scene-ui', scene.el);           // on-screen things (the question card) that stay put
    });
  }

  // A snapshot (or a picture growing out of one) zoomed on `focus` ([x, y, zoom] in stage px of the picture).
  function focusOn(node, focus) {
    if (!focus) return;
    const [fx, fy, z] = focus;
    node.style.setProperty('--focus', `${(fx / STAGE_W) * 100}% ${(fy / STAGE_H) * 100}%`);
    node.style.setProperty('--zoom', String(z));
  }

  function buildPanel() {
    const list = $('#scene-list');
    SCENES.forEach((scene, i) => {
      const li = el('li', '', list);
      const item = el('button', 'scene-item', li);
      item.type = 'button';
      el('span', 'si-num', item).textContent = scene.num;
      const thumb = el('span', 'si-thumb', item);
      const picture = scene.react || scene.bg; // a screen's reaction picture shows best what it is about
      if (scene.sheet) thumb.classList.add('si-thumb--sheet'); // on the big panel: a little cream panel, with Swifty's stand
      if (BAR_SCREENS.has(scene.id)) thumb.classList.add('si-thumb--bar'); // the question bar along its bottom, not the stand
      if (picture || (scene.sheet && !BAR_SCREENS.has(scene.id))) Object.assign(el('img', '', thumb), { src: picture || STAND, alt: '' });
      else thumb.classList.add('si-thumb--' + scene.look); // a screen the game draws (the shops): a tiny copy, in CSS
      el('span', 'si-now', thumb).textContent = 'NOW';
      const text = el('span', 'si-text', item);
      el('strong', '', text).textContent = scene.title;
      FX.fracText(el('small', '', text), scene.sub);
      item.setAttribute('aria-label', `${i === 0 ? 'Start screen' : 'Scene ' + i}: ${scene.title}`);
      item.addEventListener('click', () => {
        Sound.click();
        go(i, { jump: true });
      });
      scene.item = item;
    });
  }

  function wireUI() {
    $('#btn-panel').innerHTML = icon('scenes');
    $('#btn-panel').setAttribute('aria-expanded', 'false');
    $('#btn-back .nav-icon').innerHTML = icon('back');

    const press = fn => () => {
      Sound.click();
      fn();
    };
    $('#btn-back').addEventListener('click', press(back));
    $('#btn-next').addEventListener('click', press(next));
    $('#btn-panel').addEventListener('click', press(UI.togglePanel));
    $('#btn-panel-close').addEventListener('click', () => UI.closePanel());
    $('#panel-scrim').addEventListener('click', () => UI.closePanel());

    const auto = $('#autoplay-toggle');
    auto.checked = Game.autoplay;
    auto.addEventListener('change', () => {
      Sound.click();
      setAutoplay(auto.checked);
    });

    $('#rotate-hint').addEventListener('click', e => e.currentTarget.classList.add('is-dismissed'));

    // Browsers only allow sound after a user gesture (a tap counts once the finger lifts); the voices' player
    // is unlocked then too.
    ['pointerdown', 'pointerup', 'keydown'].forEach(type => {
      window.addEventListener(type, Sound.unlock, true);
      window.addEventListener(type, Voice.unlock, true);
    });

    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const focus = document.activeElement;
      const control = focus && (focus.tagName === 'BUTTON' || focus.tagName === 'INPUT' || focus.getAttribute('role') === 'button');
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          back();
          break;
        case ' ':
        case 'Enter':
          if (control) return; // let the focused control handle it (e.g. an amount to drag, on screen 34)
          e.preventDefault();
          next();
          break;
        case 'p': case 'P': UI.togglePanel(); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'm': case 'M': toggleMusic(); break;
        case 's': case 'S': toggleSfx(); break;
        case 'Escape': UI.closePanel(); break;
        default: break;
      }
    });
  }

  // Scale the 1920x1080 stage to fit the window (letterboxed 16:9).
  function fit() {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    $('#stage').style.transform = `scale(${s})`;
  }

  // Slight camera drift that follows the mouse.
  function startParallax() {
    if (reducedMotion || !matchMedia('(pointer: fine)').matches) return;
    const p = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', e => {
      p.tx = (e.clientX / window.innerWidth - 0.5) * -18;
      p.ty = (e.clientY / window.innerHeight - 0.5) * -12;
    });
    let applied = null;
    const loop = () => {
      const scene = SCENES[Game.index];
      const moving = Math.abs(p.tx - p.x) > 0.01 || Math.abs(p.ty - p.y) > 0.01;
      const blurred = scene && scene.el.classList.contains('is-hushed'); // keep a blurred scene still
      if (scene && !blurred && !scene.still && (moving || applied !== scene)) {
        p.x += (p.tx - p.x) * 0.06;
        p.y += (p.ty - p.y) * 0.06;
        scene.parallax.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px)`;
        // a fade between two screens of the same view: the picture fading out moves with the new one,
        // so the two stay exactly on top of each other (nothing in them doubles)
        const leaving = Game.leaving;
        if (leaving && leaving !== scene && leaving.shot && leaving.shot === scene.shot) leaving.parallax.style.transform = scene.parallax.style.transform;
        applied = scene;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function preload(urls, onProgress) {
    let done = 0;
    return Promise.all(urls.map(src => new Promise(resolve => {
      const img = new Image();
      const finish = () => {
        done++;
        onProgress(done / urls.length);
        resolve();
      };
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(finish);
      img.onerror = () => {
        console.warn('Could not load', src);
        finish();
      };
      img.src = src;
    })));
  }

  async function boot() {
    fit();
    window.addEventListener('resize', fit);
    buildScenes();
    buildPanel();
    wireUI();
    startParallax();

    const fill = $('#loader-fill');
    const label = $('#loader-text');
    const images = SCENES.flatMap(s => [s.bg, s.react]).filter(Boolean).concat(
      ASSETS + 'ui/start-button.png', WALK_RIG.src, SWIFTY.fly.src, SWIFTY.stand.src, ART.money, ART.book,
      ASSETS + 'ui/sneakers.png', DOORWAY.src, STAND, ...Object.values(BEGIN_ART), ...SHOPPING_LIST.map(item => item.icon),
      ...Object.values(SHOP_ART), MONEY_NOTES, ...SHOPS.map(shop => shop.icon), ASSETS + 'boy stand and talk .png',
      ...Object.values(STREET_ART).flatMap(v => (typeof v === 'string' ? [v] : Object.values(v)))
    );
    const fonts = document.fonts
      ? Promise.race([Promise.all([ // the fonts, before the first words appear (no swapping in later)
        document.fonts.load('800 40px "Baloo 2"', 'Ab₹'),
        document.fonts.load('700 40px Kalam', 'Ab'),
        document.fonts.load('400 28px Kalam', 'Ab'),
      ]), sleep(2500)]).catch(() => {})
      : Promise.resolve();
    await Promise.all([
      preload(images, p => {
        fill.style.width = (p * 100).toFixed(0) + '%';
        label.textContent = `Loading… ${(p * 100).toFixed(0)}%`;
      }),
      fonts,
    ]);
    $('#loader').classList.add('is-done');
    go(0);
  }

  boot();
})();
