# Animation video prompts: the story pictures, talking and moving

> **No longer in the game (2026-10-27):** the user's Google Flow films took the place of these clips (the prompts: `Google Flow Video Prompts.md`; how they are brought in: `tools/flow_import.py`). The clips and the tools that made them were taken out (they are in git's history); this file is kept for the record.

These prompts turn the game's still pictures into short videos, made on Higgsfield with **Seedance 2.5, image to video**. Every clip below has a file name to save it as, and every talking clip has the exact words its person says.

There are 53 clips in three kinds:
- **Talking clips (32):** one for each line a person says. The lips move with that line's words, then the person stops and smiles. The game plays the recorded voice with the clip.
- **Quiet clips (18):** blinking, breathing, a sip of tea; they play between the lines. Six play once instead: Aniket walking into the bookstore (3), picking up the book (5), the box handed over (36), the camera moving in on the price tags (23), and Aniket coming out of the bookstore and walking on (20 and 21).
- **Movements (3):** one picture turns into the next, for example the book handed over, then the notes. They replace the fades.

Screen numbers are the brief's (as in `docs/PROMPT.md`).

## In the game now

**The review meeting of 2026-10-21** (`docs/MEETING-2026-10-21.md`): in the clips made with Gemini the people change from clip to clip, the lips move a little after the words, and the picture is soft, so **all 32 are to be made again on Higgsfield**, in 1080p, the people exactly as in the pictures and their faces showing what they say; the game keeps the Gemini takes until then. The meeting also asked for a new clip, **`s03-walk-in`**: Aniket walks up to the bookstore and the door opens for him (the game plays it on Screen 3 as soon as it is made). The same day the user asked for another, **`s05-pickup`**: on Screen 5, before "This book looks interesting!", Aniket picks the book up from the display (made backwards, see its prompt; the game plays it first on Screen 5 as soon as it is made). Everything to make is in `docs/prompts/Animation Video Prompts - Left to Make.md`.

**29 clips play in the game.** (Screens 2, 4, 9, 24 and 44 were taken out on 2026-10-21: the clips `s04-to-s05` and `s24-idle` were removed, and `s09-to-s10`, `s24-to-s25` and `s43-to-s44` aren't needed. The screens after 31 were made again as Party Prep on 2026-10-23, and on 2026-10-26 the clips of the ones that went were removed from the folder too, with their prompts: `s40-father-2`, `s41-idle`, `s41-father-1`, `s42-to-s43`, `s46-idle` and the eight of Screen 56, and your Gemini take `outgoing.mp4`. They are in git's history.)
- **Screens 1, 5, 6, 7 and 8** (made on Higgsfield): `s01-idle`, `s01-aniket-1`, `s01-father`, `s01-aniket-2`, `s05-idle`, `s05-aniket`, `s06-idle`, `s06-aniket`, `s06-shopkeeper` and `s07-idle`. Screen 8 uses `s07-idle` too (the same picture). Until Screen 14 has its own clips, the shopkeeper there also talks with `s06-shopkeeper`.
- **Screens 20 and 21** (your Gemini take `outgoing.mp4`, cut in two 4.6 s in, where Aniket walks past the open door, as in your screenshot of Screen 21): `s20-out` and `s21-walk`, with a cut between the two screens. The take sits 15 px higher than the picture, so `tools/gemini_clean.py` was given its framing (`--framing 1.0226,0.6,-15`), and its sparkle is covered with the floor just left of it (`--star-from -60,-3`): under the sparkle, the take draws the glass's base lower than the picture does. On Screen 5, the clips show the book stand a little smaller and higher up than the picture (about 24 px); the names on the books move with it. On Screen 25, `s25-idle` and `s25-aniket-1` blur the price on the white card into "e1800", and on Screens 22 and 35 the clips redraw the ₹1800 tent card's price roughly: the game lays the picture's card over them (`s23-zoom`, whose camera moves, draws it well).
- **Screens 22, 23, 25, 35, 36, 40, 43 and 45** (made with Gemini, 17 clips): `s22-aniket-1`, `s22-aniket-2`, `s22-aniket-3`, `s23-idle`, `s23-zoom`, `s25-idle`, `s25-aniket-1`, `s25-aniket-2`, `s36-box`, `s40-idle`, `s40-father-1`, `s40-aniket`, `s43-father`, `s45-idle`, `s45-father-1`, `s45-aniket-1` and `s45-aniket-2`. Until `s45-father-2` is made, the father says that line with `s45-father-1`.

From the Gemini batch:
- **Cleaned** with `tools/gemini_clean.py`: the Gemini sparkle is gone, and each clip sits exactly on its picture again (Gemini shows the picture about 2% closer, and in `s25-aniket-2` and `s45-aniket-2` the camera also pushed in; it is held still now; `s23-zoom` keeps its camera move, which is the point of it). Then `tools/enhance_clips.py --ai` redrew each one at 1920 × 1080, the stage's size, with **Real-ESRGAN** (its model for cartoon video, `realesr-animevideov3`, at twice the size, then brought to 1080p), so outlines, faces and printed words are sharp instead of blurred when the browser stretches a 720p clip: about 1.5 MB each now. The tool is a free download (github.com/xinntao/Real-ESRGAN/releases, v0.2.5.0, `realesrgan-ncnn-vulkan-20220424-macos.zip`); give its folder to `--ai`. Without it, `tools/enhance_clips.py` sharpens instead (a light denoise, Lanczos, sharpening on the lines), and `--import --gemini` does that by itself for new takes.
- **`s23-zoom`, repaired by hand:** where its camera moves in, the cleaner covered the sparkle with the wrong spot of the picture, so a white, yellow or purple star showed on the stand (frames 51–68, 81–94 and 123–124). In those frames, that spot was taken from the nearest frame without one, fitted to the camera and blended in. If the clip is ever made or cleaned again, check the stand under the sparkle.
- **The shoe shop is all video, no still picture** (Screens 22, 23, 25 and 35). Your three takes for Screen 22 start on Aniket pointing, so Screen 22 now shows that picture, `story/he-sees-a-shoe.webp`, and plays them, with `s23-idle` between the lines; `shoes shop enter.png` is no longer used. Screen 23 plays `s23-zoom`: Aniket points, and the camera moves in on the ₹1800 and 30% OFF tags. Screen 25 has its quiet loop, `s25-idle` (from the quiet end of the take for `s25-aniket-1`). Screen 35 reuses Screen 22's clips: `s23-idle`, then `s22-aniket-1` for "So, after a 30% discount," and `s22-aniket-3` for "I will pay ₹1260." So `s22-to-s23` and `s23-to-s24` are no longer needed, nor clips of Screen 35's own.
- **Started a little later:** `s40-aniket` begins once Aniket has finished stepping in (0.7 s into the take), and `s45-aniket-1` and `s45-aniket-2` once the father's hand is down (0.75 s and 0.5 s). Otherwise Aniket, or the father's hand, would jump back at each new line. On Screens 40 and 45 the last clip also stays on its last frame between lines. Gemini wrote "Really?" on the screen in `s45-aniket-1`; it is covered.
- **Loop:** `s25-idle` plays forwards and then backwards, so it loops without a jump.
- **Not used:** a take of Aniket pointing (it ends with his arm down, turned away), the take for `s24-to-s25` (he crosses his arms), and a second take of `s45-idle` (the camera pushes in). Gemini's original files (with the sparkle) were moved to the Trash, so they don't weigh down the folder.
- **To make on Higgsfield:** the movements (Gemini can't be given an end frame).

From your first batch:
- **`s06-shopkeeper`:** your take named `s06-shopkeeper` ends with his hand down, so it would jump back up when the clip ends. Your unnamed take `hf_…064244` ends with the hand back where it started, so that one is in the game.
- **To make again: `s06-to-s07`.** It starts on Screen 7's picture, so the book is never handed over. Its start frame must be `story/aniket-gives-a-book-to-shopkeeper.webp` and its end frame `story/aniket-gives-money-to-shopkeeper.webp`.
- **Not used:**
  - `hf_…062459` starts on Screen 10 and zooms into the book, so it can't end on the picture. If it was `s10-aniket`, make it again with the same picture as the end frame. (`s09-to-s10` isn't needed any more: Screen 9 was taken out.) Its start frame would have been `boy see the book .png`.
  - `hf_…063148` is the shopkeeper talking, but his hand ends down.

**Adding clips:** save them anywhere with the clip's name in the file name, for example `s10-aniket.mp4`, and tell me. I'll check each one, convert it (H.264, no sound, about 1 MB) into `assets/video/`, and the game plays it. A clip that isn't made yet leaves the still picture, as before. Clips made with Gemini can keep the names Gemini gives them: tell me which clip each one is, or let me work it out from the picture.

## How to make a clip on Higgsfield

1. Open Seedance 2.5 (image to video) on Higgsfield.
2. **Start frame:** upload the picture named with the clip. The pictures are in the game folder, `assets`: `/Users/AniketChauhan/Desktop/profit and discount game/assets/`.
3. **End frame:** upload the picture named as the end frame. For talking clips and quiet loops, that's the same picture again.
4. Paste the clip's prompt.
5. Set the **length** given with the clip, **1080p**, 16:9, and **sound off**. The game plays its own recorded voices; if sound can't be turned off, that's fine, the game mutes the clip.
6. Generate. Make 2 or 3 takes and keep the cleanest.
7. Download it, rename it to the clip's file name (for example `s01-aniket-1.mp4`), and save it in **`assets/video/`**: `/Users/AniketChauhan/Desktop/profit and discount game/assets/video/`.

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

**Start with three, as a test:** `s01-idle`, `s01-aniket-1` and `s01-father`. Put them in `assets/video/` and tell me. I'll put them in the game so you can see them, then make the rest.

## All the clips

| File | Screen | Start frame | End frame | Length | What happens |
|---|---|---|---|---|---|
| s01-idle | 1 | story/boy-talks-with-father.webp | same | 5 s | both listen; Dad sips his tea |
| s01-aniket-1 | 1 | story/boy-talks-with-father.webp | same | 6 s | Aniket: "Dad, I want to buy a book and a new pair of sneakers from the mall." |
| s01-father | 1 | story/boy-talks-with-father.webp | same | 5 s | Dad: "Sure. But compare the prices and buy wisely." |
| s01-aniket-2 | 1 | story/boy-talks-with-father.webp | same | 4 s | Aniket: "I will!" |
| s03-walk-in | 3 | story/bookstore-outside-view.webp | (none) | 6 s | Aniket walks up to the bookstore; the glass door opens and he goes in (the meeting of 2026-10-21) |
| s05-pickup | 5 | story/aniket-holds-the-book.webp | (none) | 4 s | Aniket picks the book up from the display (made backwards: he puts it down; the import turns it round) |
| s05-idle | 5 | story/aniket-holds-the-book.webp | same | 5 s | Aniket looks at the book |
| s05-aniket | 5 | story/aniket-holds-the-book.webp | same | 4 s | Aniket: "This book looks interesting!" |
| s06-idle | 6, 14 | story/aniket-gives-a-book-to-shopkeeper.webp | same | 5 s | both wait |
| s06-aniket | 6 | story/aniket-gives-a-book-to-shopkeeper.webp | same | 4 s | Aniket: "How much is this book?" |
| s06-shopkeeper | 6 | story/aniket-gives-a-book-to-shopkeeper.webp | same | 4 s | Shopkeeper: "It's ₹800!" |
| s06-to-s07 | 6 → 7 | story/aniket-gives-a-book-to-shopkeeper.webp | story/aniket-gives-money-to-shopkeeper.webp | 5 s | the book handed over, then the notes |
| s07-idle | 7, 8 | story/aniket-gives-money-to-shopkeeper.webp | same | 5 s | both wait (the notes don't move) |
| s10-aniket | 10 | story/shocked-aniket.webp | same | 5 s | Aniket: "₹1000? What is this?" |
| s14-shopkeeper-1 | 14 | story/aniket-gives-a-book-to-shopkeeper.webp | same | 5 s | Shopkeeper: "The price printed on the book is ₹1000," |
| s14-shopkeeper-2 | 14 | story/aniket-gives-a-book-to-shopkeeper.webp | same | 4 s | Shopkeeper: "but you paid only ₹800." |
| s14-shopkeeper-3 | 14 | story/aniket-gives-a-book-to-shopkeeper.webp | same | 4 s | Shopkeeper: "So, you got a ₹200 discount." |
| s14-to-s15 | 14 → 15 | story/aniket-gives-a-book-to-shopkeeper.webp | story/what-is-a-discount.webp | 4 s | Aniket's face turns puzzled |
| s15-idle | 15 | story/what-is-a-discount.webp | same | 5 s | Aniket thinks (mouth closed) |
| s20-out | 20 | story/bookstore-outside-view.webp | (none) | 5 s | Aniket comes out of the bookstore, stops, smiling, and walks off to the right (the first 4.6 s of your Gemini take `outgoing.mp4`) |
| s21-walk | 21 | story/bookstore-outside-view.webp | (none) | 1 s | Aniket walks on past the open door, to the shoe shop (the last 1.4 s of `outgoing.mp4`, from where your screenshot of Screen 21 shows him) |
| s22-aniket-1 | 22, 35 | story/he-sees-a-shoe.webp | same | 4 s | Aniket: "These sneakers look good!" (on 35: "So, after a 30% discount,") |
| s22-aniket-2 | 22 | story/he-sees-a-shoe.webp | same | 4 s | Aniket: "What does 30% OFF mean here?" |
| s22-aniket-3 | 22, 35 | story/he-sees-a-shoe.webp | same | 4 s | Aniket: "Is this also a discount?" (on 35: "I will pay ₹1260.") |
| s23-idle | 22, 35 | story/he-sees-a-shoe.webp | same | 5 s | Aniket points (no words) |
| s23-zoom | 23 | story/he-sees-a-shoe.webp | (none) | 6 s | Aniket points; the camera moves in on the ₹1800 and 30% OFF tags |
| s25-idle | 25 | story/he-thinks-about-the-shoes.webp | same | 4 s | Aniket thinks, hand on chin (no words) |
| s25-aniket-1 | 25 | story/he-thinks-about-the-shoes.webp | same | 4 s | Aniket: "The tag says ₹1800." |
| s25-aniket-2 | 25 | story/he-thinks-about-the-shoes.webp | same | 6 s | Aniket: "With 30% off, how much do I actually pay?" |
| s36-box | 36 | story/shopkeeper-gives-the-sneakers-box.webp | (none) | 5 s | the shopkeeper hands over the box |
| s40-idle | 40 | story/boy-returns-home.webp | same | 5 s | both smile, back home |
| s40-father-1 | 40 | story/boy-returns-home.webp | same | 4 s | Dad: "How was your shopping?" |
| s40-aniket | 40 | story/boy-returns-home.webp | same | 7 s | Aniket: "Great! I learnt about marked price, discount and discount percentage." |
| s43-father | 43 | story/father-gives-him-money.webp | same | 4 s | Dad: "Here's ₹5,000." |
| s45-idle | 45 | story/boy-stands-and-talks.webp | same | 5 s | both listen |
| s45-father-1 | 45 | story/boy-stands-and-talks.webp | same | 5 s | Dad: "Use what you have learnt and find the best deals." |
| s45-father-2 | 45 | story/boy-stands-and-talks.webp | same | 5 s | Dad: "Whatever is left after buying everything is yours." |
| s45-aniket-1 | 45 | story/boy-stands-and-talks.webp | same | 4 s | Aniket: "Really?" |
| s45-aniket-2 | 45 | story/boy-stands-and-talks.webp | same | 4 s | Aniket: "Then I'm definitely finding the best offers!" |

No clips are needed for:
- Screen 2: it stays still, as the brief says.
- Screens 3, 20 and 21: the game already moves Aniket and the doors there.
- Swifty's lines: she is drawn and moved by the game itself.

## The prompts

### Screen 1: Talking to Dad

#### s01-idle.mp4
Save as `assets/video/s01-idle.mp4` · start frame `story/boy-talks-with-father.webp` · end frame: the same picture · 5 s · sound off
```text
A boy on the left (green T-shirt, navy backpack, both hands on his backpack straps) and his father sitting on the sofa on the right (light-blue polo shirt, moustache, holding a white tea cup) smile at each other. Both breathe gently and blink once or twice. Halfway through, the father lifts his tea cup to his lips, takes a small sip, and lowers it back to exactly where it was. Nobody talks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

#### s01-aniket-1.mp4
Save as `assets/video/s01-aniket-1.mp4` · start frame `story/boy-talks-with-father.webp` · end frame: the same picture · 6 s · sound off
```text
The boy on the left (green T-shirt, navy backpack, hands on his straps) says to his father, excited and happy: "Dad, I want to buy a book and a new pair of sneakers from the mall." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise a little and his head nods gently; his hands stay on his straps, moving only slightly. He finishes speaking by about 5 seconds, then smiles with his mouth closed. The father on the sofa on the right listens with a smile, holding his tea cup still, and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

#### s01-father.mp4
Save as `assets/video/s01-father.mp4` · start frame `story/boy-talks-with-father.webp` · end frame: the same picture · 5 s · sound off
```text
The father on the sofa on the right (light-blue polo shirt, moustache, a white tea cup in his hand) lowers his cup a little and says to his son, warm and calm: "Sure. But compare the prices and buy wisely." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his head nods gently on "buy wisely". He finishes speaking by about 4 seconds, smiles with his mouth closed, and brings the cup back to exactly where it was. The boy on the left listens with a smile and blinks, his hands on his straps. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

#### s01-aniket-2.mp4
Save as `assets/video/s01-aniket-2.mp4` · start frame `story/boy-talks-with-father.webp` · end frame: the same picture · 4 s · sound off
```text
The boy on the left (green T-shirt, navy backpack, hands on his straps) answers his father with a big, confident smile: "I will!" His lips move in time with these two words in the very first second, with a firm little nod; then he smiles with his mouth closed until the end. The father on the sofa on the right smiles back, holding his tea cup still, and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. Smooth, gentle, natural movement. No added text, captions or speech bubbles.
```

### Screen 3: into the bookstore

The meeting of 2026-10-21 asked for this one: the walk the game draws on Screen 3 doesn't look like real walking, so he walks up to the shop in a clip, and the door opens for him. Aniket isn't in this picture: the prompt describes him, so check that he looks as he does in the other pictures before keeping a take.

#### s03-walk-in.mp4
Save as `assets/video/s03-walk-in.mp4` · start frame `story/bookstore-outside-view.webp` · end frame: none · 6 s · sound off
```text
In a bright shopping mall, in front of a bookstore with a big glass front and the sign "CHAUHAN BOOK STORE", a boy of about twelve (short, messy dark-brown hair, green T-shirt, navy backpack worn on both shoulders, blue jeans, white sneakers) walks in from the left edge of the frame along the shiny floor, at a calm, natural walking pace, his arms swinging gently, towards the bookstore's glass doors. As he reaches them, the right-hand glass door swings open into the shop, and he walks in through it, his back to us, and goes on inside between the shelves. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same from start to end. The sign, the shelves and the store stay sharp and in place. No added text, captions or speech bubbles.
```

### Screen 5: the book

The user asked (2026-10-21) for Aniket to pick the book up first, before "This book looks interesting!". There is no picture of him before he has it, so the clip is **made backwards**: it starts on this picture, and he puts the book down on the display. `tools/make_videos.py` turns it round as it brings it in, so in the game he picks the book up and the clip ends exactly on this picture, where the screen's other clips start.

#### s05-pickup.mp4
Save as `assets/video/s05-pickup.mp4` · start frame `story/aniket-holds-the-book.webp` · end frame: none · 4 s · sound off · **made backwards** (the import turns it round)
```text
A boy of about twelve (short, messy dark-brown hair, green T-shirt, navy backpack on both shoulders, blue jeans) holds the blue book "A Brighter Tomorrow" in both hands and looks at it with a happy, curious smile. Slowly and calmly, he lowers the book and lays it down flat on top of the small pile of white books at the left end of the wooden display table in front of him, then lets go of it and lowers his hands to his sides, still looking down at the book with the same curious smile. The three books standing up on the display ("Magic Tree", "Golden Hills", "Starry Nights"), the shelves, the plants and the shopkeeper at the counter in the background stay perfectly still. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). The boy's face, hair, clothes and colours stay exactly the same from start to end. The book's cover and its title stay sharp and readable. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s05-idle.mp4
Save as `assets/video/s05-idle.mp4` · start frame `story/aniket-holds-the-book.webp` · end frame: the same picture · 5 s · sound off
```text
A boy (green T-shirt, navy backpack) holds the blue book "A Brighter Tomorrow" in both hands and looks at it with a smile. He breathes gently and blinks once or twice. Nobody talks. The book stays in the same place in his hands. The books on the display table and the shopkeeper at the counter in the background stay still. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s05-aniket.mp4
Save as `assets/video/s05-aniket.mp4` · start frame `story/aniket-holds-the-book.webp` · end frame: the same picture · 4 s · sound off
```text
A boy (green T-shirt, navy backpack) holds the blue book "A Brighter Tomorrow" in both hands, looks at it and says to himself, pleased: "This book looks interesting!" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows lift with interest and his head tilts a little towards the book. He finishes speaking by about 3 seconds, then keeps smiling at the book with his mouth closed. The book stays in the same place in his hands, and the books on the display table stay exactly where they are. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### Screens 6–8: at the counter

#### s06-idle.mp4
Save as `assets/video/s06-idle.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, a boy on the left (green T-shirt, navy backpack) holds out the blue book "A Brighter Tomorrow"; the shopkeeper on the right (glasses, light-blue shirt, navy apron) smiles with his open hand held out. Both breathe gently and blink once or twice. Nobody talks. The book and the shopkeeper's hand stay where they are. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s06-aniket.mp4
Save as `assets/video/s06-aniket.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack) holds out the blue book and asks the shopkeeper: "How much is this book?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise, and he lifts the book very slightly towards the shopkeeper and back. He finishes speaking by about 2 seconds, then waits with a smile, his mouth closed. The shopkeeper on the right (glasses, light-blue shirt, navy apron) listens with a friendly smile and blinks; his open hand stays where it is. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s06-shopkeeper.mp4
Save as `assets/video/s06-shopkeeper.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) answers the boy cheerfully: "It's eight hundred rupees!" His lips move in time with these words from the very first second, with natural mouth shapes; his head nods once, and his open hand makes a small, friendly gesture and returns to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s06-to-s07.mp4
Save as `assets/video/s06-to-s07.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame `story/aniket-gives-money-to-shopkeeper.webp` · 5 s · sound off
```text
At a bookshop counter, the boy (green T-shirt, navy backpack) hands the blue book "A Brighter Tomorrow" to the smiling shopkeeper (glasses, navy apron), who takes it. Then the boy takes out a few banknotes and holds them out to the shopkeeper. Both smile. Nobody talks. One smooth, natural sequence, ending exactly on the last frame. Camera still, moving only as little as needed to match the last frame. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The shelves, the signs and their words stay still and sharp. No added text, captions or speech bubbles.
```

#### s07-idle.mp4
Save as `assets/video/s07-idle.mp4` · start frame `story/aniket-gives-money-to-shopkeeper.webp` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, a boy on the left (green T-shirt, navy backpack) hands a few banknotes to the smiling shopkeeper on the right (glasses, navy apron), who holds the blue book. Both breathe gently and blink once or twice. Nobody talks. The banknotes and the book stay exactly where they are: do not move them. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### Screen 10: the ₹1000 shock

#### s10-aniket.mp4
Save as `assets/video/s10-aniket.mp4` · start frame `story/shocked-aniket.webp` · end frame: the same picture · 5 s · sound off
```text
Seen from just behind a boy's shoulder (navy backpack, green T-shirt), he holds the blue book close, shocked by its white "₹1000" price sticker, and exclaims: "One thousand rupees? What is this?" His open mouth moves in time with these words from the very first second, and his head jerks back slightly in surprise. He finishes speaking by about 4 seconds and stays shocked, his mouth slightly open as in the picture. The book and its "₹1000" sticker stay exactly in place, sharp and readable. The shopkeeper in the blurred background smiles and stays still. Start and end on exactly this picture. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screens 14–15: the discount

#### s14-shopkeeper-1.mp4
Save as `assets/video/s14-shopkeeper-1.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) explains to the boy, friendly and calm: "The price printed on the book is one thousand rupees," His lips move in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes a small explaining gesture and returns to exactly where it was. He finishes speaking by about 4 seconds, then pauses with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s14-shopkeeper-2.mp4
Save as `assets/video/s14-shopkeeper-2.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) goes on explaining to the boy, friendly and calm: "but you paid only eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his open hand moves gently down and back up to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s14-shopkeeper-3.mp4
Save as `assets/video/s14-shopkeeper-3.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame: the same picture · 4 s · sound off
```text
At a bookshop counter, the shopkeeper on the right (glasses, light-blue shirt, navy apron) finishes with a big, friendly smile: "So, you got a two hundred rupee discount." His lips move in time with these words from the very first second, with natural mouth shapes; he nods once, and his open hand makes a small, pleased gesture and returns to exactly where it was. He finishes speaking by about 3 seconds, then smiles with his mouth closed. The boy on the left listens, holding the blue book still, and blinks. Start and end on exactly this picture with the shopkeeper's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

#### s14-to-s15.mp4
Save as `assets/video/s14-to-s15.mp4` · start frame `story/aniket-gives-a-book-to-shopkeeper.webp` · end frame `story/what-is-a-discount.webp` · 4 s · sound off
```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, has just heard a word he doesn't know: his smile fades, his eyebrows go up and draw together, his eyes look up, and his face turns puzzled. Only his face changes. Nobody talks. The shopkeeper on the right, still smiling with his open hand out, stays as he is. Ends exactly on the last frame. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the pictures (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything else stays perfectly still. No added text, captions or speech bubbles.
```

#### s15-idle.mp4
Save as `assets/video/s15-idle.mp4` · start frame `story/what-is-a-discount.webp` · end frame: the same picture · 5 s · sound off
```text
At a bookshop counter, the boy on the left (green T-shirt, navy backpack), holding the blue book, looks puzzled and thinks to himself "Discount? What does that mean?" without saying it: his eyes glance up and to the side, his eyebrows knit and lift, his head tilts slightly, and he blinks. His mouth stays closed the whole time: he is only thinking. The shopkeeper on the right keeps smiling with his open hand still, and blinks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. All signs and printed words stay sharp and in place. No added text, captions or speech bubbles.
```

### Screens 20–21: out of the bookstore

Both clips come from one 6 s Gemini take, `outgoing.mp4`, cut 4.6 s in (frame 110), where Aniket is walking past the open door: Screen 20 plays everything before it and Screen 21 the rest, with a cut between them, so he never jumps. The prompt is the take's; to make it again, make it as one clip and cut it the same way.

#### s20-out.mp4
Save as `assets/video/s20-out.mp4` · start frame `story/bookstore-outside-view.webp` · end frame: none · 2 s · sound off
```text
In a shopping mall, in front of a bookstore with a big glass front and the sign "CHAUHAN BOOK STORE", the right-hand glass door is open and a boy (green T-shirt, navy backpack, blue jeans) walks out of the store towards us, stops in front of it and smiles. Then he turns to his left and walks off along the mall, past the glass front. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hairstyle, outfit, body shape and colours stay exactly the same. The sign and the store stay sharp and in place. No added text, captions or speech bubbles.
```

#### s21-walk.mp4
Save as `assets/video/s21-walk.mp4` · start frame `story/bookstore-outside-view.webp` · end frame: none · 4 s · sound off
```text
In a shopping mall, in front of a bookstore with a big glass front and the sign "CHAUHAN BOOK STORE", the right-hand glass door is open and a boy (green T-shirt, navy backpack, blue jeans) walks out of the store towards us, stops in front of it and smiles. Then he turns to his left and walks off along the mall, past the glass front. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hairstyle, outfit, body shape and colours stay exactly the same. The sign and the store stay sharp and in place. No added text, captions or speech bubbles.
```

### Screens 22–25 and 35: the sneakers

#### s22-aniket-1.mp4
Save as `assets/video/s22-aniket-1.mp4` · start frame `story/he-sees-a-shoe.webp` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers with one arm stretched out. He says happily: "These sneakers look good!" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise and his head nods slightly. He finishes speaking by about 3 seconds, then smiles with his mouth closed. His pointing arm, body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s22-aniket-2.mp4
Save as `assets/video/s22-aniket-2.mp4` · start frame `story/he-sees-a-shoe.webp` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), pointing at the blue sneakers on the display stand, notices the red "30% OFF" label on the display stand and asks, curious: "What does thirty percent off mean here?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise and draw together a little. He finishes speaking by about 3 seconds, then looks at the label with his mouth closed. His pointing arm, body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s22-aniket-3.mp4
Save as `assets/video/s22-aniket-3.mp4` · start frame `story/he-sees-a-shoe.webp` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), pointing at the blue sneakers on the display stand, wonders aloud: "Is this also a discount?" His lips move in time with these words from the very first second, with natural mouth shapes; his head tilts slightly as he thinks. He finishes speaking by about 3 seconds, then keeps looking at the sneakers with his mouth closed. His pointing arm, body and legs stay in the same pose. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s23-idle.mp4
Save as `assets/video/s23-idle.mp4` · start frame `story/he-sees-a-shoe.webp` · end frame: the same picture · 5 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers with one arm stretched out, smiling. He breathes gently and blinks once or twice; his pointing hand stays where it is. Nobody talks. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s23-zoom.mp4
Save as `assets/video/s23-zoom.mp4` · start frame `story/he-sees-a-shoe.webp` · no end frame (it ends close on the tags) · 6 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack) stands by the display stand, pointing at the blue sneakers. He lifts a finger as if he has spotted something, then points again, and the camera moves slowly and smoothly in towards the sneakers until the white "₹1800" tag and the red "30% OFF" label fill the middle of the frame. Nobody talks. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly the same, sharp and readable. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hair, clothes and colours stay exactly the same. No added text, captions or speech bubbles.
```

#### s25-idle.mp4
Save as `assets/video/s25-idle.mp4` · start frame `story/he-thinks-about-the-shoes.webp` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks at the sneakers' tags, puzzled. He breathes gently and blinks; his eyes move between the white "₹1800" tag and the red "30% OFF" label. Nobody talks: his mouth stays closed. The sneakers and both tags stay exactly in place, sharp and readable. Start and end on exactly this picture. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). His face, hair, clothes and colours stay exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s25-aniket-1.mp4
Save as `assets/video/s25-aniket-1.mp4` · start frame `story/he-thinks-about-the-shoes.webp` · end frame: the same picture · 4 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks at the sneakers' white price tag and says, thinking aloud: "The tag says one thousand eight hundred rupees." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows lift a little. He finishes speaking by about 3.5 seconds, then keeps thinking with his mouth closed. His hand stays on his chin. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

#### s25-aniket-2.mp4
Save as `assets/video/s25-aniket-2.mp4` · start frame `story/he-thinks-about-the-shoes.webp` · end frame: the same picture · 6 s · sound off
```text
In a shoe shop, a boy (green T-shirt, navy backpack), his hand on his chin, looks confused and asks himself: "With thirty percent off, how much do I actually pay?" His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows knit and lift, and his head tilts slightly. He finishes speaking by about 5 seconds, then keeps thinking with his mouth closed. His hand stays on his chin. The sneakers, the white "₹1800" tag and the red "30% OFF" label stay exactly in place, sharp and readable. Start and end on exactly this picture with his mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 36: the sneakers in their box

#### s36-box.mp4
Save as `assets/video/s36-box.mp4` · start frame `story/shopkeeper-gives-the-sneakers-box.webp` · no end frame (it ends on a new pose) · 5 s · sound off
```text
At a shoe shop counter, the shopkeeper (teal polo shirt, short beard) and a boy (green T-shirt, navy backpack) both hold an open orange-and-white box with new blue sneakers inside. The shopkeeper smiles, lets go of the box with a small nod, and the boy draws it a little towards himself with both hands, beaming, and looks down at the sneakers. Nobody talks. Small, calm movements; the box moves only a little. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Both faces, hair, clothes and colours stay exactly the same. The sneakers in the box stay the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 40: back home

#### s40-idle.mp4
Save as `assets/video/s40-idle.mp4` · start frame `story/boy-returns-home.webp` · end frame: the same picture · 5 s · sound off
```text
At home, a boy on the left (green T-shirt, navy backpack, a blue book held against his chest, a blue-and-white shopping bag in his other hand) has just come in; his father sits at the dining table on the right (light-blue shirt, moustache, a white tea cup and a newspaper). Both smile, breathe gently and blink once or twice. The shopping bag sways very slightly. Nobody talks. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s40-father-1.mp4
Save as `assets/video/s40-father-1.mp4` · start frame `story/boy-returns-home.webp` · end frame: the same picture · 4 s · sound off
```text
At home, the father at the dining table on the right (light-blue shirt, moustache, a white tea cup and a newspaper) looks up at his son and asks warmly: "How was your shopping?" His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his eyebrows lift, and he lowers his tea cup a little and brings it back to exactly where it was. He finishes speaking by about 2 seconds, then smiles with his mouth closed. The boy on the left listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s40-aniket.mp4
Save as `assets/video/s40-aniket.mp4` · start frame `story/boy-returns-home.webp` · end frame: the same picture · 7 s · sound off
```text
At home, the boy on the left (green T-shirt, navy backpack, a blue book held against his chest, a blue-and-white shopping bag in his other hand) answers his father happily: "Great! I learnt about marked price, discount and discount percentage." His lips move in time with these words from the very first second, with natural mouth shapes; his eyebrows rise, his head nods, and he lifts the shopping bag a little to show it, then lowers it back to where it was. He finishes speaking by about 6 seconds, then smiles with his mouth closed. The father on the right listens with a smile and blinks, holding his cup and newspaper still. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

### Screen 43: the money

#### s43-father.mp4
Save as `assets/video/s43-father.mp4` · start frame `story/father-gives-him-money.webp` · end frame: the same picture · 4 s · sound off
```text
At home by the dining table, the father on the left (light-blue shirt, moustache) holds out a fan of ₹500 notes to his son and says with a warm smile: "Here's five thousand rupees." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes, and his eyebrows lift. He finishes speaking by about 2.5 seconds, then smiles with his mouth closed. The notes stay exactly in place in his hand: do not move or change them. The boy on the right looks at the notes with wide, happy eyes and blinks; his open hand stays still. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. No added text, captions or speech bubbles.
```

### Screen 45: find the best deals

#### s45-idle.mp4
Save as `assets/video/s45-idle.mp4` · start frame `story/boy-stands-and-talks.webp` · end frame: the same picture · 5 s · sound off
```text
At home, the father sits at the dining table on the left (light-blue shirt, moustache), and his son stands by the table on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket). Both breathe gently and blink once or twice. Nobody talks. The father's hand stays where it is. Start and end on exactly this picture, so the clip loops seamlessly. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-father-1.mp4
Save as `assets/video/s45-father-1.mp4` · start frame `story/boy-stands-and-talks.webp` · end frame: the same picture · 5 s · sound off
```text
At home, the father at the dining table on the left (light-blue shirt, moustache) advises his son, warm and encouraging: "Use what you have learnt and find the best deals." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his head nods, and his open hand makes small explaining gestures and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket) listens with a smile and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-father-2.mp4
Save as `assets/video/s45-father-2.mp4` · start frame `story/boy-stands-and-talks.webp` · end frame: the same picture · 5 s · sound off
```text
At home, the father at the dining table on the left (light-blue shirt, moustache) adds with a playful smile: "Whatever is left after buying everything is yours." His lips move under his moustache in time with these words from the very first second, with natural mouth shapes; his open hand makes a small, generous gesture towards his son and returns to exactly where it was. He finishes speaking by about 4 seconds, then smiles with his mouth closed. The boy on the right listens, his eyes widening, and blinks. Start and end on exactly this picture with the father's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-aniket-1.mp4
Save as `assets/video/s45-aniket-1.mp4` · start frame `story/boy-stands-and-talks.webp` · end frame: the same picture · 4 s · sound off
```text
At home, the boy standing on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket), surprised and delighted, asks his father: "Really?" His lips move in time with this one word in the very first second; his eyebrows shoot up and his eyes widen. Then he grins with his mouth closed until the end. The father at the table on the left smiles and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```

#### s45-aniket-2.mp4
Save as `assets/video/s45-aniket-2.mp4` · start frame `story/boy-stands-and-talks.webp` · end frame: the same picture · 4 s · sound off
```text
At home, the boy standing on the right (green T-shirt, navy backpack, one hand on a strap, the other in his pocket) says excitedly, with a determined nod: "Then I'm definitely finding the best offers!" His lips move in time with these words from the very first second, with natural mouth shapes, and he squeezes his backpack strap. He finishes speaking by about 3.5 seconds, then grins with his mouth closed. The father at the table on the left listens with a smile and blinks. Start and end on exactly this picture with the boy's mouth closed. Camera locked: no zoom, pan or shake. Same 2D cartoon illustration style as the picture (clean outlines, soft flat colours, warm light). Every face, hairstyle, outfit, body shape and colour stays exactly the same. Everything not described stays perfectly still. The wall signs stay sharp and in place. No added text, captions or speech bubbles.
```
