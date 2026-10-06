# Bookstore Journey — Game Prompt

> A full description of the story intro for the **Profit & Discount** game.
> You can paste this into any AI coding tool to rebuild or extend the game.
> Items marked ✨ are extra effects added on top of the original request.

---

## 1. What to build

A short animated **story game** for kids that runs in a web browser. It asks a first profit-and-discount question, then carries the story on to the next idea: the price printed on the book.

- **Format:** 16:9, on a fixed **1920 × 1080** stage that scales to fit any screen (black bars when the screen is a different shape).
- **Tech:** plain HTML + CSS + JavaScript. It opens by double-clicking `index.html`, with no server, installs, or internet needed.
- **Look:** bright, friendly, comic-book style. Rounded bold font (**Baloo 2**, which includes the **₹** sign).
- **Speech bubbles:** text size **34 px**, and each bubble is sized to fit its text.
- **Characters:** **Aniket** (boy, green T-shirt, navy backpack), the **Shopkeeper** (glasses, navy apron) and **Swifty** (a teal bird with a backpack, the helper; "she").
- **Voices:** every line is spoken aloud in an **Indian-English voice** (see section 6).

## 2. Assets (`game assets/`)

| File | Used on |
|---|---|
| `start screen.png` | Start screen background (it already has the "Bookstore Journey" title) |
| `start button.png` | Start button, placed **below the title text** |
| `morning.png` | Screen 1: Aniket wakes up and stretches in his bedroom |
| `outside home.png` | Screen 2: the street outside his home |
| `ui/gate-leaf.png`, `ui/gate-gap.png` | Made from `outside home.png`: the gate's left leaf cut out on its own, and the view behind it with the bars painted out (the steps, the porch wall, the planter). Together they let the leaf swing open on Screen 2 |
| `book store outside view.png` | Screen 3 background (inside the mall) |
| `aniket walking sprite sheet.png` | Screens 2 and 3 walking animation (8 frames) |
| `aniket saw a book.png` | Screen 4 |
| `aniket hold the book scene.png` | Screen 5 |
| `aniket give a book to shopkepper.png` | Screens 6, 14 and the start of 15 (on 14–15 the shopkeeper's open-hand gesture "explains") |
| `what is discount.png` | The same picture with Aniket **puzzled** (it lines up exactly; only his face differs): fades in on Screen 15 when he hears "discount", then stays for Screens 16–21 (blurred behind the panels) |
| `aniket give money to shopkeeper.png` | Screens 7 and 8 |
| `boy see the book .png` | Screen 9 (seen from behind Aniket: he looks at the book, with its ₹1000 sticker) |
| `shocked aniket.png` | Screen 10 (the same view, Aniket shocked, with yellow surprise lines by his head), and blurred behind the panels of Screens 11–13 |
| `bird fly .png` | **Swifty** (teal bird with a backpack) flying, 8 frames |
| `bird talk .png` | Swifty standing and talking, 8 frames |

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

### Screen 1 — Good Morning!
- Background: `morning.png`: Aniket sits up in bed, stretching happily, with the morning sun in the window. A slow zoom, the bedside lamp and the sun softly glowing, and dust floating in the sunlight ✨.
- Two little **bird chirps** outside ✨, then Aniket's bubble (34 px text), spoken in his voice:
  **"I'm going to the mall today. Let's see what I can find!"** (lines: "I'm going to / the mall today. / Let's see what / I can find!")
  It sits on the wall **between his hair and his raised fist**, so his stretch stays in full view, with the tail pointing at his mouth. The slow zoom grows from the top of the picture, so the bubble never nears the top edge.
- About 3 seconds later, a smooth **cross-fade into Screen 2** (time passes: he gets ready and goes out).

### Screen 2 — Off to the Mall
- Background: `outside home.png`: the street in front of Aniket's house, in morning sun.
- Aniket **comes out of his gate**:
  1. After a short pause the gate's **left leaf swings open** into the garden on its hinges, in perspective, with a latch click and a soft creak ✨. Behind it are the porch steps.
  2. Aniket (the cleaned **walking sprite**, the same as Screen 3, **mirrored to face left**) steps out of the gateway onto the pavement, fading in as he comes out of the porch's shade.
  3. He pauses, breathing, while the gate **swings shut behind him** with a metal clank ✨.
  4. He **walks off to the left** along the middle of the pavement and **right out of the picture on the left**.
- No reflection on the ground here (it isn't the shiny mall floor), just a soft shadow. He's sized to match the house (a little taller than the gate). **Footsteps** follow him ✨, and the music dips while he walks.
- Once he's gone, a straight **cut to Screen 3**, where he walks into the mall.

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
- After about 3 seconds, a smooth **cross-fade to Screen 5**.
  Screens 4 and 5 use the same camera shot, so the fade looks like Aniket picking the book up ✨.

### Screen 5 — An Interesting Book
- Background: `aniket hold the book scene.png`.
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
2. The whole scene **blurs and dims**, and the question card **glides to the middle** of the screen.
3. **Swifty flies in** from the left, flapping, using `bird fly .png`. She **lands on the top edge of the card** with a little squash, a chirp and a soft shadow, and switches to `bird talk .png`.
4. She **talks**, with her beak moving while her voice reads the line. A comic bubble (34 px text) says:
   **"Think again. The shopkeeper sold the book for ₹800."**
5. Then the **definitions panel** fills the screen, with the background still blurred, and **Swifty flies to its right side** and stands there.
   The panel appears **empty first**. Then the cards are taught **one at a time**, **Cost Price first**, and **Selling Price only after CP is complete**:
   - **Cost Price (CP)** (blue card): picture of money → picture of the book. "Price at which an item is **bought**."
   - **Selling Price (SP)** (yellow card): picture of the book → picture of money. "Price at which an item is **sold**."
   Each card **eases in** piece by piece: card → title → first picture → the arrow drawing itself → second picture → definition → a highlighter swipe on the key word.
   There's a short pause to read before the next card. Swifty waves her wings at each card as it arrives and **reads it out**: its name ("Cost Price. C P.") as the title appears, then the definition as it appears.
   The pictures are cut from the game's own artwork.
   Then Swifty talks again, from a bubble above her head (34 px text):
   **"Here, ₹800 is the shopkeeper's Selling Price."** (₹800 in orange, *Selling Price* in green)
6. **Exactly 3 seconds after everything is up**, a big **Next ▶** button appears in the **bottom-right corner** of the screen, and the story moves on to Screen 9.
   There is **no Try again** button: after a wrong answer the player learns the two terms and carries on.

#### Right answer (Selling Price) — "Correct!"
- The button turns green with a ✓, a happy chime and a sparkle burst.
- The scene **blurs and dims behind**, and the card **glides to the middle** of the screen.
- There the card **flips over** to show:
  - a green header with a ✓ badge: **Correct!**
  - **"The shopkeeper sold the book for ₹800, so ₹800 is the Selling Price."** (₹800 highlighted, *Selling Price* in green)
- **Swifty flies in** from the right and lands overlapping the card's **lower-right corner**. She points at the card and reads it out in her voice ("Correct! The shopkeeper sold the book…"), her beak moving, still leaning towards it.
- **3 seconds later**, the same big **Next ▶** button appears in the **bottom-right corner** and moves the story on to Screen 9.

### Screen 9 — A Closer Look
- Background: `boy see the book .png`: seen from behind Aniket, he looks at the book in his hands.
- Reached by a smooth **cross-fade** from the question screen (there is no "Aniket holds his new book" screen in between).
- A **glowing gold ring pulses around the ₹1000 sticker** ✨ to draw the eye to it. No words.
- After about 3 seconds, a quick **cut** to Screen 10. It's the same view, so only Aniket's reaction changes.

### Screen 10 — What Is This?
- Background: `shocked aniket.png`.
- The picture **jolts** with a comic "zwip-bwong!" surprise sound ✨, and the ring around ₹1000 pulses.
- Aniket's bubble (34 px text), spoken in his voice. It sits just right of the yellow surprise lines by his head, with its tail meeting them, and never covers them:
  **"What is this? ₹1000 is written on this book!"** (₹1000 in orange)
- After about 3 seconds it carries straight on to Screen 11. It's the same picture, so there's no visible cut.

### Screen 11 — Marked Price
1. The shocked picture **blurs and dims**, and a **panel springs up in the middle** (the same cream, dotted, chunky-outlined style as the other panels).
2. A big **picture of the book** eases in on the left of the panel. It's drawn to match the cover in the story: blue, "A Brighter Tomorrow", sun, mountains and river, with the **₹1000 sticker** and barcode.
3. **Swifty flies in** and **lands on top of the book**.
4. She talks, with a bubble beside her head (34 px text) and her voice:
   **"₹1000 is the price written on the book."** (₹1000 in orange)
   As she speaks, a gold ring pulses around the sticker. A line then draws from the sticker to a round **zoom lens**, which pops open showing **₹1000** big ✨.
5. Then a pink label drops in under the lens: **Marked Price (MP)**. Swifty waves, her first bubble goes, and a new one says:
   **"It is called the Marked Price (MP)."** ("Marked Price (MP)" in red as the new term)
6. She **stays on the book** for Screens 12 and 13. About 3 seconds later the panel **dissolves into Screen 12**.

### Screen 12 — Marked Price definition
- Carries straight on from Screen 11: the blurred background, the panel, the book and **Swifty on it stay exactly where they are**. Only the right side dissolves away (the lens, the label, the line and her bubble).
  The new screen starts already blurred, so the background never flashes sharp.
- A **definition card** eases in beside the book, matched in height to the book. A blue header **Marked Price (MP)** drops in ("(MP)" in yellow).
- The definition appears **word by word** while **Swifty reads it out** from the book, her beak moving (the card itself is the text she reads, so no bubble here):
  **"The price marked or printed on an article is called its Marked Price."**
  Line breaks follow the storyboard: "The price marked or / printed on an article / is called its / **Marked Price.**"
- **marked** and **printed** get a yellow highlighter swipe, and a gold ring pulses around the ₹1000 sticker on the book (the price "marked on the article").
- About 3 seconds later it **dissolves into Screen 13** in the same way.

### Screen 13 — Compare MP and SP
- Same carry-on: the background, panel, book and Swifty stay put, and the right side changes.
- Built up one piece at a time. Swifty says each step from the book, **in a speech bubble beside her head** (34 px text), a new bubble for each line:
  1. A cream-yellow box: **₹1000 / Marked Price**. The ring pulses on the ₹1000 sticker. "The Marked Price is ₹1000."
  2. A thick arrow **grows downwards** (no question mark beside it).
  3. A light-blue box: **₹800 / Selling Price**. "But the book was sold for ₹800. That is the Selling Price."
  4. She asks: **"Why is the Selling Price less than the Marked Price?"** This sets up the next idea, discount, and the question stays up until the screen moves on.
- About 3 seconds later the blurred panel **dissolves away into Screen 14** (the sharp counter scene).

### Screen 14 — Shopkeeper reveals the reduction
- Background: `aniket give a book to shopkepper.png`, framed like the question screen: the camera is shifted left so Aniket and the shopkeeper stay in view, and a soft blurred copy fills in past the picture's right edge from the first frame.
- A **card swings in from the right** (the same cream, dotted, chunky style as the question card).
- The shopkeeper's speech bubble (34 px text, his deeper voice), split into three parts that type and speak one at a time:
  1. **"The marked price was ₹1000,"** → a cream-yellow **₹1000** box pops into the card.
  2. **"but I sold it to you for ₹800."** → a **red arrow grows downwards** with a falling "whoop" sound, then a light-blue **₹800** box pops in.
  3. **"You paid ₹200 less."** → **"₹200 reduced"** pops in, in red, beside the arrow and keeps gently pulsing.
  Bubble lines: "The marked price was / ₹1000, but I sold it / to you for ₹800. / You paid ₹200 less." (all three prices in orange)
- The ₹1000 and ₹800 boxes keep the **same colours as Screen 13** (yellow = Marked Price, blue = Selling Price), so the learner can see it's the same comparison, now with its explanation.
- About 3 seconds later it carries straight on to Screen 15.

### Screen 15 — Aniket asks about discount
(The storyboard calls the boy "Amit". In the game he stays **Aniket**.)
- The same picture, carried straight on from Screen 14 with no visible cut. The camera, the card and the shopkeeper's bubble are exactly where they were.
  Then his bubble shrinks away, the card **swings back out to the right**, and the camera **glides back to the middle** (the soft right edge eases away halfway through the glide).
- **One at a time**, as on Screen 6:
  1. Shopkeeper (his voice): **"You got a ₹200 discount."** (₹200 in orange, **discount.** in red as the new word, then a soft "ding")
  2. His bubble goes. Aniket doesn't know the word: his face **turns puzzled**, as `what is discount.png` softly fades in over the picture (only his eyebrows, eyes and mouth change), with a curious rising "hmm?" ✨.
  3. Aniket **wonders in a thought cloud** (not a speech bubble), read in his voice: **"Discount? What does that mean?"** ("Discount?" in red, the new word).
     The cloud floats above and to the right of his head, in the empty wall between him and the shopkeeper. Three little puffs, small to big, pop up one by one from the top of his hair with soft rising "plip"s ✨, then the puffy cloud (round bumps all the way round, the same outline and 34 px text as the speech bubbles) billows out of the last puff and the words type in. The puffs gently bob.
- About 3 seconds later it carries straight on to Screen 16.

### Screen 16 — Discount concept reveal
- Carried straight on from Screen 15 on the puzzled picture: Aniket's thought cloud is still there at first, then it melts away (the cloud first, then its puffs), the counter scene **blurs and dims**, and a **panel springs up in the middle**.
- **Left of the panel, a price flow builds from the top**, each box popping in and a short arrow growing down to the next:
  - **₹1000 / Marked Price** (cream-yellow, the Marked Price colour from Screens 13–14)
  - **₹200 / reduced** (light red box with red text: the reduction), with a falling "whoop" sound
  - **₹800 / Selling Price** (light blue, the Selling Price colour)
- **Swifty flies in from the right** and lands beside the flow, on the right of the panel, then waves.
- Her bubble (34 px text, above her head) types and is spoken in two parts:
  1. **"The price was reduced by ₹200."** → the ₹200 box pulses with a red ring.
  2. **"This ₹200 reduction is called a Discount."** ("Discount." in red as the new word)
- Then a big **DISCOUNT** label **lands like a rubber stamp** beside her (red letters on warm yellow, tilted, with a thud and a sparkle burst). The ₹200 box keeps glowing because it *is* the discount, and Swifty waves.
- About 3 seconds later it carries straight on to Screen 17.

### Screen 17 — Discount definition
- Carried straight on from Screen 16 with no visible cut: the blurred counter, the panel, Swifty and her bubble are first exactly where they were.
- Then her bubble shrinks away and the panel closes. A **definition card springs up** (the same style as the Marked Price card on Screen 12: blue header, white body), a little left of centre.
- **Swifty hops over** and lands overlapping the card's **lower-right corner**. She **points at it**: her wing (talk frame 6) stretches out towards the card and she leans towards it, blinking now and then.
- The header **Discount** drops in, then the definition appears **word by word** while **Swifty reads it out** in her voice, still leaning towards the card:
  **"The reduction given on the marked price of an item is called a discount."**
  Line breaks follow the storyboard: "The reduction given on the / marked price of an item / is called a **discount.**"
  **reduction** and **marked price** get a yellow highlighter swipe, and **discount.** is in red (the colour of the new word on Screens 15–16). It pulses at the end with a soft "ding".
- She waves, then **goes back to pointing at the card** for a moment.
- Then she **hops down to her corner** (the bottom-right of the screen), leaving the definition up. About 3 seconds later the card **dissolves away into Screen 18**.

#### Screens 18–21 — Swifty's corner
- Swifty **stays in the bottom-right corner** through Screens 18, 19, 20 and 21, carried across every dissolve without moving. On a direct jump to one of these screens she flies in to that spot first.
- **Every line she says comes in a speech bubble above her head** (34 px text), typed while she speaks; each new line's bubble takes the place of the one before. Prices are orange, and on Screen 21 the term names are in their colours.
- The panels sit **left of centre** so they never meet her or her bubbles.

### Screen 18 — Discount formula (built visually)
- The blurred counter stays exactly the same through the dissolve, so only the definition card visibly fades away.
- A panel springs up (the same cream, dotted, chunky style), and the **book** (the same "A Brighter Tomorrow" drawing with its **₹1000** sticker) eases in on the left.
- The sum builds one piece at a time, in the colours used since Screen 13, with Swifty saying each step from her corner:
  1. A gold ring pulses on the book's sticker. The **Marked Price** box (yellow) pops in empty, and the **₹1000 lifts off the sticker and flies into it** in an arc, growing and shedding its white sticker card so it lands as the box's value. "The Marked Price is ₹1000."
  2. **−** pops in, then the **Selling Price ₹800** box (blue). "Subtract the Selling Price, ₹800."
  3. **=** pops in, then the **Discount ₹200** box (red) **lands like a stamp** with a sparkle burst. "We get ₹200. That is the Discount!"
- Then she says the formula in words from one bubble that types part by part, and each part pops with a ring in its colour as she says it: "Marked Price," → "minus Selling Price," → "equals Discount."
- The **Discount ₹200** box keeps glowing, with a soft "ding".
- About 3 seconds later the panel **dissolves away into Screen 19** (the blurred counter stays exactly the same).

### Screen 19 — Formula reveal
- A panel springs up with an empty **pink strip**. The formula in words builds on it part by part while Swifty says it, her bubble typing in step:
  "Discount" → "equals Marked Price," → "minus Selling Price."
  The colours are the ones used since Screen 13: **Discount** red, **Marked Price** brown-gold, **Selling Price** blue, with the operators in dark ink.
- "We can write it in short." A **blue box** springs up under the strip. Then, term by term, the **first letters light up** in the strip (a white key-cap pops behind each one: **D**, **M** + **P**, **S** + **P**), and they **lift out and fly down into the blue box**, growing as they go, to build **D = MP − SP**. Her bubble says "D for Discount," "MP for Marked Price," "SP for Selling Price." part by part (the voice spells out "M P" and "S P"). The = and − pop in between.
- The short form is read out from a new bubble, **"So, D = MP − SP."**, with each part popping as she says it.
- Swifty **points at the formula** and her bubble goes. A **yellow note** (34 px text, red) appears under the blue box with its tail pointing up at it: **"Use MP and SP."** Swifty says it.
- About 3 seconds later the panel **dissolves away into Screen 20** (the blurred counter and Swifty stay exactly the same).

### Screen 20 — Apply the formula to Aniket's book
- A panel springs up with the **book** (the "A Brighter Tomorrow" drawing with its ₹1000 sticker) on the left and a **white solution sheet** on the right. The sheet is written **line by line**, with its **= signs lined up** like a neat notebook solution and a soft marker "scribble" as each line's words are written in (a left-to-right wipe). Swifty says each step from her corner:
  1. "Let's find the discount on Aniket's book."
  2. **Marked Price = ₹1000**: the sticker glows and the **₹1000 lifts off the book's sticker and flies into the line**. "Marked Price is ₹1000."
  3. **Selling Price = ₹800**. "Selling Price is ₹800."
  4. A dividing line draws across.
  5. **Discount = ₹1000 − ₹800**: "Discount equals Marked Price minus Selling Price." Then **copies of ₹1000 and ₹800 fly down from the lines above** into place, showing the values being put into the formula. A new bubble types "₹1000 minus ₹800"…
  6. …**= ₹200** lands like a stamp, and the same bubble finishes "equals ₹200."
- Then a **gold answer box, "Discount = ₹200"** (₹200 in red), lands like a stamp with a sparkle burst and keeps gently glowing. "So, the discount on the book is ₹200!"
- Colours as since Screen 13: Marked Price and ₹1000 brown-gold, Selling Price and ₹800 blue, Discount and ₹200 red.
- About 3 seconds later the panel **dissolves away into Screen 21** (the blurred counter stays exactly the same).

### Screen 21 — Quick summary
- A panel springs up left of centre, beside Swifty in her corner, and she waves. A blue **"Let's remember!"** title drops in as she says it.
- **Three cards** (white, with a coloured header band in each term's colour) appear **one at a time**, joined by **arrows that draw themselves**. Each card pops in, then its price, then its description. Swifty says each one in her bubble:
  1. **Marked Price** (yellow band), **₹1000**, "Price written on an item." "Marked Price is the price written on an item. Here, ₹1000."
  2. **Selling Price** (blue band), **₹800**, "Price at which it is sold." "Selling Price is the price at which it is sold. Here, ₹800."
  3. **Discount** (red band), **₹200**, "Amount reduced from the marked price." "Discount is the amount reduced from the marked price. Here, ₹200."
- Then the formula pops in under the cards: **Discount = MP − SP** (Discount red, MP brown-gold, SP blue), with twinkles around it. Swifty's bubble says **"And remember the formula: Discount = MP − SP!"** (read aloud as "Discount equals M P minus S P") and she waves.
- This is the last screen for now, so **Next** becomes **Replay**.

## 4. Movement on every screen
- **Teaching pace:** the whole story runs slowly enough for kids to follow (one `PACE` setting, now 1.5× a brisk pace).
  It stretches every pause, the 3-second holds (now about 4.5 s), letter-by-letter typing (about 70 ms per letter), cross-fades (1.8 s) and panel and card reveals.
  Walking, flying, pops and button feedback keep their natural speed. Slowing the walk further would make the steps jerky.
- A slow zoom ("Ken Burns" effect) on every picture, plus a slight shift when the mouse moves ✨.
- Softly glowing ceiling lamps and dust floating in the light ✨.
- **Fades only between Screens 1 ↔ 2, 3 ↔ 4, 4 ↔ 5, 5 ↔ 6 and 8 ↔ 9**, plus one-way dissolves **11 → 12 → 13** (only the panel's right side changes) and **13 → 14** (the panel fades away into the counter scene) and **17 → 18 → 19 → 20 → 21** (what's on top fades away; the blurred counter stays exactly the same). Going back over those is a cut. Screens 14 → 15 share one picture, so that change doesn't look like a cut at all.
  That's good morning → leaving home, Bookstore → sees the book → holds the book → How Much?, and question → closer look at his new book.
  Each is a smooth cross-dissolve where the new picture melts in over the old one.
  Every other change (Start → 1, 2 → 3 where he has just walked out of the picture and then walks into the mall, 6 → 7, Replay, other panel jumps) is a straight cut with a small settle-in zoom.
  Screens 7 → 8 and 10 → 11 share one picture, so those changes don't look like a cut at all. Screens 9 → 10 share one shot, so the cut only changes Aniket's reaction.

## 5. Controls
- **Top-right corner:** small **◀ Back** and **Next ▶** buttons, with a "2 / 21" counter between them.
  While a screen is about to move on by itself, the Next button fills up like a timer. Clicking it skips ahead ✨.
- **Side screen panel:** a small **Scenes** button (top-left) opens a side panel with a picture of every screen. Click one to jump straight to it.
  Once the list is taller than the panel it scrolls (with a thin scrollbar), and it opens scrolled to the current screen.
  The panel also has an **Auto-play** switch ✨. When it's off, every screen waits for Next.
- Music, sound effects and full screen have **no on-screen buttons**; they are keyboard-only.
- **Keyboard ✨:** ← / → change screen · **P** scenes panel · **F** full screen · **M** music on/off · **S** sound on/off.

## 6. Sounds and voices
All sound effects are made in the browser, so no audio files are needed:
footsteps · pop · speech-bubble "bloop" ✨ · whoosh during cross-fades and when the question card arrives ✨ · start chime ✨ · "ding" for the "!" ✨ · sparkle ✨ · cash register ✨ · right-answer chime and wrong-answer buzz ✨ · Swifty's wing flaps and landing chirp ✨ · card-flip swish ✨ · comic surprise for the ₹1000 shock ✨ · a curious "hmm?" and soft rising "plip"s as a thought cloud's puffs pop up ✨ · button clicks ✨ · soft looping background music ✨ (quieter while he walks and while anyone speaks).

**Voices (Indian English):** every speech bubble is spoken as it types out. Prices are read naturally, so "₹800" is said "800 rupees"; "MP", "SP" and "CP" are spelled out, and "=" and "−" are said "equals" and "minus".
- **Aniket:** a young male voice. **Shopkeeper:** a deeper male voice. **Swifty:** a female voice, or a raised-pitch voice if the device has no female Indian voice.
- **There is no voice without a speaker on screen.** Swifty says every teaching line, and each one comes in her speech bubble. The only lines without a bubble are where she reads a card aloud while its words show on it: the Cost Price and Selling Price definitions, the "Correct!" card, and the Marked Price and Discount definitions.
- **Default:** the Indian-English text-to-speech voices already on the player's device. That's Rishi on a Mac, Heera/Ravi or Neerja/Prabhat on Windows, and the Indian English voices on Android or Chromebook. If there are none, a Hindi voice is used, then any English voice.
- **Studio-quality option:** recorded AI-voice files can replace any line. Put the MP3s in `game assets/voice/` and list them in `RECORDINGS` in `js/voice.js`.
  Line ids: `browse`, `ask`, `price`, `hint`, `def0-title`, `def0-text`, `def1-title`, `def1-text`, `here`, `correct`, `shock`, `mp-line`, `mp-term`, `mp-def`, `cmp-mp`, `cmp-sp`, `cmp-why`, `reveal-1`, `reveal-2`, `reveal-3`, `disc-1`, `disc-2`, `dwhy-1`, `dwhy-2`, `ddef`, `f-mp`, `f-sp`, `f-d`, `rule-1`, `rule-2`, `rule-3`, `fr-1` … `fr-10`, `fr-use`, `ap-0` … `ap-6`, `sum-0` … `sum-4`.
- The voices follow the sound switch (**S**). When no voice is available, the old typing blips play instead.

## 7. Done when
- It opens from `index.html` and fills the window at 16:9 on a laptop, a projector, and a phone held sideways.
- The walk looks smooth, with no jitter and no bits of the neighbouring frames.
- Speech-bubble tails point at whoever is talking, only one person talks at a time, and a small ₹800 sits clearly above the money.
- Screen 8's card slides in from the right and shows only the question and its two buttons.
- A wrong answer leads to blur → card in the middle → Swifty lands on it and says "Think again…" → definitions with Swifty on the right → Next exactly 3 s later (no Try again).
- A right answer, first time or after trying again, blurs the scene, brings the card to the middle, flips it to "Correct!" with the explanation, and Swifty flies in and reads it out; Next shows 3 s later.
- Next leads to Screens 9 → 10 ("What is this? ₹1000 is written on this book!") → 11.
  On Screen 11, Swifty lands on the book, explains the ₹1000 and the zoom lens shows it, and the "Marked Price (MP)" label appears with her second bubble.
- Screens 11 → 12 → 13 dissolve into each other with the book and Swifty never moving and the background never flashing sharp.
  On Screen 12 Swifty reads out the Marked Price definition word by word, and on Screen 13 she says each step in a bubble while ₹1000 Marked Price → ₹800 Selling Price builds, with no question mark.
- Screen 14: the shopkeeper's three-part line and the card build ₹1000 → ₹200 reduced → ₹800 in step with each other.
- Screen 15 picks up from 14 with no jump. The card leaves, the camera re-centres, then "You got a ₹200 discount."; Aniket's face turns puzzled (only his face changes) and "Discount? What does that mean?" appears in a thought cloud whose puffs rise from his head. Screen 16 starts with that cloud exactly where it was.
- Screen 16 picks up from 15 with no jump. The counter blurs, the ₹1000 → ₹200 reduced → ₹800 flow builds, Swifty explains in two parts, and DISCOUNT lands like a stamp.
- Screen 17 picks up from 16 with no jump. The panel goes, the Discount card springs up, Swifty hops to its corner, points at it and reads the definition while the words appear, then hops down to her own corner.
- Screens 18 → 21: Swifty stays in the bottom-right corner without moving through every dissolve, and every line she says comes in a bubble above her head.
- Screen 18 builds Marked Price ₹1000 − Selling Price ₹800 = Discount ₹200 piece by piece, with the ₹1000 flying off the book's sticker into its box, then reads the formula in words.
- Screen 19 builds "Discount = Marked Price − Selling Price", then its first letters fly down to make "D = MP − SP". Swifty points at it and the yellow note says "Use MP and SP."
- Screen 20 writes out the worked solution line by line (= signs lined up). The ₹1000 comes off the book's sticker, the values fly down into "Discount = ₹1000 − ₹800", "= ₹200" follows, and the gold "Discount = ₹200" answer box lands.
- Screen 21: Swifty recaps the three terms one card at a time (arrows drawing between them), then "Discount = MP − SP".
- Prices are read naturally: "₹800" as "800 rupees", "a ₹200 discount" as "a 200 rupee discount".
- Every bubble is spoken in an Indian-English voice, and no line is heard without its speaker on screen.
- Back/Next, panel jumps, and Auto-play all work, and revisiting a screen restarts its animation.
