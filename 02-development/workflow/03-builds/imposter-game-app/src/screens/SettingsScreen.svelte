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
  import Toggle from '../components/Toggle.svelte';
  import Select from '../components/Select.svelte';

  // Called when the user is done — the parent (SetupScreen) hides this screen.
  export let onClose;
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

    <Toggle
      id="setting-anti-yusuf"
      label="Anti-Yusuf Feature"
      description="No explanation needed here..."
      bind:value={$sessionSettings.antiYusuf}
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
