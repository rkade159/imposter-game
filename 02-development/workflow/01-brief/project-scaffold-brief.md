# Brief — Initial Project Scaffold

## Source plan

[01-plan/plans/tech-stack-plan-final.md](../../../01-plan/plans/tech-stack-plan-final.md)

## What to build

An empty but **runnable** Svelte + Vite project, configured as a PWA, with the folder structure from the tech-stack plan stubbed out. The output is a foundation: it doesn't do anything game-related yet, but every subsequent feature can be built on top of it without re-deciding tooling, layout, or build setup.

Think of it as: someone clones the repo, runs the install command, runs the dev command, and sees a working "Imposter Game" placeholder page in the browser. Production build works. PWA install works. That's the bar.

## Why this is the first thing built

Three reasons:
1. **Nothing else can be built without it.** Every feature plan downstream assumes the scaffold exists.
2. **It de-risks the tooling.** Rehaan is new to web dev; getting the toolchain working first means feature work isn't blocked by Node/Vite/Svelte setup issues mixed in with game-logic problems.
3. **It validates the tech-stack decision early.** If something about Svelte + Vite + PWA turns out to be awkward, better to find out now (when there's nothing to throw away) than after writing game logic.

## Scope

**In scope:**
- Vite + Svelte project initialized (using the official starter template)
- Folder structure from the tech-stack plan: `src/lib/`, `src/screens/`, `src/components/`, `public/data/`, `public/icons/`
- Empty/stub files in those folders so the structure is visible (e.g. `SetupScreen.svelte` exists but just renders a placeholder)
- PWA setup: `manifest.webmanifest`, basic service worker, install metadata
- `index.html` with sensible meta tags (viewport, title, theme-color)
- A baseline `app.css` that applies the design-system fundamentals (Inter font, dark default, responsive container)
- Root `App.svelte` that mounts cleanly and shows an "Imposter Game" placeholder
- A short `README.md` inside the build folder explaining how to run, build, and where things live
- Code follows [02-development/references/technical-standards.md](../../references/technical-standards.md) — plain, simple, commented on new blocks

**Out of scope (do NOT build here):**
- Any actual game logic (setup form, role assignment, reveals, voting, etc.)
- Real word lists (an empty `public/data/` folder is fine)
- Final app icons (placeholder PNGs are fine — proper icons come at design stage)
- Routing libraries (the screen-state-machine pattern from the plan doesn't need them)
- TypeScript
- Testing framework
- Deployment configuration (GitHub Pages / Vercel setup) — deferred to its own brief
- Capacitor / mobile wrap

## Where the build lives

`02-development/workflow/03-builds/imposter-game-app/`

(The whole Vite project goes inside that folder so it's self-contained.)

## Constraints worth highlighting

- Per [technical-standards.md](../../references/technical-standards.md): *"plainly and simply as possible"*, *"prefer standard library solutions over third-party packages when equivalent"*, *"add comments to the code whenever you are coding a new code block"*. No extra dependencies unless they earn their place.
- Per [design-system.md](../../../03-design/references/design-system.md): the baseline CSS should respect the visual philosophy (clean, low bloat), use Inter / system sans-serif, default to dark mode, 16px minimum body text, 24px container padding.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive.

## Next step

This brief feeds [02-development/workflow/02-specs/project-scaffold-spec.md](../02-specs/project-scaffold-spec.md), which converts it into an acceptance-criteria contract for the build.
