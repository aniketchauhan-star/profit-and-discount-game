# Animation video prompts: the story pictures, talking and moving

These prompts turn the game's still pictures into short videos, made on Higgsfield with **Seedance 2.5, image to video**. Every clip below has a file name to save it as, and every talking clip has the exact words its person says.

There are 55 clips in three kinds:
- **Talking clips (33):** one for each line a person says. The lips move with that line's words, then the person stops and smiles. The game plays the recorded voice with the clip.
- **Quiet loops (12):** blinking, breathing, a sip of tea. They play between the lines.
- **Movements (10):** one picture turns into the next, for example Aniket picking up the book. They replace the fades.

Screen numbers are the brief's (as in `PROMPT.md`).

## In the game now

**11 clips play in the game** (Screens 1, 4 → 5, 5, 6, 7 and 8): `s01-idle`, `s01-aniket-1`, `s01-father`, `s01-aniket-2`, `s04-to-s05`, `s05-idle`, `s05-aniket`, `s06-idle`, `s06-aniket`, `s06-shopkeeper` and `s07-idle`. Screen 8 uses `s07-idle` too (the same picture). Until Screen 14 has its own clips, the shopkeeper there also talks with `s06-shopkeeper`.

From your first batch:
- **`s06-shopkeeper`:** your take named `s06-shopkeeper` ends with his hand down, so it would jump back up when the clip ends. Your unnamed take `hf_…064244` ends with the hand back where it started, so that one is in the game.
- **To make again: `s06-to-s07`.** It starts on Screen 7's picture, so the book is never handed over. Its start frame must be `aniket give a book to shopkepper.png` and its end frame `aniket give money to shopkeeper.png`.
- **Not used:**
  - `hf_…062459` starts on Screen 10 and zooms into the book, so it can't end on the picture. If it was `s10-aniket`, make it again with the same picture as the end frame. If it was `s09-to-s10`, its start frame is `boy see the book .png`.
  - `hf_…063148` is the shopkeeper talking, but his hand ends down.

**Adding clips:** save them anywhere (your `videos ` folder is fine) with the clip's name in the file name, for example `s09-to-s10.mp4`, and tell me. I'll check each one, convert it (H.264, no sound, about 1 MB) into `game assets/video/`, and the game plays it. A clip that isn't made yet leaves the still picture, as before.

## How to make a clip on Higgsfield

1. Open Seedance 2.5 (image to video) on Higgsfield.
2. **Start frame:** upload the picture named with the clip. The pictures are in the game folder, `game assets`: `/Users/AniketChauhan/Desktop/profit and discount game/game assets/`.
3. **End frame:** upload the picture named as the end frame. For talking clips and quiet loops, that's the same picture again.
4. Paste the clip's prompt.
5. Set the **length** given with the clip, **1080p**, 16:9, and **sound off**. The game plays its own recorded voices; if sound can't be turned off, that's fine, the game mutes the clip.
6. Generate. Make 2 or 3 takes and keep the cleanest.
7. Download it, rename it to the clip's file name (for example `s01-aniket-1.mp4`), and save it in **`game assets/video/`**: `/Users/AniketChauhan/Desktop/profit and discount game/game assets/video/`.

**Before you keep a clip, check:**
- The first frame is the picture, and the last frame is the end-frame picture.
- The faces look the same all through.
- Hands have five fingers.
- Prices and signs (₹1000, ₹1800, 30% OFF, ₹500 notes) are still sharp and the same.
- Nothing pops in or out.

The game draws its speech bubbles, gold rings and price tags on fixed spots of each picture, so people and objects must end where they are in the picture.

If there's a field for a **negative prompt**, paste this:

```text
camera movement, zoom, pan, shake, cut, morphing, melting, warping, flicker, face changing, different face, different hair, different clothes, colour change, extra fingers, extra hands, extra arms, deformed hands, blurry text, changed text, new text, wrong numbers, subtitles, captions, speech bubbles, logo, watermark, new people, new objects, objects appearing or disappearing, 3D render, photorealistic, style change
```

**Start with three, as a test:** `s04-to-s05`, `s01-aniket-1` and `s01-father`. Put them in `game assets/video/` and tell me. I'll put them in the game so you can see them, then make the rest.

## All the clips

| File | Screen | Start frame | End frame | Length | What happens |
|---|---|---|---|---|---|
| s01-idle | 1 | starting boy talking with father.png | same | 5 s | both listen; Dad sips his tea |
| s01-aniket-1 | 1 | starting boy talking with father.png | same | 6 s | Aniket: "Dad, I want to buy a book and a new pair of sneakers from the mall." |
| s01-father | 1 | starting boy talking with father.png | same | 5 s | Dad: "Sure. But compare the prices and buy wisely." |
| s01-aniket-2 | 1 | starting boy talking with father.png | same | 4 s | Aniket: "I will!" |
| s04-to-s05 | 4 → 5 | aniket saw a book.png | aniket hold the book scene.png | 5 s | Aniket picks up the book |
| s05-idle | 5 | aniket hold the book scene.png | same | 5 s | Aniket looks at the book |
| s05-aniket | 5 | aniket hold the book scene.png | same | 4 s | Aniket: "This book looks interesting!" |
| s06-idle | 6, 14 | aniket give a book to shopkepper.png | same | 5 s | both wait |
| s06-aniket | 6 | aniket give a book to shopkepper.png | same | 4 s | Aniket: "How much is this book?" |
| s06-shopkeeper | 6 | aniket give a book to shopkepper.png | same | 4 s | Shopkeeper: "It's ₹800!" |
| s06-to-s07 | 6 → 7 | aniket give a book to shopkepper.png | aniket give money to shopkeeper.png | 5 s | the book handed over, then the notes |
| s07-idle | 7, 8 | aniket give money to shopkeeper.png | same | 5 s | both wait (the notes don't move) |
| s09-to-s10 | 9 → 10 | boy see the book .png | shocked aniket.png | 4 s | Aniket tilts the book, sees ₹1000, shock |
| s10-aniket | 10 | shocked aniket.png | same | 5 s | Aniket: "₹1000? What is this?" |
| s14-shopkeeper-1 | 14 | aniket give a book to shopkepper.png | same | 5 s | Shopkeeper: "The price printed on the book is ₹1000," |
| s14-shopkeeper-2 | 14 | aniket give a book to shopkepper.png | same | 4 s | Shopkeeper: "but you paid only ₹800." |
| s14-shopkeeper-3 | 14 | aniket give a book to shopkepper.png | same | 4 s | Shopkeeper: "So, you got a ₹200 discount." |
| s14-to-s15 | 14 → 15 | aniket give a book to shopkepper.png | what is discount.png | 4 s | Aniket's face turns puzzled |
| s15-idle | 15 | what is discount.png | same | 5 s | Aniket thinks (mouth closed) |
| s22-aniket-1 | 22 | shoes shop enter.png | same | 4 s | Aniket: "These sneakers look good!" |
| s22-aniket-2 | 22 | shoes shop enter.png | same | 4 s | Aniket: "What does 30% OFF mean here?" |
| s22-aniket-3 | 22 | shoes shop enter.png | same | 4 s | Aniket: "Is this also a discount?" |
| s22-to-s23 | 22 → 23 | shoes shop enter.png | he saw a shoe.png | 4 s | Aniket walks up and points |
| s23-idle | 23 | he saw a shoe.png | same | 5 s | Aniket points (no words) |
| s23-to-s24 | 23 → 24 | he saw a shoe.png | hee see discount on shoes.png | 4 s | his hand goes from pointing to his chin |
| s24-idle | 24 | hee see discount on shoes.png | same | 5 s | Aniket thinks, hand on chin |
| s24-to-s25 | 24 → 25 | hee see discount on shoes.png | he is tinking to see the shoes.png | 4 s | Aniket becomes confused |
| s25-aniket-1 | 25 | he is tinking to see the shoes.png | same | 4 s | Aniket: "The tag says ₹1800." |
| s25-aniket-2 | 25 | he is tinking to see the shoes.png | same | 6 s | Aniket: "With 30% off, how much do I actually pay?" |
| s35-aniket | 35 | he saw a shoe.png | same | 8 s | Aniket: "So, after a 30% discount, I will pay ₹1260." |
| s36-box | 36 | shopkeeper gives sneakers box.png | (none) | 5 s | the shopkeeper hands over the box |
| s40-idle | 40 | boy return home .png | same | 5 s | both smile, back home |
| s40-father-1 | 40 | boy return home .png | same | 4 s | Dad: "How was your shopping?" |
| s40-aniket | 40 | boy return home .png | same | 7 s | Aniket: "Great! I learnt about marked price, discount and discount percentage." |
| s40-father-2 | 40 | boy return home .png | same | 5 s | Dad: "That's useful, because you have another shopping job." |
| s41-idle | 41 | boy and his father talking.png | same | 5 s | both at the table |
| s41-father-1 | 41 | boy and his father talking.png | same | 4 s | Dad: "Your new school session starts in a few days." |
| s41-father-2 | 41 | boy and his father talking.png | same | 4 s | Dad: "You still need some things for school." |
| s42-to-s43 | 42 → 43 | father gave him list.png | father gave him money.png | 5 s | the list handed over, then the notes held out |
| s43-father | 43 | father gave him money.png | same | 4 s | Dad: "Here's ₹5,000." |
| s43-to-s44 | 43 → 44 | father gave him money.png | boy take money in his pocket.png | 4 s | Aniket pockets the money |
| s45-idle | 45 | boy stand and talk .png | same | 5 s | both listen |
| s45-father-1 | 45 | boy stand and talk .png | same | 5 s | Dad: "Use what you have learnt and find the best deals." |
| s45-father-2 | 45 | boy stand and talk .png | same | 5 s | Dad: "Whatever is left after buying everything is yours." |
| s45-aniket-1 | 45 | boy stand and talk .png | same | 4 s | Aniket: "Really?" |
| s45-aniket-2 | 45 | boy stand and talk .png | same | 4 s | Aniket: "Then I'm definitely finding the best offers!" |
| s46-idle | 46 | game begins.png | same | 5 s | Aniket breathes, gives a small wave |
| s56-idle | 56 | return home shopping list .png | same | 5 s | both smile |
| s56-father-1 | 56 | return home shopping list .png | same | 4 s | Dad: "Did you get everything?" |
| s56-aniket-1 | 56 | return home shopping list .png | same | 4 s | Aniket: "Yes!" |
| s56-father-2 | 56 | return home shopping list .png | same | 4 s | Dad: "How much did you spend?" |
| s56-aniket-2 | 56 | return home shopping list .png | same | 4 s | Aniket: "₹4,340." |
| s56-father-3 | 56 | return home shopping list .png | same | 4 s | Dad: "So you still have ₹660 left!" |
| s56-aniket-3 | 56 | return home shopping list .png | same | 4 s | Aniket: "And I got the best deal for every item!" |
| s56-father-4 | 56 | return home shopping list .png | same | 5 s | Dad: "Well done! You really did shop wisely." |

No clips are needed for:
- Screen 2: it stays still, as the brief says.
- Screens 3, 20 and 21: the game already moves Aniket and the doors there.
- Swifty's lines: she is drawn and moved by the game itself.

## The prompts

### Screen 1: Talking to Dad

#### s01-idle.mp4
Save as `game assets/video/s01-idle.mp4` · start frame `starting boy talking with father.png` · end frame: the same picture · 5 s · sound off
```text
A boy on the left (green T-shirt, navy backpack, both hands on his backpack straps) and his father sitting on the sofa on the right (light-blue polo shirt, moustache, holding a white tea cup) smile at each other. Both breathe gently and blink once or twice. Halfway through, the father lifts his tea cup to his lips, takes a small sip, and lowers it back to exactly where it was. Nobody talks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

#### s01-aniket-1.mp4
Save as `game assets/video/s01-aniket-1.mp4` · start frame `starting boy talking with father.png` · end frame: the same picture · 6 s · sound off
```text
The boy on the left (green T-shirt, navy backpack, hands on his straps) says to his father, excited and happy: "Dad, I want to buy a book and a new pair of sneakers from the mall." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise a little and his head nods gently; his hands stay on his straps, moving only slightly. He finishes speaking by about 5 seconds, then smiles with his mouth closed. The father on the sofa on the right listens with a smile, holding his tea cup still, and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

#### s01-father.mp4
Save as `game assets/video/s01-father.mp4` · start frame `starting boy talking with father.png` · end frame: the same picture · 5 s · sound off
```text
The father on the sofa on the right (light-blue polo shirt, moustache, a white tea cup in his hand) lowers his cup a little and says to his son, warm and calm: "Sure. But compare the prices and buy wisely." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his head nods gently on "buy wisely". He finishes speaking by about 4 seconds, smiles with his mouth closed, and brings the cup back to exactly where it was. The boy on the left listens with a smile and blinks, his hands on his straps. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

#### s01-aniket-2.mp4
Save as `game assets/video/s01-aniket-2.mp4` · start frame `starting boy talking with father.png` · end frame: the same picture · 4 s · sound off
```text
The boy on the left (green T-shirt, navy backpack, hands on his straps) answers his father with a big, confident smile: "I will!" His lips move in time with these two words in the very first second, with a firm little nod; then he smiles with his mouth closed until the end. The father on the sofa on the right smiles back, holding his tea cup still, and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

### Screens 4–5: the book

#### s04-to-s05.mp4
Save as `game assets/video/s04-to-s05.mp4` · start frame `aniket saw a book.png` · end frame `aniket hold the book scene.png` · 5 s · sound off
```text
In a bookshop, a boy (green T-shirt, navy backpack) stands with his hand on his chin, looking at the books on the display table. He reaches out, picks up the blue book "A Brighter Tomorrow" from the left end of the display, lifts it, and holds it in both hands in front of him, looking at it with interest. The other three books on the display stay exactly where they are. One smooth, natural movement, ending exactly on the last frame. Nobody talks. Camera still, moving only as little as needed to match the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same. The shop, the shelves, the signs and their words stay still and sharp. No added text, captions or speech bubbles.
```

#### s05-idle.mp4
Save as `game assets/video/s05-idle.mp4` · start frame `aniket hold the book scene.png` · end frame: the same picture · 5 s · sound off
```text
A boy (green T-shirt, navy backpack) holds the blue book "A Brighter Tomorrow" in both hands and looks at it with a smile. He breathes gently and blinks once or twice. Nobody talks. The book stays in the same place in his hands. The books on the display table and the shopkeeper at the counter in the background stay still. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s05-aniket.mp4
Save as `game assets/video/s05-aniket.mp4` · start frame `aniket hold the book scene.png` · end frame: the same picture · 4 s · sound off
```text
A boy (green T-shirt, navy backpack) holds the blue book "A Brighter Tomorrow" in both hands, looks at it and says to himself, pleased: "This book looks interesting!" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows lift with interest and his head tilts a little towards the book. He finishes speaking by about 3 seconds, then keeps smiling at the book with his mouth closed. The book stays in the same place in his hands, and the books on the display table stay exactly where they are. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### Screens 6–8: at the counter

#### s06-idle.mp4
Save as `game assets/video/s06-idle.mp4` · start frame `aniket give a book to shopkepper.png` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, a boy on the left (green T-shirt, navy backpack) holds out the blue book "A Brighter Tomorrow"; the shopkeeper on the right (glasses, light-blue shirt, navy apron) smiles with his open hand held out. Both breathe gently and blink once or twice. Nobody talks. The book and the shopkeeper's hand stay where they are. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s06-aniket.mp4
Save as `game assets/video/s06-aniket.mp4` · start frame `aniket give a book to shopkepper.png` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack) holds out the blue book and asks the shopkeeper: "How much is this book?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise, and he lifts the book very slightly towards the shopkeeper and back. He finishes speaking by about 2 seconds, then waits with a smile, his mouth closed. The shopkeeper on the right (glasses, light-blue shirt, navy apron) listens with a friendly smile and blinks; his open hand stays where it is. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s06-shopkeeper.mp4
Save as `game assets/video/s06-shopkeeper.mp4` · start frame `aniket give a book to shopkepper.png` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) answers the boy cheerfully: "It's eight hundred rupees!" His lips move in time with these words from the very first second, with natural mouth shapes; his head nods once, and his open hand makes a small, friendly gesture and returns to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s06-to-s07.mp4
Save as `game assets/video/s06-to-s07.mp4` · start frame `aniket give a book to shopkepper.png` · end frame `aniket give money to shopkeeper.png` · 5 s · sound off
```text
At a bookshop counter, the boy (green T-shirt, navy backpack) hands the blue book "A Brighter Tomorrow" to the smiling shopkeeper (glasses, navy apron), who takes it. Then the boy takes out a few banknotes and holds them out to the shopkeeper. Both smile. Nobody talks. One smooth, natural sequence, ending exactly on the last frame. Camera still, moving only as little as needed to match the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The shelves, the signs and their words stay still and sharp. No added text, captions or speech bubbles.
```

#### s07-idle.mp4
Save as `game assets/video/s07-idle.mp4` · start frame `aniket give money to shopkeeper.png` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, a boy on the left (green T-shirt, navy backpack) hands a few banknotes to the smiling shopkeeper on the right (glasses, navy apron), who holds the blue book. Both breathe gently and blink once or twice. Nobody talks. The banknotes and the book stay exactly where they are: do not move them. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### Screens 9–10: the ₹1000 shock

#### s09-to-s10.mp4
Save as `game assets/video/s09-to-s10.mp4` · start frame `boy see the book .png` · end frame `shocked aniket.png` · 4 s · sound off
```text
Seen from just behind a boy's shoulder (navy backpack, green T-shirt), he holds the blue book and tilts it towards himself. His eyes find the white "₹1000" price sticker on the book, and he jolts back in shock, mouth open. The shopkeeper with glasses, blurred in the background, smiles. Nobody talks. The camera moves in slightly towards the book, ending exactly on the last frame. The "₹1000" sticker and its barcode stay sharp and readable all the time, and end exactly where they are in the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). The boy's hair, clothes and colours stay exactly the same. No added text, captions or speech bubbles.
```

#### s10-aniket.mp4
Save as `game assets/video/s10-aniket.mp4` · start frame `shocked aniket.png` · end frame: the same picture · 5 s · sound off
```text
Seen from just behind a boy's shoulder (navy backpack, green T-shirt), he holds the blue book close, shocked by its white "₹1000" price sticker, and exclaims: "One thousand rupees? What is this?" His open mouth moves in time with these words from the very first second, and his head jerks back slightly in surprise. He finishes speaking by about 4 seconds and stays shocked, his mouth slightly open as in the picture. The book and its "₹1000" sticker stay exactly in place, sharp and readable. The shopkeeper in the blurred background smiles and stays still. Start and end on exactly this picture. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screens 14–15: the discount

#### s14-shopkeeper-1.mp4
Save as `game assets/video/s14-shopkeeper-1.mp4` · start frame `aniket give a book to shopkepper.png` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) explains to the boy, friendly and calm: "The price printed on the book is one thousand rupees," His lips move in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes a small explaining gesture and returns to exactly where it was. He finishes speaking by about 4 seconds, then pauses with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s14-shopkeeper-2.mp4
Save as `game assets/video/s14-shopkeeper-2.mp4` · start frame `aniket give a book to shopkepper.png` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) goes on explaining to the boy, friendly and calm: "but you paid only eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his open hand moves gently down and back up to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s14-shopkeeper-3.mp4
Save as `game assets/video/s14-shopkeeper-3.mp4` · start frame `aniket give a book to shopkepper.png` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) finishes with a big, friendly smile: "So, you got a two hundred rupee discount." His lips move in time with these words from the very first second, with natural mouth shapes; he nods once, and his open hand makes a small, pleased gesture and returns to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s14-to-s15.mp4
Save as `game assets/video/s14-to-s15.mp4` · start frame `aniket give a book to shopkepper.png` · end frame `what is discount.png` · 4 s · sound off
```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, has just heard a word he doesn't know: his smile fades, his eyebrows go up and draw together, his eyes look up, and his face turns puzzled. Only his face changes. Nobody talks. The shopkeeper on the right, still smiling with his open hand out, stays as he is. Ends exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

#### s15-idle.mp4
Save as `game assets/video/s15-idle.mp4` · start frame `what is discount.png` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, looks puzzled and thinks to himself "Discount? What does that mean?" without saying it: his eyes glance up and to the side, his eyebrows knit and lift, his head tilts slightly, and he blinks. His mouth stays closed the whole time: he is only thinking. The shopkeeper on the right keeps smiling with his open hand still, and blinks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### Screens 22–25 and 35: the sneakers

#### s22-aniket-1.mp4
Save as `game assets/video/s22-aniket-1.mp4` · start frame `shoes shop enter.png` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack, hands on his straps) has stopped mid-step and looks at the blue sneakers on the display stand. He says happily: "These sneakers look good!" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise and his head nods slightly. He finishes speaking by about 3 seconds, then smiles with his mouth closed. His body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s22-aniket-2.mp4
Save as `game assets/video/s22-aniket-2.mp4` · start frame `shoes shop enter.png` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack, hands on his straps), stopped mid-step, notices the red "30% OFF" label on the display stand and asks, curious: "What does thirty percent off mean here?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise and draw together a little. He finishes speaking by about 3 seconds, then looks at the label with his mouth closed. His body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s22-aniket-3.mp4
Save as `game assets/video/s22-aniket-3.mp4` · start frame `shoes shop enter.png` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack, hands on his straps), stopped mid-step, wonders aloud: "Is this also a discount?" His lips move in time with these words from the very first second, with natural mouth shapes; his head tilts slightly as he thinks. He finishes speaking by about 3 seconds, then keeps looking at the sneakers with his mouth closed. His body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s22-to-s23.mp4
Save as `game assets/video/s22-to-s23.mp4` · start frame `shoes shop enter.png` · end frame `he saw a shoe.png` · 4 s · sound off
```text
In a shoe shop, the boy (green T-shirt, navy backpack) walks the last few steps up to the display stand with the blue sneakers, stops, and points at the sneakers and their price tag with one arm, smiling. Nobody talks. The camera moves slowly in towards the stand, ending exactly on the last frame. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay sharp and readable the whole time. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same. The shelves and posters stay still. No added text, captions or speech bubbles.
```

#### s23-idle.mp4
Save as `game assets/video/s23-idle.mp4` · start frame `he saw a shoe.png` · end frame: the same picture · 5 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers with one arm stretched out, smiling. He breathes gently and blinks once or twice; his pointing hand stays where it is. Nobody talks. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s23-to-s24.mp4
Save as `game assets/video/s23-to-s24.mp4` · start frame `he saw a shoe.png` · end frame `hee see discount on shoes.png` · 4 s · sound off
```text
In a shoe shop, the boy (green T-shirt, navy backpack) lowers his pointing arm and brings that hand up to his chin, thinking, as his eyes move down to the red "30% OFF" label on the stand. Nobody talks. One smooth, natural movement, ending exactly on the last frame. Camera locked: no zoom, pan or shake. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

#### s24-idle.mp4
Save as `game assets/video/s24-idle.mp4` · start frame `hee see discount on shoes.png` · end frame: the same picture · 5 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks thoughtfully at the red "30% OFF" label on the display stand. He breathes gently, blinks, and taps his chin once lightly with one finger. Nobody talks. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s24-to-s25.mp4
Save as `game assets/video/s24-to-s25.mp4` · start frame `hee see discount on shoes.png` · end frame `he is tinking to see the shoes.png` · 4 s · sound off
```text
In a shoe shop, the boy (green T-shirt, navy backpack), his hand on his chin, turns his head a little towards us and frowns, confused about the price; he blinks. Nobody talks. The camera moves very slightly in towards the stand, ending exactly on the last frame. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay sharp and readable the whole time. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same. Everything else stays still. No added text, captions or speech bubbles.
```

#### s25-aniket-1.mp4
Save as `game assets/video/s25-aniket-1.mp4` · start frame `he is tinking to see the shoes.png` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks at the sneakers' white price tag and says, thinking aloud: "The tag says one thousand eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows lift a little. He finishes speaking by about 3.5 seconds, then keeps thinking with his mouth closed. His hand stays on his chin. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s25-aniket-2.mp4
Save as `game assets/video/s25-aniket-2.mp4` · start frame `he is tinking to see the shoes.png` · end frame: the same picture · 6 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks confused and asks himself: "With thirty percent off, how much do I actually pay?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows knit and lift, and his head tilts slightly. He finishes speaking by about 5 seconds, then keeps thinking with his mouth closed. His hand stays on his chin. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s35-aniket.mp4
Save as `game assets/video/s35-aniket.mp4` · start frame `he saw a shoe.png` · end frame: the same picture · 8 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers and their tags, and says happily and clearly, in two parts with a short pause between them: "So, after a thirty percent discount, ... I will pay one thousand two hundred and sixty rupees." His lips move in time with these words from the very first second, with natural mouth shapes, and he gives a small, pleased nod at the end. He finishes speaking by about 7 seconds, then smiles with his mouth closed. His pointing arm stays still. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 36: the sneakers in their box

#### s36-box.mp4
Save as `game assets/video/s36-box.mp4` · start frame `shopkeeper gives sneakers box.png` · no end frame (it ends on a new pose) · 5 s · sound off
```text
At a shoe shop counter, the shopkeeper (teal polo shirt, short beard) and a boy (green T-shirt, navy backpack) both hold an open orange-and-white box with new blue sneakers inside. The shopkeeper smiles, lets go of the box with a small nod, and the boy draws it a little towards himself with both hands, beaming, and looks down at the sneakers. Nobody talks. Small, calm movements; the box moves only a little. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The sneakers in the box stay the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 40: back home

#### s40-idle.mp4
Save as `game assets/video/s40-idle.mp4` · start frame `boy return home .png` · end frame: the same picture · 5 s · sound off
```text
At home, a boy on the left (green T-shirt, navy backpack, a blue book held against his chest, a blue-and-white shopping bag in his other hand) has just come in; his father sits at the dining table on the right (light-blue shirt, moustache, a white tea cup and a newspaper). Both smile, breathe gently and blink once or twice. The shopping bag sways very slightly. Nobody talks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s40-father-1.mp4
Save as `game assets/video/s40-father-1.mp4` · start frame `boy return home .png` · end frame: the same picture · 4 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup and a newspaper) looks up at his son and asks warmly: "How was your shopping?" His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his eyebrows lift, and he lowers his tea cup a little and brings it back to exactly where it was. He finishes speaking by about 2 seconds, then smiles with his mouth closed. The boy on the left listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s40-aniket.mp4
Save as `game assets/video/s40-aniket.mp4` · start frame `boy return home .png` · end frame: the same picture · 7 s · sound off
```text
At home, the boy on the left (green T-shirt, navy backpack, a blue book held against his chest, a blue-and-white shopping bag in his other hand) answers his father happily: "Great! I learnt about marked price, discount and discount percentage." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise, his head nods, and he lifts the shopping bag a little to show it, then lowers it back to where it was. He finishes speaking by about 6 seconds, then smiles with his mouth closed. The father on the right listens with a smile and blinks, holding his cup and newspaper still. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s40-father-2.mp4
Save as `game assets/video/s40-father-2.mp4` · start frame `boy return home .png` · end frame: the same picture · 5 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache) replies to his son with a knowing smile: "That's useful, because you have another shopping job." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his eyebrows lift playfully and his head nods once. He finishes speaking by about 4 seconds, then smiles with his mouth closed, holding his cup and newspaper still. The boy on the left listens, curious, and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### Screen 41: school starts soon

#### s41-idle.mp4
Save as `game assets/video/s41-idle.mp4` · start frame `boy and his father talking.png` · end frame: the same picture · 5 s · sound off
```text
A boy (green T-shirt) and his father (light-blue shirt, moustache) sit facing each other at a wooden dining table. Both breathe gently and blink once or twice. Nobody talks. The father's raised hand stays where it is; the boy's hands rest on the table. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s41-father-1.mp4
Save as `game assets/video/s41-father-1.mp4` · start frame `boy and his father talking.png` · end frame: the same picture · 4 s · sound off
```text
At a wooden dining table, the father on the right (light-blue shirt, moustache) tells his son, calm and caring: "Your new school session starts in a few days." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his head nods, and his raised open hand makes a small explaining gesture and returns to exactly where it was; his other hand stays on the table. He finishes speaking by about 3.5 seconds, then smiles with his mouth closed. The boy on the left listens, nods once and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s41-father-2.mp4
Save as `game assets/video/s41-father-2.mp4` · start frame `boy and his father talking.png` · end frame: the same picture · 4 s · sound off
```text
At a wooden dining table, the father on the right (light-blue shirt, moustache) adds, calm and caring: "You still need some things for school." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his raised open hand makes a small gesture and returns to exactly where it was; his other hand stays on the table. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screens 42–44: the list, the money, the pocket

#### s42-to-s43.mp4
Save as `game assets/video/s42-to-s43.mp4` · start frame `father gave him list.png` · end frame `father gave him money.png` · 5 s · sound off
```text
At home by the dining table, the father (light-blue shirt, moustache) hands a shopping list to his son (green T-shirt, navy backpack). The boy takes it, glances at it happily and puts it away. Then the father picks up a fan of ₹500 notes and holds it out to him, and the boy reaches out an open hand. Nobody talks. One smooth, natural sequence, ending exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The ₹500 notes look like the ones in the last frame. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

#### s43-father.mp4
Save as `game assets/video/s43-father.mp4` · start frame `father gave him money.png` · end frame: the same picture · 4 s · sound off
```text
At home by the dining table, the father on the left (light-blue shirt, moustache) holds out a fan of ₹500 notes to his son and says with a warm smile: "Here's five thousand rupees." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his eyebrows lift. He finishes speaking by about 2.5 seconds, then smiles with his mouth closed. The notes stay exactly in place in his hand: do not move or change them. The boy on the right looks at the notes with wide, happy eyes and blinks; his open hand stays still. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s43-to-s44.mp4
Save as `game assets/video/s43-to-s44.mp4` · start frame `father gave him money.png` · end frame `boy take money in his pocket.png` · 4 s · sound off
```text
At home by the dining table, the boy (green T-shirt, navy backpack) takes the fan of ₹500 notes from his father with a big smile and tucks it into the front pocket of his jeans. The father (light-blue shirt, moustache) folds his arms on the table and smiles proudly. Nobody talks. One smooth, natural movement, ending exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 45: find the best deals

#### s45-idle.mp4
Save as `game assets/video/s45-idle.mp4` · start frame `boy stand and talk .png` · end frame: the same picture · 5 s · sound off
```text
At home, the father sits at the dining table on the left (light-blue shirt, moustache), and his son stands by the table on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket). Both breathe gently and blink once or twice. Nobody talks. The father's hand stays where it is. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-father-1.mp4
Save as `game assets/video/s45-father-1.mp4` · start frame `boy stand and talk .png` · end frame: the same picture · 5 s · sound off
```text
At home, the father at the dining table on the left (light-blue shirt, moustache) advises his son, warm and encouraging: "Use what you have learnt and find the best deals." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes small explaining gestures and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket) listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-father-2.mp4
Save as `game assets/video/s45-father-2.mp4` · start frame `boy stand and talk .png` · end frame: the same picture · 5 s · sound off
```text
At home, the father at the dining table on the left (light-blue shirt, moustache) adds with a playful smile: "Whatever is left after buying everything is yours." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his open hand makes a small, generous gesture towards his son and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right listens, his eyes widening, and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-aniket-1.mp4
Save as `game assets/video/s45-aniket-1.mp4` · start frame `boy stand and talk .png` · end frame: the same picture · 4 s · sound off
```text
At home, the boy standing on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket), surprised and delighted, asks his father: "Really?" His lips move in time with this one word in the very first second; his eyebrows shoot up and his eyes widen. Then he grins with his mouth closed until the end. The father at the table on the left smiles and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-aniket-2.mp4
Save as `game assets/video/s45-aniket-2.mp4` · start frame `boy stand and talk .png` · end frame: the same picture · 4 s · sound off
```text
At home, the boy standing on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket) says excitedly, with a determined nod: "Then I'm definitely finding the best offers!" His lips move in time with these words from the very first second, with natural mouth shapes, and he squeezes his backpack strap. He finishes speaking by about 3.5 seconds, then grins with his mouth closed. The father at the table on the left listens with a smile and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### Screen 46: Game Begins

The game puts its "Game Begins" panel over the right side of this picture, so only small, calm movements on the left.

#### s46-idle.mp4
Save as `game assets/video/s46-idle.mp4` · start frame `game begins.png` · end frame: the same picture · 5 s · sound off
```text
Outside his house (number 27), a boy (green T-shirt, navy backpack, both hands on his straps) stands ready to go shopping, smiling. He breathes gently and blinks; then he lifts one hand off his strap, gives a small, friendly wave, and puts it back on the strap. Nobody talks. Small, calm movements only. The leaves of the plants sway very slightly. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same. The house number "27" stays sharp. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 56: back home after shopping

#### s56-idle.mp4
Save as `game assets/video/s56-idle.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 5 s · sound off
```text
At home, a boy on the left (green T-shirt, navy backpack, holding a blue-and-white shopping bag) and his father at the dining table on the right (light-blue shirt, moustache, a white tea cup, a newspaper) smile at each other. Both breathe gently and blink once or twice. Nobody talks. The table and everything on it stay still. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-father-1.mp4
Save as `game assets/video/s56-father-1.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 4 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup, a newspaper) looks at his son and asks: "Did you get everything?" His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his eyebrows lift. He finishes speaking by about 2 seconds, then smiles with his mouth closed, holding his cup still. The boy on the left (green T-shirt, navy backpack, a blue-and-white shopping bag in his hand) listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-aniket-1.mp4
Save as `game assets/video/s56-aniket-1.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 4 s · sound off
```text
At home, the boy on the left (green T-shirt, navy backpack, a blue-and-white shopping bag in his hand) answers his father happily: "Yes!" His lips move in time with this one word in the very first second, with a big nod. Then he grins with his mouth closed until the end. The father at the table on the right smiles and blinks, holding his cup still. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-father-2.mp4
Save as `game assets/video/s56-father-2.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 4 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup, a newspaper) asks his son, curious: "How much did you spend?" His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and he tilts his head a little. He finishes speaking by about 2 seconds, then smiles with his mouth closed, holding his cup still. The boy on the left listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-aniket-2.mp4
Save as `game assets/video/s56-aniket-2.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 4 s · sound off
```text
At home, the boy on the left (green T-shirt, navy backpack, a blue-and-white shopping bag in his hand) answers proudly: "Four thousand three hundred and forty rupees." His lips move in time with these words from the very first second, with natural mouth shapes, and he nods once. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The father at the table on the right listens with a smile and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-father-3.mp4
Save as `game assets/video/s56-father-3.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 4 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup, a newspaper) says to his son, pleased: "So you still have six hundred and sixty rupees left!" His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his eyebrows lift happily. He finishes speaking by about 3 seconds, then smiles with his mouth closed, holding his cup still. The boy on the left listens with a big smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-aniket-3.mp4
Save as `game assets/video/s56-aniket-3.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 4 s · sound off
```text
At home, the boy on the left (green T-shirt, navy backpack, a blue-and-white shopping bag in his hand) says proudly: "And I got the best deal for every item!" His lips move in time with these words from the very first second, with natural mouth shapes; he lifts the shopping bag a little and lowers it back to where it was. He finishes speaking by about 3 seconds, then grins with his mouth closed. The father at the table on the right listens with a proud smile and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s56-father-4.mp4
Save as `game assets/video/s56-father-4.mp4` · start frame `return home shopping list .png` · end frame: the same picture · 5 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup, a newspaper) says to his son, proud of him: "Well done! You really did shop wisely." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and he nods warmly. He finishes speaking by about 3.5 seconds, then smiles with his mouth closed, holding his cup still. The boy on the left beams and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```
