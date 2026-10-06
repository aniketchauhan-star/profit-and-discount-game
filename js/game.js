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
  // auto-advance hold, letter-by-letter typing, cross-fade and panel/card reveal; walking, flying,
  // pops and button feedback keep their own speed.
  const PACE = 1.5;
  FX.setPace(PACE);

  // Clean strip cut from "aniket walking sprite sheet.png": every frame cut along its own outline
  // and aligned on the head/torso and the floor line, with a 16px gap between frames.
  const WALK_SHEET = {
    src: ASSETS + 'sprites/aniket-walk-clean.png',
    frameW: 358, frameH: 614, gutter: 16, anchorX: 166, baselineY: 612,
    loop: [3, 4, 5, 6, 7, 0, 1],           // sheet frames in an even contact → passing rhythm
    stride: [96, 97, 77, 111, 26, 53, 87], // body travel (sprite px) from each loop frame to the next
    contact: [3, 5, 7],                    // a foot lands → footstep sound
    idle: 0,                               // both feet flat on the floor: the pose he stops on
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

  // Shapes on the artwork (stage px).
  const TITLE_PLATE = [[150, 340], [860, 340], [884, 420], [862, 520], [800, 668], [200, 668], [128, 600], [108, 430]];
  const SHOP_SIGN = [[380, 148], [1885, 18], [1885, 172], [380, 292]];
  const MONEY = [[832, 470], [985, 436], [1066, 498], [1064, 582], [915, 586], [836, 545]];
  const PRICE_TAG = { x: 942, y: 352, text: '₹800', radius: 72 }; // small ₹800 just above the money
  const STICKER = { look: { x: 1049, y: 842, r: 84 }, shock: { x: 1108, y: 868, r: 106 } }; // ₹1000 on the cover

  // Where Swifty stands (her feet) on the teaching screens 18–21: in the bottom-right corner, with the panel
  // on her left and her speech bubbles above her head (kept between CORNER.bubbles). She stays there from
  // one screen to the next.
  const CORNER = { x: 1690, y: 1010, s: 0.8, bubbles: [1440, 1900] };

  // Camera for screens with a card on the right (the question, the reduction): both characters
  // stay in view on the left. QUIZ_DRIFT is where its slow drift goes.
  const QUIZ_CAMERA = 'translateX(-282px) scale(1.04)';
  const QUIZ_DRIFT = 'translateX(-290px) scale(1.055)';

  const SCENES = [
    {
      id: 'title', num: '★', title: 'Start', sub: 'Bookstore Journey',
      bg: ASSETS + 'start screen.png',
      kb: { origin: '60% 45%', from: 'scale(1.02)', to: 'scale(1.07) translate(-10px, -6px)' },
      lamps: [[826, 96, 300], [1442, 134, 320]],
      dust: [120, 140, 1000, 900],
      play: playTitle,
    },
    {
      id: 'morning', num: '1', title: 'Good Morning!', sub: '“I’m going to the mall today.”',
      bg: ASSETS + 'morning.png',
      kb: { origin: '55% 6%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, 4px)' }, // zooms from the top, so his bubble never nears the edge
      lamps: [[92, 548, 280], [1755, 105, 420]], // the bedside lamp, and the sun in the window
      dust: [1000, 40, 1900, 700],                 // specks floating in the sunlight
      play: playMorning,
    },
    {
      id: 'home', num: '2', title: 'Off to the Mall', sub: 'Aniket sets off from home',
      bg: ASSETS + 'outside home.png',
      kb: { origin: '50% 70%', from: 'scale(1.02)', to: 'scale(1.05) translate(-8px, 0)' },
      lamps: [[160, 70, 420]], // the morning sun
      dust: [0, 40, 1900, 760],
      play: playLeaveHome,
    },
    {
      id: 'outside', num: '3', title: 'The Bookstore', sub: 'Aniket walks to the store',
      bg: ASSETS + 'book store outside view.png',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[918, 382, 320], [1498, 352, 320]],
      dust: [420, 260, 1840, 820],
      exit: 'zoom', zoomOrigin: '52% 56%', // 3 → 4: the camera pushes into the store while fading
      play: playOutside,
    },
    {
      id: 'see', num: '4', title: 'He Sees a Book', sub: 'Aniket spots a book on the table',
      bg: ASSETS + 'aniket saw a book.png',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      shot: 'shelf', // same camera as screen 5, so the fade looks like he picks the book up
      play: playSee,
    },
    {
      id: 'browse', num: '5', title: 'An Interesting Book', sub: '“This book looks interesting!”',
      bg: ASSETS + 'aniket hold the book scene.png',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      shot: 'shelf',
      play: playBrowse,
    },
    {
      id: 'ask', num: '6', title: 'How Much?', sub: '“How much is this book?”',
      bg: ASSETS + 'aniket give a book to shopkepper.png',
      kb: { origin: '50% 38%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' },
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      play: playAsk,
    },
    {
      id: 'pay', num: '7', title: 'Paying ₹800', sub: 'Handing over the money',
      bg: ASSETS + 'aniket give money to shopkeeper.png',
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.075)' },
      lamps: [[1408, 86, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter', // screen 8 carries on from this exact picture
      play: playPay,
    },
    {
      id: 'quiz', num: '8', title: 'Cost or Selling?', sub: 'For the shopkeeper, ₹800 is the —',
      bg: ASSETS + 'aniket give money to shopkeeper.png',
      kb: null, // this screen moves its own camera (see playQuiz)
      origin: '50% 46%', // same camera origin as screen 7, so the hand-over is seamless
      lamps: [[1408, 86, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter',
      backdrop: true, // the camera pans left: a soft blurred copy fills in past the picture's right edge
      play: playQuiz,
    },
    {
      id: 'look', num: '9', title: 'A Closer Look', sub: 'Aniket looks at the cover',
      bg: ASSETS + 'boy see the book .png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover', // the same view as screen 10 (from behind Aniket), so the cut there only changes his reaction
      play: playLook,
    },
    {
      id: 'shock', num: '10', title: 'What Is This?', sub: '“₹1000 is written on this book!”',
      bg: ASSETS + 'shocked aniket.png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover',
      play: playShock,
    },
    {
      id: 'mp', num: '11', title: 'Marked Price', sub: '₹1000 is the price written on the book',
      bg: ASSETS + 'shocked aniket.png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover', // carries straight on from screen 10's picture, which then blurs behind the panel
      backdrop: true, // a soft blurred copy behind keeps the blurred picture's edges clean
      play: playMarked,
    },
    {
      id: 'mpdef', num: '12', title: 'What Is Marked Price?', sub: 'The price printed on an article',
      bg: ASSETS + 'shocked aniket.png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover',
      backdrop: true,
      setup: scene => setupPricePanel(scene, { definition: MP_DEFINITION }),
      play: playDefine,
    },
    {
      id: 'compare', num: '13', title: 'Compare MP and SP', sub: '₹1000 Marked Price, ₹800 Selling Price',
      bg: ASSETS + 'shocked aniket.png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover',
      backdrop: true,
      setup: scene => setupPricePanel(scene, {
        compare: {
          top: { price: '₹1000', label: 'Marked Price', tone: 'yellow' },
          bottom: { price: '₹800', label: 'Selling Price', tone: 'blue' },
        },
      }),
      play: playCompare,
    },
    {
      id: 'reveal', num: '14', title: 'You Paid ₹200 Less', sub: 'The shopkeeper explains the reduction',
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
      id: 'discount', num: '15', title: 'What Is a Discount?', sub: '“Discount? What does that mean?”',
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
      id: 'discount-why', num: '16', title: 'Discount!', sub: 'The ₹200 reduction is called a Discount',
      bg: PUZZLED,
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' }, // as on screen 15
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter-talk',
      setup: setupDiscountWhy,
      play: playDiscountWhy,
    },
    {
      id: 'discount-def', num: '17', title: 'Discount Definition', sub: 'The reduction on the marked price',
      bg: PUZZLED,
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' }, // as on screens 15–16
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter-talk',
      setup: setupDiscountDef,
      play: playDiscountDef,
    },
    {
      id: 'formula', num: '18', title: 'The Discount Formula', sub: 'Marked Price − Selling Price = Discount',
      bg: PUZZLED,
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' }, // as on screens 15–17
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter-talk',
      setup: setupGuide, // starts out blurred, so only the definition card visibly fades away
      play: playFormula,
    },
    {
      id: 'formula-reveal', num: '19', title: 'Formula Reveal', sub: 'D = MP − SP',
      bg: PUZZLED,
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' }, // as on screens 15–18
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter-talk',
      setup: setupGuide,
      play: playFormulaReveal,
    },
    {
      id: 'apply', num: '20', title: 'Aniket’s Discount', sub: 'Discount = ₹1000 − ₹800 = ₹200',
      bg: PUZZLED,
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' }, // as on screens 15–19
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter-talk',
      setup: setupGuide,
      play: playApply,
    },
    {
      id: 'summary', num: '21', title: 'Quick Summary', sub: 'Let’s remember!',
      bg: PUZZLED,
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' }, // as on screens 15–20
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter-talk',
      setup: setupGuide,
      play: playSummary,
    },
    {
      id: 'sneakers', num: '22', title: 'The Shoe Shop', sub: '“These sneakers look good!”',
      bg: ASSETS + 'shoes shop enter.png',
      kb: { origin: '68% 48%', from: 'scale(1.02)', to: 'scale(1.07) translate(-10px, 0)' }, // eases in towards the sneakers
      lamps: [[1700, 180, 260], [1700, 380, 260], [175, 60, 200], [765, 66, 200]], // shelf lights, the mall's ceiling lights
      dust: [600, 40, 1900, 720],
      exit: 'zoom', zoomOrigin: '66% 56%', // 22 → 23: the camera pushes in on the sneakers while fading
      play: playSneakers,
    },
    {
      id: 'shoe', num: '23', title: 'Tagged Price', sub: 'Aniket points at the ₹1800 tag',
      bg: ASSETS + 'he saw a shoe.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the price tags
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], // shelf lights, a ceiling light
      dust: [600, 40, 1900, 720],
      shot: 'stand', // the same view as screen 24, so the fade there only changes Aniket
      play: playShoe,
    },
    {
      id: 'tag', num: '24', title: '30% Off!', sub: 'He spots the discount',
      bg: ASSETS + 'hee see discount on shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screen 23
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      play: playDiscountTag,
    },
    {
      id: 'confused', num: '25', title: 'What Does 30% Mean?', sub: '“How much money will actually be reduced?”',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–24
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupConfused,
      play: playConfused,
    },
    {
      id: 'recall', num: '26', title: 'Recall Percentages', sub: '“Let’s first recall how percentages work.”',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–25
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand', // carries straight on from screen 25's picture, which then blurs behind the card
      setup: setupRecall,
      play: playRecall,
    },
    {
      id: 'hundred', num: '27', title: '100% and the Amount', sub: '“Suppose ₹500 represents 100%.”',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–26
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide, // starts out blurred, Swifty in her corner, so only the card visibly fades away
      play: playHundred,
    },
    {
      id: 'half', num: '28', title: 'What Is 50% of ₹500?', sub: 'Pick the amount: ₹250, ₹300 or ₹400',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–27
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupHalf, // carries straight on from screen 27: the table, Swifty and her bubble
      play: playHalf,
    },
    {
      id: 'halved', num: '29', title: 'Solution for 50%', sub: '50% of ₹500 = ₹250',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–28
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupHalved, // starts out blurred, with Swifty and the table as screen 28 left them
      play: playHalved,
    },
    {
      id: 'quarter', num: '30', title: 'What Is 25% of ₹500?', sub: 'Pick the amount: ₹100, ₹125 or ₹250',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–29
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupQuarter, // carries straight on from screen 29: the table, the green bar, Swifty and her bubble
      play: playQuarter,
    },
    {
      id: 'quartered', num: '31', title: 'Solution for 25%', sub: '25% of ₹500 = ₹125',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–30
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupQuartered, // starts out blurred, with Swifty and the table as screen 30 left them
      play: playQuartered,
    },
    {
      id: 'idea', num: '32', title: 'General Idea of Percentage', sub: 'Part ↔ Percentage, Whole ↔ 100%',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–31
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide, // starts out blurred, Swifty in her corner, so only the table visibly fades away
      play: playIdea,
    },
    {
      id: 'whatpercent', num: '33', title: 'What Percent?', sub: '₹125 is what percent of ₹500?',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–32
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide, // starts out blurred, Swifty in her corner, so only the pairs visibly fade away
      play: playWhatPercent,
    },
    {
      id: 'check', num: '34', title: 'Quick CFU', sub: '₹150 is what percent of ₹600?',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–33
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide, // starts out blurred, Swifty in her corner, so only the formula visibly fades away
      play: playCheck,
    },
    {
      id: 'sneakerq', num: '35', title: 'Back to the Sneakers', sub: '“Now, what is 30% of ₹1800?”',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–34
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide, // starts out blurred, Swifty in her corner, so only the quick check visibly fades away
      play: playSneakerQuestion,
    },
    {
      id: 'thirty', num: '36', title: 'Calculate 30% of ₹1800', sub: '30/100 × 1800 = ₹540',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide,
      play: playThirty,
    },
    {
      id: 'represent', num: '37', title: 'What Does ₹540 Represent?', sub: 'Marked Price, Selling Price or Discount?',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide,
      play: playRepresent,
    },
    {
      id: 'topay', num: '38', title: 'The Amount to Pay', sub: 'SP = MP − Discount = ₹1260',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide,
      play: playToPay,
    },
    {
      id: 'final', num: '39', title: 'Final Answer', sub: '“After a 30% discount, I will pay ₹1260.”',
      bg: ASSETS + 'he saw a shoe.png', // the same view as screens 23–38: Aniket pointing at the tags
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupGuide, // starts out blurred with Swifty in her corner, as screen 38 left them
      play: playFinal,
    },
    {
      id: 'discountpct', num: '40', title: 'Discount Percentage', sub: 'Discount % = Discount ÷ Marked Price × 100',
      bg: ASSETS + 'he saw a shoe.png', // as on screen 39, which it carries straight on from
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupDiscountPercent, // the shop as screen 39 left it
      play: playDiscountPercent,
    },
    {
      id: 'sneakersum', num: '41', title: 'Complete Summary', sub: 'Sneaker Example Summary',
      bg: ASSETS + 'he saw a shoe.png', // as on screens 39–40
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupSneakerSummary, // starts out blurred with Swifty in her corner, as screen 40 left them
      play: playSneakerSummary,
    },
  ];
  const LAST = SCENES.length - 1;

  // ======================================================================
  // Scene scripts. `ctx.wait()` throws CANCELLED as soon as the player
  // leaves the scene, so every script simply stops where it is.
  // ======================================================================

  async function playTitle(ctx, scene) {
    const L = scene.layer;
    FX.twinkles(L, [[300, 250], [700, 205], [140, 470], [884, 420], [250, 668], [810, 640], [520, 160]]);

    const wrap = el('div', 'start-wrap', L, { left: '495px', top: '812px' });
    const btn = el('button', 'start-btn', wrap);
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Start the story');
    const img = el('img', '', btn);
    img.src = ASSETS + 'start button.png';
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
    FX.burst(scene.layer, 495, 812, { count: 22, dist: [150, 320] });
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

  // Good morning: Aniket wakes up stretching while birds chirp outside, then says what he'll do today.
  async function playMorning(ctx, scene) {
    await ctx.wait(500);
    Sound.chirp();
    await ctx.wait(420);
    Sound.chirp();
    await ctx.wait(600);
    const line = FX.bubble(scene.layer, {
      anchor: [968, 206], corner: 'bl', tip: [922, 372], // on the wall between his hair and his raised fist
      text: 'I’m going to\nthe mall today.\nLet’s see what\nI can find!', voice: 'boy', rotate: -1.5,
    });
    await line.show();
    await speak(ctx, line, 'wake', 'boy');
    ctx.advance(3000); // then he sets off
  }

  // The left leaf of the gate outside Aniket's home, cut out of "outside home.png" (ui/gate-leaf.png), and
  // the view behind it with the bars painted out (ui/gate-gap.png). Both cover this box (stage px); the
  // leaf turns on its hinges, `hinge` px in from the box's left edge.
  const GATE = { x: 803.8, y: 502.7, w: 232, h: 293.8, hinge: 10.3 };

  // The gate leaf, ready to swing open (into the garden) and shut again.
  function homeGate(parent) {
    const box = { left: `${GATE.x}px`, top: `${GATE.y}px`, width: `${GATE.w}px`, height: `${GATE.h}px` };
    const gap = el('img', 'gate-part', parent, box);
    const leaf = el('img', 'gate-part', parent, Object.assign({ transformOrigin: `${GATE.hinge}px 50%` }, box));
    gap.src = ASSETS + 'ui/gate-gap.png';
    leaf.src = ASSETS + 'ui/gate-leaf.png';
    gap.alt = leaf.alt = '';
    const swing = (turns, ms, easing) => FX.settle(leaf.animate(
      turns.map(([deg, offset]) => ({ transform: `perspective(900px) rotateY(${deg}deg)`, offset })),
      { duration: reducedMotion ? 1 : ms, easing, fill: 'forwards' }
    ));
    return {
      open() {
        Sound.gateOpen();
        return swing([[0, 0], [78, 0.75], [72, 1]], 800, 'cubic-bezier(.3,.6,.35,1)');
      },
      close() {
        return swing([[72, 0], [-2, 0.85], [0, 1]], 560, 'cubic-bezier(.55,0,.7,1)').then(() => {
          if (leaf.isConnected) Sound.gateShut();
        });
      },
    };
  }

  // Outside his home: the gate swings open, Aniket steps out of it onto the pavement, the gate shuts behind
  // him, and he walks off to the left, out of the picture. A straight cut then finds him at the mall.
  async function playLeaveHome(ctx, scene) {
    const gate = homeGate(scene.layer);
    const walker = new FX.Walker(scene.layer, WALK_SHEET, { matte: true, face: -1 }); // faces left
    const inGate = { x: 985, y: 790, s: 0.55 }; // in the open gateway (out of sight until he steps out)
    const out = { x: 895, y: 870, s: 0.59 };    // on the pavement, in front of the gate
    const away = { x: -230, y: 777, s: 0.57 };  // off-screen left, along the pavement
    walker.place(inGate.x, inGate.y, inGate.s);
    walker.setFrame(WALK_SHEET.idle);
    walker.root.style.opacity = '0';
    const pan = x => (x / STAGE_W) * 1.6 - 0.8;

    await ctx.wait(700);
    await gate.open();
    // One step out of the gateway, coming out of the porch's shade.
    walker.root.style.opacity = '';
    FX.settle(walker.root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' }));
    await walker.walk(ctx, { from: inGate, to: out, speed: 200, decel: 60, onStep: x => Sound.step(pan(x)) });
    walker.idle(true);
    await ctx.wait(250);
    await gate.close();
    await ctx.wait(300);

    // Off to the mall.
    walker.idle(false);
    Sound.duck(true);
    await walker.walk(ctx, { from: out, to: away, speed: 280, decel: 0, onStep: x => Sound.step(pan(x)) });
    Sound.duck(false);
    ctx.advance(800); // he's gone: on to the mall
  }

  async function playOutside(ctx, scene) {
    const L = scene.layer;
    const walker = new FX.Walker(L, WALK_SHEET);
    const from = { x: -190, y: 1016, s: 0.79 }; // off-screen left, slightly closer to the camera
    const to = { x: 925, y: 986, s: 0.76 };     // front of the store, by the display table
    walker.place(from.x, from.y, from.s);
    walker.setFrame(WALK_SHEET.loop[0]);
    const pan = x => (x / STAGE_W) * 1.6 - 0.8;

    await ctx.wait(600);
    Sound.duck(true);
    await walker.walk(ctx, { from, to, speed: 265, decel: 230, onStep: x => Sound.step(pan(x)) });
    Sound.step(pan(to.x), 0.5);
    Sound.duck(false);
    walker.idle(true);

    await ctx.wait(300);
    const headTop = to.y - (WALK_SHEET.baselineY - 10) * to.s;
    FX.exclaim(L, to.x + 22, headTop - 34);
    Sound.ding();

    await ctx.wait(500);
    FX.shine(L, SHOP_SIGN, { duration: 1400, width: 260 });
    FX.twinkles(L, [[468, 222], [1590, 90], [1120, 132]], { size: [30, 46] });
    Sound.sparkle();

    await ctx.wait(700);
    ctx.advance(1800);
  }

  // Nothing to say here: Aniket just looks at the book, then (fade) picks it up.
  async function playSee(ctx) {
    await ctx.wait(600);
    ctx.advance(2600);
  }

  async function playBrowse(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 1105, 505, 440, 440, { cls: 'glow--book', delay: 0 });
    FX.twinkles(L, [[985, 372], [1240, 405], [1252, 600], [975, 612], [1120, 338], [1185, 664]]);

    await ctx.wait(700);
    const line = FX.bubble(L, {
      anchor: [1005, 270], corner: 'bl', tip: [950, 318],
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
      text: [{ t: "It's " }, { t: '₹800', em: true }, { t: '!' }], voice: 'man', rotate: 1.5,
    });
    await answer.show();
    await speak(ctx, answer, 'price', 'man');
    answer.emphasize();
    Sound.ding();
    ctx.advance(3000); // the shopkeeper holds the moment, then on to paying
  }

  // One part of a bubble split into parts (see FX.bubble), typed while it is spoken.
  async function speakPart(ctx, line, part, id, words, who, speaker) {
    if (speaker) speaker.talk();
    await Promise.all([line.type(ctx, { part, blips: !Voice.available }), Voice.say(id, words, who)]);
    if (speaker) speaker.idle();
  }

  // A speech bubble's line, typed out while the character's voice says it (no typing blips then).
  // `speaker` (Swifty) moves her beak while she talks.
  async function speak(ctx, line, id, who, speaker) {
    if (speaker) speaker.talk();
    await Promise.all([line.type(ctx, { blips: !Voice.available }), Voice.say(id, line.words, who)]);
    if (speaker) speaker.idle();
  }

  // Where Swifty's speech bubble goes: centred above her head (kept between `within`), or beside her head
  // on the right.
  function overHead(bird, within) {
    const crest = bird.y - bird.s * (SWIFTY.stand.anchorY - 20);
    return { anchor: [bird.x, crest - 26], corner: 'bc', within, tip: [bird.x - 14, crest - 2], lean: 26 };
  }

  function besideHead(bird) {
    const head = { x: bird.x, y: bird.y - bird.s * SWIFTY.stand.bodyY };
    return { anchor: [head.x + 92, head.y + 46], corner: 'bl', tip: [head.x + 62, head.y + 22] };
  }

  // Swifty's lines on a teaching screen. Each one comes in a speech bubble (placed by `place(bird)`) that is
  // typed while her voice says it, and takes the place of the bubble before. A bubble can be split into
  // parts (see FX.bubble) that she says one at a time, in step with what happens on screen.
  function swiftyTalk(ctx, ui, bird, place) {
    let line = null;
    const talk = {
      bird,
      get line() { return line; },
      // Puts up the bubble for her next line, once the one before has gone.
      async show(text) {
        if (line) {
          await line.hide();
          await ctx.wait(120);
        }
        line = FX.bubble(ui, Object.assign(place(bird), { text, voice: 'bird', rotate: 1.5 }));
        await line.show();
      },
      // Types part `i` of the bubble while she says it; never quicker than `ms`.
      part(id, i, ms = 0) {
        return Promise.all([speakPart(ctx, line, i, id, line.parts[i], 'bird', bird), ctx.wait(ms)]);
      },
      // Her bubble goes (e.g. before she reads out something that is written on the screen).
      async clear() {
        if (!line) return;
        const old = line;
        line = null;
        await old.hide();
      },
      // A whole line in a new bubble, typed while she says it; never quicker than `ms`.
      async say(id, text, ms = 0) {
        await talk.show(text);
        await Promise.all([speak(ctx, line, id, 'bird', bird), ctx.wait(ms)]);
      },
    };
    return talk;
  }

  async function playPay(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 950, 515, 460, 300, { cls: 'glow--money', delay: 0 });

    await ctx.wait(600);
    FX.shine(L, MONEY, { duration: 900, width: 140 });

    await ctx.wait(450);
    FX.badge(L, PRICE_TAG).pop(); // pop sound + a small ₹800 just above the money
    FX.burst(L, PRICE_TAG.x, PRICE_TAG.y, { count: 14, dist: [90, 170], size: [10, 20] });

    await ctx.wait(500);
    Sound.kaching();
    FX.burst(L, 950, 515, { count: 10, dist: [70, 140], size: [10, 18] });
    ctx.advance(2600); // on to the question
  }


  async function playQuiz(ctx, scene) {
    const L = scene.layer;
    const cam = scene.world;

    // Start exactly where screen 7's camera was, then glide left to make room for the card.
    const start = scene.startFrom && scene.startFrom !== 'none' ? scene.startFrom : 'scale(1.02)';
    const pan = cam.animate([{ transform: start }, { transform: QUIZ_CAMERA }], {
      duration: reducedMotion ? 1 : 1100, delay: 300, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'both',
    });
    scene.kbAnim = pan;
    // As the camera moves, the picture's right edge feathers into the blurred backdrop.
    Game.timers.add(setTimeout(() => ctx.alive() && scene.el.classList.add('is-feathered'), 300));
    FX.settle(pan).then(() => {
      if (!ctx.alive() || reducedMotion) return;
      scene.kbAnim = cam.animate([{ transform: QUIZ_CAMERA }, { transform: QUIZ_DRIFT }], {
        duration: 14000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out',
      });
      pan.cancel();
    });

    // The ₹800 from screen 7 is still showing at first; it bows out as the camera moves.
    const price = FX.badge(L, PRICE_TAG);
    price.el.querySelector('.badge-rays').style.transition = 'none';
    price.el.style.opacity = '1';
    price.el.classList.add('is-lit');
    FX.settle(price.el.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(.2)', opacity: 0 },
    ], { duration: 320, delay: 250, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' })).then(() => price.el.remove());

    // The right side darkens softly so the card stands out (`fb-dim` is the full dim used during feedback).
    el('div', 'q-scrim', scene.ui);
    el('div', 'fb-dim', scene.ui);
    Game.timers.add(setTimeout(() => ctx.alive() && scene.el.classList.add('is-asking'), 400));

    await ctx.wait(650);
    const card = FX.question(scene.ui, {
      lines: ['For the shopkeeper,', '{₹800} is the —'],
      options: [{ label: 'Cost Price' }, { label: 'Selling Price', correct: true }],
      onAnswer(correct, button) {
        const reply = correct ? answerRight(ctx, scene, card, button) : answerWrong(ctx, scene, card);
        reply.catch(err => { if (err !== CANCELLED) console.error(err); });
      },
    });
    await card.enter(ctx);
  }

  // Right answer: the scene blurs, the card comes to the middle and turns over to say why; Swifty flies in,
  // stands at its lower-right corner and reads it out, pointing at it. After 3 seconds a Next button moves
  // the story on.
  async function answerRight(ctx, scene, card, button) {
    const [x, y] = stagePoint(button);
    FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
    await ctx.wait(700);
    hush(scene, true);
    card.el.classList.add('is-center');
    await ctx.wait(reducedMotion ? 60 : 850);
    const why = 'The shopkeeper sold the book for {₹800}, so {₹800} is the *Selling Price*.';
    await card.flip({ title: 'Correct!', text: why });
    const r = stageRect(card.card);
    FX.twinkles(scene.ui, [[r.left + 6, r.top + 40], [r.right - 4, r.top + 150], [r.right - 30, r.bottom - 10], [r.left + 24, r.bottom - 60]]);

    const feet = { x: r.right + 60, y: r.bottom + 80 };
    const bird = new FX.Bird(scene.ui, SWIFTY, { scale: 0.8 });
    bird.place(2140, feet.y - 300);
    await bird.flyTo(ctx, { x: feet.x, y: feet.y, s: 0.8, duration: 1300, lift: 100, ease: 'out' });
    await bird.land();
    bird.point();
    await ctx.wait(400);
    bird.talk(); // still leaning towards the card
    await Voice.say('correct', 'Correct! ' + why, 'bird');
    bird.point();
    await ctx.wait(3000, { real: true });
    nextButton(scene);
  }

  // Big "Next" button in the bottom-right corner that moves the story on after the question ("Replay" on the
  // last screen). { right, bottom } move it (stage px from those edges), e.g. to clear Swifty in her corner.
  function nextButton(scene, { right, bottom } = {}) {
    const last = Game.index === LAST;
    const btn = el('button', 'story-next', scene.ui);
    btn.type = 'button';
    if (right !== undefined) btn.style.right = right + 'px';
    if (bottom !== undefined) btn.style.bottom = bottom + 'px';
    el('span', 'story-next-label', btn).textContent = last ? 'Replay' : 'Next';
    btn.insertAdjacentHTML('beforeend', icon(last ? 'replay' : 'next'));
    btn.addEventListener('click', () => {
      Sound.click();
      next();
    }, { once: true });
    FX.settle(btn.animate([
      { opacity: 0, transform: 'translateY(30px) scale(.7)' },
      { opacity: 1, transform: 'translateY(-4px) scale(1.05)', offset: 0.7 },
      { opacity: 1, transform: 'none' },
    ], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' }));
    Sound.bloop();
    return btn;
  }

  // Wrong answer: the card comes to the middle and the scene blurs; Swifty flies in, lands on the card
  // and gives a hint; then she explains Cost Price and Selling Price, and a Next button moves the story on.
  async function answerWrong(ctx, scene, card) {
    const ui = scene.ui;
    card.lock();
    await ctx.wait(700); // let the shake and buzz land first
    Sound.duck(true);
    hush(scene, true);
    card.el.classList.add('is-center');
    await ctx.wait(reducedMotion ? 60 : 850);

    // Swifty flies in from the left and lands on the top edge of the card.
    const r = stageRect(card.card);
    const perch = { x: r.right - 118, y: r.top + 4 };
    const bird = new FX.Bird(ui, SWIFTY, { scale: 0.5 });
    bird.place(-220, perch.y - 260);
    await bird.flyTo(ctx, { x: perch.x, y: perch.y, duration: 1700, lift: 90, ease: 'out' });
    await bird.land();
    await ctx.wait(250);

    const hint = FX.bubble(ui, {
      anchor: [perch.x - 86, perch.y - 102], corner: 'br', tip: [perch.x - 70, perch.y - 88],
      text: [{ t: 'Think again.\nThe shopkeeper sold\nthe book for ' }, { t: '₹800', em: true }, { t: '.' }],
      voice: 'bird', rotate: -1.5,
    });
    await hint.show();
    await speak(ctx, hint, 'hint', 'bird', bird);
    hint.emphasize();
    await ctx.wait(2600);

    // The definitions fill the screen; Swifty flies over, stands on the right and reads them out.
    hint.hide();
    const items = [
      { title: 'Cost Price (CP)', tone: 'blue', pictures: [ART.money, ART.book], text: 'Price at which an item is {bought}.', say: 'Cost Price. C P.' },
      { title: 'Selling Price (SP)', tone: 'yellow', pictures: [ART.book, ART.money], text: 'Price at which an item is {sold}.', say: 'Selling Price. S P.' },
    ];
    const defs = FX.definitions(ui, { items });
    const teach = (id, text) => {
      bird.talk();
      return Voice.say(id, text, 'bird').then(() => bird.idle());
    };
    ui.appendChild(bird.root); // in front of the panel
    const spot = stageRect(defs.spot);
    await bird.takeOff(ctx);
    const flight = bird.flyTo(ctx, { x: spot.left + spot.width / 2, y: spot.bottom, s: 0.8, duration: 1100, lift: 120 });
    card.hide();
    await ctx.wait(200);
    defs.open();
    await flight;
    await bird.land();
    await defs.fill(ctx, {
      onCard: () => bird.wave(),
      onTitle: i => teach(`def${i}-title`, items[i].say),
      onText: i => teach(`def${i}-text`, items[i].text),
    });

    // Swifty ties it back to the story, from the space above her head; then the button appears.
    const panel = stageRect(defs.panel);
    const answer = FX.bubble(ui, Object.assign(overHead(bird, [panel.left + 30, panel.right - 24]), {
      text: [
        { t: 'Here, ' }, { t: '₹800', em: true }, { t: ' is the\nshopkeeper’s\n' },
        { t: 'Selling Price', cls: 'stress' }, { t: '.' },
      ],
      voice: 'bird', rotate: 1.5,
    }));
    await answer.show();
    await speak(ctx, answer, 'here', 'bird', bird);
    answer.emphasize();
    await ctx.wait(600);

    // 3 seconds after everything is up, a Next button (bottom-right) moves the story on.
    await ctx.wait(3000, { real: true });
    nextButton(scene);
  }

  // A closer look at the cover: the ₹1000 sticker starts to glow.
  async function playLook(ctx, scene) {
    await ctx.wait(1000);
    FX.ring(scene.layer, STICKER.look);
    Sound.sparkle();
    await ctx.wait(600);
    ctx.advance(2600);
  }

  // He has just paid ₹800, but the cover says ₹1000!
  async function playShock(ctx, scene) {
    await ctx.wait(150);
    Sound.shock();
    jolt(scene);
    FX.ring(scene.layer, STICKER.shock);
    await ctx.wait(650);
    const line = FX.bubble(scene.layer, {
      anchor: [1112, 350], corner: 'bl', tip: [1068, 326], // beside the yellow surprise lines by his head
      text: [{ t: 'What is this?\n' }, { t: '₹1000', em: true }, { t: ' is written\non this book!' }],
      voice: 'boy', rotate: -1.5,
    });
    await line.show();
    await speak(ctx, line, 'shock', 'boy');
    line.emphasize();
    ctx.advance(3000); // then Swifty explains it
  }

  // The Marked Price: the scene blurs, a panel with the book comes to the middle, Swifty flies in,
  // lands on the book and says "₹1000 is the price written on the book." while the sticker zooms
  // into a lens; then the name "Marked Price (MP)" drops in under it, and she says it in a new bubble.
  // She stays on the book for screens 12 and 13.
  async function playMarked(ctx, scene) {
    const ui = scene.ui;
    el('div', 'fb-dim', ui);
    await ctx.wait(300);
    hush(scene, true);
    await ctx.wait(500);
    const mp = FX.pricePanel(ui, { price: '₹1000', term: 'Marked Price', abbr: '(MP)' });
    mp.open();
    await ctx.wait(600);
    mp.showBook();
    await ctx.wait(1000);
    const bird = await flyToBook(ctx, ui, mp);
    await ctx.wait(300);

    // Her line, beside her head, while the sticker glows.
    mp.highlight();
    const talk = swiftyTalk(ctx, ui, bird, besideHead);
    await talk.show([{ t: '₹1000', em: true }, { t: ' is the price\nwritten on the book.' }]);
    const saying = speak(ctx, talk.line, 'mp-line', 'bird', bird);
    saying.catch(() => {}); // if the player leaves mid-line, the wait below reports it
    await ctx.wait(500);
    await mp.zoom(); // the price, big, while she says it
    await saying;
    talk.line.emphasize();
    await ctx.wait(900);

    // The name for it.
    await mp.name();
    bird.wave();
    await ctx.wait(300);
    await talk.say('mp-term', [{ t: 'It is called the\n' }, { t: 'Marked Price (MP)', cls: 'key' }, { t: '.' }]);
    talk.line.emphasize();
    ctx.advance(3000); // then the definition
  }

  // Where Swifty stands in the price panels (screens 11–13): on the top edge of the book.
  function bookPerch(mp) {
    const book = stageRect(mp.book);
    const k = book.height / 540; // the book picture's own units → stage px
    return { x: book.left + 300 * k, y: book.top + 12 * k };
  }

  // Swifty flies in from the left and lands on the book.
  async function flyToBook(ctx, ui, mp) {
    const perch = bookPerch(mp);
    const bird = new FX.Bird(ui, SWIFTY, { scale: 0.5 });
    bird.place(-220, perch.y - 240);
    await bird.flyTo(ctx, { x: perch.x, y: perch.y, duration: 1600, lift: 100, ease: 'out' });
    await bird.land();
    return bird;
  }

  // Screens 12 and 13 carry on from the price panel before them. Their setup runs before the cross-fade
  // starts, so the picture behind is already blurred and (coming from the previous panel) the panel, the
  // book and Swifty on it are already in place: only the right side visibly changes during the fade.
  const PANEL_FLOW = ['mp', 'mpdef', 'compare'];

  function setupPricePanel(scene, side) {
    el('div', 'fb-dim', scene.ui);
    hush(scene, true, { instant: true });
    scene.mp = FX.pricePanel(scene.ui, Object.assign({ price: '₹1000', term: 'Marked Price', abbr: '(MP)' }, side));
    scene.carried = PANEL_FLOW.indexOf(scene.cameFrom) === PANEL_FLOW.indexOf(scene.id) - 1;
    scene.bird = null;
    if (!scene.carried) return;
    scene.mp.showNow();
    const perch = bookPerch(scene.mp);
    scene.bird = new FX.Bird(scene.ui, SWIFTY, { scale: 0.5 });
    scene.bird.place(perch.x, perch.y);
    scene.bird.shadowOn(true);
  }

  // Lets the cross-fade finish; or (when the screen was reached some other way, e.g. from the scenes
  // panel) brings the panel in and Swifty flies onto the book. Resolves with Swifty.
  async function enterPricePanel(ctx, scene) {
    if (scene.carried) {
      await ctx.wait(700);
      return scene.bird;
    }
    await ctx.wait(300);
    scene.mp.open();
    await ctx.wait(600);
    scene.mp.showBook();
    await ctx.wait(1000);
    return flyToBook(ctx, scene.ui, scene.mp);
  }

  // The Marked Price definition: a card eases in beside the book and Swifty reads it out while the words
  // appear one by one; "marked" and "printed" light up the sticker on the book.
  const MP_DEFINITION = 'The price {marked} or\n{printed} on an article\nis called its\n*Marked Price.*';

  async function playDefine(ctx, scene) {
    const bird = await enterPricePanel(ctx, scene);
    await scene.mp.define(ctx, {
      onRead: () => {
        bird.talk();
        return Voice.say('mp-def', 'Marked Price. ' + MP_DEFINITION, 'bird').then(() => bird.idle());
      },
      onMarked: () => scene.mp.highlight(),
    });
    ctx.advance(3000); // then compare it with the Selling Price
  }

  // Compare MP and SP: ₹1000 Marked Price, an arrow down, ₹800 Selling Price, with Swifty saying each
  // step from the book.
  async function playCompare(ctx, scene) {
    const bird = await enterPricePanel(ctx, scene);
    const talk = swiftyTalk(ctx, scene.ui, bird, besideHead);
    await scene.mp.compare(ctx, {
      onTop: () => {
        scene.mp.highlight(); // the ₹1000 on the book ↔ the Marked Price
        return talk.say('cmp-mp', [{ t: 'The Marked Price\nis ' }, { t: '₹1000', em: true }, { t: '.' }]);
      },
      onBottom: () => talk.say('cmp-sp', [
        { t: 'But the book was sold\nfor ' }, { t: '₹800', em: true }, { t: '. That is the\nSelling Price.' },
      ]),
    });
    await ctx.wait(500);
    await talk.say('cmp-why', 'Why is the Selling Price\nless than the Marked Price?');
    ctx.advance(3000); // the shopkeeper explains
  }

  // Back at the counter, the shopkeeper explains, one part at a time, while the card on the right
  // builds ₹1000 → (₹200 reduced) → ₹800 in step with what he says.
  const REDUCTION_CARD = {
    from: { price: '₹1000', tone: 'yellow' }, // the same colours as on the compare screen
    to: { price: '₹800', tone: 'blue' },
    cut: '₹200',
    note: 'reduced',
  };
  const REVEAL_LINE = {
    anchor: [1232, 296], corner: 'br', tip: [1318, 370],
    text: [
      { t: 'The marked price was\n' }, { t: '₹1000', em: true }, { t: ',', end: true },
      { t: ' but I sold it\nto you for ' }, { t: '₹800', em: true }, { t: '.', end: true },
      { t: '\nYou paid ' }, { t: '₹200', em: true }, { t: ' less.' },
    ],
    voice: 'man', rotate: 1.5,
  };

  async function playReveal(ctx, scene) {
    const card = FX.reduction(scene.ui, REDUCTION_CARD);
    await ctx.wait(500);
    card.enter();
    await ctx.wait(900);

    const line = FX.bubble(scene.layer, REVEAL_LINE);
    await line.show();
    const parts = [
      ['reveal-1', 'The marked price was ₹1000,', () => card.showFrom()],
      ['reveal-2', 'but I sold it to you for ₹800.', () => card.showTo(ctx)],
      ['reveal-3', 'You paid ₹200 less.', () => card.showCut()],
    ];
    for (const [i, [id, words, show]] of parts.entries()) {
      await speakPart(ctx, line, i, id, words, 'man');
      await show();
      await ctx.wait(500);
    }
    line.emphasize();
    ctx.advance(3000); // then the word for it
  }

  // "Discount". Coming from screen 14 the picture, the card and the bubble are first exactly as they
  // were; then the bubble and the card go, and the camera glides back to the middle. The shopkeeper says
  // the new word; Aniket's face turns puzzled (PUZZLED fades in over the picture) and he wonders about it
  // in a thought cloud.
  function setupDiscount(scene) {
    scene.carried = scene.cameFrom === 'reveal';
    if (!scene.carried) return;
    instantly(scene, () => scene.el.classList.add('is-feathered'));
    scene.oldCard = FX.reduction(scene.ui, REDUCTION_CARD);
    scene.oldCard.showNow();
    scene.oldLine = FX.bubble(scene.layer, REVEAL_LINE);
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

    // One speaker at a time: first the shopkeeper…
    const shop = FX.bubble(scene.layer, {
      anchor: [1262, 318], corner: 'br', tip: [1300, 372],
      text: [{ t: 'You got a ' }, { t: '₹200', em: true }, { t: '\n' }, { t: 'discount.', cls: 'key' }],
      voice: 'man', rotate: 1.5,
    });
    await shop.show();
    await speak(ctx, shop, 'disc-1', 'man');
    shop.emphasize();
    Sound.ding();
    await ctx.wait(1400);

    // …then Aniket. He doesn't know the word: his face turns puzzled, and he wonders about it.
    await shop.hide();
    scene.el.classList.add('is-reacting');
    Sound.wonder();
    await ctx.wait(700);
    const wondering = FX.thought(scene.layer, DISCOUNT_THOUGHT);
    await wondering.show();
    await speak(ctx, wondering, 'disc-2', 'boy');
    wondering.emphasize();
    ctx.advance(3000); // Swifty explains
  }

  // Aniket's thought: a cloud above and to the right of his head, its puffs rising from the top of his hair.
  const DISCOUNT_THOUGHT = {
    at: [990, 190], tip: [748, 226],
    text: [{ t: 'Discount?', cls: 'key' }, { t: '\nWhat does\nthat mean?' }], voice: 'boy',
  };

  // Discount, explained. Coming from screen 15, Aniket's thought cloud is first still there; then the counter
  // blurs, a panel builds ₹1000 Marked Price → ₹200 reduced → ₹800 Selling Price, Swifty flies in and
  // explains, and the word DISCOUNT lands like a stamp.
  const DISCOUNT_FLOW = {
    steps: [
      { price: '₹1000', label: 'Marked Price', tone: 'yellow' },
      { price: '₹200', label: 'reduced', tone: 'red' },
      { price: '₹800', label: 'Selling Price', tone: 'blue' },
    ],
    word: 'DISCOUNT',
  };
  const DISCOUNT_SCALE = 0.95; // Swifty's size on the discount screens

  // Her explanation, from a bubble above her head (wherever she stands).
  function discountWhyLine(bird) {
    const head = { x: bird.x, y: bird.y - bird.s * SWIFTY.stand.bodyY };
    const r = bird.s * SWIFTY.stand.bodyR; // her body's radius on screen
    return {
      anchor: [head.x + r * 0.55, head.y - r * 1.3], corner: 'bl', tip: [head.x + r * 0.55, head.y - r * 0.92], lean: 20,
      text: [
        { t: 'The price was\nreduced by ' }, { t: '₹200', em: true }, { t: '.', end: true },
        { t: '\nThis ' }, { t: '₹200', em: true }, { t: ' reduction\nis called a ' }, { t: 'Discount.', cls: 'key' },
      ],
      voice: 'bird', rotate: 1.5,
    };
  }

  function setupDiscountWhy(scene) {
    el('div', 'fb-dim', scene.ui);
    scene.oldLine = null;
    if (scene.cameFrom === 'discount-def') hush(scene, true, { instant: true }); // back from the definition
    if (scene.cameFrom !== 'discount') return;
    scene.oldLine = FX.thought(scene.layer, DISCOUNT_THOUGHT);
    scene.oldLine.showNow();
  }

  async function playDiscountWhy(ctx, scene) {
    const ui = scene.ui;
    await ctx.wait(scene.oldLine ? 500 : 300);
    if (scene.oldLine) scene.oldLine.hide();
    hush(scene, true);
    await ctx.wait(600);

    const dp = FX.discountPanel(ui, DISCOUNT_FLOW);
    dp.open();
    await ctx.wait(900);
    await dp.flow(ctx);
    await ctx.wait(300);

    // Swifty flies in from the right and lands beside the flow.
    const spot = stageRect(dp.spot);
    const bird = new FX.Bird(ui, SWIFTY, { scale: DISCOUNT_SCALE });
    bird.place(2140, spot.top - 260);
    await bird.flyTo(ctx, { x: spot.left, y: spot.top, s: DISCOUNT_SCALE, duration: 1500, lift: 110, ease: 'out' });
    await bird.land();
    bird.wave();
    await ctx.wait(500);

    // Her explanation, in two parts.
    const line = FX.bubble(ui, discountWhyLine(bird));
    await line.show();
    await speakPart(ctx, line, 0, 'dwhy-1', 'The price was reduced by ₹200.', 'bird', bird);
    dp.highlight(1); // the ₹200 reduction
    await ctx.wait(700);
    await speakPart(ctx, line, 1, 'dwhy-2', 'This ₹200 reduction is called a Discount.', 'bird', bird);
    line.emphasize();
    await ctx.wait(250);
    await dp.stamp();
    const stamp = stageRect(dp.stampEl);
    FX.burst(ui, stamp.left + stamp.width / 2, stamp.top + stamp.height / 2, { count: 16, dist: [120, 230], size: [12, 24] });
    dp.highlight(1, true); // the ₹200 box keeps glowing: it is the discount
    bird.wave();
    await ctx.wait(600);
    ctx.advance(3000); // then the definition
  }

  // The definition of a discount. Coming from screen 16, the panel, Swifty and her bubble are first exactly
  // as they were; then the panel goes, the definition card springs up, Swifty hops over to its corner and
  // points at it, and reads it out while the words appear. Then she hops down to her corner (CORNER).
  const DISCOUNT_DEFINITION = 'The {reduction} given on the\n{marked price} of an item\nis called a *discount.*';

  function setupDiscountDef(scene) {
    el('div', 'fb-dim', scene.ui);
    hush(scene, true, { instant: true });
    scene.old = null;
    if (scene.cameFrom !== 'discount-why') return;
    const panel = FX.discountPanel(scene.ui, DISCOUNT_FLOW);
    panel.showNow();
    const spot = stageRect(panel.spot);
    const bird = new FX.Bird(scene.ui, SWIFTY, { scale: DISCOUNT_SCALE });
    bird.place(spot.left, spot.top);
    bird.shadowOn(true);
    const line = FX.bubble(scene.ui, discountWhyLine(bird));
    line.showNow();
    scene.old = { panel, bird, line };
  }

  async function playDiscountDef(ctx, scene) {
    const ui = scene.ui;
    const card = FX.definitionCard(ui, { term: 'Discount', text: DISCOUNT_DEFINITION });
    const box = stageRect(card.card); // measured before it animates
    const corner = { x: box.right + 30, y: box.bottom + 104 }; // her feet: overlapping the card's lower-right corner

    let bird;
    if (scene.old) {
      bird = scene.old.bird;
      ui.appendChild(bird.root); // in front of the new card
      await ctx.wait(600);
      scene.old.line.hide();
      scene.old.panel.close();
      await ctx.wait(350);
      card.open();
      await bird.takeOff(ctx);
      await bird.flyTo(ctx, { x: corner.x, y: corner.y, s: 0.9, duration: 1100, lift: 90 });
    } else {
      await ctx.wait(400);
      card.open();
      await ctx.wait(500);
      bird = new FX.Bird(ui, SWIFTY, { scale: 0.9 });
      bird.place(2140, corner.y - 300);
      await bird.flyTo(ctx, { x: corner.x, y: corner.y, s: 0.9, duration: 1400, lift: 100, ease: 'out' });
    }
    await bird.land();
    await ctx.wait(200);
    bird.point();
    await ctx.wait(600);

    // She reads it out, still leaning towards it, while the words appear.
    await card.define(ctx, {
      onRead: () => {
        bird.talk();
        return Voice.say('ddef', 'Discount. ' + DISCOUNT_DEFINITION, 'bird').then(() => bird.point());
      },
    });
    card.emphasize();
    Sound.ding();
    await ctx.wait(700);
    bird.wave();
    await ctx.wait(900);
    bird.point();
    await ctx.wait(1300);

    // She hops down to her corner, leaving the definition up; then the formula.
    bird.lean(0);
    await bird.takeOff(ctx);
    await bird.flyTo(ctx, { x: CORNER.x, y: CORNER.y, s: CORNER.s, duration: 1000, lift: 60 });
    await bird.land();
    ctx.advance(2400);
  }

  // The discount formula, built one piece at a time: the ₹1000 lifts off the book's sticker into the
  // Marked Price box, then − ₹800 Selling Price, then = ₹200 Discount, with Swifty saying each step from
  // her corner; then she says the formula in words while each part lights up.
  async function playFormula(ctx, scene) {
    const fp = FX.formulaPanel(scene.ui, {
      price: '₹1000',
      terms: [
        { label: 'Marked Price', value: '₹1000', tone: 'yellow' }, // the colours used since screen 13
        { label: 'Selling Price', value: '₹800', tone: 'blue' },
        { label: 'Discount', value: '₹200', tone: 'red' },
      ],
      ops: ['−', '='],
    });
    const talk = await cornerSwifty(ctx, scene);

    await ctx.wait(700); // the definition card finishes fading away first
    fp.open();
    await ctx.wait(700);
    fp.showBook();
    await ctx.wait(1000);

    // Marked Price: the price printed on the book flies into the first box.
    fp.highlight();
    await ctx.wait(600);
    await fp.box(0, { empty: true });
    await ctx.wait(200);
    await fp.fly();
    await talk.say('f-mp', [{ t: 'The Marked Price\nis ' }, { t: '₹1000', em: true }, { t: '.' }], 700);

    // − Selling Price
    await ctx.wait(250);
    fp.op(0);
    await ctx.wait(350);
    await fp.box(1);
    await talk.say('f-sp', [{ t: 'Subtract the\nSelling Price, ' }, { t: '₹800', em: true }, { t: '.' }], 700);

    // = Discount
    await ctx.wait(250);
    fp.op(1);
    await ctx.wait(350);
    await fp.box(2, { stamp: true });
    const d = stageRect(fp.boxes[2]);
    FX.burst(scene.ui, d.left + d.width / 2, d.top + d.height / 2, { count: 16, dist: [120, 230], size: [12, 24] });
    await talk.say('f-d', [{ t: 'We get ' }, { t: '₹200', em: true }, { t: '.\nThat is the ' }, { t: 'Discount!', cls: 'key' }], 900);
    talk.line.emphasize();
    await ctx.wait(600);

    // The formula in words, one part at a time: each part lights up as she says it.
    await talk.show([{ t: 'Marked Price,', end: true }, { t: '\nminus Selling Price,', end: true }, { t: '\nequals Discount.' }]);
    const lit = [[fp.boxes[0]], [fp.ops[0], fp.boxes[1]], [fp.ops[1], fp.boxes[2]]];
    for (const [i, parts] of lit.entries()) {
      parts.forEach((part, k) => ctx.wait(k * 420).then(() => fp.ping(part), () => {}));
      await talk.part(`rule-${i + 1}`, i, 900);
    }
    await ctx.wait(400);
    fp.glow(2); // the Discount keeps glowing
    Sound.ding();
    ctx.advance(3000); // then the formula itself
  }

  // A screen over the blurred counter that starts out already blurred: during a dissolve from the screen
  // before (also blurred), only what was on top of it visibly changes.
  function blurredFromStart(scene) {
    el('div', 'fb-dim', scene.ui);
    hush(scene, true, { instant: true });
  }

  // Screens where Swifty teaches from her corner (18–21, 26–38, 39 as she leaves, and 41) start out blurred; coming from the screen
  // before in the same run, she is already in her corner.
  const GUIDE_FLOWS = [['discount-def', 'formula', 'formula-reveal', 'apply', 'summary'], ['recall', 'hundred', 'half', 'halved', 'quarter', 'quartered', 'idea', 'whatpercent', 'check',
    'sneakerq', 'thirty', 'represent', 'topay', 'final', 'discountpct', 'sneakersum']];

  function setupGuide(scene) {
    blurredFromStart(scene);
    scene.bird = null;
    const carried = GUIDE_FLOWS.some(run => run.indexOf(scene.cameFrom) >= 0 && run.indexOf(scene.id) === run.indexOf(scene.cameFrom) + 1);
    if (!carried) return;
    scene.bird = new FX.Bird(scene.ui, SWIFTY, { scale: CORNER.s });
    scene.bird.place(CORNER.x, CORNER.y);
    scene.bird.shadowOn(true);
  }

  // Swifty in her corner, ready to talk (her bubbles go above her head): already there, or flying in now.
  async function cornerSwifty(ctx, scene) {
    let bird = scene.bird;
    if (!bird) {
      bird = new FX.Bird(scene.ui, SWIFTY, { scale: CORNER.s });
      bird.place(2140, CORNER.y - 300);
      await bird.flyTo(ctx, { x: CORNER.x, y: CORNER.y, s: CORNER.s, duration: 1300, lift: 100, ease: 'out' });
      await bird.land();
    }
    return swiftyTalk(ctx, scene.ui, bird, b => overHead(b, CORNER.bubbles));
  }

  // The formula: first in words on a pink strip, then in short. Swifty says it from her corner, part by
  // part as each part appears; the first letters of each term light up and fly down to make the short
  // form D = MP − SP; then she points at it, and a yellow note on it says "Use MP and SP."
  async function playFormulaReveal(ctx, scene) {
    const ui = scene.ui;
    const fr = FX.formulaReveal(ui, {
      terms: [
        { words: 'Discount', short: 'D', tone: 'd' }, // the colours used since screen 13
        { words: 'Marked Price', short: 'MP', tone: 'mp' },
        { words: 'Selling Price', short: 'SP', tone: 'sp' },
      ],
      ops: ['=', '−'],
    });
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;

    await ctx.wait(700); // the formula panel finishes fading away first
    fr.open();
    await ctx.wait(800);

    // In words, one part at a time.
    await talk.show([{ t: 'Discount', end: true }, { t: '\nequals Marked Price,', end: true }, { t: '\nminus Selling Price.' }]);
    fr.term(0);
    await talk.part('fr-1', 0, 700);
    fr.op(0);
    await ctx.wait(300);
    fr.term(1);
    await talk.part('fr-2', 1, 900);
    fr.op(1);
    await ctx.wait(300);
    fr.term(2);
    await talk.part('fr-3', 2, 900);
    await ctx.wait(600);

    // In short: each term's first letters fly down into the blue box.
    fr.showShort();
    await talk.say('fr-4', 'We can write it\nin short.', 900);
    await talk.show([{ t: 'D for Discount,', end: true }, { t: '\nMP for Marked Price,', end: true }, { t: '\nSP for Selling Price.' }]);
    for (let i = 0; i < 3; i++) {
      if (i) {
        fr.shortOp(i - 1);
        await ctx.wait(350);
      }
      fr.lightUp(i);
      const saying = talk.part(`fr-${5 + i}`, i, 800);
      saying.catch(() => {}); // if the player leaves mid-line, the waits below report it
      await ctx.wait(450);
      await fr.fly(i);
      await saying;
    }
    await ctx.wait(400);

    // The short form, read out: each part pops as she says it.
    await talk.show([{ t: 'So, D', end: true }, { t: ' = MP', end: true }, { t: ' − SP.' }]);
    const read = [[fr.shortTerms[0]], [fr.shortOps[0], fr.shortTerms[1]], [fr.shortOps[1], fr.shortTerms[2]]];
    for (const [i, pieces] of read.entries()) {
      pieces.forEach((piece, k) => ctx.wait(k * 420).then(() => fr.ping(piece), () => {}));
      await talk.part(`fr-${8 + i}`, i, 900);
    }
    await ctx.wait(500);

    // She points at it; her bubble goes and the note on it says the last line.
    bird.point();
    talk.line.hide();
    await ctx.wait(500);
    const box = stageRect(fr.shortBox);
    const noteX = box.left + box.width * 0.62;
    const note = FX.bubble(ui, {
      anchor: [noteX, box.bottom + 50], corner: 'tc', tip: [noteX, box.bottom + 10], lean: 0,
      text: 'Use MP and SP.', voice: 'bird', tone: 'yellow', rotate: -1.5,
    });
    await note.show();
    await Promise.all([speak(ctx, note, 'fr-use', 'bird', bird), ctx.wait(900)]);
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(2400); // then the formula is used on Aniket's book
  }

  // The formula used on Aniket's book, written out line by line, with Swifty saying each step from her
  // corner: the ₹1000 flies off the book's sticker into "Marked Price = ₹1000", then "Selling Price = ₹800";
  // in "Discount = ₹1000 − ₹800" the two prices fly down from the lines above; "= ₹200"; and the answer box
  // lands.
  async function playApply(ctx, scene) {
    const we = FX.workedExample(scene.ui, {
      price: '₹1000',
      rows: [
        { label: 'Marked Price', tone: 'mp', value: [{ t: '₹1000', tone: 'mp' }] }, // the colours used since screen 13
        { label: 'Selling Price', tone: 'sp', value: [{ t: '₹800', tone: 'sp' }] },
        'rule',
        { label: 'Discount', tone: 'd', value: [{ t: '₹1000', tone: 'mp' }, { t: '−', op: true }, { t: '₹800', tone: 'sp' }] },
        { value: [{ t: '₹200', tone: 'd' }] },
      ],
      answer: { label: 'Discount', value: '₹200' },
    });
    const talk = await cornerSwifty(ctx, scene);

    await ctx.wait(700); // the formula reveal finishes fading away first
    we.open();
    await ctx.wait(700);
    we.showBook();
    await talk.say('ap-0', 'Let’s find the discount\non Aniket’s book.', 1200);

    // Marked Price = ₹1000, straight off the book's sticker
    await we.write(0);
    we.highlight();
    await ctx.wait(400);
    await we.fromSticker(0, 0);
    await talk.say('ap-1', [{ t: 'Marked Price is ' }, { t: '₹1000', em: true }, { t: '.' }], 700);

    // Selling Price = ₹800
    await we.write(1);
    await we.show(1, 0);
    await talk.say('ap-2', [{ t: 'Selling Price is ' }, { t: '₹800', em: true }, { t: '.' }], 700);
    await we.rule(2);
    await ctx.wait(300);

    // Discount = ₹1000 − ₹800: the formula, with the prices brought down from the lines above
    await we.write(3);
    await talk.say('ap-3', 'Discount equals\nMarked Price minus\nSelling Price.', 1000);
    await talk.show([
      { t: '₹1000', em: true }, { t: ' minus ' }, { t: '₹800', em: true, end: true },
      { t: '\nequals ' }, { t: '₹200', em: true }, { t: '.' },
    ]);
    const saying = talk.part('ap-4', 0, 900);
    saying.catch(() => {}); // if the player leaves mid-line, the waits below report it
    await we.copy([0, 0], [3, 0]);
    await we.show(3, 1);
    await we.copy([1, 0], [3, 2]);
    await saying;
    await ctx.wait(300);

    // = ₹200
    await we.write(4);
    await we.show(4, 0, { stamp: true });
    await talk.part('ap-5', 1, 700);
    talk.line.emphasize();
    await ctx.wait(400);

    // The answer
    await we.answer();
    const a = stageRect(we.answerEl);
    FX.burst(scene.ui, a.left + a.width / 2, a.top + a.height / 2, { count: 18, dist: [130, 250], size: [12, 24] });
    await talk.say('ap-6', [{ t: 'So, the discount on\nthe book is ' }, { t: '₹200', em: true }, { t: '!' }], 900);
    talk.line.emphasize();
    ctx.advance(3000); // then a quick summary
  }

  // A quick summary. Swifty, in her corner, goes over the three terms one card at a time
  // (Marked Price → Selling Price → Discount), then the formula, each line in her speech bubble.
  async function playSummary(ctx, scene) {
    const ui = scene.ui;
    const sp = FX.summaryPanel(ui, {
      title: 'Let’s remember!',
      cards: [ // the colours used since screen 13
        { term: 'Marked Price', tone: 'mp', value: '₹1000', desc: 'Price written\non an item.' },
        { term: 'Selling Price', tone: 'sp', value: '₹800', desc: 'Price at which\nit is sold.' },
        { term: 'Discount', tone: 'd', value: '₹200', desc: 'Amount reduced from\nthe marked price.' },
      ],
      formula: [{ t: 'Discount', tone: 'd' }, { t: '=' }, { t: 'MP', tone: 'mp' }, { t: '−' }, { t: 'SP', tone: 'sp' }],
    });
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;

    await ctx.wait(700); // the worked example finishes fading away first
    sp.open();
    await ctx.wait(500);
    bird.wave();
    sp.title();
    await ctx.wait(300);
    await talk.say('sum-0', 'Let’s remember!', 900);
    await ctx.wait(300);

    const lines = [
      ['sum-1', [{ t: 'Marked Price', cls: 'tone-mp' }, { t: ' is the\nprice written\non an item.\nHere, ' }, { t: '₹1000', em: true }, { t: '.' }]],
      ['sum-2', [{ t: 'Selling Price', cls: 'tone-sp' }, { t: ' is the\nprice at which\nit is sold.\nHere, ' }, { t: '₹800', em: true }, { t: '.' }]],
      ['sum-3', [{ t: 'Discount', cls: 'tone-d' }, { t: ' is the\namount reduced from\nthe marked price.\nHere, ' }, { t: '₹200', em: true }, { t: '.' }]],
    ];
    for (const [i, [id, text]] of lines.entries()) {
      if (i) {
        await sp.arrow(i - 1);
        await ctx.wait(200);
      }
      await sp.card(ctx, i);
      await talk.say(id, text, 1600);
      await ctx.wait(400);
    }

    // And the formula.
    await sp.formula();
    const f = stageRect(sp.sum);
    FX.twinkles(ui, [[f.left - 8, f.top + 18], [f.right + 6, f.top + 30], [f.left + 40, f.bottom + 4], [f.right - 30, f.bottom + 2]]);
    Sound.sparkle();
    await talk.say('sum-4', [
      { t: 'And remember\nthe formula:\n' }, { t: 'Discount', cls: 'tone-d' }, { t: ' = ' },
      { t: 'MP', cls: 'tone-mp' }, { t: ' − ' }, { t: 'SP', cls: 'tone-sp' }, { t: '!' },
    ], 1400);
    bird.wave();
    await ctx.wait(800);
    ctx.advance(3000); // then Aniket's next find, at the shoe shop
  }

  // The blue sneakers on the stand in the shoe shop (stage px), for the light sweeping across them.
  const SNEAKERS = [[1130, 525], [1205, 468], [1290, 446], [1462, 452], [1482, 545], [1470, 578], [1138, 572]];

  // A new find: Aniket walks into a shoe shop in the mall, and a pair of blue sneakers on the stand catches
  // his eye.
  async function playSneakers(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 1305, 520, 460, 280, { cls: 'glow--book', delay: 0 });
    await ctx.wait(700);
    FX.shine(L, SNEAKERS, { duration: 1100, width: 160 });
    FX.twinkles(L, [[1150, 455], [1470, 445], [1305, 420], [1495, 560], [1120, 560]]);
    Sound.sparkle();
    await ctx.wait(800);
    const line = FX.bubble(L, {
      anchor: [652, 248], corner: 'bl', tip: [606, 280], // in the space beside his face, the tail at his mouth
      text: 'These sneakers\nlook good!', voice: 'boy', rotate: -1.5,
    });
    await line.show();
    await speak(ctx, line, 'sneakers', 'boy');
    ctx.advance(3000); // then a closer look
  }

  // Nothing to say here: Aniket comes up to the stand and points at the sneakers' ₹1800 price tag.
  async function playShoe(ctx) {
    await ctx.wait(600);
    ctx.advance(2600);
  }

  // The red "30% OFF" tag on the sneakers' stand: a glowing frame hugging it (stage px).
  const OFF_TAG = { x: 1383, y: 720, w: 150, h: 160, round: 22 };

  // No words: Aniket, hand on his chin, looks at the discount, and the red 30% OFF tag lights up.
  async function playDiscountTag(ctx, scene) {
    await ctx.wait(900);
    FX.ring(scene.layer, OFF_TAG);
    FX.twinkles(scene.layer, [[1300, 640], [1466, 648], [1470, 802], [1298, 798]]);
    Sound.sparkle();
    await ctx.wait(800);
    ctx.advance(2600);
  }

  // Coming from screen 24, the 30% OFF tag is still lit, exactly as it was.
  function setupConfused(scene) {
    scene.offRing = scene.cameFrom === 'tag' ? FX.ring(scene.layer, Object.assign({ instant: true }, OFF_TAG)) : null;
  }

  // Aniket is confused by the 30% OFF tag: first he wonders about it in a thought cloud, then, once it has
  // gone, he asks how much money will actually come off, in a speech bubble.
  const SHOE_THOUGHT = {
    at: [985, 200], tip: [708, 160], // the wall right of his head; the puffs rise from the side of his hair
    text: [{ t: 'What does\n' }, { t: '30% discount', cls: 'key' }, { t: '\nmean here?' }], voice: 'boy',
  };
  const SHOE_ASK = {
    anchor: [714, 296], corner: 'bl', tip: [652, 306], // right of his face, the tail at his mouth by his hand
    text: 'How much money\nwill actually\nbe reduced?', voice: 'boy', rotate: -1.5,
  };

  async function playConfused(ctx, scene) {
    if (!scene.offRing) {
      await ctx.wait(500);
      FX.ring(scene.layer, OFF_TAG);
      Sound.sparkle();
    }
    await ctx.wait(700);
    const wondering = FX.thought(scene.layer, SHOE_THOUGHT);
    await wondering.show();
    await speak(ctx, wondering, 'shoe-think', 'boy');
    wondering.emphasize();
    await ctx.wait(1400);

    await wondering.hide();
    await ctx.wait(250);
    const ask = FX.bubble(scene.layer, SHOE_ASK);
    await ask.show();
    await speak(ctx, ask, 'shoe-ask', 'boy');
    ctx.advance(3000); // Swifty comes to help
  }

  // Swifty comes to help. Coming from screen 25 the picture, the lit tag and Aniket's question are first
  // exactly as they were; then his bubble goes, the shop blurs, and a card with the sneakers, their ₹1800
  // price tag and their 30% OFF tag springs up. Swifty flies in to her corner, points at it and says
  // what comes next.
  const SNEAKER_CARD = { photo: ASSETS + 'ui/sneakers.png', price: '₹1800', off: ['30%', 'OFF'] };

  function setupRecall(scene) {
    el('div', 'fb-dim', scene.ui);
    scene.bird = null; // she flies in (see cornerSwifty)
    scene.oldAsk = null;
    scene.oldRing = null;
    if (scene.cameFrom !== 'confused') return;
    scene.oldRing = FX.ring(scene.layer, Object.assign({ instant: true }, OFF_TAG));
    scene.oldAsk = FX.bubble(scene.layer, SHOE_ASK);
    scene.oldAsk.showNow();
  }

  async function playRecall(ctx, scene) {
    if (scene.oldAsk) {
      await ctx.wait(500);
      scene.oldAsk.hide();
    }
    await ctx.wait(300);
    hush(scene, true);
    if (scene.oldRing) { // only the tag on the card glows from now on
      const ring = scene.oldRing;
      FX.settle(ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' })).then(() => ring.remove());
    }
    await ctx.wait(600);

    // The card: the sneakers, then their price tag, then the discount tag lands like a stamp and glows.
    const card = FX.productCard(scene.ui, SNEAKER_CARD);
    card.open();
    await ctx.wait(600);
    await card.showPhoto();
    await ctx.wait(300);
    await card.showPrice();
    await ctx.wait(350);
    await card.showOff();
    await ctx.wait(500);

    // Swifty flies in to her corner, waves, and points at the card while she talks.
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    bird.wave();
    await ctx.wait(700);
    bird.point();
    await ctx.wait(500);
    await talk.show([
      { t: 'To find the\n' }, { t: 'discount amount', cls: 'key' }, { t: ',', end: true },
      { t: '\nlet’s first recall\nhow ' }, { t: 'percentages', cls: 'key' }, { t: ' work.' },
    ]);
    card.ping(card.offTag); // the discount
    await talk.part('recall-1', 0, 600);
    card.ping(card.percent); // the 30%
    await talk.part('recall-2', 1, 600);
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0); // upright again, as she is when the next screen starts
    bird.idle();
    ctx.advance(3000); // then percentages, from the start
  }

  // Percentages, from the start. Over the same blurred shop, with Swifty still in her corner, the card
  // dissolves away and a table springs up: Percentage | Amount. Swifty says "Suppose ₹500 represents 100%."
  // while ₹500 and 100% pop into it, and the row flashes: the two belong together.
  const HUNDRED_LINE = [{ t: 'Suppose ' }, { t: '₹500', em: true, end: true }, { t: '\nrepresents ' }, { t: '100%', em: true }, { t: '.' }];

  async function playHundred(ctx, scene) {
    const table = FX.percentTable(scene.ui, { cols: ['Percentage', 'Amount'], rows: [{ cells: ['100%', '₹500'] }] });
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 26
    const bird = talk.bird;

    await ctx.wait(700); // the card finishes fading away first
    table.open();
    await ctx.wait(600);
    await table.head();
    await ctx.wait(400);
    bird.point();
    await ctx.wait(500);

    // Her line, in two parts; each value pops into the table as she says it.
    await talk.show(HUNDRED_LINE);
    const amount = talk.part('hundred-1', 0, 600);
    amount.catch(() => {}); // if the player leaves mid-line, the wait below reports it
    await ctx.wait(420);    // as "₹500" is typed
    table.cell(0, 1);
    await amount;
    const percent = talk.part('hundred-2', 1, 600);
    percent.catch(() => {});
    await ctx.wait(520);    // as "100%" is typed
    table.cell(0, 0);
    await percent;
    await ctx.wait(300);
    table.link(0);
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then a question about it
  }

  // "What is 50% of ₹500?" Coming from screen 27 the table, Swifty and her bubble are first exactly as they
  // were. Her bubble goes; the table grows two rows (and glides up to make room); the question drops in above
  // it and Swifty reads it out; 100% → ÷ 2 → 50% and ₹500 → ÷ 2 → ? are filled in; and three answers slide in
  // under it. Whichever the player picks, Swifty then explains, the ? becomes ₹250, and a Next button follows.
  const HALF_TABLE = {
    cols: ['Percentage', 'Amount'],
    rows: [
      { cells: ['100%', '₹500'] },
      { step: '÷ 2', closed: true },
      { cells: ['50%', '?'], tones: ['result', 'ask'], closed: true },
    ],
    title: 'What is 50% of ₹500?',
  };
  const HALF_ANSWERS = [{ label: '₹250', correct: true }, { label: '₹300' }, { label: '₹400' }];

  function setupHalf(scene) {
    setupGuide(scene); // blurred, and coming from screen 27 Swifty is already in her corner
    scene.table = FX.percentTable(scene.ui, HALF_TABLE);
    scene.oldLine = null;
    if (scene.cameFrom !== 'hundred') return;
    scene.table.showNow(1);
    scene.oldLine = FX.bubble(scene.ui, Object.assign(overHead(scene.bird, CORNER.bubbles), { text: HUNDRED_LINE, voice: 'bird', rotate: 1.5 }));
    scene.oldLine.showNow();
  }

  async function playHalf(ctx, scene) {
    const t = scene.table;
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    if (scene.oldLine) {
      await ctx.wait(500);
      scene.oldLine.hide();
      await ctx.wait(300);
    } else { // reached some other way: the table builds up to screen 27's first
      await ctx.wait(400);
      t.open();
      await ctx.wait(600);
      await t.head();
      t.cell(0, 0);
      await ctx.wait(250);
      await t.cell(0, 1);
      await ctx.wait(500);
    }

    // Room for two more rows, then the question, read out by Swifty.
    await t.unfold([1, 2]);
    await ctx.wait(300);
    t.showTitle();
    await ctx.wait(300);
    bird.talk();
    await Promise.all([Voice.say('half-ask', 'What is 50% of ₹500?', 'bird'), ctx.wait(1200)]);
    bird.idle();
    await ctx.wait(400);

    // 100% ÷ 2 = 50% … so ₹500 ÷ 2 = ?
    await t.step(1, 0);
    await t.cell(2, 0);
    await ctx.wait(500);
    await t.step(1, 1);
    await t.cell(2, 1);
    await ctx.wait(500);

    // The answers; whichever the player picks, Swifty explains and the ? becomes ₹250.
    await percentQuestion(ctx, scene, t, talk, {
      options: HALF_ANSWERS,
      // Right: "Correct! ₹500 ÷ 2 = ₹250." (the ? becomes ₹250 as she says it)
      async right() {
        await talk.show([
          { t: 'Correct!', cls: 'stress', end: true },
          { t: '\n' }, { t: '₹500', em: true }, { t: ' ÷ 2 = ' }, { t: '₹250', em: true }, { t: '.' },
        ]);
        await talk.part('half-right-1', 0, 600);
        t.ping(1, 1); // the ÷ 2 under ₹500
        await partWith(ctx, talk, 'half-right-2', 1, 700, () => t.set(2, 1, '₹250', 'result'));
      },
      // Wrong: "Not quite! 100% ÷ 2 = 50%, so ₹500 ÷ 2 = ₹250." (each step pops as she says it; the ? becomes
      // ₹250 and the right answer lights up)
      async wrong(answers) {
        await talk.show([
          { t: 'Not quite!', end: true },
          { t: '\n' }, { t: '100%', em: true }, { t: ' ÷ 2 = ' }, { t: '50%', em: true }, { t: ',', end: true },
          { t: '\nso ' }, { t: '₹500', em: true }, { t: ' ÷ 2 = ' }, { t: '₹250', em: true }, { t: '.' },
        ]);
        await talk.part('half-wrong-1', 0, 600);
        t.ping(1, 0); // the ÷ 2 under 100%
        await partWith(ctx, talk, 'half-wrong-2', 1, 500, () => t.ping(2, 0));
        t.ping(1, 1); // the ÷ 2 under ₹500
        await partWith(ctx, talk, 'half-wrong-3', 2, 700, () => {
          t.set(2, 1, '₹250', 'result');
          answers.show(0);
        });
      },
      // Both ways: "So, 50% of ₹500 is ₹250." while the new row flashes.
      async so() {
        await talk.show([
          { t: 'So, ' }, { t: '50%', em: true }, { t: ' of ' }, { t: '₹500', em: true }, { t: '\nis ' }, { t: '₹250', em: true }, { t: '.' },
        ]);
        await partWith(ctx, talk, 'half-so', 0, 900, () => t.link(2));
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

  // The answers to a percentage question: they slide in under it (in a row, or { stack: true } in a column),
  // and Swifty points at them while the player picks one. Then she explains: right() after a right pick (with
  // sparkles), wrong(answers) after a wrong one (no second try: the player learns it and carries on), and
  // so(answers) either way. 3 seconds later the Next button appears level with the last answer, left of Swifty
  // in her corner. `t.below` is where the answers go.
  async function percentQuestion(ctx, scene, t, talk, { options, right, wrong, so, stack = false }) {
    const answers = FX.choices(t.below, {
      options,
      stack,
      onAnswer(correct, button) {
        explain(correct, button).catch(err => { if (err !== CANCELLED) console.error(err); });
      },
    });
    async function explain(correct, button) {
      if (correct) {
        const [x, y] = stagePoint(button);
        FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
        await ctx.wait(700);
        await right();
      } else {
        await ctx.wait(800); // let the shake and buzz land first
        await wrong(answers);
      }
      await ctx.wait(500);
      await so(answers);
      talk.line.emphasize();
      talk.bird.point();
      await ctx.wait(3000, { real: true });
      talk.bird.lean(0);
      talk.bird.idle();
      const last = stageRect(answers.buttons[answers.buttons.length - 1]);
      nextButton(scene, { right: 410, bottom: STAGE_H - (last.top + last.bottom) / 2 - 48 });
    }
    await answers.enter(ctx);
    talk.bird.point();
  }

  // The solution. Over the same blurred shop, with Swifty and the table exactly where they were, the question,
  // the answers and the Next button dissolve away. Swifty explains why: "We halved 100%, so we also halved
  // ₹500." (each ÷ 2 step pops as she says it, and ₹250 is marked as the answer); then the answer appears
  // under the table on a green bar with a tick.
  const HALVED_TABLE = {
    cols: ['Percentage', 'Amount'],
    rows: [
      { cells: ['100%', '₹500'] },
      { step: '÷ 2' },
      { cells: ['50%', '₹250'], tones: ['result', 'result'] },
    ],
  };
  const HALVED_LINE = [
    { t: 'We ' }, { t: 'halved', cls: 'key' }, { t: ' ' }, { t: '100%', em: true }, { t: ',', end: true },
    { t: '\nso we also\n' }, { t: 'halved', cls: 'key' }, { t: ' ' }, { t: '₹500', em: true }, { t: '.' },
  ];

  function setupHalved(scene) {
    setupGuide(scene); // blurred, and coming from screen 28 Swifty is already in her corner
    scene.table = FX.percentTable(scene.ui, HALVED_TABLE);
    scene.carried = scene.cameFrom === 'half';
    if (scene.carried) scene.table.showNow(3); // the table as screen 28 left it
  }

  async function playHalved(ctx, scene) {
    const t = scene.table;
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    if (scene.carried) {
      await ctx.wait(700); // the question and the answers finish fading away first
    } else { // reached some other way: the table builds up as it did on screen 28
      await ctx.wait(400);
      t.open();
      await ctx.wait(600);
      await t.head();
      t.cell(0, 0);
      await ctx.wait(250);
      await t.cell(0, 1);
      await ctx.wait(400);
      await t.step(1, 0);
      await t.cell(2, 0);
      await ctx.wait(300);
      await t.step(1, 1);
      await t.cell(2, 1);
      await ctx.wait(500);
    }

    // Why: each half pops as she says it, and ₹250 is marked as the answer.
    bird.point();
    await ctx.wait(500);
    await talk.show(HALVED_LINE);
    t.ping(1, 0); // the ÷ 2 under 100%
    await partWith(ctx, talk, 'halved-1', 0, 450, () => t.ping(2, 0)); // … and 50%
    t.ping(1, 1); // the ÷ 2 under ₹500
    await partWith(ctx, talk, 'halved-2', 1, 700, () => t.mark(2, 1)); // … and ₹250
    talk.line.emphasize();
    await ctx.wait(500);

    // The answer, on a green bar under the table.
    const bar = await t.conclude('50% of ₹500 = ₹250');
    const r = stageRect(bar);
    FX.twinkles(scene.ui, [[r.left - 6, r.top + 14], [r.right + 4, r.top + 26], [r.left + 30, r.bottom + 4], [r.right - 26, r.bottom + 2]]);
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then the next question
  }

  // "What is 25% of ₹500?" Coming from screen 29 the table, the green bar, Swifty and her bubble are first
  // exactly as they were. Her bubble and the bar go, and the table makes room for the new question: 50% | ₹250
  // turns plain again, the first ÷ 2 folds away (100% and 50% now sit one above the other), a new ÷ 2 and a
  // 25% | ? row open under them, and the whole table eases a little smaller to fit. Then the question, the ÷ 2
  // steps and the answers, as on screen 28.
  const QUARTER_FIT = { scale: 0.9, lift: 24 }; // four rows, with the question above and the answers below
  const quarterTable = carried => ({
    cols: ['Percentage', 'Amount'],
    rows: [
      { cells: ['100%', '₹500'] },
      { step: '÷ 2', closed: !carried },                                       // screen 29's step: it folds away
      { cells: ['50%', '₹250'], tones: carried ? ['result', 'result'] : null }, // it turns plain
      { step: '÷ 2', closed: carried },
      { cells: ['25%', '?'], tones: ['result', 'ask'], closed: carried },
    ],
    title: 'What is 25% of ₹500?',
  });

  function setupQuarter(scene) {
    setupGuide(scene); // blurred, and coming from screen 29 Swifty is already in her corner
    scene.carried = scene.cameFrom === 'halved';
    const t = scene.table = FX.percentTable(scene.ui, quarterTable(scene.carried));
    scene.oldLine = null;
    if (!scene.carried) {
      t.fit(QUARTER_FIT.scale, { lift: QUARTER_FIT.lift, instant: true });
      return;
    }
    t.showNow(3); // the table as screen 29 left it
    t.mark(2, 1, { instant: true });
    t.conclude('50% of ₹500 = ₹250', { instant: true });
    scene.oldLine = FX.bubble(scene.ui, Object.assign(overHead(scene.bird, CORNER.bubbles), { text: HALVED_LINE, voice: 'bird', rotate: 1.5 }));
    scene.oldLine.showNow();
  }

  async function playQuarter(ctx, scene) {
    const t = scene.table;
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    if (scene.carried) {
      // Room for the new question.
      await ctx.wait(500);
      scene.oldLine.hide();
      t.clearBelow();
      await ctx.wait(400);
      t.retone(2, null);        // 50% | ₹250 turns plain…
      await Promise.all([
        t.fold([1]),             // …the old ÷ 2 folds away…
        t.unfold([3, 4]),        // …the new rows open under them…
        t.fit(QUARTER_FIT.scale, { lift: QUARTER_FIT.lift }), // …and the table eases a little smaller to fit.
      ]);
      t.unmark(2, 1);
      await ctx.wait(500);
    } else { // reached some other way: the table builds up as screen 29 left it, without its first step
      await ctx.wait(400);
      t.open();
      await ctx.wait(600);
      await t.head();
      t.cell(0, 0);
      await ctx.wait(250);
      await t.cell(0, 1);
      await ctx.wait(300);
      t.cell(2, 0);
      await ctx.wait(250);
      await t.cell(2, 1);
      await ctx.wait(500);
    }

    // The question, read out by Swifty.
    t.showTitle();
    await ctx.wait(300);
    bird.talk();
    await Promise.all([Voice.say('quarter-ask', 'What is 25% of ₹500?', 'bird'), ctx.wait(1200)]);
    bird.idle();
    await ctx.wait(400);

    // 50% ÷ 2 = 25% … so ₹250 ÷ 2 = ?
    await t.step(3, 0);
    await t.cell(4, 0);
    await ctx.wait(500);
    await t.step(3, 1);
    await t.cell(4, 1);
    await ctx.wait(500);

    await percentQuestion(ctx, scene, t, talk, {
      options: [{ label: '₹100' }, { label: '₹125', correct: true }, { label: '₹250' }],
      // Right: "Correct! ₹250 ÷ 2 = ₹125." (the ? becomes ₹125 as she says it)
      async right() {
        await talk.show([
          { t: 'Correct!', cls: 'stress', end: true },
          { t: '\n' }, { t: '₹250', em: true }, { t: ' ÷ 2 = ' }, { t: '₹125', em: true }, { t: '.' },
        ]);
        await talk.part('quarter-right-1', 0, 600);
        t.ping(3, 1); // the ÷ 2 under ₹250
        await partWith(ctx, talk, 'quarter-right-2', 1, 700, () => t.set(4, 1, '₹125', 'result'));
      },
      // Wrong: "Not quite! 50% ÷ 2 = 25%, so ₹250 ÷ 2 = ₹125." (each step pops as she says it; the ? becomes
      // ₹125 and the right answer lights up)
      async wrong(answers) {
        await talk.show([
          { t: 'Not quite!', end: true },
          { t: '\n' }, { t: '50%', em: true }, { t: ' ÷ 2 = ' }, { t: '25%', em: true }, { t: ',', end: true },
          { t: '\nso ' }, { t: '₹250', em: true }, { t: ' ÷ 2 = ' }, { t: '₹125', em: true }, { t: '.' },
        ]);
        await talk.part('quarter-wrong-1', 0, 600);
        t.ping(2, 0); // 50%
        t.ping(3, 0); // the ÷ 2 under it
        await partWith(ctx, talk, 'quarter-wrong-2', 1, 500, () => t.ping(4, 0));
        t.ping(2, 1); // ₹250
        t.ping(3, 1); // the ÷ 2 under it
        await partWith(ctx, talk, 'quarter-wrong-3', 2, 700, () => {
          t.set(4, 1, '₹125', 'result');
          answers.show(1);
        });
      },
      // Both ways: "So, 25% of ₹500 is ₹125." while the new row flashes.
      async so() {
        await talk.show([
          { t: 'So, ' }, { t: '25%', em: true }, { t: ' of ' }, { t: '₹500', em: true }, { t: '\nis ' }, { t: '₹125', em: true }, { t: '.' },
        ]);
        await partWith(ctx, talk, 'quarter-so', 0, 900, () => t.link(4));
      },
    });
  }

  // The solution for 25%. Over the same blurred shop, with Swifty and the table (still at 90%) exactly where
  // they were, the question, the answers and the Next button dissolve away. Swifty: "The same operation is
  // applied to both sides." (the two ÷ 2 steps pop on "same operation", the two column names on "both sides");
  // ₹125 is marked as the answer, and the answer appears under the table on a green bar.
  const QUARTERED_TABLE = {
    cols: ['Percentage', 'Amount'],
    rows: [
      { cells: ['100%', '₹500'] },
      { cells: ['50%', '₹250'] },
      { step: '÷ 2' },
      { cells: ['25%', '₹125'], tones: ['result', 'result'] },
    ],
  };
  const QUARTERED_LINE = [
    { t: 'The ' }, { t: 'same operation', cls: 'key', end: true },
    { t: '\nis applied to\nboth sides.' },
  ];

  function setupQuartered(scene) {
    setupGuide(scene); // blurred, and coming from screen 30 Swifty is already in her corner
    const t = scene.table = FX.percentTable(scene.ui, QUARTERED_TABLE);
    t.fit(QUARTER_FIT.scale, { lift: QUARTER_FIT.lift, instant: true }); // the size screen 30 left it at
    scene.carried = scene.cameFrom === 'quarter';
    if (scene.carried) t.showNow(4); // the table as screen 30 left it
  }

  async function playQuartered(ctx, scene) {
    const t = scene.table;
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    if (scene.carried) {
      await ctx.wait(700); // the question and the answers finish fading away first
    } else { // reached some other way: the table builds up as it did on screen 30
      await ctx.wait(400);
      t.open();
      await ctx.wait(600);
      await t.head();
      t.cell(0, 0);
      await ctx.wait(250);
      await t.cell(0, 1);
      await ctx.wait(300);
      t.cell(1, 0);
      await ctx.wait(250);
      await t.cell(1, 1);
      await ctx.wait(400);
      await t.step(2, 0);
      await t.cell(3, 0);
      await ctx.wait(300);
      await t.step(2, 1);
      await t.cell(3, 1);
      await ctx.wait(500);
    }

    // Why: the same operation (÷ 2) on both sides of the table.
    bird.point();
    await ctx.wait(500);
    await talk.show(QUARTERED_LINE);
    t.ping(2, 0); // both ÷ 2 steps: the same operation
    t.ping(2, 1);
    await talk.part('quartered-1', 0, 600);
    await partWith(ctx, talk, 'quartered-2', 1, 600, () => { // both sides: the two columns
      t.pingHead(0);
      t.pingHead(1);
    });
    t.ping(3, 0); // 25% …
    await t.mark(3, 1); // … and ₹125, marked as the answer
    talk.line.emphasize();
    await ctx.wait(500);

    // The answer, on a green bar under the table.
    const bar = await t.conclude('25% of ₹500 = ₹125');
    const r = stageRect(bar);
    FX.twinkles(scene.ui, [[r.left - 6, r.top + 14], [r.right + 4, r.top + 26], [r.left + 30, r.bottom + 4], [r.right - 26, r.bottom + 2]]);
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then the general idea
  }

  // The general idea of percentage. Over the same blurred shop, with Swifty in her corner, the table dissolves
  // away and a panel of pairs springs up, built one pair at a time: Part ↔ Percentage, then Whole ↔ 100%.
  // Swifty: "Percentage tells us how much of the whole we are considering." — "Percentage" pops, then the
  // whole and its 100% as she says "the whole", then the part and its percentage on "we are considering".
  const IDEA_PAIRS = [
    { left: { text: 'Part', tone: 'part' }, right: { text: 'Percentage', tone: 'pct' } },
    { left: { text: 'Whole', tone: 'whole' }, right: { text: '100%', tone: 'pct' } },
  ];

  async function playIdea(ctx, scene) {
    const pairs = FX.pairsPanel(scene.ui, { rows: IDEA_PAIRS });
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 31
    const bird = talk.bird;
    await ctx.wait(700); // the table finishes fading away first
    pairs.open();
    await ctx.wait(600);
    await pairs.row(0);
    await ctx.wait(300);
    await pairs.row(1);
    await ctx.wait(600);

    bird.point();
    await ctx.wait(500);
    await talk.show([
      { t: 'Percentage', cls: 'key' }, { t: ' tells us\nhow much of the whole', end: true },
      { t: '\nwe are considering.' },
    ]);
    const saying = talk.part('idea-1', 0, 600);
    saying.catch(() => {}); // if the player leaves mid-line, the waits below report it
    pairs.ping(0, 1);     // "Percentage" …
    await ctx.wait(1600); // … "of the whole": the whole and its 100%
    pairs.pingRow(1);
    await saying;
    await partWith(ctx, talk, 'idea-2', 1, 300, () => pairs.pingRow(0)); // "we are considering": the part, and its percentage
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then a question about it
  }

  // "₹125 is what percent of ₹500?" Over the same blurred shop, with Swifty in her corner, the pairs dissolve
  // away and a panel springs up: the question on a purple strip, the part and the whole in two boxes, and the
  // formula worked out line by line on a white sheet, each step in time with what Swifty says. The part is
  // blue and the whole green everywhere: in the question, the boxes, the formula and her bubbles.
  const WHAT_PERCENT = {
    question: [{ t: '₹125', role: 'part' }, { t: ' is what percent of ' }, { t: '₹500', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: '₹125' },
    whole: { label: 'Whole', value: '₹500' },
    numbers: ['125', '500'],
    answer: '25%',
  };

  async function playWhatPercent(ctx, scene) {
    const f = FX.percentFormula(scene.ui, WHAT_PERCENT);
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 32
    const bird = talk.bird;
    await ctx.wait(700); // the pairs finish fading away first
    f.open();
    await ctx.wait(600);
    await f.showQuestion();
    await ctx.wait(300);
    bird.talk(); // she reads the question out (its words are on the strip)
    await Promise.all([Voice.say('wp-ask', '₹125 is what percent of ₹500?', 'bird'), ctx.wait(1400)]);
    bird.idle();
    await ctx.wait(400);
    bird.point();
    await ctx.wait(400);

    // Which is the part and which the whole: each amount in the question takes its colour, and its box pops in.
    await talk.show([
      { t: '₹125', cls: 'tone-part' }, { t: ' is the ' }, { t: 'part', cls: 'tone-part' }, { t: ',', end: true },
      { t: '\nand ' }, { t: '₹500', cls: 'tone-whole' }, { t: ' is the ' }, { t: 'whole', cls: 'tone-whole' }, { t: '.' },
    ]);
    f.tag('part');
    await partWith(ctx, talk, 'wp-part', 0, 700, () => f.box('part'));
    f.tag('whole');
    await partWith(ctx, talk, 'wp-whole', 1, 800, () => f.box('whole'));
    await ctx.wait(500);

    // The formula, written in as she explains it.
    await talk.show([
      { t: 'To find the ' }, { t: 'percentage', cls: 'key' }, { t: ',', end: true },
      { t: '\ndivide the ' }, { t: 'part', cls: 'tone-part' }, { t: '\nby the ' }, { t: 'whole', cls: 'tone-whole' }, { t: ',', end: true },
      { t: ' then\nmultiply by 100.' },
    ]);
    await partWith(ctx, talk, 'wp-rule-1', 0, 500, () => f.label());
    await partWith(ctx, talk, 'wp-rule-2', 1, 400, () => f.fraction());
    await partWith(ctx, talk, 'wp-rule-3', 2, 700, () => f.times(0));
    await ctx.wait(500);

    // The part goes on top and the whole below: their numbers fly out of the boxes into the next line.
    await f.start(1);
    await ctx.wait(300);
    await talk.show([
      { t: 'Put the ' }, { t: 'part', cls: 'tone-part' }, { t: ' on top,', end: true },
      { t: '\nand the ' }, { t: 'whole', cls: 'tone-whole' }, { t: ' below.' },
    ]);
    let flying = null;
    await partWith(ctx, talk, 'wp-put-1', 0, 500, () => {
      f.hint();
      flying = f.fly('part');
    });
    await flying;
    await partWith(ctx, talk, 'wp-put-2', 1, 500, () => { flying = f.fly('whole'); });
    await flying;
    await f.times(1);
    await ctx.wait(600);

    // Work it out: = 25%, the answer.
    await talk.show([
      { t: '125', cls: 'tone-part' }, { t: ' ÷ ' }, { t: '500', cls: 'tone-whole' }, { t: ' × 100', end: true },
      { t: '\n= ' }, { t: '25%', em: true }, { t: '.', end: true },
      { t: '\nSo, ' }, { t: '₹125', cls: 'tone-part' }, { t: ' is\n' }, { t: '25%', em: true }, { t: ' of ' }, { t: '₹500', cls: 'tone-whole' }, { t: '!' },
    ]);
    await talk.part('wp-work', 0, 600);
    await f.start(2);
    await partWith(ctx, talk, 'wp-equals', 1, 350, () => f.answer());
    await partWith(ctx, talk, 'wp-so', 2, 900, () => {
      f.mark();
      f.tag('part');
      f.tag('whole');
      const a = stageRect(f.answerEl);
      FX.twinkles(scene.ui, [[a.left - 30, a.top + 6], [a.right + 26, a.top + 14], [a.left - 18, a.bottom], [a.right + 16, a.bottom + 6]]);
      Sound.sparkle();
    });
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then a quick check
  }

  // A quick check: "₹150 is what percent of ₹600?" Over the same blurred shop, with Swifty in her corner, the
  // formula dissolves away and a panel springs up with the question on its purple strip; Swifty reads it out
  // and three answers slide in under it, one above the other. Whichever the player picks, she explains it the
  // way screen 33 worked it out: the part and the whole take their colours in the question as she names them.
  const CHECK = {
    question: [{ t: '₹150', role: 'part' }, { t: ' is what percent of ' }, { t: '₹600', role: 'whole' }, { t: '?' }],
  };
  const CHECK_SUM = [{ t: '150', cls: 'tone-part' }, { t: ' ÷ ' }, { t: '600', cls: 'tone-whole' }, { t: ' × 100 = ' }, { t: '25%', em: true }, { t: '.' }];

  async function playCheck(ctx, scene) {
    const q = FX.questionPanel(scene.ui, CHECK);
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 33
    const bird = talk.bird;
    await ctx.wait(700); // the formula finishes fading away first
    q.open();
    await ctx.wait(600);
    await q.showQuestion();
    await ctx.wait(300);
    bird.talk(); // she reads the question out (its words are on the strip)
    await Promise.all([Voice.say('cfu-ask', '₹150 is what percent of ₹600?', 'bird'), ctx.wait(1400)]);
    bird.idle();
    await ctx.wait(400);

    await percentQuestion(ctx, scene, q, talk, {
      options: [{ label: '20%' }, { label: '25%', correct: true }, { label: '40%' }],
      stack: true,
      // Right: "Correct! 150 ÷ 600 × 100 = 25%." (the part and the whole take their colours as she says them)
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
      // Wrong: "Not quite! ₹150 is the part, ₹600 is the whole. 150 ÷ 600 × 100 = 25%." (each amount takes its
      // colour as she names it; then the right answer lights up)
      async wrong(answers) {
        await talk.show([
          { t: 'Not quite!', end: true },
          { t: '\n' }, { t: '₹150', cls: 'tone-part' }, { t: ' is the ' }, { t: 'part', cls: 'tone-part' }, { t: ',', end: true },
          { t: '\n' }, { t: '₹600', cls: 'tone-whole' }, { t: ' is the ' }, { t: 'whole', cls: 'tone-whole' }, { t: '.', end: true },
          { t: '\n' }, ...CHECK_SUM,
        ]);
        await talk.part('cfu-wrong-1', 0, 600);
        await partWith(ctx, talk, 'cfu-wrong-2', 1, 300, () => q.tag('part'));
        await partWith(ctx, talk, 'cfu-wrong-3', 2, 300, () => q.tag('whole'));
        await partWith(ctx, talk, 'cfu-wrong-4', 3, 1900, () => answers.show(1));
      },
      // Both ways: "So, ₹150 is 25% of ₹600." while the right answer and the two amounts pop.
      async so(answers) {
        await talk.show([
          { t: 'So, ' }, { t: '₹150', cls: 'tone-part' }, { t: ' is ' }, { t: '25%', em: true },
          { t: '\nof ' }, { t: '₹600', cls: 'tone-whole' }, { t: '.' },
        ]);
        await partWith(ctx, talk, 'cfu-so', 0, 700, () => {
          answers.ping(1);
          q.tag('part');
          q.tag('whole');
        });
      },
    });
  }

  // Back to the sneakers: the main question. Over the same blurred shop, with Swifty in her corner, the quick
  // check dissolves away and a panel springs up with the sneakers (their photo, the ₹1800 tag and the 30% OFF
  // tag) and the question "Now, what is 30% of ₹1800?", with three answers. Whichever the player picks, Swifty
  // gives the answer; the next three screens work it out (36), name it (37) and use it (38).
  async function playSneakerQuestion(ctx, scene) {
    const pq = FX.productQuestion(scene.ui, Object.assign({ question: 'Now, what is\n30% of ₹1800?' }, SNEAKER_CARD));
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 34
    const bird = talk.bird;
    await ctx.wait(700); // the quick check finishes fading away first
    pq.open();
    await ctx.wait(600);
    const showing = pq.showItem(ctx); // the sneakers, as she says it
    showing.catch(() => {}); // if the player leaves meanwhile, the waits below report it
    await talk.say('mq-back', 'Now, back to\nAniket’s sneakers!', 600);
    await showing;
    await ctx.wait(500);

    // The question: she reads it out (its words are on the strip), and the tags it is about pop.
    await talk.clear();
    await pq.showQuestion();
    await ctx.wait(300);
    bird.talk();
    const asking = Promise.all([Voice.say('mq-ask', 'Now, what is 30% of ₹1800?', 'bird'), ctx.wait(1500)]);
    asking.catch(() => {});
    await ctx.wait(800);
    pq.ping(pq.percent);
    await ctx.wait(500);
    pq.ping(pq.priceTag);
    await asking;
    bird.idle();
    await ctx.wait(400);

    await percentQuestion(ctx, scene, pq, talk, {
      options: [{ label: '₹360' }, { label: '₹540', correct: true }, { label: '₹720' }],
      stack: true,
      // Right: "Correct! 30% of ₹1800 is ₹540."
      async right() {
        await talk.show([
          { t: 'Correct!', cls: 'stress', end: true },
          { t: '\n' }, { t: '30%', em: true }, { t: ' of ' }, { t: '₹1800', em: true }, { t: '\nis ' }, { t: '₹540', em: true }, { t: '.' },
        ]);
        await talk.part('mq-right-1', 0, 600);
        await partWith(ctx, talk, 'mq-right-2', 1, 300, () => {
          pq.ping(pq.percent);
          pq.ping(pq.priceTag);
        });
      },
      // Wrong: "Not quite! 30% of ₹1800 is ₹540." (then the right answer lights up)
      async wrong(answers) {
        await talk.show([
          { t: 'Not quite!', end: true },
          { t: '\n' }, { t: '30%', em: true }, { t: ' of ' }, { t: '₹1800', em: true }, { t: '\nis ' }, { t: '₹540', em: true }, { t: '.' },
        ]);
        await talk.part('mq-wrong-1', 0, 600);
        await partWith(ctx, talk, 'mq-wrong-2', 1, 1300, () => answers.show(1));
      },
      // Both ways: "Let's see how to work it out!" (screen 36 does)
      async so(answers) {
        await talk.show('Let’s see how\nto work it out!');
        await partWith(ctx, talk, 'mq-so', 0, 500, () => answers.ping(1));
      },
    });
  }

  // 30% of ₹1800, worked out. Over the same blurred shop, with Swifty in her corner, the question dissolves away
  // and the working is written line by line on a sheet, in time with what she says:
  //   30% = 30/100,   30% of ₹1800 = 30/100 × 1800,   = ₹540 (marked as the answer).
  const THIRTY_SHEET = {
    big: true,
    rows: [
      { label: [{ t: '30%' }], parts: [{ frac: ['30', '100'], cls: 'tone-pct' }] },
      { label: [{ t: '30% of ₹1800' }], parts: [{ frac: ['30', '100'], cls: 'tone-pct' }, { t: '× 1800' }] },
      { parts: [{ answer: '₹540' }] },
    ],
  };

  async function playThirty(ctx, scene) {
    const w = FX.workedSheet(scene.ui, THIRTY_SHEET);
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 35
    const bird = talk.bird;
    await ctx.wait(700); // the question finishes fading away first
    w.open();
    await ctx.wait(700);
    bird.point();
    await ctx.wait(400);

    // 30% = 30/100
    await talk.show([{ t: '30%', em: true }, { t: ' means', end: true }, { t: '\n30 out of 100.' }]);
    await partWith(ctx, talk, 'th-1', 0, 200, () => w.write(0));
    await partWith(ctx, talk, 'th-2', 1, 300, () => w.part(0, 0));
    await ctx.wait(500);

    // 30% of ₹1800 = 30/100 × 1800
    await talk.show([
      { t: 'So, ' }, { t: '30%', em: true }, { t: ' of ' }, { t: '₹1800', em: true }, { t: ' =', end: true },
      { t: '\n' }, { t: '30/100', cls: 'tone-pct' }, { t: ' × 1800' },
    ]);
    await partWith(ctx, talk, 'th-3', 0, 200, () => w.write(1));
    let writing = null;
    await partWith(ctx, talk, 'th-4', 1, 300, () => { writing = w.part(1, 0).then(() => w.part(1, 1)); });
    await writing;
    await ctx.wait(500);

    // 1800 ÷ 100 = 18, and 18 × 30 = 540: the answer lands.
    const sum = w.rows[1].parts;
    await talk.show([
      { t: '1800 ÷ 100 = 18,', end: true },
      { t: '\nand 18 × 30 = 540.', end: true },
      { t: '\nSo, it’s ' }, { t: '₹540', em: true }, { t: '!' },
    ]);
    await partWith(ctx, talk, 'th-5', 0, 300, () => {
      w.ping(sum[1]);                              // × 1800
      w.ping(sum[0].querySelector('.pf-den'));     // and the 100
    });
    await partWith(ctx, talk, 'th-6', 1, 300, () => w.ping(sum[0].querySelector('.pf-num'))); // the 30
    await w.write(2);
    await partWith(ctx, talk, 'th-7', 2, 450, () => w.answer(2));
    w.mark(2);
    const a = stageRect(w.rows[2].parts[0]);
    FX.twinkles(scene.ui, [[a.left - 30, a.top + 6], [a.right + 26, a.top + 14], [a.left - 18, a.bottom], [a.right + 16, a.bottom + 6]]);
    Sound.sparkle();
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then what ₹540 is
  }

  // What does ₹540 represent? The working dissolves away and the sneakers panel springs up again, with the
  // question and three answers: Marked Price, Selling Price or Discount. Swifty then explains: it is the money
  // taken off ₹1800, the Discount.
  async function playRepresent(ctx, scene) {
    const pq = FX.productQuestion(scene.ui, Object.assign({ question: 'What does ₹540\nrepresent here?' }, SNEAKER_CARD));
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 36
    const bird = talk.bird;
    await ctx.wait(700); // the working finishes fading away first
    pq.open();
    await ctx.wait(600);
    await pq.showItem(ctx);
    await ctx.wait(400);
    await pq.showQuestion();
    await ctx.wait(300);
    bird.talk(); // she reads the question out (its words are on the strip)
    await Promise.all([Voice.say('rp-ask', 'What does ₹540 represent here?', 'bird'), ctx.wait(1400)]);
    bird.idle();
    await ctx.wait(400);

    const why = [{ t: '\n' }, { t: '₹540', em: true }, { t: ' is the money\ntaken off ' }, { t: '₹1800', em: true }, { t: '.' }];
    await percentQuestion(ctx, scene, pq, talk, {
      options: [{ label: 'Marked Price' }, { label: 'Selling Price' }, { label: 'Discount', correct: true }],
      stack: true,
      // Right: "Correct! ₹540 is the money taken off ₹1800." (the 30% OFF tag pops)
      async right() {
        await talk.show([{ t: 'Correct!', cls: 'stress', end: true }, ...why]);
        await talk.part('rp-right-1', 0, 600);
        await partWith(ctx, talk, 'rp-right-2', 1, 900, () => pq.ping(pq.offTag));
      },
      // Wrong: "Not quite! ₹540 is the money taken off ₹1800." (then the right answer lights up)
      async wrong(answers) {
        await talk.show([{ t: 'Not quite!', end: true }, ...why]);
        await talk.part('rp-wrong-1', 0, 600);
        await partWith(ctx, talk, 'rp-wrong-2', 1, 900, () => pq.ping(pq.offTag));
        answers.show(2);
      },
      // Both ways: "That's the Discount!"
      async so(answers) {
        await talk.show([{ t: 'That’s the\n' }, { t: 'Discount!', cls: 'key' }]);
        await partWith(ctx, talk, 'rp-so', 0, 500, () => {
          answers.ping(2);
          pq.ping(pq.offTag);
        });
      },
    });
  }

  // The amount to pay. The sneakers panel dissolves away and a worked solution springs up: Marked Price ₹1800 ↓
  // Discount ₹540 on the left; Swifty says how to find the amount to pay while SP = MP − Discount is written
  // in; ₹1800 and ₹540 glide out of their boxes into = 1800 − 540; and = ₹1260 lands, marked as the answer.
  const PAY_SHEET = {
    boxes: [
      { label: 'Marked Price (MP)', value: '₹1800', tone: 'yellow' }, // the colours used since screen 11
      { label: 'Discount', value: '₹540', tone: 'red' },
    ],
    rows: [
      { label: [{ t: 'SP', cls: 'tone-sp' }], band: true, parts: [{ t: 'MP', cls: 'tone-mp' }, { op: '−' }, { t: 'Discount', cls: 'tone-d' }] },
      { parts: [{ t: '1800', cls: 'tone-mp' }, { op: '−' }, { t: '540', cls: 'tone-d' }] },
      { parts: [{ answer: '₹1260' }] },
    ],
  };

  async function playToPay(ctx, scene) {
    const w = FX.workedSheet(scene.ui, PAY_SHEET);
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 37
    const bird = talk.bird;
    await ctx.wait(700); // the question finishes fading away first
    w.open();
    await ctx.wait(600);
    await w.box(0);
    await ctx.wait(300);
    await w.box(1);
    await ctx.wait(500);
    bird.point();
    await ctx.wait(400);

    // How to find the amount to pay (her line from the storyboard); the rule is written in as she says it.
    await talk.show([
      { t: 'To find how much\nyou have to pay,', end: true },
      { t: '\n' }, { t: 'subtract', cls: 'key' }, { t: ' the ' }, { t: 'discount', cls: 'tone-d' },
      { t: '\nfrom the ' }, { t: 'marked price', cls: 'tone-mp' }, { t: '.' },
    ]);
    await partWith(ctx, talk, 'pay-1', 0, 300, () => w.write(0));
    let writing = null;
    await partWith(ctx, talk, 'pay-2', 1, 200, () => {
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

    // 1800 − 540 = ₹1260: the two amounts glide out of their boxes into the next line.
    await talk.show([
      { t: '1800', cls: 'tone-mp' }, { t: ' − ' }, { t: '540', cls: 'tone-d', end: true },
      { t: '\n= ' }, { t: '₹1260', em: true }, { t: '.' },
    ]);
    await w.write(1);
    let flying = null;
    await partWith(ctx, talk, 'pay-3', 0, 200, () => {
      flying = (async () => {
        await w.fly(0, 1, 0);
        await w.part(1, 1);
        await w.fly(1, 1, 2);
      })();
    });
    await flying;
    await w.write(2);
    await partWith(ctx, talk, 'pay-4', 1, 350, () => w.answer(2));
    await ctx.wait(400);

    // So, you pay ₹1260.
    await talk.show([{ t: 'So, you pay ' }, { t: '₹1260', em: true }, { t: '\nfor the sneakers!' }]);
    await partWith(ctx, talk, 'pay-5', 0, 900, () => {
      w.mark(2);
      const a = stageRect(w.rows[2].parts[0]);
      FX.twinkles(scene.ui, [[a.left - 30, a.top + 6], [a.right + 26, a.top + 14], [a.left - 18, a.bottom], [a.right + 16, a.bottom + 6]]);
      Sound.sparkle();
    });
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then Aniket's final answer
  }

  // The final answer, in Aniket's words. Coming from screen 38, the worked solution dissolves away and Swifty,
  // her part done, waves and flies off; the blur lifts, and Aniket is at the stand, pointing at the tags. As he
  // says "So, after a 30% discount, I will pay ₹1260.", the 30% OFF tag lights up and a red line crosses out
  // the ₹1800, then a green ₹1260 tag stamps onto the stand.
  const STRIKE_1800 = { from: [1126, 750], to: [1304, 674] }; // across the "₹1800" on the white tag (stage px)
  const PAID_TAG = { x: 1238, y: 862, text: '₹1260' };        // on the stand's front, under both tags
  const FINAL_LINE = {
    anchor: [812, 300], corner: 'bl', tip: [712, 322], // right of his face, above the sneakers; the tail at his mouth
    text: [
      { t: 'So, after a ' }, { t: '30%', cls: 'key' }, { t: '\ndiscount,', end: true },
      { t: ' I will pay\n' }, { t: '₹1260', cls: 'tone-pay' }, { t: '.' },
    ],
    voice: 'boy', rotate: -1.5,
  };

  async function playFinal(ctx, scene) {
    if (scene.bird) { // coming from screen 38: Swifty's part is done
      const bird = scene.bird;
      await ctx.wait(700); // the worked solution finishes fading away first
      bird.wave();
      Sound.chirp();
      await ctx.wait(800);
      await bird.takeOff(ctx);
      bird.flyTo(ctx, { x: 2160, y: -90, duration: 1100, lift: 40, ease: 'in' }).then(() => bird.remove(), () => {});
      await ctx.wait(500);
    } else {
      await ctx.wait(400);
    }
    hush(scene, false); // the shop comes back into focus: Aniket, pointing at the tags
    await ctx.wait(1300);

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
    FX.twinkles(scene.layer, PAID_TWINKLES);
    Sound.chime();
    ctx.advance(3000); // then the discount percentage
  }
  const PAID_TWINKLES = [[PAID_TAG.x - 190, PAID_TAG.y - 40], [PAID_TAG.x + 190, PAID_TAG.y - 30], [PAID_TAG.x - 170, PAID_TAG.y + 50], [PAID_TAG.x + 180, PAID_TAG.y + 52]];

  // Discount percentage. Coming from screen 39, the shop, its updated tags and Aniket's line are first exactly
  // as they were; his bubble goes, the shop blurs, and Swifty flies back in to her corner. A worked sheet
  // springs up: as she says what discount percentage tells us, the rule Discount % = Discount / Marked Price
  // × 100 is written in on a yellow band; then the sneakers' discount, 540, and marked price, 1800, go into it,
  // and = 30% lands: the 30% off on the tag.
  const DISCOUNT_PERCENT_SHEET = {
    big: true,
    rows: [
      {
        label: [{ t: 'Discount %', cls: 'tone-d' }], band: 'yellow', // the colours used since screen 11
        parts: [{ frac: ['Discount', 'Marked Price'], top: 'tone-d', bottom: 'tone-mp' }, { t: '× 100' }],
      },
      { parts: [{ frac: ['540', '1800'], top: 'tone-d', bottom: 'tone-mp', split: true }, { t: '× 100' }] },
      { parts: [{ answer: '30%' }] },
    ],
  };

  // The shop as screen 39 left it: the ₹1800 crossed out, the 30% OFF tag framed, the green ₹1260 tag, and
  // (coming from 39) Aniket's line.
  function setupDiscountPercent(scene) {
    scene.bird = null; // Swifty flies back in
    FX.strike(scene.layer, STRIKE_1800).showNow();
    FX.ring(scene.layer, Object.assign({ instant: true }, OFF_TAG));
    FX.stickTag(scene.layer, PAID_TAG).showNow();
    scene.oldLine = null;
    if (scene.cameFrom !== 'final') return;
    FX.twinkles(scene.layer, PAID_TWINKLES);
    scene.oldLine = FX.bubble(scene.layer, FINAL_LINE);
    scene.oldLine.showNow();
  }

  async function playDiscountPercent(ctx, scene) {
    if (scene.oldLine) {
      await ctx.wait(500);
      scene.oldLine.hide();
    }
    await ctx.wait(400);
    el('div', 'fb-dim', scene.ui);
    hush(scene, true); // the shop blurs again
    await ctx.wait(700);
    const talk = await cornerSwifty(ctx, scene); // she flies back in
    const bird = talk.bird;
    bird.wave();
    const w = FX.workedSheet(scene.ui, DISCOUNT_PERCENT_SHEET);
    await ctx.wait(400);
    w.open();
    await ctx.wait(700);
    bird.point();
    await ctx.wait(400);

    // What discount percentage tells us (her line from the storyboard): the rule is written in as she says it.
    await talk.show([
      { t: 'Discount percentage', cls: 'key' }, { t: '\ntells us what percent', end: true },
      { t: '\nof the ' }, { t: 'marked price', cls: 'tone-mp' }, { t: '\nhas been reduced.' },
    ]);
    await partWith(ctx, talk, 'dp-1', 0, 300, () => w.write(0));
    let writing = null;
    await partWith(ctx, talk, 'dp-2', 1, 300, () => { writing = w.part(0, 0).then(() => w.part(0, 1)); });
    await writing;
    await ctx.wait(500);

    // The sneakers' numbers go into it: each pops in under its word.
    const words = w.rows[0].parts[0];
    const sum = w.rows[1].parts[0];
    await talk.show([
      { t: 'The ' }, { t: 'discount', cls: 'tone-d' }, { t: ' is ' }, { t: '₹540', em: true }, { t: ',', end: true },
      { t: '\nand the ' }, { t: 'marked price', cls: 'tone-mp' }, { t: '\nis ' }, { t: '₹1800', em: true }, { t: '.' },
    ]);
    await w.write(1);
    await w.part(1, 0); // the fraction bar
    await partWith(ctx, talk, 'dp-3', 0, 700, () => {
      w.ping(words.querySelector('.pf-num'));
      w.show(sum.querySelector('.pf-num'));
    });
    await partWith(ctx, talk, 'dp-4', 1, 1100, () => {
      w.ping(words.querySelector('.pf-den'));
      w.show(sum.querySelector('.pf-den'));
    });
    await w.part(1, 1); // × 100
    await ctx.wait(500);

    // Work it out: = 30%, the 30% off on the tag.
    await talk.show([
      { t: '540', cls: 'tone-d' }, { t: ' ÷ ' }, { t: '1800', cls: 'tone-mp' }, { t: ' × 100', end: true },
      { t: '\n= ' }, { t: '30%', em: true }, { t: '.', end: true },
      { t: '\nThat’s the ' }, { t: '30% off', cls: 'key' }, { t: '\non the tag!' },
    ]);
    await talk.part('dp-5', 0, 600);
    await w.write(2);
    await partWith(ctx, talk, 'dp-6', 1, 350, () => w.answer(2));
    await partWith(ctx, talk, 'dp-7', 2, 700, () => {
      w.mark(2);
      const a = stageRect(w.rows[2].parts[0]);
      FX.twinkles(scene.ui, [[a.left - 30, a.top + 6], [a.right + 26, a.top + 14], [a.left - 18, a.bottom], [a.right + 16, a.bottom + 6]]);
      Sound.sparkle();
    });
    talk.line.emphasize();
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000); // then the whole example, summed up
  }

  // The sneakers, summed up. Over the same blurred shop (its tags still updated), with Swifty in her corner, the
  // worked sheet dissolves away and a summary springs up: its title, a table of the four amounts, filled in row
  // by row as she says them, and the three rules, written in as she reads them. The colours are the ones used
  // since screen 11.
  const SNEAKER_SUMMARY = {
    title: 'Sneaker Example Summary',
    rows: [
      { label: 'Marked Price (MP)', value: '₹1800', tone: 'mp' },
      { label: 'Discount %', value: '30%', tone: 'd' },
      { label: 'Discount amount', value: '₹540', tone: 'd' },
      { label: 'Selling Price (SP)', value: '₹1260', tone: 'sp' },
    ],
    rules: [
      { label: [{ t: 'Discount', cls: 'tone-d' }], parts: [{ t: 'MP', cls: 'tone-mp' }, { op: '−' }, { t: 'SP', cls: 'tone-sp' }] },
      { label: [{ t: 'SP', cls: 'tone-sp' }], parts: [{ t: 'MP', cls: 'tone-mp' }, { op: '−' }, { t: 'Discount', cls: 'tone-d' }] },
      { label: [{ t: 'Discount %', cls: 'tone-d' }], parts: [{ frac: ['Discount', 'MP'], top: 'tone-d', bottom: 'tone-mp' }, { t: '× 100' }] },
    ],
  };

  // Blurred, Swifty in her corner (coming from screen 40), and the shop's tags as screens 39–40 left them.
  function setupSneakerSummary(scene) {
    setupGuide(scene);
    FX.strike(scene.layer, STRIKE_1800).showNow();
    FX.ring(scene.layer, Object.assign({ instant: true }, OFF_TAG));
    FX.stickTag(scene.layer, PAID_TAG).showNow();
  }

  async function playSneakerSummary(ctx, scene) {
    const sum = FX.summarySheet(scene.ui, SNEAKER_SUMMARY);
    const talk = await cornerSwifty(ctx, scene); // already there, coming from screen 40
    const bird = talk.bird;
    await ctx.wait(700); // the worked sheet finishes fading away first
    sum.open();
    await ctx.wait(500);
    bird.wave();
    sum.showTitle();
    await ctx.wait(300);
    await talk.say('ss-0', 'Let’s sum up\nthe sneakers!', 900);
    await ctx.wait(300);

    // The four amounts, row by row as she says them.
    bird.point();
    await sum.showTable();
    await talk.show([
      { t: 'Marked price', cls: 'tone-mp' }, { t: ': ' }, { t: '₹1800', em: true }, { t: '.', end: true },
      { t: '\n' }, { t: 'Discount', cls: 'tone-d' }, { t: ': ' }, { t: '30%', em: true }, { t: ',', end: true },
      { t: '\nwhich is ' }, { t: '₹540', em: true }, { t: '.', end: true },
      { t: '\n' }, { t: 'Selling price', cls: 'tone-sp' }, { t: ': ' }, { t: '₹1260', em: true }, { t: '.' },
    ]);
    for (let i = 0; i < SNEAKER_SUMMARY.rows.length; i++) {
      await partWith(ctx, talk, `ss-${i + 1}`, i, 400, () => sum.row(i));
      await ctx.wait(200);
    }
    await ctx.wait(400);

    // The three rules, written in as she reads them.
    await sum.showRules();
    await talk.show([
      { t: 'Discount', cls: 'tone-d' }, { t: ' = ' }, { t: 'MP', cls: 'tone-mp' }, { t: ' − ' }, { t: 'SP', cls: 'tone-sp' }, { t: ',', end: true },
      { t: '\n' }, { t: 'SP', cls: 'tone-sp' }, { t: ' = ' }, { t: 'MP', cls: 'tone-mp' }, { t: ' − ' }, { t: 'Discount', cls: 'tone-d' }, { t: ',', end: true },
      { t: '\nand ' }, { t: 'Discount %', cls: 'tone-d' }, { t: ' =\n' }, { t: 'Discount', cls: 'tone-d' }, { t: ' ÷ ' }, { t: 'MP', cls: 'tone-mp' }, { t: ' × 100.' },
    ]);
    for (let i = 0; i < SNEAKER_SUMMARY.rules.length; i++) {
      await partWith(ctx, talk, `ss-rule-${i + 1}`, i, 300, () => sum.rule(i));
      await ctx.wait(250);
    }
    await ctx.wait(500);

    // Well done!
    bird.wave();
    const r = stageRect(sum.panel);
    FX.twinkles(scene.ui, [[r.left + 20, r.top + 30], [r.right - 20, r.top + 40], [r.left + 30, r.bottom - 20], [r.right - 30, r.bottom - 30]]);
    Sound.sparkle();
    await talk.say('ss-end', 'Now you can work out\nany discount!', 900);
    bird.point();
    await ctx.wait(1500);
    bird.lean(0);
    bird.idle();
    ctx.advance(3000);
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
      // End of a scene: move on after `ms` × PACE (Next fills up as a timer), or wait for Next if auto-play is off.
      // The last screen waits for Replay instead.
      advance(ms) {
        if (!alive()) return;
        if (Game.index === LAST) return UI.setReady(true); // the story so far ends here: invite a replay
        Game.hold = { token, ms: ms * PACE };
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
    scene.el.classList.remove('is-leaving', 'is-entering', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting');
    scene.el.classList.add('is-active');
    if (mode === 'cut' && !reducedMotion) {
      void scene.el.offsetWidth; // restart the settle-in animation
      scene.el.classList.add('is-entering');
    }
    startCamera(scene, camera);
    if (camera) scene.parallax.style.transform = camera.parallax;
    if (scene.setup) scene.setup(scene);
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
    scene.el.classList.remove('is-active', 'is-entering', 'is-leaving', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting');
    scene.el.style.zIndex = '';
    scene.el.style.transitionDuration = '';
    if (scene.kbAnim) {
      scene.kbAnim.cancel();
      scene.kbAnim = null;
    }
    scene.layer.replaceChildren();
    scene.ui.replaceChildren();
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

  // Cross-fade only between these neighbouring screens (Good morning → leaving home, Bookstore → sees the
  // book → holds it → How Much?, question → closer look at his new book, and into the shoe shop → at the
  // sneakers' stand → the discount on them → his questions about it), both ways; and, going forward only, between screens
  // over the same blurred picture: the price panels (Marked Price → its definition → MP vs SP, so only their
  // right side changes), MP vs SP → the counter, the Discount definition → formula → formula reveal → worked example
  // → summary, the sneakers card → the percentage table, the 50% and 25% questions → their solutions, the
  // solution for 25% → the general idea → "what percent?" → a quick check → the sneakers' question → 30% of ₹1800
  // worked out → what ₹540 is → the amount to pay → the final answer; and the discount percentage → the summary.
  // Every other change is a straight cut.
  const FADES = [['morning', 'home'], ['outside', 'see'], ['see', 'browse'], ['browse', 'ask'], ['quiz', 'look'], ['sneakers', 'shoe'], ['shoe', 'tag'], ['tag', 'confused']];
  const FORWARD_FADES = [['mp', 'mpdef'], ['mpdef', 'compare'], ['compare', 'reveal'], ['discount-def', 'formula'], ['formula', 'formula-reveal'], ['formula-reveal', 'apply'], ['apply', 'summary'], ['recall', 'hundred'], ['half', 'halved'], ['quarter', 'quartered'], ['quartered', 'idea'], ['idea', 'whatpercent'], ['whatpercent', 'check'],
    ['check', 'sneakerq'], ['sneakerq', 'thirty'], ['thirty', 'represent'], ['represent', 'topay'], ['topay', 'final'], ['discountpct', 'sneakersum']];
  const FADE_MS = 1200 * PACE;
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
    SCENES.forEach(s => { s.el.style.zIndex = ''; });
  }

  function go(i) {
    if (i < 0 || i > LAST) return;
    stopScene();
    clearTimeout(Game.startTimer);
    UI.closePanel(true);
    settleTransition();
    const from = SCENES[Game.index];
    const to = SCENES[i];
    const forward = i === Game.index + 1;
    const changing = from && from !== to;
    const fade = changing && fadesBetween(from, to);
    // Same camera shot (4 ↔ 5, 7 → 8): carry the camera over so nothing jumps.
    const sameFraming = from && to && from.kb && to.kb && ['origin', 'from', 'to'].every(k => from.kb[k] === to.kb[k]);
    const carry = changing && from.shot && from.shot === to.shot && (forward || sameFraming);
    const camera = carry ? cameraOf(from) : null;
    to.cameFrom = from ? from.id : null; // lets a screen carry on from the one before it
    if (from && !fade) deactivate(from);
    Game.index = i;
    UI.update();

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
    const still = carry || reducedMotion;
    Game.fadeAnim = to.el.animate(
      still
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }],
      { duration: FADE_MS, easing: 'ease-in-out' }
    );
    if (!still) {
      from.el.classList.remove('is-entering');
      void from.el.offsetWidth;
      from.el.style.setProperty('--leave-scale', from.exit === 'zoom' && forward ? 1.3 : 1.05);
      from.el.style.transitionDuration = FADE_MS + 'ms'; // drift for as long as the fade lasts
      from.el.classList.add('is-leaving');
    }
    Game.leaving = from;
    Game.startTimer = setTimeout(() => run(to), FADE_MS * 0.45); // first beats land as the fade ends
    Game.fadeTimer = setTimeout(settleTransition, FADE_MS);
  }

  function next() {
    if (Game.index === 0) startStory();
    else if (Game.index >= LAST) go(1); // Replay
    else go(Game.index + 1);
  }

  function back() {
    if (Game.index > 0) go(Game.index - 1);
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
      [scene.bg, scene.react].filter(Boolean).forEach((src, i) => { // the picture, and a reaction to fade in over it
        const img = el('img', (scene.backdrop ? 'scene-bg scene-bg--feather' : 'scene-bg') + (i ? ' scene-react' : ''), scene.world);
        img.src = src;
        img.alt = '';
        img.draggable = false;
      });
      scene.ambient = el('div', 'scene-ambient', scene.world);
      scene.lamps.forEach(([x, y, r]) => FX.glow(scene.ambient, x, y, r, r * 0.8));
      if (!reducedMotion) FX.motes(scene.ambient, { area: scene.dust, count: 16 });
      scene.layer = el('div', 'scene-layer', scene.world);  // things placed on the picture (move with the camera)
      scene.ui = el('div', 'scene-ui', scene.el);           // on-screen things (the question card) that stay put
    });
  }

  function buildPanel() {
    const list = $('#scene-list');
    SCENES.forEach((scene, i) => {
      const li = el('li', '', list);
      const item = el('button', 'scene-item', li);
      item.type = 'button';
      el('span', 'si-num', item).textContent = scene.num;
      const thumb = el('span', 'si-thumb', item);
      const img = el('img', '', thumb);
      img.src = scene.react || scene.bg; // a screen's reaction picture shows best what it is about
      img.alt = '';
      el('span', 'si-now', thumb).textContent = 'NOW';
      const text = el('span', 'si-text', item);
      el('strong', '', text).textContent = scene.title;
      el('small', '', text).textContent = scene.sub;
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

    // Browsers only allow sound after a user gesture.
    window.addEventListener('pointerdown', Sound.unlock, true);
    window.addEventListener('keydown', Sound.unlock, true);

    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = document.activeElement && document.activeElement.tagName;
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
          if (tag === 'BUTTON' || tag === 'INPUT') return; // let the focused control handle it
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
      if (scene && !blurred && (moving || applied !== scene)) {
        p.x += (p.tx - p.x) * 0.06;
        p.y += (p.ty - p.y) * 0.06;
        scene.parallax.style.transform = `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px)`;
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
      ASSETS + 'start button.png', WALK_SHEET.src, SWIFTY.fly.src, SWIFTY.stand.src, ART.money, ART.book,
      ASSETS + 'ui/gate-leaf.png', ASSETS + 'ui/gate-gap.png', ASSETS + 'ui/sneakers.png'
    );
    const fonts = document.fonts
      ? Promise.race([document.fonts.load('800 40px "Baloo 2"', 'Ab₹'), sleep(2500)]).catch(() => {})
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
