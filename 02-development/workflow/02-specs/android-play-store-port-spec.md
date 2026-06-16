# Spec — Android Play Store Port (Capacitor)

## Source brief

[02-development/workflow/01-brief/android-play-store-port-brief.md](../01-brief/android-play-store-port-brief.md)

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It states WHAT must be true once the port is built and the acceptance criteria to check against. Exact commands, file contents, and Capacitor versions are the builder's call within the constraints below.

## What must exist (deliverables)

All inside the existing app at `02-development/workflow/03-builds/imposter-game-app/`:

```
imposter-game-app/
├── capacitor.config.json (or .ts)   ← appId, appName, webDir = "dist"
├── android/                         ← generated native project (npx cap add android)
├── package.json                     ← Capacitor deps + cap:* scripts added
├── src/
│   ├── main.js                      ← service-worker registration guarded for Capacitor
│   └── lib/
│       └── native.js                ← NEW: native-shell wiring (back button, status bar); no-ops on web
├── resources/ (or equivalent)       ← placeholder icon/splash source for @capacitor/assets
└── RUNBOOK.md                       ← NEW: manual Play Store steps + update workflow
```

The existing game source (screens, game-state, word lists) is **not modified** except for the two integration points above (`main.js` SW guard, and calling the new `native.js` wiring).

## Acceptance criteria

A build is "done" when **every** item below is true.

### Capacitor integration
1. **Deps present.** `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` (and any plugin used for back-button/status-bar) appear in `package.json`. No unrelated dependencies added.
2. **Config correct.** Capacitor config sets `appId` = `com.rehaan.imposter`, `appName` = `Imposter but Better`, and `webDir` = `dist`. Neither value is a placeholder.
3. **Android project generated.** An `android/` native project exists (from `npx cap add android`). The iOS platform is **absent**.
4. **Sync works.** `npm run build` followed by the sync step (`npx cap sync` / `npx cap copy`) copies the latest `dist/` into the Android project with no errors.
5. **One-command workflow.** `package.json` has scripts that chain build + sync (e.g. `npm run android:sync`) so Rehaan doesn't memorise raw `cap` commands.

### Web must not regress
6. **PWA unchanged on web.** On the normal Vite/Netlify build, the service worker still registers and the app behaves exactly as before. The Capacitor guard only suppresses the SW when running inside the native shell.
7. **No web console errors** introduced by the new `native.js` wiring — it must detect "not native" and no-op cleanly in a browser.

### Native behaviour
8. **Launches to setup.** The app opens to the Setup screen, dark theme, no white flash that lingers (splash handles startup).
9. **Plays fully offline.** With the device in airplane mode, a full round works: setup → reveal → pass → discussion → results → play again. (If CDN fonts don't load offline, the system-sans fallback must still render cleanly — see open questions.)
10. **Back button is safe.** Android's hardware back button:
    - never abruptly closes the app while a round is in progress,
    - never causes a role to be re-revealed or leaked,
    - exits the app only from the first (Setup) screen,
    - behaves predictably elsewhere (documented in `native.js` comments).
11. **Status bar fits the theme.** The native status bar uses colours consistent with the dark theme (`#0f0f1a`) — no clashing light bar over dark UI.
12. **Portrait locked.** The app stays in portrait orientation.
13. **Icon + splash show.** A placeholder app icon and splash render at the required Android densities (generated, not hand-cropped). Quality bar is "clearly intentional placeholder," not "designed."

### Documentation
14. **RUNBOOK.md exists** and covers, in plain steps Rehaan can follow on Windows:
    - Installing Android Studio + the SDK (one-time).
    - Opening the project (`npx cap open android`) and running it on an emulator / physical device (USB debugging).
    - Creating the Google Play Developer account ($25 one-time).
    - Choosing **Play App Signing** (Google holds the key) and producing a signed release `.aab`.
    - The Play Console listing checklist: data-safety form (declare no data collected), privacy-policy URL, content rating, screenshots, free pricing.
    - The **update workflow**: edit code → bump `versionCode` → build → sync → signed `.aab` → upload → review. Written as a repeatable checklist.
15. **README points to RUNBOOK.** The app's `README.md` gains a short "Android / Play Store" line linking to `RUNBOOK.md`.

### Code quality
16. **Plain, simple, commented** per technical-standards. New blocks (SW guard, `native.js`) have brief explanatory comments. User-facing text keeps the "imposter" spelling.
17. **Codebase stays runnable as a web app.** `npm run dev` and `npm run build` work exactly as before.

## What is NOT acceptance criteria (deferred)
- iOS platform / App Store.
- Designed (non-placeholder) icon and splash — comes via 03-design.
- Live/OTA updates (Capgo).
- Self-hosting fonts for offline (flagged, not required — see open questions).
- Any game feature/logic/UI change.
- Actually submitting to the store (that's Rehaan, via the runbook).

## Verification (smoke test — Rehaan runs it)

Per technical-standards and the workflow norms, the builder writes this checklist but does **not** run it. Rehaan walks it:

**Web (no regression):**
1. `npm run dev` → app loads at setup, no console errors, plays a full round.
2. `npm run build` → succeeds; `dist/` produced.
3. Serve `dist/` in Chrome → service worker still registers, install icon still appears.

**Native (the new part):**
4. Run the build+sync script → completes without error.
5. `npx cap open android`, run on an emulator or phone → app launches to setup with the dark theme and placeholder icon/splash.
6. Put the device in airplane mode → play a full round end-to-end offline.
7. Press the hardware back button on each screen → confirm it never kills the app mid-round, never leaks a role, and exits only from Setup.
8. Confirm portrait lock (rotate device — UI stays portrait).
9. Open `RUNBOOK.md` → steps are clear and complete enough to actually reach a Play Store submission.

If any item fails, the build is not done. No "mostly works."

## Open questions for the builder
- **CDN fonts vs offline.** `index.html` loads Inter from Google Fonts. Inside the shell on first run while offline, that request fails and the app falls back to system sans-serif. Acceptable for this build (criterion 9 only requires it renders cleanly); note in the runbook whether self-hosting Inter is worth a later pass.
- **Config format.** `capacitor.config.json` vs `.ts` — builder's choice; JSON is simplest and matches the plain-JS project.
- **Splash plugin.** Whether to add `@capacitor/splash-screen` or rely on the generated static splash — builder decides; keep deps minimal.
