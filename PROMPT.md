# Bookstore Journey — Game Prompt

> A full description of the story intro for the **Profit & Discount** game.
> You can paste this into any AI coding tool to rebuild or extend the game.
> Items marked ✨ are extra effects added on top of the original request.

---

## 1. What to build

A short animated **story game** for kids that runs in a web browser.

- **Format:** 16:9, on a fixed **1920 × 1080** stage that scales to fit any screen (black bars when the screen is a different shape).
- **Tech:** plain HTML + CSS + JavaScript. It opens by double-clicking `index.html`, with no server, installs, or internet needed.
- **Look:** bright, friendly, comic-book style. Rounded bold font (**Baloo 2**, which includes the **₹** sign).
- **Speech bubbles:** text size **34 px**, and each bubble is sized to fit its text.
- **Characters:** **Aniket** (boy, green T-shirt, navy backpack) and the **Shopkeeper** (glasses, navy apron).

## 2. Assets (`game assets/`)

| File | Used on |
|---|---|
| `start screen.png` | Start screen background (it already has the "Bookstore Journey" title) |
| `start button.png` | Start button, placed **below the title text** |
| `book store outside view.png` | Screen 1 background |
| `aniket walking sprite sheet.png` | Screen 1 walking animation (8 frames) |
| `aniket hold the book scene.png` | Screen 2 |
| `aniket give a book to shopkepper.png` | Screen 3 |
| `aniket give money to shopkeeper.png` | Screen 4 |

**Cutting the sprite sheet properly:** the 8 frames are **not** evenly spaced, and each frame's box overlaps the next one, so cutting the sheet into an even grid would clip the neighbouring frame.
Cut every frame along its **own outline**, line all frames up on the **same head/body point** and the **same floor line**, and save them as a clean strip with gaps between frames.
Also play the frames in an order that gives an even step rhythm (the original order limps), and move the boy at the same speed as his stride so his feet don't skate.

## 3. Screens

### Start screen
- Background: `start screen.png` with a slow zoom.
- `start button.png` sits **under the title**, gently floating with a pulsing glow ✨ (no text label).
- Click: chime and sparkle burst ✨, then cut straight to Screen 1 (no fade).
  (The first click also turns sound on, because browsers block sound until the player clicks.)

### Screen 1 — The Bookstore
- Background: `book store outside view.png`.
- Aniket walks in **from the left**, **slowly**, and stops at the **front (bottom) of the store**.
- **Footstep sound** on every step. The sound follows him from left to right ✨.
- Soft shadow under his feet and a faint reflection on the shiny floor ✨.
- When he arrives, a comic **"!"** pops above his head and the **BOOKS & MORE** sign shines ✨.
- Then a smooth **cross-fade into Screen 2**, with the camera pushing into the store as it fades ✨.

### Screen 2 — An Interesting Book
- Background: `aniket hold the book scene.png`.
- Comic speech bubble from Aniket: **"This book looks interesting!"**
  The text types in letter by letter with little "voice" blips ✨.
- Sparkles twinkle around the book ✨.
- **Wait 3 seconds**, then a smooth **cross-fade** to Screen 3.

### Screen 3 — How Much?
- Background: `aniket give a book to shopkepper.png`.
- First Aniket: **"How much is this book?"** His bubble then disappears.
- Only then the Shopkeeper: **"It's ₹800!"** ("₹800" in orange). The two bubbles are **never on screen together**.
- Hold on this moment for 3 seconds, then cut straight to Screen 4 (no fade).

### Screen 4 — Paying ₹800
- Background: `aniket give money to shopkeeper.png`.
- **Pop sound**, and a **small ₹800** badge pops up **just above the money**. It shows only "₹800", with no breakdown of the notes.
- Sparkle burst, cash-register "ka-ching", and confetti ✨.
- This is the last screen, so **Next** becomes **Replay**.

## 4. Movement on every screen
- A slow zoom ("Ken Burns" effect) on every picture, plus a slight shift when the mouse moves ✨.
- Softly glowing ceiling lamps and dust floating in the light ✨.
- **Fades only between Screens 1 ↔ 2 and 2 ↔ 3**: a smooth cross-dissolve where the new picture melts in over the old one.
  Every other change (Start → 1, 3 → 4, Replay, other panel jumps) is a straight cut with a small settle-in zoom.

## 5. Controls
- **Top-right corner:** small **◀ Back** and **Next ▶** buttons, with a "2 / 4" counter between them.
  While a screen is about to move on by itself, the Next button fills up like a timer. Clicking it skips ahead ✨.
- **Side screen panel:** a small **Scenes** button (top-left) opens a side panel with a picture of every screen. Click one to jump straight to it.
  The panel also has an **Auto-play** switch ✨. When it's off, every screen waits for Next.
- Music, sound effects and full screen have **no on-screen buttons**; they are keyboard-only.
- **Keyboard ✨:** ← / → change screen · **P** scenes panel · **F** full screen · **M** music on/off · **S** sound on/off.

## 6. Sounds
All sounds are made in the browser, so no audio files are needed:
footsteps · pop · speech-bubble "bloop" ✨ · voice blips while typing ✨ · whoosh during the two cross-fades ✨ · start chime ✨ · "ding" for the "!" ✨ · sparkle ✨ · cash register ✨ · button clicks ✨ · soft looping background music ✨ (quieter while he walks, so the steps stay clear).

## 7. Done when
- It opens from `index.html` and fills the window at 16:9 on a laptop, a projector, and a phone held sideways.
- The walk looks smooth, with no jitter and no bits of the neighbouring frames.
- Speech-bubble tails point at whoever is talking, only one person talks at a time, and a small ₹800 sits clearly above the money.
- Back/Next, panel jumps, and Auto-play all work, and revisiting a screen restarts its animation.
