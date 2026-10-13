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
  const TITLE_PLATE = [[150, 340], [860, 340], [884, 420], [862, 520], [800, 668], [200, 668], [128, 600], [108, 430]];
  const SHOP_SIGN = [[380, 148], [1885, 18], [1885, 172], [380, 292]];
  const MONEY = [[896, 534], [1011, 477], [1040, 498], [1062, 514], [1062, 612], [942, 624], [930, 600], [896, 560]];
  const PRICE_TAG = { x: 975, y: 404, text: '₹800', radius: 72 }; // small ₹800 just above the money
  const STICKER = { look: { x: 1049, y: 842, r: 84 }, shock: { x: 1108, y: 868, r: 106 } }; // ₹1000 on the cover

  // Where Swifty stands (her feet) on the teaching screens: on her stand in the bottom-right corner, with the panel
  // on her left and her speech bubbles above her head (kept between CORNER.bubbles). She stays there from
  // one screen to the next.
  const CORNER = { x: 1725, y: 910, s: 0.8, bubbles: [1380, 1848] }; // both feet on the top book; her bubbles stay on the panel's paper, clear of its edge

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
      id: 'home', title: 'Talking to Dad', sub: '“Dad, I want to buy a book and a new pair of sneakers…”',
      bg: ASSETS + 'starting boy talking with father.png',
      kb: { origin: '50% 28%', from: 'scale(1.02)', to: 'scale(1.05) translate(-4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[288, 360, 320]],    // the daylight through the open door
      dust: [180, 120, 1100, 760], // specks floating in the sunlight
      play: playHome,
    },
    {
      id: 'mall', title: 'At the Mall', sub: 'Aniket arrives at the mall',
      bg: ASSETS + 'mall outside view .png',
      still: true, // just the picture: no slow zoom, glowing lights, floating dust or shift with the mouse
      kb: null, origin: '50% 50%',
      lamps: [],
      dust: null,
      play: playMall,
    },
    {
      id: 'outside', title: 'The Bookstore', sub: 'Aniket walks to the store',
      bg: ASSETS + 'book store outside view.png',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]], // the wall lamp; ceiling lights behind the glass
      dust: [420, 260, 1840, 820],
      exit: 'zoom', zoomOrigin: '52% 56%', // 3 → 4: the camera pushes into the store while fading
      play: playOutside,
    },
    {
      id: 'see', title: 'He Sees a Book', sub: 'Aniket spots a book on the table',
      bg: ASSETS + 'aniket saw a book.png',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      shot: 'shelf', // same camera as screen 5, so the fade looks like he picks the book up
      setup: standTitles, // the names on the books on the stand
      play: playSee,
    },
    {
      id: 'browse', title: 'An Interesting Book', sub: '“This book looks interesting!”',
      bg: ASSETS + 'aniket hold the book scene.png',
      kb: { origin: '54% 40%', from: 'scale(1.02)', to: 'scale(1.08)' },
      lamps: [[1065, 140, 300], [1570, 116, 300]],
      dust: [200, 80, 1800, 800],
      shot: 'shelf',
      setup: standTitles,
      play: playBrowse,
    },
    {
      id: 'ask', title: 'How Much?', sub: '“How much is this book?”',
      bg: ASSETS + 'aniket give a book to shopkepper.png',
      kb: { origin: '50% 38%', from: 'scale(1.02)', to: 'scale(1.065) translate(-6px, 0)' },
      lamps: [[1472, 106, 330]],
      dust: [300, 60, 1500, 700],
      play: playAsk,
    },
    {
      id: 'pay', title: 'Paying ₹800', sub: 'Handing over the money',
      bg: ASSETS + 'aniket give money to shopkeeper.png',
      kb: { origin: '50% 46%', from: 'scale(1.02)', to: 'scale(1.075)' },
      lamps: [[1408, 86, 330]],
      dust: [300, 60, 1500, 700],
      shot: 'counter', // screen 8 carries on from this exact picture
      play: playPay,
    },
    {
      id: 'quiz', title: 'Cost or Selling?', sub: 'For the shopkeeper, ₹800 is the —',
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
      id: 'look', title: 'A Closer Look', sub: 'Aniket looks at the cover',
      bg: ASSETS + 'boy see the book .png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover', // the same view as screen 10 (from behind Aniket), so the cut there only changes his reaction
      play: playLook,
    },
    {
      id: 'shock', title: 'What Is This?', sub: '“₹1000? What is this?”',
      bg: ASSETS + 'shocked aniket.png',
      kb: { origin: '55% 80%', from: 'scale(1.02)', to: 'scale(1.065)' },
      lamps: [[1292, 128, 300]],
      dust: [150, 60, 1500, 760],
      shot: 'cover',
      play: playShock,
    },
    {
      id: 'mp', title: 'Marked Price', sub: '₹1000 is the price written on the book',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playMarked,
    },
    {
      id: 'mpdef', title: 'What Is Marked Price?', sub: 'The price printed on an article',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: scene => setupPricePanel(scene, { definition: MP_DEFINITION }),
      play: playDefine,
    },
    {
      id: 'compare', title: 'Compare MP and SP', sub: '₹1000 Marked Price, ₹800 Selling Price',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: scene => setupPricePanel(scene, {
        compare: {
          top: { price: '₹1000', label: 'Marked Price', tone: 'yellow' },
          bottom: { price: '₹800', label: 'Selling Price', tone: 'blue' },
        },
      }),
      play: playCompare,
    },
    {
      id: 'reveal', title: 'You Got a ₹200 Discount', sub: 'The shopkeeper explains the reduction',
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
      id: 'discount', title: 'What Is a Discount?', sub: '“Discount? What does that mean?”',
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
      id: 'discount-def', title: 'Discount Definition', sub: 'The reduction on the marked price',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupDiscountDef,
      play: playDiscountDef,
    },
    {
      id: 'formula', title: 'The Discount Formula', sub: 'Marked Price − Selling Price = Discount',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playFormula,
    },
    {
      id: 'formula-reveal', title: 'Formula Reveal', sub: 'D = MP − SP',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playFormulaReveal,
    },
    {
      id: 'summary', title: 'Quick Summary', sub: 'Let’s remember!',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playSummary,
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
      id: 'leave', title: 'To the Shoe Shop', sub: 'Aniket walks on to the sneakers shop',
      bg: ASSETS + 'book store outside view.png',
      kb: { origin: '50% 62%', from: 'scale(1.02)', to: 'scale(1.06) translate(-6px, -4px)' },
      lamps: [[167, 321, 230], [767, 334, 170], [1313, 299, 170], [1666, 275, 170]],
      dust: [420, 260, 1840, 820],
      shot: 'storefront',
      setup: setupLeave,
      play: playLeave,
    },
    {
      id: 'sneakers', title: 'The Shoe Shop', sub: '“These sneakers look good!”',
      bg: ASSETS + 'shoes shop enter.png',
      kb: { origin: '68% 48%', from: 'scale(1.02)', to: 'scale(1.07) translate(-10px, 0)' }, // eases in towards the sneakers
      lamps: [[1700, 180, 260], [1700, 380, 260], [175, 60, 200], [765, 66, 200]], // shelf lights, the mall's ceiling lights
      dust: [600, 40, 1900, 720],
      exit: 'zoom', zoomOrigin: '66% 56%', // 22 → 23: the camera pushes in on the sneakers while fading
      play: playSneakers,
    },
    {
      id: 'shoe', title: 'Tagged Price', sub: 'Aniket points at the ₹1800 tag',
      bg: ASSETS + 'he saw a shoe.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // eases in towards the price tags
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]], // shelf lights, a ceiling light
      dust: [600, 40, 1900, 720],
      shot: 'stand', // the same view as screen 24, so the fade there only changes Aniket
      play: playShoe,
    },
    {
      id: 'tag', title: '30% Off!', sub: 'He spots the discount',
      bg: ASSETS + 'hee see discount on shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screen 23
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      play: playDiscountTag,
    },
    {
      id: 'confused', title: 'What Does 30% Mean?', sub: '“How much money I actually have to pay?”',
      bg: ASSETS + 'he is tinking to see the shoes.png',
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' }, // as on screens 23–24
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
      setup: setupConfused,
      play: playConfused,
    },
    {
      id: 'offmeans', title: 'What 30% OFF Means', sub: '30% OFF means 30% Discount',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playOffMeans,
    },
    {
      id: 'recall', title: 'Recall Percentages', sub: '“Let’s first recall how percentages work.”',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playRecall,
    },
    {
      id: 'percentrule', title: 'Percentage Rule', sub: 'a is what percent of b?',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playPercentRule,
    },
    {
      id: 'whatpercent', title: 'What Percent?', sub: '125 is what percent of 500?',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playWhatPercent,
    },
    {
      id: 'check', title: 'Quick CFU', sub: '250 is what percent of 1000?',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playCheck,
    },
    {
      id: 'sneakerq', title: 'Back to the Sneakers', sub: '“Now, what is 30% of ₹1800?”',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playSneakerQuestion,
    },
    {
      id: 'thirty', title: 'Calculate 30% of ₹1800', sub: '30/100 × 1800 = ₹540',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playThirty,
    },
    {
      id: 'represent', title: 'What Does ₹540 Represent?', sub: 'Marked Price, Selling Price or Discount?',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playRepresent,
    },
    {
      id: 'topay', title: 'The Amount to Pay', sub: 'SP = MP − Discount = ₹1260',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playToPay,
    },
    {
      id: 'final', title: 'Final Answer', sub: '“After a 30% discount, I will pay ₹1260.”',
      bg: ASSETS + 'he saw a shoe.png', // the same view as screens 23–34: Aniket pointing at the tags
      kb: { origin: '63% 66%', from: 'scale(1.02)', to: 'scale(1.07)' },
      lamps: [[1740, 160, 260], [1740, 370, 260], [120, 60, 180]],
      dust: [600, 40, 1900, 720],
      shot: 'stand',
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
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playPercentOfMP,
    },
    {
      id: 'discountpct', title: 'Discount Percentage', sub: 'Discount % = Discount ÷ Marked Price × 100',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playDiscountPercent,
    },
    {
      id: 'sneakersum', title: 'Complete Summary', sub: 'Sneaker Example Summary',
      sheet: 'panel', still: true, kb: null, origin: '50% 50%', lamps: [], dust: null,
      setup: setupGuide,
      play: playSneakerSummary,
    },
    {
      id: 'return', title: 'Back Home', sub: '“How was your shopping?”',
      bg: ASSETS + 'boy return home .png',
      kb: { origin: '50% 30%', from: 'scale(1.02)', to: 'scale(1.05) translate(4px, 3px)' }, // a slow drift, both faces in view
      lamps: [[1030, 250, 300]],   // the daylight through the far window
      dust: [560, 80, 1300, 720],  // specks floating in the sunlight
      play: playReturn,
    },
    {
      id: 'school', title: 'School Starts Soon', sub: '“Your new school session starts in a few days.”',
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
      id: 'money', title: '₹5,000 to Spend', sub: '“Here’s ₹5,000.”',
      bg: ASSETS + 'father gave him money.png',
      kb: KB_TABLE, lamps: [[1856, 250, 300]], dust: [1100, 60, 1900, 640],
      shot: 'table', // the same view as screen 44, so the fade there only changes Aniket's hands
      play: playMoney,
    },
    {
      id: 'pocket', title: 'Into His Pocket', sub: 'Aniket puts the money away',
      bg: ASSETS + 'boy take money in his pocket.png',
      kb: KB_TABLE, lamps: [[1856, 250, 300]], dust: [1100, 60, 1900, 640],
      shot: 'table',
      play: playPocket,
    },
    {
      id: 'deal', title: 'Find the Best Deals', sub: '“Then I’m definitely finding the best offers!”',
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
      id: 'homeagain', title: 'Back Home', sub: '“Did you get everything?”',
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

  // At the mall: just the picture (Aniket in it, looking up at the entrance), held still. A straight cut then
  // finds him inside, walking up to the bookstore.
  async function playMall(ctx) {
    await ctx.wait(600);
    ctx.advance(3000); // then inside, to the bookstore
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

  // Coming out of the bookstore (the same view as screen 3): Aniket walks up to the doors inside the shop, seen through
  // the glass; the doors swing open (the shop's bell), and he walks out through them into the mall, coming closer.
  // The doors are there from the screen's first frame (setup).
  function setupExit(scene) {
    scene.doors = bookstoreDoors(scene.layer);
  }

  async function playExit(ctx, scene) {
    const L = scene.layer;
    const doors = scene.doors;
    const walker = new FX.Walker(L, WALK_SHEET);
    doors.under(walker.root); // inside the shop, behind the glass
    const inside = { x: 760, y: 822, s: 0.5 };      // inside the shop, by the left-hand door
    const atDoors = { x: 905, y: 830, s: 0.52 };    // at the doors
    walker.place(inside.x, inside.y, inside.s);
    walker.setFrame(WALK_SHEET.loop[0]);
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

  // On to the shoe shop (the same view): the doors stand open behind him, and Aniket walks off along the mall to the right,
  // coming a little closer as he goes. The open doors and Aniket, just out of them, are there from the screen's first
  // frame (setup), exactly as the screen before left them: so the dissolve between the two changes nothing.
  function setupLeave(scene) {
    bookstoreDoors(scene.layer, { open: true });
    const walker = new FX.Walker(scene.layer, WALK_SHEET);
    walker.place(OUT_OF_THE_DOORS.x, OUT_OF_THE_DOORS.y, OUT_OF_THE_DOORS.s);
    walker.setFrame(WALK_SHEET.idle);
    walker.idle(true);
    scene.walker = walker;
  }

  async function playLeave(ctx, scene) {
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
    ctx.advance(1200); // then on to the shoe shop
  }

  // The names of the three books on the display stand by the counter (screens 4 and 5 show the same stand in the
  // same place), each written on its cover as if printed there: centred in the cover's top part and slanted with it
  // (the books lean back on the stand). On the pictures' layer, so they move with the camera. x, y: the title's centre
  // (stage px); slant: how far the cover leans (deg); tone: light words (on the green and the night-blue covers) or
  // dark ones (on the pale sunset sky).
  const STAND_BOOKS = [
    { lines: ['Magic', 'Tree'], x: 1357, y: 679, slant: 12.8, tone: 'light' },
    { lines: ['Golden', 'Hills'], x: 1500, y: 684, slant: 10.7, tone: 'dark' },
    { lines: ['Starry', 'Nights'], x: 1638, y: 680, slant: 10, tone: 'light' },
  ];

  function standTitles(scene) {
    STAND_BOOKS.forEach(book => {
      const title = el('div', `cover-title cover-title--${book.tone}`, scene.layer);
      book.lines.forEach(line => { el('span', '', title).textContent = line; });
      Object.assign(title.style, { left: book.x + 'px', top: book.y + 'px', transform: `translate(-50%, -50%) skewX(${-book.slant}deg)` });
    });
  }

  // Nothing to say here: Aniket just looks at the book, then (fade) picks it up.
  async function playSee(ctx) {
    await ctx.wait(600);
    ctx.advance(2600);
  }

  async function playBrowse(ctx, scene) {
    const L = scene.layer;
    FX.glow(L, 1030, 510, 420, 420, { cls: 'glow--book', delay: 0 });
    FX.twinkles(L, [[895, 420], [1190, 380], [1205, 600], [880, 640], [1100, 345], [1150, 680]]);

    await ctx.wait(700);
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
      text: [{ t: "It's " }, { t: '₹800', em: true }, { t: '!' }], voice: 'man', rotate: 1.5,
    });
    await answer.show();
    await speak(ctx, answer, 'price', 'man');
    answer.emphasize();
    Sound.ding();
    ctx.advance(3000); // the shopkeeper holds the moment, then on to paying
  }

  // One part of a bubble split into parts (see FX.bubble), typed while it is spoken (in step with its recording).
  async function speakPart(ctx, line, part, id, words, who, speaker) {
    if (speaker) speaker.talk();
    await Promise.all([line.type(ctx, { part, blips: !Voice.available, seconds: Voice.seconds(words) }), Voice.say(id, words, who)]);
    if (speaker) speaker.idle();
  }

  // A speech bubble's line, typed out while the character's voice says it, in step with its recording (no
  // typing blips then). `speaker` (Swifty) moves her beak while she talks.
  async function speak(ctx, line, id, who, speaker) {
    if (speaker) speaker.talk();
    await Promise.all([line.type(ctx, { blips: !Voice.available, seconds: Voice.seconds(line.words) }), Voice.say(id, line.words, who)]);
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
    FX.glow(L, 978, 551, 420, 280, { cls: 'glow--money', delay: 0 });

    await ctx.wait(600);
    FX.shine(L, MONEY, { duration: 900, width: 140 });

    await ctx.wait(450);
    FX.badge(L, PRICE_TAG).pop(); // pop sound + a small ₹800 just above the money
    FX.burst(L, PRICE_TAG.x, PRICE_TAG.y, { count: 14, dist: [90, 170], size: [10, 20] });

    await ctx.wait(500);
    Sound.kaching();
    FX.burst(L, 978, 551, { count: 10, dist: [70, 140], size: [10, 18] });
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

    // The right side darkens softly so the card stands out.
    el('div', 'q-scrim', scene.ui);
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

  // An answer to the question is explained on the big panel, as on the teaching screens: it slides up over the
  // picture (under the card, `under`), with Swifty's stand on it. Leaving the screen, it slides back down (see go).
  function sheetUp(scene, under) {
    const sheet = el('div', 'scene-sheet');
    scene.ui.insertBefore(sheet, under);
    el('div', 'sheet-panel', sheet);
    const stand = el('img', 'sheet-stand', sheet);
    stand.src = STAND;
    stand.alt = '';
    stand.draggable = false;
    scene.el.classList.remove('is-asking');
    scene.el.classList.add('has-sheet');
    Sound.whoosh();
    if (reducedMotion) return;
    sheet.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(-1.2%)', offset: 0.78 }, { transform: 'none' }], {
      duration: SLIDE_MS, easing: 'cubic-bezier(.2,.7,.3,1)',
    });
  }

  // Under the answer on the big panel, clear of Swifty's stand.
  const NEXT_ON_SHEET = { right: 410, bottom: 52 };

  // Right answer: the big panel slides up and the card comes to its middle and turns over to say why; Swifty
  // flies in to her stand and reads it out, pointing at it, then flies off; a Next button moves the story on.
  async function answerRight(ctx, scene, card, button) {
    const [x, y] = stagePoint(button);
    FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
    await ctx.wait(700);
    sheetUp(scene, card.el);
    card.el.classList.add('is-center');
    await ctx.wait(reducedMotion ? 60 : 850);
    const why = 'The shopkeeper sold the book for {₹800}, so {₹800} is the *Selling Price*.';
    await card.flip({ title: 'Correct!', text: why });
    const r = stageRect(card.card);
    FX.twinkles(scene.ui, [[r.left + 6, r.top + 40], [r.right - 4, r.top + 150], [r.right - 30, r.bottom - 10], [r.left + 24, r.bottom - 60]]);

    const { bird } = await cornerSwifty(ctx, scene);
    bird.point();
    await ctx.wait(400);
    bird.talk();
    await Voice.say('correct', 'Correct! ' + why, 'bird');
    bird.point();
    await flyOff(ctx, bird); // her part is done
    nextButton(scene, NEXT_ON_SHEET);
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
      if (SCENES[Game.index] !== scene) return; // its screen is already fading away: the story has moved on
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

  // Wrong answer: the big panel slides up and the card comes to its middle; Swifty flies in to her stand and
  // gives a hint; then the card makes way for the Cost Price and Selling Price cards, which she reads out, and
  // she ties them back to the story. Then she flies off, and a Next button moves the story on.
  async function answerWrong(ctx, scene, card) {
    const ui = scene.ui;
    card.lock();
    await ctx.wait(700); // let the shake and buzz land first
    Sound.duck(true);
    sheetUp(scene, card.el);
    card.el.classList.add('is-center');
    const talk = await cornerSwifty(ctx, scene, { size: 40 }); // she flies in as the panel comes up (big, clear words here)
    const bird = talk.bird;
    bird.point();
    await ctx.wait(250);
    await talk.say('hint', [{ t: 'Think again.\nThe shopkeeper\nsold the book\nfor ' }, { t: '₹800', em: true }, { t: '.' }]);
    talk.line.emphasize();
    await ctx.wait(2600);

    // The card makes way for the definitions; her bubble goes, and she reads each card out (its words are on it).
    await talk.clear();
    bird.idle();
    const items = [
      { title: 'Cost Price (CP)', tone: 'blue', pictures: [ART.money, ART.book], text: 'Price at which an item is {bought}.', say: 'Cost Price. C P.' },
      { title: 'Selling Price (SP)', tone: 'yellow', pictures: [ART.book, ART.money], text: 'Price at which an item is {sold}.', say: 'Selling Price. S P.' },
    ];
    const defs = FX.definitions(ui, { items });
    const teach = (id, text) => {
      bird.talk();
      return Voice.say(id, text, 'bird').then(() => bird.idle());
    };
    const titles = [];
    card.hide();
    await ctx.wait(200);
    // The panel's first card comes in straight away (it never waits empty). Each card's name is read as its title
    // appears, and its definition once both the definition is up and the name has been said.
    defs.open();
    await defs.fill(ctx, {
      onCard: () => bird.wave(),
      onTitle: i => { titles[i] = teach(`def${i}-title`, items[i].say); },
      onText: i => titles[i].then(() => teach(`def${i}-text`, items[i].text)),
    });

    // Swifty ties it back to the story, in her bubble.
    await talk.say('here', [
      { t: 'Here, ' }, { t: '₹800', em: true }, { t: ' is the\nshopkeeper’s\n' },
      { t: 'Selling Price', cls: 'stress' }, { t: '.' },
    ]);
    talk.line.emphasize();
    await ctx.wait(600);

    // Her part is done: she flies off, and a Next button moves the story on.
    await flyOff(ctx, bird, talk.line);
    nextButton(scene, NEXT_ON_SHEET);
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
      anchor: [1030, 350], corner: 'bl', tip: [966, 300], // right of his head, the tail at his hair (his face is turned away)
      text: [{ t: '₹1000', em: true }, { t: '?\nWhat is this?' }],
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
    await ctx.wait(300);
    const mp = FX.pricePanel(ui, { price: '₹1000', term: 'Marked Price', abbr: '(MP)', sheet: true });
    mp.open();
    await ctx.wait(300);
    mp.showBook();
    await ctx.wait(1000);
    const talk = await cornerSwifty(ctx, scene); // she flies in to her stand
    const bird = talk.bird;
    await ctx.wait(300);

    // Her line, above her head, while the sticker glows.
    mp.highlight();
    await talk.show([{ t: '₹1000', em: true }, { t: ' is the price\nwritten on the book.' }]);
    const saying = speak(ctx, talk.line, 'mp-line', 'bird', bird);
    saying.catch(() => {}); // if the player leaves mid-line, the wait below reports it
    await ctx.wait(500);
    await mp.zoom(); // the price, big, while she says it
    await saying;
    talk.line.emphasize();
    await ctx.wait(900);

    // The name for it: she says it, and just after, the label drops in under the lens.
    bird.wave();
    await ctx.wait(300);
    await talk.say('mp-term', [{ t: 'It is called the\n' }, { t: 'Marked Price (MP)', cls: 'key' }, { t: '.' }]);
    talk.line.emphasize();
    await ctx.wait(150);
    await mp.name();
    endWithSwifty(ctx, scene, talk); // then the definition
  }

  // Screens 12 and 13 carry on from the price panel before them. Their setup runs before the cross-fade
  // starts, so (coming from the screen before) the book and Swifty on her stand are already in place: only
  // the right side visibly changes during the fade.
  const PANEL_FLOW = ['mp', 'mpdef', 'compare'];

  function setupPricePanel(scene, side) {
    scene.mp = FX.pricePanel(scene.ui, Object.assign({ price: '₹1000', term: 'Marked Price', abbr: '(MP)', sheet: true }, side));
    scene.carried = PANEL_FLOW.indexOf(scene.cameFrom) === PANEL_FLOW.indexOf(scene.id) - 1;
    if (scene.carried) scene.mp.showNow();
    carrySwifty(scene);
  }

  // Lets the cross-fade finish; or (when the screen was reached some other way, e.g. from the scenes
  // panel) brings the book in, and Swifty flies to her stand. Resolves with Swifty, ready to talk.
  async function enterPricePanel(ctx, scene) {
    if (scene.carried) {
      await ctx.wait(450); // the screen before finishes fading away first
    } else {
      await ctx.wait(300);
      scene.mp.open();
      await ctx.wait(300);
      scene.mp.showBook();
      await ctx.wait(1000);
    }
    return cornerSwifty(ctx, scene);
  }

  // The Marked Price definition: a card eases in beside the book and Swifty reads it out while the words
  // appear one by one; "marked" and "printed" light up the sticker on the book.
  const MP_DEFINITION = 'The price {marked} or\n{printed} on an article\nis called its\n*Marked Price.*';

  // A definition read out from its recording, "Term. Definition": its words appear in step with the voice, after
  // the term (see FX's revealDefinition). Null when the device's voice reads it instead.
  function readAlong(term, definition) {
    const seconds = Voice.seconds(term + definition);
    return seconds ? { seconds, lead: term.length + (/[.,]\s*$/.test(term) ? 3 : 0) } : null;
  }

  async function playDefine(ctx, scene) {
    const talk = await enterPricePanel(ctx, scene);
    const { bird } = talk;
    await scene.mp.define(ctx, {
      voice: readAlong('Marked Price. ', MP_DEFINITION),
      onRead: () => {
        bird.talk();
        return Voice.say('mp-def', 'Marked Price. ' + MP_DEFINITION, 'bird').then(() => bird.idle());
      },
      onMarked: () => scene.mp.highlight(),
    });
    endWithSwifty(ctx, scene, talk); // then compare it with the Selling Price
  }

  // Compare MP and SP: ₹1000 Marked Price, a blue arrow growing down, ₹800 Selling Price (the price boxes of the
  // other panels), with Swifty saying each step from her stand.
  async function playCompare(ctx, scene) {
    const talk = await enterPricePanel(ctx, scene);
    const bird = talk.bird;
    bird.point();
    await ctx.wait(300);
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
    talk.line.emphasize();
    endWithSwifty(ctx, scene, talk); // the shopkeeper explains
  }

  // Back at the counter, the shopkeeper explains, one part at a time; as he says each price, it lifts out of his
  // speech bubble and flies to the card on the right, which builds ₹1000 → (₹200 reduced) → ₹800; his last
  // words are the new word, "discount".
  const REDUCTION_CARD = {
    from: { price: '₹1000', tone: 'yellow' }, // the same colours as on the compare screen
    to: { price: '₹800', tone: 'blue' },
    cut: '₹200',
    note: 'reduced',
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

  async function playReveal(ctx, scene) {
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

    // He doesn't know the word: his face turns puzzled, and he wonders about it.
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

  // The definition of a discount, the answer to Aniket's question, on the sheet that slides up over the counter.
  // The definition card springs up, and Swifty flies in to her stand (as on every teaching screen), points at the
  // card and reads it out while the words appear.
  const DISCOUNT_DEFINITION = 'The {reduction} given on the\n{marked price} of an item\nis called a *discount.*';

  function setupDiscountDef(scene) {
    carrySwifty(scene);
  }

  async function playDiscountDef(ctx, scene) {
    const ui = scene.ui;
    const card = FX.definitionCard(ui, { term: 'Discount', text: DISCOUNT_DEFINITION });
    await ctx.wait(400);
    const arriving = cornerSwifty(ctx, scene); // she flies in to her stand
    arriving.catch(() => {}); // if the player leaves meanwhile, the await below reports it
    await ctx.wait(700);
    card.open(); // the card springs up as she lands, and she reads it out straight away (it never waits empty)
    const talk = await arriving;
    const { bird } = talk;
    bird.point();
    await ctx.wait(300);

    // She reads it out while the words appear.
    await card.define(ctx, {
      voice: readAlong('Discount. ', DISCOUNT_DEFINITION),
      onRead: () => {
        bird.talk();
        return Voice.say('ddef', 'Discount. ' + DISCOUNT_DEFINITION, 'bird').then(() => bird.point());
      },
    });
    card.emphasize();
    Sound.ding();
    endWithSwifty(ctx, scene, talk); // then the formula
  }

  // The discount formula, built one piece at a time with the amounts only: the ₹1000 lifts off the book's sticker into
  // the first box, then − ₹800, then = ₹200, while Swifty points at each from her corner (the sum speaks for itself).
  // Then she says the formula in words, and as she says each part its box's name is written in above its amount
  // (Marked Price, Selling Price, Discount); then "So, the discount is ₹200." while the Discount box glows.
  async function playFormula(ctx, scene) {
    const fp = FX.formulaPanel(scene.ui, {
      price: '₹1000',
      terms: [
        { label: 'Marked Price', value: '₹1000', tone: 'yellow' }, // the colours used since screen 13
        { label: 'Selling Price', value: '₹800', tone: 'blue' },
        { label: 'Discount', value: '₹200', tone: 'red' },
      ],
      ops: ['−', '='],
      namesLater: true, // the amounts first: each name is written in as she says it
    });
    await ctx.wait(450); // the definition card finishes fading away first
    fp.open();
    await ctx.wait(700);
    fp.showBook();
    await ctx.wait(1000);

    // Marked Price: the price printed on the book flies into the first box; Swifty flies in meanwhile, and points at
    // it once it has landed (she says nothing yet: the sum builds by itself, and her first line is the Discount's).
    fp.highlight();
    await ctx.wait(600);
    await fp.box(0, { empty: true });
    await ctx.wait(200);
    const arriving = cornerSwifty(ctx, scene);
    arriving.catch(() => {}); // if the player leaves meanwhile, the await below reports it
    await fp.fly();
    const talk = await arriving;
    talk.bird.point();
    await ctx.wait(900);

    // − Selling Price (no words: she points at it)
    await ctx.wait(250);
    fp.op(0);
    await ctx.wait(350);
    await fp.box(1);
    talk.bird.point();
    await ctx.wait(1100);

    // = Discount
    await ctx.wait(250);
    fp.op(1);
    await ctx.wait(350);
    await fp.box(2, { stamp: true });
    const d = stageRect(fp.boxes[2]);
    FX.burst(scene.ui, d.left + d.width / 2, d.top + d.height / 2, { count: 16, dist: [120, 230], size: [12, 24] });
    talk.bird.point(); // no words: the ₹200 Discount box speaks for itself
    await ctx.wait(1300);

    // The formula in words, one part at a time: each part lights up as she says it, and its box's name is written in
    // above its amount (Marked Price, then Selling Price, then Discount).
    await talk.show([{ t: 'Marked Price,', end: true }, { t: '\nminus Selling Price,', end: true }, { t: '\nequals Discount.' }]);
    const lit = [[fp.boxes[0]], [fp.ops[0], fp.boxes[1]], [fp.ops[1], fp.boxes[2]]];
    for (const [i, parts] of lit.entries()) {
      parts.forEach((part, k) => ctx.wait(k * 420).then(() => {
        fp.ping(part);
        if (part === fp.boxes[i]) fp.name(i);
      }, () => {}));
      await talk.part(`rule-${i + 1}`, i, 900);
    }
    await ctx.wait(500);

    // What it comes to here: the Discount box glows as she says it.
    fp.glow(2); // the Discount keeps glowing
    Sound.ding();
    await talk.say('f-so', [{ t: 'So, the discount\nis ' }, { t: '₹200', em: true }, { t: '.' }], 600);
    talk.line.emphasize();
    endWithSwifty(ctx, scene, talk); // then the formula itself
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
    carrySwifty(scene);
  }

  // Runs of screens where Swifty keeps talking, one after another. She flies in to her stand for the first line
  // of a run, stays there through the run (carried across each dissolve without moving), and flies off after
  // its last line; so she is only on the screen while she has something to say.
  const RUNS = [['mp', 'mpdef', 'compare'], ['discount-def', 'formula', 'formula-reveal', 'summary'],
    ['offmeans', 'recall', 'percentrule', 'whatpercent', 'check', 'sneakerq', 'thirty', 'represent', 'topay'], ['pctofmp', 'discountpct', 'sneakersum'],
    ['left', 'two'], ['recap', 'takeaway']];
  const lastOfRun = scene => {
    const run = RUNS.find(r => r.includes(scene.id));
    return !run || run[run.length - 1] === scene.id;
  };

  // Coming from the screen before in the same run, Swifty is already on her stand.
  function carrySwifty(scene) {
    scene.bird = null;
    const carried = RUNS.some(run => run.indexOf(scene.cameFrom) >= 0 && run.indexOf(scene.id) === run.indexOf(scene.cameFrom) + 1);
    if (!carried) return;
    scene.bird = new FX.Bird(scene.ui, SWIFTY, { scale: CORNER.s });
    scene.bird.place(CORNER.x, CORNER.y);
    scene.bird.shadowOn(true);
  }

  // Swifty on her stand (CORNER), ready to talk (her bubbles go above her head): already there, or flying in now.
  // { size }: her bubbles' text size (default 34 px).
  async function cornerSwifty(ctx, scene, { size } = {}) {
    let bird = scene.bird;
    if (!bird) {
      bird = new FX.Bird(scene.ui, SWIFTY, { scale: CORNER.s });
      bird.place(2140, CORNER.y - 300);
      await bird.flyTo(ctx, { x: CORNER.x, y: CORNER.y, s: CORNER.s, duration: 1300, lift: 100, ease: 'out' });
      await bird.land();
    }
    return swiftyTalk(ctx, scene.ui, bird, b => Object.assign(overHead(b, CORNER.bubbles), size ? { size } : {}));
  }

  // Swifty's part is over: her bubble (if any) goes with her, and she waves and flies off.
  async function flyOff(ctx, bird, bubble) {
    await ctx.wait(600); // her last words sink in first
    if (bubble) await bubble.hide();
    bird.wave();
    Sound.chirp();
    await ctx.wait(300);
    await bird.takeOff(ctx);
    await bird.flyTo(ctx, { x: 2160, y: bird.y - 420, duration: 900, lift: 40, ease: 'in' });
    bird.remove();
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
  function endWithSwifty(ctx, scene, talk, ms = 3000, extra = []) {
    swiftyDone(ctx, scene, talk, extra).catch(err => { if (err !== CANCELLED) console.error(err); });
    ctx.advance(ms);
  }

  // The formula: first in words on a pink strip, then in short. Swifty says it from her corner, part by
  // part as each part appears (no bubble for the words on the strip: she only says them); the first letters of
  // each term light up and fly down to make the short form D = MP − SP; then she reads it out (no bubble either: it
  // is written in the blue box) and points at it.
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
    await ctx.wait(450); // the formula panel finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the panel opens
    arriving.catch(() => {});
    fr.open();
    await ctx.wait(800);
    const talk = await arriving;
    const bird = talk.bird;

    // In words, one part at a time: she says each part as it is written on the strip (no bubble: its words are there).
    fr.term(0);
    await readOut(ctx, bird, 'fr-1', 'Discount', ctx.wait(700));
    fr.op(0);
    await ctx.wait(300);
    fr.term(1);
    await readOut(ctx, bird, 'fr-2', 'equals Marked Price,', ctx.wait(900));
    fr.op(1);
    await ctx.wait(300);
    fr.term(2);
    await readOut(ctx, bird, 'fr-3', 'minus Selling Price.', ctx.wait(900));
    await ctx.wait(600);

    // In short: each term's first letters fly down into the blue box (which springs up as the first ones go).
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
      if (!i) fr.showShort(); // as the first letters fly down to it
      await fr.fly(i);
      await saying;
    }
    await ctx.wait(400);

    // The short form, read out (no bubble: it is written in the blue box): each part pops as she says it.
    await talk.clear(); // her last bubble goes
    const read = [[fr.shortTerms[0]], [fr.shortOps[0], fr.shortTerms[1]], [fr.shortOps[1], fr.shortTerms[2]]];
    const said = ['So, D', '= MP', '− SP.']; // as recorded
    for (const [i, pieces] of read.entries()) {
      const popping = Promise.all(pieces.map((piece, k) => ctx.wait(k * 420).then(() => fr.ping(piece))));
      await readOut(ctx, bird, `fr-${8 + i}`, said[i], popping.then(() => ctx.wait(480)));
    }
    await ctx.wait(500);

    // She points at it.
    bird.point();
    endWithSwifty(ctx, scene, talk); // then a quick summary
  }

  // A quick summary, made by hand on the sheet: a taped-on title, index cards, pencil arrows and a sticky note.
  // Swifty, on her stand, goes over the three terms one card at a time (Marked Price → Selling Price →
  // Discount), then the formula, each line in her speech bubble.
  async function playSummary(ctx, scene) {
    const ui = scene.ui;
    const sp = FX.summaryPanel(ui, {
      note: true,
      title: 'Let’s remember!',
      cards: [ // the colours used since screen 13
        { term: 'Marked Price', tone: 'mp', desc: 'Price written\non an item.' }, // in general: no amounts
        { term: 'Selling Price', tone: 'sp', desc: 'Price at which\nit is sold.' },
        { term: 'Discount', tone: 'd', desc: 'Amount reduced from\nthe marked price.' },
      ],
      formula: [{ t: 'Discount', tone: 'd' }, { t: '=' }, { t: 'MP', tone: 'mp' }, { t: '−' }, { t: 'SP', tone: 'sp' }],
    });
    await ctx.wait(450); // the screen before finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the recap opens
    arriving.catch(() => {});
    sp.open();
    await ctx.wait(500);
    const talk = await arriving;
    const bird = talk.bird;
    bird.wave();
    sp.title();
    await ctx.wait(300);
    await talk.say('sum-0', 'Let’s remember!', 900);
    await ctx.wait(300);

    const lines = [
      ['sum-1', [{ t: 'Marked Price', cls: 'tone-mp' }, { t: ' is the\nprice written\non an item.' }]],
      ['sum-2', [{ t: 'Selling Price', cls: 'tone-sp' }, { t: ' is the\nprice at which\nit is sold.' }]],
      ['sum-3', [{ t: 'Discount', cls: 'tone-d' }, { t: ' is the\namount reduced from\nthe marked price.' }]],
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
    endWithSwifty(ctx, scene, talk); // then Aniket's next find, at the shoe shop
  }

  // The blue sneakers on the stand in the shoe shop (stage px), for the light sweeping across them.
  const SNEAKERS = [[1130, 525], [1205, 468], [1290, 446], [1462, 452], [1482, 545], [1470, 578], [1138, 572]];
  const OFF_LABEL = { x: 1278, y: 636, w: 230, h: 104, round: 18 }; // the red 30% OFF label on the stand (stage px)

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
    // Aniket's lines, one bubble at a time, in the space beside his face (the tail at his mouth).
    const say = async (text, id) => {
      const line = FX.bubble(L, { anchor: [652, 248], corner: 'bl', tip: [606, 280], text, voice: 'boy', rotate: -1.5 });
      await line.show();
      await speak(ctx, line, id, 'boy');
      return line;
    };
    let line = await say('These sneakers\nlook good!', 'sneakers');
    await ctx.wait(900);
    await line.hide();
    await ctx.wait(250);
    // Then he notices the red 30% OFF label on the stand: it lights up as he asks about it.
    FX.ring(L, OFF_LABEL);
    Sound.sparkle();
    line = await say([{ t: 'What does ' }, { t: '30% OFF', em: true }, { t: '\nmean here?' }], 'sneakers-off');
    line.emphasize();
    await ctx.wait(900);
    await line.hide();
    await ctx.wait(250);
    line = await say([{ t: 'Is this also\na ' }, { t: 'discount?', cls: 'key' }], 'sneakers-discount');
    line.emphasize();
    ctx.advance(3000); // then a closer look
  }

  // Nothing to say here: Aniket comes up to the stand and points at the sneakers' ₹1800 price tag.
  async function playShoe(ctx) {
    await ctx.wait(600);
    ctx.advance(2600);
  }

  // The red "30% OFF" label on the front of the sneakers' stand: a glowing frame hugging it (stage px). It sits
  // here on screens 24 and 35; on 25 the picture shows the stand a little closer (THINKING_OFF_TAG).
  const OFF_TAG = { x: 1253, y: 733, w: 322, h: 141, round: 24 };
  const THINKING_OFF_TAG = { x: 1284, y: 778, w: 336, h: 153, round: 26 };

  // No words: Aniket, hand on his chin, looks at the discount, and the red 30% OFF tag lights up.
  async function playDiscountTag(ctx, scene) {
    await ctx.wait(900);
    FX.ring(scene.layer, OFF_TAG);
    FX.twinkles(scene.layer, [[1084, 662], [1422, 670], [1426, 806], [1082, 802]]);
    Sound.sparkle();
    await ctx.wait(800);
    ctx.advance(2600);
  }

  // Coming from screen 24, the 30% OFF tag is still lit, exactly as it was.
  function setupConfused(scene) {
    scene.offRing = scene.cameFrom === 'tag' ? FX.ring(scene.layer, Object.assign({ instant: true }, THINKING_OFF_TAG)) : null;
  }

  // Aniket, hand on his chin, looks at the sneakers' tags: he says what he sees, and asks how much he will actually
  // pay, one bubble at a time, right of his face, the tail at his mouth by his hand.
  const SHOE_SAY = { anchor: [717, 332], corner: 'bl', tip: [655, 342], voice: 'boy', rotate: -1.5 };
  const SHOE_PRICE = Object.assign({ text: [{ t: 'The price tagged\nis ' }, { t: '₹1800', em: true }, { t: '.' }] }, SHOE_SAY);
  const SHOE_PAY = Object.assign({
    text: [{ t: 'Using ' }, { t: '30% OFF', em: true }, { t: '!\nHow much money\nI actually have\nto pay?' }],
  }, SHOE_SAY);
  const PRICE_CARD = { x: 1346, y: 634, w: 196, h: 152, round: 16 }; // the white ₹1800 card on the sneakers (stage px)

  async function playConfused(ctx, scene) {
    if (!scene.offRing) {
      await ctx.wait(500);
      FX.ring(scene.layer, THINKING_OFF_TAG);
      Sound.sparkle();
    }
    await ctx.wait(700);
    // "The price tagged is ₹1800.": the price card on the sneakers lights up.
    const price = FX.bubble(scene.layer, SHOE_PRICE);
    FX.ring(scene.layer, PRICE_CARD);
    Sound.sparkle();
    await price.show();
    await speak(ctx, price, 'shoe-price', 'boy');
    price.emphasize();
    await ctx.wait(900);
    await price.hide();
    await ctx.wait(250);
    // "Using 30% OFF! How much money I actually have to pay?" (the 30% OFF tag is still lit)
    const ask = FX.bubble(scene.layer, SHOE_PAY);
    await ask.show();
    await speak(ctx, ask, 'shoe-ask', 'boy');
    ask.emphasize();
    ctx.advance(3000); // Swifty comes to help
  }

  const SNEAKER_CARD = { photo: ASSETS + 'ui/sneakers.png', price: '₹1800', off: ['30%', 'OFF'], knot: [60, 49] };

  // Swifty comes to help, on the sheet that slides up over the shop: what the tag means, written big. The red
  // 30% OFF tag stamps on; Swifty flies in to her stand and reads it out (no bubble: it is all on the panel):
  // "30% OFF means" ("means" and its arrow come in as she says it) "30% Discount." (the card springs up).
  async function playOffMeans(ctx, scene) {
    const m = FX.meansPanel(scene.ui, { tag: SNEAKER_CARD.off, card: [{ t: '30%' }, { t: 'Discount', cls: 'tone-d' }] });
    await ctx.wait(300);
    m.open();
    await ctx.wait(500);
    await m.stamp();
    await ctx.wait(400);
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    bird.wave();
    await ctx.wait(500);
    bird.point();
    await ctx.wait(300);
    await readOut(ctx, bird, 'om-1', '30% OFF means', (async () => {
      await ctx.wait(250);
      m.ping(m.tagEl); // as she says "30% OFF"
      await ctx.wait(800);
      await m.means();
    })());
    await readOut(ctx, bird, 'om-2', '30% Discount.', m.card());
    await ctx.wait(300);
    m.ping(m.tagEl);
    m.ping(m.cardEl);
    const r = stageRect(m.cardEl);
    FX.twinkles(scene.ui, [[r.left - 30, r.top + 10], [r.right + 26, r.top + 18], [r.left - 18, r.bottom - 6], [r.right + 18, r.bottom]]);
    Sound.sparkle();
    bird.point();
    endWithSwifty(ctx, scene, talk); // then the sneakers again, and how to work it out
  }

  // Then a card with the sneakers (their ₹1800 price tag tied to the laces, as in the shop) and their 30% OFF
  // tag springs up, and Swifty (on her stand already, or flying in to it) points at it and says what comes next.
  async function playRecall(ctx, scene) {
    const carried = !!scene.bird; // on her stand already, from screen 26
    await ctx.wait(carried ? 450 : 300); // the panel before finishes fading away first

    // The card: the sneakers, then their price tag, then the discount tag lands like a stamp and glows.
    const card = FX.productCard(scene.ui, SNEAKER_CARD);
    card.open();
    await card.showPhoto(); // with the card, so it is never empty
    await ctx.wait(300);
    await card.showPrice();
    await ctx.wait(350);
    await card.showOff();
    await ctx.wait(500);

    // Swifty (flying in to her corner, and waving, if she is not there yet) points at the card while she talks.
    const talk = await cornerSwifty(ctx, scene);
    const bird = talk.bird;
    if (!carried) {
      bird.wave();
      await ctx.wait(400);
    }
    bird.point();
    await ctx.wait(200);
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
    endWithSwifty(ctx, scene, talk); // then the rule: "a is what percent of b?"
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
  // so(answers) either way. 3 seconds later (or once Swifty has flown off, at the end of her run) the Next
  // button appears level with the last answer; or, with { auto: true }, there is no Next button and the screen
  // moves on by itself 3 seconds after her last line; or the screen carries on with then(answers) (e.g. working
  // the answer out). `t.below` is where the answers go.
  async function percentQuestion(ctx, scene, t, talk, { options, right, wrong, so, stack = false, auto = false, then = null }) {
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
      if (then) {
        await then(answers);
        return;
      }
      if (auto) {
        endWithSwifty(ctx, scene, talk); // on by itself, 3 seconds later
        return;
      }
      if (lastOfRun(scene)) {
        await swiftyDone(ctx, scene, talk); // she flies off
      } else {
        await ctx.wait(3000, { real: true });
        talk.bird.idle();
      }
      const last = stageRect(answers.buttons[answers.buttons.length - 1]);
      nextButton(scene, { right: 410, bottom: STAGE_H - (last.top + last.bottom) / 2 - 48 });
    }
    await answers.enter(ctx);
    talk.bird.point();
  }

  // How screens 28, 29 and 37 begin: the panel springs up and Swifty (on her stand, or flying in) reads its question out
  // (its words are on the strip); then she names the part and the whole, e.g. ['125', '500']: each takes its colour
  // in the question as she says it, and its box pops in. `cls` styles them in her bubble ('var' for letters).
  async function percentStart(ctx, scene, f, ask, [part, whole], cls = '') {
    await ctx.wait(450); // the panel before finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the panel opens, unless she is on her stand already
    arriving.catch(() => {});
    f.open();
    await ctx.wait(600);
    await f.showQuestion();
    const talk = await arriving;
    const bird = talk.bird;
    await ctx.wait(300);
    bird.talk(); // she reads the question out (its words are on the strip)
    await Promise.all([Voice.say('wp-ask', ask, 'bird'), ctx.wait(1400)]);
    bird.idle();
    await ctx.wait(400);
    bird.point();
    await ctx.wait(400);

    await talk.show([
      { t: part, cls: `tone-part ${cls}` }, { t: ' is the ' }, { t: 'part', cls: 'tone-part' }, { t: ',', end: true },
      { t: '\nand ' }, { t: whole, cls: `tone-whole ${cls}` }, { t: ' is the ' }, { t: 'whole', cls: 'tone-whole' }, { t: '.' },
    ]);
    f.tag('part');
    await partWith(ctx, talk, 'wp-part', 0, 700, () => f.box('part'));
    f.tag('whole');
    await partWith(ctx, talk, 'wp-whole', 1, 800, () => f.box('whole'));
    await ctx.wait(500);
    return talk;
  }

  // Then (on both screens) the formula is written in as she explains it, and the part goes on top and the whole
  // below: they fly out of the boxes into the next line.
  async function percentRule(ctx, talk, f) {
    await talk.show([
      { t: 'To find the ' }, { t: 'percentage', cls: 'key' }, { t: ',', end: true },
      { t: '\ndivide the ' }, { t: 'part', cls: 'tone-part' }, { t: '\nby the ' }, { t: 'whole', cls: 'tone-whole' }, { t: ',', end: true },
      { t: ' then\nmultiply by 100.' },
    ]);
    await partWith(ctx, talk, 'wp-rule-1', 0, 500, () => f.label());
    await partWith(ctx, talk, 'wp-rule-2', 1, 400, () => f.fraction());
    await partWith(ctx, talk, 'wp-rule-3', 2, 700, () => f.times(0));
    await ctx.wait(500);

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
  }

  // The last line lands and is marked, with sparkles round it.
  function markAnswer(scene, f) {
    f.mark();
    f.tag('part');
    f.tag('whole');
    const a = stageRect(f.answerEl);
    FX.twinkles(scene.ui, [[a.left - 30, a.top + 6], [a.right + 26, a.top + 14], [a.left - 18, a.bottom], [a.right + 16, a.bottom + 6]]);
    Sound.sparkle();
  }

  // The rule first, in general: "a is what percent of b?" Over the same blurred shop, with Swifty in her corner,
  // the sneakers card dissolves away and the panel of the example (screen 29) springs up, with letters, in
  // italic, for the part and the whole: a is the part and b the whole, and the formula is written line by line
  // as she says it: Percentage = Part / Whole × 100 = a / b × 100 = (a / b × 100)%. Then "Let's take an example!"
  const PERCENT_RULE = {
    question: [{ t: 'a', role: 'part' }, { t: ' is what percent of ' }, { t: 'b', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: 'a' },
    whole: { label: 'Whole', value: 'b' },
    numbers: ['a', 'b'],
    letters: true,
  };

  async function playPercentRule(ctx, scene) {
    const f = FX.percentFormula(scene.ui, PERCENT_RULE);
    const talk = await percentStart(ctx, scene, f, 'a is what percent of b?', ['a', 'b'], 'var');
    const bird = talk.bird;
    await percentRule(ctx, talk, f);

    // The last line, (a / b × 100)%: the answer is a percentage.
    await talk.show([{ t: 'Then put a ' }, { t: '%', em: true }, { t: ' sign after it.' }]);
    await f.start(2);
    await Promise.all([talk.part('pr-sign', 0, 400), ctx.wait(500).then(() => f.answer())]);
    markAnswer(scene, f);
    await ctx.wait(900);

    bird.point();
    await talk.say('pr-example', [{ t: 'Let’s take an ' }, { t: 'example', cls: 'key' }, { t: '!' }], 600);
    talk.line.emphasize();
    bird.point();
    endWithSwifty(ctx, scene, talk); // then the example
  }

  // The example: "125 is what percent of 500?" The rule's panel dissolves away and the same panel springs up
  // with the numbers, worked out line by line in time with what Swifty says (as the rule was). The part is
  // blue and the whole green everywhere: in the question, the boxes, the formula and her bubbles.
  const WHAT_PERCENT = {
    question: [{ t: '125', role: 'part' }, { t: ' is what percent of ' }, { t: '500', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: '125' },
    whole: { label: 'Whole', value: '500' },
    numbers: ['125', '500'],
    answer: '25%',
  };

  async function playWhatPercent(ctx, scene) {
    const f = FX.percentFormula(scene.ui, WHAT_PERCENT);
    const talk = await percentStart(ctx, scene, f, '125 is what percent of 500?', ['125', '500']);
    const bird = talk.bird;
    await percentRule(ctx, talk, f);

    // Work it out: = 25%, the answer.
    await talk.show([
      { t: '125', cls: 'tone-part' }, { t: ' ÷ ' }, { t: '500', cls: 'tone-whole' }, { t: ' × 100', end: true },
      { t: '\n= ' }, { t: '25%', em: true }, { t: '.', end: true },
      { t: '\nSo, ' }, { t: '125', cls: 'tone-part' }, { t: ' is\n' }, { t: '25%', em: true }, { t: ' of ' }, { t: '500', cls: 'tone-whole' }, { t: '!' },
    ]);
    await talk.part('wp-work', 0, 600);
    await f.start(2);
    await partWith(ctx, talk, 'wp-equals', 1, 350, () => f.answer());
    await partWith(ctx, talk, 'wp-so', 2, 900, () => markAnswer(scene, f));
    talk.line.emphasize();
    bird.point();
    endWithSwifty(ctx, scene, talk); // then a quick check
  }

  // A quick check: "250 is what percent of 1000?" Over the same blurred shop, with Swifty in her corner, the
  // formula dissolves away and a panel springs up with the question on its purple strip; Swifty reads it out
  // and three answers slide in under it, one above the other. Whichever the player picks, she explains it the
  // way screen 29 worked it out: the part and the whole take their colours in the question as she names them.
  const CHECK = {
    question: [{ t: '250', role: 'part' }, { t: ' is what percent of ' }, { t: '1000', role: 'whole' }, { t: '?' }],
  };
  const CHECK_SUM = [{ t: '250', cls: 'tone-part' }, { t: ' ÷ ' }, { t: '1000', cls: 'tone-whole' }, { t: ' × 100 = ' }, { t: '25%', em: true }, { t: '.' }];

  async function playCheck(ctx, scene) {
    const q = FX.questionPanel(scene.ui, CHECK);
    await ctx.wait(450); // the formula finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the panel opens
    arriving.catch(() => {});
    q.open();
    await ctx.wait(600);
    await q.showQuestion();
    const talk = await arriving;
    const bird = talk.bird;
    await ctx.wait(300);
    bird.talk(); // she reads the question out (its words are on the strip)
    await Promise.all([Voice.say('cfu-ask', '250 is what percent of 1000?', 'bird'), ctx.wait(1400)]);
    bird.idle();
    await ctx.wait(400);

    await percentQuestion(ctx, scene, q, talk, {
      options: [{ label: '20%' }, { label: '25%', correct: true }, { label: '50%' }],
      stack: true,
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
      // Wrong: "Not quite! 250 is the part, 1000 is the whole. 250 ÷ 1000 × 100 = 25%." (each amount takes its
      // colour as she names it; then the right answer lights up)
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
      // Both ways: "So, 250 is 25% of 1000." while the right answer and the two amounts pop.
      async so(answers) {
        await talk.show([
          { t: 'So, ' }, { t: '250', cls: 'tone-part' }, { t: ' is ' }, { t: '25%', em: true },
          { t: '\nof ' }, { t: '1000', cls: 'tone-whole' }, { t: '.' },
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
  // check dissolves away and a big panel springs up with the sneakers (their photo, the ₹1800 tag and the 30% OFF
  // tag) and the question "Now, what is 30% of ₹1800?", with three answers. Whichever the player picks, Swifty
  // gives the answer, and 3 seconds later the next screen works it out (no Next button); the screens after it
  // name it (33) and use it (34).
  async function playSneakerQuestion(ctx, scene) {
    const pq = FX.productQuestion(scene.ui, Object.assign({ question: 'Now, what is\n30% of ₹1800?', wide: true }, SNEAKER_CARD));
    await ctx.wait(450); // the quick check finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the panel opens
    arriving.catch(() => {});
    pq.open();
    await ctx.wait(600);
    const talk = await arriving;
    const bird = talk.bird;
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
      auto: true,
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
      // Both ways: "Let's see how to work it out!" (screen 32 does)
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
    await ctx.wait(450); // the question finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the sheet opens
    arriving.catch(() => {});
    w.open();
    await ctx.wait(700);
    const talk = await arriving;
    const bird = talk.bird;
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
    endWithSwifty(ctx, scene, talk); // then what ₹540 is
  }

  // What does ₹540 represent? The working dissolves away and the sneakers panel springs up again, with the
  // question and three answers: Marked Price, Selling Price or Discount. Swifty then explains: it is the money
  // taken off ₹1800, the Discount.
  async function playRepresent(ctx, scene) {
    const pq = FX.productQuestion(scene.ui, Object.assign({ question: 'What does ₹540\nrepresent here?' }, SNEAKER_CARD));
    await ctx.wait(450); // the working finishes fading away first
    pq.open();
    await ctx.wait(600);
    await pq.showItem(ctx);
    await ctx.wait(400);
    const arriving = cornerSwifty(ctx, scene); // she flies in as the question appears
    arriving.catch(() => {});
    await pq.showQuestion();
    const talk = await arriving;
    const bird = talk.bird;
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

  // The amount to pay. The sneakers panel dissolves away and, with nothing on the big panel yet, Swifty says what
  // to find: "Now, let's find out how much money Aniket needs to pay." Then the sneakers spring up again with the
  // question "What will be the Selling Price?", the rule as a hint (SP = MP − Discount, which she reads out) and
  // three answers. Whichever the player picks, she says so, and "Let's see how to work it out!": the question
  // dissolves away and a worked solution springs up: Marked Price ₹1800 ↓ Discount ₹540 on the left; Swifty says
  // how to find the amount to pay while SP = MP − Discount is written in; the player drags ₹1800 and ₹540 out of
  // their boxes into = 1800 − 540; and = ₹1260 lands, marked as the answer.
  const PAY_HINT = [{ t: 'SP', cls: 'tone-sp' }, { t: '=' }, { t: 'MP', cls: 'tone-mp' }, { t: '−' }, { t: 'Discount', cls: 'tone-d' }];
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

  async function playToPay(ctx, scene) {
    await ctx.wait(500); // the question before finishes fading away first
    const talk = await cornerSwifty(ctx, scene); // on her stand already (or flying in to it)
    const bird = talk.bird;
    bird.point();
    await talk.say('pay-intro', 'Now, let’s find out\nhow much money\nAniket needs to pay.', 600);
    await ctx.wait(400);

    // The question, with the rule as a hint: she reads both out (their words are on the panel).
    await talk.clear();
    const pq = FX.productQuestion(scene.ui, Object.assign({ question: 'What will be the\nSelling Price?', wide: true, hint: PAY_HINT }, SNEAKER_CARD));
    pq.open();
    await ctx.wait(500);
    await pq.showItem(ctx);
    await ctx.wait(300);
    await pq.showQuestion();
    await ctx.wait(300);
    await readOut(ctx, bird, 'pay-ask', 'What will be the Selling Price?', ctx.wait(1400));
    await ctx.wait(300);
    await readOut(ctx, bird, 'pay-hint', 'Hint: SP = MP − Discount.', pq.showHint());
    bird.point();
    await ctx.wait(300);

    await percentQuestion(ctx, scene, pq, talk, {
      options: [{ label: '₹2340' }, { label: '₹1260', correct: true }, { label: '₹1340' }],
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
      // Both ways: "Let's see how to work it out!" (then it is worked out, on this screen)
      async so(answers) {
        await talk.show('Let’s see how\nto work it out!');
        await partWith(ctx, talk, 'pay-so', 0, 500, () => {
          answers.ping(1);
          pq.ping(pq.hint);
        });
      },
      then: () => explainPay(ctx, scene, talk, pq),
    });
  }

  // The amount to pay, worked out (after the question, on the same screen).
  async function explainPay(ctx, scene, talk, question) {
    const bird = talk.bird;
    await ctx.wait(800);
    await FX.settle(question.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-in', fill: 'forwards' }));
    question.el.remove();
    const w = FX.workedSheet(scene.ui, PAY_SHEET);
    w.open();
    await ctx.wait(600);
    await w.box(0);
    await ctx.wait(300);
    await w.box(1);
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

    // The player's turn: the next line has an empty box for each amount, and they drag the amounts (or tap one,
    // then its box) out of the boxes on the left into them. A wrong box sends the amount back, with a hint.
    await w.write(1);
    await w.part(1, 0);
    await ctx.wait(150);
    await w.part(1, 1);
    await ctx.wait(150);
    await w.part(1, 2);
    await ctx.wait(300);
    await talk.say('pay-try', [{ t: 'Your turn!', cls: 'key' }, { t: '\nDrag each amount\ninto its box.' }], 600);
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

    // ₹1800 − ₹540 = ₹1260.
    await talk.show([
      { t: '₹1800', cls: 'tone-mp' }, { t: ' − ' }, { t: '₹540', cls: 'tone-d', end: true },
      { t: '\n= ' }, { t: '₹1260', em: true }, { t: '.' },
    ]);
    await partWith(ctx, talk, 'pay-3', 0, 200, () => {
      w.ping(w.rows[1].parts[0]);
      ctx.wait(450).then(() => w.ping(w.rows[1].parts[2]), () => {});
    });
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
    // As after a question: her run ends here, so she flies off; then the Next button appears under the panel.
    await swiftyDone(ctx, scene, talk);
    const p = stageRect(w.panel);
    nextButton(scene, { right: STAGE_W - p.right, bottom: STAGE_H - p.bottom - 140 });
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
    FX.twinkles(scene.layer, PAID_TWINKLES);
    Sound.chime();
    ctx.advance(3000); // then the sneakers, in their box
  }
  const PAID_TWINKLES = [[PAID_TAG.x - 190, PAID_TAG.y - 40], [PAID_TAG.x + 190, PAID_TAG.y - 30], [PAID_TAG.x - 170, PAID_TAG.y + 50], [PAID_TAG.x + 180, PAID_TAG.y + 52]];

  // The sneakers, in their box: over the counter, the shopkeeper hands them to Aniket. No words: a light sweeps
  // across the box, with twinkles round it and a chime.
  const SNEAKER_BOX = [[905, 440], [1245, 452], [1292, 598], [1240, 700], [880, 775], [800, 700], [800, 600], [935, 520]]; // the box and its lid (stage px)

  async function playBoxed(ctx, scene) {
    await ctx.wait(900);
    FX.shine(scene.layer, SNEAKER_BOX, { duration: 1300, width: 260 });
    await ctx.wait(450);
    FX.twinkles(scene.layer, [[884, 446], [1286, 470], [1300, 690], [806, 764]]);
    Sound.chime();
    await ctx.wait(800);
    ctx.advance(2600); // then the discount as a percent of the marked price
  }

  // What percent of the marked price is the discount? On the sheet that slides up over the shop, Swifty (flying
  // back in to her stand) works it out the way screens 28 and 29 did, with the part and the whole: "540 is what
  // percent of 1800?" 540 is the part and 1800 the whole; Percentage = Part / Whole × 100 = 540 / 1800 × 100 = 30%.
  // Then the boxes go, and as she says "Here, the part is the discount, and the whole is the marked price.", the
  // words dissolve into the new ones: Part → Discount, Whole → Marked Price (their amounts take the colours used
  // since screen 11), and, as she reads out the rule, Percentage → Discount %.
  const PERCENT_OF_MP = {
    question: [{ t: '540', role: 'part' }, { t: ' is what percent of ' }, { t: '1800', role: 'whole' }, { t: '?' }],
    part: { label: 'Part', value: '540' },
    whole: { label: 'Whole', value: '1800' },
    numbers: ['540', '1800'],
    answer: '30%',
  };

  async function playPercentOfMP(ctx, scene) {
    const f = FX.percentFormula(scene.ui, PERCENT_OF_MP);
    const talk = await percentStart(ctx, scene, f, '540 is what percent of 1800?', ['540', '1800']);
    const bird = talk.bird;
    await percentRule(ctx, talk, f);

    // Work it out: = 30%.
    await talk.show([
      { t: '540', cls: 'tone-part' }, { t: ' ÷ ' }, { t: '1800', cls: 'tone-whole' }, { t: ' × 100', end: true },
      { t: '\n= ' }, { t: '30%', em: true }, { t: '.', end: true },
      { t: '\nSo, ' }, { t: '540', cls: 'tone-part' }, { t: ' is\n' }, { t: '30%', em: true }, { t: ' of ' }, { t: '1800', cls: 'tone-whole' }, { t: '!' },
    ]);
    await talk.part('po-work', 0, 600);
    await f.start(2);
    await partWith(ctx, talk, 'po-equals', 1, 350, () => f.answer());
    await partWith(ctx, talk, 'po-so', 2, 900, () => markAnswer(scene, f));
    await ctx.wait(900);

    // What the part and the whole are here: the boxes go, and the words dissolve into the new ones as she says it.
    f.dropBoxes();
    await talk.show([
      { t: 'Here, the ' }, { t: 'part', cls: 'tone-part' }, { t: ' is\nthe ' }, { t: 'discount', cls: 'tone-d' }, { t: ',', end: true },
      { t: '\nand the ' }, { t: 'whole', cls: 'tone-whole' }, { t: ' is\nthe ' }, { t: 'marked price', cls: 'tone-mp' }, { t: '.' },
    ]);
    await ctx.wait(400);
    let renaming = null;
    await partWith(ctx, talk, 'po-part', 0, 900, () => { renaming = f.rename('part', 'Discount', 'tone-d'); });
    await renaming;
    await partWith(ctx, talk, 'po-whole', 1, 1000, () => { renaming = f.rename('whole', 'Marked Price', 'tone-mp'); });
    await renaming;
    await ctx.wait(500);

    // The rule for the discount percentage: she reads it out (no bubble: it is written on the sheet).
    await talk.clear();
    await readOut(ctx, bird, 'po-rule', 'So, Discount % = Discount ÷ Marked Price × 100.', ctx.wait(500).then(() => f.rename('label', 'Discount %')));
    talk.bird.point();
    endWithSwifty(ctx, scene, talk); // then what the discount percentage tells us
  }

  // Discount percentage. Over the same sheet, with Swifty on her stand (or flying back in to it), the working
  // dissolves away and a worked sheet springs up: as she says what discount percentage tells us, the rule
  // Discount % = Discount / Marked Price × 100 is written in on a yellow band; then the sneakers' discount, 540,
  // and marked price, 1800, go into it, and = 30% lands: the 30% off on the tag.
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

  async function playDiscountPercent(ctx, scene) {
    const carried = !!scene.bird; // on her stand already, from screen 37
    await ctx.wait(carried ? 450 : 300); // the working before finishes fading away first
    const w = FX.workedSheet(scene.ui, DISCOUNT_PERCENT_SHEET);
    const arriving = cornerSwifty(ctx, scene); // she flies back in, to her stand, as the sheet opens (unless she is there)
    arriving.catch(() => {});
    await ctx.wait(carried ? 0 : 400);
    w.open();
    const talk = await arriving;
    const bird = talk.bird;
    if (!carried) {
      bird.wave();
      await ctx.wait(500);
    }
    bird.point();
    await ctx.wait(200);

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
    endWithSwifty(ctx, scene, talk); // then the whole example, summed up
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

  async function playSneakerSummary(ctx, scene) {
    const sum = FX.summarySheet(scene.ui, SNEAKER_SUMMARY);
    await ctx.wait(450); // the worked sheet finishes fading away first
    const arriving = cornerSwifty(ctx, scene); // she flies in as the summary opens
    arriving.catch(() => {});
    sum.open();
    await ctx.wait(500);
    const talk = await arriving;
    const bird = talk.bird;
    bird.wave();
    sum.showTitle();
    await ctx.wait(300);
    await talk.say('ss-0', 'Let’s sum up\nthe sneakers!', 900);
    await ctx.wait(300);

    // The four amounts, row by row as she says them.
    bird.point();
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
    bird.wave();
    await ctx.wait(600);
    endWithSwifty(ctx, scene, talk); // then Aniket, back home
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
    FX.twinkles(scene.layer, [[872, 376], [1126, 348], [1202, 630], [946, 668]]);
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
    FX.twinkles(scene.layer, [[908, 392], [1130, 420], [1176, 548], [962, 652]]);
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

  // Aniket tucks the money into his pocket. No words.
  const POCKET_NOTES = [[1462, 660], [1541, 653], [1569, 794], [1491, 812]];
  async function playPocket(ctx, scene) {
    await ctx.wait(900);
    FX.shine(scene.layer, POCKET_NOTES, { duration: 900, width: 90 });
    FX.twinkles(scene.layer, [[1452, 650], [1580, 700], [1500, 826]]);
    Sound.swish();
    await ctx.wait(1000);
    ctx.advance(3000); // then his father's last words
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
  // ChatGPT from the asset prompt): the price and offer tags (on the offer cards), the green badge (what you pay), the
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
        const saying = Voice.say(id, text, 'bird');
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
    getat: '“Get at” tells you\nthe price you pay.',
    compare: 'Compare the final prices,\nnot just the discount\npercentages.',
  };

  // Aniket walks in from the left along the road and stops in front of the shops (bottom-left).
  async function walkOn(ctx, scene) {
    const walker = new FX.Walker(scene.ui, WALK_SHEET, { matte: true });
    const from = { x: -170, y: 1032, s: 0.56 };
    const to = { x: 190, y: 1032, s: 0.56 };
    walker.place(from.x, from.y, from.s);
    walker.setFrame(WALK_SHEET.loop[0]);
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
  // what to do; the player checks the three offers in any order (checkOffer), compares them (compareOffers) and buys at
  // the best shop (buyItem). Then the game goes back to the Shopping Area (or on to the end).
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
      talk.task(checked.size < shops.length ? 'Tap another shop to check its offer.' : 'Now compare the three offers.');
      await talk.clear();
      await ctx.wait(300);
    }
    await compareOffers(ctx, scene, talk, round, shops, st);
    await buyItem(ctx, scene, talk, round, st, board, n, money);
    talk.bird.wave();
    ctx.advance(2500); // back to the Shopping Area (or on to the end)
  }

  // One shop's offer: its card comes up out of the shop with "How much will you pay?" above three answers, and the
  // question bar steps away. A wrong answer is crossed out and Swifty helps from the bar, which comes back (see HINTS);
  // the right one is worked out on the card, line by line, as she reads it out, and what you pay is stamped under it.
  // Then the card goes back into the shop.
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

  // The three offers compared: what you pay at each shop, side by side, with the question ("Which shop gives the best
  // deal?") above them on the board; the question bar steps away. Wrong picks are crossed out, with Swifty's help from
  // the bar, which comes back; the right one gets a "Best deal!" stamp and she says why.
  async function compareOffers(ctx, scene, talk, round, shops, st) {
    const right = round.best;
    const veil = st.veil();
    const cb = FX.compareBoard(scene.ui, {
      question: round.question,
      right,
      art: STREET_ART,
      rows: shops.map((shop, k) => ({
        name: shop.name, tone: shop.tone, price: shop.price, off: round.shops[k].off.join(' '), pay: shop.pay, amount: round.shops[k].pay,
      })),
    });
    talk.away(); // the question is on the board, above the rows: the bar comes back when Swifty speaks
    await cb.open(ctx);
    let wrong = 0;
    while ((await cb.pick()) !== right) {
      wrong++;
      await ctx.wait(400);
      if (wrong > 1) cb.guide(right);
      await talk.say(wrong > 1 ? 'hint-compare' : 'hint-again', wrong > 1 ? HINTS.compare : HINTS.again);
      talk.bird.point();
    }
    const [x, y] = stagePoint(cb.rows[right]);
    FX.burst(scene.ui, x, y, { count: 18, dist: [110, 230], size: [14, 28] });
    await cb.win(right);
    // Why it is the best deal (the board already shows which shop, what you pay there and the ribbon).
    await talk.say(scene.id + '-best', round.lesson || `${shops[right].name} has the lowest\nfinal price.`);
    await ctx.wait(700);
    await Promise.all([cb.close(), veil.hide()]);
  }

  // Buying at the best shop: it glows with a "Best deal!" ribbon, the Buy button pops in under it and Swifty says to tap
  // it. Pressed, the money flies from the wallet to the shop
  // (SOLD), the item flies from the shop onto the shopping list (ticked), and a slip shows the wallet's sum (₹5,000 −
  // ₹1,300 = ₹3,700 left) while the wallet counts down, and the bar says what comes next.
  async function buyItem(ctx, scene, talk, round, st, board, n, money) {
    const k = round.best;
    const cost = round.shops[k].pay;
    await st.best(k);
    talk.task('Tap Buy!');
    const buying = st.buy(k, 'Buy for ' + rupees(cost)); // the Buy button pops in under the best shop
    await talk.say('buy', 'Now tap Buy!');
    talk.bird.point();
    await buying;
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
    const saying = Voice.say(id, text, 'bird');
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
  // the newspaper, one bubble at a time between them; when Aniket says "Yes!", the four things he bought pop up on the
  // table, in front of the runner.
  const HOME_ITEMS = [['uniform', 1425, 985, 140], ['shoes', 1560, 990, 96], ['bag', 1695, 995, 140], ['bottle', 1810, 1000, 138]]; // id, centre x, bottom, height
  async function playHomeAgain(ctx, scene) {
    const DAD = { anchor: [1300, 330], corner: 'br', tip: [1348, 398] };        // up-left of his head, the tail at his mouth
    const BOY = { anchor: [700, 255], corner: 'bl', tip: [620, 292] };          // up-right of his face, the tail at his mouth
    const say = async (bubble, id, who) => {
      const line = await sayOnPicture(ctx, scene, bubble, id, who);
      await ctx.wait(900);
      await line.hide();
      await ctx.wait(250);
    };
    const items = HOME_ITEMS.map(([id, x, bottom, h]) => {
      const img = Object.assign(el('img', 'home-item', scene.layer), { src: SHOPS.find(s => s.id === id).icon, alt: '', draggable: false });
      Object.assign(img.style, { left: x + 'px', top: bottom - h + 'px', height: h + 'px', opacity: '0' });
      return img;
    });
    await ctx.wait(700);
    await say(Object.assign({ text: 'Did you get\neverything?' }, DAD), 'end-everything', 'dad');
    const yes = sayOnPicture(ctx, scene, Object.assign({ text: 'Yes!' }, BOY), 'end-yes', 'boy');
    yes.catch(() => {});
    for (const img of items) { // the four things, on the table
      await ctx.wait(220);
      Sound.pop();
      FX.reveal(img, [
        { opacity: 0, transform: 'translate(-50%, 40px) scale(.5)' },
        { opacity: 1, transform: 'translate(-50%, -10px) scale(1.06)', offset: 0.6 },
        { opacity: 1, transform: 'translate(-50%, 0)' },
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.3,1)' });
    }
    Sound.sparkle();
    FX.twinkles(scene.layer, [[1370, 860], [1500, 900], [1630, 850], [1860, 860]]);
    const line = await yes;
    await ctx.wait(900);
    await line.hide();
    await ctx.wait(250);
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

  // The takeaway, with the bag's two offers from Bag Corner: 25% OFF (you pay ₹1,200) against ₹250 OFF (₹1,150, the best
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
      // End of a scene: move on after `ms` (Next fills up as a timer; not stretched by PACE, so changing
      // screens stays brisk), or wait for Next if auto-play is off. The last screen waits for Replay instead.
      advance(ms) {
        if (!alive()) return;
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
    scene.el.classList.remove('is-leaving', 'is-entering', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting', 'has-sheet');
    scene.el.classList.add('is-active');
    if (mode === 'cut' && !reducedMotion && !scene.still) {
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
    scene.el.classList.remove('is-active', 'is-entering', 'is-leaving', 'is-feathered', 'is-asking', 'is-hushed', 'is-instant', 'is-reacting', 'has-sheet');
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

  // Cross-fade only between these neighbouring screens (at home → at the mall, Bookstore → sees the
  // book → holds it → How Much?, question → closer look at his new book, and into the shoe shop → at the
  // sneakers' stand → the discount on them → his questions about it, and his final answer → the sneakers in their
  // box), both ways; and, going forward only, between screens
  // over the same blurred picture: the price panels (Marked Price → its definition → MP vs SP, so only their
  // right side changes), MP vs SP → the counter, the Discount definition → formula → formula reveal → summary,
  // what the 30% OFF tag means → the sneakers card → the percentage rule → its example → a quick check → the sneakers' question → 30% of ₹1800
  // worked out → what ₹540 is → the amount to pay → the final answer; and 540 as a percent of 1800 → the discount
  // percentage → the summary.
  // Every other change is a straight cut.
  const FADES = [['home', 'mall'], ['return', 'school'], ['school', 'list'], ['list', 'money'], ['money', 'pocket'], ['pocket', 'deal'], ['deal', 'begin'], ['begin', 'shops'], ['shops', 'uniform'], ['shops', 'shoes'], ['shops', 'bag'], ['shops', 'bottle'], ['shops', 'complete'], ['uniform', 'complete'], ['shoes', 'complete'], ['bag', 'complete'], ['bottle', 'complete'], ['complete', 'receipt'], ['homeagain', 'mission'], ['outside', 'see'], ['see', 'browse'], ['browse', 'ask'], ['quiz', 'look'], ['exit', 'leave'], ['leave', 'sneakers'], ['sneakers', 'shoe'], ['shoe', 'tag'], ['tag', 'confused'], ['final', 'boxed']];
  const FORWARD_FADES = [['mp', 'mpdef'], ['mpdef', 'compare'], ['discount-def', 'formula'], ['formula', 'formula-reveal'], ['formula-reveal', 'summary'], ['offmeans', 'recall'], ['recall', 'percentrule'], ['percentrule', 'whatpercent'],
    ['whatpercent', 'check'], ['check', 'sneakerq'], ['sneakerq', 'thirty'], ['thirty', 'represent'], ['represent', 'topay'], ['topay', 'final'], ['pctofmp', 'discountpct'], ['discountpct', 'sneakersum'], ['left', 'two'], ['recap', 'takeaway']];
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
      s.el.classList.remove('is-sliding');
    });
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
    // Into a sheet (see SHEETS) from a screen next to it, the sheet slides up over the picture; out of it, it
    // slides back down (jumps further away are cuts). Screen 8 ends on one (see sheetUp).
    const onSheet = s => !!s.sheet || s.el.classList.contains('has-sheet');
    const sheet = changing && !reducedMotion && Math.abs(i - Game.index) === 1 && onSheet(from) !== onSheet(to);
    const fade = changing && !sheet && fadesBetween(from, to);
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
      slide(from, to);
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
      if (scene.sheet === 'panel') { // one big panel filling the screen, and Swifty's stand on it (not under the bar)
        el('div', 'sheet-panel', scene.world);
        if (!BAR_SCREENS.has(scene.id)) {
          const stand = el('img', 'sheet-stand', scene.world);
          stand.src = STAND;
          stand.alt = '';
          stand.draggable = false;
        }
      }
      [scene.bg, scene.react].filter(Boolean).forEach((src, i) => { // the picture, and a reaction to fade in over it
        const img = el('img', (scene.backdrop ? 'scene-bg scene-bg--feather' : 'scene-bg') + (i ? ' scene-react' : ''), scene.world);
        img.src = src;
        img.alt = '';
        img.draggable = false;
      });
      scene.ambient = el('div', 'scene-ambient', scene.world);
      scene.lamps.forEach(([x, y, r]) => FX.glow(scene.ambient, x, y, r, r * 0.8));
      if (!reducedMotion && scene.dust) FX.motes(scene.ambient, { area: scene.dust, count: 16 });
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
      const picture = scene.react || scene.bg; // a screen's reaction picture shows best what it is about
      if (scene.sheet) thumb.classList.add('si-thumb--sheet'); // on the big panel: a little cream panel, with Swifty's stand
      if (BAR_SCREENS.has(scene.id)) thumb.classList.add('si-thumb--bar'); // the question bar along its bottom, not the stand
      if (picture || (scene.sheet && !BAR_SCREENS.has(scene.id))) Object.assign(el('img', '', thumb), { src: picture || STAND, alt: '' });
      else thumb.classList.add('si-thumb--' + scene.look); // a screen the game draws (the shops): a tiny copy, in CSS
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
        // a fade between two screens of the same view (e.g. 4 → 5): the picture fading out moves with the new one,
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
      ASSETS + 'start button.png', WALK_SHEET.src, SWIFTY.fly.src, SWIFTY.stand.src, ART.money, ART.book,
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
