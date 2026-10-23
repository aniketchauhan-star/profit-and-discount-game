# The revamp brief: what was done

The brief is `Bookstore Journey - Revamp Brief.docx` ("Changes for Screens 1–46"), with the text spreadsheet `Bookstore Journey - All Text (Screens 1-46).xlsx`. This file says what was done for each of its points, what was decided where the brief left a question open, and what is still to do. `PROMPT.md` describes the game as it is now, screen by screen.

**Screen numbers** here are the brief's. Screens 2, 4, 9, 24, 26 and 44 and the checkpoints on percentages and on the price after a discount were taken out on 2026-10-21 (the still screens at the user's request, the rest at the review meeting: `docs/MEETING-2026-10-21.md`), Screens 13, 16, 38 and 39 on 2026-10-22, and Screens 8, 12, 17, 18, 19, 31 and 33 on 2026-10-23, when the story from the bookstore's price to the sneakers' question was put in the order of the user's doc, with three new question cards and the amount to pay split in two (see `PROMPT.md`: each screen's heading gives its number in the game). The game has 47 screens.

## Part 1: rules for every screen

| Rule | State | What the game does now |
|---|---|---|
| 1. Animation | **Started** | Video clips made from the prompts in `Animation Video Prompts.md` (with Higgsfield's Seedance 2.5, or with Gemini) play in the game: a quiet loop between lines, a talking clip with each line, and a movement clip in place of a fade. 42 are in (Screens 1, 4 → 5, 5–8, 22–25, 35, 36, 40, 41, 42 → 43, 43, 45, 46 and 56). Each starts on its picture; Gemini's are cleaned first (`tools/gemini_clean.py`: the sparkle off, the framing back on the picture). Back, Next, Scenes-list jumps and reduced motion land on a clean frame. The rest wait for their clips. |
| 2. Speech bubbles | Done | Lines wrap by themselves into balanced lines of about 20–28 letters (a typed line break counts as a space, except after a short "Correct!" or "Not quite!"); weight 600, line spacing 1.3, the same padding on every side; keep-clear areas on 11 story pictures (faces, prices, tags, the book), which bubbles move around; a soft fade in with the whole line (no bounce, no "bloop", no letters jumping in), each word lit with the highlighter as it is said; 34 px, about 18 px on a 1024 px-wide tablet. On Screens 1–46 and the conversation back home (56); the shopping game's own bubbles are unchanged. |
| 3. Swifty | Done | No bubble when her words are on the screen (the voice stays, and what she reads lights up). Bubbles only for questions, hints, "Correct!" / "Not quite!", instructions and links. She comes only to introduce an idea (11, 16, 26, 37), ask or react (8, 13, 30, 31, 33, 34) and celebrate at a checkpoint; she is not there in the worked solutions (12, 17, 18, 28, 29, 32, 38, the working on 37), where her voice goes on by itself, and the content uses her room. |
| 4. Story → panel | Done | The picture zooms in on the key object, then shrinks into a framed photo on the left of the panel; the ₹1000 (11) and the 30% OFF tag (26) fly from it onto the panel. Going back, the photo grows back to full screen, and the result shows on the picture: the green ₹1260 tag (35). The notes "₹1000 → ₹800" (14) and "Discount = MP − SP" (20) were taken out: they covered the shopkeeper's first bubble and the shop's sign. |
| 5. Layout | Done, except the text sizes | The notebook style on the plain panel: prices on taped notes, definitions on lined index cards, working on graph paper with the answer circled in red, formulas on yellow sticky notes, a green marker tick for a right answer and a grey cross-out for a wrong one. Five layouts (Concept, Definition, Worked example, Question, Summary / checkpoint), since 2026-10-21 all **under the photo and spread across the panel**, bigger, clear of Swifty, with words in full lines and colours that stand out on the panel (each box an edge in its own colour), at the user's request. Every step stays clear (the earlier ones no longer fade, and the progress bar at the top was taken out, both at the user's request). The screens have no Next buttons of their own: after an explanation they move on by themselves 5 seconds later. **Text sizes**, measured on each screen once it has finished: the checkpoints now use four (26 labels, 38 text, 46 terms, 56 title, amounts and formula), and 8, 11–13, 16, 18, 26, 28 and 38 use 3–4. 17, 27, 29–34 and 37 still use 6–9 (see *Still to do*). |
| 6. Colours | Done for the new look | One palette of named CSS variables, and no colour typed in the revamp's styles; Part violet and Whole olive; one look for every question strip and every rule band; a wrong answer grey and crossed out with ✗; prices in ink unless MP, SP or Discount; one effect at a time; sparkles only for a right answer or a checkpoint; ✓, ✗ or a label with every colour. The older styles (mostly the shopping game's) still type their colours. |
| 8. Checkpoints | Done, then changed at the review meeting (2026-10-21) | Two are left, after 19 and 39 (the ones on percentages and on the price after a discount were taken out as repetition). Both centred on the panel and big: the topic, ticked ✓ when done; "Let's remember!"; 2–3 lined index cards and one formula on a sticky note, read out with no bubbles; the tick, the note flying into the notebook, sparkles (and Swifty's bubble on 39). No example and no buttons: each moves on by itself 3 seconds after it is done. What to remember now shows only after a wrong answer, with a second try (30, 31, 34), not at the start of a topic. |

## Part 2: screen by screen

| Screen | Asked | Done |
|---|---|---|
| 1 | Animation; new bubbles | Done: the quiet loop (Dad sips his tea) and a talking clip for each of the three lines. |
| 2 | Still, unless decided otherwise | Kept still. |
| 4–5 | Picking up the book as one movement; the book names sharp | Screen 4 was taken out (2026-10-21), and its clip with it: Screen 3 fades into 5. The book names stay on their covers; Screen 5 has its quiet loop and talking clip. |
| 6–7 | Handing over the book and the notes; ₹800 just above the money | Screens 6 and 7 talk and breathe (the notes stay under the ₹800 badge). The hand-over clip, `s06-to-s07`, is to be made again: it started on Screen 7's picture. |
| 8 | Photo instead of hiding the counter; notebook-style answers; SP blue; Swifty stays; read the question aloud? | Done. The question is still not read aloud (open question, below). The wrong-answer hint is now "Not quite! …" (the spreadsheet's must-fix). |
| 9–10 | The ₹1000 shock as a movement | Screen 9 was taken out (2026-10-21): Screen 8's photo grows back out into 10. Screen 10's talking clip is still to make. |
| 11 | Photo; ₹1000 flies; Swifty stays; "It is called the Marked Price (MP)" voice only; amber | Done. |
| 12 | No Swifty; lined index card | Done. |
| 13 | Two lines voice only, the question kept; taped notes; one arrow colour | Done (every arrow is grey now). |
| 14–15 | The result on the picture going back; the shopkeeper's hands, Aniket's face as movements | "₹1000 → ₹800" on the picture: taken out (it covered the shopkeeper's first bubble). Movements: not done. |
| 16 | The thought becomes the heading; Swifty stays | Done: the thought lifts from where the cloud was to the top of the panel. |
| 17 | No Swifty; the bar ₹1000 = ₹800 paid + ₹200 discount | Done. |
| 18 | No Swifty | Done. |
| 19 | Checkpoint 1 | Done. |
| 20 | "D = MP − SP" on the picture | Done ("Discount = MP − SP", the checkpoint's own note). |
| 22–25 | One movement; tags sharp; the question to the top on 26 until 34 | The question: done (answered "→ ₹1260 ✓" on 34; the "Aniket asks" label over it was taken out). The shoe shop is all video: on 22 Aniket points at the sneakers and talks (the picture his clips start on, instead of walking in), on 23 the camera moves in on the ₹1800 and 30% OFF tags, then his thinking loops on 24 and 25 and his two lines on 25. Not done: the movement from 24 to 25 (to make on Higgsfield, which takes an end frame). |
| 26 | Photo; the tag flies; Swifty stays | Done. |
| 27 | Checkpoint 1's card first; the bubble kept; a small sneakers card in a corner until 30 | Done. The "sneakers card" is the photo itself, zoomed on the sneakers and both tags, on every screen 26–34 (and 37–38). |
| 28–29 | No Swifty, words lit as said; new Part / Whole colours; one question strip colour; 10 × 10 grid | Done (the grid on 29). |
| 30 | Swifty stays; the grid shows 25%; Checkpoint 2 after | Done. |
| 31 | Checkpoint 2's card first; Swifty stays; two lines removed | Done. |
| 32 | No Swifty; the bar of 10 × ₹180, 3 shaded; graph paper, ₹540 circled | Done. |
| 33 | Swifty stays | Done. |
| 34 | Swifty only for the drag and its hints; the working voice only; the bar ₹1260 / ₹540; one rule band colour | Done. Before the working, the screen's question is hers too: she says what to find and reacts to the answer in bubbles, and reads the question and its hint with none. The working has no bubbles. The question's own sneakers picture is gone (the photo shows them). |
| 35 | The green ₹1260 tag kept; Checkpoint 3 after | Done. Checkpoint 3's Discount card shows the sneakers' working, "30% of ₹1800 = 30/100 × 1800", which Swifty's recorded lines read, rather than a general "Discount = % × Marked Price" (that would need new words and new recordings: for the content team). |
| 36 | The box handed over as a movement | Done: the shopkeeper hands the box over in the clip; the chime plays as Aniket takes it, and the light sweeps over the box once it's in his hands. |
| 37 | Checkpoint 3's card first; the sneakers card; Swifty introduces, then leaves; Part → Discount red, Whole → Marked Price amber | Done. |
| 38 | No Swifty; the same rule band as 34 | Done. |
| 39 | Checkpoint 4; no repeated bubbles; Swifty only to celebrate | Done. |
| 40, 41, 45 | Talking loops | Done: a quiet loop and a talking clip with each line (the father's second line on 41 and 45 uses his first clip until its own is made). The new bubbles: done. |
| 42–44 | One movement: the list, the notes, the pocket | The list, then the notes: done (42 → 43), and the father talks on 43. Screen 44 (into the pocket) was taken out (2026-10-21): 43 fades into 45. |
| 46 | A small movement on Aniket; optional notebook cards as "your tools for shopping" | Aniket waves: done. The notebook cards: not done. |

## Language check

- **Lines to fix already:** done.
  - Screen 25: "The tag says ₹1800." and "With 30% off, how much do I actually pay?"
  - Screen 38: "…of the marked price is taken off."
  - "Marked Price" or "marked price": the spreadsheet's style rule 1 (capitals on cards and labels, small letters in sentences), on 11 lines.
  - Also from the spreadsheet: "Think again." became "Not quite!" (its must-fix), and "It's" got the curly apostrophe.
- **Four recordings to make:** the four lines whose words changed (`docs/VOICEOVER.md`, *To record next*). Until then the device's voice reads them. The brief asks for one recording batch after the language review, so they wait for it. The other changed lines only changed capital letters or an apostrophe, so their clips were kept.
- **The logger:** `js/linelog.js`, on with `?log=right` or `?log=wrong`. It saves every line as it appears: spoken lines with their speaker, bubble type and clip, and the words written on each screen. **L** saves a spreadsheet; both paths are merged, with "All", "Right answer" or "Wrong answer" on each line. How to use it: `docs/VOICEOVER.md`, *Checking the language*.
- **Every path, played:** every question answered right, then every question answered wrong first, plus wrong boxes in the drag and "Hear it again". The result is `Bookstore Journey - Lines for the language check.xlsx`, with screen, speaker, type, text, path, clip and the words that must not change.
- **`Language Review Prompt.txt`:** the brief says it is in this folder, but it wasn't, so it was written: fill in the grade first.
- **Next, for the team:** run it through ChatGPT, have the content team check every suggestion, change only what is needed, record all changed lines in one batch, run `vo_build.py --check`, and play the whole game again.
- **The spreadsheet's other suggestions** ("Should change" and "Optional") are not made yet (except "We can write it in short." → "Let’s write it in short.", made at the user's word on 2026-10-22): they wait for the content team, as the brief says. For example: "article" → "item", "₹200 reduced" → "₹200 off", "30% Discount." → "a 30% discount.", "1000 is the whole." → "and 1000 is the whole.", and Screen 8's full question.

## Small fixes

- PROMPT.md's clip count: 136 lines (132 clips now, plus the 4 to record).
- `vo_build.py` prints UTF-8 itself, so `--check` runs in a Windows terminal. Checked with a Windows code page: the old script crashed, the new one doesn't.
- index.html no longer shows "1 / 4" before the script loads.
- PROMPT.md's facts: the discount's red starts at Screens 14–15, and Swifty's screens are the new ones.
- PROMPT.md is updated for every change.
- Found while testing, and fixed: leaving a screen in the middle of a line could let the next line start on the following screen. For example, pressing "Got it, next" while "Hear it again" was reading made the next card's line play over Screen 20. A line now starts only while its screen is on.

## The brief's questions: what was done meanwhile

| Question | Meanwhile |
|---|---|
| Screen 2: still, or a little movement? | Kept still, then taken out (2026-10-21, with the other still screens 4, 9 and 44). |
| Animation: AI-made video, or hand-made / rigged only? | Nothing made until it is decided (see *Still to do*). |
| Which tablets and browsers? A size limit? | Not known. Bubble text is about 18 px on a 1024 px-wide tablet (small labels, such as "REMEMBER", are 12–15 px there). The voice clips are Ogg Opus, and the device's voice reads them where that can't play (older Safari). The game is about 2 MB of voice plus the pictures. |
| When Swifty isn't needed: remove her, or keep her small and quiet? | Removed: she and her books rise in when needed and go back down after. |
| Typing letter by letter, or the whole line with each word lit? | The whole line, each word lit (the brief's suggestion). Still to test with a few children. |
| Bar models and 10 × 10 grids: does the content team agree? | Added (17, 29, 30, 32, 34) for the content team to check. |
| The notebook now, or only the checkpoints? | A simple notebook: each checkpoint's cards and formula, opened any time. |
| Auto-play on by default? | Kept on. Checkpoints wait for the player anyway. |
| Which grade? | Not known: left as [GRADE] in the prompt. |
| The "previous files" for layout ideas | Not shared yet. The design board (`design/hand-made design board.png`) was used. |

## Still to do

0. **The review meeting of 2026-10-21** (`docs/MEETING-2026-10-21.md`): its changes are in, except two that wait for a yes: the
   pop-up over the blurred story for every teaching screen (tried on Screen 25's "30% OFF means 30% Discount"), and making the
   Gemini clips again on Higgsfield (the list: `Animation Video Prompts - Left to Make.md`; it spends credits).

1. **The rest of the animation clips:** 12 of 54 are still to make (`Animation Video Prompts - Left to Make.md`): the movements on Higgsfield (Gemini can't be given an end frame), `s06-to-s07` again among them; Screens 10, 14 and 15; and the father's second lines on 41 and 45. Each one plays in the game as soon as it is brought in.
2. **The language review** with ChatGPT and the content team (above), then one recording batch.
3. **Text sizes:** bring Screens 17, 27, 29–34 and 37 down to the checkpoints' four sizes (26 / 38 / 46 / 56). They use 6–9 now: the question on top, the bubbles, the working, the answers, the bar's labels and the key number. The checkpoints were done first, as the sample. The rest changes how those panels look, so it waits for your OK on them.
4. **The older styles' colours** (mostly the shopping game's): still typed directly, not yet named variables.
5. Screen 46's optional notebook cards ("your tools for shopping").
6. **Try the word highlight with a few children** (the brief's question 5).

## Animation: the clips

Every clip (its start and end pictures, its length, its prompt, the words it says and its file name) is in `Animation Video Prompts.md`, which replaced the shot list that was here. What is already in the game, and what is to be made again, is at its top.
