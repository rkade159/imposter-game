<script>
  // Settings screen: app-wide preferences that persist across rounds. Reached
  // from the Setup screen and rendered in place of the setup form, so it reads
  // as its own screen while keeping SetupScreen mounted (the in-progress form
  // state survives the round trip).
  //
  // Each setting is a row backed by the `settings` store, which auto-persists.
  // Adding a future option = one more <Toggle> (or other control) below.
  import { settings } from '../lib/settings.js';
  import { sessionSettings } from '../lib/session-settings.js';
  import { REVEAL_STYLES } from '../lib/reveal-styles.js';
  import { RESULTS_REVEALS } from '../lib/results-reveal-styles.js';
  import { TROLL_MODES } from '../lib/troll-mode.js';
  import Toggle from '../components/Toggle.svelte';
  import Select from '../components/Select.svelte';

  // Called when the user is done — the parent (SetupScreen) hides this screen.
  export let onClose;

  // The round's currently-configured imposter count, from the setup form. Used to
  // disable "Reveal fellow imposters" when there's only one imposter (or the field
  // is empty), since there's then no other imposter to reveal.
  export let impostorCount = null;
  $: fellowImpostersDisabled = !(impostorCount >= 2);
</script>

<section class="screen">
  <h2 class="title">Settings</h2>

  <div class="rows">
    <Toggle
      id="setting-grayscale"
      label="Grayscale mode"
      description="Removes all colour so no one can guess the imposter from the screen."
      bind:value={$settings.grayscale}
    />

    <Select
      id="setting-reveal-style"
      label="Reveal animation"
      description="How each player's role is revealed when the device is passed around."
      options={REVEAL_STYLES}
      bind:value={$settings.revealStyle}
    />

    <!-- The end-of-round reveal animation (results screen). Separate from the
         per-player "Reveal animation" above; defaults to the plain static text. -->
    <Select
      id="setting-results-reveal"
      label="Imposter reveal"
      description="How the imposter(s) are revealed at the end of the round."
      options={RESULTS_REVEALS}
      bind:value={$settings.resultsRevealStyle}
    />

    <!-- Only meaningful with 2+ imposters; disabled (with a note) otherwise. -->
    <Toggle
      id="setting-fellow-imposters"
      label="Reveal fellow imposters"
      description={fellowImpostersDisabled
        ? 'With 2+ imposters, each imposter also sees who the others are. (Needs 2+ imposters.)'
        : 'With 2+ imposters, each imposter also sees who the others are during the reveal.'}
      disabled={fellowImpostersDisabled}
      bind:value={$settings.showFellowImposters}
    />

    <!-- Imposter hints: on by default (current behaviour). Off withholds the
         imposter's hint to make the round harder; gated at reveal time. -->
    <Toggle
      id="setting-imposter-hints"
      label="Imposter hints"
      description="When on, the imposter is shown a vague hint instead of the word. Turn off to make rounds harder for the imposter."
      bind:value={$settings.enableImpostorHint}
    />

    <Toggle
      id="setting-anti-yusuf"
      label="Anti-Yusuf Feature"
      description="No explanation needed here..."
      bind:value={$sessionSettings.antiYusuf}
    />

    <!-- Troll Mode: an enum like the reveal style. Off by default; the surprise
         modes persist and fire on a random later round (Guaranteed turns itself
         off after one round). -->
    <Select
      id="setting-troll-mode"
      label="Troll Mode"
      description="Occasionally makes EVERYONE the imposter for one chaotic round."
      options={TROLL_MODES}
      bind:value={$settings.trollMode}
    />
  </div>

  <button type="button" class="back-btn" on:click={onClose}>
    ← Back to setup
  </button>
</section>

<style>
  /* Matches the setup/reveal card look — dark surface, rounded, stacked. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
  }

  /* Vertical list of setting rows, separated so future toggles read as a set. */
  .rows {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Secondary action — outlined rather than filled, since it's a "go back". */
  .back-btn {
    align-self: flex-start;
    min-height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
