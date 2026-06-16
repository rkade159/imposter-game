// Native-shell wiring for the Capacitor Android build.
//
// IMPORTANT: everything here is a NO-OP on the web (plain browser / PWA). It
// only does anything when the app is actually running inside the native
// Capacitor shell, so the web/Netlify build is completely unchanged.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { get } from 'svelte/store';
import { gameState, playAgain } from './game-state.js';

// Call once at startup. Safe to call on web — it returns immediately there.
export function initNative() {
  if (!Capacitor.isNativePlatform()) return;

  // Match the native status bar to the app's dark theme (#0f0f1a) so it doesn't
  // clash with the UI. Style.Dark means "light icons/text for a dark bar".
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#0f0f1a' }).catch(() => {});

  // Hardware back button.
  //
  // This is a hidden-role game, so secrecy beats the usual Android "back = go to
  // the previous screen" convention: during the secret phase (reveal / pass /
  // discussion) the back button is intentionally ignored, so a player can never
  // step backwards into someone else's role. Back only acts where nothing secret
  // is on screen:
  //   - setup   → nothing behind it, so let back leave the app
  //   - results → round is over and already revealed, so back starts a new round
  //   - reveal / pass / discussion → ignored (protects hidden roles)
  App.addListener('backButton', () => {
    const { screen } = get(gameState);
    if (screen === 'setup') {
      App.exitApp();
    } else if (screen === 'results') {
      playAgain();
    }
    // any other screen: do nothing on purpose
  });
}
