# Brief — Android Play Store Port (Capacitor)

## Source plan

[01-plan/plans/android-play-store-port-plan-final.md](../../../01-plan/plans/android-play-store-port-plan-final.md)

## What to build

Wrap the existing Svelte + Vite web app (`imposter-game-app/`) in a **Capacitor** Android shell so it can be built into an `.aab` and published to the Google Play Store — **without rewriting any game code**. The same `dist/` that deploys to Netlify becomes the contents of the native app.

The deliverable splits into two parts:

1. **Code integration (the builder does this):** add Capacitor to the project, configure it, generate the native Android project, and make the small code changes the native shell needs to behave correctly (service-worker guard, hardware back-button handling, status-bar styling, placeholder icon/splash).
2. **A runbook (the builder writes, Rehaan executes):** the manual steps that *cannot* be automated from here — installing Android Studio, creating the Play Console account, generating a signed release, filling the store listing, and the repeatable update workflow.

## Why now

The web MVP is "done enough" to share. Per the tech-stack plan, Capacitor was always the intended path to the stores, and pass-and-play (offline, no backend, no accounts) makes this an unusually low-risk wrap.

## Decided up front (from the plan — do not re-decide)

- **App ID:** `com.rehaan.imposter` — permanent, used at `cap init`.
- **App display name:** `Imposter but Better`.
- **Platform:** Android only. Do **not** add the iOS platform (no Mac), but do nothing that would block adding it later.
- **Free, no monetization, offline.** No payment/ads SDKs. No analytics or data collection.
- **Icon/splash:** placeholder now; real artwork comes later via 03-design.

## Scope

**In scope:**
- Add Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) to `imposter-game-app/`.
- `capacitor.config` pointing `webDir` at `dist`, with the decided app ID and name.
- Generate the native `android/` project (`npx cap add android`).
- **Service-worker guard:** the app's hand-rolled SW ([src/main.js](../03-builds/imposter-game-app/src/main.js)) currently registers in any production build. Stop it from registering when running inside Capacitor (native already serves assets locally; the SW is redundant and can interfere). Web/Netlify behaviour must be unchanged.
- **Hardware back button:** wire Android's back button (via `@capacitor/app`) so it navigates sensibly and never abruptly closes the app mid-round or re-reveals a role. From the first screen it may exit the app.
- **Status bar + theme:** match the dark theme (`#0f0f1a`) so the native status bar doesn't clash. Lock orientation to portrait.
- **Placeholder icon + splash:** generate Android densities from the existing placeholder icon (e.g. via `@capacitor/assets`). No design effort.
- **npm scripts** for the build→sync cycle so the workflow is one command, not a memorised incantation.
- **A `RUNBOOK.md`** in the app folder covering the manual Play Store steps and the ongoing update workflow.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain, simple, commented on new blocks; user-facing text spells it "imposter".

**Out of scope (do NOT do here):**
- iOS platform.
- Real (designed) app icon / splash artwork — placeholder only.
- Any game-logic, UI, or feature changes to the existing screens.
- Live/OTA updates (Capgo / Capacitor Live Updates) — deferred.
- Native plugins beyond what back-button + status-bar need (no haptics, push, etc.).
- Actually creating the Play account, signing keys, or submitting — those are Rehaan's manual steps, documented in the runbook, not performed here.
- Monetization, analytics, crash reporting.

## Where the build lives

Inside the existing app: `02-development/workflow/03-builds/imposter-game-app/`
(Capacitor config, the generated `android/` folder, and `RUNBOOK.md` all live alongside the current project so it stays self-contained.)

## Constraints worth highlighting

- **Web behaviour must not regress.** The Netlify/PWA build must work exactly as before; the SW guard must be Capacitor-only.
- **Offline-first.** The app must play fully offline inside the shell (it's a party game; Wi-Fi may be flaky). Note: fonts currently load from the Google Fonts CDN — flag whether that hurts offline first-run.
- Per technical-standards: no dependencies beyond what the wrap actually needs.
- **Verification:** write a smoke-test checklist, but **Rehaan runs it** — the builder does not launch the app or Android Studio to verify.

## Next step

This brief feeds [02-development/workflow/02-specs/android-play-store-port-spec.md](../02-specs/android-play-store-port-spec.md), the acceptance-criteria contract for the build.
