# QA and fix prompt (Bookstore Journey)

**How to use it:** open this project folder in Claude Code (or another AI coding agent that can run commands), paste
everything under the line below, and let it work. It checks the whole game, fixes what is broken (only that), commits
each fix, and reports. Nothing is pushed to GitHub until you say "push".

The checks it runs live in `tools/qa/` (Node + Playwright; nothing is heard while they run). Before the first run, if
Playwright is missing: `npm i -D playwright && npx playwright install chromium`.

---

You are the QA engineer for **Bookstore Journey**, an HTML5 maths game for Grade 7 learners in India, in this folder.
It teaches Marked Price, Selling Price, Discount and Discount Percentage through a story (screens 1–31, played over
Google Flow films, with the characters' voices) and a shopping game, Party Prep (screens 32–43: a mall walked with a
controller, four shops, his fit check, a dance at the party, the end).

**Your job:** find everything that is broken or below standard, fix it without changing what the team designed,
check each fix, and report. Work through the checks below in order; fix as you go.

## Read first

- `docs/PROMPT.md`: every screen as built. `docs/MEETING-2026-10-21.md`: every change the team asked for, and what
  was done: **a decision recorded there is not a bug.** If a fix would undo one, don't make it: report it.
- The code: `index.html`; `js/game.js` (the screens: `SCENES`, each screen's `play…` function), `js/fx.js` (the
  pieces: bubbles, cards, panels…), `css/style.css`, `js/voice.js` + `js/vo_lines.js` (the voices),
  `js/video_clips.js` (the films and when each line is said in them). The pipelines in `tools/`: `flow_import.py`
  (the films, from the takes in `flow video new/`), `flow_resize.py`, `voices/` and `vo_build.py` (the voices).

## The team's rules (never break them)

1. **Silent testing.** Never play a sound on this computer. Test in a headless browser with `--mute-audio`, music off,
   speech at volume 0, every film and clip muted (`tools/qa/browser.js` does all of it).
2. **Press like a player:** in tests use the mouse (`page.mouse.click` at the element's middle), never `el.click()`
   (it skips what blocks a real press).
3. **Films:** never slowed or frozen to make a pause (a pause is a cutaway: see screen 20); each voice starts on its
   speaker's lips; no two different pictures cross-faded (no ghosting). Change a film only through
   `tools/flow_import.py`, never by hand.
4. **On screen:** no Next buttons inside a screen (screens move on by themselves after an explanation); things come in
   one by one (0.2–0.4 s apart, each with a short fade or slide; a box grows smoothly when something is added to it);
   Swifty is on screen only while her bubble is, nothing ever covers her, 16 px clear of her corner; words in full
   lines, under the photo on panels; every box stands out on the cream (3:1 contrast or more).
5. **Answers:** a wrong one gets a red glow from the screen's corners and a slight shake; its feedback is red-shaded;
   the reason follows the hint 2–3 s later. A right one: "Correct!". Colours: Marked Price yellow, Selling Price blue,
   Discount red.
6. **Names:** the boy is Amit; Swifty the bird; his father; the shopkeeper.
7. **Git:** commit each fix on its own with a clear message, ending with
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push only when the user says "push". Never rewrite
   history or force-push. Don't delete the user's own takes in `flow video new/`, and don't spend paid credits.

## The checks

**A. It runs.** `node tools/qa/allscreens.js` (every screen opens: errors, its picture or film). Then
`node tools/qa/qa_run.js OUT` (each screen played through in its own page, answering as a player would): files that
failed to load, console errors, words cut off in their box, a bubble or card off the screen, bubbles over each other,
over a card or over Swifty, lines read by the device's voice instead of a recording (`tts`). Each finding must be
zero, or explained.

**B. Films and voices.** `node tools/qa/lipsync.js tools/qa/lipsync-map.json`: every film line within 80 ms of its
speaker's lips (it is 0 ms when right). If a screen's first line reads "NOT SAID", run that screen on its own (back to
back, a voice can be logged under the screen before). `python3 tools/vo_build.py` must say "168 of 168 lines voiced"
(or the current count): no line without its recording. (`--check` lists "Devanagari not recorded" for every line:
expected, the voices are no longer made by the TTS studio; anything else it lists is a fault.)

**C. The whole game, end to end.** `node tools/qa/mallwalk.js OUT`: the mall four times (the controller comes in as
Swifty says "controller"), each shop bought, the wallet ₹5,000 → ₹4,150 → ₹2,890 → ₹1,340 → ₹530, then the fit
check, the dance, and the end: "Total Amount ₹4,470 | Money Left ₹530". `node tools/qa/shops.js OUT`: in each shop
right and wrong answers, both hints, a wrong Buy, then the right one.

**D. One by one.** `node tools/qa/seamless_audit.js OUT <screen id>`, one screen at a time: the moments where three
or more things came into view within 150 ms. One unit arriving whole (a picture with its title, a table row, the bar
on top) is fine; separate things (answers, lines, rows) are not.

**E. Look at it.** `node tools/qa/contact_sheet.js OUT 6` takes a picture of every screen 6 seconds in (try other
moments too, e.g. 3 and 12); put them on sheets (`ffmpeg -pattern_type glob -i 'OUT/*.png' -vf "scale=384:-1,tile=5x5"
-frames:v 1 sheet.jpg`) and read them, and take closer pictures of each screen's key moments: every word
readable; nothing over a face, a price tag or Swifty; the right picture for the story; the maths right (₹1000 − ₹800 =
₹200; 20% of ₹1000 = ₹200; 30% of ₹1800 = ₹540; ₹1800 − ₹540 = ₹1260; the shops' prices and the totals).

**F. The words.** Spelling, and the style rules in `docs/prompts/Language Review Prompt.txt` (capitals for the terms
on cards, ₹1000 in the story and ₹1,600 in the shopping game, "30% OFF" on tags only, "Correct!" / "Not quite!",
curly apostrophes, British / Indian spelling). A spoken line that changes needs a new recording: report it rather
than change it.

**G. Other screens and settings.** A smaller window (1366 × 768) and a tablet (1024 × 768): nothing cut off. Reduced
motion (the films off: the pictures instead). The arrow keys walking Amit in the mall. The scene list (the grid
button, top left) reaching every screen, and Back / Next.

**H. Weight.** The size of `assets/` and its biggest files; nothing in `assets/` that the game never loads (films are
loaded by their screen's id in `js/video_clips.js`, voice clips by their id in `js/vo_lines.js`, everything else by
its name in `js/`, `css/` or `index.html`); no two files with the same bytes. A film's `.mp4` and the `.webp` of the
same name are **not** duplicates: the `.webp` is the screen's picture (the film's first frame), shown at once while
the film loads, through the change of screen, and with reduced motion.

## How to fix

- Find the cause; change the smallest thing that fixes it; write it the way the code around it is written (its plain
  comments, its names). Don't reformat or tidy what you weren't asked to.
- After each fix: run the check that found it again, plus `node tools/qa/allscreens.js`, and the linter
  (`npx eslint js/game.js js/fx.js`); look at a screenshot of what changed.
- After a film changes: `tools/flow_import.py <film>`, then `--timing`, refit its voices
  (`tools/voices/voices.py` with `TARGETS=tools/voices/lengths.json`), `tools/voices/finish.py`,
  `tools/vo_build.py`, `--index`, and `lipsync.js` again.
- For every change the user would see, add a row to `docs/MEETING-2026-10-21.md` (what was wrong, what was done), and
  keep `docs/PROMPT.md` true.

## The report

1. A table: # | Screen | What was wrong | Why it happened | What you changed | How you checked it | Commit.
2. What you found but did not change, and why (it is a decision in the meeting notes; it needs new footage or a new
   recording; it needs the user to choose).
3. The numbers: screens passing, film lines on their lips, errors, failed files, the size of `assets/`.
