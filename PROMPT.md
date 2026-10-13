# Bookstore Journey — Game Prompt

> A full description of the **Profit & Discount** game: the story that teaches the ideas (Screens 1–42), then the shopping game that uses them (Screens 43–55).
> You can paste this into any AI coding tool to rebuild or extend the game.
> Items marked ✨ are extra effects added on top of the original request.

---

## 1. What to build

A short animated **story game** for kids that runs in a web browser. It asks a first profit-and-discount question, then carries the story on to the next idea: the price printed on the book.

- **Format:** 16:9, on a fixed **1920 × 1080** stage that scales to fit any screen (black bars when the screen is a different shape).
- **Tech:** plain HTML + CSS + JavaScript. It opens by double-clicking `index.html`, with no server, installs, or internet needed.
- **Look:** bright, friendly, comic-book style. Rounded bold font (**Baloo 2**); in Screen 19's hand-made recap, headings and notes are in a handwriting font (**Kalam**, bundled in `fonts/`). The **₹** sign is drawn in its everyday shape (taken from Nunito Black and sized to match Baloo 2's figures), not Baloo 2's own Devanagari-style one. Both fonts are bundled in `fonts/`, so no internet is needed.
- **Speech bubbles:** **one design everywhere**, as in the design reference: a flat off-white rounded rectangle (18 px corners) with **no outline** and a soft shadow under it, sized to fit its text (**34 px**, dark ink, with room round the words), sitting straight so the words are crisp. Its tail is a **small straight-sided point**, the same on every bubble, from the edge that faces the speaker (the bottom, or a side when the speaker is beside the bubble), aimed at them and always stopping about 26 px short: **a bubble never touches anyone**. **Swifty's bubbles** sit above her head, well inside the panel, their point straight down at her, clear of her head feathers. Thought clouds keep their puffy shape and trail of little puffs, in the same flat off-white with the same soft shadow.
- **Never an empty box:** a card, sheet, table, strip or box appears only with its first words: e.g. a worked solution's white sheet comes in with its first line, the summary's table with its first row, the Discount card with its heading, the sneakers card with their photo, the price card on Screen 14 with ₹1000 on it.
- **Panel screens:** every teaching screen (11–13, 16–19, 25–32, 34–35) is on **one big cream panel that fills the screen**, drawn by the game (paper grain, a faint dot grid, an inked edge with rounded corners, a thin deep-teal border), with **no picture or blur behind it**. Swifty always stands on **her stand**, a small stack of three books (red, blue, yellow) in the bottom-right corner, **in the same place and at the same size on every panel screen**, standing with **both feet flat on the top (red) book**, with her speech bubbles above her head. **Swifty is only on the screen while she has something to say.** Her talk comes in **runs of screens, one after another: 11–13, 16–19, 25–32, 34–35, 50–51 and 54–55** (and Screen 8 on its own, whose answer is explained on the big panel too: it slides up over the picture once the player answers). She flies in to her stand just before the first line of a run (while the last piece of content builds, so she lands as she starts talking), **stays on her stand through the whole run** (carried across each dissolve without moving, her last bubble staying up until the screen changes), and after the last line of the run her bubble goes and she waves and flies off (her stand waits empty until her next run). On question screens she stays while the player answers (she has just asked the question) and explains; at the end of a run she flies off before the Next button appears. The things on these screens sit right on the big panel (they have no frames of their own; cards and sheets keep theirs). In the shopping game's own screens (the streets, Shopping Complete and the receipt: Screens 44–49) Swifty doesn't stand on her books: she speaks from **the question bar** at the top of the screen (see *The shopping game*). On the shopping game's panel screens (50, 51, 54 and 55) she stands on her books, as here.
  - From a story picture, the big panel **slides up** from the bottom over it and settles with a little bounce (its top edge casts a soft shadow); going back to a story picture, it **slides back down**. Between two panel screens only what is on the panel changes (a dissolve).
- **Hand-made look (on Screens 13 and 28 first, to be used everywhere once approved):** everything looks made by hand from paper, card, tape and ink, like the design board made from the design prompt (`design/hand-made design board.png`; no glossy gradients, no hard black offset shadows, no identical perfect shapes):
  - the big panel is **cream drawing paper with a deckled edge**, with a soft grain and a faint dot grid, lying on a **deep teal cloth-bound board**;
  - **buttons** (Next, Back, the page counter, the Scenes button and the big Next button) are **cardboard cut by hand**, inked round the edge in warm charcoal, with a soft shadow; they press down when clicked, and a soft gold glow pulses round one that is waiting;
  - **price cards** are coloured paper (mustard yellow for Marked Price, sky blue for Selling Price, tomato red for Discount) cut by hand, a little tilted, held on with **masking tape**;
  - **questions** sit on a lilac paper strip; **answers** are cream paper strips with a round **letter sticker** (with a white rim); a right answer is filled in with **green crayon** (its sticker turns green with a tick), a wrong one with **coral crayon** (its sticker turns coral with a cross);
  - **speech bubbles** stay the clean vector bubbles used everywhere (see Speech bubbles);
  - "look here" is a **quick loop in red marker** instead of a glowing ring;
  - words stay crisp (only the paper and lines behind them are roughened).
- **The shopping game (Screens 43–55):** after the story the learner **plays**: with ₹5,000 and a school shopping list, they find the best deal for each item, street by street, and the game ends with what Aniket bought, what he paid, what is left, and what we learnt. **Learning becomes the gameplay.** These screens are drawn by the game on a light blue (the streets on their own picture, `game background.png`), with the story's own pieces (Swifty, who speaks from a question bar at the top of the screen in the game itself and stands on her books on the big panel, Aniket walking in, the speech bubbles at home, the answer buttons, the worked sheet, the big panel and the home picture), the Shopping Area's design sheet, and the streets' asset sheet made with ChatGPT (tags, badge, ribbon and button, all without words: the game writes them); the streets' shop fronts are cut from `new shops for game .png`, and their sign and clouds are drawn by the game, as in the street's design. See *The shopping game*, after Screen 42.
- **Characters:** **Aniket** (boy, green T-shirt, navy backpack), the **Shopkeeper** (glasses, navy apron) and **Swifty** (a teal bird with a backpack, the helper; "she").
- **Voices:** every line is spoken aloud in an **Indian-English voice** (see section 6).

## 2. Assets (`game assets/`)

| File | Used on |
|---|---|
| `start screen.png` | Start screen background (it already has the "Bookstore Journey" title) |
| `start button.png` | Start button, placed **below the title text** |
| `starting boy talking with father.png` | Screen 1: at home, Aniket, ready to go out, talks to his father on the sofa |
| `mall outside view .png` | Screen 2: Aniket (drawn in the picture) outside the mall, looking up at its entrance and the **MALL** sign |
| `book store outside view.png` | Screen 3 background (inside the mall), and Screen 20 (Aniket coming out): the BOOKS & MORE store front, with cool frosted glass windows and double glass doors in the middle; the wall lamp on the left and the ceiling lights behind the glass glow softly |
| `aniket walking sprite sheet.png` | Screen 3 walking animation (8 frames) |
| `aniket saw a book.png` | Screen 4 |
| `aniket hold the book scene.png` | Screen 5 |
| `aniket give a book to shopkepper.png` | Screens 6, 14 and the start of 15 (on 14–15 the shopkeeper's open-hand gesture "explains") |
| `what is discount.png` | The same picture with Aniket **puzzled** (it lines up exactly; only his face differs): fades in on Screen 15 when he hears "discount" |
| `ui/book-stack.png` | **Swifty's stand** on every panel screen: a stack of three books (red, blue, yellow), cut out of a notebook illustration made with Figma AI |
| `aniket give money to shopkeeper.png` | Screens 7 and 8 (Aniket hands over ₹800 in three "SPECIMEN" notes: ₹200, ₹100 and ₹500) |
| `ui/money-in-hand.png`, `ui/book.png` | Cut from the story pictures (the notes in the two hands; the book): the pictures on the Cost Price / Selling Price cards on Screen 8 |
| `boy see the book .png` | Screen 9 (seen from behind Aniket: he looks at the book, with its ₹1000 sticker) |
| `shocked aniket.png` | Screen 10 (the same view, Aniket shocked, his mouth open) |
| `bird fly .png` | **Swifty** (teal bird with a backpack) flying, 8 frames |
| `bird talk .png` | Swifty standing and talking, 8 frames |
| `shoes shop enter.png` | Screen 21: Aniket walks into a shoe shop in the mall; blue sneakers on a stand, a white **₹1800** tag hanging from them and a red **30% OFF** label on the front of the stand |
| `he saw a shoe.png` | Screen 22: Aniket at the stand, pointing at the sneakers and their ₹1800 tag; and Screen 33, where the tags are updated |
| `hee see discount on shoes.png` | Screen 23: the same view (it lines up with Screen 22's picture to within a few pixels; only Aniket differs), Aniket with his hand on his chin, looking at the 30% OFF label |
| `he is tinking to see the shoes.png` | Screen 24: nearly the same view (the stand is drawn a little closer, so its label sits a little lower and bigger), Aniket confused, hand on his chin |
| `ui/sneakers.png` | Made from `he is tinking to see the shoes.png`: a product photo of the blue sneakers (they and the stand top kept sharp, the shop softly blurred behind), for the card on Screen 25, and on Screens 29 and 31 |
| `boy return home .png` | Screen 36: back home, Aniket (with the new book and the sneakers in a bag) talks to his father at the dining table |
| `boy and his father talking.png` | Screen 37: Aniket and his father talk across the dining table |
| `father gave him list.png` | Screen 38: his father hands Aniket the list (School Uniform, School Shoes, School Bag, Water Bottle) |
| `father gave him money.png` | Screen 39: the same view; his father holds out a fan of ₹500 notes |
| `boy take money in his pocket.png` | Screen 40: the same view; Aniket tucks the money into his pocket |
| `boy stand and talk .png` | Screen 41: his father, seated, gives advice; Aniket stands by the table with his backpack |
| `return home shopping list .png` | Screen 52 (back home at the end): Aniket, on the left, comes home with his backpack and a blue shopping bag; his father, on the right, sits at the table with his tea and the newspaper (a runner on the table, a fruit basket at its far end) |
| `game begins.png` | Screen 42: Aniket outside his house (No. 27), ready to go shopping |
| `game begin panel sheet .png` | The design's sheet for Screen 42's panel: the pieces are cut from it into `ui/begin/` |
| `ui/begin/` | Screen 42's panel: `panel.png` (made at the design's size from the sheet's panel), `banner.png`, `ribbon.png`, `wallet.png`, `button.png` (the list's four items are the game's own pictures, from `ui/shop/`; the sheet's shirt, shoe, bag and bottle icons were removed) |
| `select shop sheet.png` | The design's sheet for Screen 43 (the shop cards, their pictures, the checkboxes, the wallet, the "Selected" and "Tap to Select" tags): the pictures are cut from it into `ui/shop/` |
| `game background.png` | The streets' picture (Screens 44–47): a blue sky, trees on both sides, a light-blue town behind a green hedge, a pink pavement and the road with its white dashes. The game puts the sign, the shops and two drifting clouds over it |
| `new shops for game .png` | The streets' three shop fronts, made with ChatGPT (a transparent PNG, nothing written on them): red, blue and purple, each with a sign with a bump on top, a striped awning with a scalloped edge, and a cream front with a big window and three lamps. They are cut from it into `ui/street/front-coral.png`, `front-blue.png` and `front-purple.png` (494 × 514 each, the same size, so the game's words sit in the same places on all three) |
| `sheet .png` | The streets' asset sheet, made with ChatGPT (a transparent PNG, nothing written on it): three shop fronts (coral, blue, purple: a blank board, a striped awning with a scalloped edge, a window with a shelf, a plain wall, a step), the green street sign, the white price tag, the red offer tag, the green badge, the yellow ribbon and the yellow button. The pieces are cut from it into `ui/street/` |
| `ui/street/` | The streets' pieces: `front-coral.png`, `front-blue.png`, `front-purple.png` (the shop fronts, see above), `tag-price.png` and `tag-offer.png` (the white and red tags on the offer cards and the takeaway), `pill.png` (what you pay), `ribbon.png` (best deal), `button.png` (Buy). The game writes the words on them in its own font: "Marked Price" and the amount, the offer, "You pay ₹…", "Best deal!", "Buy for ₹…". (`shop-coral.png`, `shop-blue.png`, `shop-purple.png` and `sign.png` were the first streets' shop fronts and sign; they are kept but no longer used.) |
| `boy uniform.png` | The boy's school uniform (a white shirt, a blue tie, blue shorts), made with ChatGPT: trimmed and sized into `ui/shop/icon-uniform.png` (365 × 440) |
| `school shoes .png` | Black school shoes (a pair of laced, shiny black shoes), made with ChatGPT: trimmed and sized into `ui/shop/icon-shoes.png` (520 × 390) |
| `school bag.png` | The school bag (blue, with a yellow front pocket and yellow zips), made with ChatGPT: trimmed and sized into `ui/shop/icon-bag.png` (396 × 440) |
| `ui/shop/` | The shopping game's pictures: `icon-uniform.png`, `icon-shoes.png` and `icon-bag.png` (made from `boy uniform.png`, `school shoes .png` and `school bag.png`; the sheet's first uniform, sneakers and bag were replaced by them), `icon-bottle.png` (the water bottle, redrawn sharp at 328 × 600 in the sheet's design and colours: the sheet's bottle was only 94 × 172 and looked blurry when shown big) (the items, the same pictures everywhere: the Game Begins list, the Shopping Area's cards and list, the shop windows, the offer cards, the street's list, Shopping Complete, the receipt, the table at home and Mission Complete), `wallet.png`, `check-empty.png` and `check-done.png` (the list's boxes, empty and ticked; the tick also marks a bought item), `money.png` (the notes that fly from the wallet to the shop) |
| `vo/vo001.ogg` … `vo/vo125.ogg` | **Every spoken line of the story, recorded**: 125 clips (Ogg Opus, 32 kbps, mono; 1.7 MB in all), one per line, made with the TTS studio *Ai Wala Human By Aamir*. How they are made, checked and remade: **`docs/VOICEOVER.md`** |

**Cutting the sprite sheet properly:** the 8 frames are **not** evenly spaced, and each frame's box overlaps the next one, so cutting the sheet into an even grid would clip the neighbouring frame.
Cut every frame along its **own outline**, line all frames up on the **same head/body point** and the **same floor line**, and save them as a clean strip with gaps between frames.
Also play the frames in an order that gives an even step rhythm (the original order limps), and move the boy at the same speed as his stride so his feet don't skate.
Cut both bird sheets the same way. Line up the flying frames on her body centre and the standing frames on her feet, and draw both at the same size so switching between them never jumps.

## 3. Screens

### Start screen
- Background: `start screen.png` with a slow zoom.
- `start button.png` sits **under the title**, gently floating with a pulsing glow ✨ (no text label).
- Click: chime and sparkle burst ✨, then cut straight to Screen 1 (no fade).
  (The first click also turns sound on, because browsers block sound until the player clicks.)

### Screen 1 — Talking to Dad
- Background: `starting boy talking with father.png`: at home, Aniket (his backpack on, ready to go out) stands on the left, talking to his father, who sits on the sofa on the right with a cup of tea. A slow drift, the daylight through the open door softly glowing, and dust floating in the sunlight ✨.
- A conversation, **one person at a time** (each bubble goes before the next one comes), every line spoken in its speaker's voice:
  1. **Aniket:** **"Dad, I want to buy a book and a new pair of sneakers from the mall."** (lines: "Dad, I want to buy / a book and a new / pair of sneakers / from the mall."), on the wall right of his face, its point at his mouth from the side.
  2. **Father:** **"Sure. But compare the prices and buy wisely."** (lines: "Sure. But compare / the prices and / buy wisely."), on the wall up-left of his head, its point down at his mouth.
  3. **Aniket:** **"I will!"**, just up-right of his face, its point down at his mouth.
- About 3 seconds later, a smooth **cross-fade into Screen 2** (he heads to the mall).

### Screen 2 — At the Mall
- Background: `mall outside view .png`: Aniket (drawn in the picture, smiling, his backpack on) stands outside the mall, looking up at its glass entrance and the **MALL** sign.
- **Just the picture, held still:** no animation at all (no slow zoom, no glowing lights or floating dust, no shift when the mouse moves), and no words. Screen 1 dissolves into it, without the usual little zoom.
- About 3 seconds later, a straight **cut to Screen 3**, where he walks up to the bookstore inside the mall.

### Screen 3 — The Bookstore
- Background: `book store outside view.png`.
- Aniket walks in **from the left**, **slowly**, and stops at the **front (bottom) of the store**.
- **Footstep sound** on every step. The sound follows him from left to right ✨.
- Soft shadow under his feet and a faint reflection on the shiny floor ✨.
- When he arrives, a comic **"!"** pops above his head and the **BOOKS & MORE** sign shines ✨.
- Then a smooth **cross-fade into Screen 4**, with the camera pushing into the store as it fades ✨.

### Screen 4 — He Sees a Book
- Background: `aniket saw a book.png`, with Aniket's hand on his chin as he looks at the book on the table.
- **Nothing else** on this screen: no speech bubble, no text. It only has the gentle movement every screen has.
- **The books on the display stand have names**, written by the game on their covers as if printed there (the same on Screen 5): **Magic Tree** (the green cover with the tree), **Golden Hills** (the sunset over the hills, in dark brown on its pale sky) and **Starry Nights** (the night sky over the mountains). Each name sits in its cover's top part, slanted with the cover (the books lean back on the stand), and moves with the picture.
- After about 3 seconds, a smooth **cross-fade to Screen 5**.
  Screens 4 and 5 use the same camera shot, so the fade looks like Aniket picking the book up ✨. During the fade both pictures move as one (even if the mouse moves), so the stand and the books' names never double.

### Screen 5 — An Interesting Book
- Background: `aniket hold the book scene.png`. The books on the display stand have their names, as on Screen 4: **Magic Tree**, **Golden Hills** and **Starry Nights**.
- Comic speech bubble from Aniket: **"This book looks interesting!"**
  The text types in letter by letter with little "voice" blips ✨.
- Sparkles twinkle around the book ✨.
- **Wait 3 seconds**, then a smooth **cross-fade** to Screen 6.

### Screen 6 — How Much?
- Background: `aniket give a book to shopkepper.png`.
- First Aniket: **"How much is this book?"** His bubble then disappears.
- Only then the Shopkeeper: **"It's ₹800!"** ("₹800" in orange). The two bubbles are **never on screen together**.
- Hold on this moment for 3 seconds, then cut straight to Screen 7 (no fade).

### Screen 7 — Paying ₹800
- Background: `aniket give money to shopkeeper.png`.
- **Pop sound**, and a **small ₹800** badge pops up **just above the money**. It shows only "₹800", with no breakdown of the notes.
- Sparkle burst and a cash-register "ka-ching" ✨ (no confetti).
- After about 2.5 seconds it moves on to Screen 8. It's the same picture, so there's no visible cut.

### Screen 8 — Think Like the Shopkeeper (question)
- Background: the **same picture as Screen 7**, so Aniket and the shopkeeper are still there, just like the screen before.
  It carries on from Screen 7 seamlessly, with no fade and no jump.
- The ₹800 badge shrinks away, and the camera **glides left** so both characters stay in view on the left side.
- A **question card slides in from the right**. It swings in with a springy overshoot and a little tilt, then settles.
  A strip of gold tape drops onto its top ✨, and the content appears one piece at a time.
- Show **only** this on the card:
  - **For the shopkeeper,**
  - **₹800 is the —** (₹800 big, with a yellow highlighter swipe behind it ✨)
  - Two answer buttons: **Cost Price** and **Selling Price**
- **Card design ✨:** cream paper with a faint dot grid, a thick dark outline, a chunky drop shadow and round corners.
  The right side of the scene softly blurs and darkens behind it so the card stands out.
- **Button design ✨:** big chunky buttons with an A / B badge. They lift on hover and press down on click.
- No auto-advance here: the story moves on only through the answer flows below, or the top-right Next.

#### Wrong answer (Cost Price) — Swifty helps
1. The button shakes, turns red with a ✗ and plays a soft "buzz".
2. The **big panel slides up** over the picture, as on the teaching screens (no picture or blur behind it), with Swifty's stand of books in its bottom-right corner, and the question card **glides to the middle** of the panel, left of the stand.
3. **Swifty flies in** to her stand, flapping, using `bird fly .png`, lands on the top book with a little squash, a chirp and a soft shadow, and switches to `bird talk .png`.
4. She **talks**, with her beak moving while her voice reads the line. Her bubble above her head (40 px text on this screen, bigger than the usual 34 px, so it reads clearly) says:
   **"Think again. The shopkeeper sold the book for ₹800."** (lines: "Think again. / The shopkeeper / sold the book / for ₹800.")
5. Then her bubble goes, the card makes way for the **two definition cards**, which sit right on the big panel left of her stand, and she reads them out from her stand.
   The cards are **big and clear**, filling the panel left of her stand: each 610 px wide, the title at **60 px**, the two pictures 214 × 171 px, the definition at **54 px**.
   The cards are taught **one at a time**, **Cost Price first**, and **Selling Price only after CP is complete**:
   - **Cost Price (CP)** (blue card): picture of money → picture of the book. "Price at which an item is **bought**."
   - **Selling Price (SP)** (yellow card): picture of the book → picture of money. "Price at which an item is **sold**."
   Each card **eases in** piece by piece: card → title → first picture → the arrow drawing itself → second picture → definition → a highlighter swipe on the key word.
   There's a short pause to read before the next card. Swifty waves her wings at each card as it arrives and **reads it out**: its name ("Cost Price. C P.") as the title appears, then the definition once it is up and she has finished the name.
   The pictures are cut from the game's own artwork.
   Then Swifty talks again, from a bubble above her head (40 px text, as her hint):
   **"Here, ₹800 is the shopkeeper's Selling Price."** (₹800 in orange, *Selling Price* in green)
6. She flies off, and about **3 seconds after everything is up** a big **Next ▶** button appears at the bottom, just left of her empty stand; it moves the story on to Screen 9 (the big panel slides back down).
   There is **no Try again** button: after a wrong answer the player learns the two terms and carries on.

#### Right answer (Selling Price) — "Correct!"
- The button turns green with a ✓, a happy chime and a sparkle burst.
- The **big panel slides up** over the picture (with Swifty's stand in its corner), and the card **glides to the middle** of the panel, left of the stand.
- There the card **flips over** to show:
  - a green header with a ✓ badge: **Correct!**
  - **"The shopkeeper sold the book for ₹800, so ₹800 is the Selling Price."** (₹800 highlighted, *Selling Price* in green)
- **Swifty flies in** to her stand. She points at the card and reads it out in her voice ("Correct! The shopkeeper sold the book…"), her beak moving, standing straight, then flies off.
- **3 seconds later**, the same big **Next ▶** button appears just left of her stand and moves the story on to Screen 9 (the big panel slides back down).

### Screen 9 — A Closer Look
- Background: `boy see the book .png`: seen from behind Aniket, he looks at the book in his hands.
- Reached from the question screen as its **big panel slides back down** (there is no "Aniket holds his new book" screen in between).
- A **glowing gold ring pulses around the ₹1000 sticker** ✨ to draw the eye to it. No words.
- After about 3 seconds, a quick **cut** to Screen 10. It's the same view, so only Aniket's reaction changes.

### Screen 10 — What Is This?
- Background: `shocked aniket.png`.
- The picture **jolts** with a comic "zwip-bwong!" surprise sound ✨, and the ring around ₹1000 pulses.
- Aniket's bubble (34 px text), spoken in his voice. It sits right of his head, above the book, with its tail at his hair (his face is turned away):
  **"₹1000? What is this?"** (lines: "₹1000? / What is this?", ₹1000 in orange)
- After about 3 seconds the big panel slides up over it: Screen 11.

### Screen 11 — Marked Price
1. The **big panel slides up** over the shocked picture (see Panel screens).
2. A big **picture of the book** eases in on the left of the panel. It's drawn to match the cover in the story: blue, "A Brighter Tomorrow", sun, mountains and river, with the **₹1000 sticker** and barcode.
3. **Swifty flies in** and lands on **her stand**.
4. She talks, with a bubble above her head (34 px text) and her voice:
   **"₹1000 is the price written on the book."** (₹1000 in orange)
   As she speaks, a gold ring pulses around the sticker. A line then draws from the sticker to a round **zoom lens**, which pops open showing **₹1000** big ✨.
5. Swifty waves, her first bubble goes, and a new one says:
   **"It is called the Marked Price (MP)."** ("Marked Price (MP)" in red as the new term)
   **Just after she says it**, a pink label drops in under the lens: **Marked Price (MP)**.
6. She stays on her stand (Screens 12 and 13 carry on her explanation). About 3 seconds later the screen **dissolves into Screen 12**.

### Screen 12 — Marked Price definition
- Carries straight on from Screen 11: the big panel and the book **stay exactly where they are**. Only the right side dissolves away (the lens, the label and the line). Swifty, still on her stand, reads the definition.
- A **definition card** eases in beside the book, matched in height to the book. A blue header **Marked Price (MP)** drops in ("(MP)" in yellow).
- The definition appears **word by word** while **Swifty reads it out** from her stand, her beak moving (the card itself is the text she reads, so no bubble here):
  **"The price marked or printed on an article is called its Marked Price."**
  Line breaks follow the storyboard: "The price marked or / printed on an article / is called its / **Marked Price.**"
- **marked** and **printed** get a yellow highlighter swipe, and a gold ring pulses around the ₹1000 sticker on the book (the price "marked on the article").
- About 3 seconds later it **dissolves into Screen 13** in the same way.

### Screen 13 — Compare MP and SP
- Carries straight on from Screen 12 in the same way: the big panel and the book stay exactly where they are, and the right side changes; Swifty is still on her stand. After her question her run ends, so she flies off.
- The comparison builds on the right of the book, one piece at a time, Swifty saying each step from her stand (34 px text, above her head), a new bubble for each line:
  1. A cream-yellow card: **₹1000 / Marked Price**, held on with a strip of yellow washi tape, a little tilted, like a paper cut-out. The ring pulses on the ₹1000 sticker. "The Marked Price is ₹1000."
  2. A thick **blue marker arrow** draws itself downwards (no question mark beside it).
  3. A light-blue card: **₹800 / Selling Price**, taped on with blue washi tape. "But the book was sold for ₹800. That is the Selling Price."
  4. She asks: **"Why is the Selling Price less than the Marked Price?"** This sets up the next idea, discount, and the question stays up until the screen moves on.
- About 3 seconds later the **panel slides back down**, revealing Screen 14 (the sharp counter scene).

### Screen 14 — Shopkeeper reveals the reduction
- Background: `aniket give a book to shopkepper.png`, framed like the question screen: the camera is shifted left so Aniket and the shopkeeper stay in view, and a soft blurred copy fills in past the picture's right edge from the first frame.
- The shopkeeper's speech bubble (34 px text, his deeper voice), split into three parts that type and speak one at a time. **As he says each price, it flies out of his bubble to a card on the right** and is pasted into its place: a copy of the amount lifts off the bubble (a little bigger, with a soft shadow and a "swish"), glides along a low arc while turning from orange to the card's colour, and lands exactly on its place; its box appears around it with a little squash, like a sticker pressed on (a "pop"). The amount stays in the bubble.
  1. **"The price printed on the book is ₹1000,"** → the ₹1000 flies out, and the card (the same cream, dotted, chunky style as the question card) **swings in from the right to catch it**: the cream-yellow **₹1000** box is pasted onto the card as it lands.
  2. **"but you paid only ₹800."** → a **red arrow grows downwards** with a falling "whoop", then the ₹800 flies into the light-blue **₹800** box.
  3. **"So, you got a ₹200 discount."** → the ₹200 flies beside the arrow: **"₹200 reduced"**, in red, which keeps gently glowing.
  Bubble lines: "The price printed on / the book is ₹1000, / but you paid only ₹800. / So, you got a ₹200 discount." (the prices in orange, **discount.** in red as the new word; at the end it pulses, with a soft "ding")
- The ₹1000 and ₹800 boxes keep the **same colours as Screen 13** (yellow = Marked Price, blue = Selling Price), so the learner can see it's the same comparison, now with its explanation.
- About 3 seconds later it carries straight on to Screen 15.

### Screen 15 — Aniket asks about discount
(The storyboard calls the boy "Amit". In the game he stays **Aniket**.)
- The same picture, carried straight on from Screen 14 with no visible cut. The camera, the card and the shopkeeper's bubble are exactly where they were.
  Then his bubble shrinks away, the card **swings back out to the right**, and the camera **glides back to the middle** (the soft right edge eases away halfway through the glide).
- The shopkeeper has said the new word on Screen 14, so he says nothing more here:
  1. Aniket doesn't know the word: his face **turns puzzled**, as `what is discount.png` softly fades in over the picture (only his eyebrows, eyes and mouth change), with a curious rising "hmm?" ✨.
  2. Aniket **wonders in a thought cloud** (not a speech bubble), read in his voice: **"Discount? What does that mean?"** ("Discount?" in red, the new word).
     The cloud floats above and to the right of his head, in the empty wall between him and the shopkeeper. Three little puffs, small to big, pop up one by one from the top of his hair with soft rising "plip"s ✨, then the puffy cloud (round bumps all the way round, the same outline and 34 px text as the speech bubbles) billows out of the last puff and the words type in. The puffs gently bob.
- About 3 seconds later it carries straight on to Screen 16.

### Screen 16 — Discount definition
(The answer to Aniket's question.)
- The big panel slides up over Screen 15 (the puzzled picture, with Aniket's thought cloud still on it). A **definition card springs up** (the same style as the Marked Price card on Screen 12: blue header, white body), a little left of centre.
- **Swifty flies in** from the right to **her stand** (the book stack in the bottom-right corner, as on every panel screen) and **points at the card** from there: her wings (talk frame 6) stretch out while she **stands straight**, blinking now and then.
- The header **Discount** drops in, then the definition appears **word by word** while **Swifty reads it out** in her voice, standing straight:
  **"The reduction given on the marked price of an item is called a discount."**
  Line breaks follow the storyboard: "The reduction given on the / marked price of an item / is called a **discount.**"
  **reduction** and **marked price** get a yellow highlighter swipe, and **discount.** is in red (the colour of the new word on Screen 15). It pulses at the end with a soft "ding".
- She waves, then **goes back to pointing at the card** for a moment.
- About 3 seconds later the card **dissolves away into Screen 17** (Swifty stays on her stand).

#### Screens 17–19 — Swifty on her stand
(The same on Screens 25–32 and 34–35.)
- Swifty **stays on her stand** in the bottom-right corner through Screens 16–19, carried across every dissolve without moving: she flew in on Screen 16, and flies off after her last line on Screen 19. On a direct jump to one of these screens she flies in first.
- **Every line she says comes in a speech bubble above her head** (34 px text), typed while she speaks; each new line's bubble takes the place of the one before. Prices are orange, and on Screen 19 the term names are in their colours.
- The panels sit **left of centre** so they never meet her or her bubbles.

### Screen 17 — Discount formula (built visually)
- The big panel stays exactly the same through the dissolve, so only the definition card visibly fades away.
- A panel springs up (the same cream, dotted, chunky style), and the **book** (the same "A Brighter Tomorrow" drawing with its **₹1000** sticker) eases in on the left, **big** (330 px wide, about as tall as the boxes with room to spare), so its title and its price sticker are easy to see.
- The sum builds one piece at a time, in the colours used since Screen 13, **with the amounts only** (the boxes have no names yet: **₹1000 − ₹800 = ₹200**), while Swifty points at each piece from her stand, without words (the sum speaks for itself):
  1. A gold ring pulses on the book's sticker. The first box (yellow) pops in empty, and the **₹1000 lifts off the sticker and flies into it** in an arc, growing and shedding its white sticker card so it lands as the box's value. Swifty points at it and says nothing (the sum builds by itself).
  2. **−** pops in, then the **₹800** box (blue); Swifty points at it, again without words.
  3. **=** pops in, then the **₹200** box (red) **lands like a stamp** with a sparkle burst; Swifty points at it.
- Then she says the formula in words from one bubble that types part by part, and **as she says each part, its box's name is written in above its amount** (left to right, in the box's colour; its place was kept, so nothing moves), while that part pops with a ring: "Marked Price," → **Marked Price** above ₹1000 → "minus Selling Price," → the − pops and **Selling Price** is written above ₹800 → "equals Discount." → the = pops and **Discount** is written above ₹200.
- Then a new bubble: **"So, the discount is ₹200."** (₹200 in orange), as the **Discount ₹200** box starts to glow, with a soft "ding"; it keeps glowing.
- About 3 seconds later the formula **dissolves away into Screen 18** (the big panel stays exactly the same).

### Screen 18 — Formula reveal
- A panel springs up with an empty **pink strip**. The formula in words builds on it part by part while Swifty says it, **with no bubble** (its words are on the strip: she only says them, her beak moving):
  "Discount" → "equals Marked Price," → "minus Selling Price."
  The colours are the ones used since Screen 13: **Discount** red, **Marked Price** brown-gold, **Selling Price** blue, with the operators in dark ink.
- "We can write it in short." A **blue box** springs up under the strip. Then, term by term, the **first letters light up** in the strip (a white key-cap pops behind each one: **D**, **M** + **P**, **S** + **P**), and they **lift out and fly down into the blue box**, growing as they go, to build **D = MP − SP**. Her bubble says "D for Discount," "MP for Marked Price," "SP for Selling Price." part by part (the voice spells out "M P" and "S P"). The = and − pop in between.
- Swifty's last bubble goes and she reads the short form out, **with no bubble** (it is written in the blue box): **"So, D = MP − SP."**, each part popping as she says it.
- Then Swifty **points at the formula**.
- About 3 seconds later the formula **dissolves away into Screen 19** (the big panel stays exactly the same).

### Screen 19 — Quick summary
- On the same big panel (a dissolve from Screen 18; Swifty stays on her stand).
- The recap looks **made by hand** on the big panel, left of her stand. The title **"Let's remember!"** is written in blue marker (handwriting) on a strip of paper held on with yellow washi tape, a little tilted. Swifty waves, and the title drops in as she says it.
- **Three index cards** (white, a red line under the heading, faint blue lines, each taped on with washi tape in its term's colour and a little askew; headings and notes in handwriting) appear **one at a time**, joined by **pencil arrows that draw themselves**. The recap is **general**: the cards and Swifty give each idea with **no amounts** (no ₹1000, ₹800 or ₹200), and each card fits its words, with one blank line under them. Everything is **big and easy to read**, filling the panel left of Swifty's bubbles: the taped-on **"Let's remember!"** at 64 px, cards 384 px wide with their headings at **50 px** and their notes at **37 px** (the faint blue lines spaced to sit under each line of writing), and **Discount = MP − SP** on the sticky note at 66 px. Each card pops in, then its description. Swifty says each one in her bubble:
  1. **Marked Price** (yellow band), "Price written on an item." "Marked Price is the price written on an item."
  2. **Selling Price** (blue band), "Price at which it is sold." "Selling Price is the price at which it is sold."
  3. **Discount** (red band), "Amount reduced from the marked price." "Discount is the amount reduced from the marked price."
- Then the formula pops in under the cards, on a **yellow sticky note**: **Discount = MP − SP** (Discount red, MP brown-gold, SP blue), with twinkles around it. Swifty's bubble says **"And remember the formula: Discount = MP − SP!"** (read aloud as "Discount equals M P minus S P") and she waves.
- Her run ends here: she flies off, and about 3 seconds later the **big panel slides back down**, revealing Screen 20: Aniket coming out of the bookstore.

### Screen 20 — Out of the Bookstore
- Background: `book store outside view.png`, the bookstore from the mall, as on Screen 3, with the same slow zoom and lights.
- A shop bell, and **Aniket steps out of the doors** (he fades in in front of the right-hand glass door as a glint sweeps across the glass, as if it has just swung shut). Then he **walks off along the mall to the right** (the same walk as on Screen 3, with footsteps), coming a little closer as he goes, and out of the picture. No words.
- About a second later, a **cross-fade into Screen 21**.
- A screen of the sneakers seen from outside the shoe shop (Aniket stopping at its window) is to come between this one and Screen 21, once its picture is made.

### Screen 21 — The Shoe Shop
- Background: `shoes shop enter.png`: Aniket walks into a shoe shop in the mall. A pair of **blue sneakers** stands on a display, with a white **₹1800** tag hanging from them and a red **30% OFF** label on the front of the stand.
- The slow zoom eases in towards the sneakers; the shelf and ceiling lights glow and dust floats in the light ✨.
- A soft glow pulses around the sneakers, then a light sweeps across them with twinkles and a sparkle sound ✨.
- Aniket's bubbles (34 px text), spoken in his voice, one at a time, beside his face with their tail at his mouth:
  1. **"These sneakers look good!"** (lines: "These sneakers / look good!")
  2. Then he notices the red label: a gold frame lights up round **30% OFF** on the stand, and he asks **"What does 30% OFF mean here?"** (lines: "What does 30% OFF / mean here?", 30% OFF in orange)
  3. **"Is this also a discount?"** (lines: "Is this also / a discount?", discount in red: the word he has just learnt)
- About 3 seconds later, a smooth **cross-fade with the camera pushing in on the sneakers** into Screen 22.

### Screen 22 — Tagged Price
- Background: `he saw a shoe.png`: Aniket has come up to the stand and **points at the sneakers and their ₹1800 tag** (the red 30% OFF label on the stand under them).
- **Nothing else** on this screen: no speech bubble, no text. It only has the gentle movement every screen has, the slow zoom easing in towards the price tags.
- About 3 seconds later, a smooth **cross-fade into Screen 23**. It's the same view and the camera carries on, so only Aniket changes.

### Screen 23 — 30% Off!
- Background: `hee see discount on shoes.png`: Aniket, **hand on his chin**, thinks about the red **30% OFF** label on the stand, under the ₹1800 tag.
- **Only the discount is highlighted**: the red 30% OFF label lights up with a **glowing gold frame** that hugs it (rounded corners, clear of the ₹1800 tag above it), pulsing gently, with four twinkles at its corners and a sparkle sound ✨.
- No speech bubble, no text.
- About 3 seconds later, a smooth **cross-fade into Screen 24** (the same view: only Aniket changes, and the lit tag stays lit).

### Screen 24 — What Does 30% Mean?
(Storyboard: "Amit is confused". In the game he stays **Aniket**.)
- Background: `he is tinking to see the shoes.png`: Aniket, confused, hand on his chin, at the sneakers' stand. Coming from Screen 23, the **30% OFF label is still framed in glowing gold** (on a direct jump it lights up first). This picture shows the stand a little closer, so during the fade the label and its frame move a little with it.
- **Three lines, one at a time**, all in Aniket's voice:
  1. A **thought cloud** (he wonders): **"What does 30% discount mean here?"** ("30% discount" in red). It floats on the wall right of his head; its three puffs rise from the side of his hair, then the cloud billows out and the words type in. It sits low enough never to touch the top edge, even at the camera's closest zoom.
  2. The cloud melts away, then a **speech bubble**, its tail at his mouth by his hand: **"The price tagged is ₹1800."** (lines: "The price tagged / is ₹1800.", ₹1800 in orange), while a gold frame lights up round the white **₹1800** card on the sneakers.
  3. In its place, a second bubble: **"Using 30% OFF! How much money I actually have to pay?"** (lines: "Using 30% OFF! / How much money / I actually have / to pay?", 30% OFF in orange), both tags still lit.
- About 3 seconds later the big panel slides up over it: Screen 25.

### Screen 25 — Recall Percentages
(Storyboard: "Bridge to percentage recall". Its robot is **Swifty** in the game.)
- On the big panel (it slides up over Screen 24: Aniket, his question and the lit tag), a **card springs up**, left of centre (the same cream, dotted, chunky style as the other panels):
  1. A **product photo of the blue sneakers** eases in (`ui/sneakers.png`).
  2. The white **₹1800** price tag **drops onto the sneakers**: it hangs on a string tied to the laces of the front shoe, like the tag in the shop's pictures, swings left and right, and settles, tilted a little against the shoe.
  3. Under the photo, the red **30% OFF** tag (tilted, like the one on the stand) **lands like a stamp**, then a **glowing gold frame** pulses around it, with a sparkle ✨.
- **Swifty flies in** from the right to **her stand** (bottom right, as on Screens 17–19), waves, and **points at the card**.
- Her speech bubble (34 px text, above her head) types and is spoken in two parts:
  1. **"To find the discount amount,"** → the 30% OFF tag pops.
  2. **"let's first recall how percentages work."** → the "30%" on the tag pops.
  Lines: "To find the / **discount amount**, / let's first recall / how **percentages** work." ("discount amount" and "percentages" in red, the key words)
- She points at it for a moment; she stays on her stand through Screens 26–32. About 3 seconds later the card **dissolves away into Screen 26** (the big panel stays exactly the same).

### Screen 26 — The Percentage Rule
(The storyboard's "a is what percent of b?", first in general, with letters; then Screen 27 works the same example with numbers. Swifty's lines are written for the game.)
- On the same big panel, the sneakers card fades away and a **panel springs up**: the same panel as Screen 27, but with **letters for the amounts**, *a* and *b*, in **italic** as in a maths book (a serif italic):
  - the **purple strip**: **"*a* is what percent of *b*?"**;
  - on the left, two boxes: **Part = *a*** and **Whole = *b***;
  - on the right, the **white sheet**, line by line, the = signs lined up: **Percentage = Part / Whole × 100**, then **= *a* / *b* × 100**, then **= (*a* / *b* × 100)%** (stacked fractions; the brackets as tall as the fraction).
- **Colours** as on Screen 27: *a*, the part, **blue**; *b*, the whole, **green** (in the question once they're named, the boxes, the formula and her bubbles); "Percentage" **red**.
- Step by step, in time with Swifty (she reads the question first; its words are on the strip, so no bubble), then her bubbles (34 px text, above her head):
  1. **"*a* is the part,"** → *a* in the question turns blue and pops, and the **Part = *a*** box pops in. **"and *b* is the whole."** → *b* turns green, and the **Whole = *b*** box pops in.
  2. **"To find the percentage,"** → "Percentage" is written in. **"divide the part by the whole,"** → "=" pops and the fraction Part / Whole is written in. **"then multiply by 100."** → "× 100" pops.
  3. The next line's "=" pops and its fraction bar draws itself. **"Put the part on top,"** → the little blue arrow over "Part" nudges down and ***a*** glides out of its box into the top of the fraction. **"and the whole below."** → ***b*** glides into the bottom. Then "× 100" pops.
  4. **"Then put a % sign after it."** (the % in orange) → the last line's "=" pops, and **(*a* / *b* × 100)%** lands like a stamp and is **marked** on a bright yellow box, *a* and *b* in the question pop, and twinkles sparkle around it.
  5. A new bubble: **"Let's take an example!"** ("example" in red, the key word), and she points at the panel.
- About 3 seconds later the panel **dissolves into Screen 27** (the big panel stays exactly the same).

### Screen 27 — What Percent?
(Storyboard: "a is what percent of b?", worked with numbers after the rule on Screen 26. The storyboard shows no dialogue here, so Swifty's lines below are written for the game.)
- On the same big panel, the rule's panel fades away and a **panel springs up** (the same cream, dotted, chunky style), left of centre. It holds:
  - a **purple strip** across the top with the question **"125 is what percent of 500?"** (plain numbers: no ₹ anywhere on this screen);
  - on the left, two boxes: **Part = 125** ("Part" on a light-blue label) and **Whole = 500** ("Whole" on a mint label);
  - on the right, a **white sheet** where the formula is worked out **line by line, the = signs lined up**:
    **Percentage = Part / Whole × 100**, then **= 125 / 500 × 100**, then **= 25%** (real stacked fractions with a bar).
- **Colours:** the part is **blue** and the whole **green** everywhere (in the question once they're named, the boxes, the formula and Swifty's bubbles); "Percentage" is **red**, as in the storyboard.
- Step by step, each in time with Swifty (she reads the question first; its words are on the strip, so no bubble), then her bubbles (34 px text, above her head):
  1. **"125 is the part,"** → 125 in the question turns blue and pops, and the **Part = 125** box pops in. **"and 500 is the whole."** → 500 turns green, and the **Whole = 500** box pops in.
  2. **"To find the percentage,"** → "Percentage" is written in (a left-to-right wipe with a marker scribble). **"divide the part by the whole,"** → "=" pops and the fraction Part / Whole is written in. **"then multiply by 100."** → "× 100" pops.
  3. The next line's "=" pops and its fraction bar draws itself. **"Put the part on top,"** → the little blue arrow over "Part" pops in and nudges down (as in the storyboard), and **125 lifts out of the Part box and glides into the top of the fraction**. **"and the whole below."** → **500 glides into the bottom**. Then "× 100" pops.
  4. **"125 ÷ 500 × 100"** → the last line's "=" pops. **"= 25%."** → **25%** lands like a stamp. **"So, 125 is 25% of 500!"** → 25% is **marked as the answer** on a bright yellow box, the two amounts in the question pop, and twinkles sparkle around the answer.
- About 3 seconds later the panel **dissolves into Screen 28** (the big panel stays exactly the same).

### Screen 28 — Quick CFU
(Storyboard: "Quick CFU", a check for understanding. The storyboard shows no dialogue, so Swifty's feedback lines below are written for the game.)
- On the same big panel, the formula panel fades away and a **panel springs up** (the same cream, dotted, chunky style), left of centre, with the question on the **purple strip** (as on Screen 27): **"250 is what percent of 1000?"** (plain numbers, no ₹) Swifty reads it out (its words are on the strip, so no bubble).
- **Three answer buttons slide in, stacked one above the other** under the strip: **A 20%**, **B 25%**, **C 50%** (wide, light blue, a blue letter chip on the left, the answer centred). Swifty points at them and waits.
- **Right (B 25%):** the button turns green with a ✓, a happy chime and a sparkle burst. Swifty: **"Correct! 250 ÷ 1000 × 100 = 25%."** As she says the sum, **250 in the question turns blue** (the part) and **1000 green** (the whole), as on Screen 27.
- **Wrong (A or C):** the button turns red with a ✗, shakes and buzzes; every button locks (**no second try**). Swifty: **"Not quite! 250 is the part, 1000 is the whole. 250 ÷ 1000 × 100 = 25%."** (four parts: 250 turns blue as she names the part, 1000 green as she names the whole, and at the end of the sum the right answer, **B**, lights up green).
- Both ways end with **"So, 250 is 25% of 1000."** while the right answer and the two amounts pop. 3 seconds later the big button appears **level with the last answer**, between the panel and Swifty. It says **Next** and leads to Screen 29.

#### Screens 29–32 — Back to the sneakers
(Storyboards 14–17. Screen 29 is a question; **whichever answer the player picks**, Screens 30, 31 and 32 follow in order: the working, what the answer means, and the amount to pay. Screen 31 is a question too, and Screen 32 has the player drag the amounts into place. Each screen dissolves into the next on the same big panel, with Swifty staying on her stand; after her last line on Screen 32 she flies off. Where the storyboards show no dialogue, Swifty's lines below are written for the game.)

### Screen 29 — Back to the Sneakers
- A **panel springs up**, further left than the others so the Next button fits between it and Swifty:
  - on the left, the **sneakers**: the product photo (`ui/sneakers.png`) with the white **₹1800** price tag hanging on them, and under it the red **30% OFF** tag (stamped, then framed in glowing gold), as on Screen 25;
  - on the right, the question on a **pink strip**: **"Now, what is 30% of ₹1800?"**, and under it three answers **stacked**: **A ₹360**, **B ₹540**, **C ₹720**.
- As the sneakers appear, Swifty: **"Now, back to Aniket's sneakers!"** Then her bubble goes and she reads the question out; "30%" on the tag pops as she says it, then the ₹1800 tag.
- **Right (B ₹540):** green ✓, chime, sparkles. **"Correct! 30% of ₹1800 is ₹540."** (the 30% and the ₹1800 tags pop).
- **Wrong (A or C):** red ✗, shake, buzz, every button locks (no second try). **"Not quite! 30% of ₹1800 is ₹540."** and B lights up green.
- Both ways: **"Let's see how to work it out!"** 3 seconds later the **Next** button appears level with the last answer, between the panel and Swifty.

### Screen 30 — Calculate 30% of ₹1800
- The question dissolves into a **worked solution**: a white sheet (on the cream panel) where the working is written line by line, its = signs lined up, each left-hand side sitting right up to its = sign (big writing):
  **30% = 30/100**, then **30% of ₹1800 = 30/100 × 1800**, then **= ₹540**. The fractions are real stacked fractions; **30/100 is pink**, as in the storyboard.
- Each line is written in (a left-to-right wipe with a marker scribble) as Swifty says it, pointing at the sheet:
  1. **"30% means"** → "30% =" is written in. **"30 out of 100."** → the pink fraction 30/100.
  2. **"So, 30% of ₹1800 ="** → "30% of ₹1800 =". **"30/100 × 1800"** (read "30 over 100 times 1800") → the fraction, then "× 1800".
  3. **"1800 ÷ 100 = 18,"** → "× 1800" and the 100 pop. **"and 18 × 30 = 540."** → the 30 pops. **"So, it's ₹540!"** → **₹540** lands like a stamp and is marked on a bright yellow box, with twinkles.
- About 3 seconds later it **dissolves into Screen 31**.

### Screen 31 — What Does ₹540 Represent?
- The sneakers panel springs up again (the same layout as Screen 29) with the question **"What does ₹540 represent here?"** and three answers stacked: **A Marked Price**, **B Selling Price**, **C Discount**. Swifty reads the question out.
- **Right (C Discount):** **"Correct! ₹540 is the money taken off ₹1800."** (the 30% OFF tag pops).
- **Wrong (A or B):** **"Not quite! ₹540 is the money taken off ₹1800."** (the 30% OFF tag pops), and C lights up green. No second try.
- Both ways: **"That's the Discount!"** ("Discount!" in red) while the right answer and the 30% OFF tag pop. 3 seconds later the **Next** button.

### Screen 32 — The Amount to Pay
- A **worked solution** springs up: on the left, **Marked Price (MP) ₹1800** (a cream-yellow box), a blue arrow growing down, and **Discount ₹540** (a light-red box); on the right, the white sheet.
- Swifty's line from the storyboard, in two parts: **"To find how much you have to pay,"** → "SP =" is written in. **"subtract the discount from the marked price."** → "MP", "−", "Discount" appear one after the other (the MP box and the Discount box pop as they appear). This line sits on a **light-blue band**: it's the rule. Colours as since Screen 11: SP blue, MP brown-gold, Discount red; in her bubble "subtract" is red, "discount" red, "marked price" brown-gold.
- **The player's turn (drag and drop):** the next line's "=" pops, then **two empty boxes** with a "−" between them: dashed outlines in their colours, each with its name faintly inside (**MP** brown-gold, **Discount** red). Swifty: **"Your turn! Drag each amount into its box."** ("Your turn!" in red)
  - A gold halo pulses round the amounts in the boxes on the left (**₹1800** and **₹540**): they can be picked up. A faint copy of ₹1800 glides into the MP box once to show how (and again whenever nothing happens for about 9 seconds).
  - **Drag** an amount (mouse or touch): a copy lifts out under the finger (its place in the box fades) and the empty box under it grows and turns light yellow. Or **tap** an amount (it lights up, and the empty boxes pulse), then tap a box. The keyboard works too: Enter on an amount, then Enter on a box.
  - **Its own box:** it settles in as the amount (**₹1800**, **₹540**, in their colours), with a pop, a sparkle burst, and Swifty waves.
  - **The other box:** a buzz, the box shakes and flashes red, the amount goes back, and Swifty explains what that box is for: **"Not quite! The MP box is for the marked price, ₹1800."** or **"Not quite! The Discount box is for the discount, ₹540."** The player tries again (as many times as needed). Let go anywhere else, it just goes back.
- Once both are in: **"₹1800 − ₹540"** (both amounts pop) **"= ₹1260."** → **₹1260** lands like a stamp. **"So, you pay ₹1260 for the sneakers!"** → ₹1260 is marked on the yellow box, with twinkles.
- As after a question, **3 seconds later the big Next button** appears under the panel (no auto-advance on this screen); it leads to Screen 33, dissolving into it.

### Screen 33 — Final Answer
(Storyboard 18: "Final answer and summary". The line is Aniket's, in his voice.)
- Background: `he saw a shoe.png` (the same view as Screens 22–32: Aniket at the stand, **pointing at the price tags**). Coming from Screen 32, the big panel slides back down off it (Swifty goes with it: her part is done), and the shop is sharp.
- Aniket's bubble (34 px text), right of his face above the sneakers, the tail at his mouth, typed and spoken **in his voice** in two parts:
  1. **"So, after a 30% discount,"** → the **30% OFF** tag on the stand lights up with its glowing gold frame (a sparkle), then **a red line draws itself across the ₹1800** on the tag hanging from the sneakers (a marker scribble): the old price is crossed out.
  2. **"I will pay ₹1260."** → a **green ₹1260 tag stamps onto the stand**, under both tags, a little tilted (a thud, a sparkle burst), with twinkles around it and a chime.
  Lines: "So, after a **30%** / discount, I will pay / **₹1260**." ("30%" in red like the OFF tag, "₹1260" in green like the new tag)
- The strike line, the gold frame and the green tag are on the picture, so they move with its slow zoom.
- About 3 seconds later the big panel slides up over it: Screen 34.

### Screen 34 — Discount Percentage
(Storyboard 19: "Discount percentage formula". Its robot is **Swifty**; her first line is the storyboard's.)
- On the big panel (it slides up over Screen 33: the shop with its updated tags and Aniket's line), **Swifty flies back in** to her stand and waves.
- A **worked sheet** springs up (the same style as Screens 30 and 32, big writing), and Swifty points at it:
  1. **"Discount percentage tells us what percent"** → "Discount % =" is written in. **"of the marked price has been reduced."** → the fraction **Discount / Marked Price**, then "× 100". This line, the rule, sits on a **yellow band** (the storyboard's yellow strip). Colours as since Screen 11: "Discount %" and "Discount" red, "Marked Price" brown-gold.
  2. **"The discount is ₹540,"** → the next line's "=" pops and its fraction bar draws itself; **540** pops in on top (red) while "Discount" in the rule pops. **"and the marked price is ₹1800."** → **1800** pops in below (brown-gold) while "Marked Price" pops. Then "× 100".
  3. **"540 ÷ 1800 × 100"** → the last line's "=" pops. **"= 30%."** → **30%** lands like a stamp. **"That's the 30% off on the tag!"** ("30% off" in red) → 30% is marked on a bright yellow box, with twinkles.
- About 3 seconds later the sheet **dissolves into Screen 35** (the big panel stays exactly the same).

### Screen 35 — Complete Summary
(Storyboard 20: "Complete summary". The storyboard shows no dialogue, so Swifty's lines below are written for the game.)
- On the same big panel, the summary springs up, left of centre:
  - a blue title pill, **"Sneaker Example Summary"** (as on Screen 19's summary);
  - a **table** of the four amounts: **Marked Price (MP) ₹1800**, **Discount % 30%**, **Discount amount ₹540**, **Selling Price (SP) ₹1260**. The label cells use the colours used since Screen 11 (Marked Price cream-yellow with brown-gold words, the two Discount rows light red with red words, Selling Price light blue with blue words); the values sit in white cells;
  - a **pink box of rules**, lined up at their = signs: **Discount = MP − SP**, **SP = MP − Discount**, **Discount % = Discount / MP × 100** (a stacked fraction), in the same colours (Discount red, MP brown-gold, SP blue).
- Swifty waves as the title drops in: **"Let's sum up the sneakers!"**
- The table pops in empty, then **fills row by row as she says it** (each label slides in, then its value pops): **"Marked price: ₹1800."** / **"Discount: 30%,"** / **"which is ₹540."** / **"Selling price: ₹1260."**
- The rules box pops in empty, then **each rule is written in as she reads it** (label, =, then what it equals): **"Discount = MP − SP,"** / **"SP = MP − Discount,"** / **"and Discount % = Discount ÷ MP × 100."** (her bubble shows the rules too, in the same colours; the voice reads "M P", "S P", "equals", "minus", "divided by" and "times").
- Twinkles sparkle around the panel and she waves: **"Now you can work out any discount!"**
- About 3 seconds after her last line she flies off, and the big panel **slides back down into Screen 36**.

### Screen 36 — Back Home
- Background: `boy return home .png`: back home, Aniket comes in with his backpack, the new book under his arm and the sneakers in a shopping bag; his father sits at the dining table with a cup of tea and the newspaper. A slow drift, the daylight through the far window softly glowing, and dust floating in the sunlight ✨.
- A conversation, **one person at a time** (each bubble goes before the next one comes), every line spoken in its speaker's voice:
  1. **Father:** **"How was your shopping?"**, on the wall up-left of his head, its point down at his mouth.
  2. **Aniket:** **"Great! I learnt about marked price, discount and discount percentage."** (lines: "Great! I learnt / about marked price, / discount and discount / percentage."), on the wall right of his face, its point at his mouth from the side.
  3. **Father:** **"That's useful, because you have another shopping job."** (lines: "That's useful, because / you have another / shopping job."), up-left of his head again.
- About 3 seconds later, a smooth **cross-fade into Screen 37**.

### Screen 37 — School Starts Soon
- Background: `boy and his father talking.png`: Aniket and his father sit facing each other at the dining table; his father talks, one hand raised. A slow drift, the daylight in the far doorway softly glowing, dust in the sunlight ✨.
- His father talks, **one line after the other**, from a bubble on the wall between them, its point at his mouth from the side:
  1. **"Your new school session starts in a few days."** (lines: "Your new school session / starts in a few days.")
  2. **"You still need some things for school."** (lines: "You still need some / things for school.")
- About 3 seconds later, a **cross-dissolve into Screen 38**.

### Screen 38 — The Shopping List
- Background: `father gave him list.png`: his father hands Aniket a list: **School Uniform, School Shoes, School Bag, Water Bottle**. No words.
- The camera **pushes in on the list** until it fills the middle of the screen, 1.7× bigger; the list glows, a shine sweeps across the paper, and twinkles sparkle at its corners (a soft sparkle sound).
- Then the camera **eases back out** to exactly the framing Screen 39 starts from, and Screen 38 **dissolves into Screen 39**: the pictures line up, so only what is in their hands changes (the list becomes the money).

### Screen 39 — ₹5,000 to Spend
- Background: `father gave him money.png`: the same view; his father holds out a fan of ₹500 notes. A slow drift (shared with Screen 40).
- The notes glow and shine, with twinkles and a cash-register **"cha-ching"** ✨. Then his father's bubble, up-right of his face, its point at his mouth: **"Here's ₹5,000."** (₹5,000 in orange; the voice says "five thousand rupees"), and the amount pulses with a soft "ding".
- About 3 seconds later, a **pure dissolve into Screen 40** (the same shot, the camera carried over).

### Screen 40 — Into His Pocket
- Background: `boy take money in his pocket.png`: the same view; Aniket tucks the money into his pocket, his father smiling. No words: a shine and twinkles on the notes, and a soft swish.
- About 3 seconds later, a **cross-fade into Screen 41**.

### Screen 41 — Find the Best Deals
- Background: `boy stand and talk .png`: his father, seated at the table, talks to Aniket, who stands by the table with his backpack. A slow drift, the sunny window softly glowing ✨.
- **One bubble at a time**, each spoken in its speaker's voice:
  1. **Father:** **"Use what you have learnt and find the best deals."** (lines: "Use what you / have learnt and / find the best / deals."), up-right of his head, its point down at his mouth.
  2. **Father:** **"Whatever is left after buying everything is yours."** (lines: "Whatever is left / after buying / everything / is yours."), in the same place.
  3. **Aniket:** **"Really?"**, up-left of his face, its point down at him.
  4. **Aniket:** **"Then I'm definitely finding the best offers!"** (lines: "Then I'm / definitely finding / the best offers!"), left of his face, its point at his mouth from the side.
- About 3 seconds later, a **cross-fade into Screen 42**.

### Screen 42 — Game Begins
- Background: `game begins.png`: Aniket, ready to go, outside his house (No. 27) by the gate, on the left. A slow drift, the morning sun softly glowing ✨.
- On the right, **the shopping challenge's panel, as in the design** (its pieces cut from `game begin panel sheet .png` into `ui/begin/`), building up one piece at a time:
  1. The **cream panel** springs up, and the blue **GAME BEGINS** banner drops onto its top with a little bounce (whoosh).
  2. The **"School Shopping Challenge"** ribbon unrolls under the banner.
  3. The **wallet, "Wallet ₹5,000"**, pops in; a shine runs across it with a cash-register "cha-ching".
  4. The **Shopping List** box springs up with its title; then each item comes in turn (its empty checkbox, its icon, its name): **School Uniform** (the boy's uniform: shirt, tie and shorts), **School Shoes** (black school shoes), **School Bag** (the blue bag with a yellow pocket), **Water Bottle** (bottle).
  5. The yellow **START SHOPPING ❯** button bounces in, then glows softly in gold while it waits to be pressed.
- The panel stands in the design's place (stage x 1000–1848, with the banner just under the top buttons); the list's box and its rows are drawn in the sheet's colours and the game's font.
- **START SHOPPING** waits for the player (there is no countdown; **Next** works too) and leads, with a cross-fade, to Screen 43.

### The shopping game (Screens 43–55)

After the story, the learner **plays**. Aniket has ₹5,000 and the school shopping list; for each item the learner checks three shops' offers, works out what each would cost, compares them and buys at the best one. **Learning becomes the gameplay.**

- **The game map (Screen 43, the Shopping Area):** four shopping zones: **Uniform Street** (School Uniform), **Shoe Street** (School Shoes), **Bag Corner** (School Bag) and **Bottle Stop** (Water Bottle). The learner can **choose any item first**.
- **Always on show:** the **wallet** (₹5,000 at the start) and the **Shopping List** (☐ Uniform ☐ Shoes ☐ Bag ☐ Bottle). As items are bought, **they get ticked** and the wallet goes down. On the Shopping Area it is the big white panel on the right; on the streets, two small white cards in the top-left corner (the wallet, then the list), as in the street's design.
- **The loop, for every item:** choose the item → see its street's three shops → check each offer → work out the amount to pay → compare the final prices → choose the best-value shop → buy the item → the wallet updates → back to the Shopping Area. When all four are bought, the game is complete (Screen 48).
- **The difficulty goes up street by street** (each street keeps its own numbers, whatever order they are played in): the learning section used easy values (₹1,000 − ₹800 = ₹200; 25% of ₹2,000 = ₹500); **Uniform Street**: the same marked price, different offer formats (how offers work); **Shoe Street**: the same marked price, two percentage offers (simple percentage discounts); **Bag Corner**: different marked prices and offers (don't choose by the percentage alone); **Bottle Stop**: different prices and mixed offers (find the actual final price, choose the best deal).
- **Numbers:** 10%, 20%, 25% and 50% (30% only when the price makes it easy); marked prices in round amounts (₹500, ₹800, ₹1,000, ₹1,500, ₹1,600, ₹1,800, ₹2,000 …); never awkward numbers such as 17%, 18%, 35% or ₹1,349. The arithmetic is never the challenge: the challenge is **understand the offer → calculate the final price → compare → make the best buying decision**.
- **Wrong answers** (on an offer and on the comparison alike):
  1. The first wrong pick **shakes, turns red and is crossed out**, and Swifty says **"Check how much you will actually pay."**
  2. The second is crossed out too, and Swifty gives **a hint about how**: for a percentage off, **"Find the discount first, then subtract it from the marked price."** (said in two halves, one bar line each); for an amount off, **"Subtract the discount from the marked price."**; for "get at" a price, **"“Get at” tells you the price you pay."**; on the comparison, **"Compare the final prices, not just the discount percentages."**
  3. The **one answer left glows** (attention on the calculation, or on the lowest final price) and the learner picks it to carry on.
  There is no losing: every item is bought at its best shop, so the totals always come out as below.
- **Two amounts are kept apart:** the **total discount received (₹1,060)**, the difference between the marked prices and the prices Aniket paid, and the **money left from the ₹5,000 budget (₹660)**, the amount he gets to keep. They are never both called "savings".
- **Next and Back** follow the game, not the screen numbers: on the Shopping Area, **Next** goes to the next item still to buy (Screen 48 once everything is bought); on a street, **Back** and **Next** go back to the Shopping Area (Next goes on to Screen 48 once everything is bought); from Screen 48, **Back** returns to the Shopping Area. Screen 42 starts the challenge afresh (nothing bought), and playing a street again buys its item again (it isn't counted twice).
- **Voices:** only Swifty and, at home, Aniket and his father speak: Swifty's lines on the question bar (on the big panel, in her bubbles), Aniket's and his father's in bubbles (the Shopping Area and Mission Complete have no one on screen, so no one speaks there).
- **The question bar (Screens 44–49: the streets, Shopping Complete and the receipt):** Swifty doesn't stand on her books here. She speaks from **a big white bar at the top of the screen** (132 px tall), always fully on it, in the top row between the wallet and the Back / Next buttons: **her face in a round frame inside its left end** (108 px; her real, animated self; the frame's ring turns teal and glows while she talks; no name), and beside it **what she says, written as she says it**, **at 34 px and always on one line**, one line at a time. The two lines too long for one line are said in two halves, one bar line after the other: the percentage hint ("Find the discount first," / "then subtract it from the marked price.") and Bag Corner's lesson ("Even though Shop A offers 25% OFF," / "Shop C has the lowest final price."). Between her lines it shows **what to do**, in a deep blue: the street and its item while the street builds ("Uniform Street · School Uniform"), "Here is how to work it out.", "Tap another shop to check its offer.", "Now compare the three offers.", "Next: back to the Shopping Area.". **While a question panel is up** (an offer card, the three offers compared) **the bar isn't needed: it slides away**, and the question is on the panel, **above its answers**; the bar slides back as soon as Swifty speaks (a hint, "Correct!", why a shop is the best deal), so she is always on screen when she talks. **Nothing is written twice:** what is on a panel (its question, each line of the working, the purchase slip) is never written again on the bar; Swifty reads the working and the slip out without writing them on it. It is **one bar for all those screens**: it slides up with the first of them and **stays put from one to the next** (it never jumps or blinks), and slides down for the Shopping Area and after the receipt. On the big panel's screens (50, 51, 54 and 55) it isn't there: **Swifty stands on her books**, with her speech bubbles above her head, as on every teaching screen.

### Screen 43 — Shopping Area
- No picture: the design's **light blue with soft circles**, drawn by the game. It shifts a little with the mouse, like the pictures do, while everything on it holds still. No one speaks here (no character is on screen): the "Tap to Select" pill is the instruction.
- **As in the design**, its pictures cut from `select shop sheet.png` into `ui/shop/`, and the cards, pills, sparks, panel and tags drawn in the sheet's colours and the game's font:
  - On the left, **four shop cards** (2×2), each in its shop's colour, its picture standing on its name pill, little sparks on both sides: **Uniform** (yellow), **Shoes** (pink), **Bag** (green), **Bottle** (purple).
  - On the right, a white **panel**: the **wallet** with its money in a pale pill, a thin line, and the **Shopping List**, each line a checkbox, the item's picture and its name.
  - Everything sits a little lower than in the design, so Back / Next stay clear (the panel from stage y 112, the cards from y 135).
- The first time, it builds up quickly: the panel slides in from the right while the cards pop up one after another; the wallet pops in and its money **counts up from ₹0 to ₹5,000** with a cash-register "cha-ching"; the list comes in line by line; then a **"Tap to Select"** pill drops in at the top, between the Scenes button and Back / Next, and bobs gently. Back from a street, the panel is there at once (the wallet showing what is left, the item bought ticked) and the cards pop up quickly. Every few seconds the cards still to visit bounce one after another, until one is picked.
- **Tapping a card picks that shop:** it springs, lifts and glows in its colour (as on the sheet), a yellow **"Selected"** tag pops up on its top edge, its sparks burst, and its line on the list lights up in its colour; "Tap to Select" goes away. A moment later the screen **pushes in on that card** while its street fades in. With a mouse, a card also lifts a little when the pointer is over it.
- **A bought item's card** turns **light grey** (its picture greyed out, its pill grey) with a **big green tick** over its picture, and its button is **disabled**: it can't be picked again. Once everything is bought the pill says **"All done!"** and the game moves on to Screen 48.

### Screens 44–47 — The four streets
- As in the street's design. **The street's picture** (`game background.png`): a blue sky, trees on both sides, a light-blue town behind a green hedge, a pink pavement and the road. **Two white clouds drift slowly across the sky** (behind everything; they hold still if the player's device asks for less motion). Drawn by the game over it:
  - **three shop fronts** side by side on the pavement, **Shop A** (red), **Shop B** (blue) and **Shop C** (purple): the pictures from `new shops for game .png` (a sign with a bump on top, a striped awning with a scalloped edge, a cream front with a big window and three lamps), with the game's words and things on them: the shop's **name on its sign** (white, outlined), and in the window **the item** on the left (the uniform on a hanger), **its marked price on a cream tag hanging from a string** on the right, and **the shop's offer on a red tag** under it (the amount big, the word small: 10% OFF, ₹250 OFF, GET AT ₹1,300);
  - in the top-left corner, right of the screens button, **the wallet** (its picture and the money) **and the shopping list** (Uniform, Shoes, Bag, Bottle, each with its box and picture) on **two white cards**, the item's line lit up in its colour;
  - **Aniket** on the road on the left, and **the question bar** along the top (Swifty speaks from it). There is no street sign: the bar says which street it is.
- **Coming in:** the shops pop up one after another while **Aniket walks in** along the road from the left (footsteps) and stops in front of the shops; meanwhile the question bar shows the street and its item ("Uniform Street · School Uniform"). Then Swifty says the street's two lines on the bar, and it says **"Tap a shop to check its offer."**
- **Checking an offer** (in any order): the shops still to check glow softly (a gold glow behind them), and bounce now and then. Tapping one brings **its card** up out of it, **in focus**: a calm backdrop (the game's light blue with soft circles) fades in over the street, the wallet, the list and Aniket, so nothing but the card is to be seen. The card is **big** (1600 × 790), and the question bar slides away meanwhile. The card: the shop's name on its coloured band (no item name); on the left the item in a big frame with its marked price and its offer (the same white and red tags); on the right the question, **"How much will you pay?"**, on a purple strip **above three big answers**. A wrong pick: see *Wrong answers* (the bar slides back with Swifty's hint). The right one turns green with a tick (sparkles) and Swifty says **"Correct!"**; the answers make way for **the working**, written in line by line (the = signs lined up) while Swifty reads each line out (the bar says "Here is how to work it out.": the working isn't written twice), then **"You pay ₹…"** is stamped under it, on the green badge. The card shrinks back into its shop as the backdrop fades away, and the green badge **"You pay ₹…"** sits on the pavement under the shop; the bar says "Tap another shop to check its offer."
- **Comparing:** once all three are checked, a **big** board comes up (1600 px wide), in focus as the cards do (the same backdrop, centred), with a row for each shop: its name, its marked price and its offer, **a bar as long as what you pay there**, and that amount. The question (e.g. "Which shop gives the best deal?") is on the board, on a purple strip **above the rows**, which are the answers; the question bar slides away meanwhile, and comes back for Swifty's hint or her reason. The right row gets the yellow **"Best deal!" ribbon**, and Swifty says **why** (the board already shows which shop and its price): "Shop C has the lowest final price." (on Bag Corner, its lesson: "Even though Shop A offers 25% OFF," / "Shop C has the lowest final price.").
- **Buying:** the board goes; the best shop glows with the yellow **"Best deal!" ribbon** over its board (the others fade back), the yellow **"Buy for ₹…"** button pops in under it, and Swifty says **"Now tap Buy!"** (the bar: "Tap Buy!"). When it is pressed (the bar: "Paying ₹1,300…") (it squeezes and makes way for the badge again), **the money flies from the wallet to the shop** ("cha-ching", **SOLD** stamped on its window), **the item flies from the shop onto the shopping list** (its box is ticked), and a big slip says **"Uniform purchased!"** (or Shoes, Bag, Bottle) with **the wallet's sum**, e.g. **₹5,000 − ₹1,300 = ₹3,700 LEFT**, while the wallet counts down; Swifty reads the slip out ("Uniform purchased!") without writing it on the bar, which says what comes next ("Next: back to the Shopping Area.").
- Then Swifty waves from the bar, and about 2.5 s later the game goes back to the Shopping Area (the bar slides down), or on to Screen 48 once everything is bought (the bar stays).

The four streets (what each shop's card asks, and the answers it offers, the right one in bold):

| Street | Shop | Marked Price | Offer | Working | Answers |
|---|---|---|---|---|---|
| **44 Uniform Street** — "Three shops sell the same uniform." "Tap each shop to check its offer!" | A | ₹1,600 | 10% OFF | 10% of ₹1,600 = ₹160; ₹1,600 − ₹160 = ₹1,440 | ₹1,590 · **₹1,440** · ₹160 |
| | B | ₹1,600 | ₹250 OFF | ₹1,600 − ₹250 = ₹1,350 | ₹1,850 · ₹250 · **₹1,350** |
| | C | ₹1,600 | GET AT ₹1,300 | GET AT ₹1,300; Final Price = ₹1,300 | ₹300 · **₹1,300** · ₹1,600 |
| **45 Shoe Street** — "Every shop marks the shoes at ₹1,800." "Tap each shop to check its offer!" | A | ₹1,800 | 20% OFF | 10% of ₹1,800 = ₹180; 20% = ₹360; ₹1,800 − ₹360 = ₹1,440 | **₹1,440** · ₹360 · ₹1,780 |
| | B | ₹1,800 | ₹400 OFF | ₹1,800 − ₹400 = ₹1,400 | ₹400 · **₹1,400** · ₹2,200 |
| | C | ₹1,800 | 25% OFF | 25% means one-quarter.; ₹1,800 ÷ 4 = ₹450; ₹1,800 − ₹450 = ₹1,350 | ₹1,775 · ₹450 · **₹1,350** |
| **46 Bag Corner** — "Now the marked prices are different!" "Don't choose just by the discount percentage." | A | ₹1,600 | 25% OFF | 25% of ₹1,600 = ₹400; ₹1,600 − ₹400 = ₹1,200 | **₹1,200** · ₹1,575 · ₹400 |
| | B | ₹1,500 | 20% OFF | 20% of ₹1,500 = ₹300; ₹1,500 − ₹300 = ₹1,200 | ₹300 · **₹1,200** · ₹1,480 |
| | C | ₹1,400 | ₹250 OFF | ₹1,400 − ₹250 = ₹1,150 | ₹1,650 · ₹250 · **₹1,150** |
| **47 Bottle Stop** — "This is the final challenge!" "Different prices, different offers. Check each one!" | A | ₹800 | 25% OFF | 25% of ₹800 = ₹200; ₹800 − ₹200 = ₹600 | ₹775 · **₹600** · ₹200 |
| | B | ₹700 | ₹150 OFF | ₹700 − ₹150 = ₹550 | **₹550** · ₹850 · ₹150 |
| | C | ₹600 | 10% OFF | 10% of ₹600 = ₹60; ₹600 − ₹60 = ₹540 | ₹60 · ₹590 · **₹540** |

- The wrong answers are the usual mistakes: taking the percentage off as rupees (₹1,590), giving the discount instead of the price (₹160), adding the discount (₹1,850), or ignoring the offer (₹1,600).
- **The comparison:** Uniform Street: "Which shop gives the best deal?" (A ₹1,440, B ₹1,350, **C ₹1,300**); Shoe Street: "Where should Aniket buy the shoes?" (A ₹1,440, B ₹1,400, **C ₹1,350**); Bag Corner: "Which shop gives the best value?" (A ₹1,200, B ₹1,200, **C ₹1,150**), and Swifty adds **"Even though Shop A offers 25% OFF, Shop C has the lowest final price."**; Bottle Stop: "Which bottle should Aniket buy?" (A ₹600, B ₹550, **C ₹540**). Swifty: "Shop C: ₹1,300. The best deal!" (with each street's price).
- **The wallet**, bought in the order Uniform → Shoes → Bag → Bottle: ₹5,000 − ₹1,300 = **₹3,700 left**; − ₹1,350 = **₹2,350**; − ₹1,150 = **₹1,200**; − ₹540 = **₹660**. In any other order the steps differ but it always ends at ₹660.

### Screen 48 — Shopping Complete!
- The light blue; a big blue banner **SHOPPING COMPLETE!** (gold words) drops in, **confetti** rains, and **"You bought everything on the list!"** comes up under it (all of it under the question bar). Then:
  - **on the left, the wallet and the shopping list**: the Shopping Area's white panel (a little smaller), the wallet showing **₹660 LEFT** in green, and the list's four lines;
  - **on the right, the four things bought**, each on a card in its shop's colour as on the Shopping Area (Uniform yellow, Shoes pink, Bag green, Bottle purple: its picture on its name pill).
  Line by line, **each item is ticked on the list as it pops up on its card on the right** (with its own green tick), so the list and the things bought match up; then the money left pops ("cha-ching"). As the banner lands, Swifty adds on the question bar: **"Well done! You found the best price for every item."** (the banner already says it is complete). (Aniket isn't on this screen.)

### Screen 49 — Final Receipt
- A **receipt** (white paper, its bottom edge perforated) prints row by row: **"Aniket's School Shopping"**, then Item · Marked Price · Discount · Amount Paid: **Uniform** ₹1,600 · ₹300 · ₹1,300; **Shoes** ₹1,800 · ₹450 · ₹1,350; **Bag** ₹1,400 · ₹250 · ₹1,150; **Bottle** ₹600 · ₹60 · ₹540; **Total ₹5,400 · ₹1,060 · ₹4,340** (discounts in red, amounts paid in green, each item with its picture). The receipt is centred under the question bar, where Swifty says how to read it (its heading already says what it is): **"The discounts are in red, what he paid in green."** … "He paid ₹4,340 for everything."

### Screen 50 — Money Left
- The big panel slides up, and the money left is worked out as on Screen 32: **Father gave ₹5,000** ↓ **Aniket spent ₹4,340**, and on the white sheet **Money left = ₹5,000 − ₹4,340 = ₹660** (₹660 marked yellow), each step as Swifty (on her stand) says it: "His father gave him ₹5,000." "He spent ₹4,340." "Money left = ₹5,000 − ₹4,340 = ₹660."

### Screen 51 — Two Different Amounts
- A dissolve: **"Two Different Amounts"** on a purple strip, and two cards with a **≠** between them: **Total Discount Received ₹1,060** (red) — "The difference between the marked prices and the prices Aniket paid." (₹5,400 − ₹4,340 = ₹1,060), and **Money Left From the ₹5,000 Budget ₹660** (green) — "The amount Aniket gets to keep." (₹5,000 − ₹4,340 = ₹660). Swifty: "These are two different amounts.", then she reads each card out as it comes in. Neither is called "savings". Then she flies off and the panel slides down.

### Screen 52 — Back Home
- Background: `return home shopping list .png`: Aniket, on the left, has come home with his backpack and a blue shopping bag; his father sits at the table on the right with his tea and the newspaper. A slow drift, the sunny window in the room behind them softly glowing. When Aniket says "Yes!", **the four things he bought pop up on the table** (uniform, shoes, bag, bottle, side by side in front of the runner), with twinkles. One bubble at a time, between the two of them: his father's up-left of his head, Aniket's up-right of his face, each with its tail at the speaker's mouth:
  1. **Father:** "Did you get everything?"
  2. **Aniket:** "Yes!"
  3. **Father:** "How much did you spend?"
  4. **Aniket:** "₹4,340."
  5. **Father:** "So you still have ₹660 left!"
  6. **Aniket:** "And I got the best deal for every item!"
  7. **Father:** "Well done! You really did shop wisely."

### Screen 53 — Mission Complete
- The light blue; a green banner **MISSION COMPLETE** drops in (confetti), and a card: ✅ **Uniform**, ✅ **School Shoes**, ✅ **School Bag**, ✅ **Water Bottle**, and four boxes: **Budget ₹5,000**, **Amount Spent ₹4,340**, **Money Left ₹660**, **Total Discount Received ₹1,060**. No one speaks.

### Screen 54 — What We Learnt
- The big panel slides up: **"What We Learnt"** and four cards (2 × 2), visual and short, each read out by Swifty (on her stand) as it comes in: **Marked Price** — the price written on the item; **Discount** — the amount reduced from the marked price (**Discount = Marked Price − Selling Price**); **Discount Percentage** — the discount written as a percentage of the marked price (**Discount % = (Discount ÷ Marked Price) × 100**); **Price After Discount** — **Selling Price = Marked Price − Discount**.

### Screen 55 — Final Takeaway
- A dissolve: the bag's two offers from Bag Corner, side by side: **25% OFF** (Marked Price ₹1,600, you pay ₹1,200) **vs** **₹250 OFF** (Marked Price ₹1,400, you pay ₹1,150). Swifty, on her stand: **"A bigger discount percentage does not always mean a better deal."** (the red tags from the streets) — the ₹250 OFF card glows, with the yellow "Best deal!" ribbon — and **"Calculate how much you actually have to pay."** Then the green banner: **Compare the final price before you buy.**
- This is the last screen, so **Next** becomes **Replay**. The last screen always waits for the player to press Replay; it never starts the story over by itself.

## 4. Movement on every screen
- **Teaching pace:** the whole story runs slowly enough for kids to follow (one `PACE` setting, now 1.5× a brisk pace).
  It stretches every pause, letter-by-letter typing (about 70 ms per letter) and panel and card reveals.
  Walking, flying, pops and button feedback keep their natural speed. Slowing the walk further would make the steps jerky.
- **Changing screens stays brisk** (not stretched by `PACE`): the "3 seconds later" holds before the story moves on are 3 s, cross-fades and dissolves take 1.2 s, and the next panel springs up as the dissolve ends.
- A slow zoom ("Ken Burns" effect) on every picture, plus a slight shift when the mouse moves ✨ (except Screen 2 and the panel screens, which stay still; the shopping game's own screens, 43–49 and 53, have no picture, so only their background shifts).
- **Words never wobble:** speech bubbles and thought clouds hold still (on a story picture they only follow its slow zoom), and things that call for attention (the Next buttons, the answer box on Screen 17, "₹200 reduced", the ₹800 badge, the amounts to drag) pulse with a glow around them instead of moving or changing size. The fonts are all loaded before the story starts, so no words change font as they appear.
- Softly glowing ceiling lamps and dust floating in the light ✨.
- **Fades only between Screens 1 ↔ 2, 3 ↔ 4, 4 ↔ 5, 5 ↔ 6, 8 ↔ 9, 20 ↔ 21, 21 ↔ 22, 22 ↔ 23, 23 ↔ 24 and 36 ↔ 37 ↔ 38 ↔ 39 ↔ 40 ↔ 41 ↔ 42 ↔ 43, 43 ↔ each street (44–47: the Shopping Area pushes in on the card picked), 43–47 → 48 → 49 and 52 → 53**, plus, going forward, dissolves between neighbouring panel screens (**11 → 12 → 13**, **16 → 17 → 18 → 19**, **25 → 26 → 27 → 28 → 29 → 30 → 31 → 32**, **34 → 35**, **50 → 51** and **54 → 55**: only what is on the big panel changes). Into a panel screen from a story picture or a game screen (**10 → 11, 15 → 16, 24 → 25, 33 → 34, 49 → 50, 53 → 54**, and back from 14, 21, 33 and 52), the big panel **slides up** over it; out of one (**13 → 14, 19 → 20, 32 → 33, 35 → 36, 51 → 52**, and back to 10, 15, 24, 33, 49 and 53), it **slides back down**. Going back over the dissolves is a cut. Screens 14 → 15 share one picture, so that change doesn't look like a cut at all.
  That's at home → at the mall, Bookstore → sees the book → holds the book → How Much?, question → closer look at his new book, and into the shoe shop → at the sneakers' stand (with the camera pushing in) → the discount on them → his questions about it (nearly the same view, so mostly only Aniket changes).
  Each is a smooth cross-dissolve where the new picture melts in over the old one.
  Every other change (Start → 1, 2 → 3 from outside the mall to inside it, 6 → 7, Replay, other panel jumps) is a straight cut with a small settle-in zoom.
  Screens 7 → 8 share one picture, so that change doesn't look like a cut at all. Screens 9 → 10 share one shot, so the cut only changes Aniket's reaction.

## 5. Controls
- **Top-right corner:** small **◀ Back** and **Next ▶** buttons, with a "2 / 55" counter between them. In the shopping game they follow the game (see *The shopping game*).
  While a screen is about to move on by itself, the Next button fills up like a timer. Clicking it skips ahead ✨.
- **Side screen panel:** a small **Scenes** button (top-left) opens a side panel with a picture of every screen. Click one to jump straight to it.
  Once the list is taller than the panel it scrolls (with a thin scrollbar), and it opens scrolled to the current screen.
  The panel also has an **Auto-play** switch ✨. When it's off, every screen waits for Next.
- Music, sound effects and full screen have **no on-screen buttons**; they are keyboard-only.
- **Keyboard ✨:** ← / → change screen · **Enter** / **Space** next (on a focused button, or an amount to drag on Screen 32, they press that instead) · **P** scenes panel · **F** full screen · **M** music on/off · **S** sound on/off.

## 6. Sounds and voices
All sound effects are made in the browser, so no audio files are needed:
footsteps · pop · speech-bubble "bloop" ✨ · whoosh during cross-fades and when the question card arrives ✨ · start chime ✨ · "ding" for the "!" ✨ · sparkle ✨ · cash register ✨ · right-answer chime and wrong-answer buzz ✨ · Swifty's wing flaps and landing chirp ✨ · card-flip swish ✨ · comic surprise for the ₹1000 shock ✨ · a curious "hmm?" and soft rising "plip"s as a thought cloud's puffs pop up ✨ · button clicks ✨.

**Background music ✨:** `sfx/bg music.mp3`, on a loop and kept **low**. It dips lower still while anyone speaks (and while Aniket walks): quickly as a line starts, and back up gently once no one has spoken for a moment, so it stays down between two lines. The tune ends at 143 s (4 s of silence follow it in the file), so it starts again from the top there. It starts with the first click, tap or key press (browsers allow no sound before that); **M** turns it off and on.

**Voices (Indian English):** every line is a **recorded clip**, made with the TTS studio *Ai Wala Human By Aamir* (Language Hindi, so the English words are read with an Indian accent): see **`docs/VOICEOVER.md`** for how the clips are made, checked and remade. Every speech bubble is spoken as it types out, its letters coming in **at the voice's pace** (the last one as the voice ends). Prices and maths are said in words: "₹800" is "eight hundred rupees"; "MP", "SP" and "CP" are spelled out; "=", "−", "÷" and "×" are said "equals", "minus", "divided by" and "times"; and "30/100" is "thirty over one hundred".
- **Aniket:** Male Child (Energetic). **His father:** Male Senior (Pedagogical). **Shopkeeper:** Male Teacher (Formal). **Swifty:** Female Teacher (Standard).
- **There is no voice without a speaker on screen.** Swifty says every teaching line, and each one comes in her speech bubble. The only lines without a bubble are where she reads a card aloud while its words show on it: the Cost Price and Selling Price definitions, the "Correct!" card, the Marked Price and Discount definitions, and the formula on Screen 18 (in words on the pink strip, then in short in the blue box). On the shopping game's streets, Shopping Complete and the receipt, every line she says is written on the question bar, beside her face.
- A clip is found by the **exact text its line shows** (`js/vo_lines.js`, made by `tools/vo_build.py`). The clips play on one reused audio element, unlocked on the first tap, and when the game is served over http(s) they are fetched one at a time after that tap. A screen moves on only once its last line has been said, and the music dips under every line.
- **No clip** (a line whose text has changed, a browser that can't play Ogg Opus such as older Safari, `?vo=0` in the address, or a missing file): the Indian-English text-to-speech voices already on the player's device read the line instead. That's Rishi on a Mac, Heera/Ravi or Neerja/Prabhat on Windows, and the Indian English voices on Android or Chromebook. If there are none, a Hindi voice is used, then any English voice.
- **The shopping game's lines (Screens 44–55) are not recorded yet:** until they are made with the studio (see `docs/VOICEOVER.md`), the device's voice reads them.
- The voices follow the sound switch (**S**). When no voice is available, the old typing blips play instead.

## 7. Done when
- It opens from `index.html` and fills the window at 16:9 on a laptop, a projector, and a phone held sideways.
- The walk looks smooth, with no jitter and no bits of the neighbouring frames.
- Speech-bubble tails point at whoever is talking, only one person talks at a time, and a small ₹800 sits clearly above the money.
- Screen 8's card slides in from the right and shows only the question and its two buttons.
- A wrong answer leads to the big panel sliding up → card in its middle → Swifty on her stand says "Think again…" → the definition cards on the panel, read out from her stand → Next about 3 s later (no Try again).
- A right answer slides the big panel up, brings the card to its middle, flips it to "Correct!" with the explanation, and Swifty reads it out from her stand; Next shows 3 s later.
- Next leads to Screens 9 → 10 ("₹1000? What is this?") → 11.
  On Screen 11, the big panel slides up over the picture, Swifty lands on her stand, explains the ₹1000 and the zoom lens shows it, and the "Marked Price (MP)" label drops in just after she says "It is called the Marked Price (MP)."
- Screens 11 → 12 → 13 dissolve into each other on the big panel, with the book and Swifty (on her stand) never moving; she flies in on Screen 11 and flies off after her question on Screen 13; then the panel slides back down into Screen 14.
  On Screen 12 Swifty reads out the Marked Price definition word by word, and on Screen 13 she says each step in a bubble while ₹1000 Marked Price → ₹800 Selling Price builds, with no question mark.
- Screen 14: the shopkeeper's three-part line, "The price printed on the book is ₹1000, but you paid only ₹800. So, you got a ₹200 discount.", and the card build ₹1000 → ₹200 reduced → ₹800 in step with each other.
- Screen 15 picks up from 14 with no jump. The card leaves and the camera re-centres (the shopkeeper says nothing more); Aniket's face turns puzzled (only his face changes) and "Discount? What does that mean?" appears in a thought cloud whose puffs rise from his head. Then the big panel slides up over it.
- Screen 16: on the big panel, the Discount card springs up, Swifty flies in to her stand, points at the card and reads the definition while the words appear.
- Screens 16 → 19: Swifty flies in on Screen 16 just before her first line, stays on her stand without moving through every dissolve, and flies off after her last line on Screen 19; every line she says comes in a bubble above her head (or is read from a card).
- Screen 17 builds ₹1000 − ₹800 = ₹200 piece by piece (the amounts only), with the ₹1000 flying off the book's sticker into its box; then, as Swifty says the formula in words, each box's name (Marked Price, Selling Price, Discount) is written in above its amount, and she says "So, the discount is ₹200."
- Screen 18 builds "Discount = Marked Price − Selling Price", then its first letters fly down to make "D = MP − SP", which Swifty reads out and points at.
- Screen 19: Swifty recaps the three terms in general, one card at a time (no amounts on the cards or in her words; arrows drawing between them), then "Discount = MP − SP", and the story moves on.
- Screen 20: Aniket steps out of the bookstore and walks off along the mall; then a fade to Screen 21.
- Screen 21: in the shoe shop the sneakers glow and sparkle, and Aniket says "These sneakers look good!", then (the 30% OFF label lighting up) "What does 30% OFF mean here?" and "Is this also a discount?", one bubble at a time; then a push-in fade to Screen 22.
- Screen 22: Aniket points at the ₹1800 price tag, with no words; then a fade where only Aniket changes.
- Screen 23: only the 30% OFF tag is highlighted, with a glowing gold frame hugging it; no words; then a fade where only Aniket changes.
- Screen 24: the tag stays lit; "What does 30% discount mean here?" in a thought cloud, then "The price tagged is ₹1800." (the ₹1800 card lighting up) and "Using 30% OFF! How much money I actually have to pay?" in speech bubbles, one at a time.
- Screen 25: the big panel slides up over the shop, the sneakers card builds (photo, the ₹1800 tag swinging onto the laces, 30% OFF stamped and framed in gold), Swifty flies in to her stand, points at it and says "To find the discount amount, let's first recall how percentages work." in two parts.
- Screen 26: the sneakers card dissolves into the rule, "a is what percent of b?" with a and b in italic; a is named the part and b the whole, the formula is written line by line in time with her words, a and b glide out of their boxes into the fraction, (a / b × 100)% lands and is marked, and she says "Let's take an example!".
- Screen 27: the rule dissolves into the same example with numbers, "125 is what percent of 500?" (no ₹); the part and the whole are named and coloured, the formula is written line by line in time with her words, 125 and 500 glide out of their boxes into the fraction, and 25% lands and is marked as the answer.
- Screen 28: the formula dissolves into the quick check; "250 is what percent of 1000?" with A 20%, B 25%, C 50% stacked; right or wrong, Swifty explains with the part and the whole coloured in the question, B is the answer, no second try; then the Next button level with the last answer.
- Screens 29–32 follow in order whatever the player answers on Screen 29: the sneakers' question "Now, what is 30% of ₹1800?" (B ₹540); the working 30% = 30/100, 30% of ₹1800 = 30/100 × 1800 = ₹540, written line by line as Swifty says it; the question "What does ₹540 represent here?" (C Discount); and the amount to pay, SP = MP − Discount = 1800 − 540 = ₹1260, where the player drags ₹1800 and ₹540 (or taps them, then their boxes) into the two empty boxes; a wrong box sends the amount back with Swifty's hint. Each dissolves into the next with Swifty staying on her stand; she flies off after her last line on Screen 32.
- Screen 33: the big panel slides down off the shop (Swifty goes with it), and as Aniket says "So, after a 30% discount, I will pay ₹1260." the 30% OFF tag lights up, the ₹1800 is crossed out in red, and a green ₹1260 tag stamps onto the stand.
- Screen 34: the big panel slides up over the shop, Swifty flies back in to her stand, and the sheet writes Discount % = Discount / Marked Price × 100 on a yellow band as she explains it, then = 540 / 1800 × 100 (each number popping in under its word), then = 30%, "the 30% off on the tag".
- Screen 35: the sheet dissolves into the "Sneaker Example Summary" (the big panel not moving); the table fills row by row (₹1800, 30%, ₹540, ₹1260) and the three rules are written in, each as she says it; then the panel slides down into Screen 36.
- Screen 36: back home, his father asks "How was your shopping?", Aniket answers "Great! I learnt about marked price, discount and discount percentage.", and his father says "That's useful, because you have another shopping job.", one bubble at a time.
- Screens 37–41: his father brings up school (two lines), hands Aniket the list (the camera pushes in on it and eases back), gives him "₹5,000" (the notes shine, "cha-ching"), Aniket pockets it, and his father's advice and Aniket's "Really?" / "Then I'm definitely finding the best offers!" come one bubble at a time; 38 → 39 → 40 are dissolves where only their hands change.
- Screen 42: outside his house, the "Game Begins" panel builds up beside Aniket as in the design (banner, ribbon, ₹5,000 wallet, the shopping list item by item, the glowing START SHOPPING button), which waits for the player and leads to Screen 43.
- Screen 43: as in the design, the four shop cards pop up and the wallet and Shopping List panel slides in (₹0 counting up to ₹5,000, "cha-ching"), then "Tap to Select"; tapping a card makes it glow with a "Selected" tag, lights up its line on the list, and pushes in to its street. Any item can be first.
- Screens 44–47: on the street's picture (clouds drifting across its sky), the three shops build up, Aniket walks in along the road, and Swifty says the street's two lines on the question bar (her face on its left corner; between her lines it always says what to do); each shop's offer is checked (wrong picks crossed out, "Check how much you will actually pay.", then a hint and the last answer glowing), its working written and read out, "You pay ₹…" under the shop; the three are compared on a board ("Best deal!"); Buy flies the money to the shop and the item onto the list, ticks it, and shows the wallet's sum; then back to the Shopping Area, the item ticked and the money gone down. The numbers are exactly those in the table.
- After the fourth item (in any order): Screen 48 (the wallet, ₹660 left, and the list on the left, ticked line by line as the four things bought pop up on the right; confetti), the receipt (₹5,400 · ₹1,060 · ₹4,340), the money left (₹5,000 − ₹4,340 = ₹660), the two different amounts (₹1,060 ≠ ₹660, never both called savings), back home (the four things on the table, the seven lines), Mission Complete, What We Learnt (four cards), and the takeaway (25% OFF ₹1,200 vs ₹250 OFF ₹1,150; "Compare the final price before you buy."); then Replay, which waits for the player.
- Prices are read naturally: "₹800" as "800 rupees", "a ₹200 discount" as "a 200 rupee discount".
- Every bubble is spoken in an Indian-English voice, and no line is heard without its speaker on screen.
- Back/Next, panel jumps, and Auto-play all work, and revisiting a screen restarts its animation.
