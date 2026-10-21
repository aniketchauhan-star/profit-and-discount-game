# Bookstore Journey — Game Prompt

> A full description of the **Profit & Discount** game: the story that teaches the ideas (Screens 1–46), then the shopping game that uses them (Screens 47–59).
> You can paste this into any AI coding tool to rebuild or extend the game.
> Items marked ✨ are extra effects added on top of the original request.
>
> **The revamp brief is applied** (`Bookstore Journey - Revamp Brief.docx`; what was done, the decisions made on its open questions, and what is still to do: `docs/REVIEW.md`). Its rules for every screen are in section 1, and each screen below says what it does now.
>
> **Screen numbers** here are the story's own, as in the brief and the text spreadsheet. The game also counts the two new checkpoint screens, **Checkpoint 2** (after Screen 30) and **Checkpoint 3** (after Screen 35), so it has **61 screens**: Screens 1–30 here are 1–30 in the game, Checkpoint 2 is 31, Screens 31–35 are 32–36, Checkpoint 3 is 37, and Screens 36–59 are 38–61. Checkpoints 1 and 4 are Screens 19 and 39 themselves.

---

## 1. What to build

A short animated **story game** for kids that runs in a web browser. It asks a first profit-and-discount question, then carries the story on to the next idea: the price printed on the book.

- **Format:** 16:9, on a fixed **1920 × 1080** stage that scales to fit any screen (black bars when the screen is a different shape).
- **Tech:** plain HTML + CSS + JavaScript. It opens by double-clicking `index.html`, with no server, installs, or internet needed.
- **Look:** bright, friendly, comic-book style in the story pictures; calm and clear on the teaching screens. Rounded bold font (**Baloo 2**), bundled in `fonts/`, so no internet is needed. The **₹** sign is drawn in its everyday shape (taken from Nunito Black and sized to match Baloo 2's figures), not Baloo 2's own Devanagari-style one. (The handwriting font Kalam is bundled too: the old hand-made recap on Screen 19 used it, and nothing does now.)
- **Speech bubbles (the brief's rule 2): one design everywhere.** A flat off-white rounded rectangle (18 px corners) with **no outline** and a soft shadow, sized to its words, sitting straight so they are crisp. Its tail is a small straight-sided point from the edge that faces the speaker, aimed at them and stopping about 26 px short: **a bubble never touches anyone**. Thought clouds keep their puffy shape and their trail of little puffs, in the same off-white.
  - **The words:** 34 px (about 18 px on a 1024 px-wide tablet), weight 600 (the key word or amount 800, the new word "discount" red, "selling price" blue, no other colours), line spacing 1.3, the same room on every side. They **wrap by themselves** into balanced lines of about 20–28 letters, never wider than the room the bubble has: a line break typed in a line counts as a space, except after a short exclamation that opens it ("Correct!", "Not quite!"), and a sum (125 ÷ 500 × 100) is never split.
  - **Calm:** a bubble fades in softly (no bounce, no "bloop", no letters jumping in) with **its whole line at once**, and **each word lights up with the yellow highlighter as it is said**, in step with the recording (so a child who finds the voice hard to follow can read along).
  - **Keep-clear areas:** on each story picture, the faces, prices, tags and the book are places a bubble must not cover (`KEEP_CLEAR` in `js/game.js`); a bubble that would cover one moves to the nearest free spot.
  - **Swifty's bubbles** sit above her head, inside the panel (between stage x 1380 and 1848), their point straight down at her.
- **Never an empty box:** a card, sheet, strip or box appears only with its first words: e.g. a worked sheet comes in with its first line, a checkpoint with its title, the Discount card with its heading, the sneakers card with their photo, the price card on Screen 14 with ₹1000 on it.
- **Teaching screens** (8 after its answer, 11–13, 16–19, 26–34, 37–39 and the two new checkpoints) are on **one big cream panel that fills the screen** (a faint dot grid, rounded corners, a thin deep-teal border), with nothing behind it. Every one is laid out the same way (the brief's rule 5):
  - **On top**, the screen's **title** (52 px, a short teal rule above it), or **Aniket's question**, carried from the story in his own words with who asks it: "ANIKET WONDERS · “Discount? What does that mean?”" on Screen 16, and "ANIKET ASKS · “With 30% off, how much do I actually pay?”" on Screens 26–34, until Screen 34 answers it ("→ ₹1260 ✓" in green after it).
  - **On the left**, **the story picture it came from, as a small framed photo** (424 × 239 at stage x 96, y 228; a white 8 px frame, round corners, a soft shadow), **zoomed on what matters**: the book and its ₹1000 sticker (11–13), Aniket's puzzled face (16–18), the sneakers with their ₹1800 and 30% OFF tags (26–34, 37 and 38: the "small sneakers card" that keeps in view what all this maths is for).
  - **In the middle**, the content, big (stage x 576–1824; x 576–1340 on a screen where Swifty comes), in one of **five layouts**: **Concept** (11, 13, 26, 27: the new word or number, on a taped note, and one line of meaning), **Definition** (12, 16: a lined index card), **Worked example** (17, 18, 28, 29, 32, the working on 34, 37, 38: the working on graph paper, the answer circled in red pen), **Question** (8, 30, 31, 33, the start of 34: the question on its strip, the answers stacked under it) and **Summary / checkpoint** (19, 39 and the two new ones: cards and one formula on a sticky note).
  - **On the right**, **Swifty's corner**, only on a screen where she comes: she rises in from the bottom edge **standing on her three books** (red, blue, yellow), and goes back down with them when her part is done. On a screen without her, the content uses that room.
  - **The step being done is clear; the earlier ones fade a little.** What the voice is reading **lights up**: a yellow highlighter round a card or box, and on the worked sheets each word as it is said.
  - **Text sizes (rule 5: only 3–4):** the checkpoints use four: 26 px for labels, 38 px for text, 46 px for terms, 56 px for the title, the amounts and the formula. Screens 8, 11–13, 16, 18, 26, 28 and 38 use 3–4. Screens 17, 27, 29–34 and 37 still use 6–9, counting the question on top, the bubbles and the small labels: they are to be brought to the same four (`docs/REVIEW.md`).
  - **The notebook style** of the design board (`design/hand-made design board.png`), on the plain panel: prices on **taped paper notes** (a light tint, the amount in its colour, a strip of tape on top), definitions on **lined index cards** (the name over a red margin line, the words on faint blue lines), the working on **graph paper** with the answer **circled in red pen**, formulas on a **yellow sticky note**, a right answer **ticked in green marker** and a wrong one **crossed out in grey** (with ✗). White space and soft paper shadows, no thick black outlines.
- **Swifty (rule 3)** appears only to **introduce a new idea, ask a question or react to an answer, and celebrate at a checkpoint**. She keeps a bubble only for questions, hints, "Correct!" / "Not quite!", instructions and the lines that link one topic to the next. **When her words are already on the screen, she says them with no bubble** (her beak moving, if she is there), and what she reads lights up. **She isn't on the screen during the worked solutions** (12, 17, 18, 28, 29, 32, 38 and the working on 37): her voice goes on by itself. So she comes on Screens 8 (after the answer), 11, 13 (for her question), 16, 26–27, 30, 31, 33–34 (on 34 she reads the working with no bubbles, and has bubbles only for "Now, let's find out…", "Correct!" / "Not quite!", "Let's see how to work it out!", "Your turn!" and the drag hints) and 37 (to introduce it, then she goes), and at the end of each checkpoint, only to celebrate.
- **Checkpoints (rule 8):** each topic ends with one: **Checkpoint 1** (Screen 19), **2** (after Screen 30), **3** (after Screen 35) and **4** (Screen 39). Always the same layout: on top, "CHECKPOINT 2 OF 4" and the topic ("Percentages"), ticked ✓ once it is done; the line her voice opens with ("Let's remember!"; on Checkpoint 4 "Let's sum up the sneakers!"); **2–3 lined index cards** (each a term in its colour, its value, what it means); **one formula on a yellow sticky note**; on 1 and 2 an example. Her voice reads it all out as it comes in (her recorded lines, no bubbles), each card lighting up; then the topic is ticked (a chime), **the formula note flies into the notebook** (its button, top left, pops), and **Swifty rises in to celebrate** (a wave, sparkles round the cards; on Checkpoint 4 her bubble says "Now you can work out any discount!"). Then three buttons: **Got it, next**, **Hear it again** (it is all read out again) and **Go back** (to the start of the topic: Screens 11, 27, 31 and 37). **A checkpoint never moves on by itself, even with Auto-play on.**
  - **The next topic starts with the last note:** on Screens 27, 31 and 37 the note of the checkpoint before comes out of the notebook button and settles under the photo, with "REMEMBER · CHECKPOINT 1" over it.
- **The notebook:** every checkpoint's cards and formula go into it, and it keeps them on the device. It opens any time, also during the shopping game, from its button beside the Scenes button (top left; it appears with the first checkpoint) or with **N**; Escape or × closes it.
- **The progress bar:** at the top middle of Screens 9–39, four steps, **Marked Price → Discount → Percentages → Discount %**: the topic being learnt is filled in teal, and each is ticked ✓ by its checkpoint.
- **From the story to a teaching screen (rule 4):** the story picture **first zooms in on the key object** (the ₹1000 sticker, Aniket's puzzled face, the sneakers' tags), **then shrinks into the small framed photo** on the left as the panel appears around it; the key number or tag then **flies from the photo onto the panel** (the ₹1000 on Screen 11, the 30% OFF tag on Screen 26). Between teaching screens the photo stays put, and only the panel's content dissolves. **Going back**, the photo **grows back to full screen** into the next picture, and **the result shows on the picture** for a moment: "₹1000 → ₹800" on Screen 14 and "Discount = MP − SP" on Screen 20 (on a small sticky note), and the green ₹1260 tag on Screen 35. On Screen 8 the counter picture itself shrinks into the photo when the player answers.
- **The story pictures come alive (rule 1):** short videos made from the pictures with Higgsfield's Seedance 2.5 or with Google Gemini (the prompts: `Animation Video Prompts.md`), in `game assets/video/`: H.264, 24 fps, no sound (Higgsfield's 1920 × 1080, Gemini's 1280 × 720); `tools/make_videos.py --import` converts and names a batch and lists the clips in `js/video_clips.js`, and the game plays only those. With `--gemini` it runs `tools/gemini_clean.py` on each clip: Gemini's sparkle is covered with the same spot of the picture, and its framing (about 2% closer than the picture, sometimes pushing in) is put back on the picture.
  - On a screen with clips, its **quiet loop** plays while nobody speaks (blinks, breathing, Dad sipping his tea), and **each line's talking clip** plays as its voice starts, then the quiet loop again. Every clip of a screen starts on its picture, and each fades in over the one before in 0.15 s; the bubbles stay on top. Higgsfield's clips end on the picture too; Gemini's don't, so a talking clip with no quiet loop to go back to stays on its last frame, and on Screens 40 and 45 every clip does (Aniket has stepped in, the father's hand is down: going back to the loop would jump).
  - A **movement clip** (one picture turning into the next) plays in place of the fade into the next screen, whose picture then comes in on its last frame. Next or Back during it moves on at once; a jump from the Scenes list, and reduced motion, never play one (reduced motion keeps the still pictures).
  - Where a clip isn't made yet, the still picture stays. Made so far: Screen 1 (the quiet loop and all three lines), 4 → 5 (Aniket picks up the book), 5, 6, 7 and 8 (and the shopkeeper's talking on Screen 14); the whole shoe shop, 22–25 and 35 (Screen 35 reuses Screen 22's clips, and Screen 23's camera moves in on the price tags); 36 (the box handed over: the chime as Aniket takes it, the light once it's his), 40, 41, 42 → 43 (the list, then the money), 43, 45, 46 (Aniket waves) and 56.
- **One small palette (rule 6),** named CSS variables only (no colour is typed in the revamp's styles): paper, ink and grey for text and backgrounds; **teal** for buttons, headings and the progress bar; **Marked Price amber**, **Selling Price blue**, **Discount red**, **green** only for a right answer; the **part violet and the whole olive**, a pair of their own (Screens 28–30 and 37); one **yellow highlighter** for the key word and the word being said. A wrong answer is **grey, crossed out, with ✗** (red means Discount). Prices are plain ink unless they are a Marked Price, a Selling Price or a discount. At most three meaning colours on a screen, light tints for boxes, full colour only on the key number; **all question strips look the same** (pale teal) and **all rule bands look the same** (pale yellow). **One effect at a time** (a glow, or a ring, or sparkles), and **sparkles only for a right answer or a checkpoint**. Colour never carries a meaning on its own: ✓, ✗ or a label goes with it.
- **The shopping game (Screens 47–59):** after the story the learner **plays**: with ₹5,000 and a school shopping list, they find the best deal for each item, street by street, and the game ends with what Aniket bought, what he paid, what is left, and what we learnt. **Learning becomes the gameplay.** These screens are drawn by the game on a light blue (the streets on their own picture, `game background.png`), with the story's own pieces (Swifty, who speaks from a question bar at the top of the screen in the game itself and stands on her books on the big panel, Aniket walking in, the speech bubbles at home, the answer buttons, the worked sheet, the big panel and the home picture), the Shopping Area's design sheet, and the streets' asset sheet made with ChatGPT (tags, badge, ribbon and button, all without words: the game writes them); the streets' shop fronts are cut from `new shops for game .png`, and their sign and clouds are drawn by the game, as in the street's design. See *The shopping game*, after Screen 46.
- **Characters:** **Aniket** (boy, green T-shirt, navy backpack), the **Shopkeeper** (glasses, navy apron) and **Swifty** (a teal bird with a backpack, the helper; "she").
- **Voices:** every line is spoken aloud in an **Indian-English voice** (see section 6).

## 2. Assets (`game assets/`)

| File | Used on |
|---|---|
| `start screen.png` | Start screen background (it already has the "Bookstore Journey" title) |
| `start button.png` | Start button, placed **below the title text** |
| `starting boy talking with father.png` | Screen 1: at home, Aniket, ready to go out, talks to his father on the sofa |
| `mall outside view .png` | Screen 2: Aniket (drawn in the picture) outside the mall, looking up at its entrance and the **MALL** sign |
| `book store outside view.png` | Screen 3 background (inside the mall), and Screens 20–21 (Aniket coming out, then walking on): the CHAUHAN BOOK STORE front, with glass windows and double glass doors in the middle, the shop seen through them; the wall lamp on the left and the ceiling lights behind the glass glow softly |
| `ui/bookstore-doorway.png` | Made from `book store outside view.png`: its doorway with the doors taken out (their seam, handles and top and bottom fittings painted out, the glass's haze off, softened a touch), 735 × 660, laid over the picture at stage (694, 225) on Screens 20 and 21, where the game draws the two glass doors over it and swings them open |
| `aniket walking sprite sheet.png` | The walk's 8 frames, cut cleanly into `sprites/aniket-walk-clean.png` (Screen 3's walk, see below). *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `aniket saw a book.png` | Screen 4 |
| `aniket hold the book scene.png` | Screen 5 |
| `aniket give a book to shopkepper.png` | Screens 6, 14 and the start of 15 (on 14–15 the shopkeeper's open-hand gesture "explains") |
| `what is discount.png` | The same picture with Aniket **puzzled** (it lines up exactly; only his face differs): fades in on Screen 15 when he hears "discount" |
| `ui/book-stack.png` | **Swifty's books**, a stack of three (red, blue, yellow), cut out of a notebook illustration made with Figma AI: she stands on them on the teaching screens (they come and go with her) and on the shopping game's panel screens |
| `aniket give money to shopkeeper.png` | Screens 7 and 8 (Aniket hands over ₹800 in three "SPECIMEN" notes: ₹200, ₹100 and ₹500) |
| `ui/money-in-hand.png`, `ui/book.png` | Cut from the story pictures (the notes in the two hands; the book): the pictures on the Cost Price / Selling Price cards on Screen 8 |
| `boy see the book .png` | Screen 9 (seen from behind Aniket: he looks at the book, with its ₹1000 sticker) |
| `shocked aniket.png` | Screen 10 (the same view, Aniket shocked, his mouth open) |
| `bird fly .png` | **Swifty** (teal bird with a backpack) flying, 8 frames, cut into `sprites/swifty-fly.png`. *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `bird talk .png` | Swifty standing and talking, 8 frames, cut into `sprites/swifty-talk.png`. *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `shoes shop enter.png` | Aniket walking into the shoe shop. *No longer used: Screen 22 shows `he saw a shoe.png`, which its clips start on. Removed from the folder; it is in git's history.* |
| `he saw a shoe.png` | Screens 22 and 23: Aniket at the stand, pointing at the blue sneakers, a white **₹1800** tag hanging from them and a red **30% OFF** label on the front of the stand; and Screen 35, where the tags are updated |
| `shopkeeper gives sneakers box.png` | Screen 36: at the shop's counter, the shopkeeper (teal polo shirt) hands Aniket the sneakers in an open orange-and-white box |
| `hee see discount on shoes.png` | Screen 24: the same view (it lines up with Screen 23's picture to within a few pixels; only Aniket differs), Aniket with his hand on his chin, looking at the 30% OFF label |
| `he is tinking to see the shoes.png` | Screen 25: nearly the same view (the stand is drawn a little closer, so its label sits a little lower and bigger), Aniket confused, hand on his chin |
| `ui/sneakers.png` | Made from `he is tinking to see the shoes.png`: a product photo of the blue sneakers (they and the stand top kept sharp, the shop softly blurred behind), for the sneakers card on Screen 27 (on Screens 26–34 the small photo shows the shop's own picture, zoomed on the sneakers and their tags) |
| `boy return home .png` | Screen 40: back home, Aniket (with the new book and the sneakers in a bag) talks to his father at the dining table |
| `boy and his father talking.png` | Screen 41: Aniket and his father talk across the dining table |
| `father gave him list.png` | Screen 42: his father hands Aniket the list (School Uniform, School Shoes, School Bag, Water Bottle) |
| `father gave him money.png` | Screen 43: the same view; his father holds out a fan of ₹500 notes |
| `boy take money in his pocket.png` | Screen 44: the same view; Aniket tucks the money into his pocket |
| `boy stand and talk .png` | Screen 45: his father, seated, gives advice; Aniket stands by the table with his backpack |
| `return home shopping list .png` | Screen 56 (back home at the end): Aniket, on the left, comes home with his backpack and a blue shopping bag; his father, on the right, sits at the table with his tea and the newspaper (a runner on the table, a fruit basket at its far end) |
| `game begins.png` | Screen 46: Aniket outside his house (No. 27), ready to go shopping |
| `game begin panel sheet .png` | The design's sheet for Screen 46's panel: the pieces are cut from it into `ui/begin/`. *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `ui/begin/` | Screen 46's panel: `panel.png` (made at the design's size from the sheet's panel), `banner.png`, `ribbon.png`, `wallet.png`, `button.png` (the list's four items are the game's own pictures, from `ui/shop/`; the sheet's shirt, shoe, bag and bottle icons were removed) |
| `select shop sheet.png` | The design's sheet for Screen 47 (the shop cards, their pictures, the checkboxes, the wallet, the "Selected" and "Tap to Select" tags): the pictures are cut from it into `ui/shop/`. *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `game background.png` | The streets' picture (Screens 48–51): a blue sky, trees on both sides, a light-blue town behind a green hedge, a pink pavement and the road with its white dashes. The game puts the sign, the shops and two drifting clouds over it |
| `new shops for game .png` | The streets' three shop fronts, made with ChatGPT (a transparent PNG, nothing written on them): red, blue and purple, each with a sign with a bump on top, a striped awning with a scalloped edge, and a cream front with a big window and three lamps. They are cut from it into `ui/street/front-coral.png`, `front-blue.png` and `front-purple.png` (494 × 514 each, the same size, so the game's words sit in the same places on all three). *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `sheet .png` | The streets' asset sheet, made with ChatGPT (a transparent PNG, nothing written on it): three shop fronts (coral, blue, purple: a blank board, a striped awning with a scalloped edge, a window with a shelf, a plain wall, a step), the green street sign, the white price tag, the red offer tag, the green badge, the yellow ribbon and the yellow button. The pieces are cut from it into `ui/street/`. *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `ui/street/` | The streets' pieces: `front-coral.png`, `front-blue.png`, `front-purple.png` (the shop fronts, see above), `tag-price.png` and `tag-offer.png` (the white and red tags on the offer cards and the takeaway), `pill.png` (the Selling Price), `ribbon.png` (best deal), `button.png` (Buy). The game writes the words on them in its own font: "Marked Price" and the amount, the offer, "SP = ₹…", "Best deal!", "Buy for ₹…". (`shop-coral.png`, `shop-blue.png`, `shop-purple.png` and `sign.png`, the first streets' shop fronts and sign, were removed: they are in git's history.) |
| `boy uniform.png` | The boy's school uniform (a white shirt, a blue tie, blue shorts), made with ChatGPT: trimmed and sized into `ui/shop/icon-uniform.png` (365 × 440). *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `school shoes .png` | Black school shoes (a pair of laced, shiny black shoes), made with ChatGPT: trimmed and sized into `ui/shop/icon-shoes.png` (520 × 390). *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `school bag.png` | The school bag (blue, with a yellow front pocket and yellow zips), made with ChatGPT: trimmed and sized into `ui/shop/icon-bag.png` (396 × 440). *Source only: removed from the folder (the game never loads it); it is in git's history.* |
| `ui/shop/` | The shopping game's pictures: `icon-uniform.png`, `icon-shoes.png` and `icon-bag.png` (made from `boy uniform.png`, `school shoes .png` and `school bag.png`; the sheet's first uniform, sneakers and bag were replaced by them), `icon-bottle.png` (the water bottle, redrawn sharp at 328 × 600 in the sheet's design and colours: the sheet's bottle was only 94 × 172 and looked blurry when shown big) (the items, the same pictures everywhere: the Game Begins list, the Shopping Area's cards and list, the shop windows, the offer cards, the street's list, Shopping Complete, the receipt, the table at home and Mission Complete), `wallet.png`, `check-empty.png` and `check-done.png` (the list's boxes, empty and ticked; the tick also marks a bought item), `money.png` (the notes that fly from the wallet to the shop) |
| `video/s01-idle.mp4` … | **The story's video clips** (section 1): H.264, no sound, about 1 MB each; their prompts and file names are in `Animation Video Prompts.md`, and `js/video_clips.js` lists the ones there are |
| `vo/vo001.ogg` … `vo/vo136.ogg` | **Every spoken line of the story, recorded**: 136 lines, one clip each (Ogg Opus, 32 kbps, mono; 2.0 MB in all), made with the TTS studio *Ai Wala Human By Aamir*. 132 are there now: the brief's language fixes changed the words of 4 lines, which are to be recorded in the next batch (`docs/VOICEOVER.md`, *To record next*); until then the device's voice reads them. How the clips are made, checked and remade: **`docs/VOICEOVER.md`** |

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
- A conversation, **one person at a time** (each bubble goes before the next one comes), every line spoken in its speaker's voice, in the calm bubbles of section 1 (each word lighting up as it is said), clear of both faces:
  1. **Aniket:** **"Dad, I want to buy a book and a new pair of sneakers from the mall."**, on the wall right of his face, its point at his mouth from the side.
  2. **Father:** **"Sure. But compare the prices and buy wisely."**, on the wall up-left of his head, its point down at his mouth.
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
- A soft glow round the book, and Aniket's bubble, right of his face above the book (clear of his head and the book): **"This book looks interesting!"** (no sparkles: they are kept for right answers and checkpoints).
- **Wait 3 seconds**, then a smooth **cross-fade** to Screen 6.

### Screen 6 — How Much?
- Background: `aniket give a book to shopkepper.png`.
- First Aniket: **"How much is this book?"** His bubble then disappears.
- Only then the Shopkeeper: **"It’s ₹800!"** (₹800 in bold ink; it pulses at the end with a soft "ding"). The two bubbles are **never on screen together**, and keep clear of both faces and the book.
- Hold on this moment for 3 seconds, then cut straight to Screen 7 (no fade).

### Screen 7 — Paying ₹800
- Background: `aniket give money to shopkeeper.png`.
- A soft glow and a shine across the notes; then a **pop sound**, and a **small ₹800** badge pops up **just above the money**. It shows only "₹800", with no breakdown of the notes.
- A cash-register "ka-ching" ✨ (no sparkles or confetti).
- After about 2.5 seconds it moves on to Screen 8. It's the same picture, so there's no visible cut.

### Screen 8 — Think Like the Shopkeeper (question)
- Background: the **same picture as Screen 7**, so Aniket and the shopkeeper are still there, just like the screen before.
  It carries on from Screen 7 seamlessly, with no fade and no jump.
- The ₹800 badge shrinks away, and the camera **glides left** so both characters stay in view on the left side.
- A **question card slides in from the right** (a white card, a soft deep shadow). It swings in with a springy overshoot and a little tilt, then settles, and the content appears one piece at a time.
- Show **only** this on the card:
  - **For the shopkeeper,**
  - **₹800 is the —** (₹800 big, with a yellow highlighter swipe behind it)
  - Two answers: **A Cost Price** and **B Selling Price** (white paper strips with a teal letter chip; they lift on hover and press down on click).
- The right side of the scene softly darkens behind the card so it stands out.
- No auto-advance here: the story moves on only through the answer flows below, or the top-right Next.
- **Either answer:** the picture **shrinks into the small framed photo** in the top-left corner while the cream panel comes in under it (its camera easing back to rest), with the title **"Cost Price or Selling Price?"** on top, and the card **glides to the middle** of the content. Swifty rises in on her books in her corner.

#### Wrong answer (Cost Price) — Swifty helps
1. The answer shakes, turns **grey and is crossed out** (✗), with a soft "buzz".
2. The panel and the photo come in as above, and Swifty rises in on her books.
3. Her bubble (40 px words on this screen, so they read clearly): **"Not quite! The shopkeeper sold the book for ₹800."** ("Not quite!" on a line of its own).
4. Then her bubble goes, the card makes way for the **two definition cards** (lined index cards, left of her corner), and she reads them out with no bubble (their words are on them), each lighting up:
   - **Cost Price (CP)** (no colour of its own): picture of money → picture of the book. "Price at which an item is **bought**."
   - **Selling Price (SP)** (blue): picture of the book → picture of money. "Price at which an item is **sold**."
   They are taught **one at a time**, Cost Price first: each card eases in piece by piece (card → title → first picture → the arrow drawing itself → second picture → definition → a highlighter swipe on the key word), and she says its name ("Cost Price. C P.") as the title appears, then the definition once it is up.
5. Then she ties it to the story, in her bubble: **"Here, ₹800 is the shopkeeper’s selling price."** (₹800 bold, *selling price* in blue).
6. She waves and goes back down with her books, and about **3 seconds after everything is up** a big **Next ▶** button appears at the bottom; it moves the story on to Screen 9 (the photo grows back out into it).
   There is **no Try again**: after a wrong answer the player learns the two terms and carries on.

#### Right answer (Selling Price) — "Correct!"
- The answer turns green with a **green marker tick**, a happy chime and a sparkle burst.
- The panel and the photo come in as above, and the card **flips over** to show:
  - a pale green header with a ✓ badge: **Correct!**
  - **"The shopkeeper sold the book for ₹800, so ₹800 is the selling price."** (₹800 highlighted, *selling price* in blue)
- Swifty rises in on her books, points at the card and reads it out (no bubble: "Correct! The shopkeeper sold the book…"), then goes.
- **3 seconds later**, the same big **Next ▶** button moves the story on to Screen 9.

### Screen 9 — A Closer Look
- Background: `boy see the book .png`: seen from behind Aniket, he looks at the book in his hands.
- Reached from the question screen as the **small photo grows back out** to full screen (there is no "Aniket holds his new book" screen in between).
- A **glowing gold ring pulses around the ₹1000 sticker** ✨ to draw the eye to it. No words. The progress bar appears at the top: **Marked Price** is lit.
- After about 3 seconds, a quick **cut** to Screen 10. It's the same view, so only Aniket's reaction changes.

### Screen 10 — What Is This?
- Background: `shocked aniket.png`.
- The picture **jolts** with a comic "zwip-bwong!" surprise sound ✨, and the ring around ₹1000 pulses.
- Aniket's bubble, spoken in his voice, right of his head, above the book (clear of the sticker), its tail at his hair (his face is turned away): **"₹1000? What is this?"** (₹1000 bold).
- After about 3 seconds: Screen 11.

### Screen 11 — Marked Price
(The **Concept** layout.)
1. The shocked picture **zooms in on the book's ₹1000 sticker, then shrinks into the small photo** on the left as the panel comes in round it; the title **"The price on the book"** is on top. A gold ring pulses round the sticker in the photo.
2. **Swifty rises in on her books** (she introduces the new idea). Her bubble: **"₹1000 is the price written on the book."** (₹1000 bold). As she says it, **the ₹1000 lifts off the sticker in the photo and flies onto a taped note** in the middle of the panel (amber, the Marked Price's colour).
3. Then she says its name **with no bubble** (it is written there): **"It is called the marked price (MP)."**, and **Marked Price (MP)** comes in under the note (amber), lighting up as she says it.
4. One line says what it means: **"The price written on an item."**
5. About 3 seconds later the screen **dissolves into Screen 12** (the photo stays put), and Swifty goes back down: Screen 12 is read out without her.

### Screen 12 — Marked Price definition
(The **Definition** layout. Swifty isn't on this screen: her voice reads it on its own.)
- The photo of the book stays where it is; the title is **"What is the Marked Price?"**.
- A **lined index card** with the heading **Marked Price (MP)** (amber) springs up in the middle, its words appearing **word by word** as her voice reads them:
  **"The price marked or printed on an article is called its Marked Price."**
  (Its lines follow the storyboard: "The price marked or / printed on an article / is called its / **Marked Price.**")
- **marked** and **printed** get a yellow highlighter swipe, and a gold ring pulses round the ₹1000 sticker in the photo (the price "marked on the article").
- About 3 seconds later it **dissolves into Screen 13**.

### Screen 13 — Compare MP and SP
- The photo of the book stays where it is; the title is **"Marked Price and Selling Price"**.
- The comparison builds in the middle, its two prices on **taped paper notes**, while her voice reads each with no bubble (the notes say it), each note lighting up:
  1. **₹1000 / Marked Price** (amber). The gold ring pulses on the sticker in the photo. "The marked price is ₹1000."
  2. A **grey arrow** grows downwards (every arrow between boxes is this grey).
  3. **₹800 / Selling Price** (blue). "But the book was sold for ₹800. That is the selling price."
- Then **Swifty rises in on her books** to ask, in her bubble: **"Why is the selling price less than the marked price?"** This sets up the next idea, discount.
- About 3 seconds later the **photo grows back out** into Screen 14 (the counter), and Swifty goes with the panel.

### Screen 14 — Shopkeeper reveals the reduction
- Background: `aniket give a book to shopkepper.png`, framed like the question screen: the camera is shifted left so Aniket and the shopkeeper stay in view, and a soft blurred copy fills in past the picture's right edge from the first frame.
- **Coming back from Screen 13, the result shows on the picture** for a moment: a small sticky note **"₹1000 → ₹800"** (amber, then blue) above the counter.
- The shopkeeper's line comes in **three bubbles, one after the other** (each goes before the next), in his deeper voice. **As he says each price, it flies out of his bubble to a card on the right** and is pasted into its place: a copy of the amount lifts off the bubble (a little bigger, with a soft shadow and a "swish"), glides along a low arc, and lands exactly on its place; its box appears around it with a little squash, like a sticker pressed on (a "pop"). The amount stays in the bubble.
  1. **"The price printed on the book is ₹1000,"** → the ₹1000 flies out, and the card (white, a soft shadow) **swings in from the right to catch it**: the amber **₹1000** note is pasted onto it as it lands.
  2. **"but you paid only ₹800."** → a **grey arrow grows downwards** with a falling "whoop", then the ₹800 flies into the blue **₹800** note.
  3. **"So, you got a ₹200 discount."** → the ₹200 flies beside the arrow: **"₹200 reduced"**, in red, which keeps gently glowing. "discount." (red, the new word) pulses at the end, with a soft "ding".
- The ₹1000 and ₹800 keep the **same colours as Screen 13** (amber = Marked Price, blue = Selling Price), so the learner can see it's the same comparison, now with its explanation. The progress bar moves on to **Discount**.
- About 3 seconds later it carries straight on to Screen 15.

### Screen 15 — Aniket asks about discount
(The storyboard calls the boy "Amit". In the game he stays **Aniket**.)
- The same picture, carried straight on from Screen 14 with no visible cut. The camera, the card and the shopkeeper's last bubble are exactly where they were.
  Then his bubble goes, the card **swings back out to the right**, and the camera **glides back to the middle** (the soft right edge eases away halfway through the glide).
- The shopkeeper has said the new word on Screen 14, so he says nothing more here:
  1. Aniket doesn't know the word: his face **turns puzzled**, as `what is discount.png` softly fades in over the picture (only his eyebrows, eyes and mouth change), with a curious rising "hmm?" ✨.
  2. Aniket **wonders in a thought cloud** (not a speech bubble), read in his voice: **"Discount? What does that mean?"** ("Discount?" in red, the new word).
     The cloud floats above and to the right of his head, in the empty wall between him and the shopkeeper. Three little puffs, small to big, fade in one by one from the top of his hair, then the puffy cloud fades in with its whole line, and each word lights up as he says it.
- About 3 seconds later: Screen 16.

### Screen 16 — Discount definition
(The answer to Aniket's question; the **Definition** layout.)
- The puzzled picture **zooms in on Aniket's face and shrinks into the small photo**; **his thought, "Discount? What does that mean?", lifts out of where his cloud was and settles on top of the panel as its heading** ("ANIKET WONDERS" over it). The definition answers it below.
- A **lined index card springs up** with its heading **Discount** (red), and **Swifty rises in on her books** (she introduces the new idea) and points at it.
- The definition appears **word by word** while she reads it out (no bubble: the card is the text she reads):
  **"The reduction given on the marked price of an item is called a discount."**
  (Its lines follow the storyboard: "The reduction given on the / marked price of an item / is called a **discount.**")
  **reduction** and **marked price** get a yellow highlighter swipe, and **discount.** is red. It pulses at the end with a soft "ding".
- About 3 seconds later the card **dissolves into Screen 17**, and Swifty goes back down (17 and 18 are worked without her).

### Screen 17 — Discount formula (built visually)
(The **Worked example** layout. Swifty isn't on this screen: her voice goes on by itself.)
- The photo stays where it is; the title is **"Finding the discount"**.
- The **book** (the same "A Brighter Tomorrow" drawing with its **₹1000** sticker) eases in on the left of the content, then the sum builds one piece at a time **with the amounts only** (**₹1000 − ₹800 = ₹200**: the boxes have no names yet):
  1. A gold ring pulses on the book's sticker. The first box (amber) pops in empty, and the **₹1000 lifts off the sticker and flies into it** in an arc.
  2. **−** pops in, then the **₹800** box (blue).
  3. **=** pops in, then the **₹200** box (red) **lands like a stamp**.
- Then her voice says the formula in words, and **as each part is said, its box's name is written in above its amount** (left to right, in the box's colour; its place was kept, so nothing moves), while that part lights up: "Marked Price," → **Marked Price** above ₹1000 → "minus Selling Price," → the − pops and **Selling Price** is written above ₹800 → "equals Discount." → the = pops and **Discount** is written above ₹200.
- **A bar model** comes in under the sum: a bar for **₹1000 (Marked Price)** that splits into **₹800 paid** (blue) and **₹200 discount** (red). "So, the discount is ₹200." lights up the ₹200 part, and the Discount box keeps glowing.
- About 3 seconds later the sum **dissolves into Screen 18**.

### Screen 18 — Formula reveal
(Swifty isn't on this screen: her voice goes on by itself.)
- The photo stays where it is; the title is **"The discount formula"**.
- A plain paper strip springs up, and the formula in words is written on it part by part as her voice says it, each part lighting up: "Discount" → "equals Marked Price," → "minus Selling Price." (**Discount** red, **Marked Price** amber, **Selling Price** blue, the signs in ink).
- "We can write it in short." A **yellow sticky note** comes in under the strip. Then, term by term, the **first letters light up** in the strip (a white key-cap pops behind each: **D**, **M** + **P**, **S** + **P**) and **lift out and fly down onto the note**, growing as they go, to build **D = MP − SP**, while her voice says "D for Discount," "MP for Marked Price," "SP for Selling Price." (spelling out "M P" and "S P"). The = and − pop in between.
- Then the short form is read out, **"So, D = MP − SP."**, each part popping as it is said.
- About 3 seconds later it **dissolves into Screen 19**.

### Screen 19 — Checkpoint 1: Discount
(The **Summary / checkpoint** layout; see *Checkpoints* in section 1.)
- On top: **CHECKPOINT 1 OF 4** and **Discount**. Her voice opens with **"Let’s remember!"** (written above the cards).
- **Three lined index cards**, one at a time, each read out as it comes in (her recorded lines, no bubbles), in general, with no amounts:
  1. **Marked Price** (amber): "Price written on an item." ("Marked price is the price written on an item.")
  2. **Selling Price** (blue): "Price at which it is sold." ("Selling price is the price at which it is sold.")
  3. **Discount** (red): "Amount reduced from the marked price." ("Discount is the amount reduced from the marked price.")
- The formula on a **yellow sticky note**: **Discount = MP − SP** ("And remember the formula: Discount = MP − SP!", read "Discount equals M P minus S P"), then **Example: The book: ₹1000 − ₹800 = ₹200** (highlighted).
- Then **Discount ✓** is ticked (Marked Price and Discount are ticked on the progress bar), the note **flies into the notebook**, and **Swifty rises in to celebrate** (a wave, sparkles round the cards). The buttons **Got it, next**, **Hear it again** and **Go back** (to Screen 11) wait for the player.
- **Got it, next** (or the top Next): the big panel slides back down, revealing Screen 20.

### Screen 20 — Coming Out of the Bookstore
- Background: `book store outside view.png`, the bookstore from the mall, as on Screen 3, with the same slow zoom and lights.
- **Coming from Checkpoint 1, the formula shows on the picture** for a moment, on a small sticky note: **Discount = MP − SP**.
- **The doors open:** the shop's two glass doors are drawn over the picture (`ui/bookstore-doorway.png` is the doorway with the doors taken out: their seam, handles and fittings painted out and the glass's haze off; over it, the two door leaves are drawn as pale glass with their pull handles and fittings). Closed, they look just as in the picture.
- **Aniket comes out:** he walks up to the doors inside the shop, seen through the glass (footsteps); the **shop's bell rings and the doors swing open into the shop** on their hinges (in 3D, with a little settle), the left one on the left and the right one on the right, and the shop is seen clearly through the open doorway. He **walks out through the doors** into the mall, coming closer, and stops just outside. No words. The progress bar moves on to **Percentages**.
- About 1.5 seconds later, a **dissolve into Screen 21** (the same view: nothing changes but what Aniket does).

### Screen 21 — To the Shoe Shop
- The same view: **the bookstore's doors stand open** behind Aniket, who is just outside them, as Screen 20 left him.
- He **walks off along the mall to the right**, to the next shop, the sneakers shop (the same walk as on Screen 3, with footsteps), coming a little closer as he goes, and out of the picture. No words.
- About a second later, a **cross-fade into Screen 22**: the shoe shop.

### Screen 22 — The Shoe Shop
- Background: `he saw a shoe.png`: in a shoe shop in the mall, Aniket stands at a display, **pointing at a pair of blue sneakers**, with a white **₹1800** tag hanging from them and a red **30% OFF** label on the front of the stand. It moves all the time (no still picture): Aniket pointing and breathing (`s23-idle`) between his lines, and his talking clip with each line.
- The slow zoom eases in towards the price tags; the shelf and ceiling lights glow and dust floats in the light ✨.
- A soft glow pulses around the sneakers, then a light sweeps across them, with a sparkle sound ✨ (no twinkles).
- Aniket's bubbles, spoken in his voice, one at a time, beside his face with their tail at his mouth (clear of his face, the sneakers and their tags):
  1. **"These sneakers look good!"**
  2. Then he notices the red label: a gold frame lights up round **30% OFF** on the stand, and he asks **"What does 30% OFF mean here?"** (30% OFF bold)
  3. **"Is this also a discount?"** (discount in red: the word he has just learnt)
- About 3 seconds later, a plain **dissolve into Screen 23**: the same view, and the camera carries on.

### Screen 23 — Tagged Price
- Background: `he saw a shoe.png`, the same view: Aniket **points at the sneakers and their ₹1800 tag** (the red 30% OFF label on the stand under them).
- Its clip (`s23-zoom`): Aniket lifts a finger as if he has spotted something and points again, and **the camera moves in on the sneakers until the ₹1800 tag and the 30% OFF label fill the screen**. No speech bubble, no text.
- About 2 seconds after the camera gets there, a smooth **cross-fade into Screen 24**, back to the whole stand. (Without the clip: the picture, and the fade about 3 seconds later.)

### Screen 24 — 30% Off!
- Background: `hee see discount on shoes.png`: Aniket, **hand on his chin**, thinks about the red **30% OFF** label on the stand, under the ₹1800 tag.
- **Only the discount is highlighted**: the red 30% OFF label lights up with a **glowing gold frame** that hugs it (rounded corners, clear of the ₹1800 tag above it), pulsing gently, with a sparkle sound ✨ (one effect: no twinkles).
- No speech bubble, no text.
- About 3 seconds later, a smooth **cross-fade into Screen 25** (the same view: only Aniket changes, and the lit tag stays lit).

### Screen 25 — What Does 30% Mean?
(Storyboard: "Amit is confused". In the game he stays **Aniket**.)
- Background: `he is tinking to see the shoes.png`: Aniket, confused, hand on his chin, at the sneakers' stand; he thinks (a quiet loop, `s25-idle`) until he speaks, and each line has its talking clip. Coming from Screen 24, the **30% OFF label is still framed in glowing gold** (on a direct jump it lights up first). This picture shows the stand a little closer, so during the fade the label and its frame move a little with it.
- **Two lines, one at a time**, in Aniket's voice (no thought cloud), each in a **speech bubble** with its tail at his mouth by his hand, clear of his face and the two tags:
  1. **"The tag says ₹1800."** (₹1800 bold), while a gold frame lights up round the white **₹1800** card on the sneakers.
  2. In its place: **"With 30% off, how much do I actually pay?"** (30% off bold), both tags still lit. This question goes to the top of the teaching screens that follow (26–34), until Screen 34 answers it.
- About 3 seconds later: Screen 26.

### Screen 26 — What 30% OFF Means
(The **Concept** layout.)
- The shop **zooms in on the sneakers and their two tags, then shrinks into the small photo** on the left as the panel comes in round it. On top: **ANIKET ASKS** "**“With 30% off, how much do I actually pay?”**" (it stays on top until Screen 34 answers it).
- A gold ring lights up round the 30% OFF tag in the photo, and **the tag lifts off the stand and flies onto the panel**, where the red **30% OFF** tag ("30%" over "OFF", white letters) **lands like a stamp**.
- **Swifty rises in on her books** (she introduces the new idea), waves, then points at it, and **reads it out** (no bubble: it is all written on the panel), in two parts: **"30% OFF means"** → the tag lights up, then **"means"** rises in beside it and **an arrow draws itself** under the word, pointing right. **"30% Discount."** → a **white card springs up** on the right of the arrow, line for line with the tag: **"30%"** over **"Discount"** ("Discount" in red, the discount's colour since Screens 14–15), lighting up as she says it.
- She stays on her books for Screen 27. About 3 seconds later it **dissolves into Screen 27**.

### Screen 27 — Recall Percentages
(Storyboard: "Bridge to percentage recall". Its robot is **Swifty** in the game.)
- **The topic starts with Checkpoint 1's note:** the yellow sticky note **Discount = MP − SP** comes out of the notebook button and settles under the photo, with "REMEMBER · CHECKPOINT 1" over it.
- On the same panel, what the tag means dissolves away and **the sneakers' card springs up** in the middle:
  1. A **product photo of the blue sneakers** eases in (`ui/sneakers.png`).
  2. The white **₹1800** price tag **drops onto the sneakers**: it hangs on a string tied to the laces of the front shoe, like the tag in the shop's pictures, swings left and right, and settles, tilted a little against the shoe.
  3. Under the photo, the red **30% OFF** tag (tilted, like the one on the stand) **lands like a stamp**.
- Swifty, still on her books from Screen 26 (on a direct jump she rises in and waves first), points at the card. Her bubble (a line that links the two topics, so it keeps its bubble), said in two parts:
  1. **"To find the discount amount,"** → the 30% OFF tag lights up.
  2. **"let’s first recall how percentages work."** → the "30%" on the tag lights up.
  ("discount amount" and "percentages" in red, the key words)
- About 3 seconds later the card **dissolves into Screen 28**, and Swifty goes back down with her books (28 and 29 are worked without her).

### Screen 28 — The Percentage Rule
(The storyboard's "a is what percent of b?", first in general, with letters; then Screen 29 works the same example with numbers. Swifty isn't on these two screens: her voice goes on by itself. The **Worked example** layout.)
- On the same panel (the photo of the sneakers still on the left, Aniket's question still on top), the sneakers card fades away and the working springs up, with **letters for the amounts**, *a* and *b*, in **italic** as in a maths book (a serif italic):
  - the **question strip** (pale teal, like every question strip): **"*a* is what percent of *b*?"**;
  - on the left, two boxes: **Part = *a*** and **Whole = *b***;
  - on the right, **graph paper**, line by line, the = signs lined up: **Percentage = Part / Whole × 100**, then **= *a* / *b* × 100**, then **= (*a* / *b* × 100)%** (stacked fractions; the brackets as tall as the fraction).
- **Colours:** *a*, the part, **violet**; *b*, the whole, **olive** (a pair of their own: blue is the Selling Price, green a right answer), in the question once they're named, the boxes and the working. "Percentage" is ink.
- Step by step, in time with her voice (no bubbles), **each word on the sheet lit as it is said**:
  1. The question is read out (its strip lights up). **"*a* is the part,"** → *a* in the question turns violet, and the **Part = *a*** box comes in. **"and *b* is the whole."** → *b* turns olive, and the **Whole = *b*** box comes in.
  2. **"To find the percentage,"** → "Percentage" is written in. **"divide the part by the whole,"** → "=" and the fraction Part / Whole. **"then multiply by 100."** → "× 100".
  3. That line fades a little (the earlier step), and the next line's "=" pops and its fraction bar draws itself. **"Put the part on top,"** → the little arrow over "Part" nudges down and ***a*** glides out of its box into the top of the fraction. **"and the whole below."** → ***b*** glides into the bottom. Then "× 100".
  4. **"Then put a % sign after it."** → the last line's "=" pops, and **(*a* / *b* × 100)%** lands and is **circled in red pen**.
  5. **"Let’s take an example!"**
- About 3 seconds later the working **dissolves into Screen 29**.

### Screen 29 — What Percent?
(Storyboard: "a is what percent of b?", worked with numbers after the rule on Screen 28. The storyboard shows no dialogue here, so the lines below are written for the game. Swifty isn't here: her voice on its own.)
- The same layout as Screen 28, with numbers (no ₹ anywhere on this screen): the question **"125 is what percent of 500?"**, the boxes **Part = 125** and **Whole = 500**, and on the graph paper **Percentage = Part / Whole × 100**, then **= 125 / 500 × 100**, then **= 25%** (real stacked fractions).
- It is worked out exactly as on Screen 28 (the part violet and the whole olive everywhere, each word lit as it is said): the question is read out; **"125 is the part,"** / **"and 500 is the whole."**; **"To find the percentage,"** / **"divide the part by the whole,"** / **"then multiply by 100."**; **"Put the part on top,"** / **"and the whole below."** (125 and 500 glide out of their boxes into the fraction); **"125 ÷ 500 × 100"** → **"= 25%."** → **25%** lands and is **circled in red pen**.
- **A 10 × 10 grid** comes in beside the working: **25 of its 100 squares fill in**, one after another ("25 out of 100 = 25%"), lit as her voice says **"So, 125 is 25% of 500!"**
- About 3 seconds later the working **dissolves into Screen 30**.

### Screen 30 — Quick CFU
(Storyboard: "Quick CFU", a check for understanding. The storyboard shows no dialogue, so Swifty's feedback lines below are written for the game. The **Question** layout.)
- On the same panel, the working fades away and the question springs up on its strip: **"250 is what percent of 1000?"** (plain numbers, no ₹). **Swifty rises in on her books** (she asks it) and reads it out (its words are on the strip, so no bubble).
- **Three answers slide in, stacked** under the strip: **A 20%**, **B 25%**, **C 50%**. Swifty points at them and waits.
- **Right (B 25%):** a green marker tick, a happy chime and a sparkle burst. Her bubble: **"Correct! 250 ÷ 1000 × 100 = 25%."** As she says the sum, **250 in the question turns violet** (the part) and **1000 olive** (the whole), as on Screen 29.
- **Wrong (A or C):** it shakes, buzzes, turns grey and is crossed out; every answer locks (**no second try**). Her bubble: **"Not quite! 250 is the part, 1000 is the whole. 250 ÷ 1000 × 100 = 25%."** (four parts: 250 turns violet as she names the part, 1000 olive as she names the whole, and at the end of the sum the right answer, **B**, is ticked).
- Both ways end with **"So, 250 is 25% of 1000."** while the **same 10 × 10 grid** fills 25 squares under the photo, and the right answer and the two amounts light up. Then Swifty goes back down with her books, and the big **Next** button appears **level with the last answer**; it leads to Checkpoint 2.

### Checkpoint 2 — Percentages (new, after Screen 30; Screen 31 in the game)
(The **Summary / checkpoint** layout; see *Checkpoints* in section 1.)
- A dissolve from Screen 30. On top: **CHECKPOINT 2 OF 4** and **Percentages**; her voice opens with **"Let’s remember!"** (written above the cards).
- **Two lined index cards**, each read out as it comes in with the recorded lines of Screen 29: **Part 125** (violet) "the amount we look at" ("125 is the part,") and **Whole 500** (olive) "the whole amount" ("and 500 is the whole.").
- The formula on a **yellow sticky note**: **Percentage = Part ÷ Whole × 100** ("To find the percentage," "divide the part by the whole," "then multiply by 100."), then **Example: 125 ÷ 500 × 100 = 25%** ("So, 125 is 25% of 500!").
- Then **Percentages ✓** is ticked on the progress bar, the note flies into the notebook, Swifty rises in to celebrate, and the buttons wait: **Got it, next** (a dissolve into Screen 31), **Hear it again**, **Go back** (to Screen 27).

#### Screens 31–34 — Back to the sneakers
(Storyboards 14–17. Screen 31 is a question; **whichever answer the player picks**, Screens 32, 33 and 34 follow in order: the working, what the answer means, and the amount to pay. Screen 33 is a question too, and Screen 34 asks for the Selling Price before the player drags the amounts into place. The photo of the sneakers stays on the left and Aniket's question on top; each screen dissolves into the next. Where the storyboards show no dialogue, Swifty's lines below are written for the game.)

### Screen 31 — Back to the Sneakers
(The **Question** layout.)
- **The topic starts with Checkpoint 2's note:** **Percentage = Part ÷ Whole × 100** comes out of the notebook button and settles under the photo ("REMEMBER · CHECKPOINT 2").
- **Swifty rises in on her books** (she asks the question), and the question springs up big, with the whole panel to itself (the sneakers are in the photo): **"Now, what is 30% of ₹1800?"**, and under it three big answers **stacked**: **A ₹360**, **B ₹540**, **C ₹720**.
- She reads the question out (no bubble); as she says it, **the 30% OFF tag and then the ₹1800 tag light up in the photo**.
- **Right (B ₹540):** green tick, chime, sparkles. Her bubble: **"Correct! 30% of ₹1800 is ₹540."**
- **Wrong (A or C):** grey, crossed out, buzz; every answer locks (no second try). **"Not quite! 30% of ₹1800 is ₹540."**, and B is ticked.
- **No Next button:** 3 seconds after her line the screen **moves on by itself** to the working (Screen 32), the Next button at the top right filling up as a timer meanwhile (with auto-play off, it waits for Next there, as on every story screen). She goes back down with her books.

### Screen 32 — Calculate 30% of ₹1800
(The **Worked example** layout. Swifty isn't here: her voice on its own.)
- The question dissolves into the **working on graph paper**, written line by line, its = signs lined up (big writing): **30% = 30/100**, then **30% of ₹1800 = 30/100 × 1800**, then **= ₹540** (real stacked fractions, in ink).
- Each line is written in (a left-to-right wipe with a marker scribble) as her voice says it, with no bubbles:
  1. **"30% means"** → "30% =". **"30 out of 100."** → the fraction 30/100. That line then fades a little.
  2. **"So, 30% of ₹1800 ="** → "30% of ₹1800 =". **"30/100 × 1800"** (read "30 over 100 times 1800") → the fraction, then "× 1800".
  3. **"1800 ÷ 100 = 18,"** → "× 1800" and the 100 light up. **"and 18 × 30 = 540."** → the 30 lights up. **"So, it’s ₹540!"** → **₹540** lands and is **circled in red pen**.
- **A bar model** comes in under the working: a bar for **₹1800 (Marked Price)** cut into **10 parts of ₹180**, then **3 parts are shaded** red: "3 parts = 30% = ₹540".
- About 3 seconds later it **dissolves into Screen 33**.

### Screen 33 — What Does ₹540 Represent?
- **Swifty rises in on her books**, and the question springs up: **"What does ₹540 represent here?"** with three answers stacked: **A Marked Price**, **B Selling Price**, **C Discount**. She reads the question out (no bubble).
- **Right (C Discount):** her bubble: **"Correct! ₹540 is the money taken off ₹1800."** (the 30% OFF tag lights up in the photo).
- **Wrong (A or B):** **"Not quite! ₹540 is the money taken off ₹1800."** (the 30% OFF tag lights up), and C is ticked. No second try.
- Both ways: **"That’s the discount!"** with no bubble (the right answer, lit, says it). 3 seconds later the **Next** button. She stays on her books for Screen 34.

### Screen 34 — The Amount to Pay
- **First, what to find (nothing on the panel yet).** The question before dissolves away, and Swifty, on her books, says in her bubble: **"Now, let’s find out how much money Aniket needs to pay."**
- **Then the question.** Her bubble goes, and the question springs up: **"What will be the Selling Price?"**, and under it **the formula as a hint**, on the rule band (pale yellow, like every rule band): **"Hint: SP = MP − Discount"** (SP blue, MP amber, Discount red). She reads the question out, then the hint (both are on the panel, so no bubble); the hint comes in as she reads it.
- Three answers slide in, **stacked** under the hint: **A ₹2340**, **B ₹1260**, **C ₹1340**.
  - **Right (B ₹1260):** green tick, chime, sparkles; her bubble: **"Correct!"**
  - **Wrong (A or C):** grey, crossed out, buzz; every answer locks (no second try); **"Not quite!"**, and B is ticked.
  - Both ways: **"Let’s see how to work it out!"** while the right answer and the hint light up.
- **Then the working, on the same screen.** The question fades away, and the working springs up: on the left, **Marked Price (MP) ₹1800** and **Discount ₹540** on taped notes (amber, red); on the right, graph paper.
- She reads the rule with no bubble (it is written as she says it): **"To find how much you have to pay,"** → "SP =" is written in. **"subtract the discount from the marked price."** → "MP", "−", "Discount" appear one after the other (the MP note and the Discount note light up as they appear). This line sits on the **rule band**.
- **The player's turn (drag and drop):** the next line's "=" pops, then **two empty boxes** with a "−" between them: dashed outlines in their colours, each with its name faintly inside (**MP** amber, **Discount** red). Her bubble: **"Your turn! Drag each amount into its box."** ("Your turn!" in red)
  - A gold halo pulses round the amounts on the notes (**₹1800** and **₹540**): they can be picked up. A faint copy of ₹1800 glides into the MP box once to show how (and again whenever nothing happens for about 9 seconds).
  - **Drag** an amount (mouse or touch): a copy lifts out under the finger (its place on the note fades) and the empty box under it grows and turns light yellow. Or **tap** an amount (it lights up, and the empty boxes pulse), then tap a box. The keyboard works too: Enter on an amount, then Enter on a box.
  - **Its own box:** it settles in as the amount (**₹1800**, **₹540**, in their colours), with a pop and a sparkle burst, and Swifty waves.
  - **The other box:** a buzz, the box shakes, the amount goes back, and her bubble says what that box is for: **"Not quite! The MP box is for the marked price, ₹1800."** or **"Not quite! The Discount box is for the discount, ₹540."** The player tries again (as many times as needed). Let go anywhere else, it just goes back.
- Once both are in, with no bubbles: **"₹1800 − ₹540"** (both amounts light up) **"= ₹1260."** → **₹1260** lands and is **circled in red pen**.
- **A bar model** comes in under the working: **₹1800 (Marked Price)** splits into **₹1260 pay** (blue) and **₹540 discount** (red), and **Aniket's question on top is answered**: **"→ ₹1260 ✓"** in green after it (a chime). **"So, you pay ₹1260 for the sneakers!"** lights up the ₹1260 part.
- She goes back down with her books, and the big **Next** button appears (no auto-advance on this screen); it leads to Screen 35, the photo growing back out into it.

### Screen 35 — Final Answer
(Storyboard 18: "Final answer and summary". The line is Aniket's, in his voice.)
- Background: `he saw a shoe.png` (the same view as Screens 22–24: Aniket at the stand, **pointing at the price tags**). Coming from Screen 34, the small photo grows back out into it. It moves as on Screen 22, with the same clips: Aniket pointing between the parts of his line, and talking with each part.
- Aniket's bubble, right of his face above the sneakers (clear of his face and both tags), the tail at his mouth, spoken in two parts:
  1. **"So, after a 30% discount,"** → the **30% OFF** tag on the stand lights up with its glowing gold frame, then **a red line draws itself across the ₹1800** on the tag hanging from the sneakers (a marker scribble): the old price is crossed out.
  2. **"I will pay ₹1260."** → a **green ₹1260 tag stamps onto the stand**, under both tags, a little tilted (a thud, a sparkle burst: the answer to his question), and a chime.
  ("30%" in red like the OFF tag, "₹1260" in green like the new tag)
- The strike line, the gold frame and the green tag are on the picture, so they move with its slow zoom.
- About 3 seconds later, the big panel slides up for Checkpoint 3.

### Checkpoint 3 — Price after a discount (new, after Screen 35; Screen 37 in the game)
(The **Summary / checkpoint** layout; see *Checkpoints* in section 1.)
- On top: **CHECKPOINT 3 OF 4** and **Price after a discount**; her voice opens with **"Let’s remember!"** (written above the cards).
- **Two lined index cards**, each read out with the recorded lines of Screens 32 and 34: **Discount ₹540** (red) "30% of ₹1800 = 30/100 × 1800" ("So, 30% of ₹1800 =" "30/100 × 1800" "So, it’s ₹540!") and **Selling Price ₹1260** (blue) "₹1800 − ₹540: what Aniket pays" ("To find how much you have to pay," "subtract the discount from the marked price." "₹1800 − ₹540" "= ₹1260.").
- The formula on a **yellow sticky note**: **SP = MP − Discount**.
- Then the topic is ticked, the note flies into the notebook, Swifty rises in to celebrate, and the buttons wait: **Got it, next** (the panel slides back down, revealing Screen 36), **Hear it again**, **Go back** (to Screen 31).

### Screen 36 — Here Are Your Sneakers
- Background: `shopkeeper gives sneakers box.png`: at the shop's counter, the shopkeeper hands Aniket his new sneakers in an open orange-and-white box; both smile. A slow zoom eases in towards the box; the shelf lights glow softly.
- No speech bubble, no words: a soft **light sweeps across the box**, with a chime (no twinkles). The progress bar moves on to **Discount %**.
- About 3 seconds later: Screen 37.

### Screen 37 — What Percent Is the Discount?
(Before the discount percentage formula: the discount, as a percent of the marked price, worked out with the part and the whole, the way Screens 28 and 29 did; then the rule's words dissolve into the discount percentage formula. Swifty's lines are written for the game.)
- The counter picture gives way to the panel, with **the photo of the sneakers and their ₹1800 and 30% OFF tags** on the left (so 540 and 1800 clearly come from them) and the title **"What percent is the discount?"** on top.
- **The topic starts with Checkpoint 3's note:** **SP = MP − Discount** comes out of the notebook button and settles under the photo ("REMEMBER · CHECKPOINT 3").
- **Swifty rises in on her books** (she introduces it), and the working of Screen 29 springs up with the sneakers' numbers (no ₹): the question **"540 is what percent of 1800?"**, the boxes **Part = 540** and **Whole = 1800**, and on the graph paper **Percentage = Part / Whole × 100**, then **= 540 / 1800 × 100**, then **= 30%**.
- She reads the question out (no bubble), then **"540 is the part,"** / **"and 1800 is the whole."** (each amount turns its colour in the question, violet and olive, and its box comes in). **Then she goes back down with her books**, and her voice works it out on its own, exactly as on Screen 29: **"To find the percentage,"** / **"divide the part by the whole,"** / **"then multiply by 100."**, **"Put the part on top,"** / **"and the whole below."** (540 and 1800 glide into the fraction), **"540 ÷ 1800 × 100"** / **"= 30%."** (30% lands, circled in red pen) / **"So, 540 is 30% of 1800!"**
- **Then the formula of the discount percentage, by dissolving.** The two boxes fade away and their column folds up, so the working glides into the middle and grows a little. **"Here, the part is the discount,"** → over the line, **"Part" dissolves into "Discount"**: the old word blurs and fades away while the new one comes into focus in its place, the fraction widening to fit it; "Discount" is red, and **540** turns red too, in the working and in the question. **"and the whole is the marked price."** → under the line, **"Whole" dissolves into "Marked Price"** (amber), and **1800** turns amber.
- Then the new rule is read out (it is written on the sheet): **"So, Discount % = Discount ÷ Marked Price × 100."** → as it starts, **"Percentage" dissolves into "Discount %"**. The sheet now reads **Discount % = Discount / Marked Price × 100 = 540 / 1800 × 100 = 30%**.
- About 3 seconds later the working **dissolves into Screen 38**.

### Screen 38 — Discount Percentage
(Storyboard 19: "Discount percentage formula". Its robot is **Swifty**; the first line is the storyboard's. Swifty isn't here: her voice on its own. The **Worked example** layout.)
- The photo of the sneakers stays on the left; the title is **"Discount percentage"**.
- **Graph paper** springs up (big writing):
  1. **"Discount percentage tells us what percent"** → "Discount % =" is written in. **"of the marked price is taken off."** → the fraction **Discount / Marked Price**, then "× 100". This line, the rule, sits on the **rule band** (pale yellow, the same as on Screen 34). "Discount %" and "Discount" red, "Marked Price" amber.
  2. The next line's "=" pops and its fraction bar draws itself. **"The discount is ₹540,"** → **540** comes in on top (red) while "Discount" in the rule lights up. **"and the marked price is ₹1800."** → **1800** comes in below (amber) while "Marked Price" lights up. Then "× 100".
  3. **"540 ÷ 1800 × 100"** → the last line's "=" pops. **"= 30%."** → **30%** lands and is **circled in red pen**. **"That’s the 30% off on the tag!"**
- About 3 seconds later the working **dissolves into Screen 39**.

### Screen 39 — Checkpoint 4: Discount %
(Storyboard 20: "Complete summary". The **Summary / checkpoint** layout; see *Checkpoints* in section 1.)
- On top: **CHECKPOINT 4 OF 4** and **Discount %**; her voice opens with **"Let’s sum up the sneakers!"** (written above the cards).
- **Three lined index cards**, each read out as it comes in (no bubbles): **Marked Price ₹1800** (amber) "on the tag" ("Marked Price: ₹1800."), **Discount ₹540** (red) "30% of the marked price" ("Discount: 30%," "which is ₹540."), **Selling Price ₹1260** (blue) "what Aniket pays" ("Selling Price: ₹1260.").
- The formula on a **yellow sticky note**: **Discount % = Discount ÷ MP × 100** ("and Discount % = Discount ÷ MP × 100.", read "Discount percentage equals Discount divided by M P, times one hundred").
- Then **Discount % ✓** is ticked (the whole progress bar is ticked now), the note flies into the notebook, and **Swifty rises in to celebrate**, with her bubble: **"Now you can work out any discount!"** The buttons wait: **Got it, next** (the panel slides back down into Screen 40), **Hear it again**, **Go back** (to Screen 37).

### Screen 40 — Back Home
- Background: `boy return home .png`: back home, Aniket comes in with his backpack, the new book under his arm and the sneakers in a shopping bag; his father sits at the dining table with a cup of tea and the newspaper. A slow drift, the daylight through the far window softly glowing, and dust floating in the sunlight ✨.
- A conversation, **one person at a time** (each bubble goes before the next one comes), every line spoken in its speaker's voice, clear of both faces:
  1. **Father:** **"How was your shopping?"**, on the wall up-left of his head, its point down at his mouth.
  2. **Aniket:** **"Great! I learnt about marked price, discount and discount percentage."**, on the wall right of his face, its point at his mouth from the side.
  3. **Father:** **"That’s useful, because you have another shopping job."**, up-left of his head again.
- About 3 seconds later, a smooth **cross-fade into Screen 41**.

### Screen 41 — School Starts Soon
- Background: `boy and his father talking.png`: Aniket and his father sit facing each other at the dining table; his father talks, one hand raised. A slow drift, the daylight in the far doorway softly glowing, dust in the sunlight ✨.
- His father talks, **one line after the other**, from a bubble on the wall between them (clear of both faces), its point at his mouth from the side:
  1. **"Your new school session starts in a few days."**
  2. **"You still need some things for school."**
- About 3 seconds later, a **cross-dissolve into Screen 42**.

### Screen 42 — The Shopping List
- Background: `father gave him list.png`: his father hands Aniket a list: **School Uniform, School Shoes, School Bag, Water Bottle**. No words.
- The camera **pushes in on the list** until it fills the middle of the screen, 1.7× bigger; the list glows and a shine sweeps across the paper (a soft sparkle sound; no twinkles).
- Then the camera **eases back out** to exactly the framing Screen 43 starts from, and Screen 42 **dissolves into Screen 43**: the pictures line up, so only what is in their hands changes (the list becomes the money).

### Screen 43 — ₹5,000 to Spend
- Background: `father gave him money.png`: the same view; his father holds out a fan of ₹500 notes. A slow drift (shared with Screen 44).
- The notes glow and shine, with a cash-register **"cha-ching"** ✨. Then his father's bubble, up-right of his face, its point at his mouth (clear of both faces and the money): **"Here’s ₹5,000."** (₹5,000 bold; the voice says "five thousand rupees"), and the amount pulses with a soft "ding".
- About 3 seconds later, a **pure dissolve into Screen 44** (the same shot, the camera carried over).

### Screen 44 — Into His Pocket
- Background: `boy take money in his pocket.png`: the same view; Aniket tucks the money into his pocket, his father smiling. No words: a shine on the notes, and a soft swish.
- About 3 seconds later, a **cross-fade into Screen 45**.

### Screen 45 — Find the Best Deals
- Background: `boy stand and talk .png`: his father, seated at the table, talks to Aniket, who stands by the table with his backpack. A slow drift, the sunny window softly glowing ✨.
- **One bubble at a time**, each spoken in its speaker's voice, clear of both faces:
  1. **Father:** **"Use what you have learnt and find the best deals."**, up-right of his head, its point down at his mouth.
  2. **Father:** **"Whatever is left after buying everything is yours."**, in the same place.
  3. **Aniket:** **"Really?"**, up-left of his face, its point down at him.
  4. **Aniket:** **"Then I’m definitely finding the best offers!"**, left of his face, its point at his mouth from the side.
- About 3 seconds later, a **cross-fade into Screen 46**.

### Screen 46 — Game Begins
- Background: `game begins.png`: Aniket, ready to go, outside his house (No. 27) by the gate, on the left. A slow drift, the morning sun softly glowing ✨.
- On the right, **the shopping challenge's panel** (its pieces cut from `game begin panel sheet .png` into `ui/begin/`), with **only a few things in it and room round each**, building up one piece at a time:
  1. The **cream panel** springs up, and the blue **GAME BEGINS** banner drops onto its top with a little bounce (whoosh).
  2. The **"School Shopping Challenge"** ribbon unrolls under the banner.
  3. The **wallet, "Wallet ₹5,000"**, pops in; a shine runs across it with a cash-register "cha-ching".
  4. The title **Shopping List** comes in (on the panel itself, no box), and under it **the four items side by side**, each popping in turn as a small cream card with a soft tan edge, its picture above its name on two lines: **School Uniform** (the boy's uniform: shirt, tie and shorts), **School Shoes** (black school shoes), **School Bag** (the blue bag with a yellow pocket), **Water Bottle** (bottle). No checkboxes here.
  5. The yellow **START SHOPPING ❯** button bounces in, then glows softly in gold while it waits to be pressed.
- The panel stands in the design's place (stage x 1000–1848, with the banner just under the top buttons); the item cards are drawn in the sheet's colours and the game's font.
- **START SHOPPING** waits for the player (there is no countdown; **Next** works too) and leads, with a cross-fade, to Screen 47.

### The shopping game (Screens 47–59)

After the story, the learner **plays**. Aniket has ₹5,000 and the school shopping list; for each item the learner checks three shops' offers, works out what each would cost, compares them and buys at the best one. **Learning becomes the gameplay.**

- **The game map (Screen 47, the Shopping Area):** four shopping zones: **Uniform Street** (School Uniform), **Shoe Street** (School Shoes), **Bag Corner** (School Bag) and **Bottle Stop** (Water Bottle). The learner can **choose any item first**.
- **Always on show:** the **wallet** (₹5,000 at the start) and the **Shopping List** (☐ Uniform ☐ Shoes ☐ Bag ☐ Bottle). As items are bought, **they get ticked** and the wallet goes down. On the Shopping Area it is the big white panel on the right; on the streets, two small white cards in the top-left corner (the wallet, then the list), as in the street's design.
- **The loop, for every item:** choose the item → see its street's three shops → check each offer → work out its Selling Price → compare the three Selling Prices → buy at the best-value shop → the wallet updates → back to the Shopping Area. When all four are bought, the game is complete (Screen 52).
- **The difficulty goes up street by street** (each street keeps its own numbers, whatever order they are played in): the learning section used easy values (₹1,000 − ₹800 = ₹200; 25% of ₹2,000 = ₹500); **Uniform Street**: the same marked price, different offer formats (how offers work); **Shoe Street**: the same marked price, two percentage offers (simple percentage discounts); **Bag Corner**: different marked prices and offers (don't choose by the percentage alone); **Bottle Stop**: different prices and mixed offers (find the actual final price, choose the best deal).
- **Numbers:** 10%, 20%, 25% and 50% (30% only when the price makes it easy); marked prices in round amounts (₹500, ₹800, ₹1,000, ₹1,500, ₹1,600, ₹1,800, ₹2,000 …); never awkward numbers such as 17%, 18%, 35% or ₹1,349. The arithmetic is never the challenge: the challenge is **understand the offer → calculate the final price → compare → make the best buying decision**.
- **Wrong answers** on an offer:
  1. The first wrong pick **shakes, turns red and is crossed out**, and Swifty says **"Check how much you will actually pay."**
  2. The second is crossed out too, and Swifty gives **a hint about how**: for a percentage off, **"Find the discount first, then subtract it from the marked price."** (said in two halves, one bar line each); for an amount off, **"Subtract the discount from the marked price."**; for "get at" a price, **"“Get at” tells you the price you pay."**
  3. The **one answer left glows** (attention on the calculation) and the learner picks it to carry on.
  (A wrong shop when buying works the same way: see *Choosing where to buy*.)
  There is no losing: every item is bought at its best shop, so the totals always come out as below.
- **Two amounts are kept apart:** the **total discount received (₹1,060)**, the difference between the marked prices and the prices Aniket paid, and the **money left from the ₹5,000 budget (₹660)**, the amount he gets to keep. They are never both called "savings".
- **Next and Back** follow the game, not the screen numbers: on the Shopping Area, **Next** goes to the next item still to buy (Screen 52 once everything is bought); on a street, **Back** and **Next** go back to the Shopping Area (Next goes on to Screen 52 once everything is bought); from Screen 52, **Back** returns to the Shopping Area. Screen 46 starts the challenge afresh (nothing bought), and playing a street again buys its item again (it isn't counted twice).
- **Voices:** only Swifty and, at home, Aniket and his father speak: Swifty's lines on the question bar (on the big panel, in her bubbles), Aniket's and his father's in bubbles (the Shopping Area and Mission Complete have no one on screen, so no one speaks there).
- **The question bar (Screens 48–53: the streets, Shopping Complete and the receipt):** Swifty doesn't stand on her books here. She speaks from **a big white bar at the top of the screen** (132 px tall), always fully on it, in the top row between the wallet and the Back / Next buttons: **her face in a round frame inside its left end** (108 px; her real, animated self; the frame's ring turns teal and glows while she talks; no name), and beside it **what she says, written as she says it**, **at 34 px and always on one line**, one line at a time. The two lines too long for one line are said in two halves, one bar line after the other: the percentage hint ("Find the discount first," / "then subtract it from the marked price.") and Bag Corner's lesson ("Even though Shop A offers 25% OFF," / "Shop C has the lowest final price."). Between her lines it shows **what to do**, in a deep blue: the street and its item while the street builds ("Uniform Street · School Uniform"), "Here is how to work it out.", "Tap another shop to check its offer.", "Now compare the three offers.", "Next: back to the Shopping Area.". **While a question panel is up** (an offer card, the three offers compared) **the bar isn't needed: it slides away**, and the question is on the panel, **above its answers**; the bar slides back as soon as Swifty speaks (a hint, "Correct!", why a shop is the best deal), so she is always on screen when she talks. **Nothing is written twice:** what is on a panel (its question, each line of the working, the purchase slip) is never written again on the bar; Swifty reads the working and the slip out without writing them on it. It is **one bar for all those screens**: it slides up with the first of them and **stays put from one to the next** (it never jumps or blinks), and slides down for the Shopping Area and after the receipt. On the big panel's screens (54, 55, 58 and 59) it isn't there: **Swifty stands on her books**, with her speech bubbles above her head, as on every teaching screen.

### Screen 47 — Shopping Area
- No picture: the design's **light blue with soft circles**, drawn by the game. It shifts a little with the mouse, like the pictures do, while everything on it holds still. No one speaks here (no character is on screen): the "Tap to Select" pill is the instruction.
- **As in the design**, its pictures cut from `select shop sheet.png` into `ui/shop/`, and the cards, pills, sparks, panel and tags drawn in the sheet's colours and the game's font:
  - On the left, **four shop cards** (2×2), each in its shop's colour, its picture standing on its name pill, little sparks on both sides: **Uniform** (yellow), **Shoes** (pink), **Bag** (green), **Bottle** (purple).
  - On the right, a white **panel**: the **wallet** with its money in a pale pill, a thin line, and the **Shopping List**, each line a checkbox, the item's picture and its name.
  - Everything sits a little lower than in the design, so Back / Next stay clear (the panel from stage y 112, the cards from y 135).
- The first time, it builds up quickly: the panel slides in from the right while the cards pop up one after another; the wallet pops in and its money **counts up from ₹0 to ₹5,000** with a cash-register "cha-ching"; the list comes in line by line; then a **"Tap to Select"** pill drops in at the top, between the Scenes button and Back / Next, and bobs gently. Back from a street, the panel is there at once (the wallet showing what is left, the item bought ticked) and the cards pop up quickly. Every few seconds the cards still to visit bounce one after another, until one is picked.
- **Tapping a card picks that shop:** it springs, lifts and glows in its colour (as on the sheet), a yellow **"Selected"** tag pops up on its top edge, its sparks burst, and its line on the list lights up in its colour; "Tap to Select" goes away. A moment later the screen **pushes in on that card** while its street fades in. With a mouse, a card also lifts a little when the pointer is over it.
- **A bought item's card** turns **light grey** (its picture greyed out, its pill grey) with a **big green tick** over its picture, and its button is **disabled**: it can't be picked again. Once everything is bought the pill says **"All done!"** and the game moves on to Screen 52.

### Screens 48–51 — The four streets
- As in the street's design. **The street's picture** (`game background.png`): a blue sky, trees on both sides, a light-blue town behind a green hedge, a pink pavement and the road. **Two white clouds drift slowly across the sky** (behind everything; they hold still if the player's device asks for less motion). Drawn by the game over it:
  - **three shop fronts** side by side on the pavement, **Shop A** (red), **Shop B** (blue) and **Shop C** (purple): the pictures from `new shops for game .png` (a sign with a bump on top, a striped awning with a scalloped edge, a cream front with a big window and three lamps), with the game's words and things on them: the shop's **name on its sign** (white, outlined), and in the window **the item** on the left (the uniform on a hanger), **its marked price on a cream tag hanging from a string** on the right, and **the shop's offer on a red tag** under it (the amount big, the word small: 10% OFF, ₹250 OFF, GET AT ₹1,300);
  - in the top-left corner, right of the screens button, **the wallet** (its picture and the money) **and the shopping list** (Uniform, Shoes, Bag, Bottle, each with its box and picture) on **two white cards**, the item's line lit up in its colour;
  - **Aniket** on the road on the left, and **the question bar** along the top (Swifty speaks from it). There is no street sign: the bar says which street it is.
- **Coming in:** the shops pop up one after another while **Aniket walks in** along the road from the left (footsteps) and stops in front of the shops; meanwhile the question bar shows the street and its item ("Uniform Street · School Uniform"). Then Swifty says the street's two lines on the bar, and it says **"Tap a shop to check its offer."**
- **Checking an offer** (in any order): the shops still to check glow softly (a gold glow behind them), and bounce now and then. Tapping one brings **its card** up out of it, **in focus**: a calm backdrop (the game's light blue with soft circles) fades in over the street, the wallet, the list and Aniket, so nothing but the card is to be seen. The card is **big** (1600 × 790), and the question bar slides away meanwhile. The card: the shop's name on its coloured band (no item name); on the left the item in a big frame with its marked price and its offer (the same white and red tags); on the right the question, **"How much will you pay?"**, on a purple strip **above three big answers**. A wrong pick: see *Wrong answers* (the bar slides back with Swifty's hint). The right one turns green with a tick (sparkles) and Swifty says **"Correct!"**; the answers make way for **the working**, written in line by line (the = signs lined up) while Swifty reads each line out (the bar says "Here is how to work it out.": the working isn't written twice), then the Selling Price is stamped under it, on the green badge: **"SP = ₹1,400"** ("SP =" smaller, the amount big). The card shrinks back into its shop as the backdrop fades away, and the green badge **"SP = ₹…"** sits on the pavement under the shop; the bar says "Tap another shop to check its offer."
- **Choosing where to buy** (no separate comparison board): once all three are checked, the three Selling Prices are under the shops (e.g. **SP = ₹1,440**, **SP = ₹1,400**, **SP = ₹1,350**). Then each green badge **dissolves** (it blurs and fades while the button comes into focus in its place, one after another) into a yellow **Buy button with its price**: **"Buy for ₹1,440"**, **"Buy for ₹1,400"**, **"Buy for ₹1,350"**. The bar says **"Tap Buy at the best shop."** and Swifty asks the street's question (e.g. **"Where should Aniket buy the shoes?"**).
  - A wrong shop's button **shakes and buzzes, turns grey and is crossed out** (it can't be pressed again), and Swifty helps from the bar: first **"Compare the final prices, not just the discount percentages."**, then **"Buy where the Selling Price is the lowest."** while the one button left glows.
  - The best shop's button: sparkles, it squeezes, and **every button dissolves back into its badge** (the three Selling Prices again); the best shop glows with the yellow **"Best deal!" ribbon** over its board (the others fade back), and Swifty says **why**: "Shop C has the lowest final price." (on Bag Corner, its lesson: "Even though Shop A offers 25% OFF," / "Shop C has the lowest final price.").
- **Buying:** right after (the bar: "Paying ₹1,300…"), **the money flies from the wallet to the shop** ("cha-ching", **SOLD** stamped on its window), **the item flies from the shop onto the shopping list** (its box is ticked), and a big slip says **"Uniform purchased!"** (or Shoes, Bag, Bottle) with **the wallet's sum**, e.g. **₹5,000 − ₹1,300 = ₹3,700 LEFT**, while the wallet counts down; Swifty reads the slip out ("Uniform purchased!") without writing it on the bar, which says what comes next ("Next: back to the Shopping Area.").
- Then Swifty waves from the bar, and about 2.5 s later the game goes back to the Shopping Area (the bar slides down), or on to Screen 52 once everything is bought (the bar stays).

The four streets (what each shop's card asks, and the answers it offers, the right one in bold):

| Street | Shop | Marked Price | Offer | Working | Answers |
|---|---|---|---|---|---|
| **48 Uniform Street** — "Three shops sell the same uniform." "Tap each shop to check its offer!" | A | ₹1,600 | 10% OFF | 10% of ₹1,600 = ₹160; ₹1,600 − ₹160 = ₹1,440 | ₹1,590 · **₹1,440** · ₹160 |
| | B | ₹1,600 | ₹250 OFF | ₹1,600 − ₹250 = ₹1,350 | ₹1,850 · ₹250 · **₹1,350** |
| | C | ₹1,600 | GET AT ₹1,300 | GET AT ₹1,300; Final Price = ₹1,300 | ₹300 · **₹1,300** · ₹1,600 |
| **49 Shoe Street** — "Every shop marks the shoes at ₹1,800." "Tap each shop to check its offer!" | A | ₹1,800 | 20% OFF | 10% of ₹1,800 = ₹180; 20% = ₹360; ₹1,800 − ₹360 = ₹1,440 | **₹1,440** · ₹360 · ₹1,780 |
| | B | ₹1,800 | ₹400 OFF | ₹1,800 − ₹400 = ₹1,400 | ₹400 · **₹1,400** · ₹2,200 |
| | C | ₹1,800 | 25% OFF | 25% means one-quarter.; ₹1,800 ÷ 4 = ₹450; ₹1,800 − ₹450 = ₹1,350 | ₹1,775 · ₹450 · **₹1,350** |
| **50 Bag Corner** — "Now the marked prices are different!" "Don't choose just by the discount percentage." | A | ₹1,600 | 25% OFF | 25% of ₹1,600 = ₹400; ₹1,600 − ₹400 = ₹1,200 | **₹1,200** · ₹1,575 · ₹400 |
| | B | ₹1,500 | 20% OFF | 20% of ₹1,500 = ₹300; ₹1,500 − ₹300 = ₹1,200 | ₹300 · **₹1,200** · ₹1,480 |
| | C | ₹1,400 | ₹250 OFF | ₹1,400 − ₹250 = ₹1,150 | ₹1,650 · ₹250 · **₹1,150** |
| **51 Bottle Stop** — "This is the final challenge!" "Different prices, different offers. Check each one!" | A | ₹800 | 25% OFF | 25% of ₹800 = ₹200; ₹800 − ₹200 = ₹600 | ₹775 · **₹600** · ₹200 |
| | B | ₹700 | ₹150 OFF | ₹700 − ₹150 = ₹550 | **₹550** · ₹850 · ₹150 |
| | C | ₹600 | 10% OFF | 10% of ₹600 = ₹60; ₹600 − ₹60 = ₹540 | ₹60 · ₹590 · **₹540** |

- The wrong answers are the usual mistakes: taking the percentage off as rupees (₹1,590), giving the discount instead of the price (₹160), adding the discount (₹1,850), or ignoring the offer (₹1,600).
- **Where to buy** (the Buy buttons, the right one in bold): Uniform Street: "Which shop gives the best deal?" (Buy for ₹1,440, Buy for ₹1,350, **Buy for ₹1,300**); Shoe Street: "Where should Aniket buy the shoes?" (₹1,440, ₹1,400, **₹1,350**); Bag Corner: "Which shop gives the best value?" (₹1,200, ₹1,200, **₹1,150**), and Swifty adds **"Even though Shop A offers 25% OFF, Shop C has the lowest final price."**; Bottle Stop: "Which bottle should Aniket buy?" (₹600, ₹550, **₹540**). On the others, Swifty: "Shop C has the lowest final price."
- **The wallet**, bought in the order Uniform → Shoes → Bag → Bottle: ₹5,000 − ₹1,300 = **₹3,700 left**; − ₹1,350 = **₹2,350**; − ₹1,150 = **₹1,200**; − ₹540 = **₹660**. In any other order the steps differ but it always ends at ₹660.

### Screen 52 — Shopping Complete!
- The light blue; a big blue banner **SHOPPING COMPLETE!** (gold words) drops in, **confetti** rains, and **"You bought everything on the list!"** comes up under it (all of it under the question bar). Then:
  - **on the left, the wallet and the shopping list**: the Shopping Area's white panel (a little smaller), the wallet showing **₹660 LEFT** in green, and the list's four lines;
  - **on the right, the four things bought**, each on a card in its shop's colour as on the Shopping Area (Uniform yellow, Shoes pink, Bag green, Bottle purple: its picture on its name pill).
  Line by line, **each item is ticked on the list as it pops up on its card on the right** (with its own green tick), so the list and the things bought match up; then the money left pops ("cha-ching"). As the banner lands, Swifty adds on the question bar: **"Well done! You found the best price for every item."** (the banner already says it is complete). (Aniket isn't on this screen.)

### Screen 53 — Final Receipt
- A **receipt** (white paper, its bottom edge perforated) prints row by row: **"Aniket's School Shopping"**, then Item · Marked Price · Discount · Amount Paid: **Uniform** ₹1,600 · ₹300 · ₹1,300; **Shoes** ₹1,800 · ₹450 · ₹1,350; **Bag** ₹1,400 · ₹250 · ₹1,150; **Bottle** ₹600 · ₹60 · ₹540; **Total ₹5,400 · ₹1,060 · ₹4,340** (discounts in red, amounts paid in green, each item with its picture). The receipt is centred under the question bar, where Swifty says how to read it (its heading already says what it is): **"The discounts are in red, what he paid in green."** … "He paid ₹4,340 for everything."

### Screen 54 — Money Left
- The big panel slides up, and the money left is worked out as on Screen 34: **Father gave ₹5,000** ↓ **Aniket spent ₹4,340**, and on the white sheet **Money left = ₹5,000 − ₹4,340 = ₹660** (₹660 marked yellow), each step as Swifty (on her stand) says it: "His father gave him ₹5,000." "He spent ₹4,340." "Money left = ₹5,000 − ₹4,340 = ₹660."

### Screen 55 — Two Different Amounts
- A dissolve: **"Two Different Amounts"** on a purple strip, and two cards with a **≠** between them: **Total Discount Received ₹1,060** (red) — "The difference between the marked prices and the prices Aniket paid." (₹5,400 − ₹4,340 = ₹1,060), and **Money Left From the ₹5,000 Budget ₹660** (green) — "The amount Aniket gets to keep." (₹5,000 − ₹4,340 = ₹660). Swifty: "These are two different amounts.", then she reads each card out as it comes in. Neither is called "savings". Then she flies off and the panel slides down.

### Screen 56 — Back Home
- Background: `return home shopping list .png`: Aniket, on the left, has come home with his backpack and a blue shopping bag; his father sits at the table on the right with his tea and the newspaper. A slow drift, the sunny window in the room behind them softly glowing. Nothing is added on the table. One bubble at a time, between the two of them: his father's up-left of his head, Aniket's up-right of his face, each with its tail at the speaker's mouth:
  1. **Father:** "Did you get everything?"
  2. **Aniket:** "Yes!"
  3. **Father:** "How much did you spend?"
  4. **Aniket:** "₹4,340."
  5. **Father:** "So you still have ₹660 left!"
  6. **Aniket:** "And I got the best deal for every item!"
  7. **Father:** "Well done! You really did shop wisely."

### Screen 57 — Mission Complete
- The light blue; a green banner **MISSION COMPLETE** drops in (confetti), and a card: ✅ **Uniform**, ✅ **School Shoes**, ✅ **School Bag**, ✅ **Water Bottle**, and four boxes: **Budget ₹5,000**, **Amount Spent ₹4,340**, **Money Left ₹660**, **Total Discount Received ₹1,060**. No one speaks.

### Screen 58 — What We Learnt
- The big panel slides up: **"What We Learnt"** and four cards (2 × 2), visual and short, each read out by Swifty (on her stand) as it comes in: **Marked Price** — the price written on the item; **Discount** — the amount reduced from the marked price (**Discount = Marked Price − Selling Price**); **Discount Percentage** — the discount written as a percentage of the marked price (**Discount % = (Discount ÷ Marked Price) × 100**); **Price After Discount** — **Selling Price = Marked Price − Discount**.

### Screen 59 — Final Takeaway
- A dissolve: the bag's two offers from Bag Corner, side by side: **25% OFF** (Marked Price ₹1,600, **SP = ₹1,200**) **vs** **₹250 OFF** (Marked Price ₹1,400, **SP = ₹1,150**). Swifty, on her stand: **"A bigger discount percentage does not always mean a better deal."** (the red tags from the streets) — the ₹250 OFF card glows, with the yellow "Best deal!" ribbon — and **"Calculate how much you actually have to pay."** Then the green banner: **Compare the final price before you buy.**
- This is the last screen, so **Next** becomes **Replay**. The last screen always waits for the player to press Replay; it never starts the story over by itself.

## 4. Movement on every screen
- **Teaching pace:** the whole story runs slowly enough for kids to follow (one `PACE` setting, now 1.5× a brisk pace).
  It stretches every pause and the panel and card reveals (and, in the shopping game's bubbles, the typing: about 70 ms per letter). The story's bubbles follow the voice instead: each word lights up as it is said.
  Walking, flying, pops and button feedback keep their natural speed. Slowing the walk further would make the steps jerky.
- **Changing screens stays brisk** (not stretched by `PACE`): the "3 seconds later" holds before the story moves on are 3 s, cross-fades and dissolves take 1.2 s, and the next panel springs up as the dissolve ends.
- A slow zoom ("Ken Burns" effect) on every picture, plus a slight shift when the mouse moves ✨ (except Screen 2 and the panel screens, which stay still; the shopping game's own screens, 47–53 and 57, have no picture, so only their background shifts).
- **Words never wobble:** speech bubbles and thought clouds hold still (on a story picture they only follow its slow zoom), and things that call for attention (the Next buttons, the answer box on Screen 17, "₹200 reduced", the ₹800 badge, the amounts to drag) pulse with a glow around them instead of moving or changing size. The fonts are all loaded before the story starts, so no words change font as they appear.
- **One effect at a time** (a glow, or a ring, or sparkles); **sparkles only for a right answer or a checkpoint** (and the ₹1260 tag on Screen 35, the answer to Aniket's question). Softly glowing ceiling lamps and dust floating in the light ✨.
- **Story → teaching screen (see section 1):** the picture zooms in on the key object and **shrinks into the small framed photo** (10 → 11, 15 → 16, 25 → 26; on 36 → 37, whose photo is another picture, the panel and the photo dissolve in over it); **back to the story, the photo grows back out** (13 → 14, 34 → 35, and from Screen 8 into Screen 9). Into and out of a checkpoint from a story picture (19 → 20, 35 → Checkpoint 3 → 36, 39 → 40), and in the shopping game (53 → 54, 55 → 56, 57 → 58), the big panel **slides up** over the picture and **slides back down**.
- **Dissolves between neighbouring panel screens**, going forward (the photo, the title and Swifty, if she stays, don't move: only the content changes): **11 → 12 → 13**, **16 → 17 → 18 → 19**, **26 → 27 → 28 → 29 → 30 → Checkpoint 2 → 31 → 32 → 33 → 34**, **37 → 38 → 39**, **54 → 55** and **58 → 59**. Going back over them is a cut.
- **Fades between story pictures** only between Screens 1 ↔ 2, 3 ↔ 4, 4 ↔ 5, 5 ↔ 6, 20 ↔ 21 ↔ 22, 22 ↔ 23, 23 ↔ 24, 24 ↔ 25 and 40 ↔ 41 ↔ 42 ↔ 43 ↔ 44 ↔ 45 ↔ 46 ↔ 47, 47 ↔ each street (48–51: the Shopping Area pushes in on the card picked), 47–51 → 52 → 53 and 56 → 57.
  That's at home → at the mall, Bookstore → sees the book → holds the book → How Much?, and into the shoe shop → at the sneakers' stand (with the camera pushing in) → the discount on them → his questions about it (nearly the same view, so mostly only Aniket changes).
  Each is a smooth cross-dissolve where the new picture melts in over the old one.
  Every other change (Start → 1, 2 → 3 from outside the mall to inside it, 6 → 7, Replay, other jumps) is a straight cut with a small settle-in zoom.
  Screens 7 → 8 and 14 → 15 share one picture, so those changes don't look like cuts at all. Screens 9 → 10 share one shot, so the cut only changes Aniket's reaction.
- **Video clips** (section 1) bring the pictures to life where they are made: Screens 1, 5–8, 22–25, 35, 36, 40, 41, 43, 45, 46 and 56 talk and breathe, Screen 4 turns into 5 with Aniket picking up the book, and 42 into 43 with the list and then the money handed over (in place of those fades). The rest of the brief's animations wait for their clips (`Animation Video Prompts.md`, `docs/REVIEW.md`).

## 5. Controls
- **Top-right corner:** small **◀ Back** and **Next ▶** buttons, with a "2 / 61" counter between them (empty until the game has loaded). In the shopping game they follow the game (see *The shopping game*).
  While a screen is about to move on by itself, the Next button fills up like a timer. Clicking it skips ahead ✨. A checkpoint never moves on by itself: it waits for **Got it, next** (or Next).
- **Side screen panel:** a small **Scenes** button (top-left) opens a side panel with a picture of every screen. Click one to jump straight to it.
  Once the list is taller than the panel it scrolls (with a thin scrollbar), and it opens scrolled to the current screen.
  The panel also has an **Auto-play** switch ✨ (on at first). When it's off, every screen waits for Next.
- **The notebook button**, beside the Scenes button, once the first checkpoint is done: it opens the notebook (see section 1).
- Music, sound effects and full screen have **no on-screen buttons**; they are keyboard-only.
- **Keyboard ✨:** ← / → change screen · **Enter** / **Space** next (on a focused button, or an amount to drag on Screen 34, they press that instead) · **P** scenes panel · **N** notebook · **Escape** closes them · **F** full screen · **M** music on/off · **S** sound on/off.
- **For the language check only:** with `?log=right` or `?log=wrong` in the address, the game saves every line as it appears; **L** saves them as a spreadsheet (CSV), **Shift+L** empties the log (`js/linelog.js`; see `docs/VOICEOVER.md`, *Checking the language*).

## 6. Sounds and voices
All sound effects are made in the browser, so no audio files are needed:
footsteps · pop · speech-bubble "bloop" (the shopping game's bubbles: the story's come in quietly) ✨ · whoosh during cross-fades and when the question card arrives ✨ · start chime ✨ · "ding" for the "!" ✨ · sparkle ✨ · cash register ✨ · right-answer chime and wrong-answer buzz ✨ · Swifty's chirp as she rises in, and her wing flaps in the shopping game ✨ · card-flip swish ✨ · comic surprise for the ₹1000 shock ✨ · a curious "hmm?" as Aniket wonders ✨ · button clicks ✨.

**Background music ✨:** `sfx/bg music.mp3`, on a loop and kept **low**. It dips lower still while anyone speaks (and while Aniket walks): quickly as a line starts, and back up gently once no one has spoken for a moment, so it stays down between two lines. The tune ends at 143 s (4 s of silence follow it in the file), so it starts again from the top there. It starts with the first click, tap or key press (browsers allow no sound before that); **M** turns it off and on.

**Voices (Indian English):** every line is a **recorded clip**, made with the TTS studio *Ai Wala Human By Aamir* (Language Hindi, so the English words are read with an Indian accent): see **`docs/VOICEOVER.md`** for how the clips are made, checked and remade. In the story (Screens 1–46, and 56 at home), a bubble shows its whole line and **each word lights up as it is said**, in step with the recording; in the shopping game a bubble's letters come in at the voice's pace. Prices and maths are said in words: "₹800" is "eight hundred rupees"; "MP", "SP" and "CP" are spelled out; "=", "−", "÷" and "×" are said "equals", "minus", "divided by" and "times"; and "30/100" is "thirty over one hundred".
- **Aniket:** Male Child (Energetic). **His father:** Male Senior (Pedagogical). **Shopkeeper:** Male Teacher (Formal). **Swifty:** Female Teacher (Standard).
- **Who speaks, and how (the brief's rule 3):** Aniket, his father and the shopkeeper always speak in their bubbles. Swifty's line comes in her bubble only when its words aren't on the screen (a question, a hint, "Correct!" / "Not quite!", an instruction, a line linking two topics); when they are (a definition, a card, a strip, a formula being written, the working), she says it **with no bubble**, and what she says lights up. **During the worked solutions and the checkpoints' reading she isn't on the screen: her voice goes on by itself** (see section 1 for her screens). On the shopping game's streets, Shopping Complete and the receipt, every line she says is written on the question bar, beside her face.
- A clip is found by the **exact text its line shows** (`js/vo_lines.js`, made by `tools/vo_build.py`). The clips play on one reused audio element, unlocked on the first tap, and when the game is served over http(s) they are fetched one at a time after that tap. A screen moves on only once its last line has been said, and the music dips under every line.
- **No clip** (a line whose text has changed, a browser that can't play Ogg Opus such as older Safari, `?vo=0` in the address, or a missing file): the Indian-English text-to-speech voices already on the player's device read the line instead. That's Rishi on a Mac, Heera/Ravi or Neerja/Prabhat on Windows, and the Indian English voices on Android or Chromebook. If there are none, a Hindi voice is used, then any English voice.
- **Not recorded yet:** the four lines the brief's language fixes changed (`docs/VOICEOVER.md`, *To record next*), and the shopping game's lines (Screens 48–59). Until they are made with the studio, the device's voice reads them.
- The voices follow the sound switch (**S**). With no voice at all, a story bubble lights its words at about 62 ms a letter, and the shopping game's typing blips play.

## 7. Done when
- It opens from `index.html` and fills the window at 16:9 on a laptop, a projector, and a phone held sideways.
- The walk looks smooth, with no jitter and no bits of the neighbouring frames.
- Speech-bubble tails point at whoever is talking, only one person talks at a time, no bubble covers a face, a price, a tag or the book, and a small ₹800 sits clearly above the money.
- Every story bubble fades in calmly with its whole line, in balanced lines that wrap by themselves, and each word lights up as it is said.
- Screens 1, 5–8, 22–25, 35, 36, 40, 41, 43, 45, 46 and 56 move: the quiet loop while nobody speaks, the speaker's talking clip with each line, the bubbles on top; from Screen 4 to 5 Aniket picks up the book, and from 42 to 43 the list and then the money are handed over (Next during either goes straight on). No Gemini sparkle anywhere, and no clip jumps when it starts. With reduced motion, the still pictures.
- Screen 8's card slides in from the right and shows only the question and its two answers. Either answer shrinks the picture into the small photo, with the panel round it.
- A wrong answer: the answer is greyed and crossed out → Swifty rises in on her books: "Not quite! The shopkeeper sold the book for ₹800." → the two definition cards, read out with no bubbles → "Here, ₹800 is the shopkeeper’s selling price." → Next about 3 s later (no Try again).
- A right answer: a green tick, the card flips to "Correct!" with the explanation, and Swifty reads it out with no bubble; Next shows 3 s later.
- Next leads to Screens 9 → 10 ("₹1000? What is this?") → 11, the photo growing back out into Screen 9.
- Screen 11: the shocked picture zooms on the ₹1000 sticker and shrinks into the photo; Swifty rises in on her books and says "₹1000 is the price written on the book." while the ₹1000 flies from the sticker onto a taped note; "It is called the marked price (MP)." with no bubble as "Marked Price (MP)" comes in; then one line of meaning.
- Screens 11 → 12 → 13 dissolve into each other with the photo not moving: 12 is read out without Swifty (the definition on a lined index card, word by word); on 13, ₹1000 Marked Price → a grey arrow → ₹800 Selling Price on taped notes, read with no bubbles, then Swifty rises in to ask "Why is the selling price less than the marked price?"; then the photo grows back out into Screen 14.
- Screen 14: "₹1000 → ₹800" shows on the picture for a moment; the shopkeeper's line in three bubbles, "The price printed on the book is ₹1000," "but you paid only ₹800." "So, you got a ₹200 discount.", and the card builds ₹1000 → ₹200 reduced → ₹800 in step with them.
- Screen 15 picks up from 14 with no jump. The card leaves and the camera re-centres (the shopkeeper says nothing more); Aniket's face turns puzzled (only his face changes) and "Discount? What does that mean?" appears in a thought cloud whose puffs rise from his head.
- Screen 16: the picture shrinks into the photo, Aniket's thought settles on top of the panel as its heading, the Discount card springs up, and Swifty rises in on her books and reads the definition while the words appear.
- Screens 17 and 18 have no Swifty (her voice goes on): 17 builds ₹1000 − ₹800 = ₹200 (the amounts only, the ₹1000 flying off the book's sticker), writes each box's name in as the formula is said, then splits a ₹1000 bar into ₹800 paid and ₹200 discount; 18 builds "Discount = Marked Price − Selling Price", then its first letters fly down onto a sticky note to make "D = MP − SP".
- Screen 19 (Checkpoint 1 of 4: Discount): "Let’s remember!", the three cards and "Discount = MP − SP" read out with no bubbles, the example, the tick, the note flying into the notebook, Swifty rising in to celebrate; it waits for Got it, next / Hear it again / Go back.
- Screen 20: "Discount = MP − SP" on the picture for a moment; Aniket walks up to the glass doors inside the shop; the bell rings and the doors swing open into the shop, and he walks out through them into the mall; then a dissolve to Screen 21.
- Screen 21: the doors stand open behind him, and Aniket walks off along the mall to the next shop, the sneakers shop; then a fade to Screen 22.
- Screen 22: in the shoe shop, Aniket points at the sneakers; a light sweeps across them, and he says "These sneakers look good!", then (the 30% OFF label lighting up) "What does 30% OFF mean here?" and "Is this also a discount?", one bubble at a time, his lips moving with each; then a plain dissolve to Screen 23.
- Screen 23: Aniket points, and the camera moves in on the ₹1800 and 30% OFF tags, with no words; then a fade back to the whole stand.
- The shoe shop (Screens 22–25 and 35) is all video: no still picture shows.
- Screen 24: only the 30% OFF tag is highlighted, with a glowing gold frame hugging it; no words; then a fade where only Aniket changes.
- Screen 25: the tag stays lit; "The tag says ₹1800." (the ₹1800 card lighting up) and "With 30% off, how much do I actually pay?" in speech bubbles, one at a time.
- Screen 26: the shop shrinks into the photo (zoomed on the tags) and Aniket's question goes on top; the 30% OFF tag flies from the photo and stamps on; Swifty rises in on her books and reads out "30% OFF means… 30% Discount." (no bubble) as "means", its arrow and the "30% / Discount" card come in.
- Screen 27: Checkpoint 1's note comes out of the notebook; the sneakers card (photo, the ₹1800 tag swinging onto the laces, 30% OFF stamped); Swifty, still on her books, says "To find the discount amount, let’s first recall how percentages work." in two parts, then goes.
- Screens 28 and 29 have no Swifty: the rule "a is what percent of b?" (a and b in italic), then the example "125 is what percent of 500?" (no ₹); the part (violet) and the whole (olive) are named, the formula is written line by line, each word lit as it is said, earlier lines fading a little, the amounts glide into the fraction, and the answer is circled in red; on 29 a 10 × 10 grid fills 25 squares.
- Screen 30: the quick check, "250 is what percent of 1000?" with A 20%, B 25%, C 50% stacked; Swifty rises in to ask it; right or wrong she explains with the part and the whole coloured in the question, B is the answer, no second try, the grid shows 25%; then the Next button level with the last answer.
- Checkpoint 2 of 4 (Percentages), after Screen 30: Part 125 and Whole 500, "Percentage = Part ÷ Whole × 100", the example; it waits for the player.
- Screens 31–34 follow in order whatever the player answers on Screen 31: Checkpoint 2's note; "Now, what is 30% of ₹1800?" (B ₹540; the two tags light up in the photo), moving on by itself 3 seconds after Swifty's line; the working without her, 30% = 30/100, 30% of ₹1800 = 30/100 × 1800 = ₹540 (circled), and a ₹1800 bar in ten parts of ₹180 with three shaded; "What does ₹540 represent here?" (C Discount); and the amount to pay: "Now, let’s find out how much money Aniket needs to pay.", "What will be the Selling Price?" with the hint SP = MP − Discount (A ₹2340, B ₹1260, C ₹1340), then SP = MP − Discount = 1800 − 540 = ₹1260 with the player dragging ₹1800 and ₹540 (or tapping them, then their boxes) into the two empty boxes (a wrong box sends the amount back with Swifty's hint), a bar splitting ₹1800 into ₹1260 and ₹540, and "→ ₹1260 ✓" after Aniket's question on top.
- Screen 35: the photo grows back out into the shop, and as Aniket says "So, after a 30% discount, I will pay ₹1260." the 30% OFF tag lights up, the ₹1800 is crossed out in red, and a green ₹1260 tag stamps onto the stand.
- Checkpoint 3 of 4 (Price after a discount), after Screen 35: Discount ₹540 and Selling Price ₹1260, "SP = MP − Discount"; it waits for the player.
- Screen 36: the shop's counter: the shopkeeper hands Aniket the sneakers in their box; a light sweeps across the box, with a chime; no words.
- Screen 37: the photo of the sneakers and Checkpoint 3's note; Swifty rises in, reads "540 is what percent of 1800?" and names the part and the whole, then goes; her voice works it out as on Screen 29 (= 30%); the boxes fold away, and as "Here, the part is the discount, and the whole is the marked price." is said the words dissolve: Part → Discount (540 turning red), Whole → Marked Price (1800 amber), and, with "So, Discount % = Discount ÷ Marked Price × 100.", Percentage → Discount %.
- Screen 38: without Swifty, the graph paper writes Discount % = Discount / Marked Price × 100 on the rule band as her voice explains it, then = 540 / 1800 × 100 (each number coming in under its word), then = 30% (circled), "That’s the 30% off on the tag!"
- Screen 39 (Checkpoint 4 of 4: Discount %): "Let’s sum up the sneakers!", ₹1800, ₹540 and ₹1260 on three cards, "Discount % = Discount ÷ MP × 100", the whole progress bar ticked, Swifty celebrating with "Now you can work out any discount!"; then the panel slides down into Screen 40.
- Checkpoints: the same layout every time, never moving on by themselves; "Hear it again" reads it all again, "Go back" goes to the start of the topic; each one's note is in the notebook, which opens any time (also in the shopping game); the progress bar ticks its topic.
- Screen 40: back home, his father asks "How was your shopping?", Aniket answers "Great! I learnt about marked price, discount and discount percentage.", and his father says "That’s useful, because you have another shopping job.", one bubble at a time.
- Screens 41–45: his father brings up school (two lines), hands Aniket the list (the camera pushes in on it and eases back), gives him "₹5,000" (the notes shine, "cha-ching"), Aniket pockets it, and his father's advice and Aniket's "Really?" / "Then I’m definitely finding the best offers!" come one bubble at a time; 42 → 43 → 44 are dissolves where only their hands change.
- Screen 46: outside his house, the "Game Begins" panel builds up beside Aniket, uncluttered (banner, ribbon, ₹5,000 wallet, the four items side by side as small cards, one by one, the glowing START SHOPPING button), which waits for the player and leads to Screen 47.
- Screen 47: as in the design, the four shop cards pop up and the wallet and Shopping List panel slides in (₹0 counting up to ₹5,000, "cha-ching"), then "Tap to Select"; tapping a card makes it glow with a "Selected" tag, lights up its line on the list, and pushes in to its street. Any item can be first.
- Screens 48–51: on the street's picture (clouds drifting across its sky), the three shops build up, Aniket walks in along the road, and Swifty says the street's two lines on the question bar (her face on its left corner; between her lines it always says what to do); each shop's offer is checked (wrong picks crossed out, "Check how much you will actually pay.", then a hint and the last answer glowing), its working written and read out, "SP = ₹…" stamped on the card and then under the shop; the three badges dissolve into "Buy for ₹…" buttons and the player buys at the best shop (a wrong one is crossed out, with a hint; "Best deal!" on the right one); buying flies the money to the shop and the item onto the list, ticks it, and shows the wallet's sum; then back to the Shopping Area, the item ticked and the money gone down. The numbers are exactly those in the table.
- After the fourth item (in any order): Screen 52 (the wallet, ₹660 left, and the list on the left, ticked line by line as the four things bought pop up on the right; confetti), the receipt (₹5,400 · ₹1,060 · ₹4,340), the money left (₹5,000 − ₹4,340 = ₹660), the two different amounts (₹1,060 ≠ ₹660, never both called savings), back home (the seven lines), Mission Complete, What We Learnt (four cards), and the takeaway (25% OFF ₹1,200 vs ₹250 OFF ₹1,150; "Compare the final price before you buy."); then Replay, which waits for the player.
- Prices are read naturally: "₹800" as "800 rupees", "a ₹200 discount" as "a 200 rupee discount".
- Every line is spoken in an Indian-English voice; a character speaks only when on screen, except Swifty's voice during the worked solutions and the checkpoints' reading, where it goes on without her (the brief's rule 3).
- Back/Next, panel jumps, and Auto-play all work, and revisiting a screen restarts its animation.
