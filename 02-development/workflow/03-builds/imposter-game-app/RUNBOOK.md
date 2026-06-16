# Android / Play Store Runbook

How to take this app from "code on your machine" to "live on the Google Play Store," and how to push updates afterwards. The Capacitor wiring is already done (see the "What's already set up" section at the bottom). Everything below is the part **you** do — it can't be automated from inside the repo.

> App identity (already locked in `capacitor.config.json`):
> - **App ID:** `com.rehaan.imposter` (permanent — never changes once published)
> - **App name:** Imposter but Better

---

## One-time setup

### 1. Install Android Studio
- Download from https://developer.android.com/studio (free). Run the installer with default options — it bundles the JDK and Android SDK you need.
- First launch: let it finish downloading the SDK components it prompts for.
- (Optional) Create an emulator: **Device Manager → Create Device** → pick a recent Pixel → download a system image. A physical phone works too (see below).

### 2. Google Play Developer account
- Go to https://play.google.com/console and register. **One-time $25 fee.**
- Use your normal Google account. Complete the identity verification it asks for (can take a day or two to approve — start this early).

---

## Running the app on a device (development)

From the app folder (`imposter-game-app/`):

```bash
npm install            # first time only
npm run android:open   # builds the web app, syncs it into android/, opens Android Studio
```

Then in Android Studio press the green **Run** ▶ button.

- **Emulator:** pick the virtual device you created and Run.
- **Physical phone:** enable Developer Options (tap *Build number* 7× in Settings → About), turn on **USB debugging**, plug in over USB, accept the prompt, select it as the Run target.

To smoke-test offline play: once the app is installed, put the phone in **airplane mode** and play a full round.

---

## Publishing to the Play Store (first release)

### 3. Set the version
In `android/app/build.gradle`, find `defaultConfig` and set:
- `versionCode 1` — integer; **must increase by 1 every release**.
- `versionName "1.0.0"` — the human-facing label.

### 4. Choose Play App Signing (do this — don't manage your own key)
When you create the app in Play Console, opt into **Play App Signing**. Google holds the signing key. This matters: if you manage the key yourself and lose it, you can **never update the app again**. Let Google hold it. You'll still create an *upload* key (Android Studio walks you through it) — losing that one is recoverable.

### 5. Build the signed release bundle (`.aab`)
In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
- Create a new upload keystore when prompted (save the file + passwords somewhere safe, e.g. a password manager).
- Build the **release** variant. The output is an `.aab` file (Play requires `.aab`, not `.apk`).

### 6. Create the app in Play Console and fill the listing
In https://play.google.com/console → **Create app**, then work through the checklist it shows:

- **App details:** name (`Imposter but Better`), short description, full description.
- **Graphics:** app icon (512×512), feature graphic (1024×500), and at least 2 phone screenshots. *(Placeholder art is fine to launch; swap in designed art later — see the design workspace.)*
- **Privacy policy URL:** required even though the app collects nothing. Host a simple one-page policy on the existing Netlify site (e.g. `imposter-but-better.netlify.app/privacy`) and paste the URL here.
- **Data safety form:** declare **no data collected, no data shared** (true — the app is fully offline).
- **Content rating:** complete the IARC questionnaire. It'll rate as suitable for everyone.
- **Target audience / ads:** target audience as appropriate; declare **no ads**.
- **Pricing:** **Free**. Select the countries to distribute in.

### 7. Upload and publish
- Go to a release track. Recommended first step: **Testing → Internal testing** — upload the `.aab`, add your own email as a tester, and confirm the store build installs and runs on your phone.
- When happy, **Production → Create new release**, upload the `.aab`, and roll out.
- Google reviews it (usually a few hours to a couple of days). Once approved, it's live.

---

## Updating the app (the repeatable loop)

Every time you want to ship a change:

1. Make your changes in the Svelte code as usual.
2. Bump **`versionCode`** (and `versionName` if you like) in `android/app/build.gradle`.
3. From `imposter-game-app/`, run:
   ```bash
   npm run android:sync   # builds the web app and copies it into android/
   ```
4. In Android Studio: **Build → Generate Signed Bundle** → release → produce the new `.aab` (reuse the same upload keystore).
5. In Play Console: **Production → Create new release** → upload the new `.aab` → roll out.
6. Wait for review. Users get the update automatically.

That's the whole loop — roughly 15 minutes of your time plus Google's review wait.

> **Tip:** Forgetting to bump `versionCode` is the #1 upload error — Play rejects a bundle whose `versionCode` isn't higher than the last one.

---

## What's already set up in the repo (so you don't have to)

The build pipeline did all of this — listed here so you know what's wired:

- **Capacitor installed and configured** — `capacitor.config.json` has the app ID, name, and `webDir: dist`.
- **`android/` native project generated** (`npx cap add android`). iOS is intentionally **not** added (no Mac); it can be added later with one command on this same codebase.
- **Service-worker guard** — the PWA service worker still runs on the web/Netlify build, but is skipped inside the native shell (it's redundant there and can interfere). See [src/main.js](src/main.js).
- **Hardware back button** — wired in [src/lib/native.js](src/lib/native.js): ignored during the secret reveal/pass/discussion phase (so a player can't step back into someone's role), exits the app from Setup, and returns to Setup from Results.
- **Status bar** styled to the dark theme; **orientation locked to portrait** (`android/app/src/main/AndroidManifest.xml`).
- **Placeholder icon + splash** generated for every density via `npm run android:assets` (source images in `resources/`).

### Regenerating placeholder icons/splash
If you tweak the placeholder source, or later drop in designed artwork at `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732):
```bash
npm run android:assets   # regenerates all Android densities
npm run android:sync
```

---

## Known notes / future passes
- **Fonts offline:** `index.html` loads Inter from Google Fonts. On the very first launch while offline, that request fails and the app falls back to the system sans-serif (still renders cleanly). If you want guaranteed-consistent fonts offline, self-host Inter in a later pass — not required to ship.
- **Real artwork:** the icon and splash are placeholders. Route proper artwork through the `03-design` workspace before you care about store polish.
- **iOS:** deferred (needs a Mac). The codebase stays compatible — `npx cap add ios` whenever that changes.
- **Live/OTA updates** (Capgo / Capacitor Live Updates) to push web-only changes without a store review are possible later, once this standard loop feels comfortable.
