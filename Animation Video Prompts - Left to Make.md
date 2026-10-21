# Animation clips left to make

11 of 54 clips are still to make; the other 43 are in the game. This file holds only the ones left, by the picture you upload first, each with its prompt. Everything about them is in `Animation Video Prompts.md`. Made with `python3 tools/make_videos.py --todo`; it is written again after each batch.

**For every clip, on Higgsfield** (Seedance 2.5, image to video):
1. **Start frame:** the picture named with the clip, from the game folder `game assets`: `/Users/AniketChauhan/Desktop/profit and discount game/game assets/`.
2. **End frame:** the picture named as its end frame. For a talking clip or a quiet loop, that is the same picture again.
3. Paste the prompt. Set the **length** given, **1080p**, 16:9, and **sound off**.
4. Make 2 or 3 takes and keep the cleanest. The first and last frames must be the pictures, the faces must stay the same, and the prices and signs must stay sharp.
5. Save it with the clip's name, for example `s09-to-s10.mp4`, anywhere, and tell me. I put it in the game.

**Check before you keep a take:** for a talking clip or a quiet loop, the last frame must look like the picture again. Two of the shopkeeper's first takes ended with his open hand down, so it jumped back up when the clip ended.

**Made with Gemini instead?** That works for a talking clip or a quiet loop: keep the name Gemini gives the file and tell me which clip it is (or name it as above). I take the sparkle off and line it up with the picture (`--import --gemini`). Gemini can't be given an end frame, so make the **movement clips** (`…-to-…`) on Higgsfield. Ask for no captions: one Gemini take wrote "Really?" on the screen.

If there is a field for a **negative prompt**, paste this:

```text
camera movement, zoom, pan, shake, cut, morphing, melting, warping, flicker, face changing, different face, different hair, different clothes, colour change, extra fingers, extra hands, extra arms, deformed hands, blurry text, changed text, new text, wrong numbers, subtitles, captions, speech bubbles, logo, watermark, new people, new objects, objects appearing or disappearing, 3D render, photorealistic, style change
```

## The pictures left

| Picture (start frame) | Screen | Clips to make |
|---|---|---|
| `aniket give a book to shopkepper.png` | 6 → 7, 14, 14 → 15 | 5: s06-to-s07, s14-shopkeeper-1, s14-shopkeeper-2, s14-shopkeeper-3, s14-to-s15 |
| `boy see the book .png` | 9 → 10 | 1: s09-to-s10 |
| `shocked aniket.png` | 10 | 1: s10-aniket |
| `what is discount.png` | 15 | 1: s15-idle |
| `boy and his father talking.png` | 41 | 1: s41-father-2 |
| `father gave him money.png` | 43 → 44 | 1: s43-to-s44 |
| `boy stand and talk .png` | 45 | 1: s45-father-2 |

## `aniket give a book to shopkepper.png`

### 1. s06-to-s07.mp4 · Screen 6 → 7 · the book handed over, then the notes

**Make it again: the first take started on Screen 7's picture, so the book was never handed over.**

- [ ] Start frame `aniket give a book to shopkepper.png` · end frame `aniket give money to shopkeeper.png` · **5 s** · 1080p · sound off · save as `s06-to-s07.mp4`

```text
At a bookshop counter, the boy (green T-shirt, navy backpack) hands the blue book "A Brighter Tomorrow" to the smiling shopkeeper (glasses, navy apron), who takes it. Then the boy takes out a few banknotes and holds them out to the shopkeeper. Both smile. Nobody talks. One smooth, natural sequence, ending exactly on the last frame. Camera still, moving only as little as needed to match the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The shelves, the signs and their words stay still and sharp. No added text, captions or speech bubbles.
```

### 2. s14-shopkeeper-1.mp4 · Screen 14 · Shopkeeper: "The price printed on the book is ₹1000,"

- [ ] Start frame `aniket give a book to shopkepper.png` · end frame the same picture · **5 s** · 1080p · sound off · save as `s14-shopkeeper-1.mp4`

```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) explains to the boy, friendly and calm: "The price printed on the book is one thousand rupees," His lips move in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes a small explaining gesture and returns to exactly where it was. He finishes speaking by about 4 seconds, then pauses with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### 3. s14-shopkeeper-2.mp4 · Screen 14 · Shopkeeper: "but you paid only ₹800."

- [ ] Start frame `aniket give a book to shopkepper.png` · end frame the same picture · **4 s** · 1080p · sound off · save as `s14-shopkeeper-2.mp4`

```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) goes on explaining to the boy, friendly and calm: "but you paid only eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his open hand moves gently down and back up to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### 4. s14-shopkeeper-3.mp4 · Screen 14 · Shopkeeper: "So, you got a ₹200 discount."

- [ ] Start frame `aniket give a book to shopkepper.png` · end frame the same picture · **4 s** · 1080p · sound off · save as `s14-shopkeeper-3.mp4`

```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) finishes with a big, friendly smile: "So, you got a two hundred rupee discount." His lips move in time with these words from the very first second, with natural mouth shapes; he nods once, and his open hand makes a small, pleased gesture and returns to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### 5. s14-to-s15.mp4 · Screen 14 → 15 · Aniket's face turns puzzled

- [ ] Start frame `aniket give a book to shopkepper.png` · end frame `what is discount.png` · **4 s** · 1080p · sound off · save as `s14-to-s15.mp4`

```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, has just heard a word he doesn't know: his smile fades, his eyebrows go up and draw together, his eyes look up, and his face turns puzzled. Only his face changes. Nobody talks. The shopkeeper on the right, still smiling with his open hand out, stays as he is. Ends exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

## `boy see the book .png`

### 6. s09-to-s10.mp4 · Screen 9 → 10 · Aniket tilts the book, sees ₹1000, shock

- [ ] Start frame `boy see the book .png` · end frame `shocked aniket.png` · **4 s** · 1080p · sound off · save as `s09-to-s10.mp4`

```text
Seen from just behind a boy's shoulder (navy backpack, green T-shirt), he holds the blue book and tilts it towards himself. His eyes find the white "₹1000" price sticker on the book, and he jolts back in shock, mouth open. The shopkeeper with glasses, blurred in the background, smiles. Nobody talks. The camera moves in slightly towards the book, ending exactly on the last frame. The "₹1000" sticker and its barcode stay sharp and readable all the time, and end exactly where they are in the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). The boy's hair, clothes and colours stay exactly the same. No added text, captions or speech bubbles.
```

## `shocked aniket.png`

### 7. s10-aniket.mp4 · Screen 10 · Aniket: "₹1000? What is this?"

- [ ] Start frame `shocked aniket.png` · end frame the same picture · **5 s** · 1080p · sound off · save as `s10-aniket.mp4`

```text
Seen from just behind a boy's shoulder (navy backpack, green T-shirt), he holds the blue book close, shocked by its white "₹1000" price sticker, and exclaims: "One thousand rupees? What is this?" His open mouth moves in time with these words from the very first second, and his head jerks back slightly in surprise. He finishes speaking by about 4 seconds and stays shocked, his mouth slightly open as in the picture. The book and its "₹1000" sticker stay exactly in place, sharp and readable. The shopkeeper in the blurred background smiles and stays still. Start and end on exactly this picture. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

## `what is discount.png`

### 8. s15-idle.mp4 · Screen 15 · Aniket thinks (mouth closed)

- [ ] Start frame `what is discount.png` · end frame the same picture · **5 s** · 1080p · sound off · save as `s15-idle.mp4`

```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, looks puzzled and thinks to himself "Discount? What does that mean?" without saying it: his eyes glance up and to the side, his eyebrows knit and lift, his head tilts slightly, and he blinks. His mouth stays closed the whole time: he is only thinking. The shopkeeper on the right keeps smiling with his open hand still, and blinks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

## `boy and his father talking.png`

### 9. s41-father-2.mp4 · Screen 41 · Dad: "You still need some things for school."

- [ ] Start frame `boy and his father talking.png` · end frame the same picture · **4 s** · 1080p · sound off · save as `s41-father-2.mp4`

```text
At a wooden dining table, the father on the right (light-blue shirt, moustache) adds, calm and caring: "You still need some things for school." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his raised open hand makes a small gesture and returns to exactly where it was; his other hand stays on the table. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

## `father gave him money.png`

### 10. s43-to-s44.mp4 · Screen 43 → 44 · Aniket pockets the money

- [ ] Start frame `father gave him money.png` · end frame `boy take money in his pocket.png` · **4 s** · 1080p · sound off · save as `s43-to-s44.mp4`

```text
At home by the dining table, the boy (green T-shirt, navy backpack) takes the fan of ₹500 notes from his father with a big smile and tucks it into the front pocket of his jeans. The father (light-blue shirt, moustache) folds his arms on the table and smiles proudly. Nobody talks. One smooth, natural movement, ending exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

## `boy stand and talk .png`

### 11. s45-father-2.mp4 · Screen 45 · Dad: "Whatever is left after buying everything is yours."

- [ ] Start frame `boy stand and talk .png` · end frame the same picture · **5 s** · 1080p · sound off · save as `s45-father-2.mp4`

```text
At home, the father at the dining table on the left (light-blue shirt, moustache) adds with a playful smile: "Whatever is left after buying everything is yours." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his open hand makes a small, generous gesture towards his son and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right listens, his eyes widening, and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```
