# Android Play Store Port — Plan (Final)

## Why this plan exists

The web app is "done enough" to share. The long-anticipated next step (flagged back in `tech-stack-plan-final.md` and `references/REFERENCES.md`) is to ship Imposter as an installable Android app on the Google Play Store. This plan is the roadmap from *"web app live on Netlify"* to *"app live on Play Store, and updatable forever after."*

Scope is deliberately narrow per Rehaan's decisions:

- **Android only.** No iOS for now (no Mac available). The Capacitor approach keeps the iOS door open at zero extra cost — adding it later is one command on the same codebase.
- **Free, no monetization.** No payment SDKs, no ads. This is the simplest possible app to ship and review.
- **Offline pass-and-play.** No backend, no accounts, no data collection — which dramatically simplifies privacy compliance.

## The approach

Wrap the existing Svelte/Vite PWA in a native Android shell using **Capacitor** — the exact tool locked in by the tech-stack plan. No rewrite. The web build (`dist/`) becomes the contents of a native Android app; Capacitor provides the native shell and a bridge to device features.

```
[ Existing Svelte source ]  →  npm run build  →  [ dist/ ]
                                                    │
                                          npx cap sync (copies dist into shell)
                                                    ↓
                                   [ Android Studio project ]  →  signed .aab  →  Play Store
```

The same `dist/` that deploys to Netlify is what goes inside the app. Web and Android stay in lockstep from one codebase.

---

## The roadmap (phased)

### Phase 0 — Prerequisites (one-time setup)
- **Google Play Developer account** — $25 one-time fee. The only money this whole effort costs.
- **Android Studio** — free. Bundles the JDK and Android SDK needed to build. (~few GB download.)
- **Node/npm** — already installed.
- Identifiers are **decided**: app ID = `com.rehaan.imposter` (permanent), store display name = **"Imposter but Better"** (matches the Netlify URL).

### Phase 1 — Add Capacitor to the project
Work happens in `02-development/.../imposter-game-app/`.
- `npm install @capacitor/core` and `npm install -D @capacitor/cli`
- `npx cap init` — set app name + app ID, point `webDir` at `dist`
- `npm install @capacitor/android` then `npx cap add android` (creates the `android/` native project)
- Confirm `npm run build` → `npx cap sync` produces a runnable shell

### Phase 2 — Native config & polish
- **App icon + splash screen** — start with a **placeholder** to unblock the build, generating all required densities from a single source image using `@capacitor/assets`. Proper artwork routes through the **03-design** silo before going public.
- **Android hardware back button** — wire it to in-app navigation via Capacitor's App plugin so "back" moves between game screens instead of abruptly closing the app mid-round.
- **Status bar + background colour** — match the game's dark theme.
- **Lock to portrait** orientation (it's a phone party game).
- **Service-worker check** — the app uses a *hand-rolled* service worker for web offline caching. Inside Capacitor the assets are already bundled locally, so the SW is redundant at best and could interfere at worst. Verify behaviour under the `capacitor://` scheme; disable/strip it for the native build if it causes trouble.

### Phase 3 — Build & test on a real device
- `npx cap open android` to open in Android Studio
- Run on an emulator, then a **physical phone** over USB debugging
- Play the full loop on-device: setup → reveal → pass → discussion → results → play again. Confirm offline (airplane mode) works.

### Phase 4 — Prepare the release build
- **App signing** — strongly recommend **Play App Signing** (Google holds the signing key). The alternative is managing your own keystore, and *losing that keystore means you can never update the app again.* Let Google manage it.
- Build a **signed release `.aab`** (Android App Bundle — Play requires AAB, not APK).
- Set `versionCode` (integer, must increase every release) and `versionName` (human label, e.g. `1.0.0`).

### Phase 5 — Store listing & compliance
- Listing text: app name, short description, full description.
- Graphics: app icon (512×512), feature graphic (1024×500), phone screenshots.
- **Data Safety form** — declare "no data collected / no data shared" (true for this app).
- **Privacy policy URL** — required by Play even for no-data apps. A simple one-page policy hosted on the existing Netlify site covers it.
- **Content rating** — complete the IARC questionnaire (this will rate as suitable for everyone).
- Set pricing to **Free** and pick distribution countries.

### Phase 6 — Submit & publish
- Upload the `.aab` to a release track. Recommend starting on the **Internal Testing** track (instant, invite-only) to sanity-check the store build on a device before going public.
- Promote to **Production** → Google review (typically hours to a couple of days) → live.

### Phase 7 — The update workflow (the ongoing loop)
This is the answer to *"can I keep updating it later?"* — yes, and it becomes routine:
1. Make changes in the Svelte code (same as today)
2. Bump `versionCode`
3. `npm run build` → `npx cap sync`
4. Build a new signed `.aab` in Android Studio
5. Upload to Play Console → review → users auto-update

We'll write this up as a repeatable checklist so it's a ~15-minute chore, not a research project each time.

*(Optional, deferred: "live updates" via Capgo/Capacitor Live Updates can push web-only changes instantly without store review. Nice-to-have once the basic pipeline is comfortable — not for day one.)*

---

## What's deferred (deliberately out of scope)
- **iOS / App Store** — needs a Mac; codebase stays compatible for whenever that changes.
- **Monetization** (ads, paid, IAP) — not wanted.
- **Live/OTA updates** (Capgo) — revisit after the standard pipeline is established.
- **Native device features** (haptics, push notifications, etc.) — add later only if a feature calls for it.

## What Rehaan will need to install / learn
- **Android Studio** (one-time install; brings JDK + SDK + emulator).
- A **Google Play Console** account ($25, one-time).
- Concepts, in rough order: the Capacitor build cycle (`build` → `sync` → open in Android Studio), running an app on a device/emulator, what an `.aab` is, and the Play Console submission screens.
- USB debugging on a physical Android phone (a few taps in Developer Options).

## Costs
- **$25, one-time** (Google Play Developer registration). Everything else — Capacitor, Android Studio, SDK, the build pipeline — is free. No recurring fees.

## Decisions made
1. **App ID:** `com.rehaan.imposter` — locked. Used at `cap init`; permanent on the Play Store.
2. **Store display name:** "Imposter but Better" — matches the Netlify URL, avoids collision with existing "Imposter"/Among Us apps.
3. **Icon/splash artwork:** placeholder first to unblock the build; real artwork via **03-design** before public release.

## Remaining open questions (non-blocking)
1. **Service-worker behaviour inside Capacitor** — flagged in Phase 2; needs a quick verify-or-strip during the build.
2. **Privacy policy hosting** — confirm we can add a `/privacy` page to the existing Netlify site for the required URL.

## How this plan flows onward
This is one cohesive initiative, but it spans both downstream silos:
- **02-development** — Capacitor integration, native config, build/release pipeline, update workflow (Phases 1–4, 6, 7).
- **03-design** — app icon + splash artwork, if we want it designed rather than placeholder (part of Phase 2).

When approved, the development-heavy portion goes to `02-development/workflow/01-brief/` as a brief.

## Status

**Final.** Approved by Rehaan; blocking decisions (app ID `com.rehaan.imposter`, name "Imposter but Better", placeholder-first artwork) resolved. Ready to feed the development pipeline — the dev-heavy portion (Phases 1–4, 6, 7) goes to `02-development/workflow/01-brief/` as a brief when Rehaan wants to start building.
