# Voiceover

Every line the game speaks is a recorded clip, built into the game so that each line's text appears in step with its voice. The clips are in `assets/vo/`, one Ogg Opus file per line. Since 2026-10-26 Swifty's clips are cut from the user's own recording, and Aniket's, his father's and the shopkeeper's are made on the Mac with an open-source voice model, each cloned from his studio voice: see [The voices now](#the-voices-now-2026-10-26). The earlier clips were made with the TTS studio **Ai Wala Human By Aamir** (below).

| What | Where |
|---|---|
| Clips (Ogg Opus, 32 kbps, mono) | `assets/vo/vo001.ogg` … |
| Script: each line as shown, as spoken, who says it, the Devanagari sent to the voice | `tools/vo_script.json` |
| Line → clip map (generated) | `js/vo_lines.js` |
| Player | `js/voice.js` (typing in step: `js/fx.js`, `type`, `revealDefinition`) |
| Rebuild tool | `tools/vo_build.py` |
| Swifty's recording, and the scripts that cut it and make the other voices (with their references) | `source/swifty.mp3`, `tools/voices/` |
| Line log, for the language check | `js/linelog.js` (see [Checking the language](#checking-the-language-the-line-log)) |

## The voices now (2026-10-26)

Every line heard in the game has its clip (a line said in parts for the read-along is one clip a part), from two sources. The user's words: "this is Swifty's voice; make the dad's, the shopkeeper's and the boy's voices, nicely".

- **Swifty: the user's own recording.** `source/swifty.mp3` (7 minutes: her 82 lines, `tools/voices/swifty_lines.txt`, read in that order) is cut into her 109 pieces by `tools/voices/swifty_cut.py`. Whisper (whisper.cpp, `large-v3-turbo`) gives the words' times on the recording cut at its pauses; a line in parts ("The price printed on an item" / "is called its marked price.") is cut in the pause between them, and each piece trimmed to its voice. Where she ran two pieces together ("Discount" / "equals Marked Price,", "125 ÷ 500 × 100" / "= 25%."), or whisper's times put a cut inside a word, the cut is placed by hand (`tools/voices/swifty_cuts.json`) at the quietest dip between the words, checked by transcribing the sound on each side. Where she says a piece twice ("Not quite!", "Correct!", "250 ÷ 1000 × 100 = 25%."), the take in a clause of its own is used. Checked: whisper hears exactly its words in 106 of the 109; in the other three it adds a word that isn't in the clip (the next one has it) or hears the name as "Anakit". In three lines ("Yes! Aniket paid…", "Aniket bought the book…", "To calculate how much Aniket…") whisper hears the name as "Anakate": worth a listen.
- **Aniket, his father and the shopkeeper: made on the Mac** by `tools/voices/voices.py` with **Chatterbox** (Resemble AI's open-source voice model, MIT licence: free to use in the game), each cloned from his studio voice, shaped first with the WORLD vocoder as `tools/vo_deepen.py` does (the references: `tools/voices/refs/`): **Aniket** younger (pitch × 1.25, a shorter throat × 1.10: a boy's voice, about 240 Hz; the studio's "Male Child" was nearer a teenager, about 185 Hz), **the shopkeeper** deeper (pitch × 0.66, a longer throat × 0.88: about 125 Hz; his studio clips were at about 195 Hz, a woman's range, as noted below), **the father** as he was (about 120 Hz). Each line is made again (up to six takes) until a take has exactly its words (whisper) and its pitch in his range; of those, the one most like his voice is kept. The three are distinct: each take is much nearer its own speaker's voice than the other two's (speaker embeddings). The spoken forms are as before (`spoken` in `tools/vo_script.json`: amounts in words).
- **Four of Swifty's lines weren't in her recording**: "You bought this shirt already!" (and the bottomwear, the watch, the sunglasses: vo174, vo180, vo186, vo192), heard only when a shop is opened again from the scene list after it was bought. They are made the same way, cloned from four of her clips in the recording (`tools/voices/refs/swifty.flac`, as they are, not shaped); a recording of them by the user can take their place.
- **The shops became "pick the better deal"** (the user's showrooms, later on 2026-10-26: two things in each, see `docs/PROMPT.md`), with 23 new lines of Swifty's, made the same way (cloned from her recording, each checked for its exact words): vo199–vo202 ("Which shirt is the better deal? Tap it!" …), vo203 ("Not quite! Work out both sale prices."), vo204–vo211 (each thing worked out: "Blue shirt: ₹1,200 − ₹240 = ₹960." …), vo212–vo215 ("Correct! The green shirt costs ₹110 less." …), vo216–vo219 ("Great! You bought the green shirt!" …), and the end's vo220–vo221 ("Total amount: ₹4,470.", "Money left: ₹530."). The shops' lines before them (vo169–vo173, vo175–vo179, vo181–vo185, vo187–vo191: each thing's price, its question, its hint, "Great! The sale price is …", "Great! You bought …"; and vo194–vo195, the old totals) are no longer heard; their clips stay, unused.
- **Aniket, his father and the shopkeeper made again, livelier, and laid on the films' lips** (2026-10-28, the user: "too fast", "the conversation should look like a conversation, not reading type", "sync the video characters' lips with the text"; and later the same day, of the films' 2-second breaks: "lagging and awkward"): their 30 lines, by the same tool with livelier settings (`tools/voices/voices.py`: more expression, a lower guidance weight, which the model's makers advise for a calmer pace). The films now play evenly a little slower than their takes (`tools/flow_import.py`, `PACE`), and each line said on a film is made to its character's lips: `tools/flow_import.py --timing` writes into `tools/voices/lengths.json` when the lips move (each stretch between their pauses, at the film's pace), and the tool cuts the voice at its own pauses into as many phrases and starts each phrase as the lips start it, each stretched by at most 15% (ffmpeg's `atempo`, the pitch kept). The take that fits with least stretch is kept; where none did, slower ones were made (`SEED=3000 EXAG=0.8 CFG=0.15`). The two lines said on no film (vo141, vo167) are as long as a calm pace (the boy about 3.8 syllables a second). Their speech bubbles show the whole line while it is said, with no word lighting up (Swifty's still light up). To make one again: delete its clip from the output folder and run `TARGETS=tools/voices/lengths.json ~/.cache/bj-voices/venv/bin/python tools/voices/voices.py OUT voNNN` (it uses the takes already in OUT), then `tools/voices/finish.py` and `tools/vo_build.py`.
- **The mall, back out of a shop** (2026-10-28, the user: "Swifty and the controller show only when Swifty says this is the controller"): she says it each time the mall comes, so a line for coming back: "Use the controller to walk to the next shop!" (vo242, made the same way, cloned from her recording).
- **Each shop's two selling prices first** (the user, 2026-10-27: tap either thing, its selling price on a card, a hint, another, then the answer; the other's the same; then buy the better deal), with 19 new lines of Swifty's, made the same way (cloned from her recording, each checked for its exact words and her pitch): vo223, vo228, vo233 ("Tap a shirt to find its selling price!", "Tap one to find its selling price!", "Tap a watch to find its selling price!"); each deal's first hint, what to work out (vo224, vo225, vo229, vo230, vo234, vo235, vo238: "Not quite! The discount is 20% of ₹1,200.", "Not quite! Take ₹150 off ₹1,000." …; the second hint is its sum, vo204–vo211, as before); "Let’s check the selling price of the green shirt!" and the seven others (vo226, vo227, vo231, vo232, vo236, vo237, vo239, vo240); and a wrong Buy's "Not quite! Buy the one that costs less." (vo241). "Not quite! Work out both sale prices." (vo203) is no longer heard; its clip stays, unused. A recording of these by the user can take their place.
- **The mall's controller** (the user's, 2026-10-26, in place of the arrows): Swifty's line there became "Use the controller to walk into a shop!" (vo222, made the same way); the recorded "Use the arrows to walk into a shop!" (vo168) is no longer heard.
- **Every new clip** (`tools/voices/finish.py`): 0.3 s of silence before the voice and 0.4 s after it, as the studio's clips had (the game's typing is timed to that); as loud as Swifty's recording (−16 LUFS), never over −1 dBFS; then `python3 tools/vo_build.py voices.zip` as before.
- **To make a changed line again** in the same voice: change its `line` and `spoken` in `tools/vo_script.json`, then `~/.cache/bj-voices/venv/bin/python tools/voices/voices.py OUT voNNN` (Aniket's, his father's or the shopkeeper's), `tools/voices/finish.py voices.zip OUT` and `python3 tools/vo_build.py voices.zip`. Swifty's lines come from the user (her recording); a new one can be cut the same way. The voice model's files are cached in `~/.cache/huggingface` (about 4 GB) and its Python in `~/.cache/bj-voices/venv`; nothing is played while they work.
- **The lines the game no longer says were taken out** (2026-10-26, with their clips; they are in git's history): 79 lines. They are the first shops' sale-price questions (vo168–vo173, vo175–vo179, vo181–vo185, vo187–vo191, vo193–vo195), the father's "That’s useful, because you have another shopping job." and the talk about school (vo129–vo131), and the lines of screens taken out before (vo007–vo025, vo033, vo040–vo045, vo047, vo051, vo052, vo063, vo077–vo079, vo088–vo090, vo092, vo093, vo113–vo126). They were found by playing every screen silently, every answer wrong and then right (every shop both ways), and searching the code for each line; lines heard only on a rarer path stay (a second wrong answer on the quick check, an amount dropped on the wrong box, a shop opened again after buying, the bottomwear's wrong pick). The other lines keep their ids: **143 lines, every one with its clip** (2.2 MB).

## What was to record (all made on 2026-10-26)

The language fixes (the revamp brief's "lines to fix already", and the text spreadsheet's must-fix on screen 8) changed the words of four lines. Their old clips said the old words, so they were taken out (they are in git), and until the four are recorded the device's voice reads them. `python3 tools/vo_build.py` lists them as "no clip yet".

| Clip | Speaker | Screen (the brief's) | Was | Now (spoken as) |
|---|---|---|---|---|
| vo007 | Swifty | 8 (a wrong answer) | Think again. The shopkeeper sold the book for ₹800. | Not quite! The shopkeeper sold the book for ₹800. ("…for eight hundred rupees.") |
| vo048 | Aniket | 25 | The price tagged is ₹1800. | The tag says ₹1800. ("…one thousand eight hundred rupees.") |
| vo049 | Aniket | 25 | Using 30% OFF! How much money I actually have to pay? | With 30% off, how much do I actually pay? ("With thirty percent off, …") |
| vo114 | Swifty | 38 (40 in the game) | of the marked price has been reduced. | of the marked price is taken off. |

(vo007 and vo114 were never made: their screens are gone, and on 2026-10-26 they were taken out of the script with the other lines the game no longer says.)

The brief asks for every changed line to be recorded in **one batch**, after the content team has checked the language review's suggestions (below). Then: `python3 tools/vo_build.py --xlsx vo007 vo048 vo049 vo114` (plus any other changed lines), the studio as in [Remaking a line](#remaking-a-line), `python3 tools/vo_build.py --check`, and the whole game played again.

Twelve other lines only changed their capital letters or apostrophe, so their words sound the same and their clips were kept (only `line` changed in `tools/vo_script.json`, as the text spreadsheet's style rules 1 and 7 suggest): *selling price*, *marked price* and *discount* in small letters inside a sentence (vo012, vo013, vo016, vo018, vo019, vo020, vo041, vo042, vo090), capitals on a label (vo119 "Marked Price: ₹1800.", vo122 "Selling Price: ₹1260."), and the curly apostrophe in vo006 ("It’s ₹800!").

### The user's doc of 2026-10-23: 26 new lines, and two changed

The bookstore and the sneakers were re-ordered to the user's doc (see `docs/PROMPT.md`), with new words. These lines have no clip yet (the device's voice reads them); record them in the same batch: `python3 tools/vo_build.py --xlsx vo048 vo049 vo139 vo140 vo141 vo142 vo143 vo144 vo145 vo146 vo147 vo148 vo149 vo150 vo151 vo152 vo153 vo154 vo155 vo156 vo157 vo158 vo159 vo160 vo161 vo162 vo163 vo164`.

| Clip | Speaker | Game screen | Line |
|---|---|---|---|
| vo139 | Aniket | 4 | It is too costly, uncle. |
| vo140 | Shopkeeper | 4 | Check the printed price on the book. |
| vo141 | Aniket | 5 | Oh! The price printed on it is ₹1000. |
| vo142, vo143 | Swifty | 6 | The price printed on an item / is called its marked price. (two parts) |
| vo144 | Swifty | 7 (a wrong answer) | Not quite! Check the price printed on the book. |
| vo145 | Swifty | 7 (the right one) | Correct! The price printed on the book, ₹1000, is its marked price. |
| vo146–vo148 | Shopkeeper | 8 | See, the price printed on the book is ₹1000, / but I am selling it to you at ₹800. / I gave you a discount. |
| vo149 | Aniket | 9 | Discount? What is that? |
| vo150, vo151 | Swifty | 9 | The reduction given on the marked price of an item / is called a discount. (two parts) |
| vo152 | Swifty | 10 (a wrong answer) | Not quite! ₹800 is the shopkeeper’s selling price. |
| vo153 | Swifty | 10 (the right one) | Yes! Aniket paid ₹200 less than the marked price. |
| vo154 | Aniket | 13 | Thank you, uncle! |
| vo155, vo156 | Swifty | 15 | Aniket bought the book and understood the discount. / Let’s help Aniket buy the sneakers! |
| vo157 | Aniket | 16 | Wow, nice sneakers! I love them. |
| vo048 (changed again) | Aniket | 18 | The price tagged on it is ₹1800. |
| vo158 | Swifty | 19 (a wrong answer) | Not quite! Check the price tagged on the sneakers. |
| vo159 | Swifty | 19 (the right one) | Correct! ₹1800 is the price tagged on the sneakers: their marked price. |
| vo049 (changed again) | Aniket | 20 | If this is a discount, how much do I actually have to pay? |
| vo160 | Swifty | 20 | 30% discount here. (after vo050 "30% OFF means") |
| vo161 | Swifty | 21 | To calculate how much Aniket has to pay for these sneakers, (then vo053) |
| vo162 | Swifty | 22 (at its end, before the example) | Let’s have some practice! |
| vo163 | Swifty | 25 | How much does Aniket have to pay? |
| vo164 | Swifty | 26 | So, the discount is ₹540. |

The lines of the screens taken out (vo007–vo013, vo015–vo020, vo025, vo040–vo044, and those of the questions "Now, what is 30% of ₹1800?" and "What does ₹540 represent here?") and the old words of the changed ones (vo014, vo021–vo024, vo045, vo047, vo051, vo052) are no longer heard; their clips were kept, in case those screens come back.

"Let’s take an example!" (vo063) is no longer heard either: "Let’s have some practice!" takes its place at the end of game screen 22. The formula screens (11 and 12) came back the same day: their lines (vo026–vo039, with vo138 "Let’s write it in short." still to record) are heard again.

### Party Prep (games 32–41, 2026-10-23): 34 new lines

The joystick mall (see `docs/PROMPT.md`, *Party Prep*). The father and son's talk uses their recorded lines and clips (vo132–vo136). New, read by the device's voice until they are recorded: `python3 tools/vo_build.py --xlsx vo165 vo166 vo167 vo168 vo169 vo170 vo171 vo172 vo173 vo174 vo175 vo176 vo177 vo178 vo179 vo180 vo181 vo182 vo183 vo184 vo185 vo186 vo187 vo188 vo189 vo190 vo191 vo192 vo193 vo194 vo195 vo196 vo197 vo198`. Aniket's: vo165–vo167 (the message, the mall); the rest Swifty's: how to walk in the mall; in each shop what it costs, its question, its hint, "Great! The sale price is …", "Great! You bought …", and "You bought … already!" (only when a shop is opened again from the scene list); "Take your time and look around!"; the total, the money left, and the end. (The lines of the first Party Prep, never recorded, were taken out of the script.)

## The studio and its settings

- Studio: <https://ai-wala-human-by-aamir-809572708022.asia-southeast1.run.app/>, tab **Batch Generation**. It takes an `.xlsx` sheet with a header row and two columns: `filename` (the clip id) and `text` (the spoken form).
- **Language: Hindi.** The studio first rewrites each line in the language's script (with `gemini-3-flash-preview`), then speaks that (with `gemini-3.1-flash-tts-preview`). English written in Devanagari ("Meet Miso!" → "मीट मिसो!") is spoken as English with an Indian accent: the words stay English, which is what this game wants. **English** would give a neutral accent instead.
- **Voices**, one per speaker (each speaker's lines go in a batch of their own):

  | Speaker | Studio voice | Gemini voice |
  |---|---|---|
  | Swifty (every teaching line) | Female Teacher (Standard) | Kore |
  | Aniket | Male Child (Energetic) | Puck |
  | The shopkeeper | Male Teacher (Formal) | Charon |
  | Aniket's father (screens 1, 40, 41, 43 and 45) | Male Senior (Pedagogical) | Fenrir |

  The studio's 12 voice names are 6 Gemini voices (two names each), and only Puck, Charon and Fenrir are men's voices: one for each man or boy in the story. A new male character would have to share one.

  **The father's clips came out in a woman's range** (about 240–270 Hz, higher than the Mac's Tara; a man speaks at about 85–155 Hz), so they sounded like a woman. `python3 tools/vo_deepen.py Father` gives them a man's voice: with the WORLD vocoder, the pitch × 0.52 and the voice's colour (its formants) × 0.85, the same length and loudness (vo002 now about 115 Hz). Each clip it has done is marked in the file, so running it again changes nothing; **clips remade in the studio need it again.** It needs numpy and pyworld. The shopkeeper's clips measure as high (about 250 Hz): `tools/vo_deepen.py Shopkeeper` would do the same for him. For a line with no clip, the device's voice takes a man's voice for a man's part from any language it has before a woman's (js/voice.js).

- Format **.MP3** (the studio's files are 24 kHz, mono, 128 kbps); Text Column `text`, Filename Column `filename`, Start Row 1, Quantity = the number of rows, Concurrency **3 (Recommended)**. The download, **DOWNLOAD ALL (.ZIP)**, is `voiceovers_batch.zip`, holding `voiceovers/<filename>.mp3`.
- Clip ids `vo001`, `vo002` … are numbered in the order a player first hears the lines (each question's wrong answer first, then the right one); `python3 tools/vo_build.py --renumber` keeps them so after lines are added or removed (see below).

## The rate limit

The studio's proxy allows **100 requests per 15 minutes per IP**, and each line takes two (the rewrite, then the voice), so about **48 lines per window**. Its replies carry `ratelimit-limit`, `ratelimit-remaining` and `ratelimit-reset` (seconds); over the limit it answers `429 Too many requests from this IP`. Never try to get around it: make each batch at most `floor(remaining ÷ 2) − 1` rows (at most 48), and wait out `ratelimit-reset` plus 30 s before the next. The first 108 lines took three windows; the later runs (the two lines made again, below, and the conversations on screens 1 and 40–45) were small enough to fit in one.

## The spoken form

The voice reads exactly what it is given, so the **spoken** form writes maths and symbols out in words; the text on screen (the **line**) never changes.

- `=` "equals", `+` "plus", `−` "minus", `×` "times", `÷` "divided by"; a fraction `30/100` "thirty over one hundred"; `%` "percent" (`Discount %` "Discount percentage").
- Rupees and numbers as **English words**: `₹1800` "one thousand eight hundred rupees", `a ₹200 discount` "a two hundred rupee discount". Digits are never sent: the studio's rewrite sometimes turns a digit into a Hindi number word (3 → तीन, 50 → पचास), and the voice then says it in Hindi.
- Short forms letter by letter: `MP` "M P", `SP` "S P", `CP` "C P"; `the Marked Price (MP)` "the Marked Price, M P".
- Commas where a teacher pauses, so the grouping is heard: `250 ÷ 1000 × 100 = 25%.` "Two hundred and fifty divided by one thousand, times one hundred, equals twenty-five percent."
- A part that finishes a sentence begun by the part before starts in lower case (`30 out of 100.` "thirty out of one hundred."), so it is said as one sentence.

### The Devanagari check

The rewrite the studio sends to the voice is kept for every line (`devanagari` in `tools/vo_script.json`, and the table below). `python3 tools/vo_build.py --check` flags:

- Hindi number words (एक दो तीन … बीस तीस चालीस पचास सौ हज़ार, and compounds such as सैंतीस, पचहत्तर) and digits;
- common Hindi words, i.e. an English word translated rather than written out (e.g. **और** for "or": it means "and" and is said "aur");
- a pace outside 6–22 characters of the spoken form per second. Seven very short lines ("I will!", "Discount", "So, D", "= MP", "− SP.", "a is the part,", "Really?") fall below 6 because every clip carries about 0.3 s of silence before the voice and 0.4 s after it; measured without that silence they are 7–11 characters per second, except "= MP" (5), where the voice pauses briefly before "M P". Across all 108 clips, without the silence: 5–22 characters per second, 15 on average.

Also read the Devanagari by eye for names, possessives ("Aniket’s" अनिकेत्स) and ordinals, and check each clip's sound by measurement (its silences, its level, no click at its ends). A flagged line gets a corrected spoken form and is made again; repeat until the check is clean.

Made again so far (the ids in bold are the clips' ids now; ids in brackets are as they were when the change was made):

- **vo017** (the Marked Price definition): on the first run its "or" came out as **और** ("aur", Hindi for "and"), so the voice said "marked aur printed". Written "marked, or printed," it came out as **ऑर**.
- **vo095** ("subtract the discount from the marked price."; vo086 when it was made): a click in its last 20 ms. The second take ends cleanly.
- **Aniket's thought on screen 25 taken out, and twelve lines added for screens 26, 34 and 37**: the thought "What does 30% discount mean here?" (vo048 then) is gone from the game, so its clip went too. The new lines are all Swifty's (Female Teacher (Standard)): **vo050–vo051** (screen 26, read out from the panel: "30% OFF means" / "30% Discount.", spoken "Thirty percent off means" / "thirty percent discount."); **vo091–vo093** (screen 34: "Now, let’s find out how much money Aniket needs to pay.", "What will be the Selling Price?" and "Hint: SP = MP − Discount.", spoken "Hint: S P equals M P minus Discount."); and **vo104–vo106, vo109–vo112** (screen 37: "540 is what percent of 1800?", "540 is the part,", "and 1800 is the whole.", "So, 540 is 30% of 1800!", "Here, the part is the discount,", "and the whole is the marked price." and "So, Discount % = Discount ÷ Marked Price × 100.", spoken "So, Discount percentage equals Discount divided by Marked Price, times one hundred."). "540 ÷ 1800 × 100" and "= 30%." are now first heard on screen 37, so they moved up in the script (**vo107–vo108**). `--renumber` gave every line its place (vo049–vo050 → vo048–vo049, vo051 → vo052 … vo089 → vo090, vo090 → vo094 … vo099 → vo103, vo100 → vo113 … vo103 → vo116, vo106 → vo117 … vo125 → vo136). The twelve took one batch (24 requests).
- **vo029** ("So, the discount is ₹200.", screen 17, spoken "So, the discount is two hundred rupees."): added after the formula in words, made with Swifty's voice (Female Teacher (Standard)); `--renumber` moved every line after it up by one (vo029 → vo030 … vo124 → vo125).
- **Screen 17's first three lines taken out**: Swifty no longer says "The Marked Price is ₹1000.", "Subtract the Selling Price, ₹800." or "We get ₹200. That is the Discount!" there (the sum builds by itself while she points; her only line is the formula in words, "Marked Price, minus Selling Price, equals Discount."). "The Marked Price is ₹1000." is still said on screen 13, so its clip (vo018) stays; the other two were said nowhere else, so they and their clips went, and `--renumber` moved every line after them down, one at a time (vo027 → vo026 … vo126 → vo125, then vo027 → vo026 … vo125 → vo124).
- **vo022–vo023** (the shopkeeper on screen 14): his words became "The price printed on the book is ₹1000, **but you paid only ₹800. So, you got a ₹200 discount.**", so the last two parts were made again (spoken "but you paid only eight hundred rupees." and "So, you got a two hundred rupee discount."; same ids, same voice, Male Teacher (Formal)). The first part, vo021, is unchanged.
- **vo014** (Aniket on screen 10): "What is this? ₹1000 is written on this book!" became **"₹1000? What is this?"** (spoken "One thousand rupees? What is this?"), so it was made again (same id, same voice, Male Child (Energetic)).
- **vo070, vo072–vo074 and vo076** (the quick check on screen 30): its question became "250 is what percent of 1000?" (no ₹; the answers are now 20%, 25% and 50%), so the five lines with its numbers were made again: "250 is what percent of 1000?", "250 is the part,", "1000 is the whole.", "250 ÷ 1000 × 100 = 25%." and "So, 250 is 25% of 1000." Same ids, same voice.
- **vo054–vo056, vo062–vo063** (Swifty on the new screen 28, the percentage rule: "a is what percent of b?", "a is the part,", "and b is the whole.", "Then put a % sign after it." and "Let’s take an example!"): five lines added. The letters are said as letters, "A" and "B" (ए, बी). **vo064–vo066 and vo069** (the example on screen 29, without ₹ now: "125 is what percent of 500?", "125 is the part,", "and 500 is the whole." and "So, 125 is 25% of 500!"): made again without "rupees". The lines of the rule that the example shares ("To find the percentage," … "and the whole below.", now vo057–vo061) are now first heard on screen 28, so they moved up in the script; `--renumber` gave every line its place (vo062–vo063 → vo067–vo068, vo065 → vo070 … vo121 → vo126).
- **The General Idea of Percentage screen taken out** (vo054–vo055 then; Swifty, after screen 27: "Percentage tells us how much of the whole" / "we are considering."): the screen was taken out of the game, so its two lines and their clips went too; `--renumber` moved every line after them down by two (vo056 → vo054 … vo123 → vo121).
- **vo048–vo049** (Aniket on screen 25): "How much money will actually be reduced?" became two lines, "The price tagged is ₹1800." and "Using 30% OFF! How much money I actually have to pay?" (the first made again, the second added; `--renumber` moved every line after them up by one).
- **vo046–vo047** (Aniket on screen 22: "What does 30% OFF mean here?", "Is this also a discount?"): two lines added after "These sneakers look good!"; `--renumber` moved every line after them up by two (vo047 → vo049 … vo120 → vo122).
- **"We get ₹200. That is the Discount!"** (screen 17; later taken out, see above): a reviewer heard "two hundred dollars" in it, although its spoken form and Devanagari say rupees (the voice can change a word). Made again with the same spoken form.
- **vo041–vo043** (Swifty's recap on screen 19): the recap became general, so each line lost its last sentence ("Here, ₹1000." …). Her takes were kept: each was cut in the pause before "Here,", faded out in that silence and given 0.4 s of silence at its end, then made into its clip again (no new take).
- **vo021–vo023** (the shopkeeper on screen 14): his words were changed to "The price printed on the book is ₹1000, but I gave you at ₹800. You got ₹200 discount.", so the three parts were made again (same voice, Male Teacher (Formal)).

## The clips

`tools/vo_build.py` turns the studio's MP3s into **Ogg Opus, 32 kbps, mono**. With ffmpeg it runs `ffmpeg -i voNNN.mp3 -ac 1 -c:a libopus -b:a 32k voNNN.ogg`. Without it (macOS), `afconvert -f caff -d opus -c 1 -b 32000` writes the Opus packets into a CAF file and the script copies them into an Ogg file (RFC 7845): nothing is encoded twice. Ogg Opus counts granule positions at 48 kHz although the studio's audio is 24 kHz, so the granules and the pre-skip (the encoder's priming) are scaled by 48000 ÷ 24000, and the last page's granule is the last valid sample, so the encoder's padding is trimmed. Then it measures each clip, writes `js/vo_lines.js` (`"line as shown": ["vo001", 4.3]`), and deletes any clip no line uses.

Ogg Opus plays in current Chrome, Edge, Firefox and Safari (and on Android). Where it can't play (older Safari and iPads), the device's own voice reads the lines instead, as below.

## How the game uses them

- **One place.** Every line goes through `Voice.say(id, text, who)` (`js/voice.js`). It looks the clip up by the **exact text the line shows**: highlight marks (`{…}`, `*…*`) left out, line breaks as spaces. If the text of a line changes, its old clip no longer matches, and the device's voice reads the new words until the line is made again.
- **One audio element**, reused for every line. Tablets only play audio from an element a tap has started, so on the first tap (or key press) it plays a clip muted for a moment and stops. After that, when served over http(s), every clip is fetched quietly, one at a time, so each is ready when its line comes (opened as a file, they are read straight from the disk).
- **Text in step with the voice.** A bubble's letters come in at the voice's pace: each takes `max(16 ms, (seconds − 0.35) × 1000 ÷ letters)`, the letter after a comma or full stop three letters' time more (the voice pauses there), so the last letter appears as the voice ends (each clip ends with about 0.4 s of silence). On the Marked Price and Discount cards the words appear the same way, after the term is said. Highlights tied to words still pop as their words appear.
- **The screen waits for the voice.** A screen moves on (the Next timer starts, or the Next button appears) only once its last line has been said. A clip that stalls never holds the game up: it counts as finished at its remaining length + 0.6 s.
- **Stopping.** A new line stops the one before; so does changing screen (Next, Back, a jump from the Scenes panel) or a replay.
- **Music** dips under the voice and comes back up after it (`js/audio.js`).
- **Off, or not possible.** `?vo=0` in the address, a browser that can't play Ogg Opus (`canPlayType('audio/ogg; codecs="opus"')` is empty), a line with no clip, a missing file, or `play()` refused: the device's text-to-speech voice reads the line instead, as the game did before. With sound off (**S**) nothing is spoken.
- There is no "tap to continue" in this game: screens move on by themselves (or with Next), always after the voice.

## Remaking a line

1. Edit its `spoken` form in `tools/vo_script.json` (never its `line`, which must stay exactly as shown).
2. Run it in the studio: `python3 tools/vo_build.py --xlsx vo017` writes a sheet per voice (`vo_batch_swifty.xlsx` …) and prints the settings to choose; upload it on **Batch Generation**, press **GENERATE (N)**, then **DOWNLOAD ALL (.ZIP)**.
3. Run `python3 tools/vo_build.py voiceovers_batch.zip` (several zips are fine). It makes the clips, regenerates `js/vo_lines.js` and the table below, and lists any line that still has no clip. Then `python3 tools/vo_build.py --check`.

`tools/vo_build.py` prints its lines (₹, Devanagari) as UTF-8 itself, so it also runs in a Windows terminal (no need for `python -X utf8`).

**A line added to the game** needs a new entry in `tools/vo_script.json`, at the place a player first hears it (any id for now, its line exactly as shown, its spoken form, its speaker); a line taken out of the game, its entry removed. Then `python3 tools/vo_build.py --renumber` gives every line the id of its place (renaming the clips to match, and deleting the clip of a line taken out), and the new line goes through steps 2 and 3. That is how screen 1's conversation became vo001–vo003.

## Checking the language (the line log)

The brief's language check starts from every line the learner meets, in order, on every path. `js/linelog.js` collects them while the game is played. It is off unless the address ends in `?log=right`, `?log=wrong` or `?log=1`; then a small note at the bottom left counts the lines.

- **What it saves, as it appears:** each line a character says, with who says it, how (a speech bubble, a thought cloud, the question bar, or spoken with no bubble because its words are on the screen) and its clip (or "none yet", when the device's voice reads it); and the words written on each screen: titles, cards, questions, answers, buttons, the question bar's task, the notebook when it is open. A text that grows on the screen (a definition written word by word) is saved once, whole.
- **Every path:** play the story once with `index.html?log=right`, answering every question right; then once with `index.html?log=wrong`, answering every question wrong first, dragging each amount into the wrong box first on screen 35, and pressing "Hear it again" on a checkpoint. The log is kept in the browser between the two.
- **L** saves it all as `bookstore-journey-lines.csv` (UTF-8, opens in Excel or Google Sheets): one row per line, screen by screen, with the columns #, Screen, Screen name, Path, Who, Type, Text, Voice clip and Words that must not change. A line both paths meet is listed once, with the path "All"; one only a right (or wrong) answer leads to says "Right answer" ("Wrong answer"). The words that must not change (formulas, amounts, numbers, the maths terms, the names) are found by the log itself: check them. **Shift+L** empties the log.

Then the brief's steps: paste the sheet into ChatGPT with `docs/prompts/Language Review Prompt.txt` (fill in the grade first); the content team checks every suggestion before anything changes; change only what is needed, in the game and in `tools/vo_script.json`; add each spoken line whose words change to [To record next](#to-record-next) and record them all in one batch; run `--check` and play the whole game again.

## Every line

Generated by `tools/vo_build.py`. "=" means the line is said as written.

<!-- vo-table -->
| Clip | Speaker | Line as shown | Spoken as | Devanagari sent to the voice | Seconds |
|---|---|---|---|---|---|
| vo001 | Aniket | Dad, I want to buy a book and a new pair of sneakers from the mall. | = | — | 5.79 |
| vo002 | Father | Sure. But compare the prices and buy wisely. | = | — | 4.46 |
| vo003 | Aniket | I will! | = | — | 1.33 |
| vo004 | Aniket | This book looks interesting! | = | — | 2.6 |
| vo005 | Aniket | How much is this book? | = | — | 2.12 |
| vo006 | Shopkeeper | It’s ₹800! | It's eight hundred rupees! | — | 2.5 |
| vo139 | Aniket | It is too costly, uncle. | = | — | 2.52 |
| vo140 | Shopkeeper | Check the printed price on the book. | = | — | 2.79 |
| vo141 | Aniket | Oh! The price printed on it is ₹1000. | Oh! The price printed on it is one thousand rupees. | — | 4.52 |
| vo142 | Swifty | The price printed on an item | = | — | 2.34 |
| vo143 | Swifty | is called its marked price. | = | — | 2.92 |
| vo144 | Swifty | Not quite! Check the price printed on the book. | = | — | 3.82 |
| vo145 | Swifty | Correct! The price printed on the book, ₹1000, is its marked price. | Correct! The price printed on the book, one thousand rupees, is its marked price. | — | 6.73 |
| vo146 | Shopkeeper | See, the price printed on the book is ₹1000, | See, the price printed on the book is one thousand rupees, | — | 6.0 |
| vo147 | Shopkeeper | but I am selling it to you at ₹800. | but I am selling it to you at eight hundred rupees. | — | 4.33 |
| vo148 | Shopkeeper | I gave you a discount. | = | — | 2.0 |
| vo149 | Aniket | Discount? What is that? | = | — | 3.2 |
| vo150 | Swifty | The reduction given on the marked price of an item | = | — | 3.56 |
| vo151 | Swifty | is called a discount. | = | — | 2.27 |
| vo152 | Swifty | Not quite! ₹800 is the shopkeeper’s selling price. | Not quite! Eight hundred rupees is the shopkeeper's selling price. | — | 5.7 |
| vo153 | Swifty | Yes! Aniket paid ₹200 less than the marked price. | Yes! Aniket paid two hundred rupees less than the marked price. | — | 5.67 |
| vo154 | Aniket | Thank you, uncle! | = | — | 1.95 |
| vo155 | Swifty | Aniket bought the book and understood the discount. | = | — | 4.0 |
| vo156 | Swifty | Let’s help Aniket buy the sneakers! | Let's help Aniket buy the sneakers! | — | 2.92 |
| vo026 | Swifty | Marked Price, | = | — | 1.74 |
| vo027 | Swifty | minus Selling Price, | = | — | 2.43 |
| vo028 | Swifty | equals Discount. | = | — | 2.34 |
| vo029 | Swifty | So, the discount is ₹200. | So, the discount is two hundred rupees. | — | 4.0 |
| vo030 | Swifty | Discount | = | — | 1.51 |
| vo031 | Swifty | equals Marked Price, | = | — | 2.48 |
| vo032 | Swifty | minus Selling Price. | = | — | 2.41 |
| vo034 | Swifty | D for Discount, | = | — | 2.31 |
| vo035 | Swifty | MP for Marked Price, | M P for Marked Price, | — | 3.48 |
| vo036 | Swifty | SP for Selling Price. | S P for Selling Price. | — | 3.27 |
| vo037 | Swifty | So, D | = | — | 2.05 |
| vo038 | Swifty | = MP | equals M P | — | 2.52 |
| vo039 | Swifty | − SP. | minus S P. | — | 2.57 |
| vo157 | Aniket | Wow, nice sneakers! I love them. | = | — | 3.96 |
| vo046 | Aniket | What does 30% OFF mean here? | What does thirty percent off mean here? | — | 2.98 |
| vo048 | Aniket | The price tagged on it is ₹1800. | The price tagged on it is one thousand eight hundred rupees. | — | 4.25 |
| vo158 | Swifty | Not quite! Check the price tagged on the sneakers. | = | — | 4.26 |
| vo159 | Swifty | Correct! ₹1800 is the price tagged on the sneakers: their marked price. | Correct! One thousand eight hundred rupees is the price tagged on the sneakers: their marked price. | — | 7.87 |
| vo049 | Aniket | If this is a discount, how much do I actually have to pay? | = | — | 5.66 |
| vo050 | Swifty | 30% OFF means | Thirty percent off means | — | 2.7 |
| vo160 | Swifty | 30% discount here. | thirty percent discount here. | — | 2.52 |
| vo161 | Swifty | To calculate how much Aniket has to pay for these sneakers, | = | — | 4.49 |
| vo053 | Swifty | let’s first recall how percentages work. | = | — | 3.46 |
| vo054 | Swifty | a is what percent of b? | A is what percent of B? | — | 2.8 |
| vo055 | Swifty | a is the part, | A is the part, | — | 1.98 |
| vo056 | Swifty | and b is the whole. | and B is the whole. | — | 2.09 |
| vo057 | Swifty | To find the percentage, | = | — | 1.91 |
| vo058 | Swifty | divide the part by the whole, | = | — | 2.21 |
| vo059 | Swifty | then multiply by 100. | then multiply by one hundred. | — | 2.73 |
| vo060 | Swifty | Put the part on top, | = | — | 1.85 |
| vo061 | Swifty | and the whole below. | = | — | 1.74 |
| vo062 | Swifty | Then put a % sign after it. | Then put a percent sign after it. | — | 2.94 |
| vo064 | Swifty | 125 is what percent of 500? | One hundred and twenty-five is what percent of five hundred? | — | 4.78 |
| vo065 | Swifty | 125 is the part, | One hundred and twenty-five is the part, | — | 3.25 |
| vo066 | Swifty | and 500 is the whole. | and five hundred is the whole. | — | 2.52 |
| vo067 | Swifty | 125 ÷ 500 × 100 | One hundred and twenty-five divided by five hundred, times one hundred | — | 6.25 |
| vo068 | Swifty | = 25%. | equals twenty-five percent. | — | 3.15 |
| vo069 | Swifty | So, 125 is 25% of 500! | So, one hundred and twenty-five is twenty-five percent of five hundred! | — | 6.03 |
| vo162 | Swifty | Let’s have some practice! | Let's have some practice! | — | 1.9 |
| vo070 | Swifty | 250 is what percent of 1000? | Two hundred and fifty is what percent of one thousand? | — | 4.09 |
| vo071 | Swifty | Not quite! | = | — | 1.57 |
| vo072 | Swifty | 250 is the part, | Two hundred and fifty is the part, | — | 2.61 |
| vo073 | Swifty | 1000 is the whole. | one thousand is the whole. | — | 2.51 |
| vo074 | Swifty | 250 ÷ 1000 × 100 = 25%. | Two hundred and fifty divided by one thousand, times one hundred, equals twenty-five percent. | — | 8.02 |
| vo075 | Swifty | Correct! | = | — | 1.18 |
| vo076 | Swifty | So, 250 is 25% of 1000. | So, two hundred and fifty is twenty-five percent of one thousand. | — | 5.64 |
| vo080 | Swifty | Let’s see how to work it out! | = | — | 2.65 |
| vo081 | Swifty | 30% means | Thirty percent means | — | 1.99 |
| vo082 | Swifty | 30 out of 100. | thirty out of one hundred. | — | 2.3 |
| vo083 | Swifty | So, 30% of ₹1800 = | So, thirty percent of one thousand eight hundred rupees equals | — | 5.72 |
| vo084 | Swifty | 30/100 × 1800 | thirty over one hundred, times one thousand eight hundred | — | 5.52 |
| vo085 | Swifty | 1800 ÷ 100 = 18, | One thousand eight hundred divided by one hundred equals eighteen, | — | 6.53 |
| vo086 | Swifty | and 18 × 30 = 540. | and eighteen times thirty equals five hundred and forty. | — | 5.07 |
| vo087 | Swifty | So, it’s ₹540! | So, it’s five hundred and forty rupees! | — | 3.92 |
| vo164 | Swifty | So, the discount is ₹540. | So, the discount is five hundred and forty rupees. | — | 4.38 |
| vo091 | Swifty | Now, let’s find out how much money Aniket needs to pay. | = | — | 4.15 |
| vo163 | Swifty | How much does Aniket have to pay? | = | — | 2.62 |
| vo094 | Swifty | To find how much you have to pay, | = | — | 2.58 |
| vo095 | Swifty | subtract the discount from the marked price. | = | — | 3.4 |
| vo096 | Swifty | Your turn! Drag each amount into its box. | = | — | 4.26 |
| vo097 | Swifty | Not quite! The MP box is for the marked price, ₹1800. | Not quite! The M P box is for the marked price, one thousand eight hundred rupees. | — | 6.83 |
| vo098 | Swifty | Not quite! The Discount box is for the discount, ₹540. | Not quite! The Discount box is for the discount, five hundred and forty rupees. | — | 5.88 |
| vo099 | Swifty | ₹1800 − ₹540 | One thousand eight hundred rupees minus five hundred and forty rupees | — | 5.84 |
| vo100 | Swifty | = ₹1260. | equals one thousand two hundred and sixty rupees. | — | 4.48 |
| vo101 | Swifty | So, you pay ₹1260 for the sneakers! | So, you pay one thousand two hundred and sixty rupees for the sneakers! | — | 5.06 |
| vo102 | Aniket | So, after a 30% discount, | So, after a thirty percent discount, | — | 3.29 |
| vo103 | Aniket | I will pay ₹1260. | I will pay one thousand two hundred and sixty rupees. | — | 5.26 |
| vo104 | Swifty | 540 is what percent of 1800? | Five hundred and forty is what percent of one thousand eight hundred? | — | 5.05 |
| vo105 | Swifty | 540 is the part, | Five hundred and forty is the part, | — | 2.51 |
| vo106 | Swifty | and 1800 is the whole. | and one thousand eight hundred is the whole. | — | 3.2 |
| vo107 | Swifty | 540 ÷ 1800 × 100 | Five hundred and forty divided by one thousand eight hundred, times one hundred | — | 6.21 |
| vo108 | Swifty | = 30%. | equals thirty percent. | — | 2.51 |
| vo109 | Swifty | So, 540 is 30% of 1800! | So, five hundred and forty is thirty percent of one thousand eight hundred! | — | 5.93 |
| vo110 | Swifty | Here, the part is the discount, | = | — | 2.69 |
| vo111 | Swifty | and the whole is the marked price. | = | — | 2.6 |
| vo112 | Swifty | So, Discount % = Discount ÷ Marked Price × 100. | So, Discount percentage equals Discount divided by Marked Price, times one hundred. | — | 7.47 |
| vo127 | Father | How was your shopping? | = | — | 1.86 |
| vo128 | Aniket | Great! I learnt about marked price, discount and discount percentage. | = | — | 7.5 |
| vo132 | Father | Here’s ₹5,000. | Here’s five thousand rupees. | — | 2.73 |
| vo133 | Father | Use what you have learnt and find the best deals. | = | — | 4.69 |
| vo134 | Father | Whatever is left after buying everything is yours. | = | — | 4.45 |
| vo135 | Aniket | Really? | = | — | 1.35 |
| vo136 | Aniket | Then I’m definitely finding the best offers! | = | — | 3.92 |
| vo137 | Swifty | Try again! | = | — | 1.69 |
| vo138 | Swifty | Let’s write it in short. | = | — | 2.07 |
| vo165 | Aniket | Wow! Rohan’s birthday party is tonight! | Wow! Rohan's birthday party is tonight! | — | 4.11 |
| vo166 | Aniket | I need a new outfit for the party! | = | — | 3.37 |
| vo167 | Aniket | The mall! Let’s go shopping! | The mall! Let's go shopping! | — | 2.69 |
| vo174 | Swifty | You bought this shirt already! | = | — | 2.35 |
| vo180 | Swifty | You bought this bottomwear already! | = | — | 2.86 |
| vo186 | Swifty | You bought this watch already! | = | — | 2.67 |
| vo192 | Swifty | You bought these sunglasses already! | = | — | 3.02 |
| vo196 | Swifty | Wow! You found the best deals for the party! | = | — | 3.69 |
| vo197 | Swifty | You have successfully helped Aniket get ready for the party! | = | — | 4.0 |
| vo198 | Swifty | Wow! You did it! | = | — | 2.34 |
| vo199 | Swifty | Which shirt is the better deal? Tap it! | = | — | 3.25 |
| vo200 | Swifty | Which bottomwear is the better deal? Tap it! | = | — | 3.94 |
| vo201 | Swifty | Which watch is the better deal? Tap it! | = | — | 3.77 |
| vo202 | Swifty | Which sunglasses are the better deal? Tap them! | = | — | 4.3 |
| vo203 | Swifty | Not quite! Work out both sale prices. | = | — | 4.54 |
| vo204 | Swifty | Blue shirt: ₹1,200 − ₹240 = ₹960. | Blue shirt: one thousand two hundred rupees minus two hundred and forty rupees equals nine hundred and sixty rupees. | — | 9.86 |
| vo205 | Swifty | Green shirt: ₹1,000 − ₹150 = ₹850. | Green shirt: one thousand rupees minus one hundred and fifty rupees equals eight hundred and fifty rupees. | — | 7.85 |
| vo206 | Swifty | Jeans: ₹1,800 − ₹540 = ₹1,260. | Jeans: one thousand eight hundred rupees minus five hundred and forty rupees equals one thousand two hundred and sixty rupees. | — | 10.1 |
| vo207 | Swifty | Trousers: ₹1,600 − ₹300 = ₹1,300. | Trousers: one thousand six hundred rupees minus three hundred rupees equals one thousand three hundred rupees. | — | 9.39 |
| vo208 | Swifty | Silver watch: ₹2,000 − ₹400 = ₹1,600. | Silver watch: two thousand rupees minus four hundred rupees equals one thousand six hundred rupees. | — | 7.62 |
| vo209 | Swifty | Brown watch: ₹1,800 − ₹250 = ₹1,550. | Brown watch: one thousand eight hundred rupees minus two hundred and fifty rupees equals one thousand five hundred and fifty rupees. | — | 9.81 |
| vo210 | Swifty | Black sunglasses: ₹1,200 − ₹240 = ₹960. | Black sunglasses: one thousand two hundred rupees minus two hundred and forty rupees equals nine hundred and sixty rupees. | — | 9.26 |
| vo211 | Swifty | Brown sunglasses: ₹900 − ₹90 = ₹810. | Brown sunglasses: nine hundred rupees minus ninety rupees equals eight hundred and ten rupees. | — | 8.62 |
| vo212 | Swifty | Correct! The green shirt costs ₹110 less. | Correct! The green shirt costs one hundred and ten rupees less. | — | 5.12 |
| vo213 | Swifty | Correct! The jeans cost ₹40 less. | Correct! The jeans cost forty rupees less. | — | 4.18 |
| vo214 | Swifty | Correct! The brown watch costs ₹50 less. | Correct! The brown watch costs fifty rupees less. | — | 4.54 |
| vo215 | Swifty | Correct! The brown sunglasses cost ₹150 less. | Correct! The brown sunglasses cost one hundred and fifty rupees less. | — | 6.17 |
| vo216 | Swifty | Great! You bought the green shirt! | = | — | 3.34 |
| vo217 | Swifty | Great! You bought the jeans! | = | — | 3.04 |
| vo218 | Swifty | Great! You bought the brown watch! | = | — | 3.39 |
| vo219 | Swifty | Great! You bought the brown sunglasses! | = | — | 3.43 |
| vo220 | Swifty | Total amount: ₹4,470. | Total amount: four thousand four hundred and seventy rupees. | — | 4.67 |
| vo221 | Swifty | Money left: ₹530. | Money left: five hundred and thirty rupees. | — | 3.94 |
| vo222 | Swifty | Use the controller to walk into a shop! | = | — | 3.1 |
| vo223 | Swifty | Tap a shirt to find its selling price! | = | — | 2.75 |
| vo224 | Swifty | Not quite! The discount is 20% of ₹1,200. | Not quite! The discount is twenty percent of one thousand two hundred rupees. | — | 6.38 |
| vo225 | Swifty | Not quite! Take ₹150 off ₹1,000. | Not quite! Take one hundred and fifty rupees off one thousand rupees. | — | 5.55 |
| vo226 | Swifty | Let’s check the selling price of the green shirt! | = | — | 3.7 |
| vo227 | Swifty | Let’s check the selling price of the blue shirt! | = | — | 3.29 |
| vo228 | Swifty | Tap one to find its selling price! | = | — | 3.31 |
| vo229 | Swifty | Not quite! The discount is 30% of ₹1,800. | Not quite! The discount is thirty percent of one thousand eight hundred rupees. | — | 6.42 |
| vo230 | Swifty | Not quite! Take ₹300 off ₹1,600. | Not quite! Take three hundred rupees off one thousand six hundred rupees. | — | 6.11 |
| vo231 | Swifty | Let’s check the selling price of the trousers! | = | — | 3.16 |
| vo232 | Swifty | Let’s check the selling price of the jeans! | = | — | 2.92 |
| vo233 | Swifty | Tap a watch to find its selling price! | = | — | 3.04 |
| vo234 | Swifty | Not quite! The discount is 20% of ₹2,000. | Not quite! The discount is twenty percent of two thousand rupees. | — | 5.32 |
| vo235 | Swifty | Not quite! Take ₹250 off ₹1,800. | Not quite! Take two hundred and fifty rupees off one thousand eight hundred rupees. | — | 7.15 |
| vo236 | Swifty | Let’s check the selling price of the brown watch! | = | — | 3.27 |
| vo237 | Swifty | Let’s check the selling price of the silver watch! | = | — | 3.51 |
| vo238 | Swifty | Not quite! The discount is 10% of ₹900. | Not quite! The discount is ten percent of nine hundred rupees. | — | 5.69 |
| vo239 | Swifty | Let’s check the selling price of the brown sunglasses! | = | — | 4.16 |
| vo240 | Swifty | Let’s check the selling price of the black sunglasses! | = | — | 4.13 |
| vo241 | Swifty | Not quite! Buy the one that costs less. | = | — | 3.6 |
| vo242 | Swifty | Use the controller to walk to the next shop! | = | — | 3.77 |
<!-- /vo-table -->
