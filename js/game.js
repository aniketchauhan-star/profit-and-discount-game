/* ==========================================================================
   Bookstore Journey — scenes, story timeline and navigation
   ========================================================================== */
(function () {
  'use strict';

  const { el, CANCELLED } = FX;
  const STAGE_W = 1920;
  const STAGE_H = 1080;
  const ASSETS = 'assets/';
  const STORY = ASSETS + 'story/'; // the story's pictures
  const PARTY = ASSETS + 'party/'; // Party Prep's pictures, after screen 31 (the user's of 2026-10-23)
  const FILM = ASSETS + 'video/'; // the films' first frames: the pictures of the screens with a film (see Clips)
  // Its shops' pictures (the user's showrooms of 2026-10-26: two of a kind in each, their prices on their tags).
  const PARTY_SHOWROOMS = { shirt: 'shirt-showroom.webp', pants: 'bottomwear-showroom.webp', watch: 'watch-showroom.webp', sunglasses: 'sunglasses-showroom.webp' };
  const reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = sel => document.querySelector(sel);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Teaching pace for the whole story: 1 = brisk, 1.5 = calm (current). It stretches every pause,
  // letter-by-letter typing and panel/card reveal; walking, flying, pops and button feedback keep their
  // own speed, and so does changing screens (the auto-advance hold and the cross-fade, see FADE_MS).
  const PACE = 1.5;
  FX.setPace(PACE);

  // Swifty, the teal bird with a backpack: clean strips cut from "bird fly .png" and "bird talk .png"
  // the same way (each frame cut along its own outline, all frames lined up), 16px gap between frames.
  const SWIFTY = {
    fly: {
      src: ASSETS + 'sprites/swifty-fly.webp', frameW: 486, frameH: 374, gutter: 16,
      anchorX: 291, anchorY: 197,           // centre of her body
      bodyR: 116,                           // body radius, to match her size to the standing strip
      loop: [0, 1, 2, 3, 4, 5, 6, 7],
      flap: 3,                              // downstroke → wing-beat sound
    },
    stand: {
      src: ASSETS + 'sprites/swifty-talk.webp', frameW: 425, frameH: 408, gutter: 16,
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

  // The counter picture once more, with Aniket puzzled by the word "discount": it lines up exactly with
  // "story/aniket-gives-a-book-to-shopkeeper.webp" (only his face differs), so it can fade in over it.
  const PUZZLED = STORY + 'what-is-a-discount.webp';

  // Sheets: the teaching screens are on one big cream panel that fills the screen (`sheet: 'panel'`, drawn by the
  // game: see buildScenes), with no picture behind it. A sheet slides up over the story picture before it, and
  // back down after (see slide); between two sheets only what is on them changes. Swifty's stand, a stack of
  // books (STAND, cut out of an illustration), sits in the bottom-right corner; she stands on it (CORNER).
  const STAND = ASSETS + 'ui/book-stack.webp';

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
    partymoney: [[285, 67, 573, 370], [1270, 97, 1542, 370], [830, 370, 1179, 642]],     // his father, Aniket, the money
    partydeal: [[433, 218, 691, 491], [1236, 36, 1479, 309]],
  };

  // Aniket's questions, carried from the story to the top of the teaching screens that answer them (the revamp, Part 2:
  // screen 16, and 26–34, where 34 answers it).

  // Camera for screens with a card on the right (the question, the reduction): both characters
  // stay in view on the left. QUIZ_DRIFT is where its slow drift goes.
  const QUIZ_CAMERA = 'translateX(-282px) scale(1.04)';
  const QUIZ_DRIFT = 'translateX(-290px) scale(1.055)';

  const SCENES = [
    {
      id: 'title', title: 'Start', sub: 'Bookstore Journey',
      bg: STORY + 'start-screen.webp',
      kb: { origin: '60% 45%', from: 'scale(1.02)', to: 'scale(1.07) translate(-10px, -6px)' },
      lamps: [[826, 96, 300], [1442, 134, 320]],
      dust: [120, 140, 1000, 900],
      play: playTitle,
    },
    {
      id: 'home', title: 'Talking to Dad', sub: 'Dad, I want to buy a book and a new pair of sneakers…',
      bg: FILM + 'home.webp',
      kb: { origin: '50% 28%', from: 'scale(1.02)', to: 'scale(1.05) translate(-4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[288, 360, 320]],    // the daylight through the open door
      dust: [180, 120, 1100, 760], // specks floating in the sunlight
      play: playHome,
    },
    {
      id: 'outside', title: 'The Bookstore', sub: 'Aniket walks to the store',
      bg: FILM + 'outside.webp',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]], // the wall lamp; ceiling lights behind the glass
      dust: [420, 260, 1840, 820],
      exit: 'zoom', zoomOrigin: '52% 56%', // into the next screen (Aniket with the book): the camera pushes into the store while fading
      play: playOutside,
    },
    {
      id: 'browse', title: 'An Interesting Book', sub: 'This book looks interesting!',
      bg: FILM + 'browse.webp',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      shot: 'shelf',
      setup: standTitles,
      play: playBrowse,
    },
    {
      id: 'ask', title: 'How Much?', sub: 'How much is this book?',
      bg: FILM + 'ask.webp',
      kb: { origin: '50% 38%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' },
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      play: playAsk,
    },
    {
      id: 'shock', title: 'The Printed Price', sub: 'Oh! The price printed on it is ₹1000.',
      bg: STORY + 'shocked-aniket.webp', // (the user, 2026-10-27: his line on the close-up of the book, not on the counter's film)
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
      bg: STORY + 'shocked-aniket.webp',
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
      bg: STORY + 'shocked-aniket.webp',
      kb: null, origin: '55% 80%', still: true,
      lamps: [[1292, 128, 300]], dust: [150, 60, 1500, 760],
      shot: 'cover-tag',
      setup: setupMpCard,
      play: playMpCard,
    },
    {
      id: 'reveal', title: 'I Gave You a Discount', sub: 'Printed ₹1000, but selling it at ₹800',
      bg: FILM + 'reveal.webp',
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
      bg: FILM + 'discount.webp',
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
      bg: FILM + 'discount-end.webp', // (the last frame of 9's film: the change is seamless)
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
      bg: FILM + 'pay.webp',
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.075)' },
      lamps: [[1408, 86, 330]],
      dust: [300, 60, 1500, 700],
      play: playPay,
    },
    {
      id: 'exit', title: 'Coming Out of the Bookstore', sub: 'The doors swing open and Aniket comes out',
      bg: FILM + 'exit.webp', // the bookstore from the mall, as on screen 3
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]], // the wall lamp; ceiling lights behind the glass
      dust: [420, 260, 1840, 820],
      play: playExit,
    },
    {
      id: 'leave', title: 'To the Shoe Shop', sub: 'Let’s help Aniket buy the sneakers!',
      bg: FILM + 'exit-end.webp', // (14's film as it ends, blurred: Swifty speaks over it)
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]],
      dust: [420, 260, 1840, 820],
      setup: scene => allBlur(scene),
      play: playLeave,
    },
    {
      id: 'sneakers', title: 'The Shoe Shop', sub: 'Wow, nice sneakers! I love them.',
      bg: FILM + 'sneakers.webp', // Aniket at the stand, pointing at the sneakers (its film's first frame)
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the price tags
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], // shelf lights, a ceiling light
      dust: [600, 40, 1900, 720],
      shot: 'sneakers', // (one take on to 17 and 18: the camera carries on, no fade)
      play: playSneakers,
    },
    {
      id: 'shoe', title: 'Tagged Price', sub: 'Aniket points at the ₹1800 tag',
      bg: FILM + 'shoe.webp',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the price tags
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], // shelf lights, a ceiling light
      dust: [600, 40, 1900, 720],
      shot: 'sneakers',
      play: playShoe,
    },
    {
      id: 'confused', title: 'The Price Tag', sub: 'The price tagged on it is ₹1800.',
      bg: FILM + 'confused.webp',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // (as on 16 and 17: its film carries on from theirs)
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'sneakers',
      play: playConfused,
    },
    {
      id: 'smcard', title: 'The Sneakers’ Marked Price', sub: 'The marked price of the sneakers is —',
      // The user's doc (2026-10-23): a question card on the shoe shop, all blurred but the sneakers and their tags, the
      // card on the left; a wrong answer: "Check the price tagged on the sneakers.", and another try.
      bg: FILM + 'confused-end.webp', // the shoe shop as 18's film ends (the card on the left)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: scene => standFocus(scene, STAND_FOCUS_FILM),
      play: playSneakerCard,
    },
    {
      id: 'offmeans', title: 'What Does 30% OFF Mean?', sub: 'If this is a discount, how much do I actually have to pay?',
      // The user's doc (2026-10-23): Aniket sees the 30% OFF tag and wonders; Swifty: "30% OFF means 30% discount here."
      bg: FILM + 'offmeans.webp',
      react: STORY + 'he-thinks-about-the-shoes.webp', // (as its film goes: the close view the rest is worked out on)
      kb: null, origin: '63% 66%', still: true, // (screen 19's camera origin: it ends on the same view, so that change is seamless)
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      play: playOffMeans,
    },
    {
      id: 'recall', title: 'Recall Percentages', sub: 'Let’s first recall how percentages work.',
      swifty: true,
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shop as screen 19 ends: the camera on the sneakers, the rest blurred
      kb: null, origin: '63% 66%', still: true, // (screen 19's camera origin, so the same view: a seamless cut)
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      shot: 'stand',
      setup: setupRecall,
      play: playRecall,
    },
    {
      id: 'percentrule', title: 'Percentage Rule', sub: 'a is what percent of b?',
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: setupPracticeStart, // (from screen 20 it begins on 20's view, then blurs all and eases out: see zoomOutOfShoes)
      play: playPercentRule,
    },
    {
      id: 'whatpercent', title: 'What Percent?', sub: '125 is what percent of 500?',
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: allBlur, // (the whole picture blurred, the panel in the middle: the user, 2026-10-22)
      play: playWhatPercent,
    },
    {
      id: 'check', title: 'Quick CFU', sub: '250 is what percent of 1000?',
      swifty: true,
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: allBlur, // (the whole picture blurred, the panel in the middle, as 22 and 23: the user, 2026-10-23)
      play: playCheck,
    },
    {
      id: 'topay', title: 'How Much to Pay?', sub: 'How much does Aniket have to pay?',
      swifty: true,
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shoe shop, the question on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus, // (blurred but the sneakers and their tags, from the first frame)
      cornerClear: STAND_CLEAR, // (her bubbles keep clear of the sneakers and their tags)
      play: playToPay,
    },
    {
      id: 'thirty', title: 'The Discount: 30% of ₹1800', sub: '30/100 × 1800 = ₹540',
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus, // (blurred but the sneakers and their tags, from the first frame)
      play: playThirty,
    },
    {
      id: 'paywork', title: 'The Amount to Pay', sub: 'SP = MP − Discount = ₹1260',
      swifty: true,
      bg: STORY + 'he-thinks-about-the-shoes.webp', // the shoe shop, the working on a small panel on it (practiceHost)
      kb: null, origin: '50% 50%', still: true,
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], dust: null,
      setup: standFocus, // (blurred but the sneakers and their tags, from the first frame)
      cornerClear: STAND_CLEAR, // (her bubbles keep clear of the sneakers and their tags)
      play: playPayWork,
    },
    {
      id: 'final', title: 'Final Answer', sub: 'After a 30% discount, I will pay ₹1260.',
      bg: FILM + 'final.webp', // the same view as screens 23–34: Aniket pointing at the tags
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      play: playFinal,
    },
    {
      id: 'boxed', title: 'Here Are Your Sneakers', sub: 'The shopkeeper hands Aniket the sneakers in a box',
      bg: STORY + 'shopkeeper-gives-the-sneakers-box.webp',
      kb: { origin: '54% 56%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the box
      lamps: [[1760, 170, 240], [1760, 360, 240], [300, 85, 170]], // shelf lights, a ceiling light in the mall
      dust: [600, 40, 1900, 720],
      play: playBoxed,
    },
    {
      id: 'pctofmp', title: 'What Percent Is the Discount?', sub: '540 is what percent of 1800?',
      snap: STORY + 'he-thinks-about-the-shoes.webp', snapFocus: [1300, 640, 2], swifty: true,
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playPercentOfMP,
    },
    {
      id: 'return', title: 'Back Home', sub: 'How was your shopping?',
      bg: FILM + 'return.webp',
      kb: { origin: '50% 30%', from: 'scale(1.02)', to: 'scale(1.05) translate(4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[1030, 250, 300]],   // the daylight through the far window
      dust: [560, 80, 1300, 720],  // specks floating in the sunlight
      play: playReturn,
    },
    // Party Prep (the user's pictures of 2026-10-23, after screen 31): a message: Rohan's birthday party is tonight. His
    // father gives him ₹5,000 (their talk, in its films), and at the mall Aniket walks where the player steers
    // him, with four arrows, on its map seen from above: into a shop, and its own picture comes. In each he works out the
    // sale price of what he needs, and buys it. Then all set for the party.
    {
      id: 'invite', title: 'A Party Message', sub: 'Rohan’s birthday party is tonight!',
      bg: FILM + 'invite.webp',
      kb: { origin: '62% 40%', from: 'scale(1.02)', to: 'scale(1.05)' },
      lamps: [[220, 240, 260]], dust: [200, 80, 1400, 700],
      play: playInvite,
    },
    {
      id: 'partymoney', title: '₹5,000 for the Party', sub: 'Here’s ₹5,000.',
      bg: FILM + 'partymoney.webp',
      kb: { origin: '55% 40%', from: 'scale(1.02)', to: 'scale(1.05) translate(-4px, 3px)' },
      lamps: [[1856, 250, 300]], dust: [1100, 60, 1900, 640],
      play: playPartyMoney,
    },
    {
      id: 'partydeal', title: 'Find the Best Deals', sub: 'Then I’m definitely finding the best offers!',
      bg: FILM + 'partydeal.webp',
      kb: { origin: '52% 30%', from: 'scale(1.02)', to: 'scale(1.05) translate(4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[1520, 300, 300]], dust: [700, 80, 1500, 640],
      play: playPartyDeal,
    },
    {
      id: 'tomall', title: 'To the Mall', sub: 'Aniket walks into the mall',
      bg: PARTY + 'mall-entrance.webp',
      kb: { origin: '72% 52%', from: 'scale(1.02)', to: 'scale(1.1)' }, // in towards the doors
      lamps: [[1300, 560, 360]], dust: [700, 300, 1900, 900],
      play: playToMall,
    },
    {
      id: 'mallfloor', title: 'Inside the Mall', sub: 'Walk to a shop with the arrows',
      bg: PARTY + 'mall-map.webp', // (the user's new map, 2026-10-26)
      kb: null, origin: '50% 50%', still: true, lamps: [], dust: null,
      next: () => (partyDone() ? 'partydone' : PARTY_ITEMS.find(it => !Party.bought.has(it.id)).shop),
      setup: mallSetup,
      play: playMall,
    },
    ...[['shirtshop', 'The Shirts Shop', 'shirt'], ['pantsshop', 'The Bottomwear Shop', 'pants'],
      ['watchshop', 'The Watch Shop', 'watch'], ['sunshop', 'The Sunglasses Shop', 'sunglasses']]
      .map(([id, title, buys]) => ({
        id, title, sub: 'Pick the better deal, and buy it', buys,
        bg: PARTY + PARTY_SHOWROOMS[buys], // (the user's showrooms of 2026-10-26)
        kb: null, origin: '50% 50%', still: true, lamps: [], dust: null,
        next: () => (partyDone() ? 'partydone' : 'mallfloor'), // (back out into the mall, by its door)
        back: () => 'mallfloor',
        setup: shopSetup,
        play: playShop,
      })),
    {
      id: 'partydone', title: 'All Set for the Party!', sub: 'Total ₹4,470, ₹530 left',
      bg: PARTY + 'mall-map.webp',
      kb: null, origin: '50% 50%', still: true, lamps: [], dust: null,
      back: () => 'mallfloor',
      setup: scene => allBlur(scene),
      play: playPartyDone,
    },
  ];
  const LAST = SCENES.length - 1;
  SCENES.forEach((scene, i) => { scene.num = i ? String(i) : '★'; }); // each screen's number is its place
  // The revamp (docs/briefs/Bookstore Journey - Revamp Brief.docx) covers the story, every screen after the start: `v2` (css: .is-v2).
  // (The screens after 31 were taken out on 2026-10-23, at the user's word, to be made again: the talk about school, the
  // shopping challenge and its four streets, the receipt, back home, and the recap. They are in git's history.)
  SCENES.forEach((scene, i) => { if (i >= 1) scene.v2 = true; });

  // ======================================================================
  // Scene scripts. `ctx.wait()` throws CANCELLED as soon as the player
  // leaves the scene, so every script simply stops where it is.
  // ======================================================================

  const START_BUTTON = ASSETS + 'ui/start-button.webp'; // (a square cut of "source/start button.png", its disc the old button's size)

  async function playTitle(ctx, scene) {
    const L = scene.layer;
    FX.twinkles(L, [[380, 125], [760, 125], [570, 100], [870, 250], [230, 520], [420, 570], [900, 560]]); // round the title, off Aniket

    const wrap = el('div', 'start-wrap', L, { left: `${START_AT[0]}px`, top: `${START_AT[1]}px` });
    const btn = el('button', 'start-btn', wrap);
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Start the story');
    const img = el('img', '', btn);
    img.src = START_BUTTON;
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
    await pauseUnlessFilm(ctx, scene, 700);
    const plan = await picSay(ctx, scene, {
      anchor: [832, 300], corner: 'bl', tip: [742, 206], // on the wall right of his face, the tail at his mouth
      text: 'Dad, I want to buy\na book and a new\npair of sneakers\nfrom the mall.',
    }, 'plan', 'boy');
    await nextLine(ctx, scene, plan, 'advice');
    const advice = await picSay(ctx, scene, {
      anchor: [1262, 236], corner: 'br', tip: [1318, 332], // on the wall up-left of his head, the tail at his mouth
      text: 'Sure. But compare\nthe prices and\nbuy wisely.',
    }, 'advice', 'dad');
    await nextLine(ctx, scene, advice, 'promise');
    await picSay(ctx, scene, { anchor: [800, 172], corner: 'bl', tip: [742, 206], text: 'I will!' }, 'promise', 'boy'); // up-right of his face
    advanceAfterFilm(ctx, scene); // then off to the mall
  }

  // Aniket walks up to the bookstore and in (its film; the meeting of 2026-10-21: the door opens and he goes in, a real
  // walk), and the screen moves on as it ends. Without it (reduced motion), its picture, the shop's sign lit up.
  async function playOutside(ctx, scene) {
    if (scene.rolling) {
      await Clips.until(ctx, scene, Clips.of(scene).seconds - 0.4);
      ctx.advance(400);
      return;
    }
    await ctx.wait(900);
    FX.shine(scene.layer, SHOP_SIGN, { duration: 1400, width: 260 });
    Sound.sparkle();
    await ctx.wait(700);
    ctx.advance(1800);
  }

  // Coming out of the bookstore: its film (Aniket comes out of the doors and walks off along the mall), and the screen
  // moves on as it ends. Without it (reduced motion), its picture.
  async function playExit(ctx, scene) {
    if (scene.rolling) {
      await Clips.until(ctx, scene, Clips.of(scene).seconds - 0.25);
      ctx.advance(250);
      return;
    }
    await ctx.wait(600);
    ctx.advance(1600); // then on to the next shop
  }

  // On to the shoe shop: the last frame of the walk out of the bookstore, blurred (Swifty is what matters now). She
  // sums up the bookstore and says what comes next (the user's doc, 2026-10-23), in her bubble: she pops up in the
  // bottom-left corner, says it, and goes.
  async function playLeave(ctx, scene) {
    await ctx.wait(700);
    await swiftyCornerLines(ctx, scene, [
      ['book-done', [{ t: 'Aniket bought the book and understood the ' }, { t: 'discount', cls: 'key' }, { t: '.' }]],
      ['to-sneakers', [{ t: 'Let’s help Aniket buy the ' }, { t: 'sneakers', cls: 'stress' }, { t: '!' }]],
    ], { upTo: 1180 });
    ctx.advance(900); // then on to the shoe shop
  }

  // The names of the three books on the display stand by the counter (on the screen where Aniket holds the book), each
  // written on its cover as if printed there: centred in the cover's top part and slanted with it (the books lean back
  // on the stand). On the pictures' layer, so they move with the camera. x, y: the title's centre (stage px); slant: how
  // far the cover leans (deg); tone: light words (on the green and the night-blue covers) or dark ones (on the pale
  // sunset sky). (The screen's film starts on its picture and its camera stays put, so they stay on the covers.)
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

  async function playBrowse(ctx, scene) {
    FX.glow(scene.layer, 1030, 510, 420, 420, { cls: 'glow--book', delay: 0 });
    await pauseUnlessFilm(ctx, scene, 700);
    await picSay(ctx, scene, {
      anchor: [962, 296], corner: 'bl', tip: [905, 334], // right of his face, above the book; the tail at his mouth
      text: 'This book looks\ninteresting!', rotate: -1.5,
    }, 'browse', 'boy');
    advanceAfterFilm(ctx, scene); // "wait 3 seconds, then next screen"
  }

  async function playAsk(ctx, scene) {
    // First Aniket asks…
    await pauseUnlessFilm(ctx, scene, 700);
    const question = await picSay(ctx, scene, {
      anchor: [778, 318], corner: 'bl', tip: [738, 372], text: 'How much is\nthis book?', rotate: -1.5,
    }, 'ask', 'boy');

    // …his bubble goes away, then the shopkeeper answers (never both on screen at once).
    await nextLine(ctx, scene, question, 'price');
    const answer = await picSay(ctx, scene, {
      anchor: [1262, 318], corner: 'br', tip: [1300, 372], text: [{ t: 'It’s ' }, { t: '₹800', em: true }, { t: '!' }], rotate: 1.5,
    }, 'price', 'man');
    answer.emphasize();
    Sound.ding();

    // Then (the user's doc, 2026-10-23) Aniket finds it too much, and the shopkeeper sends him to the price on the book:
    // one bubble at a time, as before.
    await nextLine(ctx, scene, answer, 'costly');
    const costly = await picSay(ctx, scene, {
      anchor: [778, 318], corner: 'bl', tip: [738, 372],
      text: [{ t: 'It is too ' }, { t: 'costly', cls: 'stress' }, { t: ', uncle.' }], rotate: -1.5,
    }, 'costly', 'boy');
    await nextLine(ctx, scene, costly, 'check-price');
    const check = await picSay(ctx, scene, {
      anchor: [1262, 318], corner: 'br', tip: [1300, 372],
      text: [{ t: 'Check the ' }, { t: 'printed price', cls: 'stress' }, { t: ' on the book.' }], rotate: 1.5,
    }, 'check-price', 'man');
    check.emphasize();
    advanceAfterFilm(ctx, scene); // then he looks at the book's price
  }

  // A line said in the voice of `who`, for the screen whose script `ctx` runs; never once the player has left that screen
  // (a script carrying on after its line was cut short by Next or Back must not speak over the next screen).
  function sayHere(ctx, id, text, who, opts) {
    if (!ctx.alive()) return Promise.reject(CANCELLED);
    return Voice.say(id, text, who, opts);
  }

  // Typed while the voice says it. On a film, it starts as the speaker's lips are about to move (see lineDue): if the
  // line before kept it waiting, its recording starts that much into its quiet start, so the words still come with
  // the lips. And it is done as the words are (the typing ends with them), not after the quiet its recording ends
  // with: the next line, due on the film, may start then.
  async function sayTyped(ctx, line, id, words, who, typing) {
    const onFilm = await lineDue(ctx, id);
    const from = onFilm ? Math.min(VOICE_LEAD, filmLate(SCENES[Game.index], id)) : 0;
    const typed = line.type(ctx, from && typing.seconds ? Object.assign({}, typing, { seconds: typing.seconds - from }) : typing);
    const saying = sayHere(ctx, id, words, who, { from });
    if (onFilm) {
      saying.catch(() => {});
      await typed;
    } else await Promise.all([typed, saying]);
  }

  // One part of a bubble split into parts (see FX.bubble), typed while it is spoken (in step with its recording).
  async function speakPart(ctx, line, part, id, words, who, speaker) {
    if (speaker) speaker.talk();
    await sayTyped(ctx, line, id, words, who, { part, blips: !Voice.available, seconds: Voice.seconds(words) });
    if (speaker) speaker.idle();
  }

  // A speech bubble's line, typed out while the character's voice says it, in step with its recording (no
  // typing blips then). `speaker` (Swifty) moves her beak while she talks.
  async function speak(ctx, line, id, who, speaker) {
    if (speaker) speaker.talk();
    await sayTyped(ctx, line, id, line.words, who, { blips: !Voice.available, seconds: Voice.seconds(line.words) });
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
    '.fr-short', '.pf-question', '.pqp-question', '.pf-box', '.pf-sheet', '.qcard-back'].join(', ');
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
    const badge = FX.badge(L, PRICE_TAG);
    badge.pop(); // pop sound + a small ₹800 just above the money

    await ctx.wait(500);
    Sound.kaching();
    if (scene.rolling) { // (on the film the money changes hands: the ₹800 goes with it)
      ctx.wait(1100, { real: true }).then(() => badge.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }), () => {});
    }
    await pauseUnlessFilm(ctx, scene, 700);
    await picSay(ctx, scene, Object.assign({ text: 'Thank you, uncle!', rotate: -1.5 }, THANKS_AT), 'thanks', 'boy');
    advanceAfterFilm(ctx, scene); // then out of the bookstore
  }
  // His bubble: right of his face, between the two of them, its tail at his mouth (story/aniket-gives-money-to-shopkeeper.webp,
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

  // A wrong answer's hint, as her voice alone (the user, 2026-10-23: "remove this speech bubble and the book, no need
  // of this, only voice", wherever a hint came that way): its words are written on a strip on the card or panel (`host`),
  // an ✗ before them, and each word lights up as it is said. The strip opens in its place (the card or panel growing
  // smoothly to make room); a later hint changes its words. `parts`: its lines as she says them, each a list of segments
  // ({ t, em, cls }), in a span each (so a word said twice lights up in the right part). Returns { el, parts }.
  const CROSS_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const plainOf = segments => segments.map(seg => seg.t).join('').replace(/\s+/g, ' ').trim();
  function hintStrip(host, parts, { first = false } = {}) {
    let strip = host.querySelector(':scope > .hint-strip');
    const fresh = !strip;
    if (fresh) {
      strip = el('div', 'hint-strip');
      if (first) host.prepend(strip);
      else host.appendChild(strip);
    }
    strip.replaceChildren();
    el('span', 'hs-chip', strip).innerHTML = CROSS_SVG;
    const words = el('span', 'hs-text', strip);
    const spans = parts.map((segments, k) => {
      const span = el('span', 'hs-part', words);
      segments.forEach(seg => {
        const t = (k && !seg.t.startsWith(' ') && span.childNodes.length === 0 ? ' ' : '') + seg.t;
        if (seg.em || seg.cls) el('span', seg.em ? 'em' : seg.cls, span).textContent = t;
        else span.appendChild(document.createTextNode(t));
      });
      return span;
    });
    strip.setAttribute('role', 'status');
    Sound.pop();
    if (fresh && !reducedMotion) { // it opens: its room grows from nothing, then its words fade in
      const cs = getComputedStyle(strip);
      const to = { height: `${strip.offsetHeight}px`, marginTop: cs.marginTop, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
      strip.style.overflow = 'hidden';
      FX.settle(strip.animate([{ height: '0px', marginTop: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 }, Object.assign({ opacity: 1 }, to)],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' })).then(() => { strip.style.overflow = ''; });
    } else if (!reducedMotion) {
      replayPing(strip);
    }
    return { el: strip, parts: spans };
  }
  const replayPing = node => node.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)', offset: 0.4 }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
  // A hint's strip goes (the screen has moved on from it).
  const dropHints = host => host.querySelectorAll('.hint-strip').forEach(n => {
    FX.settle(n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' })).then(() => n.remove());
  });

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

  // He looks at the price printed on the book (the shopkeeper told him to): it says ₹1000! On the close-up of the book
  // (the user, 2026-10-27: this line here, not on the counter's film).
  async function playShock(ctx, scene) {
    await ctx.wait(150);
    Sound.shock();
    jolt(scene);
    FX.ring(scene.layer, STICKER.shock);
    await ctx.wait(650);
    const line = await picSay(ctx, scene, {
      anchor: [1030, 350], corner: 'bl', tip: [966, 300], // right of his head, the tail at his hair (his face is turned away)
      text: [{ t: 'Oh! The price printed on it is ' }, { t: '₹1000', em: true }, { t: '.' }], // (the user's doc, 2026-10-23)
      rotate: -1.5,
    }, 'shock', 'boy');
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
  // question and answers. A wrong answer brings a hint, written on the card under the answers and read by her voice (no
  // Swifty, no bubble: the user, 2026-10-23), and the player tries again; the right one turns the card over in the middle
  // of the screen, wide, the picture blurring behind it, and her voice reads why. 5 seconds later the story moves on.
  //  lines, options: the card's (see FX.question); title, why: its back; said: what her voice reads then (as recorded);
  //  hint: the hint's words (segments, as recorded); onHint(): what lights up meanwhile; id: names her lines.
  async function cardQuestion(ctx, scene, { id, lines, options, title = 'Correct!', why, said, hint, onHint = null, fromLeft = false }) {
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
      const strip = hintStrip(card.card, [hint]);
      await ctx.wait(reducedMotion ? 60 : 450);
      await readLit(ctx, `${id}-hint`, plainOf(hint), strip.parts);
      card.unlock(); // another try (the wrong answer stays crossed out)
    }
    async function right(button) {
      const [x, y] = stagePoint(button);
      FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
      dropHints(card.card); // (the hint goes before the card turns over)
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
      hint: [{ t: 'Not quite! Check the price printed on the book.' }],
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
      hint: [{ t: 'Not quite! ' }, { t: '₹800', em: true }, { t: ' is the shopkeeper’s ' }, { t: 'selling price', cls: 'tone-sp' }, { t: '.' }],
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
    const card = FX.reduction(scene.ui, REDUCTION_CARD);
    await pauseUnlessFilm(ctx, scene, 500);
    const fly = async (from, to, ms) => {
      await FX.flyAcross(scene.ui, from, to, { ms, lift: 70 });
      await ctx.wait(0); // (stops here if the player has left meanwhile)
    };
    let line = null;
    const part = async i => {
      const id = `reveal-${i + 1}`;
      if (line) await nextLine(ctx, scene, line, id, 0, 120);
      line = await picSay(ctx, scene, Object.assign({}, REVEAL_LINE, { text: REVEAL_PARTS[i] }), id, 'man');
      return line.el.querySelector('.em');
    };
    // What the card does with a line plays while the film goes on to the next one (without a film, before it).
    const meanwhile = async step => {
      const done = step();
      done.catch(() => {});
      if (!scene.rolling) {
        await done;
        await ctx.wait(400);
      }
      return { done }; // (not the promise itself: awaiting this must not wait for it)
    };
    // "See, the price printed on the book is ₹1000,": the ₹1000 flies out to the card, which swings in to catch it.
    const said1000 = await part(0);
    const first = await meanwhile(async () => {
      const flying = fly(said1000, card.prices.from, 1000);
      card.enter();
      await flying;
      await card.pasteFrom();
    });
    // "but I am selling it to you at ₹800.": the red arrow grows down, and the ₹800 flies into the bottom box.
    const said800 = await part(1);
    await first.done;
    const second = await meanwhile(async () => {
      const flying = fly(said800, card.prices.to, 900); // (at once: on the film its bubble may go before the arrow is done)
      await card.arrowDown();
      await flying;
      await card.pasteTo();
    });
    // "I gave you a discount.": the word comes beside the arrow (how much is the question on screen 10).
    await part(2);
    const cut = second.done.then(() => card.pasteCut());
    cut.catch(() => {});
    if (!scene.rolling) await cut; // (on the film the card finishes as it goes on: the next screen starts with it done)
    line.emphasize(); // "discount." pulses: the new word
    Sound.ding();
    advanceAfterFilm(ctx, scene, 3000, { segue: true }); // then Aniket wonders what it means (the film goes straight on)
  }

  // "Discount?" Coming from screen 14 the picture, the card and the bubble are first exactly as they
  // were; then the bubble and the card go, and the camera glides back to the middle. Aniket doesn't know
  // the shopkeeper's new word: on the film he asks what it is, his face puzzled; without it, his face turns puzzled
  // (PUZZLED fades in over the picture) and he wonders about it in a thought cloud.
  function setupDiscount(scene) {
    scene.carried = scene.cameFrom === 'reveal';
    if (!scene.carried) return;
    instantly(scene, () => scene.el.classList.add('is-feathered'));
    scene.oldCard = FX.reduction(scene.ui, REDUCTION_CARD);
    scene.oldCard.showNow();
    scene.oldLine = revealPart(scene, 2);
    scene.oldLine.showNow();
  }

  async function playDiscount(ctx, scene) {
    const backToMiddle = async () => { // the card and the bubble go, and the camera glides back to the middle
      const glide = glideCamera(ctx, scene, 1300);
      await ctx.wait(600); // about halfway: the soft right edge eases away as the picture slides over
      scene.el.classList.remove('is-feathered');
      await glide;
    };
    let wondering = null;
    if (scene.rolling) {
      // On the film he asks it straight away, as the shopkeeper's word sinks in (the camera gliding back to the middle
      // meanwhile); then the camera moves in on his puzzled face (only he matters here: the meeting of 2026-10-21).
      if (scene.carried) {
        scene.oldLine.hide();
        scene.oldCard.leave();
      }
      const asking = picSay(ctx, scene, DISCOUNT_SAYS, 'disc-2', 'boy');
      asking.catch(() => {});
      if (scene.carried) await backToMiddle();
      const said = await asking;
      said.emphasize();
      await ctx.wait(900);
      await said.hide();
      moveCamera(scene, faceCamera(scene, FACE_ZOOM).transform, 1400);
      Sound.wonder();
      await ctx.wait(1700);
    } else {
      if (scene.carried) {
        await ctx.wait(500);
        scene.oldLine.hide();
        scene.oldCard.leave();
        await ctx.wait(300);
        await backToMiddle();
      }
      await ctx.wait(500);

      // He doesn't know the word: his face turns puzzled, and he wonders about it. Only he matters here (the meeting of
      // 2026-10-21: the shopkeeper isn't needed): the camera moves in on his face, and his thought comes beside his head.
      const cam = faceCamera(scene, FACE_ZOOM);
      moveCamera(scene, cam.transform, reducedMotion ? 1 : 1400);
      scene.el.classList.add('is-reacting');
      Sound.wonder();
      await ctx.wait(1500);
      const tip = cam.at(DISCOUNT_THOUGHT.tip);
      wondering = FX.thought(scene.ui, Object.assign({}, DISCOUNT_THOUGHT, { tip, at: [tip[0] + 560, tip[1] - 50] }));
      await wondering.show();
      await speak(ctx, wondering, 'disc-2', 'boy');
      wondering.emphasize();
      await ctx.wait(1200);
    }

    // Then the answer, on this screen (the user's doc, 2026-10-23: "Swifty comes and says the definition of discount"): his
    // thought goes, the picture blurs and dims, and Swifty slides in from the right and says it in her bubble, as on
    // screen 6; then she goes, and the picture clears for the question.
    if (wondering) await wondering.hide();
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
  // On the film he says it (his bubble at the counter, right of his face, the tail at his mouth, as on screen 4).
  const DISCOUNT_SAYS = {
    anchor: [778, 318], corner: 'bl', tip: [738, 372], rotate: -1.5,
    text: [{ t: 'Discount?', cls: 'key' }, { t: '\nWhat is that?' }],
  };

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
  const PAY_FOCUS = [990, 500, 1.5]; // the notes handed over, both faces in view (story/aniket-gives-money-to-shopkeeper.webp)
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
    Object.assign(el('img', '', pay), { src: STORY + 'aniket-gives-money-to-shopkeeper.webp', alt: '', draggable: false });
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
  const RUNS = []; // (none now: the money left and the two amounts, the recap and the takeaway were taken out, 2026-10-23)
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

  // A first wrong answer, with a second try: "Not quite! Try again!" on a hint strip under the answers (`host`), her voice
  // alone (no bubble: the user, 2026-10-23); between the two, what to remember comes in under it (`show` brings it in and
  // returns it) and her voice reads it out.
  async function tryAgain(ctx, talk, id, show, lines, host) {
    await talk.clear();
    const strip = hintStrip(host, [[{ t: 'Not quite!' }], [{ t: 'Try again!' }]], { first: true });
    await ctx.wait(reducedMotion ? 60 : 450);
    await readLit(ctx, `${id}-1`, 'Not quite!', [strip.parts[0]]);
    const lit = show();
    await ctx.wait(450);
    for (const [k, line] of lines.entries()) await talk.voice(`${id}-r${k}`, line, [lit], 250);
    await readLit(ctx, `${id}-2`, 'Try again!', [strip.parts[1]]);
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
    const shine = async () => {
      await ctx.wait(700);
      FX.shine(L, SNEAKERS, { duration: 1100, width: 160 });
      Sound.sparkle();
    };
    if (scene.rolling) shine().catch(() => {}); // (on the film, as he says it)
    else {
      await shine();
      await ctx.wait(800);
    }
    // His line, right of his face, above the sneakers (the tail at his mouth), as on 35. (The user's doc, 2026-10-23.)
    await picSay(ctx, scene, {
      anchor: FINAL_LINE.anchor, corner: 'bl', tip: FINAL_LINE.tip, text: [{ t: 'Wow, nice sneakers! ' }, { t: 'I love them.' }], rotate: -1.5,
    }, 'sneakers', 'boy');
    advanceAfterFilm(ctx, scene, 3000, { segue: true }); // then a closer look: the film goes straight on
  }

  // Nothing to say here: Aniket looks at the sneakers' price, his hand going to his chin (the film goes on; the camera
  // eases in towards the tags). Without the film, a moment on the picture.
  async function playShoe(ctx, scene) {
    if (scene.rolling) return advanceAfterFilm(ctx, scene, 0, { segue: true });
    await ctx.wait(600);
    ctx.advance(2600);
  }

  // The red "30% OFF" label on the front of the sneakers' stand: a glowing frame hugging it (stage px). It sits
  // here on screens 22 and 35; on 25 the picture shows the stand a little closer (THINKING_OFF_TAG).
  const OFF_TAG = { x: 1253, y: 733, w: 322, h: 141, round: 24 };
  const THINKING_OFF_TAG = { x: 1284, y: 778, w: 336, h: 153, round: 26 };

  // Aniket, hand on his chin, looks at the sneakers' tags: he says what he sees, and asks how much he will actually
  // pay, one bubble at a time, right of his face, the tail at his mouth by his hand (as the film of screen 18 shows him;
  // on 16 he leans in closer: SHOE_SAYS_LEANING).
  const SHOE_SAY = { anchor: [700, 290], corner: 'bl', tip: [640, 306], voice: 'boy', rotate: -1.5 };
  // (The user's doc, 2026-10-23: "The price tagged on it will be ₹1800"; "What 30% off means here, if this is discount
  // how much I actually have to pay.")
  const SHOE_PRICE = Object.assign({ text: [{ t: 'The price tagged on it is ' }, { t: '₹1800', em: true }, { t: '.' }] }, SHOE_SAY);
  const SHOE_OFF = Object.assign({ text: [{ t: 'What does ' }, { t: '30% OFF', em: true }, { t: ' mean here?' }] }, SHOE_SAY);
  const SHOE_PAY = Object.assign({
    text: [{ t: 'If this is a ' }, { t: 'discount', cls: 'key' }, { t: ', how much do I actually have to pay?' }],
  }, SHOE_SAY);
  // The white ₹1800 card on the sneakers, as the sneakers' film shows the stand (stage px: 16–19); and his bubble as he
  // leans in to read it (16).
  const PRICE_CARD_FILM = { x: 1314, y: 603, w: 236, h: 130, round: 16 };
  const SHOE_SAYS_LEANING = { anchor: [744, 300], tip: [684, 348] };

  // Screen 16: he says the price he sees (the price card on the sneakers lights up); then the question on it (screen 17).
  async function playConfused(ctx, scene) {
    await pauseUnlessFilm(ctx, scene, 700);
    await lineDue(ctx, 'shoe-price', BUBBLE_EARLY);
    FX.ring(scene.layer, PRICE_CARD_FILM);
    Sound.sparkle();
    const price = await picSay(ctx, scene, Object.assign({}, SHOE_PRICE, SHOE_SAYS_LEANING), 'shoe-price', 'boy');
    price.emphasize();
    advanceAfterFilm(ctx, scene); // then the question card on it
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
      hint: [{ t: 'Not quite! Check the price tagged on the sneakers.' }],
      fromLeft: true,
      onHint: () => { // the price card on the sneakers lights up
        FX.ring(scene.ui, PRICE_CARD_FILM);
        Sound.sparkle();
      },
    });
  }

  // Screen 18: then he sees the 30% OFF tag, and wonders (the user's doc, 2026-10-23), one bubble at a time.
  async function playOffMeans(ctx, scene) {
    // His questions on his film (the stand a little further off, as on 16 and 35; its first frame is the picture).
    await pauseUnlessFilm(ctx, scene, 500);
    const lit = FX.ring(scene.layer, OFF_TAG); // the 30% OFF label lights up first
    Sound.sparkle();
    await pauseUnlessFilm(ctx, scene, 700);
    const off = await picSay(ctx, scene, SHOE_OFF, 'off-what', 'boy');
    off.emphasize();
    await nextLine(ctx, scene, off, 'shoe-ask');
    const ask = await picSay(ctx, scene, SHOE_PAY, 'shoe-ask', 'boy');
    ask.emphasize();
    await ctx.wait(1200);
    await ask.hide();
    // Then the picture the rest is worked out on (he thinks, his hand on his chin) takes the film's place: under a
    // moment's blur all over, since it draws the stand a little closer than the film does; the camera then moves in on
    // the sneakers, and only they come sharp again (the 30% OFF tag lit on it).
    const haze = allBlur(scene, { instant: reducedMotion });
    lit.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
    await ctx.wait(reducedMotion ? 60 : 800, { real: true });
    scene.el.classList.add('is-reacting');
    if (scene.rolling) Clips.hide(scene);
    lit.remove();
    FX.ring(scene.layer, Object.assign({ instant: true }, THINKING_OFF_TAG));
    await ctx.wait(reducedMotion ? 60 : 650, { real: true });

    // What 30% OFF means (the user, 2026-10-22: "show only the shoes and the discount, and Swifty comes and says it"; no
    // panel): the camera moves in on the sneakers and their tags, everything else blurs, and Swifty slides in from the
    // right and says "30% OFF means 30% Discount." in her bubble (the 30% OFF tag is still lit); then she goes with it.
    const cam = faceCamera(scene, SHOES_CAM);
    moveCamera(scene, cam.transform, reducedMotion ? 1 : 1500);
    await ctx.wait(1600);
    shoesFocus(scene, cam, { instant: false });
    haze.classList.remove('is-on'); // (the blur all over goes as the window round the sneakers comes)
    await ctx.wait(reducedMotion ? 60 : 800);
    haze.remove();
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

  const SNEAKER_CARD = { photo: ASSETS + 'ui/sneakers.webp', price: '₹1800', off: ['30%', 'OFF'], knot: [60, 49] };

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
  const STAND_FOCUS_FILM = { x: 990, y: 420, w: 650, h: 420, round: 70, soft: 22 }; // (the stand as the sneakers' film shows it)
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
      hint: () => tryAgain(ctx, talk, 'cfu-hint', () => rememberBox(scene, PERCENT_HINT.note), PERCENT_HINT.say, q.slot),
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
      // Wrong (again): "Not quite! 250 is the part, 1000 is the whole. 250 ÷ 1000 × 100 = 25%." on the hint strip, her voice
      // alone, in place of "Try again!" and what to remember (the part and the whole take their colours in the question as
      // she names them; then the right answer lights up).
      async wrong(answers) {
        await talk.clear();
        scene.ui.querySelectorAll('.remember').forEach(n => FX.settle(n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })).then(() => n.remove()));
        const strip = hintStrip(q.slot, [
          [{ t: 'Not quite!' }],
          [{ t: '250', cls: 'tone-part' }, { t: ' is the ' }, { t: 'part', cls: 'tone-part' }, { t: ',' }],
          [{ t: '1000', cls: 'tone-whole' }, { t: ' is the ' }, { t: 'whole', cls: 'tone-whole' }, { t: '.' }],
          CHECK_SUM,
        ], { first: true });
        const read = (k, line, ms, at) => {
          const saying = readLit(ctx, `cfu-wrong-${k + 1}`, line, [strip.parts[k]]);
          if (at) ctx.wait(ms).then(at, () => {});
          return saying;
        };
        await read(0, 'Not quite!');
        await read(1, '250 is the part,', 300, () => q.tag('part'));
        await read(2, '1000 is the whole.', 300, () => q.tag('whole'));
        await read(3, '250 ÷ 1000 × 100 = 25%.', 1900, () => answers.show(1));
      },
      // Both ways: "So, 250 is 25% of 1000." while the grid shows 25 of 100 (where the hint was, if there was one).
      async so(answers) {
        scene.ui.querySelectorAll('.remember').forEach(n => FX.settle(n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })).then(() => n.remove()));
        dropHints(q.slot);
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
  // The hint when an amount is dropped on the wrong box: what that box is for (the MP box, the Discount box), on a hint
  // strip under the working, her voice alone.
  const PAY_HINTS = [
    ['pay-wrong-mp', [{ t: 'Not quite! The ' }, { t: 'MP', cls: 'tone-mp' }, { t: ' box is for the ' }, { t: 'marked price', cls: 'tone-mp' },
      { t: ', ' }, { t: '₹1800', em: true }, { t: '.' }]],
    ['pay-wrong-d', [{ t: 'Not quite! The ' }, { t: 'Discount', cls: 'tone-d' }, { t: ' box is for the ' }, { t: 'discount', cls: 'tone-d' },
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
      // Wrong: "Not quite!" on a hint strip under the answers, her voice alone (then the right answer lights up)
      async wrong(answers) {
        await talk.clear();
        const strip = hintStrip(pq.slot, [[{ t: 'Not quite!' }]]);
        await ctx.wait(reducedMotion ? 60 : 450);
        await readLit(ctx, 'pay-wrong', 'Not quite!', strip.parts);
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
        if (hinting || !ctx.alive()) return; // the last hint is still being read
        const [id, text] = PAY_HINTS[m];
        hinting = (async () => {
          await talk.clear(); // (her "Your turn!" goes, and she with it: the hint is her voice alone)
          const strip = hintStrip(w.el, [text]);
          await readLit(ctx, id, plainOf(text), strip.parts);
        })()
          .catch(err => { if (err !== CANCELLED) console.error(err); })
          .finally(() => { hinting = null; });
      },
    });
    if (hinting) await hinting;
    dropHints(w.el);
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
    await lineDue(ctx, 'final-1'); // (on the film: as he starts saying it)
    await ctx.wait(500);
    FX.ring(scene.layer, OFF_TAG);
    Sound.sparkle();
    await ctx.wait(600);
    crossOut.draw();
    await discount;
    await pauseUnlessFilm(ctx, scene, 300);

    // "I will pay ₹1260." — the new price stamps onto the stand.
    const pay = speakPart(ctx, line, 1, 'final-2', line.parts[1], 'boy');
    pay.catch(() => {});
    await lineDue(ctx, 'final-2');
    await ctx.wait(700);
    await paid.stamp();
    const r = stageRect(paid.el);
    FX.burst(scene.ui, r.left + r.width / 2, r.top + r.height / 2, { count: 18, dist: [130, 250], size: [12, 24] });
    await pay;
    line.emphasize();
    Sound.chime();
    advanceAfterFilm(ctx, scene); // then the sneakers, in their box
  }

  // The sneakers, in their box: over the counter, the shopkeeper hands them to Aniket. No words: a light sweeps
  // across the box, with twinkles round it and a chime.
  const SNEAKER_BOX = [[905, 440], [1245, 452], [1292, 598], [1240, 700], [880, 775], [800, 700], [800, 600], [935, 520]]; // the box and its lid (stage px)
  async function playBoxed(ctx, scene) {
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

  // Back home: his father asks how the shopping went, and Aniket says what he learnt. One of them talks at a time.
  // (His father's "That’s useful, because you have another shopping job." was taken out on 2026-10-26, at the user's word.)
  async function playReturn(ctx, scene) {
    const DAD = { anchor: [1262, 252], corner: 'br', tip: [1330, 372] }; // on the wall up-left of his head, the tail at his mouth
    await pauseUnlessFilm(ctx, scene, 700);
    const ask = await picSay(ctx, scene, Object.assign({ text: 'How was your shopping?' }, DAD), 'home-ask', 'dad');
    await nextLine(ctx, scene, ask, 'home-learnt');
    await picSay(ctx, scene, {
      anchor: [722, 376], corner: 'bl', tip: [645, 282], // on the wall right of his face, the tail at his mouth
      text: 'Great! I learnt\nabout marked price,\ndiscount and discount\npercentage.',
    }, 'home-learnt', 'boy');
    advanceAfterFilm(ctx, scene); // then the party invite (Party Prep)
  }

  // ======================================================================
  // Party Prep (after screen 31: the user's pictures of 2026-10-23)
  // ======================================================================
  // What Aniket buys for the party. In each shop (the user's showrooms of 2026-10-26) two of a kind are on show, each
  // with its price and its discount printed on its tag (a percentage or an amount off): the better deal is the one that
  // costs less after its discount (the user, 2026-10-26: "Pick the better deal"). Each: its price, its discount (`pct`
  // or `flat`), where it is on the picture (picture px of 1672 × 941: the thing and its tag, what the player taps), and
  // its picture for the card and the shopping list. ₹4,470 in all, ₹530 left of ₹5,000.
  const PARTY_BUDGET = 5000;
  const PARTY_WALLET = ASSETS + 'ui/wallet.webp';
  const PARTY_JOY = { base: PARTY + 'joystick-base.webp', knob: PARTY + 'joystick-knob.webp' }; // (the user's controller, cut out of their picture)
  const PARTY_ITEMS = [
    { id: 'shirt', name: 'Shirt', icon: PARTY + 'icon-shirt.webp', shop: 'shirtshop', a: 'this shirt',
      ask: 'Which shirt is the better deal? Tap it!', deals: [
        { name: 'Blue shirt', mp: 1200, pct: 20, spot: [548, 182, 768, 545], pic: 'deal-shirt-blue.webp' },
        { name: 'Green shirt', mp: 1000, flat: 150, spot: [833, 182, 1053, 545], pic: 'deal-shirt-green.webp' },
      ] },
    { id: 'pants', name: 'Bottomwear', icon: PARTY + 'icon-pants.webp', shop: 'pantsshop', a: 'this bottomwear',
      ask: 'Which bottomwear is the better deal? Tap it!', deals: [
        { name: 'Jeans', mp: 1800, pct: 30, spot: [676, 160, 848, 562], pic: 'deal-pants-jeans.webp', plural: true },
        { name: 'Trousers', mp: 1600, flat: 300, spot: [930, 160, 1104, 562], pic: 'deal-pants-trousers.webp', plural: true },
      ] },
    { id: 'watch', name: 'Watch', icon: PARTY + 'icon-watch.webp', shop: 'watchshop', a: 'this watch',
      ask: 'Which watch is the better deal? Tap it!', deals: [
        { name: 'Silver watch', mp: 2000, pct: 20, spot: [556, 340, 700, 540], pic: 'deal-watch-silver.webp' },
        { name: 'Brown watch', mp: 1800, flat: 250, spot: [832, 340, 976, 540], pic: 'deal-watch-brown.webp' },
      ] },
    { id: 'sunglasses', name: 'Sunglasses', icon: PARTY + 'icon-sunglasses.webp', shop: 'sunshop', a: 'these sunglasses',
      ask: 'Which sunglasses are the better deal? Tap them!', deals: [
        { name: 'Black sunglasses', mp: 1200, pct: 20, spot: [628, 422, 808, 514], pic: 'deal-sun-black.webp', plural: true },
        { name: 'Brown sunglasses', mp: 900, pct: 10, spot: [866, 422, 1046, 514], pic: 'deal-sun-brown.webp', plural: true },
      ] },
  ];
  PARTY_ITEMS.forEach(it => it.deals.forEach(d => { d.pic = PARTY + d.pic; }));
  const inr = FX.inr;
  const dealOff = d => (d.pct ? (d.mp * d.pct) / 100 : d.flat);
  const dealPay = d => d.mp - dealOff(d);
  const bestDeal = it => it.deals.reduce((best, d) => (dealPay(d) < dealPay(best) ? d : best));
  const partyPay = it => dealPay(bestDeal(it));
  // What Aniket has bought (ids), and which shop he came out of (where he stands on the map then). Fresh at the message.
  const Party = { bought: new Set(), from: null };
  const partyMoney = () => PARTY_BUDGET - PARTY_ITEMS.filter(it => Party.bought.has(it.id)).reduce((sum, it) => sum + partyPay(it), 0);
  const partyDone = () => PARTY_ITEMS.every(it => Party.bought.has(it.id));
  const sceneIndex = id => SCENES.findIndex(s => s.id === id);
  // Picture px (the pictures are 1672 × 941) → stage px.
  const PK = STAGE_W / 1672;
  const pp = (x, y) => [Math.round(x * PK), Math.round(y * PK)];

  // The bar on top (the mall and its shops): the wallet and the shopping list (what was bought: its picture, ticked).
  function partyBar(scene) {
    scene.bar = FX.partyHud(scene.ui, {
      wallet: PARTY_WALLET, money: partyMoney(),
      items: PARTY_ITEMS.map(it => {
        const done = Party.bought.has(it.id);
        return { icon: done ? bestDeal(it).pic : it.icon, name: done ? bestDeal(it).name : it.name, done };
      }),
    });
  }

  // A line in a bubble on the picture, typed while it is said; resolves with the bubble, still up.
  async function picSay(ctx, scene, bubble, id, who) {
    const onFilm = await lineDue(ctx, id, BUBBLE_EARLY); // (on a film: just before the speaker's lips move)
    const line = FX.bubble(scene.layer, Object.assign({ voice: who }, bubble));
    const showing = line.show();
    if (!onFilm) await showing; // (on a film the voice starts with the lips, the bubble perhaps still popping up)
    await speak(ctx, line, id, who);
    return line;
  }

  // Swifty, as on the story's pictures: she pops up in a bottom corner (no books), her bubble beside her, and goes back
  // down when it goes (she is there only with a bubble). say() after say() changes the bubble; hide(). On the right
  // (`side: 'right'`; the user, 2026-10-26: "Swifty comes in on the right side") she slides in from its edge, her bubble
  // on her left. With `focus` (an FX.focusVeil) she and her words are in the spotlight while she talks (the user: "focus
  // on Swifty when she is talking"), beside what `lit()` gives (the spotlight's holes that stay: in a shop, the two things
  // on show and the card up; the user, 2026-10-27: "every time Swifty says, show the shirts and Swifty"); hide() takes it
  // away too, unless asked to keep it (for what comes next).
  function partyBird(ctx, scene, { at = null, side = 'left', upTo = 1000, downTo = 640, size = 40, focus = null, lit = () => [] } = {}) {
    const right = side === 'right';
    const spot = at || (right ? { x: 1740, y: 1066, s: 0.74 } : NOT_QUITE);
    const away = right ? 'translateX(380px)' : 'translateY(320px)'; // (where she comes from, and goes back to)
    let bird = null;
    let line = null;
    const head = spot.y - spot.s * 300; // (level with her beak)
    return {
      async say(id, text, ms = 0) {
        if (line) {
          await line.hide();
          line = null;
          await ctx.wait(120);
        }
        if (!bird) {
          bird = new FX.Bird(scene.ui, SWIFTY, { scale: spot.s });
          bird.place(spot.x, spot.y);
          if (!right) bird.root.classList.add('is-mirrored'); // (she points to her right, at her bubble)
          bird.point();
          Sound.chirp();
          await FX.settle(bird.body.animate([{ transform: away }, { transform: right ? 'translateX(-10px)' : 'translateY(-8px)', offset: 0.75 }, { transform: 'none' }],
            { duration: reducedMotion ? 1 : 600, easing: 'cubic-bezier(.2,.8,.3,1)' }));
        }
        line = FX.bubble(scene.ui, right
          ? { anchor: [spot.x - 176, head], corner: 'mr', tip: [spot.x - 120, head + 6], text, size, voice: 'bird', within: [downTo, spot.x - 176] }
          : { anchor: [spot.x + 176, head], corner: 'ml', tip: [spot.x + 120, head + 6], text, size, voice: 'bird', within: [spot.x + 176, upTo] });
        await line.show();
        if (focus) focus.on([...lit(), spotOf([bird.root, line.el])]);
        await Promise.all([speak(ctx, line, id, 'bird', bird), ctx.wait(ms)]);
        bird.point();
      },
      async hide({ keepFocus = false } = {}) {
        if (focus && !keepFocus) focus.off();
        if (line) {
          const old = line;
          line = null;
          await old.hide();
        }
        if (!bird) return;
        const b = bird;
        bird = null;
        await FX.settle(b.body.animate([{ transform: 'none' }, { transform: away }],
          { duration: reducedMotion ? 1 : 450, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
        b.root.remove();
      },
    };
  }

  // The spotlight's hole round some things (stage px): an oval round all of them, a little room to spare.
  function spotOf(nodes, room = 1.3) {
    const rs = nodes.filter(Boolean).map(stageRect);
    const left = Math.min(...rs.map(r => r.left));
    const top = Math.min(...rs.map(r => r.top));
    const right = Math.max(...rs.map(r => r.right));
    const bottom = Math.max(...rs.map(r => r.bottom));
    return { x: (left + right) / 2, y: (top + bottom) / 2, rx: ((right - left) / 2) * room, ry: ((bottom - top) / 2) * room };
  }

  // The party message (screen 32): Aniket, on the sofa, reads his phone: the invite comes up out of it.
  const PHONE_AT = [1000, 410]; // his phone (stage px)
  const SOFA_SAYS = { anchor: [1080, 236], corner: 'br', tip: [1180, 315], voice: 'boy' }; // left of his face, the tail at his mouth
  async function playInvite(ctx, scene) {
    Party.bought.clear(); // (the shopping starts afresh)
    Party.from = null;
    await ctx.wait(800);
    Sound.chime();
    const card = el('div', 'invite-card', scene.ui);
    card.innerHTML = '<div class="ic-top"><span>You’re invited!</span></div><div class="ic-title">Rohan’s<br>Birthday Party</div>' +
      '<div class="ic-row"><i class="ic-dot ic-dot--time"></i>Tonight, 8:00 PM</div><div class="ic-row"><i class="ic-dot ic-dot--place"></i>Rohan’s House</div>';
    const r = card.getBoundingClientRect(); // (from the phone)
    void r;
    card.style.transformOrigin = `${PHONE_AT[0] - 150}px ${PHONE_AT[1] - 200}px`;
    await FX.reveal(card, [{ opacity: 0, transform: 'scale(.1)' }, { opacity: 1, transform: 'scale(1.04)', offset: 0.7 }, { opacity: 1, transform: 'none' }],
      { duration: reducedMotion ? 1 : 700, easing: 'cubic-bezier(.2,.8,.3,1)' });
    await ctx.wait(500);
    if (Clips.of(scene) && scene.clipBox) Clips.roll(scene); // (his film: he reads it, and says so)
    const line = await picSay(ctx, scene, Object.assign({ text: [{ t: 'Wow! Rohan’s ' }, { t: 'birthday party', cls: 'key' }, { t: ' is tonight!' }] }, SOFA_SAYS), 'inv-1', 'boy');
    await nextLine(ctx, scene, line, 'inv-2');
    await picSay(ctx, scene, Object.assign({ text: 'I need a new outfit for the party!' }, SOFA_SAYS), 'inv-2', 'boy');
    advanceAfterFilm(ctx, scene);
  }

  // Screen 33: his father holds out the money (it shines, cha-ching), says how much, and his advice; on the film Aniket
  // takes the notes, holds them, and puts them in his pocket (the user, 2026-10-27).
  const NOTES_FAN = [[836, 436], [919, 396], [1010, 385], [1102, 402], [1148, 459], [1174, 540], [1102, 574], [988, 643], [947, 620], [873, 517]];
  const MONEY_SAYS = { anchor: [690, 236], corner: 'bl', tip: [650, 312] }; // up-right of his face, the tail at his mouth
  async function playPartyMoney(ctx, scene) {
    await pauseUnlessFilm(ctx, scene, 700);
    FX.glow(scene.layer, 1004, 512, 420, 300, { cls: 'glow--money', delay: 0 });
    FX.shine(scene.layer, NOTES_FAN, { duration: 1000, width: 140 });
    Sound.kaching();
    await pauseUnlessFilm(ctx, scene, 700);
    const line = await picSay(ctx, scene, Object.assign({ text: [{ t: 'Here’s ' }, { t: '₹5,000', em: true }, { t: '.' }] }, MONEY_SAYS), 'money', 'dad');
    line.emphasize();
    Sound.ding();
    await nextLine(ctx, scene, line, 'deal-use');
    await picSay(ctx, scene, Object.assign({ text: 'Use what you have learnt\nand find the best deals.' }, MONEY_SAYS), 'deal-use', 'dad');
    advanceAfterFilm(ctx, scene);
  }

  // Screen 34: whatever is left after buying everything is his, his father says; then Aniket's answer, one bubble at a time.
  async function playPartyDeal(ctx, scene) {
    const DAD = { anchor: [790, 330], corner: 'bl', tip: [742, 380] }; // up-right of his head, the tail at his mouth
    await pauseUnlessFilm(ctx, scene, 700);
    const left = await picSay(ctx, scene, Object.assign({ text: 'Whatever is left\nafter buying\neverything\nis yours.' }, DAD), 'deal-left', 'dad');
    await nextLine(ctx, scene, left, 'deal-really');
    const really = await picSay(ctx, scene, { anchor: [1176, 184], corner: 'br', tip: [1234, 282], text: 'Really?' }, 'deal-really', 'boy'); // up-left of his face
    await nextLine(ctx, scene, really, 'deal-offers');
    await picSay(ctx, scene, {
      anchor: [1160, 352], corner: 'br', tip: [1236, 282], // left of his face, the tail at his mouth
      text: 'Then I’m\ndefinitely finding\nthe best offers!',
    }, 'deal-offers', 'boy');
    advanceAfterFilm(ctx, scene);
  }

  // Screen 35: he walks up to the mall.
  async function playToMall(ctx, scene) {
    await ctx.wait(900);
    await picSay(ctx, scene, { anchor: [660, 210], corner: 'bc', tip: [660, 300], // above his head, left of the sign's letters
      text: [{ t: 'The mall! ' }, { t: 'Let’s go shopping!', cls: 'key' }] }, 'tm-1', 'boy');
    ctx.advance(3000);
  }

  // ---------- The mall (screen 36): walked with the arrows ----------
  // The map seen from above (picture px; the user's new map of 2026-10-26: the four shops round the top of a round plaza,
  // the escalators between them, a railing round the bottom). Where he can walk: the floor, an outline (round the
  // planters, short of the railing, and above the arrows, so he never goes under them). Each shop: its doorway's
  // threshold (left to right; the shop's floor is beyond it), how tall the doorway is (its glow), and the corner of its
  // sign (the ✓ once bought).
  const MALL = {
    floor: [[102, 520], [115, 515], [298, 414], [388, 414], [388, 360], [665, 296], [668, 306], [752, 306], [756, 292],
      [914, 292], [918, 306], [982, 306], [1000, 300], [1290, 368], [1292, 404], [1352, 404], [1352, 422], [1388, 420],
      [1560, 510], [1568, 518], [1568, 630], [1500, 668], [1400, 714], [1312, 744], [1312, 690], [1158, 690], [1156, 792],
      [1100, 808], [1000, 826], [900, 836], [836, 838], [750, 834], [700, 828], [600, 813], [518, 792], [514, 690],
      [336, 690], [336, 612], [102, 612]],
    start: [836, 610], // (in the middle of the plaza, above Swifty's bubble)
    shops: {
      sunglasses: { door: [[115, 515], [298, 414]], tall: 170, badge: [300, 176] },
      shirt: { door: [[388, 360], [665, 296]], tall: 160, badge: [660, 120] },
      pants: { door: [[1000, 300], [1290, 368]], tall: 165, badge: [1316, 135] },
      watch: { door: [[1388, 420], [1560, 510]], tall: 180, badge: [1636, 232] },
    },
  };
  const TOP_SHEET = {
    src: PARTY + 'aniket-topdown.webp', frameW: 190, frameH: 238, anchorX: 95, anchorY: 207,
    rows: { down: 0, up: 1, left: 2, right: 3 }, frames: { down: 10, up: 10, left: 7, right: 7 },
    stand: { down: [4, 0], up: [4, 1], right: [4, 2] },
  };
  // How he walks (the user, 2026-10-23: "the movement should be smooth and slow, it should look like a walk"): at an easy
  // pace, speeding up and slowing down gently (WALK_EASE: how quickly, a second), his steps in time with the ground he
  // covers: a cycle of them (10 frames up or down, 7 sideways) is about 120 px, two steps.
  const WALK_SPEED = 140; // stage px a second
  const WALK_EASE = 6;
  const WALK_PER = { up: 12, down: 12, left: 17, right: 17 }; // px a frame
  // On the floor (stage px): a line from the point to the right crosses the outline an odd number of times.
  const FLOOR = MALL.floor.map(p => pp(...p));
  const onFloor = ([x, y]) => FLOOR.reduce((inside, [x0, y0], i) => {
    const [x1, y1] = FLOOR[(i + 1) % FLOOR.length];
    return (y0 > y) !== (y1 > y) && x < x0 + ((y - y0) * (x1 - x0)) / (y1 - y0) ? !inside : inside;
  }, false);
  // Each shop's door (stage px): its threshold (from `a`, `len` long, along `along`), the way in (`inward`: square to the
  // threshold, into the shop), and where he stands when he comes out (`out`: in front of its middle). He is at the door
  // while his feet are within DOOR_NEAR of the threshold.
  const DOOR_NEAR = 46;
  const DOOR_OUT = 69;
  const DOORS = Object.fromEntries(Object.entries(MALL.shops).map(([id, shop]) => {
    const [a, b] = shop.door.map(p => pp(...p));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const along = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    const inward = [along[1], -along[0]];
    const out = [(a[0] + b[0]) / 2 - inward[0] * DOOR_OUT, (a[1] + b[1]) / 2 - inward[1] * DOOR_OUT];
    return [id, { a, len, along, inward, out, tall: shop.tall * PK }];
  }));
  const atDoor = (door, [x, y]) => {
    const dx = x - door.a[0];
    const dy = y - door.a[1];
    const u = dx * door.along[0] + dy * door.along[1]; // along the threshold
    return u >= 0 && u <= door.len && Math.abs(dx * door.inward[0] + dy * door.inward[1]) <= DOOR_NEAR;
  };

  // The map (from its first frame): the bar on top, a ✓ on every shop already done, and Aniket where he is: at the bottom
  // when he comes in, or outside the shop he has just come out of.
  function mallSetup(scene) {
    partyBar(scene);
    PARTY_ITEMS.forEach(it => {
      if (!Party.bought.has(it.id)) return;
      const [x, y] = pp(...MALL.shops[it.id].badge);
      FX.doneBadge(scene.layer, { x, y, instant: true });
    });
    const from = Party.from && DOORS[Party.from];
    const [x, y] = from ? from.out : pp(...MALL.start);
    scene.walker = new FX.TopWalker(scene.layer, TOP_SHEET, { scale: 0.78, per: WALK_PER });
    scene.walker.place(x, y);
    scene.walker.stand(from ? 'down' : 'up');
  }

  async function playMall(ctx, scene) {
    const walker = scene.walker;
    const pad = FX.joystick(scene.ui, PARTY_JOY); // (the user's controller, 2026-10-26; before it, four arrows)
    const steer = {}; // (this run's: a run cut short, as by opening this screen again, switches off only its own)
    Game.steering = steer; // (the arrow keys and W A S D walk him here: see wireUI)
    const glows = {}; // (each over its doorway: up from the threshold, slanting with it)
    Object.entries(DOORS).forEach(([id, door]) => {
      glows[id] = el('div', 'mall-door', scene.layer, {
        left: `${door.a[0]}px`, top: `${door.a[1] - door.tall}px`, width: `${door.len * door.along[0]}px`, height: `${door.tall}px`,
        transformOrigin: '0 100%', transform: `skewY(${Math.atan2(door.along[1], door.along[0])}rad)`,
      });
    });
    let swifty = null;
    const cleanup = () => { pad.destroy(); if (Game.steering === steer) Game.steering = false; };
    try {
      if (!Party.from) { // the first time in: how to walk (he can walk meanwhile; the list on top says what to buy)
        // Swifty comes in on the right, in the spotlight while she says it; then the spotlight goes round to the
        // controller, which glows, everything else dark and blurred, until it is used (the user, 2026-10-26)
        const veil = FX.focusVeil(scene.ui);
        swifty = partyBird(ctx, scene, { side: 'right', focus: veil, size: 38 });
        (async () => {
          await swifty.say('mall-how', [{ t: 'Use the ' }, { t: 'controller', cls: 'key' }, { t: ' to walk into a shop!' }], 400);
          await swifty.hide({ keepFocus: true });
          const r = stageRect(pad.el);
          pad.el.classList.add('is-glowing');
          await veil.on({ x: r.left + r.width / 2, y: r.top + r.height / 2, rx: r.width / 2 + 34 });
          await Promise.race([pad.pressed().then(() => ctx.wait(1200)), ctx.wait(5000)]);
          pad.el.classList.remove('is-glowing');
          await veil.off();
        })().catch(err => { if (err !== CANCELLED) console.error(err); });
      }
      let way = walker.way;
      let last = null;
      let toast = null;
      let vel = [0, 0]; // his velocity (stage px a second): it eases towards where the controller points
      const going = await new Promise((resolve, reject) => {
        const tick = now => {
          if (!ctx.alive()) return reject(CANCELLED);
          const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
          last = now;
          const v = pad.value();
          const pressed = v.x !== 0 || v.y !== 0;
          // he faces the way pushed at once: the controller's stronger way (near a diagonal, the way he was facing, if it
          // is one of the two)
          if (pressed) {
            const h = v.x > 0 ? 'right' : 'left';
            const u = v.y > 0 ? 'down' : 'up';
            const ax = Math.abs(v.x);
            const ay = Math.abs(v.y);
            if (ax > ay * 1.3) way = h;
            else if (ay > ax * 1.3) way = u;
            else way = way === h || way === u ? way : (ax >= ay ? h : u);
          }
          const k = 1 - Math.exp(-WALK_EASE * dt);
          vel = [vel[0] + (v.x * WALK_SPEED - vel[0]) * k, vel[1] + (v.y * WALK_SPEED - vel[1]) * k];
          const speed = Math.hypot(vel[0], vel[1]);
          if (speed > 8) {
            const p = [walker.x, walker.y];
            const dx = vel[0] * dt;
            const dy = vel[1] * dt;
            let q = [p[0] + dx, p[1] + dy];
            if (!onFloor(q)) { // (at the floor's edge, a shop's front, a planter or the railing: he slides along it, or stops)
              if (onFloor([p[0] + dx, p[1]])) q = [p[0] + dx, p[1]];
              else if (onFloor([p[0], p[1] + dy])) q = [p[0], p[1] + dy];
              else q = p;
              if (q[0] === p[0]) vel[0] = 0;
              if (q[1] === p[1]) vel[1] = 0;
            }
            const moved = Math.hypot(q[0] - p[0], q[1] - p[1]);
            walker.place(q[0], q[1]);
            if (moved > 0.01) walker.walk(way, moved);
            else walker.stand(way);
          } else {
            vel = [0, 0];
            walker.stand(way);
          }
          // at a shop's door: it glows; walking into it (towards the shop: up, or up and to its side), in he goes (or, if
          // done already, a note says so)
          let at = null;
          Object.entries(DOORS).forEach(([id, door]) => {
            const here = atDoor(door, [walker.x, walker.y]);
            glows[id].classList.toggle('is-on', here && !Party.bought.has(id));
            if (here) at = id;
          });
          if (at && v.x * DOORS[at].inward[0] + v.y * DOORS[at].inward[1] > 0.3) {
            if (!Party.bought.has(at)) return resolve(at);
            if (!toast) {
              const it = PARTY_ITEMS.find(x => x.id === at);
              toast = el('div', 'mall-toast', scene.ui);
              toast.textContent = `✓ You bought the ${it.name.toLowerCase()} already!`;
              setTimeout(() => { toast.remove(); toast = null; }, 1800);
            }
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      // in through the doors
      walker.stand('up');
      Sound.whoosh();
      cleanup();
      Party.from = going;
      go(sceneIndex(PARTY_ITEMS.find(it => it.id === going).shop));
    } catch (err) {
      cleanup();
      throw err;
    }
  }

  // ---------- A shop (screens 37–40) ----------
  // Two of a kind on show, each with its price and discount printed on its tag (the user's showrooms of 2026-10-26).
  // Both light up, each a button; Swifty asks which is the better deal. A wrong one: crossed out, and on a card her
  // voice works out both sale prices (each line lit as it is said); the right one: ticked, sparkles, and a card with the
  // two worked out side by side, the better one ticked, and Buy. Buy: PAID, the money comes out of the wallet, its
  // picture goes onto the shopping list (ticked), and back out into the mall (or, all bought, on to the end).
  function shopSetup(scene) {
    Party.from = scene.buys; // (back out into the mall, he stands at this shop's door)
    partyBar(scene);
    const it = PARTY_ITEMS.find(x => x.id === scene.buys);
    scene.spots = it.deals.map(d => {
      const b = el('button', 'deal-spot', scene.ui); // (placed when the camera is on the two: see playShop)
      b.type = 'button';
      b.setAttribute('aria-label', `${d.name}: ${inr(d.mp)}, ${d.pct ? `${d.pct}%` : inr(d.flat)} off`);
      el('span', 'ds-mark', b);
      b.style.opacity = '0';
      return b;
    });
  }

  // The camera on the two things (the user, 2026-10-26: "first we see the full room, then zoom, then show only these
  // two"): the picture eases in until both, with their tags, fill the room left of the cards (and above Swifty's bubble).
  // map() takes a point on the picture as it was (stage px) to where it is then.
  const SHOP_VIEW = [60, 110, 1250, 790]; // stage px
  function shopCamera(it) {
    const xs = it.deals.flatMap(d => [d.spot[0], d.spot[2]]).map(v => v * PK);
    const ys = it.deals.flatMap(d => [d.spot[1], d.spot[3]]).map(v => v * PK);
    const room = 36;
    const [x0, x1, y0, y1] = [Math.min(...xs) - room, Math.max(...xs) + room, Math.min(...ys) - room, Math.max(...ys) + room];
    const [vx0, vy0, vx1, vy1] = SHOP_VIEW;
    const s = Math.min(1.8, (vx1 - vx0) / (x1 - x0), (vy1 - vy0) / (y1 - y0)); // (no closer than 1.8: the picture stays sharp)
    const [ox, oy] = [STAGE_W / 2, STAGE_H / 2]; // (the camera turns round the middle: the shops' `origin`)
    // (the two in the middle of that room, as far as the picture still fills the screen: a shop whose two are tall,
    // seen less close, can't move as far left)
    const clamp = (v, edge) => Math.max(edge - edge * s, Math.min(edge * s - edge, v));
    const tx = clamp((vx0 + vx1) / 2 - ox - s * ((x0 + x1) / 2 - ox), ox);
    const ty = clamp((vy0 + vy1) / 2 - oy - s * ((y0 + y1) / 2 - oy), oy);
    return { transform: `translate(${tx}px, ${ty}px) scale(${s})`, map: ([x, y]) => [ox + tx + s * (x - ox), oy + ty + s * (y - oy)] };
  }

  // The spotlight's window round a card (a rectangle with round corners, a little room round it).
  function boxOf(node, room = 28, round = 40) {
    const r = stageRect(node);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rx: r.width / 2 + room, ry: r.height / 2 + room, round };
  }

  // "Blue shirt: ₹1,200 − ₹240 = ₹960." (a deal's sale price worked out, as said and as written on the hint card)
  const dealSum = d => `${d.name}: ${inr(d.mp)} − ${inr(dealOff(d))} = ${inr(dealPay(d))}.`;

  async function playShop(ctx, scene) {
    const k = PARTY_ITEMS.findIndex(x => x.id === scene.buys);
    const it = PARTY_ITEMS[k];
    const best = bestDeal(it);
    const bar = scene.bar;
    const spots = scene.spots;
    const veil = FX.focusVeil(scene.ui);
    // What the spotlight keeps lit: the two things on show, and beside them the card that is up (the user, 2026-10-27:
    // "when a panel comes, show the two things and the panel, the rest faded"); Swifty joins them while she talks.
    let shown = [];
    const show = (...holes) => veil.on(shown = holes);
    const swifty = partyBird(ctx, scene, { side: 'right', focus: veil, lit: () => shown });
    // a tap counts at once, even while she still asks (as the price card's buttons do)
    let tapped = null;
    let waiting = null;
    spots.forEach((b, i) => b.addEventListener('click', () => {
      if (b.disabled) return;
      if (waiting) {
        const w = waiting;
        waiting = null;
        w(i);
      } else if (tapped === null) {
        tapped = i;
      }
    }));
    const choose = () => new Promise(resolve => {
      if (tapped === null) waiting = resolve;
      else {
        resolve(tapped);
        tapped = null;
      }
    });
    await ctx.wait(1100); // (the whole room first)
    const cam = shopCamera(it);
    const zoom = scene.world.animate([{ transform: 'none' }, { transform: cam.transform }],
      { duration: reducedMotion ? 1 : 1500, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    scene.kbAnim = zoom; // (a camera move: stopped if the screen is left)
    await FX.settle(zoom);
    if (!ctx.alive()) return;
    scene.world.style.transform = cam.transform;
    zoom.cancel();
    scene.kbAnim = null;
    it.deals.forEach((d, i) => { // the rings, round the two where they are now
      const [x0, y0] = cam.map([d.spot[0] * PK, d.spot[1] * PK]);
      const [x1, y1] = cam.map([d.spot[2] * PK, d.spot[3] * PK]);
      Object.assign(spots[i].style, { left: `${x0}px`, top: `${y0}px`, width: `${x1 - x0}px`, height: `${y1 - y0}px` });
    });
    // only the two on show, in the spotlight: a bright window round them, the rest of the shop dark and blurred (the
    // user, 2026-10-26: "need to see only the front two shirts, not the others", in every shop)
    const sides = spots.map(b => ['left', 'top', 'width', 'height'].map(k => parseFloat(b.style[k])));
    const [L, T] = [Math.min(...sides.map(b => b[0])) - 50, Math.min(...sides.map(b => b[1])) - 50];
    const [R, B] = [Math.max(...sides.map(b => b[0] + b[2])) + 50, Math.max(...sides.map(b => b[1] + b[3])) + 50];
    const onShow = { x: (L + R) / 2, y: (T + B) / 2, rx: (R - L) / 2, ry: (B - T) / 2, round: 48 };
    show(onShow);
    await ctx.wait(300);
    Sound.sparkle();
    spots.forEach((b, i) => FX.reveal(b, [{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 1, transform: 'none' }],
      { duration: reducedMotion ? 1 : 600, delay: reducedMotion ? 0 : i * 160, easing: 'cubic-bezier(.2,.8,.3,1)' }));
    await ctx.wait(800);
    if (Party.bought.has(it.id)) { // (here again, from the scene list: it is bought already)
      spots.forEach((b, i) => { b.disabled = true; b.classList.add(it.deals[i] === best ? 'is-right' : 'is-done'); });
      await swifty.say(`${it.id}-had`, `You bought ${it.a} already!`);
      ctx.advance(3000);
      return;
    }
    await swifty.say(`${it.id}-which`, [{ t: it.ask.replace(/Tap (it|them)!$/, '') }, { t: it.ask.match(/Tap (it|them)!$/)[0], cls: 'key' }]); // (the space ends the first part: a coloured part keeps no space before it)
    await swifty.hide({ keepFocus: true });
    show(onShow); // (and the two, to pick)
    let hint = null;
    for (;;) {
      const i = await choose();
      if (!ctx.alive()) return;
      const r = stageRect(spots[i]);
      if (it.deals[i] === best) {
        spots[i].classList.add('is-right');
        spots.forEach(b => { b.disabled = true; });
        Sound.correct();
        FX.burst(scene.ui, r.left + r.width / 2, r.top + r.height / 2, { count: 20, dist: [110, 240], size: [14, 28] });
        break;
      }
      // the other one: crossed out; her voice works both out, on a card (her voice alone: she isn't there)
      spots[i].classList.add('is-wrong');
      spots[i].disabled = true;
      Sound.wrong();
      await ctx.wait(600);
      hint = el('div', 'deal-hint', scene.ui);
      const strip = hintStrip(hint, [[{ t: 'Not quite! Work out both sale prices.' }], ...it.deals.map(d => [{ t: `${d.name}: `, cls: 'hs-name' },
        { t: `${inr(d.mp)} − ${inr(dealOff(d))} = ` }, { t: inr(dealPay(d)), em: true }, { t: '.' }])]);
      FX.reveal(hint, [{ opacity: 0, transform: 'translateY(24px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: reducedMotion ? 1 : 420, easing: 'cubic-bezier(.2,.8,.3,1)' });
      await ctx.wait(reducedMotion ? 60 : 450);
      show(onShow, boxOf(hint)); // (what her voice reads, lit beside the two)
      await readLit(ctx, 'deal-hint', 'Not quite! Work out both sale prices.', [strip.parts[0]]);
      for (const [n, d] of it.deals.entries()) await readLit(ctx, `${it.id}-sum-${n}`, dealSum(d), [strip.parts[n + 1]]);
    }
    await ctx.wait(700);
    if (hint) {
      const old = hint;
      show(onShow);
      FX.settle(old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' })).then(() => old.remove());
    }
    // the two worked out side by side, the better one ticked; Buy
    const card = FX.dealCard(scene.ui, {
      cls: `dc--${it.id}`,
      deals: it.deals.map(d => ({ name: d.name, pic: d.pic, mp: d.mp, off: dealOff(d), pct: d.pct || null, pay: dealPay(d), best: d === best })),
    });
    await card.open();
    show(onShow, boxOf(card.el)); // (the card lit beside the two)
    const other = it.deals.find(d => d !== best);
    await swifty.say(`${it.id}-right`, [{ t: 'Correct!', cls: 'stress' }, { t: ` The ${best.name.toLowerCase()} ${best.plural ? 'cost' : 'costs'} ` },
      { t: inr(dealPay(other) - dealPay(best)), em: true }, { t: ' less.' }]);
    await swifty.hide({ keepFocus: true });
    show(onShow, boxOf(card.el)); // (the two and the card, till Buy is pressed)
    await card.choose();
    if (!ctx.alive()) return;
    // Buy: paid; the money comes out of the wallet, and the thing goes onto the list, ticked (the bar on top, over the
    // spotlight, stays bright).
    card.stamp('PAID');
    Sound.kaching();
    Party.bought.add(it.id);
    const counting = bar.count(partyMoney());
    await flyToList(ctx, scene, card.bestPic, bar.slots[k], best.pic);
    const slotPic = bar.slots[k].querySelector('img');
    if (slotPic) slotPic.src = best.pic; // (the list shows what was bought)
    bar.tick(k);
    await counting;
    await ctx.wait(400);
    await swifty.say(`${it.id}-done`, [{ t: 'Great!', cls: 'stress' }, { t: ` You bought the ${best.name.toLowerCase()}!` }]);
    ctx.advance(3000); // back out into the mall (or on to the end)
  }

  // A copy of its picture flies from the card onto its slot on the shopping list.
  async function flyToList(ctx, scene, from, slot, src) {
    if (!from || !slot) return;
    const a = stageRect(from);
    const b = stageRect(slot);
    const img = el('img', 'party-fly', scene.ui, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    Object.assign(img, { src, alt: '' });
    const k = Math.min(b.width / a.width, b.height / a.height);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    Sound.swish();
    await FX.settle(img.animate([
      { transform: 'none' },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 140}px) scale(${(1 + k) / 2 * 1.15})`, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(${k})` },
    ], { duration: reducedMotion ? 1 : 1000, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' }));
    img.remove();
    Sound.pop();
  }

  // ---------- The end (screen 41): all set for the party ----------
  async function playPartyDone(ctx, scene) {
    const total = PARTY_BUDGET - partyMoney();
    const bought = PARTY_ITEMS.filter(it => Party.bought.has(it.id));
    const items = (bought.length ? bought : PARTY_ITEMS).map(it => ({ name: bestDeal(it).name, icon: bestDeal(it).pic, mp: bestDeal(it).mp, pay: partyPay(it) }));
    const shown = bought.length ? total : PARTY_ITEMS.reduce((sum, it) => sum + partyPay(it), 0); // (from the scene list: the whole list)
    const table = FX.partyTable(scene.ui, { title: 'All Set for the Party!', items, total: shown, left: PARTY_BUDGET - shown });
    const swifty = partyBird(ctx, scene, { upTo: 1080 }); // (under the table, left of the middle)
    await ctx.wait(500);
    FX.confetti(scene.ui);
    Sound.chime();
    table.open();
    items.forEach((_, i) => ctx.wait(160 + i * 140).then(() => { Sound.pop(); table.row(i); }, () => {}));
    await ctx.wait(1300);
    Sound.ding();
    await table.showTotal();
    await readLit(ctx, 'as-total', `Total amount: ${inr(shown)}.`, [table.totalRow]);
    await table.showLeft();
    await readLit(ctx, 'as-left', `Money left: ${inr(PARTY_BUDGET - shown)}.`, [table.leftRow]);
    await swifty.say('as-wow', [{ t: 'Wow!', cls: 'stress' }, { t: ' You found the best deals for the party!' }]);
    await ctx.wait(1500);
    await swifty.hide();
    await FX.settle(table.el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(30px) scale(.95)' }], { duration: 400, fill: 'forwards' }));
    table.el.remove();
    const mission = FX.partyMission(scene.ui, {
      title: 'MISSION COMPLETE!', text: 'You have successfully helped Aniket get ready for the party!',
      items: PARTY_ITEMS.map(it => ({ name: bestDeal(it).name, icon: bestDeal(it).pic })),
    });
    FX.confetti(scene.ui);
    const tiles = mission.tiles(ctx); // (they come in with the card: it is never empty)
    tiles.catch(() => {});
    await mission.open(ctx);
    await tiles;
    await readLit(ctx, 'md-text', 'You have successfully helped Aniket get ready for the party!', [mission.text]);
    await swifty.say('md-wow', [{ t: 'Wow!', cls: 'stress' }, { t: ' You did it!' }]);
    ctx.advance(NEXT_IN);
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
  // The story's films (the user's Google Flow takes, 2026-10-27)
  // ======================================================================
  // A story screen with a film plays it once, over its picture, and stays on its last frame. tools/flow_import.py cuts
  // the films from the user's takes (the Gemini sparkle taken off, no sound) into assets/video/<screen>.mp4, with the
  // film's first frame as the screen's picture (assets/video/<screen>.webp), so it starts on exactly what the screen
  // shows; js/video_clips.js lists them. The game says the lines, in its own voices: each as its speaker's lips start
  // to move in the film, at the time js/video_clips.js gives (measured on the take's own voices), its bubble just before
  // (see lineDue). After every line the film itself keeps at least 2 s of quiet before the next one (the user,
  // 2026-10-27: the take's quiet moment slowed down by the tool, never frozen). Where a take goes on from one screen to
  // the next (the sneakers, 22 → 23 → 25; the counter, 14 → 15), the next screen's film starts on the last frame of this
  // one's, with no fade. With reduced motion, or a film not there, the screen shows its picture and its lines come one
  // after another, as before.
  const CLIP_DIR = ASSETS + 'video/';
  const VOICE_LEAD = 0.3;     // s: the quiet each line's recording starts with, so it starts this much before the lips
  const BUBBLE_EARLY = 0.45;  // s: a line's bubble comes this much before its voice
  const FILM_HOLD = 2000;     // ms: after a film screen's last line, the story moves on this soon (or as the film ends)
  // Screens whose script starts the film itself (Clips.roll), after what comes first (the invite out of the phone).
  const FILM_LATER = new Set(['invite']);

  const Clips = {
    // This screen's film (its length and its lines' times: js/video_clips.js), unless motion is turned down.
    of: scene => (!reducedMotion && scene && typeof VIDEO_CLIPS === 'object' &&
      Object.prototype.hasOwnProperty.call(VIDEO_CLIPS, scene.id) ? VIDEO_CLIPS[scene.id] : null),
    planned: scene => typeof VIDEO_CLIPS === 'object' && Object.prototype.hasOwnProperty.call(VIDEO_CLIPS, scene.id),

    // The film's <video>: made when first needed and loaded straight away (muted: the game says the lines; inline, for
    // tablets).
    video(scene) {
      if (!scene.film) {
        const v = el('video', 'scene-clip', scene.clipBox);
        v.muted = true;
        v.defaultMuted = true;
        v.playsInline = true;
        v.preload = 'auto';
        ['muted', 'playsinline', 'disablepictureinpicture'].forEach(a => v.setAttribute(a, ''));
        v.setAttribute('aria-hidden', 'true');
        v.src = CLIP_DIR + scene.id + '.mp4';
        scene.film = v;
      }
      return scene.film;
    },

    // A screen starts: its film plays (unless its script starts it: FILM_LATER), at once, or, on a screen fading in,
    // as its script starts (`later`; see run), so its lines come with it. The next screen's film starts loading, and
    // any loaded for a screen the player didn't go to is let go.
    start(scene, instant = false, later = false) {
      scene.rolling = null;
      scene.filmDue = false;
      if (Clips.of(scene) && scene.clipBox) {
        Clips.video(scene);
        if (!FILM_LATER.has(scene.id)) { // (those: their script starts it)
          if (later) scene.filmDue = true;
          else Clips.roll(scene, instant);
        }
      }
      const next = SCENES[SCENES.indexOf(scene) + 1];
      SCENES.forEach(s => {
        if (s !== scene && s !== next && s.film && !s.el.classList.contains('is-active')) Clips.stop(s);
      });
      if (next && next.clipBox && Clips.of(next)) Clips.video(next);
    },

    // The film plays from its start. It fades in over the picture as it starts moving (the picture is its first frame,
    // so all that changes is that it moves); carrying straight on from the screen before (`instant`), at once.
    roll(scene, instant = false) {
      const v = Clips.video(scene);
      scene.rolling = v;
      v.classList.remove('is-on');
      if (v.currentTime) v.currentTime = 0;
      const show = () => {
        if (scene.rolling !== v) return;
        if (instant) v.style.transition = 'none';
        v.classList.add('is-on');
        if (instant) requestAnimationFrame(() => { v.style.transition = ''; });
      };
      v.addEventListener('playing', show, { once: true });
      const playing = v.play();
      if (playing) playing.catch(() => { if (scene.rolling === v) scene.rolling = null; }); // (refused: the picture stays)
    },

    // Seconds of the screen's film still to play (0 without one).
    left(scene) {
      const v = scene.rolling;
      const film = Clips.of(scene);
      return v && film ? Math.max(0, (v.duration || film.seconds) - v.currentTime) : 0;
    },

    // Resolves once the screen's film is `t` seconds in (or has ended, or isn't playing); never while the player has
    // left the screen (it rejects then). A film that stops moving holds nothing up for long: after 1.5 s it is let be.
    until(ctx, scene, t) {
      return new Promise((resolve, reject) => {
        let last = -1;
        let since = performance.now();
        const tick = () => {
          if (!ctx.alive()) return reject(CANCELLED);
          const v = scene.rolling;
          if (!v || v.ended || (v.currentTime >= t && v.classList.contains('is-on'))) return resolve(); // (on screen, moving)
          if (v.currentTime !== last) {
            last = v.currentTime;
            since = performance.now();
          } else if (performance.now() - since > 1500) {
            scene.rolling = null; // (stalled: the lines go on without it)
            return resolve();
          }
          requestAnimationFrame(tick);
        };
        tick();
      });
    },

    // The film fades out, leaving the screen's pictures (for what the screen does next on a still).
    hide(scene) {
      const v = scene.rolling;
      scene.rolling = null;
      if (v) {
        v.classList.remove('is-on');
        v.pause();
      }
    },

    // The screen is left: its film stops and lets go of its file.
    stop(scene) {
      const v = scene.film;
      scene.film = null;
      scene.rolling = null;
      if (!v) return;
      v.pause();
      v.removeAttribute('src');
      v.load();
      v.remove();
    },
  };

  // Line `id` is due: on a screen whose film is playing, as its speaker's lips are about to move in it (its voice starts
  // VOICE_LEAD before them; `early`: that much sooner still); at once otherwise. Resolves true on a film.
  async function lineDue(ctx, id, early = 0) {
    const scene = SCENES[Game.index];
    const film = scene && scene.rolling && Clips.of(scene);
    const t = film && film.lines[id];
    if (t === undefined || !film) return false;
    await Clips.until(ctx, scene, t - VOICE_LEAD - early);
    return true;
  }

  // How far past the time its voice was due line `id` is on the screen's film (seconds; 0 if not).
  function filmLate(scene, id) {
    const film = scene && scene.rolling && Clips.of(scene);
    const t = film && film.lines[id];
    return t === undefined || !film ? 0 : Math.max(0, scene.rolling.currentTime - (t - VOICE_LEAD));
  }

  // A pause of the story's own, on a screen without a film playing: with one, its lines come when it says (lineDue).
  const pauseUnlessFilm = (ctx, scene, ms) => (scene.rolling ? Promise.resolve() : ctx.wait(ms));

  // After a line: its bubble goes before the next one comes: `ms` later (and a moment's gap: the user, 2026-10-27, "pause
  // after dialogue 2 second"), or, on a film, as the next line's bubble is due (the films keep that pause too: see
  // tools/flow_import.py; going as that one comes, so the next voice is never late for its lips).
  async function nextLine(ctx, scene, line, next, ms = 2000, gap = 250) {
    if (await lineDue(ctx, next, BUBBLE_EARLY)) {
      line.hide();
      return;
    }
    await ctx.wait(ms);
    await line.hide();
    await ctx.wait(gap);
  }

  // The end of a screen with a film: on with the story soon after its last line (FILM_HOLD), or as the film ends if that
  // is later; without one, `ms` after it. `segue`: as the film ends: the next screen's film carries straight on.
  function advanceAfterFilm(ctx, scene, ms = 3000, { segue = false } = {}) {
    if (!scene.rolling) return ctx.advance(ms);
    const left = Clips.left(scene) * 1000;
    ctx.advance(segue ? Math.max(0, left - 40) : Math.max(FILM_HOLD, left));
  }

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
    waiting: -1,   // the screen go() waits to show until its pictures are in (see Pictures)
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
    scene.el.classList.remove('is-leaving', 'is-entering', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting', 'has-sheet');
    scene.el.classList.add('is-active');
    if (mode === 'cut' && !reducedMotion && !scene.still) {
      void scene.el.offsetWidth; // restart the settle-in animation
      scene.el.classList.add('is-entering');
    }
    startCamera(scene, camera);
    if (camera) scene.parallax.style.transform = camera.parallax;
    if (scene.setup) scene.setup(scene);
    Clips.start(scene, mode === 'continue', mode === 'fade');
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
    if (scene.filmDue) { // (a screen that faded in: its film starts with its script)
      scene.filmDue = false;
      Clips.roll(scene);
    }
    Promise.resolve()
      .then(() => scene.play(ctx, scene))
      .catch(err => { if (err !== CANCELLED) console.error(err); });
  }

  // A screen whose pictures aren't in yet: they come first (the loading bar shows, counting them, if they take a while);
  // then the screen. Another go() meanwhile takes over (Game.waiting): this wait then leaves the bar alone.
  function goWhenLoaded(i) {
    const scene = SCENES[i];
    Game.waiting = i;
    const srcs = Pictures.of(scene);
    let done = 0;
    const bar = () => {
      const p = done / srcs.length;
      $('#loader-fill').style.width = (p * 100).toFixed(0) + '%';
      $('#loader-text').textContent = `Loading… ${(p * 100).toFixed(0)}%`;
    };
    const slow = setTimeout(() => {
      if (Game.waiting !== i) return;
      bar();
      $('#loader').classList.remove('is-done');
    }, 400);
    srcs.forEach(src => Pictures.load(src).then(() => {
      done++;
      if (Game.waiting === i) bar();
    }));
    Pictures.get(scene, true).then(() => {
      clearTimeout(slow);
      if (Game.waiting === i) go(i);
    });
  }

  // Cross-fade only between these neighbouring screens (at home → at the mall, Bookstore → sees the
  // book → holds it → How Much?, question → closer look at his new book, into the shoe shop, and his final answer →
  // the sneakers in their box), both ways; going forward, out of the bookstore into its last frame blurred (the
  // sneakers' three screens are one take, carried straight on); and, going forward only, between screens
  // over the same blurred picture: the price panels (Marked Price → its definition → MP vs SP, so only their
  // right side changes), MP vs SP → the counter, the Discount definition → formula → formula reveal → summary,
  // what the 30% OFF tag means → the sneakers card → the percentage rule → its example → a quick check → Checkpoint 2 → the sneakers' question → 30% of ₹1800
  // worked out → what ₹540 is → the amount to pay → the final answer; and 540 as a percent of 1800 → the discount
  // percentage → the summary.
  // Every other change is a straight cut.
  const PARTY_IDS = ['return', 'invite', 'partymoney', 'partydeal', 'tomall', 'mallfloor'];
  const SHOP_IDS = ['shirtshop', 'pantsshop', 'watchshop', 'sunshop'];
  const FADES = [...PARTY_IDS.slice(1).map((id, i) => [PARTY_IDS[i], id]), ...SHOP_IDS.flatMap(id => [['mallfloor', id], [id, 'partydone']]),
    ['mallfloor', 'partydone'], ['home', 'outside'], ['mpcard', 'reveal'], ['pay', 'exit'], ['outside', 'browse'], ['browse', 'ask'], ['leave', 'sneakers'], ['final', 'boxed']];
  const FORWARD_FADES = [['exit', 'leave'], // (out of the bookstore: its film's last frame, blurred, under Swifty)
    ['mp', 'mpcard'], ['formula', 'formula-reveal'], ['confused', 'smcard'], ['smcard', 'offmeans'], ['percentrule', 'whatpercent'],
    ['whatpercent', 'check'], ['check', 'topay'], ['topay', 'thirty'], ['thirty', 'paywork'], ['paywork', 'final']];
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

  function go(i) {
    if (i < 0 || i > LAST) return;
    if (!SCENES[i].picturesIn) return goWhenLoaded(i);
    Game.waiting = -1;
    $('#loader').classList.add('is-done'); // (if a wait for its pictures brought the loading bar up)
    Pictures.ahead(i);
    stopScene();
    clearTimeout(Game.startTimer);
    UI.closePanel(true);
    settleTransition();
    const from = SCENES[Game.index];
    const to = SCENES[i];
    const forward = i === Game.index + 1;
    const changing = from && from !== to;
    // Into a sheet (see SHEETS) from a screen next to it, the sheet slides up over the picture; out of it, it
    // slides back down (jumps further away are cuts).
    const onSheet = s => !!s.sheet || s.el.classList.contains('has-sheet');
    const sheet = changing && !reducedMotion && Math.abs(i - Game.index) === 1 && onSheet(from) !== onSheet(to);
    const fade = changing && !sheet && fadesBetween(from, to);
    // Same camera shot (4 ↔ 5, 7 → 8; a film going on from one screen to the next): carry the camera over so nothing
    // jumps (and the film carries straight on).
    const sameFraming = from && to && from.kb && to.kb && ['origin', 'from', 'to'].every(k => from.kb[k] === to.kb[k]);
    const carry = changing && from.shot && from.shot === to.shot && (forward || sameFraming);
    const camera = carry ? cameraOf(from) : null;
    to.cameFrom = from ? from.id : null; // lets a screen carry on from the one before it
    if (from && !fade && !sheet) deactivate(from);
    Game.index = i;
    UI.update();

    if (sheet) {
      const framed = x => !!x.snapEl;
      if (to.snapEl && !onSheet(from)) shrinkInto(from, to); // the revamp: the picture shrinks into the frame
      else if (framed(from) && !onSheet(to)) growOut(from, to); // …and grows back out of it
      else slide(from, to);
      return;
    }
    if (!fade) {
      activate(to, carry ? 'continue' : 'cut', camera);
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

  // Next and Back go to the screen after or before (Next on the last screen starts the story again), unless the screen
  // says where (`next`, `back`: a screen's id): the mall and its shops aren't in a line (a shop goes back out into the mall).
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
      $('#scene-list').querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        delete img.dataset.src;
      });
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

  // The pictures load as the player gets to them (the user's "smooth game and fast reload", 2026-10-27). The start screen
  // shows as soon as its picture, the Start button and the fonts are in (the loading bar counts only those). From then
  // on each screen loads the next three's pictures, the next one decoded too so it shows at once; the pictures most
  // screens use (Swifty, Aniket, her books…) come with the first of them, Party Prep's with the way to the mall. A
  // screen whose pictures aren't in yet (one jumped to from the scene list) waits for them: no screen shows without its
  // picture (see go). A screen's picture elements get their src once its pictures are in (data-src until then).
  const Pictures = {
    loads: new Map(), // src → { loaded, decoded } (promises)
    load(src, decode = false) {
      let p = this.loads.get(src);
      if (!p) {
        const img = new Image();
        p = {
          loaded: new Promise(resolve => {
            img.onload = () => resolve(img);
            img.onerror = () => {
              console.warn('Could not load', src);
              resolve(null);
            };
            img.src = src;
          }),
        };
        this.loads.set(src, p);
      }
      if (decode && !p.decoded) p.decoded = p.loaded.then(img => (img && img.decode ? img.decode().catch(() => {}) : null));
      return decode ? p.decoded : p.loaded;
    },
    own: scene => [scene.bg, scene.react, scene.snap].filter(Boolean),
    shared: () => [SWIFTY.fly.src, SWIFTY.stand.src, STAND, SNEAKER_CARD.photo],
    party: () => [TOP_SHEET.src, PARTY_WALLET, PARTY_JOY.base, PARTY_JOY.knob, ...PARTY_ITEMS.flatMap(it => [it.icon, ...it.deals.map(d => d.pic)])],
    // What a screen needs: its own pictures; after the start screen, the shared ones; from the way to the mall, Party Prep's.
    of(scene) {
      const i = SCENES.indexOf(scene);
      return [...this.own(scene), ...(i >= 1 ? this.shared() : []), ...(i >= SCENES.findIndex(s => s.id === 'tomall') ? this.party() : [])];
    },
    // A screen's pictures loaded (its own decoded too, with `decode`), then given to its elements (scene.picturesIn).
    get(scene, decode = false) {
      const own = this.own(scene);
      const all = Promise.all(this.of(scene).map(src => this.load(src, decode && own.includes(src))));
      if (!scene.pictures) {
        scene.pictures = all.then(() => {
          scene.el.querySelectorAll('img[data-src]').forEach(img => {
            img.src = img.dataset.src;
            delete img.dataset.src;
          });
          if (scene.backdropEl) scene.backdropEl.style.backgroundImage = `url("${scene.bg}")`;
          scene.picturesIn = true;
        });
      }
      return all.then(() => scene.pictures);
    },
    // On screen i: the next three screens' pictures (the next one's decoded).
    ahead(i) {
      for (let k = 1; k <= 3 && i + k <= LAST; k++) this.get(SCENES[i + k], k === 1);
    },
  };

  function buildScenes() {
    const host = $('#scenes');
    SCENES.forEach(scene => {
      scene.el = el('section', 'scene', host);
      scene.el.dataset.scene = scene.id;
      scene.el.setAttribute('aria-label', scene.title);
      if (scene.zoomOrigin) scene.el.style.setProperty('--zoom-origin', scene.zoomOrigin);
      if (scene.backdrop) scene.backdropEl = el('div', 'scene-backdrop', scene.el); // (its picture: see Pictures)
      scene.parallax = el('div', 'scene-parallax', scene.el);
      scene.world = el('div', 'scene-world', scene.parallax);
      scene.world.style.setProperty('--kb-origin', scene.kb ? scene.kb.origin : scene.origin);
      if (scene.sheet) scene.el.classList.add('is-sheet');
      // She comes on this screen: her corner is kept (also on screen 8, whose panel slides up over the picture).
      if (scene.v2 && scene.swifty) scene.el.classList.add('has-swifty');
      if (scene.sheet === 'panel') el('div', 'sheet-panel', scene.world); // one big panel filling the screen (Swifty's books come with her: see standFor)
      // The picture and its film; where the camera pans past its edge, in one layer whose right edge feathers into the
      // backdrop, so that the picture never shows through the film there (the user, 2026-10-21: words doubled).
      const pic = scene.backdrop ? el('div', 'scene-pic scene-bg--feather', scene.world) : scene.world;
      [scene.bg, scene.react].filter(Boolean).forEach((src, i) => { // the picture, and a reaction to fade in over it
        const img = el('img', 'scene-bg' + (i ? ' scene-react' : ''), pic);
        img.dataset.src = src; // (its src once the screen's pictures are in: see Pictures)
        img.alt = '';
        img.draggable = false;
      });
      if (Clips.planned(scene)) { // its picture brought to life, over it (see Clips), once its clips are made
        scene.clipBox = el('div', 'scene-clips', pic);
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
        Object.assign(el('img', '', scene.snapEl), { alt: '', draggable: false }).dataset.src = scene.snap;
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
      if (picture || scene.sheet) Object.assign(el('img', '', thumb), { alt: '' }).dataset.src = picture || STAND; // (loaded when the list opens)
      el('span', 'si-now', thumb).textContent = 'NOW';
      const text = el('span', 'si-text', item);
      el('strong', '', text).textContent = scene.title;
      FX.fracText(el('small', '', text), scene.sub);
      item.setAttribute('aria-label', `${i === 0 ? 'Start screen' : 'Scene ' + i}: ${scene.title}`);
      item.addEventListener('click', () => {
        Sound.click();
        go(i);
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
      if (Game.steering && /^(Arrow(Up|Down|Left|Right)|[wasdWASD])$/.test(e.key)) return; // (they walk Aniket: the mall's arrows)
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

  async function boot() {
    fit();
    window.addEventListener('resize', fit);
    buildScenes();
    buildPanel();
    wireUI();
    startParallax();

    const fill = $('#loader-fill');
    const label = $('#loader-text');
    const images = [...Pictures.own(SCENES[0]), START_BUTTON]; // (the start screen's: the rest load as the player plays)
    const fonts = document.fonts
      ? Promise.race([Promise.all([ // the fonts, before the first words appear (no swapping in later)
        document.fonts.load('800 40px "Baloo 2"', 'Ab₹'),
        document.fonts.load('700 40px Kalam', 'Ab'),
        document.fonts.load('400 28px Kalam', 'Ab'),
      ]), sleep(2500)]).catch(() => {})
      : Promise.resolve();
    let done = 0;
    await Promise.all([
      ...images.map(src => Pictures.load(src, true).then(() => {
        done++;
        fill.style.width = ((done / images.length) * 100).toFixed(0) + '%';
        label.textContent = `Loading… ${((done / images.length) * 100).toFixed(0)}%`;
      })),
      fonts,
    ]);
    await Pictures.get(SCENES[0], true);
    $('#loader').classList.add('is-done');
    go(0);
  }

  boot();
})();
