# Voiceover

Every line the game speaks is a recorded clip, made with the TTS studio **Ai Wala Human By Aamir** and built into the game so that each line's text appears in step with its voice. The clips are in `game assets/vo/`, one Ogg Opus file per line.

| What | Where |
|---|---|
| Clips (Ogg Opus, 32 kbps, mono) | `game assets/vo/vo001.ogg` … |
| Script: each line as shown, as spoken, who says it, the Devanagari sent to the voice | `tools/vo_script.json` |
| Line → clip map (generated) | `js/vo_lines.js` |
| Player | `js/voice.js` (typing in step: `js/fx.js`, `type`, `revealDefinition`) |
| Rebuild tool | `tools/vo_build.py` |
| Line log, for the language check | `js/linelog.js` (see [Checking the language](#checking-the-language-the-line-log)) |

## To record next

The language fixes (the revamp brief's "lines to fix already", and the text spreadsheet's must-fix on screen 8) changed the words of four lines. Their old clips said the old words, so they were taken out (they are in git), and until the four are recorded the device's voice reads them. `python3 tools/vo_build.py` lists them as "no clip yet".

| Clip | Speaker | Screen (the brief's) | Was | Now (spoken as) |
|---|---|---|---|---|
| vo007 | Swifty | 8 (a wrong answer) | Think again. The shopkeeper sold the book for ₹800. | Not quite! The shopkeeper sold the book for ₹800. ("…for eight hundred rupees.") |
| vo048 | Aniket | 25 | The price tagged is ₹1800. | The tag says ₹1800. ("…one thousand eight hundred rupees.") |
| vo049 | Aniket | 25 | Using 30% OFF! How much money I actually have to pay? | With 30% off, how much do I actually pay? ("With thirty percent off, …") |
| vo114 | Swifty | 38 (40 in the game) | of the marked price has been reduced. | of the marked price is taken off. |

The brief asks for every changed line to be recorded in **one batch**, after the content team has checked the language review's suggestions (below). Then: `python3 tools/vo_build.py --xlsx vo007 vo048 vo049 vo114` (plus any other changed lines), the studio as in [Remaking a line](#remaking-a-line), `python3 tools/vo_build.py --check`, and the whole game played again.

Twelve other lines only changed their capital letters or apostrophe, so their words sound the same and their clips were kept (only `line` changed in `tools/vo_script.json`, as the text spreadsheet's style rules 1 and 7 suggest): *selling price*, *marked price* and *discount* in small letters inside a sentence (vo012, vo013, vo016, vo018, vo019, vo020, vo041, vo042, vo090), capitals on a label (vo119 "Marked Price: ₹1800.", vo122 "Selling Price: ₹1260."), and the curly apostrophe in vo006 ("It’s ₹800!").

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

Then the brief's steps: paste the sheet into ChatGPT with `Language Review Prompt.txt` (fill in the grade first); the content team checks every suggestion before anything changes; change only what is needed, in the game and in `tools/vo_script.json`; add each spoken line whose words change to [To record next](#to-record-next) and record them all in one batch; run `--check` and play the whole game again.

## Every line

Generated by `tools/vo_build.py`. "=" means the line is said as written.

<!-- vo-table -->
| Clip | Speaker | Line as shown | Spoken as | Devanagari sent to the voice | Seconds |
|---|---|---|---|---|---|
| vo001 | Aniket | Dad, I want to buy a book and a new pair of sneakers from the mall. | = | डैड, आइ वॉन्ट टू बाय अ बुक एंड अ न्यू पेयर ऑफ स्नीकर्स फ्रॉम द मॉल। | 4.94 |
| vo002 | Father | Sure. But compare the prices and buy wisely. | = | श्योर। बट कंपेयर द प्राइसेस एंड बाय वाइजली। | 3.98 |
| vo003 | Aniket | I will! | = | आई विल! | 1.3 |
| vo004 | Aniket | This book looks interesting! | = | दिस बुक लुक्स इंटरेस्टिंग! | 2.33 |
| vo005 | Aniket | How much is this book? | = | हाउ मच इज दिस बुक? | 1.7 |
| vo006 | Shopkeeper | It’s ₹800! | It's eight hundred rupees! | इट्स एट हंड्रेड रुपीस! | 2.45 |
| vo007 | Swifty | Not quite! The shopkeeper sold the book for ₹800. | Not quite! The shopkeeper sold the book for eight hundred rupees. | — | — |
| vo008 | Swifty | Cost Price. C P. | = | कॉस्ट प्राइस. सी पी. | 2.5 |
| vo009 | Swifty | Price at which an item is bought. | = | प्राइस एट विच एन आइटम इज बॉट | 2.74 |
| vo010 | Swifty | Selling Price. S P. | = | सेलिंग प्राइस. एस पी. | 2.74 |
| vo011 | Swifty | Price at which an item is sold. | = | प्राइस एट विच एन आइटम इज सोल्ड। | 2.78 |
| vo012 | Swifty | Here, ₹800 is the shopkeeper’s selling price. | Here, eight hundred rupees is the shopkeeper’s Selling Price. | हियर, एट हंड्रेड रुपीस इज द शॉपकीपर्स सेलिंग प्राइस। | 4.66 |
| vo013 | Swifty | Correct! The shopkeeper sold the book for ₹800, so ₹800 is the selling price. | Correct! The shopkeeper sold the book for eight hundred rupees, so eight hundred rupees is the Selling Price. | करेक्ट! द शॉपकीपर सोल्ड द बुक फॉर एइट हंड्रेड रुपीस, सो एइट हंड्रेड रुपीस इज़ द सेलिंग प्राइस. | 6.7 |
| vo014 | Aniket | ₹1000? What is this? | One thousand rupees? What is this? | वन थाउज़ेंड रुपीज़? वॉट इज़ दिस? | 3.58 |
| vo015 | Swifty | ₹1000 is the price written on the book. | One thousand rupees is the price written on the book. | वन थाउजेंड रुपीज इज द प्राइस रिटन ऑन द बुक। | 3.89 |
| vo016 | Swifty | It is called the marked price (MP). | It is called the Marked Price, M P. | इट इज कॉल्ड द मार्क्ड प्राइस, एम पी। | 3.26 |
| vo017 | Swifty | Marked Price. The price marked or printed on an article is called its Marked Price. | Marked Price. The price marked, or printed, on an article is called its Marked Price. | मार्क्ड प्राइस। द प्राइस मार्क्ड, ऑर प्रिंटेड, ऑन एन आर्टिकल इज कॉल्ड इट्स मार्क्ड प्राइस। | 8.09 |
| vo018 | Swifty | The marked price is ₹1000. | The Marked Price is one thousand rupees. | द मार्क्ड प्राइस इज वन थाउजेंड रुपीज। | 3.14 |
| vo019 | Swifty | But the book was sold for ₹800. That is the selling price. | But the book was sold for eight hundred rupees. That is the Selling Price. | बट द बुक वॉज़ सोल्ड फॉर एट हंड्रेड रुपीज़। दैट इज़ द सेलिंग प्राइस। | 4.73 |
| vo020 | Swifty | Why is the selling price less than the marked price? | = | वाय इज द सेलिंग प्राइस लेस दैन द मार्क्ड प्राइस? | 3.74 |
| vo021 | Shopkeeper | The price printed on the book is ₹1000, | The price printed on the book is one thousand rupees, | द प्राइस प्रिंटेड ऑन द बुक इज वन थाउजेंड रुपीज, | 4.01 |
| vo022 | Shopkeeper | but you paid only ₹800. | but you paid only eight hundred rupees. | बट यू पेड ओनली एट हंड्रेड रुपिस। | 3.02 |
| vo023 | Shopkeeper | So, you got a ₹200 discount. | So, you got a two hundred rupee discount. | सो, यू गॉट ए टू हंड्रेड रूपी डिस्काउंट। | 3.05 |
| vo024 | Aniket | Discount? What does that mean? | = | डिस्काउंट? वॉट डज़ दैट मीन? | 2.98 |
| vo025 | Swifty | Discount. The reduction given on the marked price of an item is called a discount. | = | डिस्काउंट। द रिडक्शन गिवन ऑन द मार्क्ड प्राइस ऑफ एन आइटम इज कॉल्ड ए डिस्काउंट। | 6.5 |
| vo026 | Swifty | Marked Price, | = | मार्क्ड प्राइस, | 1.97 |
| vo027 | Swifty | minus Selling Price, | = | माइनस सेलिंग प्राइस, | 2.38 |
| vo028 | Swifty | equals Discount. | = | ईक्वल्स डिस्काउंट। | 2.38 |
| vo029 | Swifty | So, the discount is ₹200. | So, the discount is two hundred rupees. | सो द डिस्काउंट इज टू हंड्रेड रुपीज। | 3.29 |
| vo030 | Swifty | Discount | = | डिस्काउंट | 1.37 |
| vo031 | Swifty | equals Marked Price, | = | इक्वल्स मार्क्ड प्राइस, | 2.5 |
| vo032 | Swifty | minus Selling Price. | = | माइनस सेलिंग प्राइस। | 2.42 |
| vo033 | Swifty | We can write it in short. | = | वी कैन राइट इट इन शॉर्ट। | 2.06 |
| vo034 | Swifty | D for Discount, | = | डी फॉर डिस्काउंट, | 2.45 |
| vo035 | Swifty | MP for Marked Price, | M P for Marked Price, | एम पी फॉर मार्क्ड प्राइस, | 2.81 |
| vo036 | Swifty | SP for Selling Price. | S P for Selling Price. | एस पी फॉर सेलिंग प्राइस। | 2.98 |
| vo037 | Swifty | So, D | = | सो, डी | 1.42 |
| vo038 | Swifty | = MP | equals M P | इक्वल्स एम पी | 2.66 |
| vo039 | Swifty | − SP. | minus S P. | माइनस एस पी। | 2.14 |
| vo040 | Swifty | Let’s remember! | = | लेट्स रिमेम्बर! | 1.9 |
| vo041 | Swifty | Marked price is the price written on an item. | = | मार्क्ड प्राइस इज द प्राइस रिटन ऑन एन आइटम। | 3.25 |
| vo042 | Swifty | Selling price is the price at which it is sold. | = | सेलिंग प्राइस इज द प्राइस एट व्हिच इट इज सोल्ड. | 3.59 |
| vo043 | Swifty | Discount is the amount reduced from the marked price. | = | डिस्काउंट इज द अमाउंट रिड्यूस्ड फ्रॉम द मार्क्ड प्राइस। | 4.05 |
| vo044 | Swifty | And remember the formula: Discount = MP − SP! | And remember the formula: Discount equals M P minus S P! | एंड रिमेंबर द फॉर्मूला: डिस्काउंट इक्वल्स एम पी माइनस एस पी! | 6.26 |
| vo045 | Aniket | These sneakers look good! | = | दीज़ स्नीकर्स लुक गुड! | 2.5 |
| vo046 | Aniket | What does 30% OFF mean here? | What does thirty percent off mean here? | वॉट डज़ थर्टी परसेंट ऑफ मीन हियर? | 2.78 |
| vo047 | Aniket | Is this also a discount? | = | इज़ दिस ऑल्सो अ डिस्काउंट? | 2.3 |
| vo048 | Aniket | The tag says ₹1800. | The tag says one thousand eight hundred rupees. | — | — |
| vo049 | Aniket | With 30% off, how much do I actually pay? | With thirty percent off, how much do I actually pay? | — | — |
| vo050 | Swifty | 30% OFF means | Thirty percent off means | थर्टी परसेंट ऑफ मीन्स | 2.5 |
| vo051 | Swifty | 30% Discount. | thirty percent discount. | थर्टी परसेंट डिस्काउंट. | 2.18 |
| vo052 | Swifty | To find the discount amount, | = | टू फाइंड द डिस्काउंट अमाउंट, | 2.45 |
| vo053 | Swifty | let’s first recall how percentages work. | = | लेट्स फर्स्ट रिकॉल हाउ परसेंटेज वर्क। | 3.5 |
| vo054 | Swifty | a is what percent of b? | A is what percent of B? | ए इज़ वॉट परसेंट ऑफ बी? | 2.98 |
| vo055 | Swifty | a is the part, | A is the part, | ए इज़ द पार्ट, | 2.38 |
| vo056 | Swifty | and b is the whole. | and B is the whole. | एंड बी इज द होल। | 2.54 |
| vo057 | Swifty | To find the percentage, | = | टू फाइंड द परसेंटेज, | 2.3 |
| vo058 | Swifty | divide the part by the whole, | = | डिवाइड द पार्ट बाय द होल, | 2.86 |
| vo059 | Swifty | then multiply by 100. | then multiply by one hundred. | देन मल्टीप्लाइ बाय वन हंड्रेड। | 2.69 |
| vo060 | Swifty | Put the part on top, | = | पुट द पार्ट ऑन टॉप, | 2.3 |
| vo061 | Swifty | and the whole below. | = | एंड द होल बिलो। | 2.06 |
| vo062 | Swifty | Then put a % sign after it. | Then put a percent sign after it. | देन पुट अ परसेंट साइन आफ्टर इट। | 2.66 |
| vo063 | Swifty | Let’s take an example! | = | लेट्स टेक एन एग्जांपल! | 1.9 |
| vo064 | Swifty | 125 is what percent of 500? | One hundred and twenty-five is what percent of five hundred? | वन हंड्रेड एंड ट्वेंटी-फाइव इज़ वॉट परसेंट ऑफ फाइव हंड्रेड? | 4.3 |
| vo065 | Swifty | 125 is the part, | One hundred and twenty-five is the part, | वन हंड्रेड एंड ट्वेंटी-फाइव इज द पार्ट, | 3.34 |
| vo066 | Swifty | and 500 is the whole. | and five hundred is the whole. | एंड फाइव हंड्रेड इज द होल। | 2.93 |
| vo067 | Swifty | 125 ÷ 500 × 100 | One hundred and twenty-five divided by five hundred, times one hundred | वन हंड्रेड एंड ट्वेंटी फाइव डिवाइडेड बाय फाइव हंड्रेड टाइम्स वन हंड्रेड | 7.06 |
| vo068 | Swifty | = 25%. | equals twenty-five percent. | ईक्वल्स ट्वेंटी फाइव परसेंट | 2.62 |
| vo069 | Swifty | So, 125 is 25% of 500! | So, one hundred and twenty-five is twenty-five percent of five hundred! | सो, वन हंड्रेड एंड ट्वेंटी-फाइव इज़ ट्वेंटी-फाइव परसेंट ऑफ फाइव हंड्रेड! | 5.14 |
| vo070 | Swifty | 250 is what percent of 1000? | Two hundred and fifty is what percent of one thousand? | टू हंड्रेड एंड फिफ्टी इज वॉट परसेंट ऑफ वन थाउजेंड? | 3.89 |
| vo071 | Swifty | Not quite! | = | नॉट क्वाइट! | 1.61 |
| vo072 | Swifty | 250 is the part, | Two hundred and fifty is the part, | टू हंड्रेड एंड फिफ्टी इज़ द पार्ट, | 3.05 |
| vo073 | Swifty | 1000 is the whole. | one thousand is the whole. | वन थाउज़ेंड इज़ द होल। | 2.42 |
| vo074 | Swifty | 250 ÷ 1000 × 100 = 25%. | Two hundred and fifty divided by one thousand, times one hundred, equals twenty-five percent. | टू हंड्रेड एंड फिफ्टी डिवाइडेड बाय वन थाउजेंड टाइम्स वन हंड्रेड इक्वल्स ट्वेंटी फाइव परसेंट | 7.7 |
| vo075 | Swifty | Correct! | = | करेक्ट! | 1.13 |
| vo076 | Swifty | So, 250 is 25% of 1000. | So, two hundred and fifty is twenty-five percent of one thousand. | सो, टू हंड्रेड एंड फिफ्टी इज ट्वेंटी-फाइव परसेंट ऑफ वन थाउजेंड। | 5.02 |
| vo077 | Swifty | Now, back to Aniket’s sneakers! | = | नाउ, बैक टू अनिकेत्स स्नीकर्स! | 3.1 |
| vo078 | Swifty | Now, what is 30% of ₹1800? | Now, what is thirty percent of one thousand eight hundred rupees? | नाउ, वट इज थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड रुपीज? | 4.78 |
| vo079 | Swifty | 30% of ₹1800 is ₹540. | Thirty percent of one thousand eight hundred rupees is five hundred and forty rupees. | थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड रुपीस इज फाइव हंड्रेड एंड फॉर्टी रुपीस। | 5.78 |
| vo080 | Swifty | Let’s see how to work it out! | = | लेट्स सी हाउ टू वर्क इट आउट! | 2.21 |
| vo081 | Swifty | 30% means | Thirty percent means | थर्टी परसेंट मीन्स | 2.57 |
| vo082 | Swifty | 30 out of 100. | thirty out of one hundred. | थर्टी आउट ऑफ वन हंड्रेड। | 2.26 |
| vo083 | Swifty | So, 30% of ₹1800 = | So, thirty percent of one thousand eight hundred rupees equals | सो, थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड रुपीस इक्वल्स | 5.21 |
| vo084 | Swifty | 30/100 × 1800 | thirty over one hundred, times one thousand eight hundred | थर्टी ओवर वन हंड्रेड, टाइम्स वन थाउजेंड एइट हंड्रेड | 5.69 |
| vo085 | Swifty | 1800 ÷ 100 = 18, | One thousand eight hundred divided by one hundred equals eighteen, | वन थाउजेंड एइट हंड्रेड डिवाइडेड बाय वन हंड्रेड इक्वल्स एटीन, | 4.37 |
| vo086 | Swifty | and 18 × 30 = 540. | and eighteen times thirty equals five hundred and forty. | एंड एटीन टाइम्स थर्टी इक्वल्स फाइव हंड्रेड एंड फोर्टि। | 4.94 |
| vo087 | Swifty | So, it’s ₹540! | So, it’s five hundred and forty rupees! | सो इट्स फाईव हंड्रेड एंड फोर्टी रुपीज़! | 2.86 |
| vo088 | Swifty | What does ₹540 represent here? | What does five hundred and forty rupees represent here? | वॉट डज़ फाइव हंड्रेड एंड फोर्टी रुपीज़ रिप्रेजेंट हियर? | 3.89 |
| vo089 | Swifty | ₹540 is the money taken off ₹1800. | Five hundred and forty rupees is the money taken off one thousand eight hundred rupees. | फाइव हंड्रेड एंड फोर्टी रुपीज इज द मनी टेकन ऑफ वन थाउजेंड एट हंड्रेड रुपीज। | 4.7 |
| vo090 | Swifty | That’s the discount! | = | दैट्स द डिस्काउंट! | 1.73 |
| vo091 | Swifty | Now, let’s find out how much money Aniket needs to pay. | = | नाउ, लेट्स फाइंड आउट हाउ मच मनी अनिकेत नीड्स टू पे। | 4.34 |
| vo092 | Swifty | What will be the Selling Price? | = | वॉट विल बी द सेलिंग प्राइस? | 2.5 |
| vo093 | Swifty | Hint: SP = MP − Discount. | Hint: S P equals M P minus Discount. | हिंट: एस पी इक्वल्स एम पी माइनस डिस्काउंट. | 4.9 |
| vo094 | Swifty | To find how much you have to pay, | = | टू फाइंड हाउ मच यू हैव टू पे, | 2.66 |
| vo095 | Swifty | subtract the discount from the marked price. | = | सबट्रैक्ट द डिस्काउंट फ्रॉम द मार्क्ड प्राइस। | 2.78 |
| vo096 | Swifty | Your turn! Drag each amount into its box. | = | योर टर्न! ड्रैग ईच अमाउंट इंटू इट्स बॉक्स. | 3.82 |
| vo097 | Swifty | Not quite! The MP box is for the marked price, ₹1800. | Not quite! The M P box is for the marked price, one thousand eight hundred rupees. | नॉट क्वाइट! द एम पी बॉक्स इज़ फॉर द मार्क्ड प्राइस, वन थाउज़ेंड एइट हंड्रेड रूपीज़। | 6.86 |
| vo098 | Swifty | Not quite! The Discount box is for the discount, ₹540. | Not quite! The Discount box is for the discount, five hundred and forty rupees. | नॉट क्वाइट! द डिस्काउंट बॉक्स इज़ फॉर द डिस्काउंट, फाइव हंड्रेड एंड फोर्टी रुपीस। | 5.81 |
| vo099 | Swifty | ₹1800 − ₹540 | One thousand eight hundred rupees minus five hundred and forty rupees | वन थाउजेंड एइट हंड्रेड रुपीज माइनस फाइव हंड्रेड एंड फोर्टी रुपीज | 5.42 |
| vo100 | Swifty | = ₹1260. | equals one thousand two hundred and sixty rupees. | इक्वल्स वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीज | 3.98 |
| vo101 | Swifty | So, you pay ₹1260 for the sneakers! | So, you pay one thousand two hundred and sixty rupees for the sneakers! | सो, यू पे वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीस फॉर द स्नीकर्स! | 4.82 |
| vo102 | Aniket | So, after a 30% discount, | So, after a thirty percent discount, | सो, आफ्टर ए थर्टी परसेंट डिस्काउंट, | 3.34 |
| vo103 | Aniket | I will pay ₹1260. | I will pay one thousand two hundred and sixty rupees. | आई विल पे वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीज। | 3.65 |
| vo104 | Swifty | 540 is what percent of 1800? | Five hundred and forty is what percent of one thousand eight hundred? | फाईव हंड्रेड एंड फौर्टी इज़ वॉट परसेंट ऑफ वन थाउजेंड एट हंड्रेड? | 4.94 |
| vo105 | Swifty | 540 is the part, | Five hundred and forty is the part, | फाइव हंड्रेड एंड फ़ॉर्टी इज़ द पार्ट, | 2.98 |
| vo106 | Swifty | and 1800 is the whole. | and one thousand eight hundred is the whole. | एंड वन थाउजेंड एट हंड्रेड इज द होल। | 3.46 |
| vo107 | Swifty | 540 ÷ 1800 × 100 | Five hundred and forty divided by one thousand eight hundred, times one hundred | फाइव हंड्रेड एंड फौर्टी डिवाइडेड बाइ वन थाउजेंड ऐट हंड्रेड, टाइम्स वन हंड्रेड | 6.82 |
| vo108 | Swifty | = 30%. | equals thirty percent. | ईक्वल्स थर्टी परसेंट | 2.66 |
| vo109 | Swifty | So, 540 is 30% of 1800! | So, five hundred and forty is thirty percent of one thousand eight hundred! | सो, फाइव हंड्रेड एंड फोर्टी इज थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड! | 5.93 |
| vo110 | Swifty | Here, the part is the discount, | = | हियर, द पार्ट इज द डिस्काउंट, | 2.93 |
| vo111 | Swifty | and the whole is the marked price. | = | एंड द होल इज द मार्क्ड प्राइस। | 3.1 |
| vo112 | Swifty | So, Discount % = Discount ÷ Marked Price × 100. | So, Discount percentage equals Discount divided by Marked Price, times one hundred. | सो, डिस्काउंट परसेंटेज इक्वल्स डिस्काउंट डिवाइडेड बाय मार्क्ड प्राइस, टाइम्स वन हंड्रेड। | 7.42 |
| vo113 | Swifty | Discount percentage tells us what percent | = | डिस्काउंट परसेंटेज टेल्स अस वॉट परसेंट | 3.46 |
| vo114 | Swifty | of the marked price is taken off. | = | — | — |
| vo115 | Swifty | The discount is ₹540, | The discount is five hundred and forty rupees, | द डिस्काउंट इज फाइव हंड्रेड एंड फोर्टी रूपीस, | 3.29 |
| vo116 | Swifty | and the marked price is ₹1800. | and the marked price is one thousand eight hundred rupees. | एंड द मार्क्ड प्राइस इज वन थाउजेंड एट हंड्रेड रुपीस। | 4.1 |
| vo117 | Swifty | That’s the 30% off on the tag! | That’s the thirty percent off on the tag! | दैट्स द थर्टी परसेंट ऑफ ऑन द टैग! | 3.02 |
| vo118 | Swifty | Let’s sum up the sneakers! | = | लेट्स सम अप द स्नीकर्स! | 2.45 |
| vo119 | Swifty | Marked Price: ₹1800. | Marked price: one thousand eight hundred rupees. | मार्कड प्राइस वन थाउजेंड एट हंड्रेड रुपीज | 2.81 |
| vo120 | Swifty | Discount: 30%, | Discount: thirty percent, | डिस्काउंट थर्टी परसेंट, | 2.33 |
| vo121 | Swifty | which is ₹540. | which is five hundred and forty rupees. | विच इज़ फाइव हंड्रेड एंड फोर्टी रुपीज़। | 3.02 |
| vo122 | Swifty | Selling Price: ₹1260. | Selling price: one thousand two hundred and sixty rupees. | सेलिंग प्राइस वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीस | 4.37 |
| vo123 | Swifty | Discount = MP − SP, | Discount equals M P minus S P, | डिस्काउंट इक्वल्स एम पी माइनस एस पी, | 4.46 |
| vo124 | Swifty | SP = MP − Discount, | S P equals M P minus Discount, | एस पी इक्वल्स एम पी माइनस डिस्काउंट, | 3.46 |
| vo125 | Swifty | and Discount % = Discount ÷ MP × 100. | and Discount percentage equals Discount divided by M P, times one hundred. | एंड डिस्काउंट परसेंटेज इक्वल्स डिस्काउंट डिवाइडेड बाय एम पी, टाइम्स वन हंड्रेड। | 7.46 |
| vo126 | Swifty | Now you can work out any discount! | = | नाउ यू कैन वर्क आउट एनी डिस्काउंट! | 2.9 |
| vo127 | Father | How was your shopping? | = | हाउ वॉज़ योर शॉपिंग? | 1.97 |
| vo128 | Aniket | Great! I learnt about marked price, discount and discount percentage. | = | ग्रेट! आई लर्न्ट अबाउट मार्क्ड प्राइस, डिस्काउंट एंड डिस्काउंट परसेंटेज। | 5.57 |
| vo129 | Father | That’s useful, because you have another shopping job. | = | दैट्स यूज़फुल, बिकॉज़ यू हैव अनदर शॉपिंग जॉब। | 3.89 |
| vo130 | Father | Your new school session starts in a few days. | = | योर न्यू स्कूल सेशन स्टार्ट्स इन अ फ्यू डेज़। | 3.34 |
| vo131 | Father | You still need some things for school. | = | यू स्टिल नीड सम थिंग्स फॉर स्कूल। | 2.62 |
| vo132 | Father | Here’s ₹5,000. | Here’s five thousand rupees. | हियर्स फाइव थाउजेंड रुपीज़। | 2.3 |
| vo133 | Father | Use what you have learnt and find the best deals. | = | यूज़ वॉट यू हैव लर्न्ट एंड फाइंड द बेस्ट डील्स। | 3.74 |
| vo134 | Father | Whatever is left after buying everything is yours. | = | व्हाटएवर इज लेफ्ट आफ्टर बाइंग एवरीथिंग इज योर्स। | 3.5 |
| vo135 | Aniket | Really? | = | रियली? | 1.22 |
| vo136 | Aniket | Then I’m definitely finding the best offers! | = | देन आई एम डेफिनेटली फाइंडिंग द बेस्ट ऑफर्स! | 3.17 |
<!-- /vo-table -->
