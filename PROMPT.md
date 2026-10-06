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
| `shoes shop enter.png` | Screen 22: Aniket walks into a shoe shop in the mall; blue sneakers on a stand, tagged **₹1800** and **30% OFF** |
| `he saw a shoe.png` | Screen 23: Aniket at the stand, pointing at the ₹1800 price tag; and Screens 39–41, where the tags are updated |
| `hee see discount on shoes.png` | Screen 24: the same view (it lines up with Screen 23's picture; only Aniket differs), Aniket with his hand on his chin, looking at the 30% OFF tag |
| `he is tinking to see the shoes.png` | Screen 25: the same view again, Aniket confused, hand on his chin; and blurred behind the card on Screen 26 |
| `ui/sneakers.png` | Made from `he is tinking to see the shoes.png`: a product photo of the blue sneakers (they and the stand top kept sharp, the shop softly blurred behind), for the card on Screen 26, and on Screens 35 and 37 |

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
(The same corner is used again on Screens 26–38.)
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
- About 3 seconds later, a straight **cut to Screen 22**: Aniket's next find.

### Screen 22 — The Shoe Shop
- Background: `shoes shop enter.png`: Aniket walks into a shoe shop in the mall. A pair of **blue sneakers** stands on a display, with a **₹1800** price tag and a red **30% OFF** tag.
- The slow zoom eases in towards the sneakers; the shelf and ceiling lights glow and dust floats in the light ✨.
- A soft glow pulses around the sneakers, then a light sweeps across them with twinkles and a sparkle sound ✨.
- Aniket's bubble (34 px text), spoken in his voice, beside his face with its tail at his mouth:
  **"These sneakers look good!"** (lines: "These sneakers / look good!")
- About 3 seconds later, a smooth **cross-fade with the camera pushing in on the sneakers** into Screen 23.

### Screen 23 — Tagged Price
- Background: `he saw a shoe.png`: Aniket has come up to the stand and **points at the ₹1800 price tag** (the red 30% OFF tag beside it).
- **Nothing else** on this screen: no speech bubble, no text. It only has the gentle movement every screen has, the slow zoom easing in towards the price tags.
- About 3 seconds later, a smooth **cross-fade into Screen 24**. It's the same view and the camera carries on, so only Aniket changes.

### Screen 24 — 30% Off!
- Background: `hee see discount on shoes.png`: Aniket, **hand on his chin**, thinks about the red **30% OFF** tag beside the ₹1800 price.
- **Only the discount is highlighted**: the red 30% OFF tag lights up with a **glowing gold frame** that hugs it (rounded corners, so it doesn't cross the ₹1800 tag), pulsing gently, with four twinkles at its corners and a sparkle sound ✨.
- No speech bubble, no text.
- About 3 seconds later, a smooth **cross-fade into Screen 25** (the same view: only Aniket changes, and the lit tag stays lit).

### Screen 25 — What Does 30% Mean?
(Storyboard: "Amit is confused". In the game he stays **Aniket**.)
- Background: `he is tinking to see the shoes.png`: Aniket, confused, hand on his chin, at the sneakers' stand. Coming from Screen 24, the **30% OFF tag is still framed in glowing gold**, exactly as it was (on a direct jump it lights up first).
- **Two lines, one at a time**, both in Aniket's voice:
  1. A **thought cloud** (he wonders): **"What does 30% discount mean here?"** ("30% discount" in red). It floats on the wall right of his head; its three puffs rise from the side of his hair, then the cloud billows out and the words type in. It sits low enough never to touch the top edge, even at the camera's closest zoom.
  2. The cloud melts away, then a **speech bubble**, its tail at his mouth by his hand: **"How much money will actually be reduced?"** (lines: "How much money / will actually / be reduced?")
- About 3 seconds later it carries straight on to Screen 26 (the same picture, so there's no visible cut).

### Screen 26 — Recall Percentages
(Storyboard: "Bridge to percentage recall". Its robot is **Swifty** in the game.)
- Carried straight on from Screen 25: the picture, the lit 30% OFF tag and Aniket's question are first exactly as they were. Then his bubble shrinks away, the shop **blurs and dims** (the tag's glow fades with it), and a **card springs up in the middle**, left of centre (the same cream, dotted, chunky style as the other panels):
  1. A **product photo of the blue sneakers** eases in (`ui/sneakers.png`).
  2. Under it, the white **₹1800** price tag pops in.
  3. Beside it, the red **30% OFF** tag (tilted, like the one on the stand) **lands like a stamp**, then a **glowing gold frame** pulses around it, with a sparkle ✨.
- **Swifty flies in** from the right to her **corner** (bottom right, as on Screens 18–21), waves, and **points at the card**.
- Her speech bubble (34 px text, above her head) types and is spoken in two parts:
  1. **"To find the discount amount,"** → the 30% OFF tag pops.
  2. **"let's first recall how percentages work."** → the "30%" on the tag pops.
  Lines: "To find the / **discount amount**, / let's first recall / how **percentages** work." ("discount amount" and "percentages" in red, the key words)
- She holds the point for a moment, then stands upright again. About 3 seconds later the card **dissolves away into Screen 27** (the blurred shop and Swifty stay exactly the same).

### Screen 27 — 100% and the Amount
(Storyboard: "100% and the amount". Its robot is **Swifty**.)
- Over the same blurred shop, with Swifty still in her corner (she doesn't move during the dissolve), the sneakers card fades away and a **table springs up** left of centre, chunky like the other cards:
  - a light-blue **header row**: **Percentage** | **Amount** (blue words that drop in one after the other);
  - one cream **row** under it, empty at first.
- Swifty points at the table. Her bubble (34 px text, above her head) types and is spoken in two parts, and **each value pops into the table as she says it**:
  1. **"Suppose ₹500"** → **₹500** pops into the Amount column.
  2. **"represents 100%."** → **100%** pops into the Percentage column.
  Lines: "Suppose **₹500** / represents **100%**." (₹500 and 100% in orange)
- Then the row **flashes gold** and both values pop together with a soft "ding": the two belong together.
- The table can take more rows later (e.g. 50%, 10%), each filled in the same way.
- About 3 seconds later it carries straight on to Screen 28: nothing visibly changes at first (the table, Swifty and her bubble stay exactly where they are).

### Screen 28 — What Is 50% of ₹500?
(Storyboard: "What is 50% of ₹500?", a question.)
- Carried straight on from Screen 27. Swifty's bubble shrinks away, then the table **grows two rows**: they unfold downwards while the table glides up to stay centred.
- A **pink strip** drops in above the table with the question **"What is 50% of ₹500?"**, and Swifty reads it out (her beak moves; the words are on the strip, so no bubble).
- The new rows fill in, in the table's colours:
  1. Under 100%, a **red arrow draws itself downwards** (a falling "whoop") with **÷ 2** beside it, and **50%** pops into a yellow cell (red figure).
  2. Under ₹500, the same arrow and **÷ 2**, and a **?** pops into a white cell.
- **Three answer buttons** slide in under the table, one by one: **A ₹250**, **B ₹300**, **C ₹400** (light blue, with blue letter chips). Swifty points at them and waits.
- **Right (A ₹250):** the button turns green with a ✓, a happy chime and a sparkle burst. Swifty: **"Correct! ₹500 ÷ 2 = ₹250."** (two parts; as she says the second, the **?** turns into **₹250**, yellow with a red figure).
- **Wrong (B or C):** the button turns red with a ✗, shakes and buzzes; every button locks (**no second try**, as on Screen 8). Swifty: **"Not quite! 100% ÷ 2 = 50%, so ₹500 ÷ 2 = ₹250."** (three parts: each ÷ 2 step pops as she says it; on the last, the **?** turns into **₹250** and the right answer, A, lights up green).
- Both ways end with **"So, 50% of ₹500 is ₹250."** while the new row flashes gold. 3 seconds later the big button appears **at the end of the answers' row**, left of Swifty (her corner is where it usually goes). It says **Next** (or **Replay** on the last screen) and leads to Screen 29.

### Screen 29 — Solution for 50%
(Storyboard: "Solution for 50%". Its robot is **Swifty**.)
- Over the same blurred shop, the question strip, the answer buttons, the Next button and Swifty's last bubble **dissolve away**; the table (100% | ₹500, ÷ 2 | ÷ 2, 50% | ₹250) and Swifty in her corner stay exactly where they are.
- Swifty points at the table. Her bubble (34 px text, above her head) types and is spoken in two parts:
  1. **"We halved 100%,"** → the ÷ 2 under 100% pops, then **50%**.
  2. **"so we also halved ₹500."** → the ÷ 2 under ₹500 pops, then **₹250** is **marked as the answer**: it pops onto a bright yellow box (dark figure), as in the storyboard.
  Lines: "We **halved** **100%**, / so we also / **halved** **₹500**." ("halved" in red, the same red as the ÷ 2 arrows; 100% and ₹500 in orange)
- Then the answer appears **under the table** on a **green bar with a white tick in a green circle**: **"50% of ₹500 = ₹250"**, with a chime and twinkles.
- About 3 seconds later it carries straight on to Screen 30: nothing visibly changes at first.

### Screen 30 — What Is 25% of ₹500?
(Storyboard: "What is 25% of ₹500?", a question.)
- Carried straight on from Screen 29: the table, the green bar, Swifty and her bubble are first exactly as they were. Her bubble shrinks away and the green bar slides away; then the table **makes room for the new question**, all at once and smoothly:
  - **50% | ₹250 turns plain** again (its yellow fades back to cream and its red figures to ink), and the yellow box under ₹250 fades away;
  - the first **÷ 2 row folds away** (its arrows fade first), so **100% | ₹500** and **50% | ₹250** now sit one above the other;
  - a new **÷ 2** row and a **25% | ?** row **open under them**;
  - the whole table, with the question and answers that come next, **eases a little smaller** (to 90%) and up a little, so all of it fits on the screen.
- Then, as on Screen 28: the **pink strip** drops in with **"What is 25% of ₹500?"** and Swifty reads it out; under 50% the red ÷ 2 arrow draws down and **25%** pops in (yellow cell, red figure); under ₹250 the same, and a **?** (white cell).
- Answers: **A ₹100**, **B ₹125**, **C ₹250**. Swifty points at them and waits.
- **Right (B ₹125):** green ✓, chime, sparkles. Swifty: **"Correct! ₹250 ÷ 2 = ₹125."** (the **?** turns into **₹125** as she says the second part).
- **Wrong (A or C):** red ✗, shake, buzz; every button locks (no second try). Swifty: **"Not quite! 50% ÷ 2 = 25%, so ₹250 ÷ 2 = ₹125."** (three parts: 50% and its ÷ 2 pop, then 25%; ₹250 and its ÷ 2 pop, the **?** turns into **₹125** and B lights up green).
- Both ways end with **"So, 25% of ₹500 is ₹125."** while the new row flashes gold; 3 seconds later the big button appears at the end of the answers' row, level with them.
- The button says **Next** and leads to Screen 31.

### Screen 31 — Solution for 25%
(Storyboard: "Solution for 25%". Its robot is **Swifty**.)
- Over the same blurred shop, the question strip, the answer buttons, the Next button and Swifty's last bubble **dissolve away**; the table (still at 90%: 100% | ₹500, 50% | ₹250, ÷ 2 | ÷ 2, 25% | ₹125) and Swifty in her corner stay exactly where they are.
- Swifty points at the table. Her bubble (34 px text, above her head) types and is spoken in two parts:
  1. **"The same operation"** → both **÷ 2** steps pop.
  2. **"is applied to both sides."** → the two column names, **Percentage** and **Amount**, pop as she says "both sides"; then 25% pops and **₹125** is **marked as the answer** on a bright yellow box.
  Lines: "The **same operation** / is applied to / both sides." ("same operation" in red, the same red as the ÷ 2 arrows)
- Then the answer appears **under the table** on the green bar with a tick: **"25% of ₹500 = ₹125"**, with a chime and twinkles.
- About 3 seconds later it **dissolves into Screen 32** (the blurred shop and Swifty stay exactly the same).

### Screen 32 — General Idea of Percentage
(Storyboard: "General idea of percentage". Its robot is **Swifty**.)
- Over the same blurred shop, with Swifty in her corner, the table and the green bar fade away and a **panel springs up** (the same cream, dotted, chunky style), left of centre.
- It builds **one pair at a time**, each a box, a **double-headed arrow ↔ that draws itself**, then the other box:
  1. **Part** (light blue box, blue word) ↔ **Percentage** (yellow box)
  2. **Whole** (mint-green box, dark green word) ↔ **100%** (yellow box)
- Swifty points at it. Her bubble (34 px text, above her head) types and is spoken in two parts:
  1. **"Percentage tells us how much of the whole"** → the **Percentage** box pops as it starts, and the **Whole ↔ 100%** pair pops as she says "the whole".
  2. **"we are considering."** → the **Part ↔ Percentage** pair pops.
  Lines: "**Percentage** tells us / how much of the whole / we are considering." ("Percentage" in red, the key word)
- About 3 seconds later the panel **dissolves into Screen 33** (the blurred shop and Swifty stay exactly the same).

### Screen 33 — What Percent?
(Storyboard: "a is what percent of b?". The storyboard shows no dialogue here, so Swifty's lines below are written for the game.)
- Over the same blurred shop, with Swifty in her corner, the pairs panel fades away and a **panel springs up** (the same cream, dotted, chunky style), left of centre. It holds:
  - a **purple strip** across the top with the question **"₹125 is what percent of ₹500?"**;
  - on the left, two boxes: **Part = ₹125** ("Part" on a light-blue label) and **Whole = ₹500** ("Whole" on a mint label);
  - on the right, a **white sheet** where the formula is worked out **line by line, the = signs lined up**:
    **Percentage = Part / Whole × 100**, then **= 125 / 500 × 100**, then **= 25%** (real stacked fractions with a bar).
- **Colours:** the part is **blue** and the whole **green** everywhere (in the question once they're named, the boxes, the formula and Swifty's bubbles); "Percentage" is **red**, as in the storyboard.
- Step by step, each in time with Swifty (she reads the question first; its words are on the strip, so no bubble), then her bubbles (34 px text, above her head):
  1. **"₹125 is the part,"** → ₹125 in the question turns blue and pops, and the **Part = ₹125** box pops in. **"and ₹500 is the whole."** → ₹500 turns green, and the **Whole = ₹500** box pops in.
  2. **"To find the percentage,"** → "Percentage" is written in (a left-to-right wipe with a marker scribble). **"divide the part by the whole,"** → "=" pops and the fraction Part / Whole is written in. **"then multiply by 100."** → "× 100" pops.
  3. The next line's "=" pops and its fraction bar draws itself. **"Put the part on top,"** → the little blue arrow over "Part" pops in and nudges down (as in the storyboard), and **₹125 lifts out of the Part box and glides into the top of the fraction**, landing as **125**. **"and the whole below."** → **₹500 glides into the bottom** as **500**. Then "× 100" pops.
  4. **"125 ÷ 500 × 100"** → the last line's "=" pops. **"= 25%."** → **25%** lands like a stamp. **"So, ₹125 is 25% of ₹500!"** → 25% is **marked as the answer** on a bright yellow box (as on Screens 29 and 31), the two amounts in the question pop, and twinkles sparkle around the answer.
- About 3 seconds later the panel **dissolves into Screen 34** (the blurred shop and Swifty stay exactly the same).

### Screen 34 — Quick CFU
(Storyboard: "Quick CFU", a check for understanding. The storyboard shows no dialogue, so Swifty's feedback lines below are written for the game.)
- Over the same blurred shop, with Swifty in her corner, the formula panel fades away and a **panel springs up** (the same cream, dotted, chunky style), left of centre, with the question on the **purple strip** (as on Screen 33): **"₹150 is what percent of ₹600?"** Swifty reads it out (its words are on the strip, so no bubble).
- **Three answer buttons slide in, stacked one above the other** under the strip: **A 20%**, **B 25%**, **C 40%** (wide, light blue, a blue letter chip on the left, the answer centred). Swifty points at them and waits.
- **Right (B 25%):** the button turns green with a ✓, a happy chime and a sparkle burst. Swifty: **"Correct! 150 ÷ 600 × 100 = 25%."** As she says the sum, **₹150 in the question turns blue** (the part) and **₹600 green** (the whole), as on Screen 33.
- **Wrong (A or C):** the button turns red with a ✗, shakes and buzzes; every button locks (**no second try**). Swifty: **"Not quite! ₹150 is the part, ₹600 is the whole. 150 ÷ 600 × 100 = 25%."** (four parts: ₹150 turns blue as she names the part, ₹600 green as she names the whole, and at the end of the sum the right answer, **B**, lights up green).
- Both ways end with **"So, ₹150 is 25% of ₹600."** while the right answer and the two amounts pop. 3 seconds later the big button appears **level with the last answer**, between the panel and Swifty. It says **Next** and leads to Screen 35.

#### Screens 35–38 — Back to the sneakers
(Storyboards 14–17. Screen 35 is a question; **whichever answer the player picks**, Screens 36, 37 and 38 follow in order: the working, what the answer means, and the amount to pay. Screen 37 is a question too. Each screen dissolves into the next over the same blurred shop, with Swifty not moving in her corner. Where the storyboards show no dialogue, Swifty's lines below are written for the game.)

### Screen 35 — Back to the Sneakers
- A **panel springs up**, further left than the others so the Next button fits between it and Swifty:
  - on the left, the **sneakers**: the product photo (`ui/sneakers.png`), the white **₹1800** price tag and the red **30% OFF** tag (stamped, then framed in glowing gold), as on Screen 26;
  - on the right, the question on a **pink strip** (as on Screens 28 and 30): **"Now, what is 30% of ₹1800?"**, and under it three answers **stacked**: **A ₹360**, **B ₹540**, **C ₹720**.
- As the sneakers appear, Swifty: **"Now, back to Aniket's sneakers!"** Then her bubble goes and she reads the question out; "30%" on the tag pops as she says it, then the ₹1800 tag.
- **Right (B ₹540):** green ✓, chime, sparkles. **"Correct! 30% of ₹1800 is ₹540."** (the 30% and the ₹1800 tags pop).
- **Wrong (A or C):** red ✗, shake, buzz, every button locks (no second try). **"Not quite! 30% of ₹1800 is ₹540."** and B lights up green.
- Both ways: **"Let's see how to work it out!"** 3 seconds later the **Next** button appears level with the last answer, between the panel and Swifty.

### Screen 36 — Calculate 30% of ₹1800
- The question dissolves into a **worked solution**: a white sheet (on the cream panel) where the working is written line by line, its = signs lined up, each left-hand side sitting right up to its = sign (big writing):
  **30% = 30/100**, then **30% of ₹1800 = 30/100 × 1800**, then **= ₹540**. The fractions are real stacked fractions; **30/100 is pink**, as in the storyboard.
- Each line is written in (a left-to-right wipe with a marker scribble) as Swifty says it, pointing at the sheet:
  1. **"30% means"** → "30% =" is written in. **"30 out of 100."** → the pink fraction 30/100.
  2. **"So, 30% of ₹1800 ="** → "30% of ₹1800 =". **"30/100 × 1800"** (read "30 over 100 times 1800") → the fraction, then "× 1800".
  3. **"1800 ÷ 100 = 18,"** → "× 1800" and the 100 pop. **"and 18 × 30 = 540."** → the 30 pops. **"So, it's ₹540!"** → **₹540** lands like a stamp and is marked on a bright yellow box, with twinkles.
- About 3 seconds later it **dissolves into Screen 37**.

### Screen 37 — What Does ₹540 Represent?
- The sneakers panel springs up again (the same layout as Screen 35) with the question **"What does ₹540 represent here?"** and three answers stacked: **A Marked Price**, **B Selling Price**, **C Discount**. Swifty reads the question out.
- **Right (C Discount):** **"Correct! ₹540 is the money taken off ₹1800."** (the 30% OFF tag pops).
- **Wrong (A or B):** **"Not quite! ₹540 is the money taken off ₹1800."** (the 30% OFF tag pops), and C lights up green. No second try.
- Both ways: **"That's the Discount!"** ("Discount!" in red) while the right answer and the 30% OFF tag pop. 3 seconds later the **Next** button.

### Screen 38 — The Amount to Pay
- A **worked solution** springs up: on the left, **Marked Price (MP) ₹1800** (a cream-yellow box), a blue arrow growing down, and **Discount ₹540** (a light-red box); on the right, the white sheet.
- Swifty's line from the storyboard, in two parts: **"To find how much you have to pay,"** → "SP =" is written in. **"subtract the discount from the marked price."** → "MP", "−", "Discount" appear one after the other (the MP box and the Discount box pop as they appear). This line sits on a **light-blue band**: it's the rule. Colours as since Screen 11: SP blue, MP brown-gold, Discount red; in her bubble "subtract" is red, "discount" red, "marked price" brown-gold.
- **"1800 − 540"** → the next line's "=" pops, **₹1800 lifts out of the MP box and glides into place as 1800**, "−" pops, **₹540 glides out of the Discount box as 540**. **"= ₹1260."** → **₹1260** lands like a stamp.
- **"So, you pay ₹1260 for the sneakers!"** → ₹1260 is marked on the yellow box, with twinkles.
- About 3 seconds later it **dissolves into Screen 39**.

### Screen 39 — Final Answer
(Storyboard 18: "Final answer and summary". The line is Aniket's, in his voice.)
- Background: `he saw a shoe.png` (the same view as Screens 23–38: Aniket at the stand, **pointing at the price tags**). It starts blurred, exactly as Screen 38 left the shop, with Swifty in her corner; the worked solution dissolves away.
- Swifty's part is done: she **waves** (a chirp) and **flies off** to the top right. As she goes, **the blur lifts** and the dim fades: the shop is sharp again, and Aniket is pointing at the tags.
- Aniket's bubble (34 px text), right of his face above the sneakers, the tail at his mouth, typed and spoken **in his voice** in two parts:
  1. **"So, after a 30% discount,"** → the **30% OFF** tag on the stand lights up with its glowing gold frame (a sparkle), then **a red line draws itself across the ₹1800** on the white tag (a marker scribble): the old price is crossed out.
  2. **"I will pay ₹1260."** → a **green ₹1260 tag stamps onto the stand**, under both tags, a little tilted (a thud, a sparkle burst), with twinkles around it and a chime.
  Lines: "So, after a **30%** / discount, I will pay / **₹1260**." ("30%" in red like the OFF tag, "₹1260" in green like the new tag)
- The strike line, the gold frame and the green tag are on the picture, so they move with its slow zoom.
- About 3 seconds later it carries straight on to Screen 40, with no visible cut.

### Screen 40 — Discount Percentage
(Storyboard 19: "Discount percentage formula". Its robot is **Swifty**; her first line is the storyboard's.)
- Carried straight on from Screen 39: the shop, the crossed-out ₹1800, the framed 30% OFF tag, the green ₹1260 tag and Aniket's bubble are first exactly where they were. Then his bubble shrinks away, **the shop blurs and dims again** (the updated tags blur with it), and **Swifty flies back in** to her corner and waves.
- A **worked sheet** springs up (the same style as Screens 36 and 38, big writing), and Swifty points at it:
  1. **"Discount percentage tells us what percent"** → "Discount % =" is written in. **"of the marked price has been reduced."** → the fraction **Discount / Marked Price**, then "× 100". This line, the rule, sits on a **yellow band** (the storyboard's yellow strip). Colours as since Screen 11: "Discount %" and "Discount" red, "Marked Price" brown-gold.
  2. **"The discount is ₹540,"** → the next line's "=" pops and its fraction bar draws itself; **540** pops in on top (red) while "Discount" in the rule pops. **"and the marked price is ₹1800."** → **1800** pops in below (brown-gold) while "Marked Price" pops. Then "× 100".
  3. **"540 ÷ 1800 × 100"** → the last line's "=" pops. **"= 30%."** → **30%** lands like a stamp. **"That's the 30% off on the tag!"** ("30% off" in red) → 30% is marked on a bright yellow box, with twinkles.
- About 3 seconds later the sheet **dissolves into Screen 41** (the blurred shop, its updated tags and Swifty stay exactly the same).

### Screen 41 — Complete Summary
(Storyboard 20: "Complete summary". The storyboard shows no dialogue, so Swifty's lines below are written for the game.)
- Over the same blurred shop (the crossed-out ₹1800, the framed 30% OFF tag and the green ₹1260 tag still on the stand), with Swifty in her corner, a **panel springs up** (the same cream, dotted, chunky style), left of centre:
  - a blue title pill, **"Sneaker Example Summary"** (as on Screen 21's summary);
  - a **table** of the four amounts: **Marked Price (MP) ₹1800**, **Discount % 30%**, **Discount amount ₹540**, **Selling Price (SP) ₹1260**. The label cells use the colours used since Screen 11 (Marked Price cream-yellow with brown-gold words, the two Discount rows light red with red words, Selling Price light blue with blue words); the values sit in white cells;
  - a **pink box of rules**, lined up at their = signs: **Discount = MP − SP**, **SP = MP − Discount**, **Discount % = Discount / MP × 100** (a stacked fraction), in the same colours (Discount red, MP brown-gold, SP blue).
- Swifty waves as the title drops in: **"Let's sum up the sneakers!"**
- The table pops in empty, then **fills row by row as she says it** (each label slides in, then its value pops): **"Marked price: ₹1800."** / **"Discount: 30%,"** / **"which is ₹540."** / **"Selling price: ₹1260."**
- The rules box pops in empty, then **each rule is written in as she reads it** (label, =, then what it equals): **"Discount = MP − SP,"** / **"SP = MP − Discount,"** / **"and Discount % = Discount ÷ MP × 100."** (her bubble shows the rules too, in the same colours; the voice reads "M P", "S P", "equals", "minus", "divided by" and "times").
- Twinkles sparkle around the panel and she waves: **"Now you can work out any discount!"**
- This is the last screen for now, so **Next** becomes **Replay**. The last screen always waits for the player to press Replay; it never starts the story over by itself.

## 4. Movement on every screen
- **Teaching pace:** the whole story runs slowly enough for kids to follow (one `PACE` setting, now 1.5× a brisk pace).
  It stretches every pause, the 3-second holds (now about 4.5 s), letter-by-letter typing (about 70 ms per letter), cross-fades (1.8 s) and panel and card reveals.
  Walking, flying, pops and button feedback keep their natural speed. Slowing the walk further would make the steps jerky.
- A slow zoom ("Ken Burns" effect) on every picture, plus a slight shift when the mouse moves ✨.
- Speech bubbles and thought clouds float gently up and down, all in step with one clock, so a bubble carried over to the next screen never jumps.
- Softly glowing ceiling lamps and dust floating in the light ✨.
- **Fades only between Screens 1 ↔ 2, 3 ↔ 4, 4 ↔ 5, 5 ↔ 6, 8 ↔ 9, 22 ↔ 23, 23 ↔ 24 and 24 ↔ 25**, plus one-way dissolves **11 → 12 → 13** (only the panel's right side changes) and **13 → 14** (the panel fades away into the counter scene) and **17 → 18 → 19 → 20 → 21** (what's on top fades away; the blurred counter stays exactly the same) and **26 → 27** (the card fades into the table; the blurred shop and Swifty stay exactly the same) and **28 → 29** and **30 → 31** (the question and the answers fade away; the table, the blurred shop and Swifty stay exactly the same) and **31 → 32 → 33 → 34 → 35 → 36 → 37 → 38 → 39** (one panel fades into the next; the blurred shop and Swifty stay exactly the same; on 39 the panel fades away and the shop comes back into focus). Going back over those is a cut. Screens 14 → 15 share one picture, so that change doesn't look like a cut at all.
  That's good morning → leaving home, Bookstore → sees the book → holds the book → How Much?, question → closer look at his new book, and into the shoe shop → at the sneakers' stand (with the camera pushing in) → the discount on them → his questions about it (the same view, so only Aniket changes).
  Each is a smooth cross-dissolve where the new picture melts in over the old one.
  Every other change (Start → 1, 2 → 3 where he has just walked out of the picture and then walks into the mall, 6 → 7, Replay, other panel jumps) is a straight cut with a small settle-in zoom.
  Screens 7 → 8, 10 → 11, 25 → 26 and 39 → 40 share one picture, so those changes don't look like a cut at all; Screen 40 dissolves into 41 over the same blurred shop. Screens 9 → 10 share one shot, so the cut only changes Aniket's reaction.

## 5. Controls
- **Top-right corner:** small **◀ Back** and **Next ▶** buttons, with a "2 / 41" counter between them.
  While a screen is about to move on by itself, the Next button fills up like a timer. Clicking it skips ahead ✨.
- **Side screen panel:** a small **Scenes** button (top-left) opens a side panel with a picture of every screen. Click one to jump straight to it.
  Once the list is taller than the panel it scrolls (with a thin scrollbar), and it opens scrolled to the current screen.
  The panel also has an **Auto-play** switch ✨. When it's off, every screen waits for Next.
- Music, sound effects and full screen have **no on-screen buttons**; they are keyboard-only.
- **Keyboard ✨:** ← / → change screen · **P** scenes panel · **F** full screen · **M** music on/off · **S** sound on/off.

## 6. Sounds and voices
All sound effects are made in the browser, so no audio files are needed:
footsteps · pop · speech-bubble "bloop" ✨ · whoosh during cross-fades and when the question card arrives ✨ · start chime ✨ · "ding" for the "!" ✨ · sparkle ✨ · cash register ✨ · right-answer chime and wrong-answer buzz ✨ · Swifty's wing flaps and landing chirp ✨ · card-flip swish ✨ · comic surprise for the ₹1000 shock ✨ · a curious "hmm?" and soft rising "plip"s as a thought cloud's puffs pop up ✨ · button clicks ✨ · soft looping background music ✨ (quieter while he walks and while anyone speaks).

**Voices (Indian English):** every speech bubble is spoken as it types out. Prices are read naturally, so "₹800" is said "800 rupees"; "MP", "SP" and "CP" are spelled out, "=", "−", "÷" and "×" are said "equals", "minus", "divided by" and "times", and a fraction like "30/100" is said "30 over 100".
- **Aniket:** a young male voice. **Shopkeeper:** a deeper male voice. **Swifty:** a female voice, or a raised-pitch voice if the device has no female Indian voice.
- **There is no voice without a speaker on screen.** Swifty says every teaching line, and each one comes in her speech bubble. The only lines without a bubble are where she reads a card aloud while its words show on it: the Cost Price and Selling Price definitions, the "Correct!" card, and the Marked Price and Discount definitions.
- **Default:** the Indian-English text-to-speech voices already on the player's device. That's Rishi on a Mac, Heera/Ravi or Neerja/Prabhat on Windows, and the Indian English voices on Android or Chromebook. If there are none, a Hindi voice is used, then any English voice.
- **Studio-quality option:** recorded AI-voice files can replace any line. Put the MP3s in `game assets/voice/` and list them in `RECORDINGS` in `js/voice.js`.
  Line ids: `wake`, `browse`, `ask`, `price`, `hint`, `def0-title`, `def0-text`, `def1-title`, `def1-text`, `here`, `correct`, `shock`, `mp-line`, `mp-term`, `mp-def`, `cmp-mp`, `cmp-sp`, `cmp-why`, `reveal-1`, `reveal-2`, `reveal-3`, `disc-1`, `disc-2`, `dwhy-1`, `dwhy-2`, `ddef`, `f-mp`, `f-sp`, `f-d`, `rule-1`, `rule-2`, `rule-3`, `fr-1` … `fr-10`, `fr-use`, `ap-0` … `ap-6`, `sum-0` … `sum-4`, `sneakers`, `shoe-think`, `shoe-ask`, `recall-1`, `recall-2`, `hundred-1`, `hundred-2`, `half-ask`, `half-right-1`, `half-right-2`, `half-wrong-1` … `half-wrong-3`, `half-so`, `halved-1`, `halved-2`, `quarter-ask`, `quarter-right-1`, `quarter-right-2`, `quarter-wrong-1` … `quarter-wrong-3`, `quarter-so`, `quartered-1`, `quartered-2`, `idea-1`, `idea-2`, `wp-ask`, `wp-part`, `wp-whole`, `wp-rule-1` … `wp-rule-3`, `wp-put-1`, `wp-put-2`, `wp-work`, `wp-equals`, `wp-so`, `cfu-ask`, `cfu-right-1`, `cfu-right-2`, `cfu-wrong-1` … `cfu-wrong-4`, `cfu-so`, `mq-back`, `mq-ask`, `mq-right-1`, `mq-right-2`, `mq-wrong-1`, `mq-wrong-2`, `mq-so`, `th-1` … `th-7`, `rp-ask`, `rp-right-1`, `rp-right-2`, `rp-wrong-1`, `rp-wrong-2`, `rp-so`, `pay-1` … `pay-5`, `final-1`, `final-2`, `dp-1` … `dp-7`, `ss-0` … `ss-4`, `ss-rule-1` … `ss-rule-3`, `ss-end`.
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
- Screen 21: Swifty recaps the three terms one card at a time (arrows drawing between them), then "Discount = MP − SP", and the story moves on.
- Screen 22: in the shoe shop the sneakers glow and sparkle, and Aniket says "These sneakers look good!"; then a push-in fade to Screen 23.
- Screen 23: Aniket points at the ₹1800 price tag, with no words; then a fade where only Aniket changes.
- Screen 24: only the 30% OFF tag is highlighted, with a glowing gold frame hugging it; no words; then a fade where only Aniket changes.
- Screen 25: the tag stays lit; "What does 30% discount mean here?" in a thought cloud, then "How much money will actually be reduced?" in a speech bubble, never both at once.
- Screen 26 picks up from 25 with no jump. The shop blurs, the sneakers card builds (photo, ₹1800, 30% OFF stamped and framed in gold), Swifty flies in to her corner, points at it and says "To find the discount amount, let's first recall how percentages work." in two parts.
- Screen 27: the card dissolves into the Percentage | Amount table with Swifty not moving; ₹500 and 100% pop into it as she says "Suppose ₹500 represents 100%.", then the row flashes gold.
- Screen 28 picks up from 27 with no jump; the table grows two rows, the question and the ÷ 2 steps appear, and the three answers wait for a pick. Right or wrong, Swifty explains, the ? becomes ₹250 and the row flashes; no second try; then the Next button, beside the answers.
- Screen 29: the question and answers dissolve away around the unmoving table and Swifty; "We halved 100%, so we also halved ₹500." in two parts with each ÷ 2 step popping, ₹250 marked on a yellow box, then the green "✓ 50% of ₹500 = ₹250" bar.
- Screen 30 picks up from 29 with no jump; the table makes room (50% | ₹250 turns plain, the first ÷ 2 folds away, ÷ 2 and 25% | ? open, the table eases to 90%), then the question and its answers as on Screen 28 (right: ₹125).
- Screen 31: the question and answers dissolve away around the unmoving table (90%) and Swifty; "The same operation is applied to both sides." in two parts (both ÷ 2 steps pop, then both column names), ₹125 marked on a yellow box, then the green "✓ 25% of ₹500 = ₹125" bar.
- Screen 32: the table dissolves into the pairs panel (Swifty not moving), Part ↔ Percentage then Whole ↔ 100% build with their arrows drawing, and "Percentage tells us how much of the whole we are considering." makes each pair pop as she mentions it.
- Screen 33: the pairs dissolve into the "₹125 is what percent of ₹500?" panel (Swifty not moving); the part and the whole are named and coloured, the formula is written line by line in time with her words, ₹125 and ₹500 glide out of their boxes into the fraction, and 25% lands and is marked as the answer.
- Screen 34: the formula dissolves into the quick check (Swifty not moving); "₹150 is what percent of ₹600?" with A 20%, B 25%, C 40% stacked; right or wrong, Swifty explains with the part and the whole coloured in the question, B is the answer, no second try; then the Next button level with the last answer.
- Screens 35–38 follow in order whatever the player answers on 35: the sneakers' question "Now, what is 30% of ₹1800?" (B ₹540); the working 30% = 30/100, 30% of ₹1800 = 30/100 × 1800 = ₹540, written line by line as Swifty says it; the question "What does ₹540 represent here?" (C Discount); and the amount to pay, SP = MP − Discount = 1800 − 540 = ₹1260, with ₹1800 and ₹540 gliding out of their boxes into the sum. Each dissolves into the next with Swifty not moving.
- Screen 39: Swifty waves and flies off, the blur lifts, and as Aniket says "So, after a 30% discount, I will pay ₹1260." the 30% OFF tag lights up, the ₹1800 is crossed out in red, and a green ₹1260 tag stamps onto the stand.
- Screen 40 picks up from 39 with no jump: his bubble goes, the shop blurs, Swifty flies back in, and the sheet writes Discount % = Discount / Marked Price × 100 on a yellow band as she explains it, then = 540 / 1800 × 100 (each number popping in under its word), then = 30%, "the 30% off on the tag".
- Screen 41: the sheet dissolves into the "Sneaker Example Summary" (Swifty and the shop's updated tags not moving); the table fills row by row (₹1800, 30%, ₹540, ₹1260) and the three rules are written in, each as she says it; then Replay, which waits for the player.
- Prices are read naturally: "₹800" as "800 rupees", "a ₹200 discount" as "a 200 rupee discount".
- Every bubble is spoken in an Indian-English voice, and no line is heard without its speaker on screen.
- Back/Next, panel jumps, and Auto-play all work, and revisiting a screen restarts its animation.
