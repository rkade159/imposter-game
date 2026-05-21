# Corrections to the Reference Screenshots

## Why this file exists

The screenshots in this folder (`crewmate-screen.png`, `imposter-screen.png`, `main-screen.png`) show the **functional flow** of the Imposter game — they're a guide to *what the screens do*, not a pixel spec. During planning of the **Reveal + Pass gameplay loop** (see [reveal-pass-screens-plan-final.md](../../plans/reveal-pass-screens-plan-final.md)), Rehaan made several deliberate decisions that **deviate from these screenshots**.

If you're a builder or planner interpreting the screenshots, **these corrections take precedence over the images.** Don't "fix" the build to match the screenshots on the points below — the differences are intentional, not bugs.

## Corrections (these override the screenshots)

| # | What the screenshots show | What we actually build | Why |
|---|---|---|---|
| 1 | The role card, a "Hide & Pass to Next Player" button, and a "New Game" button all on **one** screen. | **Two separate screens**: a `RevealScreen` (the role card) and a distinct `PassScreen` (the hand-off buffer between players). | A dedicated pass screen is the privacy buffer during the physical hand-off; the next player only sees their card after they themselves tap. |
| 2 | The role/word is shown **immediately** when the screen appears. | The `RevealScreen` starts **face-down** ("Tap to reveal your role"); a tap flips it to the card. | Extra privacy guard so the role never flashes on screen change. |
| 3 | A **"New Game"** button on the reveal screens. | **No** "New Game"/restart button on Reveal or Pass. Restart lives on the **Discussion** screen as a placeholder **"Play again"** button (returns to Setup). | Rehaan deselected a reveal/pass restart; the loop's end is the right place to restart. |
| 4 | Screens are **anonymous** (no player numbers). | Screens are **numbered**: reveal shows "Player N of M", pass shows "Pass to Player N+1". | Gives players orientation and a visible endpoint for the pass-around. |

## What still holds from the screenshots

- The **two role outcomes**: crewmates see `THE WORD IS: "<word>"` + a "help identify the impostors" line; the impostor sees `YOU ARE THE IMPOSTOR!` + a "blend in during discussion" line.
- The impostor is **not** shown the word or a category hint.
- The overall card-based, one-action-per-screen feel.

## Scope & upkeep

These corrections came out of the Reveal + Pass plan. If a future feature revisits these screens and changes the intent again, **update this file** rather than letting the screenshots silently win.
