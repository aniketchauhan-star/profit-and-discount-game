# Voiceover

Every line the game speaks is a recorded clip, made with the TTS studio **Ai Wala Human By Aamir** and built into the game so that each line's text appears in step with its voice. The clips are in `game assets/vo/`, one Ogg Opus file per line.

| What | Where |
|---|---|
| Clips (Ogg Opus, 32 kbps, mono) | `game assets/vo/vo001.ogg` … |
| Script: each line as shown, as spoken, who says it, the Devanagari sent to the voice | `tools/vo_script.json` |
| Line → clip map (generated) | `js/vo_lines.js` |
| Player | `js/voice.js` (typing in step: `js/fx.js`, `type`, `revealDefinition`) |
| Rebuild tool | `tools/vo_build.py` |

## The studio and its settings

- Studio: <https://ai-wala-human-by-aamir-809572708022.asia-southeast1.run.app/>, tab **Batch Generation**. It takes an `.xlsx` sheet with a header row and two columns: `filename` (the clip id) and `text` (the spoken form).
- **Language: Hindi.** The studio first rewrites each line in the language's script (with `gemini-3-flash-preview`), then speaks that (with `gemini-3.1-flash-tts-preview`). English written in Devanagari ("Meet Miso!" → "मीट मिसो!") is spoken as English with an Indian accent: the words stay English, which is what this game wants. **English** would give a neutral accent instead.
- **Voices**, one per speaker (each speaker's lines go in a batch of their own):

  | Speaker | Studio voice | Gemini voice |
  |---|---|---|
  | Swifty (every teaching line) | Female Teacher (Standard) | Kore |
  | Aniket | Male Child (Energetic) | Puck |
  | The shopkeeper | Male Teacher (Formal) | Charon |

- Format **.MP3** (the studio's files are 24 kHz, mono, 128 kbps); Text Column `text`, Filename Column `filename`, Start Row 1, Quantity = the number of rows, Concurrency **3 (Recommended)**. The download, **DOWNLOAD ALL (.ZIP)**, is `voiceovers_batch.zip`, holding `voiceovers/<filename>.mp3`.
- Clip ids `vo001`, `vo002` … are numbered in the order a player first hears the lines (each question's wrong answer first, then the right one).

## The rate limit

The studio's proxy allows **100 requests per 15 minutes per IP**, and each line takes two (the rewrite, then the voice), so about **48 lines per window**. Its replies carry `ratelimit-limit`, `ratelimit-remaining` and `ratelimit-reset` (seconds); over the limit it answers `429 Too many requests from this IP`. Never try to get around it: make each batch at most `floor(remaining ÷ 2) − 1` rows (at most 48), and wait out `ratelimit-reset` plus 30 s before the next. The 108 lines took three windows.

## The spoken form

The voice reads exactly what it is given, so the **spoken** form writes maths and symbols out in words; the text on screen (the **line**) never changes.

- `=` "equals", `+` "plus", `−` "minus", `×` "times", `÷` "divided by"; a fraction `30/100` "thirty over one hundred"; `%` "percent" (`Discount %` "Discount percentage").
- Rupees and numbers as **English words**: `₹1800` "one thousand eight hundred rupees", `a ₹200 discount` "a two hundred rupee discount". Digits are never sent: the studio's rewrite sometimes turns a digit into a Hindi number word (3 → तीन, 50 → पचास), and the voice then says it in Hindi.
- Short forms letter by letter: `MP` "M P", `SP` "S P", `CP` "C P"; `the Marked Price (MP)` "the Marked Price, M P".
- Commas where a teacher pauses, so the grouping is heard: `150 ÷ 600 × 100 = 25%.` "One hundred and fifty divided by six hundred, times one hundred, equals twenty-five percent."
- A part that finishes a sentence begun by the part before starts in lower case (`30 out of 100.` "thirty out of one hundred."), so it is said as one sentence.

### The Devanagari check

The rewrite the studio sends to the voice is kept for every line (`devanagari` in `tools/vo_script.json`, and the table below). `python3 tools/vo_build.py --check` flags:

- Hindi number words (एक दो तीन … बीस तीस चालीस पचास सौ हज़ार, and compounds such as सैंतीस, पचहत्तर) and digits;
- common Hindi words, i.e. an English word translated rather than written out (e.g. **और** for "or": it means "and" and is said "aur");
- a pace outside 6–22 characters of the spoken form per second. Very short lines ("So, D", "= MP") fall below 6 because every clip carries about 0.3 s of silence before the voice and 0.4 s after it; measured without that silence they are 7–11 characters per second.

Also read the Devanagari by eye for names, possessives ("Aniket’s" अनिकेत्स) and ordinals. A flagged line gets a corrected spoken form and is made again; repeat until the check is clean.

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
2. Run it in the studio: `python3 tools/vo_build.py --xlsx vo015` writes a sheet per voice (`vo_batch_swifty.xlsx` …) and prints the settings to choose; upload it on **Batch Generation**, press **GENERATE (N)**, then **DOWNLOAD ALL (.ZIP)**.
3. Run `python3 tools/vo_build.py voiceovers_batch.zip` (several zips are fine). It makes the clips, regenerates `js/vo_lines.js` and the table below, and lists any line that still has no clip. Then `python3 tools/vo_build.py --check`.

A line added to the game needs a new entry in `tools/vo_script.json` (the next free id, its line exactly as shown, its spoken form, its speaker) before step 2.

## Every line

Generated by `tools/vo_build.py`. "=" means the line is said as written.

<!-- vo-table -->
| Clip | Speaker | Line as shown | Spoken as | Devanagari sent to the voice | Seconds |
|---|---|---|---|---|---|
| vo001 | Aniket | I’m going to the mall today. Let’s see what I can find! | = | आई एम गोइंग टू द मॉल टुडे. लेट्स सी वॉट आई कैन फाइंड! | 4.3 |
| vo002 | Aniket | This book looks interesting! | = | दिस बुक लुक्स इंटरेस्टिंग! | 2.33 |
| vo003 | Aniket | How much is this book? | = | हाउ मच इज दिस बुक? | 1.7 |
| vo004 | Shopkeeper | It's ₹800! | It's eight hundred rupees! | इट्स एट हंड्रेड रुपीस! | 2.45 |
| vo005 | Swifty | Think again. The shopkeeper sold the book for ₹800. | Think again. The shopkeeper sold the book for eight hundred rupees. | थिंक अगेन। द शॉपकीपर सोल्ड द बुक फॉर एट हंड्रेड रुपीज़। | 5.09 |
| vo006 | Swifty | Cost Price. C P. | = | कॉस्ट प्राइस. सी पी. | 2.5 |
| vo007 | Swifty | Price at which an item is bought. | = | प्राइस एट विच एन आइटम इज बॉट | 2.74 |
| vo008 | Swifty | Selling Price. S P. | = | सेलिंग प्राइस. एस पी. | 2.74 |
| vo009 | Swifty | Price at which an item is sold. | = | प्राइस एट विच एन आइटम इज सोल्ड। | 2.78 |
| vo010 | Swifty | Here, ₹800 is the shopkeeper’s Selling Price. | Here, eight hundred rupees is the shopkeeper’s Selling Price. | हियर, एट हंड्रेड रुपीस इज द शॉपकीपर्स सेलिंग प्राइस। | 4.66 |
| vo011 | Swifty | Correct! The shopkeeper sold the book for ₹800, so ₹800 is the Selling Price. | Correct! The shopkeeper sold the book for eight hundred rupees, so eight hundred rupees is the Selling Price. | करेक्ट! द शॉपकीपर सोल्ड द बुक फॉर एइट हंड्रेड रुपीस, सो एइट हंड्रेड रुपीस इज़ द सेलिंग प्राइस. | 6.7 |
| vo012 | Aniket | What is this? ₹1000 is written on this book! | What is this? One thousand rupees is written on this book! | वाट इज दिस? वन थाउजेंड रुपीस इज रिटन ऑन दिस बुक! | 4.1 |
| vo013 | Swifty | ₹1000 is the price written on the book. | One thousand rupees is the price written on the book. | वन थाउजेंड रुपीज इज द प्राइस रिटन ऑन द बुक। | 3.89 |
| vo014 | Swifty | It is called the Marked Price (MP). | It is called the Marked Price, M P. | इट इज कॉल्ड द मार्क्ड प्राइस, एम पी। | 3.26 |
| vo015 | Swifty | Marked Price. The price marked or printed on an article is called its Marked Price. | Marked Price. The price marked, or printed, on an article is called its Marked Price. | — | — |
| vo016 | Swifty | The Marked Price is ₹1000. | The Marked Price is one thousand rupees. | द मार्क्ड प्राइस इज वन थाउजेंड रुपीज। | 3.14 |
| vo017 | Swifty | But the book was sold for ₹800. That is the Selling Price. | But the book was sold for eight hundred rupees. That is the Selling Price. | बट द बुक वॉज़ सोल्ड फॉर एट हंड्रेड रुपीज़। दैट इज़ द सेलिंग प्राइस। | 4.73 |
| vo018 | Swifty | Why is the Selling Price less than the Marked Price? | = | वाय इज द सेलिंग प्राइस लेस दैन द मार्क्ड प्राइस? | 3.74 |
| vo019 | Shopkeeper | The marked price was ₹1000, | The marked price was one thousand rupees, | द मार्क्ड प्राइस वॉज़ वन थाउजेंड रुपीज़, | 3.38 |
| vo020 | Shopkeeper | but I sold it to you for ₹800. | but I sold it to you for eight hundred rupees. | बट आई सोल्ड इट टू यू फॉर एइट हंड्रेड रुपीज़। | 3.58 |
| vo021 | Shopkeeper | You got a ₹200 discount. | You got a two hundred rupee discount. | यू गॉट अ टू हंड्रेड रूपी डिस्काउंट। | 2.78 |
| vo022 | Aniket | Discount? What does that mean? | = | डिस्काउंट? वॉट डज़ दैट मीन? | 2.98 |
| vo023 | Swifty | Discount. The reduction given on the marked price of an item is called a discount. | = | डिस्काउंट। द रिडक्शन गिवन ऑन द मार्क्ड प्राइस ऑफ एन आइटम इज कॉल्ड ए डिस्काउंट। | 6.5 |
| vo024 | Swifty | Subtract the Selling Price, ₹800. | Subtract the Selling Price, eight hundred rupees. | सबट्रैक्ट द सेलिंग प्राइस, एट हंड्रेड रुपीस। | 3.7 |
| vo025 | Swifty | We get ₹200. That is the Discount! | We get two hundred rupees. That is the Discount! | वी गेट टू हंड्रेड रुपीस. दैट इज द डिस्काउंट! | 4.34 |
| vo026 | Swifty | Marked Price, | = | मार्क्ड प्राइस, | 1.97 |
| vo027 | Swifty | minus Selling Price, | = | माइनस सेलिंग प्राइस, | 2.38 |
| vo028 | Swifty | equals Discount. | = | ईक्वल्स डिस्काउंट। | 2.38 |
| vo029 | Swifty | Discount | = | डिस्काउंट | 1.37 |
| vo030 | Swifty | equals Marked Price, | = | इक्वल्स मार्क्ड प्राइस, | 2.5 |
| vo031 | Swifty | minus Selling Price. | = | माइनस सेलिंग प्राइस। | 2.42 |
| vo032 | Swifty | We can write it in short. | = | वी कैन राइट इट इन शॉर्ट। | 2.06 |
| vo033 | Swifty | D for Discount, | = | डी फॉर डिस्काउंट, | 2.45 |
| vo034 | Swifty | MP for Marked Price, | M P for Marked Price, | एम पी फॉर मार्क्ड प्राइस, | 2.81 |
| vo035 | Swifty | SP for Selling Price. | S P for Selling Price. | एस पी फॉर सेलिंग प्राइस। | 2.98 |
| vo036 | Swifty | So, D | = | सो, डी | 1.42 |
| vo037 | Swifty | = MP | equals M P | इक्वल्स एम पी | 2.66 |
| vo038 | Swifty | − SP. | minus S P. | माइनस एस पी। | 2.14 |
| vo039 | Swifty | Let’s remember! | = | लेट्स रिमेम्बर! | 1.9 |
| vo040 | Swifty | Marked Price is the price written on an item. Here, ₹1000. | Marked Price is the price written on an item. Here, one thousand rupees. | मार्क्ड प्राइस इज द प्राइस रिटन ऑन एन आइटम। हियर, वन थाउज़ेंड रुपीज़। | 5.26 |
| vo041 | Swifty | Selling Price is the price at which it is sold. Here, ₹800. | Selling Price is the price at which it is sold. Here, eight hundred rupees. | सेलिंग प्राइस इज द प्राइस एट व्हिच इट इज सोल्ड. हियर, एट हंड्रेड रुपीज. | 5.54 |
| vo042 | Swifty | Discount is the amount reduced from the marked price. Here, ₹200. | Discount is the amount reduced from the marked price. Here, two hundred rupees. | डिस्काउंट इज द अमाउंट रिड्यूस्ड फ्रॉम द मार्क्ड प्राइस। हियर, टू हंड्रेड रुपीस। | 5.98 |
| vo043 | Swifty | And remember the formula: Discount = MP − SP! | And remember the formula: Discount equals M P minus S P! | एंड रिमेंबर द फॉर्मूला: डिस्काउंट इक्वल्स एम पी माइनस एस पी! | 6.26 |
| vo044 | Aniket | These sneakers look good! | = | दीज़ स्नीकर्स लुक गुड! | 2.5 |
| vo045 | Aniket | What does 30% discount mean here? | What does thirty percent discount mean here? | वॉट डज थर्टी परसेंट डिस्काउंट मीन हियर? | 2.93 |
| vo046 | Aniket | How much money will actually be reduced? | = | हाउ मच मनी विल एक्चुअली बी रिड्यूस्ड? | 3.05 |
| vo047 | Swifty | To find the discount amount, | = | टू फाइंड द डिस्काउंट अमाउंट, | 2.45 |
| vo048 | Swifty | let’s first recall how percentages work. | = | लेट्स फर्स्ट रिकॉल हाउ परसेंटेज वर्क। | 3.5 |
| vo049 | Swifty | Percentage tells us how much of the whole | = | परसेंटेज टेल्स अस हाउ मच ऑफ द होल | 3.58 |
| vo050 | Swifty | we are considering. | = | वी आर कंसीडरिंग। | 2.14 |
| vo051 | Swifty | ₹125 is what percent of ₹500? | One hundred and twenty-five rupees is what percent of five hundred rupees? | वन हंड्रेड एंड ट्वेंटी-फाइव रुपीस इज व्हॉट परसेंट ऑफ फाइव हंड्रेड रुपीस? | 4.94 |
| vo052 | Swifty | ₹125 is the part, | One hundred and twenty-five rupees is the part, | वन हंड्रेड एंड ट्वेंटी फाइव रुपीस इज द पार्ट, | 3.82 |
| vo053 | Swifty | and ₹500 is the whole. | and five hundred rupees is the whole. | एंड फाइव हंड्रेड रुपीस इज द होल। | 2.9 |
| vo054 | Swifty | To find the percentage, | = | टू फाइंड द परसेंटेज, | 2.3 |
| vo055 | Swifty | divide the part by the whole, | = | डिवाइड द पार्ट बाय द होल, | 2.86 |
| vo056 | Swifty | then multiply by 100. | then multiply by one hundred. | देन मल्टीप्लाइ बाय वन हंड्रेड। | 2.69 |
| vo057 | Swifty | Put the part on top, | = | पुट द पार्ट ऑन टॉप, | 2.3 |
| vo058 | Swifty | and the whole below. | = | एंड द होल बिलो। | 2.06 |
| vo059 | Swifty | 125 ÷ 500 × 100 | One hundred and twenty-five divided by five hundred, times one hundred | वन हंड्रेड एंड ट्वेंटी फाइव डिवाइडेड बाय फाइव हंड्रेड टाइम्स वन हंड्रेड | 7.06 |
| vo060 | Swifty | = 25%. | equals twenty-five percent. | ईक्वल्स ट्वेंटी फाइव परसेंट | 2.62 |
| vo061 | Swifty | So, ₹125 is 25% of ₹500! | So, one hundred and twenty-five rupees is twenty-five percent of five hundred rupees! | सो, वन हंड्रेड एंड ट्वेंटी-फाइव रुपीज़ इज़ ट्वेंटी-फाइव परसेंट ऑफ फाइव हंड्रेड रुपीज़! | 6.17 |
| vo062 | Swifty | ₹150 is what percent of ₹600? | One hundred and fifty rupees is what percent of six hundred rupees? | वन हंड्रेड एंड फिफ्टी रुपीस इज व्हॉट परसेंट ऑफ सिक्स हंड्रेड रुपीस? | 4.66 |
| vo063 | Swifty | Not quite! | = | नॉट क्वाइट! | 1.61 |
| vo064 | Swifty | ₹150 is the part, | One hundred and fifty rupees is the part, | वन हंड्रेड एंड फिफ्टी रुपीस इज द पार्ट, | 3.17 |
| vo065 | Swifty | ₹600 is the whole. | six hundred rupees is the whole. | सिक्‍स हंड्रेड रूपीज़ इज द होल। | 2.93 |
| vo066 | Swifty | 150 ÷ 600 × 100 = 25%. | One hundred and fifty divided by six hundred, times one hundred, equals twenty-five percent. | वन हंड्रेड एंड फिफ्टी डिवाइडेड बाय सिक्स हंड्रेड, टाइम्स वन हंड्रेड, इक्वल्स ट्वेंटी फाइव परसेंट। | 7.58 |
| vo067 | Swifty | Correct! | = | करेक्ट! | 1.13 |
| vo068 | Swifty | So, ₹150 is 25% of ₹600. | So, one hundred and fifty rupees is twenty-five percent of six hundred rupees. | सो वन हंड्रेड एंड फिफ्टी रुपीज़ इज़ ट्वेंटी-फाइव परसेंट ऑफ़ सिक्स हंड्रेड रुपीज़। | 5.74 |
| vo069 | Swifty | Now, back to Aniket’s sneakers! | = | नाउ, बैक टू अनिकेत्स स्नीकर्स! | 3.1 |
| vo070 | Swifty | Now, what is 30% of ₹1800? | Now, what is thirty percent of one thousand eight hundred rupees? | नाउ, वट इज थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड रुपीज? | 4.78 |
| vo071 | Swifty | 30% of ₹1800 is ₹540. | Thirty percent of one thousand eight hundred rupees is five hundred and forty rupees. | थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड रुपीस इज फाइव हंड्रेड एंड फॉर्टी रुपीस। | 5.78 |
| vo072 | Swifty | Let’s see how to work it out! | = | लेट्स सी हाउ टू वर्क इट आउट! | 2.21 |
| vo073 | Swifty | 30% means | Thirty percent means | थर्टी परसेंट मीन्स | 2.57 |
| vo074 | Swifty | 30 out of 100. | thirty out of one hundred. | थर्टी आउट ऑफ वन हंड्रेड। | 2.26 |
| vo075 | Swifty | So, 30% of ₹1800 = | So, thirty percent of one thousand eight hundred rupees equals | सो, थर्टी परसेंट ऑफ वन थाउजेंड ऐट हंड्रेड रुपीस इक्वल्स | 5.21 |
| vo076 | Swifty | 30/100 × 1800 | thirty over one hundred, times one thousand eight hundred | थर्टी ओवर वन हंड्रेड, टाइम्स वन थाउजेंड एइट हंड्रेड | 5.69 |
| vo077 | Swifty | 1800 ÷ 100 = 18, | One thousand eight hundred divided by one hundred equals eighteen, | वन थाउजेंड एइट हंड्रेड डिवाइडेड बाय वन हंड्रेड इक्वल्स एटीन, | 4.37 |
| vo078 | Swifty | and 18 × 30 = 540. | and eighteen times thirty equals five hundred and forty. | एंड एटीन टाइम्स थर्टी इक्वल्स फाइव हंड्रेड एंड फोर्टि। | 4.94 |
| vo079 | Swifty | So, it’s ₹540! | So, it’s five hundred and forty rupees! | सो इट्स फाईव हंड्रेड एंड फोर्टी रुपीज़! | 2.86 |
| vo080 | Swifty | What does ₹540 represent here? | What does five hundred and forty rupees represent here? | वॉट डज़ फाइव हंड्रेड एंड फोर्टी रुपीज़ रिप्रेजेंट हियर? | 3.89 |
| vo081 | Swifty | ₹540 is the money taken off ₹1800. | Five hundred and forty rupees is the money taken off one thousand eight hundred rupees. | फाइव हंड्रेड एंड फोर्टी रुपीज इज द मनी टेकन ऑफ वन थाउजेंड एट हंड्रेड रुपीज। | 4.7 |
| vo082 | Swifty | That’s the Discount! | = | दैट्स द डिस्काउंट! | 1.73 |
| vo083 | Swifty | To find how much you have to pay, | = | टू फाइंड हाउ मच यू हैव टू पे, | 2.66 |
| vo084 | Swifty | subtract the discount from the marked price. | = | सबट्रैक्ट द डिस्काउंट फ्रॉम द मार्क्ड प्राइस. | 3.62 |
| vo085 | Swifty | Your turn! Drag each amount into its box. | = | योर टर्न! ड्रैग ईच अमाउंट इंटू इट्स बॉक्स. | 3.82 |
| vo086 | Swifty | Not quite! The MP box is for the marked price, ₹1800. | Not quite! The M P box is for the marked price, one thousand eight hundred rupees. | नॉट क्वाइट! द एम पी बॉक्स इज़ फॉर द मार्क्ड प्राइस, वन थाउज़ेंड एइट हंड्रेड रूपीज़। | 6.86 |
| vo087 | Swifty | Not quite! The Discount box is for the discount, ₹540. | Not quite! The Discount box is for the discount, five hundred and forty rupees. | नॉट क्वाइट! द डिस्काउंट बॉक्स इज़ फॉर द डिस्काउंट, फाइव हंड्रेड एंड फोर्टी रुपीस। | 5.81 |
| vo088 | Swifty | ₹1800 − ₹540 | One thousand eight hundred rupees minus five hundred and forty rupees | वन थाउजेंड एइट हंड्रेड रुपीज माइनस फाइव हंड्रेड एंड फोर्टी रुपीज | 5.42 |
| vo089 | Swifty | = ₹1260. | equals one thousand two hundred and sixty rupees. | इक्वल्स वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीज | 3.98 |
| vo090 | Swifty | So, you pay ₹1260 for the sneakers! | So, you pay one thousand two hundred and sixty rupees for the sneakers! | सो, यू पे वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीस फॉर द स्नीकर्स! | 4.82 |
| vo091 | Aniket | So, after a 30% discount, | So, after a thirty percent discount, | सो, आफ्टर ए थर्टी परसेंट डिस्काउंट, | 3.34 |
| vo092 | Aniket | I will pay ₹1260. | I will pay one thousand two hundred and sixty rupees. | आई विल पे वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीज। | 3.65 |
| vo093 | Swifty | Discount percentage tells us what percent | = | डिस्काउंट परसेंटेज टेल्स अस वॉट परसेंट | 3.46 |
| vo094 | Swifty | of the marked price has been reduced. | = | ऑफ द मार्क्ड प्राइस हैज बीन रिड्यूस्ड। | 2.69 |
| vo095 | Swifty | The discount is ₹540, | The discount is five hundred and forty rupees, | द डिस्काउंट इज फाइव हंड्रेड एंड फोर्टी रूपीस, | 3.29 |
| vo096 | Swifty | and the marked price is ₹1800. | and the marked price is one thousand eight hundred rupees. | एंड द मार्क्ड प्राइस इज वन थाउजेंड एट हंड्रेड रुपीस। | 4.1 |
| vo097 | Swifty | 540 ÷ 1800 × 100 | Five hundred and forty divided by one thousand eight hundred, times one hundred | फाइव हंड्रेड एंड फौर्टी डिवाइडेड बाइ वन थाउजेंड ऐट हंड्रेड, टाइम्स वन हंड्रेड | 6.82 |
| vo098 | Swifty | = 30%. | equals thirty percent. | ईक्वल्स थर्टी परसेंट | 2.66 |
| vo099 | Swifty | That’s the 30% off on the tag! | That’s the thirty percent off on the tag! | दैट्स द थर्टी परसेंट ऑफ ऑन द टैग! | 3.02 |
| vo100 | Swifty | Let’s sum up the sneakers! | = | लेट्स सम अप द स्नीकर्स! | 2.45 |
| vo101 | Swifty | Marked price: ₹1800. | Marked price: one thousand eight hundred rupees. | मार्कड प्राइस वन थाउजेंड एट हंड्रेड रुपीज | 2.81 |
| vo102 | Swifty | Discount: 30%, | Discount: thirty percent, | डिस्काउंट थर्टी परसेंट, | 2.33 |
| vo103 | Swifty | which is ₹540. | which is five hundred and forty rupees. | विच इज़ फाइव हंड्रेड एंड फोर्टी रुपीज़। | 3.02 |
| vo104 | Swifty | Selling price: ₹1260. | Selling price: one thousand two hundred and sixty rupees. | सेलिंग प्राइस वन थाउजेंड टू हंड्रेड एंड सिक्सटी रुपीस | 4.37 |
| vo105 | Swifty | Discount = MP − SP, | Discount equals M P minus S P, | डिस्काउंट इक्वल्स एम पी माइनस एस पी, | 4.46 |
| vo106 | Swifty | SP = MP − Discount, | S P equals M P minus Discount, | एस पी इक्वल्स एम पी माइनस डिस्काउंट, | 3.46 |
| vo107 | Swifty | and Discount % = Discount ÷ MP × 100. | and Discount percentage equals Discount divided by M P, times one hundred. | एंड डिस्काउंट परसेंटेज इक्वल्स डिस्काउंट डिवाइडेड बाय एम पी, टाइम्स वन हंड्रेड। | 7.46 |
| vo108 | Swifty | Now you can work out any discount! | = | नाउ यू कैन वर्क आउट एनी डिस्काउंट! | 2.9 |
<!-- /vo-table -->
