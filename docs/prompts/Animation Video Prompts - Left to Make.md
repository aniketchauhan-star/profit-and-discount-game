# Animation clips left to make

> **No longer in the game (2026-10-27):** the user's Google Flow films took the place of these clips (the prompts: `Google Flow Video Prompts.md`; how they are brought in: `tools/flow_import.py`). The clips and the tools that made them were taken out (they are in git's history); this file is kept for the record.

29 of 39 clips to make: 10 not made yet, and 19 made with Gemini to make again on Higgsfield (the meeting of 2026-10-21: in the Gemini takes the people change from clip to clip, the lips move a little after the words, and the picture is soft). This file holds only those, by the picture you upload first, each with its prompt. Everything about them is in `docs/prompts/Animation Video Prompts.md`. Made with `python3 tools/make_videos.py --todo`; it is written again after each batch.

**For every clip, on Higgsfield** (Seedance 2.5, image to video):
1. **Start frame:** the picture named with the clip, from the game folder `assets`: `/Users/AniketChauhan/Desktop/profit and discount game/assets/`.
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
| `story/bookstore-outside-view.webp` | 3, 20, 21 | 3: s03-walk-in, s20-out, s21-walk |
| `story/aniket-holds-the-book.webp` | 5 | 1: s05-pickup |
| `story/aniket-gives-a-book-to-shopkeeper.webp` | 6 → 7, 14, 14 → 15 | 5: s06-to-s07, s14-shopkeeper-1, s14-shopkeeper-2, s14-shopkeeper-3, s14-to-s15 |
| `story/shocked-aniket.webp` | 10 | 1: s10-aniket |
| `story/what-is-a-discount.webp` | 15 | 1: s15-idle |
| `story/he-sees-a-shoe.webp` | 22, 35, 22, 23 | 5: s22-aniket-1, s22-aniket-2, s22-aniket-3, s23-idle, s23-zoom |
| `story/he-thinks-about-the-shoes.webp` | 25 | 3: s25-idle, s25-aniket-1, s25-aniket-2 |
| `story/shopkeeper-gives-the-sneakers-box.webp` | 36 | 1: s36-box |
| `story/boy-returns-home.webp` | 40 | 3: s40-idle, s40-father-1, s40-aniket |
| `story/father-gives-him-money.webp` | 43 | 1: s43-father |
| `story/boy-stands-and-talks.webp` | 45 | 5: s45-idle, s45-father-1, s45-father-2, s45-aniket-1, s45-aniket-2 |

## `story/bookstore-outside-view.webp`

### 1. s03-walk-in.mp4 · Screen 3 · Aniket walks up to the bookstore; the glass door opens and he goes in (the meeting of 2026-10-21)

- [ ] Start frame `story/bookstore-outside-view.webp` · end frame none (it ends on a new pose) · **6 s** · 1080p · sound off · save as `s03-walk-in.mp4`

```text
In a bright shopping mall, in front of a bookstore with a big glass front and the sign "CHAUHAN BOOK STORE", a boy of about twelve (short, messy dark-brown hair, green T-shirt, navy backpack worn on both shoulders, blue jeans, white sneakers) walks in from the left edge of the frame along the shiny floor, at a calm, natural walking pace, his arms swinging gently, towards the bookstore's glass doors. As he reaches them, the right-hand glass door swings open into the shop, and he walks in through it, his back to us, and goes on inside between the shelves. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same from start to end. The sign, the shelves and the store stay sharp and in place. No added text, captions or speech bubbles.
```

### 2. s20-out.mp4 · Screen 20 · Aniket comes out of the bookstore, stops, smiling, and walks off to the right (the first 4.6 s of your Gemini take `outgoing.mp4`)

**Make it again on Higgsfield as one 6 s clip (the meeting of 2026-10-21: Aniket must look the same as in the other pictures, and walk properly): I cut it into `s20-out` and `s21-walk`, as I did with your Gemini take `outgoing.mp4`. Give the whole prompt; the length here is only the first part.**

- [ ] Start frame `story/bookstore-outside-view.webp` · end frame none (it ends on a new pose) · **5 s** · 1080p · sound off · save as `s20-out.mp4`

```text
In a shopping mall, in front of a bookstore with a big glass front and the sign "CHAUHAN BOOK STORE", the right-hand glass door is open and a boy (green T-shirt, navy backpack, blue jeans) walks out of the store towards us, stops in front of it and smiles. Then he turns to his left and walks off along the mall, past the glass front. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hairstyle, outfit, body shape and colours stay exactly the same. The sign and the store stay sharp and in place. No added text, captions or speech bubbles.
```

### 3. s21-walk.mp4 · Screen 21 · Aniket walks on past the open door, to the shoe shop (the last 1.4 s of `outgoing.mp4`, from where your screenshot of Screen 21 shows him)

**Comes from the same take as `s20-out`: make that one, and I cut this part from it.**

- [ ] Start frame `story/bookstore-outside-view.webp` · end frame none (it ends on a new pose) · **1 s** · 1080p · sound off · save as `s21-walk.mp4`

```text
In a shopping mall, in front of a bookstore with a big glass front and the sign "CHAUHAN BOOK STORE", the right-hand glass door is open and a boy (green T-shirt, navy backpack, blue jeans) walks out of the store towards us, stops in front of it and smiles. Then he turns to his left and walks off along the mall, past the glass front. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hairstyle, outfit, body shape and colours stay exactly the same. The sign and the store stay sharp and in place. No added text, captions or speech bubbles.
```

## `story/aniket-holds-the-book.webp`

### 4. s05-pickup.mp4 · Screen 5 · Aniket picks the book up from the display (made backwards: he puts it down; the import turns it round)

**Made backwards: in this take he puts the book down. I turn it round as I bring it in, so in the game he picks the book up, and it ends exactly on the picture.**

- [ ] Start frame `story/aniket-holds-the-book.webp` · end frame none (it ends on a new pose) · **4 s** · 1080p · sound off · save as `s05-pickup.mp4`

```text
A boy of about twelve (short, messy dark-brown hair, green T-shirt, navy backpack on both shoulders, blue jeans) holds the blue book "A Brighter Tomorrow" in both hands and looks at it with a happy, curious smile. Slowly and calmly, he lowers the book and lays it down flat on top of the small pile of white books at the left end of the wooden display table in front of him, then lets go of it and lowers his hands to his sides, still looking down at the book with the same curious smile. The three books standing up on the display ("Magic Tree", "Golden Hills", "Starry Nights"), the shelves, the plants and the shopkeeper at the counter in the background stay perfectly still. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same from start to end. The book's cover and its title stay sharp and readable. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

## `story/aniket-gives-a-book-to-shopkeeper.webp`

### 5. s06-to-s07.mp4 · Screen 6 → 7 · the book handed over, then the notes

**Make it again: the first take started on Screen 7's picture, so the book was never handed over.**

- [ ] Start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame `story/aniket-gives-money-to-shopkeeper.webp` · **5 s** · 1080p · sound off · save as `s06-to-s07.mp4`

```text
At a bookshop counter, the boy (green T-shirt, navy backpack) hands the blue book "A Brighter Tomorrow" to the smiling shopkeeper (glasses, navy apron), who takes it. Then the boy takes out a few banknotes and holds them out to the shopkeeper. Both smile. Nobody talks. One smooth, natural sequence, ending exactly on the last frame. Camera still, moving only as little as needed to match the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The shelves, the signs and their words stay still and sharp. No added text, captions or speech bubbles.
```

### 6. s14-shopkeeper-1.mp4 · Screen 14 · Shopkeeper: "The price printed on the book is ₹1000,"

- [ ] Start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s14-shopkeeper-1.mp4`

```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) explains to the boy, friendly and calm: "The price printed on the book is one thousand rupees," His lips move in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes a small explaining gesture and returns to exactly where it was. He finishes speaking by about 4 seconds, then pauses with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### 7. s14-shopkeeper-2.mp4 · Screen 14 · Shopkeeper: "but you paid only ₹800."

- [ ] Start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s14-shopkeeper-2.mp4`

```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) goes on explaining to the boy, friendly and calm: "but you paid only eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his open hand moves gently down and back up to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### 8. s14-shopkeeper-3.mp4 · Screen 14 · Shopkeeper: "So, you got a ₹200 discount."

- [ ] Start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s14-shopkeeper-3.mp4`

```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) finishes with a big, friendly smile: "So, you got a two hundred rupee discount." His lips move in time with these words from the very first second, with natural mouth shapes; he nods once, and his open hand makes a small, pleased gesture and returns to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### 9. s14-to-s15.mp4 · Screen 14 → 15 · Aniket's face turns puzzled

- [ ] Start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame `story/what-is-a-discount.webp` · **4 s** · 1080p · sound off · save as `s14-to-s15.mp4`

```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, has just heard a word he doesn't know: his smile fades, his eyebrows go up and draw together, his eyes look up, and his face turns puzzled. Only his face changes. Nobody talks. The shopkeeper on the right, still smiling with his open hand out, stays as he is. Ends exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

## `story/shocked-aniket.webp`

### 10. s10-aniket.mp4 · Screen 10 · Aniket: "₹1000? What is this?"

- [ ] Start frame `story/shocked-aniket.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s10-aniket.mp4`

```text
Seen from just behind a boy's shoulder (navy backpack, green T-shirt), he holds the blue book close, shocked by its white "₹1000" price sticker, and exclaims: "One thousand rupees? What is this?" His open mouth moves in time with these words from the very first second, and his head jerks back slightly in surprise. He finishes speaking by about 4 seconds and stays shocked, his mouth slightly open as in the picture. The book and its "₹1000" sticker stay exactly in place, sharp and readable. The shopkeeper in the blurred background smiles and stays still. Start and end on exactly this picture. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

## `story/what-is-a-discount.webp`

### 11. s15-idle.mp4 · Screen 15 · Aniket thinks (mouth closed)

- [ ] Start frame `story/what-is-a-discount.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s15-idle.mp4`

```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, looks puzzled and thinks to himself "Discount? What does that mean?" without saying it: his eyes glance up and to the side, his eyebrows knit and lift, his head tilts slightly, and he blinks. His mouth stays closed the whole time: he is only thinking. The shopkeeper on the right keeps smiling with his open hand still, and blinks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

## `story/he-sees-a-shoe.webp`

### 12. s22-aniket-1.mp4 · Screen 22, 35 · Aniket: "These sneakers look good!" (on 35: "So, after a 30% discount,")

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-sees-a-shoe.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s22-aniket-1.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers with one arm stretched out. He says happily: "These sneakers look good!" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise and his head nods slightly. He finishes speaking by about 3 seconds, then smiles with his mouth closed. His pointing arm, body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### 13. s22-aniket-2.mp4 · Screen 22 · Aniket: "What does 30% OFF mean here?"

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-sees-a-shoe.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s22-aniket-2.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack), pointing at the blue sneakers on the display stand, notices the red "30% OFF" label on the display stand and asks, curious: "What does thirty percent off mean here?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise and draw together a little. He finishes speaking by about 3 seconds, then looks at the label with his mouth closed. His pointing arm, body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### 14. s22-aniket-3.mp4 · Screen 22, 35 · Aniket: "Is this also a discount?" (on 35: "I will pay ₹1260.")

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-sees-a-shoe.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s22-aniket-3.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack), pointing at the blue sneakers on the display stand, wonders aloud: "Is this also a discount?" His lips move in time with these words from the very first second, with natural mouth shapes; his head tilts slightly as he thinks. He finishes speaking by about 3 seconds, then keeps looking at the sneakers with his mouth closed. His pointing arm, body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### 15. s23-idle.mp4 · Screen 22, 35 · Aniket points (no words)

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-sees-a-shoe.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s23-idle.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers with one arm stretched out, smiling. He breathes gently and blinks once or twice; his pointing hand stays where it is. Nobody talks. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### 16. s23-zoom.mp4 · Screen 23 · Aniket points; the camera moves in on the ₹1800 and 30% OFF tags

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-sees-a-shoe.webp` · end frame none (it ends on a new pose) · **6 s** · 1080p · sound off · save as `s23-zoom.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers. He lifts a finger as if he has spotted something, then points again, and the camera moves slowly and smoothly in towards the sneakers until the white "₹1800" tag and the red "30% OFF" label fill the middle of the frame. Nobody talks. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly the same, sharp and readable. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hair, clothes and colours stay exactly the same. No added text, captions or speech bubbles.
```

## `story/he-thinks-about-the-shoes.webp`

### 17. s25-idle.mp4 · Screen 25 · Aniket thinks, hand on chin (no words)

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-thinks-about-the-shoes.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s25-idle.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks at the sneakers' tags, puzzled. He breathes gently and blinks; his eyes move between the white "₹1800" tag and the red "30% OFF" label. Nobody talks: his mouth stays closed. The sneakers and both tags stay exactly in place, sharp and readable. Start and end on exactly this picture. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hair, clothes and colours stay exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### 18. s25-aniket-1.mp4 · Screen 25 · Aniket: "The tag says ₹1800."

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-thinks-about-the-shoes.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s25-aniket-1.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks at the sneakers' white price tag and says, thinking aloud: "The tag says one thousand eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows lift a little. He finishes speaking by about 3.5 seconds, then keeps thinking with his mouth closed. His hand stays on his chin. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### 19. s25-aniket-2.mp4 · Screen 25 · Aniket: "With 30% off, how much do I actually pay?"

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/he-thinks-about-the-shoes.webp` · end frame the same picture · **6 s** · 1080p · sound off · save as `s25-aniket-2.mp4`

```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks confused and asks himself: "With thirty percent off, how much do I actually pay?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows knit and lift, and his head tilts slightly. He finishes speaking by about 5 seconds, then keeps thinking with his mouth closed. His hand stays on his chin. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

## `story/shopkeeper-gives-the-sneakers-box.webp`

### 20. s36-box.mp4 · Screen 36 · the shopkeeper hands over the box

**Make it again on Higgsfield (the meeting of 2026-10-21: the people change completely in the Gemini take). Check the picture too: the shopkeeper and Aniket must look as they do on the other shop screens.**

- [ ] Start frame `story/shopkeeper-gives-the-sneakers-box.webp` · end frame none (it ends on a new pose) · **5 s** · 1080p · sound off · save as `s36-box.mp4`

```text
At a shoe shop counter, the shopkeeper (teal polo shirt, short beard) and a boy (green T-shirt, navy backpack) both hold an open orange-and-white box with new blue sneakers inside. The shopkeeper smiles, lets go of the box with a small nod, and the boy draws it a little towards himself with both hands, beaming, and looks down at the sneakers. Nobody talks. Small, calm movements; the box moves only a little. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The sneakers in the box stay the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

## `story/boy-returns-home.webp`

### 21. s40-idle.mp4 · Screen 40 · both smile, back home

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-returns-home.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s40-idle.mp4`

```text
At home, a boy on the left (green T-shirt, navy backpack, a blue book held against his chest, a blue-and-white shopping bag in his other hand) has just come in; his father sits at the dining table on the right (light-blue shirt, moustache, a white tea cup and a newspaper). Both smile, breathe gently and blink once or twice. The shopping bag sways very slightly. Nobody talks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### 22. s40-father-1.mp4 · Screen 40 · Dad: "How was your shopping?"

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-returns-home.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s40-father-1.mp4`

```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup and a newspaper) looks up at his son and asks warmly: "How was your shopping?" His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his eyebrows lift, and he lowers his tea cup a little and brings it back to exactly where it was. He finishes speaking by about 2 seconds, then smiles with his mouth closed. The boy on the left listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### 23. s40-aniket.mp4 · Screen 40 · Aniket: "Great! I learnt about marked price, discount and discount percentage."

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-returns-home.webp` · end frame the same picture · **7 s** · 1080p · sound off · save as `s40-aniket.mp4`

```text
At home, the boy on the left (green T-shirt, navy backpack, a blue book held against his chest, a blue-and-white shopping bag in his other hand) answers his father happily: "Great! I learnt about marked price, discount and discount percentage." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise, his head nods, and he lifts the shopping bag a little to show it, then lowers it back to where it was. He finishes speaking by about 6 seconds, then smiles with his mouth closed. The father on the right listens with a smile and blinks, holding his cup and newspaper still. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

## `story/father-gives-him-money.webp`

### 24. s43-father.mp4 · Screen 43 · Dad: "Here's ₹5,000."

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/father-gives-him-money.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s43-father.mp4`

```text
At home by the dining table, the father on the left (light-blue shirt, moustache) holds out a fan of ₹500 notes to his son and says with a warm smile: "Here's five thousand rupees." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his eyebrows lift. He finishes speaking by about 2.5 seconds, then smiles with his mouth closed. The notes stay exactly in place in his hand: do not move or change them. The boy on the right looks at the notes with wide, happy eyes and blinks; his open hand stays still. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

## `story/boy-stands-and-talks.webp`

### 25. s45-idle.mp4 · Screen 45 · both listen

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-stands-and-talks.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s45-idle.mp4`

```text
At home, the father sits at the dining table on the left (light-blue shirt, moustache), and his son stands by the table on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket). Both breathe gently and blink once or twice. Nobody talks. The father's hand stays where it is. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### 26. s45-father-1.mp4 · Screen 45 · Dad: "Use what you have learnt and find the best deals."

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-stands-and-talks.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s45-father-1.mp4`

```text
At home, the father at the dining table on the left (light-blue shirt, moustache) advises his son, warm and encouraging: "Use what you have learnt and find the best deals." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes small explaining gestures and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket) listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### 27. s45-father-2.mp4 · Screen 45 · Dad: "Whatever is left after buying everything is yours."

- [ ] Start frame `story/boy-stands-and-talks.webp` · end frame the same picture · **5 s** · 1080p · sound off · save as `s45-father-2.mp4`

```text
At home, the father at the dining table on the left (light-blue shirt, moustache) adds with a playful smile: "Whatever is left after buying everything is yours." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his open hand makes a small, generous gesture towards his son and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right listens, his eyes widening, and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### 28. s45-aniket-1.mp4 · Screen 45 · Aniket: "Really?"

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-stands-and-talks.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s45-aniket-1.mp4`

```text
At home, the boy standing on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket), surprised and delighted, asks his father: "Really?" His lips move in time with this one word in the very first second; his eyebrows shoot up and his eyes widen. Then he grins with his mouth closed until the end. The father at the table on the left smiles and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### 29. s45-aniket-2.mp4 · Screen 45 · Aniket: "Then I'm definitely finding the best offers!"

**Make it again on Higgsfield (the meeting of 2026-10-21): the Gemini take is in the game for now, but its people change from clip to clip and it is soft. Keep the people exactly as in the picture, and their faces showing what they say.**

- [ ] Start frame `story/boy-stands-and-talks.webp` · end frame the same picture · **4 s** · 1080p · sound off · save as `s45-aniket-2.mp4`

```text
At home, the boy standing on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket) says excitedly, with a determined nod: "Then I'm definitely finding the best offers!" His lips move in time with these words from the very first second, with natural mouth shapes, and he squeezes his backpack strap. He finishes speaking by about 3.5 seconds, then grins with his mouth closed. The father at the table on the left listens with a smile and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```
